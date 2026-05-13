import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/types/database";

// Public routes that don't require an authenticated session.
const PUBLIC_PATHS = new Set([
  "/",
  "/sign-in",
  "/auth/callback",
]);

// Public path prefixes. Anything under these is open.
const PUBLIC_PREFIXES = ["/api", "/design-system"];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
}

// Paths that an authenticated-but-not-onboarded user can still reach.
const ONBOARDING_ALLOWED = new Set(["/onboarding"]);

function isOnboardingAllowed(pathname: string): boolean {
  if (ONBOARDING_ALLOWED.has(pathname)) return true;
  return pathname.startsWith("/onboarding/");
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Foundation state: if Supabase isn't configured yet, let everything
  // through. Protect routes once env vars are wired up.
  if (!url || !anonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Per Supabase SSR docs: don't run anything between createServerClient
  // and getUser that could mutate the request — keeps cookies coherent.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!user && !isPublic(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/sign-in";
    redirectUrl.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(redirectUrl);
  }

  // Authenticated but onboarding not finished — push them into the
  // flow if they try to wander elsewhere in the app.
  if (
    user &&
    !isPublic(pathname) &&
    !isOnboardingAllowed(pathname)
  ) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed_at")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.onboarding_completed_at) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/onboarding";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}
