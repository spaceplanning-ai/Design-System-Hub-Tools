<!-- filename: 02_AI_HARNESS.md -->

# 02 — AI Harness

> **Title:** AI Harness
> **Purpose:** Define the execution harness that runs AI work in the TDS repo — the tools, how a task is loaded, how context is assembled from `.ai/`, the memory read/write cycle, the guardrails/hooks, and the validation gates that every change must pass.
> **Status:** ACTIVE (the current harness is Claude Code + the real npm gates; MCP/CI wiring noted as PLANNED where it does not yet exist).
> **Owner:** AI OS
> **Last-reviewed:** _(placeholder — set on first review)_
> **Precedence:** Subordinate to [00_MASTER_RULES.md](./00_MASTER_RULES.md) (the constitution) and to [01_AI_SPECIFICATION.md](./01_AI_SPECIFICATION.md) (what an agent must do). This document specifies *how* the agent executes; it never overrides the Design Lock or the source-of-truth hierarchy defined there.

---

## 1. Purpose

The harness is the deterministic machinery that turns an AI request into a validated repo change. Its job is to make every agent — whichever client is driving (Claude Code, Gemini CLI, Cursor, Codex, Windsurf, or a PLANNED MCP agent) — behave identically: read the cheap manifests before the expensive source, assemble the minimum context, do the smallest correct change, run the real gates, and update the memory layer so the next session resumes without rediscovery.

This document exists so that:

- Any agent knows **which tools exist**, what each is for, and which are ACTIVE vs PLANNED.
- A task is **loaded the same way every time** — read-before-write, manifest-first.
- **Context is assembled from `.ai/`** (the cache/state layer) instead of re-reading `src/`, keeping token usage minimal (see [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md)).
- The **memory read/write cycle** is explicit, so drift, duplicated work, and context loss are prevented.
- **Guardrails** stop the two catastrophic failures of this repo: editing a generated output by hand, and making a visual design decision.
- Every change is proven by the **real validation gates**: `npm run lint`, `tsc`, `npm run ds:build`, `npm run figma:build`, `npm run plugin:test`.

## 2. Responsibilities

The harness is responsible for:

1. **Tool provisioning** — exposing a stable tool surface (file read/write/edit, search, bash/PowerShell, the npm scripts) and the two existing subagents `@tds-component` and `@figma-plugin` (`.claude/agents/`).
2. **Task intake** — parsing the request into a bounded task with an explicit target output (component / token / plugin / doc / manifest) and the correct source-of-truth entry point.
3. **Context assembly** — loading the relevant `.ai/*` manifests and `docs/ai-os/*` rules into working context *before* touching source, and stopping when enough is loaded.
4. **Guardrail enforcement** — refusing writes to generated paths (`figma/`, `src/generated/`, `src/tokens/generated/`, `figma/plugin/code.js`) and refusing self-initiated visual changes.
5. **Execution** — running the smallest change through the correct source (`*.meta.ts`, `src/tokens/*`, component `.tsx/.css`, or the build scripts), never hand-editing outputs.
6. **Validation** — running the gates in Section 7 and treating a red gate as a blocking failure.
7. **Memory write-back** — regenerating derived manifests and updating the seed/state manifests (`SESSION_SUMMARY.md`, `TASKS.json`, `CHANGELOG.md`) per [37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md) and [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md).
8. **Handoff** — leaving the repo and `.ai/` in a state a fresh agent can resume from (see [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md)).

The harness is **not** responsible for design decisions, backend architecture, or anything the Design Lock forbids.

## 3. Scope

**In-scope**

- The tool roster available to agents and which client each maps to.
- The task-loading protocol (read-before-write, manifest-first).
- Context assembly from `.ai/` and `docs/ai-os/`.
- The memory read/write cycle and its ordering.
- Guardrails/hooks (path guards, Design-Lock guard, generated-is-sacred guard).
- The five validation gates and how the harness runs them.

**Out-of-scope (owned elsewhere)**

- *What* an agent is and its operating contract → [01_AI_SPECIFICATION.md](./01_AI_SPECIFICATION.md).
- The full task lifecycle intake→commit → [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md).
- The manifest schemas themselves → [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md).
- The memory directory structure in full → [37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md).
- Token/context minimization tactics → [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md).
- MCP tool surface (PLANNED) → [35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md).
- The test pyramid and coverage gates → [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md).

## 4. Rules

Rules are enforceable and tied to a real mechanism. **MUST** = blocking; **SHOULD** = strong default; **NEVER** = hard prohibition.

1. **R1 — Read before write (MUST).** Before any edit, the harness MUST load the governing manifest(s) and rules. For component work read `docs/COMPONENTS.md` + `.ai/COMPONENT_INDEX.json`; for tokens read `.ai/TOKEN_INDEX.json`; for plugin/Figma read `figma/README.md` + `.ai/FIGMA_MAPPING.json`. No blind edits.
2. **R2 — Manifest-first, source-second (MUST).** The harness MUST answer from `.ai/*` and `docs/COMPONENTS.md` first and open `src/**` only when the manifest/catalog lacks the exact detail (prop shape, compound sub-part). This is the token-budget rule of [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md).
3. **R3 — Never hand-edit generated outputs (NEVER).** The harness MUST NEVER write to `figma/tds.plugin.json`, `src/generated/design-system.manifest.json`, `src/tokens/generated/*` (`tokens.css`, `figma.tokens.json`, `token-ids.ts`), `docs/COMPONENTS.md`, or `figma/plugin/code.js`. To change any of these, change the SOURCE and re-run the build.
4. **R4 — Design Lock (NEVER).** The harness MUST NEVER, on its own initiative, redesign, restyle, re-space, recolor, re-radius, or rename any token/component/variant/variable. Storybook is the immutable visual source of truth. Any visual change is a SOURCE change that must be explicitly requested/approved (see [00_MASTER_RULES.md](./00_MASTER_RULES.md) §Design Lock).
5. **R5 — Tokens only (MUST).** Any CSS the harness writes MUST use `var(--tds-*)` custom properties. NEVER hardcode color/spacing/radius/shadow/type. Token id dot-notation maps to the CSS var (`color.bg.default` → `--tds-color-bg-default`).
6. **R6 — Barrel imports only (MUST).** Component imports MUST come from `@/components`; shared code from `@/hooks`, `@/utils`, `@core/*`, `@tokens/*`. NEVER deep-path into a component folder. `*.meta.ts` files MUST stay React/CSS-free with relative imports only.
7. **R7 — Correct source entry point (MUST).** Variant/prop changes go in `*.meta.ts`; visual token changes in `src/tokens/*`; layout/paint in the component `.css`; bundle shape in `scripts/build-*.ts`. NEVER patch a symptom in a generated file.
8. **R8 — Gate before done (MUST).** No task is complete until the gates in Section 7 that apply to the change are green. A component/token change MUST pass `npm run lint` + `npm run ds:build`; a change that can reach Figma MUST additionally pass `npm run figma:build` (which ends in `npm run plugin:test`).
9. **R9 — Regenerate, don't reconcile by hand (MUST).** After a source change, the harness MUST run the relevant `*:build` script to refresh derived manifests rather than editing them to match.
10. **R10 — Write back memory (MUST).** After a successful change the harness MUST update the state manifests (`.ai/TASKS.json`, `.ai/SESSION_SUMMARY.md`, `.ai/CHANGELOG.md`) so the next session resumes cleanly ([28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md)).
11. **R11 — Minimal diff (SHOULD).** Prefer the smallest change that satisfies the request; reuse the 60 existing components before creating anything ([07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md)).
12. **R12 — Escalate, don't approximate (MUST).** If the contract cannot be faithfully reproduced or a rule conflict is found, the harness MUST stop and surface it, never paper over it (mirrors the `@figma-plugin` "stop and surface" rule).
13. **R13 — Determinism (MUST).** Given the same repo state and task, the harness MUST take the same path. No hidden state; all state lives in the repo and `.ai/`.
14. **R14 — Delegate to keep context small (SHOULD).** Route component work to `@tds-component` and plugin work to `@figma-plugin` so the main thread stays lean ([36_AI_AGENT_SPECIFICATION.md](./36_AI_AGENT_SPECIFICATION.md)).
15. **R15 — Backend is PLANNED (MUST).** Any DB/API/Supabase/CI/test-framework tooling is PLANNED and MUST be labeled as such; the harness MUST NOT assume a server, `.env`, or a `test` npm script exists (only `lint`, `ds:build`, `figma:build`, `plugin:test`, `build`, `format` exist today).

## 5. Workflow

The canonical harness loop. Steps reference real files and real npm scripts.

**Step 0 — Rehydrate.** Read `.ai/SESSION_SUMMARY.md` and `.ai/TASKS.json`. If a task is in progress, resume it ([28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md)); otherwise intake a new one.

**Step 1 — Classify the task.** Decide the output surface and its source-of-truth entry point:

| Task surface | Read first (`.ai/` + docs) | Source you edit | Gate |
|---|---|---|---|
| Component / variant / prop | `COMPONENT_INDEX.json`, `VARIANT_INDEX.json`, `docs/COMPONENTS.md` | `src/components/**/X.meta.ts` (+`.tsx`/`.css`/`.stories.tsx`) | `lint` + `ds:build` |
| Token | `TOKEN_INDEX.json` | `src/tokens/{primitives,semantic}.ts` | `tokens:build` → `ds:build` |
| Figma / plugin | `FIGMA_MAPPING.json`, `PLUGIN_INDEX.json`, `figma/README.md` | `scripts/build-manifest.ts`, `figma/plugin/src/*.ts` | `figma:build` |
| Docs / manifest | `PROJECT_MANIFEST.json`, `DESIGN_MANIFEST.json` | `docs/ai-os/*`, `.ai/*` (seed manifests) | schema/manual |

**Step 2 — Assemble context.** Load only the rows above that the task needs. Stop when you can name the exact file(s) to change. Do NOT bulk-read `src/`.

**Step 3 — Guardrail check.** Confirm every target path is a SOURCE path, not a generated path (R3). Confirm the change is not a self-initiated visual change (R4). If it is, escalate (R12).

**Step 4 — Execute the minimal change.** Edit the source. For components, mirror a sibling in the same tier; use `toDataAttrs(meta, {...})` so `data-*` reaches Figma; wrap inputs in `FormField`. For tokens, add/adjust in `primitives.ts`/`semantic.ts` only.

**Step 5 — Regenerate.** Run the narrowest build that refreshes derived outputs:

```bash
npm run tokens:build      # tokens changed → tokens.css, figma.tokens.json, token-ids.ts
npm run ds:build          # any meta/token change → manifest + bundle + catalog
npm run figma:build       # anything that can reach Figma (ds:build → typecheck → plugin:build → plugin:test)
```

**Step 6 — Validate.** Run the gates from Section 7 for the change class. Red = blocking; fix and re-run.

**Step 7 — Write back memory.** Regenerated manifests are already fresh from Step 5. Update `.ai/TASKS.json` (mark done), append `.ai/CHANGELOG.md`, refresh `.ai/SESSION_SUMMARY.md` (R10).

**Step 8 — Report / hand off.** Summarize what was reused vs created and the exact import line(s); do not paste large diffs (mirrors the subagent "report concisely" rule). Review gate per [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md).

## 6. Examples

**A. Tool roster (which client maps to what).** The tool *surface* is identical across clients; only the driver differs.

| Tool / capability | ACTIVE today | Used for |
|---|---|---|
| Claude Code CLI + subagents `@tds-component`, `@figma-plugin` (`.claude/agents/`) | ACTIVE | Primary harness; delegation |
| File read / write / edit / search | ACTIVE | Read-before-write, minimal-diff edits |
| Bash / PowerShell (repo is Windows; Bash tool available) | ACTIVE | Running npm scripts, git |
| npm scripts (`lint`, `ds:build`, `figma:build`, `plugin:test`, `build`, `format`) | ACTIVE | Validation gates |
| Gemini CLI / Cursor / Codex / Windsurf | ACTIVE (as alternate drivers) | Same tool surface, same rules |
| MCP agents (read/update manifests, sync Storybook↔Figma) | **PLANNED** → [35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md) | Manifest I/O, session recovery |
| CI runner (`.github/`) enforcing gates on PR | **PLANNED** → [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md) | Automated gate enforcement |
| Unit/e2e frameworks (vitest/playwright) | **PLANNED** → [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md) | Currently only the headless harness exists |

**B. Context assembly, done right (a "change Button padding token" task).**

```text
LOAD  .ai/TOKEN_INDEX.json            # find the space token id + its --tds var
LOAD  docs/COMPONENTS.md (Button row) # confirm Button consumes that token via CSS
EDIT  src/tokens/semantic.ts          # change the SOURCE value only
RUN   npm run ds:build                # regenerates tokens.css + figma.tokens.json + bundle + catalog
# NEVER open or edit src/tokens/generated/tokens.css — it is the output of the line above.
```

**C. Guardrail refusal (what the harness must decline).**

```text
REQUEST: "Bump the shadow in figma/tds.plugin.json so cards pop more."
HARNESS: REFUSE — two violations:
  R3 figma/tds.plugin.json is a generated bundle (never hand-edit).
  R4 "pop more" is a self-initiated visual change (Design Lock).
  → If truly wanted: change the effect token in src/tokens/*, run npm run figma:build,
    and only with explicit approval.
```

**D. Memory read/write cycle (ordering).**

```text
READ  (start)  : SESSION_SUMMARY.md → TASKS.json → the task's INDEX manifest
WORK           : edit source → run *:build (regenerates derived manifests)
WRITE  (end)   : TASKS.json (done) → CHANGELOG.md (append) → SESSION_SUMMARY.md (refresh)
```

**E. Validation gate transcript (component change).**

```bash
npm run lint          # eslint . — style/hooks/refresh/storybook rules
npm run ds:build      # tokens:build && manifest:build && catalog:build
npm run figma:build   # ds:build && plugin:typecheck && plugin:build && plugin:test
# plugin:test runs figma/plugin/test/harness.ts — a headless Figma mock that asserts
# collections/variables/aliases/styles/component-sets/variants/props coverage and
# process.exit(1) on ANY mismatch. A green run means Storybook↔Figma is still in sync.
```

## 7. Validation Rules

Compliance is checked by real mechanisms, not vibes. The gates, in increasing strength:

1. **Lint gate — `npm run lint`** (`eslint .`). Enforces the flat config: typescript-eslint, react-hooks, react-refresh, storybook, no-unused, consistent-type-imports. MUST be green for any TS/TSX/CSS-adjacent change.
2. **Type gate — `tsc`** via `npm run build` (`tsc -b && vite build`) and `npm run plugin:typecheck` (`tsc -p figma/plugin/tsconfig.json`). `strict`, `noUnusedLocals/Parameters`, `verbatimModuleSyntax`. MUST be green.
3. **DS build gate — `npm run ds:build`** = `tokens:build && manifest:build && catalog:build`. Proves the token pipeline, the manifest, and the catalog all regenerate cleanly from source. MUST run after any `*.meta.ts` or token change.
4. **Figma build gate — `npm run figma:build`** = `ds:build && plugin:typecheck && plugin:build && plugin:test`. The full Storybook→Figma pipeline. MUST run for any change that can reach the bundle.
5. **Plugin coverage gate — `npm run plugin:test`** (`tsx figma/plugin/test/harness.ts`). The headless Figma-API mock runs the real `figma/plugin/src/code.ts` against the real `figma/tds.plugin.json` and asserts coverage (collections, variables, resolved `VARIABLE_ALIAS`, effect/text styles, component sets = component count, cartesian variant totals, TEXT/BOOLEAN/INSTANCE_SWAP property wiring, Auto-Layout fidelity, A/B/C `type` splits, theme-aware `chart/1..6`). Any mismatch → `process.exit(1)`. This is the objective Storybook↔Figma sync gate.
6. **Manifest schema gate — manual/schema.** Every `.ai/*` manifest carries `$schema`/`version`/`generatedAt`/`generator` (or `seed`/`status:"planned"`). Derived manifests MUST match their regenerated source; the schema contract is [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md).
7. **PLANNED gates** — unit/interaction/visual/e2e and CI enforcement do not exist yet ([24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md), [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)). Do not claim them as passing.

## 8. Checklist

Copy into the task and tick each item.

- [ ] Rehydrated from `.ai/SESSION_SUMMARY.md` + `.ai/TASKS.json`.
- [ ] Task classified; correct source-of-truth entry point identified (Section 5 table).
- [ ] Context assembled manifest-first; `src/**` opened only where a detail was missing (R2).
- [ ] Every target path confirmed to be a SOURCE path, not generated (R3).
- [ ] No self-initiated visual change; Design Lock respected (R4).
- [ ] CSS uses `var(--tds-*)` only; imports from barrels only; `*.meta.ts` stays React/CSS-free (R5, R6).
- [ ] Minimal diff; reuse checked against the 60 components before creating (R11).
- [ ] Ran the narrowest `*:build` to regenerate derived outputs (R9).
- [ ] `npm run lint` green.
- [ ] `npm run ds:build` green (meta/token changes).
- [ ] `npm run figma:build` green including `plugin:test` (Figma-reaching changes).
- [ ] `.ai/TASKS.json`, `.ai/CHANGELOG.md`, `.ai/SESSION_SUMMARY.md` updated (R10).
- [ ] Reported concisely (reused vs created + exact import lines); no large diffs pasted.

## 9. Failure Recovery

Symptom → diagnosis → fix → resume.

- **Symptom: a generated file shows manual edits / merge conflict** (`figma/tds.plugin.json`, `src/tokens/generated/*`, `docs/COMPONENTS.md`).
  *Diagnosis:* R3 violated or a stale build. *Fix:* `git checkout -- <generated path>` to discard, then re-run the owning build (`ds:build`/`figma:build`). *Resume:* re-validate at Section 7 gates.
- **Symptom: `plugin:test` FAIL — "component sets N/M" or "variants" mismatch.**
  *Diagnosis:* a `*.meta.ts` axis/variant changed but the bundle wasn't regenerated, or a real fidelity gap. *Fix:* run `npm run ds:build` then `npm run figma:build`; if still red, the SOURCE meta or `scripts/build-manifest.ts` is wrong — fix source, never the harness assertions. *Resume:* green harness = sync restored.
- **Symptom: `plugin:test` FAIL — "alias values resolved" / blocking "Unresolved alias".**
  *Diagnosis:* a Theme/Semantic token aliases a Primitive that no longer exists, or collection order broke (must be Primitives→Semantic→Theme). *Fix:* correct the token id in `src/tokens/*`, re-run `tokens:build`→`figma:build`. *Resume:* zero blocking warnings.
- **Symptom: `lint`/`tsc` red after edit.**
  *Diagnosis:* convention breach (deep import, unused, missing `type` import) per [19_CODE_CONVENTION.md](./19_CODE_CONVENTION.md). *Fix:* correct to barrel imports / `import type`; `npm run format`. *Resume:* re-run gates.
- **Symptom: context lost mid-task / new session.**
  *Diagnosis:* fresh agent. *Fix:* execute Step 0 rehydration; read `.ai/SESSION_SUMMARY.md` + open `.ai/TASKS.json`. *Resume:* continue at the last unchecked item ([28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md)).
- **Symptom: request implies a visual redesign.**
  *Diagnosis:* Design Lock trigger (R4/R12). *Fix:* stop, surface it, ask for explicit approval and reframe as a SOURCE change. *Resume:* only after approval.
- **Symptom: request needs backend/DB/API/auth.**
  *Diagnosis:* R15 — none exists today. *Fix:* label PLANNED, point to [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md)/[15_API_GUIDE.md](./15_API_GUIDE.md)/[17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md); do not scaffold silently. *Resume:* proceed only on the frontend surface.

## 10. Dependencies

**Docs (`docs/ai-os/`):** [00_MASTER_RULES.md](./00_MASTER_RULES.md), [01_AI_SPECIFICATION.md](./01_AI_SPECIFICATION.md), [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md), [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md), [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md), [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md), [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md), [35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md), [36_AI_AGENT_SPECIFICATION.md](./36_AI_AGENT_SPECIFICATION.md), [37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md), [39_AI_CHECKLIST.md](./39_AI_CHECKLIST.md), [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md), [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md), [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md), [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md), [19_CODE_CONVENTION.md](./19_CODE_CONVENTION.md).

**Manifests (`.ai/`):** [PROJECT_MANIFEST.json](../../.ai/PROJECT_MANIFEST.json), [COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json), [TOKEN_INDEX.json](../../.ai/TOKEN_INDEX.json), [VARIANT_INDEX.json](../../.ai/VARIANT_INDEX.json), [FIGMA_MAPPING.json](../../.ai/FIGMA_MAPPING.json), [PLUGIN_INDEX.json](../../.ai/PLUGIN_INDEX.json), [TASKS.json](../../.ai/TASKS.json), [SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md), [CHANGELOG.md](../../.ai/CHANGELOG.md).

**Scripts / real files:** `scripts/build-tokens.ts`, `scripts/build-manifest.ts`, `scripts/build-catalog.ts`, `figma/plugin/src/code.ts`, `figma/plugin/test/harness.ts`, `figma/README.md`, `docs/COMPONENTS.md`, `.claude/agents/{tds-component,figma-plugin}.md`, `package.json` scripts (`lint`, `ds:build`, `figma:build`, `plugin:test`).

## 11. Template

Copy-paste harness run record (drop into the task thread or `.ai/SESSION_SUMMARY.md`):

```md
### Harness run — <task title>
Surface: <component | token | figma/plugin | docs/manifest>
Entry point (source): <path e.g. src/components/atoms/Button/Button.meta.ts>

Context assembled (manifest-first):
- .ai/<INDEX>.json
- docs/COMPONENTS.md (<component> row)

Guardrails:
- [ ] all targets are SOURCE paths (R3)
- [ ] no self-initiated visual change (R4)

Change: <one line — what/why, reused vs created>

Gates:
- [ ] npm run lint
- [ ] npm run ds:build
- [ ] npm run figma:build  (incl. plugin:test)

Memory write-back:
- [ ] .ai/TASKS.json (done)
- [ ] .ai/CHANGELOG.md (append)
- [ ] .ai/SESSION_SUMMARY.md (refresh)

Report: <reused X; created Y; import line: import { … } from '@/components'>
```

## 12. Future Extension

The harness is designed to scale in tooling and to a >10,000,000-user product without changing its contract:

- **MCP integration (PLANNED).** An MCP server ([35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md)) exposes the same read-before-write manifest surface as first-class tools (read/update `.ai/*`, recover sessions, sync Storybook↔Figma). The rules in Section 4 apply unchanged — MCP only makes context assembly cheaper.
- **CI enforcement (PLANNED).** A `.github/` pipeline ([25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)) runs the Section 7 gates on every PR so guardrails are enforced by machine, not goodwill; `plugin:test` becomes a required check.
- **Richer test tiers (PLANNED).** Interaction/visual/unit/e2e ([24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md)) layer on top of today's headless harness; each new tier registers as an additional gate in Section 7 without altering the loop.
- **Backend surfaces (PLANNED).** When the Supabase/Node backend ([14–17]) lands, the harness gains DB/API entry points and their own `*:build`/migration gates; the read-before-write, generated-is-sacred, and write-back-memory rules extend to ERD/API manifests (`.ai/ERD.json`, `.ai/API_SPEC.json`) verbatim.
- **Multi-agent fleets.** More role agents ([36_AI_AGENT_SPECIFICATION.md](./36_AI_AGENT_SPECIFICATION.md)) share this one harness; determinism (R13) and the `.ai/` state layer keep parallel agents from duplicating or drifting.

The invariant across all extensions: **source → build → validate → write-back**, with generated outputs sacred and Storybook the immutable visual truth.
