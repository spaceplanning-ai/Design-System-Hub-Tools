<!-- filename: 35_MCP_SPECIFICATION.md -->

# 35 — MCP Specification

> **Title:** MCP Specification
> **Purpose:** Define the Model Context Protocol (MCP) integration for the TDS repo — a PLANNED local MCP server that exposes the `.ai/` manifest layer, the catalog, and the real npm gates as first-class tools so any MCP-capable agent reads/updates manifests, recovers sessions, synchronizes Storybook↔Figma, minimizes token usage, and caches project knowledge, all under the same rules the human-driven harness already obeys.
> **Status:** **PLANNED — no MCP server exists in the repo today.** The runtime deps are only `react` + `react-dom`; there is no `mcp` package, no server process, and no `.mcp.json`. Everything in this document describes the intended standard; it becomes ACTIVE only when the server is built. The *substrate* it wraps (the `.ai/` manifests, the npm scripts, the subagents) is real and already specified.
> **Owner:** AI OS
> **Last-reviewed:** _(placeholder — set on first review)_
> **Precedence:** Subordinate to [00_MASTER_RULES.md](./00_MASTER_RULES.md) (the constitution). MCP is a *transport and cache* over the source-of-truth hierarchy defined in [00_MASTER_RULES.md](./00_MASTER_RULES.md); it never overrides the Design Lock, never makes a generated output authoritative, and never becomes a new source of truth. Where this doc and the harness ([02_AI_HARNESS.md](./02_AI_HARNESS.md)) describe the same act, the harness rules govern *what* happens and MCP only governs *how the call is shaped*.

---

## 1. Purpose

MCP is the machine-to-machine contract that lets a non-Claude-Code agent (an MCP client — Cursor, Windsurf, Codex, a Gemini/CLI runner, or a headless CI bot) operate this repo with the *exact same discipline* the Claude Code harness uses: read the cheap `.ai/*` manifests and `docs/COMPONENTS.md` before the expensive `src/**` source, do the smallest correct change through the real source files, run the real gates (`npm run ds:build`, `npm run figma:build`, `npm run plugin:test`), and write memory back to `.ai/` so the next session resumes with zero rediscovery.

Today an agent must *know* the repo layout and *manually* open the right files. The PLANNED MCP server turns that tribal knowledge into typed tools — `read_manifest`, `update_manifest`, `resume_session`, `sync_design`, `get_component`, `get_token` (full surface in Section 6) — each of which enforces read-before-write, generated-is-sacred, and Design-Lock invariants at the tool boundary. The result: cheaper context, deterministic behavior across clients, and a single audited path in and out of the memory layer.

This document exists so that whoever builds the server builds *this* server — with these tool names, these input/output contracts, these guardrails — and so every MCP client behaves identically to the harness in [02_AI_HARNESS.md](./02_AI_HARNESS.md).

## 2. Responsibilities

The MCP server is responsible for:

1. **Manifest read surface** — serving any `.ai/*` manifest (JSON or the two Markdown ones) and slices of the catalog `docs/COMPONENTS.md` as structured tool results, so agents never bulk-read `src/**` to answer a lookup ([26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md)).
2. **Manifest write surface** — applying validated, schema-checked updates to the *state* manifests (`.ai/TASKS.json`, `.ai/SESSION_SUMMARY.md`, `.ai/CHANGELOG.md`, `.ai/REVIEW_REPORT.md`) and *regenerating* the derived manifests by invoking the owning build script rather than editing them.
3. **Session recovery** — rehydrating a fresh agent from `.ai/SESSION_SUMMARY.md` + `.ai/TASKS.json` and checkpointing progress back ([28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md)).
4. **Storybook↔Figma synchronization** — running the pipeline (`ds:build` → `figma:build`) and reporting the objective `plugin:test` coverage result, which is the sync gate ([06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md)); MCP never touches Figma directly.
5. **Token minimization** — returning the *smallest sufficient* payload (a single component/token record, a manifest field selector) and caching it, so agents spend context on decisions, not discovery.
6. **Knowledge caching** — treating `.ai/` as the cache/state layer, always reconciled from sources 2–3 of the hierarchy, never authoritative over them.
7. **Guardrail enforcement at the boundary** — refusing writes to generated paths and refusing self-initiated visual changes, returning a typed error instead of performing the act.
8. **Subagent composition** — exposing capabilities that the `@tds-component` and `@figma-plugin` subagents (`.claude/agents/`) consume, and being invocable *by* an MCP client that in turn delegates to those agents ([36_AI_AGENT_SPECIFICATION.md](./36_AI_AGENT_SPECIFICATION.md)).

The server is **not** responsible for design decisions, for writing to Figma, for holding any source of truth, or for any backend/DB/API surface (all PLANNED — [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [15_API_GUIDE.md](./15_API_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md)).

## 3. Scope

**In-scope**

- The MCP tool surface (names, input/output contracts, error shapes) — Section 6.
- How MCP reads, writes, and validates `.ai/*` manifests and the catalog.
- Session resume/checkpoint over `.ai/SESSION_SUMMARY.md` + `.ai/TASKS.json`.
- The `sync_design` flow that wraps `figma:build` / `plugin:test`.
- Token-minimization and caching behavior of the server.
- Composition with `@tds-component` and `@figma-plugin`.
- Transport, packaging, and security posture of the (PLANNED) server.

**Out-of-scope (owned elsewhere)**

- The manifest JSON schemas themselves → [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md).
- The memory directory structure and hygiene → [37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md).
- Resume mechanics in full → [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md).
- Token/context tactics catalog → [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md).
- The harness loop and gate definitions → [02_AI_HARNESS.md](./02_AI_HARNESS.md).
- The plugin algorithm and coverage assertions → [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md).
- The agent roster and delegation contracts → [36_AI_AGENT_SPECIFICATION.md](./36_AI_AGENT_SPECIFICATION.md).
- Any backend/DB/API MCP tools (ERD/API sync) — PLANNED, sketched only in Section 12.

## 4. Rules

Rules are enforceable and tied to a real mechanism. **MUST** = blocking; **SHOULD** = strong default; **NEVER** = hard prohibition. They bind the server implementation and every MCP client call.

1. **R1 — MCP is transport, not truth (NEVER).** The MCP server MUST NEVER present itself, its cache, or any `.ai/*` manifest as a source of truth. The hierarchy of [00_MASTER_RULES.md](./00_MASTER_RULES.md) holds: Storybook + `*.meta.ts`/`src/tokens` are design/component truth; the generated manifests are derived; Figma is a reproduction; `.ai/` is cache/state.
2. **R2 — Read before write (MUST).** Any tool that mutates repo state MUST be preceded, in the same session, by the relevant read tool (`get_component`/`get_token`/`read_manifest`). The server SHOULD reject an `update_manifest`/`apply_change` call whose target was never read in-session.
3. **R3 — Generated outputs are sacred (NEVER).** `write_file`-style tools and `update_manifest` MUST NEVER target `figma/tds.plugin.json`, `src/generated/design-system.manifest.json`, `src/tokens/generated/*` (`tokens.css`, `figma.tokens.json`, `token-ids.ts`), `docs/COMPONENTS.md`, or `figma/plugin/code.js`. Writes to these paths MUST return a typed `E_GENERATED_PATH` error. To refresh them, call `run_gate`/`regenerate` which invokes the owning build script.
4. **R4 — Design Lock at the boundary (NEVER).** No MCP tool may, on its own initiative, redesign, restyle, re-space, recolor, re-radius, re-shadow, or rename any token/component/variant/variable. A change request flagged as visual-without-approval MUST return `E_DESIGN_LOCK` and escalate. Storybook is the immutable visual source of truth ([03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md), [04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md)).
5. **R5 — Derived manifests are regenerated, never hand-patched (MUST).** `update_manifest` MUST refuse to write the *derived* manifests (`COMPONENT_INDEX.json`, `TOKEN_INDEX.json`, `VARIANT_INDEX.json`, `FIGMA_MAPPING.json`, `PLUGIN_INDEX.json`, `DEPENDENCY_GRAPH.json`, `DESIGN_MANIFEST.json`, `PROJECT_MANIFEST.json` where derived). Those are produced by re-running `ds:build`/`figma:build` and the manifest generators. Only the *state/seed* manifests (`TASKS.json`, `SESSION_SUMMARY.md`, `CHANGELOG.md`, `REVIEW_REPORT.md`, and `seed:true` files) are directly writable.
6. **R6 — Schema-validate every write (MUST).** Before persisting, `update_manifest` MUST validate the payload against the manifest's `$schema` and preserve the `$schema`/`version`/`generatedAt`/`generator` (or `seed`/`status:"planned"`) header per [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md). A failing validation MUST abort the write and return `E_SCHEMA`.
7. **R7 — Minimal payloads (MUST).** Read tools MUST support field/record selection and return the smallest sufficient slice (one component record, one token, a named manifest field), not whole trees, honoring [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md). Whole-file reads require an explicit `full:true`.
8. **R8 — Cache is reconciled, never stale-authoritative (MUST).** The server MUST stamp cache entries with the source file mtime/hash and invalidate on change. A cache read that cannot prove freshness MUST fall back to the source and re-derive, never serve a guess.
9. **R9 — Gate before "done" (MUST).** `sync_design`/`apply_change` MUST run the applicable gate(s) — `lint`, `ds:build`, and for Figma-reaching changes `figma:build` (ending in `plugin:test`) — and MUST surface a red gate as a blocking `E_GATE` result. No tool may report success over a red gate.
10. **R10 — Determinism (MUST).** Given identical repo state and identical tool inputs, a tool MUST produce identical outputs. No hidden server state; all state lives in the repo and `.ai/`. Tools are idempotent where the CANON says so (e.g. re-running `sync_design` on an unchanged tree is a no-op green).
11. **R11 — Local, no network egress (MUST).** The server MUST run locally over stdio and MUST NOT make outbound network calls. This mirrors the plugin's `networkAccess: none` posture ([22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md)); no manifest content leaves the machine.
12. **R12 — Scope to the repo (MUST).** Filesystem tools MUST be jailed to the repo root; path traversal outside it MUST return `E_PATH_SCOPE`. No `.env`/secret reads (none exist today; when backend lands they are PLANNED and secret-scoped).
13. **R13 — Escalate, don't approximate (MUST).** If a contract cannot be faithfully reproduced or a rule conflict is found, the tool MUST return a typed error and stop, never paper over it — mirroring the `@figma-plugin` "stop and surface" rule.
14. **R14 — Compose, don't replace subagents (SHOULD).** MCP tools SHOULD hand component work to `@tds-component` and plugin work to `@figma-plugin` rather than reimplementing their logic; MCP provides the *context and gates*, the subagents provide the *edits* ([36_AI_AGENT_SPECIFICATION.md](./36_AI_AGENT_SPECIFICATION.md)).
15. **R15 — Backend tools are PLANNED (MUST).** Any DB/API/Supabase MCP tool (`get_erd`, `sync_schema`, `get_api_spec`) is PLANNED and MUST be labeled as such; the server MUST NOT assume a server, `.env`, or a `test` npm script exists — only `lint`, `ds:build`, `figma:build`, `plugin:test`, `build`, `format` are real today.

## 5. Workflow

The canonical MCP session loop. Every step references a real file or npm script; the MCP tool names are from Section 6.

**Step 0 — Handshake & rehydrate.** The MCP client connects over stdio; the server advertises its tool list and resource roots (`.ai/`, `docs/COMPONENTS.md`, `figma/README.md`). The client calls `resume_session` → server returns the parsed `.ai/SESSION_SUMMARY.md` + open items from `.ai/TASKS.json` ([28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md)). If a task is in progress, continue it; else intake a new one.

**Step 1 — Classify & read (manifest-first).** The client calls the cheapest read that answers the question:

| Task surface | MCP read call | Backing manifest / file |
|---|---|---|
| Component / variant / prop | `get_component`, `get_variant`, `search_catalog` | `COMPONENT_INDEX.json`, `VARIANT_INDEX.json`, `docs/COMPONENTS.md` |
| Token | `get_token`, `read_manifest{name:"TOKEN_INDEX"}` | `TOKEN_INDEX.json`, `src/tokens/generated/token-ids.ts` |
| Figma / plugin mapping | `read_manifest{name:"FIGMA_MAPPING"}`, `read_manifest{name:"PLUGIN_INDEX"}` | `FIGMA_MAPPING.json`, `PLUGIN_INDEX.json`, `figma/README.md` |
| Project / dependency | `read_manifest{name:"PROJECT_MANIFEST"}`, `read_manifest{name:"DEPENDENCY_GRAPH"}` | `PROJECT_MANIFEST.json`, `DEPENDENCY_GRAPH.json` |

Stop reading when the exact source file(s) to change are named (R7). Never bulk-read `src/**`.

**Step 2 — Guardrail preflight.** Before any mutation the client calls `preflight_change` (or the server runs it inside `apply_change`): confirm every target is a SOURCE path (R3) and the change is not self-initiated visual (R4). A violation returns `E_GENERATED_PATH`/`E_DESIGN_LOCK` and halts.

**Step 3 — Delegate the edit.** For component/token/plugin edits, the client routes to the matching subagent via `invoke_agent` (`@tds-component` for `*.meta.ts`/`.tsx`/`.css`; `@figma-plugin` for `scripts/build-manifest.ts`/`figma/plugin/src/*`). The subagent performs the smallest correct source change (R14).

**Step 4 — Regenerate & gate.** The client calls `sync_design` (or `run_gate`) which invokes the narrowest build then the gate:

```bash
npm run tokens:build   # token change → src/tokens/generated/{tokens.css, figma.tokens.json, token-ids.ts}
npm run ds:build       # any meta/token change → manifest + figma/tds.plugin.json + docs/COMPONENTS.md
npm run figma:build    # anything Figma-reaching → ds:build → plugin:typecheck → plugin:build → plugin:test
```

`plugin:test` (`tsx figma/plugin/test/harness.ts`) is the objective Storybook↔Figma sync assertion; a mismatch `process.exit(1)` surfaces as `E_GATE` (R9).

**Step 5 — Reconcile the cache.** After a green build the derived manifests on disk are fresh; the server invalidates its cache entries by mtime/hash (R8) so subsequent `get_component`/`get_token` reads reflect the change.

**Step 6 — Write back memory.** The client calls `update_manifest` to mark the task done in `.ai/TASKS.json`, append `.ai/CHANGELOG.md`, and refresh `.ai/SESSION_SUMMARY.md`; each write is schema-validated (R6). Optionally `checkpoint_session` records a mid-task resume point.

**Step 7 — Review & report.** The client calls `update_manifest{name:"REVIEW_REPORT"}` per [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md) and reports concisely (reused vs created, exact `@/components` import line) — never pasting large diffs.

## 6. Examples

Concrete tool contracts. All requests/responses are JSON-RPC `params`/`result` bodies. Every result carries `{ ok: boolean, source: string, cached: boolean }` envelope fields alongside the payload; errors return `{ ok:false, code, message }` with a code from Section 7.

**A. `read_manifest` — fetch a manifest (or a field of one).**

```jsonc
// request
{ "name": "TOKEN_INDEX", "select": "collections.Theme.modes", "full": false }
// result
{ "ok": true, "source": ".ai/TOKEN_INDEX.json", "cached": true,
  "version": "1", "generatedAt": "2026-07-08T…", "generator": "build-tokens.ts",
  "data": { "modes": ["light", "dark"] } }
```
`name` is one of the 17 `.ai/` manifests (without extension). `select` is a dot-path slice (R7). `full:true` returns the whole document.

**B. `get_component` — one component record from the catalog/index.**

```jsonc
// request
{ "name": "Card", "include": ["variantAxes", "props", "tokenBindings"] }
// result
{ "ok": true, "source": ".ai/COMPONENT_INDEX.json", "cached": false,
  "data": { "name": "Card", "tier": "molecule",
    "variantAxes": [ { "name": "type", "options": ["A","B","C"] },
                     { "name": "variant", "label": "Style", "options": ["solid","outline","soft"] },
                     { "name": "tone", "options": ["brand","neutral","success","warning","danger"] } ],
    "props": [ /* … componentProps: elevated, media, … */ ],
    "import": "import { Card } from '@/components';" } }
```
Resolves from `COMPONENT_INDEX.json` first; only falls through to `src/components/**/Card.meta.ts` if a requested detail (exact prop shape, compound sub-part) is absent (R7).

**C. `get_token` — resolve a token id to its CSS var and value.**

```jsonc
// request
{ "id": "color.bg.default" }
// result
{ "ok": true, "source": ".ai/TOKEN_INDEX.json", "cached": true,
  "data": { "id": "color.bg.default", "cssVar": "--tds-color-bg-default",
    "figmaName": "color/bg/default", "collection": "Theme",
    "valuesByMode": { "light": "…", "dark": "…" }, "scopes": ["ALL_FILLS"] } }
```
Encodes the naming law: dot-id → `--tds-` dash var → `/`-slash Figma name ([08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md)).

**D. `update_manifest` — write a STATE manifest (schema-checked).**

```jsonc
// request
{ "name": "TASKS", "op": "patch",
  "patch": [ { "path": "/tasks/3/status", "value": "done" } ],
  "expectVersion": "1" }
// result
{ "ok": true, "source": ".ai/TASKS.json", "written": true, "newVersion": "1" }
// refusal (R5) if name is a DERIVED manifest:
{ "ok": false, "code": "E_DERIVED_MANIFEST",
  "message": "COMPONENT_INDEX is regenerated by ds:build; call run_gate instead." }
```

**E. `resume_session` — rehydrate a fresh agent.**

```jsonc
// request
{}
// result
{ "ok": true, "source": ".ai/SESSION_SUMMARY.md",
  "data": { "lastTask": "Add `soft` variant to Badge", "phase": "gate",
    "openTasks": [ { "id": 3, "title": "…", "status": "in_progress",
      "nextStep": "run npm run figma:build" } ],
    "lastCheckpoint": "2026-07-08T…" } }
```

**F. `sync_design` — regenerate the bundle and assert Storybook↔Figma parity.**

```jsonc
// request
{ "scope": "figma" }   // "tokens" | "ds" | "figma"
// result (green)
{ "ok": true, "ran": ["ds:build","plugin:typecheck","plugin:build","plugin:test"],
  "coverage": { "componentSets": 60, "collections": 3, "unresolvedAliases": 0 },
  "drift": false }
// result (red → R9)
{ "ok": false, "code": "E_GATE", "ran": ["ds:build","plugin:test"],
  "message": "plugin:test: component sets 59/60 — Badge missing `soft`; regenerate source." }
```
MCP never writes to Figma; it produces `figma/tds.plugin.json` and proves the plugin can reproduce it. The plugin itself consumes that bundle inside Figma ([06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md)).

**G. Composition with subagents (one full task).**

```text
resume_session                      → open task: "Badge needs a soft variant"
get_component {name:"Badge"}        → confirm current axes/props (COMPONENT_INDEX cache)
preflight_change {targets:[Badge.meta.ts, Badge.css]}  → both SOURCE paths ✓, not visual-redesign ✓
invoke_agent @tds-component "add variant `soft` to Badge meta + css, token-only"
run_gate {gate:"lint"} → green
sync_design {scope:"figma"} → green, componentSets 60, drift:false
update_manifest {name:"TASKS", patch:[…done…]}
update_manifest {name:"CHANGELOG", op:"append", entry:"Badge: +soft variant"}
update_manifest {name:"SESSION_SUMMARY", …}
```

## 7. Validation Rules

Compliance is checked by real mechanisms; MCP tool results are only trustworthy when the underlying gate is green. Error codes below are the typed contract.

1. **Path guard — `E_GENERATED_PATH` / `E_PATH_SCOPE`.** Any write targeting a generated output (R3) or outside the repo root (R12) is rejected before touching disk. Checked against the literal path list in Section 4 R3.
2. **Design-Lock guard — `E_DESIGN_LOCK`.** A change classified as self-initiated visual (R4) returns this code and escalates; only an explicitly-approved SOURCE change proceeds.
3. **Manifest write class — `E_DERIVED_MANIFEST`.** `update_manifest` against a derived manifest (R5) is rejected; the caller must `run_gate`/`sync_design` to regenerate it.
4. **Schema gate — `E_SCHEMA`.** Every `update_manifest` payload is validated against the manifest `$schema` and header fields per [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md) before persisting (R6).
5. **Freshness gate — `E_STALE`.** A cache hit that cannot prove freshness (source mtime/hash changed) is invalidated and re-derived (R8); a forced-stale read returns this code rather than a guess.
6. **Build/sync gate — `E_GATE`.** `sync_design`/`run_gate`/`apply_change` shell out to the real npm scripts (`npm run lint`, `npm run ds:build`, `npm run figma:build` → `npm run plugin:test`). A non-zero exit (including `harness.ts` `process.exit(1)`) is surfaced as `E_GATE` and blocks "done" (R9).
7. **Read-before-write — `E_UNREAD_TARGET`.** A mutation whose target was not read in-session (R2) is refused.
8. **Server self-check.** On boot the server MUST verify: `.ai/` exists and every listed manifest parses; `package.json` exposes the six real scripts; the generated-path denylist is loaded. A failed self-check refuses to advertise write tools.
9. **PLANNED gates.** Unit/interaction/visual/e2e and CI checks do not exist yet ([24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md), [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)); MCP MUST NOT report them as passing.

## 8. Checklist

Copy into the task and tick each item.

- [ ] Connected; `resume_session` called; `.ai/SESSION_SUMMARY.md` + `.ai/TASKS.json` rehydrated.
- [ ] Task classified; cheapest read tool used (`get_component`/`get_token`/`read_manifest`), manifest-first (R7).
- [ ] `src/**` opened only where a manifest lacked the exact detail.
- [ ] `preflight_change` passed: all targets SOURCE paths (R3); no self-initiated visual change (R4).
- [ ] Edit delegated to `@tds-component` / `@figma-plugin` where applicable (R14).
- [ ] Narrowest build run via `sync_design`/`run_gate`; derived manifests regenerated, not hand-patched (R5).
- [ ] `npm run lint` green.
- [ ] `npm run ds:build` green (meta/token changes).
- [ ] `npm run figma:build` green incl. `plugin:test` (Figma-reaching changes) — `drift:false` (R9).
- [ ] Cache reconciled by mtime/hash after the green build (R8).
- [ ] State manifests written via `update_manifest` and schema-validated (R6): `TASKS.json`, `CHANGELOG.md`, `SESSION_SUMMARY.md`.
- [ ] No generated manifest hand-written (R5); no network egress (R11); repo-jailed (R12).
- [ ] Reported concisely (reused vs created + exact `@/components` import); no large diffs pasted.

## 9. Failure Recovery

Symptom → diagnosis → fix → resume.

- **Symptom: `update_manifest` returns `E_DERIVED_MANIFEST`.**
  *Diagnosis:* attempted to hand-write a regenerated manifest (`COMPONENT_INDEX`, `TOKEN_INDEX`, `FIGMA_MAPPING`, …) — R5. *Fix:* change the real SOURCE (`*.meta.ts` / `src/tokens/*`) and call `sync_design`. *Resume:* re-read via `get_component`/`get_token` after the green build.
- **Symptom: `sync_design` returns `E_GATE` — "component sets N/M" or "variants" mismatch.**
  *Diagnosis:* a `*.meta.ts` axis/variant changed but the bundle wasn't regenerated, or a real fidelity gap ([06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md)). *Fix:* `sync_design{scope:"figma"}` re-runs `ds:build`→`figma:build`; if still red the source meta or `scripts/build-manifest.ts` is wrong — fix source, never the harness assertions. *Resume:* green `plugin:test`, `drift:false`.
- **Symptom: `E_GATE` — "Unresolved alias" from `plugin:test`.**
  *Diagnosis:* a Theme/Semantic token aliases a Primitive that no longer exists, or collection order broke (Primitives→Semantic→Theme). *Fix:* correct the token id in `src/tokens/*`, `sync_design{scope:"tokens"}`→`{scope:"figma"}`. *Resume:* `unresolvedAliases:0`.
- **Symptom: `read_manifest`/`get_component` returns `E_STALE` or wrong values.**
  *Diagnosis:* cache served after a source change without reconcile (R8). *Fix:* server re-derives from the source file by mtime/hash; if `.ai/` is itself stale, run `ds:build` to regenerate the derived manifests. *Resume:* `cached:false` fresh read.
- **Symptom: `E_DESIGN_LOCK` on an apply.**
  *Diagnosis:* the change is a self-initiated visual change (R4). *Fix:* stop, surface it, obtain explicit approval, reframe as a SOURCE (meta/token/CSS) change. *Resume:* only after approval.
- **Symptom: `E_UNREAD_TARGET`.**
  *Diagnosis:* mutation attempted without an in-session read (R2). *Fix:* call the matching `get_*`/`read_manifest` first. *Resume:* retry the mutation.
- **Symptom: `resume_session` returns empty / server refuses write tools on boot.**
  *Diagnosis:* `.ai/` missing or a manifest failed to parse (Section 7.8), or `.ai/` not yet seeded ([37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md)). *Fix:* seed/repair the manifests (schemas in [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md)), re-run `ds:build` for the derived ones. *Resume:* reconnect; self-check passes.
- **Symptom: request needs backend/DB/API/auth tooling.**
  *Diagnosis:* R15 — no MCP backend tool exists (all PLANNED). *Fix:* label PLANNED, point to [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md)/[15_API_GUIDE.md](./15_API_GUIDE.md)/[17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md); do not fabricate a tool. *Resume:* operate only on the frontend surface.

## 10. Dependencies

**Docs (`docs/ai-os/`):** [00_MASTER_RULES.md](./00_MASTER_RULES.md), [01_AI_SPECIFICATION.md](./01_AI_SPECIFICATION.md), [02_AI_HARNESS.md](./02_AI_HARNESS.md), [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md), [04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md), [05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md), [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md), [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md), [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md), [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md), [22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md), [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md), [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md), [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md), [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md), [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md), [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md), [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md), [36_AI_AGENT_SPECIFICATION.md](./36_AI_AGENT_SPECIFICATION.md), [37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md), [38_AI_WORKFLOW.md](./38_AI_WORKFLOW.md), [40_FINAL_OPERATING_MANUAL.md](./40_FINAL_OPERATING_MANUAL.md).

**Manifests (`.ai/`):** [PROJECT_MANIFEST.json](../../.ai/PROJECT_MANIFEST.json), [DESIGN_MANIFEST.json](../../.ai/DESIGN_MANIFEST.json), [COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json), [TOKEN_INDEX.json](../../.ai/TOKEN_INDEX.json), [FIGMA_MAPPING.json](../../.ai/FIGMA_MAPPING.json), [PLUGIN_INDEX.json](../../.ai/PLUGIN_INDEX.json), [VARIANT_INDEX.json](../../.ai/VARIANT_INDEX.json), [DEPENDENCY_GRAPH.json](../../.ai/DEPENDENCY_GRAPH.json), [TASKS.json](../../.ai/TASKS.json), [SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md), [CHANGELOG.md](../../.ai/CHANGELOG.md), [REVIEW_REPORT.md](../../.ai/REVIEW_REPORT.md). PLANNED backend: [ERD.json](../../.ai/ERD.json), [API_SPEC.json](../../.ai/API_SPEC.json).

**Scripts / real files:** `package.json` scripts (`tokens:build`, `manifest:build`, `catalog:build`, `ds:build`, `plugin:typecheck`, `plugin:build`, `plugin:test`, `figma:build`, `lint`, `format`), `scripts/build-tokens.ts`, `scripts/build-manifest.ts`, `scripts/build-catalog.ts`, `figma/plugin/src/code.ts`, `figma/plugin/test/harness.ts`, `figma/README.md`, `docs/COMPONENTS.md`, `.claude/agents/{tds-component,figma-plugin}.md`.

## 11. Template

Skeleton for an MCP tool definition (drop into the PLANNED server's tool registry). Names and error codes MUST match Sections 6–7.

```ts
// PLANNED — mcp/tools/<tool>.ts  (server not yet built; do not create until scoped)
import { z } from 'zod'; // (or the server's schema lib)

export const readManifest = {
  name: 'read_manifest',
  description: 'Return an .ai/* manifest, or a dot-path slice of it. Manifest-first, minimal payload.',
  inputSchema: z.object({
    name: z.enum([
      'PROJECT_MANIFEST','DESIGN_MANIFEST','COMPONENT_INDEX','TOKEN_INDEX','FIGMA_MAPPING',
      'PLUGIN_INDEX','VARIANT_INDEX','RESPONSIVE_RULES','INTERACTION_RULES','ANIMATION_RULES',
      'DEPENDENCY_GRAPH','ERD','API_SPEC','TASKS','SESSION_SUMMARY','CHANGELOG','REVIEW_REPORT',
    ]),
    select: z.string().optional(),   // dot-path slice (R7)
    full: z.boolean().default(false),
  }),
  // result: { ok, source, cached, version, generatedAt, generator, data }
  // errors:  E_SCHEMA | E_STALE | E_PATH_SCOPE
  async handler(input) { /* read → validate freshness (R8) → slice (R7) → return */ },
};
```

Session run-record skeleton (append to `.ai/SESSION_SUMMARY.md` via `update_manifest`):

```md
### MCP run — <task title>
Client: <Cursor | Windsurf | Codex | CI bot>   Surface: <component | token | figma | docs>
Reads: get_component{…} / read_manifest{…}      Delegated to: @tds-component | @figma-plugin
Preflight: [ ] SOURCE paths (R3)  [ ] no visual redesign (R4)
Gates: [ ] lint  [ ] ds:build  [ ] figma:build (plugin:test, drift:false)
Write-back: [ ] TASKS  [ ] CHANGELOG  [ ] SESSION_SUMMARY   Report: reused X / created Y
```

## 12. Future Extension

The MCP surface is designed to scale in tooling and to a >10,000,000-user product without changing its contract or violating the Design Lock:

- **Backend manifest tools (PLANNED).** When the Supabase/Node backend lands ([14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [15_API_GUIDE.md](./15_API_GUIDE.md), [16_NODE_GUIDE.md](./16_NODE_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md)), the server gains `get_erd` (reads `.ai/ERD.json`), `get_api_spec` (reads `.ai/API_SPEC.json`), and `sync_schema` (regenerates from migrations, runs the backend gates). These reuse the exact read-before-write, schema-validate, and regenerate-not-handpatch rules of Section 4 verbatim.
- **MCP resources & prompts.** Beyond tools, the server may expose `.ai/*` and `docs/ai-os/*` as MCP *resources* (streamable, cacheable) and ship canned *prompts* (add-component, add-token, sync-figma) mirroring the workflows in [38_AI_WORKFLOW.md](./38_AI_WORKFLOW.md) — read-only, so the Design Lock is untouched.
- **CI as an MCP client (PLANNED).** A `.github/` runner ([25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)) connects as a headless client, calls `sync_design` on every PR, and blocks merge on `E_GATE`; `plugin:test` becomes a required check enforced by machine, not goodwill.
- **Multi-agent fan-out.** Many role agents ([36_AI_AGENT_SPECIFICATION.md](./36_AI_AGENT_SPECIFICATION.md)) share one server; determinism (R10) plus the mtime/hash cache (R8) keep parallel agents from duplicating work or serving drifted state. The `.ai/` layer remains the single reconciliation point.
- **Remote/transport growth.** Should a hosted transport ever be needed, it inherits R11/R12 unchanged: repo-jailed, no unrequested egress, no secret exposure — the security posture never loosens as scale grows.

The invariant across all extensions: **read manifest → delegate source change → build → gate → reconcile cache → write back memory**, with generated outputs sacred, `.ai/` as cache not truth, and Storybook the immutable visual source.
