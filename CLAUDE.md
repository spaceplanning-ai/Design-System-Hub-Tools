# TDS — working guide for Claude

Metadata-driven design system (React 18 + Vite + Storybook) whose `*.meta.ts` files
generate the Figma manifest. **60 components, all already built.** Most tasks are *reuse*,
not *create*. Optimise for that.

## Reuse first — the component catalog

Before building any UI, check what already exists:

- **Full catalog → [docs/COMPONENTS.md](docs/COMPONENTS.md)** — every component with its
  variants, props and one-line purpose. Read this instead of opening component source files.
- **Import from the single barrel** — never deep-path:
  ```ts
  import { Button, Card, Dropdown, Select } from '@/components';
  ```
- Regenerate the catalog after adding/changing a component: `npm run catalog:build`
  (also runs inside `npm run ds:build`).

Only open a component's `.tsx` when the catalog doesn't answer the question (exact prop
shape, compound sub-parts). Its `.meta.ts` is the fastest source of truth for variants/props.

## Conventions (do not reinvent)

- **`type` axis = layout preset `A/B/C`** (e.g. Card A vertical · B horizontal · C overlay).
  **`variant` (labelled "Style") = visual fill** (solid/outline/ghost…). They compose with
  `tone` / `size` / `shape`. See README → *Variant conventions*.
- **Styling:** CSS-var tokens only — `var(--tds-*)`. No hardcoded colors/spacing/radius.
- **Variant → DOM:** use `toDataAttrs(meta, {...})` so the DOM carries `data-*` for Figma.
- **Forms:** wrap inputs in `FormField` for the standard label + error/help pattern.
- **Shared code:** `cx` from `@/utils`, hooks from `@/hooks` (`useDisclosure`,
  `useOnClickOutside`, `useKeyDown`, …). Aliases: `@/*`, `@core/*`, `@components/*`, `@tokens/*`.

## Adding a component (only when catalog has no fit)

Follow README → *Adding a component* exactly: `.meta.ts` → `.tsx`(+`.css`) → `.stories.tsx`
→ register in `src/components/metas.ts` + tier barrel → `npm run ds:build`.
`.meta.ts` stays React/CSS-free (relative imports only).

## Figma reproduction — the plugin contract

Storybook is the **source of truth**; Figma is a faithful reproduction of it, never a redesign.
`npm run ds:build` regenerates one bundle — **`figma/tds.plugin.json`** = `{ tokens, design }`
(3 collections: Primitives → Semantic → Theme; effect/text styles; 60 component sets). A Figma
plugin reads that single file and rebuilds the system with no manual config. The bundle shape
and plugin algorithm live in **[figma/README.md](figma/README.md)** — that is the contract.

Files under `figma/`, `src/generated/`, and `src/tokens/generated/` are **generated outputs** —
never hand-edit them. To change the Figma output, change the source (`*.meta.ts`, tokens, or the
build scripts) and re-run `npm run ds:build`.

## Commands

`npm run storybook` (dev) · `npm run ds:build` (tokens + manifest + catalog) ·
`npm run figma:build` (ds:build → plugin bundle → headless verify) ·
`npm run lint` · `npm run format`

## Subagents (delegate to keep the main thread small)

- **`@tds-component`** — React/meta-driven component work (build, edit, compose, wire-up).
  Already knows the reuse-first + token + variant rules above.
- **`@figma-plugin`** — building the Figma plugin that reproduces this system with 100%
  structural fidelity (Variables, Styles, Component Sets from the contract). Mirrors Storybook
  exactly: never simplify, invent, rename, or add design decisions.

Both live in `.claude/agents/`. Invoke with `@<name>` (e.g. `@figma-plugin scaffold the plugin`).
