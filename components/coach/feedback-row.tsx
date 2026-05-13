"use client";

import { useEffect, useState } from "react";
import { CircleDot, ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { CoachFeedback } from "@/lib/types/database";

type FeedbackRowProps = {
  startedAt: number;
  value: CoachFeedback | null;
  onChange: (value: CoachFeedback) => void;
};

// 3-second reveal so it doesn't compete with the user reading the
// answer. If feedback is already recorded (from server-loaded history),
// surface it immediately.

const REVEAL_DELAY_MS = 3000;

export function FeedbackRow({ startedAt, value, onChange }: FeedbackRowProps) {
  const [visible, setVisible] = useState(() => value !== null || Date.now() - startedAt >= REVEAL_DELAY_MS);

  useEffect(() => {
    if (visible || value !== null) return;
    const remaining = Math.max(0, startedAt + REVEAL_DELAY_MS - Date.now());
    const t = window.setTimeout(() => setVisible(true), remaining);
    return () => window.clearTimeout(t);
  }, [startedAt, visible, value]);

  if (!visible && value === null) return null;

  const options: Array<{ key: CoachFeedback; label: string; icon: typeof ThumbsUp }> = [
    { key: "helpful", label: "Helpful", icon: ThumbsUp },
    { key: "partial", label: "Partial", icon: CircleDot },
    { key: "wrong", label: "Wrong", icon: ThumbsDown },
  ];

  return (
    <div role="group" aria-label="How was this response?" className="flex items-center gap-1.5">
      {options.map((opt) => {
        const Icon = opt.icon;
        const selected = value === opt.key;
        const hidden = value !== null && !selected;
        if (hidden) return null;
        return (
          <button
            key={opt.key}
            type="button"
            aria-label={opt.label}
            aria-pressed={selected}
            onClick={() => onChange(opt.key)}
            disabled={value !== null}
            className={cn(
              "grid h-7 w-7 place-items-center rounded-full border transition",
              selected
                ? "border-transparent bg-foreground text-background"
                : "border-border bg-background text-muted-foreground hover:text-foreground",
              value !== null && !selected && "cursor-default",
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
          </button>
        );
      })}
      {value && (
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          Noted
        </span>
      )}
    </div>
  );
}
