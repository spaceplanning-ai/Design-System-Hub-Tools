# 14 — Database Guide

> **Title:** Database Guide
> **Purpose:** Define the PLANNED Postgres-via-Supabase database standard for the 10M-user future — schema & naming conventions, the migration model, Row Level Security, indexing, partitioning/scaling, and the `.ai/ERD.json` contract.
> **Status:** **PLANNED** — no backend, database, Supabase project, migrations directory, or `.env` exists in the repo today. This document is the forward standard, not a description of shipped code.
> **Owner:** AI OS
> **Last-reviewed:** _(placeholder — set on review)_
> **Precedence:** Subordinate to [00_MASTER_RULES.md](./00_MASTER_RULES.md). This guide governs a **future** layer; it MUST NOT introduce anything that mutates or contradicts the design-system source of truth. The database is **never** a source of design truth (that is Storybook + `*.meta.ts` + `src/tokens/*`, per the Source-of-Truth Hierarchy). Where this doc touches API/Node/Supabase/CI it is likewise **PLANNED** and defers to [15_API_GUIDE.md](./15_API_GUIDE.md), [16_NODE_GUIDE.md](./16_NODE_GUIDE.md), and [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md).

---

> **STATUS: PLANNED — no backend exists in the repo today.**
> The TDS repository currently ships **only** a metadata-driven frontend design system (React 18 + Vite 5 + Storybook 8), its token/manifest generators, and the Figma plugin. Runtime dependencies are **only** `react` + `react-dom`. There is no server, no Postgres, no Supabase, no `supabase/` directory, no migrations, no ORM, no connection string, and no `db:*` npm script. Every file path, script, and table named below is a **specification for future work**, to be created only when an approved task calls for a backend. Until then, this document is read as the binding standard for *how* that backend will be built.

---

## 1. Purpose

This document is the single authority for the **PLANNED** relational data layer of any application built on top of TDS. It specifies, in advance and in enforceable detail, how a Postgres database (provisioned and operated through **Supabase**) will be modeled, named, migrated, secured, indexed, and scaled to serve **beyond 10,000,000 users**.

It exists so that the *first* AI agent to build the backend does not improvise. Improvisation is the enemy the AI OS is built to eliminate: inconsistent naming, ad-hoc migrations, missing Row Level Security, unindexed hot paths, and schema drift between the database, the API contract ([15_API_GUIDE.md](./15_API_GUIDE.md)), and the frontend types. By fixing the standard now, every future schema change is a deterministic, reviewable, reversible operation rather than a fresh design decision.

The database layer feeds one machine-readable AI cache: **[.ai/ERD.json](../../.ai/ERD.json)** — the entity/relationship/index/policy index that lets agents answer data-model questions without reading raw SQL (see [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md) for the manifest system and [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md) for why manifest-first reading is mandatory).

This guide owns *what the schema standard is*. The Supabase platform surface (Auth, Storage, Edge Functions, Realtime, client wiring, RLS helper functions) is owned by [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md); the request/response contract over the data is owned by [15_API_GUIDE.md](./15_API_GUIDE.md).

---

## 2. Responsibilities

This specification owns, for the PLANNED database:

- The **schema & naming contract** — schemas, tables, columns, constraints, enums, functions, indexes, and their casing/pluralization rules.
- The **canonical column set** every table carries (surrogate key, timestamps, soft-delete, tenancy key, audit columns).
- The **migration model** — where migrations live (`supabase/migrations/`), how they are named, their forward-only + idempotent discipline, and how they are applied/rolled back.
- The **Row Level Security (RLS) mandate** — RLS enabled on every table in `public`, deny-by-default, tenancy- and ownership-scoped policies keyed on `auth.uid()`.
- The **indexing standard** — which indexes are mandatory (FKs, tenancy keys, sort/filter hot paths), and when to reach for partial, composite, covering, GIN, or BRIN indexes.
- The **partitioning & scaling strategy** for the 10M-user target — declarative partitioning, connection pooling (Supavisor/PgBouncer), read replicas, and the boundaries of vertical vs horizontal scale.
- The **[.ai/ERD.json](../../.ai/ERD.json) contract** — its JSON shape, update rules, and role as the AI-readable model index.

It does **not** own: platform/auth mechanics ([17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md)), API surface & versioning ([15_API_GUIDE.md](./15_API_GUIDE.md)), the Node service that talks to the DB ([16_NODE_GUIDE.md](./16_NODE_GUIDE.md)), security posture beyond RLS ([22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md)), query/runtime performance budgets ([23_PERFORMANCE_GUIDE.md](./23_PERFORMANCE_GUIDE.md)), or CI application of migrations ([25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)).

---

## 3. Scope

**In scope (PLANNED)**

- The Postgres schema standard: DDL conventions for tables, columns, types, constraints, enums, views, and functions in the `public` schema (and reserved `auth`, `storage` schemas owned by Supabase).
- The migration file format and lifecycle under the PLANNED `supabase/migrations/` directory.
- RLS policy patterns, tenancy model, and ownership predicates.
- Indexing, partitioning, pooling, and replica strategy for high scale.
- The `.ai/ERD.json` manifest shape and generation rule.
- The PLANNED npm scripts (`db:migrate`, `db:reset`, `db:seed`, `erd:build`) that will orchestrate the above.

**Out of scope**

- Any change to the design system, tokens (`src/tokens/*`), components (`src/components/*`), `*.meta.ts` metas, the Figma bundle (`figma/tds.plugin.json`), or the generators under `scripts/`. **The database layer touches none of these.**
- Auth flows, Storage buckets, Edge Functions, Realtime channels — [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md).
- The transport contract and endpoint versioning — [15_API_GUIDE.md](./15_API_GUIDE.md).
- Non-relational stores, analytics warehouses, or search engines (e.g. a future OLAP/CDC pipeline) — not part of this standard until separately specified.

---

## 4. Rules

Rules are enforceable and phrased MUST / SHOULD / NEVER. They apply the moment the backend is created.

1. **MUST provision Postgres exclusively through Supabase.** No self-managed Postgres, no alternate provider, unless a separate approved task changes this standard. The target is Postgres 15+ as offered by Supabase.
2. **NEVER let the database become a source of design truth.** Design decisions (color, spacing, typography, variants) live only in `src/tokens/*` and `*.meta.ts`. Tables MUST NOT store token values, variant definitions, or component structure as authoritative data. (Design Lock, [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md).)
3. **MUST name in `snake_case`.** Tables are **plural** nouns (`organizations`, `projects`, `board_members`); columns are singular `snake_case` (`created_at`, `owner_id`). Enums are singular (`project_status`). Booleans read as predicates (`is_archived`, `has_seat`). NEVER use camelCase or quoted mixed-case identifiers in DDL.
4. **MUST give every table a surrogate primary key `id uuid primary key default gen_random_uuid()`.** NEVER expose sequential integer PKs across a tenant boundary (enumeration risk). Natural keys become `unique` constraints, not the PK.
5. **MUST include the canonical audit columns** on every mutable table: `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()` (maintained by a shared `set_updated_at()` trigger). Soft-deletable tables add `deleted_at timestamptz` and are filtered `deleted_at is null` — NEVER hard-delete tenant data on the user path.
6. **MUST scope multi-tenant tables by a tenancy key** (`org_id uuid not null references organizations(id)` or equivalent) so RLS and partitioning have a single dimension to key on.
7. **MUST enable RLS on every table in `public`** (`alter table … enable row level security`) and MUST author explicit policies. A table with RLS enabled and **no** policy denies all access — that is the intended deny-by-default posture. NEVER ship a `public` table with RLS disabled.
8. **MUST express foreign keys explicitly** with `references … (id)` and an explicit `on delete` action (`cascade`, `restrict`, or `set null` — chosen deliberately, documented in the migration). NEVER rely on application-only referential integrity.
9. **MUST index every foreign key and every tenancy key.** Postgres does not auto-index FK columns; unindexed FKs cause slow joins and lock escalation at scale.
10. **MUST deliver schema change only via a migration file** in `supabase/migrations/`. NEVER mutate a live database by hand or through the Supabase Studio SQL editor as the system of record. Migrations are forward-only, append-only, and never edited after they are applied to any shared environment.
11. **MUST make destructive migrations reversible or gated.** A migration that drops/renames a column MUST ship an expand→migrate→contract sequence across releases (see §5) rather than a single breaking step, per [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md).
12. **MUST regenerate and commit [.ai/ERD.json](../../.ai/ERD.json)** in the same change as any schema migration (PLANNED `npm run erd:build`). The ERD manifest is a derived artifact and MUST match the migrated schema.
13. **NEVER store secrets, tokens, or plaintext credentials in table columns.** Secrets live in Supabase Vault / environment config ([22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md)). Password hashing and session storage are owned by Supabase Auth, not application tables.
14. **SHOULD prefer `timestamptz`, `text` (with `check` constraints) over `varchar(n)`, `numeric` for money, `jsonb` for schemaless attributes, and native `enum` types for closed sets.** NEVER use `timestamp` (without zone) or `money`.
15. **MUST keep the DB schema, the API contract ([.ai/API_SPEC.json](../../.ai/API_SPEC.json)), and generated TypeScript types in sync.** A column rename is a coordinated change across all three (Frontend/Backend/Database sync goal, [21_ARCHITECTURE_GUIDE.md](./21_ARCHITECTURE_GUIDE.md)).

---

## 5. Workflow

Step-by-step for the PLANNED backend. Real, existing scripts (`ds:build`, `figma:build`, `lint`) are untouched by DB work; the `db:*`/`erd:build` scripts below are **PLANNED** additions to `package.json`.

**5.1 One-time bootstrap (first backend task only)**
1. Add the Supabase toolchain as a dev dependency and initialize `supabase/` (creates `supabase/config.toml`, `supabase/migrations/`, `supabase/seed.sql`). See [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md) and [34_PROJECT_BOOTSTRAP.md](./34_PROJECT_BOOTSTRAP.md).
2. Add PLANNED scripts to `package.json`: `db:migrate` (apply pending migrations), `db:reset` (drop + re-apply from zero for local dev), `db:seed` (load `supabase/seed.sql`), `erd:build` (regenerate `.ai/ERD.json` from the live/local schema).
3. Author the base migration: shared functions (`set_updated_at()`), the `organizations` + `users`/profiles tenancy spine, and the deny-by-default RLS bootstrap.

**5.2 Per schema change (steady state)**
1. **Read first.** Consult [.ai/ERD.json](../../.ai/ERD.json) (not raw SQL) to understand current entities, then [15_API_GUIDE.md](./15_API_GUIDE.md) for any contract impact. (Read-before-write, [01_AI_SPECIFICATION.md](./01_AI_SPECIFICATION.md).)
2. **Create a new migration** — never edit an applied one. File name: `YYYYMMDDHHMMSS_short_description.sql` (UTC timestamp prefix, `snake_case` description).
3. **Write DDL** following §4 rules: table with canonical columns, FKs indexed, `enable row level security`, explicit policies, indexes, and the `set_updated_at` trigger.
4. **Apply locally** with `npm run db:reset` (clean rebuild) or `npm run db:migrate` (incremental), and verify with a smoke query.
5. **Regenerate** `.ai/ERD.json` via `npm run erd:build`; regenerate TypeScript DB types (Supabase codegen) into the API/Node layer per [16_NODE_GUIDE.md](./16_NODE_GUIDE.md).
6. **Validate** (see §7): naming lint, RLS-enabled check, FK-index check, migration-idempotency check, ERD-in-sync check.
7. **Review** against [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md) drift gates; update [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md) and, for breaking changes, follow the expand/contract path in [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md).
8. **Commit** the migration, the regenerated `.ai/ERD.json`, and the regenerated types together in one change.

**5.3 Breaking change (expand → migrate → contract)**
- **Expand:** add the new column/table alongside the old; backfill in a batched, idempotent migration. Both shapes coexist.
- **Migrate:** switch API + frontend reads/writes to the new shape; dual-write during the transition window.
- **Contract:** in a later, separately-approved migration, drop the old column/table. Never expand and contract in the same release.

---

## 6. Examples

Concrete, repo-relative, PLANNED SQL that embodies the standard. These illustrate the *conventions*; the exact entity set is defined per approved task and reflected in `.ai/ERD.json`.

**6.1 Shared trigger function + tenancy spine** (`supabase/migrations/20260901120000_init_core.sql`)

```sql
-- Shared: keep updated_at fresh on every row update.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Tenancy root.
create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null check (length(name) between 1 and 200),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

alter table public.organizations enable row level security;
```

**6.2 A tenant-scoped table with FK + tenancy indexes**

```sql
create type public.project_status as enum ('draft', 'active', 'archived');

create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  owner_id    uuid not null references auth.users(id) on delete restrict,
  name        text not null check (length(name) between 1 and 200),
  status      public.project_status not null default 'draft',
  settings    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- Rule 9: index every FK + tenancy key. Partial index skips soft-deleted rows.
create index projects_org_id_idx    on public.projects (org_id) where deleted_at is null;
create index projects_owner_id_idx  on public.projects (owner_id);
-- Composite index for the hot "list active projects in an org, newest first" path.
create index projects_org_status_created_idx
  on public.projects (org_id, status, created_at desc) where deleted_at is null;

alter table public.projects enable row level security;
```

**6.3 Row Level Security — deny-by-default, membership-scoped**

```sql
-- Assumes a public.org_members(org_id, user_id, role) join table also under RLS.
-- SELECT: any member of the org may read non-deleted projects.
create policy projects_select_member on public.projects
  for select using (
    deleted_at is null
    and exists (
      select 1 from public.org_members m
      where m.org_id = projects.org_id and m.user_id = auth.uid()
    )
  );

-- INSERT: the caller must be a member of the target org and set themselves as owner.
create policy projects_insert_member on public.projects
  for insert with check (
    owner_id = auth.uid()
    and exists (
      select 1 from public.org_members m
      where m.org_id = projects.org_id and m.user_id = auth.uid()
    )
  );

-- UPDATE: only the owner (extend with role checks as needed).
create policy projects_update_owner on public.projects
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
```

**6.4 Declarative partitioning for a high-volume append table (10M-user scale)**

```sql
-- Events/audit rows dwarf entity rows at scale. Partition by month by range.
create table public.activity_events (
  id          uuid not null default gen_random_uuid(),
  org_id      uuid not null,
  actor_id    uuid,
  kind        text not null,
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  primary key (id, created_at)          -- partition key MUST be in the PK
) partition by range (created_at);

create table public.activity_events_2026_09
  partition of public.activity_events
  for values from ('2026-09-01') to ('2026-10-01');

create index activity_events_2026_09_org_idx
  on public.activity_events_2026_09 (org_id, created_at desc);

alter table public.activity_events enable row level security;
```

**6.5 `.ai/ERD.json` (excerpt — the AI-readable model index)**

```json
{
  "$schema": "./schemas/erd.schema.json",
  "version": "0.1.0",
  "generatedAt": "PLANNED",
  "status": "planned",
  "generator": "npm run erd:build (planned)",
  "database": { "engine": "postgres", "platform": "supabase", "schema": "public" },
  "entities": [
    {
      "name": "projects",
      "primaryKey": "id",
      "tenancyKey": "org_id",
      "softDelete": "deleted_at",
      "columns": [
        { "name": "id", "type": "uuid", "nullable": false },
        { "name": "org_id", "type": "uuid", "nullable": false, "references": "organizations.id" },
        { "name": "owner_id", "type": "uuid", "nullable": false, "references": "auth.users.id" },
        { "name": "status", "type": "project_status", "nullable": false, "default": "draft" }
      ],
      "indexes": [
        { "name": "projects_org_status_created_idx", "columns": ["org_id", "status", "created_at desc"], "partial": "deleted_at is null" }
      ],
      "rls": { "enabled": true, "policies": ["projects_select_member", "projects_insert_member", "projects_update_owner"] }
    }
  ],
  "enums": [{ "name": "project_status", "values": ["draft", "active", "archived"] }],
  "relationships": [
    { "from": "projects.org_id", "to": "organizations.id", "type": "many-to-one", "onDelete": "cascade" }
  ]
}
```

---

## 7. Validation Rules

How compliance is checked. All mechanisms below are **PLANNED** (no test framework, CI, or `db:*` scripts exist yet — see [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md), [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)).

1. **Naming lint** — a schema linter (e.g. a SQL check step) MUST reject non-`snake_case` identifiers, non-plural table names, `timestamp`-without-zone columns, and integer PKs.
2. **RLS-enabled gate** — a query over `pg_tables` / `pg_class` MUST assert every table in `public` has `relrowsecurity = true` **and** at least one policy in `pg_policies`. Failure blocks merge.
3. **FK-index gate** — for every FK constraint, assert a covering index exists (join `pg_constraint` against `pg_index`). Unindexed FK ⇒ fail (Rule 9).
4. **Migration idempotency / replay** — `npm run db:reset` (PLANNED) MUST apply every migration from zero on a clean database with no error, proving the full history replays deterministically ([28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md) idempotency principle).
5. **ERD-in-sync check** — `npm run erd:build` (PLANNED) MUST produce a `.ai/ERD.json` byte-identical to the committed one; a diff means the manifest was not regenerated (Rule 12).
6. **Type-sync check** — regenerated Supabase TypeScript types MUST match the committed types consumed by the Node/API layer ([16_NODE_GUIDE.md](./16_NODE_GUIDE.md)).
7. **Policy smoke tests** — PLANNED integration tests assert that a member can read, a non-member cannot, and an anonymous role is denied — the deny-by-default guarantee (Rule 7).
8. **Schema-drift check** — CI ([25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)) compares the live schema against the applied migration history; any divergence (hand-edit in Studio) fails, enforcing Rule 10.

---

## 8. Checklist

Per schema change (PLANNED):

- [ ] Read `.ai/ERD.json` and relevant sibling docs before writing SQL.
- [ ] New migration file `YYYYMMDDHHMMSS_description.sql`; no applied migration edited.
- [ ] Table has `id uuid` PK, `created_at`/`updated_at`, soft-delete where applicable, tenancy key where applicable.
- [ ] `set_updated_at` trigger attached to every mutable table.
- [ ] Every FK declared with explicit `on delete`; every FK + tenancy key indexed.
- [ ] Hot query paths covered by composite/partial indexes; no speculative indexes.
- [ ] `enable row level security` + explicit policies (select/insert/update/delete) keyed on `auth.uid()`.
- [ ] Enums/constraints used for closed sets; `timestamptz` not `timestamp`; `numeric` for money.
- [ ] No secrets/credentials/token values stored in columns.
- [ ] `npm run db:reset` replays cleanly; policy smoke tests pass.
- [ ] `npm run erd:build` run; `.ai/ERD.json` and generated types committed together.
- [ ] Breaking change follows expand→migrate→contract; `.ai/CHANGELOG.md` updated.

---

## 9. Failure Recovery

Symptom → diagnosis → fix → resume.

- **Symptom: a query returns zero rows for a legitimately-authorized user.** Diagnosis: RLS policy predicate too strict, or the membership/tenancy join is missing. Fix: inspect `pg_policies`; verify `auth.uid()` resolves (JWT present) and the `org_members` row exists; add/relax the `using` clause in a **new** migration. Resume: re-run policy smoke tests, then §5.2 step 6.
- **Symptom: table returns rows to the wrong tenant.** Diagnosis: RLS disabled or a policy missing a tenancy predicate (critical security defect). Fix: enable RLS immediately, add the org-scoped `using`/`with check` clause, audit access logs. Escalate per [22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md). Resume only after the RLS-enabled gate passes.
- **Symptom: slow list query at scale.** Diagnosis: `EXPLAIN (ANALYZE)` shows a seq scan or an unindexed FK/sort. Fix: add the composite/partial index matching the `where`/`order by`; consider partitioning a large append table (§6.4). Resume: re-check FK-index gate + performance budget ([23_PERFORMANCE_GUIDE.md](./23_PERFORMANCE_GUIDE.md)).
- **Symptom: `db:reset` fails midway.** Diagnosis: a migration is non-idempotent or out of order (references an object created later). Fix: correct the offending migration only if it has **not** been applied to a shared env; otherwise add a corrective forward migration. Resume: replay from zero (Validation §4).
- **Symptom: `.ai/ERD.json` diff in CI.** Diagnosis: schema changed but the manifest wasn't regenerated. Fix: `npm run erd:build`, commit. Resume: ERD-in-sync gate.
- **Symptom: connection exhaustion under load.** Diagnosis: too many direct connections bypassing the pooler. Fix: route all app traffic through Supavisor/PgBouncer in transaction mode; cap per-instance pools (§12, [23_PERFORMANCE_GUIDE.md](./23_PERFORMANCE_GUIDE.md)). Resume after load re-test.

---

## 10. Dependencies

This guide relies on / is relied upon by:

- **[00_MASTER_RULES.md](./00_MASTER_RULES.md)** — constitution, precedence, Generated-Is-Sacred, Design Lock (the DB never overrides design source).
- **[15_API_GUIDE.md](./15_API_GUIDE.md)** — the API contract over this schema; keeps `.ai/API_SPEC.json` in sync with `.ai/ERD.json`.
- **[16_NODE_GUIDE.md](./16_NODE_GUIDE.md)** — the Node/TS service that connects, migrates, and generates DB types.
- **[17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md)** — Auth/Storage/Edge Functions/Realtime, RLS helper context, client patterns.
- **[22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md)** — secrets, RLS as the primary authz boundary, threat model.
- **[23_PERFORMANCE_GUIDE.md](./23_PERFORMANCE_GUIDE.md)** — query budgets, pooling, replica strategy, 10M-user scaling.
- **[21_ARCHITECTURE_GUIDE.md](./21_ARCHITECTURE_GUIDE.md)** — Frontend/Backend/Database sync; where the data layer sits.
- **[24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md)** / **[25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)** — the PLANNED test + CI gates that run the validations in §7.
- **[27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md)** — the schema/update/read rules for **[.ai/ERD.json](../../.ai/ERD.json)** and **[.ai/API_SPEC.json](../../.ai/API_SPEC.json)**.
- **[31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md)** — expand/migrate/contract, deprecation, `.ai/CHANGELOG.md` discipline.
- Manifests: **[.ai/ERD.json](../../.ai/ERD.json)** (owned here), **[.ai/API_SPEC.json](../../.ai/API_SPEC.json)**, **[.ai/DEPENDENCY_GRAPH.json](../../.ai/DEPENDENCY_GRAPH.json)**.

---

## 11. Template

Copy-paste skeleton for a new tenant-scoped table migration (PLANNED — save under `supabase/migrations/YYYYMMDDHHMMSS_add_<table>.sql`):

```sql
-- Migration: add public.<table_plural>
-- Depends on: public.organizations, public.set_updated_at(), public.org_members

create table public.<table_plural> (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  -- <domain columns: text/jsonb/enum with check constraints> --
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create trigger <table_plural>_set_updated_at
  before update on public.<table_plural>
  for each row execute function public.set_updated_at();

create index <table_plural>_org_id_idx
  on public.<table_plural> (org_id) where deleted_at is null;
-- add composite indexes for known hot query paths here --

alter table public.<table_plural> enable row level security;

create policy <table_plural>_select_member on public.<table_plural>
  for select using (
    deleted_at is null
    and exists (select 1 from public.org_members m
                where m.org_id = <table_plural>.org_id and m.user_id = auth.uid())
  );
-- add insert / update / delete policies to complete deny-by-default coverage --
```

`.ai/ERD.json` entity stub to add in the same change:

```json
{
  "name": "<table_plural>",
  "primaryKey": "id",
  "tenancyKey": "org_id",
  "softDelete": "deleted_at",
  "columns": [],
  "indexes": [],
  "rls": { "enabled": true, "policies": [] }
}
```

---

## 12. Future Extension

How this standard scales for years and beyond 10,000,000 users:

- **Vertical first, then read replicas.** Supabase compute scales up cleanly; the first lever is instance size. Next, route read-heavy traffic to Postgres **read replicas** while writes hit the primary — the API layer ([15_API_GUIDE.md](./15_API_GUIDE.md)) picks a connection by read/write intent.
- **Connection pooling is mandatory at scale.** All application traffic flows through **Supavisor** (or PgBouncer) in transaction mode; direct connections are reserved for migrations. This is the single biggest guard against connection exhaustion for a 10M-user fleet.
- **Partition the append-heavy tables.** Events, audit logs, notifications, and activity feeds grow without bound; range-partition by time (§6.4) and automate partition creation + retention/detachment. Entity tables stay unpartitioned until a measured need.
- **Tenant sharding as the horizontal ceiling.** When a single primary can no longer hold all tenants, shard by `org_id` across databases; because every tenant table already carries `org_id` (Rule 6), the routing key exists from day one — no reshape required.
- **Hot/cold tiering.** Move cold partitions to cheaper storage / detach to an OLAP/warehouse via CDC; the OLTP schema stays lean. (A warehouse/CDC pipeline is a separately-specified future standard, not this doc.)
- **Advisory & materialized layers.** Introduce materialized views for expensive aggregates (dashboards) with scheduled refresh; add GIN indexes for `jsonb`/full-text search as query patterns demand.
- **The ERD stays the contract.** However far the physical layout evolves — replicas, partitions, shards — **[.ai/ERD.json](../../.ai/ERD.json)** remains the single AI-readable logical model, keeping agents, the API contract, and the frontend in permanent sync (the AI OS resume-after-context-loss and no-drift guarantees).
