"use client";

import { Popover } from "radix-ui";
import { Quote } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type CitationChipProps = {
  label: string;
  /** Optional richer detail to render in the popover. Falls back to the label. */
  detail?: string;
  className?: string;
};

// Pill-shaped, mono label, clickable to reveal a small popover with
// the underlying source. The popover is the trust surface: the user
// can audit the fact that grounded the coach's recommendation.

export function CitationChip({ label, detail, className }: CitationChipProps) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2.5 py-1",
            "font-mono text-[11px] tracking-wide text-foreground/80",
            "transition hover:bg-muted hover:text-foreground focus-visible:outline-none",
            className,
          )}
        >
          <Quote className="h-3 w-3 shrink-0" strokeWidth={2.25} aria-hidden="true" />
          <span className="truncate">{label}</span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={6}
          align="start"
          className={cn(
            "z-50 max-w-[18rem] rounded-2xl border border-border/70 bg-background p-4 shadow-lg",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          )}
        >
          <p className="mb-1 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            Cited fact
          </p>
          <p className="font-mono text-sm text-foreground">{label}</p>
          {detail && (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {detail}
            </p>
          )}
          <p className="mt-3 text-[11px] leading-snug text-muted-foreground">
            Pulled from a tool call this turn. Click any chip to see what
            grounded the coach&rsquo;s answer.
          </p>
          <Popover.Arrow className="fill-background" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
