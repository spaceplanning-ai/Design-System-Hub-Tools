# 08 — Token Specification

> **Title:** Token Specification
> **Purpose:** Define the TDS design-token model — primitives → semantic → theme collections plus effect/text styles — its DTCG shape, `--tds-*` CSS-variable generation, the Figma variable/style mapping, alias resolution, and the workflow to add or change a token.
> **Status:** ACTIVE
> **Owner:** AI OS
> **Last-reviewed:** _(placeholder — set on review)_
> **Precedence:** Subordinate to [00_MASTER_RULES.md](./00_MASTER_RULES.md). Tokens are **source of truth #2** (design truth) per the Source-of-Truth Hierarchy; the generated files under `src/tokens/generated/` and `figma/` are derived outputs (#3) and are **never** authoritative over the `src/tokens/*.ts` sources. Where this doc touches backend/DB/API/CI it is marked **PLANNED**.

---

## 1. Purpose

Design tokens are the atomic, named design decisions of TDS — every color, dimension, font, motion value, shadow, and typographic composite. They are authored once in TypeScript under `src/tokens/` and are the **single upstream source** that feeds four downstream consumers:

1. **Web CSS** — `src/tokens/generated/tokens.css` (`--tds-*` custom properties, light default + dark overrides, typography/shadow vars, utility classes).
2. **Figma variables & styles** — `src/tokens/generated/figma.tokens.json`, later wrapped into the plugin bundle `figma/tds.plugin.json` under its `tokens` key.
3. **Type-safe references** — `src/tokens/generated/token-ids.ts` (`TokenId` union + `tokenIds[]`) consumed by `*.meta.ts` token bindings.
4. **The AI cache** — `.ai/TOKEN_INDEX.json` (a flat, machine-readable index of every token, its type, modes, aliases, scopes; see [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md)).

This document specifies the token **model**, the **naming contract**, the **generation pipeline**, and the **add/change workflow**. It is the authority any agent MUST read before touching a color, spacing value, font, shadow, motion value, or breakpoint.

---

## 2. Responsibilities

This specification owns:

- The **type model** (`TokenType`, `DesignToken`, `TokenCollection`, `TokenAlias`, `ShadowValue`, `TypographyValue`) as declared in `src/tokens/types.ts`.
- The **three-layer architecture**: Primitives (raw), Semantic (roles/scalars), Theme (light/dark color aliases), plus **Effect Styles** and **Text Styles** as composite outputs.
- The **naming contract**: dot-notation id → `--tds-*` CSS var (dashes) → Figma variable name (slashes).
- **Alias semantics** (`ref()`) and **resolution** (`resolveValue()` chasing chains across collections).
- **Figma scopes** (`FigmaScope`) attached to each token so variables are constrained correctly in the Figma UI.
- The **generation pipeline** (`scripts/build-tokens.ts` via `npm run tokens:build`) and its three artifacts.
- The **workflow and validation** for adding, renaming, or re-valuing a token without breaking Design Lock.

It does **not** own: component variant axes ([09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md)), how a component consumes tokens in CSS ([07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md)), motion usage semantics ([10_ANIMATION_SPECIFICATION.md](./10_ANIMATION_SPECIFICATION.md)), or the plugin's variable-creation algorithm ([06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md)).

---

## 3. Scope

**In scope**
- Files: `src/tokens/types.ts`, `primitives.ts`, `semantic.ts`, `helpers.ts`, `index.ts`.
- Generator: `scripts/build-tokens.ts` and its outputs in `src/tokens/generated/` (`tokens.css`, `figma.tokens.json`, `token-ids.ts`).
- The `tokens` half of the Figma bundle contract (`figma/tds.plugin.json`).
- CSS-variable naming, theme modes (`light`/`dark`), scopes, aliases, effect/text styles.

**Out of scope**
- Component/variant `tokenBindings` (which token applies to which property under which `when{}` filter) — that is derived by `scripts/lib/css-bindings.ts` and specified in [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md).
- The full plugin algorithm that materializes variables in Figma — [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md).
- Any backend token store, theming API, or per-tenant theming service — **PLANNED**, none exists today.

---

## 4. Rules

Rules are enforceable and phrased MUST / SHOULD / NEVER.

1. **MUST author tokens only in `src/tokens/*.ts`.** Every token is created via the `tok()` (single-mode) or `themed()` (light/dark) helper in `src/tokens/helpers.ts`, or the batch helpers `scaleTokens()` / `colorScaleTokens()`.
2. **NEVER hand-edit generated outputs.** `src/tokens/generated/tokens.css`, `figma.tokens.json`, `token-ids.ts`, and `figma/tds.plugin.json` are AUTO and marked "do not edit by hand." Change the source and re-run the build (Generated-Is-Sacred, [00_MASTER_RULES.md](./00_MASTER_RULES.md)).
3. **MUST use dot-notation ids** (`color.brand.solid`, `space.4`, `text.body`). The id is the global key in `tokenRegistry` and MUST be unique across all collections.
4. **MUST reference other tokens with `ref('id')`, never with a literal.** A semantic/theme value that should track a primitive MUST be an alias so Figma emits a `VARIABLE_ALIAS` and a single primitive edit re-themes downstream. Example: `color.brand.solid` → `ref('color.brand.500')`.
5. **MUST place each token in the correct layer.** Raw values (hex, px scales, font families, motion primitives, breakpoints) live in `primitiveCollection`. Role scalars and control sizing live in `semanticScalarCollection` (id `semantic`). Theme-aware colors (light + dark) live in `semanticColorCollection` (name **Theme**, id `theme`). Shadows → `effectCollection`; typography composites → `textStyleCollection`.
6. **MUST tag every scalar token with the correct `FigmaScope[]`** so it is applicable to the right Figma property (e.g. `CORNER_RADIUS` for radii, `GAP`/`WIDTH_HEIGHT` for spacing, `FONT_SIZE`, `TEXT_FILL`/`ALL_FILLS`/`STROKE_COLOR` for colors). Untagged scalars default to `['ALL_SCOPES']` in the Figma emitter.
7. **NEVER hardcode a color/spacing/radius/shadow in component CSS.** Components MUST reference `var(--tds-*)` only. This is verified indirectly by `scripts/lib/css-bindings.ts` (it can only bind variables it finds).
8. **MUST keep `light` and `dark` in sync** for every `themed()` color: both mode keys are required (the `themed()` signature enforces `{ light, dark }`).
9. **MUST NOT change a token's visual value on AI initiative** (Design Lock, [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md)). Re-valuing is a requested/approved source change that flows through the pipeline.
10. **SHOULD prefer adding a semantic role over widening component CSS** to a new primitive: if two components need "the danger fill," add/point to `color.danger.solid`, don't inline `color.red.500`.
11. **MUST run `npm run tokens:build`** (or `ds:build` / `figma:build`) after any token change and commit the regenerated outputs alongside the source in the same change.
12. **NEVER introduce a mode key** other than a collection's declared `modes`. Theme is the only multi-mode collection today (`light`, `dark`); all others use `['default']`.

---

## 5. Workflow

### 5.1 The generation pipeline

`npm run tokens:build` runs `tsx scripts/build-tokens.ts`, which imports `allCollections` and `tokenRegistry` from `src/tokens/index.ts` and writes three files into `src/tokens/generated/`:

```
src/tokens/*.ts  ──▶  scripts/build-tokens.ts  ──▶  tokens.css        (web)
                                                └─▶  figma.tokens.json (Figma variables/styles)
                                                └─▶  token-ids.ts      (TokenId union)
```

`tokens:build` is the first stage of `ds:build`:

```bash
ds:build     = tokens:build && manifest:build && catalog:build
figma:build  = ds:build && plugin:typecheck && plugin:build && plugin:test
```

`manifest:build` (`scripts/build-manifest.ts`) folds `figma.tokens.json` into the plugin bundle `figma/tds.plugin.json` as its `tokens` field (`{ tokens, design }`). The bundle contract is in [figma/README.md](../../figma/README.md) and mirrored in [05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md) / [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md).

### 5.2 What the CSS emitter produces

`buildCss()` splits collections into single-mode and multi-mode:

- `:root { … }` — every single-mode collection at its `defaultMode`, **plus** the `light` mode of every themed collection.
- `[data-theme='dark'] { … }` — the `dark` mode of every themed collection (explicit user selection).
- `@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) { … } }` — the same dark values for OS preference, unless the user forced light.
- Typography utility classes (`.tds-text-body`, `.tds-text-h1`, …) mirroring each Text Style.

Scalar formatting rules (`cssScalar`): `dimension` → `Npx`, `duration` → `Nms`, `number`/`fontWeight` → bare number, `color`/`fontFamily`/`cubicBezier`/`string` → verbatim. An alias value emits `var(--tds-…)` (so runtime overrides cascade). Shadows emit a composed `box-shadow` string; typography composites explode into sub-vars (see §6.4).

### 5.3 What the Figma emitter produces

`buildFigmaJson()` emits `{ $schema, version, description, collections[], effectStyles[], textStyles[] }`:

- `collections` = all collections **except** `effect` and `text` → the three Variable collections **Primitives**, **Semantic**, **Theme**. Only scalar tokens (`figmaVariableType(type) !== null`) become variables.
- Each variable carries `id`, `name` (slash-notation), `type`, `figmaType` (`COLOR|FLOAT|STRING|BOOLEAN`), `scopes`, `group`, and `valuesByMode`. A color literal is pre-converted to `{ r,g,b,a }` in 0..1; an alias becomes `{ type:'VARIABLE_ALIAS', aliasId, aliasName, aliasCollection }`.
- `effectStyles` = every `shadow` token → `DROP_SHADOW`/`INNER_SHADOW` layers (rgba 0..1).
- `textStyles` = every `typography` token → `{ fontFamily, fontSize, fontWeight, lineHeightPercent, letterSpacingEm }` (aliases resolved to concrete numbers).

### 5.4 Adding or changing a token (step by step)

1. Pick the layer: primitive (raw), semantic scalar, theme color, effect, or text.
2. Add the token in the matching source file using `tok()` / `themed()` (or extend a scale record + `scaleTokens`/`colorScaleTokens`).
3. Give it a unique dot-id, correct `type`, correct `FigmaScope[]`, and a `group` label.
4. If it should track another token, use `ref('other.id')` — do not inline the literal.
5. Run `npm run ds:build` (regenerates CSS, Figma JSON, `token-ids.ts`, manifest, catalog).
6. Reference it in component CSS as `var(--tds-…)` and, if bound in metas, via its `TokenId`.
7. Run `npm run figma:build` to typecheck the plugin and prove the headless harness still passes.
8. Update `.ai/TOKEN_INDEX.json` (and `.ai/CHANGELOG.md`) per [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md); commit source + generated + manifests together.

---

## 6. Examples

### 6.1 A primitive color scale (from `primitives.ts`)

```ts
// helpers expand a raw scale into single-mode `color` tokens with fill+stroke scopes
...colorScaleTokens('color.brand', brand, 'Brand'),
// → color.brand.50 … color.brand.950, each scoped ['ALL_FILLS','STROKE_COLOR']
```

Emitted CSS: `--tds-color-brand-500: #3366ff;` · Figma variable name: `color/brand/500` (COLOR, `{r,g,b,a}`).

### 6.2 A themed semantic color (alias into a primitive)

```ts
themed(
  'color.brand.solid',
  'color',
  { light: ref('color.brand.500'), dark: ref('color.brand.500') },
  { group: 'Brand', scopes: ['ALL_FILLS', 'STROKE_COLOR'] },
);
```

CSS (light in `:root`, dark in the two dark blocks):

```css
:root            { --tds-color-brand-solid: var(--tds-color-brand-500); }
[data-theme='dark'] { --tds-color-brand-solid: var(--tds-color-brand-500); }
```

Figma: a variable `color/brand/solid` in the **Theme** collection whose `light` and `dark` `valuesByMode` are `VARIABLE_ALIAS` → `color/brand/500` in **Primitives**.

### 6.3 A semantic scalar alias + control sizing

```ts
tok('radius.control', 'dimension', ref('radius.md'), { group:'Radius', scopes:['CORNER_RADIUS'] });
tok('size.control.md', 'dimension', 40, { group:'Sizing', scopes:['WIDTH_HEIGHT'] });
```

→ `--tds-radius-control: var(--tds-radius-md);` and `--tds-size-control-md: 40px;`.

### 6.4 A typography composite (Text Style)

```ts
tok('text.body', 'typography', type('md','regular','normal'), { group:'Body' });
```

Explodes to CSS sub-vars + a utility class:

```css
--tds-text-body-family: var(--tds-font-family-body);
--tds-text-body-size: 16px;
--tds-text-body-weight: 400;
--tds-text-body-line-height: 1.5;
--tds-text-body-letter-spacing: 0em;

.tds-text-body { font-family: …; font-size: 16px; font-weight: 400; line-height: 1.5; letter-spacing: 0em; }
```

Figma: a **Text Style** `text/body` with concrete `fontFamily`/`fontSize`/`fontWeight`/`lineHeightPercent`/`letterSpacingEm`.

### 6.5 A shadow (Effect Style)

```ts
tok('shadow.md', 'shadow', shadow(6, 16, -2, 0.1), { group:'Shadow' });
```

→ `--tds-shadow-md: 0px 6px 16px -2px rgba(11,14,20,0.1);` and a Figma **Effect Style** `shadow/md` (`DROP_SHADOW`, color rgba 0..1).

### 6.6 The naming contract at a glance

| Layer | Example id | CSS var | Figma name |
|---|---|---|---|
| Primitive | `space.4` | `--tds-space-4` | `space/4` |
| Semantic | `radius.control` | `--tds-radius-control` | `radius/control` |
| Theme | `color.bg.surface` | `--tds-color-bg-surface` | `color/bg/surface` |
| Effect | `shadow.md` | `--tds-shadow-md` | `shadow/md` (Effect Style) |
| Text | `text.h1` | `--tds-text-h1-size` (+siblings) | `text/h1` (Text Style) |

---

## 7. Validation Rules

Compliance is checked by real mechanisms in this repo:

1. **Determinism / build success** — `npm run tokens:build` MUST complete and print `✓ tokens: wrote tokens.css, figma.tokens.json, token-ids.ts (N collections, M tokens)`. Re-running with no source change MUST produce a byte-identical diff (no output drift).
2. **Type safety** — `npm run build` (`tsc -b`) and `plugin:typecheck` MUST pass; the generated `TokenId` union keeps `*.meta.ts` token references honest (`verbatimModuleSyntax`, `strict`).
3. **Alias integrity** — every `ref('id')` MUST resolve: `resolveValue()` chases chains; an unknown id resolves to `undefined` and surfaces as a broken `VARIABLE_ALIAS`/missing CSS var. Reviewers MUST grep for the target id.
4. **Figma coverage** — `npm run plugin:test` (`figma/plugin/test/harness.ts`, headless Figma-API mock) MUST exit 0; it asserts variable/style coverage against the bundle and `process.exit(1)` on any mismatch.
5. **Lint/format** — `npm run lint` (eslint flat config) and `npm run format` (prettier: singleQuote, semi, trailingComma all, printWidth 100) MUST pass on the edited source.
6. **Scope correctness** — manual/review check that each token's `FigmaScope[]` matches its usage (color→fill/stroke/text; length→corner/gap/width-height; typographic→font-* scopes).
7. **Design Lock** — any value change MUST be traceable to an explicit request/approval; unrequested visual deltas are rejected in review ([30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)).

---

## 8. Checklist

- [ ] Token authored in the correct layer via `tok()`/`themed()` (or a scale helper).
- [ ] Unique dot-notation id; not colliding with an existing `tokenRegistry` key.
- [ ] Correct `type` and matching `FigmaScope[]`; sensible `group` label.
- [ ] Cross-token dependencies use `ref('id')`, never inline literals.
- [ ] `themed()` colors define **both** `light` and `dark`.
- [ ] `npm run ds:build` run; `tokens.css`, `figma.tokens.json`, `token-ids.ts` regenerated.
- [ ] `npm run figma:build` green (typecheck + `plugin:test` harness).
- [ ] Component CSS references `var(--tds-…)` only — no literals.
- [ ] `.ai/TOKEN_INDEX.json` + `.ai/CHANGELOG.md` updated; source + generated + manifests committed together.
- [ ] No unrequested visual change (Design Lock respected).

---

## 9. Failure Recovery

| Symptom | Diagnosis | Fix | Resume |
|---|---|---|---|
| `--tds-…` var missing in `tokens.css` | Token not in a collection listed in `allCollections`, or filtered out | Ensure the token's collection is exported and included in `src/tokens/index.ts`; re-run `tokens:build` | Re-run `ds:build` |
| Figma variable is a dangling alias | `ref('id')` target renamed/missing | Fix the alias id or restore the target token; `resolveValue()` must return a concrete value | `plugin:test` |
| `plugin:test` exits 1 (coverage mismatch) | New/removed token not reflected in the bundle, or scope/type mismatch | Re-run `ds:build` so `figma.tokens.json` and `tds.plugin.json` regenerate; re-check `figmaVariableType`/scopes | `figma:build` |
| `tsc` error on a `TokenId` | Meta references an id that no longer exists after rename | Update the meta's token binding to the new id; regenerate `token-ids.ts` | `npm run build` |
| Dark theme wrong/unchanged | Only `light` value set, or dark block not emitted | Use `themed()` with both modes; confirm the collection has `modes: ['light','dark']` | Re-run `tokens:build` |
| Value drift on rebuild | A source token was hand-edited in `generated/` | Revert the generated edit; change the `*.ts` source; regenerate | `ds:build` |

Always re-run `npm run figma:build` after recovery — it is the end-to-end gate (tokens → manifest → plugin typecheck → headless harness).

---

## 10. Dependencies

**Docs**
- [00_MASTER_RULES.md](./00_MASTER_RULES.md) — precedence, Generated-Is-Sacred, Design Lock.
- [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md) — the immutable Design Lock policy tokens must respect.
- [05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md) / [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md) — how the `tokens` bundle becomes Figma variables/styles.
- [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md) / [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md) — how components/variants consume tokens.
- [10_ANIMATION_SPECIFICATION.md](./10_ANIMATION_SPECIFICATION.md) — `duration.*` / `easing.*` / `motion.*` semantics.
- [13_ACCESSIBILITY_SPECIFICATION.md](./13_ACCESSIBILITY_SPECIFICATION.md) — focus-ring tokens, reduced-motion.
- [19_CODE_CONVENTION.md](./19_CODE_CONVENTION.md) — TS/CSS conventions the sources follow.
- [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md) — read `TOKEN_INDEX.json` before source.
- [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md) — schema of `.ai` manifests.

**Manifests**
- [.ai/TOKEN_INDEX.json](../../.ai/TOKEN_INDEX.json) — canonical AI cache of all tokens.
- [.ai/FIGMA_MAPPING.json](../../.ai/FIGMA_MAPPING.json) — token → Figma variable/style map.
- [.ai/DESIGN_MANIFEST.json](../../.ai/DESIGN_MANIFEST.json) — design-truth snapshot.

**Code / scripts**
- Sources: `src/tokens/{types,primitives,semantic,helpers,index}.ts`.
- Generator: `scripts/build-tokens.ts`; consumer: `scripts/build-manifest.ts`.
- Outputs: `src/tokens/generated/{tokens.css,figma.tokens.json,token-ids.ts}`, `figma/tds.plugin.json`.

---

## 11. Template

Copy-paste skeletons for the common cases.

**Single-mode scalar**
```ts
// primitives.ts or semantic.ts
tok('space.custom', 'dimension', 20, { group: 'Spacing', scopes: ['GAP', 'WIDTH_HEIGHT'] });
```

**Semantic alias (single mode)**
```ts
tok('radius.control', 'dimension', ref('radius.md'), { group: 'Radius', scopes: ['CORNER_RADIUS'] });
```

**Theme-aware color (light/dark, alias into primitives)**
```ts
themed(
  'color.role.name',
  'color',
  { light: ref('color.neutral.900'), dark: ref('color.neutral.50') },
  { group: 'Group', scopes: ['ALL_FILLS', 'STROKE_COLOR'] }, // or TEXT_FILL / STROKE_COLOR
);
```

**Effect style (shadow)**
```ts
tok('shadow.name', 'shadow', shadow(offsetY, blur, spread, alpha), { group: 'Shadow' });
```

**Text style (typography composite)**
```ts
tok('text.name', 'typography', type('md', 'regular', 'normal'), { group: 'Body' });
```

**Consume in component CSS**
```css
.tds-thing { background: var(--tds-color-role-name); border-radius: var(--tds-radius-control); }
```

Then: `npm run ds:build && npm run figma:build`.

---

## 12. Future Extension

- **Density / brand modes at scale.** The `TokenCollection.modes` model already supports N modes; a future `density` (compact/comfortable) or multi-brand collection can be added by declaring additional modes and `themed`-style helpers — no generator rewrite. Figma treats each mode as a collection mode automatically.
- **DTCG interchange.** `TokenType` mirrors DTCG `$type`; a future exporter can emit standards-compliant `$value`/`$type` JSON for tool interop without touching sources.
- **Per-tenant theming (PLANNED).** For >10,000,000-user, multi-tenant deployments, a **PLANNED** Supabase-backed theming service could serve per-tenant token overrides as an extra runtime CSS layer over `--tds-*`; the primitive/semantic/theme structure stays the single design source, tenants override only theme-mode aliases. No backend, DB, or theming API exists today.
- **Automated contrast/a11y gates (PLANNED).** A future CI check ([25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md), PLANNED) can compute WCAG contrast for every `color.fg.* / color.bg.*` pair per mode and fail on regressions, extending `plugin:test`.
- **Token deprecation lifecycle.** Renames should follow [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md): add the new id, alias the old to it for one release, update `.ai/CHANGELOG.md`, then remove — keeping the `TokenId` union and Figma variables migration-safe.
