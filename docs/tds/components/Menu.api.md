<!-- AUTO-GENERATED from contracts/Menu.contract.json — DO NOT EDIT (pnpm codegen) -->

# Menu API

> ⚠️ **자동 생성 문서** — 이 파일은 계약에서 생성됩니다. 직접 수정하지 마세요.
> 변경이 필요하면 `contracts/Menu.contract.json` 을 수정한 뒤 `pnpm codegen` 을 실행하세요.

메뉴 버튼 — 트리거 버튼을 누르면 명령 목록(role=menu)이 열린다. WAI-ARIA Menu Button 패턴이다. 도메인을 모른다 — 항목은 items prop 으로 주입하고 선택 결과는 onSelect(id) 로만 알린다 (ADR-0003).

[승격 근거] 어드민에 독립 구현이 둘 있었고 a11y 가 이미 갈라져 있었다 — apps/admin/src/pages/members/components/ActionMenu.tsx(화살표·Esc·Home/End 전부 구현)와 apps/admin/src/pages/settings/api-keys/components/IntegrationOverflowMenu.tsx(화살표·Home/End 없음). 리포의 승격 규율('두 번째 소비자가 생길 때 올린다')이 이미 발동된 상태였고, IntegrationOverflowMenu 는 ActionMenu 의 존재를 모른 채 '소비자 한 곳뿐'이라고 적고 있었다(그 파일 3-5줄). **키보드 계약은 강한 쪽(ActionMenu)을 정본으로 삼는다** — 약한 쪽을 기준으로 올리면 승격이 곧 접근성 퇴행이 된다.

[선택이 아니라 명령이다] 이 컴포넌트는 값을 고르지 않는다. 각 항목은 실행되는 명령이고 '현재 선택된 항목' 개념이 없다 — 그래서 role=menu + role=menuitem 이며 aria-checked 를 쓰지 않는다. 값을 고르는 팝업(단일 선택 표시가 필요한 것)은 이 계약의 대상이 아니다.

[잠긴 항목을 지우지 않는다] 지금 할 수 없는 명령은 목록에서 없애지 않고 잠그고 이유를 적는다 — 없애 버리면 운영자는 그 기능이 존재하지 않는다고 결론짓는다. '아직'과 '없음'은 다른 사실이다. items[].disabledReason 이 그 이유 문구이며, 값이 있으면 해당 항목은 자동으로 잠긴다(disabled 를 따로 주지 않아도 된다).

[레이어링 — 포털을 쓰지 않는다] 팝업은 position:absolute 로 트리거 래퍼(position:relative) 안에 그린다. Modal 처럼 body 로 포털하지 않는 이유는 둘이다: (1) 이 메뉴는 표 행·툴바 안에 살아 스크롤 컨테이너와 함께 움직여야 한다, (2) 리포에 이미 포털이 Storybook 데코레이터가 감싼 DOM 을 벗어나는 실결함이 있다(Modal·ConfirmDialog — Radix Portal 이 body 에 붙는다). 같은 결함을 재생산하지 않는다. [해소 표기 2026-07-20] 이 근거의 원래 사례는 "DarkTheme 스토리가 라이트로 렌더된다" 였는데, 다크 테마 제거로 withTheme 데코레이터와 DarkTheme 스토리가 사라져 그 사례 자체가 없어졌다. 포털이 데코레이터를 벗어난다는 사실은 그대로여서 근거는 유지한다.

## 개요

| 항목 | 값 |
|---|---|
| 버전 | `1.0.0` |
| 레벨 | `molecule` |
| 카테고리 | `Actions` |
| 상태 | `beta` |
| 소유 | code `component-eng` · design `ui-design` · figma `figma-eng` |
| 의존 컴포넌트 | `Icon` |

## Props

| 이름 | 타입 | 기본값 | 필수 | Figma Property | 설명 |
|---|---|---|---|---|---|
| `label` | `string` | — | ✅ | — | 스크린 리더용 대상 이름 — 행마다 달라야 한다('명재우 회원 액션'). 트리거 버튼의 aria-label 이자 role=menu 의 aria-label 로 쓰인다 |
| `items` | `array` | — | ✅ | — | 명령 목록. 데이터 prop — Figma Component Property 대응 없음 (ADR-0003). danger 는 파괴적 명령(붉은 텍스트), disabled 는 진행 중 잠금, disabledReason 은 '왜 못 하는지' 문구이며 값이 있으면 그 항목은 잠긴 것으로 본다 |
| `align` | `'start'` \| `'end'` | `"end"` | — | `Align` | 팝업이 트리거의 어느 모서리에 맞춰지는가. 논리 속성(inset-inline)이라 RTL 에서 자동으로 뒤집힌다. 행 끝 액션은 end, 좌측 툴바는 start |
| `trigger` | `'more-horizontal'` \| `'more-vertical'` | `"more-horizontal"` | — | `Trigger` | 트리거 글리프. 둘 다 DS Icon 의 more-horizontal 한 종을 쓰고 vertical 은 CSS 로 90도 돌린다 — Icon 계약(59종)에 more-vertical 이 없고 아이콘을 늘리는 것은 Icon 계약 소유자의 일이라 여기서 늘리지 않는다 |

## Events

| 이름 | Payload | 발화 차단 상태 | 설명 |
|---|---|---|---|
| `onSelect` | `string` | `items[].disabled`, `items[].disabledReason` | 명령이 선택되면 그 항목의 id 를 전달한다. 잠긴 항목에서는 발화하지 않는다(native disabled 로 막는다). 발화 직전에 팝업을 닫되 트리거로 포커스를 되돌리지는 않는다 — 명령이 다이얼로그를 열 수 있어 포커스를 빼앗으면 안 된다 |
| `onOpenChange` | `boolean` | — | 팝업이 열리거나 닫힐 때 상태를 전달한다. 호출부가 열린 행을 강조하거나 바깥 상태를 맞출 때 쓴다 |

## States

`default` · `hover` · `focus-visible` · `open` · `disabled`

> Story 커버리지는 enum prop 값 곱 × boolean prop 당 2 조합 100%가 요구됩니다 (`combinationMatrix` 참조).
> states 는 이 행렬에 포함되지 않습니다 — state 커버리지는 커버리지 축2(contract-states)가 **단언을 가진 테스트**로 따로 강제합니다.

## A11y

| 항목 | 값 |
|---|---|
| role | `menu` |
| 키보드 | `Tab — 트리거는 탭 순서에 있다. 팝업이 열린 상태에서 Tab 을 누르면 팝업을 닫고 포커스는 자연스럽게 다음 요소로 흘러간다(포커스 트랩을 두지 않는다 — 메뉴는 모달이 아니다)`, `Enter / Space — 트리거에서 팝업을 연다(native button). 항목에서는 그 명령을 실행한다`, `ArrowDown — 트리거에서 누르면 팝업을 열고 첫 항목으로 간다. 팝업 안에서는 다음 항목으로 이동하며 마지막에서 첫 항목으로 순환한다`, `ArrowUp — 팝업 안에서 이전 항목으로 이동하며 첫 항목에서 마지막으로 순환한다`, `Home — 첫 항목으로`, `End — 마지막 항목으로`, `Escape — 팝업을 닫고 **트리거로 포커스를 되돌린다**. 포커스가 문서 맨 앞으로 튀지 않게 하는 것이 이 키의 핵심이다` |
| focus-visible | 필수 |
| `aria-haspopup` | 트리거에 'menu' — 이 버튼이 메뉴를 연다는 사실을 미리 알린다 |
| `aria-expanded` | 트리거 — 팝업이 열려 있으면 true |
| `aria-controls` | 트리거 — 열려 있을 때만 팝업의 id 를 가리킨다. 닫혀 있으면 그 id 를 가진 요소가 없으므로 속성 자체를 내린다 |
| `aria-label` | 트리거와 팝업(role=menu) 양쪽에 label prop |
| `role-menuitem` | 각 명령은 role=menuitem 인 <button>. 감싸는 <li> 는 role=none 으로 목록 시맨틱을 걷어낸다 — menu 의 자식은 menuitem 이어야 한다 |
| `aria-disabled` | 잠긴 항목 — native disabled 와 함께 준다. 지우지 않고 잠그므로 스크린 리더가 **읽되 선택할 수 없음**을 알린다 |
| `aria-describedby` | disabledReason 이 있는 항목 — 그 이유 문구의 id 를 가리킨다. 잠긴 버튼만 있으면 왜인지 알 길이 없다 |
| `no-focus-trap` | 포커스를 가두지 않는다 — 메뉴는 모달이 아니다. Tab 은 팝업을 닫고 문서를 계속 흐른다 |
| `focus-return` | Escape 로 닫을 때만 트리거로 포커스를 되돌린다. 명령 실행(onSelect)으로 닫힐 때는 되돌리지 않는다 — 명령이 다이얼로그를 열면 포커스를 빼앗게 된다 |
| 최소 대비 | 4.5:1 |

## Tokens

| 시각 속성 | 토큰 경로 | CSS 변수 |
|---|---|---|
| `triggerSize` | `space.7` | `--tds-space-7` |
| `triggerText` | `color.text.muted` | `--tds-color-text-muted` |
| `triggerRadius` | `radius.md` | `--tds-radius-md` |
| `surface` | `color.surface.default` | `--tds-color-surface-default` |
| `border` | `color.border.default` | `--tds-color-border-default` |
| `borderWidth` | `border-width.thin` | `--tds-border-width-thin` |
| `radius` | `radius.md` | `--tds-radius-md` |
| `shadow` | `shadow.overlay` | `--tds-shadow-overlay` |
| `offset` | `space.1` | `--tds-space-1` |
| `padY` | `space.1` | `--tds-space-1` |
| `itemPadY` | `space.2` | `--tds-space-2` |
| `itemPadX` | `space.3` | `--tds-space-3` |
| `itemRadius` | `radius.sm` | `--tds-radius-sm` |
| `itemText` | `color.text.default` | `--tds-color-text-default` |
| `itemTextDisabled` | `color.text.disabled` | `--tds-color-text-disabled` |
| `itemTextDanger` | `color.feedback.danger.text` | `--tds-color-feedback-danger-text` |
| `itemHoverBackground` | `color.surface.raised` | `--tds-color-surface-raised` |
| `typography` | `typography.label.md` | `--tds-typography-label-md` |
| `reasonText` | `color.text.muted` | `--tds-color-text-muted` |
| `reasonTypography` | `typography.caption.md` | `--tds-typography-caption-md` |
| `minWidth` | `space.10` | `--tds-space-10` |
| `focusRing` | `color.border.focus` | `--tds-color-border-focus` |
| `transitionDuration` | `motion.duration.fast` | `--tds-motion-duration-fast` |
| `transitionEasing` | `motion.easing.standard` | `--tds-motion-easing-standard` |

> 하드코딩 색상/치수 금지 — 시각 속성은 반드시 위 토큰만 참조합니다.

## Responsive

| 브레이크포인트 | 동작 |
|---|---|
| `sm`, `md`, `lg` | `size-fixed` |
