# 15 — API Guide

> **Title:** API Guide
> **Purpose:** Define the **PLANNED** TDS API standard — REST/RPC over Supabase fronted by a Node/TS layer — its request/response contracts, versioning, pagination, error model, rate limiting, auth surface, and the `.ai/API_SPEC.json` machine contract.
> **Status:** PLANNED
> **Owner:** AI OS
> **Last-reviewed:** _(placeholder — set on review)_
> **Precedence:** Subordinate to [00_MASTER_RULES.md](./00_MASTER_RULES.md). This document describes a **future** layer; it is source-of-truth only for the API contract once that layer exists. It never overrides the frontend design truth (Storybook + `*.meta.ts` + `src/tokens/*`) and it consumes, but never mutates, the data model owned by [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md).

---

> **STATUS: PLANNED — no backend exists in the repo today.**
> The TDS repository currently ships **only** a frontend design system. Its runtime dependencies are **exactly** `react` + `react-dom`. There is **no** server, **no** database, **no** Supabase project, **no** REST/GraphQL/RPC endpoint, **no** auth, **no** `.env`/secrets, and **no** API client anywhere in `src/`. `SocialLogin` / `SocialLoginButton` are **presentational only** — they render buttons and emit callbacks; they call nothing. Everything in this document is the **target standard** to be implemented when a backend is introduced. Nothing here may be treated as an existing capability, imported, or referenced from `src/` until it is actually built and this banner is downgraded.

---

## 1. Purpose

This document is the single authority for **how TDS talks to its backend** once a backend exists. It specifies the contract between any HTTP client (the React app, an MCP agent, a future mobile client, a CI job) and the **PLANNED** server: a thin **Node ≥20 / TypeScript API layer** in front of **Supabase** (Postgres + Auth + RLS + Storage + Edge Functions + Realtime).

The API standard exists to guarantee, at enterprise scale (target **>10,000,000 users**):

1. **A stable, versioned contract** — clients depend on `/v1` shapes that never break silently.
2. **One machine-readable source of truth** — [.ai/API_SPEC.json](../../.ai/API_SPEC.json) so any AI agent can read every route, its request/response schema, auth, and rate class without reading server code.
3. **A uniform envelope** — every success and every error looks the same, so clients and agents parse one shape.
4. **Frontend/Backend/Database sync** — API resources map 1:1 to the `.ai/ERD.json` entities of [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md) and are consumed by TDS components (forms wrapped in `FormField`, tables, etc.) without leaking DB shapes.

This guide is **transport and contract**. It does **not** redesign any UI, does **not** touch tokens, and does **not** alter the Storybook↔Figma pipeline. Per the Design Lock in [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md), an API can never justify a visual change.

---

## 2. Responsibilities

This specification **owns** (all PLANNED):

- The **transport style**: REST for CRUD resources; **RPC** (Postgres functions exposed via Supabase / Edge Functions) for transactional or multi-entity operations.
- The **URL, versioning, and namespacing** scheme (`/api/v1/...`).
- The **request contract**: headers, auth token placement, content types, idempotency keys, request validation.
- The **response envelope**: success shape, error shape, pagination metadata, ETag/caching semantics.
- The **canonical error model**: a closed set of machine codes mapped to HTTP status.
- **Pagination, filtering, sorting** conventions (cursor-first).
- **Rate limiting** classes and their response headers.
- The **`.ai/API_SPEC.json`** manifest: schema, update rules, read rules (per [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md)).
- The **client conventions** on the frontend (a single typed fetch wrapper, no scattered `fetch()`).

It **does not** own:

- **Database schema, RLS policies, indexes, migrations** → [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md).
- **Node service structure, runtime, packaging, observability** → [16_NODE_GUIDE.md](./16_NODE_GUIDE.md).
- **Supabase Auth/Storage/Realtime/Edge Function specifics** → [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md).
- **Security posture** (secret handling, threat model, RLS-as-defence) → [22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md).
- **Backend performance & 10M-user scaling tactics** → [23_PERFORMANCE_GUIDE.md](./23_PERFORMANCE_GUIDE.md).
- **Any visual/component decision** → [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md), [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md).

---

## 3. Scope

### In scope

- HTTP contract between clients and the PLANNED API layer.
- The `/api/v1` REST + RPC surface, its envelope, errors, pagination, versioning, rate limiting.
- The `.ai/API_SPEC.json` contract and how it is authored, validated, and read.
- Frontend client conventions (typed wrapper, error handling, wiring into TDS components).

### Out of scope

- Persistence, schema, migrations, RLS (→ [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md)).
- Server internals, DI, logging transport, deployment topology (→ [16_NODE_GUIDE.md](./16_NODE_GUIDE.md), [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)).
- Supabase project configuration and client SDK setup (→ [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md)).
- Anything visual. **No API work may alter Storybook, tokens, `*.meta.ts`, or generated Figma output.**

---

## 4. Rules

Numbered, enforceable. **MUST / SHOULD / NEVER.** All are PLANNED and apply only once the API layer is built.

1. **MUST** version every public route under `/api/v1`. The major version is in the **path**, never a header alone. Breaking changes ship as `/api/v2`; `/api/v1` continues until formally deprecated per [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md).
2. **MUST** return the **standard envelope** (§6) for every response — success and error. No route returns a bare array, a bare object, or a raw Supabase/PostgREST payload.
3. **MUST** use the **closed error-code set** (§6.3). A new failure mode requires adding a code to the set in `.ai/API_SPEC.json`, never an ad-hoc string.
4. **MUST** declare every route in [.ai/API_SPEC.json](../../.ai/API_SPEC.json) **before or in the same change** as its implementation. An undocumented route is a contract violation and **MUST** fail the review gate ([30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)).
5. **MUST** validate every request body/query against a schema (Zod or equivalent) at the edge of the Node layer; reject with `VALIDATION_ERROR` (HTTP 422) before touching Supabase.
6. **MUST** authenticate via the Supabase JWT in `Authorization: Bearer <access_token>`. The Node layer verifies the token and forwards the user context so **Postgres RLS is the final authority** (see [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md), [22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md)). The API layer **NEVER** trusts a client-supplied user id.
7. **MUST** paginate any list endpoint that can exceed **100** rows, using **cursor pagination** by default (§6.4). Offset pagination is allowed only for small, bounded admin lists and **MUST** be documented as such.
8. **MUST** be **idempotent** for `PUT` and `DELETE`, and **MUST** honor an `Idempotency-Key` header for `POST` mutations that create resources, so retries at 10M-user scale never double-write.
9. **MUST** rate-limit every route and assign it a **rate class** (§6.5). Every response **MUST** carry `RateLimit-*` headers.
10. **MUST** keep DB shapes out of the wire contract. Response fields are `camelCase`; Postgres columns are `snake_case`. The mapping lives in the Node layer, never leaks to the client.
11. **SHOULD** prefer **REST** for resource CRUD and **RPC** (a named Postgres function / Edge Function) for transactional or cross-entity operations; document the choice in `.ai/API_SPEC.json` via the `style` field.
12. **SHOULD** support conditional requests (`ETag` + `If-None-Match`) on cacheable `GET`s to cut bandwidth at scale ([23_PERFORMANCE_GUIDE.md](./23_PERFORMANCE_GUIDE.md)).
13. **NEVER** expose Supabase `service_role` keys or any secret to the browser. Server-only keys stay in the Node layer's environment ([22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md)). The frontend uses only the anon key + user JWT.
14. **NEVER** scatter raw `fetch()`/`axios` calls across components. All frontend calls go through the single typed API client (§6.7). This mirrors the repo's existing "one barrel" discipline (`@/components`, `@/hooks`, `@/utils`).
15. **NEVER** break a shipped `/v1` shape in place. Additive fields are allowed; removing/renaming/retyping a field is a **new version** ([31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md), [32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md)).
16. **NEVER** hand-edit generated artifacts to reflect an API change. API changes flow: schema (Supabase migration) → Node layer → `.ai/API_SPEC.json` → typed frontend client. The generated design outputs under `figma/`, `src/generated/`, `src/tokens/generated/` are **untouched** by any API work.

---

## 5. Workflow

The end-to-end flow for adding or changing an endpoint. All steps PLANNED; each references a real repo mechanism where one exists today.

### 5.1 Add a new endpoint (canonical order)

1. **Model first.** Confirm the entity exists in [.ai/ERD.json](../../.ai/ERD.json) and its table/RLS is defined per [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md). If not, that work happens there first — the API never invents storage.
2. **Choose style.** REST resource vs RPC (§4.11). Decide the route, method, auth requirement, and rate class.
3. **Author the contract.** Add the route to `.ai/API_SPEC.json` (§11 template): path, method, `style`, `auth`, `rateClass`, `request` schema, `response` schema (referencing shared `components`), `errors[]`, `pagination`.
4. **Validate the contract.** Run the manifest validation gate (§7) — schema-valid JSON, every `errors[]` code in the closed set, every entity ref resolvable in `.ai/ERD.json`.
5. **Implement the Node handler** per [16_NODE_GUIDE.md](./16_NODE_GUIDE.md): parse+validate (Zod) → verify JWT → call Supabase (RLS-scoped) → map `snake_case`→`camelCase` → wrap in the envelope (§6).
6. **Type the frontend client.** Regenerate/extend the typed API client (§6.7) from `.ai/API_SPEC.json`. Components consume the client, never raw `fetch`.
7. **Wire UI (if any).** Reuse existing TDS components from the catalog first ([docs/COMPONENTS.md](../COMPONENTS.md)); forms use `FormField` for label/error/help. **No new visual design.**
8. **Test.** Contract tests + integration per [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md) (PLANNED test framework — none exists today).
9. **Review & release.** Pass [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md); record the change in [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md) and version per [32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md).

### 5.2 Change an existing endpoint

- **Additive** (new optional field, new query param, new error code): edit `.ai/API_SPEC.json`, keep `/v1`, note in [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md).
- **Breaking** (remove/rename/retype/behavioral change): introduce `/api/v2`, keep `/v1` live, follow the deprecation lifecycle in [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md).

### 5.3 Relationship to real scripts today

There is **no** `api:*` npm script yet. When the layer lands, its scripts (PLANNED) SHOULD follow the existing naming rhythm of `package.json` (`tokens:build`, `manifest:build`, `catalog:build`, `plugin:build`, `plugin:test`) — e.g. `api:spec:validate`, `api:typecheck`, `api:test` — and be wired into the same review/CI discipline described in [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md).

---

## 6. Examples

All examples are **PLANNED** illustrations of the target contract.

### 6.1 URL & versioning scheme

```
https://api.tds.example.com/api/v1/{resource}            # REST collection
https://api.tds.example.com/api/v1/{resource}/{id}       # REST item
https://api.tds.example.com/api/v1/rpc/{functionName}    # RPC (transactional)
```

- Major version in the path (`/v1`).
- Resource names are **plural, kebab or lower** nouns (`projects`, `design-tokens`).
- RPC endpoints live under `/rpc/` and use verb-ish function names (`archive-project`).

### 6.2 Standard success envelope

Every 2xx response:

```jsonc
{
  "ok": true,
  "data": { /* resource or array */ },
  "meta": {
    "requestId": "req_01HXYZ...",       // trace id, echoed in logs
    "apiVersion": "v1",
    "pagination": {                      // present only on list responses
      "nextCursor": "eyJpZCI6IjEyMyJ9",
      "hasMore": true,
      "limit": 50
    }
  }
}
```

### 6.3 Standard error envelope + closed code set

Every non-2xx response:

```jsonc
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",          // from the closed set below
    "message": "email is required",      // human-safe, never leaks internals
    "details": [                          // optional, field-level
      { "field": "email", "issue": "required" }
    ],
    "requestId": "req_01HXYZ..."
  }
}
```

**Closed error-code → HTTP status map** (the ONLY allowed codes; extend by editing `.ai/API_SPEC.json`):

| `code`                | HTTP | Meaning                                            |
| --------------------- | ---- | -------------------------------------------------- |
| `VALIDATION_ERROR`    | 422  | Request failed schema validation.                  |
| `UNAUTHENTICATED`     | 401  | Missing/invalid JWT.                               |
| `FORBIDDEN`           | 403  | Authenticated but RLS/policy denies.               |
| `NOT_FOUND`           | 404  | Resource does not exist (or RLS hides it).         |
| `CONFLICT`            | 409  | Idempotency/version/unique-constraint conflict.    |
| `RATE_LIMITED`        | 429  | Rate class exceeded; see `RateLimit-*` headers.    |
| `PAYLOAD_TOO_LARGE`   | 413  | Body exceeds the route limit.                      |
| `UNPROCESSABLE`       | 422  | Semantically invalid (valid shape, bad state).     |
| `INTERNAL`            | 500  | Unhandled server fault; `requestId` for tracing.   |
| `SERVICE_UNAVAILABLE` | 503  | Supabase/dependency down or shedding load.         |

> **Note:** `FORBIDDEN` vs `NOT_FOUND` — for RLS-protected rows the API SHOULD prefer `NOT_FOUND` to avoid leaking existence, per [22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md).

### 6.4 Cursor pagination

```
GET /api/v1/projects?limit=50&cursor=eyJpZCI6IjEyMyJ9&sort=-createdAt&filter[status]=active
```

- `limit` — default 50, max 100.
- `cursor` — opaque, base64-encoded keyset (not an offset). Client passes back `meta.pagination.nextCursor`.
- `sort` — comma list; `-` prefix = descending (`-createdAt,name`).
- `filter[field]=value` — whitelisted fields only, declared per-route in `.ai/API_SPEC.json`.
- Cursor pagination is mandatory for large lists (§4.7) because it is stable and O(1) at 10M-row scale ([23_PERFORMANCE_GUIDE.md](./23_PERFORMANCE_GUIDE.md)).

### 6.5 Rate-limit classes & headers

Each route is tagged with a `rateClass`. Every response carries:

```
RateLimit-Limit: 600
RateLimit-Remaining: 597
RateLimit-Reset: 42
Retry-After: 42          # only on 429
```

| `rateClass` | Typical limit        | Applies to                          |
| ----------- | -------------------- | ----------------------------------- |
| `public`    | 60 req / min / IP    | Unauthenticated/public reads.       |
| `auth`      | 600 req / min / user | Standard authenticated CRUD.        |
| `write`     | 120 req / min / user | Mutations (`POST`/`PUT`/`DELETE`).  |
| `bulk`      | 10 req / min / user  | Exports, batch/RPC heavy ops.       |

### 6.6 Request headers (canonical)

```
Authorization: Bearer <supabase_access_token>
Content-Type: application/json
Idempotency-Key: 6f9a...            # required on create POSTs (§4.8)
If-None-Match: "W/abc123"           # optional, conditional GET
X-Request-Id: req_client_generated  # optional; server generates if absent
```

### 6.7 Frontend typed client (single entry, no scattered fetch)

Mirrors the repo's existing one-barrel discipline (`@/components`, `@/hooks`). PLANNED location: `src/api/` with a single public barrel `@/api`.

```ts
// src/api/client.ts  (PLANNED)
import type { ApiEnvelope, ApiError } from './types'; // generated from .ai/API_SPEC.json

export async function apiFetch<T>(
  path: `/${string}`,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...authHeader(), ...init?.headers },
  });
  const body = (await res.json()) as ApiEnvelope<T>;
  if (!body.ok) throw new ApiClientError(body.error as ApiError);
  return body.data;
}
```

Components consume typed resource helpers (e.g. `projects.list({ limit: 50 })`), wire results into existing TDS components, and surface `ApiError.message` through `FormField`'s error slot — **no new UI design**.

---

## 7. Validation Rules

How compliance is checked (PLANNED gates; the manifest-schema check can exist as soon as `.ai/API_SPEC.json` does).

1. **Manifest schema** — `.ai/API_SPEC.json` MUST validate against its `$schema`. A PLANNED script (naming per §5.3, e.g. `api:spec:validate`) runs in CI ([25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)).
2. **Closed error set** — every `errors[]` entry across all routes MUST be a member of the §6.3 code set. Validation fails otherwise.
3. **Entity resolution** — every response/request schema that references an entity MUST resolve to an entity in [.ai/ERD.json](../../.ai/ERD.json). Dangling refs fail.
4. **Envelope conformance** — contract/integration tests ([24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md)) assert every route returns the §6 envelope (success and error), with `ok`, `data`|`error`, and `meta.requestId`.
5. **Versioning lint** — a check asserts no route omits `/v1` and no breaking diff lands in an existing version (compared against the previous `.ai/API_SPEC.json`).
6. **Type sync** — the frontend `@/api` types MUST be generated from `.ai/API_SPEC.json`; a check fails if they drift (analogous to how `docs/COMPONENTS.md` is regenerated by `npm run catalog:build`, never hand-edited).
7. **Lint/typecheck** — the Node layer and client obey the repo's existing `npm run lint` (ESLint flat config) and TypeScript `strict` settings from `tsconfig.*`.
8. **Security check** — no `service_role` key reachable from browser bundles; verified per [22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md).

---

## 8. Checklist

Per-endpoint, before merge (PLANNED):

- [ ] Entity exists in [.ai/ERD.json](../../.ai/ERD.json); table + RLS defined in [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md).
- [ ] Route added to [.ai/API_SPEC.json](../../.ai/API_SPEC.json) with `path`, `method`, `style`, `auth`, `rateClass`, `request`, `response`, `errors[]`, `pagination`.
- [ ] Path is under `/api/v1`; version scheme respected (§4.1).
- [ ] Request validated with a schema; invalid → `VALIDATION_ERROR` (422) before Supabase call.
- [ ] Auth via `Authorization: Bearer`; RLS is the final gate; no client-supplied user id trusted.
- [ ] Response uses the standard envelope; DB `snake_case` mapped to `camelCase`.
- [ ] Errors use only the closed code set (§6.3).
- [ ] List endpoints paginate (cursor default); `limit` ≤ 100.
- [ ] `PUT`/`DELETE` idempotent; create `POST` honors `Idempotency-Key`.
- [ ] Route tagged with a `rateClass`; `RateLimit-*` headers emitted.
- [ ] Frontend uses `@/api` typed client — **no** raw `fetch`/`axios` in components.
- [ ] Any UI reuses existing TDS components ([docs/COMPONENTS.md](../COMPONENTS.md)); forms use `FormField`. No visual redesign.
- [ ] Contract/integration tests pass ([24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md)).
- [ ] Change recorded in [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md); versioned per [32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md).

---

## 9. Failure Recovery

Symptom → diagnosis → fix → resume.

| Symptom | Diagnosis | Fix | Resume |
| --- | --- | --- | --- |
| Client gets a bare array / raw PostgREST JSON | Handler bypassed the envelope | Wrap in §6 envelope; add contract test | Re-run integration tests |
| `401 UNAUTHENTICATED` on a valid session | JWT not forwarded / expired | Refresh Supabase session; verify `Authorization` header propagation ([17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md)) | Retry request |
| `403`/empty where data expected | RLS policy denies | Fix policy in [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md) — **never** widen by using `service_role` in the request path | Re-test with user JWT |
| Duplicate resources on retry | Missing `Idempotency-Key` handling | Implement idempotency store keyed by header (§4.8) | Replay retried POST — expect one row |
| List endpoint slow / times out at scale | Offset pagination or unindexed sort | Switch to cursor keyset; add index in [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md); see [23_PERFORMANCE_GUIDE.md](./23_PERFORMANCE_GUIDE.md) | Re-benchmark |
| Frontend types disagree with server | `@/api` types stale vs `.ai/API_SPEC.json` | Regenerate client types from the manifest | Re-run typecheck |
| Undocumented route shipped | Skipped §5 step 3 | Add to `.ai/API_SPEC.json`; block via review gate ([30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)) | Re-review |
| Ad-hoc error string in response | Bypassed closed code set | Map to a §6.3 code or add one to the manifest set | Re-validate spec |
| Secret leaked to browser bundle | `service_role` imported client-side | Remove; move to Node env ([22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md)); rotate key | Security re-review |

**Context-loss recovery:** to rehydrate API state after losing context, read [.ai/API_SPEC.json](../../.ai/API_SPEC.json) (the full route surface) + [.ai/ERD.json](../../.ai/ERD.json) (entities) + [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md), per [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md). Do **not** infer routes from server source.

---

## 10. Dependencies

- **Constitution / precedence:** [00_MASTER_RULES.md](./00_MASTER_RULES.md).
- **Data model (owns entities, RLS, migrations):** [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md) + [.ai/ERD.json](../../.ai/ERD.json).
- **Server internals & runtime:** [16_NODE_GUIDE.md](./16_NODE_GUIDE.md).
- **Supabase (Auth/Storage/Realtime/Edge Functions):** [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md).
- **Security:** [22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md).
- **Performance & scaling:** [23_PERFORMANCE_GUIDE.md](./23_PERFORMANCE_GUIDE.md).
- **Manifest system (schema/update/read rules):** [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md) + [.ai/API_SPEC.json](../../.ai/API_SPEC.json).
- **Architecture (FE↔BE sync):** [21_ARCHITECTURE_GUIDE.md](./21_ARCHITECTURE_GUIDE.md).
- **Testing:** [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md). **DevOps/CI:** [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md).
- **Change/release:** [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md), [32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md); review at [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md).
- **Design lock (any UI consuming the API):** [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md), catalog [docs/COMPONENTS.md](../COMPONENTS.md).
- **MCP agents that read the contract:** [35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md).

---

## 11. Template

Copy-paste skeleton for a route entry in `.ai/API_SPEC.json` (PLANNED contract shape).

```jsonc
{
  "$schema": "https://tds.local/schemas/api-spec.v1.json",
  "version": "1.0.0",
  "generatedAt": "1970-01-01T00:00:00Z",
  "status": "planned",
  "baseUrl": "/api/v1",
  "errorCodes": [
    "VALIDATION_ERROR", "UNAUTHENTICATED", "FORBIDDEN", "NOT_FOUND",
    "CONFLICT", "RATE_LIMITED", "PAYLOAD_TOO_LARGE", "UNPROCESSABLE",
    "INTERNAL", "SERVICE_UNAVAILABLE"
  ],
  "components": {
    "Project": {
      "entity": "projects",                 // MUST resolve in .ai/ERD.json
      "fields": {
        "id": "string",
        "name": "string",
        "status": "'active' | 'archived'",
        "createdAt": "string(date-time)"     // camelCase; maps from created_at
      }
    }
  },
  "routes": [
    {
      "path": "/projects",
      "method": "GET",
      "style": "rest",                       // "rest" | "rpc"
      "auth": "required",                    // "required" | "optional" | "none"
      "rateClass": "auth",                   // public | auth | write | bulk
      "request": {
        "query": {
          "limit": "number(<=100, default 50)",
          "cursor": "string?",
          "sort": "string?",
          "filter": { "status": "string?" }
        }
      },
      "response": {
        "ok": true,
        "data": "Project[]",
        "meta": { "pagination": "cursor" }
      },
      "errors": ["UNAUTHENTICATED", "RATE_LIMITED", "INTERNAL"]
    },
    {
      "path": "/projects",
      "method": "POST",
      "style": "rest",
      "auth": "required",
      "rateClass": "write",
      "idempotency": "required",             // honors Idempotency-Key header
      "request": { "body": { "name": "string" } },
      "response": { "ok": true, "data": "Project" },
      "errors": ["VALIDATION_ERROR", "UNAUTHENTICATED", "CONFLICT", "RATE_LIMITED", "INTERNAL"]
    },
    {
      "path": "/rpc/archive-project",
      "method": "POST",
      "style": "rpc",                        // Postgres function / Edge Function
      "auth": "required",
      "rateClass": "write",
      "request": { "body": { "projectId": "string" } },
      "response": { "ok": true, "data": "Project" },
      "errors": ["VALIDATION_ERROR", "FORBIDDEN", "NOT_FOUND", "RATE_LIMITED", "INTERNAL"]
    }
  ]
}
```

Node handler skeleton (PLANNED; full conventions in [16_NODE_GUIDE.md](./16_NODE_GUIDE.md)):

```ts
// src/server/routes/projects.ts  (PLANNED)
export async function listProjects(req: Req): Promise<Envelope<Project[]>> {
  const query = ProjectListQuery.parse(req.query);          // Zod → VALIDATION_ERROR (422)
  const user = await requireUser(req);                       // JWT → UNAUTHENTICATED (401)
  const { rows, nextCursor } = await db                      // RLS-scoped Supabase call
    .from('projects')
    .selectPage({ ...query, userId: user.id });
  return ok(rows.map(toProjectDto), { pagination: { nextCursor, hasMore: !!nextCursor, limit: query.limit } });
}
```

---

## 12. Future Extension

How this contract scales for years and beyond 10M users (all PLANNED):

1. **`/v2` and beyond** — new major versions coexist with `/v1`; the versioned path + `.ai/API_SPEC.json` diff make deprecation auditable ([31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md), [32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md)).
2. **Realtime channel contract** — Supabase Realtime subscriptions get a parallel contract section in `.ai/API_SPEC.json` (channels, events, payload schemas) so live updates are as documented as REST/RPC ([17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md)).
3. **Edge & read-replica scaling** — cursor pagination, `ETag`/conditional GETs, and rate classes let the API sit behind a CDN/edge cache and Postgres read replicas without contract change ([23_PERFORMANCE_GUIDE.md](./23_PERFORMANCE_GUIDE.md)).
4. **Generated OpenAPI** — `.ai/API_SPEC.json` can emit an OpenAPI 3 document and typed SDKs, keeping the same manifest-first, generate-don't-handwrite discipline the repo already uses for `tokens.css`, the manifest, and `docs/COMPONENTS.md`.
5. **MCP surface** — an MCP agent reads `.ai/API_SPEC.json` to discover, call, and validate endpoints with minimal tokens, per [35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md) and [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md).
6. **Multi-tenant / regional** — tenant scoping and region pinning enter via RLS + request context, never by forking the contract; the envelope and error model stay constant.
7. **Deprecation telemetry** — per-version, per-route usage counters feed the sunset decisions in [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md), so `/v1` is retired on evidence, not guesswork.

---

_End of 15_API_GUIDE.md — **PLANNED**. This document describes a target that does not yet exist in the repository; introduce nothing from it into `src/` until the backend is actually built and this status is formally downgraded._
