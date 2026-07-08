---
title: 11 — Interaction Specification
purpose: Define every interaction state and behavior in TDS (hover/active/focus-visible/disabled/loading), the keyboard + disclosure + focus-trap hook contract, Storybook interaction testing, and how interactions map into (or are flagged out of) Figma.
status: ACTIVE
owner: AI OS
last-reviewed: 2026-07-08 (placeholder — update on each review)
precedence: Subordinate to [00_MASTER_RULES.md](./00_MASTER_RULES.md). On any conflict, the constitution wins, then Storybook + the `*.meta.ts` / `src/tokens` sources, then the generated manifests, then Figma. This document governs interaction behavior only; it never overrides the Design Lock in [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md).
---

# 11 — Interaction Specification

## 1. Purpose

This document is the single normative reference for **interactive behavior** in TDS: the
canonical interaction **states** a component may declare, the CSS selectors and tokens that
render them, the shared React **hooks** that implement keyboard, disclosure, click-outside and
focus-trap behavior, the **Storybook** interaction-testing surface, and the **Figma** mapping
policy that deliberately excludes transient states from Variant explosion.

Interaction is where the metadata-driven system meets real user input. Every component ships a
pure-data `X.meta.ts` whose `states: ComponentState[]` field and `a11y.keyboard` notes are the
declared contract; the `X.tsx` + `X.css` implement it; Storybook proves it; the Figma bundle
reproduces the *visual* result while flagging non-reproducible behavior. This document feeds the
runtime manifest [.ai/INTERACTION_RULES.json](../../.ai/INTERACTION_RULES.json).

Behavior is a **source concern** (meta/tsx/css), never a generated-output concern. You change
interaction by editing source and re-running the pipeline — never by hand-editing `figma/*`,
`src/generated/*`, or `src/tokens/generated/*`.

## 2. Responsibilities

This spec is responsible for:

- Enumerating the canonical `ComponentState` union and what each state means visually + semantically.
- Defining the **selector contract**: which CSS pseudo-classes / `data-*` attributes render each state.
- Defining the **hook contract** for `src/hooks/index.ts`: `useControllableState`, `useDisclosure`,
  `useOnClickOutside`, `useKeyDown`, `useFocusTrap`, `useMediaQuery` — their signatures and correct usage.
- Specifying keyboard interaction requirements (activation, dismissal, roving/arrow patterns, Tab order).
- Specifying the loading/disabled/readonly affordances (`aria-busy`, `disabled`, `aria-disabled`, `data-loading`).
- Defining the Storybook interaction-testing surface (`@storybook/addon-interactions` + `play`) — currently
  a configured-but-unused capability (see §4 rule I-13, marked PLANNED where no `play` tests exist yet).
- Fixing the **Figma state policy**: the `state` axis is NOT emitted as a Variant; `disabled`/`loading`
  survive as BOOLEAN component props.

Out of responsibility (owned elsewhere): motion tokens + reduced-motion detail →
[10_ANIMATION_SPECIFICATION.md](./10_ANIMATION_SPECIFICATION.md); ARIA/WCAG/focus-trap a11y depth →
[13_ACCESSIBILITY_SPECIFICATION.md](./13_ACCESSIBILITY_SPECIFICATION.md); breakpoint/`useMediaQuery`
responsive rules → [12_RESPONSIVE_SPECIFICATION.md](./12_RESPONSIVE_SPECIFICATION.md); variant-axis
mapping → [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md).

## 3. Scope

**In scope**

- The `ComponentState` model (`src/core/types.ts`) and its use in every `*.meta.ts`.
- Interaction CSS in each component's `X.css` (pseudo-classes + `data-*` state hooks).
- All six shared hooks in `src/hooks/index.ts` and the components that consume them.
- Keyboard handling, focus-visible rings, disabled/loading/readonly affordances.
- Storybook `play` interaction tests and the a11y addon interaction checks.
- The Figma state-exclusion policy and the BOOLEAN survivors.

**Out of scope**

- Visual redesign of any state (locked — see [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md)).
- Motion curves/durations authoring (only their *use* in transitions is in scope here).
- **PLANNED** backend-driven interactions (optimistic UI, realtime, server actions). No backend,
  API, or data-fetching layer exists today; anything touching it is marked PLANNED and defers to
  [15_API_GUIDE.md](./15_API_GUIDE.md) / [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md).

## 4. Rules

Rules are numbered `I-n` (Interaction). MUST/SHOULD/NEVER are enforceable against real repo mechanisms.

**State model**

- **I-1 (MUST)** Every component's `meta.states` MUST be a subset of the canonical union in
  `src/core/types.ts`: `default | hover | active | focus | disabled | error | success | loading | readonly`.
  Never invent a state name; extend `ComponentState` + `ALL_STATES` first if a genuinely new state is needed.
- **I-2 (MUST)** `default` MUST always be present in `meta.states` (it is the base render). Declare only the
  states the component actually implements in CSS — `meta.states` is a *contract*, not a wish list.
- **I-3 (MUST)** Interactive controls (role `button`, `link`, inputs, `switch`, `checkbox`, `radio`, `tab`,
  `menuitem`, `option`) MUST implement at minimum `default`, `hover`, `focus`, and `disabled`.

**Selectors & tokens**

- **I-4 (MUST)** Render states with native pseudo-classes where the browser owns them —
  `:hover`, `:active`, `:focus-visible`, `:disabled` — guarded by `:not(:disabled)` on hover/active so
  disabled controls do not light up (see `src/components/atoms/Button/Button.css`).
- **I-5 (MUST)** Use `:focus-visible` (NEVER bare `:focus`) for keyboard focus rings. The global reset
  (`src/styles/reset.css`) strips the default outline; each interactive component MUST re-add a ring using
  `--tds-focus-ring-width`, `--tds-focus-ring-offset`, and `--tds-color-border-focus`.
- **I-6 (MUST)** Model *component-owned* interaction states that the browser can't express via `data-*`
  attributes (e.g. `data-loading`, `data-state="open"`, `data-selected`) — never via bespoke class flags —
  so the DOM stays Figma-legible and consistent with `toDataAttrs`.
- **I-7 (MUST)** All state transitions MUST animate via motion tokens only — `--tds-motion-duration-hover`
  (semantic `motion.duration.hover` → `duration.fast` = 120ms) with `--tds-motion-easing-standard`. NEVER
  hardcode a duration/easing. Detail in [10_ANIMATION_SPECIFICATION.md](./10_ANIMATION_SPECIFICATION.md).
- **I-8 (MUST)** Honor reduced motion. The global `@media (prefers-reduced-motion: reduce)` block in
  `src/styles/reset.css` neutralizes animation/transition durations; component-specific motion (Skeleton,
  Popover, SocialLogin) MUST add its own reduced-motion guard rather than relying solely on the reset.

**Disabled / loading / readonly**

- **I-9 (MUST)** `disabled` MUST use the native `disabled` attribute on real form/button elements (removing
  them from the tab order); for non-native interactive roles use `aria-disabled="true"` and block handlers.
- **I-10 (MUST)** `loading` MUST set `aria-busy` and expose `data-loading` for CSS, and MUST block activation
  (Button sets `disabled={disabled || loading}`). The loading affordance replaces content, it does not remove
  the element from layout.
- **I-11 (SHOULD)** `readonly` inputs SHOULD use the native `readOnly` attribute (value visible + copyable,
  not editable) and remain focusable — distinct from `disabled`.

**Keyboard & focus**

- **I-12 (MUST)** Keyboard support declared in `meta.a11y.keyboard` MUST be implemented: `Enter`/`Space`
  activate buttons; `Escape` closes overlays; `Arrow` keys move within composite widgets (Tabs, Menu, Slider,
  Combobox, Pagination); `Tab`/`Shift+Tab` cycle focus (trapped inside modal surfaces). Depth in
  [13_ACCESSIBILITY_SPECIFICATION.md](./13_ACCESSIBILITY_SPECIFICATION.md).

**Hooks**

- **I-13 (MUST)** Reuse the six shared hooks from `@/hooks` (`src/hooks/index.ts`) — NEVER re-implement
  controllable state, click-outside, keydown, media-query, disclosure, or focus-trap logic inline. Overlays
  MUST compose `useDisclosure` + `useOnClickOutside` + `useKeyDown('Escape', …)`; modal surfaces MUST use
  `useFocusTrap`; dual controlled/uncontrolled inputs MUST use `useControllableState`.
- **I-14 (MUST)** Controlled/uncontrolled components MUST follow the `useControllableState` contract:
  `value` present ⇒ controlled; otherwise `defaultValue` drives internal state; `onChange` always fires.

**Storybook / testing**

- **I-15 (SHOULD)** Interaction behavior SHOULD be proven with `@storybook/addon-interactions` `play`
  functions. Today the addon is registered in `.storybook/main.ts` but **no `play` tests exist yet** — writing
  them is PLANNED work tracked by [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md). New interactive components
  SHOULD add a `play` that drives the primary interaction.

**Figma mapping**

- **I-16 (NEVER)** NEVER emit the `state` axis (hover/active/focus/etc.) as a Figma **Variant** — it explodes
  the cartesian product (Button would exceed 4,050 combos). `disabled` and `loading` survive only as BOOLEAN
  **component** properties. This policy is fixed by [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md)
  and [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md).

## 5. Workflow

Editing or adding interaction behavior, step by step (reuse-first per [00_MASTER_RULES.md](./00_MASTER_RULES.md)):

1. **Check the catalog first.** `docs/COMPONENTS.md` + the target `X.meta.ts` tell you the existing states and
   keyboard contract. Most tasks reuse an existing behavior — do not re-solve solved interactions.
2. **Declare the state contract.** In `X.meta.ts`, set `states: [...]` (subset of `ComponentState`) and fill
   `a11y.keyboard` / `a11y.notes`. `meta.ts` stays React/CSS-free with relative imports only.
3. **Implement behavior in `X.tsx`.** Import hooks from `@/hooks`; wire `useDisclosure`/`useOnClickOutside`/
   `useKeyDown`/`useFocusTrap`/`useControllableState` as needed. Emit `data-*` state via `toDataAttrs` and
   explicit `data-loading` / `aria-*` attributes. `forwardRef` always.
4. **Render states in `X.css`.** Add `:hover:not(:disabled)`, `:active:not(:disabled)`, `:focus-visible`,
   `:disabled`, and `[data-*]` rules — token-driven only (`var(--tds-*)`). Add a reduced-motion guard if the
   component animates.
5. **Prove it in `X.stories.tsx`.** CSF3, `parameters: metaParameters(meta)`, `argTypes: argTypesFromMeta(meta)`.
   Add a `play` interaction test where behavior is non-trivial (PLANNED default; see I-15).
6. **Rebuild.** `npm run ds:build` regenerates tokens + manifest + catalog; `npm run figma:build` additionally
   typechecks, bundles, and runs the headless plugin harness (`figma/plugin/test/harness.ts`).
7. **Validate.** `npm run lint`, then confirm the Storybook a11y panel is clean and keyboard flows work.
8. **Reconcile the manifest.** Update [.ai/INTERACTION_RULES.json](../../.ai/INTERACTION_RULES.json) so the
   AI cache matches source (see [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md)).

## 6. Examples

**6.1 — State CSS with guarded pseudo-classes and a token focus ring** (from `Button.css`):

```css
.tds-button[data-variant='solid']:hover:not(:disabled) {
  background-color: var(--button-solid-hover);
}
.tds-button[data-variant='solid']:active:not(:disabled) {
  background-color: var(--button-solid-active);
}
.tds-button:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 var(--tds-focus-ring-offset) var(--tds-color-bg-surface),
    0 0 0 calc(var(--tds-focus-ring-offset) + var(--tds-focus-ring-width))
      var(--tds-color-border-focus);
}
.tds-button:disabled { cursor: not-allowed; opacity: 0.5; }
```

**6.2 — Loading + disabled affordance in the component** (from `Button.tsx`):

```tsx
<button
  disabled={disabled || loading}
  aria-busy={loading || undefined}
  data-loading={loading || undefined}
  {...toDataAttrs(buttonMeta, { type, variant, tone, size, shape })}
/>
```

**6.3 — Overlay composition with the disclosure/click-outside/escape trio**:

```tsx
import { useDisclosure, useOnClickOutside, useKeyDown } from '@/hooks';

const { isOpen, close, toggle } = useDisclosure();
const ref = useRef<HTMLDivElement>(null);
useOnClickOutside(ref, close, isOpen);
useKeyDown('Escape', close, isOpen);
```

**6.4 — Modal focus trap** (`useFocusTrap` focuses the first focusable on open, cycles Tab/Shift+Tab, and
restores focus to the previously-focused element on close — used by `Modal.tsx` and `Drawer.tsx`):

```tsx
import { useFocusTrap } from '@/hooks';
const trapRef = useFocusTrap(isOpen); // attach to the dialog container
```

**6.5 — Controlled/uncontrolled input**:

```tsx
import { useControllableState } from '@/hooks';
const [value, setValue] = useControllableState({ value, defaultValue: '', onChange });
```

**6.6 — Meta state contract** (from `Button.meta.ts`): `states: ['default','hover','active','focus','disabled','loading']`
with `a11y.keyboard: ['Enter / Space: activate']` and the note that `disabled` removes it from the tab order.

## 7. Validation Rules

Compliance is checked by real repo mechanisms:

- **Typecheck/build** — `npm run build` (`tsc -b && vite build`) and `npm run plugin:typecheck` catch bad
  hook signatures, wrong `ComponentState` values, and meta type errors.
- **Lint** — `npm run lint` (ESLint flat config incl. `react-hooks`) flags Rules-of-Hooks violations and
  missing effect deps in interaction logic.
- **ds:build** — `npm run ds:build` regenerates the manifest + catalog; a component whose `meta.states` or
  `a11y.keyboard` changed shows up in `docs/COMPONENTS.md` and `src/generated/design-system.manifest.json`.
- **figma:build** — `npm run figma:build` runs the headless harness (`figma/plugin/test/harness.ts`) which
  asserts coverage and `process.exit(1)` on mismatch — this is where a leaked `state` Variant (violating I-16)
  is caught.
- **Storybook a11y** — `@storybook/addon-a11y` runs axe on each story; focus-order/name/role issues surface
  in the panel.
- **Storybook interactions** — `@storybook/addon-interactions` runs `play` steps in the Interactions panel
  (PLANNED coverage; see [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md)).
- **Manual** — keyboard walkthrough (Tab/Enter/Space/Escape/Arrows) and reduced-motion check via OS setting.
- **Schema** — [.ai/INTERACTION_RULES.json](../../.ai/INTERACTION_RULES.json) validated against its `$schema`.

## 8. Checklist

- [ ] `meta.states` is a subset of `ComponentState`; `default` present; only implemented states listed (I-1, I-2).
- [ ] Interactive control implements `hover` + `focus` + `disabled` (I-3).
- [ ] Hover/active guarded with `:not(:disabled)` (I-4).
- [ ] Keyboard focus uses `:focus-visible` with `--tds-focus-ring-*` + `--tds-color-border-focus` (I-5).
- [ ] Component-owned states expressed as `data-*`, not ad-hoc classes (I-6).
- [ ] Transitions use `--tds-motion-*` tokens; reduced-motion respected (I-7, I-8).
- [ ] `disabled` uses native attr / `aria-disabled`; `loading` sets `aria-busy` + `data-loading` + blocks activation (I-9, I-10).
- [ ] `readonly` uses native `readOnly` and stays focusable (I-11).
- [ ] Declared `a11y.keyboard` behaviors implemented (I-12).
- [ ] Shared hooks reused from `@/hooks`; no inline re-implementation (I-13, I-14).
- [ ] `play` interaction test added where behavior is non-trivial (I-15, PLANNED baseline).
- [ ] No `state` axis emitted as a Figma Variant; only `disabled`/`loading` as BOOLEAN props (I-16).
- [ ] `npm run lint` + `npm run figma:build` pass; `.ai/INTERACTION_RULES.json` reconciled.

## 9. Failure Recovery

| Symptom | Diagnosis | Fix | Resume |
| --- | --- | --- | --- |
| Focus ring never appears on Tab | Using `:focus` (stripped by reset) or missing ring rule | Switch to `:focus-visible` with `--tds-focus-ring-*` tokens | Re-tab through the story; check a11y panel |
| Disabled control still hovers/clicks | Missing `:not(:disabled)` guard, or non-native role without `aria-disabled` + handler block | Add guard / `aria-disabled` and early-return handlers | Re-run story; verify no hover state |
| Overlay won't close on outside click / Escape | `useOnClickOutside`/`useKeyDown` not wired or `enabled` flag false when open | Pass `isOpen` as the `enabled` arg to both hooks | Open overlay, click out + press Escape |
| Focus escapes the modal | `useFocusTrap` ref not attached to the dialog container, or trap passed `false` | Attach `trapRef`; pass the open boolean | Tab to last element, confirm wrap |
| Controlled input ignores typing | Passed `value` without `onChange`, or mixed controlled/uncontrolled | Use `useControllableState`; supply `onChange` when controlled | Type in the field, confirm updates |
| `figma:build` harness exits 1 on variant count | A `state` value leaked into `variantProps` (violates I-16) | Remove state from variant axes; keep `disabled`/`loading` as BOOLEAN `componentProps` | Re-run `npm run figma:build` |
| Motion ignores reduced-motion | Component animation not covered by the reset guard | Add a `@media (prefers-reduced-motion: reduce)` block in `X.css` | Toggle OS reduced-motion; re-check |

After any source fix, re-run `npm run ds:build` (or `npm run figma:build`) and reconcile
[.ai/INTERACTION_RULES.json](../../.ai/INTERACTION_RULES.json) before resuming the task
(see [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md)).

## 10. Dependencies

- **Docs** — [00_MASTER_RULES.md](./00_MASTER_RULES.md), [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md),
  [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md), [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md),
  [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md), [10_ANIMATION_SPECIFICATION.md](./10_ANIMATION_SPECIFICATION.md),
  [12_RESPONSIVE_SPECIFICATION.md](./12_RESPONSIVE_SPECIFICATION.md), [13_ACCESSIBILITY_SPECIFICATION.md](./13_ACCESSIBILITY_SPECIFICATION.md),
  [04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md), [05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md),
  [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md), [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md),
  [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md), [28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md).
- **Manifests** — [.ai/INTERACTION_RULES.json](../../.ai/INTERACTION_RULES.json) (this doc's output),
  [.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json), [.ai/VARIANT_INDEX.json](../../.ai/VARIANT_INDEX.json).
- **Source** — `src/core/types.ts` (`ComponentState`, `ALL_STATES`, `A11ySpec`), `src/hooks/index.ts`
  (six hooks), each `X.meta.ts` (`states` + `a11y`), each `X.css` (state selectors), `src/styles/reset.css`
  (focus-visible reset + global reduced-motion), `src/tokens/semantic.ts` (`focus.ring.*`, `motion.*`),
  `.storybook/main.ts` (a11y + interactions addons).
- **Scripts** — `scripts/build-manifest.ts`, `scripts/build-catalog.ts`, `figma/plugin/test/harness.ts`.

## 11. Template

Copy-paste skeleton for an interactive component's interaction wiring:

```ts
// X.meta.ts — declare the contract (React/CSS-free, relative imports)
states: ['default', 'hover', 'focus', 'active', 'disabled'],
a11y: {
  role: 'button',
  keyboard: ['Enter / Space: activate', 'Escape: dismiss'],
  notes: ['disabled removes it from the tab order'],
},
```

```tsx
// X.tsx — behavior via shared hooks + data-* + aria-*
import { forwardRef, useRef } from 'react';
import { cx } from '@/utils';
import { useDisclosure, useOnClickOutside, useKeyDown } from '@/hooks';
import { toDataAttrs } from '@core/defineComponent';
import { xMeta } from './X.meta';

export const X = forwardRef<HTMLDivElement, XProps>(function X(props, ref) {
  const { isOpen, close, toggle } = useDisclosure();
  const rootRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(rootRef, close, isOpen);
  useKeyDown('Escape', close, isOpen);
  return (
    <div ref={rootRef} data-state={isOpen ? 'open' : 'closed'}
      {...toDataAttrs(xMeta, { /* axes */ })} />
  );
});
```

```css
/* X.css — token-driven state rendering */
.tds-x:hover:not(:disabled) { /* var(--tds-*) only */ }
.tds-x:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--tds-focus-ring-offset) var(--tds-color-bg-surface),
    0 0 0 calc(var(--tds-focus-ring-offset) + var(--tds-focus-ring-width)) var(--tds-color-border-focus);
}
.tds-x:disabled { opacity: 0.5; cursor: not-allowed; }
@media (prefers-reduced-motion: reduce) { .tds-x { transition: none; } }
```

```tsx
// X.stories.tsx — PLANNED interaction test
export const Interacts: Story = {
  play: async ({ canvasElement }) => {
    // const canvas = within(canvasElement);
    // await userEvent.click(canvas.getByRole('button'));
    // await expect(...).toBeVisible();
  },
};
```

## 12. Future Extension

- **Interaction-test coverage (PLANNED).** Add `play` functions across interactive components using
  `@storybook/addon-interactions` (already registered), then gate CI on them per
  [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md). At >10M users, deterministic interaction tests are the cheapest
  regression net for behavioral drift.
- **Interaction tokens.** As new interactive patterns arrive, promote recurring timings/rings into semantic
  tokens (`motion.*`, `focus.ring.*`) so behavior scales without per-component divergence — never hardcode.
- **Figma prototyping flags (PLANNED).** The bundle may later carry non-visual interaction hints (e.g. "opens
  overlay", "traps focus") as annotations the plugin renders as documentation, keeping the state-exclusion
  policy (I-16) intact while improving Figma fidelity — coordinate via [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md).
- **Backend-driven interactions (PLANNED).** Optimistic UI, realtime presence, and server-action pending states
  will layer on top of this hook contract once the Supabase backend exists; they defer to
  [15_API_GUIDE.md](./15_API_GUIDE.md) / [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md) and MUST reuse
  `loading`/`disabled` affordances rather than inventing new states.
- **MCP surface.** Interaction rules become queryable via [35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md)
  so agents can read the keyboard/hook contract from [.ai/INTERACTION_RULES.json](../../.ai/INTERACTION_RULES.json)
  without re-reading component source — minimizing tokens per [26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md).
```
