# 33 — Documentation Guide

- **Title:** Documentation Guide
- **Purpose:** Define the single, enforceable documentation standard for the TDS repository — governing the 41-file `docs/ai-os/` spec set, the auto-generated `docs/COMPONENTS.md` catalog, Storybook autodocs/MDX, the top-level `README.md` / `figma/README.md` / `CLAUDE.md`, and the `.ai/` narrative manifests — and specify exactly how every one of them stays in sync with source so an AI agent can trust the docs instead of re-reading code.
- **Status:** ACTIVE
- **Owner:** AI OS
- **Last-reviewed:** _(placeholder — update on each review)_
- **Precedence:** Subordinate to [00_MASTER_RULES.md](./00_MASTER_RULES.md); the constitution, the Design Lock Policy, and the generated-is-sacred rule win on any conflict. This document governs *how documentation is authored, structured, generated, and kept fresh*. It defers Storybook rules to [04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md), the manifest schemas to [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md), review cadence mechanics to [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md), and change/versioning discipline to [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md).

---

## 1. Purpose

Documentation in `tds` is not decoration; it is the **primary read surface for AI agents**. An
agent that trusts the docs spends a fraction of the tokens it would spend re-reading 60 component
source trees, three token files, and a Figma bundle. That trust only holds if documentation is
**accurate, structurally uniform, and provably in sync with source**. This guide makes that
guarantee enforceable.

Concretely, this document exists so that:

- Every numbered spec in `docs/ai-os/` has the **same 12-section shape** (CANON part H), so an
  agent can jump straight to "§4 Rules" or "§7 Validation Rules" in any file without re-scanning.
- The component catalog [docs/COMPONENTS.md](../COMPONENTS.md) is **never hand-edited** — it is a
  generated output of `npm run catalog:build`, and reading it (not component `.tsx`) is the
  reuse-first default per [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md).
- Storybook **autodocs** (`tags: ['autodocs']`) and the MDX pages in `src/stories/` derive their
  prose from the same `*.meta.ts` that drives the component and the Figma manifest, so a single
  edit updates code, docs, and Figma together.
- The `.ai/` narrative files — `SESSION_SUMMARY.md`, `CHANGELOG.md`, `REVIEW_REPORT.md` — follow a
  fixed shape so [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md) rehydration and
  [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md) gates can parse them deterministically.

The golden rule: **documentation that describes generated output must itself be generated, and
documentation that describes source must be reviewed whenever that source changes.** Stale docs are
treated as a defect, not a cosmetic lapse.

## 2. Responsibilities

This spec is responsible for defining:

- **The doc taxonomy** — which documentation surfaces exist (`docs/ai-os/`, `docs/COMPONENTS.md`,
  Storybook autodocs + MDX, `README.md`, `figma/README.md`, `CLAUDE.md`, `.claude/agents/*.md`,
  `.ai/*`), what each is authoritative for, and which are generated vs hand-authored.
- **The numbered-doc contract** — the mandatory front-matter block plus the exact 12 sections in
  order (CANON part H), and the cross-reference / code-fence / MUST-SHOULD-NEVER style rules.
- **Catalog generation** — that `docs/COMPONENTS.md` is produced by `scripts/build-catalog.ts` and
  must be regenerated (not edited) after any `*.meta.ts` change.
- **Storybook documentation** — how autodocs prose is sourced from meta via
  `src/core/storybook.ts` (`metaParameters`, `argTypesFromMeta`, `argsFromMeta`, `docDescription`),
  and how the hand-authored MDX/CSF pages in `src/stories/` are kept truthful.
- **The `.ai/` narrative shape** — the required headings for `SESSION_SUMMARY.md`,
  `CHANGELOG.md`, and `REVIEW_REPORT.md`.
- **Sync policy** — the propagation matrix mapping each source change to the docs it obligates you
  to regenerate or review, and the validation that catches drift.
- **Review cadence** — how often each doc surface is reviewed and by whom (which agent role).

It is **not** responsible for: the manifest JSON schemas themselves (owned by
[27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md)), what Storybook stories must *contain*
as design truth (owned by [04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md)), code
style inside doc code-fences (owned by [19_CODE_CONVENTION.md](./19_CODE_CONVENTION.md)), or the
semantics of a review gate blocking a merge (owned by [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)).

## 3. Scope

**In-scope**

- All 41 numbered files in `docs/ai-os/` (`00_MASTER_RULES.md` … `40_FINAL_OPERATING_MANUAL.md`).
- The generated catalog `docs/COMPONENTS.md`.
- Storybook documentation: `tags: ['autodocs']` autodocs pages, the MDX/CSF doc pages under
  `src/stories/` (Foundations, TypeSystem, FigmaMapping, and the Examples: Board, Dashboard, List,
  BottomSheet), and the meta-derived prose helpers in `src/core/storybook.ts`.
- Top-level hand-authored docs: [README.md](../../README.md), [figma/README.md](../../figma/README.md)
  (the plugin **contract**), [CLAUDE.md](../../CLAUDE.md), and the subagent briefs in
  [.claude/agents/](../../.claude/agents/) (`figma-plugin.md`, `tds-component.md`).
- The narrative `.ai/` manifests: `SESSION_SUMMARY.md`, `CHANGELOG.md`, `REVIEW_REPORT.md`.
- The `## N. Name` heading conventions, front-matter, cross-linking, and code-fence rules used
  across all of the above.

**Out-of-scope**

- JSON manifest schemas and update/read rules — see [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md).
- Design/visual truth in Storybook — see [04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md)
  and the immutable Design Lock in [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md).
- Backend/API/database documentation content standards (**PLANNED** — no backend exists today);
  when those docs ([14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [15_API_GUIDE.md](./15_API_GUIDE.md),
  [16_NODE_GUIDE.md](./16_NODE_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md)) describe a
  future service, they still obey **this** guide's structure, but their content is marked PLANNED.
- CI-driven doc publishing (**PLANNED** — no `.github` workflows exist yet; see
  [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)).

## 4. Rules

> Phrasing: **MUST** = mandatory, **SHOULD** = strong default, **NEVER** = prohibited.

**Structure & front-matter**

1. Every `docs/ai-os/NN_*.md` file **MUST** open with the front-matter block — `Title`, one-line
   `Purpose`, `Status` (ACTIVE or PLANNED), `Owner` (AI OS), `Last-reviewed` placeholder, and a
   `Precedence` note — followed by a `---` rule, then **exactly** the 12 sections
   `## 1. Purpose` … `## 12. Future Extension`, in order, with no sections added, removed, renamed,
   or reordered.
2. Section headings **MUST** use the literal form `## N. Name` (e.g. `## 7. Validation Rules`). A
   missing or misspelled heading is a structural defect caught by the doc-lint in §7.
3. A doc's `Status` **MUST** be `PLANNED` (and its content prefixed with a bold
   `STATUS: PLANNED — …` line) if it describes anything that does not exist in the repo today:
   backend, database, Supabase, REST/GraphQL/RPC API, auth, CI, or a unit/e2e test framework.
   NEVER present PLANNED capability as if it exists.

**Accuracy & the naming lock**

4. Documentation **MUST** use the exact names from the CANON naming registry (CANON part C):
   token CSS prefix `--tds-*`, dot-notation token ids, slash-notation Figma var names, collections
   `Primitives` / `Semantic` / `Theme`, theme modes `light` / `dark`, axes `type` (A/B/C),
   `variant` (labelled "Style"), `tone`, `size`, `shape`, `state`, the barrel `@/components`, and
   aliases `@/` `@core/` `@components/` `@tokens/`. NEVER rename, abbreviate, or invent an alias.
5. A doc **MUST NEVER** state a repo fact it cannot ground in a real file, npm script, or the
   CANON. When unsure, link the source file rather than paraphrasing from memory.
6. Every rule in a numbered doc **SHOULD** be enforceable and tied to a real mechanism (`npm run
   lint`, `tsc -b`, `npm run ds:build`, `npm run figma:build`, `npm run plugin:test`, a schema, or
   a named manual check). A rule with no enforcement mechanism SHOULD be reworded as guidance.

**Generated docs are sacred**

7. `docs/COMPONENTS.md` is a **generated output** of `npm run catalog:build`
   (`scripts/build-catalog.ts`). You **MUST NEVER** hand-edit it; to change it, change the
   `*.meta.ts` source and re-run the build. This is the generated-is-sacred rule of
   [00_MASTER_RULES.md](./00_MASTER_RULES.md) applied to docs.
8. Storybook **autodocs** prose is derived from `*.meta.ts` via `docDescription`/`metaParameters`
   in `src/core/storybook.ts`. You **MUST NEVER** hardcode a component's description in a story
   when it can come from meta; edit the meta's `description`/`summary` instead.

**Cross-referencing & style**

9. Cross-references between numbered docs **MUST** be markdown links using the **exact filename**
   relative to `docs/ai-os/`, e.g. `[00_MASTER_RULES.md](./00_MASTER_RULES.md)`; manifests are
   linked as `[.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json)`. NEVER link by bare
   number ("see doc 27") without the filename link.
10. Code, JSON, and shell examples **MUST** use fenced blocks with a language tag (```ts```,
    ```json```, ```bash```, ```css```). Examples **MUST** be repo-specific (real component names,
    real token ids, real scripts), never generic `Foo`/`Bar` filler.
11. A numbered doc **SHOULD** run 150–450 lines; the big specs (04, 05, 06, 27, 34, 40) may run
    longer. Prefer depth over padded breadth; NEVER restate the entire CANON.

**Sync obligation**

12. Any change to source that a doc describes **MUST** trigger the propagation action in the §5
    matrix (regenerate, or review-and-bump `Last-reviewed`). A PR/commit that edits a `*.meta.ts`
    without a regenerated `docs/COMPONENTS.md` is a drift defect (§7, §9).
13. The narrative `.ai/` files **MUST** follow the fixed headings in §11: `SESSION_SUMMARY.md`
    (rehydration state), `CHANGELOG.md` (chronological, newest-first), `REVIEW_REPORT.md` (latest
    gate outcome). These are the AI cache/state layer and are regenerated/reconciled from source,
    never authoritative over it (CANON part E).

## 5. Workflow

**A. Authoring or editing a numbered `docs/ai-os/NN_*.md`**

1. Copy the skeleton from §11 (front-matter + 12 sections).
2. Fill `Purpose` (one line), set `Status`, write the `Precedence` note that defers to
   [00_MASTER_RULES.md](./00_MASTER_RULES.md) and to the specific sibling docs your topic borders.
3. Write each of the 12 sections; keep rules in §4 MUST/SHOULD/NEVER form and tie each to a real
   mechanism (§4 rule 6).
4. Cross-link siblings by exact filename (§4 rule 9); embed only repo-specific fenced examples.
5. Run the doc-lint (§7) locally; fix any structural or naming failures.
6. Update the doc's `Last-reviewed` placeholder date and record the edit in `.ai/CHANGELOG.md`.

**B. Regenerating the component catalog after a meta change**

```bash
# after editing any src/components/**/X.meta.ts (or adding a component):
npm run catalog:build        # scripts/build-catalog.ts -> docs/COMPONENTS.md
# or, as part of the full source build (tokens + manifest + catalog):
npm run ds:build
```

Never open `docs/COMPONENTS.md` to hand-fix a variant list — the fix belongs in the meta, then the
regen makes the catalog match.

**C. Keeping Storybook docs truthful**

1. Component prose comes from `*.meta.ts`; the story wires it with the helpers from
   `src/core/storybook.ts`:

   ```ts
   // src/components/atoms/Button/Button.stories.tsx (CSF3)
   import type { Meta, StoryObj } from '@storybook/react';
   import { Button } from '@/components';
   import { buttonMeta } from './Button.meta';
   import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';

   const meta: Meta<typeof Button> = {
     title: 'Atoms/Button',
     component: Button,
     tags: ['autodocs'],
     parameters: metaParameters(buttonMeta), // pulls docDescription(meta) into autodocs
     argTypes: argTypesFromMeta(buttonMeta),
     args: { ...argsFromMeta(buttonMeta), children: 'Button' },
   };
   export default meta;
   ```

2. Hand-authored MDX/CSF pages under `src/stories/` (Foundations, TypeSystem, FigmaMapping,
   Examples) explain the *system*, not a single component. When a token, axis, or Figma-mapping
   rule changes, review these pages the same commit — they are not auto-generated.
3. Verify visually with `npm run storybook`; autodocs render under each component's "Docs" tab.

**D. Updating the hand-authored top-level docs**

- [README.md](../../README.md) (conventions, adding a component), [CLAUDE.md](../../CLAUDE.md)
  (agent working guide), and [figma/README.md](../../figma/README.md) (the plugin **contract** and
  bundle shape) are hand-authored. Review them whenever the mechanism they describe changes:
  a new npm script, a changed alias, a new bundle field, or a new convention.

**E. Writing the `.ai/` narrative files** — see §11 for the required headings; regenerate/reconcile
per [37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md) and [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md).

## 6. Examples

**Example 1 — a compliant front-matter block** (matches every sibling in `docs/ai-os/`):

```markdown
# 09 — Variant Specification

- **Title:** Variant Specification
- **Purpose:** Define the variant axes (type A/B/C, variant "Style", tone, size, shape) …
- **Status:** ACTIVE
- **Owner:** AI OS
- **Last-reviewed:** _(placeholder — update on each review)_
- **Precedence:** Subordinate to [00_MASTER_RULES.md](./00_MASTER_RULES.md); …

---

## 1. Purpose
…
## 12. Future Extension
```

**Example 2 — the catalog is generated, not edited.** The header of
[docs/COMPONENTS.md](../COMPONENTS.md) states its own contract:

```markdown
# TDS Component Catalog

> **Auto-generated** by `npm run catalog:build` — do not edit by hand.
> 60 components. Import any of them from the single barrel:
```

To add the `xl` size to Button's row, you edit `Button.meta.ts` (`size` axis) and run
`npm run catalog:build`; you do **not** type `xl` into the table.

**Example 3 — a sync obligation in practice.** You add a `variant=link` option to `Badge.meta.ts`:

| Because you changed… | You MUST also… |
| --- | --- |
| `Badge.meta.ts` variant axis | run `npm run ds:build` → regenerates `docs/COMPONENTS.md`, `src/generated/design-system.manifest.json`, `figma/tds.plugin.json` |
| Badge's Storybook page | nothing by hand — `argTypesFromMeta(badgeMeta)` picks the new option up automatically |
| the review record | append a line to `.ai/CHANGELOG.md` and refresh `.ai/COMPONENT_INDEX.json` |

**Example 4 — a PLANNED banner** (top of a backend doc):

```markdown
**STATUS: PLANNED — no backend exists in the repo today.** This document defines the future
Supabase standard; nothing here is implemented. Runtime deps today are only `react` + `react-dom`.
```

## 7. Validation Rules

Documentation compliance is checked by a mix of automated and manual gates:

1. **Structural doc-lint (numbered docs).** A check MUST verify each `docs/ai-os/NN_*.md` contains
   the front-matter keys (`Title`, `Purpose`, `Status`, `Owner`, `Last-reviewed`, `Precedence`) and
   the 12 headings `## 1. Purpose` … `## 12. Future Extension` in order. Until a dedicated script
   exists (**PLANNED** — a `scripts/build-catalog.ts`-style `scripts/lint-docs.ts`), this runs as
   the manual grep/checklist below and as a [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md) gate.

   ```bash
   # quick structural probe for one doc
   grep -nE '^## ([1-9]|1[0-2])\. ' docs/ai-os/33_DOCUMENTATION_GUIDE.md
   grep -nE '^- \*\*(Title|Purpose|Status|Owner|Last-reviewed|Precedence):' docs/ai-os/33_DOCUMENTATION_GUIDE.md
   ```

2. **Catalog freshness.** After a `*.meta.ts` change, `docs/COMPONENTS.md` MUST match a fresh
   generation. Verify with:

   ```bash
   npm run catalog:build && git diff --exit-code docs/COMPONENTS.md
   # non-empty diff => the catalog was stale (or was hand-edited). Commit the regen.
   ```

3. **Manifest/doc coherence.** `npm run ds:build` regenerates catalog + manifests together; a
   clean `git diff` on `docs/COMPONENTS.md`, `src/generated/design-system.manifest.json`, and
   `figma/tds.plugin.json` after a build proves docs and generated outputs agree.

4. **Storybook builds.** Autodocs prose is valid only if stories compile: `npm run storybook`
   (dev) or the production `storybook build` MUST succeed with no missing-arg or broken-`argTypes`
   warnings for changed components.

5. **Figma sync gate.** `npm run figma:build` (`ds:build` → `plugin:typecheck` → `plugin:build` →
   `plugin:test`) MUST pass; the headless harness (`figma/plugin/test/harness.ts`) exits non-zero
   on any coverage mismatch, which also flags a documentation-of-the-contract drift in
   [figma/README.md](../../figma/README.md).

6. **Link integrity.** Cross-reference links MUST resolve; a broken relative link to a sibling doc
   or a `.ai/*` manifest is a defect (manual check / **PLANNED** link-checker in
   [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)).

7. **No hand-edit of generated docs.** `docs/COMPONENTS.md` MUST NOT appear in a diff without a
   corresponding `*.meta.ts` / build change (a bare edit means someone bypassed the generator).

## 8. Checklist

Pre-commit documentation checklist (per change):

- [ ] If a numbered doc was added/edited, it has the front-matter block + exactly 12 ordered
      sections (`## 1` … `## 12`).
- [ ] `Status` is correct; anything backend/DB/API/CI/test-framework is marked **PLANNED** with a
      bold status banner.
- [ ] All names match the CANON registry (`--tds-*`, `type`/`variant`/`tone`/`size`/`shape`,
      `Primitives`/`Semantic`/`Theme`, `@/components`, aliases) — nothing renamed.
- [ ] Every cross-reference is an exact-filename markdown link; every code example is fenced with a
      language tag and uses real repo names.
- [ ] If any `*.meta.ts` changed, `npm run catalog:build` (or `ds:build`) was run and the resulting
      `docs/COMPONENTS.md` is committed — and was **not** hand-edited.
- [ ] If tokens/manifest/bundle changed, `npm run ds:build` (or `figma:build`) ran clean and the
      generated outputs are committed.
- [ ] Storybook still builds; autodocs for changed components render with correct `argTypes`.
- [ ] `figma/README.md`, `README.md`, `CLAUDE.md` reviewed if the mechanism they document changed.
- [ ] `.ai/CHANGELOG.md` updated; `Last-reviewed` bumped on any doc you materially revised.
- [ ] The [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md) doc gate is satisfied for the change class.

## 9. Failure Recovery

| Symptom | Diagnosis | Fix | Resume |
| --- | --- | --- | --- |
| `git diff` shows `docs/COMPONENTS.md` changed but no `*.meta.ts` changed | Catalog was hand-edited (violates §4 rule 7) | `git checkout -- docs/COMPONENTS.md`; make the real change in the meta | Re-run `npm run catalog:build`; commit the regen |
| Catalog row disagrees with the component's actual variants | Meta changed but `catalog:build` not run | `npm run catalog:build` | Verify with `git diff docs/COMPONENTS.md`; commit |
| A numbered doc is missing a section or has them out of order | Structural drift from the 12-section contract | Reinsert/reorder against the §11 skeleton | Re-run the §7 structural grep until clean |
| Autodocs show a stale/blank description | `description`/`summary` missing in `*.meta.ts` or story not using `metaParameters` | Fill the meta field; wire `parameters: metaParameters(meta)` | Rebuild Storybook; confirm the Docs tab |
| Doc references a token/axis/collection name that no longer exists | Naming drift after a source rename (which itself needs approval) | Update the doc to the current CANON name; if the *source* was renamed without approval, revert per Design Lock | Re-run doc-lint; log in `.ai/CHANGELOG.md` |
| `npm run figma:build` fails after a doc-only change | The doc claimed a contract that the bundle/plugin doesn't implement | Reconcile the doc to [figma/README.md](../../figma/README.md) + the real bundle; never hand-edit `figma/tds.plugin.json` | Re-run `npm run figma:build` to green |
| Broken cross-reference link | Filename typo or a doc was renamed | Fix the exact-filename link | Manual link sweep of the edited doc |

If context is lost mid-documentation-task, rehydrate from `.ai/SESSION_SUMMARY.md` and
`.ai/TASKS.json` per [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md), then re-run the §7
gates to confirm current state before continuing.

## 10. Dependencies

**Docs this guide relies on / borders:**

- [00_MASTER_RULES.md](./00_MASTER_RULES.md) — constitution, precedence, generated-is-sacred, Design Lock.
- [04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md) — autodocs/MDX design-truth rules.
- [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md) — the 5-file component anatomy the catalog indexes.
- [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md) / [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md) — the names docs must cite exactly.
- [18_FOLDER_STRUCTURE.md](./18_FOLDER_STRUCTURE.md) — where `docs/ai-os/`, `docs/COMPONENTS.md`, and `.ai/` live.
- [19_CODE_CONVENTION.md](./19_CODE_CONVENTION.md) — style of code inside doc fences.
- [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md) — catalog-first / manifest-first reading strategy docs enable.
- [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md) — schemas for the JSON `.ai/` manifests (this doc owns only the narrative ones).
- [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md) — `SESSION_SUMMARY.md` rehydration shape.
- [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md) — the gate that enforces doc freshness; `REVIEW_REPORT.md`.
- [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md) — `CHANGELOG.md` discipline and version bumps.
- [37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md) — the `.ai/` memory read/write cycle.
- [40_FINAL_OPERATING_MANUAL.md](./40_FINAL_OPERATING_MANUAL.md) — the master index/reading order this doc set participates in.

**Scripts / files:**

- `scripts/build-catalog.ts` → [docs/COMPONENTS.md](../COMPONENTS.md) (via `npm run catalog:build`).
- `scripts/build-tokens.ts`, `scripts/build-manifest.ts` → the generated outputs docs describe.
- `src/core/storybook.ts` — `metaParameters` / `argTypesFromMeta` / `argsFromMeta` / `docDescription`.
- Hand-authored: [README.md](../../README.md), [figma/README.md](../../figma/README.md),
  [CLAUDE.md](../../CLAUDE.md), [.claude/agents/](../../.claude/agents/).
- Manifests: [.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json),
  [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md), [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md),
  [.ai/REVIEW_REPORT.md](../../.ai/REVIEW_REPORT.md).

## 11. Template

**A. Numbered-doc skeleton** (copy for any new `docs/ai-os/NN_*.md`):

```markdown
# NN — <Title>

- **Title:** <Title>
- **Purpose:** <one line>
- **Status:** ACTIVE | PLANNED
- **Owner:** AI OS
- **Last-reviewed:** _(placeholder — update on each review)_
- **Precedence:** Subordinate to [00_MASTER_RULES.md](./00_MASTER_RULES.md); <what it defers to>.

---

## 1. Purpose
## 2. Responsibilities
## 3. Scope
## 4. Rules
## 5. Workflow
## 6. Examples
## 7. Validation Rules
## 8. Checklist
## 9. Failure Recovery
## 10. Dependencies
## 11. Template
## 12. Future Extension
```

**B. `.ai/SESSION_SUMMARY.md` skeleton** (rehydration state; see [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md)):

```markdown
# Session Summary
- **Updated:** <ISO datetime>
- **Active task:** <id from .ai/TASKS.json> — <one line>
- **State:** <in-progress | blocked | review | done>
## What changed this session
- <bullet per source/doc touched>
## Next steps
- [ ] <resumable action>
## Open questions / escalations
- <blockers>
```

**C. `.ai/CHANGELOG.md` entry** (newest-first; see [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md)):

```markdown
## <ISO date> — <short title>
- **Source:** <meta/token/script/doc changed>
- **Generated:** <catalog | manifest | bundle re-run? which npm script>
- **Docs touched:** <files>
- **Reviewed-by:** <agent role, e.g. @tds-component / @figma-plugin>
```

**D. `.ai/REVIEW_REPORT.md` skeleton** (latest gate outcome; see [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)):

```markdown
# Review Report
- **Date:** <ISO> · **Change class:** <component | token | doc | plugin>
- **Result:** PASS | BLOCK
## Gates
- [ ] lint / typecheck  - [ ] ds:build clean  - [ ] figma:build (plugin:test) green
- [ ] catalog fresh (git diff empty)  - [ ] doc structure + naming  - [ ] design-lock respected
## Findings
- <blocking issues, each linked to a file>
```

## 12. Future Extension

This documentation system is built to serve AI agents for years and to scale with the repo toward
the >10,000,000-user enterprise target described across the AI OS:

- **PLANNED — `scripts/lint-docs.ts`.** Promote §7's manual structural probe into a real script
  (mirroring `scripts/build-catalog.ts`) wired as `npm run docs:lint`, asserting front-matter keys,
  the 12-section order, CANON name usage, and link integrity; add it to `figma:build`/CI gates.
- **PLANNED — CI doc gates.** Once `.github` workflows exist (see [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)),
  run `catalog:build` + `git diff --exit-code` and the doc-lint on every PR so stale/hand-edited
  docs block merge automatically.
- **PLANNED — backend doc surfaces.** When the Supabase backend, API layer, and `ERD.json` /
  `API_SPEC.json` become real ([14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md)–[17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md)),
  flip those docs from PLANNED to ACTIVE and add generated API/schema reference pages that follow
  this same 12-section + generated-is-sacred discipline.
- **MCP-served docs.** Expose the catalog, manifests, and this spec set through the MCP surface in
  [35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md) so agents fetch a section by name instead of
  reading whole files — the ultimate token-optimization payoff of a uniformly structured doc set.
- **Versioned doc set.** Tie `Last-reviewed` and `.ai/CHANGELOG.md` to release tags
  ([32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md)) so every published version of `tds` ships a
  provably-in-sync snapshot of its documentation.

As the component count grows past 60, the invariants hold unchanged: the catalog stays generated,
autodocs stay meta-derived, the numbered docs stay 12-section uniform, and every source change
carries its documentation obligation with it.
