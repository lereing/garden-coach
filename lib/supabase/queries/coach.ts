import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CoachFeedback,
  CoachSession,
  CoachSessionInsert,
  Database,
} from "@/lib/types/database";

type Client = SupabaseClient<Database>;

export async function getRecentCoachSessions(
  supabase: Client,
  userId: string,
  limit = 20,
): Promise<CoachSession[]> {
  const { data, error } = await supabase
    .from("coach_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function saveCoachSession(
  supabase: Client,
  session: CoachSessionInsert,
): Promise<CoachSession> {
  const { data, error } = await supabase
    .from("coach_sessions")
    .insert(session)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function recordCoachFeedback(
  supabase: Client,
  sessionId: string,
  feedback: CoachFeedback,
): Promise<void> {
  const { error } = await supabase
    .from("coach_sessions")
    .update({ user_feedback: feedback })
    .eq("id", sessionId);
  if (error) throw error;
}
