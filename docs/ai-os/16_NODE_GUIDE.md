# 16 — Node Guide

> **STATUS: PLANNED — no backend exists in the repo today.** TDS ships **only** a frontend
> design system. `package.json` declares exactly two runtime dependencies — `react` and
> `react-dom` — no server, no HTTP framework, no process entrypoint, no `api:*` npm script.
> Everything in this document describes the **future** Node ≥20 / TypeScript service standard
> that will sit beside the design system and compose with Supabase. Nothing here may be
> implemented on AI initiative; it is built only when a task explicitly requests a backend.
>
> **Title:** Node Guide
> **Purpose:** Define the conventions for the PLANNED Node ≥20 / TypeScript backend service — project structure, runtime, packaging, configuration/env, logging & observability — and how it composes with Supabase without disturbing the design-system source of truth.
> **Status:** PLANNED
> **Owner:** AI OS
> **Last-reviewed:** _(placeholder — set on review)_
> **Precedence:** Subordinate to [00_MASTER_RULES.md](./00_MASTER_RULES.md). This doc governs the **server tier only**. It has **no authority** over design source-of-truth (`*.meta.ts`, `src/tokens/*`, Storybook) or generated outputs (`figma/`, `src/generated/`, `src/tokens/generated/`). Where it overlaps API shape, data model, Supabase, or CI it defers to [15_API_GUIDE.md](./15_API_GUIDE.md), [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md), and [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md) respectively.

---

## 1. Purpose

This document is the single authority for **how a Node backend service is structured, run, packaged, configured, and observed** in the TDS repository — for the day one is added. Today TDS is a pure metadata-driven **frontend**: React 18 + Vite 5 + TypeScript 5 + Storybook 8, whose `*.meta.ts` files and TypeScript tokens generate the Figma bundle `figma/tds.plugin.json`. The only runtime dependencies are `react` and `react-dom`; every other tool (`tsx`, `esbuild`, `vite`, `storybook`, `eslint`, `prettier`, `typescript`) is a dev dependency. There is **no** server process, database client, `.env`, or CI pipeline in the tree.

When a backend becomes required, it MUST be introduced as a **separate, additive service** that:

1. Never alters, imports from, or couples to the design-system source of truth or its generated outputs.
2. Inherits the repo's existing runtime and language contract — **Node ≥20** (`package.json` → `engines.node: ">=20"`), **ESM** (`"type": "module"`), **TypeScript 5 `strict`**, and the repo's Prettier/ESLint rules.
3. Composes with **Supabase** (Postgres + Auth + RLS + Storage + Edge Functions + Realtime) as the persistence and auth substrate — see [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md).
4. Is engineered from day one to scale beyond **10,000,000 users** (stateless nodes, connection pooling, read replicas, cache tiers — details in [23_PERFORMANCE_GUIDE.md](./23_PERFORMANCE_GUIDE.md)).

This guide owns the **Node/TypeScript service mechanics**: folder layout, entrypoint and runtime, packaging/bundling, configuration & secrets loading, structured logging, and observability. It intentionally does **not** own API contract shape ([15_API_GUIDE.md](./15_API_GUIDE.md)), schema/RLS ([14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md)), or CI/CD wiring ([25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)).

---

## 2. Responsibilities

This specification owns, for the PLANNED service:

- **Canonical placement** — where the Node service lives in the repo (`services/api/`), and why it must not pollute `src/`.
- **Runtime contract** — Node ≥20, ESM, `tsx` in dev, compiled/bundled JS in prod; how the process boots and shuts down.
- **Project structure** — the internal folder layout of `services/api/src/` (layers: `config/`, `routes/`, `handlers/`, `services/`, `db/`, `lib/`, `middleware/`, `observability/`).
- **Packaging** — how the service is built (esbuild, already a dev dep) and containerized, and what the deployable artifact is.
- **Configuration & environment** — the `env` schema, validation-at-boot, secret handling, and the `.env`/`.env.example` contract (all PLANNED; no `.env` exists today).
- **Logging & observability** — structured JSON logs, request tracing, metrics, health/readiness endpoints, and error taxonomy.
- **Composition with Supabase** — server-side client construction (service-role vs anon), RLS-respecting request context, and where the boundary sits.
- **The service's contribution to `.ai/` manifests** — it is described by [.ai/API_SPEC.json](../../.ai/API_SPEC.json) and [.ai/ERD.json](../../.ai/ERD.json), both currently `"status": "planned"`.

It does **not** own: the exact route/verb/DTO contracts ([15_API_GUIDE.md](./15_API_GUIDE.md)), the SQL schema, migrations, indexes, or RLS policies ([14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md)), Supabase project provisioning ([17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md)), the test pyramid ([24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md)), or pipeline/release automation ([25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md), [32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md)).

---

## 3. Scope

**In scope**
- The planned Node/TypeScript service root `services/api/` and its internal layering.
- Runtime, entrypoint, graceful lifecycle, and packaging (dev via `tsx`, prod via `esbuild` bundle or `tsc` emit).
- Environment/config loading, validation, and secret hygiene at the process boundary.
- Structured logging, request-scoped tracing, metrics, and health/readiness probes.
- Server-side Supabase client construction and the service↔database boundary as it pertains to Node mechanics.
- The PLANNED npm scripts (`api:dev`, `api:build`, `api:start`, `api:typecheck`, `api:test`) and how they mirror existing conventions.

**Out of scope**
- Anything in the **existing** frontend: `src/components/`, `src/tokens/`, `src/core/`, `.storybook/`, the `scripts/build-*.ts` generators, and the Figma plugin under `figma/plugin/`. The Node service MUST NOT import from these or be imported by them.
- API endpoint contracts, versioning, and DTOs → [15_API_GUIDE.md](./15_API_GUIDE.md).
- Database schema, migrations, RLS, indexing, ERD → [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md).
- Supabase Auth/Storage/Realtime/Edge Functions specifics → [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md).
- CI/CD, environments, IaC → [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md).

---

## 4. Rules

Rules are enforceable and phrased **MUST / SHOULD / NEVER**. All apply **only** to the PLANNED service; none authorizes creating it without an explicit request.

1. **NEVER create the backend on AI initiative.** The service is scaffolded only when a task explicitly requests a backend/API. Absent that, this doc is reference-only. (Design Lock & scope discipline, [00_MASTER_RULES.md](./00_MASTER_RULES.md).)
2. **MUST live under `services/api/`**, isolated from `src/`. The Node service is a distinct package/workspace with its own `package.json`, `tsconfig.json`, and dependency set. It MUST NOT be added to the root `dependencies` (which stay `react` + `react-dom`).
3. **MUST target Node ≥20 and ESM.** `services/api/package.json` MUST set `"type": "module"` and `"engines": { "node": ">=20" }`, matching the root contract.
4. **MUST be TypeScript `strict`.** Inherit the repo's compiler posture: `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`/`isolatedModules`, `moduleResolution: "bundler"` (or `"nodenext"` if native ESM resolution is chosen — declare it once and keep it consistent). See [19_CODE_CONVENTION.md](./19_CODE_CONVENTION.md).
5. **MUST obey the repo Prettier/ESLint rules.** Prettier: `semi: true`, `singleQuote: true`, `trailingComma: "all"`, `printWidth: 100`, `tabWidth: 2`, `arrowParens: "always"`. ESLint: extend the flat config with `@typescript-eslint/consistent-type-imports` and `no-unused-vars` (`^_` ignore). The service's files MUST be reachable by `npm run lint`/`npm run format` or the service defines equivalents scoped to `services/api/`.
6. **NEVER hardcode secrets or config.** No URLs, keys, tokens, or connection strings in source. All configuration flows through the validated `env` module (Rule 12). `.env*` files (except `.env.example`) MUST be gitignored — the root `.gitignore` already ignores `*.local` and `*.log`; the service MUST add `.env` / `.env.*` exclusions.
7. **MUST validate configuration at boot and fail fast.** The process MUST parse and validate every required env var **before** binding a port; on any missing/invalid value it MUST log a structured fatal error and `process.exit(1)`. No lazy/first-request discovery of missing config.
8. **MUST keep the process stateless.** No in-memory session, no local-disk persistence as source of truth, no sticky affinity assumptions. State lives in Supabase/Postgres and (planned) a shared cache. This is a hard requirement for horizontal scale to >10M users ([23_PERFORMANCE_GUIDE.md](./23_PERFORMANCE_GUIDE.md)).
9. **MUST emit structured JSON logs** to stdout/stderr (one JSON object per line), never `console.log` string soup. Each log line MUST carry a `requestId`/trace id when request-scoped. Logs MUST NEVER contain secrets, raw auth tokens, or full PII.
10. **MUST expose liveness and readiness** endpoints (`GET /healthz` liveness, `GET /readyz` readiness that checks the Supabase/DB connection). These MUST be unauthenticated and cheap.
11. **MUST separate the two Supabase clients.** A **service-role** client (elevated, bypasses RLS) is constructed once, used only in trusted server paths, and its key NEVER leaves the server. A **request-scoped** client carries the caller's JWT so **RLS is enforced** for user-context queries. Defaults to the RLS-respecting client; service-role is opt-in and audited. Details in [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md) and [22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md).
12. **MUST implement graceful shutdown.** On `SIGTERM`/`SIGINT` the process stops accepting new connections, drains in-flight requests within a bounded timeout, closes DB/pool handles, flushes logs, then exits `0`.
13. **NEVER couple to the design system.** The service MUST NOT import `@/components`, `@tokens/*`, `@core/*`, or any `src/**` module, and MUST NOT read/write `figma/`, `src/generated/`, or `src/tokens/generated/`. It is a peer service, not a consumer of design source.
14. **MUST version the HTTP surface** (e.g. `/v1/...`) per [15_API_GUIDE.md](./15_API_GUIDE.md); the Node layer only wires the version prefix — the contract itself is owned there.
15. **SHOULD prefer thin handlers over fat ones.** Route handlers validate input and delegate to a `services/` (domain) layer; the domain layer talks to `db/` (Supabase/Postgres). No SQL or business logic inline in a route.

---

## 5. Workflow

Step-by-step to **scaffold and run** the PLANNED service. Every step is gated on an explicit request (Rule 1). Real existing scripts are referenced; new ones are marked **(PLANNED script)**.

**Phase A — decide & record**
1. Confirm the task explicitly asks for a backend/API. If not, stop and cite Rule 1.
2. Read the contract owners first: [15_API_GUIDE.md](./15_API_GUIDE.md) (surface), [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md) (schema/ERD), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md) (auth/RLS), and the manifests [.ai/API_SPEC.json](../../.ai/API_SPEC.json) + [.ai/ERD.json](../../.ai/ERD.json).
3. Record intent in [.ai/TASKS.json](../../.ai/TASKS.json) and [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md) per [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md).

**Phase B — scaffold**
4. Create `services/api/` with its own `package.json` (`"type": "module"`, `"engines.node": ">=20"`), `tsconfig.json` (extends root posture), and dependency set (framework + `@supabase/supabase-js` + a logger + a schema validator). Add `.env.example`; gitignore `.env`/`.env.*`.
5. Create the internal layout (see §11 Template): `src/config/`, `src/lib/`, `src/db/`, `src/middleware/`, `src/routes/`, `src/handlers/`, `src/services/`, `src/observability/`, and `src/index.ts` (entrypoint).
6. Add the **(PLANNED)** scripts to `services/api/package.json`:
   - `api:dev` → `tsx watch src/index.ts` (mirrors how the repo already runs TS via `tsx`).
   - `api:build` → `esbuild src/index.ts --bundle --platform=node --format=esm --target=node20 --outfile=dist/server.js` (esbuild is already a repo dev dep; mirrors `plugin:build`).
   - `api:start` → `node dist/server.js`.
   - `api:typecheck` → `tsc -p tsconfig.json --noEmit` (mirrors `plugin:typecheck`).
   - `api:test` → PLANNED per [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md) (no test framework exists yet).

**Phase C — implement the boot path**
7. Implement `src/config/env.ts`: load env, validate with a schema, freeze, export a typed `config`. Fail fast (Rule 7).
8. Implement `src/observability/logger.ts` (structured JSON) and request-id middleware.
9. Implement `src/db/supabase.ts`: the service-role and request-scoped client factories (Rule 11).
10. Implement `src/index.ts`: build the server, mount `/healthz` + `/readyz`, mount the versioned router, install error + shutdown handlers, then listen.

**Phase D — validate**
11. `cd services/api && npm run api:typecheck` — MUST pass with zero errors.
12. `npm run lint` (root or scoped) — MUST pass.
13. `npm run api:dev`, then `curl localhost:$PORT/healthz` → 200, `curl .../readyz` → 200 only when the Supabase/DB check succeeds.
14. Update `.ai/API_SPEC.json` (flip toward implemented) and record the change in [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md); run the review gate ([30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)).

**Invariant:** none of `npm run ds:build`, `npm run figma:build`, `tokens:build`, `manifest:build`, `catalog:build`, or the Storybook/Figma outputs change as a result of backend work. If any generated design artifact diffs, you touched the wrong tree — revert.

---

## 6. Examples

All examples are **illustrative of the PLANNED standard** and framework-agnostic where possible.

**6.1 `services/api/package.json` (planned)**

```json
{
  "name": "@tds/api",
  "private": true,
  "type": "module",
  "engines": { "node": ">=20" },
  "scripts": {
    "api:dev": "tsx watch src/index.ts",
    "api:build": "esbuild src/index.ts --bundle --platform=node --format=esm --target=node20 --outfile=dist/server.js",
    "api:start": "node dist/server.js",
    "api:typecheck": "tsc -p tsconfig.json --noEmit"
  }
}
```

**6.2 Fail-fast config (`src/config/env.ts`, planned)**

```ts
// PLANNED. Validate all env at boot; never read process.env elsewhere.
const required = ['NODE_ENV', 'PORT', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'LOG_LEVEL'] as const;

function readEnv() {
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    // structured fatal — see §6.3
    process.stderr.write(JSON.stringify({ level: 'fatal', msg: 'missing env', missing }) + '\n');
    process.exit(1);
  }
  return Object.freeze({
    nodeEnv: process.env.NODE_ENV!,
    port: Number(process.env.PORT),
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY!,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    logLevel: process.env.LOG_LEVEL!,
  });
}

export const config = readEnv();
export type Config = typeof config;
```

**6.3 Structured logging (`src/observability/logger.ts`, planned)**

```ts
// PLANNED. One JSON object per line to stdout. Never log secrets/tokens/PII.
type Level = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export function log(level: Level, msg: string, fields: Record<string, unknown> = {}): void {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, msg, ...fields });
  (level === 'error' || level === 'fatal' ? process.stderr : process.stdout).write(line + '\n');
}
```

**6.4 Two Supabase clients (`src/db/supabase.ts`, planned)**

```ts
// PLANNED. RLS-respecting client is the default; service-role is trusted-path only.
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env.js';

// Trusted server paths only — bypasses RLS. Key NEVER sent to the client.
export const serviceRole = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Per-request: carries the caller's JWT so RLS applies. Default for user data.
export function forRequest(accessToken: string) {
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
```

**6.5 Entrypoint with health probes + graceful shutdown (`src/index.ts`, planned, framework-agnostic sketch)**

```ts
// PLANNED. Boot order: validate config (import side effect) → server → probes → listen → drain.
import { config } from './config/env.js';
import { log } from './observability/logger.js';
// import framework + router...

const server = /* buildServer() */ createHttpServer();
// GET /healthz -> 200 always (liveness). GET /readyz -> checks DB, 200/503 (readiness).

const listening = server.listen(config.port, () => log('info', 'listening', { port: config.port }));

function shutdown(signal: string) {
  log('info', 'shutting down', { signal });
  listening.close(() => {
    // close DB/pool handles, flush logs
    log('info', 'shutdown complete');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref(); // bounded drain
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

**6.6 What NOT to do**

```ts
// ❌ NEVER: couple the service to design source.
import { Button } from '@/components';           // design tier — forbidden in services/api
import tokens from '../../../src/tokens/generated/figma.tokens.json'; // generated output — forbidden

// ❌ NEVER: hardcode config / secrets.
const supabase = createClient('https://xyz.supabase.co', 'eyJ...hardcoded-key');
```

---

## 7. Validation Rules

How compliance is checked. Existing mechanisms are real today; service-specific gates are **PLANNED** and land with the service.

| Check | Mechanism | Gate |
| --- | --- | --- |
| Types are sound | `cd services/api && npm run api:typecheck` (`tsc --noEmit`), mirroring `plugin:typecheck` | MUST pass, zero errors |
| Lint/format clean | `npm run lint` / `npm run format:check` reaching `services/api/**` | MUST pass |
| Config fails fast | Boot with a missing required env var → process exits `1` with a structured fatal line (§6.2) | MUST exit non-zero |
| Health probes | `GET /healthz` → 200; `GET /readyz` → 200 only when DB reachable, else 503 | MUST behave as specified |
| No secrets committed | `.env`/`.env.*` gitignored; grep for keys in diff; secret-scan in CI (PLANNED, [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)) | NEVER commit secrets |
| No design coupling | Static check: no `@/`, `@core/`, `@components/`, `@tokens/`, or `src/**`/`figma/**` imports in `services/api/**` | MUST be import-clean |
| Design outputs untouched | `git status` shows no diff under `figma/`, `src/generated/`, `src/tokens/generated/` after backend work | MUST be zero diff |
| Contract in sync | [.ai/API_SPEC.json](../../.ai/API_SPEC.json) reflects implemented routes; reviewed per [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md) | MUST be reconciled |
| Tests | `api:test` per [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md) | PLANNED — no framework yet |

---

## 8. Checklist

Pre-implementation:
- [ ] Task **explicitly** requests a backend/API (else stop — Rule 1).
- [ ] Read [15_API_GUIDE.md](./15_API_GUIDE.md), [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md), and manifests [.ai/API_SPEC.json](../../.ai/API_SPEC.json)/[.ai/ERD.json](../../.ai/ERD.json).

Structure & runtime:
- [ ] Service under `services/api/` with its own `package.json` (`"type":"module"`, `engines.node >=20`).
- [ ] Not added to root `dependencies` (root stays `react` + `react-dom`).
- [ ] TypeScript `strict` posture inherited; layered `src/` (config/lib/db/middleware/routes/handlers/services/observability).

Config & security:
- [ ] All config via validated `env` module; nothing hardcoded.
- [ ] `.env`/`.env.*` gitignored; `.env.example` committed.
- [ ] Boot validates env and fails fast (`process.exit(1)`).
- [ ] Service-role vs request-scoped Supabase clients separated; RLS client is default.

Observability & lifecycle:
- [ ] Structured JSON logs, request-id propagation, no secrets/PII in logs.
- [ ] `/healthz` + `/readyz` implemented.
- [ ] `SIGTERM`/`SIGINT` graceful drain + bounded timeout.

Isolation & sign-off:
- [ ] Zero imports from design source; zero diff in generated design outputs.
- [ ] `api:typecheck` + `lint` pass; probes verified; `.ai/API_SPEC.json` + [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md) updated; review gate cleared.

---

## 9. Failure Recovery

Symptom → diagnosis → fix → resume.

- **Process exits `1` at boot with `"missing env"`.** *Diagnosis:* required var absent/misspelled (Rule 7 firing correctly). *Fix:* copy `.env.example` → `.env`, fill values; never inline them in code. *Resume:* re-run `npm run api:dev`.
- **`/readyz` returns 503 while `/healthz` is 200.** *Diagnosis:* the process is alive but the DB/Supabase check fails — bad `SUPABASE_URL`/key, network egress blocked, or RLS on the probe query. *Fix:* verify Supabase reachability and use an unauthenticated cheap check; see [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md). *Resume:* re-probe.
- **RLS-protected rows leak or user gets another user's data.** *Diagnosis:* a handler used the **service-role** client for user-context reads (Rule 11 violation). *Fix:* switch to `forRequest(jwt)`; reserve service-role for explicitly trusted paths; audit. Escalate per [22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md).
- **A design output (`figma/`, `src/generated/`, `src/tokens/generated/`) shows a diff after backend work.** *Diagnosis:* the service imported or triggered the generators, or files were edited in the wrong tree. *Fix:* revert those files, remove the coupling (Rule 13), re-run `npm run ds:build` to confirm they regenerate identically. *Resume:* continue backend work in `services/api/` only.
- **Type errors referencing `verbatimModuleSyntax`/`.js` extensions.** *Diagnosis:* ESM + NodeNext requires explicit `.js` in relative import specifiers even from `.ts`. *Fix:* add the `.js` suffix (as in §6 examples) or align `moduleResolution`. *Resume:* `npm run api:typecheck`.
- **Logs are unsearchable / secrets appeared in logs.** *Diagnosis:* string logging or logging a whole request/token object (Rule 9). *Fix:* route through the structured `log()` helper, allowlist fields, redact `Authorization`. Rotate any leaked key immediately. *Resume:* re-deploy.
- **Context lost mid-build.** *Diagnosis:* session interruption. *Fix:* rehydrate from [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md) + [.ai/TASKS.json](../../.ai/TASKS.json) per [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md); the service is idempotent to re-scaffold because generated design outputs are untouched.

---

## 10. Dependencies

**Docs**
- [00_MASTER_RULES.md](./00_MASTER_RULES.md) — constitution, precedence, Design Lock, generated-is-sacred.
- [15_API_GUIDE.md](./15_API_GUIDE.md) — the HTTP/RPC contract this service exposes (PLANNED).
- [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md) — Postgres schema, migrations, RLS, indexing, ERD (PLANNED).
- [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md) — Supabase Auth/RLS/Storage/Realtime/Edge Functions; client patterns (PLANNED).
- [18_FOLDER_STRUCTURE.md](./18_FOLDER_STRUCTURE.md) — where `services/api/` sits in the canonical layout.
- [19_CODE_CONVENTION.md](./19_CODE_CONVENTION.md) — TS/ESLint/Prettier rules the service inherits.
- [22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md) — secrets, service-role handling, supply chain.
- [23_PERFORMANCE_GUIDE.md](./23_PERFORMANCE_GUIDE.md) — statelessness, pooling, caching, 10M-user scaling.
- [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md) — the PLANNED `api:test` strategy (no framework today).
- [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md) — CI/CD, environments, secret scanning, deploy (PLANNED).
- [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md) / [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md) — resume + review gates.

**Manifests**
- [.ai/API_SPEC.json](../../.ai/API_SPEC.json) (`"status":"planned"`), [.ai/ERD.json](../../.ai/ERD.json) (`"status":"planned"`), [.ai/PROJECT_MANIFEST.json](../../.ai/PROJECT_MANIFEST.json), [.ai/DEPENDENCY_GRAPH.json](../../.ai/DEPENDENCY_GRAPH.json), [.ai/TASKS.json](../../.ai/TASKS.json), [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md) — see [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md).

**Real repo facts the service inherits (today)**
- Root `package.json` → `engines.node ">=20"`, `"type":"module"`, deps `react`+`react-dom` only.
- Dev toolchain reused: `tsx` (run TS), `esbuild` (bundle — same tool as `plugin:build`), `typescript` `strict`, `eslint` flat config, `prettier` (`.prettierrc.json`).
- Existing script patterns mirrored: `plugin:typecheck` → `api:typecheck`; `plugin:build` (esbuild) → `api:build`.

---

## 11. Template

Copy-paste skeleton for the PLANNED `services/api/` service. Everything is additive and isolated from `src/`.

```
services/api/
├─ package.json              # "type":"module", engines.node>=20, api:* scripts
├─ tsconfig.json             # extends repo strict posture; paths e.g. @api/* -> src/*
├─ .env.example              # documents required vars (committed)
├─ .gitignore                # .env, .env.*, dist
└─ src/
   ├─ index.ts               # entrypoint: config → server → probes → listen → drain
   ├─ config/
   │  └─ env.ts              # validate+freeze env at boot; fail fast
   ├─ observability/
   │  ├─ logger.ts           # structured JSON logs
   │  └─ metrics.ts          # counters/histograms (PLANNED)
   ├─ middleware/
   │  ├─ request-id.ts       # attach requestId/trace to context + logs
   │  ├─ auth.ts             # extract/verify JWT; build request-scoped client
   │  └─ error.ts            # error taxonomy → JSON responses
   ├─ db/
   │  └─ supabase.ts         # serviceRole + forRequest(jwt) factories (RLS default)
   ├─ routes/
   │  └─ v1.ts               # mounts versioned router (contract owned by 15_API_GUIDE)
   ├─ handlers/              # thin: validate input, call services/, shape response
   ├─ services/              # domain logic; no HTTP, no inline SQL
   └─ lib/                   # small pure helpers (no design-system imports)
```

`.env.example` (committed; values are placeholders, never real):

```dotenv
NODE_ENV=development
PORT=8787
LOG_LEVEL=info
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`tsconfig.json` (planned, inherits repo posture):

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": { "@api/*": ["src/*"] }
  },
  "include": ["src/**/*.ts"]
}
```

---

## 12. Future Extension

How this scales for years and beyond 10,000,000 users (all PLANNED; sequenced with [23_PERFORMANCE_GUIDE.md](./23_PERFORMANCE_GUIDE.md) and [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)):

1. **Horizontal, stateless fleet.** Because every node is stateless (Rule 8), the service scales out behind a load balancer with autoscaling; no sticky sessions. Readiness gating (`/readyz`) keeps unhealthy nodes out of rotation.
2. **Connection management for Postgres at scale.** Route DB traffic through a pooler (Supabase's PgBouncer / Supavisor) and honor pool limits; add read replicas for read-heavy endpoints — owned by [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md)/[17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md), consumed here.
3. **Cache tier.** Introduce a shared cache (e.g. Redis) for hot reads and rate-limit counters; keep the service stateless by never treating cache as source of truth.
4. **Workspace formalization.** As services multiply, promote `services/*` to a formal monorepo workspace (npm/pnpm workspaces or Turborepo) so the design system and backend build independently while sharing lint/format/tsconfig bases. This is the natural home for a future `services/worker/`, `services/edge/`, etc.
5. **Observability maturity.** Graduate structured logs to full tracing (OpenTelemetry), RED/USE metrics, SLOs, and alerting; propagate `traceparent` across service boundaries. Wire dashboards in [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md).
6. **Contract-first evolution.** Keep [.ai/API_SPEC.json](../../.ai/API_SPEC.json) and [.ai/ERD.json](../../.ai/ERD.json) as the machine-readable contracts an AI agent reads before touching the server, minimizing tokens ([26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md)) and preventing FE/BE/DB drift.
7. **Hard boundary preserved forever.** No matter how large the backend grows, the design system remains the immutable visual source of truth. The Node tier consumes data and serves the app; it NEVER feeds design decisions back into `*.meta.ts`, tokens, Storybook, or the Figma bundle (Design Lock, [00_MASTER_RULES.md](./00_MASTER_RULES.md)).
