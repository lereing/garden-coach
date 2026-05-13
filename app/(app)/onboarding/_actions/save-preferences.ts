"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ExperienceLevel } from "@/lib/types/database";

export type PreferencesDraft = {
  lovesEating: string[];
  dislikes: string[];
  alreadyHave: string;
  experienceLevel: ExperienceLevel | null;
  goals: string[];
};

export type SavePreferencesResult =
  | { ok: true }
  | { ok: false; error: string };

export async function savePreferences(
  input: PreferencesDraft,
): Promise<SavePreferencesResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const trimmedAlreadyHave = input.alreadyHave.trim();

  const { error: prefsError } = await supabase
    .from("preferences")
    .upsert(
      {
        user_id: user.id,
        loves_eating: input.lovesEating.length ? input.lovesEating : null,
        dislikes: input.dislikes.length ? input.dislikes : null,
        already_have: trimmedAlreadyHave ? [trimmedAlreadyHave] : null,
        goals: input.goals.length ? input.goals : null,
        experience_level: input.experienceLevel,
      },
      { onConflict: "user_id" },
    );

  if (prefsError) {
    return { ok: false, error: "Couldn't save your preferences. Try again." };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", user.id);

  if (profileError) {
    return {
      ok: false,
      error:
        "Saved your preferences, but couldn't finalize. Reload and try once more.",
    };
  }

  revalidatePath("/onboarding");
  revalidatePath("/home");
  return { ok: true };
}
