# 05 — Figma Specification

> **Title:** Figma Specification
> **Purpose:** Define how the TDS Figma design system is produced as a faithful, pixel-perfect reproduction of Storybook — automatically, from the generated bundle `figma/tds.plugin.json`, with zero manual authoring.
> **Status:** ACTIVE (the plugin, its contract, and the headless harness all exist today).
> **Owner:** AI OS
> **Last-reviewed:** _<!-- YYYY-MM-DD placeholder — update on each review -->_
> **Precedence:** Subordinate to [00_MASTER_RULES.md](./00_MASTER_RULES.md). Figma is the **lowest** rung of the source-of-truth hierarchy (a reproduction; edits never flow back up). This document governs the *Figma output* only; the design truth it reproduces lives in Storybook + `*.meta.ts` + `src/tokens/*` and is specified by [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md) and [04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md). The plugin *mechanism* is specified by [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md).

---

## 1. Purpose

The Figma design system is a **downstream reproduction**, not a design surface. Its single job is to reconstruct — inside Figma — exactly what Storybook already renders: the same tokens, the same component sets, the same variants, the same spacing, radius, fills, shadows, and typography. Nothing in Figma is invented, beautified, or decided in Figma.

This document specifies the complete rulebook for that reproduction:

- **Everything in Figma MUST originate from Storybook** — expressed through the generated contract `figma/tds.plugin.json` = `{ tokens, design }`, which is itself derived from `src/tokens/*` and every component's `*.meta.ts`.
- **Manual editing of the Figma output is PROHIBITED.** A Figma file is a rebuildable artifact: to change it you change the source and re-run the pipeline. Hand-drawn frames, renamed variables, tweaked spacing, or "improved" colors made directly in Figma are drift and MUST be discarded on the next regeneration.
- The reproduction is achieved by **one Figma plugin** (`figma/plugin/`) that reads the bundle and iterates it — **no per-component code**. Its algorithm is fixed by [figma/README.md](../../figma/README.md) (the plugin contract) and enforced by the headless harness `figma/plugin/test/harness.ts`.

The outcome the AI OS guarantees: **perfect Storybook↔Figma sync, no design drift, no redesign**, at enterprise scale (60 components today, thousands of variants, extensible to far more).

## 2. Responsibilities

This specification is responsible for defining, unambiguously, how each Figma construct is produced from the bundle:

- **Variables & Collections & Modes** — the three ordered Variable collections (Primitives → Semantic → Theme), the Theme `light`/`dark` modes, alias resolution.
- **Styles** — Effect Styles (drop shadows) and Text Styles created from `tokens.effectStyles` / `tokens.textStyles`.
- **Component Sets & Variants** — how `design.components[]` become Component Sets, how `variantAxes` become the variant matrix, and the **state-axis exclusion** policy.
- **Auto Layout & Constraints** — how each base frame's `figma{}` block drives Auto Layout, padding, gap, radius, fill, alignment; which components are legitimately fixed-layout.
- **Tokens & token bindings** — how `tokenBindings[]` bind per-variant paints/dimensions to the Variables created earlier.
- **Icons** — how `INSTANCE_SWAP` slots instantiate the single shared, token-colored `Icon` primitive.
- **Documentation** — Pages, the Foundation showcase, the Cover, per-set descriptions (Composition + Accessibility).
- **Responsive / Motion / Interactions** — what is reproducible in Figma and what is deliberately *not* (with the honest reasons).
- **Naming** — the exact naming grammar for pages, variants, variables, and styles.
- **Plugin Mapping, Synchronization, Validation** — the field-by-field mapping table, the sync loop, and the gates that prove fidelity.

It is **not** responsible for: authoring design (that is Storybook), the plugin's internal implementation details (that is [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md)), or the token/variant models themselves ([08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md), [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md)).

## 3. Scope

**In-scope**

- The bundle contract `figma/tds.plugin.json` as the *sole* input to Figma reproduction.
- Mapping every bundle field to a concrete Figma construct (Variables, Modes, Styles, Component Sets, Variants, Auto Layout, properties, pages).
- The pixel-perfect + no-redesign mandate as it applies to Figma.
- The synchronization loop (`npm run ds:build` → `npm run figma:build`) and validation gates (`plugin:typecheck`, `plugin:build`, `plugin:test`).
- Rules for what Figma reproduces faithfully vs. what it deliberately omits (state axis, motion, most interactions).

**Out-of-scope**

- Designing or changing any visual attribute (that is a **source** change per [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md)'s Design Lock).
- The plugin's line-by-line code (`figma/plugin/src/*.ts`) — owned by [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md).
- Token authoring and CSS variable generation — [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md).
- Any backend/DB/API/CI. **PLANNED — none exists in the repo today**; no part of Figma reproduction depends on a server.

## 4. Rules

All rules are enforceable against the real bundle, the real plugin (`figma/plugin/src/`), and the real harness (`figma/plugin/test/harness.ts`). MUST = blocking; SHOULD = expected default; NEVER = prohibited.

### 4.0 The Prime Directive (Design Lock in Figma)

- **R0.1 (MUST)** Everything in the Figma file MUST originate from Storybook via `figma/tds.plugin.json`. If a construct cannot be traced to a bundle field, it MUST NOT exist in the output.
- **R0.2 (NEVER)** NEVER hand-edit the Figma output, and NEVER hand-edit the generated bundle `figma/tds.plugin.json`, `src/generated/design-system.manifest.json`, or `src/tokens/generated/*`. These are generated and **sacred** (see [00_MASTER_RULES.md](./00_MASTER_RULES.md)).
- **R0.3 (NEVER)** NEVER redesign, modernize, beautify, re-space, recolor, re-radius, re-shadow, re-type, or rename in Figma. Figma is a reproduction, never a redesign. Any visual change is a **source** change (`*.meta.ts` / `src/tokens/*` / component CSS) that flows through the pipeline (see [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md)).
- **R0.4 (MUST)** The plugin MUST be **idempotent and deterministic**: re-running it on the same bundle produces the same structure. Reproduction is throwaway — the truth is the bundle.

### 4.1 Collections

- **R1.1 (MUST)** Exactly **three** Variable collections MUST be created, in this order: **Primitives**, **Semantic**, **Theme**. Order matters — Semantic aliases resolve into Primitives, and Theme aliases resolve into Primitives; earlier collections MUST exist before later ones reference them.
- **R1.2 (MUST)** Collections MUST be created by iterating `tokens.collections[]` in bundle order (`figma.variables.createVariableCollection`). No collection may be added, merged, split, or reordered by hand.
- **R1.3 (MUST)** The harness check `collections: <got> / <cols.length>` MUST pass; the count is derived from the contract, never hardcoded.

### 4.2 Modes

- **R2.1 (MUST)** Each collection's modes MUST come from its `modes[]`. **Primitives** and **Semantic** carry the single mode `default`; **Theme** carries **`light`** and **`dark`** — in that order.
- **R2.2 (MUST)** The first (default) mode MUST be renamed from Figma's auto-created mode; additional modes are added with `addMode` (see `figma/plugin/src/variables.ts`). Mode names MUST match the bundle exactly (`light`, `dark`) — never `Light`, `Mode 2`, etc.
- **R2.3 (MUST)** Every variable MUST supply a value for **every** mode declared by its collection via `valuesByMode`. A Theme color variable MUST provide both a `light` and a `dark` value.

### 4.3 Variables

- **R3.1 (MUST)** Each variable MUST be created with the `figmaType` given in the bundle: `COLOR | FLOAT | STRING | BOOLEAN`.
- **R3.2 (MUST)** Variable `name` MUST use **slash notation** exactly as in the bundle (e.g. `color/bg/default`, `space/4`, `chart/1`). This is the Figma-side form of the dot-notation token id (`color.bg.default`); the CSS side uses `--tds-color-bg-default`. The three notations are equivalent views of one token id and MUST never diverge.
- **R3.3 (MUST)** Variable `scopes` MUST be set from the bundle (e.g. `TEXT_FILL`, `FRAME_FILL`, `CORNER_RADIUS`, `GAP`) so Figma offers each variable only where it is valid.
- **R3.4 (MUST)** `VARIABLE_ALIAS` values MUST be **resolved** against variables created in earlier collections (Semantic→Primitives, Theme→Primitives). An unresolved alias is a **blocking** failure — the harness fails on any warning matching `Unresolved alias|unknown mode|not found`.
- **R3.5 (MUST)** The harness checks `variables` (== total across collections) and `alias values resolved` (== count of `VARIABLE_ALIAS` mode-values in the contract) MUST both pass.
- **R3.6 (NEVER)** NEVER add, rename, retype, or re-scope a variable in Figma or in `figma/plugin/src/types.ts`. Types mirror the bundle verbatim.

### 4.4 Styles

- **R4.1 (MUST)** Effect Styles MUST be created from `tokens.effectStyles[]` as `DROP_SHADOW` (or `INNER_SHADOW`) with `color` as `rgba` in the **0..1** range, plus `offset`, `radius`, `spread`, `visible`, `blendMode` (`figma/plugin/src/styles.ts`). There are **6** effect styles (the shadow scale).
- **R4.2 (MUST)** Text Styles MUST be created from `tokens.textStyles[]` with `fontFamily`, `fontSize`, `fontWeight`, `lineHeightPercent`, and `letterSpacingEm`. There are **11** text styles.
- **R4.3 (MUST)** Style names MUST match the bundle. The harness checks `effect styles` and `text styles` counts against the contract; both MUST pass.
- **R4.4 (SHOULD)** When Figma cannot render a real font family, the plugin SHOULD fall back gracefully and emit **one** consolidated note (`flushFontNotes` in `figma/plugin/src/doc.ts`) — never silently substitute a different type scale.

### 4.5 Component Sets

- **R5.1 (MUST)** Each `design.components[]` entry with `isComponentSet: true` MUST become one Figma **Component Set** built with `combineAsVariants` (`figma/plugin/src/components.ts`).
- **R5.2 (MUST)** A component that declares a **`type` (A/B/C) layout-preset axis** MUST be **split into one Component Set per preset**, named `"<Letter> Type - <Name>"` (e.g. `A Type - Card`, `B Type - Card`, `C Type - Card`). Each such set MUST pin its `Type` variant to its letter (harness: `A/B/C Type sets pin their Type variant`).
- **R5.3 (MUST)** The number of Component Sets created MUST equal the number of components (as split); harness check `component sets` MUST pass.
- **R5.4 (MUST)** Every set's **first** variant MUST be the **all-defaults** combination (each axis at its `default`); harness check `default variant first` MUST pass.
- **R5.5 (MUST)** Every set MUST be placed on its classified **Page** (§4.12) before `combineAsVariants` groups its variants — grouped nodes MUST share the parent's page (the harness throws `Grouped nodes must be in the same page as the parent` otherwise).

### 4.6 Variants

- **R6.1 (MUST)** The variant matrix MUST be the **cartesian product** of `variantAxes[]` (`variant`/"Style", `tone`, `size`, `shape`, and — when present — `type`). `figmaVariantCombinations` in the bundle is the authoritative per-component count; the sum across components MUST equal the harness's `variant components` (contract value `expVariants + 1` placeholder).
- **R6.2 (MUST)** Each variant node MUST be named with Figma's grammar `Axis=value, Axis=value, …` using each axis's **display name** (the `figmaProperties` VARIANT `name`, falling back to the axis `label` then `name`) so Figma groups them into the set.
- **R6.3 (NEVER — state-axis exclusion)** The **`state`** axis (`default/hover/active/focus/disabled/loading`) MUST **NOT** be emitted as a Figma variant. Emitting it would explode combinations (e.g. Button 4,050+). Instead: `disabled` and `loading` survive as **BOOLEAN** component properties; the remaining interaction states live only in Storybook/CSS (see [11_INTERACTION_SPECIFICATION.md](./11_INTERACTION_SPECIFICATION.md)).
- **R6.4 (MUST)** No variant may be an **empty box**. Every variant MUST render content (paint, text, or a graphic/instance child); harness check `no empty variant (every variant renders content)` MUST pass at 100%.

### 4.7 Auto Layout

- **R7.1 (MUST)** Each component's base frame MUST be built from its `figma{}` block: `layoutMode` (`HORIZONTAL`/`VERTICAL`), `paddingX`/`paddingY`, `itemSpacing`, `cornerRadius`, `fill`, `height`, `strokeColor`/`strokeWidth`, `primaryAxisAlign`, `counterAxisAlign` — **all as token ids** bound via `setBoundVariable`, never literal numbers.
- **R7.2 (MUST)** Every **Component Set** frame MUST be Auto Layout (harness: `component sets are Auto Layout` == all sets), and every **structural** variant root MUST be Auto Layout so it resizes with content like Storybook (harness: `structural variant roots are Auto Layout`).
- **R7.3 (MAY — the only permitted fixed-layout exception)** A closed allow-list of **graphic/canvas/overlay** roots MAY be fixed-layout at the root because Auto Layout is not how they render in Storybook: `icon, spinner, progress, slider, skeleton, divider, sparkline, bar-chart, line-chart, donut-chart, radar-chart, gauge, scatter-chart, heatmap, modal, drawer` (the `FIXED_ROOT_SLUGS` set in the harness). **No other component** may be fixed-layout.
- **R7.4 (MUST)** Padding MUST bind to `space.*` tokens, item spacing to `space.*`, corner radius to `radius.*`, height to `size.*`. Harness checks `padding bound to spacing tokens (>0)`, `item-spacing bound to spacing tokens (>0)`, `corner radii bound to radius tokens (>0)` MUST pass.

### 4.8 Constraints & Positioning

- **R8.1 (MUST)** Layout MUST be expressed through **Auto Layout** (resize/hug behavior), not manual pinning — matching how Storybook flows. Absolute positioning (`layoutPositioning = 'ABSOLUTE'`) is legal **only** when the parent already has an Auto Layout `layoutMode !== 'NONE'`; the harness throws exactly Figma's runtime error otherwise (`Can only set layoutPositioning = ABSOLUTE if the parent node has layoutMode !== NONE`).
- **R8.2 (SHOULD)** Overlay components (`modal`, `drawer`) MAY have a fixed-layout scrim root whose **inner panel is Auto Layout** — mirroring the DOM structure, not a redesign.
- **R8.3 (NEVER)** NEVER hand-place, hand-pin, or nudge nodes in Figma. Position is a function of Auto Layout + tokens only.

### 4.9 Token Bindings (CSS → Figma 1:1)

- **R9.1 (MUST)** `tokenBindings[]` MUST be applied per variant, binding a `property` (e.g. `background`, `border`, `color`) to a `token` id, honoring each binding's `when{}` axis filter (e.g. `{ "variant": "solid", "tone": "brand" }`). Bindings are derived from each component's real CSS at build time by `scripts/lib/css-bindings.ts`, with any hand-authored `meta.tokens` merged on top.
- **R9.2 (MUST)** Bound paints MUST resolve to the token **Variable** created in §4.3 (`figma.variables.setBoundVariableForPaint`), so a fill in Figma equals the CSS `var(--tds-*)` value — not a frozen hex.
- **R9.3 (MUST)** The token pipeline MUST be broadly applied: **≥ 90%** of variants MUST carry a Variable-bound paint (harness: `token-styled variants ≥ 90% (CSS→token 1:1)`); the remainder are intentionally chromeless (icon-only) or literal official-brand fills (e.g. social-login brand colors).
- **R9.4 (MUST)** The special token `"transparent"` MUST **clear** a fill/stroke (not paint a color). Label font-size MUST be bound to a token (harness: `label font-size bound to token (>0)`).

### 4.10 Icons

- **R10.1 (MUST)** Every `INSTANCE_SWAP` property MUST instantiate the **single shared** `Icon` main component (the Storybook `Icon` primitive), which itself MUST be token-colored (its paint bound to a Variable). All icon slots MUST share **one** swap source (harness: `icon slots share one swap source` == 1; `swap source is the token-colored Icon primitive` == 1).
- **R10.2 (NEVER)** NEVER emit a grey placeholder box for an icon slot. Buttons, dropdowns, links, and fields MUST carry a real, swappable icon instance (harness: `icon slot instances created (>0)`).
- **R10.3 (MUST)** `TEXT`, `BOOLEAN`, and `INSTANCE_SWAP` component properties MUST be registered on the set from `figmaProperties[]`, and each MUST be **wired** to the correct layer property (`characters`, `visible`, `mainComponent` via `componentPropertyReferences`). Harness checks `TEXT props`, `BOOLEAN props`, `INSTANCE_SWAP props`, and `every set registers its contract properties` MUST pass.

### 4.11 Documentation (in the Figma file)

- **R11.1 (MUST)** Every Component Set's `description` MUST carry the contract docs: a **Composition** spec listing `Variants:` (harness: `descriptions carry the Composition spec`) **and** an **Accessibility** section (harness: `descriptions with a11y`) sourced from each component's `a11y` (role/keyboard/notes). This is Dev-Mode documentation, not decoration.
- **R11.2 (MUST)** The **Foundation** page MUST render the real token values as a **6-card** showcase — Color System, Typography (the 11 text styles at real font/size/weight/line-height), Radius & Shape, Spacing, Shadows (the 6 effect styles), Borders — plus the library **Cover** card at top. Harness: `foundation token cards` == 6, `cover card present` == 1.
- **R11.3 (MUST)** Documentation content MUST be derived from tokens/metas — never authored free-hand in Figma.

### 4.12 Pages & Naming

- **R12.1 (MUST)** Output MUST be organized into **8 auto-generated Pages** named `TDS · <N>. <Title>`, in fixed order (`figma/plugin/src/pages.ts` → `PAGE_TITLES`): **1 Foundation**, then **Layout, Navigation, Actions, Input, Data Display, Feedback, Overlay**. The current page is reused as Foundation (renamed); the other seven are created with `figma.createPage()`. Harness: `pages (Foundation reused + 7 created)` == 8.
- **R12.2 (MUST)** Components MUST be routed to a page by the deterministic **first-match-wins** classifier `pageForComponent` over their `tags`. The classifier MUST be total — the per-page count sum MUST equal the component count (else `classifyCounts` warns "Page classifier drift").
- **R12.3 (MUST — naming grammar, do not deviate):**
  - Pages: `TDS · <N>. <Title>` (e.g. `TDS · 4. Actions`).
  - Component Sets: the component `name`; A/B/C-split sets use `"<Letter> Type - <Name>"`.
  - Variants: `Axis=value, Axis=value, …`.
  - Variables: slash-notation token id (`color/bg/default`).
  - Styles: bundle-provided names.
- **R12.4 (NEVER)** NEVER rename any page, set, variant, variable, or style in Figma. Names are contract-derived and machine-checked.

### 4.13 Responsive (in Figma)

- **R13.1 (MUST)** Responsive behavior MUST be reproduced only insofar as the bundle expresses it via **Auto Layout resize/hug** and any `responsive` hint on a component. Figma has no runtime breakpoints; the source of responsive truth is `useMediaQuery` + breakpoint tokens in Storybook (see [12_RESPONSIVE_SPECIFICATION.md](./12_RESPONSIVE_SPECIFICATION.md)).
- **R13.2 (NEVER)** NEVER hand-build separate desktop/tablet/mobile frames in Figma as a redesign. Responsiveness is Auto Layout + tokens, faithful to Storybook.

### 4.14 Motion (in Figma)

- **R14.1 (MUST)** Motion tokens (durations/easings) exist as **Variables** but Figma has **no faithful runtime motion equivalent** for CSS transitions; the plugin MUST emit the expected note (e.g. "transition has no Figma equivalent") rather than fake animation. Such notes are **non-blocking** (the harness counts them as "other (expected) notes"). Motion truth lives in Storybook/CSS ([10_ANIMATION_SPECIFICATION.md](./10_ANIMATION_SPECIFICATION.md)).
- **R14.2 (NEVER)** NEVER invent Smart-Animate transitions or prototype flows as a design decision. If motion must be shown, it is a documented, source-driven addition — not a Figma-side invention.

### 4.15 Interactions (in Figma)

- **R15.1 (MUST)** Interaction **states** are **not** Figma variants (R6.3). Only `disabled`/`loading` (BOOLEAN props) are reproduced. Keyboard/focus/disclosure behavior is documented in the set description (§4.11) but not simulated as Figma prototypes.
- **R15.2 (NEVER)** NEVER build clickable prototype flows as a redesign. Interaction truth lives in Storybook `play` functions and hooks (see [11_INTERACTION_SPECIFICATION.md](./11_INTERACTION_SPECIFICATION.md)).

### 4.16 Synchronization

- **R16.1 (MUST)** The Figma output MUST be regenerated whenever any source changes (tokens, a `*.meta.ts`, or component CSS). The sync chain is `npm run ds:build` (regenerates `figma/tds.plugin.json`) → `npm run figma:build` (typecheck + bundle + headless verify). The plugin then rebuilds the Figma file from the fresh bundle.
- **R16.2 (MUST)** Sync is **one-directional**: Storybook/source → bundle → Figma. Nothing in Figma is ever read back into the repo. The `.ai/FIGMA_MAPPING.json` manifest (see [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md)) is a regenerated cache of the mapping, never a hand-edited authority.
- **R16.3 (MUST)** A Figma file produced from an **older** bundle is stale; the fix is always "re-run the plugin on the current bundle", never "patch the file".

### 4.17 Plugin Mapping (field → construct)

- **R17.1 (MUST)** The mapping is fixed and total — every consumed bundle field maps to exactly one Figma construct per the table in §6. `figma/plugin/src/types.ts` MUST mirror the bundle **verbatim** (no added/renamed/dropped fields).

### 4.18 Validation

- **R18.1 (MUST)** No change to sources affecting Figma may be considered done until `npm run figma:build` passes end-to-end: `plugin:typecheck` (tsc), `plugin:build` (esbuild bundle), and `plugin:test` (the headless harness) — the last **exits non-zero** on any coverage mismatch or blocking warning. See §7.

## 5. Workflow

The Figma system is never touched directly. All work flows through the source → bundle → plugin pipeline.

### 5.1 Regenerate Figma from current source

```bash
npm run ds:build      # tokens:build → manifest:build → catalog:build
                      # rewrites figma/tds.plugin.json + src/generated/design-system.manifest.json
npm run figma:build   # ds:build → plugin:typecheck → plugin:build → plugin:test (headless verify)
```

Then, in Figma: run the **TDS Design System Reproducer** plugin (`figma/plugin/manifest.json`) → click **Run**. `figma/plugin/src/code.ts` executes:

1. `buildVariables(t.collections)` → Collections/Modes/Variables (Primitives → Semantic → Theme), aliases resolved.
2. `buildEffectStyles` / `buildTextStyles` → Effect + Text Styles.
3. `createPages()` → the 8 pages (`TDS · N. Title`).
4. `buildFoundation(...)` → Foundation showcase + Cover.
5. `buildComponents(...)` → every Component Set (variant matrix, properties, token bindings, icon slots, descriptions), placed on its classified page.
6. `flushFontNotes()` → one consolidated font note; `done(...)` reports totals.

### 5.2 Effect a visual change (the ONLY correct path)

You want to change a color/spacing/radius/variant in Figma. You do **not** touch Figma. Instead:

1. Change the **source**: a token in `src/tokens/primitives.ts` / `semantic.ts`, an axis/prop in the component's `*.meta.ts`, or the component's CSS.
2. `npm run ds:build` to regenerate the bundle.
3. `npm run figma:build` to typecheck/bundle/verify.
4. Re-run the plugin in Figma. The change appears identically to Storybook.

See [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md) for the full task lifecycle and [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md) for propagation/versioning.

### 5.3 Add / edit a component's Figma output

Follow [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md): author `*.meta.ts` (axes/props/tags), register it in `src/components/metas.ts`, run `npm run ds:build`. The component automatically appears in the bundle, gets classified to a page by its `tags`, and is reproduced with no Figma-side work. Then `npm run figma:build` to prove coverage.

## 6. Examples

### 6.1 Bundle → Figma field mapping (the contract, condensed)

| Bundle path | Figma construct | Plugin site |
|---|---|---|
| `tokens.collections[]` (order: Primitives, Semantic, Theme) | Variable Collections (in order) | `variables.ts` |
| `collection.modes[]` (`default`; `light`,`dark`) | Collection modes (rename first, `addMode` rest) | `variables.ts` |
| `variable{ name, figmaType, scopes, valuesByMode }` | `createVariable` + scopes + `setValueForMode` | `variables.ts` |
| `valuesByMode.*.VARIABLE_ALIAS` | Alias resolved to earlier-collection Variable | `variables.ts` |
| `tokens.effectStyles[]` | Effect Styles (`DROP_SHADOW`, rgba 0..1) | `styles.ts` |
| `tokens.textStyles[]` | Text Styles (family/size/weight/lineHeight%/letterSpacing) | `styles.ts` |
| `design.components[]` | Component Sets (`combineAsVariants`) | `components.ts` |
| component with `type` axis | one set per A/B/C → `"<L> Type - <Name>"` | `components.ts` |
| `variantAxes[]` | cartesian product → variants `Axis=value, …` | `components.ts` / `recipes.ts` |
| `figma{}` block (token ids) | base frame Auto Layout + bound Variables | `components.ts` |
| `tokenBindings[]` with `when{}` | per-variant bound paints/dims | `components.ts` / `recipes.ts` |
| `figmaProperties[]` VARIANT/TEXT/BOOLEAN/INSTANCE_SWAP | component properties + layer wiring | `components.ts` |
| `figmaProperties[]` INSTANCE_SWAP | instance of shared token-colored `Icon` | `components.ts` |
| `component.tags` | page via `pageForComponent` (first-match) | `pages.ts` |
| `component.a11y` + composition | Component Set `description` | `doc.ts` |

### 6.2 A Button component entry (abridged) and what it becomes

```jsonc
{
  "name": "Button",
  "isComponentSet": true,
  "variantAxes": [
    { "name": "variant", "label": "Style", "options": ["solid","outline","ghost","soft","link"], "default": "solid" },
    { "name": "tone",    "options": ["brand","neutral","success","warning","danger"], "default": "brand" },
    { "name": "size",    "options": ["sm","md","lg"], "default": "md" },
    { "name": "shape",   "options": ["rounded","pill","square"], "default": "rounded" },
    { "name": "state",   "options": ["default","hover","active","focus","disabled","loading"] } // NOT a Figma variant
  ],
  "figmaProperties": [
    { "propName": "loading",   "figmaPropertyType": "BOOLEAN" },
    { "propName": "iconStart", "figmaPropertyType": "INSTANCE_SWAP" }
  ],
  "tokenBindings": [
    { "property": "background", "token": "color.brand.solid", "when": { "variant": "solid", "tone": "brand" } }
  ],
  "figma": {
    "layoutMode": "HORIZONTAL", "paddingX": "space.4", "paddingY": "space.2",
    "cornerRadius": "radius.control", "fill": "color.brand.solid", "height": "size.control.md"
  }
}
```

- Reproduced as **one Component Set** "Button" whose variants are the product of `variant × tone × size × shape` (state excluded).
- First variant: `Style=solid, tone=brand, size=md, shape=rounded` (all defaults).
- `loading` → BOOLEAN prop (visibility-wired); `iconStart` → INSTANCE_SWAP of the shared `Icon`.
- The `solid`+`brand` variant's `background` fill is **bound** to the `color/brand/solid` Variable (theme-aware), not a hex.
- Placed on page `TDS · 4. Actions` (tag classification).

### 6.3 Theme mode alias (light/dark)

```jsonc
{
  "name": "color/fg/default",
  "figmaType": "COLOR",
  "scopes": ["TEXT_FILL"],
  "valuesByMode": {
    "light": { "type": "VARIABLE_ALIAS", "aliasId": "color.neutral.900" },
    "dark":  { "type": "VARIABLE_ALIAS", "aliasId": "color.neutral.50"  }
  }
}
```

Creates a Theme Variable `color/fg/default` aliasing the Primitives palette per mode — the same semantic swap Storybook does via `data-theme`.

## 7. Validation Rules

Compliance is machine-checked. **`npm run figma:build`** is the gate; it runs, in order:

1. **`ds:build`** — regenerates `figma/tds.plugin.json` and `src/generated/design-system.manifest.json`. If sources changed but the bundle wasn't regenerated, downstream checks catch the drift.
2. **`plugin:typecheck`** — `tsc -p figma/plugin/tsconfig.json`. Because `figma/plugin/src/types.ts` mirrors the bundle verbatim, a bundle-shape change that the plugin doesn't handle fails here.
3. **`plugin:build`** — `esbuild figma/plugin/src/code.ts … --outfile=figma/plugin/code.js` (IIFE, es2017). `code.js` is generated + gitignored.
4. **`plugin:test`** — `tsx figma/plugin/test/harness.ts`: a **headless Figma-API mock** runs the real plugin against the real bundle and asserts coverage; `process.exit(1)` on any mismatch or blocking warning.

The harness enforces (all MUST pass — see `figma/plugin/test/harness.ts`):

- **Counts derived from the contract:** `collections`, `variables`, `alias values resolved`, `effect styles`, `text styles`, `component sets`, `variant components`, `pages (Foundation reused + 7 created)`, `foundation token cards` (6), `cover card present` (1), `TEXT/BOOLEAN/INSTANCE_SWAP props`.
- **Structure:** `default variant first`, `descriptions with a11y`, `descriptions carry the Composition spec`, `every set registers its contract properties`, `A/B/C Type split produced sets`, `A/B/C Type sets pin their Type variant`.
- **Fidelity:** `component sets are Auto Layout`, `structural variant roots are Auto Layout`, `no empty variant (every variant renders content)`, `token-styled variants ≥ 90%`, `bound paints ≥ variants/10`, `label font-size bound to token`, padding/gap/radius bound to tokens, `shadow effect styles applied`.
- **Icons:** `icon slots share one swap source`, `swap source is the token-colored Icon primitive`, `icon slot instances created`.
- **Charts:** `chart series palette present (chart/1..6)`, `chart palette is theme-aware (light≠dark ≥4)`.
- **Blocking warnings:** any warning matching `Unresolved alias|unknown mode|not found` fails the run; expected notes (e.g. "transition has no Figma equivalent") do not.

Manual validation (spot-check only, never a substitute): run the plugin in a scratch Figma file and confirm the Foundation page, page taxonomy, and a few sets match Storybook. See [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md).

## 8. Checklist

Pre-change (before touching sources that affect Figma):

- [ ] Confirmed the change is a **source** change (token / `*.meta.ts` / CSS), not a Figma edit (R0.3).
- [ ] Confirmed I am **not** editing any generated file (`figma/*`, `src/generated/*`, `src/tokens/generated/*`) (R0.2).

Per-change:

- [ ] `npm run ds:build` re-ran; `figma/tds.plugin.json` regenerated.
- [ ] `npm run figma:build` passes: typecheck + bundle + **headless harness** green.
- [ ] New/changed component has correct `tags` so `pageForComponent` routes it (R12.2).
- [ ] Any `type` (A/B/C) axis yields `"<L> Type - <Name>"` split sets (R5.2).
- [ ] `state` axis is **not** a variant; only `disabled`/`loading` are BOOLEAN props (R6.3).
- [ ] Token bindings resolve to Variables; ≥90% of variants are token-styled (R9.3).
- [ ] Icon slots reference the single shared token-colored `Icon` (R10.1).
- [ ] Set descriptions carry Composition + Accessibility (R11.1).

Pre-commit / pre-release:

- [ ] `npm run lint` and `npm run format` clean.
- [ ] `.ai/FIGMA_MAPPING.json` regenerated/reconciled (never hand-edited) (R16.2).
- [ ] No blocking harness warnings; expected motion notes acknowledged (R14.1).

## 9. Failure Recovery

| Symptom | Diagnosis | Fix | Resume |
|---|---|---|---|
| Harness `FAIL collections/variables/…` | Bundle changed but plugin/types out of sync, or a token was dropped | Re-run `npm run ds:build`; if types drift, reconcile `figma/plugin/src/types.ts` to the bundle (verbatim) | `npm run figma:build` |
| Blocking warning `Unresolved alias` | A Semantic/Theme alias points at a Primitive that doesn't exist (or wrong collection order) | Fix the token source in `src/tokens/*`; ensure Primitives are emitted before their aliases | `npm run ds:build && npm run figma:build` |
| `FAIL default variant first` | An axis `default` changed or axis order shifted | Correct the axis `default`/order in the component `*.meta.ts` | rebuild |
| `throw: Grouped nodes must be in the same page` | A set was combined before its page was current | Ensure page is set before building that page's sets (`pages.ts` ordering) — plugin bug, fix in `figma/plugin/src/` per [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md) | rebuild |
| `throw: layoutPositioning = ABSOLUTE …` | An absolute child was placed under a non-Auto-Layout parent | Give the parent an Auto Layout `layoutMode`, or don't absolutely position | rebuild |
| `FAIL token-styled variants ≥ 90%` | CSS bindings missing (component CSS not parsed by `scripts/lib/css-bindings.ts`) or too many empty variants | Add/repair CSS token usage or `meta.tokens`; ensure no empty boxes | `npm run ds:build && npm run figma:build` |
| `FAIL icon slots share one swap source` | A second icon main component leaked in | Route all INSTANCE_SWAP slots through the single shared `Icon` | rebuild |
| `Page classifier drift` warning | A component's `tags` don't match any rule (or match none before the fallthrough) | Add appropriate `tags` in the `*.meta.ts`; verify `pageForComponent` order | rebuild |
| Figma file looks wrong but harness passes | Stale file from an **old** bundle, or someone hand-edited Figma | Discard the file; re-run the plugin on the current bundle. Never patch by hand (R16.3) | re-run plugin |

If context is lost mid-task, rehydrate via [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md): read `.ai/SESSION_SUMMARY.md` and `.ai/TASKS.json`, then re-run `npm run figma:build` to re-establish the green baseline.

## 10. Dependencies

**Docs**

- [00_MASTER_RULES.md](./00_MASTER_RULES.md) — constitution, Design Lock, generated-is-sacred, precedence.
- [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md) — the immutable Design Lock this doc enforces in Figma.
- [04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md) — Storybook = the only source of truth Figma reproduces.
- [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md) — the plugin mechanism/algorithm/harness gate.
- [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md), [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md), [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md) — the sources feeding the bundle.
- [10_ANIMATION_SPECIFICATION.md](./10_ANIMATION_SPECIFICATION.md), [11_INTERACTION_SPECIFICATION.md](./11_INTERACTION_SPECIFICATION.md), [12_RESPONSIVE_SPECIFICATION.md](./12_RESPONSIVE_SPECIFICATION.md), [13_ACCESSIBILITY_SPECIFICATION.md](./13_ACCESSIBILITY_SPECIFICATION.md) — what Figma reproduces vs. omits.
- [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md), [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md), [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md), [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md), [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md).

**Manifests** (in `.ai/`, regenerated — never authoritative over source)

- [.ai/FIGMA_MAPPING.json](../../.ai/FIGMA_MAPPING.json) — the field→construct mapping cache.
- [.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json), [.ai/TOKEN_INDEX.json](../../.ai/TOKEN_INDEX.json), [.ai/VARIANT_INDEX.json](../../.ai/VARIANT_INDEX.json), [.ai/PLUGIN_INDEX.json](../../.ai/PLUGIN_INDEX.json).

**Real files & scripts**

- Contract: [figma/README.md](../../figma/README.md); bundle `figma/tds.plugin.json`; manifest `src/generated/design-system.manifest.json`.
- Plugin: `figma/plugin/manifest.json`, `figma/plugin/src/{code,variables,styles,components,recipes,pages,foundation,doc,log,types}.ts`, `figma/plugin/test/harness.ts`.
- Build: `scripts/build-tokens.ts`, `scripts/build-manifest.ts`, `scripts/lib/css-bindings.ts`; npm scripts `ds:build`, `figma:build`, `plugin:typecheck`, `plugin:build`, `plugin:test`.

## 11. Template

Reusable checklist to add/verify a component's Figma reproduction (copy-paste into a task):

```md
### Figma reproduction verification — <ComponentName>
- [ ] Source authored (meta/tokens/CSS), NOT Figma. No generated file hand-edited.
- [ ] `variantAxes` correct; `state` present in meta but NOT emitted as a Figma variant.
- [ ] If a `type` axis exists → expect `"A Type - <Name>"`, `"B Type - <Name>"`, `"C Type - <Name>"`.
- [ ] `figmaProperties`: disabled/loading → BOOLEAN; text slots → TEXT; icon slots → INSTANCE_SWAP (shared Icon).
- [ ] `figma{}` base frame uses ONLY token ids (space.*/radius.*/size.*/color.*).
- [ ] `tags` route it to the intended page via pageForComponent.
- [ ] `a11y` populated → appears in the set description (Accessibility).
- [ ] `npm run ds:build && npm run figma:build` → harness green, 0 blocking warnings.
```

Field-mapping reference stub (for `.ai/FIGMA_MAPPING.json`, regenerated):

```jsonc
{
  "$schema": "…", "version": 1, "generatedAt": "<ISO>", "generator": "scripts/build-manifest.ts",
  "collectionsOrder": ["Primitives", "Semantic", "Theme"],
  "themeModes": ["light", "dark"],
  "pages": ["Foundation","Layout","Navigation","Actions","Input","Data Display","Feedback","Overlay"],
  "stateAxisEmittedAsVariant": false,
  "booleanStateProps": ["disabled", "loading"],
  "typeSplitNaming": "<Letter> Type - <Name>",
  "variantNameGrammar": "Axis=value, Axis=value"
}
```

## 12. Future Extension

- **More components / variants (toward and beyond 10M-user products):** the "no per-component code" design means new components scale for free — author `*.meta.ts`, run `ds:build`, and the plugin reproduces them. The variant matrix can grow because the **state-axis exclusion** (R6.3) caps combinatorial explosion; keep new stateful behavior in `state` (Storybook/CSS), not in Figma variants.
- **More Theme modes:** add modes (e.g. `high-contrast`, brand themes) in `src/tokens/*`; the bundle emits them under `Theme.modes[]` and the plugin's mode loop reproduces them with no plugin change.
- **New pages / taxonomy:** extend `PAGE_TITLES` + `pageForComponent` in `figma/plugin/src/pages.ts` (a **plugin** change per [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md)); the classifier's totality check guards against drift.
- **Richer fidelity (future, opt-in):** if Figma exposes faithful motion/interaction primitives, motion/interaction tokens can be reproduced — but only source-driven, never a Figma-side redesign (R14.2/R15.2).
- **Automated sync in CI (PLANNED — no CI exists today):** a future `.github` pipeline SHOULD run `npm run figma:build` on every PR to block bundle drift, and a future MCP surface ([35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md)) MAY drive the plugin headlessly to reconcile a live Figma library against the current bundle. Both are additive; the one-directional Storybook→Figma law (R16.2) is permanent.
