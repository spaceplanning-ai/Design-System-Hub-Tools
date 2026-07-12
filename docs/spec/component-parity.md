# Storybook ⇄ Figma Component Parity

**Matched: 52 · Storybook-only: 7 · Figma-only: 2**
(Storybook components: 59 · Figma unique component names: 54, across 63 sets — 9 names are duplicated between a numbered `System - *` set and a `components` set.)

> Systemic note: many Figma sets ship a single `state: default` instance with only text/swap props and **no real variant axis**. These are placeholders that do not encode the component's states. They are flagged below and drive most of the recommendations.
>
> Duplication note: 9 components exist twice in Figma (a `System` set and a `components` set) with **divergent axes** — e.g. Button has `size` only in the `components` set. Gaps below treat the *union* of both sets as "what Figma offers," but the divergence itself is a defect (see Recommended #2).

## Matched

| Component | Storybook variants/props (brief) | Figma axes/props (brief) | Gaps |
|---|---|---|---|
| TextField | state: default/error/success/disabled/readOnly; counter over-limit; description/helper/counter meta | error, success, disabled, readOnly; +label/placeholder/description/helper, showDescription, showCounter (System set lacks desc/counter) | No over-limit counter visual; System vs components sets diverge |
| Textarea | state: default/error/disabled/readOnly; autoResize; required; counter | error, disabled, readOnly, required; label/value/helper | No counter; autoResize N/A (ok) |
| PasswordField | state incl. readOnly/required; visibility hidden/visible toggle; showToggle | error, success, disabled, required; swap Trailing Icon | Missing readOnly axis; **no visibility (show/hide) state**; no showToggle |
| EmailField | state: default/success/error/disabled; validate; required | error, success, disabled, required | Good parity |
| NumberField | state: default/readOnly/disabled; stepper atMin/atMax; unit | disabled, readOnly; label/value/helper | No stepper bound states; no unit; no +/− accessory |
| CurrencyField | state: default/error/readOnly/disabled; currency unit | error, disabled, readOnly | No currency-unit variant/prop |
| SearchField | state: default/disabled; clear button shown/hidden | disabled; swap Leading/Trailing Icon | No clear-button-present axis |
| OtpField | state: default/error/disabled; cell filled/empty; **length 4–8** | error, disabled; label/helper | **No length axis**; no per-cell filled state (likely fixed 6) |
| SocialLoginButton | provider ×4; size md/lg; showLogo | provider ×4, size md/lg; showLogo | Full parity |
| Checkbox | checked/unchecked/indeterminate; disabled | checked, indeterminate, disabled | Full parity |
| Radio | direction row/column; option selected/unselected/disabled | selected, disabled | No direction axis (group layout) |
| Toggle | size sm/md; on/off; disabled | checked, size sm/md, disabled (components) | Full parity (System set lacks size) |
| Chip | size sm/md; selected; disabled; **removable ×**; leading icon | selected, disabled, size; swap leading | **No removable (× button) axis** |
| Select | **open/closed**; error; disabled; value placeholder/selected; option states | error, disabled; swap Icon | **No open state / option list** |
| MultiSelect | open/closed; selection empty/chips; disabled; option states | disabled; label; swap Icon | No open state, no chips, no error |
| Slider | showValue; disabled; fill % | value 0/50/100; label/value | **No disabled axis**; no showValue toggle |
| Dropdown | align start/end; **open**; disabled; item default/danger/disabled/divider | state: default; 3 items + swap icons | No open/align/item-variant states (static) |
| Upload | drag default/dragOver; disabled; default/custom content | disabled; prompt/hint; swap Icon | No dragOver state |
| Button | variant ×4; size sm/md/lg; disabled; showIcon | variant ×4, size sm/md/lg, disabled, showIcon (components) | Full parity (System set lacks size) |
| Badge | variant ×4; size sm/md | variant ×4, size sm/md (components) | Full parity (System set lacks size) |
| Alert | variant error/success; showIcon | components: error/success, showIcon; System: info/success/warning/error | components matches; **System set has extra info/warning** not in SB Alert |
| Toast | tone success/info/warning/error; showIcon | tone/variant ×4; showIcon | Full parity |
| Snackbar | variant default/success/error; open; inline; actionLabel; showClose | action false/true; message/action | **No variant axis**; no showClose/inline |
| Tooltip | placement top/bottom/left/right; visibility | placement bottom/top | **Missing left/right placements** |
| Loading | variant spinner/dots; size sm/md/lg; overlay | size sm/md/lg; label | **No spinner/dots variant**; no overlay |
| Statistics | columns 2/3/4; delta up/down/flat/none; hint | state: default; label/value/delta | No columns axis; no delta-sign variants |
| Tab | variant segmented/underline; size sm/md; active/disabled | active false/true; label | **No variant/size/disabled** |
| Breadcrumb | separator glyph; collapsed; link/plain/current | state: default; Item1/Item2/Current | No collapsed state; separator fixed |
| Pagination | active/default; prev/next disabled; ellipsis | state: default (no text props) | No active/disabled/ellipsis states (static) |
| Navbar | sticky; item active/default; actions | state: default; brand/links/CTA | No sticky, no active-item axis |
| Header | divider; breadcrumb; actions; description | state: default; title + swap menu/search/bell icons | No divider/breadcrumb/desc/actions axes; Figma adds icon slots not in SB |
| Footer | links present/absent; description present/absent | state: default; copyright/links | No description |
| Sidebar | width; item active/default/disabled; badge; section title | state: default; brand/items + icons | No active/disabled/badge axis; Figma adds brand (SB has none) |
| Card | showFooter | footer axis (System) / showFooter (components) | Full parity |
| List | divider; selectable; item default/selected/disabled | state: default; Name/Sub ×3 | No divider/selectable/selected/disabled states |
| Accordion | item open/closed; single/multiple; disabled | expanded false/true; title/body | Missing multiple/disabled (minor) |
| Modal | size sm/md/lg; showClose; inline; footer; title | state: default; title/body/cancel/confirm + close icon | **No size axis**; no showClose/footer variants |
| Dialog | variant alert/confirm/prompt; danger; inline; cancel presence | state: default; title/body/cancel/confirm | **No variant (alert/confirm/prompt)**; no danger; no prompt input |
| Popover | placement bottom-start/end; showArrow; open; title | state: default; title/body | No placement/arrow axis |
| Drawer | side left/right; inline; width; title | state: default; title/items + icons | **No side axis**; Figma models as nav-drawer vs SB generic body |
| BottomSheet | showHandle; inline; title | state: default; title/body | No showHandle axis |
| ActionSheet | action danger; action disabled; inline; title | state: default; Action1-3/Cancel | No danger/disabled action states |
| Avatar | size sm/md/lg/**xl**; shape circle/rounded; status online/offline/busy; image/initials; tone | size sm/md/lg; Initial | **Missing xl**; no shape/status/image/tone |
| Chart | type line/bar/doughnut; dataset; showLegend; title | type ×3; title; showLegend | Full parity (dataset = sample data) |
| Calendar | day default/selected/today/outside/out-of-range; disabled; range | state: default; title + prev/next | No day-states/disabled (static header) |
| DatePicker | open; value empty/filled; error; disabled | state: default; label/value + icon | No open/error/disabled |
| TimePicker | open; value empty/filled; minuteStep; disabled | state: default; label/value + icon | No open/minuteStep/disabled |
| DateRangePicker | open; empty/start-only/full; day-state; disabled | state: default; label/value + icon | No open/range/day states |
| Table | striped; bordered; compact; empty; sort none/asc/desc; row-click; align | state: default; Head1-3 | No striped/bordered/compact/sort/empty variants |
| Timeline | item done/active/pending; +time/description | state: default; Title1-3 | **No status axis** |
| Tree | folder/leaf; expanded; default/selected/disabled; nesting | state: default; Node1-5 | No expanded/selected/folder-leaf states |
| Carousel | showArrows; showDots; loop; aspectRatio; active-index | state: default; Slide + swap Prev/Next | No arrows/dots/loop axes |

## Storybook-only (missing in Figma)

- **InputBase** — internal shared primitive, no stories; intentionally not a public Figma set. No action needed (or model as a hidden base). *Effort: n/a.*
- **Autocomplete** — InputBase + filtered suggestion dropdown. Add set with axes: open/closed, results/empty, error, disabled. *Effort: medium.*
- **EmptyState** — icon/title/description/action. Simple set: compact, description present/absent, action present/absent, icon swap. *Effort: low.*
- **FilterBar** — composite of SearchField + Select + Chip. Better as a template/instance frame than a variant set. *Effort: medium, low priority.*
- **AdminShell** — full app layout (Navbar + Sidebar + main). Represent as a template frame, not a component set. *Effort: high, low value as a component.*
- **FileUpload** — Upload dropzone + attached-file list. Add set: empty/has-files, dragOver, disabled. *Effort: medium.*
- **ImageUpload** — Upload dropzone + thumbnail grid. Add set: empty/has-images, add-tile shown/hidden, disabled. *Effort: medium.*

## Figma-only

- **DS/Divider** (`6. System - Layout`, axis: label false/true) — no Storybook component. Either add a Divider to Storybook or drop from the DS.
- **DS/Progress** (`8. System - Data`, axis: value 25/50/75/100) — no Storybook linear-progress component (SB `Loading` is spinner/dots only, not a bar). Either add a Progress bar to Storybook or reconcile with Loading.

## Recommended alignment (prioritized)

1. **Resolve the 9 duplicate/divergent sets** (Button, TextField, Card, Alert, Badge, Toggle, Checkbox, Toast, Chip). Pick one canonical set per component; the `System` Button/Toggle/Badge lack `size` that `components` has, and `System` Alert carries extra info/warning variants SB Alert doesn't. *High value, low effort — removes ambiguity for consumers.*
2. **Add the `open` state to all overlay-trigger inputs**: Select, MultiSelect, Dropdown, DatePicker, TimePicker, DateRangePicker. The open panel/list is the component's primary purpose and is entirely missing. *High value.*
3. **Give data components their real state axes** (currently single `state: default`): Table (striped/bordered/compact/sort/empty), Timeline (done/active/pending), Tree (expanded/selected), Calendar (day-states). *High value, medium effort.*
4. **Tab**: add `variant` (segmented/underline), `size` (sm/md), and disabled — core navigation component currently reduced to active on/off. *High value, low effort.*
5. **Modal + Dialog**: add Modal `size` (sm/md/lg) and Dialog `variant` (alert/confirm/prompt) + danger. These change layout/actions materially. *Medium value, low effort.*
6. **Avatar**: add missing `xl` size plus `shape` (circle/rounded), `status` dot, and image/initials source. *Medium value, low effort.*
7. **Loading**: add `variant` (spinner/dots) and `overlay`. *Medium value, low effort.*
8. **Snackbar**: add `variant` (default/success/error) and showClose — only `action` exists today. *Medium value, low effort.*
9. **Tooltip**: add `left`/`right` placements to reach parity with SB's 4. **PasswordField**: add show/hide visibility state + readOnly. **OtpField**: add length axis / filled-cell state. *Low effort, quick wins bundled.*
10. **Backfill the 6 real Storybook-only components** as Figma sets, easiest first: EmptyState → FileUpload → ImageUpload → Autocomplete; treat FilterBar/AdminShell as templates, not variant sets. *Medium effort, closes the Storybook-only gap.*
