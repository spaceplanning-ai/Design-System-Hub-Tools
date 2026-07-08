# 30 — Review System

> **Title:** Review System
> **Purpose:** Define the review and approval system for TDS — the AI self-review pass, the human review gate, the [.ai/REVIEW_REPORT.md](../../.ai/REVIEW_REPORT.md) artifact, the design-drift checks that enforce the Design Lock, exactly what blocks a merge, and how review wraps the automated validation gates (`lint` · `build` · `ds:build` · `figma:build` · `plugin:test`).
> **Status:** ACTIVE (frontend/tokens/manifests/plugin review) · CI-enforced gating and backend/API/DB review portions **PLANNED**
> **Owner:** AI OS
> **Last-reviewed:** _(placeholder — set on review)_
> **Precedence:** Subordinate to [00_MASTER_RULES.md](./00_MASTER_RULES.md); the constitution, the Design Lock Policy, and the source-of-truth hierarchy win on any conflict. This document owns *how a change is reviewed and what blocks it*. The task lifecycle that invokes review is owned by [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md); the change/propagation rules by [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md); the master checklists by [39_AI_CHECKLIST.md](./39_AI_CHECKLIST.md). All backend/DB/API/CI/test-framework content is **PLANNED**.

---

## 1. Purpose

TDS is a metadata-driven machine where **one source of truth fans out to four outputs** (React, Storybook, the generated manifests, and — via the Figma plugin — Figma). A single bad merge can therefore drift *all four* at once: a hardcoded color breaks token fidelity, a hand-edited generated file desyncs Storybook↔Figma, a redesigned component violates the immutable Design Lock. Review is the gate that stops those classes of defect from ever landing.

This document defines a **two-stage review** wrapped around the repo's **automated validation gates**:

1. **Self-review** — a mandatory AI pass the acting agent runs on its own diff *before* asking for human review, producing [.ai/REVIEW_REPORT.md](../../.ai/REVIEW_REPORT.md).
2. **Human review** — the approval gate a person (or a delegated reviewer agent) applies to the diff + the report.

Both stages sit on top of the deterministic checks that decide correctness mechanically: `npm run lint`, `npm run build`, `npm run ds:build`, `npm run figma:build` (which ends in the headless harness `figma/plugin/test/harness.ts`). Review does not replace those gates — it *requires* them green and then judges the things a script cannot: design drift, reuse-vs-duplication, and whether the change matches what was actually requested.

The review system exists to guarantee the AI-OS mission promises most at risk from a careless merge: **no design drift**, **no inconsistent implementations**, **no duplicated work**, **Storybook↔Figma perfect sync**, and **generated-is-sacred**.

## 2. Responsibilities

This spec is responsible for defining:

- The **two review stages** (self-review, human review) and the **automated gates** they wrap.
- The **[.ai/REVIEW_REPORT.md](../../.ai/REVIEW_REPORT.md) artifact** — when it is written, by whom, and its required shape (the full skeleton lives in §11).
- **Design-drift checks** — the concrete, repo-specific tests that catch a Design Lock violation (unapproved token/CSS/layout change, hand-edited generated output, source↔generated desync).
- **Merge-blocking criteria** — the exhaustive list of conditions that MUST block a merge, separated from advisory (SHOULD-fix) findings.
- **Reviewer roles** — self (acting agent), human approver, and the delegated reviewer subagents ([36_AI_AGENT_SPECIFICATION.md](./36_AI_AGENT_SPECIFICATION.md)).
- How review **integrates with the validation gates** and the task lifecycle ([29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md)).

It is **not** responsible for: the mechanical rules themselves (owned by [19_CODE_CONVENTION.md](./19_CODE_CONVENTION.md), [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md), [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md), [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md)); the task lifecycle ([29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md)); versioning/changelog discipline ([31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md), [32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md)); or the test strategy behind the gates ([24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md)).

## 3. Scope

**In scope**

- Review of every change to source that feeds the pipeline: `*.meta.ts`, component `.tsx`/`.css`/`.stories.tsx`, `src/tokens/*`, `src/core/*`, `src/hooks/*`, `src/utils/*`, `src/styles/*`, `scripts/*`, and the Figma plugin `figma/plugin/src/*`.
- Review of the AI-OS docs (`docs/ai-os/*`) and the runtime manifests (`.ai/*`).
- The self-review pass, the human approval gate, and their interaction with `lint` / `build` / `ds:build` / `figma:build` / `plugin:test`.
- Design-drift detection and the generated-vs-source reconciliation check.

**Out of scope**

- The content of the validation checks themselves (deferred to [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md), [19_CODE_CONVENTION.md](./19_CODE_CONVENTION.md), [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md)).
- **PLANNED** CI enforcement (a `.github` workflow that makes these gates blocking in a hosted pipeline) — owned by [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md). No CI exists in the repo today.
- **PLANNED** backend/API/DB review (Supabase migrations, RLS policy review, API contract review) — owned by [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [15_API_GUIDE.md](./15_API_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md). No backend exists today.
- Release cutting and semver decisions (deferred to [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md), [32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md)).

## 4. Rules

Numbered, enforceable, MUST/SHOULD/NEVER. Each ties to a real mechanism in this repo.

**Gate ordering & prerequisites**

1. **R1 (MUST)** — No change is submitted for human review until **all automated gates are green**: `npm run lint`, `npm run build` (`tsc -b && vite build`), and — if the change touches `*.meta.ts`, tokens, or the plugin — `npm run figma:build` (which runs `ds:build` → `plugin:typecheck` → `plugin:build` → `plugin:test`). A red gate is a blocking failure; do not paper over it in the report.
2. **R2 (MUST)** — Every non-trivial change (any change to source, tokens, meta, plugin, or a component's 5 files) **MUST** produce a [.ai/REVIEW_REPORT.md](../../.ai/REVIEW_REPORT.md) via the self-review pass before human review begins. Trivial doc-only typo fixes MAY skip the report but still require the docs to build.
3. **R3 (MUST)** — Self-review runs **before** human review, never after. The acting agent reviews its *own* diff, records findings, and fixes blocking findings before handing off.

**Design Lock & drift (the heart of review)**

4. **R4 (NEVER)** — A reviewer **MUST NEVER** approve a change that redesigns, "improves," beautifies, or otherwise alters visual design **on the AI's own initiative** — layout, spacing, color, typography, radius, shadow, motion, or the rename of any token/component/variant/variable. Per [00_MASTER_RULES.md](./00_MASTER_RULES.md) and [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md), Storybook is the immutable source of visual truth. Any visual change is a **source change that must have been explicitly requested/approved**; if the diff contains one and the task did not ask for it, the review **MUST** block.
5. **R5 (MUST)** — The reviewer **MUST** run the **generated-vs-source reconciliation check**: from a clean tree, re-run `npm run ds:build` and `npm run figma:build`, then `git diff --exit-code` on `figma/`, `src/generated/`, `src/tokens/generated/`, `figma/plugin/code.js`, and `docs/COMPONENTS.md`. A dirty diff means the committed generated output does not match the committed source — **blocking** (see §5, §7).
6. **R6 (NEVER)** — **MUST NEVER** approve a diff that **hand-edits a generated output**. Files under `figma/` (except the hand-authored `figma/README.md`), `src/generated/`, `src/tokens/generated/`, and `figma/plugin/code.js` are AUTO. A change there without a corresponding source change is a Design Lock violation — blocking.
7. **R7 (MUST)** — The reviewer **MUST** verify **variant-axis integrity**: the `state` axis (default/hover/active/focus/disabled/loading) is **NEVER** emitted as a Figma variant (only `disabled`/`loading` survive as BOOLEAN component props); components with a `type` axis (A/B/C) are split into one Component Set per preset. Confirm via the `plugin:test` harness output, not by eye. See [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md).

**Reuse & consistency**

8. **R8 (MUST)** — The reviewer **MUST** confirm **reuse-first**: a new component/pattern is only acceptable if the catalog [docs/COMPONENTS.md](../../docs/COMPONENTS.md) has no fit. A diff that re-implements an existing component (of the 60: 24 atoms, 27 molecules, 9 organisms) instead of importing it from the `@/components` barrel is **blocking** (duplicated work).
9. **R9 (MUST)** — The reviewer **MUST** confirm **import & purity discipline**: components imported only from the `@/components` barrel (no deep paths); `*.meta.ts` React/CSS-free with relative imports only; aliases `@/`, `@core/`, `@components/`, `@tokens/` used in runtime code. Violations break the pipeline and are blocking. See [19_CODE_CONVENTION.md](./19_CODE_CONVENTION.md).
10. **R10 (MUST)** — The reviewer **MUST** confirm **token-only styling**: CSS uses `var(--tds-*)` custom properties only, with zero hardcoded colors/spacing/radius/shadow, and variants are projected to the DOM via `toDataAttrs(meta, …)` as `data-*` attributes (Figma-legible). A hardcoded design value is blocking.

**Accountability & scope**

11. **R11 (MUST)** — Every blocking finding in the report **MUST** carry: file+line, a one-line defect statement, and a concrete failure scenario (what breaks). Vague findings ("looks off") are not actionable and do not count.
12. **R12 (MUST)** — The diff **MUST** be scoped to the task: no drive-by refactors, no unrelated file churn, no "while I was here" edits. Unrequested scope is a SHOULD-block the reviewer flags for removal.
13. **R13 (SHOULD)** — Advisory findings (naming nits, doc wording, redundant local knobs) **SHOULD** be recorded but do not block; they are fixed now if cheap, or filed as follow-ups in [.ai/TASKS.json](../../.ai/TASKS.json).
14. **R14 (MUST)** — On approval, the reviewer **MUST** update the running state: mark the task in [.ai/TASKS.json](../../.ai/TASKS.json), append to [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md), and refresh [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md) so the change is resumable ([28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md)).
15. **R15 (MUST — a11y)** — For any change to a component's DOM/interaction surface, the reviewer **MUST** confirm no accessibility regression using Storybook's `addon-a11y` panel and the rules in [13_ACCESSIBILITY_SPECIFICATION.md](./13_ACCESSIBILITY_SPECIFICATION.md). A new WCAG violation on the changed component is blocking.

## 5. Workflow

Review is invoked at the end of the task lifecycle defined in [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md) (`intake → plan → read manifests → implement → validate → update manifests → **review** → commit`). All commands are the real npm scripts; the shell is PowerShell (primary) but the scripts are cross-platform.

**Stage A — Self-review (acting agent, mandatory)**

1. **Freeze the diff.** `git status` and `git diff` to enumerate exactly what changed. Confirm scope matches the task (R12).
2. **Run the mechanical gates.** `npm run lint`; `npm run build`; and if meta/tokens/plugin changed, `npm run figma:build`. All must be green (R1). Capture pass/fail into the report.
3. **Reconciliation check (drift).** Re-run `npm run ds:build` and `npm run figma:build`, then:
   ```bash
   git diff --exit-code -- figma/ src/generated/ src/tokens/generated/ figma/plugin/code.js docs/COMPONENTS.md
   ```
   A non-zero exit = source↔generated desync or hand-edited generated file → record as **blocking** (R5, R6).
4. **Design-drift read.** Inspect the diff for visual changes (token values in `src/tokens/*`, `.css`, `figma{}` blocks in `*.meta.ts`). For each, answer: *did the task explicitly request this?* If not → **blocking** (R4).
5. **Reuse & convention read.** Confirm reuse-first (R8), barrel imports + meta purity (R9), `var(--tds-*)` + `toDataAttrs` (R10), and (if DOM changed) a11y (R15).
6. **Write [.ai/REVIEW_REPORT.md](../../.ai/REVIEW_REPORT.md)** using the §11 template. Fix every **blocking** finding, re-run the affected gate, and re-record. Only advisory findings may remain open.
7. **Hand off.** With a clean report (zero open blocking findings, all gates green) request human review.

**Stage B — Human review (approver / delegated reviewer agent)**

8. **Read the report + the diff**, not the whole tree. The manifests (`.ai/*`, [docs/COMPONENTS.md](../../docs/COMPONENTS.md)) answer most questions without opening source ([26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md)).
9. **Spot-verify the drift claim** independently: re-run step 3's reconciliation. Trust, but verify.
10. **Judge Design Lock** (R4/R6/R7): is any visual change requested-and-approved? Any hand-edited generated file? Any state-axis leakage into Figma variants?
11. **Decide:** `APPROVED`, `CHANGES_REQUESTED`, or `BLOCKED`. Record the verdict and rationale back into [.ai/REVIEW_REPORT.md](../../.ai/REVIEW_REPORT.md).
12. **On approval**, update [.ai/TASKS.json](../../.ai/TASKS.json), [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md), [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md) (R14), then proceed to commit per [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md).

**Delegation.** Component-heavy reviews MAY be delegated to `@tds-component`; plugin/Figma-fidelity reviews to `@figma-plugin` ([36_AI_AGENT_SPECIFICATION.md](./36_AI_AGENT_SPECIFICATION.md)). The delegated agent runs Stage A/B for its slice and writes its findings into the same report.

## 6. Examples

**Example 1 — Blocking: hand-edited generated output.** A diff edits `figma/tds.plugin.json` directly to rename a component set. Reconciliation catches it:

```bash
$ npm run figma:build
$ git diff --exit-code -- figma/ src/generated/ src/tokens/generated/
# figma/tds.plugin.json reverts on rebuild → non-zero exit
```

Verdict: **BLOCKED** (R6). Fix: revert the hand-edit; make the rename in the source `*.meta.ts`, re-run `npm run figma:build`, and commit the regenerated bundle.

**Example 2 — Blocking: unrequested design drift.** Task was "fix Button focus ring keyboard trap." Diff also changes `--tds-color-brand-solid` in `src/tokens/primitives.ts` from the committed value. Reviewer read (step 4):

```diff
- brand: { solid: '#2563eb' }
+ brand: { solid: '#1d4ed8' }   // ❌ not requested — recolors every brand-solid surface
```

Verdict: **BLOCKED** (R4). A color change is a Design Lock change requiring explicit approval; it is unrelated to the focus-trap task (R12). Fix: drop the token edit; keep only the focus change.

**Example 3 — Blocking: duplicated work.** A new `PrimaryButton.tsx` re-implements the existing `Button` (type A/B/C, variant solid/outline/ghost). Catalog check (R8): [docs/COMPONENTS.md](../../docs/COMPONENTS.md) already lists `Button`. Verdict: **BLOCKED**. Fix: delete the duplicate; `import { Button } from '@/components'` and compose.

**Example 4 — Approved: correct token-driven variant.** New `tone="success"` styling added to a component's `.css` and `.meta.ts`:

```css
.tds-badge[data-tone='success'] { --badge-fill: var(--tds-color-success-solid); }
```

`toDataAttrs` already projects `data-tone`; `figma:build` harness reports the new variant covered; no hardcoded values; scope matches task. Verdict: **APPROVED**, with the new variant recorded in [.ai/VARIANT_INDEX.json](../../.ai/VARIANT_INDEX.json) and [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md).

**Example 5 — Advisory only.** A local CSS knob `--badge-pad` is defined but a sibling uses `--badge-padding`. Naming inconsistency → **advisory** (R13): record it, fix if cheap, otherwise file in [.ai/TASKS.json](../../.ai/TASKS.json). Does not block.

## 7. Validation Rules

Compliance with *this* doc is itself mechanically checkable. A review is valid only when:

| Concern | Mechanism | Command / check |
| --- | --- | --- |
| Lint clean (0 errors) | ESLint flat config (`eslint.config.js`) | `npm run lint` |
| Types + app build | `tsc -b && vite build` | `npm run build` |
| Tokens/manifest/catalog regenerate | Node generators (`scripts/*`) | `npm run ds:build` |
| Plugin types + bundle + coverage | `plugin:typecheck` → `plugin:build` → headless harness | `npm run figma:build` |
| Storybook↔Figma coverage asserted | `figma/plugin/test/harness.ts` (exits non-zero on mismatch) | `npm run plugin:test` |
| **No generated↔source drift** | reconciliation diff (R5) | `git diff --exit-code -- figma/ src/generated/ src/tokens/generated/ figma/plugin/code.js docs/COMPONENTS.md` |
| Report exists & complete | [.ai/REVIEW_REPORT.md](../../.ai/REVIEW_REPORT.md) present, matches §11 shape | manual + [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md) schema |
| a11y (changed DOM) | Storybook `addon-a11y` | manual, per [13_ACCESSIBILITY_SPECIFICATION.md](./13_ACCESSIBILITY_SPECIFICATION.md) |

**What blocks a merge (blocking — MUST be zero to approve):**

- Any red gate: `lint`, `build`, `figma:build`, or `plugin:test` failing.
- Generated↔source drift (dirty reconciliation diff) or a hand-edited generated file (R5, R6).
- Unrequested/unapproved visual or naming change — a Design Lock violation (R4).
- State-axis leaking into Figma variants, or a `type` component not split per A/B/C preset (R7).
- Duplicated component instead of catalog reuse (R8).
- Deep-path component import, impure `*.meta.ts`, or hardcoded design value (R9, R10).
- New WCAG violation on a changed component (R15).
- Missing/incomplete [.ai/REVIEW_REPORT.md](../../.ai/REVIEW_REPORT.md) for a non-trivial change (R2).

**Advisory (SHOULD-fix — does not block):** naming nits, redundant local CSS knobs, doc-wording polish, non-behavioral refactor suggestions, out-of-scope cleanups (flagged for removal per R12). Advisory findings are recorded and, if not fixed now, filed in [.ai/TASKS.json](../../.ai/TASKS.json).

## 8. Checklist

Copy into the report; every box must be checked (or explicitly N/A) before approval.

- [ ] Diff enumerated (`git status` / `git diff`); scope matches the task (R12).
- [ ] `npm run lint` — 0 errors.
- [ ] `npm run build` — passes (`tsc -b && vite build`).
- [ ] `npm run figma:build` — passes (only skip if no meta/token/plugin change).
- [ ] Reconciliation diff clean: `git diff --exit-code` on `figma/`, `src/generated/`, `src/tokens/generated/`, `figma/plugin/code.js`, `docs/COMPONENTS.md` (R5).
- [ ] No hand-edited generated output (R6).
- [ ] No unrequested visual/token/naming change — Design Lock intact (R4).
- [ ] Variant-axis integrity: `state` not a Figma variant; `type` split per A/B/C (R7).
- [ ] Reuse-first: no re-implementation of an existing catalog component (R8).
- [ ] Barrel-only imports; `*.meta.ts` pure; aliases used (R9).
- [ ] `var(--tds-*)` only; variants via `toDataAttrs` `data-*`; zero hardcoded design values (R10).
- [ ] a11y: no new `addon-a11y` violation on changed components (R15).
- [ ] [.ai/REVIEW_REPORT.md](../../.ai/REVIEW_REPORT.md) written; blocking findings have file+line+scenario (R11); all blocking fixed.
- [ ] On approve: [.ai/TASKS.json](../../.ai/TASKS.json), [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md), [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md) updated (R14).

## 9. Failure Recovery

| Symptom | Diagnosis | Fix | Resume |
| --- | --- | --- | --- |
| Reconciliation diff dirty after clean build | Committed generated output ≠ committed source | Re-run `npm run ds:build && npm run figma:build`; commit regenerated files; never hand-edit them | Re-run step 3 |
| `figma:build` fails in harness (`process.exit(1)`) | `figma/plugin/test/harness.ts` found missing coverage (a variant/token/prop not reproduced) | Fix the source (`*.meta.ts`/tokens) or plugin `figma/plugin/src/*`; rebuild | `npm run figma:build` |
| Diff recolors/re-spaces without a task ask | Design drift (R4) | Remove the visual change; if genuinely needed, escalate for explicit approval per [00_MASTER_RULES.md](./00_MASTER_RULES.md) | Re-review |
| A file under `figma/`/`src/generated/`/`src/tokens/generated/` edited by hand | Generated-is-sacred violation (R6) | `git checkout` the file; make the change in source; rebuild | Re-run step 3 |
| New component duplicates an existing one | Reuse-first miss (R8) | Delete; import from `@/components`; compose | Re-review |
| `lint`/`build` red | Convention/type failure | Fix per [19_CODE_CONVENTION.md](./19_CODE_CONVENTION.md); split `import type`, remove `any`/unused | `npm run lint` / `npm run build` |
| Report missing or vague | Self-review skipped or findings not actionable (R2, R11) | Run Stage A; add file+line+scenario to each finding | Re-hand off |
| Context lost mid-review | Session interrupted | Rehydrate from [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md) + [.ai/TASKS.json](../../.ai/TASKS.json) ([28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md)) | Resume §5 at last completed step |

If a blocking finding cannot be resolved without a design decision, **stop and escalate** — do not approve around it. The agent has no authority to grant Design Lock exceptions ([01_AI_SPECIFICATION.md](./01_AI_SPECIFICATION.md)).

## 10. Dependencies

- **Constitution & lock:** [00_MASTER_RULES.md](./00_MASTER_RULES.md), [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md) (Design Lock Policy).
- **Lifecycle & change control:** [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md), [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md), [32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md), [39_AI_CHECKLIST.md](./39_AI_CHECKLIST.md).
- **What review judges:** [04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md), [05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md), [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md), [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md), [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md), [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md), [13_ACCESSIBILITY_SPECIFICATION.md](./13_ACCESSIBILITY_SPECIFICATION.md), [19_CODE_CONVENTION.md](./19_CODE_CONVENTION.md), [22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md), [23_PERFORMANCE_GUIDE.md](./23_PERFORMANCE_GUIDE.md).
- **Validation gates:** `package.json` scripts (`lint`, `build`, `ds:build`, `figma:build`, `plugin:test`); `scripts/build-tokens.ts`, `scripts/build-manifest.ts`, `scripts/build-catalog.ts`; `figma/plugin/test/harness.ts`. Detailed in [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md), [02_AI_HARNESS.md](./02_AI_HARNESS.md).
- **Manifests read/written:** [.ai/REVIEW_REPORT.md](../../.ai/REVIEW_REPORT.md) (primary output), [.ai/TASKS.json](../../.ai/TASKS.json), [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md), [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md), [.ai/DESIGN_MANIFEST.json](../../.ai/DESIGN_MANIFEST.json), [.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json), [.ai/TOKEN_INDEX.json](../../.ai/TOKEN_INDEX.json), [.ai/VARIANT_INDEX.json](../../.ai/VARIANT_INDEX.json), [.ai/FIGMA_MAPPING.json](../../.ai/FIGMA_MAPPING.json); schemas in [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md). Token-minimal reading strategy in [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md).
- **Roles/MCP:** [36_AI_AGENT_SPECIFICATION.md](./36_AI_AGENT_SPECIFICATION.md) (`@tds-component`, `@figma-plugin`), [35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md).

## 11. Template

Copy-paste skeleton for [.ai/REVIEW_REPORT.md](../../.ai/REVIEW_REPORT.md). Overwrite per task; history lives in [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md).

```markdown
# REVIEW_REPORT — <task-id> · <short title>

- version: 1
- generatedAt: <ISO-8601>
- generator: self-review (@<agent>) · human-review (<who>)
- task: <link to .ai/TASKS.json entry>
- verdict: APPROVED | CHANGES_REQUESTED | BLOCKED
- scope: <files/globs touched>

## Automated gates
| Gate | Command | Result |
| --- | --- | --- |
| lint | npm run lint | PASS/FAIL |
| build | npm run build | PASS/FAIL |
| figma:build | npm run figma:build | PASS/FAIL/N-A |
| reconciliation | git diff --exit-code (figma/, src/generated/, src/tokens/generated/, figma/plugin/code.js, docs/COMPONENTS.md) | CLEAN/DIRTY |

## Design Lock
- Visual/token/naming changes: <none | list + "requested by <task>">
- Generated files hand-edited: NO/<list>
- Variant-axis integrity (state not a variant; type split A/B/C): OK/<issue>

## Findings
### Blocking
- [ ] <file>:<line> — <defect> — <failure scenario> — status: OPEN/FIXED
### Advisory
- [ ] <file>:<line> — <nit> — filed: .ai/TASKS.json#<id> | fixed

## Reuse & conventions
- Reuse-first (no duplicate of a catalog component): OK/<issue>
- Barrel imports · meta purity · var(--tds-*) · toDataAttrs: OK/<issue>
- a11y (addon-a11y on changed components): OK/N-A/<issue>

## Sign-off
- self-review: <agent> @ <ISO-8601>
- human-review: <who> @ <ISO-8601> — <verdict + rationale>
- manifests updated on approve: TASKS.json ✓ CHANGELOG.md ✓ SESSION_SUMMARY.md ✓
```

## 12. Future Extension

- **PLANNED CI enforcement.** When a `.github` workflow lands ([25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)), these gates become **blocking in the pipeline**: a PR job SHOULD run `format:check` → `lint` → `build` → `figma:build` and a scripted reconciliation (`git diff --exit-code` on generated paths), auto-attaching the result to the PR. The human review then only judges the non-mechanical criteria (Design Lock, reuse, scope). **No CI exists in the repo today.**
- **Automated drift bot.** A scheduled job MAY re-run `ds:build`/`figma:build` on `main` and open an issue if generated outputs drift — turning R5 from a review step into continuous monitoring, essential as the catalog grows past 60 components.
- **PLANNED backend review track.** When the Supabase/Node backend arrives ([14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [15_API_GUIDE.md](./15_API_GUIDE.md), [16_NODE_GUIDE.md](./16_NODE_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md)), review extends with a **migration/RLS/API-contract** checklist (schema diff review, RLS policy review, `API_SPEC.json`/`ERD.json` contract diffs) engineered for >10,000,000 users. It inherits the same two-stage model and the same "generated-is-sacred, source-of-truth" discipline — no visual pipeline change.
- **MCP-driven review.** Via [35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md), a reviewer agent SHOULD read the diff + manifests and write [.ai/REVIEW_REPORT.md](../../.ai/REVIEW_REPORT.md) through the MCP tool surface, keeping review token-cheap ([26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md)) and consistent across Claude Code, Gemini CLI, Cursor, Codex, and Windsurf as the roster scales.
