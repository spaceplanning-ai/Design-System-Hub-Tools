<!-- filename: 29_TASK_EXECUTION.md -->

# 29 — Task Execution

> **Title:** Task Execution
> **Purpose:** Define the single, canonical lifecycle every task in the TDS repo travels — intake → plan → read manifests → implement → validate → update manifests → review → commit — the gates it must clear (`lint`, `tsc`/typecheck, `ds:build`, `figma:build`, `plugin:test`, review), how `.ai/TASKS.json` tracks state, how work is checkpointed for resume, and the exact approval and rollback points.
> **Status:** ACTIVE for the frontend/design-system/plugin surfaces. Backend/DB/API/CI/test-framework steps are marked **PLANNED** where they appear.
> **Owner:** AI OS
> **Last-reviewed:** _(placeholder — set on first review)_
> **Precedence:** Subordinate to [00_MASTER_RULES.md](./00_MASTER_RULES.md) (the constitution), [01_AI_SPECIFICATION.md](./01_AI_SPECIFICATION.md) (what an agent must do), and [02_AI_HARNESS.md](./02_AI_HARNESS.md) (how the harness executes). This document sequences and gates the work those docs govern; it never relaxes the Design Lock, the source-of-truth hierarchy, or the generated-is-sacred law.

---

## 1. Purpose

This document is the **assembly line** of the TDS AI Operating System. Where [02_AI_HARNESS.md](./02_AI_HARNESS.md) describes the machinery, this file describes the *conveyor*: the ordered stages a request passes through, the checkpoints written between stages so any agent can resume after context loss, and the gates that must go green before a change is allowed to advance.

It exists so that, for years and across every AI client (Claude Code, Gemini CLI, Cursor, Codex, Windsurf, PLANNED MCP agents), every task is executed the **same deterministic way**:

- One lifecycle, one state machine, tracked in [.ai/TASKS.json](../../.ai/TASKS.json).
- **Read-before-write, manifest-first** — cheap `.ai/*` manifests and [docs/COMPONENTS.md](../COMPONENTS.md) before expensive `src/**` source ([26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md)).
- Change the **SOURCE only** (`*.meta.ts`, `src/tokens/*`, component `.css`, `scripts/*`), never a generated output; then regenerate through the real npm pipeline.
- Prove correctness with the **real gates** — `npm run lint`, `tsc`, `npm run ds:build`, `npm run figma:build`, `npm run plugin:test` — never "looks fine to me."
- Leave `.ai/` and the repo in a state a fresh agent can **resume** with zero rediscovery ([28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md)).

A task that skips a stage, edits a generated file, or advances past a red gate is not "fast" — it is broken, and it blocks merge.

## 2. Responsibilities

This specification owns:

1. **The lifecycle definition** — the ordered stages S0–S9 (Section 5) and their entry/exit conditions.
2. **The task state machine** — the legal `status` values in [.ai/TASKS.json](../../.ai/TASKS.json), their transitions, and what each transition requires (Section 6 / Section 5).
3. **The gate set and gate order** — which of `lint` / `tsc` / `ds:build` / `figma:build` / `plugin:test` / review applies to which change class, and in what sequence (Section 7).
4. **Checkpointing for resume** — what is written to `.ai/TASKS.json` + `.ai/SESSION_SUMMARY.md` at each stage boundary so work is idempotently resumable ([28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md)).
5. **Approval points** — where a human must explicitly approve before work proceeds (Design-Lock visual changes, new-component creation, any PLANNED-backend work).
6. **Rollback points** — where and how a failed or rejected task is reverted cleanly without leaving generated-file drift.
7. **Implementation Order** — the fixed sequence in which the five component files / token edits / plugin edits are touched so the pipeline stays coherent.

It is **not** responsible for: the manifest schemas ([27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md)), the review rubric itself ([30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)), the memory directory structure ([37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md)), or the recipe catalog ([38_AI_WORKFLOW.md](./38_AI_WORKFLOW.md)). It sequences and gates them.

## 3. Scope

**In-scope**

- The end-to-end task lifecycle for the ACTIVE surfaces: components (`src/components/**`), tokens (`src/tokens/*`), the Figma manifest/bundle (`scripts/build-*.ts`, `figma/tds.plugin.json`), the plugin (`figma/plugin/src/*.ts`), and the AI-OS docs/manifests (`docs/ai-os/*`, `.ai/*`).
- The `.ai/TASKS.json` state machine, checkpoint cadence, and resume hooks.
- The gate matrix and the approval/rollback control points.
- Implementation Order and Review/Approval Gates.

**Out-of-scope (owned elsewhere)**

- *How* the harness assembles context and enforces guardrails → [02_AI_HARNESS.md](./02_AI_HARNESS.md).
- The review rubric, drift checks, and `REVIEW_REPORT.md` → [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md).
- Resume mechanics (rehydration, `SESSION_SUMMARY.md` shape) in full → [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md).
- Cold-start bootstrap ordering for the whole repo → [34_PROJECT_BOOTSTRAP.md](./34_PROJECT_BOOTSTRAP.md).
- Change propagation/versioning/deprecation → [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md).
- PLANNED CI enforcement of these gates on PR → [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md); PLANNED test tiers → [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md).

## 4. Rules

Rules are enforceable and tied to a real mechanism. **MUST** = blocking; **SHOULD** = strong default; **NEVER** = hard prohibition.

1. **T1 — One task, one `TASKS.json` entry (MUST).** Every unit of work MUST exist as an entry in [.ai/TASKS.json](../../.ai/TASKS.json) before implementation begins, carrying at minimum `id`, `title`, `surface`, `status`, and `checkpoint`. No silent side-quests.
2. **T2 — Follow the stages in order (MUST).** Work MUST proceed S0→S9 (Section 5). A stage MUST NOT start until the prior stage's exit condition is met (e.g. no `implement` before `plan` + manifest reads).
3. **T3 — Read-before-write, manifest-first (MUST).** Before editing, the governing manifest(s) MUST be read: components → `.ai/COMPONENT_INDEX.json` + `.ai/VARIANT_INDEX.json` + [docs/COMPONENTS.md](../COMPONENTS.md); tokens → `.ai/TOKEN_INDEX.json`; Figma/plugin → `.ai/FIGMA_MAPPING.json` + `.ai/PLUGIN_INDEX.json` + [figma/README.md](../../figma/README.md). Open `src/**` only when a manifest lacks the exact detail (R2 of [02_AI_HARNESS.md](./02_AI_HARNESS.md)).
4. **T4 — Reuse before create (MUST).** With 60 components already built, the default outcome is reuse. Creating a new component is an **approval point** (T10); it MUST be justified against `.ai/COMPONENT_INDEX.json` first ([07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md)).
5. **T5 — Source only, never generated (NEVER).** Implementation MUST edit SOURCE (`*.meta.ts`, `src/tokens/{primitives,semantic}.ts`, component `.tsx`/`.css`, `.stories.tsx`, `scripts/build-*.ts`, `figma/plugin/src/*.ts`). It MUST NEVER write `figma/tds.plugin.json`, `src/generated/design-system.manifest.json`, `src/tokens/generated/*`, `docs/COMPONENTS.md`, or `figma/plugin/code.js` (constitution §4D).
6. **T6 — Design Lock is an approval point (NEVER without approval).** Any visual change (layout, spacing, color, typography, radius, shadow, motion) or any rename MUST NOT be self-initiated. It requires an explicit human request/approval recorded on the task, then flows as a SOURCE change ([00_MASTER_RULES.md](./00_MASTER_RULES.md) §4A; [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md)).
7. **T7 — Implementation Order is fixed (MUST).** For component work the file order is `*.meta.ts` → `*.tsx`(+`*.css`) → `*.stories.tsx` → register in `src/components/metas.ts` + tier barrel (Section 5, Example B). For tokens: `primitives.ts`/`semantic.ts` → `tokens:build`. Order keeps the generated pipeline coherent.
8. **T8 — Gate before advance (MUST).** A task MUST NOT enter `in_review` until every gate in its change class (Section 7) is green. A red gate is a **blocking** failure, not a warning.
9. **T9 — Checkpoint at every stage boundary (MUST).** On each S0–S9 transition the agent MUST update the task's `status` + `checkpoint` in [.ai/TASKS.json](../../.ai/TASKS.json) and refresh [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md), so a fresh agent resumes at the exact next unchecked step (T2 + [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md)).
10. **T10 — Explicit approval points (MUST).** Three transitions require recorded human approval before proceeding: (a) a Design-Lock visual change/rename; (b) creating a **new** component/token/axis; (c) any **PLANNED** backend/DB/API/Supabase/CI/test-framework work. Absence of an instruction is NOT approval.
11. **T11 — Idempotent, resumable steps (MUST).** Every stage MUST be safe to re-run. Re-running a `*:build` MUST leave generated files byte-identical when source is unchanged; a resumed task MUST NOT double-apply an edit (check current file state first).
12. **T12 — Rollback leaves no drift (MUST).** Aborting or reverting a task MUST restore both source and generated files to a clean state: revert the source edit, then re-run `ds:build`/`figma:build` (or `git checkout` the generated paths) so no hand-edit or stale artifact remains (Section 9).
13. **T13 — Regenerate, never reconcile by hand (MUST).** After a source change, derived outputs and derived `.ai/*` manifests are refreshed by running the owning `*:build`, never by editing them to match (constitution §G-2).
14. **T14 — Write back memory before done (MUST).** Before a task reaches `done`, `.ai/TASKS.json`, `.ai/CHANGELOG.md`, and `.ai/SESSION_SUMMARY.md` MUST be updated; on release-bound changes, `.ai/REVIEW_REPORT.md` per [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md).
15. **T15 — Commit only on request, branch off `main` (SHOULD/MUST).** The agent MUST NOT commit or push unless the user asks. When asked and on `main`, it MUST branch first. Commit messages follow the repo trailer convention.
16. **T16 — PLANNED stays PLANNED (MUST).** No lifecycle step may assume a server, `.env`, database, REST/GraphQL/RPC API, auth, `.github` CI, or a `test` npm script exists. The only automated gate today is the headless harness `figma/plugin/test/harness.ts` via `npm run plugin:test`.

## 5. Workflow

The canonical lifecycle. Every stage lists its **entry**, **do**, **exit → `TASKS.json` status**, and **checkpoint**. Stages reference real files and real npm scripts. This is the single path; specialized recipes in [38_AI_WORKFLOW.md](./38_AI_WORKFLOW.md) are shorthands over these stages.

**S0 — Rehydrate.** *Entry:* any session start. *Do:* read [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md) + [.ai/TASKS.json](../../.ai/TASKS.json); if a task is `in_progress`/`blocked`, resume it at its `checkpoint` ([28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md)); else intake new. *Exit:* the active task id is known.

**S1 — Intake.** *Do:* create/confirm the [.ai/TASKS.json](../../.ai/TASKS.json) entry with `id`, `title`, `surface` (`component | token | figma | plugin | docs | manifest | PLANNED-backend`), `request`, and `acceptance` (how "done" is judged). *Exit → `status: "queued"`.* *Checkpoint:* task recorded.

**S2 — Classify & plan.** *Do:* pick the surface's source-of-truth entry point and gate class from the matrix in Section 7; decide reuse vs. edit vs. new. If new-component / visual change / PLANNED-backend → mark an **approval point** (T10) and pause for approval. *Exit → `status: "planned"`.* *Checkpoint:* plan + target file list + required gates recorded.

**S3 — Read manifests (context assembly).** *Do:* load only the manifests the plan needs (T3); open `src/**` solely for missing detail (exact prop shape, compound sub-part). Stop when you can name the exact file(s) to change. *Exit:* target files named. *Checkpoint:* manifests read listed on the task.

**S4 — Guardrail check.** *Do:* confirm every target path is a SOURCE path (T5); confirm no self-initiated visual change/rename (T6). If a Design-Lock or PLANNED trigger fires and lacks approval → `status: "blocked"`, escalate. *Exit:* guardrails pass. *Checkpoint:* guardrail result.

**S5 — Implement (fixed Implementation Order, T7).** *Entry → `status: "in_progress"`.* *Do:* make the smallest correct edit in the required order:
- **Component:** `X.meta.ts` (pure data, relative imports) → `X.tsx` (forwardRef, `toDataAttrs(meta, {...})`, `cx`, `FormField` for inputs) + `X.css` (`var(--tds-*)` only) → `X.stories.tsx` (CSF3, `argTypesFromMeta`) → register in `src/components/metas.ts` + the tier barrel + `src/components/index.ts`.
- **Token:** edit `src/tokens/primitives.ts` and/or `src/tokens/semantic.ts` only.
- **Figma/plugin:** edit `scripts/build-manifest.ts` (bundle shape) or `figma/plugin/src/*.ts` (algorithm) — never the JSON output.
*Checkpoint:* per-file progress (which files done) so a mid-edit resume is exact (T9/T11).

**S6 — Regenerate.** *Do:* run the narrowest build that refreshes derived outputs:
```bash
npm run tokens:build     # tsx scripts/build-tokens.ts   -> src/tokens/generated/{tokens.css,figma.tokens.json,token-ids.ts}
npm run ds:build         # tokens:build && manifest:build && catalog:build (any meta/token change)
npm run figma:build      # ds:build && plugin:typecheck && plugin:build && plugin:test (anything Figma-reaching)
```
*Checkpoint:* which build ran.

**S7 — Validate (gates, Section 7).** *Do:* run the gate class for the change; red = fix and re-run (loop S5–S7). *Exit → `status: "validated"`.* *Checkpoint:* gate results (green/red per gate).

**S8 — Write back memory.** *Do:* the `*:build` in S6 already regenerated derived `.ai/*` manifests; now update state manifests — mark the task, append [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md), refresh [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md) (T14). *Exit → `status: "in_review"`.* *Checkpoint:* memory write-back done.

**S9 — Review, approval & commit.** *Do:* run the review gate per [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md) (drift check, reuse check, gate transcript → `REVIEW_REPORT.md`). On pass and explicit user request, commit (branch first if on `main`, T15). *Exit → `status: "done"`.* On reject → `status: "changes_requested"`, loop back to S5. *Checkpoint:* final status + commit ref (if any).

**Gate loop:** S5 → S6 → S7 repeats until all gates are green; only then S8 → S9. **Rollback (any stage):** `status: "rolled_back"` per Section 9.

## 6. Examples

**A. `TASKS.json` state machine (legal `status` transitions).**

```text
queued ─► planned ─► in_progress ─► validated ─► in_review ─► done
                        ▲   │            │            │
                        │   ▼            ▼            ▼
                     blocked        (gate red →   changes_requested
                   (approval/         back to        (review reject →
                    guardrail)       in_progress)     back to in_progress)
   any state ─► rolled_back   (abort/revert; see §9)
```

- `queued` S1 · `planned` S2 · `blocked` S4 (awaiting approval/guardrail) · `in_progress` S5 · `validated` S7 · `in_review` S8/S9 · `done` S9 · `changes_requested` S9 reject · `rolled_back` §9.

**B. A real task through the lifecycle — "add a `soft` variant option to Badge" (edit, no new component).**

```jsonc
// .ai/TASKS.json entry (checkpointed at S7)
{
  "id": "T-0142",
  "title": "Badge: add variant=soft option",
  "surface": "component",
  "status": "validated",
  "approvalRequired": true,          // adds a variant OPTION → confirm not a Design-Lock rename
  "approvedBy": "sb.hong (2026-07-08)",
  "targets": [
    "src/components/atoms/Badge/Badge.meta.ts",
    "src/components/atoms/Badge/Badge.css"
  ],
  "manifestsRead": [".ai/VARIANT_INDEX.json", "docs/COMPONENTS.md#Badge"],
  "gates": { "lint": "green", "ds:build": "green", "figma:build": "green", "plugin:test": "green" },
  "checkpoint": "S7 validated; next S8 write-back"
}
```
Implementation Order (T7): add `'soft'` to the `variant` axis options in `Badge.meta.ts` → add the `[data-variant='soft']` token-bound rule in `Badge.css` (`var(--tds-*)` only) → `npm run ds:build` → `npm run figma:build` (harness asserts the new variant appears in the Component Set). No new file; `Badge.stories.tsx` picks the option up automatically via `argTypesFromMeta(meta)`.

**C. Gate transcript (component change).**

```bash
npm run lint          # eslint . — flat config: ts-eslint, react-hooks, react-refresh, storybook, no-unused
npm run ds:build      # tokens:build && manifest:build && catalog:build  (regenerates bundle + catalog)
npm run figma:build   # ds:build && plugin:typecheck && plugin:build && plugin:test
# plugin:test runs figma/plugin/test/harness.ts — headless Figma mock; process.exit(1) on ANY coverage
# mismatch (collections, resolved VARIABLE_ALIAS, effect/text styles, component sets == component count,
# cartesian variant totals, TEXT/BOOLEAN/INSTANCE_SWAP wiring, Auto-Layout fidelity, A/B/C type splits).
```

**D. Approval point (Design Lock) — task must pause.**

```text
REQUEST: "make Card shadows softer so it looks cleaner"
S2/S4  : Design-Lock trigger (T6) — shadow change is visual + self-initiated.
ACTION : status = "blocked"; do NOT edit. Surface: this is a SOURCE change to an effect
         token in src/tokens/*; needs explicit approval. On approval → edit token, ds:build,
         figma:build; harness green; status = validated.
```

**E. Checkpoint for resume (mid-implement context loss).**

```text
Session A dies during S5 after editing Badge.meta.ts but before Badge.css.
TASKS.json checkpoint: "S5 in_progress; meta.ts done; css pending".
Session B: S0 rehydrate → reads checkpoint → verifies Badge.meta.ts already has 'soft'
           (idempotency, T11) → resumes at Badge.css → continues S6+. No double-apply.
```

## 7. Validation Rules

Compliance is checked by real, runnable mechanisms. The **gate matrix** — which gates apply to which change class, run in this order, each blocking:

| Change class | Source edited | Gate order (all MUST be green) |
|---|---|---|
| Component / variant / prop | `src/components/**/X.{meta.ts,tsx,css,stories.tsx}`, `metas.ts` | `lint` → `tsc` (`build`) → `ds:build` → `figma:build` (incl. `plugin:test`) → review |
| Token (primitive/semantic/theme) | `src/tokens/{primitives,semantic}.ts` | `lint` → `tokens:build` → `ds:build` → `figma:build` (incl. `plugin:test`) → review |
| Figma bundle shape | `scripts/build-manifest.ts` | `lint` → `ds:build` → `figma:build` (incl. `plugin:test`) → review |
| Plugin algorithm | `figma/plugin/src/*.ts` | `plugin:typecheck` → `plugin:build` → `plugin:test` → review |
| Docs / `.ai/` manifest | `docs/ai-os/*`, `.ai/*` (seed) | schema/manual check → review |
| **PLANNED** backend/DB/API | (none exist today) | **PLANNED** gates ([24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md), [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)) — not runnable now |

The gates, in increasing strength:

1. **Lint gate — `npm run lint`** (`eslint .`). Enforces the flat config (typescript-eslint, react-hooks, react-refresh, storybook, `no-unused`, `consistent-type-imports`). MUST be green for any TS/TSX/CSS-adjacent change.
2. **Type gate — `tsc`** via `npm run build` (`tsc -b && vite build`) and `npm run plugin:typecheck` (`tsc -p figma/plugin/tsconfig.json`). `strict`, `noUnusedLocals/Parameters`, `verbatimModuleSyntax`. MUST be green.
3. **DS-build gate — `npm run ds:build`** = `tokens:build && manifest:build && catalog:build`. Proves tokens, manifest, and catalog regenerate cleanly from source. A rebuild MUST leave `src/tokens/generated/*`, `src/generated/design-system.manifest.json`, `figma/tds.plugin.json`, and `docs/COMPONENTS.md` byte-identical when source is unchanged (a post-build `git diff` is the hand-edit detector). MUST run after any `*.meta.ts` or token change.
4. **Figma-build gate — `npm run figma:build`** = `ds:build && plugin:typecheck && plugin:build && plugin:test`. The full Storybook→Figma pipeline. MUST run for any change that can reach the bundle.
5. **Plugin-coverage gate — `npm run plugin:test`** (`tsx figma/plugin/test/harness.ts`). The headless Figma-API mock runs the real `figma/plugin/src/code.ts` against the real `figma/tds.plugin.json` and asserts coverage; any mismatch → `process.exit(1)`. This is the objective Storybook↔Figma sync gate and the strongest automated check that exists today.
6. **Review gate — manual/assisted** per [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md). Confirms reuse-first, Design-Lock compliance (no unrequested visual change/rename), and that the gate transcript is green; produces `.ai/REVIEW_REPORT.md`. Blocks `done`.
7. **PLANNED gates** — unit/interaction/visual/e2e ([24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md)) and CI enforcement of the above on PR ([25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)) do not exist yet. Do not claim them as passing.

## 8. Checklist

Copy into the task thread and tick each item.

- [ ] Task exists in `.ai/TASKS.json` with `id`/`title`/`surface`/`status`/`acceptance` (T1).
- [ ] S0 rehydrate done; resumed at `checkpoint` if a task was in progress.
- [ ] Classified; surface + gate class chosen (Section 7 matrix); reuse-vs-new decided (T4).
- [ ] Approval recorded if new-component / visual change / PLANNED-backend (T10).
- [ ] Manifests read (manifest-first); `src/**` opened only for missing detail (T3).
- [ ] Every target path is a SOURCE path, not generated (T5).
- [ ] No self-initiated visual change or rename (T6).
- [ ] Implementation Order followed: meta → tsx(+css) → stories → metas.ts + barrel (T7).
- [ ] CSS uses `var(--tds-*)` only; imports from `@/components` barrel; `*.meta.ts` React/CSS-free.
- [ ] Narrowest `*:build` run to regenerate derived outputs (T13); rebuild `git diff` clean.
- [ ] `npm run lint` green.
- [ ] `tsc` / `npm run build` green (and `plugin:typecheck` for plugin work).
- [ ] `npm run ds:build` green (meta/token changes).
- [ ] `npm run figma:build` green including `plugin:test` (Figma-reaching changes).
- [ ] `.ai/TASKS.json` + `.ai/CHANGELOG.md` + `.ai/SESSION_SUMMARY.md` updated (T14).
- [ ] Review gate passed; `.ai/REVIEW_REPORT.md` written ([30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)).
- [ ] Committed only if the user asked; branched off `main` first (T15).
- [ ] Any backend/DB/API/CI/test-framework content labelled **PLANNED** (T16).

## 9. Failure Recovery

Symptom → diagnosis → fix → resume. Rollback points are explicit.

- **Symptom: `git diff` shows changes in `src/tokens/generated/*`, `src/generated/*`, `figma/tds.plugin.json`, or `docs/COMPONENTS.md` you did not intend.**
  *Diagnosis:* a generated file was hand-edited (T5 breach) or source changed without a rebuild. *Fix (rollback point):* `git checkout -- <generated path>`; make the change in SOURCE; run `npm run ds:build`. *Resume:* re-verify diff clean, continue at S6.
- **Symptom: `npm run figma:build` fails at `plugin:test` — "component sets N/M" or variant/alias mismatch.**
  *Diagnosis:* a `*.meta.ts` axis/variant or token changed but the bundle wasn't regenerated, or a real fidelity gap. *Fix:* `npm run ds:build` then `npm run figma:build`; if still red, correct the SOURCE meta / `scripts/build-manifest.ts` — never the harness assertions. *Resume:* green harness = S7 pass → S8.
- **Symptom: `lint`/`tsc` red after edit.**
  *Diagnosis:* convention breach (deep import, unused, missing `import type`) per [19_CODE_CONVENTION.md](./19_CODE_CONVENTION.md). *Fix:* switch to barrel imports / `import type`; `npm run format`. *Resume:* re-run S7.
- **Symptom: task blocked awaiting approval (Design Lock / new component / PLANNED backend).**
  *Diagnosis:* T10 approval point. *Fix:* set `status: "blocked"`, surface the exact decision needed; do not proceed. *Resume:* on recorded approval → `status: "in_progress"`, continue at S5.
- **Symptom: review rejected the change.**
  *Diagnosis:* drift/reuse/gate failure found in review. *Fix:* `status: "changes_requested"`; address findings in `REVIEW_REPORT.md`. *Resume:* loop S5→S9.
- **Symptom: task must be abandoned/reverted (rollback point).**
  *Diagnosis:* superseded, wrong approach, or failed approval. *Fix:* revert source edits; re-run `ds:build`/`figma:build` (or `git checkout` generated paths) so no drift remains (T12); set `status: "rolled_back"` with a reason. *Resume:* pick the next `queued` task.
- **Symptom: context lost mid-task / new session.**
  *Diagnosis:* fresh agent. *Fix:* S0 rehydrate — read `.ai/SESSION_SUMMARY.md` + `.ai/TASKS.json`, verify current file state (idempotency, T11). *Resume:* continue at the recorded `checkpoint` ([28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md)).
- **Symptom: request needs backend/DB/API/auth.**
  *Diagnosis:* T16 — none exists today. *Fix:* label **PLANNED**, point to [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md)/[15_API_GUIDE.md](./15_API_GUIDE.md)/[17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md); do not scaffold silently. *Resume:* proceed only on the frontend surface.

## 10. Dependencies

**Docs (`docs/ai-os/`):** [00_MASTER_RULES.md](./00_MASTER_RULES.md), [01_AI_SPECIFICATION.md](./01_AI_SPECIFICATION.md), [02_AI_HARNESS.md](./02_AI_HARNESS.md), [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md), [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md), [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md), [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md), [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md), [19_CODE_CONVENTION.md](./19_CODE_CONVENTION.md), [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md), [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md), [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md), [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md), [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md), [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md), [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md), [34_PROJECT_BOOTSTRAP.md](./34_PROJECT_BOOTSTRAP.md), [37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md), [38_AI_WORKFLOW.md](./38_AI_WORKFLOW.md), [39_AI_CHECKLIST.md](./39_AI_CHECKLIST.md). PLANNED backend: [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [15_API_GUIDE.md](./15_API_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md).

**Manifests (`.ai/`):** [TASKS.json](../../.ai/TASKS.json) (the state machine this doc drives), [SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md), [CHANGELOG.md](../../.ai/CHANGELOG.md), [REVIEW_REPORT.md](../../.ai/REVIEW_REPORT.md), [PROJECT_MANIFEST.json](../../.ai/PROJECT_MANIFEST.json), [COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json), [TOKEN_INDEX.json](../../.ai/TOKEN_INDEX.json), [VARIANT_INDEX.json](../../.ai/VARIANT_INDEX.json), [FIGMA_MAPPING.json](../../.ai/FIGMA_MAPPING.json), [PLUGIN_INDEX.json](../../.ai/PLUGIN_INDEX.json).

**Scripts / real files:** `scripts/build-tokens.ts`, `scripts/build-manifest.ts`, `scripts/build-catalog.ts`, `src/components/metas.ts`, `src/core/defineComponent.ts`, `figma/plugin/src/code.ts`, `figma/plugin/test/harness.ts`, `figma/README.md`, [docs/COMPONENTS.md](../COMPONENTS.md), `package.json` scripts (`lint`, `build`, `ds:build`, `figma:build`, `plugin:typecheck`, `plugin:build`, `plugin:test`).

## 11. Template

Copy-paste task record (drop into the task thread and mirror into `.ai/TASKS.json` + `.ai/SESSION_SUMMARY.md`).

```md
### Task <T-id> — <title>
Surface: <component | token | figma | plugin | docs | manifest | PLANNED-backend>
Acceptance: <how "done" is judged>

Lifecycle (check as you advance):
- [ ] S0 rehydrate         status: (resumed? checkpoint=…)
- [ ] S1 intake            status: queued
- [ ] S2 classify+plan     status: planned    approval? [none | required→approvedBy:<name/date>]
- [ ] S3 read manifests    (.ai/…, docs/COMPONENTS.md#…)
- [ ] S4 guardrail check   (all targets SOURCE? no visual-change? )
- [ ] S5 implement         status: in_progress  order: meta→tsx(+css)→stories→metas.ts+barrel
- [ ] S6 regenerate        cmd: [ tokens:build | ds:build | figma:build ]
- [ ] S7 validate          status: validated
        - [ ] npm run lint
        - [ ] tsc / npm run build (+ plugin:typecheck)
        - [ ] npm run ds:build   (rebuild git diff clean)
        - [ ] npm run figma:build (incl. plugin:test)
- [ ] S8 write-back        status: in_review   (.ai/TASKS.json + CHANGELOG.md + SESSION_SUMMARY.md)
- [ ] S9 review+commit     status: done        (REVIEW_REPORT.md; commit only if asked, branch off main)

Rollback: [ n/a | rolled_back — reason: … ; source reverted + rebuilt clean ]
Report: reused <X>; created <Y>; import: import { … } from '@/components';
```

## 12. Future Extension

The lifecycle is designed to hold for years and beyond 10,000,000 users without changing its contract — **intake → plan → read → implement → validate → write-back → review → commit** stays constant; only the gate set and surfaces grow:

- **CI enforcement (PLANNED).** A `.github/` pipeline ([25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)) runs the Section 7 gate matrix on every PR so the gates are enforced by machine, not goodwill; `plugin:test` becomes a required status check and the "rebuild leaves diff clean" test blocks merge automatically.
- **Richer test tiers (PLANNED).** Interaction/visual/unit/e2e ([24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md)) each register as an additional row in the gate matrix and a new `[ ]` in S7 without altering the stage order.
- **Backend surfaces (PLANNED).** When the Supabase/Node backend (docs [14](./14_DATABASE_GUIDE.md)–[17](./17_SUPABASE_GUIDE.md)) lands, tasks gain DB/API classes with their own migration/`API_SPEC.json`/`ERD.json` gates; the S0–S9 stages, approval points, and rollback discipline extend to them verbatim (FE↔BE sync flows down, never up).
- **MCP-driven execution (PLANNED).** An MCP server ([35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md)) exposes `TASKS.json` state transitions and checkpoints as first-class tools, making resume and multi-agent handoff cheaper; the state machine in Section 6 is the contract it implements.
- **Multi-agent fleets.** Parallel role agents ([36_AI_AGENT_SPECIFICATION.md](./36_AI_AGENT_SPECIFICATION.md)) each drive one `TASKS.json` entry; the checkpoint cadence (T9) and idempotency (T11) keep them from duplicating or drifting.

The invariant across all extensions: **one task, one entry, staged and gated — source → build → validate → write-back → review — with generated outputs sacred and Storybook the immutable visual truth.**
