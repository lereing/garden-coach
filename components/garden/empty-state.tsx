import Link from "next/link";
import { Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState() {
  return (
    <section className="card-surface flex flex-col items-center gap-5 rounded-3xl p-8 text-center sm:p-12">
      <span
        aria-hidden="true"
        className="grid h-14 w-14 place-items-center rounded-2xl"
        style={{
          background:
            "linear-gradient(180deg, #ffffff 0%, color-mix(in srgb, var(--type-leafy-green) 12%, #ffffff) 100%)",
          border: "1px solid var(--border)",
        }}
      >
        <Sprout
          className="h-7 w-7"
          style={{ color: "var(--type-leafy-green)" }}
          strokeWidth={2}
        />
      </span>
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Your garden is empty
        </h2>
        <p className="max-w-sm text-balance text-base text-muted-foreground">
          Add your first planting to start logging waterings, harvests, and
          observations.
        </p>
      </div>
      <Button asChild size="lg" className="h-12 rounded-full px-6 text-base">
        <Link href="/plantings/new">Add your first planting</Link>
      </Button>
    </section>
  );
}
