<!--
title: Responsive Specification
Purpose: Define the breakpoint tokens, the mobile/tablet/desktop/wide model, the useMediaQuery hook, Storybook viewports, and how responsiveness is reproduced under Figma's constraint/Auto-Layout model.
Status: ACTIVE
Owner: AI OS
Last-reviewed: 2026-07-08 (placeholder — update on each review)
Precedence: Subordinate to 00_MASTER_RULES.md. On any conflict, the constitution and the Design Lock Policy win. Breakpoint values are a token source (src/tokens/primitives.ts); generated outputs are never authoritative over source.
-->

# 12 — Responsive Specification

> **Responsive is a web/Storybook behavior driven by four breakpoint tokens. It is NOT a Figma variant axis.**
> The four breakpoints (`mobile`, `tablet`, `desktop`, `wide`) are authored once in `src/tokens/primitives.ts`,
> generated into `--tds-breakpoint-*` CSS vars, mirrored as Storybook viewports, and reproduced in Figma via
> Auto-Layout resizing + constraints — never as extra component-set combinations.

---

## 1. Purpose

This document is the single authority for **responsive behavior** in TDS: the breakpoint token set, the
mobile → tablet → desktop → wide model, the `useMediaQuery` hook, the Storybook viewport presets used to
preview responsiveness, and the way Figma *reproduces* responsive layouts without breakpoint logic. It feeds
the runtime manifest [.ai/RESPONSIVE_RULES.json](../../.ai/RESPONSIVE_RULES.json).

Responsiveness in TDS is **token-anchored and mobile-first**. Four dimension tokens define the only sanctioned
breakpoint boundaries. Everything responsive — CSS media queries, JS `matchMedia` calls, Storybook viewport
previews, and Figma frame widths — must derive from these four values. There is exactly one source of truth for
"what a breakpoint is," and it is not hand-typed per component.

Per the Design Lock Policy in [00_MASTER_RULES.md](./00_MASTER_RULES.md) and [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md),
an AI agent MUST NEVER invent a new breakpoint, shift an existing one, or add a "responsive variant" on its own
initiative. Changing a breakpoint is a *token source change* that flows through `npm run ds:build`.

## 2. Responsibilities

- **Own the breakpoint token contract.** Define the exact ids, values, group, scope, and generated names for
  `breakpoint.mobile | tablet | desktop | wide`.
- **Define the tier model** (mobile-first, min-width-oriented semantics) and the canonical query strings each
  tier maps to.
- **Specify `useMediaQuery`** — its signature, SSR-safety contract, and correct usage for JS-driven responsive
  branching (the rare case; CSS is preferred).
- **Specify the Storybook viewport presets** in `.storybook/preview.tsx` and how they preview each tier.
- **Specify the Figma reproduction rule** — responsiveness maps to Auto-Layout sizing (`HUG`/`FILL`/`FIXED`)
  and layer constraints, never to breakpoint media logic (which Figma cannot express).
- **Feed [.ai/RESPONSIVE_RULES.json](../../.ai/RESPONSIVE_RULES.json)** with the machine-readable breakpoint map
  so AI agents resolve responsive facts without reading source.
- **Guard the literal-vs-token gap** — CSS `@media (...)` conditions cannot read `var(--tds-*)`, so literal px in
  media conditions MUST equal the token value. This document names the enforcement.

## 3. Scope

**In-scope**
- The four breakpoint tokens and their generated CSS vars / Figma variables.
- The mobile / tablet / desktop / wide tier model and mobile-first authoring.
- `useMediaQuery` (from `src/hooks/index.ts`) usage and constraints.
- Storybook viewport presets (`mobile`, `tablet`, `desktop`, `wide`) in `.storybook/preview.tsx`.
- Component CSS media-query conventions and the literal-px-must-equal-token rule.
- Figma reproduction of responsiveness (Auto-Layout resizing + constraints; future layout grids).
- The `RESPONSIVE_RULES.json` manifest contract.

**Out-of-scope**
- Token generation mechanics broadly → [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md).
- Variant axes (`type`/`variant`/`tone`/`size`/`shape`) and the state-axis exclusion → [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md).
- Interaction states, focus, keyboard → [11_INTERACTION_SPECIFICATION.md](./11_INTERACTION_SPECIFICATION.md).
- Reduced-motion and a11y viewport concerns → [10_ANIMATION_SPECIFICATION.md](./10_ANIMATION_SPECIFICATION.md), [13_ACCESSIBILITY_SPECIFICATION.md](./13_ACCESSIBILITY_SPECIFICATION.md).
- Figma bundle/algorithm generally → [05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md), [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md).
- Any **PLANNED** backend/API concept of "device" or server-driven layout — not in this repo.

## 4. Rules

**Breakpoint source & values**
1. **R1 (MUST)** — The only sanctioned breakpoints are the four tokens in `src/tokens/primitives.ts`:
   `breakpoint.mobile = 0`, `breakpoint.tablet = 768`, `breakpoint.desktop = 1024`, `breakpoint.wide = 1440`
   (px). NEVER introduce a fifth boundary or alter these values without an approved source change.
2. **R2 (MUST)** — Breakpoint tokens are `dimension`, `group: 'Breakpoint'`, `scopes: ['WIDTH_HEIGHT']`, and live
   in the **Primitives** collection. They generate CSS vars `--tds-breakpoint-mobile|tablet|desktop|wide`
   and Figma variable names `breakpoint/mobile|tablet|desktop|wide`.
3. **R3 (NEVER)** — Do not hardcode a raw pixel breakpoint (e.g. `1024px`) in *authoring* code paths as a
   "magic number." Where CSS forces a literal (media conditions — see R6) the literal MUST equal the token value.

**Tier model & mobile-first**
4. **R4 (MUST)** — Author **mobile-first**: base styles target `mobile` (0), and larger tiers are additive via
   `min-width` media queries at `tablet` (768) / `desktop` (1024) / `wide` (1440). SHOULD prefer `min-width`
   over `max-width` for new work; existing `max-width` breakpoints in component CSS are grandfathered.
5. **R5 (SHOULD)** — Prefer intrinsic responsiveness (Flexbox/Grid, `%`, `min()/max()/clamp()`, `fr`, `ch`) and
   Auto-Layout-friendly sizing over breakpoint media queries. Media queries are for *layout-mode changes*
   (e.g. Card `B` horizontal collapsing to stacked), not for pervasive fine-tuning.

**CSS media queries**
6. **R6 (MUST)** — A CSS `@media (...)` condition cannot read `var(--tds-*)`. Therefore any literal px in a media
   condition MUST be one of the four breakpoint values (768 / 1024 / 1440) — or a documented content breakpoint
   (e.g. the existing `640px` collapse in `Card.css` / `Drawer.css`). NEVER introduce a *new* numeric media
   breakpoint that does not correspond to a token value without approval.
7. **R7 (MUST)** — Inside the media block, all property values stay token-driven `var(--tds-*)`; only the
   *condition* uses a literal. NEVER hardcode colors/spacing/radius inside a responsive block.

**JS responsiveness**
8. **R8 (SHOULD)** — Use CSS first. Only reach for `useMediaQuery` when the branch is *structural and
   impossible in CSS* (rendering a different component tree, e.g. Drawer vs inline panel). Query strings passed
   to `useMediaQuery` MUST use the token pixel values.
9. **R9 (MUST)** — `useMediaQuery` is SSR-safe by contract (initial `false`, resolves in `useEffect`). Consumers
   MUST tolerate a first-render `false` and MUST NOT read `window.matchMedia` directly.

**Figma reproduction**
10. **R10 (NEVER)** — Responsiveness is NEVER a Figma variant axis. Do not emit `mobile/tablet/desktop` as
    variant options; that would explode the cartesian product exactly like the excluded `state` axis
    (see [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md)).
11. **R11 (MUST)** — Figma reproduces responsive intent through **Auto-Layout resizing** (`HUG` / `FILL` /
    `FIXED`) and layer **constraints**, derived from the component's `figma{}` block in its `*.meta.ts`. Frame
    widths for showcase pages SHOULD map to a breakpoint token value.

**Storybook**
12. **R12 (MUST)** — Responsive previewing uses the four named viewports in `.storybook/preview.tsx`
    (`mobile`/`tablet`/`desktop`/`wide`). Do not add ad-hoc viewport sizes in individual stories; extend the
    shared preset if a new device is truly needed.

## 5. Workflow

**A. Reading the breakpoint contract (no source read needed).**
Resolve values from [.ai/RESPONSIVE_RULES.json](../../.ai/RESPONSIVE_RULES.json) or `src/tokens/generated/tokens.css`
(`--tds-breakpoint-*`). Per [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md), prefer the manifest.

**B. Authoring a responsive component (CSS-first).**
1. Confirm reuse-first in [docs/COMPONENTS.md](../COMPONENTS.md) — many components already collapse responsively.
2. Write mobile-first base CSS with token vars.
3. Add `min-width` media queries only at token boundaries (768 / 1024 / 1440); keep property values as
   `var(--tds-*)`.
4. Preview each tier via the Storybook viewport toolbar (`npm run storybook`).
5. No token change means **no `ds:build` needed** — CSS is zero-runtime and consumed directly.

**C. Adding JS-driven responsiveness (rare).**
1. Import `useMediaQuery` from `@/hooks` (barrel).
2. Pass a token-valued query string, e.g. `useMediaQuery('(min-width: 1024px)')`.
3. Branch structure only; keep visual props token-driven.

**D. Changing a breakpoint value (approved source change).**
1. Edit the `breakpoint` object in `src/tokens/primitives.ts`.
2. Run `npm run ds:build` (regenerates `tokens.css`, `figma.tokens.json`, `token-ids.ts`, the manifest, and the
   Figma bundle `figma/tds.plugin.json`).
3. Update every literal media-query condition that referenced the old value (R6) and the Storybook viewport
   preset if the device baseline shifted.
4. Regenerate [.ai/RESPONSIVE_RULES.json](../../.ai/RESPONSIVE_RULES.json) and record the change in
   [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md) per [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md).
5. Run `npm run figma:build` to typecheck/build/verify the plugin against the new bundle.

## 6. Examples

**Breakpoint token authoring** (`src/tokens/primitives.ts`, real):
```ts
/** Responsive breakpoints in px. Drives responsive previews + future Figma layout grids. */
const breakpoint = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
};
// emitted as: tok(`breakpoint.${k}`, 'dimension', v, { group: 'Breakpoint', scopes: ['WIDTH_HEIGHT'] })
```

**Generated CSS vars** (`src/tokens/generated/tokens.css`, real):
```css
--tds-breakpoint-mobile: 0px;
--tds-breakpoint-tablet: 768px;
--tds-breakpoint-desktop: 1024px;
--tds-breakpoint-wide: 1440px;
```

**Mobile-first component CSS** (property values stay token-driven; only the condition is literal):
```css
.tds-card { display: grid; gap: var(--tds-space-3); }

/* tablet and up: switch Card type-B to a horizontal layout preset */
@media (min-width: 768px) {
  .tds-card[data-type='B'] { grid-template-columns: 40% 1fr; }
}
/* desktop and up */
@media (min-width: 1024px) {
  .tds-card { gap: var(--tds-space-4); }
}
```

**Existing content-collapse pattern** (real, `Card.css` / `Drawer.css` use `640px`):
```css
@media (max-width: 640px) {
  /* Card horizontal (B) collapses to stacked below a content threshold */
}
```

**JS-driven structural branch** (only when CSS cannot express it):
```ts
import { useMediaQuery } from '@/hooks';

function NavShell() {
  const isDesktop = useMediaQuery('(min-width: 1024px)'); // token value 1024
  return isDesktop ? <Sidebar /> : <Drawer />; // structure differs, not just styling
}
```

**`useMediaQuery` contract** (real, `src/hooks/index.ts`):
```ts
/** Match a media query, SSR-safe. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);   // first render: false
  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [query]);
  return matches;
}
```

**Storybook viewport presets** (real, `.storybook/preview.tsx`):
```ts
viewport: {
  viewports: {
    mobile:  { name: 'Mobile',  styles: { width: '375px',  height: '812px'  } },
    tablet:  { name: 'Tablet',  styles: { width: '768px',  height: '1024px' } },
    desktop: { name: 'Desktop', styles: { width: '1280px', height: '800px'  } },
    wide:    { name: 'Wide',    styles: { width: '1440px', height: '900px'  } },
  },
},
```
> Note: preview `width` values are *device frame* sizes, not breakpoint boundaries. `tablet`/`wide` frame widths
> coincide with the token boundary (768 / 1440); `mobile` (375) and `desktop` (1280) are representative devices
> that sit inside their tier. This is intentional — a viewport is a preview canvas, a breakpoint is a boundary.

## 7. Validation Rules

- **Token integrity** — `npm run tokens:build` regenerates `--tds-breakpoint-*` and `token-ids.ts`. A drift
  between `primitives.ts` and the generated files fails the build. `breakpoint.mobile|tablet|desktop|wide` MUST
  appear in `src/tokens/generated/token-ids.ts`.
- **Lint** — `npm run lint` (eslint flat config) enforces barrel imports (`@/hooks`, `@/components`) and
  no-hardcoded-token conventions in TS/CSS-in-authoring paths.
- **Manual review gate (R6/R7)** — Because CSS `@media` conditions escape `var()`, a reviewer MUST confirm every
  literal media-condition equals a breakpoint token (768/1024/1440) or an approved content breakpoint (640). Grep
  aid: `rg "@media" src/**/*.css`.
- **Figma bundle** — `npm run manifest:build` / `npm run figma:build` regenerate `figma/tds.plugin.json`; the
  headless harness (`figma/plugin/test/harness.ts`, via `plugin:test`) asserts no responsive axis leaked into any
  component set (R10) and that `figma{}` sizing is honored.
- **Manifest schema** — [.ai/RESPONSIVE_RULES.json](../../.ai/RESPONSIVE_RULES.json) MUST validate against the
  contract in [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md) and match the four token values.
- **Storybook** — `npm run storybook` must expose all four viewport presets; visual preview per tier is the
  acceptance check for responsive component work.

## 8. Checklist

- [ ] Breakpoints resolved from the manifest / generated CSS, not re-typed.
- [ ] Component authored mobile-first; base styles target `mobile` (0).
- [ ] `min-width` media queries only at token boundaries (768 / 1024 / 1440), or an approved content breakpoint.
- [ ] Every literal in a `@media` condition equals a token value (R6).
- [ ] All property values inside responsive blocks use `var(--tds-*)` (R7).
- [ ] `useMediaQuery` used only for structural JS branches, with token-valued query strings.
- [ ] Verified in Storybook across `mobile`, `tablet`, `desktop`, `wide` viewports.
- [ ] No responsive/device variant axis added to any `*.meta.ts` (R10).
- [ ] Figma sizing expressed via `figma{}` Auto-Layout / constraints, not breakpoints (R11).
- [ ] If a breakpoint value changed: `ds:build` + literal-media updates + `RESPONSIVE_RULES.json` + `CHANGELOG.md` + `figma:build`.

## 9. Failure Recovery

| Symptom | Diagnosis | Fix | Resume |
| --- | --- | --- | --- |
| Layout doesn't shift at a boundary | Literal media condition ≠ token value (R6), or `max-width`/`min-width` mismatch | Align the literal to 768/1024/1440; confirm mobile-first direction | Re-preview all four Storybook viewports |
| `useMediaQuery` always returns a stale/`false` value on first paint | Expected SSR-safe contract (R9); consumer treated first render as truth | Guard first-render `false`; branch after effect resolves | Re-render / re-test in the device viewport |
| Figma has a "Mobile/Tablet" variant | Responsive leaked as an axis (R10 violation) | Remove the axis from `*.meta.ts`; express sizing in `figma{}`; re-run `figma:build` | `plugin:test` must pass |
| `--tds-breakpoint-*` missing or stale in `tokens.css` | `tokens:build` not run after editing `primitives.ts` | `npm run ds:build` | Confirm ids in `token-ids.ts` |
| Hardcoded color/space appears inside a media block | R7 violation | Replace with `var(--tds-*)` | `npm run lint` |
| `RESPONSIVE_RULES.json` disagrees with tokens | Manifest not regenerated after a breakpoint change | Regenerate from source; validate vs 27_MANIFEST_SPECIFICATION | Re-run task validation gates |

To **resume after context loss**: read [.ai/RESPONSIVE_RULES.json](../../.ai/RESPONSIVE_RULES.json) and
`src/tokens/generated/tokens.css` for the four values, then [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md)
per [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md).

## 10. Dependencies

- **Docs** — [00_MASTER_RULES.md](./00_MASTER_RULES.md), [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md),
  [04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md), [05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md),
  [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md), [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md),
  [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md), [11_INTERACTION_SPECIFICATION.md](./11_INTERACTION_SPECIFICATION.md),
  [13_ACCESSIBILITY_SPECIFICATION.md](./13_ACCESSIBILITY_SPECIFICATION.md), [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md),
  [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md), [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md),
  [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md).
- **Manifests** — [.ai/RESPONSIVE_RULES.json](../../.ai/RESPONSIVE_RULES.json) (owned here),
  [.ai/TOKEN_INDEX.json](../../.ai/TOKEN_INDEX.json), [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md).
- **Source** — `src/tokens/primitives.ts` (breakpoint object), `src/tokens/generated/{tokens.css, token-ids.ts, figma.tokens.json}`,
  `src/hooks/index.ts` (`useMediaQuery`), `.storybook/preview.tsx` (viewports), component `*.css` (media queries),
  `*.meta.ts` `figma{}` blocks.
- **Scripts** — `scripts/build-tokens.ts` (`tokens:build`), `scripts/build-manifest.ts` (`manifest:build`),
  and `ds:build` / `figma:build` orchestration.

## 11. Template

**`.ai/RESPONSIVE_RULES.json` skeleton** (regenerate; never hand-tune values):
```json
{
  "$schema": "./_schemas/RESPONSIVE_RULES.schema.json",
  "version": "1.0.0",
  "generatedAt": "<ISO-8601>",
  "generator": "derived from src/tokens/primitives.ts (breakpoint) + .storybook/preview.tsx",
  "unit": "px",
  "strategy": "mobile-first (min-width)",
  "breakpoints": [
    { "id": "breakpoint.mobile",  "cssVar": "--tds-breakpoint-mobile",  "figmaVar": "breakpoint/mobile",  "value": 0,    "tier": "mobile" },
    { "id": "breakpoint.tablet",  "cssVar": "--tds-breakpoint-tablet",  "figmaVar": "breakpoint/tablet",  "value": 768,  "tier": "tablet" },
    { "id": "breakpoint.desktop", "cssVar": "--tds-breakpoint-desktop", "figmaVar": "breakpoint/desktop", "value": 1024, "tier": "desktop" },
    { "id": "breakpoint.wide",    "cssVar": "--tds-breakpoint-wide",    "figmaVar": "breakpoint/wide",    "value": 1440, "tier": "wide" }
  ],
  "queries": {
    "tablet-up":  "(min-width: 768px)",
    "desktop-up": "(min-width: 1024px)",
    "wide-up":    "(min-width: 1440px)"
  },
  "storybookViewports": ["mobile", "tablet", "desktop", "wide"],
  "figmaNote": "responsive is reproduced via Auto-Layout HUG/FILL/FIXED + constraints; NOT a variant axis",
  "contentBreakpoints": [{ "value": 640, "note": "Card/Drawer collapse — approved, not a device tier" }]
}
```

**Responsive component CSS skeleton:**
```css
/* mobile-first base */
.tds-x { /* token-driven layout */ }

@media (min-width: 768px)  { /* tablet+  */ .tds-x { /* var(--tds-*) only */ } }
@media (min-width: 1024px) { /* desktop+ */ .tds-x { /* var(--tds-*) only */ } }
@media (min-width: 1440px) { /* wide+    */ .tds-x { /* var(--tds-*) only */ } }
```

## 12. Future Extension

- **Figma layout grids (PLANNED).** The `breakpoint` token comment already reserves "future Figma layout grids."
  When implemented, the plugin will emit column/grid guides on showcase pages bound to the four breakpoint
  variables — still generated from the bundle, no per-component code, honoring [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md).
- **Container queries.** As component-local responsiveness matures, TDS may add container-query support keyed to
  the same four token values (never a new numeric scale), keeping the single-source-of-truth invariant.
- **Semantic tier tokens.** A future Semantic-collection alias layer (`bp.compact` → `breakpoint.tablet`, etc.)
  could add intent naming without changing primitive values — an additive, Design-Lock-safe change.
- **Enterprise scale (>10M users) — PLANNED.** A future Node/Supabase backend (see [16_NODE_GUIDE.md](./16_NODE_GUIDE.md),
  [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md)) MUST NOT own layout: device/viewport decisions stay client-side
  and token-driven. Server-side rendering, if adopted, relies on the SSR-safe `useMediaQuery` contract (R9) so
  first paint is deterministic across millions of sessions.
- **Governance.** Any breakpoint addition/shift is a source change gated by [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)
  and logged per [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md); the four-tier model is expected to remain
  stable for years.
