import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CoachFeedback } from "@/lib/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED: CoachFeedback[] = ["helpful", "wrong", "partial"];

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { session_id?: unknown; feedback?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "bad_request", message: "Body must be JSON." },
      { status: 400 },
    );
  }

  const sessionId =
    typeof body.session_id === "string" ? body.session_id.trim() : "";
  const feedback = body.feedback as CoachFeedback | undefined;

  if (!sessionId) {
    return NextResponse.json(
      { error: "bad_request", message: "Provide 'session_id'." },
      { status: 400 },
    );
  }
  if (!feedback || !ALLOWED.includes(feedback)) {
    return NextResponse.json(
      {
        error: "bad_request",
        message: `'feedback' must be one of: ${ALLOWED.join(", ")}.`,
      },
      { status: 400 },
    );
  }

  // RLS already scopes to the user's own sessions. The explicit user_id
  // filter is defense-in-depth and surfaces "not found" cleanly.
  const { data, error } = await supabase
    .from("coach_sessions")
    .update({ user_feedback: feedback })
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      {
        error: "bad_request",
        message: "Coach session not found for this user.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, session_id: data.id });
}
