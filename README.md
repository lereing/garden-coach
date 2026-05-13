# Garden Coach

An AI-native gardening companion. Users enter their address, the app
resolves their USDA hardiness zone, and a Claude-powered coach helps them
choose plants, plan layouts, and log care across the season.

The coach is the substrate of the product, not a feature.

## Stack

- **Next.js 16** (App Router, Turbopack) — note: the spec called for Next 15
  but `create-next-app@latest` pinned to 16; same App Router patterns apply
- **TypeScript** (strict mode)
- **Tailwind CSS v4** (PostCSS plugin)
- **shadcn/ui** — Nova preset on a Radix base; the classic `new-york` style
  has been removed from the latest CLI
- **Supabase** for auth + Postgres (via `@supabase/ssr`)
- **Anthropic SDK** for the Claude-powered coach
- Deploy target: **Vercel**

## Prerequisites

- Node.js 22+ (developed against Node 26)
- pnpm 10+
- A Supabase project (URL + anon + service-role keys)
- An Anthropic API key

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Copy the env template and fill in real values:
   ```bash
   cp .env.local.example .env.local
   ```
3. Run the dev server:
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Name | Where used | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | Public; exposed to the browser. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | Public anon key. |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | **Never** prefix with `NEXT_PUBLIC_`. |
| `ANTHROPIC_API_KEY` | server only | Used by the coach API routes. |

> **Running `pnpm dev` from inside a Claude Code (or Claude Desktop)
> session?** Those shells export `ANTHROPIC_API_KEY=""` into child
> processes to keep agents from inheriting a host key. Next.js's env
> precedence means an existing empty `process.env.ANTHROPIC_API_KEY`
> wins over `.env.local`, so the coach will report
> *"ANTHROPIC_API_KEY is not configured."* Fix:
> ```bash
> unset ANTHROPIC_API_KEY && pnpm dev
> ```
> Only affects this specific local-dev scenario. Production deploys
> (Vercel, etc.) aren't impacted.

## Sanity-check the Claude integration

With `ANTHROPIC_API_KEY` set in `.env.local`, hit:

```
GET /api/coach/test?q=Hello%20from%20Garden%20Coach
```

Example:

```bash
curl "http://localhost:3000/api/coach/test?q=Say%20hi%20in%20one%20sentence"
```

The route forwards the query to Claude and returns `{ model, reply, usage }`.

## Project layout

```
app/
  (auth)/                  reserved for sign-in, callback
  (app)/                   reserved for authenticated app routes
  api/coach/test/          Claude integration sanity-check
components/
  ui/                      shadcn primitives (Button, Card, Input, Label)
  coach/                   coach-specific components (later)
  garden/                  garden-specific components (later)
lib/
  supabase/                client.ts, server.ts, middleware.ts (SSR pattern)
  coach/                   client.ts, tools.ts, prompts.ts
  types/database.ts        placeholder for Supabase-generated types
  utils/cn.ts              shadcn className helper
middleware.ts              Next.js middleware → Supabase session refresh
```

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Run the dev server on `localhost:3000` |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Run ESLint |

## Database migrations

The schema lives in `supabase/migrations/`. Files are named with a UTC
timestamp + a short slug and apply in order. `supabase/seed.sql` runs
after migrations on `supabase db reset`.

### Prerequisites

Install the Supabase CLI:

```bash
brew install supabase/tap/supabase
```

Make sure Docker Desktop (or another runtime) is running — the local
stack uses it.

### Local development

1. **First-time setup** — generate `supabase/config.toml`. Safe to run
   in an existing repo; it doesn't overwrite migrations or `seed.sql`.
   ```bash
   supabase init
   ```
2. **Start a local Supabase stack** (Postgres on 54322, API on 54321,
   Studio on 54323, etc.):
   ```bash
   supabase start
   ```
3. **Apply migrations + seed**:
   ```bash
   supabase db reset
   ```
4. **Copy local credentials into `.env.local`**:
   ```bash
   supabase status
   # API URL          → NEXT_PUBLIC_SUPABASE_URL
   # anon key         → NEXT_PUBLIC_SUPABASE_ANON_KEY
   # service_role key → SUPABASE_SERVICE_ROLE_KEY
   ```
5. **Visit Supabase Studio** at <http://localhost:54323>.

### Production

```bash
# Link this repo to your Supabase project (one-time, requires login).
supabase login
supabase link --project-ref <your-project-ref>

# Push any new migrations. Existing ones are skipped.
supabase db push
```

The project ref is the alphanumeric ID in your Supabase dashboard URL
(`https://supabase.com/dashboard/project/<ref>`).

### Adding a new migration

```bash
supabase migration new my_change   # creates a timestamped .sql file
# edit the file...
supabase db reset                  # verify locally
supabase db push                   # apply to production
```

### Seeding the plant catalog

`supabase/seed_plants.sql` holds 40 common North American edibles —
the catalog the coach reasons against. It's `\ir`-included from
`supabase/seed.sql`, so `supabase db reset` populates it automatically.

To re-apply the catalog without wiping user data (auth, profiles,
plantings, etc.), pipe the seed file straight into the local DB:

```bash
docker exec -i supabase_db_garden-coach psql -U postgres -d postgres \
  < supabase/seed_plants.sql
```

Reseeding on top of an already-seeded `plants` table creates
duplicates — the inserts have no `ON CONFLICT` clause. If you need a
clean reseed:

```bash
docker exec supabase_db_garden-coach psql -U postgres -d postgres \
  -c "delete from public.plantings; \
      truncate table public.plants restart identity cascade;"
docker exec -i supabase_db_garden-coach psql -U postgres -d postgres \
  < supabase/seed_plants.sql
```

(Only run with `delete from public.plantings` if you're certain no
real user plantings exist — it cascades from the truncate.)

For production, run the same `psql < seed_plants.sql` against the
Supabase pooler URL with the service-role connection string, or paste
the file into the SQL editor in the Supabase dashboard.

### Regenerating types

After any schema change, refresh `lib/types/database.ts`:

```bash
# From local
supabase gen types typescript --local > lib/types/database.ts

# From production
supabase gen types typescript --project-id <ref> > lib/types/database.ts
```

The Supabase clients and query helpers under `lib/supabase/queries/`
inherit types from this file.

## Magic-link auth setup

Auth is email-only via Supabase magic links. No passwords. The flow:

1. User enters their email at `/sign-in` → app calls
   `supabase.auth.signInWithOtp` with `emailRedirectTo` pointing at
   `/auth/callback`.
2. Supabase sends an email with a verification link.
3. The link routes back through `/auth/callback`, which exchanges the
   code for a session, ensures the user has a `profiles` row, and
   redirects to `/onboarding` or `/home`.

### Local development

Magic-link emails land in **Mailpit** at <http://127.0.0.1:54324> when
`supabase start` is running. Click the link in Mailpit to complete
sign-in.

If you change the site URL or callback path, update both:

- `supabase/config.toml` → `[auth]` section: `site_url` and
  `additional_redirect_urls`. After editing, run `supabase stop &&
  supabase start` so the auth container picks up the change.
- Any hard-coded URLs in `app/sign-in/page.tsx` (`emailRedirectTo`)
  and `lib/supabase/middleware.ts` (`PUBLIC_PATHS`).

### Production (Supabase dashboard)

In **Authentication → URL Configuration**:

- **Site URL** → your production origin, e.g. `https://garden-coach.app`.
- **Redirect URLs** → add `https://garden-coach.app/**` (the glob covers
  any callback path). Add Vercel preview origins too if you want
  magic-link sign-in on PR previews:
  `https://*.vercel.app/auth/callback`.

In **Authentication → Email Templates**:

- The default "Magic Link" template is fine for v1. The link variable
  `{{ .ConfirmationURL }}` already resolves to the verify URL with the
  redirect baked in.
- Customizing copy can wait until visual design lands; do it in the
  dashboard, not in code, so Supabase handles the deliverability
  defaults.

### Rate limits

Supabase's default email rate limit is 4 messages per hour per IP. If
you're testing repeatedly and hit it, either wait or temporarily raise
`[auth.rate_limit]` values in `supabase/config.toml` for local dev.

## Deploy to Vercel

1. Push the repo to GitHub.
2. In Vercel, **Add New → Project**, import the repo.
3. Framework preset auto-detects as Next.js. Leave defaults.
4. Add the env vars from `.env.local.example` to the Vercel project
   (`Settings → Environment Variables`).
5. Deploy.

## Status

Schema and design system landed. Auth, full UI flows, and the plant
catalog seed come next.
