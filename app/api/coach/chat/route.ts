import type Anthropic from "@anthropic-ai/sdk";
import { NextResponse, type NextRequest } from "next/server";
import { anthropic, COACH_MODEL } from "@/lib/coach/client";
import {
  buildSystemPrompt,
  splitConversation,
} from "@/lib/coach/prompts";
import { executeCoachTool, TOOL_SPECS } from "@/lib/coach/tools";
import {
  DEFAULT_METADATA,
  extractMetadataBlock,
  findFenceStart,
  isToolName,
  safeEmitLength,
  type ChatErrorBody,
  type ChatMessageInput,
  type CoachMetadata,
  type StreamEvent,
  type ToolName,
} from "@/lib/coach/types";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT_PER_HOUR = 30;
const MAX_ITERATIONS = 8;
const MAX_OUTPUT_TOKENS = 1200;

function jsonError(body: ChatErrorBody, status: number) {
  return NextResponse.json(body, { status });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return jsonError(
      { error: "unauthorized", message: "Sign in to use the coach." },
      401,
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return jsonError(
      {
        error: "server_error",
        message: "Coach is not configured (missing ANTHROPIC_API_KEY).",
      },
      500,
    );
  }

  let body: { message?: unknown; history?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError(
      { error: "bad_request", message: "Body must be JSON." },
      400,
    );
  }

  const message =
    typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return jsonError(
      {
        error: "bad_request",
        message: "Send a non-empty 'message' string.",
      },
      400,
    );
  }

  const history = parseHistory(body.history);

  // Rate limit: 30 coach_sessions inserts per user per hour.
  {
    const sinceIso = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("coach_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", sinceIso);
    if ((count ?? 0) >= RATE_LIMIT_PER_HOUR) {
      return jsonError(
        {
          error: "rate_limit",
          message: `You've hit ${RATE_LIMIT_PER_HOUR} coach requests in the past hour. Try again later.`,
          retry_after_minutes: 60,
        },
        429,
      );
    }
  }

  const { earlier, recent } = splitConversation(history);
  const system = buildSystemPrompt({
    today: new Date(),
    earlierTurns: earlier,
  });

  const conversation: Anthropic.MessageParam[] = recent.map((turn) => ({
    role: turn.role,
    content: turn.content,
  }));
  conversation.push({ role: "user", content: message });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: StreamEvent) {
        const line = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(line));
      }

      const toolsUsed: ToolName[] = [];

      // Text-strip state: we buffer all model text; once a fence
      // appears we stop emitting deltas (the JSON metadata block
      // shouldn't reach the user). We also hold back a 2-char tail
      // so we never emit a partial fence marker.
      let textBuffer = "";
      let emittedUpTo = 0;
      let fenceFound = false;
      let displayText = "";
      let metadata: CoachMetadata = DEFAULT_METADATA;

      function flushText(): void {
        if (fenceFound) return;
        const fenceIdx = findFenceStart(textBuffer);
        if (fenceIdx !== -1) {
          const newText = textBuffer
            .slice(emittedUpTo, fenceIdx)
            .replace(/\s+$/, "");
          if (newText) {
            displayText += newText;
            send({ type: "text", delta: newText });
          }
          emittedUpTo = textBuffer.length;
          fenceFound = true;
          return;
        }
        const safeEnd = Math.max(emittedUpTo, safeEmitLength(textBuffer));
        if (safeEnd > emittedUpTo) {
          const newText = textBuffer.slice(emittedUpTo, safeEnd);
          if (newText) {
            displayText += newText;
            send({ type: "text", delta: newText });
          }
          emittedUpTo = safeEnd;
        }
      }

      function flushFinal(): void {
        if (!fenceFound && emittedUpTo < textBuffer.length) {
          // No fence at all — emit remaining tail as-is.
          const tail = textBuffer.slice(emittedUpTo);
          if (tail) {
            displayText += tail;
            send({ type: "text", delta: tail });
          }
          emittedUpTo = textBuffer.length;
        }
      }

      try {
        for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
          // Reset per-iteration text-strip cursor. Each model turn is
          // its own potential metadata block; we only care about the
          // final one, but the in-between turns shouldn't dump JSON
          // either (they don't — the model only emits text on the
          // last turn). Reset to be safe.
          textBuffer = "";
          emittedUpTo = 0;
          fenceFound = false;

          const streamCall = anthropic.messages.stream({
            model: COACH_MODEL,
            max_tokens: MAX_OUTPUT_TOKENS,
            system,
            messages: conversation,
            tools: TOOL_SPECS,
          });

          const announcedTools = new Set<string>();
          for await (const evt of streamCall) {
            if (
              evt.type === "content_block_start" &&
              evt.content_block.type === "tool_use"
            ) {
              const name = evt.content_block.name;
              if (isToolName(name) && !announcedTools.has(evt.content_block.id)) {
                announcedTools.add(evt.content_block.id);
                send({ type: "tool_start", name });
              }
            } else if (
              evt.type === "content_block_delta" &&
              evt.delta.type === "text_delta"
            ) {
              textBuffer += evt.delta.text;
              flushText();
            }
          }

          const finalMessage = await streamCall.finalMessage();
          conversation.push({
            role: "assistant",
            content: finalMessage.content,
          });

          if (finalMessage.stop_reason !== "tool_use") {
            // Final turn: flush any remaining text + extract metadata.
            flushFinal();
            metadata = extractMetadataBlock(textBuffer);
            send({ type: "metadata", metadata });
            break;
          }

          // Tool turn: execute every tool_use block, append results.
          const toolUseBlocks = finalMessage.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
          );
          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const block of toolUseBlocks) {
            if (isToolName(block.name)) toolsUsed.push(block.name);
            const result = await executeCoachTool(
              block.name,
              block.input,
              supabase,
              user.id,
            );
            send({
              type: "tool_complete",
              name: (isToolName(block.name)
                ? block.name
                : "search_plant_catalog") as ToolName,
              ok: result.ok,
            });
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: JSON.stringify(
                result.ok ? result.data : { error: result.error },
              ),
              is_error: !result.ok,
            });
          }
          conversation.push({ role: "user", content: toolResults });
        }

        const { data: session } = await supabase
          .from("coach_sessions")
          .insert({
            user_id: user.id,
            query: message,
            response: displayText || "(no response)",
            tools_used: toolsUsed.length > 0 ? toolsUsed : null,
            metadata: metadata as unknown as never,
          })
          .select("id")
          .single();

        send({
          type: "done",
          session_id: session?.id ?? "",
          tools_used: toolsUsed,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Coach call failed.";
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}

function parseHistory(raw: unknown): ChatMessageInput[] {
  if (!Array.isArray(raw)) return [];
  const out: ChatMessageInput[] = [];
  for (const item of raw) {
    if (
      item &&
      typeof item === "object" &&
      "role" in item &&
      "content" in item &&
      (item.role === "user" || item.role === "assistant") &&
      typeof item.content === "string"
    ) {
      out.push({ role: item.role, content: item.content });
    }
  }
  return out;
}
