<!-- filename: 39_AI_CHECKLIST.md -->

# 39 — AI Checklist

> **Title:** AI Checklist
> **Purpose:** The single, condensed, copy-paste gate sheet for every AI agent working in the TDS repo — pre-task, per-change, pre-commit, pre-release, plus focused Design-Lock, Storybook↔Figma-sync, accessibility, security, and performance checklists, each item tied to a real `npm run …` script, file path, or owning doc.
> **Status:** ACTIVE. (Backend/DB/API/CI/test-framework rows are marked **PLANNED** — none exist in the repo today.)
> **Owner:** AI OS
> **Last-reviewed:** _(placeholder — set on first review)_
> **Precedence:** Subordinate to [00_MASTER_RULES.md](./00_MASTER_RULES.md). This document **restates and condenses** rules that live authoritatively in the owning specs; it never invents a new rule. When a checklist item and its owning doc disagree, the **owning doc wins** and this sheet is corrected. Checklists are a memory aid, not a substitute for the specs they point to.

---

## 1. Purpose

An AI agent under context pressure forgets the tail of the process: it edits the source correctly, then skips the drift check, or ships a variant without re-running `plugin:test`. This document is the **antidote to that failure mode** — a flat, scannable set of `[ ]` gates that an agent can hold in working memory and tick off, each pointing back to the spec that owns the rule.

It exists to make the AI OS's non-negotiable guarantees **operationally checkable** at the moments they can break:

- **Before starting** — read the cheap manifests, not the whole repo ([26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md)).
- **On every change** — the smallest correct diff to the correct **source**, never a generated output.
- **Before commit** — the full local gate (`npm run figma:build` + `build` + `lint` + drift check) is green.
- **Before release** — versioning, changelog, and reconciliation are done ([32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md)).
- **Always** — Design Lock is intact, Storybook↔Figma stays in sync, and a11y/security/perf floors hold.

This is a **derivative, condensing** document. Every item here has an authoritative home; the value added is *sequencing and completeness at the point of action*.

## 2. Responsibilities

This doc owns the **canonical checklist surface** of the AI OS:

1. **The five lifecycle gates** — pre-task, per-change, pre-commit, pre-release, and the resume gate — as ordered `[ ]` lists.
2. **The five cross-cutting gates** — Design Lock, Storybook↔Figma sync, accessibility, security, performance — each self-contained.
3. **Script/path binding** — every item names the real mechanism that proves it (`npm run figma:build`, a file under `figma/`, a `.ai/*` manifest).
4. **Owning-doc routing** — every gate block cites the spec(s) that define its rules, so an agent can descend for detail.
5. **The copy-paste template** — a single skeleton an agent pastes into a PR/`TASKS.json` note and ticks off.

It does **not** own the *definitions* behind any item: the Design Lock text ([03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md)), the review gate mechanics ([30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)), the task lifecycle ([29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md)), the a11y targets ([13_ACCESSIBILITY_SPECIFICATION.md](./13_ACCESSIBILITY_SPECIFICATION.md)), or the manifest schemas ([27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md)). Those are referenced, never redefined.

## 3. Scope

**In-scope**

- Condensed, actionable checklists for the whole task lifecycle and the cross-cutting quality floors.
- One-line-per-item gates that name a real npm script, repo path, or `.ai/*` manifest.
- A copy-paste master template and per-task-type mini-lists (component / token / variant / plugin / doc).

**Out-of-scope (owned elsewhere)**

- The *rules* themselves — see each block's cited owner doc.
- Full task lifecycle & gate semantics → [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md), [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md).
- Resume protocol internals → [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md).
- Release/versioning mechanics → [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md), [32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md).
- Any **backend/DB/API/Supabase/CI/unit-test-framework** checklist item — **PLANNED**; marked as such wherever it appears, deferring to [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [15_API_GUIDE.md](./15_API_GUIDE.md), [16_NODE_GUIDE.md](./16_NODE_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md), [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md), [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md).

## 4. Rules

Rules govern **how this checklist is used**. Phrased **MUST** / **SHOULD** / **NEVER**.

1. **R1 — Gates are mandatory, not advisory (MUST).** Before commit, the agent MUST tick every applicable box in §5's pre-commit gate. An unticked applicable box blocks the commit.
2. **R2 — Never edit a generated output to make a box green (NEVER).** Files under `figma/`, `src/generated/`, `src/tokens/generated/`, `figma/plugin/code.js`, and the catalog `docs/COMPONENTS.md` are AUTO outputs. Fix the **source** (`*.meta.ts`, `src/tokens/*`, `src/components/**`, or a `scripts/*`), then re-run the build. (Owner: [00_MASTER_RULES.md](./00_MASTER_RULES.md).)
3. **R3 — Prove, don't assert (MUST).** A box is ticked only when its **named mechanism** actually passed — the command was run, the manifest was read, the drift `git diff` was empty. No "looks fine."
4. **R4 — Design Lock is unconditional (NEVER).** No item in any list authorizes a self-initiated visual change (color/spacing/radius/type/shadow/motion/layout) or a rename of any token/component/variant/variable. Visual change is a **source** change, explicitly requested/approved. (Owner: [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md) §Design Lock.)
5. **R5 — This sheet mirrors, never overrides (MUST).** If an item conflicts with its owning doc, follow the **owning doc** and file a correction to this sheet. This document holds precedence rank below every spec it cites (see [00_MASTER_RULES.md](./00_MASTER_RULES.md) §Precedence).
6. **R6 — Skip only with a reason (SHOULD).** An item that genuinely does not apply (e.g. a docs-only change skips `plugin:test`) SHOULD be marked `[~] N/A — <reason>`, never silently dropped.
7. **R7 — PLANNED items are informational (MUST).** Backend/DB/API/CI/vitest rows MUST NOT block a frontend commit today; they are the forward standard and MUST stay labelled **PLANNED**.
8. **R8 — Reconcile the `.ai/` cache (MUST).** Any change that alters components, tokens, variants, or plugin coverage MUST update the affected `.ai/*` manifest(s) and `.ai/SESSION_SUMMARY.md` in the same task. (Owner: [37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md).)

## 5. Workflow — the lifecycle checklists

Run these **in order**. Each is copy-paste-ready.

### 5.1 Pre-task gate — before writing any code

Owners: [01_AI_SPECIFICATION.md](./01_AI_SPECIFICATION.md), [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md), [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md).

- [ ] Read [00_MASTER_RULES.md](./00_MASTER_RULES.md) constraints for the change class (Design Lock, generated-is-sacred).
- [ ] Rehydrate state: read [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md) + [.ai/TASKS.json](../../.ai/TASKS.json) ([28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md)).
- [ ] **Reuse-first:** search `docs/COMPONENTS.md` + [.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json) before building UI — 60 components already exist (24 atoms · 27 molecules · 9 organisms).
- [ ] Load only the needed `.ai/*` manifest(s); do **not** scan `src/**` (manifest-first, [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md)).
- [ ] Confirm task type → pick the matching §11 mini-list (component / token / variant / plugin / doc).
- [ ] Confirm the change is a **source** edit, never a generated-output edit (R2).
- [ ] For any visual delta: confirm it was **explicitly requested/approved** (R4); otherwise stop and escalate.
- [ ] Delegate if apt: `@tds-component` (component/meta work) or `@figma-plugin` (plugin work) — [36_AI_AGENT_SPECIFICATION.md](./36_AI_AGENT_SPECIFICATION.md).

### 5.2 Per-change gate — during implementation

Owners: [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md), [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md), [19_CODE_CONVENTION.md](./19_CODE_CONVENTION.md), [20_CLEAN_CODE.md](./20_CLEAN_CODE.md).

- [ ] Editing **source only** (`*.meta.ts` / `*.tsx` / `*.css` / `src/tokens/*` / `scripts/*`), never `figma/**` or `src/generated/**`.
- [ ] Imports from the single barrel `@/components` — **never** deep paths ([18_FOLDER_STRUCTURE.md](./18_FOLDER_STRUCTURE.md)).
- [ ] `*.meta.ts` stays **React/CSS-free**, relative imports only ([07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md)).
- [ ] Styling uses `var(--tds-*)` tokens **only** — no hardcoded color/space/radius/shadow ([08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md)).
- [ ] Variants reach the DOM via `toDataAttrs(meta, {...})` (Figma-legible `data-*`) ([09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md)).
- [ ] Axis discipline: `type` = layout preset A/B/C · `variant` (label "Style") = fill · composes with `tone`/`size`/`shape` ([03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md), [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md)).
- [ ] `state` axis (default/hover/active/focus/disabled/loading) **not** emitted as a Figma variant; `disabled`/`loading` remain BOOLEAN props ([09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md)).
- [ ] Uses shared code: `cx` from `@/utils`, hooks from `@/hooks`; form inputs wrapped in `FormField`; component is `forwardRef`.
- [ ] Aliases only (`@/*`, `@core/*`, `@components/*`, `@tokens/*`) — no fragile relative chains in app code.
- [ ] New component? Registered in `src/components/metas.ts` + its tier barrel; 5 files present (`.meta.ts`/`.tsx`/`.css`/`.stories.tsx`/`index.ts`) ([07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md)).
- [ ] Story is CSF3: title `"Tier/Name"`, `tags: ["autodocs"]`, `parameters: metaParameters(meta)`, `argTypes: argTypesFromMeta(meta)`, `args: { ...argsFromMeta(meta) }` ([04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md)).
- [ ] Smallest correct diff; no drive-by rewrites, no verify-by-re-read ([26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md)).

### 5.3 Pre-commit gate — the hard local gate (all MUST pass)

Owners: [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md), [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md).

- [ ] `npm run ds:build` succeeds (tokens → manifest → catalog regenerated).
- [ ] `npm run figma:build` ends with `HEADLESS VERIFICATION PASSED` (runs `ds:build` → `plugin:typecheck` → `plugin:build` → `plugin:test`; harness green, 0 blocking warnings).
- [ ] `npm run build` (`tsc -b && vite build`) passes; `npm run plugin:typecheck` passes.
- [ ] `npm run lint` clean; `npm run format:check` clean (`prettier`).
- [ ] **Drift check:** re-ran the build, then `git diff` on `figma/`, `src/generated/`, `src/tokens/generated/`, `figma/plugin/code.js`, `docs/COMPONENTS.md` is **empty** (no stale/hand-edited generated file — R2).
- [ ] `.ai/` reconciled: updated the affected manifest(s) + [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md); appended [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md) (R8, [37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md)).
- [ ] Design-Lock gate (§6) passed; Storybook↔Figma-sync gate (§7 below-cited) passed.
- [ ] a11y (§8-A), security (§8-B), performance (§8-C) floors hold for touched surface.
- [ ] Commit message ties to the task in [.ai/TASKS.json](../../.ai/TASKS.json); no generated-only "fixups" hiding a hand-edit.
- [ ] **PLANNED (does not block today):** no `vitest`/CI to run — see [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md), [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md).

### 5.4 Pre-release gate — cutting a version

Owners: [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md), [32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md), [33_DOCUMENTATION_GUIDE.md](./33_DOCUMENTATION_GUIDE.md).

- [ ] Full pre-commit gate (§5.3) green on the release commit.
- [ ] `package.json` `version` bumped per semver; rationale recorded ([32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md)).
- [ ] [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md) finalized for the version; breaking changes + migrations noted ([31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md)).
- [ ] `docs/COMPONENTS.md` catalog and autodocs current (`npm run catalog:build` ran inside `ds:build`).
- [ ] Bundle contract intact: `figma/tds.plugin.json` = `{ tokens, design }`, 3 collections (Primitives → Semantic → Theme), 60 component sets — verified by `plugin:test`, spec in [figma/README.md](../../figma/README.md) / [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md).
- [ ] [.ai/REVIEW_REPORT.md](../../.ai/REVIEW_REPORT.md) shows no open blockers ([30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)).
- [ ] Rollback path known (revert commit + regenerate) ([32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md)).
- [ ] **PLANNED:** CI release automation & publish — [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md).

## 6. Design-Lock gate (cross-cutting — always applies)

Owner: [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md) §Design Lock; enforced by [00_MASTER_RULES.md](./00_MASTER_RULES.md), [05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md).

- [ ] **No self-initiated visual change:** color, spacing, radius, typography, shadow, motion, layout untouched unless explicitly requested/approved.
- [ ] **No renames:** no token id, component, variant, axis option, or Figma variable renamed.
- [ ] Any approved visual change flows through **source** (`*.meta.ts` / `src/tokens/*` / component `.css`) → pipeline, never a generated file.
- [ ] Storybook remains the **only** source of visual truth; Figma is a reproduction, never a redesign — no "improve/modernize/beautify" edits.
- [ ] Zero manual edits to `figma/**`, `src/generated/**`, `src/tokens/generated/**`, `figma/plugin/code.js`.
- [ ] Token usage stays semantic: `var(--tds-*)` only; dot-notation ids in source map to `--tds-*` (web) and `/`-notation (Figma) — no new hardcoded value.

## 7. Storybook ↔ Figma sync gate

Owners: [04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md), [05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md), [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md); contract [figma/README.md](../../figma/README.md).

- [ ] Ran `npm run figma:build`; harness printed `HEADLESS VERIFICATION PASSED` (component-set count, variant combinations, variable/alias resolution, no empty variant, token-styled coverage all pass).
- [ ] Every new/changed variant carries `data-*` via `toDataAttrs` so the plugin can read it.
- [ ] `state` axis excluded from Figma variants; `disabled`/`loading` present as BOOLEAN component props (prevents combinatorial explosion, e.g. Button 4,050+).
- [ ] Components with a `type` (A/B/C) axis split into one Component Set per preset (e.g. `A Type - Card`).
- [ ] `tokenBindings` resolve to real Variable ids; each `when {}` filter scopes the correct axis-combination ([06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md)).
- [ ] Token collections emit in order Primitives → Semantic → Theme(light/dark); Theme colors alias into Primitives via `VARIABLE_ALIAS`, no forward/missing alias.
- [ ] `figma/tds.plugin.json` regenerated (not hand-edited); `git diff` clean after rebuild.
- [ ] `.ai/FIGMA_MAPPING.json` / [.ai/PLUGIN_INDEX.json](../../.ai/PLUGIN_INDEX.json) reconciled if coverage/pages changed ([27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md)).

## 8. Cross-cutting quality gates (a11y · security · performance)

### 8-A Accessibility gate

Owner: [13_ACCESSIBILITY_SPECIFICATION.md](./13_ACCESSIBILITY_SPECIFICATION.md); interaction detail [11_INTERACTION_SPECIFICATION.md](./11_INTERACTION_SPECIFICATION.md).

- [ ] Storybook **addon-a11y** (axe) panel clean for every touched story — 0 violations.
- [ ] Correct semantics/ARIA; interactive elements keyboard-reachable and operable (`useKeyDown`, `useDisclosure`, `useFocusTrap` where apt).
- [ ] Visible focus (`:focus-visible`) preserved via tokens; focus order sane; focus trap correct for overlays.
- [ ] Labels/errors via `FormField`; color is not the sole signal; contrast holds in both `light` and `dark` themes.
- [ ] `prefers-reduced-motion` honored for any motion ([10_ANIMATION_SPECIFICATION.md](./10_ANIMATION_SPECIFICATION.md)); target WCAG AA ([13_ACCESSIBILITY_SPECIFICATION.md](./13_ACCESSIBILITY_SPECIFICATION.md)).

### 8-B Security gate

Owner: [22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md).

- [ ] No secrets/tokens/keys committed; no `.env` introduced for the frontend.
- [ ] No untrusted `dangerouslySetInnerHTML`/unsanitized HTML; user text rendered as text.
- [ ] Dependencies unchanged except when required (runtime deps are only `react` + `react-dom`); new dep justified & reviewed (supply chain).
- [ ] Figma plugin keeps `networkAccess: none` in `figma/plugin/manifest.json`; the plugin ships no data exfiltration.
- [ ] **PLANNED backend security** (RLS, auth, secrets, edge functions) — do not fabricate; defer to [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md), [15_API_GUIDE.md](./15_API_GUIDE.md), [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md).

### 8-C Performance gate

Owner: [23_PERFORMANCE_GUIDE.md](./23_PERFORMANCE_GUIDE.md).

- [ ] CSS stays **zero-runtime**, token-driven; no inline style computing what a token could ([08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md)).
- [ ] No unnecessary re-renders; memoize/stabilize handlers where hooks warrant; charts stay SVG (`src/utils/chart.ts`).
- [ ] `npm run build` bundle not bloated by a new heavy dependency; tree-shakeable barrel imports preserved.
- [ ] `npm run figma:build` completes within normal time; no accidental O(n²) in a `scripts/*` generator.
- [ ] **PLANNED backend/scale** (>10,000,000 users) perf — [23_PERFORMANCE_GUIDE.md](./23_PERFORMANCE_GUIDE.md) §PLANNED, [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md).

## 9. Failure Recovery

| Symptom | Diagnosis | Fix | Resume |
| --- | --- | --- | --- |
| Pre-commit box won't go green without touching `figma/**` or `src/generated/**` | Trying to edit a generated output (violates R2) | Revert the hand-edit; change the **source** (`*.meta.ts`/`src/tokens/*`/`.css`/`scripts/*`); rebuild | `npm run figma:build` |
| `git diff` dirty after a clean `figma:build` | Stale generated file committed, or a generated file was hand-edited | Restore, re-run build, commit only regenerated output | `npm run ds:build` |
| `figma:build` ends `HEADLESS VERIFICATION FAILED` | Harness invariant broke (often a re-introduced `state` axis or unresolved alias) | Read the `! ` lines; strip `state` from variants / fix alias at source; see [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md) §9 | `npm run plugin:test` |
| `lint`/`format:check` fails | Convention drift (CSF3 story rule, import path, unused var) | Fix per [19_CODE_CONVENTION.md](./19_CODE_CONVENTION.md); `npm run format` | `npm run lint` |
| A visual change slipped in unrequested | Design-Lock breach (R4/§6) | Revert the visual delta; re-open as an explicit, approved source change | Re-run §6 |
| `.ai/*` manifest out of date after change | Skipped R8 reconciliation | Update the affected manifest + `SESSION_SUMMARY.md` + `CHANGELOG.md` | [37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md) |
| Context lost mid-task | No rehydration done | Read [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md) + [.ai/TASKS.json](../../.ai/TASKS.json); re-run `figma:build`; re-enter at §5 | [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md) |
| "Where's the CI / unit test to run?" | None exist — **PLANNED** | Do not fabricate a `test` script; rely on §5.3 gates | [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md), [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md) |

## 10. Dependencies

- **Docs (rules this sheet mirrors)** — [00_MASTER_RULES.md](./00_MASTER_RULES.md), [01_AI_SPECIFICATION.md](./01_AI_SPECIFICATION.md), [02_AI_HARNESS.md](./02_AI_HARNESS.md), [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md), [04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md), [05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md), [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md), [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md), [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md), [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md), [10_ANIMATION_SPECIFICATION.md](./10_ANIMATION_SPECIFICATION.md), [11_INTERACTION_SPECIFICATION.md](./11_INTERACTION_SPECIFICATION.md), [12_RESPONSIVE_SPECIFICATION.md](./12_RESPONSIVE_SPECIFICATION.md), [13_ACCESSIBILITY_SPECIFICATION.md](./13_ACCESSIBILITY_SPECIFICATION.md), [18_FOLDER_STRUCTURE.md](./18_FOLDER_STRUCTURE.md), [19_CODE_CONVENTION.md](./19_CODE_CONVENTION.md), [20_CLEAN_CODE.md](./20_CLEAN_CODE.md), [21_ARCHITECTURE_GUIDE.md](./21_ARCHITECTURE_GUIDE.md), [22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md), [23_PERFORMANCE_GUIDE.md](./23_PERFORMANCE_GUIDE.md), [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md), [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md), [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md), [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md), [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md), [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md), [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md), [32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md), [33_DOCUMENTATION_GUIDE.md](./33_DOCUMENTATION_GUIDE.md), [34_PROJECT_BOOTSTRAP.md](./34_PROJECT_BOOTSTRAP.md), [36_AI_AGENT_SPECIFICATION.md](./36_AI_AGENT_SPECIFICATION.md), [37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md), [38_AI_WORKFLOW.md](./38_AI_WORKFLOW.md), [40_FINAL_OPERATING_MANUAL.md](./40_FINAL_OPERATING_MANUAL.md). **PLANNED:** [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [15_API_GUIDE.md](./15_API_GUIDE.md), [16_NODE_GUIDE.md](./16_NODE_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md), [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md), [35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md).
- **Manifests read/updated** — [.ai/TASKS.json](../../.ai/TASKS.json), [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md), [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md), [.ai/REVIEW_REPORT.md](../../.ai/REVIEW_REPORT.md), [.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json), [.ai/TOKEN_INDEX.json](../../.ai/TOKEN_INDEX.json), [.ai/VARIANT_INDEX.json](../../.ai/VARIANT_INDEX.json), [.ai/FIGMA_MAPPING.json](../../.ai/FIGMA_MAPPING.json), [.ai/PLUGIN_INDEX.json](../../.ai/PLUGIN_INDEX.json).
- **Scripts & gates (repo)** — `npm run ds:build` (`tokens:build`→`manifest:build`→`catalog:build`), `npm run figma:build` (→`plugin:typecheck`→`plugin:build`→`plugin:test`), `npm run build`, `npm run lint`, `npm run format:check`; gate `figma/plugin/test/harness.ts`; contract `figma/README.md`; config `eslint.config.js`, `.prettierrc.json`, `tsconfig.*.json`.

## 11. Template — copy-paste master checklist + task mini-lists

**Master gate (paste into the PR body or a `.ai/TASKS.json` note; tick or mark `[~] N/A — reason`):**

```md
### TDS change checklist  (docs/ai-os/39_AI_CHECKLIST.md)
Pre-task
- [ ] Rehydrated .ai/SESSION_SUMMARY.md + TASKS.json
- [ ] Reuse-first: checked docs/COMPONENTS.md (60 exist) before building
- [ ] Source edit only; visual change (if any) explicitly approved
Per-change
- [ ] Barrel imports @/components; meta React/CSS-free; var(--tds-*) only
- [ ] toDataAttrs for variants; state axis excluded; disabled/loading BOOLEAN
- [ ] FormField / cx / forwardRef where apt; CSF3 story wired
Pre-commit  (ALL must pass)
- [ ] npm run figma:build → HEADLESS VERIFICATION PASSED
- [ ] npm run build + plugin:typecheck pass
- [ ] npm run lint + format:check clean
- [ ] Drift: git diff on figma/ src/generated/ src/tokens/generated/ docs/COMPONENTS.md EMPTY
- [ ] .ai/ manifests + SESSION_SUMMARY.md + CHANGELOG.md reconciled
Cross-cutting
- [ ] Design Lock intact (§6)   - [ ] Storybook↔Figma sync (§7)
- [ ] a11y axe clean (§8-A)     - [ ] security (§8-B)   - [ ] perf (§8-C)
Pre-release (only when versioning)
- [ ] version bumped · CHANGELOG finalized · REVIEW_REPORT no blockers
```

**Task mini-lists (add to the master gate above):**

```md
Add/edit COMPONENT (07):  meta→tsx(+css)→stories→register in metas.ts + tier barrel→ds:build
Add/edit TOKEN     (08):  edit src/tokens/{primitives|semantic}.ts→tokens:build; 3 collections order intact
Add/edit VARIANT   (09):  extend meta axis; toDataAttrs covers it; state stays excluded; plugin:test green
PLUGIN change      (06):  edit figma/plugin/src/*.ts (NOT code.js)→plugin:typecheck→plugin:build→plugin:test
DOCS-only         (33):  [~] N/A plugin:test; still run lint/format; keep catalog & autodocs current
```

## 12. Future Extension

- **Machine-checkable gates.** As tooling lands, promote `[ ]` items to automated checks: a `scripts/verify-drift.ts` that runs the build and fails on a dirty `git diff` of generated paths; a lint rule forbidding deep component imports and hardcoded colors. Each new automation replaces a manual box here and is cited back to this doc.
- **CI wiring (PLANNED).** When `.github/workflows` exists ([25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)), the §5.3 pre-commit gate becomes the required CI job matrix (`figma:build`, `build`, `lint`, `format:check`, drift); this sheet stays the human/agent-readable mirror of that pipeline.
- **Test-pyramid growth (PLANNED).** As `vitest`/`@storybook/test-runner`/Playwright are approved ([24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md)), add their rows to §5.3 and §8; keep them **PLANNED** until installed.
- **Backend gates (PLANNED).** When the Supabase/Node backend for >10,000,000 users materializes ([14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md)–[17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md)), append DB-migration, RLS, API-contract (`.ai/API_SPEC.json`, `.ai/ERD.json`), and load/scale sub-checklists — never before they exist.
- **MCP surfacing (PLANNED).** [35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md) may expose these checklists as a callable gate an MCP agent runs and reports against, so the same list governs local, CI, and remote agents identically.
- **Governance.** This sheet is reviewed whenever any owning doc changes a rule; the `Last-reviewed` field and [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md) track its drift from the specs it condenses.
