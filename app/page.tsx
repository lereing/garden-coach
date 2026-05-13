import Link from "next/link";
import { Leaf, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(60% 50% at 50% 20%, color-mix(in srgb, var(--type-leafy-green) 14%, transparent) 0%, transparent 70%),
            radial-gradient(50% 40% at 80% 90%, color-mix(in srgb, var(--type-vine) 10%, transparent) 0%, transparent 70%),
            radial-gradient(45% 35% at 10% 80%, color-mix(in srgb, var(--type-brassica) 8%, transparent) 0%, transparent 70%)
          `,
        }}
      />

      <div className="flex w-full max-w-md flex-col items-center gap-6 text-center sm:max-w-lg sm:gap-8">
        <div
          aria-hidden="true"
          className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border/60 shadow-sm sm:h-20 sm:w-20"
          style={{
            background:
              "linear-gradient(180deg, #ffffff 0%, color-mix(in srgb, var(--type-leafy-green) 8%, #ffffff) 100%)",
          }}
        >
          <Leaf
            className="h-8 w-8 sm:h-10 sm:w-10"
            style={{ color: "var(--type-leafy-green)" }}
            strokeWidth={2}
          />
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="font-heading text-5xl leading-[1.05] font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Garden Coach
          </h1>
          <p className="text-balance text-base leading-relaxed text-muted-foreground sm:text-lg lg:text-xl">
            An AI gardening companion. Tell it where you live and it helps
            you choose plants, plan layouts, and log care across the season.
          </p>
        </div>

        <Button asChild size="lg" className="rounded-full">
          <Link href="/sign-in">
            <Sprout className="h-4 w-4" aria-hidden="true" />
            Sign in
          </Link>
        </Button>
      </div>
    </main>
  );
}
