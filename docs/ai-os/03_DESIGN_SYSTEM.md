<!--
title: Design System
Purpose: The canonical description of TDS as a metadata-driven design system — tiers, tokens, the meta model, the type(A/B/C) vs variant("Style") convention, theming, the 60-component inventory, and the immutable Design Lock Policy.
Status: ACTIVE
Owner: AI OS
Last-reviewed: 2026-07-08 (placeholder — update on each review)
Precedence: Subordinate to 00_MASTER_RULES.md. On any design/visual matter this document is authoritative over the generated manifests and over Figma; it is subordinate to Storybook + the *.meta.ts / src/tokens sources, which are the design truth it describes.
-->

# 03 — Design System

> **Front-matter**
> **Title:** Design System
> **Purpose:** The canonical description of TDS as a metadata-driven design system: the three tiers (atom / molecule / organism), the token model, the `*.meta.ts` model, the `type` (A/B/C) vs `variant` ("Style") convention, light/dark theming, the full 60-component inventory, and the FULL immutable Design Lock Policy.
> **Status:** ACTIVE.
> **Owner:** AI OS.
> **Last-reviewed:** _placeholder — set on review._
> **Precedence:** Governed by [00_MASTER_RULES.md](./00_MASTER_RULES.md). Per the source-of-truth hierarchy, Storybook and the `*.meta.ts` / `src/tokens/*` sources are the design truth; this document describes them and is authoritative over the generated manifests ([figma/tds.plugin.json](../../figma/tds.plugin.json), [src/generated/design-system.manifest.json](../../src/generated/design-system.manifest.json)) and over Figma.

---

## 1. Purpose

TDS ("tds", v0.1.0) is a **metadata-driven design system** built on React 18 + Vite 5 + TypeScript 5 + Storybook 8, engineered so a **Figma plugin can regenerate the entire system in Figma with zero manual configuration**. This document is the canonical, single-place description of *what TDS is as a design system* so that any AI agent (Claude Code, Gemini CLI, Cursor, Codex, Windsurf, MCP agents) can reason about it without re-deriving it from source.

The core idea — **one source of truth feeds four outputs**:

1. Each component ships a pure-data `X.meta.ts` (`ComponentMeta`) that drives:
   - **(a)** the React component (`X.tsx` + `X.css`),
   - **(b)** Storybook controls / autodocs / a11y,
   - **(c)** the Figma manifest.
2. **(d)** Tokens authored in TypeScript (`src/tokens/*`), Figma-shaped, generate both the web CSS (`--tds-*`) and the Figma variable bundle.

Every variant combination is expressed as `data-*` attributes on the DOM so the whole combinatorial surface is legible to the plugin; CSS is **token-driven and zero-runtime**. There are **60 components already built** — 24 atoms, 27 molecules, 9 organisms. Most work in this repo is **reuse**, not creation.

This document exists so that: design consistency is preserved, no component or token is reinvented, Storybook↔Figma stay in perfect sync, and the immutable Design Lock Policy (Section 4 + the callout below Section 3) is applied identically by every agent.

## 2. Responsibilities

This document is responsible for defining and holding constant:

- **The tier model** — atom / molecule / organism (`src/components/atoms|molecules|organisms/`), and how they compose.
- **The token model** — three Variable collections (Primitives → Semantic → Theme) plus Effect + Text styles, the `--tds-*` CSS contract, and dot-vs-slash naming. (Deep detail lives in [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md).)
- **The meta-driven model** — the `ComponentMeta` shape (`src/core/types.ts`) and how one meta feeds four outputs. (Deep detail: [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md).)
- **The axis convention** — `type` = layout preset A/B/C vs `variant` (labelled "Style") = visual fill, composing with `tone` / `size` / `shape` / `state`. (Deep detail: [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md).)
- **Theming** — `light` / `dark` via the Theme collection and `data-theme`.
- **The 60-component inventory** — the authoritative headcount and tier breakdown.
- **The full immutable Design Lock Policy** — Storybook is the ONLY source of truth and IMMUTABLE for visual design; Figma is a pixel-perfect reproduction; all visual change is a source change.

Out of responsibility (delegated, see Section 3): per-axis Figma mapping rules, the plugin algorithm, the token generator internals, accessibility specifics, and any backend/DB/API concerns (all PLANNED).

## 3. Scope (in-scope / out-of-scope)

**In-scope**

- The conceptual and structural definition of TDS: tiers, tokens, metas, axes, theming, inventory.
- The Design Lock Policy, stated in full and verbatim.
- Cross-references that route the reader to the specialised sibling docs.

**Out-of-scope (delegated to sibling docs)**

- Storybook rulebook → [04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md).
- Figma reproduction spec → [05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md); plugin algorithm → [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md).
- Component anatomy / adding a component → [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md).
- Token model internals & generation → [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md).
- Variant axes & the state-exclusion policy → [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md).
- Animation / interaction / responsive / accessibility → [10_ANIMATION_SPECIFICATION.md](./10_ANIMATION_SPECIFICATION.md), [11_INTERACTION_SPECIFICATION.md](./11_INTERACTION_SPECIFICATION.md), [12_RESPONSIVE_SPECIFICATION.md](./12_RESPONSIVE_SPECIFICATION.md), [13_ACCESSIBILITY_SPECIFICATION.md](./13_ACCESSIBILITY_SPECIFICATION.md).
- **PLANNED** backend/database/API/Supabase/CI/test-framework — none exist in the repo today; see [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md)–[17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md).

> **Immutable Design Lock Policy — read before any UI work.**
> **Storybook is the ONLY source of truth and is IMMUTABLE for visual design. Figma is a faithful, pixel-perfect REPRODUCTION of Storybook, never a redesign.** The AI MUST NEVER, on its own initiative: redesign, modernize, beautify, "improve" the UI, change layout, change spacing, change colors, change typography, change radius, change shadows, change motion, or rename any token, component, variant, or variable. Any visual change is a **SOURCE change** (`*.meta.ts` / `src/tokens/*` / component CSS) that flows through the pipeline and must be explicitly requested and approved. Manual editing of generated outputs (`figma/*`, `src/generated/*`, `src/tokens/generated/*`) is PROHIBITED. The full policy is Section 4 (Rules 40–49) and Section 4's "NEVER list".

## 4. Rules

Rules use MUST / SHOULD / NEVER and are enforceable against real repo mechanisms (Section 7).

**Tiers & structure**

- **R1 (MUST).** Every component lives under exactly one tier folder: `src/components/atoms/`, `src/components/molecules/`, or `src/components/organisms/`, and matches its `category` field (`'atom' | 'molecule' | 'organism'`) in `src/core/types.ts`.
- **R2 (MUST).** A component folder ships the 5-file anatomy: `X.meta.ts`, `X.tsx`, `X.css`, `X.stories.tsx`, `index.ts`. See [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md).
- **R3 (MUST).** Import components ONLY from the single public barrel `@/components`. **NEVER** deep-path import (e.g. `@components/atoms/Button/Button`).
- **R4 (MUST).** Register every new component's meta in [src/components/metas.ts](../../src/components/metas.ts) (`atomMetas` / `moleculeMetas` / `organismMetas` → `componentMetas`) and export it from the tier barrel; the manifest generator reads `componentMetas`.

**Meta model**

- **R5 (MUST).** `*.meta.ts` files stay **React-free and CSS-free** and use **relative imports only** (they are imported by the Node manifest generator *and* the browser).
- **R6 (MUST).** The `ComponentMeta` is the single source of truth for React data-attributes/defaults, Storybook argTypes, and the Figma manifest. Do not fork this truth into ad-hoc props.
- **R7 (MUST).** Emit variant axes to the DOM with `toDataAttrs(meta, {...})` (from `src/core/defineComponent.ts`) so every axis appears as `data-<axis>`.

**Tokens & styling**

- **R8 (MUST).** Style with CSS custom-property tokens only: `var(--tds-*)`. **NEVER** hardcode colors, spacing, radius, shadow, or typography.
- **R9 (MUST).** Author tokens only in `src/tokens/*` (`primitives.ts`, `semantic.ts`, `types.ts`, `helpers.ts`, `index.ts`). The three-collection order is Primitives → Semantic → Theme; regenerate with `npm run tokens:build`.
- **R10 (MUST).** Respect the naming contract: token id is **dot-notation** (`color.bg.default`, `space.4`); the CSS var is `--tds-<dots-as-dashes>` (`--tds-color-bg-default`); the Figma variable name uses **slash-notation** (`color/bg/default`). **NEVER** rename across this contract.

**Axes & theming**

- **R11 (MUST).** Use `type` for **layout preset** axes with values `A`/`B`/`C` (or `A`/`B`); use `variant` (label **"Style"**) for **visual fill** (`solid`/`outline`/`ghost`/`soft`/`link`, etc.). They compose with `tone` (`brand`/`neutral`/`success`/`warning`/`danger`, + `info` where present), `size` (`sm`/`md`/`lg`), and `shape` (`rounded`/`pill`/`square`).
- **R12 (MUST).** The `state` axis (`default`/`hover`/`active`/`focus`/`disabled`/`loading`/…) is **NEVER emitted as a Figma variant** (it explodes combinations); `disabled`/`loading` survive as BOOLEAN component props. See [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md).
- **R13 (MUST).** Theme via the Theme collection modes `light` / `dark` only, surfaced by `data-theme` (see `.storybook/preview.tsx`). **NEVER** add a third theme mode without a source change + approval.

**Reuse-first & generated-is-sacred**

- **R14 (MUST).** Before building any UI, check [docs/COMPONENTS.md](../../docs/COMPONENTS.md) and reuse an existing component. Only add a component when the catalog has no fit.
- **R15 (NEVER).** Never hand-edit generated outputs: anything under `figma/` (except the hand-authored `figma/README.md` contract and `figma/plugin/src/*`), `src/generated/`, `src/tokens/generated/`, or `figma/plugin/code.js`. Change the **source**, then re-run the build.

**The immutable Design Lock Policy (verbatim)**

- **R40 (MUST).** **Storybook is the ONLY source of truth and is IMMUTABLE for visual design.** Figma is a faithful, **pixel-perfect REPRODUCTION** of Storybook, **never a redesign**.
- **R41 (NEVER).** The AI MUST NEVER, on its own initiative, **redesign** the UI.
- **R42 (NEVER).** …**modernize** the UI.
- **R43 (NEVER).** …**beautify** or **"improve"** the UI.
- **R44 (NEVER).** …**change layout**.
- **R45 (NEVER).** …**change spacing**.
- **R46 (NEVER).** …**change colors**, **typography**, **radius**, **shadows**, or **motion**.
- **R47 (NEVER).** …**rename** any token, component, variant, or variable.
- **R48 (MUST).** Any visual change is a **SOURCE change** (`*.meta.ts` / `src/tokens/*` / component CSS) that flows through the pipeline and **must be explicitly requested and approved**.
- **R49 (NEVER).** **Manual editing of generated outputs** (`figma/*`, `src/generated/*`, `src/tokens/generated/*`) is **PROHIBITED**.

**The NEVER list (single glance).** On its own initiative the AI NEVER: redesign · modernize · beautify · "improve" UI · change layout · change spacing · change colors · change typography · change radius · change shadows · change motion · rename tokens · rename components · rename variants · rename variables · hand-edit generated outputs.

## 5. Workflow

The design-system pipeline, using the **real** npm scripts:

1. **Author / edit source.**
   - Tokens → edit `src/tokens/{primitives,semantic}.ts`.
   - Component → edit `src/components/<tier>/<Name>/<Name>.meta.ts` (+ `.tsx` / `.css` / `.stories.tsx`), register in `src/components/metas.ts` and the tier barrel.
2. **Regenerate tokens.** `npm run tokens:build` → writes `src/tokens/generated/{tokens.css, figma.tokens.json, token-ids.ts}`.
3. **Regenerate the manifest + Figma bundle.** `npm run manifest:build` → writes `src/generated/design-system.manifest.json` AND `figma/tds.plugin.json` (`{ $schema, version, generator, tokens, design }`).
4. **Regenerate the catalog.** `npm run catalog:build` → writes `docs/COMPONENTS.md`.
   - Steps 2–4 together: `npm run ds:build`.
5. **Verify Storybook (source of truth).** `npm run storybook` — the visual truth for every variant.
6. **Reproduce in Figma.** `npm run figma:build` = `ds:build` → `plugin:typecheck` → `plugin:build` (esbuild bundles `figma/plugin/src/code.ts` → `figma/plugin/code.js`) → `plugin:test` (headless harness `figma/plugin/test/harness.ts`; `process.exit(1)` on coverage mismatch).
7. **Lint / format.** `npm run lint` (eslint flat config) · `npm run format` (prettier).

> Direction of flow is one-way: **source → Storybook → generated manifests → Figma.** Edits never flow back up from Figma or from generated files (R15, R49).

## 6. Examples

**6.1 The `ComponentMeta` shape (from `src/core/types.ts`) — the meta-driven model in one type.**

```ts
export interface ComponentMeta {
  name: string;
  slug: string;
  category: 'atom' | 'molecule' | 'organism';
  description: string;
  tags?: string[];
  variantProps: VariantProp[];   // -> Figma Variant Properties (type VARIANT)
  componentProps?: ComponentProp[]; // -> Figma Component Properties (BOOLEAN|TEXT|INSTANCE_SWAP)
  states: ComponentState[];      // NOT emitted as a Figma variant axis (see R12)
  tokens?: TokenBinding[];       // { property, token, when? } -> Figma variable bindings
  a11y?: A11ySpec;
  responsive?: string;
  figma?: FigmaNodeSpec;         // Auto Layout / fill / radius / padding as token ids
  isComponentSet?: boolean;      // auto-derived (>1 variant combo)
}
```

**6.2 `type` (layout preset) vs `variant` ("Style", visual fill) — the composing axes.**

```txt
Button:  type = A (label) | B (icon+label) | C (icon-only)      <- LAYOUT preset
         variant("Style") = solid | outline | ghost | soft | link  <- visual FILL
         + tone (brand|neutral|success|warning|danger)
         + size (sm|md|lg) + shape (rounded|pill|square)

Card:    type = A (vertical) | B (horizontal) | C (overlay)
Alert:   type = A (inline)  | B (banner)     | C (prominent, left accent bar)
Tabs:    type = A | B | C   variant("Style") = line | solid | pill
```

Components with a `type` (A/B/C) axis are split into **one Component Set per preset** in Figma (e.g. "A Type - Card"); the `state` axis is excluded (R12), with `disabled`/`loading` kept as BOOLEAN props.

**6.3 Token naming contract (R10).**

```txt
token id (dot)      color.bg.default        space.4
CSS var (--tds-*)   --tds-color-bg-default  --tds-space-4
Figma var (slash)   color/bg/default        space/4
usage in CSS        background: var(--tds-color-bg-default);
```

**6.4 Theming — three collections, two theme modes.**

```txt
Primitives (mode: default)  ->  raw scales
Semantic   (mode: default)  ->  scalar aliases (space, radius, size, type)
Theme      (modes: light, dark) -> color aliases into Primitives (VARIABLE_ALIAS)
surfaced on the web via data-theme="light" | "dark"  (.storybook/preview.tsx)
```

**6.5 The 60-component inventory (authoritative; source `src/components/metas.ts`, catalog `docs/COMPONENTS.md`).**

- **Atoms (24):** Icon, Button, IconButton, Text, Label, Link, Input, Textarea, Checkbox, Radio, Switch, Badge, Tag, Chip, Avatar, Divider, Spinner, Progress, Tooltip, Image, Skeleton, Slider, Sparkline, SocialLoginButton.
- **Molecules (27):** FormField, TextField, SearchInput, Select, Tabs, Accordion, Breadcrumb, Pagination, Card, ListItem, Dropdown, SocialLogin, EmptyState, Popover, Combobox, Autocomplete, DatePicker, FileUpload, ImageUpload, Menu, BarChart, LineChart, DonutChart, RadarChart, Gauge, ScatterChart, Heatmap.
- **Organisms (9):** Alert, Modal, Drawer, Toast, Table, Header, Footer, Sidebar, Navbar.

_(SocialLogin / SocialLoginButton are presentational only — no auth exists; PLANNED backend per [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md).)_

## 7. Validation Rules

How compliance with this document is checked against real mechanisms:

- **Inventory / registration** — `npm run catalog:build` regenerates `docs/COMPONENTS.md`; the count MUST read **60 components (24/27/9)**. A component missing from `src/components/metas.ts` will not appear in the catalog or the manifest.
- **Token contract** — `npm run tokens:build` regenerates `src/tokens/generated/{tokens.css, figma.tokens.json, token-ids.ts}`. Any `var(--tds-*)` not backed by a generated token is a violation; hardcoded values violate R8 and should be caught in review ([30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)).
- **Manifest / axes** — `npm run manifest:build` regenerates `src/generated/design-system.manifest.json` + `figma/tds.plugin.json`; axis names, options, `isComponentSet`, and `state`-exclusion (R12) are asserted downstream.
- **Figma reproduction gate** — `npm run figma:build` runs `plugin:typecheck` + `plugin:build` + `plugin:test` (`figma/plugin/test/harness.ts`); the headless harness `process.exit(1)`s on coverage mismatch, blocking drift.
- **Static analysis** — `npm run lint` (eslint flat config: js recommended + typescript-eslint + react-hooks + react-refresh + storybook), `npm run format` (prettier), and `tsc -b` (strict, `noUnusedLocals/Parameters`, `verbatimModuleSyntax`, `consistent-type-imports`).
- **Generated-is-sacred** — a diff touching `figma/*` (except `figma/README.md`, `figma/plugin/src/*`), `src/generated/*`, `src/tokens/generated/*`, or `figma/plugin/code.js` without a corresponding source change is a **manual-review reject** (R15, R49).
- **Design Lock** — visual diffs in Storybook without an approved source-change request violate R40–R49 and are rejected in review.

## 8. Checklist

- [ ] Consulted [docs/COMPONENTS.md](../../docs/COMPONENTS.md) and confirmed no existing component fits (reuse-first, R14).
- [ ] Component in the correct tier folder; `category` matches (R1).
- [ ] 5-file anatomy present; registered in `src/components/metas.ts` + tier barrel; exported from `@/components` (R2, R3, R4).
- [ ] `*.meta.ts` is React/CSS-free with relative imports only (R5).
- [ ] Variant emission via `toDataAttrs(meta, …)`; every axis appears as `data-<axis>` (R7).
- [ ] Styling is `var(--tds-*)` only — no hardcoded color/spacing/radius/shadow/type (R8).
- [ ] Axis convention correct: `type` = layout A/B/C, `variant` = "Style" fill; composes with `tone`/`size`/`shape` (R11); `state` not a Figma variant (R12).
- [ ] Token naming contract honored across dot / `--tds-` / slash (R10); nothing renamed (R47).
- [ ] Ran `npm run ds:build` (tokens + manifest + catalog) and `npm run figma:build` (green harness).
- [ ] `npm run lint` and `npm run format` clean.
- [ ] No generated output hand-edited (R15, R49).
- [ ] No unrequested visual change; any visual change routed as an approved source change (R40–R49).

## 9. Failure Recovery

| Symptom | Diagnosis | Fix | Resume |
| --- | --- | --- | --- |
| New component absent from `docs/COMPONENTS.md` | Meta not in `src/components/metas.ts` (`componentMetas`) | Add to the correct tier array + tier barrel | Re-run `npm run catalog:build` (or `ds:build`) |
| `var(--tds-x)` renders nothing / wrong color | Token missing or renamed; CSS not regenerated | Add/fix token in `src/tokens/*`; check dot→`--tds-` mapping | `npm run tokens:build`, reload Storybook |
| `npm run figma:build` fails at `plugin:test` | Manifest ↔ plugin coverage mismatch (new/renamed axis, missing binding) | Fix the **source** meta/token; never patch generated files | Re-run `npm run figma:build` until harness passes |
| Figma variant count explodes | `state` leaked into `variantProps` | Move states to `states: []` (kept as BOOLEAN props), not variant axes (R12) | Re-run `ds:build` → `figma:build` |
| Diff shows edits under `figma/` or `src/**/generated/` | Someone hand-edited generated output | Revert the generated file; make the change in source | Re-run the relevant build to regenerate |
| Storybook visual changed unexpectedly | Unapproved redesign / CSS drift | Revert; re-request as an approved source change (R48) | Confirm Storybook matches intent, then `figma:build` |
| Deep-path import lint/build error | Imported a component from a deep path | Switch to `import { X } from '@/components'` (R3) | `npm run lint` |

For context-loss recovery and task resumption, see [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md) and [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md).

## 10. Dependencies

**Docs (siblings):**
[00_MASTER_RULES.md](./00_MASTER_RULES.md) ·
[04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md) ·
[05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md) ·
[06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md) ·
[07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md) ·
[08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md) ·
[09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md) ·
[10_ANIMATION_SPECIFICATION.md](./10_ANIMATION_SPECIFICATION.md) ·
[13_ACCESSIBILITY_SPECIFICATION.md](./13_ACCESSIBILITY_SPECIFICATION.md) ·
[18_FOLDER_STRUCTURE.md](./18_FOLDER_STRUCTURE.md) ·
[21_ARCHITECTURE_GUIDE.md](./21_ARCHITECTURE_GUIDE.md) ·
[30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md) ·
[31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md) ·
[40_FINAL_OPERATING_MANUAL.md](./40_FINAL_OPERATING_MANUAL.md).

**Manifests (.ai):**
[.ai/DESIGN_MANIFEST.json](../../.ai/DESIGN_MANIFEST.json) ·
[.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json) ·
[.ai/TOKEN_INDEX.json](../../.ai/TOKEN_INDEX.json) ·
[.ai/VARIANT_INDEX.json](../../.ai/VARIANT_INDEX.json) ·
[.ai/FIGMA_MAPPING.json](../../.ai/FIGMA_MAPPING.json).

**Source & scripts:**
`src/core/types.ts`, `src/core/defineComponent.ts`, `src/components/metas.ts`, `src/tokens/{primitives,semantic,index}.ts`, `scripts/build-tokens.ts`, `scripts/build-manifest.ts`, `scripts/build-catalog.ts`, `figma/README.md` (the plugin contract), `figma/tds.plugin.json`, `docs/COMPONENTS.md`.

## 11. Template

Copy-paste skeleton for a **new component meta** consistent with this design system (fill in real axes/props; keep it React/CSS-free with relative imports only — R5):

```ts
// src/components/<tier>/<Name>/<Name>.meta.ts
import { defineComponentMeta } from '../../../core/defineComponent';

export const <name>Meta = defineComponentMeta({
  name: '<Name>',
  slug: '<name>',
  category: 'atom', // 'atom' | 'molecule' | 'organism'
  description: 'One-line purpose (mirrors the catalog).',
  tags: ['<page-classifier-tag>'],
  variantProps: [
    // LAYOUT preset axis (optional): { name: 'type', label: 'Type', options: ['A','B','C'], default: 'A' }
    { name: 'variant', label: 'Style', options: ['solid', 'outline', 'ghost'], default: 'solid' },
    { name: 'tone', options: ['brand', 'neutral', 'success', 'warning', 'danger'], default: 'brand' },
    { name: 'size', options: ['sm', 'md', 'lg'], default: 'md' },
    { name: 'shape', options: ['rounded', 'pill', 'square'], default: 'rounded' },
  ],
  componentProps: [
    { name: 'disabled', type: 'boolean', figmaType: 'BOOLEAN', default: false },
    { name: 'loading', type: 'boolean', figmaType: 'BOOLEAN', default: false },
  ],
  states: ['default', 'hover', 'active', 'focus', 'disabled'], // NOT a Figma variant axis (R12)
  tokens: [
    { property: 'background', token: 'color.brand.solid', when: { variant: 'solid' } },
    { property: 'corner-radius', token: 'radius.md' },
  ],
  figma: {
    layoutMode: 'HORIZONTAL',
    paddingX: 'space.3',
    paddingY: 'space.2',
    itemSpacing: 'space.2',
    cornerRadius: 'radius.md',
    fill: 'color.bg.default',
  },
});
```

Then: create `<Name>.tsx` (+ `.css` using `var(--tds-*)` only, and `toDataAttrs`), `<Name>.stories.tsx` (CSF3), `index.ts`; register in `src/components/metas.ts` + tier barrel; run `npm run ds:build` then `npm run figma:build`. Full procedure: [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md).

## 12. Future Extension

- **More components / axes.** The meta-driven model scales linearly: each new `ComponentMeta` adds one entry to `componentMetas` and flows automatically into Storybook, the manifest, `docs/COMPONENTS.md`, and the Figma bundle — **no per-component plugin code**. The `state`-exclusion policy (R12) keeps the Figma combinatorial surface bounded as the library grows.
- **More themes / brands.** New theme modes or brand palettes are added as modes/aliases in the Theme collection (`src/tokens/semantic.ts`) and regenerated — never by editing generated CSS. The `--tds-*` ↔ slash-notation contract keeps web and Figma in lockstep at any scale.
- **PLANNED product surface (>10,000,000 users).** When the PLANNED backend arrives (Supabase — Postgres + Auth + RLS + Storage + Edge Functions + Realtime, per [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md)–[17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md)), TDS remains the **presentation layer only**: presentational components (e.g. SocialLogin) get wired to real services in application code, with **zero changes to the design system's visual contract**. The Design Lock (R40–R49) still holds — product growth never authorizes an unrequested redesign.
- **AI/MCP operation.** The `.ai/` manifests ([27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md), [35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md)) let agents read this design system's shape without re-reading source, minimizing tokens as the system scales for years.
