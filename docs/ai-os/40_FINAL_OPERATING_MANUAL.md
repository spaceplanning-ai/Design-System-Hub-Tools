---
title: 40 — Final Operating Manual
purpose: The capstone of the TDS AI Operating System; the single entry point that ties every document and manifest together, defines the daily operating loop, and governs how the AI OS is maintained for years.
status: ACTIVE
owner: AI OS
last-reviewed: 2026-07-08 (placeholder — update on every review)
precedence: SYNTHESIS/INDEX. This document orients and links; it never overrides. [00_MASTER_RULES.md](./00_MASTER_RULES.md) remains supreme. Where this manual and any specialized doc disagree on detail, the specialized doc wins; where either conflicts with the constitution, 00 wins.
---

# 40 — Final Operating Manual

> The **operating manual** for the TDS AI Operating System (AI OS). TDS (`package name "tds"`, v0.1.0) is a
> metadata-driven design system — **React 18 + Vite 5 + TypeScript 5 + Storybook 8** — engineered so a Figma
> plugin regenerates the entire system inside Figma with zero manual configuration. **60 components already
> exist** (24 atoms · 27 molecules · 9 organisms). One source of truth (`*.meta.ts` + `src/tokens/*`) feeds four
> outputs: the React component, Storybook, the manifests, and the Figma bundle. This manual is where a new agent
> or engineer **starts**, and where a returning one **re-orients**.

---

## 1. Purpose

This document exists so that any operator — human or AI (Claude Code, Gemini CLI, Cursor, Codex, Windsurf, MCP
agents) — can, from a cold start, understand the whole AI OS and begin working correctly in minutes. It:

1. Names the **reading order** into the 41-document set.
2. Restates the **precedence** and **source-of-truth hierarchy** every agent must obey.
3. Defines the **one-page daily operating loop** that all task work follows.
4. Provides the **complete index** of all 41 documents and all 17 `.ai/` manifests.
5. Supplies a **glossary** and the **governance model** that keeps the AI OS coherent for years.

It is deliberately a synthesis: it duplicates no rule in full, it *points* to the owning document. When in doubt,
follow the link.

---

## 2. Responsibilities

- **Orientation** — be the first file a new operator reads after [00_MASTER_RULES.md](./00_MASTER_RULES.md).
- **Navigation** — maintain the authoritative index of every doc and manifest with a one-line purpose each.
- **The operating loop** — define the canonical intake → deliver cycle and the gates it must pass.
- **Governance** — define how the AI OS itself is amended, versioned, reviewed, and kept free of drift.
- It is **not** responsible for domain detail (tokens, components, plugin, backend…). Those live in the specialized
  docs indexed in Section 6.

---

## 3. Scope

### In scope
- The whole `docs/ai-os/` document set (00–40) and the whole `.ai/` manifest set.
- The daily operating loop for both frontend (ACTIVE) and the PLANNED backend surface.
- The maintenance/governance of the AI OS as a living artifact.

### Out of scope
- Any rule statement that would contradict or weaken a specialized doc or the constitution.
- Repo facts not yet true. Backend, database, Supabase, REST/GraphQL/RPC, auth, `.env`/secrets, CI (`.github`), and
  a unit-test framework (vitest/playwright/jest) are all **PLANNED** — they do **not** exist today. Runtime deps are
  only `react` + `react-dom`; the only automated test today is the headless plugin harness
  `figma/plugin/test/harness.ts`.

---

## 4. Rules

1. **MUST read [00_MASTER_RULES.md](./00_MASTER_RULES.md) first.** It is the constitution and overrides everything.
2. **MUST obey precedence** (Section 5) and the **source-of-truth hierarchy**:
   1. `00_MASTER_RULES.md` (constitution) →
   2. Storybook + `*.meta.ts` / `src/tokens/*` sources →
   3. generated manifests (`src/generated/design-system.manifest.json`, `figma/tds.plugin.json`, `src/tokens/generated/*`) →
   4. Figma (a reproduction; lowest, never flows back up).
   The `.ai/` manifests are the AI cache/state layer, always reconciled *from* sources 2–3.
3. **NEVER violate the Design Lock.** Storybook is the ONLY source of visual truth and is immutable; Figma is a
   pixel-perfect reproduction, never a redesign. The AI NEVER redesigns, modernizes, beautifies, "improves" the UI,
   or changes layout/spacing/colors/typography/radius/shadows/motion, and NEVER renames any token, component,
   variant, or variable on its own initiative. All visual change is a **source** change that flows down the pipeline.
4. **NEVER hand-edit generated outputs** — `figma/*`, `src/generated/*`, `src/tokens/generated/*`,
   `figma/plugin/code.js`. Change the source and re-run the build.
5. **MUST reuse first.** Consult [.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json) and
   [docs/COMPONENTS.md](../COMPONENTS.md) before building anything. Import components only from the barrel
   `@/components`.
6. **MUST style with tokens only** — `var(--tds-*)`; never hardcode colors/spacing/radius/shadow.
7. **MUST pass the gates** before declaring work done: `npm run lint`, `npm run build` (typecheck), `npm run ds:build`,
   and — for anything touching components/tokens/figma — `npm run figma:build` (which runs the headless
   `plugin:test`).
8. **MUST update the `.ai/` state** after a change: regenerate the data-derived manifests
   (`scripts/build-ai-manifests.ts`) and refresh [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md),
   [.ai/TASKS.json](../../.ai/TASKS.json), and [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md).
9. **SHOULD delegate** heavy work to the subagents `@tds-component` and `@figma-plugin`
   (see [36_AI_AGENT_SPECIFICATION.md](./36_AI_AGENT_SPECIFICATION.md)).
10. **MUST mark PLANNED** any backend/DB/API/CI/test-framework content; never assert it exists today.

---

## 5. Workflow — the recommended reading order & the one-page operating loop

### 5.1 Reading order for a new operator

1. [00_MASTER_RULES.md](./00_MASTER_RULES.md) — the constitution (non-negotiable).
2. **This file** (40) — orientation, index, the operating loop.
3. [01_AI_SPECIFICATION.md](./01_AI_SPECIFICATION.md) + [02_AI_HARNESS.md](./02_AI_HARNESS.md) — how an agent behaves and runs.
4. [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md) — the system + the full Design Lock.
5. [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md) + [37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md) — read manifests before source.
6. The domain doc(s) for your task (components → 07, tokens → 08, variants → 09, Storybook → 04, Figma → 05, plugin → 06…).
7. [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md) + [39_AI_CHECKLIST.md](./39_AI_CHECKLIST.md) — execute and verify.

### 5.2 The one-page daily operating loop

```text
┌─ 1. INTAKE ───────── read the task; classify (component | token | variant | story | figma | docs | backend[PLANNED])
│
├─ 2. HYDRATE ──────── read .ai/ first: SESSION_SUMMARY.md → PROJECT_MANIFEST.json → the task-specific index
│                      (COMPONENT_INDEX / TOKEN_INDEX / VARIANT_INDEX / FIGMA_MAPPING). Read docs/COMPONENTS.md.
│                      Open component/token SOURCE only when the manifest/catalog cannot answer.
│
├─ 3. PLAN ─────────── smallest source-only change that satisfies the task. Reuse-first. No new component if one fits.
│
├─ 4. IMPLEMENT ────── edit SOURCE only: *.meta.ts / *.tsx / *.css / *.stories.tsx / src/tokens/*.
│                      Use toDataAttrs(meta,{...}); var(--tds-*) tokens; import from @/components; wrap inputs in FormField.
│                      NEVER touch generated outputs. NEVER redesign (Design Lock).
│
├─ 5. BUILD/GATE ───── npm run lint → npm run build (typecheck) → npm run ds:build → npm run figma:build (plugin:test).
│                      All must pass. Fix at the SOURCE, never in generated files.
│
├─ 6. SYNC STATE ───── npm run ai:manifests (scripts/build-ai-manifests.ts) → update SESSION_SUMMARY.md, TASKS.json,
│                      CHANGELOG.md, and (on review) REVIEW_REPORT.md.
│
├─ 7. REVIEW ───────── self-review vs Design Lock + reuse-first + token-only + a11y + sync (see 30 & 39). Human gate if required.
│
└─ 8. COMMIT ───────── conventional commit; small, reviewable; reference the task id from TASKS.json.
```

If context is lost at any step, resume via [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md): read
`.ai/SESSION_SUMMARY.md` → `.ai/TASKS.json`, find the in-progress task and its last checkpoint, and re-enter the loop
at the next step. Every step is idempotent.

---

## 6. Examples — the complete index

### 6.1 All 41 documents (`docs/ai-os/`)

**Constitution & AI core**

| Doc | Purpose |
| --- | --- |
| [00_MASTER_RULES.md](./00_MASTER_RULES.md) | The constitution: precedence, source-of-truth hierarchy, Design Lock, reuse-first, generated-is-sacred. |
| [01_AI_SPECIFICATION.md](./01_AI_SPECIFICATION.md) | What an AI agent IS/MUST do: operating contract, read-before-write, determinism, escalation. |
| [02_AI_HARNESS.md](./02_AI_HARNESS.md) | The execution harness: tools, context assembly, `.ai/` read/write cycle, guardrails, validation gates. |

**Design & UI**

| Doc | Purpose |
| --- | --- |
| [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md) | Canonical TDS description + the full immutable Design Lock; `type` (A/B/C) vs `variant` ("Style"). |
| [04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md) | Storybook = ONLY source of truth; the complete story/CSF/MDX/controls/a11y rulebook. |
| [05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md) | Figma as a faithful reproduction of Storybook; no manual authoring. |
| [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md) | The Figma plugin that rebuilds the system automatically from the bundle. |
| [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md) | Component anatomy (5 files), the meta model, adding/editing, reuse-first. |
| [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md) | Token model, 3 collections + effect/text styles, `--tds-*`, generation, adding a token. |
| [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md) | Variant axes, `type/variant/tone/size/shape`, the state-axis exclusion policy, Figma mapping. |
| [10_ANIMATION_SPECIFICATION.md](./10_ANIMATION_SPECIFICATION.md) | Motion tokens, reduced-motion, Figma-reproducibility limits. |
| [11_INTERACTION_SPECIFICATION.md](./11_INTERACTION_SPECIFICATION.md) | Interaction states, keyboard/focus, disclosure hooks, Storybook play, Figma interactions. |
| [12_RESPONSIVE_SPECIFICATION.md](./12_RESPONSIVE_SPECIFICATION.md) | Breakpoint tokens, mobile/tablet/desktop, `useMediaQuery`, viewports, Figma constraints. |
| [13_ACCESSIBILITY_SPECIFICATION.md](./13_ACCESSIBILITY_SPECIFICATION.md) | ARIA, keyboard nav, focus-visible, focus trap, reduced-motion, addon-a11y, WCAG targets. |

**Backend — PLANNED (does not exist today)**

| Doc | Purpose |
| --- | --- |
| [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md) | PLANNED Postgres/Supabase schema, migrations, RLS, indexing, 10M-user scaling, ERD contract. |
| [15_API_GUIDE.md](./15_API_GUIDE.md) | PLANNED API layer (REST/RPC over Supabase + Node/TS), contracts, versioning, `API_SPEC.json`. |
| [16_NODE_GUIDE.md](./16_NODE_GUIDE.md) | PLANNED Node ≥20 / TS backend conventions, structure, runtime, observability. |
| [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md) | PLANNED Supabase (Auth/Postgres/RLS/Storage/Edge Functions/Realtime), client patterns, scaling. |

**Engineering standards**

| Doc | Purpose |
| --- | --- |
| [18_FOLDER_STRUCTURE.md](./18_FOLDER_STRUCTURE.md) | Canonical repo layout, where new files go, aliases, generated-vs-source, `docs/ai-os/` + `.ai/`. |
| [19_CODE_CONVENTION.md](./19_CODE_CONVENTION.md) | TS/React/CSS conventions grounded in eslint/prettier/tsconfig. |
| [20_CLEAN_CODE.md](./20_CLEAN_CODE.md) | Clean-code adapted: pure metas, reuse-first, single source of truth, generate-not-handwrite. |
| [21_ARCHITECTURE_GUIDE.md](./21_ARCHITECTURE_GUIDE.md) | End-to-end architecture; FE↔BE(PLANNED) sync; layering; scaling to >10M users. |
| [22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md) | Frontend + PLANNED backend security (RLS, auth, secrets, supply chain, plugin `networkAccess:none`). |
| [23_PERFORMANCE_GUIDE.md](./23_PERFORMANCE_GUIDE.md) | Zero-runtime CSS, bundle/build perf, SVG charts, PLANNED backend perf & scaling. |
| [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md) | Current headless harness; PLANNED interaction/visual/unit/e2e; test pyramid; coverage gates. |
| [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md) | PLANNED CI/CD, the pipeline gates, release automation, environments, IaC. |

**AI memory & operations**

| Doc | Purpose |
| --- | --- |
| [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md) | Minimize AI token/context usage: manifest-first, catalog-first, caching, minimal diffs. |
| [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md) | Master spec of the `.ai/` manifest system (per-manifest schema/rules/example). |
| [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md) | Resume-after-context-loss: `SESSION_SUMMARY.md`, `TASKS.json`, checkpoints, idempotency. |
| [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md) | Task lifecycle and its gates; `TASKS.json` states; implementation order. |
| [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md) | Review + approval gates, `REVIEW_REPORT.md`, drift checks, what blocks merge. |
| [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md) | Change control/propagation, versioning, deprecation, migration, `CHANGELOG.md`. |
| [32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md) | Release/versioning (semver), build/publish, rollback, release checklist. |
| [33_DOCUMENTATION_GUIDE.md](./33_DOCUMENTATION_GUIDE.md) | Documentation standards; the doc set, catalog, autodocs/MDX; keeping docs in sync. |
| [34_PROJECT_BOOTSTRAP.md](./34_PROJECT_BOOTSTRAP.md) | Cold-start bootstrap + full implementation/compile/lint/typecheck/test/deploy strategy. |
| [35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md) | MCP: read/update manifests, recover sessions, sync Storybook↔Figma, minimize tokens, cache. |
| [36_AI_AGENT_SPECIFICATION.md](./36_AI_AGENT_SPECIFICATION.md) | Agent roster (`@tds-component`, `@figma-plugin`, + roles), contracts, delegation. |
| [37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md) | The `.ai/` memory system: structure, read/write cycle, precedence, hygiene. |
| [38_AI_WORKFLOW.md](./38_AI_WORKFLOW.md) | Canonical recipes: add component, edit variant, add token, sync Figma, resume, review. |
| [39_AI_CHECKLIST.md](./39_AI_CHECKLIST.md) | Master checklists: pre-task, per-change, pre-commit, pre-release, design-lock, sync, a11y, security, perf. |
| [40_FINAL_OPERATING_MANUAL.md](./40_FINAL_OPERATING_MANUAL.md) | **This file** — capstone: reading order, operating loop, complete index, glossary, governance. |

### 6.2 All 17 `.ai/` manifests

| Manifest | Purpose | Kind |
| --- | --- | --- |
| [PROJECT_MANIFEST.json](../../.ai/PROJECT_MANIFEST.json) | Root project descriptor: stack, scripts, aliases, structure, source-of-truth hierarchy. | DATA-DERIVED |
| [DESIGN_MANIFEST.json](../../.ai/DESIGN_MANIFEST.json) | Design-system summary: counts by tier, axis vocabulary, token collections, Design Lock stamp. | DATA-DERIVED |
| [COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json) | The reuse-first index of all 60 components (axes, props, tags, source paths). Read this before source. | DATA-DERIVED |
| [TOKEN_INDEX.json](../../.ai/TOKEN_INDEX.json) | All tokens by collection with type + `--tds-*` CSS var + Figma name; effect/text styles. | DATA-DERIVED |
| [FIGMA_MAPPING.json](../../.ai/FIGMA_MAPPING.json) | Storybook→Figma mapping: component sets (incl. type-preset splits), pages, properties. | DATA-DERIVED |
| [PLUGIN_INDEX.json](../../.ai/PLUGIN_INDEX.json) | The plugin module map, entry, build command, harness path, `manifest.json` settings. | DATA-DERIVED |
| [VARIANT_INDEX.json](../../.ai/VARIANT_INDEX.json) | Variant axis vocabulary + per-component axes and combo counts; state-axis exclusion. | DATA-DERIVED |
| [DEPENDENCY_GRAPH.json](../../.ai/DEPENDENCY_GRAPH.json) | Build/dependency graph: source→script→generated edges, aliases, deps. | DATA-DERIVED |
| [RESPONSIVE_RULES.json](../../.ai/RESPONSIVE_RULES.json) | Breakpoints/device tiers, `useMediaQuery` contract, token-driven responsive rules. | SEED |
| [INTERACTION_RULES.json](../../.ai/INTERACTION_RULES.json) | State set, keyboard patterns, disclosure/focus hooks, play-test note, Figma exclusion. | SEED |
| [ANIMATION_RULES.json](../../.ai/ANIMATION_RULES.json) | Duration/easing token ids, reduced-motion, Figma-reproducibility flags. | SEED |
| [ERD.json](../../.ai/ERD.json) | PLANNED example entity-relationship model for the future Supabase/Postgres backend. | SEED · PLANNED |
| [API_SPEC.json](../../.ai/API_SPEC.json) | PLANNED example OpenAPI-shaped contract for the future API. | SEED · PLANNED |
| [TASKS.json](../../.ai/TASKS.json) | The live task ledger + task schema; the resume anchor with `SESSION_SUMMARY.md`. | SEED |
| [SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md) | The resume anchor: current state, exists-vs-planned, next actions, rehydration steps. | SEED |
| [CHANGELOG.md](../../.ai/CHANGELOG.md) | Keep-a-Changelog history; semver per `32_RELEASE_GUIDE.md`. | SEED |
| [REVIEW_REPORT.md](../../.ai/REVIEW_REPORT.md) | Review-report template + seed entry; regenerated per review. | SEED |

DATA-DERIVED manifests are regenerated from source by [`scripts/build-ai-manifests.ts`](../../scripts/build-ai-manifests.ts)
(`npm run ai:manifests`). SEED/PLANNED manifests are maintained by humans/agents and are never overwritten by the generator.

---

## 7. Validation Rules

- **MUST** verify all 41 docs and 17 manifests exist and, for JSON, parse cleanly (see the audit recipe in Section 11).
- **MUST** run `npm run lint && npm run build && npm run ds:build && npm run figma:build` — all green — before any release.
- **MUST** confirm the data-derived manifests match source after `npm run ai:manifests` (no uncommitted drift).
- **SHOULD** run a cross-reference check: every `[..](./NN_*.md)` link resolves to an existing file.
- **SHOULD** confirm no doc asserts a PLANNED capability as existing.
- Automated gate today: the headless plugin harness (`npm run plugin:test`) — it `process.exit(1)`s on any coverage
  mismatch and is the enforceable Storybook↔Figma fidelity check.

---

## 8. Checklist

- [ ] Read `00_MASTER_RULES.md`, then this manual.
- [ ] Hydrated from `.ai/` (SESSION_SUMMARY → PROJECT_MANIFEST → task index) before opening source.
- [ ] Change is source-only; no generated file hand-edited.
- [ ] Design Lock respected — no unrequested visual/naming change.
- [ ] Reuse-first honored — checked `COMPONENT_INDEX.json` / `docs/COMPONENTS.md`.
- [ ] Tokens only (`var(--tds-*)`); imports via `@/components`.
- [ ] Gates green: `lint`, `build`, `ds:build`, `figma:build`.
- [ ] `.ai/` state synced (`ai:manifests`, SESSION_SUMMARY, TASKS, CHANGELOG).
- [ ] Reviewed per `30_REVIEW_SYSTEM.md`; `REVIEW_REPORT.md` updated if a gate applies.
- [ ] Commit is small, conventional, and references the task id.

---

## 9. Failure Recovery

| Symptom | Diagnosis | Fix | Resume |
| --- | --- | --- | --- |
| Lost context mid-task | Session/context reset | Read `.ai/SESSION_SUMMARY.md` → `.ai/TASKS.json`; find in-progress task + last checkpoint | Re-enter the loop (Section 5.2) at the next step; steps are idempotent |
| `figma:build` fails at `plugin:test` | Manifest/token drift or a source change not reflected | Re-run `npm run ds:build`; fix the **source** (meta/token/CSS), never the generated file | Re-run `figma:build` until green |
| Generated file looks wrong | Someone hand-edited a generated output | Revert it; change the source and re-run the build | Re-run the owning build script |
| `.ai/` manifest stale | Source changed without regen | `npm run ai:manifests` | Commit refreshed manifests |
| Doc/link broken | A referenced doc was renamed/missing | Restore the file or fix the link to the real filename | Re-run the cross-reference check (Section 11) |
| Backend content assumed present | A doc treated PLANNED as ACTIVE | Correct the doc to mark it PLANNED | — |
| A generation agent died mid-run (e.g. session limit) | Partial output | Audit disk (files often written before the failure); regenerate only the truly-missing files | Re-run just the missing pieces |

---

## 10. Dependencies

- **Supreme:** [00_MASTER_RULES.md](./00_MASTER_RULES.md).
- **Directly synthesized:** every doc 01–39 (indexed in Section 6.1).
- **Manifests:** all 17 `.ai/` files (Section 6.2), the generator
  [`scripts/build-ai-manifests.ts`](../../scripts/build-ai-manifests.ts), and the directory guide
  [.ai/README.md](../../.ai/README.md) + [docs/ai-os/README.md](./README.md).
- **Real repo mechanisms:** the npm scripts (`ds:build`, `figma:build`, `lint`, `build`, `ai:manifests`), the barrel
  `@/components`, the aliases, and the headless harness `figma/plugin/test/harness.ts`.

---

## 11. Template — the AI-OS integrity audit

Run this any time to confirm the AI OS is intact:

```bash
# 1. All 41 docs present + complete (each has its section 12)?
for n in $(seq -w 0 40); do
  f=$(ls docs/ai-os/${n}_*.md 2>/dev/null)
  [ -z "$f" ] && { echo "MISSING doc $n"; continue; }
  grep -q "^## 12" "$f" || echo "INCOMPLETE $f (no section 12)"
done

# 2. All .ai JSON parse?
for f in .ai/*.json; do node -e "JSON.parse(require('fs').readFileSync('$f','utf8'))" \
  && echo "OK $f" || echo "BAD $f"; done

# 3. Data-derived manifests match source?
npm run ai:manifests && git diff --stat .ai/

# 4. The design-system + Figma gates?
npm run ds:build && npm run figma:build
```

---

## 12. Future Extension

- **Backend activation.** When docs 14–17 move from PLANNED to ACTIVE, add a "Backend" reading-order branch here and
  index the new `.ai` artifacts (real `ERD.json` / `API_SPEC.json`) as DATA-DERIVED; wire their generators into
  `ai:manifests` and their gates into CI ([25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)).
- **Scale to >10M users.** As the system grows, this manual stays a thin index; depth continues to live in the
  specialized docs so token cost per read stays low. Consider splitting very large indexes (60+ components) into
  paginated manifests read on demand.
- **New agents/tools.** New AI clients or MCP tools register in [36_AI_AGENT_SPECIFICATION.md](./36_AI_AGENT_SPECIFICATION.md)
  and [35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md); this manual only adds a one-line index entry.
- **Governance.** Amendments to the constitution follow the process in [00_MASTER_RULES.md](./00_MASTER_RULES.md) and
  [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md): propose → human approval → version bump
  ([32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md)) → `CHANGELOG.md`. Review cadence: re-review the AI OS on every
  release and at least quarterly; update each doc's `last-reviewed`. Drift is detected by the audit in Section 11 and
  the review system in [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md).

---

*End of the TDS AI Operating System. Start again at [00_MASTER_RULES.md](./00_MASTER_RULES.md).*
