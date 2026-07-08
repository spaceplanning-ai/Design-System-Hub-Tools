# 27 — Manifest Specification

> **Title:** Manifest Specification
> **Purpose:** Define the `.ai/` manifest system in full — the machine-readable cache/state layer that lets AI agents operate on TDS with minimal token cost — specifying, for each of the 17 manifests, its Purpose, JSON/Markdown shape, Update Rules, Read Rules, Dependencies, Validation Rules, and a concrete example, plus the shared envelope, the (PLANNED) generator, and the read/regenerate/reconcile cycle.
> **Status:** ACTIVE (specification) — the `.ai/` directory and its generator `scripts/build-ai-manifests.ts` are **PLANNED / not yet materialized** in the repo.
> **Owner:** AI OS
> **Last-reviewed:** _(placeholder — set on review)_
> **Precedence:** Subordinate to [00_MASTER_RULES.md](./00_MASTER_RULES.md). The `.ai/` manifests are **the AI cache/state layer — source-of-truth tier #4-adjacent**: always regenerated/reconciled from sources #2 (Storybook + `*.meta.ts` + `src/tokens/*`) and #3 (the generated manifests). A manifest is **never** authoritative over the source it derives from; when they disagree, the source wins and the manifest is stale and MUST be regenerated. Backend-facing manifests (`ERD.json`, `API_SPEC.json`) are **PLANNED**.

---

## 1. Purpose

The `.ai/` directory is the **AI operating memory** of TDS: a small, flat, JSON-first set of manifests that pre-digests the repository so an AI agent (Claude Code, Gemini CLI, Cursor, Codex, Windsurf, or an MCP agent) can answer "what exists, how is it shaped, what changed, what's next" **without reading dozens of source files**. It exists to serve the five non-negotiable AI-OS goals — minimal token usage, resume-after-context-loss, no design drift, no duplicated work, and Storybook↔Figma↔code sync.

Two categories of manifest live side by side:

1. **DATA-DERIVED indexes** — regenerated deterministically by the (PLANNED) `scripts/build-ai-manifests.ts` from real source: `src/tokens/generated/figma.tokens.json`, `src/generated/design-system.manifest.json`, `figma/tds.plugin.json`, `src/components/metas.ts`, and the component `*.meta.ts` files. These are **derived, disposable, and never hand-edited** — the same "generated is sacred" rule that governs `figma/` and `src/generated/` (see [00_MASTER_RULES.md](./00_MASTER_RULES.md), [18_FOLDER_STRUCTURE.md](./18_FOLDER_STRUCTURE.md)).
2. **SEED / RUNTIME state** — hand-authored once or written by AI during a session (`PROJECT_MANIFEST.json`, `TASKS.json`, `SESSION_SUMMARY.md`, `CHANGELOG.md`, `REVIEW_REPORT.md`, and the SEED policy blocks inside `INTERACTION_RULES.json` / `RESPONSIVE_RULES.json`). These carry `"seed": true` and are the resume/audit backbone (see [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md), [37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md)).
3. **PLANNED** — `ERD.json`, `API_SPEC.json` describe the future Supabase/Node backend that **does not exist in the repo today** and carry `"status": "planned"` (see [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [15_API_GUIDE.md](./15_API_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md)).

This document is the **contract** for that directory: the shape of every file, when it is read, when it is written, and how compliance is validated.

---

## 2. Responsibilities

This specification owns:

- The **shared envelope** every manifest carries (`$schema`, `version`, `generatedAt`, `generator` / `seed` / `status`) and the JSON-first house style.
- The **full roster of 17 manifests**, their classification (DATA-DERIVED / SEED / PLANNED), and per-file schema + Update/Read/Dependencies/Validation/Example.
- The **(PLANNED) generator** `scripts/build-ai-manifests.ts` and its (PLANNED) npm script `ai:build`, plus how it slots after `ds:build`.
- The **read/regenerate/reconcile cycle** — how an agent consumes manifests first, and when it must refresh them.
- The **staleness contract** — how drift between a manifest and its source is detected and resolved.

It does **not** own: the token model itself ([08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md)), the component/variant models ([07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md), [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md)), the Figma bundle contract ([05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md), `figma/README.md`), the resume protocol semantics ([28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md)), the memory hygiene lifecycle ([37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md)), or token-cost tactics ([26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md)) — those docs consume this contract.

---

## 3. Scope

**In scope**

- All 17 files in `.ai/`: `PROJECT_MANIFEST.json`, `DESIGN_MANIFEST.json`, `COMPONENT_INDEX.json`, `TOKEN_INDEX.json`, `FIGMA_MAPPING.json`, `PLUGIN_INDEX.json`, `VARIANT_INDEX.json`, `RESPONSIVE_RULES.json`, `INTERACTION_RULES.json`, `ANIMATION_RULES.json`, `DEPENDENCY_GRAPH.json`, `ERD.json`, `API_SPEC.json`, `TASKS.json`, `SESSION_SUMMARY.md`, `CHANGELOG.md`, `REVIEW_REPORT.md`.
- The envelope, generation, read/write cycle, validation, and failure recovery for those files.

**Out of scope**

- The *substance* of each domain (token values, component anatomy, plugin algorithm) — owned by the sibling docs cited above; this doc specifies only the **manifest projection** of that substance.
- The generated design outputs themselves (`figma/tds.plugin.json`, `src/generated/design-system.manifest.json`, `src/tokens/generated/*`) — those are source **inputs** to the DATA-DERIVED manifests, governed by their own specs. Manifests summarize them; they never replace them.
- Backend runtime, migrations, and live API behavior — **PLANNED**; only the manifest *placeholders* (`ERD.json`, `API_SPEC.json`) are in scope here.

---

## 4. Rules

> Enforceable. **MUST / SHOULD / NEVER.** "The generator" = the PLANNED `scripts/build-ai-manifests.ts` (npm `ai:build`).

1. **R1 — Envelope is mandatory.** Every JSON manifest MUST begin with `"$schema"`, `"version"` (integer, starts at `1`), and `"generatedAt"` (ISO-8601 UTC). It MUST additionally carry exactly one provenance key: `"generator"` (DATA-DERIVED), `"seed": true` (SEED/runtime), or `"status": "planned"` (PLANNED). Markdown manifests carry the same fields in a top HTML-comment or front-matter block.
2. **R2 — Generated is sacred.** DATA-DERIVED manifests MUST NEVER be hand-edited. To change one, change the **source** (`*.meta.ts`, `src/tokens/*`, or the build scripts) and re-run the generator. This is the same rule that protects `figma/` and `src/generated/` per [00_MASTER_RULES.md](./00_MASTER_RULES.md).
3. **R3 — Determinism.** The generator MUST be pure and idempotent: identical source ⇒ byte-identical output (stable key order, sorted arrays, no timestamps *inside* payloads except the single top-level `generatedAt`). Re-running with no source change MUST produce a no-op diff (modulo `generatedAt`).
4. **R4 — Source precedence.** A manifest is **never** authoritative. On any disagreement, the upstream source (Storybook / `*.meta.ts` / `src/tokens/*` / the generated design manifests) wins; the manifest is declared stale and MUST be regenerated before it is trusted (see [00_MASTER_RULES.md](./00_MASTER_RULES.md) §Source-of-Truth Hierarchy).
5. **R5 — Read-before-write.** An agent MUST read the relevant manifest(s) **before** touching source (reuse-first, drift-avoidance). `COMPONENT_INDEX.json` + `TOKEN_INDEX.json` + `VARIANT_INDEX.json` are the mandatory pre-read for any component/token/variant task; `TASKS.json` + `SESSION_SUMMARY.md` for any resumed session.
6. **R6 — Manifest-first, source-second.** Agents SHOULD answer "does X exist / what is X's shape" from a manifest and only open the underlying `*.tsx`/`*.meta.ts`/`*.css` when the manifest cannot answer (exact prop shape, compound sub-parts). This is the token-budget contract of [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md).
7. **R7 — No design decisions in manifests.** A manifest MUST NEVER introduce a token, variant, color, spacing, or component that is not present upstream. Manifests **describe**; they do not **decide**. Any such addition is design drift and violates the Design Lock ([03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md)).
8. **R8 — Runtime state is append-safe.** SEED/runtime files (`TASKS.json`, `SESSION_SUMMARY.md`, `CHANGELOG.md`, `REVIEW_REPORT.md`) MUST be written by agents using structured, append-or-merge edits (never destructive rewrites that lose prior task history), and MUST remain valid against their schema after every write.
9. **R9 — PLANNED honesty.** `ERD.json` and `API_SPEC.json` MUST carry `"status": "planned"` and MUST NOT be presented as describing anything that runs today. No agent may infer that a backend exists from their presence.
10. **R10 — Regenerate after any source change.** After any change that flows through `npm run ds:build` (tokens, metas, manifest) the agent MUST run the generator (`ai:build`, PLANNED) so the DATA-DERIVED manifests are reconciled in the same commit. A commit that changes a `*.meta.ts` or a token but not the corresponding manifest is **incomplete**.
11. **R11 — Schema stability.** Adding a field to a manifest schema is a SHOULD-be-backward-compatible change; removing/renaming a field MUST bump the manifest's `"version"` and be noted in `CHANGELOG.md`.
12. **R12 — Naming is frozen.** Manifests MUST use the canonical registry verbatim — token ids in dot-notation, CSS vars `--tds-*`, Figma names slash-notation, axes `type`/`variant`(Style)/`tone`/`size`/`shape`/`state`, collections `Primitives`/`Semantic`/`Theme`. NEVER rename ([00_MASTER_RULES.md](./00_MASTER_RULES.md)).

---

## 5. Workflow

The `.ai/` layer participates in three loops. All npm scripts are real unless marked **PLANNED**.

### 5.1 Generation (build the derived indexes)

```bash
# 1. Regenerate the design source-of-truth outputs (REAL)
npm run ds:build          # tokens:build → manifest:build → catalog:build
#    → src/tokens/generated/{tokens.css, figma.tokens.json, token-ids.ts}
#    → src/generated/design-system.manifest.json  +  figma/tds.plugin.json
#    → docs/COMPONENTS.md

# 2. Project those outputs into the AI cache (PLANNED)
npm run ai:build          # tsx scripts/build-ai-manifests.ts
#    → .ai/PROJECT_MANIFEST.json, DESIGN_MANIFEST.json, COMPONENT_INDEX.json,
#      TOKEN_INDEX.json, FIGMA_MAPPING.json, PLUGIN_INDEX.json, VARIANT_INDEX.json,
#      RESPONSIVE_RULES.json, INTERACTION_RULES.json, ANIMATION_RULES.json,
#      DEPENDENCY_GRAPH.json  (DATA-DERIVED)
#    (ERD.json / API_SPEC.json emitted as PLANNED stubs; runtime files untouched)
```

`ai:build` reads **only** already-generated artifacts and source `*.meta.ts`/`src/tokens/*` — it never reads `figma/` output back into itself in a way that could invert precedence (R4). It is deterministic (R3).

### 5.2 Consumption (agent read cycle)

1. **Rehydrate:** read `PROJECT_MANIFEST.json` (root pointer) → `SESSION_SUMMARY.md` + `TASKS.json` (where am I / what's next).
2. **Scope the task:** read the domain index(es) — `COMPONENT_INDEX.json`, `TOKEN_INDEX.json`, `VARIANT_INDEX.json`, `FIGMA_MAPPING.json`, etc.
3. **Only then** open source files the manifest could not answer (R6).
4. **Act** (edit meta/tokens/CSS per the relevant spec).

### 5.3 Reconciliation (write-back)

5. Run `ds:build`, then `ai:build` (R10).
6. Update runtime state: mark the `TASKS.json` entry done, append to `CHANGELOG.md`, write `REVIEW_REPORT.md`, refresh `SESSION_SUMMARY.md` (see [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md), [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)).
7. Validate (§7) and commit source + regenerated manifests **together**.

---

## 6. Examples — the 17-manifest catalog

Each entry states **Class** (DATA-DERIVED / SEED / PLANNED), Purpose, Schema, Update Rules, Read Rules, Dependencies, Validation, and a concrete repo-specific Example. Example payloads are illustrative subsets; exact counts/arrays are whatever the generator computes from live source (R3).

### 6.1 `PROJECT_MANIFEST.json` — **SEED** (with derived summary fields)

- **Purpose:** The root pointer / table-of-contents for the whole `.ai/` layer. First file any agent reads; identifies the repo, the AI-OS version, and links every other manifest and key doc.
- **Update Rules:** Hand-authored once (`"seed": true`); `summary` counts refreshed by the generator. Bump `version` on structural change.
- **Read Rules:** Read **first**, every session (R5). Never open other manifests before this resolves their paths.
- **Dependencies:** points at all 16 sibling manifests + `docs/ai-os/00_MASTER_RULES.md` + `docs/COMPONENTS.md`.
- **Validation:** every referenced path MUST exist (or be a PLANNED stub); `identity.package === "tds"`.

```json
{
  "$schema": "https://tds.dev/schemas/ai/project-manifest.json",
  "version": 1,
  "generatedAt": "2026-07-08T00:00:00Z",
  "seed": true,
  "identity": { "package": "tds", "packageVersion": "0.1.0", "node": ">=20", "type": "module" },
  "aiOs": { "docsDir": "docs/ai-os", "manifestsDir": ".ai", "constitution": "docs/ai-os/00_MASTER_RULES.md" },
  "summary": { "components": 60, "atoms": 24, "molecules": 27, "organisms": 9, "tokenCollections": 3 },
  "manifests": {
    "design": ".ai/DESIGN_MANIFEST.json",
    "components": ".ai/COMPONENT_INDEX.json",
    "tokens": ".ai/TOKEN_INDEX.json",
    "figmaMapping": ".ai/FIGMA_MAPPING.json",
    "tasks": ".ai/TASKS.json",
    "session": ".ai/SESSION_SUMMARY.md"
  },
  "backend": { "status": "planned", "target": "Supabase + Node/TS" }
}
```

### 6.2 `DESIGN_MANIFEST.json` — **DATA-DERIVED** (+ SEED Design-Lock block)

- **Purpose:** One-screen design summary: token-collection roster, theme modes, effect/text style counts, and the immutable Design-Lock statement — so an agent grasps the design contract without opening `figma/tds.plugin.json`.
- **Update Rules:** `summary`/`collections` derived from `figma/tds.plugin.json` `tokens`; the `designLock` block is SEED (verbatim from [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md)) and never auto-mutated.
- **Read Rules:** Read before any design-touching task to confirm the lock and the collection order.
- **Dependencies:** `figma/tds.plugin.json`, [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md), [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md).
- **Validation:** collection order MUST be `Primitives → Semantic → Theme`; theme modes MUST be `["light","dark"]`.

```json
{
  "$schema": "https://tds.dev/schemas/ai/design-manifest.json",
  "version": 1, "generatedAt": "2026-07-08T00:00:00Z",
  "generator": "scripts/build-ai-manifests.ts",
  "collections": [
    { "name": "Primitives", "id": "primitive", "modes": ["default"] },
    { "name": "Semantic",   "id": "semantic",  "modes": ["default"] },
    { "name": "Theme",      "id": "theme",     "modes": ["light", "dark"] }
  ],
  "styles": { "effectStyles": 1, "textStyles": 6 },
  "cssPrefix": "--tds-",
  "designLock": {
    "sourceOfTruth": "Storybook",
    "figmaRole": "faithful reproduction — never a redesign",
    "prohibited": ["redesign","recolor","respacing","rename token/component/variant","edit generated outputs"]
  }
}
```

### 6.3 `COMPONENT_INDEX.json` — **DATA-DERIVED**

- **Purpose:** Flat, reuse-first index of all 60 components — name, slug, tier, tags, variant axes, prop names, compound sub-parts — the machine twin of `docs/COMPONENTS.md`. Powers "does this already exist?" without reading any `*.tsx`.
- **Update Rules:** Regenerated from `src/components/metas.ts` (`atomMetas`+`moleculeMetas`+`organismMetas` → `componentMetas`) and `src/generated/design-system.manifest.json`.
- **Read Rules:** **Mandatory pre-read** for any component task (R5). Prefer it over opening component source (R6).
- **Dependencies:** `src/components/metas.ts`, each `*.meta.ts`, `src/generated/design-system.manifest.json`; mirrors [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md).
- **Validation:** count MUST equal the manifest `summary.components`; every `slug` unique; every `barrelExport` resolvable from `@/components`.

```json
{
  "$schema": "https://tds.dev/schemas/ai/component-index.json",
  "version": 1, "generatedAt": "2026-07-08T00:00:00Z",
  "generator": "scripts/build-ai-manifests.ts",
  "components": [
    {
      "name": "Button", "slug": "button", "tier": "atom",
      "barrelExport": "Button", "tags": ["actions"],
      "axes": { "type": ["A","B","C"], "variant": ["solid","outline","ghost","soft","link"],
                "tone": ["brand","neutral","success","warning","danger"],
                "size": ["sm","md","lg"], "shape": ["rounded","pill","square"] },
      "componentProps": ["disabled","loading"], "compound": []
    },
    {
      "name": "Card", "slug": "card", "tier": "molecule",
      "barrelExport": "Card", "tags": ["layout"],
      "axes": { "type": ["A","B","C"] }, "compound": ["Card.Header","Card.Body","Card.Footer"]
    }
  ]
}
```

### 6.4 `TOKEN_INDEX.json` — **DATA-DERIVED**

- **Purpose:** Flat index of every design token — dot-notation id, `--tds-*` CSS var, Figma slash-name, type, collection, modes, alias target, scopes. Answers "what token do I use for X" and "does this token exist" without opening `src/tokens/*`.
- **Update Rules:** Regenerated from `src/tokens/generated/figma.tokens.json` + `token-ids.ts` (produced by `npm run tokens:build`).
- **Read Rules:** Mandatory pre-read for any styling/token task; the CSS-var lookup source for component CSS.
- **Dependencies:** `src/tokens/generated/figma.tokens.json`, `src/tokens/generated/token-ids.ts`; mirrors [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md).
- **Validation:** every `cssVar` matches `--tds-` + id-with-dashes; every `alias` resolves to a real id; ids ⊆ `token-ids.ts` `TokenId` union.

```json
{
  "$schema": "https://tds.dev/schemas/ai/token-index.json",
  "version": 1, "generatedAt": "2026-07-08T00:00:00Z",
  "generator": "scripts/build-ai-manifests.ts",
  "tokens": [
    { "id": "color.bg.default", "cssVar": "--tds-color-bg-default", "figmaName": "color/bg/default",
      "type": "color", "collection": "theme", "modes": ["light","dark"], "alias": "color.white", "scopes": ["ALL_FILLS"] },
    { "id": "color.brand.solid", "cssVar": "--tds-color-brand-solid", "figmaName": "color/brand/solid",
      "type": "color", "collection": "semantic", "scopes": ["ALL_FILLS"] },
    { "id": "space.4", "cssVar": "--tds-space-4", "figmaName": "space/4",
      "type": "dimension", "collection": "primitive", "scopes": ["GAP","WIDTH_HEIGHT"] }
  ]
}
```

### 6.5 `FIGMA_MAPPING.json` — **DATA-DERIVED**

- **Purpose:** The Storybook↔Figma bridge: per component, its Component Set name(s), `variantAxes`, `figmaProperties` (VARIANT/BOOLEAN/TEXT/INSTANCE_SWAP), `tokenBindings`, and target Page — the map the plugin realizes. Lets an agent verify sync without parsing the full `figma/tds.plugin.json`.
- **Update Rules:** Regenerated from `figma/tds.plugin.json` `design.components` + the `pageForComponent` classifier in `figma/plugin/src/pages.ts`.
- **Read Rules:** Read for any Figma-sync task or drift check ([05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md), [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)).
- **Dependencies:** `figma/tds.plugin.json`, `figma/plugin/src/pages.ts`; mirrors [05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md), [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md).
- **Validation:** `state` MUST NOT appear in any `variantAxes` (state-axis exclusion policy); components with a `type` axis MUST map to one set per preset (e.g. `A Type - Card`); `disabled`/`loading` survive as BOOLEAN props only.

```json
{
  "$schema": "https://tds.dev/schemas/ai/figma-mapping.json",
  "version": 1, "generatedAt": "2026-07-08T00:00:00Z",
  "generator": "scripts/build-ai-manifests.ts",
  "components": [
    {
      "name": "Button", "page": "TDS · 4. Actions", "isComponentSet": true,
      "variantAxes": [
        { "name": "Style", "options": ["solid","outline","ghost","soft","link"] },
        { "name": "tone",  "options": ["brand","neutral","success","warning","danger"] },
        { "name": "size",  "options": ["sm","md","lg"] }
      ],
      "figmaProperties": [
        { "propName": "disabled", "figmaPropertyType": "BOOLEAN" },
        { "propName": "loading",  "figmaPropertyType": "BOOLEAN" },
        { "propName": "label",    "figmaPropertyType": "TEXT" }
      ],
      "tokenBindings": [
        { "property": "fill", "token": "color.brand.solid", "when": { "Style": "solid", "tone": "brand" } }
      ]
    }
  ]
}
```

### 6.6 `PLUGIN_INDEX.json` — **DATA-DERIVED**

- **Purpose:** Index of the Figma plugin's own structure — entry `code.ts`, module roster (`components.ts`, `recipes.ts`, `variables.ts`, `styles.ts`, `pages.ts`, `foundation.ts`, `doc.ts`, `log.ts`, `types.ts`), the 8 output Pages, and the headless harness gate — so plugin work starts from a map, not a directory crawl.
- **Update Rules:** Regenerated by scanning `figma/plugin/src/*` and `figma/plugin/test/harness.ts`. `entry` MUST be `code.ts` (there is NO `main.ts`).
- **Read Rules:** Mandatory pre-read for `@figma-plugin` tasks.
- **Dependencies:** `figma/plugin/src/*`, `figma/plugin/manifest.json`, `figma/plugin/test/harness.ts`; mirrors [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md).
- **Validation:** `entry === "figma/plugin/src/code.ts"`; `pages.length === 8`; harness path exists; `networkAccess` recorded as `none`.

```json
{
  "$schema": "https://tds.dev/schemas/ai/plugin-index.json",
  "version": 1, "generatedAt": "2026-07-08T00:00:00Z",
  "generator": "scripts/build-ai-manifests.ts",
  "entry": "figma/plugin/src/code.ts",
  "modules": ["components.ts","recipes.ts","variables.ts","styles.ts","pages.ts","foundation.ts","doc.ts","log.ts","types.ts"],
  "build": { "typecheck": "plugin:typecheck", "bundle": "plugin:build", "test": "plugin:test", "outfile": "figma/plugin/code.js" },
  "pages": ["1. Foundation","2. Layout","3. Navigation","4. Actions","5. Input","6. Data Display","7. Feedback","8. Overlay"],
  "harness": "figma/plugin/test/harness.ts", "networkAccess": "none"
}
```

### 6.7 `VARIANT_INDEX.json` — **DATA-DERIVED**

- **Purpose:** Cross-component axis catalog: every axis (`type`, `variant`/Style, `tone`, `size`, `shape`, `state`), its allowed values, which components use it, and the **state-axis exclusion policy**. Answers "what values does `tone` allow" and "which components have a `type` preset" in one read.
- **Update Rules:** Regenerated from each `*.meta.ts` (`variantProps` / axes) via `src/components/metas.ts`.
- **Read Rules:** Mandatory pre-read for any variant task ([09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md)).
- **Dependencies:** `*.meta.ts`, `src/core/defineComponent.ts` (`variantCount`); mirrors [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md).
- **Validation:** `state` flagged `figmaEmitted:false`; `type` values ⊆ `["A","B","C"]`; `variant.label === "Style"`.

```json
{
  "$schema": "https://tds.dev/schemas/ai/variant-index.json",
  "version": 1, "generatedAt": "2026-07-08T00:00:00Z",
  "generator": "scripts/build-ai-manifests.ts",
  "axes": {
    "type":    { "role": "layout preset", "values": ["A","B","C"], "usedBy": ["Button","Card","Avatar"] },
    "variant": { "label": "Style", "values": ["solid","outline","ghost","soft","link"], "usedBy": ["Button","Badge"] },
    "tone":    { "values": ["brand","neutral","success","warning","danger"] },
    "size":    { "values": ["sm","md","lg"] },
    "shape":   { "values": ["rounded","pill","square"] },
    "state":   { "values": ["default","hover","active","focus","disabled","loading"],
                 "figmaEmitted": false, "note": "excluded from Figma variants; disabled/loading survive as BOOLEAN props" }
  }
}
```

### 6.8 `RESPONSIVE_RULES.json` — **DATA-DERIVED** (breakpoints) **+ SEED** (policy)

- **Purpose:** Breakpoint tokens + the mobile/tablet/desktop policy and `useMediaQuery` usage map, so responsive work does not re-derive breakpoints from source.
- **Update Rules:** `breakpoints` derived from `src/tokens/*` breakpoint tokens; the `policy` block is SEED (from [12_RESPONSIVE_SPECIFICATION.md](./12_RESPONSIVE_SPECIFICATION.md)).
- **Read Rules:** Read for any responsive/layout task.
- **Dependencies:** `src/tokens/*`, `src/hooks/index.ts` (`useMediaQuery`); mirrors [12_RESPONSIVE_SPECIFICATION.md](./12_RESPONSIVE_SPECIFICATION.md).
- **Validation:** breakpoint ids exist in `TOKEN_INDEX.json`; ascending, non-overlapping ranges.

```json
{
  "$schema": "https://tds.dev/schemas/ai/responsive-rules.json",
  "version": 1, "generatedAt": "2026-07-08T00:00:00Z",
  "generator": "scripts/build-ai-manifests.ts",
  "breakpoints": [
    { "id": "breakpoint.sm", "min": 640 }, { "id": "breakpoint.md", "min": 768 },
    { "id": "breakpoint.lg", "min": 1024 }, { "id": "breakpoint.xl", "min": 1280 }
  ],
  "policy": { "hook": "useMediaQuery", "approach": "mobile-first", "figma": "reproduce at fixed viewport widths, not fluid" }
}
```

### 6.9 `INTERACTION_RULES.json` — **SEED** (policy) **+ DATA-DERIVED** (hook roster)

- **Purpose:** The interaction/state contract: keyboard/focus expectations, disclosure hooks, and the rule that the `state` axis is not a Figma variant. Machine form of [11_INTERACTION_SPECIFICATION.md](./11_INTERACTION_SPECIFICATION.md).
- **Update Rules:** `hooks` derived from `src/hooks/index.ts`; `states` + `focusPolicy` are SEED.
- **Read Rules:** Read for any interactive component or Storybook `play` work.
- **Dependencies:** `src/hooks/index.ts`, [11_INTERACTION_SPECIFICATION.md](./11_INTERACTION_SPECIFICATION.md), [13_ACCESSIBILITY_SPECIFICATION.md](./13_ACCESSIBILITY_SPECIFICATION.md).
- **Validation:** every listed hook exists in `src/hooks/index.ts`; `states` matches the `state` axis in `VARIANT_INDEX.json`.

```json
{
  "$schema": "https://tds.dev/schemas/ai/interaction-rules.json",
  "version": 1, "generatedAt": "2026-07-08T00:00:00Z", "seed": true,
  "states": ["default","hover","active","focus","disabled","loading"],
  "figmaEmitsState": false,
  "hooks": ["useControllableState","useOnClickOutside","useKeyDown","useMediaQuery","useDisclosure","useFocusTrap"],
  "focusPolicy": { "visible": ":focus-visible", "trap": "useFocusTrap for overlays", "keyboard": "Esc closes, Arrow navigates menus" }
}
```

### 6.10 `ANIMATION_RULES.json` — **DATA-DERIVED** (motion tokens) **+ SEED** (policy)

- **Purpose:** Motion tokens (duration/easing), reduced-motion policy, and Figma-reproducibility limits. Machine form of [10_ANIMATION_SPECIFICATION.md](./10_ANIMATION_SPECIFICATION.md).
- **Update Rules:** `durations`/`easings` derived from `src/tokens/*` motion tokens; `reducedMotion`/`figmaLimits` are SEED.
- **Read Rules:** Read for any motion/transition work.
- **Dependencies:** `src/tokens/*`, [10_ANIMATION_SPECIFICATION.md](./10_ANIMATION_SPECIFICATION.md).
- **Validation:** motion token ids exist in `TOKEN_INDEX.json`; `reducedMotion.respects === "prefers-reduced-motion"`.

```json
{
  "$schema": "https://tds.dev/schemas/ai/animation-rules.json",
  "version": 1, "generatedAt": "2026-07-08T00:00:00Z",
  "generator": "scripts/build-ai-manifests.ts",
  "durations": [ { "id": "motion.duration.fast", "ms": 120 }, { "id": "motion.duration.base", "ms": 200 } ],
  "easings":   [ { "id": "motion.ease.standard", "value": "cubic-bezier(0.2,0,0,1)" } ],
  "reducedMotion": { "respects": "prefers-reduced-motion" },
  "figmaLimits": { "note": "Figma reproduces end states, not tweens; motion is documented, not animated" }
}
```

### 6.11 `DEPENDENCY_GRAPH.json` — **DATA-DERIVED**

- **Purpose:** Import/usage graph — which components compose which, what each `*.meta.ts` binds, and the barrel export surface (`@/components`). Powers impact analysis ("what breaks if I change Button") and duplicate-work avoidance.
- **Update Rules:** Regenerated by static analysis of `src/components/**` imports + `src/components/index.ts` barrel + `metas.ts`.
- **Read Rules:** Read before edits with blast radius (shared atoms, tokens) and during review ([30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md), [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md)).
- **Dependencies:** `src/components/**`, `src/components/index.ts`, `src/components/metas.ts`.
- **Validation:** acyclic within a tier direction (atoms→molecules→organisms); every node exported from `@/components`; no deep-path imports recorded.

```json
{
  "$schema": "https://tds.dev/schemas/ai/dependency-graph.json",
  "version": 1, "generatedAt": "2026-07-08T00:00:00Z",
  "generator": "scripts/build-ai-manifests.ts",
  "nodes": [
    { "id": "Button", "tier": "atom", "usedBy": ["Card","Dialog","Toolbar"], "tokens": ["color.brand.solid","space.4"] },
    { "id": "Card", "tier": "molecule", "uses": ["Button","Icon"], "compound": ["Card.Header","Card.Body","Card.Footer"] }
  ]
}
```

### 6.12 `ERD.json` — **PLANNED**

- **Purpose:** (PLANNED) Entity-relationship model for the future Supabase/Postgres backend — tables, columns, keys, RLS intent, indexes. **No database exists today.**
- **Update Rules:** Emitted as a `"status": "planned"` stub by the generator; hand-authored per [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md) when the backend is built.
- **Read Rules:** Treat as PLANNED; never infer a live schema from it (R9).
- **Dependencies:** [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md).
- **Validation:** MUST carry `"status": "planned"`; when populated, every table has a primary key and an RLS statement.

```json
{
  "$schema": "https://tds.dev/schemas/ai/erd.json",
  "version": 1, "generatedAt": "2026-07-08T00:00:00Z",
  "status": "planned",
  "note": "PLANNED — no database exists in the repo today. Target: Supabase Postgres + RLS, >10M users.",
  "entities": []
}
```

### 6.13 `API_SPEC.json` — **PLANNED**

- **Purpose:** (PLANNED) Contract for the future API layer (REST/RPC over Supabase + Node/TS) — endpoints, methods, request/response shapes, auth, versioning. **No API exists today.**
- **Update Rules:** `"status": "planned"` stub; hand-authored per [15_API_GUIDE.md](./15_API_GUIDE.md) when built.
- **Read Rules:** PLANNED only (R9).
- **Dependencies:** [15_API_GUIDE.md](./15_API_GUIDE.md), [16_NODE_GUIDE.md](./16_NODE_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md).
- **Validation:** MUST carry `"status": "planned"`; when populated, every endpoint declares `auth` and a versioned path.

```json
{
  "$schema": "https://tds.dev/schemas/ai/api-spec.json",
  "version": 1, "generatedAt": "2026-07-08T00:00:00Z",
  "status": "planned",
  "note": "PLANNED — no REST/GraphQL/RPC API, auth, or secrets exist today.",
  "endpoints": []
}
```

### 6.14 `TASKS.json` — **SEED / RUNTIME** (AI-maintained)

- **Purpose:** The active task board — the backbone of resume-after-context-loss. Each task: id, title, status, linked spec, files touched, gates.
- **Update Rules:** Written by agents during work (R8, append/merge, never destructive). Not derived from code.
- **Read Rules:** Read at session start (rehydrate) and before picking up work ([28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md), [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md)).
- **Dependencies:** `SESSION_SUMMARY.md`, `REVIEW_REPORT.md`, [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md).
- **Validation:** every `status` ∈ `["todo","in-progress","blocked","review","done"]`; `in-progress` tasks ≤ 1 per agent; ids unique.

```json
{
  "$schema": "https://tds.dev/schemas/ai/tasks.json",
  "version": 1, "generatedAt": "2026-07-08T00:00:00Z", "seed": true,
  "tasks": [
    { "id": "T-014", "title": "Add tone=info to Badge", "status": "in-progress",
      "spec": "docs/ai-os/09_VARIANT_SPECIFICATION.md",
      "files": ["src/components/atoms/Badge/Badge.meta.ts"],
      "gates": ["lint","ds:build","figma:build"], "updatedAt": "2026-07-08T00:00:00Z" }
  ]
}
```

### 6.15 `SESSION_SUMMARY.md` — **SEED / RUNTIME** (Markdown, AI-written)

- **Purpose:** Human+AI-readable "where am I" checkpoint written at the end of every working session so the next context window rehydrates in one read.
- **Update Rules:** Overwritten/appended by the agent at checkpoints; carries the envelope fields in a top comment.
- **Read Rules:** Read **second**, after `PROJECT_MANIFEST.json`, every session.
- **Dependencies:** `TASKS.json`, `CHANGELOG.md`, [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md).
- **Validation:** MUST reference the current `TASKS.json` in-progress id; MUST list the last commit / next step.

```markdown
<!-- $schema: ai/session-summary v1 · generatedAt: 2026-07-08T00:00:00Z · seed: true -->
# Session Summary
- **Active task:** T-014 — Add tone=info to Badge (in-progress)
- **Last done:** edited `Badge.meta.ts`; `ds:build` green.
- **Next step:** run `npm run figma:build`; update `.ai/COMPONENT_INDEX.json` via `ai:build`.
- **Open gates:** figma:build, review.
- **Do NOT:** hand-edit `figma/tds.plugin.json`.
```

### 6.16 `CHANGELOG.md` — **SEED / RUNTIME** (Markdown)

- **Purpose:** Human-readable, chronological record of every source change that flowed through the pipeline — the audit trail for change management and releases.
- **Update Rules:** Appended (never rewritten) on each merged change per [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md); Keep-a-Changelog style, semver headings.
- **Read Rules:** Read for release prep and to understand recent history ([32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md)).
- **Dependencies:** `TASKS.json`, `REVIEW_REPORT.md`, [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md).
- **Validation:** entries append-only; each references a task id and the gates that passed.

```markdown
<!-- $schema: ai/changelog v1 · seed: true -->
# Changelog
## [Unreleased]
### Added
- Badge: `tone=info` variant (T-014). Gates: lint ✓, ds:build ✓, figma:build ✓.
```

### 6.17 `REVIEW_REPORT.md` — **SEED / RUNTIME** (Markdown, AI-written)

- **Purpose:** The output of the review gate for the current change — Design-Lock check, drift check, sync check, verdict (BLOCK / PASS).
- **Update Rules:** Written per review by the reviewing agent ([30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md)); overwritten per change, archived into `CHANGELOG.md` on pass.
- **Read Rules:** Read before commit/merge; a `BLOCK` verdict forbids commit.
- **Dependencies:** `DEPENDENCY_GRAPH.json`, `FIGMA_MAPPING.json`, [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md), [39_AI_CHECKLIST.md](./39_AI_CHECKLIST.md).
- **Validation:** MUST record verdict ∈ `["PASS","BLOCK"]`; a PASS MUST show all required gates green.

```markdown
<!-- $schema: ai/review-report v1 · seed: true -->
# Review Report — T-014
- **Design Lock:** PASS (no recolor/respacing/rename; source-only change)
- **Drift:** PASS (`ai:build` diff matches source; no hand-edited generated files)
- **Sync:** PASS (Storybook ↔ FIGMA_MAPPING.json consistent; plugin:test green)
- **Verdict:** PASS
```

---

## 7. Validation Rules

Compliance is checked by a mix of schema validation, the generator's own assertions, and the existing build gates:

1. **Envelope & schema** — every `.ai/*.json` MUST validate against its `"$schema"` (JSON Schema check in `ai:build`, PLANNED); missing envelope keys fail the build (R1).
2. **Determinism / no-drift** — re-running `npm run ai:build` on unchanged source MUST yield no diff except `generatedAt`. CI (PLANNED, [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)) runs `ds:build && ai:build` and fails on a dirty git tree — proving no manifest was hand-edited (R2, R3).
3. **Cross-manifest referential integrity** — `COMPONENT_INDEX` count === `design-system.manifest.json` `summary.components`; every `TOKEN_INDEX.id` ∈ `token-ids.ts`; every `FIGMA_MAPPING` component ∈ `COMPONENT_INDEX`; every `DEPENDENCY_GRAPH` node exported from `@/components`.
4. **Design-Lock invariants** — no `state` axis in any `FIGMA_MAPPING.variantAxes`; `type` values ⊆ `A/B/C`; `variant.label === "Style"`; collection order `Primitives→Semantic→Theme`; theme modes `light/dark` (R7, R12).
5. **PLANNED honesty** — `ERD.json`/`API_SPEC.json` MUST carry `"status":"planned"` and empty payload arrays until the backend exists (R9).
6. **Runtime validity** — after any agent write, `TASKS.json` and the Markdown state files MUST still validate (≤1 `in-progress`, verdict enums, append-only changelog) (R8).
7. **Existing gates back the source** — `npm run lint`, `npm run build` (tsc), `npm run figma:build` (which runs `ds:build` + `plugin:typecheck` + `plugin:build` + `plugin:test`) validate the *source* the manifests derive from; a red gate means the manifests must not be regenerated/committed.

---

## 8. Checklist

- [ ] Read `PROJECT_MANIFEST.json` → `SESSION_SUMMARY.md` → `TASKS.json` at session start.
- [ ] Read the domain index(es) (`COMPONENT_INDEX` / `TOKEN_INDEX` / `VARIANT_INDEX` / `FIGMA_MAPPING`) **before** opening source (R5, R6).
- [ ] Never hand-edit a DATA-DERIVED manifest; change source instead (R2).
- [ ] After source changes: `npm run ds:build` → `npm run ai:build` (PLANNED) in the same commit (R10).
- [ ] Confirm `git status` clean after regenerate (proves determinism / no hand-edit) (R3).
- [ ] Update `TASKS.json` status, append `CHANGELOG.md`, write `REVIEW_REPORT.md`, refresh `SESSION_SUMMARY.md` (R8).
- [ ] Verify referential integrity + Design-Lock invariants (§7.3, §7.4).
- [ ] Ensure `ERD.json` / `API_SPEC.json` still marked `"status":"planned"` (R9).
- [ ] Commit source + regenerated manifests together; a partial commit is incomplete.

---

## 9. Failure Recovery

| Symptom | Diagnosis | Fix | Resume |
|---|---|---|---|
| `ai:build` diff after no source change | Non-determinism or a hand-edit crept in | Discard the manifest change; re-run `ds:build && ai:build`; find/revert the hand-edit | Re-validate `git status` clean |
| Manifest count ≠ manifest `summary` | Manifest stale (source changed, generator not run) | Run `npm run ds:build && npm run ai:build` | Re-read the refreshed index |
| Agent "invents" a token/variant not in source | Read a stale/edited manifest, or skipped read-before-write | Regenerate manifests; re-read; remove the invented item (Design-Lock breach) | Redo the task from the source of truth |
| `state` axis appears in `FIGMA_MAPPING` | Generator or meta violates state-exclusion policy | Fix the `*.meta.ts` / generator so `state` is not emitted as a variant | Re-run `figma:build`; confirm `plugin:test` green |
| `.ai/` directory missing entirely | System not yet materialized (current repo state) | Create `.ai/`; author SEED files; implement `scripts/build-ai-manifests.ts`; run `ai:build` ([34_PROJECT_BOOTSTRAP.md](./34_PROJECT_BOOTSTRAP.md)) | Commit seed + first derived generation |
| Lost context mid-task | Normal context-window loss | Read `SESSION_SUMMARY.md` + `TASKS.json` in-progress entry | Continue from "Next step" |
| `ERD.json`/`API_SPEC.json` read as if live | PLANNED status ignored | Re-read the `"status":"planned"` field; do not proceed as if a backend exists | Escalate per [15_API_GUIDE.md](./15_API_GUIDE.md) |

---

## 10. Dependencies

**Source inputs (upstream — DATA-DERIVED manifests read these):**
`src/tokens/generated/{figma.tokens.json, token-ids.ts}`, `src/generated/design-system.manifest.json`, `figma/tds.plugin.json`, `src/components/metas.ts` + all `*.meta.ts`, `src/components/index.ts`, `src/hooks/index.ts`, `figma/plugin/src/*` (esp. `pages.ts`), `figma/plugin/test/harness.ts`.

**Scripts:** `scripts/build-tokens.ts`, `scripts/build-manifest.ts`, `scripts/build-catalog.ts` (REAL); `scripts/build-ai-manifests.ts` (**PLANNED**). npm: `ds:build`, `figma:build`, `lint`, `build` (REAL); `ai:build` (**PLANNED**).

**Sibling docs:** [00_MASTER_RULES.md](./00_MASTER_RULES.md), [02_AI_HARNESS.md](./02_AI_HARNESS.md), [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md), [05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md), [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md), [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md), [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md), [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md), [10_ANIMATION_SPECIFICATION.md](./10_ANIMATION_SPECIFICATION.md), [11_INTERACTION_SPECIFICATION.md](./11_INTERACTION_SPECIFICATION.md), [12_RESPONSIVE_SPECIFICATION.md](./12_RESPONSIVE_SPECIFICATION.md), [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [15_API_GUIDE.md](./15_API_GUIDE.md), [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md), [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md), [29_TASK_EXECUTION.md](./29_TASK_EXECUTION.md), [30_REVIEW_SYSTEM.md](./30_REVIEW_SYSTEM.md), [31_CHANGE_MANAGEMENT.md](./31_CHANGE_MANAGEMENT.md), [34_PROJECT_BOOTSTRAP.md](./34_PROJECT_BOOTSTRAP.md), [35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md), [37_AI_MEMORY_SYSTEM.md](./37_AI_MEMORY_SYSTEM.md), [40_FINAL_OPERATING_MANUAL.md](./40_FINAL_OPERATING_MANUAL.md).

**Runtime manifests referenced:** [.ai/PROJECT_MANIFEST.json](../../.ai/PROJECT_MANIFEST.json), [.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json), [.ai/TOKEN_INDEX.json](../../.ai/TOKEN_INDEX.json), [.ai/FIGMA_MAPPING.json](../../.ai/FIGMA_MAPPING.json), [.ai/TASKS.json](../../.ai/TASKS.json), [.ai/SESSION_SUMMARY.md](../../.ai/SESSION_SUMMARY.md).

---

## 11. Template

**Reusable DATA-DERIVED manifest skeleton** (`.ai/<NAME>.json`):

```json
{
  "$schema": "https://tds.dev/schemas/ai/<name>.json",
  "version": 1,
  "generatedAt": "<ISO-8601-UTC>",
  "generator": "scripts/build-ai-manifests.ts",
  "<payloadKey>": []
}
```

**SEED / RUNTIME skeleton** (swap `"generator"` for `"seed": true`; PLANNED uses `"status": "planned"`).

**Generator entry skeleton** (`scripts/build-ai-manifests.ts`, PLANNED — mirrors the shape of `scripts/build-manifest.ts`):

```ts
// scripts/build-ai-manifests.ts  (PLANNED)
import { writeFileSync } from 'node:fs';
import figmaBundle from '../figma/tds.plugin.json';        // #3 generated source
import manifest from '../src/generated/design-system.manifest.json';
import { componentMetas } from '../src/components/metas';  // #2 source
// ...read src/tokens/generated/{figma.tokens.json, token-ids.ts}

const envelope = (schema: string) => ({
  $schema: `https://tds.dev/schemas/ai/${schema}.json`,
  version: 1,
  generatedAt: new Date().toISOString(),
  generator: 'scripts/build-ai-manifests.ts',
});

function emit(name: string, payload: object) {
  writeFileSync(`.ai/${name}`, JSON.stringify(payload, null, 2) + '\n');
}

// DATA-DERIVED: COMPONENT_INDEX, TOKEN_INDEX, FIGMA_MAPPING, VARIANT_INDEX,
//   PLUGIN_INDEX, DEPENDENCY_GRAPH, DESIGN_MANIFEST, RESPONSIVE/ANIMATION/INTERACTION
// SEED/PLANNED: leave TASKS/SESSION/CHANGELOG/REVIEW untouched; stub ERD/API_SPEC as planned
```

Add the (PLANNED) npm script:

```jsonc
// package.json  (PLANNED)
"scripts": { "ai:build": "tsx scripts/build-ai-manifests.ts" }
```

---

## 12. Future Extension

- **Materialization (next step):** create `.ai/`, author the SEED files, implement `scripts/build-ai-manifests.ts` + `ai:build`, wire it after `ds:build`, and add a CI gate (PLANNED, [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)) that runs `ds:build && ai:build` and fails on a dirty tree.
- **MCP surface:** expose read/patch of these manifests as MCP tools so any agent recovers session state, checks reuse, and syncs Storybook↔Figma over a thin protocol ([35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md)).
- **Backend manifests:** when the Supabase/Node backend lands, promote `ERD.json` and `API_SPEC.json` from PLANNED stubs to DATA-DERIVED (generated from migrations / OpenAPI), preserving the same envelope and validation gates ([14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [15_API_GUIDE.md](./15_API_GUIDE.md)).
- **Scale to >10M users & years of history:** keep indexes flat and O(components) small; shard large runtime logs (`CHANGELOG.md` → dated archives) so rehydration stays cheap; version schemas (R11) so old manifests migrate forward; add per-manifest content hashes to skip regeneration when source hashes are unchanged — protecting the minimal-token guarantee as the system grows.
