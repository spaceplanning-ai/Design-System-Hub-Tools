# 34 — Project Bootstrap

> **Title:** Project Bootstrap
> **Purpose:** Define the deterministic cold-start sequence and the full implementation strategy for standing up TDS on a fresh machine or in a fresh agent context — the exact command order (`npm install` → `npm run ds:build` → `npm run storybook` / `npm run figma:build`), the phase-by-phase build order with priorities and dependencies, and every gate (Review, Approval, Rollback, Migration, Compile, Lint, TypeCheck, Testing, Deployment) — including the order to stand up the **PLANNED** backend.
> **Status:** ACTIVE
> **Owner:** AI OS
> **Last-reviewed:** _(placeholder — set on review)_
> **Precedence:** Subordinate to [00_MASTER_RULES.md](./00_MASTER_RULES.md). This is an **operational/procedural authority** for bringing the system up; it never overrides design truth (Storybook + `*.meta.ts` + `src/tokens/*`) or the constitution. Every backend/DB/API/CI/test-framework step here is explicitly marked **PLANNED** — none of it exists in the repo today.

---

## 1. Purpose

A new machine, a new contributor, or a freshly-spawned AI agent must be able to bring the entire `tds` system from a bare checkout to a running, verified state **without guessing**. This document is the single deterministic runbook for that. It fixes:

- The exact **cold-start command sequence** — from `npm install` to a live Storybook and a green Figma bundle.
- The **implementation order** in which the system's layers are (re)built and in which any new work must be sequenced — tokens → core → components → stories → manifests → plugin.
- The **strategy for every gate** that guards a build: Compile, TypeCheck, Lint, Testing, Review, Approval, Rollback, Migration, Deployment.
- The **order to stand up the PLANNED backend** (Supabase + Node/TS API), so that when it is approved it attaches at the data seam without disturbing the frozen design pipeline.

The goal is **resume-after-context-loss** and **zero-drift bring-up**: any agent that runs this runbook lands in the same verified state, every time. It is the procedural companion to [18_FOLDER_STRUCTURE.md](./18_FOLDER_STRUCTURE.md) (where things go) and [21_ARCHITECTURE_GUIDE.md](./21_ARCHITECTURE_GUIDE.md) (why the layers exist).

---

## 2. Responsibilities

This specification owns:

- The **prerequisite contract** — Node `>=20`, npm, ESM (`"type":"module"`), the two runtime deps (`react`, `react-dom`).
- The **canonical bring-up sequence** and its idempotency guarantees.
- The **implementation-order graph** — which phase depends on which, and the priority of each.
- The definition and placement of the **Review Gates** and **Approval Gates** that a bootstrap or any change must pass.
- The **Rollback**, **Migration**, **Compile**, **Lint**, **TypeCheck**, **Testing**, and **Deployment** strategies at bootstrap granularity.
- The **PLANNED backend stand-up order**, clearly fenced as future work.

It does **not** own: the internals of any single build script (see [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md), [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md)); CI/CD pipeline authoring ([25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)); the test pyramid detail ([24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md)); release/versioning ([32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md)); or the resume protocol itself ([28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md)). This doc **sequences and gates**; those docs define the internals.

---

## 3. Scope

**In scope:** first-run environment setup; the ordered command sequence; the layer-by-layer implementation order with dependencies and priorities; the compile/typecheck/lint/test gates; review and approval gates; rollback and migration at bring-up; frontend deployment of static outputs; and the **PLANNED** backend stand-up order.

**Out of scope:** the actual authoring of a component/token/plugin module (see [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md), [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md), [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md)); the design decisions themselves (frozen by the Design Lock in [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md)); and any **live** backend implementation — the repo has **no** `server/`, `db/`, `supabase/`, `.env`, `.github/`, or test-framework directory today. All backend/DB/API/CI content below is **PLANNED** and governed by [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [15_API_GUIDE.md](./15_API_GUIDE.md), [16_NODE_GUIDE.md](./16_NODE_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md), and [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md).

---

## 4. Rules

1. **MUST** verify the prerequisite before anything: `node -v` reports **`>=20`**. A lower Node is a hard stop — the ESM tooling (`tsx`, Vite 5, esbuild, Storybook 8) assumes it.
2. **MUST** run the bring-up in the fixed order: **`npm install` → `npm run ds:build` → (`npm run storybook` or `npm run figma:build`)**. Never run a downstream build before its upstream inputs exist.
3. **MUST** treat `npm run ds:build` as the mandatory first build after install — nothing under `src/tokens/generated/`, `src/generated/`, or `figma/tds.plugin.json` is committed as source, so a fresh checkout has **no** generated outputs until it runs.
4. **MUST NEVER** hand-create or hand-edit a generated output to "skip" a build step. Generated paths (`src/tokens/generated/*`, `src/generated/design-system.manifest.json`, `figma/tds.plugin.json`, `figma/plugin/code.js`) are **sacred** ([00_MASTER_RULES.md](./00_MASTER_RULES.md) §Design Lock). If missing, run the build that produces them.
5. **MUST** pass the Figma gate — `npm run figma:build` ends in `npm run plugin:test`, the headless harness (`figma/plugin/test/harness.ts`) that `process.exit(1)`s on any coverage mismatch. A red harness **blocks**; it is the primary bootstrap correctness gate for the plugin.
6. **MUST** keep bring-up **idempotent**: re-running `npm install` / `npm run ds:build` / `npm run figma:build` on an already-built tree must converge to the same outputs with no manual cleanup. Builds fully overwrite their outputs.
7. **MUST** run the Compile/TypeCheck/Lint gates (`tsc -b`, `npm run lint`) before declaring a bootstrap or change "done"; a green Storybook alone is **not** sufficient.
8. **SHOULD** prefer `npm ci` over `npm install` in automated/CI-like contexts to install exactly from `package-lock.json` (deterministic), reserving `npm install` for interactive first runs.
9. **MUST** honor **Priority order** when implementing or repairing: tokens are P0 (everything binds to them), core is P0, components/stories are P1, generated manifests are P1 (derived), the plugin is P2 (consumes the bundle). Never invert this dependency direction.
10. **MUST** pass the two human/agent gates before merge — the **Review Gate** ([30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)) and, for any Design-Lock-touching or **PLANNED**-backend-activating change, the **Approval Gate** (explicit request/approval per [00_MASTER_RULES.md](./00_MASTER_RULES.md) §Design Lock and [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md)).
11. **MUST** use **Rollback by source-and-rebuild**, never by editing outputs: revert the source commit (or `git checkout -- <source>`) then re-run the relevant `*:build`. Reverting a generated file alone is a drift bug.
12. **MUST** mark and fence every backend/DB/API/CI/test-framework action as **PLANNED**; none may be executed against the current repo as if it existed. Stand-up order for those is §5.9 and is gated by an Approval Gate.

---

## 5. Workflow

### 5.1 Cold-start command sequence (fresh machine or agent)

```bash
# 0. Prerequisites (hard gate)
node -v            # MUST be >= 20   (engines.node ">=20")
npm -v             # bundled with Node
git clone <repo> && cd Figma-Dev-Tools

# 1. Install dependencies (react + react-dom + dev toolchain)
npm ci             # deterministic; or `npm install` for a first interactive run

# 2. Generate all derived outputs (MANDATORY first build)
npm run ds:build   # = tokens:build -> manifest:build -> catalog:build
#   writes: src/tokens/generated/{tokens.css, figma.tokens.json, token-ids.ts}
#           src/generated/design-system.manifest.json
#           figma/tds.plugin.json
#           docs/COMPONENTS.md

# 3a. Run the DESIGN SOURCE OF TRUTH (interactive dev)
npm run storybook  # storybook dev -p 6006  -> http://localhost:6006

# 3b. …or regenerate + verify the FIGMA bundle end-to-end (the correctness gate)
npm run figma:build
#   = ds:build && plugin:typecheck && plugin:build && plugin:test
#   plugin:build  -> esbuild figma/plugin/src/code.ts -> figma/plugin/code.js
#   plugin:test   -> tsx figma/plugin/test/harness.ts (headless mock; exit 1 on mismatch)

# 4. Full verification (compile + lint) before declaring done
tsc -b             # project references typecheck (same as `npm run build` phase 1)
npm run lint       # eslint .
npm run build      # tsc -b && vite build  -> dist/ (production web build, optional)
```

A fresh checkout has **zero** generated outputs; step 2 is what makes the tree coherent. Steps 3a/3b are the two faces of the system — Storybook (source of truth) and the Figma bundle (its reproduction). Both derive from the same sources, so they cannot disagree if the builds are green.

### 5.2 Implementation Order, Priority & Dependencies

The system is a one-way pipeline; bring-up and any new work follow the same arrow. **Never build a phase before its inputs exist.**

| Phase | Layer | Priority | Produces | Depends on | Build command |
| --- | --- | --- | --- | --- | --- |
| P0-a | **Tokens** (`src/tokens/{primitives,semantic,types,helpers}.ts`) | P0 | `src/tokens/generated/{tokens.css, figma.tokens.json, token-ids.ts}` | — | `npm run tokens:build` |
| P0-b | **Core** (`src/core/*`: `defineComponent.ts`, `types.ts`, `storybook.ts`) | P0 | the `ComponentMeta` model + helpers | tokens (ids) | `tsc` (compiled with app) |
| P1-a | **Components** (`src/components/**` five-file folders) | P1 | React + `.meta.ts` + `.css` + stories | core, tokens | Vite/Storybook build |
| P1-b | **Registry** (`src/components/metas.ts`, barrels) | P1 | `componentMetas` aggregate | all metas | consumed by manifest build |
| P1-c | **Manifests** (derived) | P1 | `src/generated/design-system.manifest.json`, `figma/tds.plugin.json` | metas + tokens | `npm run manifest:build` |
| P1-d | **Catalog** (derived) | P1 | `docs/COMPONENTS.md` | metas | `npm run catalog:build` |
| P2 | **Figma plugin** (`figma/plugin/src/*`, entry `code.ts`) | P2 | `figma/plugin/code.js` | the bundle (`figma/tds.plugin.json`) | `npm run plugin:build` |
| P2-gate | **Plugin harness** | P2 | pass/fail | `code.ts` + bundle | `npm run plugin:test` |
| P3 | **Backend** (Supabase + Node/TS API) — **PLANNED** | P3 | data/API layer | Approval Gate | see §5.9 |

`npm run ds:build` runs P0-a → P1-c → P1-d in the correct order automatically. `npm run figma:build` extends that through P2 and the P2 gate. **Priority rule:** a P0 failure blocks everything; a P1 failure blocks the plugin; the plugin (P2) never feeds back upstream; the backend (P3) is entirely gated and never touches the design pipeline.

### 5.3 Compile / TypeCheck / Lint strategy

- **Compile strategy:** the web build is `npm run build` = **`tsc -b && vite build`**. `tsc -b` uses TypeScript **project references** (`tsconfig.json` → `tsconfig.app.json` + `tsconfig.node.json`); Vite then bundles. The plugin compiles separately via esbuild (`npm run plugin:build`, IIFE, `--target=es2017`).
- **TypeCheck strategy:** two independent surfaces. App/Storybook typecheck through `tsc -b` (strict, `noUnusedLocals/Parameters`, `verbatimModuleSyntax`, `moduleResolution bundler`). The plugin typechecks through **`npm run plugin:typecheck`** (`tsc -p figma/plugin/tsconfig.json`, `@figma/plugin-typings`). Both must be green; `figma:build` runs the plugin typecheck as a gate before bundling.
- **Lint strategy:** **`npm run lint`** = `eslint .` over the flat config (`eslint.config.js`: js-recommended + typescript-eslint + react-hooks + react-refresh + storybook). Format is separate: **`npm run format`** (write) / **`npm run format:check`** (verify) via Prettier (`semi`, `singleQuote`, `trailingComma all`, `printWidth 100`, `tabWidth 2`, `arrowParens always`). Lint enforces the barrel-import and hooks rules; a deep import from `@/components/atoms/...` is a lint-level violation.

### 5.4 Testing strategy

- **Today (EXISTS):** the only automated test is the **headless plugin harness** — `npm run plugin:test` (`tsx figma/plugin/test/harness.ts`). It runs the plugin against a mock Figma API, asserts full coverage of collections/styles/component sets, and `process.exit(1)`s on any mismatch. It is wired as the terminal step of `npm run figma:build`. There is **no** unit/e2e framework, no `*.test`/`*.spec` files, and **no `test` npm script**.
- **Bootstrap testing gate:** a bring-up is "tested" when `npm run figma:build` completes with the harness green **and** `tsc -b` + `npm run lint` are clean. Treat the harness exit code as the bootstrap's pass/fail signal.
- **PLANNED:** interaction tests (Storybook `play` + `@storybook/test`), visual regression, unit tests, and API/DB integration tests, all under a future `test` script and CI. The full pyramid and coverage gates live in [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md).

### 5.5 Review Gates & Approval Gates

- **Review Gate (every change):** before merge, run `npm run figma:build` (green harness) + `tsc -b` + `npm run lint`, then the review checklist in [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md) — no generated-file hand-edits, no deep imports, `*.meta.ts` still React/CSS-free, catalog/manifest diffs match the source change. Output: `REVIEW_REPORT.md` / [.ai/REVIEW_REPORT.md](../../.ai/REVIEW_REPORT.md).
- **Approval Gate (design or backend):** any change that touches **visual design** (tokens, component CSS/layout, variants) or that **activates PLANNED backend** MUST carry an explicit, recorded request/approval per the Design Lock ([00_MASTER_RULES.md](./00_MASTER_RULES.md)) and [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md). The AI MUST NEVER self-authorize a redesign or a backend stand-up. Approval is logged in [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md).

### 5.6 Rollback strategy

- **Generated outputs:** never roll back by editing them. Revert the **source** (`git revert`/`git checkout -- <source-path>`), then re-run the matching build (`tokens:build` / `manifest:build` / `catalog:build` / `plugin:build`) to re-derive. Because builds fully overwrite, this restores byte-for-byte.
- **Source regressions:** revert the offending commit on a branch, run `npm run figma:build` + `tsc -b` + `npm run lint` to confirm the harness returns green, then merge the revert through the normal Review Gate.
- **Dependency/lockfile:** roll back `package-lock.json` with the revert and re-run `npm ci` for a deterministic reinstall.
- **PLANNED backend rollback:** forward-only migrations with a paired down-migration or restore-point; never destructive in place. Detail in [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md) and [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md).

### 5.7 Migration strategy

- **Token/variant/component migrations (design pipeline):** change the **source** (`src/tokens/*`, `*.meta.ts`, component CSS), run `npm run ds:build` so the manifest, bundle, and `docs/COMPONENTS.md` re-derive together, then `npm run figma:build` to re-verify. Renames propagate through the pipeline; the plugin regenerates the Figma system with no manual config. Record the migration in [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md) and [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md).
- **Manifest/schema migrations (`.ai/*`):** `.ai/` is a regenerated cache/state layer; on a schema bump, reconcile from sources 2–3 of the hierarchy ([00_MASTER_RULES.md](./00_MASTER_RULES.md) §E), never hand-fork. Schemas per [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md).
- **PLANNED DB migrations:** versioned, forward-only SQL migrations against Supabase Postgres, RLS-aware, contracted by `ERD.json` ([.ai/ERD.json](../../.ai/ERD.json)); see [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md).

### 5.8 Deployment strategy

- **Frontend (EXISTS):** `npm run build` (`tsc -b && vite build`) emits static, immutable, CDN-cacheable assets to `dist/`; Storybook publishes via `npm run build-storybook` → `storybook-static/`. Both are zero-runtime, token-driven — horizontally scalable as static hosting. Neither `dist/` nor `storybook-static/` is committed (`.gitignore`).
- **Figma bundle (EXISTS):** `figma/tds.plugin.json` is the deploy artifact for the plugin; `npm run plugin:build` produces `figma/plugin/code.js` (gitignored) which the plugin loads alongside `ui.html` and `manifest.json`. "Deploy" = ship the built plugin; the harness gate must be green first.
- **PLANNED backend deploy:** Supabase project + stateless Node/TS API behind CI/CD ([25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)); environments, secrets, and release automation are future work, gated by an Approval Gate. Marked **PLANNED**.

### 5.9 Standing up the PLANNED backend — order

> **STATUS: PLANNED — no backend exists in the repo today.** Runtime deps are only `react` + `react-dom`. Execute this order **only after an Approval Gate**; each step is governed by the linked spec.

1. **Provision Supabase** (Postgres + Auth + Storage + Edge Functions + Realtime) — [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md).
2. **Author the schema + forward-only migrations** against the `ERD.json` contract — [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md).
3. **Enable RLS policies** (multi-tenant, deny-by-default) — [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md) / [22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md).
4. **Wire Auth** (Supabase Auth) — [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md).
5. **Stand up the Node/TS API layer** (REST/RPC over Supabase, versioned against `API_SPEC.json`) — [15_API_GUIDE.md](./15_API_GUIDE.md), [16_NODE_GUIDE.md](./16_NODE_GUIDE.md).
6. **Add Storage + Edge Functions + Realtime** as features require — [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md).
7. **Add CI/CD** (`.github/`, secrets, environments) — [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md).
8. **Connect the frontend** at the data seam only — the design pipeline is never modified by backend work, preserving zero design-drift.

---

## 6. Examples

**Example A — a fresh laptop, from clone to green Figma bundle:**

```bash
node -v                 # v20.x  ✓
git clone <repo> && cd Figma-Dev-Tools
npm ci                  # installs react, react-dom + toolchain from package-lock.json
npm run ds:build        # generates tokens.css, manifests, tds.plugin.json, COMPONENTS.md
npm run figma:build     # ds:build + plugin:typecheck + plugin:build + plugin:test
# -> "harness OK / coverage complete"  (exit 0)  = system verified
```

**Example B — a fresh agent context resuming mid-task (no memory):**

```bash
# 1. Rehydrate from the AI memory layer (see 28_RESUME_SPECIFICATION.md)
cat .ai/SESSION_SUMMARY.md    # what was in flight
cat .ai/TASKS.json            # open tasks + status
# 2. Reconstitute derived outputs deterministically
npm ci && npm run ds:build
# 3. Verify baseline before touching anything
npm run figma:build && tsc -b && npm run lint
# 4. Resume the task from TASKS.json
```

**Example C — bootstrap failed at the plugin gate:**

```bash
npm run figma:build
# ... plugin:test -> AssertionError: component set "A Type - Card" missing variant  (exit 1)
# Diagnosis: a meta changed but the bundle wasn't regenerated, OR a plugin module isn't wired from code.ts
npm run ds:build            # re-derive figma/tds.plugin.json from current metas
npm run figma:build         # re-run the full gate; harness should now pass
```

**Example D — reproduce production build outputs (deploy artifacts):**

```bash
npm run build               # tsc -b && vite build  -> dist/  (static web app)
npm run build-storybook     # -> storybook-static/  (published source of truth)
# figma/plugin/code.js is produced by plugin:build (gitignored); never committed
```

---

## 7. Validation Rules

Compliance of a bootstrap/change is checked by these real mechanisms, in order:

1. **Prereq:** `node -v` ≥ 20 (else hard stop).
2. **Install:** `npm ci` exits 0; only `react`/`react-dom` are runtime deps.
3. **Derive:** `npm run ds:build` exits 0 and (re)writes all four generated targets; a `git status` after it should show only expected regenerated-output diffs.
4. **TypeCheck:** `tsc -b` clean **and** `npm run plugin:typecheck` clean.
5. **Lint/Format:** `npm run lint` clean; `npm run format:check` clean.
6. **Figma correctness gate (authoritative):** `npm run figma:build` ends green — the harness (`figma/plugin/test/harness.ts`) did **not** `exit 1`.
7. **Design-Lock:** no manual diffs to `src/tokens/generated/*`, `src/generated/*`, `figma/tds.plugin.json`, or `figma/plugin/code.js` beyond what a build produced.
8. **Gates:** Review Gate passed ([30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)); Approval Gate recorded for any design/backend change ([31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md)).

If any check fails, the bootstrap is **not** complete — go to §9.

---

## 8. Checklist

- [ ] `node -v` reports `>=20`.
- [ ] `npm ci` (or `npm install`) completed; `node_modules/` present, not committed.
- [ ] `npm run ds:build` ran; `src/tokens/generated/*`, `src/generated/design-system.manifest.json`, `figma/tds.plugin.json`, `docs/COMPONENTS.md` exist.
- [ ] `npm run storybook` serves on `:6006` (visual source of truth) **or** `npm run figma:build` is green.
- [ ] `npm run figma:build` completes; harness did not `exit 1`.
- [ ] `tsc -b` clean; `npm run plugin:typecheck` clean.
- [ ] `npm run lint` clean; `npm run format:check` clean.
- [ ] No hand-edited generated outputs (Design-Lock intact).
- [ ] `.ai/SESSION_SUMMARY.md` + `.ai/TASKS.json` read/updated for resume.
- [ ] Review Gate passed; Approval Gate recorded if design/backend touched.
- [ ] Backend steps (§5.9) **not** executed unless an Approval Gate authorized them (PLANNED).

---

## 9. Failure Recovery

| Symptom | Diagnosis | Fix | Resume |
| --- | --- | --- | --- |
| `tsx`/Vite/esbuild crash on install or run | Node `< 20` | Install Node `>=20` (`engines.node`) | re-run from `npm ci` |
| Imports resolve but generated files absent | `ds:build` never ran on this fresh checkout (Rule 3) | `npm run ds:build` | continue at `figma:build` |
| `Cannot find module '@/…'` in one surface only | Alias missing from one of the four sites | Add alias to `tsconfig.app.json`/`tsconfig.node.json`/`vite.config.ts`/`.storybook/main.ts` | re-run that build |
| `manifest:build`/`tsc` error importing a `*.meta.ts` | meta pulled in React/CSS/`@/` alias | Strip meta to pure data + relative imports | `npm run ds:build` |
| `npm run figma:build` → harness `exit 1` | Bundle stale, or a plugin module not wired from `code.ts`, or coverage gap | `npm run ds:build`; wire the module | `npm run figma:build` |
| `plugin:typecheck` fails | `@figma/plugin-typings` mismatch or plugin source error | Fix plugin `src/*`; keep entry `code.ts` | `npm run plugin:typecheck` then `figma:build` |
| Generated file shows modified with no source change | An auto-output was hand-edited (Rule 4) | `git checkout -- <path>`; change the **source** | re-run the matching `*:build` |
| Deep-import lint error | Bypassed the barrel | Import from `@/components` | `npm run lint` |
| Build output committed (`dist/`, `storybook-static/`, `code.js`) | staged a gitignored artifact | `git rm --cached`; confirm `.gitignore` | commit |
| Non-deterministic install between machines | used `npm install` not `npm ci` | `npm ci` from `package-lock.json` | re-run `ds:build` |

Resume-after-context-loss always reads [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md) + [.ai/TASKS.json](../../.ai/TASKS.json) to relocate in-flight work ([28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md)).

---

## 10. Dependencies

- **Docs:** [00_MASTER_RULES.md](./00_MASTER_RULES.md) (precedence, Design Lock, generated-is-sacred, source-of-truth hierarchy), [18_FOLDER_STRUCTURE.md](./18_FOLDER_STRUCTURE.md) (where outputs land), [21_ARCHITECTURE_GUIDE.md](./21_ARCHITECTURE_GUIDE.md) (layer arrows), [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md) (plugin build + harness), [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md) (token build), [19_CODE_CONVENTION.md](./19_CODE_CONVENTION.md) (lint/format/tsconfig), [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md) (testing pyramid, PLANNED), [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md) (CI/CD, PLANNED), [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md) (rehydration), [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md) (task lifecycle), [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md) (Review Gate), [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md) (Approval Gate, migration), [32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md) (release), and the PLANNED backend set [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md)–[17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md).
- **Manifests:** [.ai/PROJECT_MANIFEST.json](../../.ai/PROJECT_MANIFEST.json), [.ai/TASKS.json](../../.ai/TASKS.json), [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md), [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md), [.ai/REVIEW_REPORT.md](../../.ai/REVIEW_REPORT.md), [.ai/ERD.json](../../.ai/ERD.json) (PLANNED), [.ai/API_SPEC.json](../../.ai/API_SPEC.json) (PLANNED).
- **Real files/scripts:** `package.json` (`ds:build`, `figma:build`, `plugin:*`, `build`, `lint`, `format`), `scripts/build-{tokens,manifest,catalog}.ts`, `figma/plugin/src/code.ts`, `figma/plugin/test/harness.ts`, `tsconfig.json` + `tsconfig.{app,node}.json`, `eslint.config.js`, `.prettierrc.json`, `vite.config.ts`, `.storybook/main.ts`, `package-lock.json`.

---

## 11. Template — bootstrap runbook (copy-paste)

```bash
# ── TDS BOOTSTRAP RUNBOOK ─────────────────────────────────────────
# 0) Prereq
node -v                       # MUST be >= 20

# 1) Install (deterministic)
npm ci

# 2) Generate all derived outputs (MANDATORY)
npm run ds:build              # tokens + manifests + catalog

# 3) Bring up a face of the system
npm run storybook             # dev source of truth  (:6006)
# — or —
npm run figma:build           # regenerate + verify Figma bundle (harness gate)

# 4) Full verification before "done"
tsc -b && npm run plugin:typecheck
npm run lint && npm run format:check

# 5) Production artifacts (optional)
npm run build                 # dist/  (static web)
npm run build-storybook       # storybook-static/

# 6) BACKEND (PLANNED — only after Approval Gate) — see §5.9
#    Supabase -> schema+migrations -> RLS -> Auth -> Node/TS API -> Storage/Edge/Realtime -> CI -> connect FE
# ──────────────────────────────────────────────────────────────────
```

Bootstrap outcome record (append to [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md)):

```md
## Bootstrap <date>
- Node: <ver>  · install: npm ci  · ds:build: OK
- figma:build: harness GREEN (exit 0)  · tsc -b: OK  · lint: OK
- Gates: Review ✓  Approval (design/backend): n/a | recorded
- Next: <task from TASKS.json>
```

---

## 12. Future Extension

- **Cold-start at scale:** the bring-up is O(components) and fully deterministic — hundreds of components still regenerate in one `ds:build`, and the plugin harness gate keeps Figma output correct regardless of catalog size. The state-axis exclusion policy is the combinatorial guardrail that keeps bootstrap tractable as the system grows. See [23_PERFORMANCE_GUIDE.md](./23_PERFORMANCE_GUIDE.md).
- **CI-driven bootstrap (PLANNED):** the §11 runbook becomes a `.github/` workflow — `npm ci → ds:build → figma:build → tsc -b → lint` as required checks, publishing `dist/` and `storybook-static/` and gating merges on the harness. Authored per [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md).
- **Backend bring-up toward >10,000,000 users (PLANNED):** §5.9 scales via Supabase read replicas, connection pooling, RLS-enforced multi-tenancy, and Edge Functions, fronted by a stateless Node/TS API deployed independently — all attaching at the data seam so backend scaling carries **zero** design-drift risk ([14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md)–[17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md)).
- **Agent-driven bootstrap:** MCP agents run this runbook headlessly, reading `.ai/` manifests to rehydrate and reconcile state without reading source — the low-token bring-up path described in [35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md), [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md), and [37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md).
- **Governance:** every future extension inherits the invariants above — fixed order, idempotency, generated-is-sacred, Design Lock, one-way dependency. New phases may attach **below** the barrel or **at** the data seam; none may invert the pipeline. Enforced through [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md) and [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md).
