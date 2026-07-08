# 09 — Variant Specification

> **Title:** Variant Specification
> **Purpose:** Define the canonical variant-axis model (`type` / `variant` / `tone` / `size` / `shape` / `state`), how `variantProps` and `componentProps` map to Figma Variant vs Component Properties, and the combinatorial-explosion / state-exclusion / type-split policies that keep the generated Figma library buildable.
> **Status:** ACTIVE
> **Owner:** AI OS
> **Last-reviewed:** _(placeholder — set on review)_
> **Precedence:** Subordinate to [00_MASTER_RULES.md](./00_MASTER_RULES.md). Where this doc touches design truth it defers to Storybook + the `*.meta.ts` sources (see [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md), [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md)). This doc is authoritative for the *shape and semantics of variant axes* and their Figma projection.

---

## 1. Purpose

Every TDS component declares its combinatorial surface once, as pure data, in `variantProps` and
`componentProps` inside its `X.meta.ts`. That single declaration drives four outputs at build time:
the React DOM (`data-*` attributes), Storybook controls (`argTypesFromMeta`), the manifest
(`src/generated/design-system.manifest.json`), and the Figma bundle (`figma/tds.plugin.json`).

This document specifies:

- the **six canonical axes** — `type`, `variant` (labelled **"Style"**), `tone`, `size`, `shape`,
  and `state` — their allowed values and their meaning;
- the split between **`variantProps` → Figma Variant Properties** (`VARIANT`) and
  **`componentProps` → Figma Component Properties** (`BOOLEAN | TEXT | INSTANCE_SWAP`);
- the **state-axis-exclusion policy** and why the `state` axis is deliberately kept out of the
  Figma variant matrix (`Button` alone would reach 4,050+ variants);
- the **type-preset set-splitting** rule that emits one Component Set per `A`/`B`/`C` layout preset
  (e.g. `A Type - Card`).

It exists so any AI agent can add or edit a variant axis without guessing, and without exploding the
plugin's headless build ([06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md)).

## 2. Responsibilities

This specification is responsible for:

1. Naming and fixing the meaning of the six axes so no agent renames or repurposes them.
2. Defining the `VariantProp` and `ComponentProp` data shapes (from `src/core/types.ts`) and their
   Figma projection performed by `scripts/build-manifest.ts`.
3. Governing how the **cartesian product** of `variantProps` becomes a Figma Component Set, and how
   `state` is excluded from that product.
4. Governing **type-split** — turning a `type: [A, B, C]` axis into three separate Component Sets.
5. Keeping the DOM (`toDataAttrs`), Storybook controls, manifest, and Figma bundle in lockstep so
   there is exactly one variant truth.

It is **not** responsible for the visual token values behind a variant (that is
[08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md)), nor for interaction-state *behaviour*
(that is [11_INTERACTION_SPECIFICATION.md](./11_INTERACTION_SPECIFICATION.md)).

## 3. Scope

**In-scope**

- The axis model: `type` (A/B/C layout preset), `variant`/"Style" (visual fill), `tone`, `size`,
  `shape`, `state`.
- `variantProps` vs `componentProps`; `VariantProp` / `ComponentProp` field semantics.
- Figma Variant Properties vs Component Properties mapping and `figmaType`.
- The combinatorial-explosion + state-exclusion policy; `disabled`/`loading` surviving as `BOOLEAN`.
- Type-preset Component-Set splitting (`<T> Type - <Name>`).
- `data-*` projection via `toDataAttrs`; default-variant ordering; `variantCount` /
  `figmaVariantCombinations`.

**Out-of-scope**

- Token values, collections, and CSS-var naming → [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md).
- Component anatomy, the 5-file layout, adding a component → [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md).
- The plugin algorithm that materialises variants in Figma → [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md), [05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md).
- State *behaviour*, focus, keyboard, motion → [11_INTERACTION_SPECIFICATION.md](./11_INTERACTION_SPECIFICATION.md), [10_ANIMATION_SPECIFICATION.md](./10_ANIMATION_SPECIFICATION.md).
- Any backend/DB/API concept — **not applicable**; there is no backend today (PLANNED, see [15_API_GUIDE.md](./15_API_GUIDE.md)).

## 4. Rules

Rules are enforceable via `npm run ds:build`, `npm run figma:build`, `npm run lint`, and the
headless harness (`figma/plugin/test/harness.ts`). MUST-violations break the build or the harness.

1. **The axis vocabulary is fixed.** Agents MUST use the exact axis names and values below and MUST
   NEVER rename, add synonyms, or repurpose an axis:
   - `type` — **layout preset**, values `A` / `B` / `C` (e.g. Button A label · B icon+label · C icon-only; Card A vertical · B horizontal · C overlay). Label defaults to `Type`.
   - `variant` — **visual fill**, MUST be labelled **`Style`** in the meta (`label: 'Style'`). Values are component-specific (e.g. Button `solid | outline | ghost | soft | link`; Card `elevated | outlined | filled`).
   - `tone` — semantic color role, values from `brand | neutral | success | warning | danger`.
   - `size` — `sm | md | lg`.
   - `shape` — `rounded | pill | square`.
   - `state` — one or more of `default | hover | active | focus | disabled | error | success | loading | readonly` (the `ComponentState` union in `src/core/types.ts`).
2. **Axes live in `variantProps`; toggles/slots live in `componentProps`.** A `VariantProp` MUST have
   `name`, `options[]`, and a `default` that is a member of `options` (a dev-mode `console.warn`
   fires otherwise in `defineComponentMeta`). A `ComponentProp` MUST carry a `figmaType` of
   `BOOLEAN`, `TEXT`, or `INSTANCE_SWAP`.
3. **`variantProps` → Figma Variant Properties.** Every `VariantProp` becomes a
   `figmaPropertyType: 'VARIANT'` entry and one axis of the Component Set matrix. Its Figma property
   name is `label ?? titleCase(name)` (so `variant` surfaces as **"Style"**).
4. **`componentProps` → Figma Component Properties.** Each `ComponentProp` becomes a `BOOLEAN`,
   `TEXT`, or `INSTANCE_SWAP` Figma Component Property — **never** a variant axis.
5. **`state` MUST NEVER be emitted as a Figma variant axis.** The `states: ComponentState[]` array is
   documented in the Component Set *description* only. `disabled` and `loading` survive as `BOOLEAN`
   `componentProps` when the component declares them. This is the state-exclusion policy (Rule §5,
   see `figmaPropertiesFor` in `scripts/build-manifest.ts`).
6. **Components with a `type` axis MUST be split** into one Component Set per option. The generated
   set name is `` `${opt} Type - ${meta.name}` `` (e.g. `A Type - Card`, `B Type - Card`,
   `C Type - Card`). Within each split set the `type` axis is *pinned* to that single option.
7. **The DOM MUST carry every axis.** Components MUST render variant selections through
   `toDataAttrs(meta, {...})`, emitting `data-<axis>` for every `variantProp`, defaulting missing
   values to the axis `default`. This is what makes the DOM Figma-legible.
8. **Composition, not multiplication of concepts.** `type` composes with `variant`/`tone`/`size`/
   `shape`; agents MUST NOT encode a size into a `variant` value or a tone into a `type` value.
   One concept per axis.
9. **Styling stays token-driven.** A variant MUST change appearance only through `var(--tds-*)`
   tokens and `tokenBindings`/CSS; hardcoded colors/spacing/radius are NEVER allowed
   (see [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md)).
10. **Generated variant output is sacred.** `figma/tds.plugin.json`,
    `src/generated/design-system.manifest.json`, and `docs/COMPONENTS.md` are AUTO outputs. Agents
    MUST NEVER hand-edit variant data there; change the `*.meta.ts` source and re-run `ds:build`.
11. **SHOULD keep axis cardinality lean.** Because Figma variants are the cartesian product of all
    axes, adding an axis or an option multiplies the set. Agents SHOULD prefer a `componentProp`
    (BOOLEAN/INSTANCE_SWAP) over a new axis when the distinction is a toggle or a slot, not a
    first-class style.

## 5. Workflow

Editing or adding a variant axis is a **source change that flows through the pipeline** — never a
manual edit of generated files.

1. **Read first, reuse first.** Consult [docs/COMPONENTS.md](../COMPONENTS.md) and
   [.ai/VARIANT_INDEX.json](../../.ai/VARIANT_INDEX.json) / [.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json)
   to confirm the axis/value does not already exist. Prefer extending an existing axis over inventing one.
2. **Edit the meta.** In the component's `X.meta.ts`, add or modify the `VariantProp` (axis) or
   `ComponentProp` (toggle/slot). Keep the meta React/CSS-free with relative imports only.
   Set `label: 'Style'` for the `variant` axis; set an accurate `default` inside `options`.
3. **Reflect the axis in the DOM.** Ensure the `.tsx` reads the new prop and passes it through
   `toDataAttrs(meta, { ...props })`; add the token-driven CSS for the new value in `X.css`.
4. **Register / regenerate.** The component is already in `src/components/metas.ts`; run
   `npm run ds:build` (`tokens:build && manifest:build && catalog:build`). `manifest:build`
   recomputes `variantAxes`, `figmaProperties`, `figmaVariantCombinations`, and — for `type` axes —
   the per-preset split sets.
5. **Verify the Figma projection.** Run `npm run figma:build` (`ds:build && plugin:typecheck &&
   plugin:build && plugin:test`). The headless harness asserts the plugin builds every Component Set
   from the manifest with no per-component code; a variant blow-up or missing axis fails
   `plugin:test` (non-zero exit).
6. **Confirm counts.** Check the console summary from `manifest:build` (total components, component
   sets, total Figma variants) and the per-component `figmaVariantCombinations`. A surprising jump
   signals an accidental new axis/option — reconcile before committing.
7. **Update manifests + docs.** Regenerate `docs/COMPONENTS.md` (part of `ds:build`) and reconcile
   [.ai/VARIANT_INDEX.json](../../.ai/VARIANT_INDEX.json) per [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md).

## 6. Examples

**6.1 A full axis set (`Button`, atom).** Five axes → the variant matrix; `state` is a separate
array; toggles/slots are `componentProps`:

```ts
// src/components/atoms/Button/Button.meta.ts (excerpt)
variantProps: [
  { name: 'type',    label: 'Type',  options: ['A', 'B', 'C'], default: 'A' },       // layout preset
  { name: 'variant', label: 'Style', options: ['solid','outline','ghost','soft','link'], default: 'solid' },
  { name: 'tone',    label: 'Tone',  options: ['brand','neutral','success','warning','danger'], default: 'brand' },
  { name: 'size',    label: 'Size',  options: ['sm','md','lg'], default: 'md' },
  { name: 'shape',   label: 'Shape', options: ['rounded','pill','square'], default: 'rounded' },
],
componentProps: [
  { name: 'children', type: 'text',   default: 'Button', figmaType: 'TEXT' },
  { name: 'loading',  type: 'boolean', default: false,    figmaType: 'BOOLEAN' },
  { name: 'disabled', type: 'boolean', default: false,    figmaType: 'BOOLEAN' },
  { name: 'iconStart',type: 'instanceSwap',               figmaType: 'INSTANCE_SWAP' },
],
states: ['default','hover','active','focus','disabled','loading'],
```

**6.2 What the manifest emits.** `figmaPropertiesFor` turns each `variantProp` into a `VARIANT`
property and each `componentProp` into its `figmaType`; **no `state` property is emitted**:

```jsonc
"figmaProperties": [
  { "propName": "type",    "name": "Type",  "figmaPropertyType": "VARIANT", "values": ["A","B","C"] },
  { "propName": "variant", "name": "Style", "figmaPropertyType": "VARIANT", "values": ["solid","outline","ghost","soft","link"] },
  { "propName": "tone",    "name": "Tone",  "figmaPropertyType": "VARIANT" },
  { "propName": "size",    "name": "Size",  "figmaPropertyType": "VARIANT" },
  { "propName": "shape",   "name": "Shape", "figmaPropertyType": "VARIANT" },
  { "propName": "loading",   "figmaPropertyType": "BOOLEAN" },
  { "propName": "disabled",  "figmaPropertyType": "BOOLEAN" },
  { "propName": "iconStart", "figmaPropertyType": "INSTANCE_SWAP" }
  // NOTE: no `state` VARIANT — excluded by policy; states live in the set description.
]
```

**6.3 Type-split.** Because `Button`/`Card` declare a `type` axis, `buildDef` runs once per option
and pins `type`. The manifest yields separate sets:

```
A Type - Card   (type pinned to A; variant × padding × radius product)
B Type - Card
C Type - Card
```

**6.4 The DOM projection.** `toDataAttrs(buttonMeta, { variant: 'outline' })` produces the full
combo (missing axes fall back to defaults), which the plugin reads to place a variant:

```html
<button data-type="A" data-variant="outline" data-tone="brand" data-size="md" data-shape="rounded">…</button>
```

**6.5 The exclusion math.** Emitting `state` would multiply every set by the state count.
`variantCount(buttonMeta)` (which *includes* `states`) is
`3 × 5 × 5 × 3 × 3 × 6 = 4,050`. Excluding `state`, `figmaVariantCombinations` for the whole (unsplit)
matrix is `3 × 5 × 5 × 3 × 3 = 675`, and after type-split each set is `5 × 5 × 3 × 3 = 225`. This is
exactly why the plugin stays buildable.

## 7. Validation Rules

| Check | Mechanism | Fails when |
| --- | --- | --- |
| Default ∈ options | `defineComponentMeta` dev-mode `console.warn` | a `VariantProp.default` is not in its `options` |
| Axis vocabulary | manual review + [39_AI_CHECKLIST.md](./39_AI_CHECKLIST.md) | an axis is renamed/repurposed or `variant` lacks `label: 'Style'` |
| Manifest regenerates | `npm run manifest:build` (`ds:build`) | metas don't compile or `variantAxes`/`figmaProperties` can't build |
| Token bindings valid | `validateTokenBindings` in `scripts/build-manifest.ts` | a variant `when{}` binding references an unknown token id |
| State exclusion holds | inspect emitted `figmaProperties` | any `figmaPropertyType: 'VARIANT'` with `propName: 'state'` appears |
| Type-split present | inspect manifest set names | a `type`-axis component is not split into `<T> Type - <Name>` sets |
| Plugin builds all sets | `npm run plugin:test` (`figma:build`) | the headless harness can't reproduce a set / coverage mismatch → `process.exit(1)` |
| Lint/format/types | `npm run lint`, `tsc -b`, `npm run plugin:typecheck` | code/style/type violations |

## 8. Checklist

- [ ] Axis uses a canonical name (`type`/`variant`/`tone`/`size`/`shape`/`state`) — nothing renamed.
- [ ] `variant` axis carries `label: 'Style'`.
- [ ] Every `VariantProp.default` is a member of its `options`.
- [ ] Toggles/text/icon slots are `componentProps` with the correct `figmaType`, not new axes.
- [ ] `state` is only in the `states` array — never in `variantProps`, never emitted as `VARIANT`.
- [ ] `disabled`/`loading` (if applicable) exist as `BOOLEAN` `componentProps`.
- [ ] The `.tsx` passes selections through `toDataAttrs`; each new value has token-driven CSS.
- [ ] Components with a `type` axis produce `<T> Type - <Name>` split sets.
- [ ] `npm run ds:build` then `npm run figma:build` both pass; `plugin:test` green.
- [ ] `figmaVariantCombinations` change is intentional and reviewed.
- [ ] Generated files (`figma/*`, `src/generated/*`, `docs/COMPONENTS.md`) were regenerated, not hand-edited.

## 9. Failure Recovery

- **Symptom:** Figma build stalls / later pages never render.
  **Diagnosis:** variant explosion — an axis or option was added, multiplying the cartesian product;
  or `state` leaked into `variantProps`.
  **Fix:** remove the offending axis/option or demote it to a `componentProp`; ensure `state` stays
  in the `states` array. **Resume:** `npm run figma:build`; confirm `plugin:test` passes.
- **Symptom:** dev console warns `variant "x" default "y" is not in options`.
  **Diagnosis:** `default` not a member of `options`.
  **Fix:** correct the `default` or add the value to `options` in the meta. **Resume:** `npm run ds:build`.
- **Symptom:** a `type`-axis component appears as one giant set instead of `A/B/C` splits.
  **Diagnosis:** the axis isn't literally named `type`, so `build-manifest.ts` doesn't split it.
  **Fix:** rename the axis to `type` with options `A`/`B`/`C`. **Resume:** `npm run manifest:build`.
- **Symptom:** `manifest:build` prints `unknown token` warnings for a variant `when{}` binding.
  **Diagnosis:** a `tokenBinding` references a token id absent from the registry.
  **Fix:** use a valid `var(--tds-*)`-backed token id (see [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md)).
  **Resume:** `npm run ds:build`.
- **Symptom:** Storybook control missing for a new axis.
  **Diagnosis:** `argTypesFromMeta` reads `variantProps`; the axis wasn't added there (or was added
  as a raw React prop). **Fix:** declare it as a `VariantProp`. **Resume:** `npm run storybook`.

## 10. Dependencies

**Sibling docs:** [00_MASTER_RULES.md](./00_MASTER_RULES.md) ·
[03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md) · [04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md) ·
[05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md) · [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md) ·
[07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md) · [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md) ·
[11_INTERACTION_SPECIFICATION.md](./11_INTERACTION_SPECIFICATION.md) · [10_ANIMATION_SPECIFICATION.md](./10_ANIMATION_SPECIFICATION.md) ·
[26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md) · [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md) ·
[39_AI_CHECKLIST.md](./39_AI_CHECKLIST.md).

**Manifests:** [.ai/VARIANT_INDEX.json](../../.ai/VARIANT_INDEX.json) ·
[.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json) · [.ai/FIGMA_MAPPING.json](../../.ai/FIGMA_MAPPING.json).

**Source & scripts:** `src/core/types.ts` (`VariantProp`, `ComponentProp`, `ComponentState`,
`ALL_STATES`) · `src/core/defineComponent.ts` (`defineComponentMeta`, `toDataAttrs`,
`defaultsFromMeta`, `variantProp`, `variantCount`) · `src/core/storybook.ts`
(`argTypesFromMeta`, `argsFromMeta`, `docDescription`) · `scripts/build-manifest.ts`
(`figmaPropertiesFor`, `variantAxes`, `buildDef`, type-split) · `figma/plugin/src/components.ts`
(`cartesian`, `orderedOptions`, `buildVariant`) · `figma/plugin/test/harness.ts`. Generated outputs:
`src/generated/design-system.manifest.json`, `figma/tds.plugin.json`, `docs/COMPONENTS.md`.

## 11. Template

Copy-paste skeleton for the variant surface of a new/edited `X.meta.ts`:

```ts
import { defineComponentMeta } from '../../../core/defineComponent';

export const xMeta = defineComponentMeta({
  name: 'X',
  slug: 'x',
  category: 'atom', // 'atom' | 'molecule' | 'organism'
  description: 'One-line purpose.',
  tags: [],
  variantProps: [
    // Include a `type` axis ONLY when the component has distinct A/B/C layout presets.
    // { name: 'type',  label: 'Type',  options: ['A','B','C'],        default: 'A' },
    { name: 'variant', label: 'Style', options: ['solid', 'outline'], default: 'solid' }, // visual fill
    { name: 'tone',    label: 'Tone',  options: ['brand','neutral','success','warning','danger'], default: 'brand' },
    { name: 'size',    label: 'Size',  options: ['sm','md','lg'],     default: 'md' },
    { name: 'shape',   label: 'Shape', options: ['rounded','pill','square'], default: 'rounded' },
  ],
  componentProps: [
    // Toggles/slots — NEVER a new axis:
    { name: 'children', type: 'text',        default: 'X', figmaType: 'TEXT' },
    { name: 'disabled', type: 'boolean',     default: false, figmaType: 'BOOLEAN' },
    { name: 'iconStart',type: 'instanceSwap',              figmaType: 'INSTANCE_SWAP' },
  ],
  // States are documented, NOT emitted as a Figma variant axis:
  states: ['default', 'hover', 'focus', 'disabled'],
  figma: { layoutMode: 'HORIZONTAL', cornerRadius: 'radius.control', fill: 'color.brand.solid' },
});
```

DOM projection in `X.tsx`:

```tsx
import { toDataAttrs } from '@core/defineComponent';
// ...
<button {...toDataAttrs(xMeta, { variant, tone, size, shape })} />
```

## 12. Future Extension

- **New axes stay data-only.** Any future axis (e.g. `density`, `emphasis`) is added by extending
  `variantProps` — the manifest, Storybook controls, DOM, and Figma projection all follow with **no
  new per-component code**. Guard cardinality first (Rule §4.11) so the cartesian product stays sane.
- **Smarter splitting at scale.** Type-split keeps single sets small today; if any axis grows beyond
  Figma's practical variant ceiling, extend the split logic in `scripts/build-manifest.ts` to split
  on a second axis, or add a manifest-level cap surfaced by `plugin:test`.
- **State as an optional emitted axis.** The exclusion is a policy, not a limitation of the model.
  A future flag could opt specific components into emitting `state` as a `VARIANT` for a curated
  states subset — additive, behind review, never the default.
- **10M-user / multi-consumer readiness.** Because axes are pure data in a versioned manifest, the
  same variant contract can feed future consumers (MCP agents — [35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md),
  and any PLANNED backend-driven theming) without re-authoring components. Variant identity is stable
  across the fleet via [.ai/VARIANT_INDEX.json](../../.ai/VARIANT_INDEX.json), keeping token usage
  minimal ([26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md)).
