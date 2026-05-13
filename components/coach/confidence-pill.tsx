import { CheckCircle2, CircleDot, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Confidence } from "@/lib/coach/types";

type ConfidencePillProps = {
  level: Confidence;
  className?: string;
};

const META: Record<
  Confidence,
  {
    label: string;
    icon: typeof CheckCircle2;
    bg: string;
    fg: string;
    border: string;
  }
> = {
  high: {
    label: "High confidence",
    icon: CheckCircle2,
    bg: "color-mix(in srgb, var(--success) 16%, #ffffff)",
    fg: "color-mix(in srgb, var(--success) 35%, #1f2937)",
    border: "color-mix(in srgb, var(--success) 32%, transparent)",
  },
  medium: {
    label: "Medium confidence",
    icon: CircleDot,
    bg: "color-mix(in srgb, var(--warning) 18%, #ffffff)",
    fg: "color-mix(in srgb, var(--warning) 38%, #1f2937)",
    border: "color-mix(in srgb, var(--warning) 32%, transparent)",
  },
  lower: {
    label: "Lower confidence",
    icon: HelpCircle,
    bg: "var(--muted)",
    fg: "color-mix(in srgb, var(--foreground) 70%, transparent)",
    border: "var(--border)",
  },
};

export function ConfidencePill({ level, className }: ConfidencePillProps) {
  const meta = META[level];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase",
        className,
      )}
      style={{
        backgroundColor: meta.bg,
        color: meta.fg,
        borderColor: meta.border,
      }}
    >
      <Icon className="h-3 w-3" strokeWidth={2.25} aria-hidden="true" />
      {meta.label}
    </span>
  );
}
