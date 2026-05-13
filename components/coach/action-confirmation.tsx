"use client";

import { useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ActionConfirmationProps = {
  prompt: string;
  confirmed?: boolean;
  onConfirm: () => Promise<void> | void;
  onDecline: () => void;
};

// The friction surface. When the coach proposes an action with
// consequences (set up reminders, mark a planting failed, modify a
// plan), we show this card instead of executing anything. The user
// stays the decision-maker.

export function ActionConfirmation({
  prompt,
  confirmed,
  onConfirm,
  onDecline,
}: ActionConfirmationProps) {
  const [pending, setPending] = useState(false);

  if (confirmed) {
    return (
      <div
        role="status"
        className="mt-3 flex items-center gap-2 rounded-2xl border border-border/70 px-3.5 py-3 text-sm"
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--success) 12%, #ffffff)",
          borderColor:
            "color-mix(in srgb, var(--success) 30%, transparent)",
          color: "color-mix(in srgb, var(--success) 35%, #1f2937)",
        }}
      >
        <ShieldCheck className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
        Confirmed. Coach will follow up with what was set up.
      </div>
    );
  }

  return (
    <div
      className="mt-3 flex flex-col gap-3 rounded-2xl border border-border/70 px-3.5 py-3"
      style={{
        backgroundColor:
          "color-mix(in srgb, var(--type-brassica) 8%, #ffffff)",
        borderColor:
          "color-mix(in srgb, var(--type-brassica) 28%, transparent)",
      }}
    >
      <div className="flex items-start gap-2">
        <ShieldCheck
          className="mt-0.5 h-4 w-4 shrink-0"
          strokeWidth={2.25}
          style={{
            color: "color-mix(in srgb, var(--type-brassica) 45%, #1f2937)",
          }}
          aria-hidden="true"
        />
        <p className="text-sm leading-snug text-foreground">{prompt}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={async () => {
            setPending(true);
            try {
              await onConfirm();
            } finally {
              setPending(false);
            }
          }}
          className="rounded-full"
        >
          {pending ? "Setting it up…" : "Yes, set it up"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={onDecline}
          className="rounded-full"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Not now
        </Button>
      </div>
    </div>
  );
}
