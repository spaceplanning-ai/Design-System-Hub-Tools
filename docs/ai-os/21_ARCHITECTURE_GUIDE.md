# 21 — Architecture Guide

> **Title:** Architecture Guide
> **Purpose:** Describe the end-to-end TDS architecture — how a single `ComponentMeta` + the TypeScript token sources fan out into React, Storybook, the generated manifests, the Figma plugin, and Figma — plus the layering, dependency direction, the planned frontend↔backend synchronization, and how the whole system scales past 10,000,000 users.
> **Status:** ACTIVE (frontend, tokens, manifests, plugin) · backend/API/DB portions **PLANNED**
> **Owner:** AI OS
> **Last-reviewed:** _(placeholder — set on review)_
> **Precedence:** Subordinate to [00_MASTER_RULES.md](./00_MASTER_RULES.md). This document is architectural narrative and topology; where it and a domain spec ([03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md), [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md), [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md), [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md)) disagree on a detail, the domain spec wins. Source-of-truth hierarchy is defined in [00_MASTER_RULES.md](./00_MASTER_RULES.md) and is binding here. All backend/DB/API/CI/test-framework content is **PLANNED**.

---

## 1. Purpose

TDS is a **metadata-driven design system**: one source of truth feeds four outputs. This guide is the single map of that machine — it explains *what feeds what*, *in which direction*, and *why the direction is one-way*. Every other spec in `docs/ai-os/` owns a slice of the system; this document stitches those slices into a coherent whole so an agent can reason about a change's blast radius before touching a file.

The architecture exists to guarantee the AI-OS mission (see [00_MASTER_RULES.md](./00_MASTER_RULES.md)):

- **Architectural consistency** — every component is the same 5 files driven by the same `ComponentMeta` model (`src/core/types.ts`), so there is exactly one shape to learn and reproduce.
- **No design drift** — Storybook is the *only* source of visual truth; Figma is a downstream reproduction that never edits back up. Generated files are sacred.
- **Storybook↔Figma perfect sync** — both are projections of the same `*.meta.ts` + token sources through deterministic build scripts; sync is a property of the topology, not a manual chore.
- **Minimal AI token usage** — the derived manifests (`src/generated/`, `figma/`, `.ai/`) let an agent answer most questions without opening component source. See [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md).
- **Enterprise scale (>10M users)** and **FE↔BE↔DB sync** — the frontend is zero-runtime and CDN-shaped today; the **PLANNED** Supabase backend ([14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [15_API_GUIDE.md](./15_API_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md)) attaches at a defined seam without altering the design pipeline.

This document is the authority for **topology and dependency direction**. It does not redefine the token model, the variant axes, or the plugin algorithm — those belong to their own specs, cited throughout.

---

## 2. Responsibilities

This guide owns:

- The **canonical dataflow diagram**: `ComponentMeta` + tokens → React / Storybook / manifest → plugin → Figma.
- The **layering model** and the **allowed dependency direction** between layers (core → tokens → components → stories → generated → plugin → Figma), and the rules that keep imports one-way.
- The **two generation pipelines** (`tokens:build`, `manifest:build`) and how they compose into `ds:build` and `figma:build`.
- The **seam** where the **PLANNED** backend (Supabase + Node/TS API) attaches, and the rule that it never crosses into the design pipeline.
- **Scaling architecture** — how each layer behaves at >10M users, current (frontend/CDN) and PLANNED (backend/DB).
- Cross-references that route any deeper question to the owning spec.

It does **not** own: the token model internals ([08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md)); variant-axis semantics ([09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md)); the component 5-file anatomy ([07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md)); the plugin's node-building algorithm ([06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md)); the `.ai` manifest schemas ([27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md)); or the immutable Design Lock wording ([03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md)).

---

## 3. Scope

**In scope**

- The verified, existing architecture: `src/core/`, `src/tokens/`, `src/components/`, `src/hooks/`, `src/utils/`, `src/styles/`, `src/stories/`, `scripts/`, `src/generated/`, `figma/`.
- The build topology wired by the real npm scripts in `package.json` (`tokens:build`, `manifest:build`, `catalog:build`, `ds:build`, `plugin:build`, `plugin:typecheck`, `plugin:test`, `figma:build`).
- Dependency direction, layering rules, and the plugin contract seam (`figma/tds.plugin.json` = `{ tokens, design }`).
- The **PLANNED** FE↔BE↔DB topology, described only at the architectural-seam level and clearly marked.
- Scaling posture at each layer.

**Out of scope**

- Any concrete backend, database, API, auth, `.env`, or CI implementation — **PLANNED**; none exists in the repo today (runtime deps are only `react` + `react-dom`).
- The internals of any single spec's domain (deferred to that spec).
- Visual/design decisions of any kind — those are locked (see Rule 4.1 and [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md)).

---

## 4. Rules

Rules are enforceable and phrased MUST / SHOULD / NEVER. Each ties to a real mechanism in this repo.

1. **NEVER let the dependency arrow reverse.** The canonical direction is `core → tokens → components → stories → generated manifests → plugin → Figma`. Figma **MUST NEVER** feed back into any source; the generated manifests **MUST NEVER** be authored by hand (they are outputs of `scripts/*`). This encodes the Source-of-Truth Hierarchy in [00_MASTER_RULES.md](./00_MASTER_RULES.md).

2. **MUST keep `*.meta.ts` pure data.** Meta files import only from `./types`/`../core` via **relative** paths, contain **no React and no CSS**, and are safe to import from Node (`scripts/build-manifest.ts` imports `src/components/metas.ts`). This is the seam that lets one file drive four outputs. See [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md).

3. **MUST import runtime components only from the barrel `@/components`.** Never deep-path into `atoms/`, `molecules/`, `organisms/` from application/story code. Aliases (`@/*`, `@core/*`, `@components/*`, `@tokens/*`) are declared in `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, and `.storybook/main.ts` and MUST resolve identically in all four.

4. **NEVER redesign; all visual truth flows one way from Storybook.** Any visual change is a **source** change (`*.meta.ts`, `src/tokens/*`, component `.css`) that re-flows through `ds:build`. Editing `figma/*`, `src/generated/*`, `src/tokens/generated/*`, or `figma/plugin/code.js` by hand is **PROHIBITED** (Design Lock — [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md), [05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md)).

5. **MUST style with `--tds-*` tokens only.** Zero hardcoded color/spacing/radius/shadow; zero runtime CSS-in-JS. CSS is static and token-bound so the same decisions render identically on web and are legibly bindable in Figma. See [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md), [23_PERFORMANCE_GUIDE.md](./23_PERFORMANCE_GUIDE.md).

6. **MUST express every variant as `data-*` on the DOM** via `toDataAttrs(meta, {...})` (`src/core/defineComponent.ts`). The DOM must always carry a *full* variant combo (missing axes fall back to `default`) so the plugin can read any node and place the matching Figma variant.

7. **MUST regenerate, never hand-sync.** After any source change, run the owning build: `tokens:build` (tokens), `manifest:build` (components/bundle), `catalog:build` (docs), or the composite `ds:build`; before shipping plugin-affecting changes run `figma:build` (which ends in the headless `plugin:test` gate).

8. **The state axis MUST NOT be emitted as a Figma variant.** `scripts/build-manifest.ts` intentionally drops the `state` axis from `figmaProperties` (it exploded Button to 4,050+ combos); `disabled`/`loading` survive as `BOOLEAN` component props. This is an architectural constraint, not an oversight. See [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md).

9. **PLANNED backend MUST attach only at the data seam.** The Supabase/API layer ([15_API_GUIDE.md](./15_API_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md)) may consume TDS components as a UI dependency but **MUST NEVER** import `*.meta.ts`, tokens, or generated design artifacts as a data source, and **MUST NEVER** inject runtime theming that bypasses `--tds-*`.

10. **MUST preserve the `.ai` cache as derived, reconcilable state.** `.ai/*` manifests are regenerated/reconciled from sources #2–#3; they are the AI cache layer, never authoritative over source. See [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md), [37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md).

---

## 5. Workflow

### 5.1 The canonical dataflow

```
                         ┌─────────────────────────────────────────────┐
   SOURCE OF TRUTH       │  src/tokens/*.ts        src/components/**/*.meta.ts │
   (hand-authored)       │  (primitives→semantic→theme)  (ComponentMeta, pure data)
                         └───────────────┬─────────────────────┬───────┘
                                         │                     │
                  tokens:build ──────────┤                     ├────────── manifest:build
                                         │                     │
        ┌────────────────────────────────▼───┐   ┌─────────────▼───────────────────────┐
        │ src/tokens/generated/               │   │ src/generated/design-system.manifest.json
        │  tokens.css  figma.tokens.json      │   │ figma/tds.plugin.json = { tokens, design }
        │  token-ids.ts                       │   │ docs/COMPONENTS.md  (catalog:build)
        └───────┬──────────────┬──────────────┘   └───────────────┬──────────────────────┘
                │              │                                   │
     (imported by CSS)   (feeds bundle)                            │ single-file contract
                │              └───────────────┐                   │
        ┌───────▼──────┐   ┌───────────────────▼───────────────────▼──────┐
        │  React        │   │        Figma plugin (figma/plugin/src/*)      │
        │  components   │   │  reads figma/tds.plugin.json, rebuilds        │
        │  (.tsx + .css)│   │  Variables + Styles + Component Sets, no      │
        └───────┬───────┘   │  per-component code → 8 auto Pages            │
                │           └───────────────────┬──────────────────────────┘
        ┌───────▼────────┐                       │
        │  Storybook 8    │  ── SOURCE OF ───▶    ▼
        │  (CSF3 stories) │     VISUAL TRUTH     Figma (reproduction, never edits back)
        └─────────────────┘
```

Every arrow points **down/right**. Nothing points back up. Storybook (bottom-left) is the immutable visual reference; Figma (bottom-right) is a faithful reproduction rebuilt from the bundle.

### 5.2 The token pipeline (`npm run tokens:build`)

1. Author/edit tokens in `src/tokens/primitives.ts` / `semantic.ts` (via helpers in `helpers.ts`).
2. `tsx scripts/build-tokens.ts` emits three sacred outputs under `src/tokens/generated/`:
   - `tokens.css` — `--tds-*` custom properties (light default + `dark` overrides).
   - `figma.tokens.json` — Figma-shaped variables/styles (consumed by `manifest:build`).
   - `token-ids.ts` — the `TokenId` union consumed by `*.meta.ts` token bindings.
3. Details, naming contract, alias resolution: [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md).

### 5.3 The component/manifest pipeline (`npm run manifest:build`)

1. Each component ships `X.meta.ts` (registered in `src/components/metas.ts` → `componentMetas`).
2. `tsx scripts/build-manifest.ts` reads `componentMetas` + `src/tokens/generated/figma.tokens.json`, derives per-variant token bindings via `scripts/lib/css-bindings.ts` (PostCSS parse of each component `.css`), and writes:
   - `src/generated/design-system.manifest.json` — the component manifest.
   - `figma/tds.plugin.json` — the `{ tokens, design }` plugin bundle (the **contract**, `figma/README.md`).
3. `variantCount()` and the state-axis exclusion (Rule 8) live here. `catalog:build` then regenerates `docs/COMPONENTS.md`.

### 5.4 The composite builds

- `npm run ds:build` = `tokens:build && manifest:build && catalog:build` — the everyday "I changed source, refresh all outputs" command.
- `npm run figma:build` = `ds:build && plugin:typecheck && plugin:build && plugin:test` — the ship gate; ends in the headless `figma/plugin/test/harness.ts` which asserts coverage and `process.exit(1)` on mismatch. See [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md), [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md).

### 5.5 The `.ai` reconciliation cycle

After a source change and its build, an agent reconciles the affected `.ai/*` manifests (e.g. `COMPONENT_INDEX.json`, `TOKEN_INDEX.json`, `FIGMA_MAPPING.json`, `DEPENDENCY_GRAPH.json`) from the fresh generated outputs, then updates `TASKS.json`/`SESSION_SUMMARY.md`. Cycle owned by [02_AI_HARNESS.md](./02_AI_HARNESS.md), [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md), [37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md).

### 5.6 The PLANNED backend seam

> **STATUS: PLANNED — no backend exists in the repo today.** Runtime deps are only `react` + `react-dom`.

The frontend is a pure presentation layer. The future data layer (Supabase: Postgres + Auth + RLS + Storage + Edge Functions + Realtime, fronted by a Node ≥20 / TS API) attaches at the application boundary: application code imports UI from `@/components` and data from the API client. The two pipelines never cross — design flows meta→Figma; data flows DB→API→app. Contracts: `.ai/ERD.json`, `.ai/API_SPEC.json`; specs [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md)–[17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md).

---

## 6. Examples

### 6.1 One source, four outputs (real: `src/core`)

`ComponentMeta` (`src/core/types.ts`) is consumed four ways:

```ts
// 1) React  — variant → DOM (src/core/defineComponent.ts)
const attrs = toDataAttrs(buttonMeta, { variant: 'solid', size: 'md' });
// -> { 'data-type': 'A', 'data-variant': 'solid', 'data-size': 'md', 'data-tone': 'brand', 'data-shape': 'rounded' }

// 2) Storybook — controls/autodocs (src/core/storybook.ts)
export default { title: 'Atoms/Button', parameters: metaParameters(buttonMeta),
  argTypes: argTypesFromMeta(buttonMeta), args: argsFromMeta(buttonMeta) };

// 3) Manifest — scripts/build-manifest.ts turns variantProps → figmaProperties (VARIANT),
//    componentProps → figmaProperties (BOOLEAN|TEXT|INSTANCE_SWAP); drops the `state` axis.

// 4) Catalog — scripts/build-catalog.ts renders buttonMeta into docs/COMPONENTS.md
```

The registry that makes this Node-safe:

```ts
// src/components/metas.ts — pure metas only, so build-manifest.ts can import it
export const componentMetas: ComponentMeta[] = [...atomMetas, ...moleculeMetas, ...organismMetas];
```

### 6.2 A change and its blast radius

Editing `Button.meta.ts` to add a `tone` option:

```bash
# 1. edit source (meta) — DO NOT touch generated files
# 2. refresh every downstream output
npm run ds:build           # tokens:build + manifest:build + catalog:build
# 3. verify Figma reproduction still builds & covers
npm run figma:build        # ends in headless plugin:test (exit 1 on mismatch)
# 4. reconcile .ai cache (COMPONENT_INDEX.json, FIGMA_MAPPING.json, VARIANT_INDEX.json)
```

### 6.3 Layer boundary that MUST NOT be crossed

```ts
// ✅ application / story code
import { Button, Card, Select } from '@/components';

// ❌ never deep-path (breaks the barrel boundary, Rule 3)
import { Button } from '@/components/atoms/Button/Button';

// ❌ never import a runtime component into a meta or the manifest generator
// meta.ts and scripts/build-manifest.ts stay React/CSS-free
```

---

## 7. Validation Rules

Compliance with this architecture is checked by concrete mechanisms:

| Concern | Mechanism | Command |
|---|---|---|
| Meta purity / imports one-way | `manifest:build` imports `metas.ts` in Node — any React/CSS import throws | `npm run manifest:build` |
| Alias consistency & types | `tsc -b` strict, `verbatimModuleSyntax`, `consistent-type-imports` | `npm run build` |
| Token-only styling, no drift | eslint flat config + review; generated CSS is `--tds-*` only | `npm run lint` |
| Tokens regenerate cleanly | build-tokens emits 3 artifacts deterministically | `npm run tokens:build` |
| Manifest/bundle valid | build-manifest emits both manifest + `figma/tds.plugin.json` | `npm run manifest:build` |
| Figma reproduction covers source | headless harness asserts coverage, `process.exit(1)` on mismatch | `npm run figma:build` → `plugin:test` |
| Generated files unedited | git diff on `figma/`, `src/generated/`, `src/tokens/generated/` should show **only** build-produced changes | `git status` / review gate ([30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)) |

There is **no unit-test framework** in the repo today (no vitest/jest/playwright, no `test` script) — the sole automated gate is the headless plugin harness. Broader testing is **PLANNED** ([24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md)).

---

## 8. Checklist

- [ ] I changed only **source** (`*.meta.ts`, `src/tokens/*.ts`, component `.tsx`/`.css`), never a generated file.
- [ ] The dependency arrow still points one way; nothing in Figma or `.ai` fed back into source.
- [ ] Imports use aliases + the `@/components` barrel; no deep paths; meta stays React/CSS-free.
- [ ] All styling is `--tds-*`; variants emitted via `toDataAttrs`.
- [ ] I ran `npm run ds:build` (or the narrow owning build) and it succeeded.
- [ ] For plugin-affecting changes I ran `npm run figma:build` and `plugin:test` passed.
- [ ] I ran `npm run lint` and `npm run build` (`tsc -b`) clean.
- [ ] I reconciled the affected `.ai/*` manifests and updated `TASKS.json` / `SESSION_SUMMARY.md`.
- [ ] Any backend/API/DB work I touched is marked **PLANNED** and attaches only at the data seam.

---

## 9. Failure Recovery

| Symptom | Diagnosis | Fix | Resume |
|---|---|---|---|
| `manifest:build` throws on import of a `.meta.ts` | Meta imported React/CSS or used a non-relative path (Rule 2) | Strip React/CSS; use relative imports; keep it pure data | Re-run `npm run ds:build` |
| Figma output missing a component/variant | Meta not registered in `src/components/metas.ts`, or `state` axis mistaken for a variant | Add to the correct tier array; confirm `state` stays out of `figmaProperties` (Rule 8) | `npm run figma:build`, confirm harness green |
| `plugin:test` exits 1 | Bundle/plugin coverage mismatch after a source change | Re-run `ds:build` first; inspect `figma/tds.plugin.json`; fix source, not the plugin output | `npm run figma:build` |
| A generated file has unexplained manual edits | Design Lock violated (Rule 4) | `git checkout` the generated file; make the change in source; rebuild | `npm run ds:build` |
| Alias fails to resolve in Storybook but not Vite | Alias declared in one config but not `.storybook/main.ts` | Sync alias across all four configs (tsconfig.app, tsconfig.node, vite.config, storybook main) | Restart `npm run storybook` |
| Web and Figma visually diverge | Someone edited Figma or a generated artifact instead of source | Discard the Figma-side/generated edit; re-derive from source | `npm run figma:build` |
| `.ai` manifest disagrees with generated output | Cache stale after a build | Reconcile `.ai/*` from fresh generated outputs | Continue per [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md) |

---

## 10. Dependencies

**Docs (by exact filename):**
[00_MASTER_RULES.md](./00_MASTER_RULES.md) ·
[02_AI_HARNESS.md](./02_AI_HARNESS.md) ·
[03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md) ·
[04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md) ·
[05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md) ·
[06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md) ·
[07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md) ·
[08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md) ·
[09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md) ·
[12_RESPONSIVE_SPECIFICATION.md](./12_RESPONSIVE_SPECIFICATION.md) ·
[14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md) ·
[15_API_GUIDE.md](./15_API_GUIDE.md) ·
[16_NODE_GUIDE.md](./16_NODE_GUIDE.md) ·
[17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md) ·
[18_FOLDER_STRUCTURE.md](./18_FOLDER_STRUCTURE.md) ·
[22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md) ·
[23_PERFORMANCE_GUIDE.md](./23_PERFORMANCE_GUIDE.md) ·
[24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md) ·
[26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md) ·
[27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md) ·
[28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md) ·
[30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md) ·
[37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md).

**Manifests:** [.ai/PROJECT_MANIFEST.json](../../.ai/PROJECT_MANIFEST.json), [.ai/DESIGN_MANIFEST.json](../../.ai/DESIGN_MANIFEST.json), [.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json), [.ai/TOKEN_INDEX.json](../../.ai/TOKEN_INDEX.json), [.ai/FIGMA_MAPPING.json](../../.ai/FIGMA_MAPPING.json), [.ai/DEPENDENCY_GRAPH.json](../../.ai/DEPENDENCY_GRAPH.json), [.ai/ERD.json](../../.ai/ERD.json) (PLANNED), [.ai/API_SPEC.json](../../.ai/API_SPEC.json) (PLANNED).

**Scripts/sources:** `scripts/build-tokens.ts`, `scripts/build-manifest.ts`, `scripts/build-catalog.ts`, `scripts/lib/css-bindings.ts`, `src/core/types.ts`, `src/core/defineComponent.ts`, `src/components/metas.ts`, `src/tokens/index.ts`, `figma/plugin/src/code.ts`, `figma/plugin/test/harness.ts`, `figma/README.md` (the contract).

---

## 11. Template

Copy-paste **architecture-decision note** to record any topology change (store alongside the change, reference from [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md)):

```md
# ADR-NNN — <short title>
Status: PROPOSED | ACCEPTED | SUPERSEDED     Date: YYYY-MM-DD     Owner: AI OS

## Context
<what forced this decision — the layer/seam affected>

## Layer & direction impact
- Layer(s): core | tokens | components | stories | generated | plugin | figma | backend(PLANNED)
- Dependency direction preserved one-way? YES / NO (if NO, justify or reject)
- Design Lock respected (no generated-file hand-edits)? YES / NO

## Decision
<the change, in terms of real files/scripts>

## Consequences
- Builds affected: tokens:build | manifest:build | catalog:build | figma:build
- Manifests to reconcile: .ai/<...>
- Blast radius / downstream outputs re-derived: <...>

## Validation
- [ ] npm run ds:build  - [ ] npm run figma:build (plugin:test green)  - [ ] npm run lint  - [ ] tsc -b
```

---

## 12. Future Extension

The architecture is deliberately layered so growth attaches at seams, not rewrites — this is how it reaches and holds >10,000,000 users.

- **Frontend at scale (today):** zero-runtime, token-driven CSS and static React output ship as immutable, CDN-cacheable assets — horizontal reach is a deploy concern, not a code concern. Adding components never changes the pipeline; it adds one meta + registry entry that fans out through the same builds. See [23_PERFORMANCE_GUIDE.md](./23_PERFORMANCE_GUIDE.md).
- **Design pipeline at scale:** the meta→manifest→bundle→plugin chain is O(components) and fully deterministic, so catalogs of hundreds of components regenerate in a single `ds:build`. The state-axis exclusion (Rule 8) is the key combinatorial guardrail keeping Figma sets tractable.
- **Backend at scale (PLANNED):** Supabase (Postgres + RLS + Storage + Edge Functions + Realtime) fronted by a stateless Node/TS API attaches at the data seam (§5.6) and scales independently via read replicas, connection pooling, RLS-enforced multi-tenancy, and edge functions — described in [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md)–[17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md) and [23_PERFORMANCE_GUIDE.md](./23_PERFORMANCE_GUIDE.md). Because it never crosses into the design pipeline, backend scaling changes carry zero design-drift risk.
- **AI-agent & MCP at scale:** the derived manifests (`src/generated/`, `figma/`, `.ai/`) are the low-token interface that lets many concurrent agents reason about the system without reading source — the architectural substrate for [35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md), [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md), and [36_AI_AGENT_SPECIFICATION.md](./36_AI_AGENT_SPECIFICATION.md).
- **Governance:** every extension is bound by the invariants above (one-way dependency, Design Lock, generated-is-sacred). New layers may be added *below* the barrel and *at* the data seam; none may reverse an arrow. Enforced via [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md) and [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md).
