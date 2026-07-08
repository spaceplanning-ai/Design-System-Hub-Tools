# REVIEW_REPORT

> **Title:** Review Report — TDS AI OS
> **Purpose:** The per-review artifact of the TDS review system: the two-stage self-review + human-review verdict, the automated-gate results, the Design-Lock/drift judgement, and the reuse/token/a11y/sync findings for one change. This file is a **template + latest entry**; it is **regenerated (overwritten) per review**, with history preserved in [.ai/CHANGELOG.md](./CHANGELOG.md).
> **Status:** SEED — frontend/tokens/manifests/plugin review is **ACTIVE**; CI-enforced gating and backend/API/DB review are **`status: planned`** (no backend, no `.github` CI exists in the repo today).
> **Owner:** AI OS
> **Generator:** self-review (`@<agent>`) → human-review (`<who>`); shape governed by [docs/ai-os/30_REVIEW_SYSTEM.md](../docs/ai-os/30_REVIEW_SYSTEM.md) §11 and [docs/ai-os/27_MANIFEST_SPECIFICATION.md](../docs/ai-os/27_MANIFEST_SPECIFICATION.md).
> **Version:** 1 · **generatedAt:** SEED (`<ISO-8601>` per real review) · **seed:** true
> **Precedence:** Subordinate to [docs/ai-os/00_MASTER_RULES.md](../docs/ai-os/00_MASTER_RULES.md) (constitution + Design Lock). This artifact records *a review outcome*; it never overrides the source-of-truth hierarchy. A review may only report on the state of the tree — it cannot grant a Design-Lock exception.

---

## 0. How to use this file

1. **Copy the [§3 Template](#3-template)** into the body of this file, overwriting the previous entry.
2. **Fill the [§2 Review-dimensions checklist](#2-review-dimensions-checklist)** — every box checked or explicitly `N/A`.
3. **Record the verdict** in the front-matter of the entry (`APPROVED` · `CHANGES_REQUESTED` · `BLOCKED`).
4. **On `APPROVED`**, append a one-line record to [.ai/CHANGELOG.md](./CHANGELOG.md), close the task in [.ai/TASKS.json](./TASKS.json), and refresh [.ai/SESSION_SUMMARY.md](./SESSION_SUMMARY.md) (rule R14 of [30_REVIEW_SYSTEM.md](../docs/ai-os/30_REVIEW_SYSTEM.md)).
5. Every **blocking** finding MUST carry `file:line — defect — failure scenario — status` (rule R11). Vague findings do not count.

**Verdict legend**

| Verdict | Meaning | Merge? |
| --- | --- | --- |
| `APPROVED` | All gates green, zero open blocking findings, Design Lock intact. | Yes |
| `CHANGES_REQUESTED` | Advisory or scope issues; no hard blocker but fixes wanted before merge. | No (until addressed) |
| `BLOCKED` | ≥1 open blocking finding (red gate, drift, hand-edited generated file, unrequested design change, duplicate, hardcoded value, a11y regression, missing report). | No |

---

## 1. Review scope model

Review covers every change to pipeline **source** (`*.meta.ts`, component `.tsx`/`.css`/`.stories.tsx`, `src/tokens/*`, `src/core/*`, `src/hooks/*`, `src/utils/*`, `src/styles/*`, `scripts/*`, `figma/plugin/src/*`), the AI-OS docs (`docs/ai-os/*`), and the runtime manifests (`.ai/*`). It **wraps** — never replaces — the deterministic gates: `npm run lint` · `npm run build` · `npm run ds:build` · `npm run figma:build` (ending in the headless harness `figma/plugin/test/harness.ts`) · `npm run plugin:test`.

> **`status: planned`** — backend/API/DB review (Supabase migrations, RLS policy review, `ERD.json`/`API_SPEC.json` contract diffs) and CI-enforced blocking gates do not exist yet. When they land they inherit this same two-stage model unchanged (see [30_REVIEW_SYSTEM.md](../docs/ai-os/30_REVIEW_SYSTEM.md) §12).

---

## 2. Review-dimensions checklist

The canonical, copy-into-every-entry checklist. Each dimension maps to a rule in [30_REVIEW_SYSTEM.md](../docs/ai-os/30_REVIEW_SYSTEM.md) §4.

**Automated gates (must be green — [30_REVIEW_SYSTEM.md](../docs/ai-os/30_REVIEW_SYSTEM.md) R1)**

- [ ] Diff enumerated (`git status` / `git diff`); scope matches the task (R12).
- [ ] `npm run lint` — 0 errors.
- [ ] `npm run build` — passes (`tsc -b && vite build`).
- [ ] `npm run figma:build` — passes, or `N/A` (only skip when no meta/token/plugin change).

**Design Lock & drift (the heart of review — R4–R7)**

- [ ] Reconciliation diff **CLEAN**: `git diff --exit-code -- figma/ src/generated/ src/tokens/generated/ figma/plugin/code.js docs/COMPONENTS.md` (R5).
- [ ] No hand-edited generated output — `figma/*` (except `figma/README.md`), `src/generated/*`, `src/tokens/generated/*`, `figma/plugin/code.js` untouched by hand (R6).
- [ ] No unrequested visual/token/naming change — layout, spacing, color, typography, radius, shadow, motion, or any token/component/variant/variable **rename** (R4).
- [ ] Variant-axis integrity — `state` (default/hover/active/focus/disabled/loading) is **not** a Figma variant; `disabled`/`loading` survive as BOOLEAN props; `type` (A/B/C) split into one Component Set per preset (R7).

**Reuse & consistency (R8–R10)**

- [ ] Reuse-first — no re-implementation of an existing catalog component (60: 24 atoms · 27 molecules · 9 organisms); reused via the `@/components` barrel (R8).
- [ ] Import & purity discipline — barrel-only imports (no deep paths); `*.meta.ts` React/CSS-free with relative imports only; aliases `@/`, `@core/`, `@components/`, `@tokens/` used (R9).
- [ ] Token-only styling — CSS uses `var(--tds-*)` only; zero hardcoded colors/spacing/radius/shadow; variants projected via `toDataAttrs(meta, …)` as `data-*` (R10).

**Accessibility & sync (R15, R7)**

- [ ] a11y — no new `addon-a11y` (WCAG) violation on any changed component (R15, [13_ACCESSIBILITY_SPECIFICATION.md](../docs/ai-os/13_ACCESSIBILITY_SPECIFICATION.md)).
- [ ] Storybook↔Figma sync — `plugin:test` harness reports full coverage of new/changed variants, tokens, and props (no `process.exit(1)`).

**Accountability (R11–R14)**

- [ ] Every blocking finding has `file:line + defect + failure scenario` (R11).
- [ ] Scope clean — no drive-by refactors / unrelated churn (R12).
- [ ] On approve: [.ai/TASKS.json](./TASKS.json), [.ai/CHANGELOG.md](./CHANGELOG.md), [.ai/SESSION_SUMMARY.md](./SESSION_SUMMARY.md) updated (R14).

---

## 3. Template

Copy-paste skeleton for a single review entry. Overwrite the body of this file per task; keep the front-matter block (§0–§2) intact.

```markdown
# REVIEW_REPORT — <task-id> · <short title>

- version: 1
- generatedAt: <ISO-8601>
- generator: self-review (@<agent>) · human-review (<who>)
- task: .ai/TASKS.json#<task-id>
- verdict: APPROVED | CHANGES_REQUESTED | BLOCKED
- status: active            # or: planned (backend/API/DB review)
- scope: <files/globs touched>

## Automated gates
| Gate | Command | Result |
| --- | --- | --- |
| lint | npm run lint | PASS/FAIL |
| build | npm run build | PASS/FAIL |
| figma:build | npm run figma:build | PASS/FAIL/N-A |
| plugin:test | npm run plugin:test | PASS/FAIL/N-A |
| reconciliation | git diff --exit-code (figma/, src/generated/, src/tokens/generated/, figma/plugin/code.js, docs/COMPONENTS.md) | CLEAN/DIRTY |

## Design Lock
- Visual/token/naming changes: <none | list + "requested by <task>">
- Generated files hand-edited: NO/<list>
- Variant-axis integrity (state not a variant; type split A/B/C): OK/<issue>

## Findings
### Blocking (MUST be zero to approve)
- [ ] <file>:<line> — <defect> — <failure scenario> — status: OPEN/FIXED
### Advisory (does not block — R13)
- [ ] <file>:<line> — <nit> — filed: .ai/TASKS.json#<id> | fixed

## Reuse & conventions
- Reuse-first (no duplicate of a catalog component): OK/<issue>
- Barrel imports · meta purity · var(--tds-*) · toDataAttrs: OK/<issue>
- a11y (addon-a11y on changed components): OK/N-A/<issue>

## Sign-off
- self-review: <agent> @ <ISO-8601>
- human-review: <who> @ <ISO-8601> — <verdict + rationale>
- manifests updated on approve: TASKS.json / CHANGELOG.md / SESSION_SUMMARY.md
```

---

## 4. Latest entry (seed)

# REVIEW_REPORT — AIOS-GEN-0001 · Generate the TDS AI Operating System (docs/ai-os + .ai)

- version: 1
- generatedAt: SEED (`<ISO-8601>`)
- generator: self-review (`@figma-plugin` + `@tds-component`, docs fleet) · human-review (pending — repo owner)
- task: [.ai/TASKS.json](./TASKS.json)#AIOS-GEN-0001
- verdict: **APPROVED (self-review)** · human-review: **PENDING**
- status: active (docs + manifests) — backend/API/DB portions marked `status: planned`
- scope: `docs/ai-os/00_MASTER_RULES.md … 40_FINAL_OPERATING_MANUAL.md` (41 specs) · `.ai/*` (17 runtime manifests). **No** change to pipeline source, tokens, components, or generated outputs.

### Automated gates

| Gate | Command | Result |
| --- | --- | --- |
| lint | `npm run lint` | **N/A** — docs/manifests only; no `src/**`, `scripts/**`, or plugin source touched (ESLint globs unaffected). |
| build | `npm run build` | **N/A** — no TypeScript/Vite input changed. |
| figma:build | `npm run figma:build` | **N/A** — no `*.meta.ts`, token, or `figma/plugin/src/*` change. |
| plugin:test | `npm run plugin:test` | **N/A** — plugin source unchanged; coverage harness not implicated. |
| reconciliation | `git diff --exit-code -- figma/ src/generated/ src/tokens/generated/ figma/plugin/code.js docs/COMPONENTS.md` | **CLEAN** — zero generated outputs touched by this change. |

> Gate rationale: this change adds **documentation and AI-state manifests only**. Per R2, non-trivial changes require a report (this file); per R1 the mechanical gates must be green — here they are **not implicated** because no pipeline input changed, so they are recorded `N/A` rather than skipped silently.

### Design Lock

- Visual/token/naming changes: **none**. No token value, CSS, `figma{}` block, or any component/variant/variable **rename** was introduced. The docs *quote and enforce* the immutable Design Lock; they do not alter it.
- Generated files hand-edited: **NO**. `figma/*`, `src/generated/*`, `src/tokens/generated/*`, `figma/plugin/code.js` were not touched (only the hand-authored `figma/README.md` remains the contract, unchanged here).
- Variant-axis integrity (state not a Figma variant; `type` A/B/C split per preset): **OK** — the docs codify this exact policy (R7); nothing emitted or altered.

### Findings

#### Blocking (MUST be zero to approve)

- _None._ Zero open blocking findings.

#### Advisory (does not block — R13)

- [ ] `docs/ai-os/*`, `.ai/*` — `Last-reviewed` / `generatedAt` carry placeholder (`SEED` / `<ISO-8601>`) values pending the first human review pass. — filed: [.ai/TASKS.json](./TASKS.json)#AIOS-GEN-0002 (stamp real timestamps on first human review).
- [ ] `.ai/` — the backend-facing manifests ([ERD.json](./ERD.json), [API_SPEC.json](./API_SPEC.json)) and backend guides (`docs/ai-os/14–17`) are **`status: planned`** seeds; they must be re-reviewed when a real Supabase/Node backend lands. — filed: [.ai/TASKS.json](./TASKS.json)#AIOS-GEN-0003.

### Reuse & conventions

- Reuse-first (no duplicate of a catalog component): **N/A** — no component work in this change; the docs *mandate* reuse-first against [docs/COMPONENTS.md](../docs/COMPONENTS.md) and the `@/components` barrel.
- Barrel imports · meta purity · `var(--tds-*)` · `toDataAttrs`: **N/A** (no code); conventions are *specified* consistently with `eslint.config.js` / `.prettierrc.json` / `tsconfig`.
- a11y (addon-a11y on changed components): **N/A** — no component DOM/interaction surface changed.
- Canon consistency: **OK** — exact names honored throughout (`--tds-*`, Collections Primitives/Semantic/Theme, axes `type`/`variant`/`tone`/`size`/`shape`/`state`, bundle `figma/tds.plugin.json = { tokens, design }`, aliases `@/`·`@core/`·`@components/`·`@tokens/`, subagents `@tds-component`/`@figma-plugin`). No renames.

### Sign-off

- self-review: docs fleet (per-doc self-review pass) @ SEED — **APPROVED**: structurally valid, canon-consistent, no Design-Lock or drift risk (docs/manifests only).
- human-review: **PENDING** — repo owner to run [§2](#2-review-dimensions-checklist) against the committed tree and stamp the verdict + `Last-reviewed` date.
- manifests updated on approve: [.ai/TASKS.json](./TASKS.json) (open AIOS-GEN-0002/0003) · [.ai/CHANGELOG.md](./CHANGELOG.md) (append AI-OS generation) · [.ai/SESSION_SUMMARY.md](./SESSION_SUMMARY.md) (record rehydration point).

---

### Dependencies

- **Governing spec:** [docs/ai-os/30_REVIEW_SYSTEM.md](../docs/ai-os/30_REVIEW_SYSTEM.md) (rules R1–R15, §11 template) · [docs/ai-os/00_MASTER_RULES.md](../docs/ai-os/00_MASTER_RULES.md) (Design Lock, precedence) · [docs/ai-os/27_MANIFEST_SPECIFICATION.md](../docs/ai-os/27_MANIFEST_SPECIFICATION.md) (manifest schema).
- **Gates referenced:** `package.json` scripts `lint` · `build` · `ds:build` · `figma:build` · `plugin:test`; `figma/plugin/test/harness.ts`.
- **Manifests read/written on approve:** [.ai/TASKS.json](./TASKS.json), [.ai/CHANGELOG.md](./CHANGELOG.md), [.ai/SESSION_SUMMARY.md](./SESSION_SUMMARY.md); read-for-context: [.ai/DESIGN_MANIFEST.json](./DESIGN_MANIFEST.json), [.ai/COMPONENT_INDEX.json](./COMPONENT_INDEX.json), [.ai/VARIANT_INDEX.json](./VARIANT_INDEX.json), [docs/COMPONENTS.md](../docs/COMPONENTS.md).
