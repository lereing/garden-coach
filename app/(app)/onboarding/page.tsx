import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getPreferences,
  getProfile,
  getUserSpaces,
} from "@/lib/supabase/queries";
import { OnboardingFlow } from "./_components/onboarding-flow";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const [profile, spaces, preferences] = await Promise.all([
    getProfile(supabase, user.id),
    getUserSpaces(supabase, user.id),
    getPreferences(supabase, user.id),
  ]);

  if (!profile) {
    // Should be impossible (handle_new_user trigger), but bail safely.
    redirect("/sign-in?error=profile_missing");
  }

  // If a returning user already finished onboarding, send them on.
  if (profile.onboarding_completed_at) {
    redirect("/home");
  }

  // Resume at the first incomplete step.
  const locationDone = !!(profile.hardiness_zone && profile.last_frost_date);
  const spacesDone = spaces.length > 0;
  const initialStep: 1 | 2 | 3 = !locationDone
    ? 1
    : !spacesDone
      ? 2
      : 3;

  return (
    <OnboardingFlow
      initialStep={initialStep}
      profile={profile}
      spaces={spaces}
      preferences={preferences}
    />
  );
}
