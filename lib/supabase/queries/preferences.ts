import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Preferences,
  PreferencesInsert,
} from "@/lib/types/database";

type Client = SupabaseClient<Database>;

export async function getPreferences(
  supabase: Client,
  userId: string,
): Promise<Preferences | null> {
  const { data, error } = await supabase
    .from("preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertPreferences(
  supabase: Client,
  prefs: PreferencesInsert,
): Promise<Preferences> {
  const { data, error } = await supabase
    .from("preferences")
    .upsert(prefs, { onConflict: "user_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}
