# TDS AI Operating System (AI OS)

> The permanent engineering standard for the **TDS** repository — a metadata-driven design system
> (**React 18 + Vite 5 + TypeScript 5 + Storybook 8**) engineered so a Figma plugin regenerates the entire
> system in Figma with zero manual config. **60 components already exist** (24 atoms · 27 molecules · 9 organisms).
> One source of truth (`*.meta.ts` + `src/tokens/*`) feeds four outputs: the React component, Storybook, the
> manifests, and the Figma bundle.

This folder (`docs/ai-os/`) is the **document set** every AI agent (Claude Code, Gemini CLI, Cursor, Codex, Windsurf,
MCP agents) and every human engineer follows. The machine-readable state lives next door in [`.ai/`](../../.ai/).

---

## Start here

1. **[00_MASTER_RULES.md](./00_MASTER_RULES.md)** — the constitution. It overrides everything. Read it first.
2. **[40_FINAL_OPERATING_MANUAL.md](./40_FINAL_OPERATING_MANUAL.md)** — the capstone: reading order, the one-page
   daily operating loop, the complete index of all docs + manifests, glossary, and governance.

Then read the domain doc for your task (components → 07, tokens → 08, variants → 09, Storybook → 04, Figma → 05,
plugin → 06) and execute per [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md) + [39_AI_CHECKLIST.md](./39_AI_CHECKLIST.md).

---

## The three laws (from [00_MASTER_RULES.md](./00_MASTER_RULES.md))

1. **Design Lock.** Storybook is the ONLY source of visual truth and is immutable; Figma is a pixel-perfect
   reproduction, never a redesign. The AI NEVER redesigns, recolors, reproportions, or renames anything on its own
   initiative. All visual change is a **source** change that flows down the pipeline.
2. **Generated is sacred.** Never hand-edit `figma/*`, `src/generated/*`, `src/tokens/generated/*`,
   `figma/plugin/code.js`. Change the source and re-run the build.
3. **Reuse first, tokens only.** Consult [.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json) and
   [docs/COMPONENTS.md](../COMPONENTS.md) before building; import from the barrel `@/components`; style only with
   `var(--tds-*)`.

**Source-of-truth hierarchy (highest first):** `00_MASTER_RULES.md` → Storybook + `*.meta.ts`/`src/tokens/*` →
generated manifests → Figma (a reproduction; never flows back up). The `.ai/` manifests are the AI cache/state layer,
always reconciled from source.

---

## Document map

| Group | Docs |
| --- | --- |
| **Constitution & AI core** | [00_MASTER_RULES](./00_MASTER_RULES.md) · [01_AI_SPECIFICATION](./01_AI_SPECIFICATION.md) · [02_AI_HARNESS](./02_AI_HARNESS.md) |
| **Design & UI** | [03_DESIGN_SYSTEM](./03_DESIGN_SYSTEM.md) · [04_STORYBOOK_SPECIFICATION](./04_STORYBOOK_SPECIFICATION.md) · [05_FIGMA_SPECIFICATION](./05_FIGMA_SPECIFICATION.md) · [06_PLUGIN_SPECIFICATION](./06_PLUGIN_SPECIFICATION.md) · [07_COMPONENT_SPECIFICATION](./07_COMPONENT_SPECIFICATION.md) · [08_TOKEN_SPECIFICATION](./08_TOKEN_SPECIFICATION.md) · [09_VARIANT_SPECIFICATION](./09_VARIANT_SPECIFICATION.md) · [10_ANIMATION_SPECIFICATION](./10_ANIMATION_SPECIFICATION.md) · [11_INTERACTION_SPECIFICATION](./11_INTERACTION_SPECIFICATION.md) · [12_RESPONSIVE_SPECIFICATION](./12_RESPONSIVE_SPECIFICATION.md) · [13_ACCESSIBILITY_SPECIFICATION](./13_ACCESSIBILITY_SPECIFICATION.md) |
| **Backend — PLANNED** | [14_DATABASE_GUIDE](./14_DATABASE_GUIDE.md) · [15_API_GUIDE](./15_API_GUIDE.md) · [16_NODE_GUIDE](./16_NODE_GUIDE.md) · [17_SUPABASE_GUIDE](./17_SUPABASE_GUIDE.md) |
| **Engineering standards** | [18_FOLDER_STRUCTURE](./18_FOLDER_STRUCTURE.md) · [19_CODE_CONVENTION](./19_CODE_CONVENTION.md) · [20_CLEAN_CODE](./20_CLEAN_CODE.md) · [21_ARCHITECTURE_GUIDE](./21_ARCHITECTURE_GUIDE.md) · [22_SECURITY_GUIDE](./22_SECURITY_GUIDE.md) · [23_PERFORMANCE_GUIDE](./23_PERFORMANCE_GUIDE.md) · [24_TESTING_GUIDE](./24_TESTING_GUIDE.md) · [25_DEVOPS_GUIDE](./25_DEVOPS_GUIDE.md) |
| **AI memory & operations** | [26_TOKEN_OPTIMIZATION](./26_TOKEN_OPTIMIZATION.md) · [27_MANIFEST_SPECIFICATION](./27_MANIFEST_SPECIFICATION.md) · [28_RESUME_SPECIFICATION](./28_RESUME_SPECIFICATION.md) · [29_TASK_EXECUTION](./29_TASK_EXECUTION.md) · [30_REVIEW_SYSTEM](./30_REVIEW_SYSTEM.md) · [31_CHANGE_MANAGEMENT](./31_CHANGE_MANAGEMENT.md) · [32_RELEASE_GUIDE](./32_RELEASE_GUIDE.md) · [33_DOCUMENTATION_GUIDE](./33_DOCUMENTATION_GUIDE.md) · [34_PROJECT_BOOTSTRAP](./34_PROJECT_BOOTSTRAP.md) · [35_MCP_SPECIFICATION](./35_MCP_SPECIFICATION.md) · [36_AI_AGENT_SPECIFICATION](./36_AI_AGENT_SPECIFICATION.md) · [37_AI_MEMORY_SYSTEM](./37_AI_MEMORY_SYSTEM.md) · [38_AI_WORKFLOW](./38_AI_WORKFLOW.md) · [39_AI_CHECKLIST](./39_AI_CHECKLIST.md) · [40_FINAL_OPERATING_MANUAL](./40_FINAL_OPERATING_MANUAL.md) |

Every numbered doc follows the same 12-section structure: **Purpose · Responsibilities · Scope · Rules · Workflow ·
Examples · Validation Rules · Checklist · Failure Recovery · Dependencies · Template · Future Extension** — see
[40_FINAL_OPERATING_MANUAL.md](./40_FINAL_OPERATING_MANUAL.md) §6.1 for a one-line purpose of each.

---

## The `.ai/` runtime state

The [`.ai/`](../../.ai/) directory holds 17 machine-readable manifests — the AI memory/cache/state layer. Read
[.ai/README.md](../../.ai/README.md) for the directory guide, and [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md)
+ [37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md) for the full spec. The data-derived manifests are regenerated
from source by [`scripts/build-ai-manifests.ts`](../../scripts/build-ai-manifests.ts) (`npm run ai:manifests`); the
seed/planned ones are maintained by hand.

---

## Keeping it in sync

- Change **source** only; re-run `npm run ds:build` (tokens + manifest + catalog) and `npm run figma:build`
  (adds typecheck + plugin bundle + the headless `plugin:test` gate).
- Regenerate AI state with `npm run ai:manifests` and update `.ai/SESSION_SUMMARY.md`, `.ai/TASKS.json`,
  `.ai/CHANGELOG.md`.
- Re-review the AI OS on every release and at least quarterly; bump each doc's `last-reviewed`. Run the integrity
  audit in [40_FINAL_OPERATING_MANUAL.md](./40_FINAL_OPERATING_MANUAL.md) §11 to catch drift.

> **PLANNED, not present today:** any backend/database/Supabase/API/auth, CI (`.github`), and a unit-test framework
> (vitest/playwright/jest). Runtime deps are only `react` + `react-dom`; the only automated test today is the headless
> plugin harness `figma/plugin/test/harness.ts`. Docs 14–17 and 25 describe the future standard and are marked PLANNED.
