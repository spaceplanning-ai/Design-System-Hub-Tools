# 06 — Plugin Specification

> **Title:** Plugin Specification
> **Purpose:** Define the Figma plugin that reads the single generated bundle (`figma/tds.plugin.json`) and rebuilds the entire TDS design system in Figma — Variables, Styles, Component Sets, Variants, Properties and Documentation — with **zero manual configuration** and **no per-component code**.
> **Status:** ACTIVE — the plugin, its 12 source modules, and the headless harness all exist and pass today.
> **Owner:** AI OS
> **Last-reviewed:** _(set on review)_
> **Precedence:** Governed by [00_MASTER_RULES.md](./00_MASTER_RULES.md). This document is subordinate to the Design Lock Policy in [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md) and the Figma reproduction contract in [05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md). The plugin is a **consumer** of the bundle; it never authors design. Where this doc and the source disagree, the source (`figma/plugin/src/*.ts` + the generated bundle) wins and this doc must be corrected.

---

## 1. Purpose

The Figma plugin — **"TDS Design System Reproducer"** (`figma/plugin/manifest.json`, id `tds-design-system-reproducer`) — is the terminal stage of the TDS pipeline. It ingests exactly one hand-free input, the generated bundle `figma/tds.plugin.json` (`{ version, generator, tokens, design }`), and deterministically reconstructs the whole system inside the current Figma file:

- **Variables** — 3 collections (Primitives → Semantic → Theme), modes, scopes, and `VARIABLE_ALIAS` resolution.
- **Styles** — Effect Styles (drop shadows) and Text Styles (11 type styles).
- **Component Sets** — one per `design.components[]` entry, each the full cartesian product of its `variantAxes`, grouped by `figma.combineAsVariants`.
- **Properties** — non-variant Figma component properties: `TEXT`, `BOOLEAN`, `INSTANCE_SWAP`, each wired to a real layer.
- **Documentation** — an 8-page taxonomy, a Foundation token showcase, a library Cover, and a full spec composed into every set's `description` (visible in Dev Mode).
- **Auto Layout, Constraints, Tokens, Responsive, Motion, Interactions** — reproduced where Figma can express them; explicitly and honestly skipped where it cannot (see §4, §10).

The guiding invariant: **the manifest is iterated, not special-cased.** Because every component is described by the same schema (`ComponentDef` in `figma/plugin/src/types.ts`), the plugin needs no per-component branches — only per-component *recipes* that are faithful visual miniatures (never new design). Storybook is the immutable source of truth; the plugin is a pixel-faithful reproduction of it and nothing more.

## 2. Responsibilities

| Module (`figma/plugin/src/`) | Responsibility |
| --- | --- |
| `code.ts` | **Entry / main thread.** Inlines the bundle, shows the UI, orchestrates the run in strict order, aggregates stats, emits the final `done()` message. There is **no `main.ts`** — `code.ts` is the entry esbuild bundles. |
| `variables.ts` | Reproduce `tokens.collections[]` as Variable Collections in **two passes** (create all ids, then resolve values/aliases). Returns the `VariableRegistry` (token id → `Variable`). |
| `styles.ts` | Reproduce `tokens.effectStyles[]` and `tokens.textStyles[]`. Returns token id → `EffectStyle.id` for `shadow` bindings. |
| `components.ts` | Reproduce `design.components[]` as Component Sets: cartesian variant generation, base Auto-Layout frame, token binding, property wiring, the wrapping grid, the per-page doc cards, and the Cover. |
| `recipes.ts` | Per-`slug` **recipes** — faithful miniatures of each real component (Button, Card, Tabs, charts, …). `RECIPES: Record<string, Recipe>`; `boundFill`, `CORNERS` helpers. Components without a recipe fall through to the generic box+label render. |
| `pages.ts` | The 8-page taxonomy (`PAGE_TITLES`), canonical `pageName`, the first-match-wins `pageForComponent` classifier, `classifyCounts` drift guard, and `createPages`. |
| `foundation.ts` | The Foundation page: 6 token-showcase cards (`FOUNDATION_CARDS`) rendered from **real** resolved token values only. |
| `doc.ts` | Shared documentation kit for every page: robust font loader (`resolveFont`, `flushFontNotes`), the `Tokens` graph resolver, `makePalette`, and the auto-layout primitives (`stack`, `txt`, `fixedFrame`, `pill`, `pageCanvas`, `docCard`). |
| `styles.ts` / `variables.ts` | (see above) |
| `log.ts` | UI bridge: `progress`, `log`, `done`, and the `warnings[]` sink surfaced via `warn`. |
| `types.ts` | Types mirroring `figma/tds.plugin.json` **verbatim** — the contract. Never add/rename/drop fields here. |
| `globals.d.ts` | `declare module '*.json'` so esbuild's json loader inlines the bundle without expanding a 400 KB literal type. |
| `test/harness.ts` | **Headless CI gate.** Mocks the Figma API, runs the real plugin against the real bundle, asserts ~35 coverage checks, `process.exit(1)` on any mismatch. |
| `ui.html` | The plugin panel: Generate / Close buttons, a progress bar, a scrolling log. |

## 3. Scope

**In-scope**

- The plugin runtime (`figma/plugin/src/*.ts`, `ui.html`, `manifest.json`) and its build/verify scripts (`plugin:typecheck`, `plugin:build`, `plugin:test`).
- The **algorithm** that turns `{ tokens, design }` into Variables, Styles, Component Sets, Properties, Pages and docs.
- Cartesian variant generation, the state-axis exclusion, the A/B/C Type split, the 8-page classifier, and the headless harness as the merge gate.
- Fidelity limits: what Figma can and cannot reproduce (motion, transitions, real-time interactions, unpublished instance-swap keys).

**Out-of-scope**

- **Authoring design.** The plugin never invents, renames, restyles, or reorders anything — that is a SOURCE change (`*.meta.ts`, `src/tokens/*`, or the build scripts). See [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md).
- **Generating the bundle.** `figma/tds.plugin.json` is produced by `scripts/build-manifest.ts` (`manifest:build`); its shape is owned by [05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md) and [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md).
- **Token/component/variant semantics** — owned by [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md), [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md), [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md).
- **Backend / API / DB.** _Not applicable to the plugin_ — the plugin declares `networkAccess.allowedDomains: ["none"]` and never talks to a server. Any backend is **PLANNED** and irrelevant here.

## 4. Rules

**Contract fidelity**

1. The plugin **MUST** treat `figma/tds.plugin.json` as its single, authoritative input. It **MUST NOT** read component source, Storybook, or any network resource at runtime (`networkAccess.allowedDomains` is `["none"]` — keep it so).
2. `figma/plugin/src/types.ts` **MUST** mirror the bundle shape verbatim. You **MUST NOT** add, rename, or drop a field to work around a bundle problem — fix the generator (`scripts/build-manifest.ts`) instead.
3. The plugin **MUST** iterate the manifest generically. You **MUST NEVER** add a per-component `if (comp.name === …)` branch in `components.ts`. Per-component fidelity lives only in `recipes.ts`, keyed by `slug`, and each recipe **MUST** reproduce the Storybook render — never a new design (Design Lock, [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md)).

**Variables & Styles**

4. `buildVariables` **MUST** run its two passes: (1) create every collection, mode and variable so all ids exist; (2) set `valuesByMode`, resolving `VARIABLE_ALIAS` against the full registry. A `VARIABLE_ALIAS` **MUST** resolve to a `Variable` created in an earlier collection; an unresolved alias is a **blocking** warning (fails the harness).
5. Collection order **MUST** stay Primitives → Semantic → Theme (aliases only point backward). Theme **MUST** carry modes `light` + `dark`; Primitives/Semantic use a single `default` mode.
6. Effect Styles **MUST** be built before components (their ids back the `shadow` bindings). Text Styles **MUST** preserve weight on font fallback (never silently swap weight).

**Variants & Properties**

7. `cartesian(variantAxes)` **MUST** place the all-defaults combination **first** (via `orderedOptions`) so the Component Set's default variant matches the contract. Variant node names **MUST** stay `Axis=value, Axis=value` (comma-space separated) so `combineAsVariants` groups them.
8. The **`state` axis** (`default/hover/active/focus/disabled/loading`) **MUST NOT** be a Figma variant. Per repo policy it is stripped from `variantAxes` by the generator; it survives only in `comp.states[]` (rendered into the set description) and, for `disabled`/`loading`, as `BOOLEAN` component properties. Rationale: emitting it would explode combinations (Button alone ≈ 4,050+). Do **not** re-introduce it in the plugin.
9. Components carrying a `type` (A/B/C layout preset) axis **MUST** be split by the generator into **one Component Set per preset**, named `"<Letter> Type - <Name>"` (e.g. `A Type - Card`), each pinning its Type variant. The plugin reproduces whatever sets the bundle lists; it **MUST NOT** merge or invent the split.
10. Non-variant properties **MUST** map: `TEXT` → the label node's `characters`; `BOOLEAN` → a marker layer's `visible`; `INSTANCE_SWAP` → a placeholder instance's `mainComponent`. Every property assignment **MUST** be isolated (try/catch per layer) so one rejected reference never aborts the run.

**Pages, docs & honesty**

11. Output **MUST** be organized into the 8 pages of `PAGE_TITLES` (`Foundation`, `Layout`, `Navigation`, `Actions`, `Input`, `Data Display`, `Feedback`, `Overlay`), named `TDS · <N>. <Title>`. The current page **MUST** be reused as `Foundation`; the other seven created with `figma.createPage()`. Page switches **MUST** use `figma.setCurrentPageAsync` (the synchronous `figma.currentPage =` setter is unreliable in the plugin runtime and previously crashed `combineAsVariants`).
12. The classifier `pageForComponent` **MUST** stay first-match-wins over `tags`; `classifyCounts` **MUST** warn on drift (`classified ≠ defs.length`).
13. Every set's `description` **MUST** carry the full contract spec (`Composition`: variants + properties + slots, plus `Accessibility`) so Dev Mode shows the authoring surface — the harness asserts this.
14. Where Figma has no equivalent (CSS `transition`/motion, real interactions), the plugin **MUST** skip gracefully and emit **one consolidated note** (never per-variant spam). It **MUST NEVER** fabricate a substitute (e.g. do not invent an animation, do not invent a color).

**Build discipline**

15. `figma/plugin/code.js` is a **generated output** (esbuild) and is git-ignored — **NEVER** hand-edit it. Change `src/*.ts` and re-run `plugin:build`.
16. Any change to plugin source **MUST** pass `npm run figma:build` (which ends in `plugin:test`) before commit. A red harness **MUST** block merge (see [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md), [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)).

## 5. Workflow

### 5.1 Build & verify pipeline (the real npm scripts)

```bash
# Regenerate the bundle from source, then typecheck, bundle, and headless-verify the plugin.
npm run figma:build
#  = ds:build            (tokens:build && manifest:build && catalog:build)
#  → plugin:typecheck    (tsc -p figma/plugin/tsconfig.json)
#  → plugin:build        (esbuild figma/plugin/src/code.ts --bundle --loader:.json=json
#                         --format=iife --target=es2017 --outfile=figma/plugin/code.js)
#  → plugin:test         (tsx figma/plugin/test/harness.ts  → exit 1 on any mismatch)
```

Individual steps when iterating on the plugin only:

```bash
npm run plugin:typecheck   # types still mirror the bundle?
npm run plugin:build       # re-bundle code.js
npm run plugin:test        # headless coverage gate
```

### 5.2 Runtime algorithm (order in `code.ts` → `run()`)

1. **Load** — `bundleJson` is inlined at build time; cast to `Bundle`. `figma.showUI(__html__, { width: 380, height: 460 })`. Reset `warnings`.
2. **Variables** (`progress 0.02`) — `buildVariables(t.collections)` → `VariableRegistry`.
3. **Effect Styles** (`0.26`) — `buildEffectStyles(t.effectStyles)` → id map.
4. **Text Styles** (`0.28`) — `await buildTextStyles(t.textStyles)`.
5. **Doc chrome** — `makePalette(new Tokens(t))` (colors resolved from real tokens) + `await loadDocFonts()` (Inter UI chrome).
6. **Pages** (`0.29`) — `createPages()` reuses the current page as Foundation, creates the other 7.
7. **Foundation** (`0.29`) — `buildFoundation(...)` renders the 6 token cards; returns the page canvas root for the Cover.
8. **Component Sets** (`0.30 → 0.96`) — `buildComponents(...)`: insert the Cover card at the top of Foundation, then group components by page and, **per page**, `setCurrentPageAsync` → build each component's variants (yielding every `YIELD_EVERY = 150` via `breathe()`), `combineAsVariants` into the card body, `gridComponentSet` to a wrapping grid, then `wireProperties`.
9. **Finish** — `flushFontNotes()` (one note listing any real families that fell back to Inter), then `done(...)` with the totals and land on the Foundation page.

### 5.3 Per-variant construction (`buildVariant` / recipes)

For each cartesian combo: `resolveChannels(comp, combo)` computes the effective token id per visual channel (`fill/stroke/radius/gap/padX/padY/height/fontSize/text/shadow`) by starting from `comp.figma` and letting each `tokenBinding` whose `when` matches the combo override it. If a `RECIPES[comp.slug]` exists, it renders a faithful miniature; otherwise the generic path builds an Auto-Layout (or fixed) box, binds padding/gap/radius/height to Variables via `setBoundVariable`, paints fill/stroke via `boundFill` (`transparent` clears), adds leading/trailing `INSTANCE_SWAP` slots, a `TEXT` label, `BOOLEAN` marker dots, and applies the `shadow` effect style.

### 5.4 Using the plugin in Figma (manual)

1. `npm run figma:build` to (re)generate `figma/tds.plugin.json` + `figma/plugin/code.js`.
2. In Figma: Plugins → Development → Import plugin from manifest → `figma/plugin/manifest.json`.
3. Run it, click **Generate design system**, watch the progress bar/log. On completion the file holds 8 pages, 3 variable collections, all styles, 6 foundation cards, and every component set.

## 6. Examples

### 6.1 Cartesian generation with default-first ordering

```ts
// figma/plugin/src/components.ts
function orderedOptions(axis: VariantAxis): string[] {
  if (!axis.default || !axis.options.includes(axis.default)) return axis.options;
  return [axis.default, ...axis.options.filter((o) => o !== axis.default)];
}
function cartesian(axes: VariantAxis[]): Record<string, string>[] {
  let combos: Record<string, string>[] = [{}];
  for (const axis of axes)
    combos = combos.flatMap((c) => orderedOptions(axis).map((opt) => ({ ...c, [axis.name]: opt })));
  return combos; // combos[0] === all-defaults → the set's default variant
}
```

### 6.2 `when`-filtered token binding → bound Variable

```jsonc
// A Button binding in figma/tds.plugin.json (design.components[].tokenBindings[])
{ "property": "background", "token": "color.brand.solid",
  "when": { "variant": "solid", "tone": "brand" } }
```

```ts
// resolveChannels(): base first, then matching bindings override the channel.
for (const b of comp.tokenBindings || []) {
  if (!matches(b.when, combo)) continue;      // combo must satisfy every key in `when`
  if (b.property === 'background') ch.fill = b.token;
  // …color → text, border-color → stroke, corner-radius → radius, gap/padding-*/height/font-size…
  // 'transition' → warn once (no Figma equivalent), unknown → warn once.
}
// buildVariant(): ch.fill === 'transparent' clears; else bind the Variable.
const v = ctx.vars.get(ch.fill);
if (v) node.fills = [boundFill({ r: 0.5, g: 0.5, b: 0.5 }, v)];
```

### 6.3 Two-pass variable build with alias resolution

```ts
// figma/plugin/src/variables.ts — pass 2 resolves a Theme alias into a Primitive.
case 'VARIABLE_ALIAS': {
  const target = registry.get(mv.aliasId);            // e.g. "color.neutral.900"
  if (!target) { warn(`Unresolved alias ${mv.aliasName} (${mv.aliasId})`); return; } // blocking
  variable.setValueForMode(modeId, { type: 'VARIABLE_ALIAS', id: target.id });
}
```

### 6.4 First-match-wins page classifier

```ts
// figma/plugin/src/pages.ts — order is deliberate: Tooltip (overlay,feedback) → Feedback.
export function pageForComponent(comp: ComponentDef): PageTitle {
  const tags = (comp.tags || []).map((t) => t.toLowerCase());
  const has = (...w: string[]) => w.some((x) => tags.includes(x));
  if (has('chart', 'data-viz')) return 'Data Display';
  if (has('feedback')) return 'Feedback';
  if (has('overlay')) return 'Overlay';
  if (has('layout', 'surface', 'container', 'separator', 'list')) return 'Layout';
  if (has('navigation')) return 'Navigation';
  if (has('action', 'auth', 'oauth', 'social-login')) return 'Actions';
  if (has('form', 'input', 'selection', 'search', 'upload', 'date', 'toggle', 'range')) return 'Input';
  return 'Data Display';
}
```

### 6.5 A representative harness check line

```text
=== Plugin generator — headless coverage ===
PASS  collections: 3 / 3
PASS  component sets: 60 / 60
PASS  default variant first: 60 / 60
PASS  no empty variant (every variant renders content): <n> / <n>
PASS  token-styled variants ≥ 90% (CSS→token 1:1): <floor> / <floor>
PASS  chart palette is theme-aware (light≠dark ≥4): 4 / 4
HEADLESS VERIFICATION PASSED
```

## 7. Validation Rules

Compliance is machine-checked; there is no "looks right" pass.

1. **Typecheck** — `npm run plugin:typecheck` (`tsc -p figma/plugin/tsconfig.json`, `strict`, `noUnusedLocals/Parameters`). Types in `types.ts` must still mirror the bundle.
2. **Bundle** — `npm run plugin:build` must produce `figma/plugin/code.js` without esbuild errors.
3. **Headless harness** — `npm run plugin:test` (`figma/plugin/test/harness.ts`) is the gate. It mocks the Figma API, imports the **real** `src/code.ts`, fires `{ type: 'run' }`, and asserts ~35 checks derived from the real contract, including:
   - counts: `collections`, `variables`, `alias values resolved`, `effect styles`, `text styles`, `component sets`, `variant components (+1 placeholder)`, `pages = 8`, `foundation token cards = 6`;
   - property coverage: `TEXT/BOOLEAN/INSTANCE_SWAP` props match the contract, and each set registers **exactly** its non-variant properties;
   - fidelity: `default variant first`, `descriptions with a11y`, `descriptions carry the Composition spec`, `no empty variant (every variant renders content)`, `token-styled variants ≥ 90%`, Auto-Layout on every set + every structural variant root, A/B/C Type sets pin their Type variant, padding/gap/radius bound to tokens, `shadow effect styles applied`, one shared Icon swap source that is token-colored, `chart/1..6` present and theme-aware (light ≠ dark ≥ 4).
   - It also fails on any **blocking** warning (`Unresolved alias | unknown mode | not found`).
4. **Full pipeline** — `npm run figma:build` chains all of the above after regenerating the bundle; this is the pre-commit command.
5. **Lint/format** — `npm run lint` (`eslint .`) and `npm run format` (prettier) cover the plugin `.ts` sources.
6. **Runtime warnings** — non-blocking notes (missing real fonts → Inter; `transition` has no Figma equivalent; local Icon key not usable as a bound swap) are expected and surfaced once each; they do **not** fail the build but **MUST** be understood before shipping.
7. **Manual smoke** (post-merge, optional) — import the plugin in a scratch Figma file, Generate, and confirm 8 pages + Foundation + all sets. Manual editing of the generated file never flows back up ([05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md)).

## 8. Checklist

- [ ] Ran `npm run figma:build`; `plugin:test` prints `HEADLESS VERIFICATION PASSED`.
- [ ] `types.ts` still mirrors `figma/tds.plugin.json` (no invented/renamed/dropped fields).
- [ ] No per-component `if` branch added to `components.ts`; per-component fidelity lives in `recipes.ts` keyed by `slug`.
- [ ] Every recipe reproduces the Storybook render — no new colors, spacing, radius, or layout (Design Lock).
- [ ] `state` axis is **not** a variant; `disabled`/`loading` remain `BOOLEAN` props; `states[]` shows in the description.
- [ ] All `VARIABLE_ALIAS`es resolve (no blocking warnings); collection order Primitives → Semantic → Theme intact.
- [ ] Page switches use `setCurrentPageAsync`; `classifyCounts` reports no drift.
- [ ] Every set `description` includes `Composition` + `Accessibility`.
- [ ] Motion/transition/interaction gaps skipped gracefully with a single consolidated note — never fabricated.
- [ ] `manifest.json` still declares `networkAccess.allowedDomains: ["none"]`.
- [ ] Did **not** hand-edit `figma/plugin/code.js` or `figma/tds.plugin.json`.
- [ ] Updated `.ai/PLUGIN_INDEX.json` / `.ai/FIGMA_MAPPING.json` if the algorithm or coverage changed ([27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md)).

## 9. Failure Recovery

| Symptom | Diagnosis | Fix | Resume |
| --- | --- | --- | --- |
| `plugin:test` FAIL `variables`/`alias values resolved` | Bundle changed shape, or an alias points forward/at a missing id | Re-run `manifest:build`; ensure Primitives → Semantic → Theme order and that aliases target earlier collections; correct the **source** token, not `variables.ts` | `npm run figma:build` |
| Harness FAIL `component sets` / `variant components` | `figmaVariantCombinations` in the bundle ≠ what `cartesian` produced (often a re-introduced `state` axis) | Confirm the generator strips `state` from `variantAxes`; do not iterate `states[]` in `cartesian` | `plugin:test` |
| Harness FAIL `default variant first` | `orderedOptions` bypassed, or an axis `default` missing from `options` | Restore default-first ordering; fix the meta's default in source | `plugin:test` |
| Harness FAIL `no empty variant` / `token-styled ≥ 90%` | A recipe/generic path rendered an empty box, or a `tokenBinding` property is unmapped | Check `resolveChannels` mapping and the recipe; add the missing channel or binding case | `plugin:test` |
| Runtime: `combineAsVariants: Grouped nodes must be in the same page` | Page switched with the synchronous setter, or the card body wasn't on the current page | Use `figma.setCurrentPageAsync`; append the doc card **before** combining | Re-run plugin |
| Runtime: `layoutPositioning = ABSOLUTE` throws | A BOOLEAN marker dot set absolute before its parent had Auto Layout | Only set `ABSOLUTE` when `hasLayout`; the harness reproduces this constraint | `plugin:test` |
| `INSTANCE_SWAP` not exposed as a bound prop | Local Icon component has no usable `.key` in this runtime | Expected — one consolidated note; slots still render the real Icon and are manually swappable. Publish Icon to a library to bind it | none needed |
| Fonts render as Inter | Real families (Paperlogy / Pretendard / JetBrains Mono) not installed | Expected fallback (weight preserved); one `flushFontNotes` note. Install families for exact type | none needed |
| `tsc` error after bundle change | `types.ts` drifted from the contract | Update `types.ts` to match `figma/tds.plugin.json` verbatim | `plugin:typecheck` |

When context is lost mid-task, rehydrate from [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md): read `.ai/PLUGIN_INDEX.json` + `.ai/SESSION_SUMMARY.md`, re-run `npm run figma:build`, and reconcile against the checks in §7.

## 10. Dependencies

**Docs:** [00_MASTER_RULES.md](./00_MASTER_RULES.md), [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md), [04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md), [05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md), [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md), [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md), [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md), [10_ANIMATION_SPECIFICATION.md](./10_ANIMATION_SPECIFICATION.md), [11_INTERACTION_SPECIFICATION.md](./11_INTERACTION_SPECIFICATION.md), [12_RESPONSIVE_SPECIFICATION.md](./12_RESPONSIVE_SPECIFICATION.md), [13_ACCESSIBILITY_SPECIFICATION.md](./13_ACCESSIBILITY_SPECIFICATION.md), [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md), [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md), [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md), [39_AI_CHECKLIST.md](./39_AI_CHECKLIST.md).

**Manifests:** [.ai/PLUGIN_INDEX.json](../../.ai/PLUGIN_INDEX.json), [.ai/FIGMA_MAPPING.json](../../.ai/FIGMA_MAPPING.json), [.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json), [.ai/VARIANT_INDEX.json](../../.ai/VARIANT_INDEX.json), [.ai/TOKEN_INDEX.json](../../.ai/TOKEN_INDEX.json).

**Source & scripts (repo):** input `figma/tds.plugin.json` (from `scripts/build-manifest.ts`) and `src/tokens/generated/figma.tokens.json` (from `scripts/build-tokens.ts`); the hand-authored contract `figma/README.md`; plugin runtime `figma/plugin/src/{code,variables,styles,components,recipes,pages,foundation,doc,log,types}.ts`, `figma/plugin/manifest.json`, `figma/plugin/ui.html`; gate `figma/plugin/test/harness.ts`. npm scripts: `tokens:build`, `manifest:build`, `ds:build`, `plugin:typecheck`, `plugin:build`, `plugin:test`, `figma:build`.

## 11. Template

Adding per-component fidelity is a **recipe**, never a branch in `components.ts`. Skeleton for `figma/plugin/src/recipes.ts`:

```ts
// A faithful miniature of the Storybook <Widget> — reproduction only, no new design.
const widget: Recipe = ({ node, comp, combo, ch, vars, effects, placeholder, fonts }): VariantLayers => {
  node.layoutMode = 'HORIZONTAL';
  node.primaryAxisSizingMode = 'AUTO';
  node.counterAxisSizingMode = 'AUTO';

  applyPadding(node, vars, ch.padX, ch.padY);           // bind spacing tokens
  if (ch.gap) bindGap(node, vars, ch.gap);
  if (ch.radius) for (const c of CORNERS) bindRadius(node, vars, c, ch.radius);
  applyFill(node, vars, ch.fill);                        // 'transparent' clears
  if (ch.shadow) void node.setEffectStyleIdAsync(effects.get(ch.shadow)!);

  const label = txt(String(comp.name), fonts.regular, 14); // wired to first TEXT prop later
  node.appendChild(label);

  return { node, label, swaps: {}, bools: {} };          // VariantLayers contract
};

export const RECIPES: Record<string, Recipe> = {
  // …existing 50+ recipes (button, card, tabs, select, bar-chart, …)…
  widget, // key MUST equal the component slug in the bundle
};
```

Then: `npm run figma:build`. If the harness flags an uncovered channel or an empty variant, extend the recipe until every variant renders and ≥ 90 % carry a token-bound paint.

## 12. Future Extension

The plugin is designed to scale **without algorithm changes** — new components/tokens/variants flow through as more manifest entries the same loop already handles. Directions that keep it enterprise-grade for years and toward >10,000,000 users:

- **More recipes, same shape.** Every future component gets a `slug`-keyed recipe; the generic fallback guarantees it still reproduces even before a bespoke recipe exists. No `components.ts` growth.
- **Deeper Figma capabilities as they ship.** When Figma exposes stable APIs for prototype interactions or motion, add them behind the same honest "reproduce if possible, else one note" rule ([10_ANIMATION_SPECIFICATION.md](./10_ANIMATION_SPECIFICATION.md), [11_INTERACTION_SPECIFICATION.md](./11_INTERACTION_SPECIFICATION.md)); until then the consolidated-note policy holds.
- **Library-published Icon → bound instance-swap.** Publishing the Icon primitive to a team library gives it a stable `key`, upgrading icon slots from manually-swappable to fully bound `INSTANCE_SWAP` properties — a source/publish change, not a plugin rewrite.
- **Bundle streaming for very large systems.** If `design.components[]` grows past comfortable memory, the generator can chunk the bundle and the plugin can iterate chunks; the two-pass variable build and the per-page `setCurrentPageAsync` batching already keep the UI responsive via `breathe()`/`YIELD_EVERY`.
- **Harness as living contract.** As coverage expectations rise, add checks to `figma/plugin/test/harness.ts` first (red), then satisfy them — the gate scales the guarantees, not just the code.
- **MCP-driven runs.** An MCP agent can invoke `figma:build` and read `.ai/PLUGIN_INDEX.json` to reconcile Storybook ↔ Figma sync automatically ([35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md)), keeping the reproduction perpetually in step with the immutable source.
- **Determinism guarantee.** The bundle → Figma mapping is pure and idempotent; re-running always yields the same structure. This underpins CI drift detection ([30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)) and safe automated regeneration at any scale.
