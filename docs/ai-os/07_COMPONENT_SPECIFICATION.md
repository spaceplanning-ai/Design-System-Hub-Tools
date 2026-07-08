# 07 — Component Specification

- **Title:** Component Specification
- **Purpose:** Define the anatomy, metadata model, authoring workflow, and reuse mandate for every TDS component so that one pure-data source drives React, Storybook, and Figma with zero drift.
- **Status:** ACTIVE
- **Owner:** AI OS
- **Last-reviewed:** _(placeholder — update on each review)_
- **Precedence:** Subordinate to [00_MASTER_RULES.md](./00_MASTER_RULES.md). On any conflict, the constitution and the Design Lock Policy win. This document governs component authoring; token rules defer to [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md), variant rules to [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md), Storybook to [04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md), and Figma to [05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md).

---

## 1. Purpose

TDS is a **metadata-driven** design system: each component ships a pure-data `X.meta.ts`
(`ComponentMeta`) that is the single source of truth feeding four outputs — the React
component, Storybook controls/autodocs/a11y, the generated manifest
(`src/generated/design-system.manifest.json`), and the Figma bundle (`figma/tds.plugin.json`).
**60 components already exist** (24 atoms, 27 molecules, 9 organisms). This document specifies:

- The **5-file anatomy** every component must follow.
- The **`ComponentMeta` model** and its `core/` helpers (`defineComponentMeta`, `toDataAttrs`, `defaultsFromMeta`, `variantCount`, `argTypesFromMeta`, `argsFromMeta`, `metaParameters`).
- How to **reuse** the catalog before building, how to **edit** safely, and how to **add** a component only when nothing fits.
- **Compound components** (e.g. `Card.Header`) and the barrel/registry wiring.

The overriding rule: **most tasks are reuse, not create.** Optimise the AI's tokens and the
system's consistency by reading [docs/COMPONENTS.md](../COMPONENTS.md) first.

## 2. Responsibilities

This spec is responsible for:

1. The contract that a TDS component = exactly **five files** in one folder, plus two registrations.
2. The field-by-field meaning of `ComponentMeta` (from `src/core/types.ts`) and how each field maps to React DOM, Storybook, and Figma.
3. The mandatory use of `toDataAttrs(meta, {...})` so every variant axis lands on the DOM as `data-<axis>` (Figma-legible).
4. The reuse-first mandate against the 60-component catalog and the single barrel `@/components`.
5. Keeping `.meta.ts` **React/CSS-free** with **relative imports only**, so `scripts/build-manifest.ts` and `scripts/build-catalog.ts` can import it from Node.

Out of responsibility (owned elsewhere): token authoring ([08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md)),
the full variant-axis taxonomy and state-exclusion rationale ([09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md)),
Storybook rulebook ([04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md)),
the plugin algorithm ([06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md)), and a11y depth ([13_ACCESSIBILITY_SPECIFICATION.md](./13_ACCESSIBILITY_SPECIFICATION.md)).

## 3. Scope

**In scope**

- Component folder layout under `src/components/{atoms,molecules,organisms}/<Name>/`.
- The five files: `<Name>.meta.ts`, `<Name>.tsx`, `<Name>.css`, `<Name>.stories.tsx`, `index.ts`.
- The `ComponentMeta` shape and every `core/` helper that consumes it.
- Registration: `src/components/metas.ts` registry and the tier barrels + public barrel `src/components/index.ts`.
- Compound (sub-part) components and slot props (`ReactNode` / `INSTANCE_SWAP`).
- The `catalog:build` / `manifest:build` / `ds:build` pipeline as it pertains to components.

**Out of scope**

- Backend components, data fetching, or server code — **PLANNED**, no backend exists today (see [15_API_GUIDE.md](./15_API_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md)).
- Unit/interaction test files — **PLANNED**; there is no `vitest`/`jest`/`playwright` config and no `*.test.tsx` today. The only executable gate is the headless plugin harness (`figma/plugin/test/harness.ts`, run via `npm run plugin:test`). See [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md).
- New tokens (change `src/tokens/*` per [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md)).

## 4. Rules

Numbered, enforceable. **MUST / SHOULD / NEVER.**

1. **MUST reuse first.** Before authoring any UI, read [docs/COMPONENTS.md](../COMPONENTS.md). If a component (or a variant of one) fits, use it. NEVER duplicate an existing component under a new name.
2. **MUST import from the single barrel** `@/components`. NEVER deep-path (`@/components/atoms/Button/Button`). Consumers: `import { Button, Card, Dropdown, Select } from '@/components';`.
3. **MUST ship exactly 5 files** per component in its own folder: `<Name>.meta.ts`, `<Name>.tsx`, `<Name>.css`, `<Name>.stories.tsx`, `index.ts`.
4. **`.meta.ts` MUST stay React/CSS-free** and use **relative imports only** (e.g. `import { defineComponentMeta } from '../../../core/defineComponent';`). It is imported from Node by the build scripts and from the browser by Foundations docs — any React/CSS/alias import breaks that. NEVER `import './X.css'` or JSX in a meta.
5. **MUST wrap the meta in `defineComponentMeta({...})`.** This fills variant `label`s (title-cased), derives `isComponentSet`, and dev-warns when a variant `default` is not in its `options`.
6. **MUST map variants to the DOM with `toDataAttrs(meta, {...})`** — spread the result on the root element so every axis renders as `data-<axis>`. NEVER hand-write `data-*` for variant axes; the plugin reads these to place Figma variants.
7. **MUST be token-only in CSS:** `var(--tds-*)` custom properties exclusively. NEVER hardcode a color, spacing, radius, shadow, or duration. Token id dot-notation maps to `--tds-<dashes>` (`color.bg.default` → `--tds-color-bg-default`).
8. **MUST use `forwardRef`** for focusable/interactive components and `cx` from `@/utils` for class composition. Extend the correct native attribute type (e.g. `ButtonHTMLAttributes<HTMLButtonElement>`), `Omit`-ing conflicting props (`color`, `type`).
9. **MUST wrap form inputs in `FormField`** for the standard label + error/help pattern (see the `FormField` molecule in the catalog).
10. **`type` axis = LAYOUT PRESET `A/B/C`** (e.g. Button A label · B icon+label · C icon-only; Card A vertical · B horizontal · C overlay). **`variant` (labelled "Style") = visual fill** (solid/outline/ghost/soft/link). They compose with `tone` / `size` / `shape`. NEVER conflate `type` and `variant`.
11. **State axis MUST NOT be emitted as a Figma variant.** Declare `states` for docs/CSS, but the manifest deliberately drops the `state` axis (combo explosion); `disabled`/`loading` survive as **BOOLEAN** component props. See `figmaPropertiesFor` in `scripts/build-manifest.ts` and [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md).
12. **MUST register the meta twice on add:** append to the correct array in `src/components/metas.ts` (`atomMetas` / `moleculeMetas` / `organismMetas`) **and** export the component from its tier barrel (`src/components/atoms/index.ts`, etc.).
13. **MUST classify `componentProps` `figmaType`** correctly: text → `TEXT`, boolean → `BOOLEAN`, slot → `INSTANCE_SWAP`. Slot props are typed `ReactNode` in `.tsx`.
14. **SHOULD express sub-parts as compound components** (`Card.Header`, `Card.Body`, `Card.Footer`, `Card.Media`) where the component has structural regions, rather than prop soup.
15. **MUST run `npm run ds:build`** after any meta/component change so the catalog, manifest, and Figma bundle are regenerated; run `npm run figma:build` before considering Figma-facing work done.
16. **MUST NOT hand-edit generated outputs:** `docs/COMPONENTS.md`, `src/generated/*`, `figma/tds.plugin.json`, `src/tokens/generated/*`. Change the source and rebuild ([00_MASTER_RULES.md](./00_MASTER_RULES.md), "generated is sacred").
17. **MUST NOT redesign.** Per the Design Lock ([03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md)), never change layout, spacing, color, radius, shadow, motion, or rename a component/variant/token on your own initiative. Visual change = an explicitly requested source change.

## 5. Workflow

### 5.1 Reuse (the default path)

1. Read [docs/COMPONENTS.md](../COMPONENTS.md) — every component with variants, props, one-line purpose.
2. If a fit exists, `import { X } from '@/components';` and compose. Done — no new files.
3. Only open a component's `.tsx` when the catalog can't answer an exact prop/sub-part question; its `.meta.ts` is the fastest source of truth for variants/props.

### 5.2 Edit an existing component

1. Change the **source**: `.meta.ts` (variants/props/tokens/a11y), `.tsx` (behaviour), `.css` (token bindings), and/or `.stories.tsx`.
2. If you changed variant axes, keep `.meta.ts`, `.tsx` (`toDataAttrs` + prop union types), and `.css` (`[data-<axis>='…']` selectors) **in lockstep**.
3. `npm run ds:build` → regenerates catalog + manifest + Figma bundle. Then `npm run lint` and (for Figma-facing changes) `npm run figma:build`.
4. Update `.ai` manifests per [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md) ([.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json), [.ai/VARIANT_INDEX.json](../../.ai/VARIANT_INDEX.json)).

### 5.3 Add a component (only when the catalog has no fit)

Follow README → *Adding a component* exactly:

1. `src/components/<tier>/<Name>/<Name>.meta.ts` — `defineComponentMeta({...})`, relative imports only, React/CSS-free.
2. `<Name>.tsx` (+ `<Name>.css`) — `forwardRef`, `cx`, `toDataAttrs(meta, {...})`, `var(--tds-*)` only.
3. `<Name>.stories.tsx` — CSF3, `title: 'Tier/Name'`, `tags: ['autodocs']`, `parameters: metaParameters(meta)`, `argTypes: argTypesFromMeta(meta)`, `args: { ...argsFromMeta(meta) }`.
4. `index.ts` — re-export the component, its prop/variant types, and the `*Meta`.
5. Register in `src/components/metas.ts` (`atomMetas`/`moleculeMetas`/`organismMetas`) **and** the tier barrel.
6. `npm run ds:build` — now in Storybook **and** the Figma manifest. See [38_AI_WORKFLOW.md](./38_AI_WORKFLOW.md).

### 5.4 How the meta reaches each output

- **React:** `.tsx` imports the meta and calls `toDataAttrs(meta, {...})`; defaults come from the prop signature (mirroring `variantProps[].default`).
- **Storybook:** `argTypesFromMeta(meta)` → controls; `argsFromMeta(meta)` → default args; `metaParameters(meta)` → autodocs description (`docDescription`) + a11y element selector.
- **Manifest / Figma:** `scripts/build-manifest.ts` reads `componentMetas`, builds one Component Set per `type` preset (`buildDef(meta, opt)` → e.g. "A Type - Card"), emits `variantAxes`, `figmaProperties`, `tokenBindings`, and the base `figma{}` frame — no per-component code.
- **Catalog:** `scripts/build-catalog.ts` scans every `*.meta.ts` and writes `docs/COMPONENTS.md`.

## 6. Examples

### 6.1 The meta (excerpt — `src/components/atoms/Button/Button.meta.ts`)

```ts
import { defineComponentMeta } from '../../../core/defineComponent'; // relative only, no alias

export const buttonMeta = defineComponentMeta({
  name: 'Button',
  slug: 'button',
  category: 'atom',
  description: 'Primary interactive control. Fully token-driven across five visual types…',
  tags: ['action', 'form', 'interactive'],
  variantProps: [
    { name: 'type', label: 'Type', options: ['A', 'B', 'C'], default: 'A',
      description: 'Content layout preset — A: label · B: icon + label · C: icon only.' },
    { name: 'variant', label: 'Style', options: ['solid', 'outline', 'ghost', 'soft', 'link'], default: 'solid' },
    { name: 'tone', label: 'Tone', options: ['brand', 'neutral', 'success', 'warning', 'danger'], default: 'brand' },
    { name: 'size', label: 'Size', options: ['sm', 'md', 'lg'], default: 'md' },
    { name: 'shape', label: 'Shape', options: ['rounded', 'pill', 'square'], default: 'rounded' },
  ],
  componentProps: [
    { name: 'children', type: 'text', default: 'Button', figmaType: 'TEXT' },
    { name: 'loading', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
    { name: 'disabled', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
    { name: 'iconStart', type: 'instanceSwap', figmaType: 'INSTANCE_SWAP' },
  ],
  states: ['default', 'hover', 'active', 'focus', 'disabled', 'loading'], // NOT a Figma variant axis
  tokens: [
    { property: 'background', token: 'color.brand.solid', when: { variant: 'solid', tone: 'brand' } },
    { property: 'corner-radius', token: 'radius.control' },
  ],
  a11y: { role: 'button', keyboard: ['Enter / Space: activate'] },
  figma: { layoutMode: 'HORIZONTAL', itemSpacing: 'space.2', paddingX: 'space.4',
    cornerRadius: 'radius.control', fill: 'color.brand.solid', height: 'size.control.md' },
});
```

### 6.2 The component (excerpt — `Button.tsx`)

```tsx
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { buttonMeta } from './Button.meta';
import './Button.css';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color' | 'type'> {
  type?: 'A' | 'B' | 'C';
  variant?: 'solid' | 'outline' | 'ghost' | 'soft' | 'link';
  tone?: 'brand' | 'neutral' | 'success' | 'warning' | 'danger';
  iconStart?: ReactNode; // INSTANCE_SWAP slot
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { type = 'A', variant = 'solid', tone = 'brand', size = 'md', shape = 'rounded', className, children, ...rest }, ref) {
  const dataAttrs = toDataAttrs(buttonMeta, { type, variant, tone, size, shape });
  return (
    <button ref={ref} className={cx('tds-button', className)} {...dataAttrs} {...rest}>
      {children}
    </button>
  );
});
```

### 6.3 The CSS is token + data-attr driven (excerpt — `Button.css`)

```css
.tds-button { border-radius: var(--button-radius); height: var(--button-height); }
.tds-button[data-size='lg'] { --button-height: var(--tds-size-control-lg); }
.tds-button[data-variant='solid'] { background-color: var(--button-solid); color: var(--button-on-solid); }
```

### 6.4 The story (excerpt — `Button.stories.tsx`)

```tsx
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';
import { buttonMeta } from './Button.meta';

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: metaParameters(buttonMeta),
  argTypes: argTypesFromMeta(buttonMeta),
  args: { ...argsFromMeta(buttonMeta), children: 'Button' },
};
export default meta;
export const Playground: StoryObj<typeof Button> = {};
```

### 6.5 Compound component (excerpt — `Card.tsx`)

```tsx
export function Card({ type = 'A', variant = 'elevated', ...rest }: CardProps) { /* … */ }
Card.Header = CardHeader; // title / subtitle / media / action slots
Card.Body = CardBody;
Card.Footer = CardFooter; // data-justify = start | between | end
Card.Media = CardMedia;   // data-ratio = auto | square | 4:3 | 16:9 | 3:2
```

### 6.6 The `index.ts` barrel and registration

```ts
// src/components/atoms/Button/index.ts
export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonTone, ButtonSize, ButtonShape } from './Button';
export { buttonMeta } from './Button.meta';

// src/components/atoms/index.ts   → export * from './Button';
// src/components/metas.ts         → atomMetas: [ …, buttonMeta ]
```

## 7. Validation Rules

Compliance is checked by these real mechanisms:

| Check | Command / mechanism | Catches |
| --- | --- | --- |
| Lint | `npm run lint` (`eslint .`) | deep-path imports, unused locals/params, react-hooks, `consistent-type-imports`. |
| Format | `npm run format` (`prettier --write …`) | single-quote, semi, printWidth 100, tabWidth 2. |
| Types | `npm run build` (`tsc -b && vite build`) | prop/variant union mismatches, missing exports, strict violations. |
| Meta validity | `defineComponentMeta` dev-warns when a variant `default` ∉ `options`; visible in `npm run storybook`. | invalid defaults. |
| Catalog | `npm run catalog:build` (in `ds:build`) — must list the component; `pickMeta` warns if no meta export is found in a `*.meta.ts`. | unregistered/mis-shaped meta. |
| Manifest | `npm run manifest:build` (in `ds:build`) — component must appear in `src/generated/design-system.manifest.json` and `figma/tds.plugin.json`. | missing registration in `metas.ts`. |
| Figma coverage | `npm run figma:build` → `plugin:typecheck` + `plugin:build` + `plugin:test` (headless `figma/plugin/test/harness.ts`, `process.exit(1)` on mismatch). | component not reproduced by the plugin. |
| Token binding | `scripts/lib/css-bindings.ts` PostCSS scan derives per-variant token bindings from CSS; unresolved token ids are dropped/warned in `build-manifest.ts`. | hardcoded values, unknown tokens. |

## 8. Checklist

Per-component (add or edit):

- [ ] Checked [docs/COMPONENTS.md](../COMPONENTS.md) — nothing existing fits (for a new component).
- [ ] Folder holds exactly 5 files: `.meta.ts`, `.tsx`, `.css`, `.stories.tsx`, `index.ts`.
- [ ] `.meta.ts` is React/CSS-free, relative imports only, wrapped in `defineComponentMeta`.
- [ ] `variantProps` use correct axis names (`type`=A/B/C preset, `variant`="Style", `tone`/`size`/`shape`); every `default` ∈ `options`.
- [ ] `componentProps` set correct `figmaType` (TEXT/BOOLEAN/INSTANCE_SWAP); `states` declared but not treated as a Figma axis.
- [ ] `.tsx` uses `forwardRef` (if interactive), `cx`, and `toDataAttrs(meta, {...})` on the root.
- [ ] `.css` uses only `var(--tds-*)`; variant selectors are `[data-<axis>='…']`.
- [ ] Story is CSF3 with `metaParameters` / `argTypesFromMeta` / `argsFromMeta`; `title: 'Tier/Name'`.
- [ ] Registered in `src/components/metas.ts` **and** the tier barrel (new components).
- [ ] `npm run ds:build` clean; `npm run lint` clean; `npm run figma:build` green for Figma-facing work.
- [ ] No generated file hand-edited; `.ai` manifests updated.

## 9. Failure Recovery

| Symptom | Diagnosis | Fix | Resume |
| --- | --- | --- | --- |
| `build-manifest`/`build-catalog` throws on import of a meta | `.meta.ts` imported React/CSS or used an alias (`@/…`) | Replace with relative imports; strip JSX/`import './x.css'` | Re-run `npm run ds:build` |
| Component missing from `docs/COMPONENTS.md` | not exported as a recognizable `*Meta` object (needs `name`+`category`+`variantProps`) | fix the exported meta object shape | `npm run catalog:build` |
| Component missing from Figma bundle | not added to an array in `src/components/metas.ts` | append to `atomMetas`/`moleculeMetas`/`organismMetas` | `npm run manifest:build` |
| `npm run figma:build` fails at `plugin:test` | plugin can't reproduce the component (missing token id, malformed axis) | verify token ids exist in `src/tokens/*`; check `figma{}` frame + `tokenBindings` | re-run `npm run figma:build` |
| Storybook control missing/wrong | axis absent from `variantProps`, or wrong `type` on a `componentProp` | fix the meta; controls derive from it via `argTypesFromMeta` | reload `npm run storybook` |
| Dev warning "default … not in options" | `variantProps[].default` ∉ `options` | correct the default or add the option | reload Storybook |
| Variant renders but Figma places wrong | DOM missing `data-<axis>` | ensure `toDataAttrs(meta, {...})` is spread on the root element | `npm run ds:build` |
| Import fails / circular | deep path or importing from the barrel inside a sibling | import via tier-relative path inside `src/components`, barrel `@/components` only from consumers | `npm run lint` |

Resume-after-context-loss: read [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md) and [.ai/TASKS.json](../../.ai/TASKS.json), then [.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json) per [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md).

## 10. Dependencies

- **Constitution / design lock:** [00_MASTER_RULES.md](./00_MASTER_RULES.md), [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md).
- **Sibling specs:** [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md), [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md), [04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md), [05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md), [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md), [13_ACCESSIBILITY_SPECIFICATION.md](./13_ACCESSIBILITY_SPECIFICATION.md), [18_FOLDER_STRUCTURE.md](./18_FOLDER_STRUCTURE.md), [19_CODE_CONVENTION.md](./19_CODE_CONVENTION.md), [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md), [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md), [33_DOCUMENTATION_GUIDE.md](./33_DOCUMENTATION_GUIDE.md), [38_AI_WORKFLOW.md](./38_AI_WORKFLOW.md), [39_AI_CHECKLIST.md](./39_AI_CHECKLIST.md).
- **Source files:** `src/core/types.ts` (`ComponentMeta`), `src/core/defineComponent.ts` (`defineComponentMeta`, `toDataAttrs`, `defaultsFromMeta`, `variantCount`), `src/core/storybook.ts` (`argTypesFromMeta`, `argsFromMeta`, `metaParameters`, `docDescription`), `src/components/metas.ts`, `src/components/index.ts`.
- **Scripts:** `scripts/build-catalog.ts`, `scripts/build-manifest.ts`, `scripts/lib/css-bindings.ts`.
- **Manifests:** [.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json), [.ai/VARIANT_INDEX.json](../../.ai/VARIANT_INDEX.json), [.ai/DEPENDENCY_GRAPH.json](../../.ai/DEPENDENCY_GRAPH.json).
- **Catalog:** [docs/COMPONENTS.md](../COMPONENTS.md) (generated).

## 11. Template

Copy-paste skeleton for a new atom `Widget` (adjust tier). Five files:

```ts
// src/components/atoms/Widget/Widget.meta.ts   (React/CSS-free, relative imports only)
import { defineComponentMeta } from '../../../core/defineComponent';

export const widgetMeta = defineComponentMeta({
  name: 'Widget',
  slug: 'widget',
  category: 'atom',
  description: 'One-line purpose.',
  tags: ['…'],
  variantProps: [
    { name: 'variant', label: 'Style', options: ['solid', 'outline'], default: 'solid' },
    { name: 'size', label: 'Size', options: ['sm', 'md', 'lg'], default: 'md' },
  ],
  componentProps: [{ name: 'children', type: 'text', default: 'Widget', figmaType: 'TEXT' }],
  states: ['default', 'hover', 'focus', 'disabled'],
  tokens: [{ property: 'background', token: 'color.brand.solid', when: { variant: 'solid' } }],
  a11y: { role: 'group' },
  figma: { layoutMode: 'HORIZONTAL', itemSpacing: 'space.2', paddingX: 'space.3',
    cornerRadius: 'radius.control', fill: 'color.bg.surface' },
});
```

```tsx
// src/components/atoms/Widget/Widget.tsx
import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { widgetMeta } from './Widget.meta';
import './Widget.css';

export interface WidgetProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'solid' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Widget = forwardRef<HTMLDivElement, WidgetProps>(function Widget(
  { variant = 'solid', size = 'md', className, children, ...rest }, ref) {
  return (
    <div ref={ref} className={cx('tds-widget', className)}
      {...toDataAttrs(widgetMeta, { variant, size })} {...rest}>
      {children}
    </div>
  );
});
```

```css
/* src/components/atoms/Widget/Widget.css  — var(--tds-*) only */
.tds-widget { padding-inline: var(--tds-space-3); border-radius: var(--tds-radius-control); }
.tds-widget[data-variant='outline'] { background: transparent; border: var(--tds-border-width-1) solid var(--tds-color-border-default); }
```

```tsx
// src/components/atoms/Widget/Widget.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Widget } from './Widget';
import { widgetMeta } from './Widget.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';

const meta: Meta<typeof Widget> = {
  title: 'Atoms/Widget',
  component: Widget,
  tags: ['autodocs'],
  parameters: metaParameters(widgetMeta),
  argTypes: argTypesFromMeta(widgetMeta),
  args: { ...argsFromMeta(widgetMeta) },
};
export default meta;
export const Playground: StoryObj<typeof Widget> = {};
```

```ts
// src/components/atoms/Widget/index.ts
export { Widget } from './Widget';
export type { WidgetProps } from './Widget';
export { widgetMeta } from './Widget.meta';
```

Then: `src/components/atoms/index.ts` → `export * from './Widget';`;
`src/components/metas.ts` → import `widgetMeta` and add to `atomMetas`; run `npm run ds:build`.

## 12. Future Extension

- **Scale of catalog:** the 5-file + registry pattern scales linearly; `build-catalog`/`build-manifest` recurse the tree, so N components stay token-cheap to index because agents read `docs/COMPONENTS.md` and [.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json), not source (see [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md)).
- **New tiers/domains:** additional categories beyond atom/molecule/organism would extend `Category` in `src/core/types.ts`, `CATEGORY_ORDER` in `build-catalog.ts`, and add a `*Metas` array in `metas.ts` — no per-component rework.
- **Data-bound components (PLANNED):** when the Supabase backend lands ([17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md), [15_API_GUIDE.md](./15_API_GUIDE.md)), presentational TDS components stay pure; data wiring will live in a separate feature/container layer so the design lock and the meta model remain untouched. `SocialLogin`/`SocialLoginButton` stay presentational until then.
- **Automated tests (PLANNED):** an interaction/visual/unit layer ([24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md)) will add `*.stories` play functions and snapshot gates; the headless plugin harness remains the structural-fidelity gate for >10M-user reproducibility.
- **MCP surface:** [35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md) exposes catalog/index reads so external agents reuse components without loading source, preserving consistency at fleet scale.
