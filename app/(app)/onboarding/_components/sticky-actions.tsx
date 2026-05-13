import { cn } from "@/lib/utils/cn";

type StickyActionsProps = {
  children: React.ReactNode;
  className?: string;
};

// Mobile: sticks to the bottom of the viewport with a soft background
// fade so content scrolls underneath it. Desktop: inline.
export function StickyActions({ children, className }: StickyActionsProps) {
  return (
    <div
      className={cn(
        "sticky bottom-0 -mx-4 mt-8 px-4 pt-4 pb-[max(env(safe-area-inset-bottom),1rem)]",
        "sm:relative sm:bottom-auto sm:mx-0 sm:mt-12 sm:px-0 sm:pt-0 sm:pb-0",
        className,
      )}
      style={{
        background:
          "linear-gradient(180deg, color-mix(in srgb, var(--background) 0%, transparent) 0%, var(--background) 40%, var(--background) 100%)",
      }}
    >
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {children}
      </div>
    </div>
  );
}
