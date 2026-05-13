import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserSpaces } from "@/lib/supabase/queries";
import { NewPlantingForm } from "./_components/new-planting-form";

export const dynamic = "force-dynamic";

export default async function NewPlantingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const [{ data: plants }, spaces] = await Promise.all([
    supabase
      .from("plants")
      .select("id, common_name, type")
      .order("common_name"),
    getUserSpaces(supabase, user.id),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-6 pb-12 sm:px-6 sm:pt-10">
      <Link
        href="/home"
        className="inline-flex items-center gap-1 self-start text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Back to home
      </Link>

      <header className="flex flex-col gap-2">
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          Plantings
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          Add a planting
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Pick what you put in the ground, when, and (optionally) which
          space. Logging starts from here.
        </p>
      </header>

      <NewPlantingForm plants={plants ?? []} spaces={spaces} />
    </main>
  );
}
