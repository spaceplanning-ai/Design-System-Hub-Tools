# 32 — Release Guide

> **Title:** Release Guide
> **Purpose:** Define how a version of TDS is cut, validated, versioned (semver), built, published, tagged, and — if needed — rolled back, so that every release is deterministic, reproducible, and keeps Storybook, the generated manifests, the Figma bundle, and the plugin in perfect lock-step.
> **Status:** ACTIVE (frontend, tokens, manifests, plugin, Storybook build) · CI/CD automation, npm registry publish, and backend/API/DB release trains are **PLANNED**
> **Owner:** AI OS
> **Last-reviewed:** _(placeholder — set on review)_
> **Precedence:** Subordinate to [00_MASTER_RULES.md](./00_MASTER_RULES.md). This document governs the *act of releasing*; it does not redefine change control ([31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md)), review gates ([30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)), or the CI/CD pipeline ([25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)). Where this and a domain spec disagree, the domain spec wins. The Design Lock Policy and the generated-is-sacred rule from [00_MASTER_RULES.md](./00_MASTER_RULES.md) are binding here. All CI/registry/backend content is **PLANNED**.

---

## 1. Purpose

A "release" of TDS is a **frozen, tagged, reproducible snapshot** of the design system in which four outputs agree: the React component library, the Storybook (the source of visual truth), the generated manifests (`src/generated/design-system.manifest.json`, `src/tokens/generated/*`), and the Figma bundle + plugin (`figma/tds.plugin.json`, `figma/plugin/code.js`). This guide is the single procedure for producing that snapshot.

The package is `tds` v`0.1.0`, `"private": true` in `package.json` — **it is not published to the npm registry today**. A release therefore does *not* mean `npm publish`; it means: bump the version, regenerate every derived artifact from source, prove the whole pipeline is green, record the change, and tag the commit so the exact bytes can be checked out again for years.

The release process directly serves the AI-OS mission ([00_MASTER_RULES.md](./00_MASTER_RULES.md)): **no design drift** (every release regenerates Figma from Storybook), **Storybook↔Figma perfect sync** (the plugin harness gates the release), **resume-after-context-loss** (the tag + `.ai/CHANGELOG.md` + `.ai/SESSION_SUMMARY.md` let any agent reconstruct what shipped), and **no inconsistent implementations** (a release is only valid if `lint`, `build`, `ds:build`, and `figma:build` all pass on the same commit).

---

## 2. Responsibilities

This guide owns:

- The **semver policy** for the `tds` package version and how design-system changes map to MAJOR/MINOR/PATCH.
- The **canonical build/publish sequence** — the exact order of `npm run lint`, `npm run build`, `npm run ds:build`, `npm run figma:build`, and `npm run build-storybook`, and why that order is mandatory.
- The **release artifact set** — precisely which files constitute a release and which are regenerated (never hand-edited).
- The **tagging and recording** conventions (git tag, `.ai/CHANGELOG.md`, `package.json` `version`).
- The **rollback strategy** — how to revert a bad release to the previous good tag without leaving the four outputs out of sync.
- The **release checklist** and the validation gates that block a release.

It does **not** own: what constitutes a breaking vs. non-breaking change in detail ([31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md)); the review/approval gate that must pass *before* a release is cut ([30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)); the (PLANNED) CI pipeline that automates these steps ([25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)); the test surface ([24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md)); or the plugin algorithm the harness validates ([06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md)).

---

## 3. Scope

**In-scope**

- Versioning the single `tds` package (`package.json` `version`, currently `0.1.0`).
- Regenerating and validating all derived outputs: `src/tokens/generated/{tokens.css, figma.tokens.json, token-ids.ts}`, `src/generated/design-system.manifest.json`, `figma/tds.plugin.json`, `docs/COMPONENTS.md`, `figma/plugin/code.js`.
- Building the Storybook static site (`npm run build-storybook`) and the Vite app bundle (`npm run build`) as release artifacts.
- Git tagging, `.ai/CHANGELOG.md` updates, and release recording in `.ai/PROJECT_MANIFEST.json`.
- Rollback of a released tag.

**Out-of-scope**

- `npm publish` to a public/private registry — **PLANNED** (package is `private: true` today; a registry release train is defined only when privacy is lifted).
- CI/CD automation, GitHub Actions, release bots — **PLANNED**, owned by [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md) (no `.github/` exists in the repo today).
- Backend / API / database / Supabase / Edge Function deployment and their independent version trains — **PLANNED** (no backend exists; see [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [15_API_GUIDE.md](./15_API_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md)).
- Distributing the Figma plugin through the Figma Community — **PLANNED** (today the plugin is loaded locally from `figma/plugin/`).
- Deciding *whether* a change is allowed — that is change control ([31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md)) and review ([30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)).

---

## 4. Rules

> Phrasing is enforceable: **MUST** blocks a release, **SHOULD** is strongly expected, **NEVER** is prohibited.

1. **R1 (single version) —** A release **MUST** bump exactly one version: the `version` field in `package.json`. There is one package (`tds`); there is one version number for the whole design system.
2. **R2 (semver) —** The version **MUST** follow semantic versioning as mapped in §5.1 (MAJOR = breaking/design-lock-affecting removal or rename, MINOR = additive, PATCH = fix/no-API-change). While `0.x`, MINOR **MAY** carry breaking changes but the change **MUST** still be recorded as breaking in `.ai/CHANGELOG.md`.
3. **R3 (regenerate, never edit) —** Every derived artifact in a release **MUST** be produced by running the build scripts on the release commit. You **NEVER** hand-edit `figma/tds.plugin.json`, `src/generated/*`, `src/tokens/generated/*`, `docs/COMPONENTS.md`, or `figma/plugin/code.js`. To change output, change the source (`*.meta.ts`, `src/tokens/*`, or the `scripts/`) and re-run. (Generated-is-sacred, [00_MASTER_RULES.md](./00_MASTER_RULES.md).)
4. **R4 (green gate) —** A release **MUST NOT** be tagged unless, on the exact release commit, all of these pass with exit code 0: `npm run lint`, `npm run build`, `npm run ds:build`, `npm run figma:build`. `figma:build` internally runs `plugin:typecheck`, `plugin:build`, and the headless `plugin:test` harness — a red harness (`process.exit(1)` on coverage mismatch) is a hard release blocker.
5. **R5 (no dirty tree) —** After running the full build sequence, the git working tree **MUST** be clean *except for* the intended source change, the bumped `version`, and the regenerated outputs. Unexpected diffs in generated files mean the committed output was stale — regenerate and re-commit before tagging.
6. **R6 (Design Lock) —** A release **NEVER** contains an AI-initiated visual redesign. Any change to layout/spacing/color/typography/radius/shadow/motion or any rename of a token/component/variant/variable **MUST** be an explicitly requested source change that flowed through the pipeline (Design Lock, [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md) / [00_MASTER_RULES.md](./00_MASTER_RULES.md)).
7. **R7 (record) —** Every release **MUST** add a dated, versioned entry to `.ai/CHANGELOG.md` (see §11) and update `.ai/PROJECT_MANIFEST.json` `version`/`generatedAt`. Recording is part of the release, not an afterthought.
8. **R8 (tag) —** Every release **MUST** be a single commit tagged `v<version>` (e.g. `v0.2.0`) so the exact snapshot is retrievable. The tag **SHOULD** be annotated and reference the `.ai/CHANGELOG.md` section.
9. **R9 (order) —** The build/publish steps **MUST** run in the order in §5.2. Tokens are regenerated before the manifest (the manifest reads token ids); the manifest/bundle is regenerated before the plugin is built and tested (the harness reads the bundle).
10. **R10 (reproducibility) —** Two runs of the release build on the same commit **MUST** produce byte-identical generated outputs (deterministic scripts). A non-deterministic diff is a defect to fix before release, not to commit.
11. **R11 (private) —** While `package.json` has `"private": true`, a release **NEVER** runs `npm publish`. Lifting privacy and adding a registry publish step is a **PLANNED** change owned by [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md).
12. **R12 (rollback parity) —** A rollback **MUST** restore all four outputs together by returning to a previously tagged good commit (§5.4). You **NEVER** revert only the source and leave stale generated bundles, nor only the bundle and leave stale source.

---

## 5. Workflow

All commands are the real npm scripts from `package.json`. Run from the repo root. Shell examples use POSIX; on Windows PowerShell chain with `;`/`if ($?)` instead of `&&`.

### 5.1 Decide the version (semver mapping)

Given the change already approved by review ([30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)) and classified by change control ([31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md)):

| Bump | When (TDS-specific triggers) |
| --- | --- |
| **MAJOR** (`x.0.0`) | Remove/rename a component, token id, variant axis, or axis option; drop an alias; change the Figma bundle contract shape (`{ tokens, design }`); any breaking change to `ComponentMeta` in `src/core/types.ts`. Post-`1.0.0` only for true breaks. |
| **MINOR** (`0.x.0`) | Add a component (new folder + registry entry in `src/components/metas.ts`), add a token, add a variant option, add a new page classifier — additive, no removals. |
| **PATCH** (`0.0.x`) | Bug fix in a `.tsx`/`.css`, doc/catalog regeneration, non-breaking script fix — no public API, token, or variant surface change. |

While at `0.x`, the project is pre-stable: increment MINOR for features and PATCH for fixes; record any breaking change explicitly in `.ai/CHANGELOG.md` even if the number does not force MAJOR.

### 5.2 Build & validate (the mandatory sequence)

```bash
# 0. Start clean, on an up-to-date release branch, working tree committed.
git status --porcelain            # expect empty

# 1. Static quality
npm run lint                      # eslint . — must be clean

# 2. Type-check + app build (tsc -b && vite build)
npm run build

# 3. Regenerate ALL design outputs from source
npm run ds:build                  # tokens:build -> manifest:build -> catalog:build
#   -> src/tokens/generated/{tokens.css, figma.tokens.json, token-ids.ts}
#   -> src/generated/design-system.manifest.json
#   -> figma/tds.plugin.json
#   -> docs/COMPONENTS.md

# 4. Regenerate + validate the Figma plugin against the bundle
npm run figma:build               # ds:build -> plugin:typecheck -> plugin:build -> plugin:test
#   -> figma/plugin/code.js  (gitignored build artifact)
#   -> headless harness asserts 100% coverage or process.exit(1)

# 5. Build the Storybook release site (source-of-truth snapshot)
npm run build-storybook           # storybook-static/  (deployable artifact)
```

`figma:build` re-runs `ds:build` internally, so step 4 subsumes step 3; step 3 is listed separately so a failure is localized (a `ds:build` break is a source/token/script problem; a later `plugin:*` break is a plugin problem). After this sequence the working tree must be clean except for intended source + regenerated outputs (R5).

### 5.3 Version, record, commit, tag

```bash
# 1. Bump version (no git tag from npm; we tag explicitly for control)
npm version <major|minor|patch> --no-git-tag-version    # edits package.json "version"

# 2. Re-run ds:build so any version echoed into generated metadata is current
npm run ds:build

# 3. Record the release
#    - append a dated section to .ai/CHANGELOG.md (see §11 template)
#    - update .ai/PROJECT_MANIFEST.json { version, generatedAt }

# 4. Commit everything as one release commit
git add -A
git commit -m "release: tds v<version>"

# 5. Annotated tag pointing at the release commit
git tag -a v<version> -m "TDS v<version> — see .ai/CHANGELOG.md"

# 6. Push commit + tag (PLANNED CI would take over from here)
git push && git push origin v<version>
```

### 5.4 Rollback

If a released tag is discovered to be bad (broken build, drift, regression):

```bash
# Option A — revert forward (preferred; preserves history)
git revert <bad-release-commit>          # undoes source + generated together
npm run figma:build                      # prove the reverted tree is green
# bump a PATCH, re-record in .ai/CHANGELOG.md, commit, tag v<next-patch>

# Option B — hard restore to the last good tag (when history rewrite is acceptable)
git checkout v<last-good>                # exact prior snapshot of all four outputs
# create a new release commit/tag from here; NEVER move an existing tag
```

Because all four outputs live in the same commit, checking out a good tag restores source, manifests, bundle, and (after `plugin:build`) the plugin together (R12). **NEVER** delete or re-point a published tag; roll *forward* to a new version.

### 5.5 Consuming Storybook / plugin artifacts

- **Storybook:** `storybook-static/` from `npm run build-storybook` is the deployable source-of-truth site. Hosting/deploy is **PLANNED** (owned by [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)).
- **Figma plugin:** designers load `figma/plugin/` (manifest.json + `code.js` + `ui.html`) locally; it reads the released `figma/tds.plugin.json` and rebuilds the system with zero manual config. Figma Community distribution is **PLANNED**.

---

## 6. Examples

**Example A — MINOR release: a new component was added.**

```bash
# Source change already merged: new atom folder + entry in src/components/metas.ts
npm run lint && npm run build
npm run figma:build                       # regenerates bundle, harness now covers the new set
npm run build-storybook
npm version minor --no-git-tag-version     # 0.1.0 -> 0.2.0
npm run ds:build
# edit .ai/CHANGELOG.md + .ai/PROJECT_MANIFEST.json
git add -A && git commit -m "release: tds v0.2.0"
git tag -a v0.2.0 -m "TDS v0.2.0 — add <Component>; see .ai/CHANGELOG.md"
```

**Example B — PATCH release: token value corrected.**

```bash
# Source change: fixed a value in src/tokens/semantic.ts (a SOURCE change, not generated)
npm run figma:build                        # tokens.css + figma.tokens.json + bundle regenerate
git diff --stat src/tokens/generated figma/tds.plugin.json   # expect only the intended token to move
npm version patch --no-git-tag-version      # 0.2.0 -> 0.2.1
npm run ds:build
git add -A && git commit -m "release: tds v0.2.1"
git tag -a v0.2.1 -m "TDS v0.2.1 — fix color.bg.default value; see .ai/CHANGELOG.md"
```

**Example C — blocked release (harness red).**

```bash
npm run figma:build
# ... plugin:test prints a coverage mismatch and exits 1
# -> RELEASE BLOCKED (R4). Do NOT bump/tag. Diagnose per §9, fix SOURCE, re-run.
```

---

## 7. Validation Rules

Compliance is checked by real, runnable mechanisms — not opinion:

- **Lint gate:** `npm run lint` (`eslint .`) exits 0. Blocks on any error.
- **Build gate:** `npm run build` (`tsc -b && vite build`) exits 0 — type errors block the release.
- **Design-output gate:** `npm run ds:build` exits 0 and produces the four expected files; re-running it yields **no** git diff (determinism, R10).
- **Figma gate:** `npm run figma:build` exits 0 — `plugin:typecheck` (`tsc -p figma/plugin/tsconfig.json`), `plugin:build` (esbuild → `figma/plugin/code.js`), and the headless `plugin:test` harness (`tsx figma/plugin/test/harness.ts`) all pass; the harness asserts full coverage of tokens + component sets or `process.exit(1)`.
- **Clean-tree gate:** `git status --porcelain` is empty after the build sequence except for intended source + version + regenerated outputs (R5).
- **Record gate:** `.ai/CHANGELOG.md` has a new section whose version equals `package.json` `version` equals the git tag; `.ai/PROJECT_MANIFEST.json` `version` matches.
- **Tag gate:** `git tag --list "v<version>"` returns the annotated tag pointing at the release commit.
- **Manifest schema:** `.ai` manifests still validate per [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md).
- **Automated CI enforcement of all the above:** **PLANNED** ([25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)); today these gates are run and verified manually by the releasing agent.

---

## 8. Checklist

Pre-release:

- [ ] Change is approved by review ([30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)) and classified by change control ([31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md)).
- [ ] Working tree clean and on the release branch; not the raw default branch unless policy allows.
- [ ] No hand-edits exist in `figma/*`, `src/generated/*`, `src/tokens/generated/*`, `figma/plugin/code.js` (R3).

Build & validate:

- [ ] `npm run lint` — clean.
- [ ] `npm run build` — type-check + Vite build pass.
- [ ] `npm run ds:build` — regenerates tokens, manifest, catalog; re-run shows no diff.
- [ ] `npm run figma:build` — plugin typecheck + build + **headless harness** all green.
- [ ] `npm run build-storybook` — `storybook-static/` produced.

Version & record:

- [ ] Correct semver bump chosen (§5.1) and applied via `npm version … --no-git-tag-version`.
- [ ] `.ai/CHANGELOG.md` section added (Added/Changed/Fixed/Breaking).
- [ ] `.ai/PROJECT_MANIFEST.json` `version` + `generatedAt` updated.

Commit, tag, ship:

- [ ] Single `release: tds v<version>` commit contains source + version + all regenerated outputs.
- [ ] Annotated tag `v<version>` created and pushed with the commit.
- [ ] `.ai/SESSION_SUMMARY.md` notes the release for resume ([28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md)).

---

## 9. Failure Recovery

| Symptom | Diagnosis | Fix | Resume |
| --- | --- | --- | --- |
| `npm run lint` errors | Style/type-safety violation in changed source | Fix source per [19_CODE_CONVENTION.md](./19_CODE_CONVENTION.md); do not disable rules to pass | Re-run from §5.2 step 1 |
| `npm run build` fails (`tsc -b`) | Type error, often a broken `*.meta.ts` or `ComponentMeta` shape | Correct the source types; metas stay React/CSS-free with relative imports | Re-run §5.2 step 2 |
| `ds:build` writes an unexpected diff | Committed generated output was stale, or a script/token source changed | Commit the regenerated outputs; confirm second run is diff-free (R10) | Re-run §5.2 step 3 |
| `plugin:typecheck` fails | Plugin `src/*.ts` out of sync with bundle/types | Fix plugin source ([06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md)); never edit `code.js` | Re-run `npm run figma:build` |
| `plugin:test` harness exits 1 | Coverage mismatch — bundle has sets/tokens the plugin didn't produce, or vice versa | Reconcile plugin algorithm ↔ `figma/tds.plugin.json`; fix the source that diverged | Re-run `npm run figma:build` (R4 blocker until green) |
| Non-deterministic generated diff | Script depends on iteration order/time | Make the script deterministic before releasing (R10) | Re-run §5.2 |
| Version mismatch (tag ≠ package ≠ changelog) | Skipped a record step | Align `package.json`, `.ai/CHANGELOG.md`, tag; if tag already pushed, roll forward with a new patch — never move the tag | Re-tag as new version |
| Bad release already tagged/shipped | Regression found post-release | Roll back per §5.4 (revert-forward or checkout last good tag) + new patch release | New `v<next>` tag |

A red harness is never worked around by editing the generated bundle or `code.js` — that violates R3/R6 and hides drift. Always fix the source and regenerate.

---

## 10. Dependencies

This guide relies on:

- **Scripts (`package.json`):** `lint`, `build`, `tokens:build`, `manifest:build`, `catalog:build`, `ds:build`, `plugin:typecheck`, `plugin:build`, `plugin:test`, `figma:build`, `build-storybook`.
- **Generated artifacts:** `src/tokens/generated/{tokens.css, figma.tokens.json, token-ids.ts}`, `src/generated/design-system.manifest.json`, `figma/tds.plugin.json`, `docs/COMPONENTS.md`, `figma/plugin/code.js`, `storybook-static/`.
- **Manifests:** [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md), [.ai/PROJECT_MANIFEST.json](../../.ai/PROJECT_MANIFEST.json), [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md); schemas in [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md).
- **Docs:** [00_MASTER_RULES.md](./00_MASTER_RULES.md), [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md), [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md), [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md), [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md), [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md), [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md), [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md), [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md), [33_DOCUMENTATION_GUIDE.md](./33_DOCUMENTATION_GUIDE.md), [34_PROJECT_BOOTSTRAP.md](./34_PROJECT_BOOTSTRAP.md), [19_CODE_CONVENTION.md](./19_CODE_CONVENTION.md), and the plugin contract [figma/README.md](../../figma/README.md).

---

## 11. Template

Copy-paste skeleton for a `.ai/CHANGELOG.md` release section (Keep-a-Changelog style, semver-tagged):

```markdown
## [0.2.0] — 2026-07-08

### Added
- <Component> atom (folder src/components/atoms/<Name>/, registered in src/components/metas.ts).

### Changed
- <token/variant/prop change described as a SOURCE change>.

### Fixed
- <bug fix in a .tsx/.css or a build script>.

### Breaking
- <removals/renames of component/token/variant/alias, or bundle-contract shape changes — or "None">

### Release evidence
- lint: pass · build: pass · ds:build: pass (diff-free) · figma:build: pass (harness green) · build-storybook: pass
- tag: v0.2.0 · commit: <sha>
```

Release-commit + tag skeleton:

```bash
npm run lint && npm run build && npm run figma:build && npm run build-storybook
npm version <major|minor|patch> --no-git-tag-version && npm run ds:build
#  update .ai/CHANGELOG.md + .ai/PROJECT_MANIFEST.json
git add -A && git commit -m "release: tds v<version>"
git tag -a v<version> -m "TDS v<version> — see .ai/CHANGELOG.md"
git push && git push origin v<version>
```

---

## 12. Future Extension

Designed to scale for years and toward the >10,000,000-user target ([00_MASTER_RULES.md](./00_MASTER_RULES.md), [21_ARCHITECTURE_GUIDE.md](./21_ARCHITECTURE_GUIDE.md)):

- **CI-automated releases (PLANNED):** a `.github/` workflow runs the §5.2 gate on every PR and, on a `v*` tag, executes the release build and publishes artifacts — turning the manual gates in §7 into required status checks ([25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)).
- **Registry publish (PLANNED):** when `"private": true` is lifted, add a `prepublishOnly` hook that runs `figma:build`, and a `publish` step gated on the harness; consumers install `tds` from the registry.
- **Storybook & plugin distribution (PLANNED):** auto-deploy `storybook-static/` to hosting and publish the plugin to the Figma Community on each release tag.
- **Independent backend release train (PLANNED):** the Supabase + Node/TS API layer ([14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [15_API_GUIDE.md](./15_API_GUIDE.md), [16_NODE_GUIDE.md](./16_NODE_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md)) versions and deploys on its own cadence (schema migrations, Edge Functions) while never crossing into the design pipeline; this guide gains a parallel "backend release" sequence when that layer exists.
- **Release provenance & signing (PLANNED):** SBOM, signed tags, and reproducible-build attestations so any historical release can be audited and re-verified byte-for-byte.
- **Channels (PLANNED):** `next`/`beta`/`latest` dist-tags and canary Storybook deploys, letting large consumer surfaces adopt changes progressively without breaking the single-source-of-truth guarantee.
