import { TOOL_STATUS_LABELS, type ToolName } from "@/lib/coach/types";

type ToolCallIndicatorProps = {
  activeTools: ToolName[];
  thinking?: boolean;
};

// Shown under the user's message while the coach is calling tools.
// Surfaces the model's reasoning chain so the wait doesn't feel
// opaque.

export function ToolCallIndicator({
  activeTools,
  thinking = false,
}: ToolCallIndicatorProps) {
  if (activeTools.length === 0 && !thinking) return null;
  const label =
    activeTools.length > 0
      ? activeTools.map((t) => TOOL_STATUS_LABELS[t]).join(" · ")
      : "Thinking…";
  return (
    <div
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-2 self-start rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground"
    >
      <Dot />
      <span className="font-mono tracking-wide">{label}</span>
    </div>
  );
}

function Dot() {
  return (
    <span
      aria-hidden="true"
      className="h-2 w-2 animate-pulse rounded-full motion-reduce:animate-none"
      style={{ background: "var(--type-leafy-green)" }}
    />
  );
}
