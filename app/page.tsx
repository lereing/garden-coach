import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Garden Coach</h1>
        <p className="text-balance text-muted-foreground">
          An AI gardening companion. Tell it where you live, and it helps you
          choose plants, plan layouts, and log care across the season.
        </p>
        <Button size="lg" disabled aria-disabled="true">
          Sign in
        </Button>
      </div>
    </main>
  );
}
