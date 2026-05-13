"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CreatePlantingInput = {
  plantId: string;
  spaceId: string | null;
  plantedDate: string; // YYYY-MM-DD
  variety: string | null;
};

export type CreatePlantingResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createPlanting(
  input: CreatePlantingInput,
): Promise<CreatePlantingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  if (!input.plantId) {
    return { ok: false, error: "Pick a plant from the catalog." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.plantedDate)) {
    return { ok: false, error: "Planted date must be a valid YYYY-MM-DD." };
  }

  const { data, error } = await supabase
    .from("plantings")
    .insert({
      user_id: user.id,
      plant_id: input.plantId,
      space_id: input.spaceId,
      planted_date: input.plantedDate,
      variety: input.variety?.trim() || null,
      status: "active",
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/home");
  return { ok: true, id: data.id };
}
