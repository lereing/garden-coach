import type Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------
// Conversation shape — what the client sends and what we feed to
// Claude. We accept "simple" string-content messages from the wire and
// upcast to Anthropic's structured form internally.
// ---------------------------------------------------------------------

export type ChatMessageInput = {
  role: "user" | "assistant";
  content: string;
};

export type AnthropicMessage = Anthropic.MessageParam;

// ---------------------------------------------------------------------
// Tool registry
// ---------------------------------------------------------------------

export const TOOL_NAMES = [
  "get_user_context",
  "get_user_spaces",
  "get_active_plantings",
  "get_planting_history",
  "get_recent_logs",
  "get_weather",
  "search_plant_catalog",
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];

export function isToolName(value: string): value is ToolName {
  return (TOOL_NAMES as readonly string[]).includes(value);
}

// Friendly labels surfaced to the UI while a tool runs. Keep these
// short — they're shown beneath the user's message during streaming.
export const TOOL_STATUS_LABELS: Record<ToolName, string> = {
  get_user_context: "Checking your garden…",
  get_user_spaces: "Looking at your spaces…",
  get_active_plantings: "Reviewing your active plantings…",
  get_planting_history: "Checking your planting history…",
  get_recent_logs: "Reading your recent logs…",
  get_weather: "Looking at the weather…",
  search_plant_catalog: "Searching the plant catalog…",
};

// ---------------------------------------------------------------------
// Trust-surface metadata emitted by the model at end of every response.
// Parsed server-side from the fenced JSON block; the block is stripped
// from the streamed text before it reaches the client.
// ---------------------------------------------------------------------

export type Confidence = "high" | "medium" | "lower";

export type CoachMetadata = {
  confidence: Confidence | null;
  citations: string[];
  requires_confirmation: boolean;
  action_prompt: string | null;
  is_restatement: boolean;
  follow_ups: string[];
};

export const DEFAULT_METADATA: CoachMetadata = {
  confidence: null,
  citations: [],
  requires_confirmation: false,
  action_prompt: null,
  is_restatement: false,
  follow_ups: [],
};

export function coerceMetadata(raw: unknown): CoachMetadata {
  if (!raw || typeof raw !== "object") return DEFAULT_METADATA;
  const r = raw as Record<string, unknown>;
  const confidence =
    r.confidence === "high" || r.confidence === "medium" || r.confidence === "lower"
      ? r.confidence
      : null;
  const citations = Array.isArray(r.citations)
    ? r.citations
        .filter((c): c is string => typeof c === "string" && c.trim().length > 0)
        .map((c) => c.trim().slice(0, 80))
        .slice(0, 6)
    : [];
  const followUps = Array.isArray(r.follow_ups)
    ? r.follow_ups
        .filter((c): c is string => typeof c === "string" && c.trim().length > 0)
        .map((c) => c.trim().slice(0, 80))
        .slice(0, 3)
    : [];
  return {
    confidence,
    citations,
    requires_confirmation: !!r.requires_confirmation,
    action_prompt:
      typeof r.action_prompt === "string" && r.action_prompt.trim()
        ? r.action_prompt.trim()
        : null,
    is_restatement: !!r.is_restatement,
    follow_ups: followUps,
  };
}

// ---------------------------------------------------------------------
// SSE event types streamed back to the client.
//
//   event: tool_start    → coach is invoking a tool
//   event: tool_complete → tool finished (ok / error)
//   event: text          → text delta from the model (already stripped of metadata fence)
//   event: metadata      → final parsed trust-surface payload
//   event: done          → final stop, includes session id + tools
//   event: error         → fatal error
// ---------------------------------------------------------------------

export type StreamEvent =
  | { type: "tool_start"; name: ToolName }
  | { type: "tool_complete"; name: ToolName; ok: boolean }
  | { type: "text"; delta: string }
  | { type: "metadata"; metadata: CoachMetadata }
  | { type: "done"; session_id: string; tools_used: ToolName[] }
  | { type: "error"; message: string };

// ---------------------------------------------------------------------
// Errors the chat endpoint can return as HTTP responses (non-stream).
// ---------------------------------------------------------------------

export type ChatErrorCode =
  | "unauthorized"
  | "bad_request"
  | "rate_limit"
  | "anthropic_unavailable"
  | "profile_missing"
  | "server_error";

export type ChatErrorBody = {
  error: ChatErrorCode;
  message: string;
  /** Present when error === "rate_limit". Minutes until the next slot opens. */
  retry_after_minutes?: number;
};

// ---------------------------------------------------------------------
// Helpers — server-side parsing of the metadata block from the model's
// raw output, plus a "safe-to-emit" cursor that holds back the tail
// while we wait to see if the model is starting a code fence.
// ---------------------------------------------------------------------

const FENCE = "```";

export function findFenceStart(buffer: string): number {
  return buffer.indexOf(FENCE);
}

/** Largest prefix of `buffer` we can safely forward without risking
 *  emitting a partial fence marker. Hold back up to (FENCE.length - 1)
 *  chars from the tail. */
export function safeEmitLength(buffer: string): number {
  return Math.max(0, buffer.length - (FENCE.length - 1));
}

export function extractMetadataBlock(buffer: string): CoachMetadata {
  const fenceStart = buffer.indexOf(FENCE);
  if (fenceStart === -1) return DEFAULT_METADATA;
  // Skip the language hint line (`json`) if present.
  const afterFence = buffer.indexOf("\n", fenceStart);
  if (afterFence === -1) return DEFAULT_METADATA;
  const closing = buffer.indexOf(FENCE, afterFence);
  if (closing === -1) return DEFAULT_METADATA;
  const jsonText = buffer.slice(afterFence + 1, closing).trim();
  if (!jsonText) return DEFAULT_METADATA;
  try {
    return coerceMetadata(JSON.parse(jsonText));
  } catch {
    // Best-effort fallback: try grabbing the first {...} run.
    const open = jsonText.indexOf("{");
    const close = jsonText.lastIndexOf("}");
    if (open !== -1 && close > open) {
      try {
        return coerceMetadata(JSON.parse(jsonText.slice(open, close + 1)));
      } catch {
        return DEFAULT_METADATA;
      }
    }
    return DEFAULT_METADATA;
  }
}
