import Anthropic from "@anthropic-ai/sdk";
import { NextResponse, type NextRequest } from "next/server";
import { anthropic, COACH_MODEL } from "@/lib/coach/client";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query) {
    return NextResponse.json(
      { error: "Missing 'q' query parameter." },
      { status: 400 },
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured." },
      { status: 500 },
    );
  }

  try {
    const message = await anthropic.messages.create({
      model: COACH_MODEL,
      max_tokens: 256,
      messages: [{ role: "user", content: query }],
    });

    const reply = message.content
      .filter(
        (block): block is Anthropic.TextBlock => block.type === "text",
      )
      .map((block) => block.text)
      .join("");

    return NextResponse.json({
      model: message.model,
      reply,
      usage: message.usage,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Anthropic request failed.", detail },
      { status: 502 },
    );
  }
}
