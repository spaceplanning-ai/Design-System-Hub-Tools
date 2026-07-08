<!-- filename: 37_AI_MEMORY_SYSTEM.md -->

# 37 — AI Memory System

> **Title:** AI Memory System
> **Purpose:** Define the `.ai/` memory layer in full — its directory structure, the read/write cycle, its precedence beneath the source-of-truth hierarchy, when each manifest is read vs written, how derived manifests are regenerated/reconciled from source, memory hygiene (staleness, drift detection, invalidation), and the lifecycle of `SESSION_SUMMARY.md` / `CHANGELOG.md` / `REVIEW_REPORT.md`.
> **Status:** ACTIVE (the design, precedence, and hygiene rules are binding today). The `.ai/` directory exists but is currently **empty**; its population and the regeneration script `scripts/build-ai-manifests.ts` are **PLANNED** and marked as such throughout. `ERD.json` / `API_SPEC.json` describe a **PLANNED** backend.
> **Owner:** AI OS
> **Last-reviewed:** _(placeholder — set on first review)_
> **Precedence:** Subordinate to [00_MASTER_RULES.md](./00_MASTER_RULES.md) (the constitution). The `.ai/` layer is the **lowest-authority** artifact in the repo: it is a regenerable cache/state layer that is always reconciled *from* source (Storybook + `*.meta.ts` + `src/tokens/*`) and the generated manifests — it **never** overrides them and edits to it **never** flow back up. Manifest *schemas* are owned by [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md); this document owns the *system* they live in.

---

## 1. Purpose

The `.ai/` directory is the AI Operating System's **memory** — a small, cheap, machine-readable cache and state layer that lets any agent (Claude Code, Gemini CLI, Cursor, Codex, Windsurf, or a PLANNED MCP agent) orient in the `tds` repo in seconds instead of re-reading `src/`. It exists so the four non-negotiable AI-OS guarantees hold in practice: **minimal token usage**, **resume-after-context-loss**, **no duplicated work**, and **no drift**.

Concretely, `.ai/` serves two jobs that must never be confused:

1. **Index / cache (DERIVED).** Pre-digested views of the design system — components, tokens, variants, Figma mapping, plugin surface, dependencies — so an agent reads a 200-line JSON instead of 60 `*.meta.ts` files. These are **regenerated from source**; they hold no authority of their own.
2. **State / journal (SEED).** The agent's working memory across sessions — the task queue (`TASKS.json`), the resume note (`SESSION_SUMMARY.md`), the audit log (`CHANGELOG.md`), and the review record (`REVIEW_REPORT.md`). These are **written by agents**, not derived, and are the backbone of resume ([28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md)).

This document fixes exactly how those live together: the structure, the read/write ordering, the precedence rule that keeps memory subordinate to truth, and the hygiene that stops a stale cache from ever being trusted over the code.

## 2. Responsibilities

This specification owns:

- The **full `.ai/` directory structure** — all 17 manifests, their category (DERIVED / SEED / PLANNED), and their upstream source.
- The **read/write cycle** — the ordering an agent MUST follow at task start (read) and task end (write), and which manifests participate in each.
- The **precedence** of `.ai/` within the source-of-truth hierarchy ([00_MASTER_RULES.md](./00_MASTER_RULES.md) §E) — always below source and the generated manifests.
- The **reconciliation / regeneration** model: DERIVED manifests are rebuilt from the existing `ds:build` outputs via the PLANNED `scripts/build-ai-manifests.ts`, never hand-tuned to match.
- **Memory hygiene** — staleness detection (`generatedAt`/`sourceHash`), drift detection against the generated manifests, and invalidation rules.
- The **lifecycle** of the three journal artifacts: `SESSION_SUMMARY.md`, `CHANGELOG.md`, `REVIEW_REPORT.md`.

It does **not** own: the per-manifest JSON **schemas** and field-level shape ([27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md)); the resume *procedure* ([28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md)); the token-minimization tactics that consume this cache ([26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md)); the harness that drives the cycle ([02_AI_HARNESS.md](./02_AI_HARNESS.md)); or the MCP surface that will expose it ([35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md)).

## 3. Scope

**In-scope**

- The physical layout of `.ai/` and the classification of every manifest.
- The deterministic read order (rehydrate → index) and write order (regenerate → journal).
- Precedence and the "never flows back up" law.
- Regeneration from source and the PLANNED `scripts/build-ai-manifests.ts` contract.
- Staleness, drift, and invalidation mechanics.
- The `SESSION_SUMMARY.md` / `CHANGELOG.md` / `REVIEW_REPORT.md` lifecycles.

**Out-of-scope (owned elsewhere)**

- Manifest field schemas & examples → [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md).
- Rehydration/checkpoint procedure → [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md).
- The end-to-end task lifecycle → [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md).
- Review gates that produce `REVIEW_REPORT.md` → [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md).
- Change/version propagation feeding `CHANGELOG.md` → [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md).
- The **PLANNED** backend contracts `ERD.json` / `API_SPEC.json` → [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [15_API_GUIDE.md](./15_API_GUIDE.md).
- Where `.ai/` sits in the repo tree → [18_FOLDER_STRUCTURE.md](./18_FOLDER_STRUCTURE.md).

## 4. Rules

Numbered, enforceable. **MUST / SHOULD / NEVER.**

1. **R1 — Memory is subordinate (MUST).** `.ai/` is source-of-truth rank **4** in [00_MASTER_RULES.md](./00_MASTER_RULES.md) §E — below the source (`*.meta.ts`, `src/tokens/*`, Storybook) and below the generated manifests (`figma/tds.plugin.json`, `src/generated/design-system.manifest.json`, `src/tokens/generated/*`). When a DERIVED manifest disagrees with its source, the **source wins** and the manifest is stale — regenerate it, never trust it.

2. **R2 — Read before write (MUST).** Every task MUST begin by reading `.ai/SESSION_SUMMARY.md` then `.ai/TASKS.json`, then the one or two INDEX manifests relevant to the task's target, **before** opening `src/`. This is the manifest-first law of [02_AI_HARNESS.md](./02_AI_HARNESS.md) R-series and [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md).

3. **R3 — DERIVED manifests are regenerated, never hand-edited (MUST/NEVER).** `COMPONENT_INDEX.json`, `TOKEN_INDEX.json`, `VARIANT_INDEX.json`, `FIGMA_MAPPING.json`, `PLUGIN_INDEX.json`, `DESIGN_MANIFEST.json`, `RESPONSIVE_RULES.json`, `INTERACTION_RULES.json`, `ANIMATION_RULES.json`, and `DEPENDENCY_GRAPH.json` MUST be produced by the PLANNED `scripts/build-ai-manifests.ts` from the `ds:build` outputs. **NEVER** hand-edit them to match reality — change the source and re-run (this mirrors the generated-is-sacred rule for `figma/`, `src/generated/`, `src/tokens/generated/`).

4. **R4 — SEED manifests are agent-written (MUST).** `TASKS.json`, `SESSION_SUMMARY.md`, `CHANGELOG.md`, `REVIEW_REPORT.md`, and the seed fields of `PROJECT_MANIFEST.json` are **not** derived; agents MUST maintain them by hand/tooling per §8's lifecycles. Each carries `"seed": true` (or is Markdown) instead of a `generator`.

5. **R5 — Never flows back up (NEVER).** No value in `.ai/` may be treated as authoritative over source, and no `.ai/` edit may be "promoted" into `src/`, tokens, the bundle, or Figma. Memory is a downstream mirror only.

6. **R6 — Every manifest is self-describing (MUST).** Every JSON manifest MUST carry `"$schema"`, `"version"`, `"generatedAt"`, and either `"generator"` (DERIVED) or `"seed": true` / `"status": "planned"` (non-derived), per [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md). An agent MUST check `generatedAt`/`sourceHash` before trusting a DERIVED manifest (§ staleness, R9).

7. **R7 — Write-back is mandatory (MUST).** After a successful change an agent MUST (a) regenerate the affected DERIVED manifests, (b) mark the task done in `TASKS.json`, (c) append `CHANGELOG.md`, and (d) refresh `SESSION_SUMMARY.md` — in that order (§5). A task that changed source but left `.ai/` stale is **incomplete**.

8. **R8 — Regenerate from the pipeline, not from memory (MUST).** DERIVED manifests derive from the **outputs** of `npm run ds:build` (and, for `PLUGIN_INDEX.json`, `npm run plugin:build`), never from another `.ai/` file. This keeps `.ai/` a leaf of the dependency graph and prevents cache-of-a-cache drift.

9. **R9 — Staleness invalidates trust (MUST).** A DERIVED manifest whose recorded `sourceHash` (or `generatedAt`) predates the last change to its upstream source is **stale** and MUST be treated as absent — the agent regenerates it or falls back to reading source. Never act on known-stale cache.

10. **R10 — Drift is a red gate (MUST).** If a regenerated DERIVED manifest differs from what the agent believed (a diff on `build-ai-manifests`), that diff is **drift** and MUST be surfaced (recorded in `REVIEW_REPORT.md`), not silently discarded — it usually means an out-of-band edit or a missed rebuild.

11. **R11 — PLANNED manifests are labelled (MUST).** `ERD.json` and `API_SPEC.json` describe a backend that **does not exist today**; they MUST carry `"status": "planned"` and MUST NOT be consumed as if real until the backend lands ([14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [15_API_GUIDE.md](./15_API_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md)).

12. **R12 — No secrets in memory (NEVER).** `.ai/` is committed and low-trust; it MUST NEVER contain secrets, tokens, credentials, or PII. The PLANNED backend manifests carry *shape*, never data ([22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md)).

13. **R13 — One journal, append-only where stated (MUST).** `CHANGELOG.md` is **append-only** (never rewrite history); `SESSION_SUMMARY.md` is **replace-in-place** (a single current snapshot); `TASKS.json` is **mutate-in-place** (status transitions). Respect each artifact's write discipline (§8).

## 5. Workflow

The memory read/write cycle wraps every task. It has two halves: **rehydrate/read** at intake and **regenerate/journal** at completion. Reference the real scripts and the [02_AI_HARNESS.md](./02_AI_HARNESS.md) loop.

### 5.1 Read half (task start)

```text
Step R0  Rehydrate     read  .ai/SESSION_SUMMARY.md   (where was I? design-lock reminder)
Step R1  Load queue    read  .ai/TASKS.json           (resume in-progress, or intake new)
Step R2  Load index    read  the 1–2 INDEX manifests for the target:
                              component work → COMPONENT_INDEX.json (+ VARIANT_INDEX.json)
                              token work     → TOKEN_INDEX.json
                              figma/plugin   → FIGMA_MAPPING.json (+ PLUGIN_INDEX.json)
                              cross-file     → DEPENDENCY_GRAPH.json
Step R3  Freshness     check generatedAt / sourceHash (R9). If stale → regenerate or read source.
Step R4  Escalate      only now, if the index cannot answer, open the specific *.meta.ts / source.
```

### 5.2 Write half (task end)

```text
Step W0  Source change complete + gates green (lint, tsc, ds:build, figma:build, plugin:test).
Step W1  Regenerate    npm run ds:build   → refreshes src/generated + figma/tds.plugin.json + docs/COMPONENTS.md
                        (PLANNED) npm run ai:build  → scripts/build-ai-manifests.ts refreshes the DERIVED .ai/* set
Step W2  Task state     .ai/TASKS.json     → move the task to done; add any follow-ups
Step W3  Audit log      .ai/CHANGELOG.md   → append a dated entry (append-only, R13)
Step W4  Resume note    .ai/SESSION_SUMMARY.md → replace with the new current snapshot
Step W5  Review record  .ai/REVIEW_REPORT.md → written by the review gate (30_REVIEW_SYSTEM.md) if run
```

### 5.3 Regeneration (PLANNED `scripts/build-ai-manifests.ts`)

Until this script exists, DERIVED manifests are seeded/reconciled by hand from the same inputs; the target automation is:

```text
INPUTS  (already produced by the existing pipeline)
  src/tokens/generated/{token-ids.ts, figma.tokens.json, tokens.css}   ← tokens:build
  src/generated/design-system.manifest.json                            ← manifest:build
  figma/tds.plugin.json  { tokens, design }                            ← manifest:build
  docs/COMPONENTS.md                                                   ← catalog:build
  src/components/metas.ts (componentMetas registry)                    ← source of record

OUTPUTS  (.ai/ DERIVED manifests, each stamped $schema/version/generatedAt/generator/sourceHash)
  DESIGN_MANIFEST.json      ← design-system.manifest.json summary
  COMPONENT_INDEX.json      ← componentMetas (24 atoms / 27 molecules / 9 organisms)
  TOKEN_INDEX.json          ← token-ids.ts + figma.tokens.json
  VARIANT_INDEX.json        ← per-component variant axes (type/variant/tone/size/shape)
  FIGMA_MAPPING.json        ← design.components[] (variantAxes, figmaProperties, tokenBindings)
  PLUGIN_INDEX.json         ← figma/plugin/src modules + bundle coverage
  RESPONSIVE_RULES.json     ← breakpoint tokens / meta responsive hints
  INTERACTION_RULES.json    ← interaction-state + disclosure hook map
  ANIMATION_RULES.json      ← motion tokens (duration/easing)
  DEPENDENCY_GRAPH.json     ← import graph (barrel, metas.ts, plugin entry code.ts)

The script MUST be pure (inputs → outputs), MUST stamp sourceHash, and MUST NOT touch SEED/PLANNED files.
A PLANNED npm alias  "ai:build": "tsx scripts/build-ai-manifests.ts"  folds it into ds:build.
```

## 6. Examples

**6.1 The `.ai/` directory (17 manifests, categorized).** DERIVED = regenerated from source; SEED = agent-written; PLANNED = future backend.

```text
.ai/
├─ PROJECT_MANIFEST.json     SEED    repo identity/index (tds v0.1.0, ESM, Node ≥20) + pointers
├─ DESIGN_MANIFEST.json      DERIVED design-system summary (from src/generated/design-system.manifest.json)
├─ COMPONENT_INDEX.json      DERIVED 60 components, tiers, props, variant axes (from componentMetas)
├─ TOKEN_INDEX.json          DERIVED token ids → --tds-* → figma var names (from tokens/generated/*)
├─ VARIANT_INDEX.json        DERIVED per-component axes type(A/B/C)/variant/tone/size/shape
├─ FIGMA_MAPPING.json        DERIVED component→ComponentSet mapping (from figma/tds.plugin.json design)
├─ PLUGIN_INDEX.json         DERIVED plugin module surface + bundle coverage (from figma/plugin/src)
├─ RESPONSIVE_RULES.json     DERIVED breakpoints / responsive hints
├─ INTERACTION_RULES.json    DERIVED interaction states + disclosure hook map
├─ ANIMATION_RULES.json      DERIVED motion tokens (duration/easing, reduced-motion)
├─ DEPENDENCY_GRAPH.json     DERIVED import graph across src/ + figma/plugin
├─ ERD.json                  PLANNED  backend schema contract  ("status":"planned")
├─ API_SPEC.json             PLANNED  API contract             ("status":"planned")
├─ TASKS.json                SEED    task queue / lifecycle state
├─ SESSION_SUMMARY.md        SEED    single current resume snapshot (Markdown)
├─ CHANGELOG.md              SEED    append-only audit log (Markdown)
└─ REVIEW_REPORT.md          SEED    latest review record (Markdown)
```

**6.2 A DERIVED manifest header (self-describing, checkable for staleness — R6/R9).**

```json
{
  "$schema": "./_schemas/component-index.schema.json",
  "version": "1.0.0",
  "generatedAt": "2026-07-08T00:00:00Z",
  "generator": "scripts/build-ai-manifests.ts (PLANNED)",
  "sourceHash": "sha256:<hash of componentMetas + design-system.manifest.json>",
  "counts": { "atoms": 24, "molecules": 27, "organisms": 9 },
  "components": [
    { "name": "Button", "tier": "atoms", "axes": ["type", "variant", "tone", "size", "shape"] }
  ]
}
```

**6.3 A SEED manifest header (agent-written — R4).**

```json
{
  "$schema": "./_schemas/tasks.schema.json",
  "version": "1.0.0",
  "generatedAt": "2026-07-08T00:00:00Z",
  "seed": true,
  "tasks": [
    { "id": "T-001", "title": "Add Callout molecule", "status": "in_progress", "target": "component" }
  ]
}
```

**6.4 Staleness check before trusting the cache (R9).**

```text
COMPONENT_INDEX.json.sourceHash  !=  hash(current componentMetas)   → STALE
  → run npm run ds:build && (PLANNED) npm run ai:build              → refresh
  → if script absent, fall back to reading src/components/metas.ts  → then reconcile by hand
```

## 7. Validation Rules

Compliance is checked by the real gates plus manifest-specific checks:

- **Freshness (automatable).** `sourceHash` on each DERIVED manifest MUST equal the hash of its inputs after `npm run ds:build`. A mismatch = stale (R9). PLANNED: `scripts/build-ai-manifests.ts` exits non-zero on mismatch, folded into `figma:build` as a gate.
- **Regeneration is idempotent.** Running the regeneration twice with no source change MUST produce byte-identical DERIVED manifests (pure function, R8). Any diff = drift (R10).
- **Schema conformance.** Every manifest validates against its schema in [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md) and carries the required `$schema`/`version`/`generatedAt` + `generator`/`seed`/`status` (R6).
- **Source-of-truth cross-check.** DERIVED counts/names MUST match the generated manifests: `COMPONENT_INDEX.json` counts = 60 (24/27/9); `FIGMA_MAPPING.json` component set = `figma/tds.plugin.json.design.components`; `TOKEN_INDEX.json` ids = `src/tokens/generated/token-ids.ts`. A mismatch blocks (R1).
- **No hand-edits to DERIVED (manual + review).** Reviewer confirms DERIVED manifests were regenerated, not typed (R3), via `30_REVIEW_SYSTEM.md` and `git diff` shape.
- **PLANNED labelling.** `ERD.json` / `API_SPEC.json` carry `"status":"planned"` (R11); no code path consumes them as real.
- **Secret scan.** `.ai/` contains no secrets/PII (R12) — part of the security checklist ([22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md)).

## 8. Checklist

Task-start (read):

- [ ] Read `.ai/SESSION_SUMMARY.md` (rehydrate + Design-Lock reminder).
- [ ] Read `.ai/TASKS.json` (resume in-progress or intake new).
- [ ] Loaded only the target's INDEX manifest(s) (component/token/figma) — not all of `src/`.
- [ ] Verified `generatedAt`/`sourceHash` fresh (R9); regenerated if stale.

Task-end (write, in order — R7/R13):

- [ ] Source change complete; `lint` / `tsc` / `ds:build` / `figma:build` / `plugin:test` green.
- [ ] Regenerated DERIVED manifests (`ds:build` + PLANNED `ai:build`); no hand-edits (R3).
- [ ] `.ai/TASKS.json` task moved to done; follow-ups captured.
- [ ] `.ai/CHANGELOG.md` appended (append-only).
- [ ] `.ai/SESSION_SUMMARY.md` replaced with current snapshot.
- [ ] `.ai/REVIEW_REPORT.md` written if a review gate ran ([30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)).
- [ ] No secrets in any `.ai/` file (R12); PLANNED files still labelled (R11).

## 9. Failure Recovery

| Symptom | Diagnosis | Fix | How to resume |
| --- | --- | --- | --- |
| Fresh agent, no context | Context loss between sessions | Execute Read half: `.ai/SESSION_SUMMARY.md` → `.ai/TASKS.json` | Continue at the last unchecked task item ([28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md)) |
| Cache disagrees with `src/` | DERIVED manifest stale (R9) | `npm run ds:build` + PLANNED `ai:build`; trust source, discard cache | Re-read the refreshed INDEX manifest |
| DERIVED manifest was hand-edited | R3 violation | Revert the edit; regenerate from pipeline | Re-run gates; note in `REVIEW_REPORT.md` |
| Regeneration produces a diff | Drift — out-of-band edit or missed rebuild (R10) | Investigate the source change; regenerate; surface diff | Record drift in `REVIEW_REPORT.md`, then proceed |
| `.ai/` empty (today's state) | Not yet populated (PLANNED) | Fall back to source: `metas.ts`, `token-ids.ts`, `figma/tds.plugin.json`, `docs/COMPONENTS.md` | Seed manifests as they are built; author `scripts/build-ai-manifests.ts` |
| `CHANGELOG.md` history rewritten | R13 violation (append-only) | `git revert` the rewrite; re-append the correct entry | Continue journaling additively |
| Consuming `ERD.json`/`API_SPEC.json` as real | Backend doesn't exist (R11) | Stop; treat as PLANNED spec only | Resume once backend lands ([17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md)) |

## 10. Dependencies

- **Docs:** [00_MASTER_RULES.md](./00_MASTER_RULES.md) (precedence §E, generated-is-sacred, Design Lock), [02_AI_HARNESS.md](./02_AI_HARNESS.md) (drives the read/write cycle), [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md) (why cache-first), [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md) (per-manifest schemas), [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md) (rehydration), [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md) (task lifecycle), [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md) (`REVIEW_REPORT.md`), [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md) (`CHANGELOG.md`), [18_FOLDER_STRUCTURE.md](./18_FOLDER_STRUCTURE.md) (`.ai/` placement), [35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md) (PLANNED MCP surface over `.ai/`), [38_AI_WORKFLOW.md](./38_AI_WORKFLOW.md) (recipes), [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md) / [15_API_GUIDE.md](./15_API_GUIDE.md) (PLANNED `ERD.json`/`API_SPEC.json`), [22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md) (no secrets).
- **Scripts:** existing `scripts/build-tokens.ts`, `scripts/build-manifest.ts`, `scripts/build-catalog.ts` (produce the inputs); PLANNED `scripts/build-ai-manifests.ts` (produces the DERIVED `.ai/*` set).
- **Generated inputs:** `src/tokens/generated/*`, `src/generated/design-system.manifest.json`, `figma/tds.plugin.json`, `docs/COMPONENTS.md`.
- **Manifests (self):** all 17 in [.ai/](../../.ai/) — [.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json), [.ai/TOKEN_INDEX.json](../../.ai/TOKEN_INDEX.json), [.ai/VARIANT_INDEX.json](../../.ai/VARIANT_INDEX.json), [.ai/FIGMA_MAPPING.json](../../.ai/FIGMA_MAPPING.json), [.ai/PLUGIN_INDEX.json](../../.ai/PLUGIN_INDEX.json), [.ai/DESIGN_MANIFEST.json](../../.ai/DESIGN_MANIFEST.json), [.ai/PROJECT_MANIFEST.json](../../.ai/PROJECT_MANIFEST.json), [.ai/DEPENDENCY_GRAPH.json](../../.ai/DEPENDENCY_GRAPH.json), [.ai/TASKS.json](../../.ai/TASKS.json), [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md), [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md), [.ai/REVIEW_REPORT.md](../../.ai/REVIEW_REPORT.md).

## 11. Template

**11.1 `SESSION_SUMMARY.md` (replace-in-place — single current snapshot):**

```markdown
# Session Summary
_Updated: 2026-07-08T00:00:00Z_

## Design Lock
Storybook is the ONLY source of truth. No self-initiated visual change. Generated outputs are sacred.

## Current task
T-001 — <title> — status: in_progress. Target: <component|token|plugin|doc|manifest>.

## Done last
- <one-line what changed> (gates green: lint/tsc/ds:build/figma:build/plugin:test)

## Next
- <the next unchecked step>

## Open follow-ups
- <id> — <note>
```

**11.2 `CHANGELOG.md` (append-only — R13):**

```markdown
## 2026-07-08 — T-001 Add Callout molecule
- Added src/components/molecules/Callout/* (5 files); registered in metas.ts + molecules/index.ts.
- Ran ds:build → COMPONENT_INDEX/VARIANT_INDEX/FIGMA_MAPPING regenerated. figma:build green.
```

**11.3 DERIVED manifest skeleton (produced by PLANNED `scripts/build-ai-manifests.ts`):**

```json
{
  "$schema": "./_schemas/<name>.schema.json",
  "version": "1.0.0",
  "generatedAt": "<ISO>",
  "generator": "scripts/build-ai-manifests.ts",
  "sourceHash": "sha256:<inputs>",
  "data": {}
}
```

## 12. Future Extension

- **Populate `.ai/` (immediate PLANNED next step).** Author `scripts/build-ai-manifests.ts` and the `_schemas/` set ([27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md)); wire a PLANNED `"ai:build"` npm alias and fold it into `ds:build`/`figma:build` so DERIVED memory refreshes on every source change and staleness becomes a hard gate.
- **CI enforcement (PLANNED — no `.github` today).** A pipeline runs `ds:build` + `ai:build` and fails the PR if any DERIVED `.ai/*` file changes (proves memory was regenerated, not hand-edited) — the automated form of R3/R9.
- **MCP memory surface (PLANNED).** [35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md) exposes read/update tools over `.ai/` so external agents rehydrate and journal through one contract, keeping precedence (R1/R5) intact.
- **Backend memory (PLANNED, >10M users).** `ERD.json` and `API_SPEC.json` graduate from `"status":"planned"` to DERIVED contracts generated from Supabase migrations / the API layer ([14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [15_API_GUIDE.md](./15_API_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md)), extending Storybook↔Figma sync to Frontend↔Backend↔Database sync — all still downstream, never authoritative (R1/R5).
- **Scale.** As the component count and (PLANNED) backend surface grow, the `.ai/` cache keeps agent context cost flat: agents read a handful of indexes, not the tree — the mechanism [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md) relies on to hold token usage minimal for years.
