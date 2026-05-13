"use client";

import { Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

type RestatementCardProps = {
  onConfirm: () => void;
  onClarify: () => void;
  disabled?: boolean;
};

// The steering surface. Shown beneath a coach message that the model
// flagged as a restatement (is_restatement === true). Two buttons:
// "Yes, that's right" sends a continuation that asks for the actual
// answer; "Let me clarify" hands focus back to the input.

export function RestatementCard({
  onConfirm,
  onClarify,
  disabled,
}: RestatementCardProps) {
  return (
    <div
      className="mt-3 flex flex-col gap-3 rounded-2xl border border-border/70 px-3.5 py-3"
      style={{
        backgroundColor:
          "color-mix(in srgb, var(--type-vine) 8%, #ffffff)",
        borderColor: "color-mix(in srgb, var(--type-vine) 28%, transparent)",
      }}
    >
      <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
        Did I understand you?
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          onClick={onConfirm}
          disabled={disabled}
          className="rounded-full"
        >
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          Yes, that&rsquo;s right
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onClarify}
          disabled={disabled}
          className="rounded-full"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          Let me clarify
        </Button>
      </div>
    </div>
  );
}
