# TDS — Metadata-Driven Design System

A scalable Design System built with **React + Vite + TypeScript + Storybook**, engineered from the ground up so a **future Figma Plugin can regenerate the entire system inside Figma** — Variables, Styles, Components, Component Sets, Variant Properties and Component Properties — with **zero manual configuration**.

React components, Storybook docs, Design Tokens and the Figma Design System all share **one source of truth**.

---

## Why this architecture

Two ideas make automatic Figma generation possible:

1. **Design Tokens authored as Figma-shaped collections.** Tokens live in TypeScript (`src/tokens`) structured exactly like Figma expects — Variable Collections, Modes (Light/Dark), typed Variables with aliases and scopes, plus composite Effect/Text styles. A generator emits both `tokens.css` (for the web) and `figma.tokens.json` (for the plugin) from the same data.

2. **Components that describe themselves.** Every component ships a pure‑data `*.meta.ts` (`ComponentMeta`) that is the single source of truth for (a) React rendering, (b) Storybook controls + autodocs, and (c) the Figma manifest. Variant axes → Figma **Variant Properties**; extra props → Figma **Component Properties**; states → a **State** variant axis. Nothing is mapped twice.

Variants are expressed as `data-*` attributes on the DOM, so each variant combination is directly legible to a Figma plugin and keeps CSS token-driven and zero-runtime.

```
ComponentMeta ──┬─► React component (data-* variants, tokens via CSS vars)
                ├─► Storybook (argTypes, args, autodocs, a11y)
                └─► figma/tds.plugin.json ─► Figma plugin ─► Components + Variables + Styles
```

---

## Quick start

```bash
npm install
npm run ds:build      # generate tokens.css, figma.tokens.json, token-ids.ts + the Figma manifest
npm run storybook     # component documentation at http://localhost:6006
npm run dev           # the Vite demo app
```

### Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Run the Vite demo app |
| `npm run build` | Type-check + build the app |
| `npm run storybook` | Storybook dev server (docs) |
| `npm run build-storybook` | Static Storybook build |
| `npm run tokens:build` | Regenerate token artifacts from `src/tokens` |
| `npm run manifest:build` | Regenerate the Figma manifest + plugin bundle |
| `npm run ds:build` | `tokens:build` + `manifest:build` |
| `npm run lint` / `npm run format` | ESLint / Prettier |

> Run `npm run ds:build` whenever you change tokens or component metadata.

---

## Project structure

```
src/
├── tokens/                 # Design Tokens — the styling source of truth
│   ├── types.ts            # Token model + Figma mapping helpers (DTCG-friendly)
│   ├── primitives.ts       # Raw palette, spacing, radius, type, motion… (single mode)
│   ├── semantic.ts         # Theme (Light/Dark) aliases + Effect/Text styles
│   ├── index.ts            # Assembled collections + registry + alias resolver
│   └── generated/          # AUTO — tokens.css, figma.tokens.json, token-ids.ts
├── core/                   # Metadata system
│   ├── types.ts            # ComponentMeta + Figma mapping types
│   ├── defineComponent.ts  # defineComponentMeta, toDataAttrs, variant helpers
│   └── storybook.ts        # meta → Storybook argTypes/args/autodocs
├── components/
│   ├── atoms/ molecules/ organisms/   # each: X.meta.ts · X.tsx · X.css · X.stories.tsx · index.ts
│   └── metas.ts            # pure-data registry of every ComponentMeta
├── hooks/  utils/  styles/  stories/  # shared hooks, cx/refs, global CSS, Foundations docs
├── generated/              # AUTO — design-system.manifest.json
└── App.tsx                 # demo app
figma/                      # AUTO — tds.plugin.json (tokens + components bundle) + README
```

---

## Design Tokens → Figma Variables

Tokens are grouped into collections that map 1:1 onto Figma:

| Collection | Modes | Becomes |
| --- | --- | --- |
| `primitive` | default | base Variables (colors, spacing, radius, type, motion, z, breakpoints) |
| `semantic` | default | alias Variables (radius/motion semantics, control sizing, focus) |
| `theme` | **light / dark** | alias Variables with **Modes** |
| `effect` | default | **Effect Styles** (shadows) |
| `text` | default | **Text Styles** (typography) |

`figma.tokens.json` pre-resolves colors to `{r,g,b,a}` 0–1, carries alias references (with the target collection) and Figma **scopes** — so the plugin loops the JSON and calls `figma.variables.createVariable(...)` with no per-token logic.

Add a token in `src/tokens/*.ts`, run `npm run ds:build`, and it appears as a CSS variable **and** in the Figma export.

---

## Components → Figma Component Sets

Each component's `ComponentMeta` yields, in `figma/tds.plugin.json`:

- **Variant Properties** from `variantProps` (e.g. Button → `Type · Style · Tone · Size · Shape`)
- a **State** variant axis from `states` (Default / Hover / Focus / Disabled …)
- **Component Properties** from `componentProps` — `BOOLEAN` / `TEXT` / `INSTANCE_SWAP`
- **Auto Layout** hints (`figma`) with padding/gap/radius/fill bound to token ids

Example (Button): 3 types × 5 styles × 5 tones × 3 sizes × 3 shapes × 6 states = **4,050** variant combinations, plus `loading`, `disabled`, `fullWidth` booleans and `iconStart` / `iconEnd` instance swaps — all declared once.

See **Foundations → Figma Mapping** and **Foundations → Type System (A·B·C)** in Storybook for the live catalogue.

### Variant conventions: `Type` (A/B/C) vs `Style`

The design system separates two orthogonal axes so both map cleanly to Figma Variant Properties:

- **`type`** — a **layout / structure preset** with values **`A` / `B` / `C`**. Same idea across every component that has one; the specific meaning is documented per component (and in the live "Type System" Storybook page). Examples:
  - `Button` — A: label · B: icon + label · C: icon only
  - `Card` — A: vertical · B: horizontal · C: overlay
  - `Tabs` — A: top · B: left (vertical) · C: bottom
  - `Modal` — A: dialog · B: bottom sheet · C: fullscreen
  - `Header` — A: standard · B: centered brand · C: compact
- **`variant`** (labelled **Style**) — the **fill / visual emphasis** (e.g. Button `solid/outline/ghost/soft/link`).

`type` and `variant` compose freely, alongside `tone` / `size` / `shape`. Components with a `type` axis today span buttons, layout (Card, Header, Footer, Sidebar, Navbar), overlays (Modal, Drawer, Alert, Toast), navigation (Tabs, Accordion, ListItem), forms (Button, TextField, FileUpload, ImageUpload, SocialLogin), data (Table, EmptyState) and every Chart — the Storybook page derives this list from metadata, so it stays current.

---

## What's included

**60 components** (24 Atoms · 27 Molecules · 9 Organisms) — regenerated into the Figma manifest on every `ds:build`.

- **24 Atoms** — Icon, Button, IconButton, Text, Label, Link, Input, Textarea, Checkbox, Radio, Switch, Slider, Badge, Tag, Chip, Avatar, Divider, Spinner, Progress, Tooltip, Image, Skeleton, Sparkline, SocialLoginButton
- **27 Molecules** — FormField, TextField, SearchInput, Select, Combobox, Autocomplete, DatePicker, Tabs, Accordion, Breadcrumb, Pagination, Menu, Card, ListItem, Dropdown, Popover, EmptyState, FileUpload, ImageUpload, SocialLogin, and **7 Charts** (BarChart, LineChart, DonutChart, RadarChart, ScatterChart, Heatmap, Gauge)
- **9 Organisms** — Alert, Modal, Drawer, Toast, Table, Header, Footer, Sidebar, Navbar

> The exact inventory is generated — `src/generated/design-system.manifest.json` (`summary`) is the source of truth; see **Foundations → Figma Mapping** in Storybook for the live catalogue.

- **Charts** — token-driven SVG (`src/utils/chart.ts` + `src/styles/charts.css`), a **validated categorical palette** (dataviz method: single-hue sequential, legend + direct labels, no rainbow/status colors), light/dark, and **interactive hover tooltips** (line crosshair, per-mark, segment highlight) with optional click-to-select for linked dashboards.
- **Typography** — three self-hosted Korean-capable families with the full 100–900 weight range: **Pretendard** (body/UI), **Paperlogy** (display/headings), **Noto Sans KR** (alt); swap the whole system via `data-font` on any ancestor.
- Full **state matrix** (default/hover/active/focus/disabled/error/success/loading/readonly)
- **Responsive** (mobile/tablet/desktop) with breakpoint tokens + Storybook viewports
- **Motion** driven by centralized motion tokens
- **Accessibility** — ARIA roles, keyboard nav, focus-visible, focus trapping, reduced-motion
- **Light/Dark** theming via the token Mode system
- Compound components where appropriate (Tabs, Accordion, Card, Sidebar, Menu)
- **Example compositions** in Storybook under **Examples/** — 게시판 Board, 대시보드 Dashboard (with a linked bar→detail interaction), 리스트 List, 바텀시트 BottomSheet

---

## Adding a component

1. Create `src/components/<tier>/MyThing/MyThing.meta.ts` with `defineComponentMeta({...})` (relative imports only — it must stay React/CSS-free).
2. Add `MyThing.tsx` (+ `.css`) using `toDataAttrs(meta, {...})` for variants and `var(--tds-*)` tokens.
3. Add `MyThing.stories.tsx` using `argTypesFromMeta` / `argsFromMeta` / `metaParameters`.
4. Register the meta in `src/components/metas.ts` and export the component from the tier barrel.
5. `npm run ds:build` — it's now in Storybook **and** the Figma manifest.
