import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Planting,
  PlantingInsert,
  PlantingUpdate,
  PlantingWithPlant,
  PlantingWithPlantAndSpace,
} from "@/lib/types/database";

type Client = SupabaseClient<Database>;

const SELECT_WITH_PLANT = "*, plant:plants(*)" as const;
const SELECT_FULL = "*, plant:plants(*), space:spaces(*)" as const;

export async function getActivePlantings(
  supabase: Client,
  userId: string,
): Promise<PlantingWithPlant[]> {
  const { data, error } = await supabase
    .from("plantings")
    .select(SELECT_WITH_PLANT)
    .eq("user_id", userId)
    .eq("status", "active")
    .order("planted_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as PlantingWithPlant[];
}

export async function getPlanting(
  supabase: Client,
  plantingId: string,
): Promise<PlantingWithPlantAndSpace | null> {
  const { data, error } = await supabase
    .from("plantings")
    .select(SELECT_FULL)
    .eq("id", plantingId)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as PlantingWithPlantAndSpace | null;
}

export async function getPlantingsInSpace(
  supabase: Client,
  spaceId: string,
): Promise<PlantingWithPlant[]> {
  const { data, error } = await supabase
    .from("plantings")
    .select(SELECT_WITH_PLANT)
    .eq("space_id", spaceId)
    .eq("status", "active");
  if (error) throw error;
  return (data ?? []) as unknown as PlantingWithPlant[];
}

export async function createPlanting(
  supabase: Client,
  planting: PlantingInsert,
): Promise<Planting> {
  const { data, error } = await supabase
    .from("plantings")
    .insert(planting)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePlanting(
  supabase: Client,
  plantingId: string,
  patch: PlantingUpdate,
): Promise<Planting> {
  const { data, error } = await supabase
    .from("plantings")
    .update(patch)
    .eq("id", plantingId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
