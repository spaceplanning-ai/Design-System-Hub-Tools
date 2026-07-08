# 28 — Resume Specification

> **Title:** Resume Specification
> **Purpose:** Define the deterministic resume-after-context-loss protocol — how any AI agent rehydrates from [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md) + [.ai/TASKS.json](../../.ai/TASKS.json), checkpoints its progress, stays idempotent, and safely continues an in-flight task without duplicating, forgetting, or corrupting work.
> **Status:** ACTIVE
> **Owner:** AI OS
> **Last-reviewed:** _(placeholder — set on review)_
> **Precedence:** Subordinate to [00_MASTER_RULES.md](./00_MASTER_RULES.md). This document is the **continuity authority**; it governs how state is saved and restored but never overrides design truth (Storybook + `*.meta.ts` + `src/tokens/*`) or the Design Lock. Where it references backend/DB/API/CI it is marked **PLANNED**.

---

## 1. Purpose

Context windows are finite and sessions die. An agent may lose all working memory mid-task — after editing a `*.meta.ts` but before running `npm run ds:build`, after generating `figma/tds.plugin.json` but before `npm run plugin:test`, or after a component is written but before its story exists. Without a resume protocol, the next agent (or the same agent after a restart) either **repeats work already done** (re-editing a token, re-registering a component in `src/components/metas.ts`), **skips work silently assumed done** (forgetting the catalog rebuild), or **acts on stale assumptions** and drifts from the Storybook source of truth.

This specification makes recovery **deterministic**. It fixes:

- The two continuity artifacts an agent MUST write and MUST read: [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md) (human-readable narrative) and [.ai/TASKS.json](../../.ai/TASKS.json) (machine-readable task ledger).
- The **rehydration order** — exactly which files to read, in what sequence, to reconstruct enough context to continue at minimal token cost.
- The **checkpoint discipline** — when state is flushed to disk so a crash never loses more than one step.
- The **idempotency contract** — every task step must be safe to re-run, because after a crash the agent cannot always know whether the last step half-completed.

The goal, per [00_MASTER_RULES.md](./00_MASTER_RULES.md), is that a cold agent with **zero prior context** can open `.ai/`, read two files, and resume a partially-complete task correctly — without re-reading 60 component sources or re-deriving the whole system.

---

## 2. Responsibilities

This specification owns:

- The **schema and lifecycle of the resume pair**: [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md) and [.ai/TASKS.json](../../.ai/TASKS.json).
- The **rehydration sequence** — the ordered read of `.ai/` manifests + docs that reconstitutes working context.
- The **checkpoint protocol** — the points in a task lifecycle where state MUST be persisted.
- The **idempotency rules** — how each kind of change (token, component, variant, plugin, generated output) is made safely re-runnable.
- The **duplicate-work guard** — how an agent proves a step is already done before redoing it, using `git status`, the generated manifests, and `TASKS.json` step states.
- The **reconciliation procedure** when `TASKS.json` disagrees with the actual repository state (the working tree is always the tiebreaker for _what happened_; Storybook/source is the tiebreaker for _what is correct_).

It does **not** own:

- The task lifecycle itself (intake → plan → implement → validate → commit) — that is [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md).
- The full schema of every manifest — that is [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md).
- The `.ai/` memory system's structure and hygiene overall — that is [37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md).
- Token-minimization strategy (manifest-first reading) — that is [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md).
- Review/approval gating — that is [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md).

---

## 3. Scope

**In-scope**

- Writing, updating, and reading [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md) and [.ai/TASKS.json](../../.ai/TASKS.json).
- The cold-start rehydration read order across `.ai/` manifests and `docs/ai-os/` specs.
- Checkpoint placement around real build gates: `npm run ds:build`, `npm run figma:build`, `npm run plugin:test`, `npm run lint`.
- Idempotency rules for source edits (`*.meta.ts`, `src/tokens/*`, component `.tsx/.css/.stories.tsx`), registry edits (`src/components/metas.ts`, tier barrels), and generated outputs.
- Detecting and repairing partial completions (e.g. a component `.tsx` without a matching `.stories.tsx`, a token edited but generated CSS not rebuilt).

**Out-of-scope**

- The actual _content_ of any component or token change (design decisions) — locked by [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md) and Storybook.
- Multi-agent orchestration and hand-off contracts — [36_AI_AGENT_SPECIFICATION.md](./36_AI_AGENT_SPECIFICATION.md).
- MCP-driven session recovery tool surface — [35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md) (this doc defines the on-disk protocol MCP tools operate on).
- **PLANNED** backend/DB/API resume concerns (transaction replay, migration idempotency for Supabase) — covered where relevant by [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [15_API_GUIDE.md](./15_API_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md); this doc only fixes their **PLANNED** hooks in `TASKS.json`.

---

## 4. Rules

Rules are enforceable and phrased MUST / SHOULD / NEVER.

**R1 — The resume pair is mandatory.** Every non-trivial task (any change touching a `*.meta.ts`, token, component file, or generated output) MUST maintain both [.ai/TASKS.json](../../.ai/TASKS.json) (structured ledger) and [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md) (narrative). A read-only question (e.g. "which components have a `pill` shape?") MAY skip them.

**R2 — Read before write, always.** On resume an agent MUST perform the full rehydration read order (§5, Step A) **before** editing any file. It MUST NOT assume the previous agent's intent; it reconstructs intent from `TASKS.json` + `SESSION_SUMMARY.md` + `git status`.

**R3 — The working tree is the truth of _what happened_.** When `TASKS.json` claims a step is `done` but `git status` / the file system disagree, the file system wins for _state_. The agent MUST reconcile (§9) and correct `TASKS.json`, never blindly trust the ledger.

**R4 — Storybook/source is the truth of _what is correct_.** Reconciliation never invents design. If a half-written component's shape is ambiguous, resolve it from the `*.meta.ts` and Storybook per [00_MASTER_RULES.md](./00_MASTER_RULES.md) §E precedence — never "improve" it.

**R5 — Checkpoint after every gate.** The agent MUST flush `TASKS.json` (step → `done`) and append to `SESSION_SUMMARY.md` immediately after each validation gate passes: after `npm run ds:build`, after `npm run lint`, after `npm run figma:build` / `npm run plugin:test`. A crash then loses at most the step in flight.

**R6 — Every step MUST be idempotent.** Re-running any single step (re-editing a meta to its target state, re-running `npm run ds:build`, re-registering a component) MUST converge to the same result and never double-apply. Prefer declarative full-file writes and deterministic generators over append/patch operations that compound on re-run.

**R7 — NEVER hand-edit generated outputs to "resume".** Files under `figma/`, `src/generated/`, and `src/tokens/generated/` (and `figma/plugin/code.js`) are SACRED per [00_MASTER_RULES.md](./00_MASTER_RULES.md). If a generated file is stale or missing on resume, the fix is to **re-run the generator** (`npm run tokens:build` / `manifest:build` / `catalog:build` / `ds:build`), never to patch the output by hand.

**R8 — Regeneration is the canonical recovery for derived state.** Because all of `src/tokens/generated/*`, `src/generated/design-system.manifest.json`, `figma/tds.plugin.json`, and `docs/COMPONENTS.md` are pure functions of source, an agent that is unsure whether they are current MUST simply re-run `npm run ds:build`. This is always safe (idempotent) and cheaper than reasoning about staleness.

**R9 — One task in flight per branch.** `TASKS.json` MUST have at most one task with `status: "in_progress"` on a given working branch. Parallel tasks require separate branches/worktrees; this keeps resume unambiguous.

**R10 — Checkpoints record commands, not prose promises.** A step in `TASKS.json` that depends on a build MUST name the exact npm script (`"gate": "figma:build"`) so the resuming agent re-runs the identical command, not an approximation.

**R11 — SESSION_SUMMARY.md is append-mostly and bounded.** The agent MUST keep it under a practical size (roughly one screen of "current state" plus a bounded decision log). It SHOULD prune superseded narrative on task completion so resume stays cheap (see [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md)).

**R12 — Never mark a step `done` without its gate.** A code step whose acceptance is a build/lint gate MUST NOT be flipped to `done` until that gate exits 0. `plugin:test` exits non-zero on coverage mismatch (`process.exit(1)`); a green `plugin:test` is the only proof the plugin step completed.

**R13 — Resume never bypasses review or approval.** A resumed task re-enters the same gates in [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md) and [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md). Resuming does not "fast-forward" past an unmet Design-Lock or review checkpoint.

**R14 — `.ai/` is regenerable state, not a substitute for git.** The resume pair accelerates recovery but is not the system of record for code; committed source + git history are. On irreconcilable conflict, trust git + source and rebuild `.ai/`.

---

## 5. Workflow

### Step A — Rehydration (cold start / context loss)

Read in this exact order and **stop as soon as you have enough** (token-minimal, per [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md)):

1. **[.ai/TASKS.json](../../.ai/TASKS.json)** — find the single `in_progress` task; read its `steps[]`, each step's `status` and `gate`, and `currentStepId`.
2. **[.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md)** — read the "Current State", "Next Action", and "Decisions" sections for intent and any human constraints.
3. **`git status` + `git diff --stat`** — observe what the file system actually shows changed (ground truth for _what happened_, per R3).
4. **[.ai/PROJECT_MANIFEST.json](../../.ai/PROJECT_MANIFEST.json)** — confirm repo identity/version and pointers to the other manifests.
5. **Only the manifests the task touches** — e.g. a component task reads [.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json) + [.ai/VARIANT_INDEX.json](../../.ai/VARIANT_INDEX.json); a token task reads [.ai/TOKEN_INDEX.json](../../.ai/TOKEN_INDEX.json); a plugin task reads [.ai/PLUGIN_INDEX.json](../../.ai/PLUGIN_INDEX.json) + [.ai/FIGMA_MAPPING.json](../../.ai/FIGMA_MAPPING.json). Do **not** read all 17.
6. **Source files only if a step is mid-edit** — open the specific `*.meta.ts` / `.tsx` / token file named by the in-flight step. Never re-read the whole component tree.

### Step B — Reconcile ledger vs reality

Compare `TASKS.json` step states against `git status` (§9 has the full decision table). Correct `TASKS.json` to match reality: downgrade a falsely-`done` step, or mark an actually-complete step `done`.

### Step C — Determine the resume point

The resume point is the **first step not provably `done`**. "Provably done" means: its output files exist AND its gate (if any) currently passes. For a build/generation step, prove-by-re-running is cheapest (R8): just run the generator.

### Step D — Continue the task

Execute from the resume point using the normal lifecycle in [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md). After the source edits for a step, run its gate; on green, checkpoint (Step E).

### Step E — Checkpoint (after every gate)

1. Set the completed step's `status: "done"`, advance `currentStepId`, bump `generatedAt`.
2. Append a dated line to `SESSION_SUMMARY.md` "Decisions"/"Progress" and refresh "Current State" + "Next Action".
3. (When the task mutates the system) refresh the affected `.ai/*` index per [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md).

### Step F — Close out

On the final gate (typically `npm run figma:build` green + review passed), set the task `status: "done"`, prune `SESSION_SUMMARY.md`, append to [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md), and hand to [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md).

### The canonical build-gate order (real scripts)

For any change that reaches Figma, the gate ladder — and thus the checkpoint ladder — is:

```bash
npm run lint            # eslint . — style/hooks gate
npm run ds:build        # tokens:build && manifest:build && catalog:build
npm run plugin:typecheck
npm run plugin:build
npm run plugin:test     # headless harness; exit 1 on coverage mismatch
# or simply:
npm run figma:build     # ds:build && plugin:typecheck && plugin:build && plugin:test
```

Each green rung is a checkpoint boundary (R5).

---

## 6. Examples

### 6.1 Resuming a component addition (context lost after the `.tsx`)

Scenario: task "Add `Callout` molecule". Agent crashed after writing `src/components/molecules/Callout/Callout.meta.ts` and `Callout.tsx`, before the story, the registry, and `ds:build`.

Rehydration finds:

```jsonc
// .ai/TASKS.json (excerpt)
{
  "id": "T-041",
  "title": "Add Callout molecule",
  "status": "in_progress",
  "currentStepId": "s3",
  "steps": [
    { "id": "s1", "desc": "Write Callout.meta.ts",     "status": "done" },
    { "id": "s2", "desc": "Write Callout.tsx + .css",  "status": "done" },
    { "id": "s3", "desc": "Write Callout.stories.tsx",  "status": "todo" },
    { "id": "s4", "desc": "Register in metas.ts + molecule barrel", "status": "todo" },
    { "id": "s5", "desc": "Run ds:build",   "status": "todo", "gate": "ds:build" },
    { "id": "s6", "desc": "Run figma:build", "status": "todo", "gate": "figma:build" }
  ]
}
```

`git status` confirms `Callout.meta.ts` and `Callout.tsx` (+`.css`) are untracked, no `.stories.tsx`, and `src/components/metas.ts` unchanged — matching the ledger. Resume point = `s3`. The agent writes the CSF3 story, registers the meta in `src/components/metas.ts` (`moleculeMetas`) and the molecule `index.ts` barrel, then runs `npm run ds:build` (regenerates `docs/COMPONENTS.md` + manifests) and `npm run figma:build`. Each green gate → checkpoint.

### 6.2 Ledger says done, reality disagrees (R3 wins)

`TASKS.json` marks `s5: ds:build → done`, but `git status` shows `docs/COMPONENTS.md` and `figma/tds.plugin.json` **unchanged** while a new meta is registered. The generated outputs are stale — the build never actually ran (or ran before the registry edit). The agent downgrades `s5` to `todo` and re-runs `npm run ds:build` (idempotent, R8). No harm from re-running.

### 6.3 Token edit, generation skipped

Task "retune `space.4`". `src/tokens/primitives.ts` shows the edited value, but `src/tokens/generated/tokens.css` still holds the old value. Resume: the source step is `done`, the generation step is not. Fix = `npm run tokens:build` (or `ds:build`). NEVER hand-edit `tokens.css` (R7).

### 6.4 Plugin coverage regression on resume

`TASKS.json` claims the plugin step is `done`, but re-running `npm run plugin:test` exits 1 with a coverage mismatch (a component set missing after a meta was added). Per R12 the step was never truly done. The harness (`figma/plugin/test/harness.ts`) is the gate; the agent fixes the source/plugin, re-runs `npm run figma:build` to green, then checkpoints.

### 6.5 SESSION_SUMMARY.md at handoff

```markdown
## Current State
Task T-041 "Add Callout molecule" — steps s1,s2 done. Files written:
molecules/Callout/{Callout.meta.ts, Callout.tsx, Callout.css}. NOT yet: story, registry, builds.

## Next Action
Write Callout.stories.tsx (CSF3, title "Molecules/Callout"), then register in
src/components/metas.ts (moleculeMetas) + molecule barrel, then `npm run figma:build`.

## Decisions
- 2026-07-08 Reuse Text + Icon atoms; no new tokens (approved reuse-first).
- 2026-07-08 tone axis = brand/neutral/success/warning/danger (matches convention).

## Do NOT
- Do not add a `type` (A/B/C) axis — Callout has no layout presets.
```

---

## 7. Validation Rules

Compliance is checked by real mechanisms, not prose:

- **Schema validity** — [.ai/TASKS.json](../../.ai/TASKS.json) MUST carry `$schema`, `version`, `generatedAt`, and conform to the schema in [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md). Exactly ≤1 `in_progress` task per branch (R9).
- **Ledger ↔ tree consistency** — for every step marked `done`, its declared output files MUST exist (`git status` / file check) and its `gate` (if any) MUST currently exit 0. A `done` step whose gate fails is a violation (R12).
- **Generated freshness** — after resume + close-out, `npm run ds:build` then `git status` MUST show **no** unexpected diff in `src/tokens/generated/*`, `src/generated/design-system.manifest.json`, `figma/tds.plugin.json`, or `docs/COMPONENTS.md`. A diff means a generation checkpoint was skipped.
- **Plugin gate** — `npm run figma:build` (ending in `plugin:test`) MUST exit 0 before a Figma-affecting task is `done`.
- **Lint/type gate** — `npm run lint` and `npm run plugin:typecheck` MUST pass; `tsc -b` (via `npm run build`) MUST pass for app-level changes.
- **Idempotency spot-check** — re-running the last completed step (e.g. `npm run ds:build` twice) MUST produce byte-identical generated outputs (git-clean second run).
- **Resume dry-run (manual)** — a reviewer discards context and follows §5 Step A using only `.ai/`; if they cannot determine the next action unambiguously, `SESSION_SUMMARY.md`/`TASKS.json` fail R11/R2.

---

## 8. Checklist

**On context loss / cold start**

- [ ] Read [.ai/TASKS.json](../../.ai/TASKS.json) — locate the single `in_progress` task + `currentStepId`.
- [ ] Read [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md) — Current State, Next Action, Decisions, Do-NOT.
- [ ] Run `git status` + `git diff --stat` — observe real changes.
- [ ] Read only the task-relevant `.ai/*` index (not all 17).
- [ ] Reconcile ledger vs tree (§9); correct any false `done`.
- [ ] Identify the resume point = first step not provably done.

**While continuing**

- [ ] Never hand-edit generated files; re-run the generator instead (R7/R8).
- [ ] After each gate green (`lint`, `ds:build`, `figma:build`/`plugin:test`) → checkpoint.
- [ ] Update `TASKS.json` step status + `currentStepId` + `generatedAt`.
- [ ] Append progress + refresh Current State / Next Action in `SESSION_SUMMARY.md`.
- [ ] Refresh affected `.ai/*` indexes per [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md).

**On close-out**

- [ ] `npm run figma:build` green; review gate ([30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)) satisfied.
- [ ] `git status` shows no unexpected generated diff.
- [ ] Task → `done`; prune `SESSION_SUMMARY.md`; append to [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md).

---

## 9. Failure Recovery

| Symptom | Diagnosis | Fix | Resume |
| --- | --- | --- | --- |
| `TASKS.json` has no `in_progress` task but the tree has uncommitted changes | Checkpoint was missed before crash | Infer the task from `git diff`; rebuild the ledger from observed files; write a fresh `in_progress` task | Continue from first incomplete step |
| Step marked `done`, output files missing | False checkpoint (R3) | Downgrade step to `todo` | Re-execute the step (idempotent) |
| Component `.tsx` exists, no `.stories.tsx`, not in `metas.ts` | Crash mid component-add | Treat story + registry steps as `todo` | Resume at story step (§6.1) |
| `src/tokens/generated/tokens.css` disagrees with `src/tokens/primitives.ts`/`semantic.ts` | Generation step skipped | `npm run tokens:build` (or `ds:build`); NEVER edit the CSS | Checkpoint generation step |
| `docs/COMPONENTS.md` / `figma/tds.plugin.json` stale vs registered metas | `manifest:build`/`catalog:build` skipped | `npm run ds:build` | Checkpoint |
| `npm run plugin:test` exits 1 after "done" plugin step | Coverage mismatch; step not truly complete (R12) | Fix source/plugin, `npm run figma:build` to green | Checkpoint plugin step |
| Two tasks `in_progress` on one branch | R9 violation | Pick the one matching `git diff`; move the other to `todo`/separate branch | Continue the matched task |
| `SESSION_SUMMARY.md` and `TASKS.json` contradict each other | One was checkpointed, the other not | `git status` breaks the tie (R3); rewrite both to match reality | Continue |
| `.ai/` unreadable/corrupt | State layer lost, source intact (R14) | Rebuild `.ai/` from git + source via [37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md); regenerate indexes | Re-plan from git history |
| Half-applied edit leaves lint/type errors | Crash mid-edit | `npm run lint` / `npm run plugin:typecheck` to locate; complete or revert the edit | Re-run gate, checkpoint |
| Uncertain whether any generated output is current | Unknown staleness | Just `npm run ds:build` (always safe, R8) and check `git status` | Continue |

**Golden rule of recovery:** when in doubt, **regenerate** (idempotent, cheap) rather than reason about staleness, and let the **working tree** decide _what happened_ while **Storybook/source** decides _what is correct_.

---

## 10. Dependencies

- **Constitution / precedence** — [00_MASTER_RULES.md](./00_MASTER_RULES.md) (Design Lock, generated-is-sacred, source-of-truth hierarchy).
- **Harness that performs the read/write cycle** — [02_AI_HARNESS.md](./02_AI_HARNESS.md).
- **Manifest schemas this doc reads/writes** — [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md), especially [.ai/TASKS.json](../../.ai/TASKS.json) and [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md).
- **The memory system that hosts `.ai/`** — [37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md).
- **Task lifecycle that resume re-enters** — [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md).
- **Token-minimal reading strategy** — [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md).
- **Review/approval gates** — [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md); change propagation — [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md).
- **File placement of `.ai/` + `docs/ai-os/`** — [18_FOLDER_STRUCTURE.md](./18_FOLDER_STRUCTURE.md).
- **Workflows/checklists that invoke resume** — [38_AI_WORKFLOW.md](./38_AI_WORKFLOW.md), [39_AI_CHECKLIST.md](./39_AI_CHECKLIST.md).
- **MCP session-recovery surface (operates on this protocol)** — [35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md).
- **Real scripts / files** — `package.json` scripts `ds:build`, `tokens:build`, `manifest:build`, `catalog:build`, `figma:build`, `plugin:test`, `lint`; generators `scripts/build-tokens.ts`, `scripts/build-manifest.ts`, `scripts/build-catalog.ts`; gate `figma/plugin/test/harness.ts`; registry `src/components/metas.ts`.
- **Manifests refreshed on checkpoint** — [.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json), [.ai/TOKEN_INDEX.json](../../.ai/TOKEN_INDEX.json), [.ai/VARIANT_INDEX.json](../../.ai/VARIANT_INDEX.json), [.ai/FIGMA_MAPPING.json](../../.ai/FIGMA_MAPPING.json), [.ai/PLUGIN_INDEX.json](../../.ai/PLUGIN_INDEX.json), [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md), [.ai/REVIEW_REPORT.md](../../.ai/REVIEW_REPORT.md).
- **PLANNED** — resume hooks for backend/DB/API tasks reference [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [15_API_GUIDE.md](./15_API_GUIDE.md), [16_NODE_GUIDE.md](./16_NODE_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md) and [.ai/ERD.json](../../.ai/ERD.json) / [.ai/API_SPEC.json](../../.ai/API_SPEC.json), all marked PLANNED — no backend exists in the repo today.

---

## 11. Template

### `.ai/TASKS.json` (resume-ready skeleton)

```jsonc
{
  "$schema": "./schemas/TASKS.schema.json",
  "version": "1.0.0",
  "generatedAt": "2026-07-08T00:00:00Z",
  "generator": "AI OS task engine",
  "branch": "feat/callout",
  "tasks": [
    {
      "id": "T-XXX",
      "title": "<imperative task title>",
      "type": "component | token | variant | plugin | doc | backend(PLANNED)",
      "status": "in_progress",           // at most one in_progress per branch (R9)
      "currentStepId": "sN",
      "acceptance": "figma:build green + review passed",
      "steps": [
        { "id": "s1", "desc": "Write X.meta.ts",            "status": "done" },
        { "id": "s2", "desc": "Write X.tsx + X.css",         "status": "done" },
        { "id": "s3", "desc": "Write X.stories.tsx",          "status": "todo" },
        { "id": "s4", "desc": "Register in metas.ts + barrel", "status": "todo" },
        { "id": "s5", "desc": "Regenerate", "status": "todo", "gate": "ds:build" },
        { "id": "s6", "desc": "Verify Figma", "status": "todo", "gate": "figma:build" }
      ],
      "touches": ["src/components/molecules/X/*", "src/components/metas.ts"],
      "doNot": ["add a type (A/B/C) axis", "hand-edit generated outputs"]
    }
  ]
}
```

### `.ai/SESSION_SUMMARY.md` skeleton

```markdown
# Session Summary

## Current State
<task id + title>; steps done: <ids>; files written: <paths>; not yet: <steps>.

## Next Action
<the single next command/step, exact npm script named>.

## Decisions
- <date> <decision + why (reuse-first / approved change)>

## Do NOT
- <constraints the resuming agent must honor (Design Lock, no new axis, etc.)>

## Open Questions / Escalations
- <anything requiring the user, per 30_REVIEW_SYSTEM.md>
```

### Checkpoint routine (pseudo-shell, after a gate goes green)

```bash
npm run ds:build && npm run figma:build   # gate
# then, on exit 0:
#  1) TASKS.json: step.status = "done"; currentStepId = next; generatedAt = now
#  2) SESSION_SUMMARY.md: append progress; refresh Current State + Next Action
#  3) refresh affected .ai/*_INDEX.json
git add -A   # commit boundary handled per 29_TASK_EXECUTION.md
```

---

## 12. Future Extension

- **MCP-native resume.** [35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md) exposes `resume`/`checkpoint` tools that read and mutate exactly the resume pair defined here, so IDE agents (Cursor, Windsurf, Codex) recover through one tool call instead of manual file reads.
- **Machine-verified checkpoints.** A future `scripts/verify-checkpoint.ts` (invoked in `figma:build` or **PLANNED** CI, [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)) can assert §7's ledger↔tree↔generated consistency automatically and fail a stale `done`.
- **Distributed / multi-agent resume.** As the roster in [36_AI_AGENT_SPECIFICATION.md](./36_AI_AGENT_SPECIFICATION.md) grows, `TASKS.json` gains per-agent ownership + worktree isolation so `@tds-component` and `@figma-plugin` resume independent sub-tasks without contention (R9 generalizes from per-branch to per-worktree).
- **PLANNED backend continuity.** When the Supabase backend lands, resume extends to migration idempotency and API-contract checkpoints, keyed off [.ai/ERD.json](../../.ai/ERD.json) and [.ai/API_SPEC.json](../../.ai/API_SPEC.json) — every DB step written as a re-runnable migration so a mid-deploy crash replays safely (see [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md)); all marked PLANNED until a backend exists.
- **>10M-user scale.** At scale the resume protocol stays O(1) in agent cost because rehydration reads a bounded resume pair, never the growing component/token corpus — the manifest-first discipline of [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md) guarantees recovery cost does not grow with the system.
