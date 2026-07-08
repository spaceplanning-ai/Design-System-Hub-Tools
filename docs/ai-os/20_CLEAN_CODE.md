# 20 — Clean Code

- **Title:** Clean Code
- **Purpose:** Adapt clean-code discipline to this metadata-driven repo — small pure metas, zero duplication (reuse-first), a single source of truth, no dead code, readability parity across the four generated outputs, and the generate-not-handwrite rule.
- **Status:** ACTIVE
- **Owner:** AI OS
- **Last-reviewed:** _(placeholder — update on each review)_
- **Precedence:** Subordinate to [00_MASTER_RULES.md](./00_MASTER_RULES.md). On any conflict, the constitution, the Design Lock Policy, and the source-of-truth hierarchy win. This document governs code cleanliness and craftsmanship; the enforceable syntax rules live in [19_CODE_CONVENTION.md](./19_CODE_CONVENTION.md), component anatomy in [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md), and token authoring in [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md).

---

## 1. Purpose

Clean code in TDS is not a style preference — it is a **structural guarantee**. Because one
pure-data `X.meta.ts` (`ComponentMeta`) feeds four outputs (the React component, Storybook
controls/autodocs/a11y, the manifest `src/generated/design-system.manifest.json`, and the Figma
bundle `figma/tds.plugin.json`), any smell in the source multiplies four times downstream.
Duplication does not just cost bytes; it **splits the single source of truth** and produces design
drift the plugin will faithfully reproduce.

This document defines what "clean" means _here_:

- **Small, pure metas** — `*.meta.ts` is React/CSS-free, side-effect-free, importable from Node.
- **Zero duplication** — reuse the 60-component catalog and shared `core/`, `hooks/`, `utils/`
  helpers before writing anything new.
- **Single source of truth** — never hand-write what a script generates; change the source and rebuild.
- **No dead code** — `noUnusedLocals`/`noUnusedParameters` and `react-refresh` make dead code a
  compile-time error, not a review nitpick.
- **Readability parity** — the code, Storybook, and Figma must all say the same thing; a reader of
  any one can predict the other two.

The overriding principle: **the cleanest change is the one you did not have to write** because the
component, hook, token, or helper already existed.

## 2. Responsibilities

This spec is responsible for:

1. Defining the **purity contract** for `*.meta.ts` and why it must stay React/CSS-free with
   relative imports only (so `scripts/build-manifest.ts` and `scripts/build-catalog.ts` can import it under `tsx`).
2. The **reuse-first duplication rule**: read [docs/COMPONENTS.md](../COMPONENTS.md) and
   [.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json) before creating; import only from the
   single barrel `@/components`; reuse `cx`, `mergeRefs`, and the `hooks/` before re-implementing.
3. The **generate-not-handwrite** rule: files under `figma/`, `src/generated/`, and
   `src/tokens/generated/` (plus `figma/plugin/code.js`) are generated outputs — never hand-edited.
4. **Dead-code hygiene** wired to `eslint`/`tsc` (`noUnusedLocals`, `noUnusedParameters`,
   `verbatimModuleSyntax`, `react-refresh`).
5. **Readability parity** — naming, size, and structure so the meta, the CSS token bindings, and the
   Figma variant names all agree.

Out of responsibility (owned elsewhere): the exact lint/prettier/tsconfig rule set
([19_CODE_CONVENTION.md](./19_CODE_CONVENTION.md)); token model depth
([08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md)); variant-axis taxonomy
([09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md)); AI context/token frugality
([26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md)); review gates
([30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)).

## 3. Scope

**In scope**

- All hand-authored TypeScript/TSX/CSS under `src/**`, `scripts/**`, and `figma/plugin/src/**`.
- The five-file component anatomy (`<Name>.meta.ts`, `.tsx`, `.css`, `.stories.tsx`, `index.ts`).
- Shared abstractions in `src/core/`, `src/hooks/index.ts`, `src/utils/` and their reuse.
- Cleanliness of the build scripts (`build-tokens.ts`, `build-manifest.ts`, `build-catalog.ts`,
  `lib/css-bindings.ts`).

**Out of scope**

- Generated artifacts — `figma/tds.plugin.json`, `src/generated/design-system.manifest.json`,
  `src/tokens/generated/*`, `figma/plugin/code.js` — are outputs, not authored code. Clean them by
  cleaning their **source**.
- Backend/API/database code — **PLANNED**; no backend, Supabase, or server exists today. Clean-code
  rules for that layer are described where it is specified ([16_NODE_GUIDE.md](./16_NODE_GUIDE.md),
  [15_API_GUIDE.md](./15_API_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md)) and open with a
  PLANNED banner.
- Unit/e2e test cleanliness — **PLANNED**; there is no `vitest`/`jest`/`playwright` config or
  `*.test.tsx` today. The only executable gate is the headless plugin harness
  (`figma/plugin/test/harness.ts`, run via `npm run plugin:test`). See [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md).

## 4. Rules

Numbered, enforceable, MUST/SHOULD/NEVER. Each ties to a real mechanism in this repo.

**Purity & metas**

1. **MUST** keep every `*.meta.ts` React/CSS-free. NEVER `import React`, JSX, a `.css`, or anything
   under an alias in a meta. **MUST** use **relative imports only** (e.g. `../../../core/defineComponent`)
   so Node/`tsx` can import it in `build-manifest.ts` and `build-catalog.ts`.
2. **MUST** make metas pure data: no side effects, no runtime environment reads, no `Date.now()`, no
   random. A meta is a value, not a program. Determinism keeps `ds:build` reproducible.
3. **MUST** wrap every exported meta in `defineComponentMeta(...)` so labels are filled and
   `isComponentSet` is derived once, centrally — never hand-set `isComponentSet` or hand-title `label`.

**Reuse & duplication**

4. **MUST** consult [docs/COMPONENTS.md](../COMPONENTS.md) (and, for AI agents,
   [.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json)) before building any UI. If a component
   fits, **reuse it**. Creating a near-duplicate of an existing atom/molecule/organism is a defect.
5. **MUST** import components only from the single barrel `@/components`. NEVER deep-path
   (`@/components/atoms/Button/Button`) — deep paths fork the public surface and defeat tree-shaking.
6. **MUST** reuse shared primitives instead of re-implementing them: `cx` (`src/utils/cx.ts`),
   `mergeRefs` (`src/utils/index.ts`), and the hooks `useControllableState`, `useOnClickOutside`,
   `useKeyDown`, `useMediaQuery`, `useDisclosure`, `useFocusTrap` (`src/hooks/index.ts`). NEVER write a
   local click-outside listener, key handler, or `classNames` join.
7. **SHOULD** wrap form inputs in `FormField` for the standard label + error/help pattern rather than
   re-assembling label/error markup per component.

**Single source of truth / generate-not-handwrite**

8. **NEVER** hand-edit generated outputs: `figma/tds.plugin.json`,
   `src/generated/design-system.manifest.json`, `src/tokens/generated/{tokens.css,figma.tokens.json,token-ids.ts}`,
   `figma/plugin/code.js`. To change output, change the **source** (`*.meta.ts`, `src/tokens/*`, or a
   `scripts/*`) and re-run the relevant build.
9. **NEVER** hardcode a color, spacing, radius, or shadow in CSS. **MUST** use `var(--tds-*)` tokens
   only. A literal `#3B82F6` or `12px` is dead-on-arrival design drift.
10. **MUST** express variants on the DOM via `toDataAttrs(meta, {...})` so every axis lands as
    `data-<axis>`. NEVER hand-write `data-variant="solid"` string literals in TSX — they will silently
    diverge from `meta.variantProps`.
11. **MUST** treat token ids as the naming source: dot-notation id (`color.bg.default`) → CSS var
    (`--tds-color-bg-default`) → Figma var (`color/bg/default`). NEVER invent a fourth spelling.

**Dead code & size**

12. **NEVER** leave unused imports, locals, or params — `tsc` fails the build under `noUnusedLocals`
    and `noUnusedParameters`. Prefix an intentionally-unused param with `_`.
13. **MUST** keep every non-component module exporting only what is imported elsewhere; unreferenced
    exports are dead code. **SHOULD** keep component files exporting components only (react-refresh
    boundary) — move constants/helpers to `utils/`, `core/`, or a `*.meta.ts`.
14. **SHOULD** keep functions small and single-purpose (see `toDataAttrs`, `defaultsFromMeta`,
    `variantCount` in `src/core/defineComponent.ts` — each does exactly one thing). A meta that needs a
    comment to explain _what_ it is is usually too clever; simplify the data.

**Readability parity**

15. **MUST** name so the meta, CSS, and Figma agree: a `variant` option `solid` must be the CSS
    `[data-variant='solid']` selector and the Figma variant value `solid`. Divergent names are a
    correctness bug, not a taste issue.
16. **SHOULD** prefer explaining _why_ in a comment over restating _what_; the `ComponentMeta` type in
    `src/core/types.ts` is the canonical example of documenting the mapping intent, not the mechanics.

## 5. Workflow

Clean code is enforced by running the real pipeline, not by inspection alone.

1. **Reuse pass (before writing).** Search [docs/COMPONENTS.md](../COMPONENTS.md); for AI agents load
   [.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json) instead of opening 60 source files
   (see [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md)). Confirm no existing component, hook,
   or util already does the job. If one does, stop — reuse it.

2. **Author against the abstraction.** Import from `@/components`; pull hooks from `@/hooks`; use `cx`
   and `mergeRefs` from `@/utils`. Keep the `*.meta.ts` pure and relative-imported. Style with
   `var(--tds-*)` only; carry variants with `toDataAttrs(meta, {...})`.

3. **Lint + format.** `npm run lint` (eslint flat config: js recommended + typescript-eslint +
   react-hooks + react-refresh + storybook) and `npm run format` (prettier: semi, singleQuote,
   trailingComma all, printWidth 100). Dead code, hooks-rule violations, and non-component exports
   surface here.

4. **Type-check via build.** `npm run build` (`tsc -b && vite build`) enforces `strict`,
   `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, and consistent-type-imports.

5. **Regenerate — never edit outputs.** `npm run ds:build` (`tokens:build && manifest:build &&
   catalog:build`) rewrites `src/tokens/generated/*`, `src/generated/design-system.manifest.json`,
   `figma/tds.plugin.json`, and `docs/COMPONENTS.md` from source.

6. **Prove parity.** `npm run figma:build` (`ds:build && plugin:typecheck && plugin:build &&
   plugin:test`). The headless harness (`figma/plugin/test/harness.ts`) asserts coverage and
   `process.exit(1)` on mismatch — the executable definition of "the code and Figma still agree."

7. **Reconcile manifests.** Update the relevant `.ai/*` manifests
   ([27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md)) and `.ai/CHANGELOG.md`; they are a
   regenerated cache, never a second source of truth.

## 6. Examples

**Clean meta (pure, relative imports, `defineComponentMeta`)**

```ts
// src/components/atoms/Button/Button.meta.ts  — no React, no CSS, relative imports only
import { defineComponentMeta } from '../../../core/defineComponent';

export const buttonMeta = defineComponentMeta({
  name: 'Button',
  slug: 'button',
  category: 'atom',
  description: 'Primary action trigger.',
  variantProps: [
    { name: 'type', label: 'Type', options: ['A', 'B', 'C'], default: 'A' }, // layout preset
    { name: 'variant', label: 'Style', options: ['solid', 'outline', 'ghost'], default: 'solid' },
    { name: 'tone', options: ['brand', 'neutral', 'danger'], default: 'brand' },
    { name: 'size', options: ['sm', 'md', 'lg'], default: 'md' },
  ],
  states: ['default', 'hover', 'active', 'focus', 'disabled', 'loading'],
});
```

**Clean component (barrel-free internals, `toDataAttrs`, `cx`, token CSS)**

```tsx
// Button.tsx — variants via toDataAttrs, classes via cx, zero string-literal data-attrs
import { forwardRef } from 'react';
import { cx } from '@/utils';
import { toDataAttrs } from '@core/defineComponent';
import { buttonMeta } from './Button.meta';
import './Button.css';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, tone, size, className, ...rest }, ref,
) {
  return (
    <button
      ref={ref}
      className={cx('tds-button', className)}
      {...toDataAttrs(buttonMeta, { variant, tone, size })}
      {...rest}
    />
  );
});
```

```css
/* Button.css — tokens only, selectors mirror meta option names */
.tds-button { border-radius: var(--tds-radius-control); padding: 0 var(--tds-space-4); }
.tds-button[data-variant='solid'][data-tone='brand'] { background: var(--tds-color-brand-solid); }
```

**Duplication smell → clean fix**

```tsx
// ❌ dead + duplicated: hand-rolled click-outside, hardcoded color, deep import, string data-attr
import { Button } from '@/components/atoms/Button/Button';
useEffect(() => { const h = (e) => {/* ... */}; document.addEventListener('mousedown', h); }, []);
<div data-variant="solid" style={{ background: '#3B82F6' }} />

// ✅ reuse the hook, the barrel, the token, and toDataAttrs
import { Button } from '@/components';
import { useOnClickOutside } from '@/hooks';
useOnClickOutside(ref, close);
<div className="tds-panel" {...toDataAttrs(meta, { variant: 'solid' })} />
```

**Generate-not-handwrite**

```bash
# ❌ never open figma/tds.plugin.json or src/tokens/generated/tokens.css and edit a value
# ✅ change the source, then rebuild:
#    edit src/tokens/semantic.ts   ->  npm run ds:build  ->  npm run figma:build
```

## 7. Validation Rules

Compliance is machine-checked wherever possible:

- **Lint:** `npm run lint` — react-hooks rules, react-refresh (only-export-components), storybook, and
  typescript-eslint catch dead exports, bad hook usage, and unused symbols.
- **Type-check/build:** `npm run build` (`tsc -b`) — `strict`, `noUnusedLocals`,
  `noUnusedParameters`, `verbatimModuleSyntax` fail the build on dead code and inconsistent type imports.
- **Format:** `npm run format` (prettier) — deterministic layout; a diff here means unformatted code.
- **Generate parity:** `npm run ds:build` then `git diff --exit-code` on `figma/`,
  `src/generated/`, `src/tokens/generated/`, `docs/COMPONENTS.md`. A non-empty diff means someone
  hand-edited an output or forgot to rebuild.
- **Structural parity:** `npm run plugin:test` (`figma/plugin/test/harness.ts`) — asserts the bundle
  reproduces every component set/variant; exits non-zero on mismatch. This is the closest thing to a
  "tests pass" gate today.
- **Meta purity (manual/review):** grep a `*.meta.ts` for `react`, `import '@`, or `.css` — any hit is
  a violation ([30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)).
- **Token-only CSS (manual/review):** grep component CSS for hex/`rgb(`/raw `px` on
  color/spacing/radius — any literal is design drift.

## 8. Checklist

- [ ] Searched [docs/COMPONENTS.md](../COMPONENTS.md) / `.ai/COMPONENT_INDEX.json`; confirmed no reuse fit exists.
- [ ] Imported components from `@/components` only (no deep paths); reused `cx`, `mergeRefs`, and `@/hooks`.
- [ ] `*.meta.ts` is React/CSS-free, side-effect-free, relative-imports-only, wrapped in `defineComponentMeta`.
- [ ] Variants carried via `toDataAttrs(meta, {...})`; no string-literal `data-*`.
- [ ] CSS uses `var(--tds-*)` exclusively; no hardcoded color/spacing/radius/shadow.
- [ ] No unused imports/locals/params; component files export components only.
- [ ] No generated file hand-edited (`figma/`, `src/generated/`, `src/tokens/generated/`, `code.js`).
- [ ] `npm run lint` + `npm run build` clean; `npm run ds:build` produces no unexpected diff.
- [ ] `npm run figma:build` (incl. `plugin:test`) passes.
- [ ] `.ai/*` manifests + `.ai/CHANGELOG.md` reconciled.

## 9. Failure Recovery

| Symptom | Diagnosis | Fix | Resume |
| --- | --- | --- | --- |
| `build-manifest.ts`/`build-catalog.ts` throws importing a meta | The meta imported React, CSS, or an alias, or has a side effect | Strip to pure data; use relative imports only; wrap in `defineComponentMeta` | Re-run `npm run ds:build` |
| `git diff` dirty on `figma/` or `src/tokens/generated/` after `ds:build` | An output was hand-edited, or source changed without rebuild | Revert the generated file; make the change in source; rebuild | `npm run figma:build` |
| `tsc` fails `noUnusedLocals`/`noUnusedParameters` | Dead code left behind | Delete the symbol or prefix an intentionally-unused param with `_` | `npm run build` |
| eslint react-refresh error | A component file also exports a non-component | Move constants/helpers to `utils/`, `core/`, or the `*.meta.ts` | `npm run lint` |
| Figma variant name ≠ CSS selector ≠ meta option | Naming divergence (readability-parity break) | Align all three to the single meta option string | `npm run plugin:test` |
| `plugin:test` exits non-zero | Source and bundle disagree (missing/extra variant) | Fix the meta/token source; never patch `figma/tds.plugin.json` | `npm run figma:build` |
| A near-duplicate component appears in review | Reuse pass skipped | Delete the duplicate; adopt the existing catalog component | Re-run reuse pass, rebuild catalog |

## 10. Dependencies

- **Constitution & precedence:** [00_MASTER_RULES.md](./00_MASTER_RULES.md).
- **Syntax rules this doc assumes:** [19_CODE_CONVENTION.md](./19_CODE_CONVENTION.md).
- **What clean applies to:** [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md),
  [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md),
  [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md).
- **Reuse-first & frugality:** [docs/COMPONENTS.md](../COMPONENTS.md),
  [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md),
  [.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json).
- **Verification & governance:** [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md),
  [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md),
  [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md),
  [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md).
- **Real code touchstones:** `src/core/defineComponent.ts`, `src/core/types.ts`, `src/utils/cx.ts`,
  `src/utils/index.ts`, `src/hooks/index.ts`, `scripts/build-manifest.ts`, `scripts/build-catalog.ts`.

## 11. Template

Copy-paste review checklist for a clean-code pass on any change (paste into the PR / `.ai/REVIEW_REPORT.md`):

```md
### Clean-code pass — <change name>
- Reuse: searched COMPONENTS.md / COMPONENT_INDEX.json → [reused X | no fit, justified below]
- Imports: from @/components barrel only; hooks/utils reused (cx, mergeRefs, use*) → [ ]
- Meta purity: React/CSS-free, relative imports, defineComponentMeta wrap → [ ]
- Variants: toDataAttrs used; no literal data-* → [ ]
- Styling: var(--tds-*) only; no hardcoded color/space/radius/shadow → [ ]
- Dead code: no unused imports/locals/params; component-only exports → [ ]
- Generated: no hand-edit of figma/ | src/generated/ | src/tokens/generated/ | code.js → [ ]
- Gates: lint ✓ build ✓ ds:build (no stray diff) ✓ figma:build/plugin:test ✓
- Manifests: .ai/* + CHANGELOG.md reconciled → [ ]
- Naming parity: meta option == CSS selector == Figma variant value → [ ]
```

## 12. Future Extension

- **Automated purity linting.** A **PLANNED** custom eslint rule (or a `no-restricted-imports` config)
  can forbid `react`/alias/`.css` imports inside `*.meta.ts` and ban deep `@/components/*` paths,
  turning rules 1, 5, and 10 into hard lint failures rather than review conventions.
- **Generated-file guard in CI.** A **PLANNED** CI job ([25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)) can
  run `ds:build` and fail on any `git diff` in `figma/`/`src/generated/`/`src/tokens/generated/`,
  mechanically enforcing generate-not-handwrite for every PR.
- **Duplication detection at scale.** As the catalog grows past 60 components, a **PLANNED** similarity
  check over `componentMetas` (shared `variantProps`/`tags`) can flag likely duplicates before they
  merge, protecting the single source of truth at >10,000,000-user scale.
- **Backend clean-code parity (PLANNED).** When the Supabase/Node layer arrives
  ([16_NODE_GUIDE.md](./16_NODE_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md)), these same
  principles extend: pure data contracts (`ERD.json`, `API_SPEC.json`) as the single source, generated
  types over hand-written ones, and zero-duplication service helpers — with no design decision ever
  originating outside Storybook.
- **Dead-token pruning.** A **PLANNED** cross-reference of `token-ids.ts` against
  `scripts/lib/css-bindings.ts` output can report tokens no component binds, keeping the token registry
  free of dead code alongside the TypeScript layer.
