import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Coach "friction surface": when a previous response set
// requires_confirmation=true and provided an action_prompt, the user
// can tap "Yes, set it up" — that lands here.
//
// For v1 there are no real side-effecting actions wired up yet (no
// reminders, no scheduler). The endpoint:
//   1. validates the session belongs to the user,
//   2. records the confirmation by stamping action_confirmed_at into
//      that session's metadata jsonb,
//   3. returns an acknowledgment the UI can render.
//
// When concrete actions land (e.g. "create a watering reminder"),
// they'd dispatch from here by inspecting `action_type` / `params`.

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: {
    session_id?: unknown;
    action_type?: unknown;
    params?: unknown;
  };
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
  if (!sessionId) {
    return NextResponse.json(
      { error: "bad_request", message: "Provide 'session_id'." },
      { status: 400 },
    );
  }
  const actionType =
    typeof body.action_type === "string" && body.action_type.trim()
      ? body.action_type.trim()
      : "unspecified";
  const params =
    body.params && typeof body.params === "object" ? body.params : {};

  const { data: existing, error: fetchError } = await supabase
    .from("coach_sessions")
    .select("id, metadata")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (fetchError || !existing) {
    return NextResponse.json(
      {
        error: "not_found",
        message: "Coach session not found for this user.",
      },
      { status: 404 },
    );
  }

  const prevMetadata =
    existing.metadata && typeof existing.metadata === "object"
      ? (existing.metadata as Record<string, unknown>)
      : {};
  const nextMetadata = {
    ...prevMetadata,
    action_confirmed_at: new Date().toISOString(),
    action_type: actionType,
    action_params: params,
  };

  const { error: updateError } = await supabase
    .from("coach_sessions")
    .update({ metadata: nextMetadata as unknown as never })
    .eq("id", sessionId)
    .eq("user_id", user.id);
  if (updateError) {
    return NextResponse.json(
      { error: "server_error", message: updateError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    session_id: sessionId,
    message:
      "Confirmed. (Action execution is a placeholder in this build — the coach will follow up with what was set up.)",
  });
}
