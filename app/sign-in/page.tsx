"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Leaf, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "sent"; email: string }
  | { kind: "error"; message: string };

const CALLBACK_ERROR_LABELS: Record<string, string> = {
  auth_failed: "That link couldn't be verified. Try sending a new one.",
  missing_code: "The sign-in link was incomplete. Try sending a new one.",
  no_user: "No account was found for that link. Try sending a new one.",
  profile_create_failed:
    "Signed in, but we couldn't set up your profile. Please try again.",
};

export default function SignInPage() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-12 sm:px-6 sm:py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(60% 50% at 50% 10%, color-mix(in srgb, var(--type-leafy-green) 14%, transparent) 0%, transparent 70%),
            radial-gradient(50% 40% at 80% 90%, color-mix(in srgb, var(--type-vine) 10%, transparent) 0%, transparent 70%)
          `,
        }}
      />

      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <Link
          href="/"
          aria-label="Garden Coach home"
          className="flex flex-col items-center gap-3"
        >
          <span
            aria-hidden="true"
            className="grid h-14 w-14 place-items-center rounded-2xl border border-border/60 shadow-sm"
            style={{
              background:
                "linear-gradient(180deg, #ffffff 0%, color-mix(in srgb, var(--type-leafy-green) 8%, #ffffff) 100%)",
            }}
          >
            <Leaf
              className="h-7 w-7"
              style={{ color: "var(--type-leafy-green)" }}
              strokeWidth={2}
            />
          </span>
          <span className="font-heading text-2xl font-bold tracking-tight">
            Garden Coach
          </span>
        </Link>

        <Suspense fallback={<SignInCardFallback />}>
          <SignInCard />
        </Suspense>
      </div>
    </main>
  );
}

function SignInCardFallback() {
  return (
    <section
      aria-hidden="true"
      className="card-surface flex h-[260px] w-full rounded-3xl"
    />
  );
}

function SignInCard() {
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>(() =>
    callbackError && CALLBACK_ERROR_LABELS[callbackError]
      ? { kind: "error", message: CALLBACK_ERROR_LABELS[callbackError] }
      : { kind: "idle" },
  );

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setStatus({ kind: "loading" });
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus({
        kind: "error",
        message: friendlyErrorMessage(error.message),
      });
      return;
    }
    setStatus({ kind: "sent", email: trimmed });
  }

  if (status.kind === "sent") {
    return <SuccessPanel email={status.email} />;
  }

  const isLoading = status.kind === "loading";

  return (
    <section
      aria-labelledby="sign-in-title"
      className="card-surface flex w-full flex-col gap-6 rounded-3xl p-6 sm:p-8"
    >
      <header className="flex flex-col gap-2">
        <h1
          id="sign-in-title"
          className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          Sign in
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Enter your email and we&rsquo;ll send you a one-time link.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            aria-invalid={status.kind === "error"}
            aria-describedby={status.kind === "error" ? "sign-in-error" : undefined}
            className="h-12 text-base sm:text-base"
          />
        </div>

        {status.kind === "error" && (
          <p
            id="sign-in-error"
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {status.message}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={isLoading || !email.trim()}
          className="h-12 rounded-full text-base"
        >
          {isLoading ? "Sending link…" : "Send me a link"}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        No password required. Links expire in 1 hour.
      </p>
    </section>
  );
}

function SuccessPanel({ email }: { email: string }) {
  return (
    <section
      aria-live="polite"
      className="card-surface fade-in-soft flex w-full flex-col items-center gap-4 rounded-3xl p-6 text-center sm:p-8"
    >
      <span
        aria-hidden="true"
        className="grid h-12 w-12 place-items-center rounded-full"
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--success) 16%, #ffffff)",
          color: "color-mix(in srgb, var(--success) 40%, #1f2937)",
        }}
      >
        <MailCheck className="h-6 w-6" strokeWidth={2} />
      </span>
      <h2 className="font-heading text-2xl font-semibold tracking-tight">
        Check your inbox
      </h2>
      <p className="text-balance text-sm text-muted-foreground sm:text-base">
        We sent a link to <span className="font-medium text-foreground">{email}</span>.
        Tap it to sign in to Garden Coach. The link expires in 1 hour.
      </p>
      <Link
        href="/"
        className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
      >
        Back to home
      </Link>
    </section>
  );
}

function friendlyErrorMessage(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Too many attempts. Wait a minute and try again.";
  }
  if (lower.includes("invalid") && lower.includes("email")) {
    return "That email doesn't look right. Double-check the address.";
  }
  if (lower.includes("disposable")) {
    return "That email provider isn't supported. Try another address.";
  }
  return raw || "Something went wrong. Try again.";
}
