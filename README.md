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

## Deploy to Vercel

1. Push the repo to GitHub.
2. In Vercel, **Add New → Project**, import the repo.
3. Framework preset auto-detects as Next.js. Leave defaults.
4. Add the env vars from `.env.local.example` to the Vercel project
   (`Settings → Environment Variables`).
5. Deploy.

## Status

Foundation only. No auth, no database schema, no features yet — those land
in the next steps.
