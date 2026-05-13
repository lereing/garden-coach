"use client";

import { Sprout } from "lucide-react";
import { CitationChip } from "@/components/coach/citation-chip";
import { ConfidencePill } from "@/components/coach/confidence-pill";
import { FeedbackRow } from "@/components/coach/feedback-row";
import { ToolCallIndicator } from "@/components/coach/tool-call-indicator";
import { ActionConfirmation } from "@/components/coach/action-confirmation";
import { RestatementCard } from "@/components/coach/restatement-card";
import { cn } from "@/lib/utils/cn";
import type { AssistantTurn } from "@/lib/hooks/useCoachStream";
import type { CoachFeedback } from "@/lib/types/database";

type CoachMessageProps = {
  turn: AssistantTurn;
  onFeedback: (feedback: CoachFeedback) => void;
  onFollowUp: (prompt: string) => void;
  onConfirmAction: () => void;
  onDeclineAction: () => void;
  onRestatementConfirm: () => void;
  onRestatementClarify: () => void;
};

export function CoachMessage({
  turn,
  onFeedback,
  onFollowUp,
  onConfirmAction,
  onDeclineAction,
  onRestatementConfirm,
  onRestatementClarify,
}: CoachMessageProps) {
  const isStreaming = turn.status === "streaming" || turn.status === "thinking";
  const hasContent = turn.content.length > 0;
  const showRestatement =
    turn.metadata.is_restatement && turn.status === "complete";
  const showAction =
    turn.metadata.requires_confirmation &&
    turn.metadata.action_prompt &&
    turn.status === "complete";
  const followUps = turn.status === "complete" ? turn.metadata.follow_ups : [];

  return (
    <div className="flex items-start gap-3">
      <CoachAvatar />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <article
          className={cn(
            "fade-in-soft flex flex-col gap-3 rounded-2xl border px-4 py-4",
            "min-w-0",
          )}
          style={{
            background:
              "linear-gradient(180deg, #ffffff 0%, color-mix(in srgb, var(--type-leafy-green) 8%, #ffffff) 100%)",
            borderColor:
              "color-mix(in srgb, var(--type-leafy-green) 22%, transparent)",
          }}
        >
          {isStreaming && (turn.activeTools.length > 0 || !hasContent) && (
            <ToolCallIndicator
              activeTools={turn.activeTools}
              thinking={turn.status === "thinking"}
            />
          )}

          {turn.status === "error" ? (
            <p
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {turn.errorMessage ??
                "Coach hit an error. Try asking again."}
            </p>
          ) : (
            hasContent && (
              <p className="text-base leading-relaxed text-foreground whitespace-pre-line">
                {turn.content}
                {isStreaming && (
                  <span aria-hidden="true" className="ml-0.5 inline-block animate-pulse">
                    ▍
                  </span>
                )}
              </p>
            )
          )}

          {showRestatement && (
            <RestatementCard
              onConfirm={onRestatementConfirm}
              onClarify={onRestatementClarify}
            />
          )}

          {showAction && (
            <ActionConfirmation
              prompt={turn.metadata.action_prompt!}
              confirmed={turn.actionConfirmed}
              onConfirm={onConfirmAction}
              onDecline={onDeclineAction}
            />
          )}

          {turn.status === "complete" && (
            <TrustFooter
              turn={turn}
              onFeedback={onFeedback}
            />
          )}
        </article>

        {followUps.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {followUps.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onFollowUp(f)}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground transition hover:border-foreground/40 hover:text-foreground"
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CoachAvatar() {
  return (
    <span
      aria-hidden="true"
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
      style={{
        background:
          "linear-gradient(135deg, color-mix(in srgb, var(--type-leafy-green) 24%, #ffffff) 0%, color-mix(in srgb, var(--type-vine) 18%, #ffffff) 100%)",
        border: "1px solid var(--border)",
      }}
    >
      <Sprout
        className="h-4 w-4"
        style={{ color: "var(--type-leafy-green)" }}
        strokeWidth={2.25}
      />
    </span>
  );
}

function TrustFooter({
  turn,
  onFeedback,
}: {
  turn: AssistantTurn;
  onFeedback: (feedback: CoachFeedback) => void;
}) {
  const { confidence, citations } = turn.metadata;
  if (
    !confidence &&
    citations.length === 0 &&
    turn.toolsUsed.length === 0
  ) {
    return (
      <div className="-mt-1 flex justify-end">
        <FeedbackRow
          startedAt={turn.startedAt}
          value={turn.feedback}
          onChange={onFeedback}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border/50 pt-3">
      <div className="flex flex-wrap items-center gap-2">
        {confidence && <ConfidencePill level={confidence} />}
        {citations.map((c) => (
          <CitationChip key={c} label={c} />
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {turn.toolsUsed.length > 0 ? (
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            Used: {turn.toolsUsed.join(" · ")}
          </p>
        ) : (
          <span />
        )}
        <FeedbackRow
          startedAt={turn.startedAt}
          value={turn.feedback}
          onChange={onFeedback}
        />
      </div>
    </div>
  );
}
