# 19 — Code Convention

- **Title:** Code Convention
- **Purpose:** Codify the exact TypeScript, React, and CSS conventions of the TDS repository — grounded in the real `eslint.config.js`, `.prettierrc.json`, and `tsconfig.*.json` — so every AI agent and human writes code that lints clean, formats identically, and preserves the metadata-driven pipeline.
- **Status:** ACTIVE
- **Owner:** AI OS
- **Last-reviewed:** _(placeholder — update on each review)_
- **Precedence:** Subordinate to [00_MASTER_RULES.md](./00_MASTER_RULES.md); the constitution and Design Lock Policy win on any conflict. This document governs *how code is written*. Component anatomy defers to [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md), tokens to [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md), variants to [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md), Storybook to [04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md), folder layout to [18_FOLDER_STRUCTURE.md](./18_FOLDER_STRUCTURE.md), and clean-code philosophy to [20_CLEAN_CODE.md](./20_CLEAN_CODE.md).

---

## 1. Purpose

This document is the **enforceable style contract** for all source code in `tds`. It exists so
that any agent — Claude Code, Gemini CLI, Cursor, Codex, Windsurf, an MCP agent — produces code
that is **indistinguishable** from what already exists across the 60 components. Consistency here
is not cosmetic: the metadata-driven pipeline (`*.meta.ts` → React + Storybook + manifest + Figma)
only stays coherent if every file obeys the same import discipline, the same `data-*` variant
mechanics, and the same token-only styling.

Every rule below maps to a **real mechanism in this repo**:

- **Formatting** is defined by [`.prettierrc.json`](../../.prettierrc.json) and enforced by
  `npm run format` / `npm run format:check`.
- **Linting** is defined by [`eslint.config.js`](../../eslint.config.js) (ESLint 9 flat config,
  `typescript-eslint`, `react-hooks`, `react-refresh`, `storybook`) and enforced by `npm run lint`.
- **Type rules** are defined by [`tsconfig.app.json`](../../tsconfig.app.json) and
  [`tsconfig.node.json`](../../tsconfig.node.json) (`strict`, `verbatimModuleSyntax`,
  `noUnusedLocals/Parameters`, path aliases) and enforced by `tsc -b` inside `npm run build` and
  `npm run plugin:typecheck`.

If a rule here ever disagrees with those files, **the config files win** and this doc is stale —
fix the doc, never loosen the config to match sloppy code.

## 2. Responsibilities

This spec is responsible for defining:

- **Naming** — files, folders, exports, meta objects, CSS classes, CSS custom properties, types.
- **Imports** — the barrel-only rule for components, alias usage (`@/`, `@core/`, `@components/`,
  `@tokens/`), relative-only `*.meta.ts`, and `import type` (type-imports) discipline.
- **React** — `forwardRef` pattern, prop-interface shape, default values, `data-*` via
  `toDataAttrs`, `cx` for class composition, hooks usage, controlled/uncontrolled state.
- **CSS** — `var(--tds-*)` token-only styling, BEM-ish class naming, `data-*` attribute selectors,
  the local `--component-*` knob pattern, zero hardcoded design values.
- **Stories** — CSF3 shape, `title` convention, `metaParameters`/`argTypesFromMeta`/`argsFromMeta`.
- **Formatting** — the exact Prettier settings and how they apply to `.ts`, `.tsx`, `.css`.

It is **not** responsible for: what a component *is* (see
[07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md)), which token to pick (see
[08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md)), or backend/API code style (PLANNED; see
§3 out-of-scope).

## 3. Scope

**In-scope**

- All `.ts` / `.tsx` under `src/`, `scripts/`, and `figma/plugin/src/`.
- All hand-authored `.css` under `src/components/**` and `src/styles/**`.
- All `*.stories.tsx` (CSF3) and `*.meta.ts` (pure data).

**Out-of-scope**

- **Generated files** — `src/tokens/generated/*`, `src/generated/design-system.manifest.json`,
  `figma/tds.plugin.json`, `figma/plugin/code.js`, `docs/COMPONENTS.md`. These are AUTO outputs;
  their style is the generator's concern. NEVER hand-edit them (Design Lock; see
  [00_MASTER_RULES.md](./00_MASTER_RULES.md)). ESLint already ignores `src/tokens/generated` and
  `figma/plugin/code.js`; Prettier ignores `src/tokens/generated` and all `*.md`
  ([`.prettierignore`](../../.prettierignore)).
- **Backend / API / database code style** — **PLANNED. No backend exists in the repo today.** When
  the Supabase/Node layer lands, its conventions live in [16_NODE_GUIDE.md](./16_NODE_GUIDE.md),
  [15_API_GUIDE.md](./15_API_GUIDE.md), and [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md); it MUST
  inherit the TS/Prettier/ESLint baseline defined here.
- Markdown/doc prose style — see [33_DOCUMENTATION_GUIDE.md](./33_DOCUMENTATION_GUIDE.md).

## 4. Rules

Rules are numbered and phrased **MUST / SHOULD / NEVER**. Each is enforceable by the mechanism named.

### 4.1 Formatting (Prettier — `.prettierrc.json`)

1. Code **MUST** be formatted by Prettier with the repo config exactly: `semi: true`,
   `singleQuote: true`, `trailingComma: "all"`, `printWidth: 100`, `tabWidth: 2`,
   `arrowParens: "always"`. Run `npm run format`; `npm run format:check` **MUST** pass.
2. Statements **MUST** end with semicolons. Strings **MUST** use single quotes (JSX attributes keep
   double quotes as Prettier emits them). Multi-line literals/calls **MUST** carry trailing commas.
3. Indentation **MUST** be 2 spaces — never tabs. Lines **SHOULD** wrap at 100 columns; let Prettier
   decide the break points rather than hand-wrapping.
4. Arrow functions **MUST** always parenthesise a single param: `(x) => …`, never `x => …`.
5. You **MUST NOT** hand-format to fight Prettier. If a construct formats awkwardly, restructure the
   code, do not add `// prettier-ignore` unless a generated/tabular literal genuinely needs it.

### 4.2 TypeScript (tsconfig + typescript-eslint)

6. `strict` is on and **MUST** stay satisfied — no implicit `any`, no unchecked null. Explicit `any`
   is **NEVER** allowed as a shortcut; prefer `unknown` + narrowing (see the `isDev()` pattern in
   `src/core/defineComponent.ts`).
7. `verbatimModuleSyntax` is on: type-only imports **MUST** use `import type` and type-only exports
   `export type`. ESLint's `@typescript-eslint/consistent-type-imports` (`prefer: 'type-imports'`)
   enforces this. Mixed value+type imports **MUST** split, e.g.:
   ```ts
   import { forwardRef } from 'react';
   import type { ButtonHTMLAttributes, ReactNode } from 'react';
   ```
8. `noUnusedLocals` / `noUnusedParameters` are on. Unused bindings **MUST** be removed. A deliberately
   unused param/var **MUST** be prefixed `_` (ESLint `argsIgnorePattern`/`varsIgnorePattern` = `^_`).
9. `noFallthroughCasesInSwitch` is on — every `switch` case **MUST** `break`/`return`.
10. Component prop shapes **MUST** be declared as an exported `interface XProps` and **SHOULD**
    extend the native element attributes, `Omit`-ing conflicts (see `ButtonProps extends
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color' | 'type'>`). Public variant unions
    (`ButtonVariant`, `ButtonTone`, …) **MUST** be exported `type` aliases of string-literal unions.
11. `isolatedModules` + `moduleDetection: force` are on — every file is a module; do not rely on
    global/ambient cross-file state. `resolveJsonModule` is on, so JSON imports are typed.

### 4.3 Imports, aliases & the barrel

12. Consumers of components **MUST** import from the single public barrel `@/components` and
    **NEVER** deep-path into a component folder:
    ```ts
    import { Button, Card, Select } from '@/components'; // ✅
    import { Button } from '@/components/atoms/Button/Button'; // ❌ never
    ```
13. Aliases **MUST** be used over long relative chains in `.tsx`/runtime code: `@/*` → `src/*`,
    `@core/*` → `src/core/*`, `@components/*` → `src/components/*`, `@tokens/*` → `src/tokens/*`
    (declared identically in `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`,
    `.storybook/main.ts`). A component imports core helpers as `@core/defineComponent`, utils as
    `@/utils/cx`.
14. **`*.meta.ts` files MUST stay React-free, CSS-free, and use RELATIVE imports only** (e.g.
    `import { defineComponentMeta } from '../../../core/defineComponent';`). This is load-bearing:
    `src/components/metas.ts` is imported by the Node manifest generator
    (`scripts/build-manifest.ts`), so metas must never pull in a browser/React module. See
    [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md).
15. Within a component folder, sibling files **MUST** use relative imports (`./Button.meta`,
    `./Button.css`). The component's own `.css` is imported for side effect: `import './Button.css';`.
16. Import ordering **SHOULD** be: React → other externals → aliased internals (`@core`, `@/…`) →
    relative siblings → the side-effect CSS import last. Prettier does not reorder imports; keep this
    order by hand.

### 4.4 React components

17. Components that render a DOM element **MUST** be `forwardRef` with a **named** inner function so
    the displayName is stable in devtools and Storybook:
    ```ts
    export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(props, ref) { … });
    ```
18. Every variant prop **MUST** have a default in the destructure that equals its `*.meta.ts`
    `default` (e.g. `type = 'A', variant = 'solid', tone = 'brand', size = 'md', shape = 'rounded'`).
    Drift between the meta default and the code default is a bug.
19. Variant selections **MUST** be projected to the DOM via `toDataAttrs(meta, { … })` and spread onto
    the root element, so every axis becomes a `data-<axis>` attribute the Figma plugin can read. Do
    **NOT** hand-write `data-*` attributes for variant axes.
20. Class names **MUST** be composed with `cx` from `@/utils` (filters falsy, joins with spaces).
    `className` from props **MUST** be forwarded last so callers can extend. Extra rest props (`...rest`)
    **MUST** be spread onto the root for native attribute pass-through.
21. Hooks **MUST** obey `react-hooks` rules (enforced): call unconditionally at top level, complete
    dependency arrays. Reuse the shared hooks from `@/hooks` — `useControllableState`,
    `useOnClickOutside`, `useKeyDown`, `useMediaQuery`, `useDisclosure`, `useFocusTrap` — rather than
    re-implementing. Controlled/uncontrolled inputs **MUST** use `useControllableState`.
22. Files exporting React components are subject to `react-refresh/only-export-components` (warn):
    a `.tsx` component file **SHOULD** export components (constant exports like the meta re-export are
    allowed via `allowConstantExport`). Keep non-component helpers in `@/utils` or `@/hooks`.
23. Accessibility affordances **MUST** be preserved as written in existing components (e.g. Button's
    `aria-busy`, icon-only `aria-label` fallback, `disabled || loading`). Do not strip them. See
    [13_ACCESSIBILITY_SPECIFICATION.md](./13_ACCESSIBILITY_SPECIFICATION.md).

### 4.5 CSS

24. Styling **MUST** use only CSS custom-property tokens `var(--tds-*)`. Hardcoded colors, spacing,
    radii, shadows, font sizes, durations, or easings are **NEVER** allowed. The token id dot-notation
    maps to the CSS var by dashes: `color.bg.default` → `--tds-color-bg-default`, `space.4` →
    `--tds-space-4`.
25. Root class **MUST** be `tds-<component>` (e.g. `.tds-button`). Sub-parts use BEM-ish
    `tds-<component>__<part>` (`.tds-button__icon`, `.tds-button__label`); modifiers use
    `tds-<component>--<modifier>` (`.tds-button--full`).
26. Variant axes **MUST** be styled through `data-*` attribute selectors matching `toDataAttrs`
    output — `.tds-button[data-size='sm']`, `.tds-button[data-variant='outline']`,
    `.tds-button[data-tone='danger']`. Never key styling off an extra class for a variant axis.
27. Per-component "knob" custom properties **SHOULD** follow the local `--<component>-*` pattern,
    seeded from tokens on the root class and overridden per `data-*` selector (see Button's
    `--button-solid`, `--button-height`, `--button-radius`). This keeps state/variant rules terse and
    token-bound. Local knobs **MUST** resolve to `var(--tds-*)` values, never literals.
28. Interactive states **MUST** use standard selectors: `:hover:not(:disabled)`, `:active:not(:disabled)`,
    `:focus-visible` (focus ring via `--tds-focus-ring-*` / `--tds-color-border-focus`), `:disabled`,
    and `[data-loading]`. The `state` axis is **not** a Figma variant (policy in
    [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md)) — express it in CSS, not `data-state`.
29. CSS **MUST** be formatted by Prettier (`prettier --write "src/**/*.{ts,tsx,css}"`). 2-space indent,
    one declaration per line. Section dividers **SHOULD** use `/* -------- Name -------- */` comments
    as existing files do.

### 4.6 Stories (CSF3)

30. Every component **MUST** ship `X.stories.tsx` in CSF3 form: a default `meta` object typed
    `Meta<typeof X>` and named `StoryObj<typeof X>` exports.
31. `title` **MUST** be `"<Tier>/<Name>"` — `Atoms/…`, `Molecules/…`, `Organisms/…`. `tags` **MUST**
    include `'autodocs'`. `parameters`, `argTypes`, `args` **MUST** derive from the meta via
    `metaParameters(meta)`, `argTypesFromMeta(meta)`, `{ ...argsFromMeta(meta), … }` — never hand-list
    controls that the meta already describes. See [04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md).
32. Story-local inline styles **MUST** still use tokens (`gap: 'var(--tds-space-3)'`), matching the DOM
    styling rule — no hardcoded pixels in demo layout.

### 4.7 Naming summary

33. Files: component `PascalCase.tsx` + `PascalCase.meta.ts` + `PascalCase.css` +
    `PascalCase.stories.tsx` + `index.ts` in a `PascalCase/` folder. Meta export **MUST** be
    `camelCase` + `Meta` suffix (`buttonMeta`) and registered in `src/components/metas.ts`.
    Scripts and non-component modules use `kebab-case.ts` (`build-tokens.ts`, `css-bindings.ts`).
    Types/interfaces/components are `PascalCase`; functions/variables/hooks are `camelCase`
    (hooks prefixed `use`).

## 5. Workflow

Follow this order when writing or changing code; it mirrors the real npm scripts.

1. **Read first (reuse-first).** Consult [docs/COMPONENTS.md](../COMPONENTS.md) and the target
   `*.meta.ts` before touching source. Most tasks are edits/reuse, not new files.
2. **Write code to convention.** Apply §4: barrel imports, `import type`, `forwardRef`,
   `toDataAttrs`, `cx`, `var(--tds-*)` only, CSF3 stories.
3. **Format.** `npm run format` (writes `src/**/*.{ts,tsx,css}` + `scripts/**/*.ts`). Verify with
   `npm run format:check`.
4. **Lint.** `npm run lint` (`eslint .`). Fix every error; treat warnings (unused vars, non-type
   imports, react-refresh) as must-fix.
5. **Type-check.** `npm run build` runs `tsc -b` across `tsconfig.app.json` + `tsconfig.node.json`.
   Plugin code type-checks via `npm run plugin:typecheck`.
6. **Regenerate outputs if source changed.** If you changed a `*.meta.ts`, tokens, or a build script,
   run `npm run ds:build` (tokens → manifest → catalog). For Figma changes run `npm run figma:build`
   (`ds:build` → `plugin:typecheck` → `plugin:build` → `plugin:test`).
7. **Never touch generated files by hand** to fix lint/format — fix the source and re-run the build.

## 6. Examples

**A) Value + type import split (`verbatimModuleSyntax`, rule 7):**

```ts
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { buttonMeta } from './Button.meta';
import './Button.css';
```

**B) `forwardRef` + defaults matching the meta + `toDataAttrs` + `cx` (rules 17–20):**

```ts
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { type = 'A', variant = 'solid', tone = 'brand', size = 'md', shape = 'rounded',
    loading = false, disabled, className, children, ...rest },
  ref,
) {
  const dataAttrs = toDataAttrs(buttonMeta, { type, variant, tone, size, shape });
  return (
    <button
      ref={ref}
      className={cx('tds-button', className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...dataAttrs}
      {...rest}
    >
      {children}
    </button>
  );
});
```

**C) Token-only CSS with local knobs + `data-*` variant selectors (rules 24–28):**

```css
.tds-button {
  --button-solid: var(--tds-color-brand-solid);
  --button-height: var(--tds-size-control-md);
  --button-radius: var(--tds-radius-control);
  height: var(--button-height);
  border-radius: var(--button-radius);
}
.tds-button[data-size='sm'] {
  --button-height: var(--tds-size-control-sm);
}
.tds-button[data-variant='solid'] {
  background-color: var(--button-solid);
}
.tds-button:focus-visible {
  box-shadow: 0 0 0 var(--tds-focus-ring-width) var(--tds-color-border-focus);
}
```

**D) Pure-data meta with RELATIVE import only (rule 14):**

```ts
import { defineComponentMeta } from '../../../core/defineComponent';

export const buttonMeta = defineComponentMeta({
  name: 'Button',
  slug: 'button',
  category: 'atom',
  variantProps: [
    { name: 'variant', label: 'Style', options: ['solid', 'outline', 'ghost'], default: 'solid' },
  ],
  // …
});
```

**E) CSF3 story derived entirely from the meta (rules 30–32):**

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { buttonMeta } from './Button.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: metaParameters(buttonMeta),
  argTypes: argTypesFromMeta(buttonMeta),
  args: { ...argsFromMeta(buttonMeta), children: 'Button' },
};
export default meta;

type Story = StoryObj<typeof Button>;
export const Playground: Story = {};
```

**Anti-patterns (NEVER):**

```ts
import { Button } from '@/components/atoms/Button/Button'; // ❌ deep path (rule 12)
import { ReactNode } from 'react';                         // ❌ value import of a type (rule 7)
const cls = 'tds-button ' + className;                     // ❌ manual join, use cx (rule 20)
```
```css
.tds-button { background: #2563eb; padding: 8px; }         /* ❌ hardcoded, use var(--tds-*) (rule 24) */
```

## 7. Validation Rules

| Concern | Mechanism | Command |
| --- | --- | --- |
| Formatting exact | Prettier (`.prettierrc.json`) | `npm run format:check` |
| Lint / type-imports / unused / hooks | ESLint flat config | `npm run lint` |
| Strict types, `verbatimModuleSyntax`, no unused | `tsc -b` (app + node projects) | `npm run build` |
| Plugin TS conventions | `tsc -p figma/plugin/tsconfig.json` | `npm run plugin:typecheck` |
| Meta stays pure / manifest consistent | Node generator imports `metas.ts` | `npm run ds:build` |
| Figma bundle + coverage | headless harness (`figma/plugin/test/harness.ts`) | `npm run figma:build` |

- ESLint **MUST** report zero errors. The intentional warns (`consistent-type-imports`,
  `no-unused-vars`, `react-refresh/only-export-components`) **SHOULD** be zero on changed files.
- A PR/commit that fails `format:check`, `lint`, or `build` is non-compliant and **MUST NOT** merge
  (gate detailed in [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md), [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md)).
- Manual review checks the non-mechanical rules: barrel-only imports, meta purity, `var(--tds-*)`
  usage, `data-*` variant styling, `forwardRef` pattern.

## 8. Checklist

- [ ] Components imported from `@/components` only — no deep paths.
- [ ] Aliases (`@/`, `@core/`, `@components/`, `@tokens/`) used in runtime code.
- [ ] `*.meta.ts` is React/CSS-free with relative imports only.
- [ ] Type-only imports use `import type`; value+type imports are split.
- [ ] No `any`; no unused locals/params (or intentional `_`-prefixed).
- [ ] Component is `forwardRef` with a named inner function.
- [ ] Prop defaults equal the meta `default`s; variants projected via `toDataAttrs`.
- [ ] `className` composed with `cx` and forwarded; `...rest` spread on root.
- [ ] CSS uses `var(--tds-*)` only — zero hardcoded design values.
- [ ] Class naming `tds-<c>` / `tds-<c>__<part>` / `tds-<c>--<mod>`; variant styling via `data-*`.
- [ ] Story is CSF3, `title` = `Tier/Name`, `tags: ['autodocs']`, derived from meta helpers.
- [ ] `npm run format:check`, `npm run lint`, `npm run build` all pass.
- [ ] If source changed, `npm run ds:build` (or `figma:build`) re-run; no generated file hand-edited.

## 9. Failure Recovery

| Symptom | Diagnosis | Fix | Resume |
| --- | --- | --- | --- |
| `format:check` fails | File not Prettier-clean | `npm run format` | Re-run `format:check` |
| ESLint: "type-only import" warn | Value import of a type under `verbatimModuleSyntax` | Split into `import type { … }` | `npm run lint` |
| ESLint/tsc: unused var/param | `noUnusedLocals/Parameters` | Remove it, or prefix `_` if deliberate | `npm run build` |
| tsc: alias not found | Missing/misspelled path alias | Use declared alias; confirm it exists in `tsconfig.app.json` | `npm run build` |
| Manifest generator throws importing `metas.ts` | A `*.meta.ts` pulled in React/CSS or an alias | Make meta pure; relative imports only | `npm run ds:build` |
| Variant not appearing in Figma | Styled via class not `data-*`, or missing `toDataAttrs` | Route axis through `toDataAttrs` + `data-*` selector | `npm run figma:build` |
| Generated file shows unexpected diff | Someone hand-edited a generated output | Revert it; change the source, re-run the build | `npm run ds:build` |
| Storybook control missing | Story didn't derive from meta helpers | Use `argTypesFromMeta`/`argsFromMeta`/`metaParameters` | Reload Storybook |

If context is lost mid-task, rehydrate via [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md)
(`.ai/SESSION_SUMMARY.md`, `.ai/TASKS.json`) then re-run §5 from step 3.

## 10. Dependencies

- **Config sources:** [`eslint.config.js`](../../eslint.config.js),
  [`.prettierrc.json`](../../.prettierrc.json), [`.prettierignore`](../../.prettierignore),
  [`tsconfig.app.json`](../../tsconfig.app.json), [`tsconfig.node.json`](../../tsconfig.node.json),
  [`package.json`](../../package.json) scripts.
- **Code exemplars:** `src/core/defineComponent.ts` (`toDataAttrs`, `defineComponentMeta`),
  `src/core/storybook.ts` (`argTypesFromMeta`/`argsFromMeta`/`metaParameters`), `src/utils/cx.ts`,
  `src/hooks/index.ts`, `src/components/metas.ts` (registry), `src/components/index.ts` (barrel).
- **Sibling docs:** [00_MASTER_RULES.md](./00_MASTER_RULES.md),
  [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md),
  [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md),
  [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md),
  [04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md),
  [18_FOLDER_STRUCTURE.md](./18_FOLDER_STRUCTURE.md), [20_CLEAN_CODE.md](./20_CLEAN_CODE.md),
  [19_CODE_CONVENTION.md](./19_CODE_CONVENTION.md) is referenced by
  [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md), [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md),
  [39_AI_CHECKLIST.md](./39_AI_CHECKLIST.md).
- **Manifests:** conventions here are cached/validated against
  [.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json) and
  [.ai/PROJECT_MANIFEST.json](../../.ai/PROJECT_MANIFEST.json) (see
  [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md)).

## 11. Template

Copy-paste skeleton for a convention-compliant component `.tsx` (pair with the meta/css/story
templates in [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md)):

```ts
import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { widgetMeta } from './Widget.meta';
import './Widget.css';

export type WidgetVariant = 'solid' | 'outline';
export type WidgetTone = 'brand' | 'neutral';
export type WidgetSize = 'sm' | 'md' | 'lg';

export interface WidgetProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  variant?: WidgetVariant;
  tone?: WidgetTone;
  size?: WidgetSize;
  children?: ReactNode;
}

export const Widget = forwardRef<HTMLDivElement, WidgetProps>(function Widget(
  { variant = 'solid', tone = 'brand', size = 'md', className, children, ...rest },
  ref,
) {
  const dataAttrs = toDataAttrs(widgetMeta, { variant, tone, size });
  return (
    <div ref={ref} className={cx('tds-widget', className)} {...dataAttrs} {...rest}>
      {children}
    </div>
  );
});
```

```css
/* Widget.css */
.tds-widget {
  --widget-fill: var(--tds-color-brand-solid);
  --widget-pad: var(--tds-space-4);
  padding: var(--widget-pad);
  background-color: var(--widget-fill);
  border-radius: var(--tds-radius-control);
}
.tds-widget[data-tone='neutral'] {
  --widget-fill: var(--tds-color-neutral-solid);
}
.tds-widget[data-size='sm'] {
  --widget-pad: var(--tds-space-3);
}
```

## 12. Future Extension

- **Scale to more components/agents:** these rules are model-agnostic and encoded in config, so any
  new agent (Cursor/Codex/Windsurf/MCP) inherits them by running `lint`/`format`/`build`. As the
  catalog grows past 60, the conventions do not change — only the number of files obeying them.
- **PLANNED CI enforcement:** when CI lands ([25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)), a
  `.github` workflow SHOULD gate every PR on `format:check` + `lint` + `build` + `figma:build`,
  making these conventions blocking rather than advisory. **No CI exists in the repo today.**
- **PLANNED test-style conventions:** when a unit/interaction/e2e framework is adopted
  ([24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md)), test files (`*.test.ts` / `*.spec.ts`) MUST inherit
  the same Prettier/ESLint/strict-TS baseline; naming and colocation rules will extend this doc.
  **No test framework exists today** (the only automated check is the headless plugin harness).
- **PLANNED backend conventions:** the Supabase/Node/TS layer
  ([16_NODE_GUIDE.md](./16_NODE_GUIDE.md), [15_API_GUIDE.md](./15_API_GUIDE.md),
  [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md)) will reuse `strict` TS, `verbatimModuleSyntax`,
  and Prettier settings verbatim, adding server-specific rules there — never diverging from this
  baseline. Engineered for >10,000,000 users, the shared style keeps a single mental model across
  frontend and the future backend.
```
