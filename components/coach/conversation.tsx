"use client";

import { useEffect, useMemo, useRef } from "react";
import { CoachInput, type CoachInputHandle } from "@/components/coach/coach-input";
import { CoachMessage } from "@/components/coach/coach-message";
import { UserMessage } from "@/components/coach/user-message";
import { useCoachStream, type Turn } from "@/lib/hooks/useCoachStream";

const DEFAULT_SUGGESTIONS = [
  "What should I plant?",
  "Should I water today?",
  "Why is my basil yellow?",
];

const FOLLOWUP_FALLBACK = [
  "Tell me more",
  "What about timing?",
  "Show me a plan",
];

type ConversationProps = {
  initialTurns?: Turn[];
};

export function Conversation({ initialTurns = [] }: ConversationProps) {
  const {
    turns,
    isStreaming,
    send,
    recordFeedback,
    confirmAction,
    dismissAction,
  } = useCoachStream({ initialTurns });

  const inputRef = useRef<CoachInputHandle>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Pin to the bottom as new content streams in.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [turns, isStreaming]);

  // Suggested prompts adapt: use the last assistant's follow_ups if
  // they exist, otherwise fall back to topic starters.
  const suggestions = useMemo(() => {
    if (isStreaming) return [];
    if (turns.length === 0) return DEFAULT_SUGGESTIONS;
    const last = [...turns].reverse().find((t) => t.role === "assistant");
    if (last && last.role === "assistant" && last.metadata.follow_ups.length > 0) {
      return last.metadata.follow_ups;
    }
    return FOLLOWUP_FALLBACK;
  }, [turns, isStreaming]);

  function handleRestatementConfirm(turnId: string) {
    const turn = turns.find((t) => t.id === turnId);
    if (!turn || turn.role !== "assistant") return;
    void send(
      "Yes, that's what I meant. Go ahead and answer the underlying question.",
    );
  }

  function handleRestatementClarify() {
    inputRef.current?.focus();
  }

  return (
    <div className="flex h-full flex-col gap-6">
      {turns.length === 0 ? (
        <EmptyHint />
      ) : (
        <div className="flex flex-col gap-6">
          {turns.map((turn) =>
            turn.role === "user" ? (
              <UserMessage key={turn.id} content={turn.content} />
            ) : (
              <CoachMessage
                key={turn.id}
                turn={turn}
                onFeedback={(fb) => recordFeedback(turn.id, fb)}
                onFollowUp={(text) => void send(text)}
                onConfirmAction={() =>
                  confirmAction(turn.id, "watering_schedule")
                }
                onDeclineAction={() => dismissAction(turn.id)}
                onRestatementConfirm={() => handleRestatementConfirm(turn.id)}
                onRestatementClarify={handleRestatementClarify}
              />
            ),
          )}
          <div ref={bottomRef} />
        </div>
      )}

      <CoachInput
        ref={inputRef}
        onSubmit={(text) => void send(text)}
        suggestions={suggestions}
        disabled={isStreaming}
        placeholder={
          turns.length === 0
            ? "What should I plant in March?"
            : "Ask a follow-up…"
        }
      />
    </div>
  );
}

function EmptyHint() {
  return (
    <div className="flex flex-col items-start gap-2 px-1">
      <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
        Coach
      </p>
      <p className="text-base text-foreground/80">
        Ask anything about your garden. The coach reads your zone,
        spaces, plantings, and the weather before answering.
      </p>
    </div>
  );
}
