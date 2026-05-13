import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Plant,
  PlantType,
} from "@/lib/types/database";

type Client = SupabaseClient<Database>;

export async function getPlantById(
  supabase: Client,
  plantId: string,
): Promise<Plant | null> {
  const { data, error } = await supabase
    .from("plants")
    .select("*")
    .eq("id", plantId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPlantsByType(
  supabase: Client,
  type: PlantType,
): Promise<Plant[]> {
  const { data, error } = await supabase
    .from("plants")
    .select("*")
    .eq("type", type)
    .order("common_name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function searchPlants(
  supabase: Client,
  query: string,
  limit = 20,
): Promise<Plant[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const { data, error } = await supabase
    .from("plants")
    .select("*")
    .ilike("common_name", `%${trimmed}%`)
    .order("common_name", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
