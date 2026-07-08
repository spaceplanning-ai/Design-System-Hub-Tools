# 31 — Change Management

> **Title:** Change Management
> **Purpose:** Define how any change to a token, component, `*.meta.ts`, variant, or (PLANNED) schema is classified, propagated through the TDS build pipeline, versioned, deprecated, migrated, and recorded — so the metadata-driven system never drifts, never duplicates work, and stays reconstructible after context loss.
> **Status:** ACTIVE
> **Owner:** AI OS
> **Last-reviewed:** _(placeholder — set on review)_
> **Precedence:** Subordinate to [00_MASTER_RULES.md](./00_MASTER_RULES.md); the constitution, the Source-of-Truth Hierarchy, and the Design Lock Policy win on any conflict. This document governs *how a change moves through the system*. It defers the **decision to approve** a change to [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md), the **act of shipping a version** to [32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md), and the **per-task mechanics** to [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md). Any backend/DB/API/CI content here is marked **PLANNED**.

---

## 1. Purpose

TDS is a **metadata-driven system where one source feeds four outputs**: each `X.meta.ts` and the
token sources in `src/tokens/` drive (a) the React component, (b) Storybook, (c) the generated
manifests (`src/generated/design-system.manifest.json`, `figma/tds.plugin.json`), and (d) the Figma
reproduction. Because everything downstream is **derived**, an uncontrolled change is not a local
edit — it is a fault that silently propagates into CSS, the manifest, the plugin bundle, and Figma.

Change Management exists to make every change **deliberate, traceable, and fully propagated**. It
answers four questions for any proposed edit:

1. **What kind of change is this?** (token / component / meta / variant / doc / manifest / PLANNED schema)
2. **What must be regenerated so nothing downstream is stale?** (which `npm run *:build` steps, in order)
3. **Is it breaking?** (semver class, deprecation vs. removal, migration required)
4. **Where is it recorded?** (`.ai/CHANGELOG.md`, the `.ai` manifests, the review report)

This is the discipline that guarantees the CANON goals: **no design drift, no inconsistent
implementations, no duplicated work, Storybook↔Figma perfect sync**, and **resume-after-context-loss**.

---

## 2. Responsibilities

This specification owns:

- **Change classification** — the taxonomy of change kinds and their semver class (patch / minor / major).
- **Propagation contracts** — for each change kind, the exact ordered pipeline (`tokens:build` →
  `manifest:build` → `catalog:build`, then `figma:build`) that must run so no derived output is stale.
- **Deprecation policy** — how a token id, component, variant option, or prop is retired without a
  hard break: alias/shim, deprecation window, then removal in a major bump.
- **Migration discipline** — when and how to author migration notes and (PLANNED) codemods/DB migrations.
- **CHANGELOG discipline** — the [Keep a Changelog](https://keepachangelog.com) format enforced in
  [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md), and which entries are mandatory.
- **Manifest reconciliation** — which `.ai/*` manifests MUST be regenerated/updated per change kind.

It does **not** own: whether a change is *approved* ([30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)),
how a release is *cut and published* ([32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md)), the token model
itself ([08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md)), component anatomy
([07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md)), or the variant-axis rules
([09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md)).

---

## 3. Scope

**In-scope**

- Changes to token sources: `src/tokens/primitives.ts`, `src/tokens/semantic.ts`,
  `src/tokens/helpers.ts`, `src/tokens/types.ts`, `src/tokens/index.ts`.
- Changes to component sources: any `X.meta.ts`, `X.tsx`, `X.css`, `X.stories.tsx`, folder
  `index.ts`, the registry `src/components/metas.ts`, and the public barrel `src/components/index.ts`.
- Changes to the build scripts (`scripts/build-tokens.ts`, `scripts/build-manifest.ts`,
  `scripts/build-catalog.ts`, `scripts/lib/css-bindings.ts`) and the Figma plugin sources under
  `figma/plugin/src/`.
- Changes to the `.ai/*` manifests and the `docs/ai-os/*` spec documents.
- **PLANNED** schema changes: `.ai/ERD.json`, `.ai/API_SPEC.json`, and the future Supabase/Postgres
  migrations described in [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md) and [15_API_GUIDE.md](./15_API_GUIDE.md).

**Out-of-scope**

- **Hand-editing generated outputs** — `src/tokens/generated/*`, `src/generated/design-system.manifest.json`,
  `figma/tds.plugin.json`, `figma/plugin/code.js`, `docs/COMPONENTS.md`. These are AUTO outputs and
  are **PROHIBITED** to edit directly (Design Lock; [00_MASTER_RULES.md](./00_MASTER_RULES.md)). A
  "change" to them is always a change to their **source** followed by a rebuild.
- **Visual redesign of the system** — beautifying, restyling, renaming. Storybook is IMMUTABLE truth
  ([03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md), [04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md)).
  A visual change is a *source* change flowed through this process, never an ad-hoc edit.
- **Release cutting / publishing** — owned by [32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md).

---

## 4. Rules

Rules are **MUST/SHOULD/NEVER** and each ties to a real mechanism in this repo.

**Classification & source-of-truth**

1. **MUST classify every change** before editing, into exactly one primary kind: `token`,
   `component`, `meta`, `variant`, `script/plugin`, `doc`, `manifest`, or `schema (PLANNED)`. The
   kind selects the propagation contract in §5.
2. **MUST edit source, NEVER derived output.** Any change to Figma/CSS/manifest content is made in
   `*.meta.ts`, `src/tokens/*`, or the `scripts/*` generators, then rebuilt. Editing
   `figma/tds.plugin.json`, `src/generated/*`, `src/tokens/generated/*`, or `figma/plugin/code.js`
   by hand is a **hard violation**.
3. **MUST respect the Source-of-Truth Hierarchy** ([00_MASTER_RULES.md](./00_MASTER_RULES.md)):
   Storybook + `*.meta.ts`/`src/tokens` are truth; the manifests are derived; Figma is a reproduction;
   `.ai/*` is a regenerable cache. Changes flow **downward only** — Figma edits NEVER flow back up.

**Propagation completeness**

4. **MUST fully propagate.** A change is *not done* until every downstream artifact it touches is
   regenerated and the relevant gate is green. The minimum for a token or component change is
   `npm run ds:build` followed by `npm run figma:build` (which re-runs `ds:build`, then
   `plugin:typecheck`, `plugin:build`, `plugin:test`).
5. **MUST run builds in dependency order.** `tokens:build` → `manifest:build` → `catalog:build`.
   `ds:build` already sequences these; never run `manifest:build` against stale
   `src/tokens/generated/*`.
6. **NEVER leave a partial propagation committed.** If `plugin:test` (the headless coverage harness
   at `figma/plugin/test/harness.ts`) fails, the change is incomplete — fix the source, do not
   suppress the gate.

**Versioning & breaking changes**

7. **MUST assign a semver class** to every change using §6's decision table: **patch** (no API/DOM/
   token-id/variant-axis surface change), **minor** (additive: new token, new component, new variant
   option, new optional prop), **major** (breaking: removed/renamed token id, removed component,
   removed variant option, changed default, changed `data-*` axis surface).
8. **NEVER perform a breaking change as a silent edit.** A rename or removal MUST go through the
   deprecation cycle (§4.10–4.12) unless explicitly approved as an immediate breaking change per
   [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md).
9. **NEVER rename** a token id, component, variant, axis (`type`/`variant`/`tone`/`size`/`shape`/
   `state`), or Figma variable **on the AI's own initiative** (Design Lock). Renames are
   source-level, explicitly requested, and always breaking.

**Deprecation & migration**

10. **MUST deprecate before removing.** To retire a token id, expose it as an alias (`ref()`) to its
    replacement for one release window; to retire a component/variant option, keep it exported and
    mark it deprecated in the `.ai/CHANGELOG.md` `Deprecated` section with the removal target version.
11. **MUST record a migration note** for every `major` change: what changed, why, the before→after,
    and the exact steps/commands to migrate. Store it in the CHANGELOG entry and (for schema) as a
    PLANNED migration file.
12. **SHOULD provide a codemod or search-and-replace recipe** when a rename affects many call sites
    (e.g. a token id used across component CSS).

**Recording**

13. **MUST update [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md)** for every change that alters source,
    tokens, components, variants, or manifests, using Keep-a-Changelog sections
    (`Added`/`Changed`/`Deprecated`/`Removed`/`Fixed`/`Security`).
14. **MUST reconcile the affected `.ai/*` manifests** in the same change (§5 lists which). The `.ai`
    layer is always regenerated/reconciled from sources 2–3; a change that leaves it stale breaks
    resume ([28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md)) and token-optimized reads
    ([26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md)).
15. **MUST keep the change atomic and minimal** — one logical change per commit, smallest diff that
    fully propagates ([20_CLEAN_CODE.md](./20_CLEAN_CODE.md)). NEVER bundle an unrelated refactor.

---

## 5. Workflow

The canonical change lifecycle. Steps 1–3 and 8–10 are shared with
[29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md); this doc owns the **propagation** middle (4–7).

**Step 0 — Classify.** Pick the change kind (§4.1) and its semver class (§6). This determines the
propagation contract and CHANGELOG section below.

**Step 1 — Read before write.** Consult the relevant manifest first to avoid duplicated work:
[.ai/TOKEN_INDEX.json](../../.ai/TOKEN_INDEX.json), [.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json),
[.ai/VARIANT_INDEX.json](../../.ai/VARIANT_INDEX.json), [.ai/DEPENDENCY_GRAPH.json](../../.ai/DEPENDENCY_GRAPH.json),
and `docs/COMPONENTS.md`. Reuse first ([00_MASTER_RULES.md](./00_MASTER_RULES.md)).

**Step 2 — Edit source only.** Apply the smallest change to the correct source file(s):

| Change kind | Source files edited |
| --- | --- |
| **token** | `src/tokens/primitives.ts` / `semantic.ts` / `helpers.ts` (+ `types.ts` for new token types) |
| **component / meta** | `X.meta.ts`, `X.tsx`, `X.css`, `X.stories.tsx`, folder `index.ts`; register in `src/components/metas.ts` + tier barrel `src/components/index.ts` |
| **variant** | `X.meta.ts` variant axes; `X.css` `data-*` bindings; `X.stories.tsx` |
| **script / plugin** | `scripts/build-*.ts`, `scripts/lib/css-bindings.ts`, `figma/plugin/src/*.ts` |
| **schema (PLANNED)** | `.ai/ERD.json`, `.ai/API_SPEC.json`, future migration files |

**Step 3 — Propagate (regenerate).** Run the ordered pipeline for the change kind:

```bash
# Token change (also affects manifest tokenBindings + Figma bundle tokens):
npm run tokens:build     # -> src/tokens/generated/{tokens.css, figma.tokens.json, token-ids.ts}
npm run manifest:build   # -> src/generated/design-system.manifest.json + figma/tds.plugin.json
npm run catalog:build    # -> docs/COMPONENTS.md
# or simply:
npm run ds:build         # runs the three above in order

# Any change that must reach Figma (token/component/meta/variant/plugin):
npm run figma:build      # ds:build -> plugin:typecheck -> plugin:build -> plugin:test
```

- **token** → `tokens:build` is mandatory (it feeds `--tds-*` CSS and the bundle `tokens`), then
  `ds:build` + `figma:build`.
- **component / meta / variant** → `ds:build` (manifest picks up axes, `metaParameters`, and CSS
  bindings via `scripts/lib/css-bindings.ts`), then `figma:build`.
- **script / plugin** → rebuild whatever that script emits, then `figma:build` (the harness gate).
- **doc only** → no build; but `catalog:build` if a component's meta description changed.

**Step 4 — Reconcile `.ai` manifests.** Regenerate/update the manifests the change touched:

| Change kind | Manifests to reconcile |
| --- | --- |
| token | `TOKEN_INDEX.json`, `FIGMA_MAPPING.json`, `DESIGN_MANIFEST.json`, `DEPENDENCY_GRAPH.json` |
| component / meta | `COMPONENT_INDEX.json`, `VARIANT_INDEX.json`, `FIGMA_MAPPING.json`, `DEPENDENCY_GRAPH.json`, `PROJECT_MANIFEST.json` |
| variant | `VARIANT_INDEX.json`, `COMPONENT_INDEX.json`, `FIGMA_MAPPING.json` |
| plugin / script | `PLUGIN_INDEX.json`, `FIGMA_MAPPING.json` |
| schema (PLANNED) | `ERD.json`, `API_SPEC.json` |
| any | `CHANGELOG.md`, and `TASKS.json` / `SESSION_SUMMARY.md` for resume state |

**Step 5 — Validate gates.** Run §7's validation: `lint`, `build` (typecheck), `ds:build`,
`figma:build` (which ends in `plugin:test`). All must be green.

**Step 6 — Record the change.** Add the `.ai/CHANGELOG.md` entry (§11 template) under the correct
Keep-a-Changelog section, including a migration note for `major` changes.

**Step 7 — Review & approve.** Route through [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)
(drift check, Design-Lock check, `REVIEW_REPORT.md`). Only then commit; releasing is
[32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md).

---

## 6. Examples

Repo-specific, concrete.

### 6.1 Semver decision table

| Change | Class | Deprecation cycle? |
| --- | --- | --- |
| Add a new primitive/semantic token id | **minor** | no |
| Re-value an existing semantic token (same id, new alias target) | **patch/minor** | no (visual change ⇒ requires approval) |
| Rename a token id (`color.brand.solid` → `color.accent.solid`) | **major** | **yes** — alias old→new for one window |
| Add a new component to a tier barrel | **minor** | no |
| Add a new `variant` (Style) option to a component | **minor** | no |
| Remove a `size` option from a meta | **major** | **yes** |
| Change a component's default `tone` | **major** | note in CHANGELOG `Changed` |
| Add an optional prop to `X.tsx` + meta | **minor** | no |
| Rename a `data-*` axis (`data-tone` surface) | **major** | **yes** — plugin/Figma surface break |
| Fix CSS token binding that was pointing at the wrong `--tds-*` var | **patch** | no |
| Edit a `docs/ai-os/*` spec | n/a (doc) | no |

### 6.2 Token re-value (patch/minor, propagation)

Change the danger tone in `src/tokens/semantic.ts`, then propagate:

```bash
# 1. edit src/tokens/semantic.ts  (source only)
npm run ds:build      # regenerates tokens.css, figma.tokens.json, token-ids.ts, manifest, bundle, catalog
npm run figma:build   # re-verifies the plugin bundle against the headless harness
```

The generated `--tds-color-*` var and the bundle `tokens` collection update automatically; no
component CSS changes because components reference `var(--tds-*)`, never raw values.

### 6.3 Deprecating a token id (major, with alias shim)

```ts
// src/tokens/semantic.ts — keep the old id as an ALIAS to the new one for one release window
'color.brand.solid': ref('color.accent.solid'), // @deprecated -> color.accent.solid; remove in next major
```

CHANGELOG:

```md
### Deprecated
- Token `color.brand.solid` → use `color.accent.solid`. Aliased this release; **removed in v0.2.0**.
```

Only after the window closes do you delete the id, re-run `ds:build` + `figma:build`, and record it
under `### Removed`.

### 6.4 Adding a variant option (minor)

Add `soft` to a component's `variant` axis in `X.meta.ts`, add the matching `[data-variant='soft']`
rule in `X.css` (token vars only), add a story, then `npm run ds:build && npm run figma:build`. The
manifest gains the option, the plugin regenerates the cartesian product into the Component Set, and
`plugin:test` confirms coverage. Update `.ai/VARIANT_INDEX.json`.

---

## 7. Validation Rules

Compliance is checked by **real mechanisms**, not judgment:

1. **Lint** — `npm run lint` (ESLint 9 flat config) MUST pass. No unused source, correct import
   discipline (barrel-only for components, relative-only in `*.meta.ts`).
2. **Typecheck** — `npm run build` (`tsc -b`) and `npm run plugin:typecheck` MUST pass.
3. **Regeneration is clean** — after `npm run ds:build`, `git status` MUST show the expected
   generated diffs. **A stale generated file (source changed but output not rebuilt) is a
   propagation failure.** Conversely, a generated file changed with **no** source change means
   someone hand-edited an output — reject it.
4. **Figma coverage gate** — `npm run figma:build` ends in `npm run plugin:test`
   (`figma/plugin/test/harness.ts`), a headless Figma-API mock that asserts every component set,
   variant axis, token, and style is reproduced and calls `process.exit(1)` on any mismatch. This is
   the drift alarm for Storybook↔Figma sync.
5. **Manifest schema validity** — each reconciled `.ai/*.json` MUST validate against its `$schema`
   and carry updated `version`/`generatedAt` ([27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md)).
6. **CHANGELOG present** — a source/token/component/variant change MUST add a `.ai/CHANGELOG.md`
   entry; a `major` change MUST include a migration note.
7. **Design-Lock manual check** — reviewer confirms no unrequested visual change and no rename
   ([30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)).
8. **PLANNED (schema)** — DB/API changes validate against `.ai/ERD.json` / `.ai/API_SPEC.json` and,
   once CI exists, a migrations gate ([14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md),
   [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)).

---

## 8. Checklist

Copy into the task/PR description and tick every box:

- [ ] Change **classified** (kind + semver class from §6.1).
- [ ] Relevant `.ai` manifest / `docs/COMPONENTS.md` **read first** (reuse checked).
- [ ] Edited **source only** — no generated file hand-edited.
- [ ] Ran the correct **propagation** builds in order (`tokens:build` → `manifest:build` →
      `catalog:build`, or `ds:build`), then `figma:build`.
- [ ] `npm run lint` clean · `tsc -b` / `plugin:typecheck` clean.
- [ ] `npm run figma:build` green (**`plugin:test` passes** — coverage/drift OK).
- [ ] `git status` shows expected generated diffs only (no stale, no hand-edited output).
- [ ] Breaking change? → deprecation alias/shim added **and** migration note written.
- [ ] `.ai/CHANGELOG.md` entry added under the correct section.
- [ ] Affected `.ai/*` manifests reconciled (§5 Step 4) with bumped `version`/`generatedAt`.
- [ ] `TASKS.json` / `SESSION_SUMMARY.md` updated for resume.
- [ ] Routed through review ([30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)); Design Lock respected.

---

## 9. Failure Recovery

| Symptom | Diagnosis | Fix | Resume |
| --- | --- | --- | --- |
| `plugin:test` exits 1 after a component/token change | Bundle missing a variant/token the harness expects (partial propagation) | Re-run `npm run ds:build` then `npm run figma:build`; if the axis genuinely changed, update the source and the harness expectation | Re-run `figma:build` until green, then continue at §5 Step 4 |
| `git status` shows generated files changed but you edited no source | A generated output was hand-edited (Design-Lock violation) | `git checkout -- <generated file>`, make the change in the **source**, rebuild | Re-run `ds:build`/`figma:build` |
| Component visually differs from Storybook after a rebuild | A source visual change slipped in (drift) or a `--tds-*` binding is wrong | Revert unintended visual change; verify `X.css` uses only `var(--tds-*)`; re-run `ds:build` | Review per [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md) |
| Downstream code broke after a token/variant rename | Breaking change shipped without a deprecation shim | Re-add the alias/old option, restore the deprecation window, write the migration note | Rebuild + record in CHANGELOG |
| Lost context mid-change (context loss) | Propagation half-done | Read `SESSION_SUMMARY.md` + `TASKS.json`, run `git status`, run `npm run ds:build && npm run figma:build` to detect stale/incomplete outputs | Resume at first red gate ([28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md)) |
| `.ai` manifest out of sync with source | Manifest not reconciled after the change | Regenerate/reconcile the manifest from source; bump `version`/`generatedAt` | Continue at §5 Step 5 |

**Golden rule:** when in doubt, the source is truth — delete the generated output and rebuild.
`npm run ds:build && npm run figma:build` from a clean source tree is always idempotent.

---

## 10. Dependencies

**Specs**

- [00_MASTER_RULES.md](./00_MASTER_RULES.md) — constitution, Source-of-Truth Hierarchy, Design Lock.
- [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md) — the task lifecycle this change process plugs into.
- [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md) — approval/drift gates; `REVIEW_REPORT.md`.
- [32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md) — semver bump, publish, rollback (downstream of a change).
- [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md) — resume after context loss.
- [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md), [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md),
  [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md) — the sources being changed.
- [05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md), [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md) —
  the reproduction affected by every change.
- [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md), [37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md) —
  manifest schemas/hygiene.
- [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md), [33_DOCUMENTATION_GUIDE.md](./33_DOCUMENTATION_GUIDE.md),
  [20_CLEAN_CODE.md](./20_CLEAN_CODE.md), [18_FOLDER_STRUCTURE.md](./18_FOLDER_STRUCTURE.md).
- **PLANNED:** [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [15_API_GUIDE.md](./15_API_GUIDE.md),
  [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md).

**Manifests** — [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md), [.ai/TOKEN_INDEX.json](../../.ai/TOKEN_INDEX.json),
[.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json), [.ai/VARIANT_INDEX.json](../../.ai/VARIANT_INDEX.json),
[.ai/FIGMA_MAPPING.json](../../.ai/FIGMA_MAPPING.json), [.ai/PLUGIN_INDEX.json](../../.ai/PLUGIN_INDEX.json),
[.ai/DEPENDENCY_GRAPH.json](../../.ai/DEPENDENCY_GRAPH.json), [.ai/DESIGN_MANIFEST.json](../../.ai/DESIGN_MANIFEST.json),
[.ai/PROJECT_MANIFEST.json](../../.ai/PROJECT_MANIFEST.json), [.ai/TASKS.json](../../.ai/TASKS.json),
[.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md), [.ai/REVIEW_REPORT.md](../../.ai/REVIEW_REPORT.md),
and **PLANNED** [.ai/ERD.json](../../.ai/ERD.json), [.ai/API_SPEC.json](../../.ai/API_SPEC.json).

**Scripts** — `scripts/build-tokens.ts`, `scripts/build-manifest.ts`, `scripts/build-catalog.ts`,
`scripts/lib/css-bindings.ts`, `figma/plugin/test/harness.ts`. **npm** — `tokens:build`,
`manifest:build`, `catalog:build`, `ds:build`, `plugin:typecheck`, `plugin:build`, `plugin:test`,
`figma:build`, `lint`, `build`.

---

## 11. Template

### 11.1 `.ai/CHANGELOG.md` entry (Keep a Changelog)

```md
## [Unreleased]

### Added
- <Component/Token/Variant> — one-line what & why. (kind: component, semver: minor)

### Changed
- <what> changed from <before> to <after>. Rebuilt: ds:build + figma:build. (semver: patch|minor)

### Deprecated
- <token id | component | variant option> → use <replacement>. Aliased this release; **removed in vX.Y.Z**.

### Removed
- <what> removed (was deprecated in vA.B.C). Migration: <steps>. (semver: major)

### Fixed
- <token binding | a11y | logic> fixed. (semver: patch)
```

### 11.2 Change record (attach to task/PR)

```md
Change kind: token | component | meta | variant | script/plugin | doc | manifest | schema(PLANNED)
Semver class: patch | minor | major
Source files edited: <paths>
Propagation run: [ ] tokens:build [ ] manifest:build [ ] catalog:build [ ] figma:build
Gates: [ ] lint [ ] tsc/plugin:typecheck [ ] plugin:test green
Breaking? deprecation shim: <alias/none>   migration note: <link/none>
Manifests reconciled: <list>
CHANGELOG section: Added|Changed|Deprecated|Removed|Fixed|Security
Design Lock: [ ] no unrequested visual change [ ] no rename
```

### 11.3 Migration note (major changes)

```md
### Migration: <old> → <new>  (v0.1.0 → v0.2.0)
Reason: <why>
Before: <snippet/id/prop>
After:  <snippet/id/prop>
Steps:
1. Replace all `<old>` with `<new>` (codemod: `<command or search-replace>`).
2. Run `npm run ds:build && npm run figma:build`.
3. Verify `plugin:test` green.
Window: aliased in vX; removed in vY.
```

---

## 12. Future Extension

- **Automated change detection (PLANNED CI).** When `.github` CI exists
  ([25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)), a pipeline runs `ds:build` + `figma:build` on every
  PR and **fails if generated outputs differ from committed** — turning propagation-completeness
  (§7.3) and drift (§7.4) into blocking machine gates rather than reviewer diligence.
- **Semver automation.** A future `changesets`-style flow can derive the version bump from the
  classified change kind and auto-assemble `.ai/CHANGELOG.md`, feeding [32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md).
- **Codemods at scale.** As component count grows past 60, token/variant renames warrant committed
  codemod scripts under `scripts/` so a rename across all `X.css`/`X.meta.ts` is one deterministic run.
- **Schema change management (PLANNED, >10M users).** When the Supabase/Postgres backend lands
  ([14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md)),
  this process extends to **forward-only migrations**, expand/contract deploys, RLS-policy versioning,
  and API contract versioning in `.ai/API_SPEC.json` — each carrying the same classify → propagate →
  deprecate → migrate → record discipline defined here, so frontend/backend/database stay in sync at scale.
- **MCP-driven change orchestration.** An MCP agent ([35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md))
  can execute this whole lifecycle — classify, run the ordered builds, reconcile manifests, append the
  CHANGELOG — with the manifests as its shared state, keeping change management deterministic and
  token-minimal across long-running, multi-agent work.
