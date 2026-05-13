import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Conversation } from "@/components/coach/conversation";
import { coerceMetadata, isToolName, type ToolName } from "@/lib/coach/types";
import { createClient } from "@/lib/supabase/server";
import type { Turn } from "@/lib/hooks/useCoachStream";
import type { CoachFeedback } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function CoachPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: rows } = await supabase
    .from("coach_sessions")
    .select(
      "id, query, response, tools_used, user_feedback, metadata, created_at",
    )
    .eq("user_id", user.id)
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: true });

  const initialTurns: Turn[] = (rows ?? []).flatMap((row) => {
    const tools: ToolName[] = Array.isArray(row.tools_used)
      ? row.tools_used.filter(isToolName)
      : [];
    const metadata = coerceMetadata(row.metadata);
    const userTurn: Turn = {
      id: `q-${row.id}`,
      role: "user",
      content: row.query,
    };
    const assistantTurn: Turn = {
      id: `a-${row.id}`,
      role: "assistant",
      content: row.response,
      sessionId: row.id,
      toolsUsed: tools,
      metadata,
      feedback: (row.user_feedback as CoachFeedback) ?? null,
      status: "complete",
      activeTools: [],
      startedAt: new Date(row.created_at).getTime(),
    };
    return [userTurn, assistantTurn];
  });

  return (
    <main className="mx-auto flex min-h-[100svh] w-full max-w-2xl flex-col gap-6 px-4 pt-6 pb-2 sm:px-6 sm:pt-10">
      <header className="flex items-center justify-between gap-3">
        <Link
          href="/home"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Back to home
        </Link>
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          Coach · last 24h
        </p>
      </header>

      <Conversation initialTurns={initialTurns} />
    </main>
  );
}
