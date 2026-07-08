# 18 — Folder Structure

> **Title:** Folder Structure
> **Purpose:** Define the canonical TDS repository layout — the real directory tree, where every kind of new file belongs, the alias map, the generated-vs-source boundary, and the placement of `docs/ai-os/` and `.ai/`.
> **Status:** ACTIVE
> **Owner:** AI OS
> **Last-reviewed:** _(placeholder — set on review)_
> **Precedence:** Subordinate to [00_MASTER_RULES.md](./00_MASTER_RULES.md). This document is a **navigational/placement authority**; it never overrides design truth (Storybook + `*.meta.ts` + `src/tokens/*`) or the [00_MASTER_RULES.md](./00_MASTER_RULES.md) constitution. Where it touches backend/DB/API/CI it is marked **PLANNED**.

---

## 1. Purpose

An AI agent must be able to answer one question deterministically before creating or editing any file: **"Where does this go?"** This document is the map. It fixes the physical shape of the `tds` repository so that:

- New components, tokens, hooks, stories, scripts, and plugin modules land in exactly one predictable place.
- The **generated-vs-source boundary** is unambiguous, so agents never hand-edit an auto-output (a Design-Lock violation per [00_MASTER_RULES.md](./00_MASTER_RULES.md) §Design Lock).
- The **alias map** (`@/`, `@tokens/`, `@core/`, `@components/`) is consistent across TypeScript, Vite, and Storybook.
- The AI OS knows where its own **specs** (`docs/ai-os/`) and **runtime manifests** (`.ai/`) live.

This is the authority any agent MUST consult before adding a file, and the placement rules here feed [.ai/DEPENDENCY_GRAPH.json](../../.ai/DEPENDENCY_GRAPH.json) and the reuse-first workflow in [38_AI_WORKFLOW.md](./38_AI_WORKFLOW.md).

---

## 2. Responsibilities

This specification owns:

- The **canonical tree** — every top-level directory and the shape of `src/`, `scripts/`, `figma/`, `.storybook/`, `docs/`, and `.ai/`.
- The **placement rules** — the single correct home for each artifact kind (component, token, hook, util, style, story, script, plugin module, spec, manifest).
- The **alias map** and the four files that must declare it in lockstep.
- The **generated-vs-source boundary** — which paths are AUTO outputs and therefore sacred.
- The **five-file component folder** shape and the tier partition (atoms / molecules / organisms).
- The placement of `docs/ai-os/` (the 41 specs) and `.ai/` (the 17 manifests).

It does **not** own: token internals ([08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md)), component anatomy semantics ([07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md)), the plugin algorithm ([06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md)), code style ([19_CODE_CONVENTION.md](./19_CODE_CONVENTION.md)), or the manifest schemas ([27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md)).

---

## 3. Scope

**In scope:** the physical directory tree; file-placement decisions; the alias declarations; the generated/source partition; new-file destinations; the location of AI-OS docs and manifests.

**Out of scope:** *what to write inside* a file (see the per-domain specs), naming conventions of symbols ([19_CODE_CONVENTION.md](./19_CODE_CONVENTION.md)), and any **PLANNED** backend layout — the repo has **no** `server/`, `db/`, `supabase/`, `.env`, `.github/`, or test-framework directories today. Those futures are sketched in §12 and governed by [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [15_API_GUIDE.md](./15_API_GUIDE.md), [16_NODE_GUIDE.md](./16_NODE_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md), and [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md).

---

## 4. Rules

1. **MUST** place a new file at the single canonical location defined by §5–§6. If two locations seem plausible, the more specific tier/domain wins.
2. **MUST NEVER** hand-edit any path under `src/generated/`, `src/tokens/generated/`, `figma/tds.plugin.json`, or `figma/plugin/code.js`. These are **generated = sacred**. Change the source, then re-run the relevant `npm run *:build`.
3. **MUST** import components only from the public barrel `@/components` — never from a deep path like `@/components/atoms/Button/Button`. Deep imports are a review-blocking violation ([30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)).
4. **MUST** keep every component as the **five-file folder**: `X.meta.ts`, `X.tsx`, `X.css`, `X.stories.tsx`, `index.ts`, placed in the correct tier folder (`atoms/`, `molecules/`, `organisms/`).
5. **MUST** register a new component in **both** `src/components/metas.ts` (the meta registry) **and** the tier barrel `src/components/<tier>/index.ts` (which re-exports through `src/components/index.ts`).
6. **MUST** keep `*.meta.ts` React/CSS-free with **relative imports only** (no `@/` alias, no JSX, no `.css`). It must remain importable by the Node-side `scripts/build-manifest.ts`.
7. **MUST** author tokens only in `src/tokens/{primitives,semantic}.ts` (+ `types.ts`/`helpers.ts`); the three files under `src/tokens/generated/` are outputs of `npm run tokens:build`.
8. **MUST** declare any new path alias in **all four** alias sites simultaneously: `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `.storybook/main.ts`. A missing declaration in any one breaks a build surface.
9. **MUST** place shared runtime helpers in `src/hooks/index.ts` or `src/utils/` (not inside a component folder) when used by more than one component.
10. **MUST** put example/showcase stories (Board, Dashboard, List, BottomSheet, Foundations, TypeSystem, FigmaMapping) in `src/stories/`, and component-scoped stories in the component's own folder.
11. **SHOULD** add plugin logic as a module under `figma/plugin/src/` (entry stays `code.ts`; there is **no** `main.ts`), never inline into `code.ts` when it forms a cohesive unit (variables/styles/components/recipes/pages/foundation/doc/log/types).
12. **MUST** write AI-OS specs to `docs/ai-os/NN_*.md` and runtime manifests to `.ai/*`. Never mix the two: `docs/ai-os/` is hand-authored durable doctrine; `.ai/` is regenerated/reconciled cache/state.
13. **MUST NOT** commit build outputs `dist/`, `storybook-static/`, `node_modules/`, or `figma/plugin/code.js` — they are `.gitignore`d.

---

## 5. Workflow — the canonical tree

The verified repository layout (build-output and `node_modules` noise elided; ⚙ marks **generated = sacred**):

```text
Figma-Dev-Tools/
├─ index.html                     Vite entry (mounts /src/main.tsx, data-theme="light")
├─ package.json                   name "tds", ESM, Node >=20, all npm scripts
├─ package-lock.json
├─ tsconfig.json                  project refs → app + node
├─ tsconfig.app.json              browser TS + ALIASES; include src
├─ tsconfig.node.json             tooling TS + ALIASES; include vite.config + scripts
├─ vite.config.ts                 react plugin + resolve.alias
├─ eslint.config.js               flat config (js + ts-eslint + react-hooks + storybook)
├─ .prettierrc.json  .prettierignore
├─ .gitignore                     ignores dist, storybook-static, figma/plugin/code.js …
├─ CLAUDE.md  README.md
├─ .storybook/
│  ├─ main.ts                     stories glob, addons, framework, viteFinal ALIASES
│  └─ preview.tsx                 theme/font toolbars, storySort
├─ .claude/
│  └─ agents/                     figma-plugin.md, tds-component.md
├─ docs/
│  ├─ COMPONENTS.md            ⚙ AUTO catalog (build-catalog.ts)
│  └─ ai-os/                      ← THE 41 AI-OS SPECS (this effort; hand-authored)
│     └─ 18_FOLDER_STRUCTURE.md   (this file)
├─ .ai/                           ← THE 17 RUNTIME MANIFESTS (regenerated/reconciled)
├─ scripts/
│  ├─ build-tokens.ts             → src/tokens/generated/*
│  ├─ build-manifest.ts           → src/generated/… + figma/tds.plugin.json
│  ├─ build-catalog.ts            → docs/COMPONENTS.md
│  └─ lib/css-bindings.ts         PostCSS parser (per-variant token bindings)
├─ figma/
│  ├─ README.md                   the plugin CONTRACT (hand-authored)
│  ├─ tds.plugin.json          ⚙ AUTO bundle { tokens, design }
│  └─ plugin/
│     ├─ manifest.json  ui.html  README.md  tsconfig.json
│     ├─ code.js               ⚙ AUTO esbuild output (gitignored)
│     ├─ src/                     code.ts (entry) · components.ts · recipes.ts ·
│     │                           variables.ts · styles.ts · pages.ts ·
│     │                           foundation.ts · doc.ts · log.ts · types.ts · globals.d.ts
│     └─ test/harness.ts          HEADLESS Figma-API mock (plugin:test gate)
└─ src/
   ├─ main.tsx  App.tsx  App.css  vite-env.d.ts   demo host (not the library surface)
   ├─ tokens/
   │  ├─ types.ts  primitives.ts  semantic.ts  helpers.ts  index.ts
   │  └─ generated/            ⚙ tokens.css · figma.tokens.json · token-ids.ts
   ├─ core/
   │  ├─ types.ts               ComponentMeta model
   │  ├─ defineComponent.ts     defineComponentMeta · toDataAttrs · defaultsFromMeta · variantCount
   │  ├─ storybook.ts           argTypesFromMeta · argsFromMeta · metaParameters · docDescription
   │  └─ index.ts
   ├─ components/
   │  ├─ index.ts               PUBLIC BARREL (import from here only)
   │  ├─ metas.ts               registry: atomMetas + moleculeMetas + organismMetas → componentMetas
   │  ├─ atoms/                 24 components + index.ts (tier barrel)
   │  ├─ molecules/             27 components + index.ts
   │  └─ organisms/             9 components + index.ts
   ├─ hooks/index.ts            useControllableState · useOnClickOutside · useKeyDown ·
   │                            useMediaQuery · useDisclosure · useFocusTrap
   ├─ utils/                    cx.ts · chart.ts · index.ts (mergeRefs)
   ├─ styles/                   global.css · fonts.css · reset.css · tones.css · charts.css
   ├─ stories/                  Foundations · TypeSystem · FigmaMapping +
   │                            Board/Dashboard/List/BottomSheet examples
   └─ generated/                ⚙ design-system.manifest.json
```

Each component tier folder holds one sub-folder per component; **Button** is the reference shape:

```text
src/components/atoms/Button/
├─ Button.meta.ts     ComponentMeta (pure data; relative imports; React/CSS-free)
├─ Button.tsx         forwardRef component; toDataAttrs(meta, …); cx from @/utils
├─ Button.css         token-driven (var(--tds-*)); zero-runtime; data-* selectors
├─ Button.stories.tsx CSF3; metaParameters/argTypesFromMeta/argsFromMeta(meta)
└─ index.ts           re-export
```

**Adding a file — decision path** (also see [38_AI_WORKFLOW.md](./38_AI_WORKFLOW.md)):

1. `npm run storybook` and check [docs/COMPONENTS.md](../../docs/COMPONENTS.md) first — **reuse before create** ([00_MASTER_RULES.md](./00_MASTER_RULES.md), [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md)).
2. New **component** → `src/components/<tier>/<Name>/` (five files) → register in `metas.ts` + `<tier>/index.ts` → `npm run ds:build`.
3. New **token** → edit `src/tokens/primitives.ts`/`semantic.ts` → `npm run tokens:build` (never touch `generated/`).
4. New **hook** → append to `src/hooks/index.ts`; new **util** → `src/utils/`.
5. New **plugin behavior** → module under `figma/plugin/src/`, wired from `code.ts` → `npm run figma:build`.
6. New **example** → `src/stories/*.stories.tsx`. New **spec** → `docs/ai-os/NN_*.md`. New **manifest** → `.ai/*`.

---

## 6. Examples

**Correct component import (barrel only):**

```ts
// ✅ from the public barrel
import { Button, Card, Dropdown, Select } from '@/components';

// ❌ deep path — Rule 3 violation, blocks review
import { Button } from '@/components/atoms/Button/Button';
```

**Alias map (identical intent across all four sites; `tsconfig.*` use the `/*` form, `vite.config.ts` uses bare keys):**

```jsonc
// tsconfig.app.json + tsconfig.node.json → compilerOptions.paths
"@/*":          ["src/*"],
"@tokens/*":    ["src/tokens/*"],
"@core/*":      ["src/core/*"],
"@components/*":["src/components/*"]
```

```ts
// vite.config.ts (and mirrored in .storybook/main.ts viteFinal)
alias: {
  '@':           resolve(__dirname, 'src'),
  '@tokens':     resolve(__dirname, 'src/tokens'),
  '@core':       resolve(__dirname, 'src/core'),
  '@components': resolve(__dirname, 'src/components'),
}
```

**Generated-vs-source at a glance:**

| Source (edit) | Build script | Generated (sacred, never edit) |
| --- | --- | --- |
| `src/tokens/primitives.ts`, `semantic.ts` | `npm run tokens:build` | `src/tokens/generated/{tokens.css, figma.tokens.json, token-ids.ts}` |
| `src/components/**/*.meta.ts`, `metas.ts`, `src/tokens/*`, `scripts/lib/css-bindings.ts` | `npm run manifest:build` | `src/generated/design-system.manifest.json`, `figma/tds.plugin.json` |
| component folders + metas | `npm run catalog:build` | `docs/COMPONENTS.md` |
| `figma/plugin/src/*.ts` | `npm run plugin:build` | `figma/plugin/code.js` |

**`.meta.ts` purity (Rule 6) — importable by the Node manifest builder:**

```ts
// Button.meta.ts — relative imports only, no JSX, no CSS, no '@/' alias
import { defineComponentMeta } from '../../../core/defineComponent';
export const buttonMeta = defineComponentMeta({ /* pure data */ });
```

---

## 7. Validation Rules

Placement compliance is checked by real mechanisms:

- **`npm run lint`** (`eslint .`) — flat config catches deep imports/unused symbols; a component importing another via a deep path fails review.
- **`npm run build`** (`tsc -b && vite build`) — a misplaced alias or a `.meta.ts` that imports React/CSS fails type resolution.
- **`npm run ds:build`** — `tokens:build` + `manifest:build` + `catalog:build` must succeed; a new component missing from `metas.ts` is **silently absent** from `figma/tds.plugin.json` and `docs/COMPONENTS.md` → detected by diffing the regenerated catalog.
- **`npm run figma:build`** — adds `plugin:typecheck` + `plugin:build` + `plugin:test` (the headless harness `figma/plugin/test/harness.ts`, which `process.exit(1)` on coverage mismatch). A plugin module that isn't wired from `code.ts` shows up as missing coverage.
- **`git status`** — after a source change, the matching `generated/` file must appear dirty; if a *generated* file is dirty **without** a source change, someone hand-edited an output (Rule 2 violation).
- **Manual gate** — reviewer confirms the five-file shape and dual registration per [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md).

---

## 8. Checklist

- [ ] File is at its single canonical location (§5–§6); no plausible more-specific home was skipped.
- [ ] Component is a five-file folder in the correct tier (`atoms`/`molecules`/`organisms`).
- [ ] Component registered in **both** `src/components/metas.ts` and the tier `index.ts`.
- [ ] Imports use the `@/components` barrel; no deep component paths.
- [ ] `*.meta.ts` is React/CSS-free with relative imports only.
- [ ] Tokens edited in `src/tokens/*.ts`, not in `src/tokens/generated/`.
- [ ] No generated path (`src/generated/`, `src/tokens/generated/`, `figma/tds.plugin.json`, `figma/plugin/code.js`) hand-edited.
- [ ] New alias declared in all four sites (`tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `.storybook/main.ts`).
- [ ] The correct build ran (`ds:build` / `figma:build`) and generated outputs are consistent.
- [ ] Spec → `docs/ai-os/`; manifest → `.ai/` (never swapped).

---

## 9. Failure Recovery

| Symptom | Diagnosis | Fix | Resume |
| --- | --- | --- | --- |
| New component absent from Storybook/Figma/catalog | Not registered in `metas.ts` and/or tier `index.ts` (Rule 5) | Add both registrations | `npm run ds:build`, re-verify catalog diff |
| `Cannot find module '@/…'` in one surface only | Alias missing from one of the four sites (Rule 8) | Add the alias there | Re-run that surface's build |
| `tsc` error importing `.meta.ts` from `scripts/build-manifest.ts` | `.meta.ts` pulled in React/CSS/`@/` alias (Rule 6) | Strip to pure data + relative imports | `npm run manifest:build` |
| Generated file shows as modified with no source change | An auto-output was hand-edited (Rule 2) | `git checkout -- <path>`, change the **source** instead | Re-run the matching `*:build` |
| Deep-import lint error | Bypassed the barrel (Rule 3) | Switch to `@/components` | `npm run lint` |
| `figma:build` harness `exit 1` | New plugin module not wired from `code.ts`, or coverage gap | Wire the module / restore coverage | `npm run figma:build` |
| Build output committed | `dist/`/`storybook-static/`/`code.js` staged | `git rm --cached`, confirm `.gitignore` | commit |

Resume-after-context-loss reads `.ai/SESSION_SUMMARY.md` + `.ai/TASKS.json` to relocate in-flight work ([28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md)).

---

## 10. Dependencies

- **Docs:** [00_MASTER_RULES.md](./00_MASTER_RULES.md) (precedence, Design Lock, generated-is-sacred), [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md) (five-file anatomy), [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md) (token sources vs generated), [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md) (`figma/plugin/` layout), [19_CODE_CONVENTION.md](./19_CODE_CONVENTION.md) (import/style rules), [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md) (`.ai/` schemas), [38_AI_WORKFLOW.md](./38_AI_WORKFLOW.md) (add-file workflows), [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md) (placement gates).
- **Manifests:** [.ai/PROJECT_MANIFEST.json](../../.ai/PROJECT_MANIFEST.json), [.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json), [.ai/DEPENDENCY_GRAPH.json](../../.ai/DEPENDENCY_GRAPH.json).
- **Real files/scripts:** `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `.storybook/main.ts`, `package.json` scripts (`ds:build`, `figma:build`), `scripts/build-*.ts`, `src/components/metas.ts`, `src/components/index.ts`.

---

## 11. Template — scaffolding a new component folder

```text
src/components/<tier>/<Name>/
├─ <Name>.meta.ts       export const <name>Meta = defineComponentMeta({ … })  // pure data
├─ <Name>.tsx           forwardRef; toDataAttrs(<name>Meta, {…}); cx from '@/utils'
├─ <Name>.css           var(--tds-*) only; [data-<axis>="…"] selectors
├─ <Name>.stories.tsx   title '<Tier>/<Name>'; tags ['autodocs']; *FromMeta(<name>Meta)
└─ index.ts             export { <Name> } from './<Name>'; export { <name>Meta } from './<Name>.meta';
```

Then wire it up:

```ts
// src/components/<tier>/index.ts   → export * from './<Name>';
// src/components/metas.ts          → add <name>Meta to <tier>Metas[]
// run:  npm run ds:build   (regenerates manifest + bundle + docs/COMPONENTS.md)
```

New AI-OS artifacts:

```text
docs/ai-os/NN_TITLE.md     ← durable spec (front-matter + 12 sections)
.ai/NAME.json              ← runtime manifest ($schema/version/generatedAt/generator)
```

---

## 12. Future Extension

The tree is engineered to absorb the **PLANNED** backend and tooling without disturbing the design-system surface:

- **Backend — PLANNED (no backend exists in the repo today).** New top-level siblings, isolated from `src/` (the design system): `supabase/` (migrations, RLS policies, Edge Functions — [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md)), `server/` or `api/` (Node ≥20 / TypeScript API layer — [15_API_GUIDE.md](./15_API_GUIDE.md), [16_NODE_GUIDE.md](./16_NODE_GUIDE.md)), `db/` schema + `.ai/ERD.json` / `.ai/API_SPEC.json` contracts ([14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md)). Engineered for >10,000,000 users; introduced only when explicitly requested/approved.
- **CI/CD — PLANNED.** `.github/workflows/` runs the existing gates (`lint`, `build`, `ds:build`, `figma:build`) plus future test suites ([25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)).
- **Testing — PLANNED.** No test framework/`*.test`/`*.spec`/`"test"` script exists yet; today's only automated gate is `figma/plugin/test/harness.ts`. Future unit/interaction/visual/e2e suites co-locate per [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md).
- **Scale of the current tree.** The 60 components (24/27/9) grow within the fixed tier folders; the barrel + `metas.ts` registry keep import cost O(1) regardless of count. The `.ai/` cache keeps agent context minimal as the repo grows ([26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md), [37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md)).

Any new top-level directory MUST be added to this document, `.gitignore` (if an output), and the alias sites (if importable) in the same change.
