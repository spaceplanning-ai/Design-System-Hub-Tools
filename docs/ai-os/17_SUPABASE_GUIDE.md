# 17 — Supabase Guide

> **Title:** Supabase Guide
> **Purpose:** Define the **PLANNED** Supabase usage standard for TDS — Auth, Postgres, Row-Level Security, Storage, Edge Functions, Realtime, client patterns, security, and scaling to >10,000,000 users — as the canonical backend platform a future TDS-consuming application will adopt.
> **Status:** PLANNED
> **Owner:** AI OS
> **Last-reviewed:** _(placeholder — set on review)_
> **Precedence:** Subordinate to [00_MASTER_RULES.md](./00_MASTER_RULES.md). This document describes a **future** standard; nothing here overrides the Design Lock Policy or the design-system pipeline. Where it pairs with a sibling backend doc, the split is: schema/RLS/indexing/ERD live in [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), API contracts in [15_API_GUIDE.md](./15_API_GUIDE.md), Node/TS service conventions in [16_NODE_GUIDE.md](./16_NODE_GUIDE.md); this doc owns the **Supabase platform surface** those three consume.

---

> ## STATUS: PLANNED — no backend exists in the repo today.
> There is **no** Supabase project, no `supabase/` directory, no `@supabase/supabase-js` dependency, no
> `.env`, no service keys, and no server code in this repository. The runtime dependency set is **only**
> `react` + `react-dom`. TDS today is a metadata-driven **frontend design system** whose single job is to
> generate Storybook and the Figma bundle (`figma/tds.plugin.json`). `SocialLogin` / `SocialLoginButton` are
> **presentational only** — they render buttons, they do not authenticate. Everything below is the **target
> standard** for the day a product application is built on top of the TDS component library. It is written now
> so that when that day comes, every AI agent builds the backend one way, deterministically, at enterprise
> scale. **Do not create any of these files or install any of these packages unless a task explicitly asks for
> backend work.**

---

## 1. Purpose

This document is the single authority for **how TDS will use Supabase** once a backend is introduced. Supabase
(managed Postgres + Auth + RLS + Storage + Edge Functions + Realtime) is the **designated backend platform** for
the AI OS mission of scaling a TDS-based product beyond **10,000,000 users** with minimal operational surface.

It exists to guarantee that a future backend is built **once, consistently**, by any AI agent (Claude Code,
Gemini CLI, Cursor, Codex, Windsurf, MCP agents), with:

- **One client-creation pattern** per execution context (browser, server, Edge Function).
- **RLS-first data access** — the database, not application code, is the security boundary.
- **A hard wall between the design system and the backend** — Supabase must **never** influence any visual
  design decision, token, component, variant, or the Storybook↔Figma pipeline (see the Design Lock Policy in
  [00_MASTER_RULES.md](./00_MASTER_RULES.md) and [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md)).

This doc defines the platform surface (Auth/RLS/Storage/Functions/Realtime), the file/naming conventions, the
security invariants, and the scaling posture. It feeds the runtime manifests [.ai/ERD.json](../../.ai/ERD.json)
and [.ai/API_SPEC.json](../../.ai/API_SPEC.json), both currently seeded `"status":"planned"`.

## 2. Responsibilities

This specification owns:

- **The Supabase product-surface standard** — how Auth, Postgres access via `@supabase/supabase-js`, RLS,
  Storage, Edge Functions (Deno), and Realtime are used and constrained.
- **Client-creation patterns** — the canonical browser (anon-key + RLS) client, the server (service-role,
  RLS-bypassing) client, and the Edge Function client, each in exactly one place.
- **The environment/secret contract** — variable names, which are public (`VITE_`-exposed) vs server-only, and
  the rule that no secret ever ships to the browser bundle.
- **The Supabase project layout** — `supabase/` (`config.toml`, `migrations/`, `functions/`, `seed.sql`) and the
  generated `database.types.ts` (generated = sacred).
- **The security invariants** — RLS mandatory, service role never in client code, storage bucket policies.
- **The scaling posture to >10M users** — connection pooling (Supavisor), read replicas, RLS index-safety,
  Realtime channel limits, and the hand-off to [23_PERFORMANCE_GUIDE.md](./23_PERFORMANCE_GUIDE.md).

It does **not** own: table schema, columns, migrations mechanics, indexing strategy, or the ERD (→
[14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md)); REST/RPC endpoint contracts and versioning (→
[15_API_GUIDE.md](./15_API_GUIDE.md)); generic Node/TS service structure, packaging, observability (→
[16_NODE_GUIDE.md](./16_NODE_GUIDE.md)); the broad security model (→ [22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md));
or CI/CD and environment promotion (→ [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)).

## 3. Scope

**In-scope**
- Supabase Auth (email/OTP/OAuth, JWT, sessions) and how `SocialLogin`/`SocialLoginButton` wire to it later.
- Postgres access through `@supabase/supabase-js` (query builder + `.rpc()`), and typed DB access.
- Row-Level Security as the primary authorization mechanism, and its performance implications.
- Storage buckets, object policies, and signed-URL patterns.
- Edge Functions (Deno runtime) — when to use, structure, secrets, invocation.
- Realtime — Postgres Changes, Broadcast, Presence — and its scaling limits.
- Client-creation patterns per context; the env/secret contract; the `supabase/` project layout.
- Scaling posture to >10M users (pooling, replicas, RLS index-safety, caching hand-off).

**Out-of-scope**
- Table/column design, migrations content, indexes, partitioning specifics → [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md).
- API endpoint/version contracts, error envelopes → [15_API_GUIDE.md](./15_API_GUIDE.md).
- Node service structure, logging, packaging → [16_NODE_GUIDE.md](./16_NODE_GUIDE.md).
- The design system, tokens, components, Storybook, Figma bundle — **untouched by Supabase**. See
  [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md), [04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md),
  [05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md).
- CI/CD, secret rotation infra, environments → [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md), [22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md).

## 4. Rules

**Boundary & Design Lock**
1. **R1 (NEVER)** — Supabase, its data, its auth state, or any backend concern MUST NEVER influence a visual
   design decision, a token (`--tds-*`), a component `*.meta.ts`, a variant axis (`type`/`variant`/`tone`/`size`/
   `shape`/`state`), the manifest, or the Figma bundle. The design system builds and ships with **zero** backend
   dependency (runtime deps stay `react` + `react-dom` for the DS package). Backend code lives in a separate,
   clearly-marked area (see R14).
2. **R2 (MUST)** — TDS components stay **presentation-only and backend-agnostic**. A component MUST NOT import
   `@supabase/supabase-js` or read Supabase state internally. Data flows in through props; events flow out
   through callbacks. Auth/data wiring happens in the **application layer**, never inside `src/components/**`.

**Client creation & keys**
3. **R3 (MUST)** — Create the Supabase client in **exactly one module per context**: one browser client (anon
   key, RLS-enforced), one server client (service-role, RLS-bypassing), one Edge Function client. NEVER call
   `createClient` ad hoc in feature code — import the singleton.
4. **R4 (NEVER)** — The **service-role key** (`SUPABASE_SERVICE_ROLE_KEY`) MUST NEVER appear in browser-reachable
   code, in any `VITE_`-prefixed variable, in a `*.stories.tsx`, or in the Storybook build. It lives only in
   server/Edge runtimes. Exposing it is a critical security incident.
5. **R5 (MUST)** — The browser MAY receive only the **URL** and **anon (publishable) key** via
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. These are safe **only because RLS is enforced** (R7). Any
   `VITE_`-prefixed variable is public by Vite's contract — treat it as printed on a billboard.

**RLS-first authorization**
6. **R6 (MUST)** — **Every** table exposed to the anon/authenticated roles MUST have `ENABLE ROW LEVEL SECURITY`
   plus explicit policies. A table without RLS is a data breach; the schema review gate (see
   [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md)) MUST block it.
7. **R7 (MUST)** — Authorization is enforced **in the database via RLS**, not in application code. Application
   code is a convenience layer; the DB is the trust boundary. NEVER rely on hiding a UI control as an access
   control.
8. **R8 (MUST)** — RLS policies MUST be **index-safe** at 10M-row scale: wrap `auth.uid()` as `(select auth.uid())`
   so Postgres caches it per-statement, and index the columns policies filter on. Un-indexed RLS predicates are a
   primary scaling failure (see §12 and [23_PERFORMANCE_GUIDE.md](./23_PERFORMANCE_GUIDE.md)).

**Schema, migrations, generated types**
9. **R9 (MUST)** — All schema changes ship as **versioned SQL migrations** under `supabase/migrations/`
   (`supabase migration new …`). NEVER mutate a hosted database by hand — migrations are the source of truth for
   schema, mirroring the repo's "generated is sacred, change the source" discipline.
10. **R10 (MUST)** — The typed database client uses **generated** types
    (`supabase gen types typescript` → `src/lib/supabase/database.types.ts`). That file is a **generated output**
    — treat it like `src/tokens/generated/*`: **never hand-edit**; regenerate after every migration.

**Edge Functions & secrets**
11. **R11 (MUST)** — Edge Functions live under `supabase/functions/<name>/index.ts` (Deno). Secrets are set via
    `supabase secrets set` / the dashboard and read from the Deno environment — NEVER hardcoded, NEVER committed.
12. **R12 (SHOULD)** — Use an Edge Function (server trust) for any operation that needs the service role,
    third-party secrets, webhooks, or logic that must not run client-side. Prefer RLS + direct client calls for
    ordinary CRUD; reserve functions for privileged/side-effecting work.

**Realtime & Storage**
13. **R13 (SHOULD)** — Enable Realtime **only** on tables that need it, and scope channels tightly. Realtime
    respects RLS on Postgres Changes — never use it to leak rows a user cannot read. Prefer Broadcast/Presence
    for ephemeral UI state over row-level subscriptions at scale.
14. **R14 (MUST)** — Storage buckets default to **private**; access is granted by storage RLS policies and served
    via **signed URLs**. NEVER make a bucket public unless the asset is genuinely public (and never for
    user-uploaded PII). Backend/app code lives outside the DS package (proposed `src/lib/supabase/**` and/or a
    dedicated app/service area per [16_NODE_GUIDE.md](./16_NODE_GUIDE.md) and [18_FOLDER_STRUCTURE.md](./18_FOLDER_STRUCTURE.md)).

**Honesty**
15. **R15 (MUST)** — Any doc, manifest, or code comment that references Supabase MUST label it **PLANNED** until
    the backend actually exists. NEVER imply auth/data/persistence works today. `.ai/ERD.json` and
    `.ai/API_SPEC.json` stay `"status":"planned"` until the migration/API contract is real.

## 5. Workflow

All steps below are **PLANNED** and run only when a task explicitly authorizes backend work.

**A. Bootstrapping the backend (one-time).**
1. Add dev tooling: the Supabase CLI (`supabase`), and the runtime dep `@supabase/supabase-js` **only** in the
   application/server package — not in the design-system package (keep DS deps = `react` + `react-dom`, R1).
2. `supabase init` → creates `supabase/config.toml`, `supabase/migrations/`, `supabase/functions/`, `supabase/seed.sql`.
3. `supabase start` → local Postgres + Auth + Storage + Realtime for development (Docker).
4. Author the first migration per [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md): tables, `ENABLE ROW LEVEL
   SECURITY`, policies, indexes (R6/R8).
5. `supabase gen types typescript --local > src/lib/supabase/database.types.ts` (R10).
6. Seed `.ai/ERD.json` and `.ai/API_SPEC.json` from the real schema/contracts; flip `"status"` from `planned`.

**B. Creating the clients (once each, R3).**
1. Browser client → `src/lib/supabase/client.ts` (anon key, session persistence). Import this everywhere in the
   app UI. This is the client TDS components' consumers use — components themselves stay agnostic (R2).
2. Server client → `src/lib/supabase/server.ts` (service role, RLS bypass) — server/SSR/Edge only, never bundled
   to the browser (R4).

**C. Adding a feature that reads/writes data.**
1. Confirm the table + RLS policy exist and are index-safe (R6/R8) — if not, write a migration first.
2. Query via the typed browser client; let RLS scope the rows. Handle `{ data, error }` explicitly.
3. If the operation needs the service role or secrets, write an Edge Function (R12) and call it via
   `supabase.functions.invoke('name', …)`.
4. Add/adjust the endpoint contract in [15_API_GUIDE.md](./15_API_GUIDE.md) / `.ai/API_SPEC.json`.

**D. Wiring real auth to existing UI.**
1. Keep `SocialLogin`/`SocialLoginButton` **presentational**; pass an `onClick` from the app that calls
   `supabase.auth.signInWithOAuth({ provider })`. Do not add Supabase imports to the component (R2).
2. Read session with `supabase.auth.getSession()` / `onAuthStateChange`; gate app routes, not component internals.

**E. Shipping a schema change.**
1. `supabase migration new <name>` → edit SQL → `supabase db reset` (local) to verify from scratch.
2. Regenerate `database.types.ts` (R10) and re-run app typecheck.
3. Update `.ai/ERD.json`, `.ai/CHANGELOG.md` (per [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md)).
4. Promote via CI/CD (PLANNED) per [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md); never hand-edit prod (R9).

## 6. Examples

> All examples are **PLANNED** reference implementations. None of these files exist in the repo today.

**Browser client** (`src/lib/supabase/client.ts` — singleton, anon key, RLS-enforced):
```ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types'; // GENERATED — never hand-edit

// VITE_* vars are PUBLIC by contract — safe only because RLS is enforced (R5/R7).
export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
);
```

**Server client** (`src/lib/supabase/server.ts` — service role, server-only, RLS-bypassing):
```ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// SERVICE ROLE — server/Edge ONLY. NEVER import this into browser code (R4).
export const supabaseAdmin = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
```

**Index-safe RLS policy** (owner-scoped; `(select auth.uid())` is cached per-statement, R8):
```sql
alter table public.project enable row level security;

create policy "project_select_own"
  on public.project for select
  to authenticated
  using ( owner_id = (select auth.uid()) );

create index if not exists project_owner_id_idx on public.project (owner_id);
```

**Auth wiring keeps the component presentational** (R2):
```tsx
import { SocialLoginButton } from '@/components'; // presentational only
import { supabase } from '@/lib/supabase/client';

// App layer owns the side effect; the component just renders + emits onClick.
<SocialLoginButton
  provider="google"
  onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
/>;
```

**Edge Function** (`supabase/functions/notify/index.ts` — Deno; secrets from env, R11):
```ts
import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, // server trust, never shipped to browser
  );
  const { userId } = await req.json();
  const { error } = await supabase.from('notification').insert({ user_id: userId });
  return new Response(JSON.stringify({ ok: !error }), {
    headers: { 'Content-Type': 'application/json' },
    status: error ? 500 : 200,
  });
});
```

**Realtime subscription respecting RLS** (only rows the user can read stream through, R13):
```ts
const channel = supabase
  .channel('project:changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'project' }, (payload) => {
    // handle insert/update/delete
  })
  .subscribe();
// remember: channel.unsubscribe() on teardown
```

**Private Storage + signed URL** (bucket private by default, R14):
```ts
await supabase.storage.from('avatars').upload(`${userId}/photo.png`, file, { upsert: true });
const { data } = await supabase.storage.from('avatars').createSignedUrl(`${userId}/photo.png`, 60);
```

**`supabase/config.toml` (excerpt):**
```toml
project_id = "tds-app"      # PLANNED
[auth]
site_url = "http://localhost:5173"
[db]
major_version = 15
```

## 7. Validation Rules

> All gates below are **PLANNED**; they activate with the backend. The design system's existing gates
> (`npm run lint`, `npm run ds:build`, `npm run figma:build`, `plugin:test`) are **unaffected** by Supabase.

- **DS isolation gate** — The design-system package's runtime deps MUST remain `react` + `react-dom`. A CI check
  (PLANNED) fails if `@supabase/supabase-js` appears as a DS runtime dependency or is imported under
  `src/components/**` (enforces R1/R2). `npm run lint` (eslint flat config) can carry a `no-restricted-imports`
  rule banning `@supabase/*` inside `src/components/**`.
- **Secret-leak gate** — CI (PLANNED) greps the client bundle and `*.stories.tsx` for a service-role key /
  `SERVICE_ROLE` and fails on any hit (R4). No secret may be `VITE_`-prefixed.
- **RLS coverage** — A schema check (PLANNED, per [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md)) asserts every
  `public` table exposed to `anon`/`authenticated` has RLS enabled + at least one policy (R6). `supabase db lint`
  is part of this gate.
- **Migration integrity** — `supabase db reset` must rebuild the DB from `supabase/migrations/` cleanly; drift
  between hosted schema and migrations fails the gate (R9).
- **Type freshness** — `database.types.ts` MUST match the current migrations; CI (PLANNED) regenerates and diffs
  (R10). A non-empty diff fails.
- **RLS/DB tests** — pgTAP via `supabase test db` (PLANNED) asserts policies actually deny cross-tenant reads and
  that predicates hit indexes (`explain` no seq-scan on hot paths, R8). See [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md).
- **Manifest schema** — `.ai/ERD.json` and `.ai/API_SPEC.json` validate against
  [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md); they stay `"status":"planned"` until real (R15).

## 8. Checklist

- [ ] Backend work is **explicitly authorized** by the task (else stop — see the STATUS banner).
- [ ] Supabase deps/clients added **outside** the DS package; `src/components/**` imports **no** `@supabase/*` (R1/R2).
- [ ] Exactly one browser client and one server client module; features import the singleton (R3).
- [ ] Service-role key is server/Edge only; **never** `VITE_`-prefixed, never in Storybook (R4/R5).
- [ ] Every exposed table has RLS enabled + explicit policies (R6/R7).
- [ ] RLS predicates use `(select auth.uid())` and filtered columns are indexed (R8).
- [ ] Schema changes are migrations under `supabase/migrations/`; prod is never hand-edited (R9).
- [ ] `database.types.ts` regenerated after the migration; not hand-edited (R10).
- [ ] Privileged/secret logic is an Edge Function; secrets read from env, never committed (R11/R12).
- [ ] Realtime enabled only where needed; channels RLS-scoped (R13).
- [ ] Storage buckets private by default; access via policies + signed URLs (R14).
- [ ] `SocialLogin`/`SocialLoginButton` stay presentational; auth side effects live in the app layer (R2/D).
- [ ] `.ai/ERD.json` / `.ai/API_SPEC.json` updated; `.ai/CHANGELOG.md` recorded; still labeled correctly (R15).

## 9. Failure Recovery

| Symptom | Diagnosis | Fix | Resume |
| --- | --- | --- | --- |
| Data readable across tenants | RLS missing/disabled or policy too broad (R6/R7) | Enable RLS; tighten policy to `(select auth.uid())` owner scope; add pgTAP test | Re-run `supabase test db`; verify deny |
| Service-role key found in browser bundle | Key `VITE_`-prefixed or imported into client code (R4) | Rotate the key immediately; move to server/Edge; remove `VITE_` | Re-run secret-leak gate; audit git history |
| Queries slow at scale | Un-indexed RLS predicate or `auth.uid()` re-evaluated per row (R8) | Add index; wrap `(select auth.uid())`; check `explain` | Load test; see [23_PERFORMANCE_GUIDE.md](./23_PERFORMANCE_GUIDE.md) |
| "too many connections" under load | Direct connections instead of pooler | Route through Supavisor/pooler (transaction mode) for serverless | Re-run load test (§12) |
| App typecheck breaks after migration | `database.types.ts` stale (R10) | Regenerate with `supabase gen types typescript` | Re-run app typecheck |
| DS build/lint suddenly needs Supabase | A backend import leaked into `src/components/**` (R1/R2) | Remove the import; move wiring to app layer | `npm run lint` + `npm run ds:build` pass |
| Edge Function 500s on secret | Secret not set in the Function env (R11) | `supabase secrets set …`; redeploy | Re-invoke function |
| Realtime leaks unauthorized rows | Subscribed to a table without proper RLS (R13) | Fix table RLS; scope channel | Verify only permitted rows stream |

**Resume after context loss:** read [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md) and
[.ai/TASKS.json](../../.ai/TASKS.json) ([28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md)), then
[.ai/ERD.json](../../.ai/ERD.json) + [.ai/API_SPEC.json](../../.ai/API_SPEC.json) for backend state. If both are
still `"status":"planned"`, the backend does not exist yet — do not fabricate it.

## 10. Dependencies

- **Docs** — [00_MASTER_RULES.md](./00_MASTER_RULES.md), [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md),
  [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [15_API_GUIDE.md](./15_API_GUIDE.md),
  [16_NODE_GUIDE.md](./16_NODE_GUIDE.md), [18_FOLDER_STRUCTURE.md](./18_FOLDER_STRUCTURE.md),
  [21_ARCHITECTURE_GUIDE.md](./21_ARCHITECTURE_GUIDE.md), [22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md),
  [23_PERFORMANCE_GUIDE.md](./23_PERFORMANCE_GUIDE.md), [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md),
  [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md), [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md),
  [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md), [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md).
- **Manifests** — [.ai/ERD.json](../../.ai/ERD.json), [.ai/API_SPEC.json](../../.ai/API_SPEC.json) (both consumed;
  neither owned solely here), [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md), [.ai/DEPENDENCY_GRAPH.json](../../.ai/DEPENDENCY_GRAPH.json).
- **Source (PLANNED)** — `supabase/config.toml`, `supabase/migrations/`, `supabase/functions/`, `supabase/seed.sql`,
  `src/lib/supabase/{client.ts, server.ts, database.types.ts}`.
- **Existing repo touchpoints** — `SocialLogin` / `SocialLoginButton` in `src/components/` (presentational; future
  auth wiring point), the `@/*` alias (declared in `tsconfig.app.json` / `vite.config.ts`) used for the app-layer
  client import.

## 11. Template

**Minimal `src/lib/supabase/` skeleton (PLANNED — create only when authorized):**
```
src/lib/supabase/
  client.ts          # browser singleton — anon key, RLS-enforced (R3/R5)
  server.ts          # service-role singleton — server/Edge only (R3/R4)
  database.types.ts  # GENERATED via `supabase gen types typescript` — never hand-edit (R10)
```

**Migration + policy skeleton (`supabase/migrations/<ts>_<name>.sql`):**
```sql
create table public.<entity> (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users (id),
  created_at  timestamptz not null default now()
);
alter table public.<entity> enable row level security;               -- R6

create policy "<entity>_rw_own" on public.<entity>
  for all to authenticated
  using      ( owner_id = (select auth.uid()) )                       -- R8 (index-safe)
  with check ( owner_id = (select auth.uid()) );

create index if not exists <entity>_owner_id_idx on public.<entity> (owner_id);
```

**`.env.example` skeleton (documents contract; secrets never committed):**
```bash
# Public — safe in browser ONLY because RLS is enforced (R5)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
# Server/Edge ONLY — NEVER VITE_-prefixed, NEVER in the client bundle (R4)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

**`.ai/ERD.json` seed (stays planned until real, R15):**
```json
{
  "$schema": "./_schemas/ERD.schema.json",
  "version": "0.0.0",
  "generatedAt": "<ISO-8601>",
  "status": "planned",
  "generator": "future: derived from supabase/migrations + `supabase db dump`",
  "tables": []
}
```

## 12. Future Extension

- **Scaling to >10M users.** Route all serverless/Edge traffic through the **Supavisor** connection pooler
  (transaction mode) so millions of short-lived clients never exhaust Postgres connections. Add **read replicas**
  for read-heavy paths and keep writes on the primary. Keep RLS predicates index-safe (R8) — this is the single
  biggest lever. Partitioning, materialized views, and hot-path indexes are specified in
  [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md); a caching tier (e.g. Redis, PLANNED) sits in front per
  [23_PERFORMANCE_GUIDE.md](./23_PERFORMANCE_GUIDE.md).
- **Realtime at scale.** Prefer **Broadcast/Presence** over broad Postgres-Changes subscriptions; shard channels;
  apply per-connection and per-project limits. Never let Realtime become a firehose of every row change.
- **Multi-region & residency.** Future multi-region read replicas and data-residency requirements are additive and
  MUST NOT alter the client-creation contract (R3) or the RLS-first model (R7).
- **MCP integration.** A future MCP server ([35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md)) MAY expose
  read-only, RLS-scoped Supabase queries to AI agents — always through the anon/authenticated path, never the
  service role, and always reconciled against `.ai/ERD.json` / `.ai/API_SPEC.json`.
- **Governance.** Introducing Supabase is a major change gated by [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md) and
  logged per [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md). The invariant that survives every extension:
  **the design system never depends on the backend** (R1). Storybook and the Figma bundle keep building even if
  Supabase is down, absent, or replaced.
