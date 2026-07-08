---
title: Animation Specification
purpose: Define TDS motion tokens (duration/easing), where motion is used, reduced-motion policy, and exactly what is and is not reproducible in Figma.
status: ACTIVE
owner: AI OS
last-reviewed: 2026-07-08  <!-- placeholder: update on every review -->
precedence: Governed by 00_MASTER_RULES.md and the Design Lock Policy in 03_DESIGN_SYSTEM.md. This document is authoritative for motion; where it touches tokens defer to 08_TOKEN_SPECIFICATION.md, and where it touches the Figma bundle defer to 05_FIGMA_SPECIFICATION.md / 06_PLUGIN_SPECIFICATION.md. Generated outputs are never authoritative over the `*.meta.ts` / `src/tokens/*` sources.
---

# 10 — Animation Specification

> Motion in TDS is **token-driven, CSS-only, and zero-runtime**. Every transition and
> animation reads a `--tds-duration-*` / `--tds-easing-*` / `--tds-motion-*` custom property.
> The Figma plugin reproduces **static resting states only** — CSS `transition`/`animation`
> has no Figma equivalent and is deliberately skipped. This document is the contract for
> that boundary and feeds [.ai/ANIMATION_RULES.json](../../.ai/ANIMATION_RULES.json).

---

## 1. Purpose

This document specifies **all motion** in the TDS design system: the motion token model
(durations and easings), the semantic motion aliases that components consume, the shared
keyframe library, the reduced-motion guarantee, and — most importantly — the precise line
between what motion is **reproducible in Figma** and what is not.

It exists because motion is the one part of the design system that **does not survive the
Storybook → Figma reproduction pipeline intact**. Figma Variables can carry the *values*
(a duration is a number, an easing is a string), but Figma component sets have no property
for CSS `transition` or `@keyframes`. The plugin therefore emits motion tokens as reference
Variables but reproduces only each component's static end-state. Codifying this prevents
future agents from (a) inventing motion, (b) trying to "fix" the harmless transition-skip
warning, or (c) hand-editing generated Figma output to fake animation.

Downstream, this specification is the human-readable source for the machine manifest
[.ai/ANIMATION_RULES.json](../../.ai/ANIMATION_RULES.json), which caches the motion token
list, the keyframe registry, and the reproducibility flags for token-cheap agent reads.

---

## 2. Responsibilities

This specification is responsible for:

- **Motion token governance** — the canonical list of `duration.*`, `easing.*`, and
  `motion.*` tokens, their values, their token *types*, and their Figma variable mapping.
- **Semantic motion mapping** — which primitive each `motion.duration.*` / `motion.easing.*`
  semantic aliases to, so components never reference raw primitives directly.
- **Keyframe registry** — the shared `@keyframes` defined in `src/styles/global.css` plus
  component-local keyframes, and the rule that all keyframes are token-timed.
- **Reduced-motion policy** — the global `prefers-reduced-motion` reset and per-component
  overrides that make motion opt-out and accessible.
- **Figma reproducibility boundary** — declaring `transition`/`animation` as *unreproducible*
  and documenting the plugin's skip behavior and the harness's expected-note classification.
- **Feeding [.ai/ANIMATION_RULES.json](../../.ai/ANIMATION_RULES.json)** with the above.

It is **not** responsible for: the full token model (see [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md)),
interaction/keyboard behavior (see [11_INTERACTION_SPECIFICATION.md](./11_INTERACTION_SPECIFICATION.md)),
responsive breakpoints (see [12_RESPONSIVE_SPECIFICATION.md](./12_RESPONSIVE_SPECIFICATION.md)),
or accessibility beyond motion (see [13_ACCESSIBILITY_SPECIFICATION.md](./13_ACCESSIBILITY_SPECIFICATION.md)).

---

## 3. Scope (in-scope / out-of-scope)

**In-scope**

- Primitive motion tokens: `duration.{instant,fast,normal,slow,slower}` and
  `easing.{standard,emphasized,decelerate,accelerate,linear}` in `src/tokens/primitives.ts`.
- Semantic motion tokens: `motion.duration.{hover,enter,exit}` and
  `motion.easing.{standard,enter,exit}` in `src/tokens/semantic.ts`.
- Generated CSS custom properties `--tds-duration-*`, `--tds-easing-*`, `--tds-motion-*`
  in `src/tokens/generated/tokens.css`.
- Shared keyframes in `src/styles/global.css` and component-local keyframes (e.g. Skeleton).
- Reduced-motion handling in `src/styles/reset.css` and component CSS.
- The plugin's treatment of the `transition` binding channel and the harness classification.

**Out-of-scope**

- Figma **prototype interactions / Smart Animate** — the plugin does not generate them; the
  reproduction is a static component set. (See [05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md).)
- The `state` axis (default/hover/active/focus/disabled/loading) as Figma variants — it is
  deliberately not emitted; only `disabled`/`loading` survive as BOOLEAN props. (See
  [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md).)
- JavaScript-driven animation libraries — TDS ships **no** motion runtime; deps are only
  `react` + `react-dom`. Any such library would be a new dependency and is **PLANNED** at best.
- Backend/API/CI-driven visual-regression of motion — **PLANNED**; no test framework exists
  today (see [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md)).

---

## 4. Rules (MUST / SHOULD / NEVER)

1. **MUST — token-only timing.** Every CSS `transition` and `animation` MUST reference a
   motion token via custom property (`--tds-motion-duration-*`, `--tds-motion-easing-*`, or a
   primitive `--tds-duration-*` / `--tds-easing-*`). NEVER hardcode `ms`, `s`, or a
   `cubic-bezier(...)` literal in component CSS.
2. **MUST — prefer semantics.** Components SHOULD consume `--tds-motion-*` semantic aliases
   (hover/enter/exit) rather than raw primitives. Reach for a primitive
   (`--tds-duration-slower`, `--tds-easing-linear`) only for looping/utility motion
   (spinners, skeletons, indeterminate bars) that no semantic alias covers.
3. **MUST — respect reduced motion.** Any new looping or entrance animation MUST be neutralized
   under `@media (prefers-reduced-motion: reduce)`. The global reset in `src/styles/reset.css`
   already clamps `animation-duration`/`transition-duration` to `0.001ms`; a component with a
   *looping* or *shimmer/pulse* animation MUST additionally set `animation: none` for that state
   (as Skeleton, Popover, SocialLogin do).
4. **MUST — keyframes are shared and prefixed.** Reusable keyframes live in
   `src/styles/global.css` and MUST be named `tds-*`. Component-local keyframes (used by exactly
   one component) MAY live in the component `.css` but MUST still be `tds-<component>-*` prefixed.
5. **NEVER — no design drift.** Per the Design Lock in [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md),
   an AI MUST NEVER, on its own initiative, add, remove, speed up, slow down, "smooth", or
   otherwise change motion. Motion values are a **source change** to `src/tokens/*` that must be
   explicitly requested and must flow through the build pipeline.
6. **NEVER — no motion in `.meta.ts`.** `*.meta.ts` files are React/CSS-free pure data; they
   MUST NOT declare durations, easings, keyframes, or `transition` strings. Motion lives in CSS.
7. **NEVER — no Figma motion fabrication.** An AI MUST NEVER hand-edit `figma/tds.plugin.json`,
   `src/generated/*`, or the generated Figma document to simulate animation, and MUST NEVER add
   Figma prototype/Smart-Animate reactions. Figma reproduces static resting states only.
8. **MUST — accept the transition skip.** The plugin warning `"<Component>: "transition" token
   has no Figma equivalent — skipped"` is **expected and non-blocking**. It MUST NOT be
   "fixed", suppressed by deleting the token, or treated as a `figma:build` failure.
9. **SHOULD — instant honors zero.** `duration.instant` (0ms) exists for motion-free states;
   prefer it over deleting a `transition` when a state must be immediate.
10. **MUST — regenerate after any motion-token edit.** Editing `src/tokens/*` motion tokens MUST
    be followed by `npm run ds:build` (and `npm run figma:build` before hand-off) so
    `tokens.css`, `figma.tokens.json`, `token-ids.ts`, and the bundle stay in sync.

---

## 5. Workflow (step-by-step)

### 5.1 Consuming existing motion in a component (the common case)

1. Read the catalog first ([docs/COMPONENTS.md](../COMPONENTS.md)) and reuse an existing
   component — most work is reuse, not new motion.
2. In the component `.css`, wire transitions to semantics:
   ```css
   transition:
     background-color var(--tds-motion-duration-hover) var(--tds-motion-easing-standard),
     transform        var(--tds-motion-duration-hover) var(--tds-motion-easing-standard);
   ```
3. For entrance/exit (overlays), use `--tds-motion-duration-enter` / `--tds-motion-easing-enter`
   with a shared keyframe (`tds-fade-in`, `tds-scale-in`, `tds-slide-up`, …).
4. If the animation loops, add the reduced-motion `animation: none` override.
5. Run `npm run storybook` and confirm the motion in Storybook — **Storybook is the source of
   truth** ([04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md)).

### 5.2 Adding or changing a motion token (source change — requires approval)

1. Edit the primitive in `src/tokens/primitives.ts` (`duration` or `easing` map) **or** the
   semantic alias in `src/tokens/semantic.ts` (the `Motion` group).
2. Run `npm run tokens:build` (`tsx scripts/build-tokens.ts`). This regenerates
   `src/tokens/generated/{tokens.css, figma.tokens.json, token-ids.ts}`.
3. Run `npm run ds:build` to also refresh `src/generated/design-system.manifest.json`,
   `figma/tds.plugin.json`, and `docs/COMPONENTS.md`.
4. Run `npm run figma:build` — this additionally runs `plugin:typecheck`, `plugin:build`, and
   `plugin:test` (the headless harness). Confirm the transition note stays in the
   **expected** bucket, not the blocking bucket.
5. Update [.ai/ANIMATION_RULES.json](../../.ai/ANIMATION_RULES.json) and
   [.ai/TOKEN_INDEX.json](../../.ai/TOKEN_INDEX.json) per [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md).

### 5.3 How motion flows to Figma (and where it stops)

1. `build-tokens.ts` emits `duration` tokens as CSS `…ms` and Figma **FLOAT** variables, and
   `cubicBezier` tokens as CSS easing strings and Figma **STRING** variables (see
   `src/tokens/types.ts`). The `Duration`, `Easing`, and `Motion` groups therefore appear as
   Variables in the Figma bundle's `tokens.collections` (Primitives + Semantic).
2. `build-manifest.ts` → `figma/tds.plugin.json`. Per-variant `tokenBindings` are derived by
   `scripts/lib/css-bindings.ts`, whose channel map covers paint/layout properties only and
   **skips `@media` and `@keyframes`** — so motion is never bound to a component's `figma{}`.
3. The plugin (`figma/plugin/src/components.ts`) has a defensive `case 'transition'` that logs
   `"transition token has no Figma equivalent — skipped"` and moves on. **No motion reaches the
   rendered component set** — Figma shows the resting state only (e.g. Spinner renders as a
   static ¾ arc, see `figma/plugin/src/recipes.ts`).

---

## 6. Examples (repo-specific)

### 6.1 The motion token table (verified values)

**Primitives — `src/tokens/primitives.ts` → `src/tokens/generated/tokens.css`**

| Token id           | Type          | Value                        | CSS variable              |
| ------------------ | ------------- | ---------------------------- | ------------------------- |
| `duration.instant` | `duration`    | `0`                          | `--tds-duration-instant: 0ms` |
| `duration.fast`    | `duration`    | `120`                        | `--tds-duration-fast: 120ms` |
| `duration.normal`  | `duration`    | `200`                        | `--tds-duration-normal: 200ms` |
| `duration.slow`    | `duration`    | `320`                        | `--tds-duration-slow: 320ms` |
| `duration.slower`  | `duration`    | `480`                        | `--tds-duration-slower: 480ms` |
| `easing.standard`  | `cubicBezier` | `cubic-bezier(0.2, 0, 0, 1)` | `--tds-easing-standard` |
| `easing.emphasized`| `cubicBezier` | `cubic-bezier(0.3, 0, 0, 1)` | `--tds-easing-emphasized` |
| `easing.decelerate`| `cubicBezier` | `cubic-bezier(0, 0, 0, 1)`   | `--tds-easing-decelerate` |
| `easing.accelerate`| `cubicBezier` | `cubic-bezier(0.3, 0, 1, 1)` | `--tds-easing-accelerate` |
| `easing.linear`    | `cubicBezier` | `cubic-bezier(0, 0, 1, 1)`   | `--tds-easing-linear` |

**Semantics — `src/tokens/semantic.ts` (group `Motion`, Semantic collection)**

| Semantic token           | Aliases primitive   | CSS variable                                          |
| ------------------------ | ------------------- | ----------------------------------------------------- |
| `motion.duration.hover`  | `duration.fast`     | `--tds-motion-duration-hover: var(--tds-duration-fast)` |
| `motion.duration.enter`  | `duration.normal`   | `--tds-motion-duration-enter: var(--tds-duration-normal)` |
| `motion.duration.exit`   | `duration.fast`     | `--tds-motion-duration-exit: var(--tds-duration-fast)` |
| `motion.easing.standard` | `easing.standard`   | `--tds-motion-easing-standard: var(--tds-easing-standard)` |
| `motion.easing.enter`    | `easing.decelerate` | `--tds-motion-easing-enter: var(--tds-easing-decelerate)` |
| `motion.easing.exit`     | `easing.accelerate` | `--tds-motion-easing-exit: var(--tds-easing-accelerate)` |

### 6.2 Token-timed transition (Button — `src/components/atoms/Button/Button.css`)

```css
.tds-button {
  transition:
    background-color var(--tds-motion-duration-hover) var(--tds-motion-easing-standard),
    border-color     var(--tds-motion-duration-hover) var(--tds-motion-easing-standard),
    color            var(--tds-motion-duration-hover) var(--tds-motion-easing-standard),
    box-shadow       var(--tds-motion-duration-hover) var(--tds-motion-easing-standard),
    transform        var(--tds-motion-duration-hover) var(--tds-motion-easing-standard);
}
```

### 6.3 Shared keyframes (`src/styles/global.css`)

The global stylesheet defines the reusable, token-timed keyframe library consumed across
components: `tds-spin`, `tds-fade-in`, `tds-scale-in`, `tds-slide-up`, `tds-slide-down`,
`tds-slide-in-right`, `tds-slide-in-left`, `tds-slide-in-up`, `tds-slide-in-down`,
`tds-indeterminate`. Example consumers:

```css
/* Spinner — src/components/atoms/Spinner/Spinner.css */
animation: tds-spin var(--tds-duration-slow) var(--tds-easing-linear) infinite;

/* Progress (indeterminate) — src/components/atoms/Progress/Progress.css */
animation: tds-indeterminate var(--tds-duration-slower) var(--tds-easing-standard) infinite;
```

### 6.4 Reduced-motion — global reset + component override

```css
/* src/styles/reset.css — global opt-out */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}

/* src/components/atoms/Skeleton/Skeleton.css — looping motion fully off */
@media (prefers-reduced-motion: reduce) {
  .tds-skeleton[data-animation='pulse'],
  .tds-skeleton[data-animation='shimmer']::after {
    animation: none;
  }
}
```

### 6.5 The expected (non-blocking) Figma note

```
Card: "transition" token has no Figma equivalent — skipped
```
Emitted once per component by `figma/plugin/src/components.ts`; counted by the harness under
`other (expected) notes`, **not** `blocking warnings`. `figma:build` still passes.

---

## 7. Validation Rules

Compliance is enforced by real mechanisms in this repo:

1. **Lint / format** — `npm run lint` (eslint) + `npm run format` (prettier) must pass on any
   edited CSS/TS. No motion-specific lint rule exists, so Rules 1–2 (token-only timing) are
   verified by **review** (grep for literal `cubic-bezier(` or `\dms`/`\ds` in component CSS).
2. **Token build** — `npm run tokens:build` must regenerate `tokens.css` /
   `figma.tokens.json` / `token-ids.ts` with no error; new motion tokens must appear in the
   generated `TokenId` union in `src/tokens/generated/token-ids.ts`.
3. **Design-system build** — `npm run ds:build` must succeed and keep
   `src/generated/design-system.manifest.json` + `figma/tds.plugin.json` in sync.
4. **Figma build + headless harness** — `npm run figma:build` runs `plugin:typecheck`,
   `plugin:build`, and `plugin:test` (`figma/plugin/test/harness.ts`). The harness MUST report
   `blocking warnings: 0`; the transition-skip notes are expected under `other (expected) notes`.
   A non-zero blocking count `process.exit(1)`s the build.
5. **Manifest schema** — [.ai/ANIMATION_RULES.json](../../.ai/ANIMATION_RULES.json) must
   validate against its `$schema` and stay reconciled with the token source (see
   [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md)).
6. **Manual / a11y** — reduced-motion behavior is verified manually (OS "reduce motion" +
   Storybook) and via the Storybook a11y addon; there is no automated motion visual-regression
   today (**PLANNED**, see [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md)).

---

## 8. Checklist

- [ ] Every new `transition`/`animation` reads a `--tds-duration-*`/`--tds-easing-*`/`--tds-motion-*` var.
- [ ] No hardcoded `ms`, `s`, or `cubic-bezier(...)` literal in component CSS.
- [ ] Semantic motion aliases preferred; primitives only for looping/utility motion.
- [ ] Looping/entrance animations have a `prefers-reduced-motion: reduce` override.
- [ ] New shared keyframes live in `global.css` and are `tds-*` prefixed.
- [ ] No motion declared in any `*.meta.ts`.
- [ ] Motion verified in Storybook (source of truth) before Figma.
- [ ] `npm run ds:build` run; generated tokens/manifest/bundle regenerated (not hand-edited).
- [ ] `npm run figma:build` passes with `blocking warnings: 0`; transition notes are expected.
- [ ] No Figma output hand-edited to fake motion; no Smart-Animate reactions added.
- [ ] [.ai/ANIMATION_RULES.json](../../.ai/ANIMATION_RULES.json) + [.ai/TOKEN_INDEX.json](../../.ai/TOKEN_INDEX.json) updated.

---

## 9. Failure Recovery

| Symptom | Diagnosis | Fix | Resume |
| ------- | --------- | --- | ------ |
| `figma:build` fails, harness prints `blocking warnings > 0` | An **unresolved alias / unknown mode / not found** — NOT the transition note | Fix the underlying token alias in `src/tokens/*`; the transition note is never blocking | Re-run `npm run figma:build` |
| A component animates in Storybook but is static in Figma | **Expected.** CSS motion is unreproducible; plugin skipped `transition` | None — this is by design (Rule 7, Section 5.3) | Confirm the static resting state is correct instead |
| Motion feels off after a token edit | Edited source but did not rebuild | Run `npm run tokens:build` → `npm run ds:build` | Reload Storybook; re-verify |
| New easing not usable via `--tds-easing-x` | `tokens.css` stale / token not registered | Add to `easing` map in `primitives.ts`, run `tokens:build` | Reference the new `--tds-easing-x` |
| Motion ignores reduced-motion for a looping element | Global reset clamps duration but element loops via `iteration-count` | Add `animation: none` in a component `prefers-reduced-motion` block | Re-test with OS reduce-motion on |
| Agent "fixed" the transition warning by deleting a token | Design drift / over-eager fix | Revert; the warning is expected (Rule 8) | Restore token, re-run `figma:build` |
| Generated `tokens.css` edited by hand | Violates generated-is-sacred | Revert the file; change the source in `src/tokens/*` instead | `npm run ds:build` |

---

## 10. Dependencies

**Sibling docs**

- [00_MASTER_RULES.md](./00_MASTER_RULES.md) — constitution, Design Lock, generated-is-sacred.
- [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md) — full Design Lock Policy (no motion drift).
- [04_STORYBOOK_SPECIFICATION.md](./04_STORYBOOK_SPECIFICATION.md) — Storybook is the source of truth for motion.
- [05_FIGMA_SPECIFICATION.md](./05_FIGMA_SPECIFICATION.md) — Figma is a static reproduction; no prototype motion.
- [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md) — plugin algorithm + transition-skip + harness gate.
- [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md) — token model, types, generation of motion tokens.
- [09_VARIANT_SPECIFICATION.md](./09_VARIANT_SPECIFICATION.md) — state-axis exclusion policy.
- [11_INTERACTION_SPECIFICATION.md](./11_INTERACTION_SPECIFICATION.md) — interaction states motion belongs to.
- [12_RESPONSIVE_SPECIFICATION.md](./12_RESPONSIVE_SPECIFICATION.md) — breakpoints (motion is not responsive-gated).
- [13_ACCESSIBILITY_SPECIFICATION.md](./13_ACCESSIBILITY_SPECIFICATION.md) — reduced-motion, WCAG 2.3.3 targets.
- [27_MANIFEST_SPECIFICATION.md](./27_MANIFEST_SPECIFICATION.md) — schema/update rules for ANIMATION_RULES.json.

**Manifests**

- [.ai/ANIMATION_RULES.json](../../.ai/ANIMATION_RULES.json) — primary consumer of this doc.
- [.ai/TOKEN_INDEX.json](../../.ai/TOKEN_INDEX.json) — motion tokens live here too.

**Source & scripts**

- `src/tokens/primitives.ts`, `src/tokens/semantic.ts`, `src/tokens/types.ts` — motion sources.
- `src/tokens/generated/tokens.css` — generated `--tds-duration/easing/motion-*` (never hand-edit).
- `src/styles/global.css`, `src/styles/reset.css` — keyframes + reduced-motion.
- `scripts/build-tokens.ts`, `scripts/build-manifest.ts`, `scripts/lib/css-bindings.ts`.
- `figma/plugin/src/components.ts` (transition skip), `figma/plugin/test/harness.ts` (gate).

---

## 11. Template

Copy-paste skeleton for adding token-driven motion to a component `.css`:

```css
/* State/hover transition — always token-timed, semantic-first. */
.tds-<component> {
  transition:
    background-color var(--tds-motion-duration-hover) var(--tds-motion-easing-standard),
    transform        var(--tds-motion-duration-hover) var(--tds-motion-easing-standard);
}

/* Entrance (overlays) — enter duration/easing + a shared keyframe. */
.tds-<component>[data-state='open'] {
  animation: tds-scale-in var(--tds-motion-duration-enter) var(--tds-motion-easing-enter);
}

/* Looping/utility motion — primitive tokens are acceptable here. */
.tds-<component>-spinner {
  animation: tds-spin var(--tds-duration-slow) var(--tds-easing-linear) infinite;
}

/* MANDATORY reduced-motion opt-out for any looping/entrance motion. */
@media (prefers-reduced-motion: reduce) {
  .tds-<component>[data-state='open'],
  .tds-<component>-spinner {
    animation: none;
  }
}
```

Skeleton entry for [.ai/ANIMATION_RULES.json](../../.ai/ANIMATION_RULES.json):

```json
{
  "$schema": "./_schemas/animation-rules.schema.json",
  "version": "1.0.0",
  "generatedAt": "<ISO-8601>",
  "generator": "derived from src/tokens/* + src/styles/global.css",
  "durations": { "instant": 0, "fast": 120, "normal": 200, "slow": 320, "slower": 480 },
  "easings": {
    "standard": "cubic-bezier(0.2, 0, 0, 1)",
    "emphasized": "cubic-bezier(0.3, 0, 0, 1)",
    "decelerate": "cubic-bezier(0, 0, 0, 1)",
    "accelerate": "cubic-bezier(0.3, 0, 1, 1)",
    "linear": "cubic-bezier(0, 0, 1, 1)"
  },
  "semantics": {
    "motion.duration.hover": "duration.fast",
    "motion.duration.enter": "duration.normal",
    "motion.duration.exit": "duration.fast",
    "motion.easing.standard": "easing.standard",
    "motion.easing.enter": "easing.decelerate",
    "motion.easing.exit": "easing.accelerate"
  },
  "keyframes": [
    "tds-spin", "tds-fade-in", "tds-scale-in", "tds-slide-up", "tds-slide-down",
    "tds-slide-in-right", "tds-slide-in-left", "tds-slide-in-up", "tds-slide-in-down",
    "tds-indeterminate"
  ],
  "reducedMotion": { "globalReset": "src/styles/reset.css", "strategy": "clamp-to-0.001ms + per-component animation:none" },
  "figma": { "reproducible": false, "reason": "CSS transition/animation has no Figma equivalent; plugin skips the 'transition' channel and reproduces static resting states only" }
}
```

---

## 12. Future Extension

Motion is intentionally minimal today; these are the sanctioned growth paths (each a **source**
change flowing through the pipeline, never a hand-edit):

- **More semantic aliases** — as new patterns emerge (e.g. `motion.duration.expand` for
  Accordion, `motion.easing.overshoot`), add them to the `Motion` group in `semantic.ts` so
  components keep consuming semantics, not primitives. Keeps the token surface intent-named.
- **Per-theme / per-density motion** — the token model supports modes; a future "reduced" or
  high-density motion mode could live as a Semantic-collection mode without touching components.
- **Motion regression testing (PLANNED)** — no test framework exists today; a future
  interaction/visual layer (Storybook `play` + a runner) could assert reduced-motion neutralizes
  looping animations and that transitions read tokens. See [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md).
- **Figma reproducibility stays fixed** — Figma will remain a static reproduction. If Figma ever
  ships a first-class transition/prototype variable that the plugin could bind, that is a
  contract change to [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md) and
  `figma/README.md` — never an ad-hoc plugin edit.
- **Scale (>10M users)** — motion is zero-runtime CSS with no per-user cost; it scales for free.
  The only scaling concern is **authoring** consistency, which this token model + the AI OS
  manifests ([.ai/ANIMATION_RULES.json](../../.ai/ANIMATION_RULES.json)) already guarantee.
