"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { LogType, PlantingStatus } from "@/lib/types/database";

export type ActionResult<T = void> =
  | (T extends void ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string };

async function getAuthedSupabase() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { supabase, userId: user.id };
}

async function touchPlanting(
  supabase: Awaited<ReturnType<typeof createClient>>,
  plantingId: string,
) {
  await supabase
    .from("plantings")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("id", plantingId);
}

export async function logWatering(
  plantingId: string,
): Promise<ActionResult<{ log_id: string }>> {
  const ctx = await getAuthedSupabase();
  if (!ctx) return { ok: false, error: "Not signed in." };
  const { supabase, userId } = ctx;

  const { data, error } = await supabase
    .from("logs")
    .insert({
      user_id: userId,
      planting_id: plantingId,
      type: "water" satisfies LogType,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  await touchPlanting(supabase, plantingId);
  revalidatePath("/home");
  return { ok: true, data: { log_id: data.id } };
}

export async function logHarvest(input: {
  plantingId: string;
  amountOz: number | null;
  notes: string | null;
  finished: boolean;
}): Promise<ActionResult<{ log_id: string }>> {
  const ctx = await getAuthedSupabase();
  if (!ctx) return { ok: false, error: "Not signed in." };
  const { supabase, userId } = ctx;

  const { data, error } = await supabase
    .from("logs")
    .insert({
      user_id: userId,
      planting_id: input.plantingId,
      type: "harvest" satisfies LogType,
      amount_oz: input.amountOz,
      notes: input.notes,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  if (input.finished) {
    await supabase
      .from("plantings")
      .update({
        status: "harvested" satisfies PlantingStatus,
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", input.plantingId);
  } else {
    await touchPlanting(supabase, input.plantingId);
  }

  revalidatePath("/home");
  return { ok: true, data: { log_id: data.id } };
}

const ISSUE_TYPES = ["observation", "pest", "weather_event"] as const;
export type IssueType = (typeof ISSUE_TYPES)[number];

export async function logObservation(input: {
  plantingId: string;
  type: IssueType;
  notes: string;
}): Promise<ActionResult<{ log_id: string }>> {
  const ctx = await getAuthedSupabase();
  if (!ctx) return { ok: false, error: "Not signed in." };
  const { supabase, userId } = ctx;

  const notes = input.notes.trim();
  if (!notes) return { ok: false, error: "Add a short note before saving." };

  const { data, error } = await supabase
    .from("logs")
    .insert({
      user_id: userId,
      planting_id: input.plantingId,
      type: input.type,
      notes,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  await touchPlanting(supabase, input.plantingId);
  revalidatePath("/home");
  return { ok: true, data: { log_id: data.id } };
}

export async function undoLog(logId: string): Promise<ActionResult> {
  const ctx = await getAuthedSupabase();
  if (!ctx) return { ok: false, error: "Not signed in." };
  const { supabase, userId } = ctx;

  // RLS already restricts to the user's own rows; the user_id filter
  // here is defense in depth.
  const { error } = await supabase
    .from("logs")
    .delete()
    .eq("id", logId)
    .eq("user_id", userId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/home");
  return { ok: true };
}
