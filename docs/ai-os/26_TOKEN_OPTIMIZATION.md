<!-- filename: 26_TOKEN_OPTIMIZATION.md -->

# 26 — Token Optimization

> **Title:** Token Optimization
> **Purpose:** Define how every AI agent in the TDS repo minimizes token/context usage — read the cheap `.ai/*` manifests and `docs/COMPONENTS.md` *before* the expensive `src/**` source, follow a fixed manifest-first lookup order, budget context, cache project knowledge, make minimal-diff edits, and resume from `SESSION_SUMMARY.md` instead of re-reading the repo.
> **Status:** ACTIVE (the manifest/catalog cache is the live optimization layer; MCP-side caching is noted as **PLANNED** where it does not yet exist).
> **Owner:** AI OS
> **Last-reviewed:** _(placeholder — set on first review)_
> **Precedence:** Subordinate to [00_MASTER_RULES.md](./00_MASTER_RULES.md) (constitution) and [01_AI_SPECIFICATION.md](./01_AI_SPECIFICATION.md) (agent contract). This document optimizes *how much* an agent reads; it never relaxes the read-before-write, Design-Lock, or generated-is-sacred rules. When token economy and correctness conflict, correctness wins.

---

## 1. Purpose

Every token an agent reads or writes has a cost. In a repo of **60 components (24 atoms · 27 molecules · 9 organisms)**, five source files per component, a full token system, a Figma bundle, and a Figma plugin, naively "opening the codebase" burns hundreds of thousands of tokens and still leaves the agent uncertain. This document exists to guarantee the **non-negotiable AI-OS goal of minimal AI token usage** without sacrificing correctness.

The core mechanism is a **cache-first read discipline**: the `.ai/*` manifests and `docs/COMPONENTS.md` are compact, machine-readable digests of the expensive sources. An agent answers from them first and only descends into `src/**`, `figma/plugin/src/**`, or the generated outputs when the digest provably lacks the exact fact needed (an exact prop shape, a compound sub-part, a CSS binding).

Concretely, this doc makes agents:

- **Look up, not scan.** A component question is answered by `docs/COMPONENTS.md` + `.ai/COMPONENT_INDEX.json`, not by grepping `src/components/`.
- **Budget context.** Load the minimum set of manifests/rules for the task, and stop when enough is loaded.
- **Cache knowledge.** Persist what was learned into the `.ai/` layer so the next session (or the next agent) does not rediscover it.
- **Edit minimally.** The smallest correct diff to the correct source file — never a rewrite, never a re-read to "verify."
- **Resume cheaply.** Rehydrate from `.ai/SESSION_SUMMARY.md` + `.ai/TASKS.json` after context loss instead of re-deriving the repo state.

## 2. Responsibilities

This specification owns the **token-budget discipline** of the whole AI OS:

1. **The lookup order** — the fixed precedence in which sources are consulted (manifest → catalog → meta → source → generated), and the rule that each lower tier is opened only on a miss in the tier above.
2. **The read/cost map** — which `.ai/*` manifest answers which class of question, so an agent loads exactly one file, not the folder.
3. **Context budgeting** — how much to load per task tier and when to stop.
4. **Knowledge caching** — the write-back contract that keeps the `.ai/` cache warm and reconciled with sources #2–#3 of the hierarchy.
5. **Minimal-diff editing** — the surgical-edit rule and anti-patterns (no full-file rewrites, no verify-by-re-read).
6. **Resume economy** — the cheapest rehydration path after context loss.
7. **MCP caching contract (PLANNED)** — how a future MCP server serves the same manifests over the wire without shipping source.

It does **not** own: the manifest *schemas* ([27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md)), the memory directory structure ([37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md)), the harness execution loop ([02_AI_HARNESS.md](./02_AI_HARNESS.md)), or the resume protocol details ([28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md)). Those are referenced, not redefined.

## 3. Scope

**In-scope**

- The manifest-first lookup order and per-question routing table.
- Cost-ranked reading of `docs/COMPONENTS.md`, the `.ai/*` manifest set, `*.meta.ts`, and only-then `*.tsx`/`*.css`.
- Context budgeting per task tier (component / token / variant / plugin / doc).
- Cache warmth: when to regenerate derived manifests vs update seed/state manifests.
- Minimal-diff editing tactics and the anti-patterns they replace.
- Resume-after-context-loss economy via `SESSION_SUMMARY.md` + `TASKS.json`.

**Out-of-scope (owned elsewhere)**

- Manifest JSON Schemas & update/read rules → [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md).
- The `.ai/` memory read/write cycle in full → [37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md).
- Full resume/checkpoint protocol → [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md).
- Task lifecycle gates → [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md).
- MCP tool surface and transport → [35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md) (**PLANNED**).
- Any backend/DB/API cost model — **PLANNED**; no server, Supabase, or API exists today.

> **Terminology note.** "Token" in this document means an **AI context/LLM token** (the unit of context budget). It does **not** mean a **design token** (`--tds-*`), which is owned by [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md). Where design tokens are meant, they are named explicitly ("design token", "`--tds-*`").

## 4. Rules

Rules are enforceable and phrased **MUST** / **SHOULD** / **NEVER**. **MUST** = blocking discipline; **SHOULD** = strong default; **NEVER** = hard prohibition.

1. **R1 — Manifest-first, source-second (MUST).** For any question, the agent MUST consult the `.ai/*` manifest and/or `docs/COMPONENTS.md` **before** opening any file under `src/**`, `figma/plugin/src/**`, or the generated outputs. Source is opened only on a *provable miss* in the cache.
2. **R2 — Follow the fixed lookup order (MUST).** The order is **`.ai/*` manifest → `docs/COMPONENTS.md` → the specific `*.meta.ts` → the `*.tsx`/`*.css` → generated output**. Never skip *upward* (do not open `.tsx` to answer what the catalog already states); descending is allowed only when the tier above genuinely lacks the fact.
3. **R3 — Never open a component `.tsx` when the catalog/meta answers it (NEVER).** Variants, props, and one-line purpose live in `docs/COMPONENTS.md`. Exact variant/axis options and token bindings live in the `*.meta.ts`. Open `X.tsx`/`X.css` only for internal render structure, compound sub-parts, or the exact CSS binding the meta doesn't spell out.
4. **R4 — Load the minimum, then stop (MUST).** Load only the manifests and `docs/ai-os/*` rules the task requires (Section 5 routing table). Do **not** pre-load the whole `.ai/` folder, the whole `docs/ai-os/` set, or `src/generated/design-system.manifest.json` "just in case." Stop reading once the answer is fully determined.
5. **R5 — Never read generated bulk to learn (NEVER).** `src/generated/design-system.manifest.json`, `figma/tds.plugin.json`, `src/tokens/generated/*`, and `figma/plugin/code.js` are large derived artifacts. Read them only to *diff/verify a build output*, never as a knowledge source — the compact `.ai/*` indexes exist for that.
6. **R6 — Prefer targeted search over full reads (SHOULD).** When a fact isn't in the cache, use a scoped `grep`/glob (e.g. `grep -n "variant" src/components/atoms/Button/Button.meta.ts`) or a ranged read, not a whole-file or whole-directory read.
7. **R7 — Minimal diffs only (MUST).** Edits MUST be the smallest change to the correct **source** file (`*.meta.ts`, `src/tokens/*`, component `.tsx/.css`, or a build script). NEVER rewrite a file to change a line. NEVER hand-edit a generated output (regenerate via the build instead).
8. **R8 — Do not verify by re-reading (SHOULD).** The Edit tool errors if a change didn't apply and the harness tracks file state; a redundant full re-read to "confirm" wastes budget. Verify via the **gates** (`npm run lint`, `tsc`, `npm run ds:build`, `npm run figma:build`, `npm run plugin:test`), not by re-reading source.
9. **R9 — Cache what you learned (MUST).** After a change, regenerate the derived manifests (`npm run ds:build` → refreshes `docs/COMPONENTS.md` and the generated JSON) and update the seed/state manifests (`.ai/SESSION_SUMMARY.md`, `.ai/TASKS.json`, `.ai/CHANGELOG.md`) so future sessions read the cache, not the source. See [37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md).
10. **R10 — Resume from the summary, not the repo (MUST).** On context loss or a new session, rehydrate from `.ai/SESSION_SUMMARY.md` + `.ai/TASKS.json` **first**; re-derive from `src/**` only for the specific unfinished step. See [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md).
11. **R11 — Trust the cache, but detect staleness (MUST).** Treat `.ai/*` as authoritative for lookups, but if a manifest's `generatedAt` predates recent source commits (drift), re-run `npm run ds:build` to reconcile **before** relying on it. Never edit source based on a manifest you suspect is stale.
12. **R12 — Correctness overrides economy (NEVER trade correctness for tokens).** If the cache cannot answer a load-bearing question, the agent MUST descend to source. NEVER guess, invent a prop/variant/token name, or fabricate repo facts to save context.

## 5. Workflow

### 5.1 The manifest-first lookup order

```
1. .ai/*  (the right ONE manifest — see routing table)   ← cheapest, always first
2. docs/COMPONENTS.md  (catalog: 60 components, variants/props/purpose)
3. src/.../X.meta.ts  (exact axes, options, tokenBindings for ONE component)
4. src/.../X.tsx + X.css  (render structure, compound parts, exact CSS)   ← only on miss
5. generated outputs  (verify/diff a build result ONLY, never to learn)   ← last resort
```

Each step is entered **only** when the step above provably lacks the fact. Most tasks resolve at step 1 or 2.

### 5.2 Question → manifest routing table (load exactly one)

| The agent needs to know… | Read this first | Fall back to |
|---|---|---|
| Project identity, scripts, layout, status | `.ai/PROJECT_MANIFEST.json` | `package.json`, this canon |
| Which component to reuse; its variants/props/purpose | `docs/COMPONENTS.md` → `.ai/COMPONENT_INDEX.json` | the component's `*.meta.ts` |
| Exact variant axes/options for one component | `.ai/VARIANT_INDEX.json` | `X.meta.ts` |
| A design-token id, type, mode, alias, scope | `.ai/TOKEN_INDEX.json` | `src/tokens/*.ts` |
| Design-truth snapshot (themes, styles) | `.ai/DESIGN_MANIFEST.json` | `src/tokens/generated/figma.tokens.json` |
| Token → Figma variable/style mapping | `.ai/FIGMA_MAPPING.json` | `figma/tds.plugin.json` |
| Plugin structure / page classification / recipes | `.ai/PLUGIN_INDEX.json` | `figma/README.md`, `figma/plugin/src/*` |
| Responsive breakpoint rules | `.ai/RESPONSIVE_RULES.json` | `src/tokens/*`, `useMediaQuery` |
| Interaction/state behavior | `.ai/INTERACTION_RULES.json` | component `.tsx`, hooks |
| Motion/animation rules | `.ai/ANIMATION_RULES.json` | `src/tokens/*` motion tokens |
| What depends on what (blast radius of a change) | `.ai/DEPENDENCY_GRAPH.json` | `scripts/lib/css-bindings.ts` |
| Current work state / next step | `.ai/SESSION_SUMMARY.md` + `.ai/TASKS.json` | git log |
| Recent changes / review status | `.ai/CHANGELOG.md` / `.ai/REVIEW_REPORT.md` | git history |
| **PLANNED** DB schema / API contract | `.ai/ERD.json` / `.ai/API_SPEC.json` | — (none exists yet) |

### 5.3 Canonical low-token task loop (reuse a component)

1. **Rehydrate cheaply.** If resuming, read `.ai/SESSION_SUMMARY.md` + `.ai/TASKS.json` (R10). Otherwise skip.
2. **Catalog lookup.** Read `docs/COMPONENTS.md` (one file, all 60 components) to pick the component and confirm it already exists — reuse-first ([07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md)).
3. **Precision lookup (only if needed).** For exact axis options/props, read that component's `*.meta.ts` (or `.ai/VARIANT_INDEX.json`), not its `.tsx`.
4. **Descend only on a miss.** Open `X.tsx`/`X.css` solely for compound sub-parts or render internals the meta can't answer (R3).
5. **Minimal edit.** Make the smallest correct change to the correct source (R7). Import from the barrel `@/components` only.
6. **Validate via gates, not re-reads (R8).** `npm run lint` · `tsc` · `npm run ds:build` · `npm run figma:build`.
7. **Warm the cache (R9).** `ds:build` refreshes `docs/COMPONENTS.md` + generated JSON; update `.ai/SESSION_SUMMARY.md`, `.ai/TASKS.json`, `.ai/CHANGELOG.md`.

### 5.4 Context budget by task tier (guidance)

| Task tier | Load (in order) | Do **not** load |
|---|---|---|
| Reuse/compose UI | `COMPONENTS.md` (+ one `*.meta.ts` if precision needed) | any `.tsx`, the generated manifest, the plugin |
| Edit a variant | `.ai/VARIANT_INDEX.json` + the one `*.meta.ts` + its `.css` | other components, the bundle |
| Add/change a design token | `.ai/TOKEN_INDEX.json` + the relevant `src/tokens/*.ts` | `tokens.css`/`figma.tokens.json` (generated) |
| Plugin/Figma work | `figma/README.md` + `.ai/FIGMA_MAPPING.json` + `.ai/PLUGIN_INDEX.json` | `figma/tds.plugin.json` bulk, `code.js` |
| Write/maintain a doc | the sibling docs it cross-refs + `.ai/PROJECT_MANIFEST.json` | source trees |

## 6. Examples

**Good — answered at the catalog (≈1 file):**

> _Task: "Add a danger-tone pill Button to the toolbar."_
> Read `docs/COMPONENTS.md` → Button row already lists `variant=solid|outline|ghost|soft|link · tone=…|danger · shape=rounded|pill|square`. Import from `@/components`, use `<Button tone="danger" shape="pill">`. **No `.tsx` opened.** Total: one catalog read.

**Bad — wasteful (what R1/R3 forbid):**

```text
grep -r "Button" src/            # scans dozens of files
read src/components/atoms/Button/Button.tsx     # full render source
read src/components/index.ts                     # whole barrel
read src/generated/design-system.manifest.json  # huge generated bulk
```

All four are avoidable — `docs/COMPONENTS.md` already carried the variants and props.

**Good — precision lookup, minimal descent:**

> _Task: "What are the exact `size` options for `Avatar`?"_
> `docs/COMPONENTS.md` → `Avatar` row: `size=xs|sm|md|lg|xl`. Done. If the task instead needed the *token binding* for the avatar ring, read `Avatar.meta.ts` (one file), not `Avatar.tsx`.

**Good — minimal diff (R7):**

```diff
// src/components/atoms/Badge/Badge.meta.ts  — change a default only
-  defaultVariant: 'solid',
+  defaultVariant: 'soft',
```

One-line Edit to the source meta, then `npm run ds:build && npm run figma:build`. **Not** a rewrite of the file, and **not** a hand-edit of `docs/COMPONENTS.md` or `figma/tds.plugin.json` (those regenerate).

**Good — cheap resume (R10):**

> New session, context lost mid-task. Read `.ai/SESSION_SUMMARY.md` ("editing Card `type=C` overlay padding; meta done, CSS pending") + `.ai/TASKS.json` (next step). Re-open **only** `Card.css`. No repo re-scan.

**Bad — verify-by-re-read (R8):**

> After a successful Edit, re-reading the whole `*.meta.ts` "to be sure." The Edit already succeeded (it errors otherwise). Run the gate instead: `npm run figma:build`.

## 7. Validation Rules

Token-economy compliance is checked by a mix of observable behavior and the real repo gates:

- **Lookup-order audit (manual/review).** In [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md) and the `.ai/REVIEW_REPORT.md`, a reviewer confirms the agent's reads followed Section 5.1 — catalog/manifest reads precede any `src/**` read, and no `.tsx` was opened for a fact the catalog holds.
- **No generated-bulk reads.** The transcript/tool log MUST show no read of `src/generated/design-system.manifest.json`, `figma/tds.plugin.json`, or `figma/plugin/code.js` used as a *knowledge* source (R5).
- **Minimal-diff gate (`git diff`).** The change set is surgical: only the correct source files changed; `docs/COMPONENTS.md`, `figma/*`, `src/generated/*`, `src/tokens/generated/*` change **only** as regenerated output of `npm run ds:build`/`npm run figma:build`, never by hand (enforced conceptually by the generated-is-sacred guard, [00_MASTER_RULES.md](./00_MASTER_RULES.md)).
- **Cache-freshness gate.** After any source change, `npm run ds:build` MUST have been run so `docs/COMPONENTS.md` and the generated manifests match source; `npm run figma:build` (`plugin:typecheck` + `plugin:build` + `plugin:test` headless harness) MUST be green — this proves the cache the *next* agent will trust is correct.
- **Resume validity.** `.ai/SESSION_SUMMARY.md` + `.ai/TASKS.json` MUST be updated so a fresh agent can rehydrate without re-scanning (spot-checked per [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md)).
- **Schema validity.** Updated `.ai/*` manifests MUST still validate against their `$schema`/`version` contract ([27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md)).

## 8. Checklist

- [ ] Resuming? Read `.ai/SESSION_SUMMARY.md` + `.ai/TASKS.json` **before** any source.
- [ ] Answered from `docs/COMPONENTS.md` / the right `.ai/*` manifest first (Section 5.2 routing table).
- [ ] Opened a `*.meta.ts` only for precision the catalog lacked; opened a `.tsx`/`.css` only for render internals/compound parts.
- [ ] Did **not** read `src/generated/*`, `figma/tds.plugin.json`, or `code.js` as a knowledge source.
- [ ] Loaded the minimum manifests/docs for the task tier; stopped when the answer was determined.
- [ ] Used scoped `grep`/ranged reads instead of whole-file/whole-directory reads where possible.
- [ ] Edit is the smallest correct change to the correct **source**; no full-file rewrite; no hand-edit of generated output.
- [ ] Did **not** re-read files to "verify" — used the gates instead.
- [ ] Ran `npm run ds:build` (+ `npm run figma:build`) to re-warm the cache from source.
- [ ] Updated `.ai/SESSION_SUMMARY.md`, `.ai/TASKS.json`, `.ai/CHANGELOG.md`.
- [ ] Confirmed manifests aren't stale (R11); reconciled via `ds:build` if `generatedAt` predated recent commits.

## 9. Failure Recovery

| Symptom | Diagnosis | Fix | Resume |
|---|---|---|---|
| Context nearly full mid-task | Over-loaded source / read whole dirs (R4 breach) | Drop to essentials: keep `SESSION_SUMMARY.md`, `TASKS.json`, and the one file being edited; discard the rest | Continue the current step only |
| Answer contradicts the running code | Manifest was **stale** (drift; R11) | Re-run `npm run ds:build` to regenerate `docs/COMPONENTS.md` + generated JSON; re-read the refreshed cache | Re-answer from warm cache |
| Re-derived the whole repo after a crash | Skipped the cheap resume path (R10) | Stop; read `.ai/SESSION_SUMMARY.md` + `.ai/TASKS.json`; open only the unfinished file | Resume at recorded next step |
| Edited `docs/COMPONENTS.md` / `figma/*` / `src/generated/*` directly | Treated a generated cache as source (R5/R7 breach) | Revert the hand-edit; change the real source; re-run `ds:build`/`figma:build` | Re-run the gate |
| Kept re-reading a file to confirm edits | Verify-by-re-read (R8 breach) | Trust the Edit result; run `npm run lint` + `npm run figma:build` | Proceed on green gates |
| Couldn't find a prop/variant fact in cache | Genuine cache miss (allowed) | Descend the lookup order to the exact `*.meta.ts`/`.tsx`; then **update `.ai/*`** so the next agent finds it | Cache warmed for reuse |
| Guessed a token/variant name to save reads | Economy over correctness (R12 breach) | Stop; verify the real name in `.ai/TOKEN_INDEX.json`/`.ai/VARIANT_INDEX.json` or source; correct the change | Re-validate via gates |

Universal recovery move: **re-warm then re-read**. Run `npm run ds:build` (and `npm run figma:build` for plugin/Figma paths) so the `.ai/*` cache and `docs/COMPONENTS.md` reflect current source, then answer from the warm cache — never from suspect memory.

## 10. Dependencies

**Docs**
- [00_MASTER_RULES.md](./00_MASTER_RULES.md) — precedence, generated-is-sacred, source-of-truth hierarchy (the cache is #3, never authoritative over source #2).
- [01_AI_SPECIFICATION.md](./01_AI_SPECIFICATION.md) — read-before-write, determinism, no-fabrication (R12).
- [02_AI_HARNESS.md](./02_AI_HARNESS.md) — how context is assembled from `.ai/`; this doc is its token-budget rule.
- [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md) — reuse-first; the 5-file anatomy the lookup order descends through.
- [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md) — `.ai/TOKEN_INDEX.json` is the cache to read before `src/tokens/*`.
- [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md) — `.ai/VARIANT_INDEX.json` for exact axes/options.
- [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md) — schemas/read/update rules for every `.ai/*` file.
- [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md) — cheap rehydration protocol (R10).
- [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md) — the lifecycle whose "read manifests" step this governs.
- [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md) — lookup-order and minimal-diff audit.
- [35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md) — **PLANNED** MCP caching of the same manifests.
- [37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md) — the `.ai/` read/write cycle that keeps the cache warm.
- [38_AI_WORKFLOW.md](./38_AI_WORKFLOW.md) / [39_AI_CHECKLIST.md](./39_AI_CHECKLIST.md) — the low-token recipes/checklists that operationalize this doc.

**Manifests (the cache this doc optimizes)**
- Derived (regenerated from source): [.ai/PROJECT_MANIFEST.json](../../.ai/PROJECT_MANIFEST.json), [.ai/DESIGN_MANIFEST.json](../../.ai/DESIGN_MANIFEST.json), [.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json), [.ai/TOKEN_INDEX.json](../../.ai/TOKEN_INDEX.json), [.ai/FIGMA_MAPPING.json](../../.ai/FIGMA_MAPPING.json), [.ai/PLUGIN_INDEX.json](../../.ai/PLUGIN_INDEX.json), [.ai/VARIANT_INDEX.json](../../.ai/VARIANT_INDEX.json), [.ai/RESPONSIVE_RULES.json](../../.ai/RESPONSIVE_RULES.json), [.ai/INTERACTION_RULES.json](../../.ai/INTERACTION_RULES.json), [.ai/ANIMATION_RULES.json](../../.ai/ANIMATION_RULES.json), [.ai/DEPENDENCY_GRAPH.json](../../.ai/DEPENDENCY_GRAPH.json).
- Seed/state (hand/agent-maintained): [.ai/TASKS.json](../../.ai/TASKS.json), [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md), [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md), [.ai/REVIEW_REPORT.md](../../.ai/REVIEW_REPORT.md).
- **PLANNED** (no backend yet): [.ai/ERD.json](../../.ai/ERD.json), [.ai/API_SPEC.json](../../.ai/API_SPEC.json).
- Catalog: [docs/COMPONENTS.md](../COMPONENTS.md).

**Scripts (cache regeneration)**
- `npm run ds:build` → `scripts/build-tokens.ts`, `scripts/build-manifest.ts`, `scripts/build-catalog.ts` (refreshes `docs/COMPONENTS.md` + generated JSON).
- `npm run figma:build` → adds `plugin:typecheck`/`plugin:build`/`plugin:test` (the headless harness gate).

## 11. Template

Copy-paste **lookup-plan** skeleton to prepend to any task — declare the cheap reads before touching source:

```text
TASK: <one line>
TIER: reuse | edit-variant | token | plugin | doc
RESUME? (if yes) read: .ai/SESSION_SUMMARY.md, .ai/TASKS.json
CACHE READS (in order, stop when answered):
  1) docs/COMPONENTS.md            # component pick + variants/props
  2) .ai/<ONE manifest>            # e.g. TOKEN_INDEX.json / VARIANT_INDEX.json
  3) src/.../X.meta.ts             # ONLY if exact axes/bindings still unknown
DESCEND (only on a proven miss):
  4) src/.../X.tsx + X.css         # render internals / compound parts
EDIT: smallest diff to <exact source file>; import from @/components
GATES: npm run lint && tsc && npm run ds:build && npm run figma:build
WARM CACHE: update .ai/SESSION_SUMMARY.md, .ai/TASKS.json, .ai/CHANGELOG.md
NEVER: read generated bulk to learn · hand-edit generated output · re-read to verify · guess a name
```

Minimal-diff edit skeleton:

```diff
// change ONE source line; never rewrite the file
- <old source line in *.meta.ts | src/tokens/*.ts | X.css>
+ <new source line>
// then: npm run ds:build && npm run figma:build   (regenerates the cache)
```

## 12. Future Extension

- **MCP-served cache (PLANNED).** [35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md) describes a PLANNED MCP server that exposes the `.ai/*` manifests + `docs/COMPONENTS.md` as tool responses, so remote agents query the digest over the wire and **never fetch `src/**` bulk**. The same lookup order and routing table (Section 5) apply unchanged; only the transport differs. No MCP server exists today.
- **Incremental manifest builds.** As the system grows past 60 components, `scripts/build-*.ts` can emit per-component manifest shards and a slim top-level index so agents load one shard, not the whole `COMPONENT_INDEX.json` — keeping per-lookup cost flat at enterprise scale (>10,000,000 users of the shipped product).
- **Cache-hit telemetry (PLANNED).** A future review/CI hook ([25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md), PLANNED) could record, per task, the ratio of cache reads to source reads and flag regressions where agents drift back to whole-source scanning.
- **Semantic pre-summaries.** Long docs in `docs/ai-os/` can carry an auto-generated abstract that agents load first, descending to the full doc only on a miss — extending the manifest-first principle to the documentation set itself.
- **PLANNED backend caches.** When the PLANNED Supabase backend/API lands, `.ai/ERD.json` and `.ai/API_SPEC.json` become the cheap read for schema/contract questions (read before any SQL/migration or API source), preserving this doc's discipline across the full stack. None of that exists yet.
