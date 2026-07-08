---
title: 24 — Testing Guide
purpose: Define the TDS testing standard — the CURRENT headless plugin harness plus the static gates that back it, and the PLANNED Storybook interaction tests, visual snapshots, unit (vitest) and e2e (playwright) layers, coverage gates, and the test pyramid — being explicit about what exists today versus what is planned.
status: ACTIVE (current gates) · PLANNED sections flagged inline
owner: AI OS
last-reviewed: 2026-07-08 (placeholder — update on each review)
precedence: Subordinate to [00_MASTER_RULES.md](./00_MASTER_RULES.md). On any conflict the constitution wins, then Storybook + the `*.meta.ts` / `src/tokens` sources, then the generated manifests, then Figma. This document governs how correctness is *verified*; it never overrides the Design Lock in [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md). Where this doc and a real script (`package.json`, `figma/plugin/test/harness.ts`) disagree, the script wins and this doc must be corrected.
---

# 24 — Testing Guide

## 1. Purpose

This document is the single normative reference for **verifying correctness** in the TDS
repository. It draws a hard line between what is real today and what is planned:

- **CURRENT (ACTIVE).** Exactly one automated *behavioral* gate exists: the **headless plugin
  harness** `figma/plugin/test/harness.ts`, run by `npm run plugin:test` and chained inside
  `npm run figma:build`. It mocks the Figma API, runs the **real** plugin (`figma/plugin/src/code.ts`)
  against the **real** contract (`figma/tds.plugin.json`), and asserts ~35 coverage checks,
  `process.exit(1)` on any mismatch. Around it sit the **static gates** — `npm run plugin:typecheck`,
  `npm run build` (`tsc -b && vite build`), `npm run lint` (`eslint .`), `npm run format:check` — and
  the **generated-output drift check** (re-run `ds:build`/`figma:build`, `git diff` must be empty), plus
  the **semi-automated a11y pass** via `@storybook/addon-a11y` (axe in the Storybook panel).
- **PLANNED.** There is **no unit-test framework** (no `vitest`/`jest`), **no e2e framework**
  (no `playwright`), **no `test` npm script**, **no `*.test.ts` / `*.spec.ts` files** in `src/`, and
  **no CI** (`.github/` does not exist). Storybook interaction tests (`@storybook/addon-interactions`
  is *registered* and `@storybook/test` is *installed*, but **zero `play` tests exist**), visual
  snapshot testing, unit tests, e2e, coverage gates, and all backend/DB/API tests are **PLANNED** and
  are marked as such wherever they appear below.

The guiding principle: **there is no "looks right" pass.** Correctness is machine-checked against the
generated contract, or it is not verified. This doc feeds the runtime manifests
[.ai/REVIEW_REPORT.md](../../.ai/REVIEW_REPORT.md) and [.ai/PLUGIN_INDEX.json](../../.ai/PLUGIN_INDEX.json).

## 2. Responsibilities

This guide is responsible for:

- Documenting the headless harness as the **merge-blocking** behavioral gate: what it mocks, what it
  asserts, and how it derives expectations from `figma/tds.plugin.json`.
- Defining the **current test pyramid** (static → integration → semi-manual review) and the **planned**
  target pyramid (unit → component/interaction → visual → e2e), and how the two reconcile.
- Fixing the **run order** of gates in the local workflow and the (PLANNED) CI pipeline
  ([25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)).
- Specifying how **generated outputs** are verified (determinism / drift), since generated files are
  sacred ([00_MASTER_RULES.md](./00_MASTER_RULES.md)) and hand-edits are prohibited.
- Specifying the **conventions** for PLANNED test code so that, once frameworks land, they arrive
  consistent (naming, location, aliases, what each layer owns).
- Enumerating **coverage gates** — the current harness check-set is the coverage floor; PLANNED numeric
  coverage thresholds attach to unit/interaction layers.

Out of responsibility (owned elsewhere): the plugin algorithm the harness verifies →
[06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md); interaction `play`-test *content* →
[11_INTERACTION_SPECIFICATION.md](./11_INTERACTION_SPECIFICATION.md); a11y/axe depth →
[13_ACCESSIBILITY_SPECIFICATION.md](./13_ACCESSIBILITY_SPECIFICATION.md); Storybook authoring rules →
[04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md); CI wiring → [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md);
review/approval gates → [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md).

## 3. Scope

**In-scope**

- The headless harness `figma/plugin/test/harness.ts` and its `npm run plugin:test` / `figma:build` gate.
- The static verification gates: `plugin:typecheck`, `build`, `lint`, `format:check`.
- Generated-output determinism/drift checks for `tokens:build`, `manifest:build`, `catalog:build`.
- The Storybook a11y pass (`@storybook/addon-a11y`) as the current semi-automated accessibility check.
- The **conventions and scaffolding plan** for PLANNED unit / interaction / visual / e2e tests.
- The current and target **test pyramids** and the **coverage-gate** policy.

**Out-of-scope**

- Visual redesign of anything under test — locked ([03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md)).
- Authoring the plugin algorithm, tokens, components, or stories (their own specs own that).
- **PLANNED backend/DB/API/Supabase tests.** No backend, database, API, auth, `.env`, or Supabase
  exists today; all such testing is PLANNED and defers to [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md),
  [15_API_GUIDE.md](./15_API_GUIDE.md), [16_NODE_GUIDE.md](./16_NODE_GUIDE.md),
  [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md).
- **PLANNED CI orchestration** of these gates — owned by [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md).

## 4. Rules

Rules are numbered `T-n` (Testing). MUST/SHOULD/NEVER are enforceable against real repo mechanisms.
Rules tagged **(PLANNED)** activate only when the corresponding framework lands.

**The headless harness (CURRENT — the gate)**

- **T-1 (MUST)** Any change to the plugin (`figma/plugin/src/*.ts`), the bundle generator
  (`scripts/build-manifest.ts`), the tokens (`src/tokens/*`), or any `*.meta.ts` that alters the bundle
  **MUST** pass `npm run figma:build` — which ends in `npm run plugin:test` — before commit. A red harness
  (`HEADLESS VERIFICATION FAILED`, exit 1) **MUST** block merge ([30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)).
- **T-2 (MUST)** The harness **MUST** derive every expected count from the **real** contract
  (`figma/tds.plugin.json`) at runtime — never from a hardcoded number. Expectations for collections,
  variables, resolved aliases, effect/text styles, component sets (`= comps.length`), variant components
  (`= Σ figmaVariantCombinations + 1` placeholder), `TEXT`/`BOOLEAN`/`INSTANCE_SWAP` props, pages
  (`= PAGE_TITLES.length = 8`), and foundation cards (`= 6`) are all computed from the bundle.
- **T-3 (MUST)** The harness **MUST** import and run the **real** `figma/plugin/src/code.ts` (via
  `figma.ui.onmessage({ type: 'run' })`), not a copy or a stub of it. Only the Figma API is mocked.
- **T-4 (MUST)** The harness **MUST** fail on any **blocking** warning matching
  `/Unresolved alias|unknown mode|not found/i`. Non-blocking notes (font fallback to Inter, `transition`
  has no Figma equivalent, local Icon key not bindable) are expected and **MUST NOT** be "fixed" by
  weakening the check.
- **T-5 (MUST)** New guarantees **MUST** be added to the harness **first** (as a failing check), then
  satisfied in source — the gate scales the guarantees, not just the code. You **MUST NOT** delete or
  soften an existing check to make a build green; fix the source instead.
- **T-6 (MUST)** The harness **MUST** keep reproducing real Figma runtime constraints it already encodes
  (e.g. `layoutPositioning = 'ABSOLUTE'` only under an Auto-Layout parent; `combineAsVariants` requires all
  grouped nodes on the parent's page). These are regression guards; removing them re-opens known crashes.

**Static gates (CURRENT)**

- **T-7 (MUST)** `npm run plugin:typecheck` (`tsc -p figma/plugin/tsconfig.json`, `strict`,
  `noUnusedLocals/Parameters`) **MUST** pass; `figma/plugin/src/types.ts` **MUST** still mirror the bundle
  verbatim ([06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md)).
- **T-8 (MUST)** `npm run build` (`tsc -b && vite build`), `npm run lint` (`eslint .`, incl.
  `eslint-plugin-storybook flat/recommended` + `react-hooks`), and `npm run format:check` (prettier)
  **MUST** pass. Lint/typecheck are the base of the pyramid — the cheapest, fastest tests.

**Generated-output determinism (CURRENT)**

- **T-9 (MUST)** Generated outputs (`figma/tds.plugin.json`, `src/generated/design-system.manifest.json`,
  `src/tokens/generated/*`, `docs/COMPONENTS.md`, `figma/plugin/code.js`) are **sacred** — you **MUST NEVER**
  hand-edit them. After a source change, re-run the relevant build and commit the regenerated output in the
  same change.
- **T-10 (MUST)** The pipeline **MUST** be deterministic: re-running `npm run ds:build` (or `figma:build`)
  on an unchanged source tree **MUST** leave `git status` clean. A non-empty `git diff` on generated files
  after a build is a **drift failure** — the checked-in output was stale or hand-edited.

**Accessibility & Storybook (CURRENT semi-manual)**

- **T-11 (SHOULD)** Every story SHOULD pass the `@storybook/addon-a11y` (axe) panel with no violations;
  a11y depth and WCAG targets live in [13_ACCESSIBILITY_SPECIFICATION.md](./13_ACCESSIBILITY_SPECIFICATION.md).
  This is currently a **manual/panel** check (no automated a11y run in CI yet — PLANNED via the test-runner).

**Interaction / unit / visual / e2e (PLANNED)**

- **T-12 (SHOULD, PLANNED)** Non-trivial interactive components SHOULD ship a `play` function using
  `@storybook/addon-interactions` + `@storybook/test` (`within`, `userEvent`, `expect`). The addon is
  registered in `.storybook/main.ts` and `@storybook/test` is installed, but **zero `play` tests exist
  today** — writing the first batch is the first planned milestone (see §12, [11_INTERACTION_SPECIFICATION.md](./11_INTERACTION_SPECIFICATION.md)).
- **T-13 (SHOULD, PLANNED)** Pure logic in `src/core/*` (`defineComponentMeta`, `toDataAttrs`,
  `defaultsFromMeta`, `variantCount`, `argTypesFromMeta`/`argsFromMeta`), `src/utils/*` (`cx`, `mergeRefs`,
  chart math), `src/hooks/*`, and the `scripts/*` builders SHOULD get **unit tests** once **vitest** is
  adopted. Files **MUST** be colocated as `X.test.ts` next to source, using the `@/`, `@core/`, `@components/`,
  `@tokens/` aliases.
- **T-14 (SHOULD, PLANNED)** Visual-regression snapshots (per-story) SHOULD be added via the Storybook
  test-runner and/or Playwright screenshots — as a **reproduction** guard, never a redesign lever. A visual
  diff is a *signal*, and any accepted change is a **SOURCE** change (meta/tokens/CSS), never a re-baseline
  of a hand-edit ([05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md)).
- **T-15 (SHOULD, PLANNED)** End-to-end flows (Storybook example apps: Board, Dashboard, List, BottomSheet)
  SHOULD get **playwright** coverage once the framework lands.
- **T-16 (MUST, PLANNED)** When a framework is added it **MUST** register a real `test` npm script and be
  wired into `figma:build`'s successor CI job; adding a framework without a gate is not "testing."
- **T-17 (NEVER)** A test **MUST NEVER** assert a *new* design decision (a color, spacing, radius, motion,
  or renamed token/variant/axis). Tests verify the reproduction of Storybook; they never author design.

## 5. Workflow

### 5.1 The local verification loop (CURRENT — run before every commit)

```bash
# 1. Regenerate + fully verify the design-system → Figma pipeline (the primary gate).
npm run figma:build
#   = ds:build          (tokens:build && manifest:build && catalog:build)
#   → plugin:typecheck  (tsc -p figma/plugin/tsconfig.json)
#   → plugin:build      (esbuild … → figma/plugin/code.js)
#   → plugin:test       (tsx figma/plugin/test/harness.ts → exit 1 on any mismatch)

# 2. App/typescript build + static gates.
npm run build          # tsc -b && vite build
npm run lint           # eslint .
npm run format:check   # prettier --check

# 3. Determinism / drift: nothing generated should have changed by hand.
git status --porcelain # MUST be empty for generated files after a clean re-build
```

When iterating on the plugin only, run the sub-steps directly:

```bash
npm run plugin:typecheck   # types still mirror the bundle?
npm run plugin:build       # re-bundle code.js
npm run plugin:test        # headless coverage gate (~35 checks)
```

### 5.2 What `plugin:test` does (harness anatomy)

1. **Mock** — `figma/plugin/test/harness.ts` builds a minimal `globalThis.figma` (variables, nodes,
   `combineAsVariants`, pages, styles, `createInstance`, property registration) plus `__html__`. Node mocks
   track Auto-Layout fields, bound variables/paints, effect styles, and component properties so the checks
   can read them back.
2. **Run the real plugin** — `await import('../src/code.ts')` registers `figma.ui.onmessage`; the harness
   fires `{ type: 'run' }` to execute the actual generation.
3. **Derive expectations** from the imported bundle `figma/tds.plugin.json` (counts, alias totals,
   per-property tallies, `PAGE_TITLES.length`).
4. **Assert ~35 checks** — printed `PASS`/`FAIL … got / exp`, grouped into: **counts** (collections,
   variables, resolved aliases, effect/text styles, component sets, variant components +1 placeholder,
   pages = 8, foundation cards = 6); **property coverage** (`TEXT`/`BOOLEAN`/`INSTANCE_SWAP` totals and each
   set registers *exactly* its non-variant props); **Storybook→Figma fidelity** (default variant first,
   descriptions carry a11y + the Composition spec, no empty variant, ≥90% token-styled variants, Auto-Layout
   on every set + structural root, A/B/C Type sets pin their Type, padding/gap/radius bound to tokens, shadow
   applied, one shared token-colored Icon swap source, `chart/1..6` present + theme-aware light≠dark ≥4).
5. **Fail loudly** — any failed check **or** any blocking warning → `HEADLESS VERIFICATION FAILED` +
   `process.exit(1)`. All green → `HEADLESS VERIFICATION PASSED`.

### 5.3 Adding a guarantee (test-first, CURRENT)

1. Add a new `[name, got, exp]` entry to the `checks` array in `figma/plugin/test/harness.ts` that reads the
   new invariant from the generated tree/bundle. Confirm it goes **red**.
2. Change the **source** (`*.meta.ts`, `src/tokens/*`, `scripts/build-manifest.ts`, or a `recipes.ts` recipe)
   until it goes green. Never soften the check (T-5).
3. `npm run figma:build`; then reconcile [.ai/PLUGIN_INDEX.json](../../.ai/PLUGIN_INDEX.json) /
   [.ai/REVIEW_REPORT.md](../../.ai/REVIEW_REPORT.md) ([27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md)).

### 5.4 Bootstrapping a PLANNED test layer (when approved)

1. **Unit (vitest):** `npm i -D vitest`; add `"test": "vitest run"` + `"test:watch": "vitest"`; create
   `vitest.config.ts` reusing the four aliases; write `X.test.ts` beside pure modules (`src/core`, `src/utils`,
   `src/hooks`, `scripts`). Gate: add to CI after `lint`.
2. **Interaction:** add `play` functions to existing `*.stories.tsx` (no new framework — the addon +
   `@storybook/test` are already present). Gate: `@storybook/test-runner` (PLANNED) in CI.
3. **Visual + e2e:** `npm i -D @playwright/test @storybook/test-runner`; snapshot stories and drive the
   `src/stories/Examples` apps; commit baselines as reproduction references only.
4. Register every new gate in [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md) and this doc's §7 before relying on it.

## 6. Examples

**6.1 — A representative harness run (CURRENT):**

```text
=== Plugin generator — headless coverage ===
PASS  collections: 3 / 3
PASS  variables: <n> / <n>
PASS  alias values resolved: <n> / <n>
PASS  component sets: 60 / 60
PASS  variant components: <Σ+1> / <Σ+1>
PASS  pages (Foundation reused + 7 created): 8 / 8
PASS  foundation token cards: 6 / 6
PASS  default variant first: 60 / 60
PASS  no empty variant (every variant renders content): <n> / <n>
PASS  token-styled variants ≥ 90% (CSS→token 1:1): <floor> / <floor>
PASS  chart palette is theme-aware (light≠dark ≥4): 4 / 4

blocking warnings: 0
HEADLESS VERIFICATION PASSED
```

**6.2 — Expectations derived from the contract, never hardcoded (from `harness.ts`):**

```ts
const cols = b.tokens.collections;
const expVars = cols.reduce((a, c) => a + c.variables.length, 0);
const comps = b.design.components;
const expVariants = comps.reduce((a, c) => a + c.figmaVariantCombinations, 0);
// component sets == comps.length ; variant components == expVariants + 1 (placeholder)
const checks: Array<[string, number, number]> = [
  ['component sets', stats.sets, comps.length],
  ['variant components', stats.components, expVariants + 1],
  ['pages (Foundation reused + 7 created)', 1 + stats.createdPages, PAGE_TITLES.length], // 8
];
```

**6.3 — Blocking-warning gate (from `harness.ts`):**

```ts
const unresolved = warnings.filter((w) => /Unresolved alias|unknown mode|not found/i.test(w));
if (!ok || unresolved.length > 0) {
  console.error('\nHEADLESS VERIFICATION FAILED');
  process.exit(1);
}
```

**6.4 — Generated-output drift check (CURRENT):**

```bash
npm run figma:build
git diff --exit-code figma/ src/generated/ src/tokens/generated/ docs/COMPONENTS.md
# non-zero exit ⇒ a generated file was stale or hand-edited (violates T-9/T-10)
```

**6.5 — PLANNED Storybook interaction test** (addon + `@storybook/test` already installed; no such test
exists yet — see [11_INTERACTION_SPECIFICATION.md](./11_INTERACTION_SPECIFICATION.md)):

```tsx
// Button.stories.tsx — PLANNED
import { within, userEvent, expect, fn } from '@storybook/test';

export const Activates: Story = {
  args: { onClick: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button'));
    await expect(args.onClick).toHaveBeenCalled();
  },
};
```

**6.6 — PLANNED vitest unit test** (no vitest installed today):

```ts
// src/core/defineComponent.test.ts — PLANNED
import { describe, it, expect } from 'vitest';
import { toDataAttrs } from '@core/defineComponent';
import { buttonMeta } from '@components/atoms/Button/Button.meta';

describe('toDataAttrs', () => {
  it('emits a data-* attribute per axis', () => {
    const attrs = toDataAttrs(buttonMeta, { type: 'A', variant: 'solid', tone: 'brand' });
    expect(attrs['data-variant']).toBe('solid');
    expect(attrs['data-tone']).toBe('brand');
  });
});
```

## 7. Validation Rules

Compliance is machine-checked. There is no "looks right" pass.

- **Headless harness (CURRENT, gating)** — `npm run plugin:test` / `npm run figma:build`. ~35 checks +
  blocking-warning filter; `process.exit(1)` on failure. This is the merge gate for any bundle-affecting change.
- **Typecheck (CURRENT)** — `npm run plugin:typecheck` and `npm run build` (`tsc -b`). Strict TS,
  `noUnusedLocals/Parameters`, `verbatimModuleSyntax`.
- **Lint (CURRENT)** — `npm run lint` (`eslint .`): `typescript-eslint`, `react-hooks`,
  `eslint-plugin-storybook flat/recommended`, `consistent-type-imports`.
- **Format (CURRENT)** — `npm run format:check` (prettier: semi, singleQuote, trailingComma all, printWidth 100).
- **Determinism/drift (CURRENT)** — re-run `ds:build`/`figma:build`; `git diff` on generated paths **MUST** be
  empty (T-9, T-10).
- **A11y (CURRENT, semi-manual)** — `@storybook/addon-a11y` axe panel per story ([13_ACCESSIBILITY_SPECIFICATION.md](./13_ACCESSIBILITY_SPECIFICATION.md)).
- **Interaction (PLANNED)** — `@storybook/addon-interactions` `play` steps in the Interactions panel; later the
  Storybook test-runner in CI.
- **Unit / visual / e2e (PLANNED)** — `vitest run` (+ coverage), Storybook test-runner / Playwright snapshots,
  `@playwright/test`. Each attaches a numeric **coverage gate** on adoption (see §12).
- **Schema (CURRENT)** — `.ai/*` manifests validated against their `$schema` ([27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md)).
- **CI orchestration (PLANNED)** — no `.github/` yet; the run order in §5.1 is the CI job spec
  ([25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)).

## 8. Checklist

Pre-commit (CURRENT):

- [ ] `npm run figma:build` prints `HEADLESS VERIFICATION PASSED` (harness green, 0 blocking warnings).
- [ ] `npm run build` (tsc -b && vite build) passes; `npm run plugin:typecheck` passes.
- [ ] `npm run lint` and `npm run format:check` clean.
- [ ] Re-ran the build; `git diff` on `figma/`, `src/generated/`, `src/tokens/generated/`, `docs/COMPONENTS.md`
      is empty (no drift, no hand-edited generated file).
- [ ] Did **not** delete/soften an existing harness check to go green (T-5); new guarantee added test-first.
- [ ] No test asserts a new design decision (T-17); any visual change flowed through source.
- [ ] Storybook a11y panel clean for touched stories (T-11).
- [ ] Reconciled [.ai/PLUGIN_INDEX.json](../../.ai/PLUGIN_INDEX.json) / [.ai/REVIEW_REPORT.md](../../.ai/REVIEW_REPORT.md) if coverage changed.

Per new interactive component (PLANNED baseline):

- [ ] `play` interaction test added for the primary behavior (T-12).
- [ ] Pure logic covered by a `*.test.ts` once vitest lands (T-13).

## 9. Failure Recovery

| Symptom | Diagnosis | Fix | Resume |
| --- | --- | --- | --- |
| `plugin:test` FAIL `component sets` / `variant components` | Bundle's `figmaVariantCombinations` ≠ what the generator emitted (often a re-introduced `state` axis) | Ensure the generator strips the `state` axis; keep `disabled`/`loading` as BOOLEAN props | `npm run figma:build` |
| `plugin:test` FAIL `variables` / `alias values resolved` | Token source changed, or an alias points forward / at a missing id | Re-run `manifest:build`; keep Primitives → Semantic → Theme order; fix the **source** token, not `variables.ts` | `plugin:test` |
| `plugin:test` FAIL `no empty variant` / `token-styled ≥ 90%` | A recipe/generic path rendered an empty box or an unmapped `tokenBinding` | Extend the `recipes.ts` recipe / `resolveChannels` mapping until every variant renders | `plugin:test` |
| `HEADLESS VERIFICATION FAILED` but all checks `PASS` | A **blocking** warning fired (`Unresolved alias`/`unknown mode`/`not found`) | Read the `! ` warning lines; resolve the alias/mode at source | `plugin:test` |
| Runtime: `combineAsVariants: Grouped nodes must be in the same page` | Page switched with the sync setter, or card body not on current page | Use `figma.setCurrentPageAsync`; append the doc card before combining | Re-run plugin |
| Runtime: `layoutPositioning = ABSOLUTE` throws | A marker set absolute before its parent had Auto Layout | Only set `ABSOLUTE` under an Auto-Layout parent (the harness reproduces this) | `plugin:test` |
| `git diff` dirty after a clean `figma:build` | A generated file was hand-edited or a stale output was committed | Revert the hand-edit; re-run the build; commit regenerated output only | `figma:build` |
| `plugin:typecheck` errors after a bundle change | `figma/plugin/src/types.ts` drifted from the contract | Update `types.ts` to mirror `figma/tds.plugin.json` verbatim | `plugin:typecheck` |
| `lint` fails on a story | `eslint-plugin-storybook` rule (e.g. context in render) | Fix the story to CSF3 conventions ([04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md)) | `npm run lint` |
| "Where are the unit tests?" | None exist — vitest is **PLANNED** | Do not fabricate a `test` script; follow §5.4 to bootstrap, or rely on the current gates | — |

When context is lost mid-task, rehydrate per [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md): read
[.ai/PLUGIN_INDEX.json](../../.ai/PLUGIN_INDEX.json) + [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md),
re-run `npm run figma:build`, and reconcile against §7.

## 10. Dependencies

- **Docs** — [00_MASTER_RULES.md](./00_MASTER_RULES.md), [02_AI_HARNESS.md](./02_AI_HARNESS.md),
  [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md), [04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md),
  [05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md), [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md),
  [11_INTERACTION_SPECIFICATION.md](./11_INTERACTION_SPECIFICATION.md), [13_ACCESSIBILITY_SPECIFICATION.md](./13_ACCESSIBILITY_SPECIFICATION.md),
  [23_PERFORMANCE_GUIDE.md](./23_PERFORMANCE_GUIDE.md), [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md),
  [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md), [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md),
  [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md), [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md),
  [34_PROJECT_BOOTSTRAP.md](./34_PROJECT_BOOTSTRAP.md), [39_AI_CHECKLIST.md](./39_AI_CHECKLIST.md).
  PLANNED backend testing defers to [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [15_API_GUIDE.md](./15_API_GUIDE.md),
  [16_NODE_GUIDE.md](./16_NODE_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md).
- **Manifests** — [.ai/REVIEW_REPORT.md](../../.ai/REVIEW_REPORT.md), [.ai/PLUGIN_INDEX.json](../../.ai/PLUGIN_INDEX.json),
  [.ai/TASKS.json](../../.ai/TASKS.json), [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md),
  [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md).
- **Source & scripts (repo)** — gate `figma/plugin/test/harness.ts`; input `figma/tds.plugin.json`; plugin
  runtime `figma/plugin/src/{code,components,recipes,variables,styles,pages,foundation,doc,log,types}.ts`;
  `figma/plugin/tsconfig.json`; generators `scripts/build-{tokens,manifest,catalog}.ts`; `.storybook/main.ts`
  (a11y + interactions addons); `eslint.config.js`; `.prettierrc.json`; `package.json` scripts
  (`plugin:test`, `figma:build`, `plugin:typecheck`, `build`, `lint`, `format:check`, `ds:build`).
- **Installed test tooling** — `@storybook/addon-a11y`, `@storybook/addon-interactions`, `@storybook/test`
  (all present). **Not installed (PLANNED):** `vitest`, `@playwright/test`, `@storybook/test-runner`, any CI.

## 11. Template

**Current test pyramid (what actually runs today) — inverted/narrow by design:**

```text
        ┌────────────────────────────────────────────┐
manual  │  Storybook a11y panel (axe)  ·  visual eye  │  ← semi-manual
        ├────────────────────────────────────────────┤
integ.  │  figma/plugin/test/harness.ts (~35 checks)  │  ← the ONE automated
        │  npm run plugin:test  →  figma:build        │     behavioral gate
        ├────────────────────────────────────────────┤
static  │  tsc (build + plugin:typecheck) · eslint ·  │  ← fast base
        │  prettier · generated-output drift check    │
        └────────────────────────────────────────────┘
```

**Target pyramid (PLANNED — how it grows):**

```text
   e2e      Playwright over src/stories/Examples (Board/Dashboard/List/BottomSheet)   (PLANNED)
   visual   Storybook test-runner / Playwright per-story snapshots                    (PLANNED)
   compo.   Storybook play tests (@storybook/addon-interactions + @storybook/test)    (PLANNED, addon ready)
   integ.   figma/plugin/test/harness.ts  (CURRENT — stays the Figma-fidelity gate)
   unit     vitest over src/core, src/utils, src/hooks, scripts/*                     (PLANNED)
   static   tsc · eslint · prettier · drift  (CURRENT — base of everything)
```

**Reusable harness-check skeleton** (append to the `checks` array in `figma/plugin/test/harness.ts`,
test-first per T-5):

```ts
// 1. Read the invariant from the generated tree / bundle.
const got = /* count something the plugin produced, e.g. createdSets.filter(...).length */;
const exp = /* derive from `b` (figma/tds.plugin.json), never a magic number */;

// 2. Add to the checks array (name, got, exp). Confirm RED, then satisfy in SOURCE.
checks.push(['my new invariant (what it proves)', got, exp]);
```

**Planned `vitest.config.ts` skeleton** (only when unit testing is approved — §5.4):

```ts
import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: { environment: 'jsdom', globals: false, coverage: { provider: 'v8' } },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@tokens': resolve(__dirname, 'src/tokens'),
      '@core': resolve(__dirname, 'src/core'),
      '@components': resolve(__dirname, 'src/components'),
    },
  },
});
// package.json (PLANNED): "test": "vitest run", "test:watch": "vitest"
```

## 12. Future Extension

The testing strategy scales from **one integration gate** toward a full pyramid without ever loosening the
Design Lock. Directions that keep it enterprise-grade for years and toward >10,000,000 users:

- **Interaction tests first (PLANNED).** The addon (`@storybook/addon-interactions`) and driver
  (`@storybook/test`) are already installed — the cheapest next win is a `play`-test batch across interactive
  components ([11_INTERACTION_SPECIFICATION.md](./11_INTERACTION_SPECIFICATION.md)), then a `@storybook/test-runner`
  CI job that also runs axe headlessly (upgrading T-11 from manual to automated).
- **Unit layer via vitest (PLANNED).** Pure metadata/logic (`src/core`, `src/utils`, `src/hooks`, `scripts`)
  is deterministic and side-effect-free — ideal for fast unit tests with a coverage gate (start ~80% lines on
  those dirs; ratchet up). Register a real `test` script and add it below `lint` in CI.
- **Visual regression (PLANNED).** Per-story snapshots (Storybook test-runner / Playwright / Chromatic) turn
  the "visual eye" row into an automated **reproduction** guard — a diff is a signal, and any accepted change
  is a source change that re-flows through `figma:build`, never a silent re-baseline ([05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md)).
- **e2e (PLANNED).** Playwright over the `src/stories/Examples` apps validates composed flows end-to-end.
- **Harness as living contract (CURRENT → scaling).** As guarantees rise, add checks to
  `figma/plugin/test/harness.ts` first (red), then satisfy them; the gate — not prose — encodes the growing
  fidelity promise, and its determinism underpins CI drift detection ([30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)).
- **Backend test tiers (PLANNED).** When the Supabase backend arrives, layer contract/integration tests (RLS
  policy tests, API contract tests against [.ai/API_SPEC.json](../../.ai/API_SPEC.json) and
  [.ai/ERD.json](../../.ai/ERD.json)) and load tests for the 10M-user target — deferring to
  [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [15_API_GUIDE.md](./15_API_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md).
- **MCP-driven verification (PLANNED).** An MCP agent can invoke `figma:build`, read the pass/fail summary from
  [.ai/PLUGIN_INDEX.json](../../.ai/PLUGIN_INDEX.json), and keep Storybook ↔ Figma perpetually in sync without
  re-reading source ([35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md), [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md)).
