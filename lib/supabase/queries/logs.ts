import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Log,
  LogInsert,
  LogWithPlanting,
} from "@/lib/types/database";

type Client = SupabaseClient<Database>;

export async function getRecentLogs(
  supabase: Client,
  userId: string,
  limit = 50,
): Promise<LogWithPlanting[]> {
  const { data, error } = await supabase
    .from("logs")
    .select("*, planting:plantings(*, plant:plants(*))")
    .eq("user_id", userId)
    .order("logged_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as LogWithPlanting[];
}

export async function createLog(
  supabase: Client,
  log: LogInsert,
): Promise<Log> {
  const { data, error } = await supabase
    .from("logs")
    .insert(log)
    .select()
    .single();
  if (error) throw error;
  return data;
}
