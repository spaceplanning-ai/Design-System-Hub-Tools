<!--
title: AI Specification
Purpose: Defines what an AI agent operating in the TDS repository IS and MUST do — the operating contract, capabilities, hard limits, read-before-write rule, determinism, no-drift guarantees, manifest consultation, token-budget discipline, and human escalation.
Status: ACTIVE
Owner: AI OS
Last-reviewed: 2026-07-08 (placeholder — update on each review)
Precedence: Subordinate to [00_MASTER_RULES.md](./00_MASTER_RULES.md) (the constitution). This document governs AI-agent behavior; where any instruction here conflicts with 00_MASTER_RULES.md, the constitution wins. This document overrides ad-hoc prompts and agent chatter.
-->

# 01 — AI Specification

> **The operating contract for every AI agent that touches this repository.**
> TDS is a metadata-driven design system (package `tds`, v0.1.0, ESM, Node >=20) where **one source of truth feeds four outputs**: each component's pure-data `*.meta.ts` drives the React component, Storybook, and the Figma manifest; tokens authored in TypeScript generate web CSS and the Figma bundle. **60 components already exist** (24 atoms, 27 molecules, 9 organisms). Your job is almost always *reuse and regeneration*, never redesign.

---

## 1. Purpose

This document defines the identity, obligations, and hard limits of any AI agent (Claude Code, Gemini CLI, Cursor, Codex, Windsurf, an MCP client, or a delegated subagent such as `@tds-component` / `@figma-plugin`) operating inside the TDS repository. It exists so that:

1. Every agent behaves **deterministically and identically** given the same repository state, regardless of which model or tool front-end is driving.
2. No agent introduces **design drift**, **duplicated components**, **inconsistent implementations**, or **hand-edits to generated outputs**.
3. Every agent **reads the manifests and catalog before writing**, keeping AI token/context usage minimal and resume-after-context-loss reliable.
4. There is a single, unambiguous **escalation path to a human** when a task would require a visual-design decision, a new backend surface (all PLANNED), or a change the agent cannot make without violating the Design Lock.

This is the "who you are and what you may do" layer. *How* you execute (tools, context assembly, guardrail order) is [02_AI_HARNESS.md](./02_AI_HARNESS.md); *what work looks like* is [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md) and [38_AI_WORKFLOW.md](./38_AI_WORKFLOW.md).

---

## 2. Responsibilities

Every AI agent operating in TDS is responsible for:

- **Reuse-first discovery.** Consult [docs/COMPONENTS.md](../COMPONENTS.md) (the generated catalog) and [.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json) *before* proposing to build anything. 60 components exist; the default answer to "build a UI" is "compose existing components."
- **Read-before-write.** Load the relevant `.ai/*` manifests and the smallest set of source files needed, and never mutate a file whose current contents you have not read.
- **Determinism.** Produce the same change for the same request and repo state. Prefer editing sources and re-running builds over free-hand output.
- **Design-Lock enforcement.** Treat Storybook + the `*.meta.ts` / `src/tokens/*` sources as immutable visual truth. Never redesign on your own initiative (see Rules).
- **Generated-is-sacred.** Never hand-edit `figma/*`, `src/generated/*`, `src/tokens/generated/*`, or `figma/plugin/code.js`. Change the source, then run the correct build script.
- **Correct-barrel discipline.** Import components only from `@/components`; keep `*.meta.ts` React/CSS-free with relative imports only.
- **Manifest reconciliation.** After any source change, regenerate and reconcile the `.ai/*` cache and the generated manifests so downstream agents read accurate state.
- **Token-budget discipline.** Answer from manifests/catalog first; open component source only when the catalog cannot answer (see [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md)).
- **Validation before "done."** Run the applicable gate (`lint`, `tsc -b`, `ds:build`, `figma:build`, `plugin:test`) and report the result.
- **Honest PLANNED labeling.** Any backend, database, Supabase, REST/GraphQL/RPC, auth, `.env`, CI, or test-framework content MUST be marked **PLANNED — does not exist in the repo today.**
- **Escalation.** Stop and ask a human when a task requires a visual-design decision, a new PLANNED subsystem, or anything that would break a rule below.

---

## 3. Scope

### In-scope (this document governs)
- The definition of an AI agent's operating contract in TDS.
- Capabilities the agent MAY use and hard limits it MUST NOT cross.
- The read-before-write rule and determinism requirements.
- No-drift and Design-Lock obligations as they bind agent behavior.
- Which `.ai/*` manifests an agent MUST consult and when.
- Token-budget discipline at the policy level.
- The escalation-to-human protocol and its triggers.

### Out-of-scope (governed elsewhere)
- Execution harness mechanics, tool surface, context assembly → [02_AI_HARNESS.md](./02_AI_HARNESS.md).
- The full Design Lock Policy text and design-system canon → [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md).
- Component anatomy / adding a component → [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md).
- Token model / adding a token → [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md).
- Variant axes and the state-axis exclusion policy → [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md).
- Manifest schemas and update/read rules → [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md) and [37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md).
- Resume-after-context-loss mechanics → [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md).
- Agent roster and delegation contracts → [36_AI_AGENT_SPECIFICATION.md](./36_AI_AGENT_SPECIFICATION.md).
- MCP tool surface → [35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md).

---

## 4. Rules

Rules are numbered and enforceable. **MUST** = hard requirement, violation blocks merge. **SHOULD** = strong default, deviation requires a stated reason. **NEVER** = absolute prohibition.

### 4.1 Read-before-write
- **R1 (MUST):** Before editing any file, the agent MUST read its current contents in the same session. No blind writes.
- **R2 (MUST):** Before building UI or a component, the agent MUST consult [docs/COMPONENTS.md](../COMPONENTS.md) and [.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json). Only when neither answers may it open the component's `.meta.ts`, then its `.tsx`/`.css`.
- **R3 (MUST):** Before any task, the agent MUST load [.ai/PROJECT_MANIFEST.json](../../.ai/PROJECT_MANIFEST.json) and the task-relevant indexes (component, token, variant, figma-mapping) — see §4.6.

### 4.2 Design Lock (no drift)
- **R4 (NEVER):** NEVER, on your own initiative, redesign, modernize, beautify, "improve," or restyle the UI — no change to layout, spacing, colors, typography, radius, shadows, or motion. Storybook is the ONLY source of truth and is IMMUTABLE for visual design.
- **R5 (NEVER):** NEVER rename any token, component, variant, axis option, or Figma variable. The Naming Registry (CANON §C) is fixed: axes are `type` (A/B/C), `variant` (labelled "Style"), `tone`, `size`, `shape`, `state`.
- **R6 (MUST):** Any visual change is a **source** change (`*.meta.ts`, `src/tokens/*`, or component CSS) that flows through the pipeline, and MUST be explicitly requested/approved by a human before implementation.

### 4.3 Generated-is-sacred
- **R7 (NEVER):** NEVER hand-edit generated outputs: `figma/tds.plugin.json`, `figma/plugin/code.js`, everything under `src/generated/` (e.g. `design-system.manifest.json`), and everything under `src/tokens/generated/` (`tokens.css`, `figma.tokens.json`, `token-ids.ts`). To change output, change the source and re-run the build.
- **R8 (MUST):** After changing a source that feeds a generated artifact, the agent MUST run the correct script: tokens → `npm run tokens:build`; manifest/bundle → `npm run manifest:build`; catalog → `npm run catalog:build`; all three → `npm run ds:build`; plugin → `npm run figma:build`.

### 4.4 Import, styling & meta conventions
- **R9 (MUST):** Import components ONLY from the single barrel `@/components`. NEVER deep-path into `atoms/`/`molecules/`/`organisms/`.
- **R10 (MUST):** `*.meta.ts` files MUST stay React-free and CSS-free and use **relative** imports only (they feed the manifest build via `tsx`).
- **R11 (MUST):** Styling uses CSS custom-property tokens only — `var(--tds-*)`. NEVER hardcode colors, spacing, radius, or shadow. Token id dot-notation maps to `--tds-` dashes (`color.bg.default` → `--tds-color-bg-default`); Figma variable names use `/` (`color/bg/default`).
- **R12 (MUST):** Express variants on the DOM via `toDataAttrs(meta, {...})` from `@core/*` so every axis appears as `data-<axis>` (Figma-legible). Components are `forwardRef`; use `cx` from `@/utils`; wrap form inputs in `FormField`.
- **R13 (MUST):** Use the declared aliases only: `@/*` → `src/*`, `@tokens/*` → `src/tokens/*`, `@core/*` → `src/core/*`, `@components/*` → `src/components/*`.

### 4.5 Determinism
- **R14 (MUST):** Given identical repo state and request, the agent MUST produce the same change. Prefer deterministic transforms (edit source → run script) over free-hand generation of anything a script can produce.
- **R15 (NEVER):** NEVER introduce randomness, timestamps, or machine-specific paths into committed source. Generated artifacts may carry a `generatedAt` field — that is the build's job, not yours to hand-write.
- **R16 (MUST):** Minimal diffs — change only what the task requires; do not reformat unrelated code, and let `prettier`/`eslint` decide formatting.

### 4.6 Manifest consultation
- **R17 (MUST):** The agent MUST consult the relevant `.ai/*` manifest before acting and MUST reconcile it after acting. Minimum reads by task type:
  - *Any task* → [.ai/PROJECT_MANIFEST.json](../../.ai/PROJECT_MANIFEST.json).
  - *Component/UI work* → [.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json), [.ai/VARIANT_INDEX.json](../../.ai/VARIANT_INDEX.json), [.ai/DESIGN_MANIFEST.json](../../.ai/DESIGN_MANIFEST.json).
  - *Token work* → [.ai/TOKEN_INDEX.json](../../.ai/TOKEN_INDEX.json).
  - *Figma/plugin work* → [.ai/FIGMA_MAPPING.json](../../.ai/FIGMA_MAPPING.json), [.ai/PLUGIN_INDEX.json](../../.ai/PLUGIN_INDEX.json).
  - *Resume / multi-step* → [.ai/TASKS.json](../../.ai/TASKS.json) and [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md).
- **R18 (MUST):** Treat `.ai/*` as a **cache derived from source** (precedence level 4). If a manifest disagrees with source, source wins and the manifest MUST be regenerated — never trust a stale manifest over the code.

### 4.7 Token-budget discipline
- **R19 (SHOULD):** Answer from the catalog/manifests first. Open a component's `.tsx` only for exact prop shape or compound sub-parts the catalog omits.
- **R20 (SHOULD):** Read narrowly (specific files/line ranges), not whole directories. Batch independent reads. See [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md).

### 4.8 PLANNED honesty & escalation
- **R21 (MUST):** Mark all backend/database/Supabase/API/auth/`.env`/CI/test-framework material as **PLANNED**. None of it exists today; runtime deps are only `react` + `react-dom`. `SocialLogin`/`SocialLoginButton` are presentational only.
- **R22 (MUST):** Escalate to a human (do not proceed) when a task requires a visual-design decision, a new PLANNED subsystem, deletion/rename of a public export, or any action that would violate R4–R11. See §9 and §6.4.

---

## 5. Workflow

The canonical per-task loop for an AI agent. Full lifecycle detail is [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md); this is the agent-contract view.

1. **Intake & classify.** Parse the request. Classify as *reuse/compose*, *edit source*, *add component*, *add token*, *plugin work*, or *PLANNED backend* (escalate — §9).
2. **Rehydrate.** Read [.ai/PROJECT_MANIFEST.json](../../.ai/PROJECT_MANIFEST.json); if resuming, read [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md) and [.ai/TASKS.json](../../.ai/TASKS.json) ([28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md)).
3. **Discover (reuse-first).** Consult [docs/COMPONENTS.md](../COMPONENTS.md) and the task-relevant `.ai/*` indexes (§4.6). Confirm nothing already satisfies the request before creating anything.
4. **Read-before-write.** Open only the sources you must change; read them fully (R1).
5. **Plan.** State the minimal source edits and which build script will regenerate outputs. If a visual-design or PLANNED decision is implied → escalate (§9).
6. **Implement (source only).** Edit `*.meta.ts` / component `.tsx`+`.css` / `src/tokens/*` / scripts / plugin `src/`. Never touch generated files (R7). Keep `meta.ts` pure (R10); use `toDataAttrs`, `cx`, `FormField`, `@/components` barrel (R9–R12).
7. **Regenerate.** Run the right script:
   ```bash
   npm run ds:build       # tokens:build + manifest:build + catalog:build
   npm run figma:build    # ds:build + plugin:typecheck + plugin:build + plugin:test
   ```
   For registration of a new component, add it to `src/components/metas.ts` and the tier barrel first, then `npm run ds:build`.
8. **Validate.** Run the applicable gate (§7): `npm run lint`, `tsc -b`, and the build/test relevant to what changed.
9. **Reconcile manifests.** Regenerate/update the `.ai/*` cache and generated manifests so downstream agents read accurate state ([37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md)).
10. **Checkpoint & report.** Update [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md) / [.ai/TASKS.json](../../.ai/TASKS.json); report what changed, which scripts ran, and their results. Commit only when the human asks ([30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md), [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md)).

---

## 6. Examples

### 6.1 Reuse-first (the common case)
> **Request:** "Add a confirmation dialog with a primary and secondary button."

Correct agent behavior — **compose existing components, write nothing new**:
```ts
// Existing barrel imports only — no deep paths, no new component.
import { Modal, Button, Stack } from '@/components';
```
The agent first checks [docs/COMPONENTS.md](../COMPONENTS.md) / [.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json), confirms a dialog/overlay component exists, and composes it. Building a bespoke dialog would violate R2 (reuse-first).

### 6.2 Variant on the DOM (Figma-legible)
```tsx
// Inside a component .tsx — every axis becomes a data-* attribute for the plugin.
import { toDataAttrs, cx } from '@core/index';
<button ref={ref} className={cx('tds-btn', className)} {...toDataAttrs(meta, { type, variant, tone, size, shape })} />
```
This satisfies R12: the DOM carries `data-type`, `data-variant`, `data-tone`, `data-size`, `data-shape` so the Figma plugin can place the correct variant.

### 6.3 Correct source-change flow (no drift)
> **Request:** "Make the brand solid fill slightly darker."

This is a **visual change** → it is a **source** change requiring human approval (R6). The agent does **not** edit `src/tokens/generated/tokens.css` (R7). It edits the token source under `src/tokens/` (e.g. `primitives.ts`/`semantic.ts`), then:
```bash
npm run tokens:build   # regenerates src/tokens/generated/{tokens.css, figma.tokens.json, token-ids.ts}
npm run figma:build    # re-derives manifest + plugin bundle + headless verify
```
Hand-editing `tokens.css` would be silently overwritten and is prohibited.

### 6.4 Escalation instead of guessing
> **Request:** "Wire the login form to our database."

There is **no backend, database, Supabase, or API** in the repo (R21). The agent MUST respond that this is **PLANNED** (see [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [15_API_GUIDE.md](./15_API_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md)) and escalate for a human decision rather than fabricate an API surface.

### 6.5 What NOT to do (anti-patterns)
```txt
✗ Editing figma/tds.plugin.json or src/generated/design-system.manifest.json by hand.
✗ import { Button } from '@/components/atoms/Button/Button';   // deep path — use @/components
✗ Adding a hardcoded color: background: #2563eb;               // use var(--tds-color-brand-solid)
✗ Renaming the "variant" axis to "style" in a meta.             // Naming Registry is fixed
✗ Emitting the state axis as a Figma variant.                   // policy: state is NOT a variant
✗ Inventing a REST endpoint because the UI "needs data."        // backend is PLANNED — escalate
```

---

## 7. Validation Rules

Compliance is checked by real repository mechanisms, not judgment calls:

| Concern | Mechanism | Command |
| --- | --- | --- |
| Lint / conventions (flat ESLint: js + typescript-eslint + react-hooks + react-refresh + storybook) | ESLint | `npm run lint` |
| Type safety (strict, `noUnusedLocals/Parameters`, `verbatimModuleSyntax`, `consistent-type-imports`) | TypeScript project build | `tsc -b` (via `npm run build`) |
| Formatting (semi, singleQuote, trailingComma all, printWidth 100, tabWidth 2, arrowParens always) | Prettier | `npm run format:check` |
| Tokens regenerate cleanly | `build-tokens.ts` | `npm run tokens:build` |
| Manifest + Figma bundle regenerate | `build-manifest.ts` | `npm run manifest:build` |
| Catalog regenerates (reuse index stays honest) | `build-catalog.ts` | `npm run catalog:build` |
| Everything above at once | composite | `npm run ds:build` |
| Plugin coverage (headless Figma-API mock; `process.exit(1)` on mismatch) | `figma/plugin/test/harness.ts` | `npm run figma:build` → `plugin:test` |
| Generated files unchanged by hand | git diff must show only source + its regenerated outputs, never a lone hand-edit to `figma/*`, `src/generated/*`, `src/tokens/generated/*` | code review ([30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)) |
| Manifest schema/consistency | `$schema`/`version`/`generatedAt` present; `.ai/*` reconciled | [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md) |

An AI change is **not "done"** until the gate applicable to what it touched is green and the report states which commands ran.

> **PLANNED:** No unit/e2e test framework exists (no vitest/jest/playwright, no `test` script). The only executable test today is the plugin harness via `plugin:test`. Broader testing is described in [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md) as PLANNED.

---

## 8. Checklist

Copyable pre-flight for any AI task:

- [ ] Read [.ai/PROJECT_MANIFEST.json](../../.ai/PROJECT_MANIFEST.json) and the task-relevant `.ai/*` indexes (§4.6).
- [ ] Consulted [docs/COMPONENTS.md](../COMPONENTS.md) — confirmed reuse vs. build (R2).
- [ ] Read every file before editing it (R1).
- [ ] No visual-design decision required (else → escalate, §9).
- [ ] Editing **source** only; no generated file touched (R7).
- [ ] `*.meta.ts` stays React/CSS-free, relative imports only (R10).
- [ ] Imports come from `@/components`; aliases correct (R9, R13).
- [ ] Styling uses `var(--tds-*)` only; no hardcoded values (R11).
- [ ] Variants expressed via `toDataAttrs`; `forwardRef`/`cx`/`FormField` where applicable (R12).
- [ ] No renames of tokens/components/variants/axes (R5).
- [ ] Ran the correct build (`tokens:build` / `manifest:build` / `catalog:build` / `ds:build` / `figma:build`) (R8).
- [ ] `npm run lint` + `tsc -b` green; `plugin:test` green if plugin/manifest touched (§7).
- [ ] `.ai/*` manifests reconciled from source (R18).
- [ ] Backend/DB/API/CI content labeled **PLANNED** (R21).
- [ ] Updated [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md) / [.ai/TASKS.json](../../.ai/TASKS.json); reported commands + results.

---

## 9. Failure Recovery

| Symptom | Diagnosis | Fix | Resume |
| --- | --- | --- | --- |
| A generated file (`figma/tds.plugin.json`, `src/generated/*`, `src/tokens/generated/*`, `figma/plugin/code.js`) was hand-edited | R7 violation | `git checkout -- <file>` to discard the hand-edit, make the change in the **source**, re-run the matching build | Re-run §7 gate |
| `plugin:test` exits 1 (coverage mismatch) | Bundle/component set diverged from the manifest | Do NOT edit `code.js`; fix the source `*.meta.ts` or plugin `src/*`, then `npm run figma:build` | Re-run `plugin:test` until green |
| Storybook and Figma disagree | Design drift (someone treated Figma as truth) | Reproduce Storybook exactly; revert any Figma-first change; Storybook is immutable truth (R4) | Re-run `ds:build`/`figma:build` |
| `tsc -b` fails on `verbatimModuleSyntax`/unused symbols | Convention breach | Use `import type`, remove unused locals/params | Re-run `tsc -b` |
| Duplicate component appeared | Reuse-first skipped (R2) | Delete the duplicate; compose the existing component from `@/components` | Update [.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json) |
| Stale `.ai/*` manifest contradicts source | Cache not reconciled (R18) | Regenerate from source; source is authoritative (precedence 4) | Re-read reconciled manifest |
| Context lost mid-task | Session interrupted | Read [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md) + [.ai/TASKS.json](../../.ai/TASKS.json) | Continue at the recorded checkpoint ([28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md)) |
| Task needs a visual-design or backend decision | Out of agent authority | **Escalate to a human**; state the decision needed and label PLANNED where relevant | Wait for approval before proceeding |

**Escalation protocol (when to stop):** produce a short note stating (a) the exact decision required, (b) which rule (R4–R11, R21) would otherwise be violated, (c) the options you see, and (d) your recommendation — then wait. Do not guess, do not partially implement a visual change, do not fabricate a PLANNED subsystem.

---

## 10. Dependencies

This document relies on and is relied upon by:

- **Constitution:** [00_MASTER_RULES.md](./00_MASTER_RULES.md) (overrides this doc).
- **Execution & memory:** [02_AI_HARNESS.md](./02_AI_HARNESS.md), [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md), [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md), [37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md), [35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md), [36_AI_AGENT_SPECIFICATION.md](./36_AI_AGENT_SPECIFICATION.md).
- **Design & build truth:** [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md), [04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md), [05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md), [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md), [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md), [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md), [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md).
- **Process:** [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md), [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md), [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md), [38_AI_WORKFLOW.md](./38_AI_WORKFLOW.md), [39_AI_CHECKLIST.md](./39_AI_CHECKLIST.md).
- **PLANNED subsystems:** [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [15_API_GUIDE.md](./15_API_GUIDE.md), [16_NODE_GUIDE.md](./16_NODE_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md), [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md), [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md).
- **Manifests consulted:** [.ai/PROJECT_MANIFEST.json](../../.ai/PROJECT_MANIFEST.json), [.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json), [.ai/TOKEN_INDEX.json](../../.ai/TOKEN_INDEX.json), [.ai/VARIANT_INDEX.json](../../.ai/VARIANT_INDEX.json), [.ai/FIGMA_MAPPING.json](../../.ai/FIGMA_MAPPING.json), [.ai/PLUGIN_INDEX.json](../../.ai/PLUGIN_INDEX.json), [.ai/DESIGN_MANIFEST.json](../../.ai/DESIGN_MANIFEST.json), [.ai/TASKS.json](../../.ai/TASKS.json), [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md).
- **Scripts & sources referenced:** `scripts/build-tokens.ts`, `scripts/build-manifest.ts`, `scripts/build-catalog.ts`, `src/core/defineComponent.ts` (`toDataAttrs`, `defaultsFromMeta`, `variantCount`), `src/components/metas.ts`, `figma/plugin/test/harness.ts`, [docs/COMPONENTS.md](../COMPONENTS.md), [figma/README.md](../../figma/README.md).

---

## 11. Template

Copy-paste **AI task pre-flight + report** skeleton. Fill and paste into the task thread / session log.

```md
### AI Task: <short title>
- Classification: [reuse | edit-source | add-component | add-token | plugin | PLANNED-escalate]
- Manifests read: [.ai/PROJECT_MANIFEST.json, .ai/COMPONENT_INDEX.json, ...]
- Catalog checked: docs/COMPONENTS.md → [reuse: <component(s)> | none fit → build justified]
- Files to read (before write): [<paths>]
- Design-Lock check: [no visual change | visual change → APPROVED BY <human> on <date>]
- PLANNED touch: [none | <backend/db/api/ci> labeled PLANNED]

#### Plan (source-only)
1. Edit <source file(s)> …
2. Regenerate: `npm run <tokens:build|manifest:build|catalog:build|ds:build|figma:build>`

#### Validation
- [ ] npm run lint
- [ ] tsc -b
- [ ] npm run <ds:build|figma:build>   (plugin:test green if applicable)
- [ ] .ai/* reconciled from source

#### Report
- Changed: <files>
- Ran: <commands> → <results>
- Manifests updated: <.ai/* files>
- Escalations: [none | <decision needed>]
- Resume checkpoint: <.ai/SESSION_SUMMARY.md updated? y/n>
```

---

## 12. Future Extension

This contract is written to hold as the system grows toward the enterprise target (>10,000,000 users) without loosening any guarantee:

- **PLANNED backend arrives (Supabase + Node/TS API).** When [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md)–[17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md) become ACTIVE, the same read-before-write, determinism, and escalation rules extend to schema/migrations/RLS and API contracts ([.ai/ERD.json](../../.ai/ERD.json), [.ai/API_SPEC.json](../../.ai/API_SPEC.json)). Frontend↔backend↔database sync becomes a first-class no-drift concern.
- **More agents / MCP.** As the roster in [36_AI_AGENT_SPECIFICATION.md](./36_AI_AGENT_SPECIFICATION.md) and the MCP surface in [35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md) expand, this operating contract remains the shared baseline every new agent inherits — new agents add capabilities, never new authority to break R4–R11.
- **Scale of components/tokens.** The manifest-first, catalog-first token discipline (§4.7, [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md)) keeps context cost roughly flat as component count grows well beyond today's 60 — agents read indexes, not the whole tree.
- **Stricter gates (PLANNED CI).** When CI ([25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)) and a real test framework ([24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md)) land, the §7 validation table gains automated enforcement of the same rules this document already requires manually — the contract does not change, only its enforcement tightens.
- **Governance.** Amendments to this specification flow only through [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md) and remain subordinate to [00_MASTER_RULES.md](./00_MASTER_RULES.md); the Design Lock and generated-is-sacred invariants are permanent.
