"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SpaceType } from "@/lib/types/database";

export type SpaceDraft = {
  name: string;
  type: SpaceType;
  widthInches: number;
  lengthInches: number;
  sunlightHours: number | null;
};

export type SaveSpacesResult =
  | { ok: true }
  | { ok: false; error: string };

export async function saveSpaces(input: {
  spaces: SpaceDraft[];
}): Promise<SaveSpacesResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  if (input.spaces.length === 0) {
    return { ok: false, error: "Add at least one growing space to continue." };
  }

  for (const s of input.spaces) {
    if (!s.name.trim()) {
      return { ok: false, error: "Each space needs a name." };
    }
    if (!(s.widthInches > 0) || !(s.lengthInches > 0)) {
      return { ok: false, error: "Each space needs a width and length." };
    }
  }

  // Replace any existing spaces — onboarding is the only path to this
  // action for now, and we want a clean slate if the user re-edits.
  // Once plantings exist this will need a merge strategy.
  await supabase.from("spaces").delete().eq("user_id", user.id);

  const { error } = await supabase.from("spaces").insert(
    input.spaces.map((s) => ({
      user_id: user.id,
      name: s.name.trim(),
      type: s.type,
      width_inches: s.widthInches,
      length_inches: s.lengthInches,
      sunlight_hours: s.sunlightHours,
    })),
  );

  if (error) {
    return { ok: false, error: "Couldn't save your spaces. Try again." };
  }

  revalidatePath("/onboarding");
  return { ok: true };
}
