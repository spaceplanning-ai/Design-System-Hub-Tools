<!-- filename: 38_AI_WORKFLOW.md -->

# 38 — AI Workflow

> **Title:** AI Workflow
> **Purpose:** Provide the canonical, copy-pasteable runbooks an AI agent follows to do real work in the TDS repo — add a component, add/edit a variant axis or option, add a token, sync Figma, resume after context loss, and run a review — each wired to the exact npm scripts, validation gates, and `.ai/*` manifests it must touch.
> **Status:** ACTIVE (all recipes below run against code that exists today; backend/DB/API/CI/test-framework steps are marked **PLANNED**).
> **Owner:** AI OS
> **Last-reviewed:** _(placeholder — set on first review)_
> **Precedence:** Subordinate to [00_MASTER_RULES.md](./00_MASTER_RULES.md) (constitution, Design Lock, generated-is-sacred) and to the task lifecycle in [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md). This document is the *procedural* layer: it sequences the rules that other docs *define*. Where a recipe and a specialist spec disagree, the specialist spec wins ([07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md), [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md), [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md), [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md)).

---

## 1. Purpose

An AI agent working in TDS does not improvise. Every meaningful change flows through one of a small
set of **named workflows**, each of which is deterministic, reproducible, and ends in the same place:
sources changed, generated outputs regenerated (never hand-edited), gates green, `.ai/*` manifests
reconciled, and a `.ai/CHANGELOG.md` entry written. This document is the master runbook that turns the
abstract rules of the AI OS into ordered, executable steps.

TDS is **metadata-driven**: one pure-data `X.meta.ts` per component feeds four outputs (React,
Storybook, `src/generated/design-system.manifest.json`, and the Figma bundle `figma/tds.plugin.json`),
and tokens authored in `src/tokens/*.ts` generate `src/tokens/generated/{tokens.css, figma.tokens.json, token-ids.ts}`.
Because so much is generated, the danger is not "how do I write code" but "did I change the **source** and
re-run the **right build** so all four outputs stay in sync." These recipes exist to make that impossible to
get wrong.

The six canonical workflows are:

- **W1 — Add a component** (only when the 60-component catalog has no fit).
- **W2 — Add / edit a variant** (new axis, new option, or changed default).
- **W3 — Add a token** (primitive / semantic / theme).
- **W4 — Sync Figma** (regenerate the bundle and prove fidelity via the headless harness).
- **W5 — Resume after context loss** (rehydrate from `.ai/` instead of re-reading the repo).
- **W6 — Run a review** (drift + gate audit that blocks or clears a change).

Every workflow is a specialization of the universal loop **W0** (§5.1), which itself mirrors
[29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md).

## 2. Responsibilities

This document is responsible for:

1. The **universal execution loop W0** that every task obeys, and the branch points that select W1–W6.
2. The **exact step sequence** for each of the six workflows, each step naming a real file, npm script, or manifest.
3. The **gate-to-workflow mapping** — which of `lint` / `plugin:typecheck` / `ds:build` / `figma:build` / `plugin:test` must pass for each recipe.
4. The **manifest write-back contract per workflow** — which `.ai/*` files each recipe updates so the next agent starts warm.
5. **Reuse-first routing**: forcing a catalog lookup ([docs/COMPONENTS.md](../COMPONENTS.md)) before any "add" recipe runs.
6. **Delegation routing** to the two existing subagents, `@tds-component` and `@figma-plugin` (see [36_AI_AGENT_SPECIFICATION.md](./36_AI_AGENT_SPECIFICATION.md)).

It is **not** responsible for defining the artifacts the workflows manipulate — those live in their
specialist specs (component anatomy → 07, token model → 08, variant taxonomy → 09, plugin algorithm → 06,
manifest schemas → [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md), resume protocol →
[28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md), review gates → [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)).
This doc *sequences* them.

## 3. Scope

**In-scope**

- Step-by-step runbooks for W1–W6, grounded in real paths and the real npm scripts in `package.json`.
- The universal loop W0 and how it selects and closes out each workflow.
- Per-workflow validation gates and `.ai/*` manifest reconciliation.
- Worked, repo-specific examples (a real component, a real token, a real variant option).
- Failure recovery for the most common way each workflow breaks.

**Out-of-scope (owned elsewhere)**

- The *shape* of `ComponentMeta`, tokens, variants, the plugin bundle → docs 07 / 08 / 09 / 06.
- Manifest JSON Schemas and update/read rules → [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md).
- The full resume/checkpoint protocol and `SESSION_SUMMARY.md` format → [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md).
- Review report format and merge-blocking policy → [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md).
- Token/context budgeting tactics → [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md).
- **PLANNED** backend/DB/API/CI/test-framework workflows → docs 14–17, 24, 25 (no server, Supabase, `.github`, or unit-test runner exists in the repo today).

## 4. Rules

Every workflow in §5 obeys these. They are enforceable against real mechanisms in this repo.

1. **MUST** run the universal loop W0 for every task: intake → plan → read manifests → implement → validate → update manifests → review → commit. No step is optional (§5.1, [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md)).
2. **MUST** read cheap before expensive: consult [docs/COMPONENTS.md](../COMPONENTS.md) and the relevant `.ai/*` index **before** opening `src/**`. Reuse-first ([26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md)).
3. **NEVER** hand-edit a generated output. Files under `figma/`, `src/generated/`, and `src/tokens/generated/`, plus `figma/plugin/code.js`, are produced by scripts. To change them, change the **source** (`*.meta.ts`, `src/tokens/*.ts`, or a `scripts/*.ts`) and re-run the build ([00_MASTER_RULES.md](./00_MASTER_RULES.md)).
4. **NEVER** perform a visual redesign on your own initiative. Storybook is the immutable source of truth; Figma is a reproduction. Any color/spacing/type/radius/shadow/motion change is a **source** change that must be explicitly requested ([03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md), Design Lock).
5. **MUST** keep `*.meta.ts` React/CSS-free with **relative imports only**, so `scripts/build-manifest.ts` and `scripts/build-catalog.ts` can import it from Node (§5.2).
6. **MUST** import components only from the single barrel `@/components`; never deep-path. Use `var(--tds-*)` tokens only — no hardcoded colors/spacing/radius. Emit variants via `toDataAttrs(meta, {...})`.
7. **MUST** run the workflow's gate set (§7) and see it green **before** claiming completion. A red `plugin:test` or `ds:build` blocks the task.
8. **NEVER** add the `state` axis (default/hover/active/focus/disabled/loading) as a Figma variant. It stays a CSS/interaction concern; only `disabled`/`loading` survive as `BOOLEAN` component props ([09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md)).
9. **MUST** reconcile the `.ai/*` manifests the workflow touches and append a `.ai/CHANGELOG.md` line in the same task ([27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md), [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md)).
10. **SHOULD** delegate implementation to the right subagent: component/meta work → `@tds-component`; Figma plugin/bundle work → `@figma-plugin` ([36_AI_AGENT_SPECIFICATION.md](./36_AI_AGENT_SPECIFICATION.md)).
11. **MUST** make the smallest correct diff. No opportunistic refactors, no full-file rewrites, no "verify by re-reading" ([20_CLEAN_CODE.md](./20_CLEAN_CODE.md)).
12. **MUST**, on any interruption, write a checkpoint to `.ai/SESSION_SUMMARY.md` + `.ai/TASKS.json` so W5 can resume without loss (§5.6).

## 5. Workflow

### 5.1 W0 — The universal loop (every task runs this)

```
intake ─▶ plan ─▶ read manifests ─▶ classify ─▶ [ W1 | W2 | W3 | W4 | W5 | W6 ]
                                                     │
                    implement (source only) ◀────────┘
                          │
                          ▼
                  validate (gate set §7) ─▶ update .ai/* manifests ─▶ review (W6) ─▶ commit
```

1. **Intake.** Restate the request in one line. If it is a resume ("continue", "where were we"), branch to **W5** first.
2. **Plan.** Decide which workflow(s) apply. Write/append the task to `.ai/TASKS.json` (id, title, workflow, status `in_progress`).
3. **Read manifests.** Load only what the workflow needs (§10): e.g. `.ai/COMPONENT_INDEX.json` for W1, `.ai/TOKEN_INDEX.json` for W3, `.ai/VARIANT_INDEX.json` for W2, `.ai/FIGMA_MAPPING.json` for W4.
4. **Classify.** Confirm reuse-first: for any "add", prove nothing in [docs/COMPONENTS.md](../COMPONENTS.md) / `.ai/TOKEN_INDEX.json` already fits.
5. **Implement.** Edit **source** only (Rule 3). Delegate to a subagent if apt (Rule 10).
6. **Validate.** Run the gate set for the workflow (§7).
7. **Update manifests.** Reconcile the `.ai/*` files the workflow owns and append `.ai/CHANGELOG.md`.
8. **Review.** Run **W6** (§5.7). Fix findings; re-validate.
9. **Commit.** Only when asked. If on the default branch, branch first (see repo git policy).

### 5.2 W1 — Add a component

Precondition (Rule 2): nothing in [docs/COMPONENTS.md](../COMPONENTS.md) fits. Delegate to `@tds-component`.

1. **Confirm the gap.** Search `.ai/COMPONENT_INDEX.json` + [docs/COMPONENTS.md](../COMPONENTS.md). If a close component exists, prefer editing it (W2) over creating.
2. **Pick tier + folder.** `src/components/{atoms|molecules|organisms}/<Name>/`.
3. **Author the 5 files** (contract from [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md)):
   - `<Name>.meta.ts` — `defineComponentMeta({...})`, **relative imports only, React/CSS-free** (Rule 5). Declare `variantProps` (axes), `componentProps` (with `figmaType`), `states`, `tokens` bindings, `a11y`, and the `figma{}` frame.
   - `<Name>.tsx` — `forwardRef`; variants via `toDataAttrs(meta, {...})`; `cx` from `@/utils`; wrap form inputs in `FormField`.
   - `<Name>.css` — token vars only (`var(--tds-*)`); zero hardcoded values (the PostCSS scan in `scripts/lib/css-bindings.ts` derives per-variant bindings from this file).
   - `<Name>.stories.tsx` — CSF3, `title 'Tier/Name'`, `tags ['autodocs']`, `parameters metaParameters(meta)`, `argTypes argTypesFromMeta(meta)`, `args argsFromMeta(meta)`.
   - `index.ts` — re-export the component (+ compound parts).
4. **Register (two edits):** add the meta import + array entry in `src/components/metas.ts`, and export the component from the tier barrel (which feeds `src/components/index.ts`).
5. **Build:** `npm run ds:build` (regenerates tokens CSS, `src/generated/design-system.manifest.json` + `figma/tds.plugin.json`, and [docs/COMPONENTS.md](../COMPONENTS.md)).
6. **Prove Figma fidelity:** `npm run figma:build` (adds `plugin:typecheck` + `plugin:build` + `plugin:test` headless harness).
7. **Gates:** `npm run lint`. Then update `.ai/COMPONENT_INDEX.json`, `.ai/VARIANT_INDEX.json`, `.ai/FIGMA_MAPPING.json`, `.ai/DEPENDENCY_GRAPH.json`; append `.ai/CHANGELOG.md`.

### 5.3 W2 — Add / edit a variant

An axis is `type` (A/B/C), `variant` (label **"Style"**), `tone`, `size`, or `shape`. Edit the meta, then the CSS.

1. **Locate.** From `.ai/VARIANT_INDEX.json` / the component's `.meta.ts`, find the `variantProps` entry.
2. **Edit the axis** in `<Name>.meta.ts`: add an `option`, change a `default`, or add a new axis object (`name`, `label`, `options`, `default`, `description`).
3. **Add the CSS to render it** in `<Name>.css`, keyed on the `data-<axis>` attribute `toDataAttrs` emits — using `var(--tds-*)` tokens only.
4. **Add/adjust `tokens` bindings** in the meta for the new combo, honoring `when:{...}` filters (see the Button `border-color` per-tone example in §6.2).
5. **Never** add a `state` option as a variant (Rule 8). Interaction states live in CSS + hooks ([11_INTERACTION_SPECIFICATION.md](./11_INTERACTION_SPECIFICATION.md)).
6. **Build + verify:** `npm run ds:build` then `npm run figma:build`. The cartesian product grows — confirm the harness still passes and combo counts are sane (components with a `type` axis split into one Component Set per preset).
7. **Reconcile:** `.ai/VARIANT_INDEX.json`, `.ai/FIGMA_MAPPING.json`; append `.ai/CHANGELOG.md`.

### 5.4 W3 — Add a token

Tokens are authored in TypeScript and generate CSS + the Figma bundle. Delegate token-binding reuse to `@tds-component` where it touches components.

1. **Check for reuse** in `.ai/TOKEN_INDEX.json` — a semantic token may already express the intent.
2. **Author the source** in `src/tokens/`:
   - New raw value → `src/tokens/primitives.ts` (Primitives collection).
   - New role/alias → `src/tokens/semantic.ts` (Semantic scalar aliases) or the Theme color aliases (modes `light`/`dark`, `VARIABLE_ALIAS` into Primitives).
3. **Build tokens:** `npm run tokens:build` → regenerates `src/tokens/generated/tokens.css` (CSS var `--tds-<dots-as-dashes>`, e.g. `color.bg.default → --tds-color-bg-default`), `figma.tokens.json`, and the type-safe `token-ids.ts` union.
4. **Consume it** in component CSS as `var(--tds-...)` and/or bind it in a meta `tokens[]` entry (dot-notation id, e.g. `color.brand.solid`, `space.4`, `radius.control`).
5. **Full rebuild:** `npm run ds:build` then `npm run figma:build` so the token flows into all three collections (Primitives → Semantic → Theme) of the bundle.
6. **Reconcile:** `.ai/TOKEN_INDEX.json`, `.ai/DESIGN_MANIFEST.json`, `.ai/FIGMA_MAPPING.json`; append `.ai/CHANGELOG.md`.

### 5.5 W4 — Sync Figma (regenerate + prove fidelity)

Run after **any** W1/W2/W3, or when the bundle looks stale. This is the Storybook→Figma sync gate. Delegate plugin-side issues to `@figma-plugin`.

1. **Regenerate the bundle:** `npm run ds:build` (writes `figma/tds.plugin.json` = `{ tokens, design }` and `src/generated/design-system.manifest.json`).
2. **Type-check the plugin:** `npm run plugin:typecheck` (`tsc -p figma/plugin/tsconfig.json`).
3. **Bundle the plugin:** `npm run plugin:build` (esbuild `figma/plugin/src/code.ts` → `figma/plugin/code.js`, generated/gitignored).
4. **Headless verify:** `npm run plugin:test` — runs `figma/plugin/test/harness.ts` against a mock Figma API; it asserts coverage and `process.exit(1)` on any mismatch.
5. **One shot:** `npm run figma:build` chains steps 1–4. This is the canonical sync command.
6. **Do not touch** `figma/tds.plugin.json` or `figma/plugin/code.js` by hand (Rule 3). If output is wrong, fix the source meta/token/script and re-run.
7. **Reconcile:** `.ai/FIGMA_MAPPING.json`, `.ai/PLUGIN_INDEX.json`; append `.ai/CHANGELOG.md`. (Actually applying the bundle inside Figma is a manual plugin run per [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md) — the repo side ends at a green `plugin:test`.)

### 5.6 W5 — Resume after context loss

Triggered by a new session on an in-flight task, or the word "resume/continue". Full protocol in [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md).

1. **Read state, not source.** Load `.ai/SESSION_SUMMARY.md` (human narrative) and `.ai/TASKS.json` (structured state) — **before** any `src/**` (Rule 2, [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md)).
2. **Identify the open task** (`status: in_progress`) and the workflow it was running.
3. **Re-derive freshness cheaply:** run the workflow's gates (`npm run lint`, `npm run figma:build`) to learn the *current* truth instead of trusting memory.
4. **Rehydrate only the deltas:** open just the files the open task lists as touched.
5. **Resume at the recorded step** of W1–W4/W6; finish the loop W0.
6. **Checkpoint discipline (proactive):** whenever you pause mid-task, write the current step + touched files back to `.ai/SESSION_SUMMARY.md` and `.ai/TASKS.json` so the next resume is loss-free (Rule 12).

### 5.7 W6 — Run a review

Closes every task; can also run standalone. Report format + merge policy in [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md).

1. **Gate audit.** Confirm the workflow's full gate set is green (§7): `lint`, and for any source change `ds:build`, and for any component/token/variant/plugin change `figma:build` (incl. `plugin:test`).
2. **Design-Lock drift check.** Diff the change for unrequested visual edits (color/spacing/type/radius/shadow/motion, renamed token/component/variant). Any such edit without explicit request is a **block** (Rule 4).
3. **Generated-is-sacred check.** Confirm no file under `figma/`, `src/generated/`, `src/tokens/generated/` was hand-edited — each must be a build output of a source change (Rule 3).
4. **Manifest reconciliation check.** Confirm the `.ai/*` files the workflow owns were updated and `.ai/CHANGELOG.md` has a matching entry (Rule 9).
5. **Reuse check.** For any "add", confirm the catalog had no fit (Rule 2).
6. **Write `.ai/REVIEW_REPORT.md`** with verdict PASS/BLOCK and findings; run `/code-review` for correctness where code changed.
7. **On BLOCK:** fix, re-run gates, re-review. On PASS: task `status: done`; proceed to commit only when asked.

## 6. Examples

### 6.1 W4 — the canonical sync, end to end

```bash
# After editing a meta/token/CSS source file:
npm run ds:build       # tokens.css + figma.tokens.json + token-ids.ts,
                       # design-system.manifest.json + tds.plugin.json, COMPONENTS.md
npm run figma:build    # = ds:build && plugin:typecheck && plugin:build && plugin:test
# Green plugin:test == Storybook and the Figma bundle are in structural sync.
```

### 6.2 W2 — token bindings gated by `when` (real Button meta)

Because outline borders are tone-specific and the CSS scan only derives the brand default, W2 requires an
explicit binding per tone. This is verbatim from `src/components/atoms/Button/Button.meta.ts`:

```ts
tokens: [
  { property: 'background',   token: 'color.brand.solid',  when: { variant: 'solid',   tone: 'brand' } },
  { property: 'border-color', token: 'color.brand.border',  when: { variant: 'outline', tone: 'brand' } },
  { property: 'border-color', token: 'color.neutral.border', when: { variant: 'outline', tone: 'neutral' } },
  { property: 'border-color', token: 'color.success.border', when: { variant: 'outline', tone: 'success' } },
  { property: 'corner-radius', token: 'radius.control' },
  { property: 'height',        token: 'size.control.md', when: { size: 'md' } },
],
```

Adding a new `tone` option (W2) means: add it to the `tone` `variantProps` options **and** add the matching
`when`-filtered `border-color` binding — then `npm run figma:build`.

### 6.3 W3 — dot-id → CSS var → Figma name

```
token id (source, dot)     color.bg.default        space.4          radius.control
CSS var  (generated)       --tds-color-bg-default  --tds-space-4    --tds-radius-control
Figma var name (bundle)    color/bg/default        space/4          radius/control
```

### 6.4 W1 — the two registration edits that make a component "real"

```ts
// src/components/metas.ts
import { myThingMeta } from './molecules/MyThing/MyThing.meta';   // 1) import
export const moleculeMetas: ComponentMeta[] = [ /* … */ myThingMeta ]; // 2) array entry
// + export { MyThing } from './molecules/MyThing';  in the tier barrel
```

Miss either edit and the component is absent from `componentMetas`, so it never reaches the manifest,
the catalog, or the Figma bundle.

## 7. Validation Rules

Compliance per workflow is checked by real scripts, not judgment.

| Workflow | `lint` | `ds:build` | `figma:build` (incl. `plugin:test`) | Manifest write-back |
|---|---|---|---|---|
| **W1 Add component** | required | required | required | `COMPONENT_INDEX`, `VARIANT_INDEX`, `FIGMA_MAPPING`, `DEPENDENCY_GRAPH`, `CHANGELOG` |
| **W2 Add/edit variant** | required | required | required | `VARIANT_INDEX`, `FIGMA_MAPPING`, `CHANGELOG` |
| **W3 Add token** | required | required (`tokens:build` then full) | required | `TOKEN_INDEX`, `DESIGN_MANIFEST`, `FIGMA_MAPPING`, `CHANGELOG` |
| **W4 Sync Figma** | — | required | **required (the gate)** | `FIGMA_MAPPING`, `PLUGIN_INDEX`, `CHANGELOG` |
| **W5 Resume** | re-run to learn truth | re-run to learn truth | re-run to learn truth | `SESSION_SUMMARY`, `TASKS` |
| **W6 Review** | audits all above | audits all above | audits all above | `REVIEW_REPORT` |

Additional gates:

- `npm run plugin:test` (`figma/plugin/test/harness.ts`) is the **hard fidelity gate** — it exits non-zero on any coverage mismatch and blocks W1/W2/W3/W4.
- `verbatimModuleSyntax` + `noUnusedLocals/Parameters` + `strict` (tsconfig) surface via `lint`/`build`.
- **PLANNED:** unit/interaction/visual/e2e suites and CI enforcement of these gates (docs [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md), [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)) — no test runner or `.github` exists yet.

## 8. Checklist

Per-task, copy into `.ai/TASKS.json` notes:

- [ ] Intake restated; task recorded in `.ai/TASKS.json` (Rule 1, W0).
- [ ] Reuse-first done: checked [docs/COMPONENTS.md](../COMPONENTS.md) / `.ai/TOKEN_INDEX.json` before any "add" (Rule 2).
- [ ] Correct workflow selected (W1–W6) and correct subagent delegated (Rule 10).
- [ ] Only **source** edited; no generated output hand-touched (Rule 3).
- [ ] `*.meta.ts` stayed React/CSS-free, relative imports only (Rule 5).
- [ ] Variants via `toDataAttrs`; tokens via `var(--tds-*)`; imports from `@/components` (Rule 6).
- [ ] No unrequested visual change; Design Lock respected (Rule 4).
- [ ] Ran the workflow gate set green: `lint` + `ds:build` + `figma:build`/`plugin:test` as applicable (§7).
- [ ] `.ai/*` manifests reconciled + `.ai/CHANGELOG.md` appended (Rule 9).
- [ ] `.ai/REVIEW_REPORT.md` PASS (W6); `.ai/SESSION_SUMMARY.md` + `.ai/TASKS.json` checkpointed (Rules 12, 7).

## 9. Failure Recovery

| Symptom | Diagnosis | Fix | Resume |
|---|---|---|---|
| New component not in Storybook/Figma | Missing registration in `src/components/metas.ts` or tier barrel (§6.4) | Add both the import + array entry and the barrel export | Re-run `npm run ds:build`, then continue W1 step 6 |
| `plugin:test` exits non-zero after a change | Coverage mismatch: bundle out of sync or a meta field the plugin can't map | Re-run `npm run ds:build`; if still red, inspect the harness diff and fix the **source** meta/token (never `code.js`) | Re-run `npm run figma:build`; resume W4 step 4 |
| `tokens.css`/`token-ids.ts` stale or a `var(--tds-*)` is undefined | Edited a component before `tokens:build`, or token id typo | Fix `src/tokens/*.ts`, run `npm run tokens:build`, correct the CSS var | Re-run `npm run ds:build`; resume W3 step 4 |
| Manifest generator crashes importing a meta | `*.meta.ts` pulled in React/CSS or a non-relative import (violates Rule 5) | Strip React/CSS; use relative imports only | Re-run `npm run ds:build`; resume W1/W2 |
| Lint fails on unused import / type-only import | `noUnusedLocals` / `verbatimModuleSyntax` | Remove unused; use `import type` | `npm run lint`; resume W6 step 1 |
| Combo explosion warning (e.g. Button 4,050+) | A `state` value leaked into a variant axis | Remove it from `variantProps`; keep `disabled`/`loading` as `BOOLEAN` props (Rule 8) | Re-run `npm run figma:build`; resume W2 |
| Lost the thread after context loss | Context window reset mid-task | Do **not** re-read `src/**` blindly | Run **W5** (§5.6): read `.ai/SESSION_SUMMARY.md` + `.ai/TASKS.json` first |
| Reviewer flags a visual drift | An unrequested design change slipped in | Revert the visual delta; if intended, get explicit approval and route as a source change (Rule 4) | Re-run W6 |

## 10. Dependencies

**Docs (by exact filename):**
[00_MASTER_RULES.md](./00_MASTER_RULES.md) ·
[01_AI_SPECIFICATION.md](./01_AI_SPECIFICATION.md) ·
[02_AI_HARNESS.md](./02_AI_HARNESS.md) ·
[03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md) ·
[04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md) ·
[05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md) ·
[06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md) ·
[07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md) ·
[08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md) ·
[09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md) ·
[11_INTERACTION_SPECIFICATION.md](./11_INTERACTION_SPECIFICATION.md) ·
[18_FOLDER_STRUCTURE.md](./18_FOLDER_STRUCTURE.md) ·
[20_CLEAN_CODE.md](./20_CLEAN_CODE.md) ·
[24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md) (**PLANNED**) ·
[25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md) (**PLANNED**) ·
[26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md) ·
[27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md) ·
[28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md) ·
[29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md) ·
[30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md) ·
[31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md) ·
[35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md) (**PLANNED**) ·
[36_AI_AGENT_SPECIFICATION.md](./36_AI_AGENT_SPECIFICATION.md) ·
[37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md) ·
[39_AI_CHECKLIST.md](./39_AI_CHECKLIST.md) ·
[40_FINAL_OPERATING_MANUAL.md](./40_FINAL_OPERATING_MANUAL.md).

**Manifests (`.ai/`):**
[.ai/TASKS.json](../../.ai/TASKS.json) ·
[.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md) ·
[.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json) ·
[.ai/TOKEN_INDEX.json](../../.ai/TOKEN_INDEX.json) ·
[.ai/VARIANT_INDEX.json](../../.ai/VARIANT_INDEX.json) ·
[.ai/FIGMA_MAPPING.json](../../.ai/FIGMA_MAPPING.json) ·
[.ai/PLUGIN_INDEX.json](../../.ai/PLUGIN_INDEX.json) ·
[.ai/DESIGN_MANIFEST.json](../../.ai/DESIGN_MANIFEST.json) ·
[.ai/DEPENDENCY_GRAPH.json](../../.ai/DEPENDENCY_GRAPH.json) ·
[.ai/REVIEW_REPORT.md](../../.ai/REVIEW_REPORT.md) ·
[.ai/CHANGELOG.md](../../.ai/CHANGELOG.md).

**Scripts / gates:** `scripts/build-tokens.ts`, `scripts/build-manifest.ts`, `scripts/build-catalog.ts`,
`scripts/lib/css-bindings.ts`, `figma/plugin/test/harness.ts`; npm scripts `tokens:build`, `manifest:build`,
`catalog:build`, `ds:build`, `plugin:typecheck`, `plugin:build`, `plugin:test`, `figma:build`, `lint`, `format`.
**Catalog:** [docs/COMPONENTS.md](../COMPONENTS.md).

## 11. Template

Copy-paste task record + closeout for any workflow (append to `.ai/TASKS.json` and `.ai/CHANGELOG.md`):

```jsonc
// .ai/TASKS.json  (one task object)
{
  "id": "TASK-2026-0001",
  "title": "Add `soft` tone binding to Button outline",
  "workflow": "W2",                 // W1|W2|W3|W4|W5|W6
  "status": "in_progress",          // in_progress | blocked | done
  "sources_touched": [
    "src/components/atoms/Button/Button.meta.ts",
    "src/components/atoms/Button/Button.css"
  ],
  "gates": { "lint": null, "ds:build": null, "figma:build": null },
  "resume_step": "5.3 step 6 — run figma:build",
  "manifests_to_reconcile": ["VARIANT_INDEX", "FIGMA_MAPPING", "CHANGELOG"]
}
```

```md
<!-- .ai/CHANGELOG.md  (append one line per task) -->
- 2026-07-08 · W2 · Button · added `soft` tone outline binding · gates: lint✓ ds:build✓ figma:build✓ (plugin:test✓)
```

Generic runbook skeleton (fill per workflow):

```
1. Read manifest(s): .ai/<INDEX>.json  (+ docs/COMPONENTS.md if "add")
2. Edit SOURCE only:  <path/to/*.meta.ts | src/tokens/*.ts | *.css>
3. Build:             npm run ds:build   (then npm run figma:build)
4. Gate:              npm run lint  &&  green plugin:test
5. Reconcile:         .ai/<...>  +  .ai/CHANGELOG.md
6. Review:            W6 → .ai/REVIEW_REPORT.md  → commit (when asked)
```

## 12. Future Extension

- **PLANNED workflows.** As the backend lands (docs 14–17), add **W7 — schema/migration change** (Supabase Postgres + RLS, `.ai/ERD.json` contract) and **W8 — API contract change** (`.ai/API_SPEC.json`), each mirroring W0 with their own gates. Both open with the standard "STATUS: PLANNED — no backend exists today" banner.
- **CI enforcement (PLANNED).** When `.github` CI exists ([25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)), the §7 gate sets become required checks so `figma:build`/`plugin:test` block merge automatically, not just by convention.
- **MCP-served workflows (PLANNED).** An MCP server ([35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md)) exposes W4-sync, W5-resume, and W6-review as tools that read/update the `.ai/*` manifests over the wire without shipping `src/**`, keeping token usage flat as the system grows past **10,000,000 users**.
- **Additional agents.** New roles in [36_AI_AGENT_SPECIFICATION.md](./36_AI_AGENT_SPECIFICATION.md) plug into the existing delegation points (Rule 10) without changing W0.
- **Scale invariant.** These recipes are O(1) in component count: they touch one component/token's sources and let the generators fan out. Adding the 61st…600th component follows W1 unchanged.
