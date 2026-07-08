---
$schema: https://keepachangelog.com/en/1.1.0/
title: TDS AI OS — Changelog
version: 0.1.0
generatedAt: 2026-07-08
generator: seed (hand-authored bootstrap; thereafter maintained per docs/ai-os/31_CHANGE_MANAGEMENT.md)
seed: true
status: planned
package: tds
format: keep-a-changelog@1.1.0
versioning: semver@2.0.0
---

# Changelog

All notable changes to **TDS** (`tds` — the metadata-driven design system and its
AI Operating System) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Seed notice.** This file is a `seed: true` bootstrap artifact. It records the
> initial state of the repository at AI OS inception. Entries marked **PLANNED**
> describe the target standard for capabilities that **do not exist in the repo today**
> (backend, database, API, Supabase, CI, unit/e2e test frameworks). Release and
> versioning discipline is governed by [docs/ai-os/32_RELEASE_GUIDE.md](../docs/ai-os/32_RELEASE_GUIDE.md);
> change propagation by [docs/ai-os/31_CHANGE_MANAGEMENT.md](../docs/ai-os/31_CHANGE_MANAGEMENT.md).

## Conventions

- **Categories** (in order): `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.
- **SemVer mapping** (per [32_RELEASE_GUIDE.md](../docs/ai-os/32_RELEASE_GUIDE.md)):
  - **MAJOR** — a breaking change to a token id, component name, variant axis/value,
    the Figma bundle contract (`figma/tds.plugin.json` = `{ tokens, design }`), or a
    manifest schema in `.ai/`.
  - **MINOR** — a new component, token, variant option, page, manifest, or AI OS doc
    added without breaking existing contracts.
  - **PATCH** — a bug fix, doc clarification, or regenerated output with no contract change.
- **Design Lock.** Any visual change is a **source** change (`*.meta.ts`, `src/tokens/*`,
  component CSS) that flows through `npm run ds:build` / `npm run figma:build`. Generated
  outputs (`figma/*`, `src/generated/*`, `src/tokens/generated/*`, `figma/plugin/code.js`)
  are never hand-edited and never receive their own changelog entries.
- **Pre-1.0.0.** While the package is `0.x`, the public surface is considered unstable;
  breaking changes may land in a MINOR bump until `1.0.0` is cut.

---

## [Unreleased]

Working toward the first tagged release. The repository currently ships the frontend
design system, its generated manifests, the Figma plugin with a headless harness, and
the AI OS documentation + runtime manifest set.

### Added

- **Design system — 60 components, already built.** The complete TDS component library:
  **24 atoms, 27 molecules, 9 organisms**, each shipping the canonical 5-file anatomy
  (`X.meta.ts` · `X.tsx` · `X.css` · `X.stories.tsx` · `index.ts`) and registered through
  `src/components/metas.ts` (`atomMetas` + `moleculeMetas` + `organismMetas` → `componentMetas`)
  and the single public barrel `@/components`. Catalog: [docs/COMPONENTS.md](../docs/COMPONENTS.md).
- **Metadata-driven core.** `src/core/` exposing the `ComponentMeta` model (`types.ts`),
  `defineComponentMeta` / `toDataAttrs` / `defaultsFromMeta` / `variantCount`
  (`defineComponent.ts`), and Storybook derivation helpers
  `argTypesFromMeta` / `argsFromMeta` / `metaParameters` / `docDescription` (`storybook.ts`).
  One pure-data meta drives four outputs: React component, Storybook controls/autodocs/a11y,
  and the Figma manifest.
- **Token system.** TypeScript-authored, Figma-shaped tokens in `src/tokens/`
  (`primitives.ts`, `semantic.ts`, `types.ts`, `helpers.ts`) generating
  `src/tokens/generated/{tokens.css, figma.tokens.json, token-ids.ts}` via `npm run tokens:build`.
  Three variable collections — **Primitives → Semantic → Theme** (`light` / `dark` modes) —
  plus effect and text styles. Web CSS uses `var(--tds-*)`; Figma variable names use `/` separators.
- **Variant model.** `type` (layout preset `A/B/C`), `variant` (labelled **"Style"** — visual fill),
  composing with `tone` / `size` / `shape`; the `state` axis is deliberately **not** emitted as a
  Figma variant (`disabled` / `loading` survive as `BOOLEAN` component props). Every axis is emitted
  to the DOM as `data-*` for Figma legibility.
- **Storybook 8 as the single source of truth.** CSF3 stories (`Tier/Name`, `tags: ["autodocs"]`)
  with `essentials`, `a11y`, and `interactions` addons; theme/font toolbars via `data-theme` /
  `data-font`; `storySort` Foundations → Atoms → Molecules → Organisms
  (`.storybook/main.ts`, `.storybook/preview.tsx`). Foundations, TypeSystem, FigmaMapping, and
  Example stories (Board, Dashboard, List, BottomSheet) under `src/stories/`.
- **Build pipeline.** npm scripts `tokens:build`, `manifest:build`, `catalog:build`,
  `ds:build` (all three), and `figma:build` (`ds:build` → `plugin:typecheck` → `plugin:build`
  → `plugin:test`). `scripts/build-manifest.ts` emits both
  `src/generated/design-system.manifest.json` and the Figma bundle `figma/tds.plugin.json`;
  `scripts/lib/css-bindings.ts` derives per-variant `tokenBindings` from component CSS via PostCSS.
- **Figma bundle contract.** `figma/tds.plugin.json` = `{ $schema, version, generator, tokens, design }`
  with 3 variable collections, effect/text styles, and 60 component sets. Contract documented in
  [figma/README.md](../figma/README.md).
- **Figma plugin + headless harness.** `figma/plugin/` (entry `figma/plugin/src/code.ts`;
  modules `components.ts`, `recipes.ts`, `variables.ts`, `styles.ts`, `pages.ts`,
  `foundation.ts`, `doc.ts`, `log.ts`, `types.ts`) rebuilds the entire system in Figma from the
  bundle with **no per-component code** — Variables, Effect/Text Styles, and Component Sets
  (cartesian product of `variantAxes`), organized into 8 auto-generated pages
  (`TDS · N · Title`). `npm run plugin:test` runs `figma/plugin/test/harness.ts`, a headless
  Figma-API mock that asserts coverage and exits non-zero on mismatch.
- **AI Operating System — documentation.** The `docs/ai-os/` spec set (`00`–`40`) establishing
  the constitution ([00_MASTER_RULES.md](../docs/ai-os/00_MASTER_RULES.md)), the Design Lock policy,
  the source-of-truth hierarchy, and per-domain specifications for design, Storybook, Figma,
  plugin, components, tokens, variants, and operations.
- **AI Operating System — runtime manifests.** The `.ai/` manifest set seeded for AI agents:
  `PROJECT_MANIFEST.json`, `DESIGN_MANIFEST.json`, `COMPONENT_INDEX.json`, `TOKEN_INDEX.json`,
  `FIGMA_MAPPING.json`, `PLUGIN_INDEX.json`, `VARIANT_INDEX.json`, `RESPONSIVE_RULES.json`,
  `INTERACTION_RULES.json`, `ANIMATION_RULES.json`, `DEPENDENCY_GRAPH.json`, `ERD.json`,
  `API_SPEC.json`, `TASKS.json`, `SESSION_SUMMARY.md`, this `CHANGELOG.md`, and `REVIEW_REPORT.md`.
- **AI OS manifest generator.** `scripts/build-ai-manifests.ts` + the `ai:manifests` npm script
  (chained into `ds:build`) regenerates the 8 data-derived `.ai/` manifests from source
  (`src/components/*.meta.ts`, `src/tokens/generated/figma.tokens.json`, the generated bundle),
  surfacing the 60-source-component view and the 96-Figma-entry view (post `type` A/B/C preset
  split) without contradiction; the 9 seed/planned manifests are left untouched. Indexes
  ([docs/ai-os/README.md](../docs/ai-os/README.md), [.ai/README.md](./README.md)) and a
  [_VALIDATION_REPORT.md](../docs/ai-os/_VALIDATION_REPORT.md) accompany it. Verified: `npm run
  ds:build` and `npm run figma:build` both green (headless verification passed, 0 blocking warnings).
- **AI subagents.** `@tds-component` (React/meta-driven component work) and `@figma-plugin`
  (100% structural-fidelity plugin work) under `.claude/agents/`.

### Changed

- _Nothing yet._ (Baseline entry — no changes since inception.)

### Deprecated

- _Nothing yet._

### Removed

- _Nothing yet._

### Fixed

- _Nothing yet._

### Security

- **Plugin network access is `none`.** The Figma plugin ships with no network access;
  the bundle is read locally. See [docs/ai-os/22_SECURITY_GUIDE.md](../docs/ai-os/22_SECURITY_GUIDE.md).

### Planned

> **STATUS: PLANNED — no backend exists in the repo today.** Runtime dependencies are
> currently only `react` + `react-dom`. The following are target-state entries and will be
> reclassified into `Added` when implemented.

- **PLANNED — Backend / Supabase.** Postgres + Auth + RLS + Storage + Edge Functions + Realtime,
  fronted by a Node ≥ 20 / TypeScript API layer engineered to scale beyond 10,000,000 users.
  Standards: [14_DATABASE_GUIDE.md](../docs/ai-os/14_DATABASE_GUIDE.md),
  [15_API_GUIDE.md](../docs/ai-os/15_API_GUIDE.md),
  [16_NODE_GUIDE.md](../docs/ai-os/16_NODE_GUIDE.md),
  [17_SUPABASE_GUIDE.md](../docs/ai-os/17_SUPABASE_GUIDE.md).
- **PLANNED — Data contracts.** `.ai/ERD.json` (schema) and `.ai/API_SPEC.json` (API surface)
  become authoritative once the backend lands.
- **PLANNED — CI/CD.** `.github` pipelines with the `figma:build` and `plugin:test` gates,
  release automation, and environment promotion per
  [25_DEVOPS_GUIDE.md](../docs/ai-os/25_DEVOPS_GUIDE.md) and
  [32_RELEASE_GUIDE.md](../docs/ai-os/32_RELEASE_GUIDE.md).
- **PLANNED — Test frameworks.** Interaction, visual, unit, and e2e layers atop the existing
  headless harness per [24_TESTING_GUIDE.md](../docs/ai-os/24_TESTING_GUIDE.md).
- **PLANNED — MCP surface.** Manifest read/update, session recovery, and Storybook↔Figma sync
  tools per [35_MCP_SPECIFICATION.md](../docs/ai-os/35_MCP_SPECIFICATION.md).

---

## Release template

Copy this skeleton when cutting a release. Move applicable `Unreleased` items under the new
version heading, date it `YYYY-MM-DD`, and reset `Unreleased` categories to _Nothing yet._

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- …

### Changed
- …

### Deprecated
- …

### Removed
- …

### Fixed
- …

### Security
- …
```

---

<!--
  Link references. Update the compare/tag URLs to the real remote when the repository
  is published and the first tag is cut. Until then these are placeholders.
-->
[Unreleased]: https://example.com/tds/compare/HEAD
[Keep a Changelog]: https://keepachangelog.com/en/1.1.0/
[Semantic Versioning]: https://semver.org/spec/v2.0.0.html
