# TDS — Design System Reproducer (Figma plugin)

Rebuilds the TDS design system inside a Figma file directly from the generated contract
[`figma/tds.plugin.json`](../tds.plugin.json). No manual configuration, no per-component code —
the plugin iterates the manifest.

## What it produces

| Source (contract)         | Figma output                                                   |
| ------------------------- | -------------------------------------------------------------- |
| `tokens.collections[]`    | Variable Collections — Primitives → Semantic → Theme, modes, aliases, scopes |
| `tokens.effectStyles[]`   | Effect Styles (drop shadows)                                   |
| `tokens.textStyles[]`     | Text Styles (font/size/weight/line-height/letter-spacing)     |
| `tokens.*` (showcase)     | **Foundation page** — styled token cards: Color System, Typography, Radius & Shape, Spacing, Shadows, Borders (single-platform "Web", single column) |
| `design.components[]`     | Component Sets — full cartesian variant matrix, Auto Layout bound to Variables, per-variant token bindings, component properties wired to layers, laid out on functional Pages |

Component properties are wired to real layers so they function in Figma: **TEXT** → the label
node's characters, **BOOLEAN** → a marker layer's visibility, **INSTANCE_SWAP** → a placeholder
instance's main component.

### Output is organized into auto-generated Pages

Instead of three category sections on one page, output is split across **8 Pages** named
`TDS · <N>. <Title>`, in order:

1. **Foundation** — tokens only (Cover + the six token showcase cards above), no components.
2. **Layout** · 3. **Navigation** · 4. **Actions** · 5. **Input** · 6. **Data Display** ·
   7. **Feedback** · 8. **Overlay** — each holds the component sets classified to it, in a
   single Section titled with the page name + component count.

The current page is reused as **Foundation** (renamed); the other seven are created with
`figma.createPage()`. Each component is routed by a deterministic, first-match-wins classifier
over its `tags` (see `src/pages.ts` → `pageForComponent`): charts → Data Display, then feedback,
overlay, layout/surface/list, navigation, action/auth, form/input, else Data Display. This yields
Layout 8 · Navigation 4 · Actions 4 · Input 17 · Data Display 15 · Feedback 7 · Overlay 5 = 60.
A drift assertion fires if the classified sum ≠ the manifest component count.

## Build

```bash
npm run figma:build        # end-to-end: regenerate contract -> typecheck -> bundle -> verify
npm run plugin:build       # bundle src/ (+ inline the contract) -> figma/plugin/code.js
npm run plugin:watch       # rebuild on change
npm run plugin:typecheck   # tsc against @figma/plugin-typings
npm run plugin:test        # headless verification (mocks Figma, asserts coverage)
```

Because the plugin inlines the contract at build time, prefer **`npm run figma:build`** after any
design-system change — it regenerates `figma/tds.plugin.json`, rebuilds the bundle from it, and
runs the headless verification, so the plugin never ships a stale contract.

### Headless verification

Figma has no CLI, so `plugin:test` mocks the Figma API, runs the real generator against the
real contract, and asserts exact coverage — collections, variables, resolved aliases, styles,
component sets, the full variant count, the TEXT/BOOLEAN/INSTANCE_SWAP → layer wiring, the
**8 pages** (Foundation reused + 7 created), the Cover section, and the **6 Foundation token
cards** — exiting non-zero on any mismatch. It confirms the generator logic; the one thing it cannot
confirm is Figma's own runtime acceptance (e.g. INSTANCE_SWAP default keys), which needs a real
load. Current result: **all checks pass, 0 blocking warnings.**

`code.js` is generated (git-ignored). Re-run `npm run ds:build` first whenever the design
system changes so the inlined contract is fresh, then `npm run plugin:build`.

## Load in Figma

1. Figma desktop → **Plugins → Development → Import plugin from manifest…**
2. Select [`figma/plugin/manifest.json`](manifest.json).
3. Run **TDS — Design System Reproducer**, click **Generate design system**.

The plugin reuses the **current page** as the Foundation page and creates the other seven pages
automatically; run it in an empty file. Progress and any non-fatal notes (e.g. a brand font not
installed locally — Foundation specimens fall back to Inter — or the `transition` token which has
no Figma equivalent) are shown in the plugin log.

## Fidelity notes

- **Per-variant styling comes from the CSS.** The `.meta.ts` files carry almost no visual data,
  so `scripts/lib/css-bindings.ts` parses each component's real `.css` at manifest-build time and
  projects it into `tokenBindings` — background / text / border colors, radius, height, padding,
  gap and font-size — each with a minimal `when` clause over the axes it actually varies on
  (`variant`, `tone`, `size`, `shape`, `state`, …). Nothing is invented: values Figma variables
  can't express (`color-mix()`, focus-ring shadows, gradients, `@media`) are skipped, not
  approximated. This is what makes the generated sets look like Storybook instead of blank boxes,
  and what makes the Style/Tone/Size/State properties visibly change a variant.
- `background: transparent` (outline / ghost / link) clears the fill via a `transparent` sentinel
  token; the same applies to a transparent border.
- Variables are created in two passes so cross-collection `VARIABLE_ALIAS` values always
  resolve (Semantic/Theme → Primitives).
- Variant property names use the human labels from `figmaProperties` (e.g. axis `variant` →
  **Style**), matching how the set reads in Figma.
- `shadow` bindings resolve to Effect Styles (not Variables); `transition` tokens are reported
  as unreproducible rather than approximated.
- Heavy sets are generated **in full** (no truncation). **Button = 4050 variants**; the whole
  library is ~10,812 variants. The generator yields periodically so Figma stays responsive and
  shows progress, but the largest sets are slow — combining a 4050-variant set is a single
  Figma call that can take minutes. This is inherent to reproducing every combination.
