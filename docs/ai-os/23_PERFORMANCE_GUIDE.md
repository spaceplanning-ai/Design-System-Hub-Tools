<!--
title: Performance Guide
Purpose: Define the TDS performance standard — zero-runtime CSS tokens, minimal dependency surface, token-driven SVG charts, Storybook/Vite/esbuild build discipline, plugin/manifest size budgets, and the PLANNED backend performance & 10M-user scaling model.
Status: ACTIVE (frontend + build); PLANNED (backend/DB/API/CDN scaling — no backend exists in the repo today)
Owner: AI OS
Last-reviewed: 2026-07-08 (placeholder — update on each review)
Precedence: Subordinate to 00_MASTER_RULES.md. On any conflict, the constitution and the Design Lock Policy win. Performance MUST NEVER be used to justify a visual change — a faster path that alters rendered pixels is a SOURCE change requiring approval, not a free optimization.
-->

# 23 — Performance Guide

> **Performance in TDS is a property of the architecture, not a runtime tuning pass.** Speed comes from
> *doing less at runtime*: CSS tokens are generated once and consumed statically (`var(--tds-*)`), variants are
> plain `data-*` attributes (no style computation), charts are pure SVG path strings (no charting library), and
> the only runtime dependencies are `react` + `react-dom`. This document is the standard for keeping it that way,
> plus the **PLANNED** backend performance model for scaling beyond 10,000,000 users.

---

## 1. Purpose

This document is the single authority for **performance** across TDS: the zero-runtime CSS-token model, the
minimal dependency surface, token-driven SVG chart rendering, Storybook/Vite/esbuild build performance, the
manifest and Figma-bundle size budgets that keep AI context and plugin execution cheap, and the **PLANNED**
backend performance & scaling standard (caching, connection pooling, CDN, read replicas) for a future
Supabase/Node layer.

Performance in TDS is **structural and measured, never speculative**. The system is engineered so that the
expensive work happens at *build time* (`npm run ds:build`, `npm run figma:build`, `vite build`) and the
*runtime* — both the web app and the Figma plugin — consumes cheap, pre-computed, deterministic outputs. An AI
agent's job is to preserve those invariants, not to introduce runtime cleverness that trades measurable speed
for hidden cost.

Per the Design Lock Policy in [00_MASTER_RULES.md](./00_MASTER_RULES.md) and [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md),
no performance optimization may change rendered output. A "faster" component that shifts a color, spacing, radius,
or layout is a design change and is PROHIBITED as an optimization. Speed is bought by removing work, not by
altering the design.

## 2. Responsibilities

- **Own the zero-runtime CSS contract** — tokens are generated to `src/tokens/generated/tokens.css` and consumed
  as static `var(--tds-*)`; no CSS-in-JS, no runtime style objects, no per-render style computation.
- **Guard the dependency surface** — runtime `dependencies` stay at exactly `react` + `react-dom`; everything
  else is `devDependencies` (build/tooling only).
- **Define token-driven chart performance** — charts are pure functions in `src/utils/chart.ts` emitting SVG path
  strings into a fixed `viewBox`; no canvas, no D3/Chart.js/Recharts runtime.
- **Define build performance** — Vite 5 dev/build, `tsc -b` incremental typecheck, `esbuild` plugin bundle, `tsx`
  script execution, Storybook 8 (`react-vite`) startup.
- **Set size budgets** — the generated manifest (`src/generated/design-system.manifest.json`) and Figma bundle
  (`figma/tds.plugin.json`) sizes are budgeted because they drive plugin load time and AI context cost.
- **Protect variant-count performance** — enforce the state-axis exclusion policy so component sets don't explode
  the Figma cartesian product (e.g. Button 4,050+ combos) and blow up plugin runtime.
- **Specify PLANNED backend performance** — caching, connection pooling (Supavisor/PgBouncer), CDN, read
  replicas, and the 10M-user scaling posture, each marked PLANNED.

## 3. Scope

**In-scope**
- Zero-runtime CSS tokens and the no-CSS-in-JS rule (`src/tokens/generated/tokens.css`, `src/styles/*`).
- Runtime dependency discipline (`package.json` `dependencies` = react + react-dom only).
- Token-driven SVG charts (`src/utils/chart.ts`, `src/styles/charts.css`) and their zero-library rendering.
- Build/tooling performance: `vite`, `tsc -b` (incremental, `*.tsbuildinfo`), `esbuild` (`plugin:build`),
  `tsx` (scripts), Storybook (`react-vite`).
- Manifest & Figma-bundle size budgets and their effect on plugin runtime + AI token cost (ties to
  [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md)).
- Variant-count/combinatorics performance (state-axis exclusion, type-split component sets).
- **PLANNED** backend performance & 10M-user scaling (caching, pooling, CDN, replicas).

**Out-of-scope**
- Motion/animation performance details → [10_ANIMATION_SPECIFICATION.md](./10_ANIMATION_SPECIFICATION.md).
- Responsive breakpoint mechanics → [12_RESPONSIVE_SPECIFICATION.md](./12_RESPONSIVE_SPECIFICATION.md).
- AI context/token minimization as a discipline → [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md) (this
  doc only covers the *size budgets* that feed it).
- Security hardening of the PLANNED backend → [22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md).
- Test performance/coverage gates → [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md).
- Token generation mechanics broadly → [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md).

## 4. Rules

**Zero-runtime CSS & styling**
1. **R1 (MUST)** — All visual styling is CSS custom-property tokens (`var(--tds-*)`) resolved by the browser at
   paint time. NEVER introduce CSS-in-JS, styled-components, emotion, inline `style={{…}}` for tokenized values,
   or any library that computes styles per render. TDS CSS is zero-runtime by contract.
2. **R2 (MUST)** — Variant selection is expressed as `data-*` attributes via `toDataAttrs(meta, {...})`; CSS
   selectors (`.tds-x[data-variant='solid']`) do the switching. NEVER branch styling in JS by building class/style
   strings from state on every render when a static `data-*` + CSS selector expresses it.
3. **R3 (NEVER)** — Do not hardcode colors/spacing/radius/shadow as literals (defeats the shared, cache-friendly
   token layer). One generated `tokens.css` is loaded once and reused across all 60 components.

**Dependency surface**
4. **R4 (MUST)** — Runtime `dependencies` in `package.json` stay exactly `react` + `react-dom`. Any new runtime
   dependency is a reviewed decision (bundle weight + supply-chain surface) per [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)
   and [22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md). Tooling belongs in `devDependencies`.
5. **R5 (SHOULD)** — Prefer the shared primitives (`cx` from `@/utils`, hooks from `@/hooks`) over ad-hoc utility
   code or a new micro-dependency. Reuse-first ([07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md))
   is also a performance rule — it avoids duplicated shipped code.

**Charts**
6. **R6 (MUST)** — Charts render via the pure helpers in `src/utils/chart.ts` (`niceMax`, `ticks`, `yScale`,
   `linePath`, `areaPath`, `donutArc`) producing SVG path strings into a fixed `viewBox` scaled with
   `preserveAspectRatio`. NEVER add a runtime charting library (D3, Chart.js, Recharts, canvas/WebGL).
7. **R7 (MUST)** — Chart color identity uses the `--chart-*` vars in `src/styles/charts.css`; grid/axis/label use
   TDS fg/border tokens. NEVER inline chart hues. Series work is O(points) string building — keep it that way.

**Build & bundle**
8. **R8 (MUST)** — Keep the typecheck incremental: `tsc -b` uses project references and `*.tsbuildinfo`
   (`tsconfig.app.tsbuildinfo`, `tsconfig.node.tsbuildinfo`). NEVER delete build-info files as a "fix"; NEVER
   disable incremental mode.
9. **R9 (SHOULD)** — Component CSS is loaded per-component and shares the single token layer; avoid duplicating
   large rule blocks across component `*.css` when a token or shared class expresses the same thing.
10. **R10 (MUST)** — The Figma plugin bundle is built with `esbuild --format=iife --target=es2017` (`plugin:build`)
    and must stay a single generated `figma/plugin/code.js`; NEVER hand-edit it and NEVER add per-component code to
    the plugin (the algorithm is data-driven — see [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md)).

**Size budgets (AI context + plugin runtime)**
11. **R11 (SHOULD)** — Treat `src/generated/design-system.manifest.json` (~0.4 MB) and `figma/tds.plugin.json`
    (~0.6 MB) as *budgeted* outputs. Growth is expected as components are added, but a sudden jump signals
    accidental duplication or a non-minimal emission in `scripts/build-manifest.ts`. Investigate large deltas.
12. **R12 (MUST)** — AI agents MUST read the small manifests / [docs/COMPONENTS.md](../COMPONENTS.md) rather than
    the large generated JSON or component source when answering — a context-token performance rule enforced by
    [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md).

**Combinatorics**
13. **R13 (NEVER)** — Do not emit the `state` axis (default/hover/active/focus/disabled/loading) as a Figma
    variant. It multiplies the cartesian product catastrophically (Button would exceed 4,050 variants), destroying
    plugin generation time. `disabled`/`loading` survive as BOOLEAN component props; type(A/B/C) splits into one
    Component Set per preset. See [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md).

**Backend (PLANNED)**
14. **R14 (MUST, PLANNED)** — Any future backend MUST be engineered for >10M users from day one: pooled DB
    connections, cache-first reads, CDN-fronted static assets, and horizontal read scaling. No backend exists in
    the repo today; these rules bind whoever builds it. See [16_NODE_GUIDE.md](./16_NODE_GUIDE.md),
    [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md).

## 5. Workflow

**A. Building a component with performance in mind (default path).**
1. Reuse-first: check [docs/COMPONENTS.md](../COMPONENTS.md) — shipping less code is the cheapest optimization.
2. Author styling as token CSS (`var(--tds-*)`); express variants with `toDataAttrs` + `data-*` selectors (R1/R2).
3. No new runtime dependency (R4); reach for `@/utils` / `@/hooks` first (R5).
4. Preview in Storybook (`npm run storybook`) — no build step needed for pure CSS/data-attr work.

**B. Adding/adjusting a chart.**
1. Use the pure builders in `src/utils/chart.ts`; feed a fixed `viewBox` and let `preserveAspectRatio` scale (R6).
2. Assign series identity from `--chart-*` (`src/styles/charts.css`); labels/axes from TDS tokens (R7).
3. Verify visually in the relevant story (e.g. Dashboard example). No charting library is ever added.

**C. Building outputs.**
1. `npm run ds:build` — regenerates tokens, manifests, catalog (fast; `tsx` scripts).
2. `npm run build` — `tsc -b` (incremental) then `vite build` for the app.
3. `npm run figma:build` — `ds:build` → `plugin:typecheck` → `plugin:build` (esbuild) → `plugin:test` (headless
   harness). The harness is the runtime-cost gate for the plugin.

**D. Watching a size/perf regression.**
1. After a change, note the byte size of `src/generated/design-system.manifest.json` and `figma/tds.plugin.json`.
2. A large unexplained delta → inspect `scripts/build-manifest.ts` for duplication or a leaked axis (R11/R13).
3. Record the budget observation in [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md) per [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md).

**E. Designing the PLANNED backend (when it is built).**
1. Front reads with a cache (edge/Redis-class); pool connections (Supavisor/PgBouncer).
2. Serve static/design-system assets from a CDN; add DB read replicas as load grows.
3. Load-test against the 10M-user target before release ([32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md),
   [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)).

## 6. Examples

**Zero-runtime variant styling — data-attr + CSS, no runtime style computation** (the TDS pattern):
```tsx
// component: variant selection becomes DOM data-* via toDataAttrs — no per-render style objects
import { toDataAttrs } from '@core/defineComponent';
import { cx } from '@/utils';

const attrs = toDataAttrs(meta, { variant, tone, size, shape }); // { 'data-variant': 'solid', ... }
return <button ref={ref} className={cx('tds-button', className)} {...attrs} {...rest} />;
```
```css
/* CSS selectors do the switching against the single generated token layer — zero JS at paint */
.tds-button { background: var(--tds-color-bg-surface); padding: var(--tds-space-2) var(--tds-space-4); }
.tds-button[data-variant='solid'][data-tone='brand'] { background: var(--tds-color-brand-solid); }
```

**Generated token layer is loaded once and shared** (`src/tokens/generated/tokens.css`, real shape):
```css
:root {
  --tds-color-brand-solid: /* … */;
  --tds-space-4: /* … */;
  --tds-breakpoint-desktop: 1024px;
}
/* ~578 lines, generated by scripts/build-tokens.ts; every one of the 60 components reuses these vars. */
```

**Pure SVG chart helpers — no library, O(points) string building** (real, `src/utils/chart.ts`):
```ts
export function yScale(value: number, max: number, top: number, height: number): number {
  return top + height - (value / max) * height; // pure math, no DOM
}
export function linePath(pts: Point[]): string {
  if (!pts.length) return '';
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
}
// Charts render into a fixed viewBox and scale via preserveAspectRatio — deterministic, cache-friendly output.
```

**Minimal runtime dependency surface** (real, `package.json`):
```jsonc
"dependencies": {
  "react": "^18.3.1",
  "react-dom": "^18.3.1"
}
// Everything else (vite, esbuild, tsx, storybook, typescript, eslint, prettier) is a devDependency.
```

**Incremental typecheck** (real, `npm run build`):
```bash
tsc -b && vite build      # tsc -b reuses tsconfig.app.tsbuildinfo / tsconfig.node.tsbuildinfo
```

**Plugin bundle — one IIFE, generated, never per-component** (real, `plugin:build`):
```bash
esbuild figma/plugin/src/code.ts --bundle --loader:.json=json --format=iife --target=es2017 \
  --outfile=figma/plugin/code.js
```

**Combinatorics performance — why `state` is not a Figma axis** (policy):
```text
Button axes if state were emitted: type(3) × variant(5) × tone(5) × size(3) × shape(3) × state(6) = 4,050 variants.
Excluding state and splitting type into separate sets keeps each Component Set small and the plugin fast.
```

## 7. Validation Rules

- **Lint** — `npm run lint` (eslint flat config) enforces barrel imports (`@/components`, `@/hooks`, `@/utils`)
  and the token conventions; it is the first gate against ad-hoc code that would bloat the runtime surface.
- **Typecheck** — `tsc -b` (via `npm run build`) and `npm run plugin:typecheck` must pass; incremental build-info
  keeps this cheap (R8). A full rebuild after deleting `*.tsbuildinfo` is diagnostic only, not a fix.
- **Token integrity** — `npm run tokens:build` regenerates `src/tokens/generated/{tokens.css, figma.tokens.json,
  token-ids.ts}`. A hardcoded value that should be a token is caught in review (no `var(--tds-*)`) — a zero-runtime
  violation (R1/R3).
- **Bundle/plugin gate** — `npm run figma:build` runs `plugin:build` (esbuild) then `plugin:test`
  (`figma/plugin/test/harness.ts`, headless Figma mock). The harness asserts full coverage and `process.exit(1)`
  on mismatch — it is the runtime-cost gate proving no state axis leaked (R13) and the algorithm stayed
  data-driven (R10).
- **Size budget review (manual)** — a reviewer notes the byte size of `src/generated/design-system.manifest.json`
  (~0.4 MB) and `figma/tds.plugin.json` (~0.6 MB); a large unexplained delta blocks merge until explained (R11).
  Grep aid: `wc -c src/generated/design-system.manifest.json figma/tds.plugin.json`.
- **Dependency review (manual)** — any diff touching `dependencies` in `package.json` requires explicit sign-off
  (R4) per [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md).
- **PLANNED backend perf** — load/latency budgets against the 10M-user target are validated in CI/CD once the
  backend and CI exist ([25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)); marked PLANNED until then.

## 8. Checklist

- [ ] Styling is token CSS (`var(--tds-*)`) — no CSS-in-JS, no runtime style objects (R1).
- [ ] Variants expressed via `toDataAttrs` + `data-*` CSS selectors, not JS style branching (R2).
- [ ] No hardcoded color/space/radius/shadow literals (R3).
- [ ] No new runtime dependency added; reused `@/utils` / `@/hooks` (R4/R5).
- [ ] Any chart uses `src/utils/chart.ts` pure builders + `--chart-*` vars; no charting library (R6/R7).
- [ ] `tsc -b` incremental build-info left intact; typecheck passes (R8).
- [ ] No duplicated large CSS/plugin code; plugin stayed data-driven (R9/R10).
- [ ] Manifest & Figma-bundle sizes checked; any large delta explained (R11).
- [ ] AI answered from small manifests/catalog, not large JSON/source (R12).
- [ ] No `state` axis emitted to Figma; `disabled`/`loading` are BOOLEAN props (R13).
- [ ] `npm run lint`, `npm run build` (or `figma:build`) green before commit.
- [ ] PLANNED backend work: pooling + cache-first + CDN + read-replica posture documented (R14).

## 9. Failure Recovery

| Symptom | Diagnosis | Fix | Resume |
| --- | --- | --- | --- |
| Jank / slow re-renders on a tokenized component | CSS-in-JS or per-render style object introduced (R1/R2 violation) | Convert to token CSS + `data-*` selectors via `toDataAttrs` | Re-check in Storybook; `npm run lint` |
| App bundle grew unexpectedly | A runtime dependency was added (R4) | Remove it; reuse `@/utils`/`@/hooks` or add to `devDependencies` if build-only | `npm run build`; review diff |
| Chart is slow / heavy | A charting library or canvas was pulled in (R6) | Replace with `src/utils/chart.ts` SVG builders + `--chart-*` | Verify story renders identically |
| `figma:build` plugin step is very slow / harness OOM | A `state` axis or per-component plugin code leaked (R13/R10) | Remove the axis from `*.meta.ts`; keep the plugin data-driven | `npm run plugin:test` must exit 0 |
| Typecheck suddenly full/slow | `*.tsbuildinfo` deleted or incremental disabled (R8) | Restore incremental `tsc -b`; let build-info regenerate | `npm run build` |
| `figma/tds.plugin.json` or manifest ballooned | Duplication/leak in `scripts/build-manifest.ts` (R11) | Fix the emitter (source), re-run `npm run ds:build` | Compare byte sizes; log in CHANGELOG |
| AI task burned excess context | Read large generated JSON/source instead of manifests (R12) | Switch to `.ai/*` manifests + `docs/COMPONENTS.md` | Follow [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md) |
| Someone "optimized" by changing pixels | Perf used to justify a design change (violates Design Lock) | Revert; route any visual change through source + approval | [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md) |

To **resume after context loss**: read [.ai/PROJECT_MANIFEST.json](../../.ai/PROJECT_MANIFEST.json) and
[.ai/DEPENDENCY_GRAPH.json](../../.ai/DEPENDENCY_GRAPH.json) for the dependency/perf posture, then
[.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md) per [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md).

## 10. Dependencies

- **Docs** — [00_MASTER_RULES.md](./00_MASTER_RULES.md), [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md),
  [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md), [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md),
  [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md), [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md),
  [10_ANIMATION_SPECIFICATION.md](./10_ANIMATION_SPECIFICATION.md), [12_RESPONSIVE_SPECIFICATION.md](./12_RESPONSIVE_SPECIFICATION.md),
  [16_NODE_GUIDE.md](./16_NODE_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md),
  [22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md), [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md),
  [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md), [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md),
  [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md), [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md),
  [32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md).
- **Manifests** — [.ai/PROJECT_MANIFEST.json](../../.ai/PROJECT_MANIFEST.json) (perf budgets live/land here),
  [.ai/DEPENDENCY_GRAPH.json](../../.ai/DEPENDENCY_GRAPH.json), [.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json),
  [.ai/TOKEN_INDEX.json](../../.ai/TOKEN_INDEX.json), [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md).
- **Source & outputs** — `package.json` (`dependencies`/`scripts`), `vite.config.ts`, `tsconfig.*.json` +
  `*.tsbuildinfo`, `src/tokens/generated/tokens.css`, `src/utils/chart.ts`, `src/styles/charts.css`,
  `src/generated/design-system.manifest.json`, `figma/tds.plugin.json`, `figma/plugin/code.js`,
  `figma/plugin/test/harness.ts`.
- **Scripts** — `scripts/build-tokens.ts`, `scripts/build-manifest.ts`, `scripts/build-catalog.ts`, and the
  `ds:build` / `plugin:build` / `plugin:test` / `figma:build` / `build` orchestration.

## 11. Template

**Performance budget block (PLANNED addition to `.ai/PROJECT_MANIFEST.json`; regenerate, never hand-tune values):**
```jsonc
{
  "performance": {
    "runtimeDependencies": ["react", "react-dom"],   // R4 — must stay minimal
    "zeroRuntimeCss": true,                            // R1 — var(--tds-*) only, no CSS-in-JS
    "chartRuntime": "svg-pure (src/utils/chart.ts)",   // R6 — no charting library
    "budgets": {
      "manifestBytes":   { "current": 397684, "warnAtDeltaPct": 25 }, // design-system.manifest.json
      "figmaBundleBytes":{ "current": 596554, "warnAtDeltaPct": 25 }  // figma/tds.plugin.json
    },
    "combinatorics": { "stateAxisEmitted": false },    // R13 — Figma variant explosion guard
    "backend": { "status": "planned", "userTarget": 10000000 } // R14 — see 16/17
  }
}
```

**Perf-review snippet for a PR description:**
```md
### Performance impact
- Styling: token CSS only, variants via data-* (no CSS-in-JS)     ✅ / ⚠️
- Runtime deps unchanged (react, react-dom)                        ✅ / ⚠️
- Charts: pure SVG builders, no new library                        ✅ / n/a
- manifest.json / tds.plugin.json size delta: <bytes> (<pct>%)     ✅ / ⚠️ explain
- No `state` axis emitted; plugin stayed data-driven               ✅ / n/a
```

**PLANNED backend perf checklist skeleton:**
```md
- [ ] Reads are cache-first (edge/Redis-class) with explicit TTL/invalidation
- [ ] DB connections pooled (Supavisor / PgBouncer), no per-request raw connects
- [ ] Static + design-system assets served via CDN with long-lived immutable caching
- [ ] Read replicas provisioned; hot queries indexed (see 14_DATABASE_GUIDE.md)
- [ ] Load-tested to the 10M-user target before release (25/32)
```

## 12. Future Extension

- **Automated size-budget gate (PLANNED).** Once CI exists ([25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)), a step
  will diff `src/generated/design-system.manifest.json` and `figma/tds.plugin.json` byte sizes against the budget
  block in [.ai/PROJECT_MANIFEST.json](../../.ai/PROJECT_MANIFEST.json) and fail the build on an unexplained jump
  (R11), turning the manual review gate into an automatic one.
- **Bundle analysis (PLANNED).** A `vite build` size report / visualizer could track app bundle weight over time,
  guarding R4 automatically; still tooling-only (`devDependencies`).
- **Backend performance at 10M users (PLANNED).** The future Supabase/Node layer
  ([16_NODE_GUIDE.md](./16_NODE_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md)) MUST ship cache-first
  reads, pooled connections (Supavisor/PgBouncer), CDN-fronted assets, and horizontal read replicas, with query
  indexing per [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md) and contracts per [15_API_GUIDE.md](./15_API_GUIDE.md).
  No backend exists today; this is the standard whoever builds it inherits.
- **Design-system perf stays constant.** The zero-runtime model means adding components grows build outputs, not
  runtime cost — the browser still loads one token layer and paints CSS. This invariant is expected to hold for
  years regardless of catalog size.
- **Governance.** Any change that trades measurable runtime speed for a design change is PROHIBITED as an
  optimization (Design Lock); performance-motivated source changes are gated by [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)
  and logged per [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md).
