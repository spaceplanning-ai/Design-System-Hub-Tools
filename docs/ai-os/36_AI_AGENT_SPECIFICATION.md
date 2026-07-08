<!--
title: AI Agent Specification
Purpose: Defines the AI-agent roster for the TDS repository — the two real subagents (@tds-component, @figma-plugin) and the additional PLANNED roles — with their contracts, model/tool grants, delegation boundaries, when-to-spawn rules, and the multi-agent workflows that keep the main thread small and the pipeline consistent.
Status: ACTIVE for the two existing subagents and the delegation model; PLANNED for every additional role not yet present as a file in .claude/agents/ (and for all backend/DB/API agents).
Owner: AI OS
Last-reviewed: 2026-07-08 (placeholder — update on each review)
Precedence: Subordinate to [00_MASTER_RULES.md](./00_MASTER_RULES.md) (the constitution). This document governs the agent roster and delegation; where it conflicts with 00_MASTER_RULES.md the constitution wins. It refines the single-agent operating contract in [01_AI_SPECIFICATION.md](./01_AI_SPECIFICATION.md) into a multi-agent model and overrides ad-hoc prompts and agent chatter about "who does what."
-->

# 36 — AI Agent Specification

> **The roster, contracts, and delegation boundaries for every AI agent that touches TDS.**
> TDS is a metadata-driven design system (package `tds`, v0.1.0, ESM, Node >=20) where **one source of truth feeds four outputs**. The repo already ships **two subagents** in [`.claude/agents/`](../../.claude/agents/): **`@tds-component`** (component work, model `sonnet`) and **`@figma-plugin`** (plugin work, model `opus`). This spec defines those two exactly as they exist, adds the **PLANNED** roles the AI OS will need at scale, and specifies how a main-thread orchestrator delegates to them without leaking context or duplicating work.

---

## 1. Purpose

This document is the authoritative description of the **AI-agent roster** and the **delegation contract** between agents in the TDS repository. It exists so that:

1. Every task lands with the **right agent** — component work goes to `@tds-component`, Figma-plugin work goes to `@figma-plugin` — instead of a single over-broad thread doing everything and bloating context.
2. Each agent has a **written, enforceable contract**: its model, its tool grant, what it owns, what it must never touch, and how it reports back.
3. The **main thread stays small**. Per [CLAUDE.md](../../CLAUDE.md), subagents exist to "delegate to keep the main thread small." This doc formalizes when to spawn versus inline.
4. Multi-agent work (add a component, sync Figma, add a token, resume a session, run a review) follows a **canonical hand-off** so two agents never duplicate or contradict each other, and never violate the Design Lock.

This is the "who is on the team and how they hand off" layer. The *single-agent* operating contract is [01_AI_SPECIFICATION.md](./01_AI_SPECIFICATION.md); the *execution harness* (tools, context assembly) is [02_AI_HARNESS.md](./02_AI_HARNESS.md); the *task lifecycle* is [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md); the *MCP tool surface* is [35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md).

---

## 2. Responsibilities

This spec owns, and is the authority for:

- **The agent roster** — the two real subagents (`@tds-component`, `@figma-plugin`) and the PLANNED roles, each with an exact contract.
- **Delegation boundaries** — the dividing line between component/source work and Figma-plugin work, and between the main-thread orchestrator and its subagents.
- **When-to-spawn rules** — the concrete triggers for delegating to a subagent versus handling a task inline on the main thread.
- **Subagent file format** — the `.claude/agents/*.md` front-matter contract (`name`, `description`, `tools`, `model`) and the body conventions both existing files follow.
- **Model & tool grants** — why `@tds-component` runs on `sonnet` and `@figma-plugin` on `opus`, and why both carry exactly `Read, Write, Edit, Grep, Glob, Bash`.
- **Multi-agent workflows** — the canonical hand-off sequences and the manifests/reports agents read and write across a hand-off.
- **Report-back discipline** — what a subagent must return to its caller (summaries, exact import lines, unreproducible gaps) and what it must NOT (large diffs, the bundle).

It does **not** own: the single-agent behavioral contract ([01_AI_SPECIFICATION.md](./01_AI_SPECIFICATION.md)); harness mechanics ([02_AI_HARNESS.md](./02_AI_HARNESS.md)); component anatomy ([07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md)); the plugin algorithm ([06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md)); the review gate ([30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)); resume mechanics ([28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md)); or the MCP tool surface ([35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md)) — this doc sets the delegation rules those systems run under.

---

## 3. Scope

### In-scope (ACTIVE today)
- The two existing subagents in [`.claude/agents/`](../../.claude/agents/): `@tds-component` and `@figma-plugin`, their contracts, models, and tool grants.
- The `.claude/agents/*.md` front-matter format and body conventions.
- The main-thread orchestrator role and its delegation-versus-inline decision.
- Delegation boundaries between the two agents and the multi-agent hand-off workflows they support today (component build, Figma sync, token change, resume, review).
- Report-back and context-isolation discipline.

### Out-of-scope (governed elsewhere, or PLANNED)
- The single-agent operating contract and hard limits → [01_AI_SPECIFICATION.md](./01_AI_SPECIFICATION.md).
- Harness/tool mechanics and context assembly → [02_AI_HARNESS.md](./02_AI_HARNESS.md).
- The MCP server tool surface that exposes agent actions → [35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md).
- The `.ai/` memory system agents read/write across hand-offs → [37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md).
- **PLANNED** additional roles not yet present as agent files (`@token-smith`, `@catalog-scribe`, `@reviewer`, `@resume-warden`) and all **PLANNED** backend agents (`@supabase-eng`, `@api-eng`, `@db-eng`) mapped to [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md)–[17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md). **No backend, database, Supabase, API, or CI exists in the repo today** (runtime deps are only `react` + `react-dom`).

---

## 4. Rules

Rules are normative. **MUST / SHOULD / NEVER** are binding on every agent and on the orchestrator that spawns them.

1. **The roster is closed to two ACTIVE agents.** Only `@tds-component` and `@figma-plugin` exist as files in [`.claude/agents/`](../../.claude/agents/). An agent MUST NOT claim, invoke, or imply any other subagent as if it were real. Additional roles named in this doc are **PLANNED** until a corresponding `.md` file exists.
2. **Delegate by domain, not by convenience.** Component/source/composition work (`src/components/**`, `src/tokens/**`, `*.meta.ts`, screens) MUST route to `@tds-component`. Anything under `figma/plugin/**` or consuming `figma/tds.plugin.json` MUST route to `@figma-plugin`. An agent MUST NOT cross into the other's domain; it hands off instead.
3. **One writer per file per hand-off.** Two agents MUST NEVER edit the same file in overlapping work. The orchestrator serializes hand-offs so exactly one agent owns a given file at a time (prevents the duplicate/inconsistent-implementation failure the AI OS forbids).
4. **Generated outputs are read-only to every agent.** No agent — component or plugin — MAY hand-edit `figma/*`, `src/generated/*`, `src/tokens/generated/*`, or `figma/plugin/code.js`. To change output, change the **source** (`*.meta.ts`, `src/tokens/*`, or a `scripts/*` build script) and re-run the correct npm script. This is inherited verbatim from [00_MASTER_RULES.md](./00_MASTER_RULES.md).
5. **The Design Lock binds every agent.** No agent MAY, on its own initiative, redesign, restyle, re-space, recolor, or rename any token, component, variant, or variable. Figma is a reproduction of Storybook, never a redesign. Any visual change is a **source** change that flows through the pipeline and must be explicitly requested. See [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md).
6. **Reuse-first is the first act of `@tds-component`.** Before writing any component, it MUST consult [docs/COMPONENTS.md](../COMPONENTS.md) and [.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json). New components are the last resort; composing existing ones is the default (60 exist: 24 atoms, 27 molecules, 9 organisms).
7. **`@figma-plugin` mirrors, never decides.** It MUST reproduce every variant, mode, scope, and binding in `figma/tds.plugin.json`. It MUST NEVER simplify, invent, or rename. If the contract cannot be reproduced faithfully, it MUST **stop and surface the gap** rather than approximate.
8. **Model grants are fixed by cost/complexity.** `@tds-component` runs `model: sonnet` (high-volume, pattern-following reuse work); `@figma-plugin` runs `model: opus` (algorithmic fidelity over the whole contract). An agent MUST NOT be silently re-pointed to a different model; changing a model is a change to its `.claude/agents/*.md` file and is reviewed like any source change.
9. **Tool grants are least-privilege and identical today.** Both subagents are granted exactly `Read, Write, Edit, Grep, Glob, Bash` and nothing more. A new agent SHOULD be granted the smallest tool set for its job; a backend agent (PLANNED) that needs network/DB tools MUST have that grant reviewed against [22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md).
10. **Spawn to protect context, not to look busy.** The orchestrator SHOULD delegate when a task needs deep, file-heavy exploration whose intermediate reads would bloat the main thread; it SHOULD handle trivial single-file edits inline. Spawning MUST have a domain reason (rule 2), not merely parallelism theater.
11. **Every subagent reports back concisely.** A subagent MUST return: what it reused vs. created, the exact barrel import line(s) the caller should use (`@tds-component`), or the collections/styles/component-sets/variant-counts reproduced plus any unreproducible gap (`@figma-plugin`). It MUST NOT paste large diffs or the full bundle.
12. **Hand-offs go through manifests, not memory.** State that must survive a hand-off or a context loss MUST be written to `.ai/*` ([.ai/TASKS.json](../../.ai/TASKS.json), [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md)), never left implicit in an agent's working context. See [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md) and [37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md).
13. **PLANNED honesty.** Any agent or workflow touching backend/DB/API/Supabase/CI/test-framework surfaces MUST label it **PLANNED — does not exist in the repo today** and MUST NOT act as if the surface exists.

---

## 5. Workflow

### 5.1 The orchestrator's delegation decision (every task)
1. **Classify the task** by domain: component/source/screen → `@tds-component`; plugin/`figma/plugin/**`/bundle-consumption → `@figma-plugin`; both → sequence them (5.3).
2. **Assemble minimal context** (per [02_AI_HARNESS.md](./02_AI_HARNESS.md)): the relevant `.ai/*` manifests and [docs/COMPONENTS.md](../COMPONENTS.md), not raw source dumps.
3. **Decide spawn vs inline** (Rule 10): file-heavy exploration or a domain that isn't the orchestrator's focus → spawn; a one-line edit you already have context for → inline.
4. **Delegate with `@<name>`** and a crisp scope, e.g. `@tds-component compose a settings screen from existing components` or `@figma-plugin regenerate variables from the fresh bundle`.
5. **Receive the concise report**, reconcile `.ai/*`, and run the validation gate for the domain (5.4).

### 5.2 `@tds-component` internal workflow (component / source)
1. Read [docs/COMPONENTS.md](../COMPONENTS.md) first; open a `*.meta.ts` only when the catalog lacks a detail.
2. Reuse or compose from the single barrel: `import { Button, Card } from '@/components'`. New component only if nothing fits.
3. If adding a component: mirror a sibling in the same tier (atom/molecule/organism) — `X.meta.ts` (React/CSS-free, relative imports) → `X.tsx` (+ `X.css`, tokens only) → `X.stories.tsx` → register in `src/components/metas.ts` + the tier `index.ts` barrel.
4. Run `npm run catalog:build` (or `npm run ds:build`) if a `.meta.ts` changed; run `npm run lint`.
5. Report: reused vs. created, and the exact import line(s).

### 5.3 `@figma-plugin` internal workflow (plugin)
1. Ensure the bundle is fresh: if source changed, run `npm run ds:build` so `figma/tds.plugin.json` is current.
2. Read [figma/README.md](../../figma/README.md) (the contract) and consume `figma/tds.plugin.json` = `{ tokens, design }`. Never hand-edit generated files.
3. Follow the algorithm exactly: Variables (Primitives → Semantic → Theme, modes `light`/`dark`, resolve `VARIABLE_ALIAS`) → Effect/Text Styles → per-component base frame + full cartesian product of `variantAxes` as one Component Set + register `figmaProperties` + apply `tokenBindings` honoring each `when` filter.
4. Typecheck and build: `npm run plugin:typecheck`, `npm run plugin:build`; verify headlessly with `npm run plugin:test` (or the whole gate `npm run figma:build`).
5. Report: collections/styles/component-sets/variant-counts reproduced, and any contract item that could **not** be reproduced.

### 5.4 Cross-agent hand-off (component change that must reach Figma)
1. `@tds-component` changes source and runs `npm run ds:build` (tokens + manifest + catalog).
2. Orchestrator records the change in [.ai/TASKS.json](../../.ai/TASKS.json) and [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md).
3. `@figma-plugin` consumes the **fresh** `figma/tds.plugin.json` and re-runs its build/verify (`npm run figma:build`).
4. If `@figma-plugin` finds a contract gap, it hands **back** to `@tds-component` (fix the source), never patches the generated bundle. This loop is serialized (Rule 3).

---

## 6. Examples

### 6.1 The two real subagent contracts (verbatim front-matter)
```yaml
# .claude/agents/tds-component.md
---
name: tds-component
description: Build, edit, or wire up TDS design-system components (React + meta-driven + Figma). ...
tools: Read, Write, Edit, Grep, Glob, Bash
model: sonnet
---
```
```yaml
# .claude/agents/figma-plugin.md
---
name: figma-plugin
description: Build the Figma plugin that reproduces the TDS Storybook design system inside Figma with 100% structural fidelity. ...
tools: Read, Write, Edit, Grep, Glob, Bash
model: opus
---
```

### 6.2 Correct routing
```text
"Add a Toast molecule with success/danger tones"      -> @tds-component  (source/meta/tsx/css/stories)
"Compose a dashboard from existing cards + charts"    -> @tds-component  (reuse-first composition)
"The plugin isn't emitting the Card A/B/C sets"       -> @figma-plugin   (consumes design.components)
"Theme mode dark aliases resolve to the wrong color"  -> @figma-plugin   (Variables / VARIABLE_ALIAS)
"Rename token color.brand.solid across the system"    -> @tds-component  (source token change; then hand off)
```

### 6.3 A cross-agent hand-off, end to end
```text
Orchestrator: classify -> token rename touches src/tokens + component CSS -> @tds-component
@tds-component: edit src/tokens/*, run `npm run ds:build`, `npm run lint`; report new token id + import lines
Orchestrator: write change to .ai/TASKS.json + .ai/SESSION_SUMMARY.md
@figma-plugin: consume fresh figma/tds.plugin.json, run `npm run figma:build`; report variant counts + gaps
Orchestrator: reconcile .ai/*, run review gate (30_REVIEW_SYSTEM.md), report to human
```

### 6.4 Invoking a subagent
```text
@tds-component reuse-first: build a Settings page from existing components; return the exact @/components imports.
@figma-plugin regenerate the three Variable collections from the current bundle and report unreproducible bindings.
```

---

## 7. Validation Rules

Compliance is checked by real repo mechanisms, not assertion:

- **Agent-file integrity** — each `.claude/agents/*.md` MUST parse with front-matter `name`, `description`, `tools`, `model`. `name` MUST match the invocation string (`@tds-component`, `@figma-plugin`). Verified by inspecting the two files.
- **Domain routing** — a `@tds-component` diff that touches `figma/plugin/**`, or a `@figma-plugin` diff that touches `src/components/**` or `src/tokens/**`, is a routing violation (Rule 2). Caught in review ([30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)).
- **No generated hand-edits** — a diff to `figma/*`, `src/generated/*`, `src/tokens/generated/*`, or `figma/plugin/code.js` fails review regardless of which agent produced it (Rule 4).
- **Component gate** — after `@tds-component` work: `npm run lint` clean, and `npm run catalog:build`/`npm run ds:build` regenerates without diff drift beyond the intended change.
- **Plugin gate** — after `@figma-plugin` work: `npm run plugin:typecheck` passes, `npm run plugin:build` succeeds, and `npm run plugin:test` (headless harness, `process.exit(1)` on coverage mismatch) passes; full gate is `npm run figma:build`.
- **Report-back completeness** — `@tds-component` returned exact import lines; `@figma-plugin` returned counts + explicit gaps (Rule 11).
- **PLANNED labeling** — any mention of backend/DB/API/CI agents is marked PLANNED (Rule 13).

---

## 8. Checklist

Pre-delegation (orchestrator):
- [ ] Task classified by domain (component/source vs plugin vs both).
- [ ] Minimal context assembled from `.ai/*` + [docs/COMPONENTS.md](../COMPONENTS.md), not raw source dumps.
- [ ] Spawn-vs-inline decided with a domain reason (Rule 10).
- [ ] The correct agent invoked with `@<name>` and a crisp, bounded scope.

Per-agent (before "done"):
- [ ] `@tds-component`: reuse-first checked; barrel imports only; tokens-only styling; `catalog:build`/`ds:build` + `lint` run; exact import lines reported.
- [ ] `@figma-plugin`: bundle fresh (`ds:build` if source changed); algorithm followed exactly; `plugin:typecheck` + `plugin:build` + `plugin:test` (or `figma:build`) pass; counts + gaps reported.
- [ ] No generated file hand-edited.
- [ ] No Design-Lock violation (no unrequested visual/naming change).

Hand-off (cross-agent):
- [ ] Exactly one writer per file (serialized).
- [ ] State written to [.ai/TASKS.json](../../.ai/TASKS.json) + [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md).
- [ ] Contract gaps handed **back** to source, never patched in generated output.
- [ ] Review gate run ([30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)); [.ai/REVIEW_REPORT.md](../../.ai/REVIEW_REPORT.md) updated.

---

## 9. Failure Recovery

| Symptom | Diagnosis | Fix | Resume |
| --- | --- | --- | --- |
| Two agents edited the same file / conflicting output | Hand-off not serialized (Rule 3 broken) | Revert one edit; assign a single owner; redo sequentially | Re-run the owning agent's gate, then hand off |
| `@figma-plugin` edited `figma/tds.plugin.json` or `code.js` directly | Generated-is-sacred violation (Rule 4) | Discard the edit; change the **source** (`*.meta.ts`/tokens/scripts); `npm run ds:build` | `@figma-plugin` re-consumes the fresh bundle |
| Plugin can't reproduce a variant/binding | Contract gap in the bundle | `@figma-plugin` **stops and surfaces**; hand back to `@tds-component` to fix source | Rebuild bundle, re-run `npm run figma:build` |
| A component got restyled/renamed without a request | Design-Lock violation (Rule 5) | Revert; re-do as an explicit, approved source change | Re-run `ds:build` + review gate |
| New component duplicates an existing one | Reuse-first skipped (Rule 6) | Delete the duplicate; compose from `@/components` instead | Update catalog via `npm run catalog:build` |
| An agent invoked a non-existent subagent | Roster is closed to two ACTIVE agents (Rule 1) | Route to `@tds-component`/`@figma-plugin`, or do the work inline | Continue; note the PLANNED role in `.ai/SESSION_SUMMARY.md` |
| Context lost mid-hand-off | State lived in memory, not manifests (Rule 12) | Rehydrate from [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md) + [.ai/TASKS.json](../../.ai/TASKS.json) | Resume per [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md) |
| Backend agent behavior assumed to exist | PLANNED surface treated as real (Rule 13) | Mark PLANNED; escalate to human; do not fabricate | Proceed only on ACTIVE surfaces |

---

## 10. Dependencies

- **Constitution & single-agent contract** — [00_MASTER_RULES.md](./00_MASTER_RULES.md), [01_AI_SPECIFICATION.md](./01_AI_SPECIFICATION.md).
- **Harness & task lifecycle** — [02_AI_HARNESS.md](./02_AI_HARNESS.md), [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md), [38_AI_WORKFLOW.md](./38_AI_WORKFLOW.md), [39_AI_CHECKLIST.md](./39_AI_CHECKLIST.md).
- **Domain specs the agents execute against** — [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md), [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md), [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md), [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md).
- **Memory, resume, review, MCP** — [37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md), [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md), [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md), [35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md), [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md).
- **PLANNED backend agent roles** — [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [15_API_GUIDE.md](./15_API_GUIDE.md), [16_NODE_GUIDE.md](./16_NODE_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md), [22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md).
- **Real repo files** — [.claude/agents/tds-component.md](../../.claude/agents/tds-component.md), [.claude/agents/figma-plugin.md](../../.claude/agents/figma-plugin.md), [figma/README.md](../../figma/README.md), [docs/COMPONENTS.md](../COMPONENTS.md), [CLAUDE.md](../../CLAUDE.md).
- **Manifests** — [.ai/PROJECT_MANIFEST.json](../../.ai/PROJECT_MANIFEST.json), [.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json), [.ai/TASKS.json](../../.ai/TASKS.json), [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md), [.ai/REVIEW_REPORT.md](../../.ai/REVIEW_REPORT.md).

---

## 11. Template

Copy-paste skeleton for a **new subagent** file at `.claude/agents/<name>.md`. Mirror the two existing files: least-privilege `tools`, an explicit `model`, and a body that states source-of-truth, non-negotiable rules, and report-back discipline. Mark PLANNED roles clearly until they ship.

```markdown
---
name: <kebab-name>            # matches the @<name> invocation string
description: <one line — what this agent does and WHEN to use it, so the orchestrator routes correctly>
tools: Read, Write, Edit, Grep, Glob, Bash   # least-privilege; add only what the job needs
model: sonnet | opus         # sonnet = high-volume pattern work; opus = algorithmic/whole-system fidelity
---

You are <role>. Your one job: <single, bounded responsibility>.

## Source of truth
- <what is immutable for this agent> (e.g. Storybook + *.meta.ts, or figma/tds.plugin.json).
- Read <the one file/catalog to consult first> before doing anything.

## Rules (non-negotiable)
1. Reuse/mirror first — never redesign, invent, simplify, or rename (Design Lock).
2. Tokens only (`var(--tds-*)`); barrel imports only (`@/components`); `.meta.ts` React/CSS-free.
3. Never hand-edit generated outputs (figma/*, src/generated/*, src/tokens/generated/*, code.js).
4. Stay in your domain; hand off across the boundary — do not cross it.

## Before finishing
- Run the domain gate (`npm run lint` / `catalog:build` / `ds:build` / `figma:build`).
- Report concisely: what you reused vs created (or reproduced), exact import lines / counts, and any gap you could NOT resolve. No large diffs, no full bundle.
```

**PLANNED roles skeleton** (do NOT create files until sanctioned): `@token-smith` (token pipeline — `src/tokens/*`, `scripts/build-tokens.ts`), `@catalog-scribe` (docs/autodocs — `docs/COMPONENTS.md`, `docs/ai-os/*`), `@reviewer` ([30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md) drift/design-lock gate → [.ai/REVIEW_REPORT.md](../../.ai/REVIEW_REPORT.md)), `@resume-warden` (session rehydration → [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md)), and backend `@supabase-eng`/`@api-eng`/`@db-eng` (docs 14–17). Each MUST ship with a contract in this format and least-privilege tools.

---

## 12. Future Extension

- **Grow the roster deliberately, not reactively.** Add a PLANNED role only when the two ACTIVE agents provably cannot own the work without domain conflict (Rule 2). Each new agent ships as a reviewed `.claude/agents/*.md` with a contract in §11 and an entry in this doc.
- **MCP-exposed agent actions.** As [35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md) lands, each subagent's core actions (reuse-first lookup, plugin regen, token change) become MCP tools so external agents (Gemini CLI, Cursor, Codex, Windsurf) delegate through the same contracts — one roster, many front-ends.
- **Backend agent tier (PLANNED, >10M users).** When the Supabase backend is built, `@supabase-eng`/`@api-eng`/`@db-eng` join with network/DB tool grants reviewed under [22_SECURITY_GUIDE.md](./22_SECURITY_GUIDE.md); their contracts open with the mandatory **"STATUS: PLANNED"** banner until the surface exists. Frontend↔backend sync becomes a first-class multi-agent workflow ([21_ARCHITECTURE_GUIDE.md](./21_ARCHITECTURE_GUIDE.md)).
- **Parallel fan-out at scale.** For large migrations (e.g. a token rename across all 60 components), the orchestrator may fan out multiple `@tds-component` instances over **disjoint** file sets (Rule 3 preserved by non-overlapping ownership), then converge with a single `@figma-plugin` regen and one review gate.
- **Determinism as the roster grows.** Every added agent inherits the read-before-write, generated-is-sacred, and Design-Lock rules so behavior stays identical across models and years — the AI OS guarantee that ten agents produce the same result one would.
