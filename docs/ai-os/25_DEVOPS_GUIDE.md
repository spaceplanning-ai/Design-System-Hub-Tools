# 25 — DevOps Guide

> **Title:** DevOps Guide
> **Purpose:** Define the build/verify/release pipeline for TDS — the ordered quality gates (`lint` → `format:check` → typecheck → `ds:build` drift check → `figma:build` / `plugin:test` → `build` → `build-storybook`), the environments, the release automation, and the Infrastructure-as-Code posture — separating **what runs locally today** from the **PLANNED** CI/CD and backend infrastructure.
> **Status:** PARTIALLY ACTIVE — every gate script exists and runs locally today; there is **no `.github/` and no CI runner in the repo**, so automated CI/CD, deploy targets, and IaC are **PLANNED**. Every PLANNED subsection below opens with a bold marker.
> **Owner:** AI OS
> **Last-reviewed:** _(set on review)_
> **Precedence:** Governed by [00_MASTER_RULES.md](./00_MASTER_RULES.md). This document defines *how* the gates run; it never overrides *what* they enforce — the Design Lock ([03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md)), the generated-is-sacred rule, and the plugin harness contract ([06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md)) are authoritative. Where a CI workflow and a real npm script disagree, the npm script in `package.json` wins and the workflow must be corrected.

---

## 1. Purpose

TDS is a **metadata-driven design system** (package `tds`, v0.1.0, `private: true`, ESM, Node >= 20) whose one source of truth feeds four outputs: the React components, Storybook, the generated manifests, and the Figma plugin bundle. DevOps for TDS exists to make that pipeline **deterministic, reproducible, and drift-free** — so that any agent or human who runs the build gets byte-identical generated outputs, and so that no design drift, no hand-edited generated file, and no broken plugin bundle can reach `main`.

This guide is the operational contract for:

- The **gate order** every change must pass before it is considered mergeable.
- The **drift check** that enforces "generated outputs are a pure function of source."
- The **headless plugin harness** (`figma/plugin/test/harness.ts`) as the terminal correctness gate.
- The **environments** the system targets (local, CI PLANNED, Storybook preview PLANNED, Figma distribution, backend PLANNED).
- The **release** and **IaC** posture, honestly framed as current-vs-planned.

The guiding invariant: **CI runs the exact npm scripts developers run locally — nothing more, nothing bespoke.** A green pipeline means "the same commands you can run on your machine passed."

## 2. Responsibilities

| Concern | Owner mechanism (real, in-repo) | Status |
| --- | --- | --- |
| Lint | `npm run lint` = `eslint .` (flat config `eslint.config.js`) | ACTIVE |
| Format | `npm run format:check` = `prettier --check "src/**/*.{ts,tsx,css}" "scripts/**/*.ts"` | ACTIVE |
| App typecheck + build | `npm run build` = `tsc -b && vite build` | ACTIVE |
| Token/manifest/catalog generation | `npm run ds:build` = `tokens:build && manifest:build && catalog:build` | ACTIVE |
| Plugin typecheck | `npm run plugin:typecheck` = `tsc -p figma/plugin/tsconfig.json` | ACTIVE |
| Plugin bundle | `npm run plugin:build` = esbuild `figma/plugin/src/code.ts` → `figma/plugin/code.js` | ACTIVE |
| Plugin verification (headless) | `npm run plugin:test` = `tsx figma/plugin/test/harness.ts` (`process.exit(1)` on mismatch) | ACTIVE |
| Full Figma gate | `npm run figma:build` = `ds:build && plugin:typecheck && plugin:build && plugin:test` | ACTIVE |
| Storybook static build | `npm run build-storybook` | ACTIVE |
| **CI orchestration** (run all gates on push/PR) | GitHub Actions workflow under `.github/workflows/` | **PLANNED — no `.github/` exists** |
| **Storybook preview deploy** | static host / Chromatic step | **PLANNED** |
| **Figma plugin publishing** | manual publish via Figma; automation later | Manual today / automation PLANNED |
| **Backend deploy, migrations, env provisioning** | Supabase CLI + IaC | **PLANNED** (see [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md)–[17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md)) |
| Release / versioning | semver on `package.json` | Defined in [32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md) |

This guide **owns** the pipeline gate order, the drift gate, and the environment matrix. It **does not own** what each gate asserts internally (owned by the respective spec) nor release mechanics (owned by [32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md)).

## 3. Scope

**In-scope**

- The ordered CI/local gate pipeline and the exact npm scripts it runs.
- The **generated-output drift check** (`ds:build` + `git diff --exit-code`) that protects `figma/`, `src/generated/`, `src/tokens/generated/`, and `docs/COMPONENTS.md`.
- The plugin gate (`figma:build` → `plugin:test`) as the merge blocker for Figma fidelity.
- Environment definitions: local dev, PLANNED CI, PLANNED Storybook preview, Figma plugin distribution, PLANNED backend environments.
- The PLANNED GitHub Actions workflow shape, caching strategy, release automation, and IaC posture.

**Out-of-scope**

- **What the gates assert internally** — token model ([08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md)), component anatomy ([07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md)), plugin algorithm ([06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md)), test strategy/pyramid ([24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md)).
- **Release mechanics** (semver bump, changelog cut, rollback) — owned by [32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md) and [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md).
- **Security controls** (secrets scanning, supply chain, RLS) — owned by [22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md).
- **All backend/DB/API/Supabase deployment detail** — PLANNED; owned by [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md)–[17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md). This guide only reserves the pipeline slots for them.

## 4. Rules

**Pipeline order & parity**

1. CI **MUST** run only the npm scripts defined in `package.json` — never inline bespoke commands that diverge from what a developer runs locally. Parity is the contract.
2. The canonical gate order for any change **MUST** be: install → `lint` → `format:check` → typecheck (`tsc -b` / `plugin:typecheck`) → `ds:build` + **drift check** → `figma:build` (`plugin:test`) → `build` → `build-storybook`. Cheapest, most-likely-to-fail gates run first (fail fast).
3. CI installs **MUST** use `npm ci` (clean, lockfile-exact from `package-lock.json`), never `npm install`, so builds are reproducible.
4. Every gate is **blocking**: a non-zero exit on any step **MUST** fail the pipeline and block merge to `main`. The harness enforces this itself via `process.exit(1)`.

**Generated-is-sacred / drift**

5. CI **MUST** run `npm run ds:build` and then assert **no working-tree diff** on generated paths (`git diff --exit-code -- figma/ src/generated/ src/tokens/generated/ docs/COMPONENTS.md`). A diff means either a generated file was hand-edited or a source change was committed without rebuilding — **both fail the build**.
6. No one (human or AI) **MAY** hand-edit generated outputs: `figma/tds.plugin.json`, `src/generated/design-system.manifest.json`, `src/tokens/generated/*`, `docs/COMPONENTS.md`, `figma/plugin/code.js`. To change output, change the **source** (`*.meta.ts`, `src/tokens/*`, or the `scripts/*`) and re-run the relevant build. (Enforced by rule 5.)
7. `figma/plugin/code.js` is a **build artifact** and is **gitignored** (see `.gitignore`); CI regenerates it via `plugin:build` and **MUST NOT** commit it.

**Design Lock in the pipeline**

8. The pipeline **MUST NEVER** auto-apply cosmetic reformatting to generated files or "fix" design output. `prettier --write` (`npm run format`) is a developer convenience; **CI runs `format:check` only** (read-only) and fails rather than rewrites.
9. A visual change is a SOURCE change that flows through `ds:build`/`figma:build`; the pipeline reproduces, it never redesigns (see [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md), [05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md)).

**Environment & runtime**

10. All jobs **MUST** pin Node to the engines constraint (`node >= 20`); CI **SHOULD** use an explicit LTS (e.g. Node 20 or 22) via a version file/matrix, never "latest floating."
11. The Figma plugin **MUST** keep `networkAccess.allowedDomains: ["none"]` (`figma/plugin/manifest.json`); no pipeline step may introduce network calls into the plugin runtime.
12. **PLANNED** backend/CI secrets **MUST NEVER** be committed; they live only in the CI provider's secret store and (later) Supabase env config. No `.env` exists in the repo today and none may be committed (see [22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md)).

**PLANNED gates (reserve now, wire later)**

13. When a unit/interaction/e2e test framework is added (PLANNED: Vitest / Playwright — none exists today, no `test` script), its runner **MUST** slot into the pipeline **after** `plugin:test` and **before** `build`, and **MUST** be blocking (see [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md)).
14. When backend lands, DB migration checks and API contract validation (`.ai/ERD.json`, `.ai/API_SPEC.json`) **MUST** be added as blocking gates before deploy stages (see [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [15_API_GUIDE.md](./15_API_GUIDE.md)).

## 5. Workflow

### 5.1 The canonical gate pipeline (runs today, locally; PLANNED in CI)

Run in this order. Each step is a real npm script; stop at the first failure.

```bash
npm ci                     # 1. clean, lockfile-exact install (CI); locally: npm install
npm run lint               # 2. eslint . (flat config, incl. react-hooks + storybook rules)
npm run format:check       # 3. prettier --check (read-only; never rewrites in CI)
npm run build              # 4. tsc -b && vite build   (app typecheck + prod bundle)
npm run plugin:typecheck   # 5. tsc -p figma/plugin/tsconfig.json (plugin strict typecheck)
npm run ds:build           # 6. tokens:build && manifest:build && catalog:build
git diff --exit-code -- figma/ src/generated/ src/tokens/generated/ docs/COMPONENTS.md
                           # 7. DRIFT GATE: fails if step 6 changed any committed generated file
npm run figma:build        # 8. ds:build && plugin:typecheck && plugin:build && plugin:test
                           #    → terminal gate: headless harness asserts ~35 coverage checks
npm run build-storybook    # 9. static Storybook (feeds the PLANNED preview deploy)
```

Notes:
- Steps 6 and 8 both invoke `ds:build`; that is intentional and idempotent — the drift gate (step 7) must be evaluated on a clean rebuild, and `figma:build` re-runs it before the plugin stages so the bundle the plugin consumes is fresh.
- `plugin:build` writes `figma/plugin/code.js` (gitignored); CI discards it after `plugin:test` reads the plugin source. Do **not** `git add` it.

### 5.2 The drift gate in detail

`ds:build` regenerates: `src/tokens/generated/{tokens.css, figma.tokens.json, token-ids.ts}` (via `build-tokens.ts`), `src/generated/design-system.manifest.json` + `figma/tds.plugin.json` (via `build-manifest.ts`), and `docs/COMPONENTS.md` (via `build-catalog.ts`). Because these are committed to the repo, CI rebuilds them and asserts the working tree is unchanged. A non-empty diff is a **hard failure** with one of two root causes: (a) a generated file was hand-edited (violates rule 6), or (b) a source (`*.meta.ts` / `src/tokens/*` / a script) changed but the author forgot to run `ds:build`. Fix by reverting the hand-edit or committing the regenerated outputs.

### 5.3 PLANNED — GitHub Actions CI

**STATUS: PLANNED — no `.github/` directory exists in the repo today.** When added, a single workflow `.github/workflows/ci.yml` triggers on `pull_request` and `push` to `main`, runs one `ubuntu-latest` job on Node 20, and executes §5.1 verbatim. See §11 for the copy-paste skeleton. Caching keys off `package-lock.json` for `~/.npm`.

### 5.4 PLANNED — release & deploy stages

**STATUS: PLANNED.** A tag-triggered workflow (`on: push: tags: 'v*'`) runs the full gate pipeline, then: publishes the static Storybook to the preview host, packages the plugin, and (once backend exists) applies Supabase migrations to staging → prod behind an approval gate. Mechanics live in [32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md); this guide only wires the stages.

## 6. Examples

### 6.1 A passing local pipeline (what green looks like)

```text
$ npm run figma:build
> tds@0.1.0 tokens:build     ... wrote src/tokens/generated/{tokens.css, figma.tokens.json, token-ids.ts}
> tds@0.1.0 manifest:build   ... wrote src/generated/design-system.manifest.json + figma/tds.plugin.json
> tds@0.1.0 catalog:build    ... wrote docs/COMPONENTS.md
> tds@0.1.0 plugin:typecheck ... (tsc -p figma/plugin/tsconfig.json) OK
> tds@0.1.0 plugin:build     ... esbuild → figma/plugin/code.js
> tds@0.1.0 plugin:test      ... tsx figma/plugin/test/harness.ts
PASS  collections: 3 / 3
PASS  variants: ... / ...
...
HEADLESS VERIFICATION PASSED
```

### 6.2 A drift failure (source changed, not rebuilt)

```text
$ npm run ds:build && git diff --exit-code -- figma/ src/generated/ src/tokens/generated/ docs/COMPONENTS.md
diff --git a/figma/tds.plugin.json b/figma/tds.plugin.json
- "options": ["A","B"]
+ "options": ["A","B","C"]
error: files differ  (exit 1)
# Cause: a *.meta.ts gained a Type C but the committed bundle is stale.
# Fix: git add the regenerated figma/tds.plugin.json + src/generated/* + docs/COMPONENTS.md
```

### 6.3 A plugin-gate failure (harness catches broken fidelity)

```text
$ npm run plugin:test
FAIL  boundPaints: 0 / 812
HEADLESS VERIFICATION FAILED     (process.exit(1))
# Cause: a recipe/token binding regressed; the plugin would render unbound fills in Figma.
# Fix: correct the source (recipe/tokenBindings), rebuild, re-run — never edit code.js.
```

### 6.4 Local pre-push convenience (developer, not CI)

```bash
npm run format && npm run lint && npm run figma:build && npm run build
# `format` (write) is fine locally; CI uses `format:check` (read-only) instead.
```

## 7. Validation Rules

Compliance with this guide is itself checked mechanically:

| Rule | How it is validated |
| --- | --- |
| Lint clean | `npm run lint` exits 0 (`eslint .`). |
| Format clean | `npm run format:check` exits 0 (`prettier --check`). |
| App types + build | `npm run build` (`tsc -b && vite build`) exits 0. |
| Plugin types | `npm run plugin:typecheck` exits 0. |
| No generated drift | `npm run ds:build` then `git diff --exit-code` on the four generated paths exits 0. |
| Plugin fidelity | `npm run plugin:test` prints `HEADLESS VERIFICATION PASSED` and exits 0; any `FAIL` line → `process.exit(1)`. |
| Full Figma gate | `npm run figma:build` exits 0 end-to-end. |
| Storybook builds | `npm run build-storybook` exits 0. |
| No committed artifact | `figma/plugin/code.js` absent from the index (gitignored). |
| Node runtime | Node `>= 20` (engines); CI job uses pinned LTS. |
| **PLANNED** unit/e2e | Vitest/Playwright runner exits 0 once added (blocking). |
| **PLANNED** schema | `.ai/*.json` validate against their `$schema` (see [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md)). |

A change is **mergeable** only when every ACTIVE row above is green.

## 8. Checklist

Pre-merge (every change):

- [ ] `npm ci` (or clean `npm install`) succeeds against `package-lock.json`.
- [ ] `npm run lint` passes (0 errors).
- [ ] `npm run format:check` passes.
- [ ] `npm run build` passes (`tsc -b && vite build`).
- [ ] `npm run plugin:typecheck` passes.
- [ ] `npm run ds:build` produces **no** git diff on `figma/`, `src/generated/`, `src/tokens/generated/`, `docs/COMPONENTS.md` (or the regenerated files are staged intentionally).
- [ ] `npm run figma:build` ends with `HEADLESS VERIFICATION PASSED`.
- [ ] `npm run build-storybook` succeeds (if UI/story changed).
- [ ] No hand-edit to any generated file; `figma/plugin/code.js` not staged.
- [ ] No secrets/`.env` added; plugin `networkAccess` still `["none"]`.

Pipeline setup (one-time, PLANNED):

- [ ] `.github/workflows/ci.yml` added, running §5.1 on PR + push to `main`.
- [ ] Node pinned (20/22 LTS), `npm ci` + `~/.npm` cache keyed on `package-lock.json`.
- [ ] Branch protection: CI required, drift + `plugin:test` blocking.
- [ ] PLANNED: test-runner, Storybook preview deploy, Supabase migration gate wired in slot order (rules 13–14).

## 9. Failure Recovery

| Symptom | Diagnosis | Fix | Resume |
| --- | --- | --- | --- |
| `git diff` non-empty after `ds:build` | Generated file hand-edited **or** source changed without rebuild | Revert the hand-edit, or run `ds:build` and stage the regenerated outputs | Re-run §5.1 from step 6 |
| `plugin:test` prints `FAIL … / …` | A token binding, recipe, or coverage count regressed at the source | Fix the **source** (`*.meta.ts`, `src/tokens/*`, `figma/plugin/src/*`), never `code.js`; rebuild | `npm run figma:build` |
| `plugin:typecheck` errors | Plugin `src/*.ts` drifted from `types.ts` (the bundle contract) | Align types with `figma/tds.plugin.json` shape (see [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md)) | `npm run plugin:typecheck` |
| `tsc -b` errors in `build` | Type error in `src/**` (strict, `noUnusedLocals/Parameters`, `verbatimModuleSyntax`) | Fix the type; respect `consistent-type-imports` | `npm run build` |
| `lint` fails on `react-refresh`/`react-hooks` | Component export or hook-rule violation | Follow [19_CODE_CONVENTION.md](./19_CODE_CONVENTION.md) | `npm run lint` |
| `format:check` fails | File not Prettier-formatted | Run `npm run format` locally, commit | `npm run format:check` |
| CI passes locally but fails on runner | `npm install` vs `npm ci`, or floating Node | Use `npm ci`; pin Node `>= 20` LTS | Re-run CI |
| Committed `figma/plugin/code.js` | Artifact staged by mistake | `git rm --cached figma/plugin/code.js`; it is gitignored | Re-push |
| **PLANNED** migration/deploy failure | Backend not yet in repo | N/A today; when live, roll back per [32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md) | — |

If context is lost mid-fix, rehydrate from `.ai/SESSION_SUMMARY.md` / `.ai/TASKS.json` and resume at the failed gate (see [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md)).

## 10. Dependencies

**Scripts & config (real, in-repo):** `package.json` (all scripts), `eslint.config.js`, `.prettierrc.json`, `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json`, `figma/plugin/tsconfig.json`, `.gitignore`, `scripts/build-tokens.ts`, `scripts/build-manifest.ts`, `scripts/build-catalog.ts`, `scripts/lib/css-bindings.ts`, `figma/plugin/test/harness.ts`, `figma/plugin/manifest.json`.

**Generated outputs guarded by the drift gate:** `figma/tds.plugin.json`, `src/generated/design-system.manifest.json`, `src/tokens/generated/*`, `docs/COMPONENTS.md`.

**Sibling docs:** [00_MASTER_RULES.md](./00_MASTER_RULES.md) (constitution), [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md) (Design Lock), [05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md) + [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md) (plugin/harness gate), [19_CODE_CONVENTION.md](./19_CODE_CONVENTION.md) (lint/format rules), [22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md) (secrets/supply chain), [23_PERFORMANCE_GUIDE.md](./23_PERFORMANCE_GUIDE.md) (build perf), [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md) (test gates), [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md) (schema validation), [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md) (recovery), [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md) (validate step), [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md) + [32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md) (release), [34_PROJECT_BOOTSTRAP.md](./34_PROJECT_BOOTSTRAP.md) (cold-start), [39_AI_CHECKLIST.md](./39_AI_CHECKLIST.md) (pre-commit checklist).

**PLANNED backend chain:** [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [15_API_GUIDE.md](./15_API_GUIDE.md), [16_NODE_GUIDE.md](./16_NODE_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md); manifests [.ai/ERD.json](../../.ai/ERD.json), [.ai/API_SPEC.json](../../.ai/API_SPEC.json).

## 11. Template

**PLANNED** — copy-paste skeleton for `.github/workflows/ci.yml` (does not exist in the repo yet; runs §5.1 verbatim):

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20        # engines: node >= 20 (pinned LTS)
          cache: npm              # keyed on package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
      - run: npm run build                 # tsc -b && vite build
      - run: npm run plugin:typecheck
      - run: npm run ds:build
      - name: Assert no generated drift
        run: git diff --exit-code -- figma/ src/generated/ src/tokens/generated/ docs/COMPONENTS.md
      - run: npm run figma:build            # includes plugin:test (headless gate)
      - run: npm run build-storybook
      # PLANNED slots (rules 13–14), added when they exist:
      # - run: npm test                     # Vitest/Playwright, blocking
      # - run: supabase db lint             # migration/RLS check
```

Local pre-push script (add to `package.json` `scripts` when desired):

```jsonc
// "verify": "npm run lint && npm run format:check && npm run build && npm run figma:build && npm run build-storybook"
```

## 12. Future Extension

As TDS grows toward the enterprise AI OS target (> 10,000,000 users), the pipeline extends without breaking the parity rule (rule 1):

- **CI activation (near-term, PLANNED):** land `.github/workflows/ci.yml` per §11; add branch protection making the drift gate and `plugin:test` required. Zero new commands — CI just runs the existing scripts.
- **Test pyramid (PLANNED):** introduce Vitest (unit/interaction, reusing `@storybook/test`) then Playwright (e2e), each a blocking gate in the reserved slot after `plugin:test` (see [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md)). Storybook interaction tests and visual-regression (Chromatic) plug into the `build-storybook` output.
- **Matrix & scale:** Node LTS matrix (20/22), sharded lint/typecheck for the 60-component tree, and incremental `tsc -b` caching to keep build time flat as components grow.
- **Manifest & sync gates (PLANNED):** validate every `.ai/*.json` against its `$schema` and reconcile against source before deploy; add a Storybook↔Figma sync check driven by `DesignSync`/MCP tooling (see [35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md), [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)).
- **Backend delivery (PLANNED):** once the Supabase backend exists ([14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md)–[17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md)), add DB-migration, RLS, and API-contract gates before staging/prod deploy stages, gated by approval, with rollback per [32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md).
- **IaC (PLANNED):** treat CI workflows, environment config, and (later) Supabase project settings as version-controlled code; no click-ops. Secrets stay in the CI/provider secret store — never in the repo ([22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md)).

The invariant that survives every extension: **the pipeline reproduces, it never redesigns; generated outputs remain a pure, drift-checked function of source; and CI runs exactly the npm scripts a developer runs locally.**
