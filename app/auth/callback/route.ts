import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next");
  // Only allow same-origin (relative) redirect targets.
  const next =
    requestedNext && requestedNext.startsWith("/") ? requestedNext : "/home";

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=missing_code`);
  }

  const supabase = await createClient();

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return NextResponse.redirect(`${origin}/sign-in?error=auth_failed`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/sign-in?error=no_user`);
  }

  // Profile is normally created by the handle_new_user() trigger.
  // Verify it exists; insert defensively if the trigger ever fails.
  let { data: profile } = await supabase
    .from("profiles")
    .select("id, address, hardiness_zone")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    const { data: inserted, error: insertError } = await supabase
      .from("profiles")
      .insert({ id: user.id })
      .select("id, address, hardiness_zone")
      .single();
    if (insertError) {
      return NextResponse.redirect(
        `${origin}/sign-in?error=profile_create_failed`,
      );
    }
    profile = inserted;
  }

  const isComplete = !!(profile.address && profile.hardiness_zone);
  return NextResponse.redirect(`${origin}${isComplete ? next : "/onboarding"}`);
}
