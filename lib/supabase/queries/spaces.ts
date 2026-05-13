import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Space,
  SpaceInsert,
  SpaceUpdate,
} from "@/lib/types/database";

type Client = SupabaseClient<Database>;

export async function getUserSpaces(
  supabase: Client,
  userId: string,
): Promise<Space[]> {
  const { data, error } = await supabase
    .from("spaces")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getSpace(
  supabase: Client,
  spaceId: string,
): Promise<Space | null> {
  const { data, error } = await supabase
    .from("spaces")
    .select("*")
    .eq("id", spaceId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createSpace(
  supabase: Client,
  space: SpaceInsert,
): Promise<Space> {
  const { data, error } = await supabase
    .from("spaces")
    .insert(space)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSpace(
  supabase: Client,
  spaceId: string,
  patch: SpaceUpdate,
): Promise<Space> {
  const { data, error } = await supabase
    .from("spaces")
    .update(patch)
    .eq("id", spaceId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSpace(
  supabase: Client,
  spaceId: string,
): Promise<void> {
  const { error } = await supabase.from("spaces").delete().eq("id", spaceId);
  if (error) throw error;
}
