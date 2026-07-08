# `.ai/` — the TDS AI memory & state layer

This directory is the **machine-readable state** of the TDS AI Operating System: 17 manifests that let any AI agent
(Claude Code, Gemini CLI, Cursor, Codex, Windsurf, MCP agents) understand the project and resume work with **minimal
token usage** — by reading these compact indexes *before* opening source files.

- Human-readable rulebooks live in [`../docs/ai-os/`](../docs/ai-os/). Full specs:
  [27_MANIFEST_SPECIFICATION.md](../docs/ai-os/27_MANIFEST_SPECIFICATION.md) (per-manifest schema/rules) and
  [37_AI_MEMORY_SYSTEM.md](../docs/ai-os/37_AI_MEMORY_SYSTEM.md) (the memory system).
- **Precedence:** `.ai/` is a **cache/state** layer, never authoritative over source. The source-of-truth hierarchy is
  `00_MASTER_RULES.md` → Storybook + `*.meta.ts`/`src/tokens/*` → generated manifests → Figma. When `.ai/` and source
  disagree, source wins — regenerate `.ai/`.

---

## Read order (to minimize tokens)

1. **[SESSION_SUMMARY.md](./SESSION_SUMMARY.md)** — where things stand + how to rehydrate (start every session here).
2. **[PROJECT_MANIFEST.json](./PROJECT_MANIFEST.json)** — stack, scripts, aliases, structure, source-of-truth hierarchy.
3. **Task-specific index** — one of:
   - components → **[COMPONENT_INDEX.json](./COMPONENT_INDEX.json)** (read before opening any `*.tsx`)
   - tokens → **[TOKEN_INDEX.json](./TOKEN_INDEX.json)**
   - variants → **[VARIANT_INDEX.json](./VARIANT_INDEX.json)**
   - Figma → **[FIGMA_MAPPING.json](./FIGMA_MAPPING.json)** · plugin → **[PLUGIN_INDEX.json](./PLUGIN_INDEX.json)**
4. Only then open source, and only the specific file the index points to.

---

## The 17 manifests

| File | Purpose | Kind |
| --- | --- | --- |
| [PROJECT_MANIFEST.json](./PROJECT_MANIFEST.json) | Root descriptor: identity, stack, npm scripts, aliases, structure, hierarchy. | **DATA-DERIVED** |
| [DESIGN_MANIFEST.json](./DESIGN_MANIFEST.json) | Design-system summary: tier counts, axis vocabulary, token collections, Design Lock stamp. | **DATA-DERIVED** |
| [COMPONENT_INDEX.json](./COMPONENT_INDEX.json) | All 60 components: axes, props, tags, `isComponentSet`, source paths. The reuse-first index. | **DATA-DERIVED** |
| [TOKEN_INDEX.json](./TOKEN_INDEX.json) | All tokens by collection with type + `--tds-*` var + Figma name; effect/text styles. | **DATA-DERIVED** |
| [FIGMA_MAPPING.json](./FIGMA_MAPPING.json) | Storybook→Figma: component sets (incl. type-preset splits), pages, properties. | **DATA-DERIVED** |
| [PLUGIN_INDEX.json](./PLUGIN_INDEX.json) | Plugin module map, entry, build command, harness path, `manifest.json` settings. | **DATA-DERIVED** |
| [VARIANT_INDEX.json](./VARIANT_INDEX.json) | Axis vocabulary + per-component axes and combo counts; state-axis exclusion. | **DATA-DERIVED** |
| [DEPENDENCY_GRAPH.json](./DEPENDENCY_GRAPH.json) | Build/dependency graph: source→script→generated edges, aliases, deps. | **DATA-DERIVED** |
| [RESPONSIVE_RULES.json](./RESPONSIVE_RULES.json) | Breakpoints/device tiers, `useMediaQuery` contract, token-driven responsive rules. | SEED |
| [INTERACTION_RULES.json](./INTERACTION_RULES.json) | State set, keyboard patterns, disclosure/focus hooks, play-test note, Figma exclusion. | SEED |
| [ANIMATION_RULES.json](./ANIMATION_RULES.json) | Duration/easing token ids, reduced-motion, Figma-reproducibility flags. | SEED |
| [ERD.json](./ERD.json) | Example entity-relationship model for the future backend. | SEED · **PLANNED** |
| [API_SPEC.json](./API_SPEC.json) | Example OpenAPI-shaped contract for the future API. | SEED · **PLANNED** |
| [TASKS.json](./TASKS.json) | The live task ledger + task schema; resume anchor with `SESSION_SUMMARY.md`. | SEED |
| [SESSION_SUMMARY.md](./SESSION_SUMMARY.md) | Resume anchor: current state, exists-vs-planned, next actions, rehydration. | SEED |
| [CHANGELOG.md](./CHANGELOG.md) | Keep-a-Changelog history; semver per `32_RELEASE_GUIDE.md`. | SEED |
| [REVIEW_REPORT.md](./REVIEW_REPORT.md) | Review-report template + seed entry; regenerated per review. | SEED |

---

## Update rules

- **DATA-DERIVED** manifests are regenerated from source by
  [`../scripts/build-ai-manifests.ts`](../scripts/build-ai-manifests.ts) — run `npm run ai:manifests`. **Never
  hand-edit them**; change the source (`*.meta.ts`, `src/tokens/*`) and regenerate. They read the already-generated
  `src/generated/design-system.manifest.json`, `src/tokens/generated/figma.tokens.json`, and `figma/tds.plugin.json`,
  so run `npm run ds:build` first if source changed.
- **SEED / PLANNED** manifests are maintained by humans/agents. The generator **never** overwrites them.
- After any change: regenerate, then refresh `SESSION_SUMMARY.md` + `TASKS.json` + `CHANGELOG.md`; add a
  `REVIEW_REPORT.md` entry when a review gate applies.
- **Staleness / drift:** a data-derived manifest is stale if `npm run ai:manifests` produces a diff. CI (PLANNED,
  see [25_DEVOPS_GUIDE.md](../docs/ai-os/25_DEVOPS_GUIDE.md)) should fail on such drift.

---

## Conventions

Every JSON manifest carries top-level `"$schema"`, `"version"`, `"generatedAt"`, and either `"generator":
"scripts/build-ai-manifests.ts"` (data-derived) or `"seed": true` / `"status": "planned"` (otherwise). Validate all
manifests with:

```bash
for f in .ai/*.json; do node -e "JSON.parse(require('fs').readFileSync('$f','utf8'))" \
  && echo "OK $f" || echo "BAD $f"; done
```
