# 13 — Accessibility Specification

> **Title:** Accessibility Specification
> **Purpose:** Define the accessibility (a11y) standard for TDS — how ARIA roles/keyboard flow from each `meta.a11y`, how focus-visible rings, focus trapping, and reduced-motion are implemented with tokens, how `@storybook/addon-a11y` gates work, and the WCAG 2.2 AA targets every component must meet.
> **Status:** ACTIVE (frontend a11y is real today; any backend/CI a11y gating is **PLANNED**).
> **Owner:** AI OS
> **Last-reviewed:** _(placeholder — update on each review)_
> **Precedence:** Subordinate to [00_MASTER_RULES.md](./00_MASTER_RULES.md). Where accessibility appears to require a visual change, the [Design Lock Policy](./03_DESIGN_SYSTEM.md) still governs: a11y fixes flow through **source** (`*.meta.ts`, tokens, component CSS/TSX), never by hand-editing generated outputs. Storybook remains the only source of truth ([04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md)).

---

## 1. Purpose

TDS is a metadata-driven design system whose 60 components (24 atoms, 27 molecules, 9 organisms) each ship a pure-data `X.meta.ts`. That meta already carries an optional `a11y` block (`A11ySpec` in [`src/core/types.ts`](../../src/core/types.ts)) declaring `role`, `keyboard[]`, and `notes[]`. This document turns that data into an **enforceable accessibility contract**:

- Every interactive component declares its **ARIA role** and **keyboard model** in `meta.a11y`, and the React implementation MUST match that declaration.
- Focus is always **visible** (`:focus-visible` ring built from focus tokens), **trappable** where modal (`useFocusTrap`), and **restored** on dismissal.
- Motion **respects `prefers-reduced-motion`** globally.
- Storybook's **`@storybook/addon-a11y`** runs axe-core against every story; `metaParameters(meta)` scopes it to the declared role.
- The target conformance level is **WCAG 2.2 AA**.

Accessibility is not a post-hoc audit here — it is data (`meta.a11y`) that drives docs, the addon, and the reviewer's checklist, exactly like variants drive Figma.

## 2. Responsibilities

This spec owns, and is the authority for:

1. **The `A11ySpec` contract** — what `role`, `keyboard`, and `notes` mean and how they bind to the DOM.
2. **Focus visibility** — the `--tds-focus-ring-*` token ring pattern and the global `:focus-visible` reset.
3. **Focus management** — trapping (`useFocusTrap`), restore-on-close, roving tabindex, and dismissal keys (`useKeyDown`, `useOnClickOutside`, `useDisclosure`).
4. **Reduced motion** — the global `@media (prefers-reduced-motion: reduce)` guard and per-component obligations. (Motion tokens themselves live in [10_ANIMATION_SPECIFICATION.md](./10_ANIMATION_SPECIFICATION.md).)
5. **Color contrast** — light/dark theme obligations against semantic tokens.
6. **Screen-reader affordances** — `.tds-sr-only`, `aria-live`, `aria-busy`, labelling patterns.
7. **The addon-a11y gate** — configuration in `.storybook/` and how `metaParameters(meta)` wires it.
8. **WCAG 2.2 AA mapping** — which success criteria each mechanism satisfies.

It does **not** own: motion/duration tokens ([10_ANIMATION_SPECIFICATION.md](./10_ANIMATION_SPECIFICATION.md)), the full interaction-state machine ([11_INTERACTION_SPECIFICATION.md](./11_INTERACTION_SPECIFICATION.md)), responsive/reflow rules ([12_RESPONSIVE_SPECIFICATION.md](./12_RESPONSIVE_SPECIFICATION.md)), or the Figma reproduction of any of the above ([05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md)).

## 3. Scope

**In scope**

- All 60 shipped components under `src/components/{atoms,molecules,organisms}`.
- The `A11ySpec` model and every component's `meta.a11y` block.
- Focus tokens in `src/tokens/semantic.ts` (`focus.ring.width`, `focus.ring.offset`, `color.border.focus`, `shadow.focus`) and their `--tds-*` CSS emission.
- Shared a11y utilities: `src/hooks/index.ts` (`useFocusTrap`, `useKeyDown`, `useOnClickOutside`, `useDisclosure`), `.tds-sr-only` in `src/styles/global.css`, and the reduced-motion / focus reset in `src/styles/reset.css`.
- Storybook a11y: `@storybook/addon-a11y` in [`.storybook/main.ts`](../../.storybook/main.ts), the `a11y` parameter in [`.storybook/preview.tsx`](../../.storybook/preview.tsx), and `metaParameters(meta)` in [`src/core/storybook.ts`](../../src/core/storybook.ts).

**Out of scope**

- Backend/auth accessibility (login flows, emails) — **PLANNED**; no backend exists today. `SocialLogin` / `SocialLoginButton` are presentational only.
- Automated CI a11y gating (GitHub Actions running axe) — **PLANNED**; no `.github` CI exists.
- Interaction-test frameworks (Playwright/axe-playwright, vitest-axe) — **PLANNED**; the only automated harness today is the headless Figma harness (`figma/plugin/test/harness.ts`), which does not test a11y.
- Redefining design tokens, colors, spacing, or type — locked by [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md).

## 4. Rules

Rules are enforceable and phrased MUST / SHOULD / NEVER.

1. **MUST declare `a11y` for every interactive component.** Any component that receives focus, is clicked, or exposes a widget role MUST populate `meta.a11y` with at least `role` and `keyboard`. Purely presentational atoms (`Divider`, `Skeleton`, `Text`, decorative `Icon`) MAY omit `role` but SHOULD still carry `a11y.notes` explaining the decorative/`aria-hidden` intent.
2. **MUST match the declared role in the DOM.** If `meta.a11y.role === 'dialog'`, the rendered root MUST expose `role="dialog"` (or a native element with that implicit role). The `metaParameters(meta)` bridge scopes axe to `[role="${meta.a11y.role}"]`, so a mismatch is a real, catchable defect.
3. **MUST implement the declared keyboard model exactly.** Each `keyboard[]` line (e.g. `'Enter / Space: activate'`, `'Escape: close'`, `'Arrow Left/Right: move'`) is a behavioral requirement, not a hint. Use `useKeyDown` for single-key handlers and native semantics (`<button>`, `<a href>`) wherever possible.
4. **MUST prefer native elements.** Use native `<button>`, `<a href>`, `<input>`, `<select>`, `<textarea>` before ARIA-simulated widgets. Button's meta note — _"Uses native `<button>`; `aria-busy` while loading; disabled removes it from the tab order"_ — is the reference pattern.
5. **MUST render a visible focus indicator via focus tokens.** Interactive components MUST implement `:focus-visible` using the ring pattern of §6 (`--tds-focus-ring-offset`, `--tds-focus-ring-width`, `--tds-color-border-focus`). NEVER ship a bare `outline: none` without a token-based replacement. The global reset intentionally strips the UA outline (`:where(:focus-visible){ outline: none }` in `reset.css`) **on the expectation that each component re-adds a token ring**.
6. **MUST trap and restore focus for modal surfaces.** `Modal` and `Drawer` (and any `role="dialog"`/`aria-modal` surface) MUST use `useFocusTrap(active)`, which focuses the first tabbable on open, wraps Tab/Shift+Tab, and restores focus to the previously-focused element on close. Modal's meta note is the contract: _"role=dialog aria-modal; labelled by the title; focus returns to the trigger on close."_
7. **MUST be dismissible.** Overlays MUST close on `Escape` (`useKeyDown('Escape', …)`) and, where appropriate, outside-click (`useOnClickOutside`). Open/close state uses `useDisclosure`.
8. **MUST label every form control.** Inputs MUST be wrapped in `FormField` (label + error/help association) per [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md). Errors MUST be programmatically associated (`aria-describedby`) and announced.
9. **MUST honor reduced motion.** All animation/transition MUST be neutralized under `@media (prefers-reduced-motion: reduce)`. The global guard in `reset.css` covers `*`; components MUST NOT re-introduce motion that ignores it (e.g. JS-driven animation without a `matchMedia('(prefers-reduced-motion: reduce)')` check — use `useMediaQuery`).
10. **MUST meet WCAG 2.2 AA contrast in both themes.** Text and essential UI MUST use semantic tokens (`color.fg.*`, `color.border.*`) that clear 4.5:1 (normal text) / 3:1 (large text, UI components) in **both** `light` and `dark` Theme modes.
11. **MUST NOT convey state by color alone.** `error`/`success`/`warning` states MUST pair tone with an icon, text, or `aria-*` (`aria-invalid`, `role="alert"`). Tone axis (`brand/neutral/success/warning/danger`) is never the sole signal.
12. **MUST expose async state.** Loading uses `aria-busy` (Button pattern); live regions (`Toast`, `Alert`, form errors) MUST use `role="status"`/`role="alert"` or `aria-live` so changes are announced.
13. **MUST provide an accessible name for icon-only controls.** `IconButton` and Button **Type C (icon-only)** MUST carry an `aria-label`; decorative icons MUST be `aria-hidden="true"`.
14. **NEVER remove an element from the tab order to "fix" an axe warning.** Disabled controls legitimately leave the tab order (native `disabled`); everything else stays reachable.
15. **NEVER hand-edit generated outputs** (`figma/*`, `src/generated/*`, `src/tokens/generated/*`) to change a11y. Change the source token/meta/CSS and re-run the relevant build ([00_MASTER_RULES.md](./00_MASTER_RULES.md), "generated is sacred").
16. **SHOULD keep `meta.a11y.notes` current.** Notes are surfaced in autodocs via `docDescription(meta)`; they are the human-readable rationale reviewers rely on.

## 5. Workflow

Accessibility work rides the normal component pipeline. Reference scripts are real (`package.json`).

**A. Author or update the a11y contract (source)**

1. Open the component's `X.meta.ts` and fill/adjust `a11y`:
   ```ts
   a11y: {
     role: 'dialog',
     keyboard: ['Escape: close', 'Tab: cycle within (focus trapped)'],
     notes: ['role="dialog" aria-modal; labelled by the title; focus returns to the trigger on close.'],
   },
   ```
   The meta stays **React/CSS-free** with relative imports only.
2. Implement the behavior in `X.tsx`: native element or correct `role`, wire `useFocusTrap`/`useKeyDown`/`useOnClickOutside` as the keyboard lines demand, add `aria-*` per the notes.
3. Implement the focus ring in `X.css` using the token pattern (§6). Use `var(--tds-*)` only — no hardcoded colors/px.

**B. Regenerate derived artifacts**

4. `npm run ds:build` (runs `tokens:build → manifest:build → catalog:build`). This re-emits `src/tokens/generated/tokens.css` (focus tokens), refreshes `docs/COMPONENTS.md`, and rebuilds `src/generated/design-system.manifest.json` + `figma/tds.plugin.json`. `docDescription(meta)` now renders the updated **Keyboard** section in autodocs.

**C. Verify in Storybook (the source of truth)**

5. `npm run storybook`. Open the story, switch the **Theme** toolbar between Light/Dark and the **Font** toolbar, then:
   - Tab through: every interactive element shows the token ring; order is logical.
   - Exercise each `keyboard[]` line (Escape, arrows, Enter/Space).
   - Open the **Accessibility** addon panel; resolve axe violations. `metaParameters(meta)` scopes checks to the declared role.
6. Run the story's `play` (interactions addon) where present to assert focus/keyboard behavior ([11_INTERACTION_SPECIFICATION.md](./11_INTERACTION_SPECIFICATION.md)).

**D. Static gates**

7. `npm run lint` — `eslint-plugin-react-hooks` enforces hook rules (`useFocusTrap`, `useKeyDown` must obey deps/order); `tsc -b` (via `npm run build`) type-checks the `A11ySpec`.

**E. Figma reproduction (no a11y regression, but no a11y invention either)**

8. `npm run figma:build`. Roles/keyboard/focus behavior are **runtime** concerns not reproduced as Figma interactions; the plugin reproduces the visual `:focus`/`state` presentation only. NEVER add a11y-motivated visual changes directly in Figma — they must originate in source ([05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md)).

## 6. Examples

**6.1 The token-based focus ring (real pattern from `Button.css`)**

```css
.tds-button:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 var(--tds-focus-ring-offset) var(--tds-color-bg-surface),
    0 0 0 calc(var(--tds-focus-ring-offset) + var(--tds-focus-ring-width))
      var(--tds-color-border-focus);
}
```

The tokens are authored in `src/tokens/semantic.ts`:

```ts
tok('focus.ring.width', 'dimension', 3, { group: 'Focus', scopes: ['STROKE_FLOAT'] }),
tok('focus.ring.offset', 'dimension', 2, { group: 'Focus', scopes: ['STROKE_FLOAT'] }),
```

They emit `--tds-focus-ring-width` / `--tds-focus-ring-offset`; the ring color is `--tds-color-border-focus` (`color.border.focus`). A gap ring (surface color) + solid ring (focus color) keeps the indicator visible on any fill in both themes.

**6.2 The global focus + reduced-motion reset (`src/styles/reset.css`)**

```css
:where(:focus-visible) {
  outline: none; /* components re-add a token ring; NEVER leave this bare */
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
```

**6.3 Focus trap for modal surfaces (`src/hooks/index.ts`)**

```ts
export function useFocusTrap(active: boolean): React.RefObject<HTMLDivElement> {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!active || !ref.current) return;
    const container = ref.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    // focus first tabbable, wrap Tab/Shift+Tab within `container`…
    return () => {
      /* remove listener */
      previouslyFocused?.focus?.(); // restore focus to the trigger on close
    };
  }, [active]);
  return ref;
}
```

Usage in a `Modal`: `const ref = useFocusTrap(isOpen);` on the `role="dialog"` node, plus `useKeyDown('Escape', close, isOpen)` and `aria-modal="true"` labelled by the title id.

**6.4 Declared a11y contracts already in the repo**

```ts
// Button.meta.ts
a11y: {
  role: 'button',
  keyboard: ['Enter / Space: activate'],
  notes: ['Uses native <button>; `aria-busy` while loading; disabled removes it from the tab order.'],
},

// Tabs.meta.ts
a11y: {
  role: 'tablist',
  keyboard: ['Arrow Left/Right: move', 'Home/End: first/last', 'Enter/Space: activate'],
  notes: ['Implements the WAI-ARIA Tabs pattern with aria-selected + aria-controls.'],
},
```

**6.5 Storybook a11y wiring (`src/core/storybook.ts`)**

```ts
export function metaParameters(meta: ComponentMeta) {
  return {
    docs: { description: { component: docDescription(meta) } },
    a11y: meta.a11y?.role ? { element: `[role="${meta.a11y.role}"]` } : undefined,
  };
}
```

Every CSF3 story spreads this: `parameters: metaParameters(meta)`. The addon (registered in `.storybook/main.ts`) then runs axe against the declared role.

**6.6 Screen-reader-only text (`src/styles/global.css`)**

```css
.tds-sr-only {
  position: absolute;
  width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0);
  white-space: nowrap; border: 0;
}
```

Use `.tds-sr-only` for accessible names on icon-only controls and for live-region announcements that must not be visually rendered.

## 7. Validation Rules

How compliance is actually checked in this repo:

| Mechanism | Command / file | What it catches |
|---|---|---|
| axe-core in-browser | `@storybook/addon-a11y` (`.storybook/main.ts`) + `metaParameters` scope | Missing roles/labels, contrast, ARIA misuse, per story |
| a11y run mode | `a11y: { test: 'todo' }` in `.storybook/preview.tsx` | Global addon behavior (violations reported, not yet failing) — tighten to `'error'` when adopting a CI gate (**PLANNED**) |
| Type safety | `npm run build` (`tsc -b`) | `A11ySpec` shape (`role`/`keyboard`/`notes`) valid; strict mode |
| Lint | `npm run lint` (`eslint .`) | `react-hooks` rules on `useFocusTrap`/`useKeyDown`; hook ordering |
| Token integrity | `npm run ds:build` (`tokens:build`) | Focus tokens present in `tokens.css`; no hardcoded ring values (review-enforced) |
| Docs sync | `catalog:build` + autodocs | `docDescription(meta)` renders the Keyboard section; catalog reflects a11y intent |
| Manual keyboard sweep | `npm run storybook` | Tab order, focus visibility, Escape/arrow behavior, focus restore |
| Interaction tests | story `play` fns (interactions addon) | Programmatic focus/keyboard assertions |

**PLANNED gates (not present today):** automated axe in CI (`.github` workflows), `vitest`/`axe-playwright` unit/e2e a11y tests, and a Storybook test-runner a11y pass. Track these in [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md); do not claim they run.

## 8. Checklist

Per interactive component (copy into the PR / review):

- [ ] `meta.a11y.role` set and matches the rendered DOM role (or native element).
- [ ] `meta.a11y.keyboard[]` lists every supported key, and each is implemented.
- [ ] `meta.a11y.notes[]` explains ARIA relationships (`aria-selected`, `aria-controls`, `aria-modal`, `aria-busy`…).
- [ ] Native element used where possible (`<button>`, `<a href>`, `<input>`).
- [ ] `:focus-visible` ring implemented with `--tds-focus-ring-*` + `--tds-color-border-focus`; no bare `outline: none`.
- [ ] Focus visible against every `variant`/`tone` fill in **both** Light and Dark.
- [ ] Modal/overlay uses `useFocusTrap`; focus restores to trigger on close.
- [ ] Dismiss on `Escape` (`useKeyDown`) and outside-click (`useOnClickOutside`) where appropriate.
- [ ] Form control wrapped in `FormField`; error associated via `aria-describedby` + `aria-invalid`.
- [ ] Async state exposes `aria-busy`; live regions use `role="status"`/`role="alert"`/`aria-live`.
- [ ] Icon-only control has `aria-label`; decorative icon is `aria-hidden`.
- [ ] State never signalled by color alone.
- [ ] Motion neutralized under `prefers-reduced-motion` (global guard not defeated; JS motion checks `useMediaQuery`).
- [ ] `parameters: metaParameters(meta)` set on the story; addon-a11y panel clean.
- [ ] Contrast ≥ 4.5:1 text / ≥ 3:1 large-text & UI, both themes (WCAG 2.2 AA).
- [ ] `npm run lint` and `npm run ds:build` pass.

## 9. Failure Recovery

| Symptom | Diagnosis | Fix | Resume |
|---|---|---|---|
| addon-a11y reports "elements must have sufficient contrast" only in Dark | Component hardcodes a color or uses a token that fails in one Theme mode | Replace with a semantic token that passes in both modes; NEVER special-case a color inline | Re-run `npm run ds:build`, re-open story in both themes |
| Focus ring invisible on a solid/brand fill | Gap-ring surface color equals the fill, or ring uses wrong token | Apply the two-layer §6 pattern; verify `--tds-color-border-focus` contrasts with the fill | Tab through in Storybook |
| No visible focus anywhere | `outline: none` left by the reset with no component ring | Add the token `:focus-visible` ring in `X.css` | Keyboard sweep |
| Tab escapes an open Modal | `useFocusTrap` not wired, or ref not on the dialog root, or `active` never true | Attach `useFocusTrap(isOpen)` ref to the `role="dialog"` node | Open modal, press Tab to end and wrap |
| Focus lost after closing overlay | Trap cleanup didn't restore, or trigger unmounted | Ensure `useFocusTrap` cleanup runs (`active` toggles to false); keep trigger mounted | Close overlay, confirm trigger refocuses |
| Screen reader silent on error/toast | Missing live region | Add `role="alert"`/`role="status"` or `aria-live`; announce via `.tds-sr-only` if visual text absent | Trigger the state with SR on |
| axe: "Certain ARIA roles must contain particular children" (e.g. `tablist`) | Role declared but ARIA relationships incomplete | Add `aria-selected`/`aria-controls`/`id` wiring per the WAI-ARIA pattern in `notes` | Re-run addon |
| Motion still animates for reduced-motion users | JS animation bypasses the CSS guard | Gate with `useMediaQuery('(prefers-reduced-motion: reduce)')` | Toggle OS setting, verify |
| `metaParameters` scoping to `[role=...]` finds nothing | DOM role ≠ declared `meta.a11y.role` | Align DOM role to the meta (or fix the meta if the meta is wrong) | Re-run story |

If context is lost mid-task, rehydrate from `.ai/COMPONENT_INDEX.json` and `.ai/INTERACTION_RULES.json`, then re-open the component's `meta.a11y` — it is the durable contract ([28_RESUME_SPECIFICATION.md](./28_RESUME_SPECIFICATION.md)).

## 10. Dependencies

**Docs**

- [00_MASTER_RULES.md](./00_MASTER_RULES.md) — precedence, Design Lock, generated-is-sacred.
- [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md) — full Design Lock Policy; a11y never justifies unrequested visual change.
- [04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md) — Storybook as source of truth; where addon-a11y lives.
- [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md) — the 5-file anatomy, `FormField` labelling pattern.
- [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md) — focus tokens, semantic color, `--tds-*` emission.
- [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md) — `state` axis (focus/disabled/loading) and its Figma exclusion policy.
- [10_ANIMATION_SPECIFICATION.md](./10_ANIMATION_SPECIFICATION.md) — motion tokens + reduced-motion source of the guard.
- [11_INTERACTION_SPECIFICATION.md](./11_INTERACTION_SPECIFICATION.md) — interaction states, `play` tests, disclosure hooks.
- [12_RESPONSIVE_SPECIFICATION.md](./12_RESPONSIVE_SPECIFICATION.md) — reflow/target-size interplay with `useMediaQuery`.
- [05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md) — what the plugin reproduces (visual states, not runtime a11y).
- [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md) — current harness + PLANNED automated a11y tests.
- [39_AI_CHECKLIST.md](./39_AI_CHECKLIST.md) — master pre-commit checklist incorporating §8.

**Source files / manifests**

- [`src/core/types.ts`](../../src/core/types.ts) — `A11ySpec`, `ComponentState`, `ComponentMeta`.
- [`src/core/storybook.ts`](../../src/core/storybook.ts) — `metaParameters`, `docDescription` (Keyboard section).
- [`src/hooks/index.ts`](../../src/hooks/index.ts) — `useFocusTrap`, `useKeyDown`, `useOnClickOutside`, `useDisclosure`, `useMediaQuery`, `useControllableState`.
- [`src/styles/reset.css`](../../src/styles/reset.css) — focus reset + reduced-motion guard.
- [`src/styles/global.css`](../../src/styles/global.css) — `.tds-sr-only`.
- [`src/tokens/semantic.ts`](../../src/tokens/semantic.ts) — `focus.ring.width/offset`, `color.border.focus`, `shadow.focus`.
- [`.storybook/main.ts`](../../.storybook/main.ts) · [`.storybook/preview.tsx`](../../.storybook/preview.tsx) — addon registration + `a11y` parameter.
- Manifests: [.ai/COMPONENT_INDEX.json](../../.ai/COMPONENT_INDEX.json), [.ai/INTERACTION_RULES.json](../../.ai/INTERACTION_RULES.json), [.ai/VARIANT_INDEX.json](../../.ai/VARIANT_INDEX.json).

## 11. Template

Copy-paste skeletons for a fully accessible component.

**`X.meta.ts` — a11y block**

```ts
a11y: {
  role: 'dialog', // omit only for purely decorative atoms
  keyboard: [
    'Escape: close',
    'Tab: cycle within (focus trapped)',
    // 'Arrow Up/Down: move option', 'Enter/Space: activate', 'Home/End: first/last'
  ],
  notes: [
    'role="dialog" aria-modal; labelled by the title id; focus returns to the trigger on close.',
    // Explain every aria-* relationship the implementation relies on.
  ],
},
```

**`X.tsx` — focus + keyboard wiring**

```tsx
const ref = useFocusTrap(isOpen);
useKeyDown('Escape', close, isOpen);
useOnClickOutside(ref, close, isOpen);

return (
  <div
    ref={ref}
    role="dialog"
    aria-modal="true"
    aria-labelledby={titleId}
    {...toDataAttrs(meta, { size, tone })}
  >
    <h2 id={titleId}>{title}</h2>
    {children}
  </div>
);
```

**`X.css` — token focus ring**

```css
.tds-x:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 var(--tds-focus-ring-offset) var(--tds-color-bg-surface),
    0 0 0 calc(var(--tds-focus-ring-offset) + var(--tds-focus-ring-width))
      var(--tds-color-border-focus);
}
/* Motion, if any, is neutralized by the global reduced-motion guard in reset.css. */
```

**`X.stories.tsx` — a11y-wired story (CSF3)**

```tsx
const meta: Meta<typeof X> = {
  title: 'Molecules/X',
  component: X,
  tags: ['autodocs'],
  parameters: metaParameters(xMeta), // scopes axe to the declared role
  argTypes: argTypesFromMeta(xMeta),
  args: { ...argsFromMeta(xMeta) },
};
export default meta;
```

## 12. Future Extension

Designed to scale for years and toward the >10,000,000-user enterprise target:

1. **Automated a11y in CI (PLANNED).** Add a `.github` workflow running `@storybook/test-runner` with an axe step and flip `.storybook/preview.tsx` `a11y: { test: 'error' }` to fail builds on violations. Add `vitest` + `axe`/`jest-axe` unit checks and `axe-playwright` e2e. Track in [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md) / [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md).
2. **Machine-readable a11y in manifests.** Emit `meta.a11y` into `.ai/COMPONENT_INDEX.json` and `.ai/INTERACTION_RULES.json` so MCP agents ([35_MCP_SPECIFICATION.md](./35_MCP_SPECIFICATION.md)) can answer "which keys does X support?" without reading source — token-optimal ([26_TOKEN_OPTIMIZATION.md](./26_TOKEN_OPTIMIZATION.md)).
3. **WCAG 2.2 → future levels.** The token ring + reduced-motion + reflow model already targets 2.2 AA (incl. 2.4.11 Focus Not Obscured, 2.5.8 Target Size). New criteria adopt by extending `A11ySpec` (e.g. an optional `targetSizePx`) and re-running `ds:build`.
4. **Backend a11y (PLANNED).** When the Supabase-backed API/auth layer lands ([15_API_GUIDE.md](./15_API_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md)), extend this spec to transactional emails, error responses, and auth flows — reusing `FormField` labelling and live-region patterns so accessibility remains a data-driven contract end to end.
5. **Contrast tooling.** Add a `tokens:build`-time contrast validator that asserts every `color.fg.*`/`color.bg.*`/`color.border.*` pairing clears AA in both Theme modes, making rule 10 a build gate rather than a review item.
