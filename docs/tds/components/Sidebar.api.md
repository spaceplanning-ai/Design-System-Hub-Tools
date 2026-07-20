<!-- AUTO-GENERATED from contracts/Sidebar.contract.json — DO NOT EDIT (pnpm codegen) -->

# Sidebar API

> ⚠️ **자동 생성 문서** — 이 파일은 계약에서 생성됩니다. 직접 수정하지 마세요.
> 변경이 필요하면 `contracts/Sidebar.contract.json` 을 수정한 뒤 `pnpm codegen` 을 실행하세요.

사이드바 — 브랜드 영역과 주 내비게이션(role=navigation)을 담는 좌측 고정 세로 껍데기다. 섹션 제목 아래에 최상위 항목이 오고, 항목은 **잎(링크)** 이거나 **가지(펼치면 하위 링크가 나오는 버튼)** 둘 중 하나다.

[승격 근거] 실물이 apps/admin/src/shared/layout/AppShell.tsx 에 약 460줄로 있었고 어떤 계약·스토리·Figma 에도 없었다. 2026-07-20 B단 감사가 스캔 대상을 shared/ui/ · components/ · _shared/ 로 잡아 shared/layout/ 을 통째로 빠뜨린 것이 원인이다(docs/audit/cycle-2026-07-20-report.md §5 '감사가 AppShell 을 놓쳤다'). 분류표 Navigation/sidebar 행은 그동안 component: null 이었다.

[무엇이 DS 이고 무엇이 앱인가 — 이 계약의 가장 중요한 판단] 어드민 사이드바는 네 가지를 한 파일에서 하고 있었다: (1) 껍데기와 행의 시각·상호작용, (2) 내비게이션 트리 데이터, (3) 경로 → 활성 항목 판정(findCoveringLeaf), (4) 권한에 따른 항목 가시성. **DS 는 (1)만 가진다.** (2)(3)(4)는 전부 도메인 지식이다 — 라우트가 무엇인지, 어느 잎이 지금 켜져야 하는지, 어떤 역할이 무엇을 볼 수 있는지는 이 앱에만 있는 사실이고, DS 가 그것을 배우면 다른 앱에서 쓸 수 없는 컴포넌트가 된다. 그래서 sections 는 이미 걸러진 데이터로 들어오고, 지금 켜져야 할 잎은 activeHref 로 **계산 결과만** 들어오며, 펼친 가지도 openId 로 주입된다. DS 는 판정하지 않고 그린다.

[왜 openId 를 스스로 갖지 않나 — 제어 컴포넌트] '한 번에 하나만 펼친다' 와 '화면을 옮기면 그 화면이 속한 가지가 열려 있다' 는 둘 다 **경로를 아는 쪽만** 강제할 수 있는 규칙이다. DS 가 자기 상태를 들면 앱이 라우트 이동에 맞춰 되돌릴 수 없다. onToggle 로 의사만 올리고 openId 로 결과를 받는다.

[왜 react-router 를 쓰지 않고 <a href> 인가] DS 는 라우터를 의존하지 않는다. 대신 진짜 href 를 그려 접근성·가운데클릭·새 탭 열기를 살리고, 수식키 없는 왼쪽 클릭에서만 preventDefault 후 onNavigate(href) 를 올린다. onNavigate 를 주지 않으면 preventDefault 도 하지 않는다 — 그때는 평범한 링크로 동작하는 것이 옳다. 이 규칙 덕에 앱은 useNavigate 한 줄로 SPA 이동을 잇고, DS 는 라우터가 없는 곳(Storybook·Figma 문서)에서도 그대로 렌더된다.

[활성 표시는 aria-current 로 함께 낸다] 시각 표시(왼쪽 마커 + 색)만 바꾸고 aria-current 를 빠뜨리면 스크린리더 사용자에게는 아무것도 고쳐지지 않는다. activeHref 와 같은 href 를 가진 링크가 aria-current="page" 를 단다 — 잎이든 하위 링크든 같은 규칙이다.

[접기(collapse) 축을 만들지 않았다] 폭을 줄이는 아이콘 전용 모드는 어드민에 존재하지 않고 요구한 호출부도 없다. 없는 상호작용을 계약에 넣으면 검증되지 않은 축이 Storybook 조합 행렬만 두 배로 만든다 — Skeleton·Spinner 승격에서 지킨 '실물이 있는 것만 올린다' 규율을 여기서도 지킨다.

## 개요

| 항목 | 값 |
|---|---|
| 버전 | `1.0.0` |
| 레벨 | `organism` |
| 카테고리 | `Navigation` |
| 상태 | `beta` |
| 소유 | code `component-eng` · design `ui-design` · figma `figma-eng` |
| 의존 컴포넌트 | `Icon` |

## Props

| 이름 | 타입 | 기본값 | 필수 | Figma Property | 설명 |
|---|---|---|---|---|---|
| `label` | `string` | — | ✅ | — | 주 내비게이션 랜드마크의 접근 가능한 이름 — <nav aria-label> 에 그대로 들어간다. 한 화면에 내비게이션이 둘 이상이면 이름으로 갈린다(WAI-ARIA landmark 규약). 어드민은 '주 내비게이션' 을 쓴다 |
| `sections` | `array` | — | ✅ | — | 섹션 목록. 데이터 prop — Figma Component Property 대응 없음 (ADR-0003). 항목은 href 를 가지면 잎(링크), children 을 가지면 가지(펼침 버튼)다. icon 은 ReactNode 라 DS 가 아이콘 집합을 알 필요가 없다 — 앱이 자기 아이콘을 넣는다. **권한으로 걸러진 뒤의 목록**이 들어온다: 빈 섹션을 감추는 것도 항목을 지우는 것도 DS 의 일이 아니다 |
| `activeHref` | `string` | `""` | — | — | 지금 켜져야 할 링크의 href. 빈 문자열이면 아무것도 켜지 않는다. **판정은 앱이 한다** — 어드민은 '세그먼트 경계 기준 최장 일치'(nav-config 의 findCoveringLeaf)를 쓰고 헤더 <h1> 도 같은 답을 쓴다. DS 가 두 번째 판정 규칙을 발명하면 헤더와 사이드바가 서로 다른 곳을 가리키게 된다 |
| `openId` | `string` | `""` | — | — | 펼쳐진 가지의 id. 빈 문자열이면 전부 접힌다. 제어 prop 이다 — '한 번에 하나만' 도 '경로가 바뀌면 그 가지를 연다' 도 경로를 아는 쪽만 강제할 수 있어 DS 가 자기 상태로 들지 않는다 |
| `brand` | ReactNode | `null` | — | — | 상단 브랜드 영역 슬롯 — 로고·워드마크가 들어온다. DS 가 특정 회사의 로고를 담지 않으므로 슬롯이다(분류표 Foundation/logos 를 이 계약이 채우지 않는 이유). 높이는 Header 와 같은 값으로 고정돼 두 영역의 아래 구분선이 한 줄로 이어진다 |

## Events

| 이름 | Payload | 발화 차단 상태 | 설명 |
|---|---|---|---|
| `onNavigate` | `string` | — | 링크가 활성화되면 그 href 를 전달한다. **수식키(Ctrl/Cmd/Shift/Alt) 없는 왼쪽 클릭에서만** 발화하며 그때만 preventDefault 한다 — 새 탭 열기·가운데 클릭은 브라우저에 그대로 넘긴다. 이 콜백을 주지 않으면 preventDefault 도 하지 않아 평범한 링크로 동작한다 |
| `onToggle` | `string` | — | 가지의 펼침 버튼이 눌리면 그 가지의 id 를 전달한다. 열지 닫을지는 DS 가 정하지 않는다 — 호출부가 openId 를 다음 값으로 정해서 되돌려준다 |

## States

`default` · `hover` · `focus-visible` · `open` · `selected`

> Story 커버리지는 enum prop 값 곱 × boolean prop 당 2 조합 100%가 요구됩니다 (`combinationMatrix` 참조).
> states 는 이 행렬에 포함되지 않습니다 — state 커버리지는 커버리지 축2(contract-states)가 **단언을 가진 테스트**로 따로 강제합니다.

## A11y

| 항목 | 값 |
|---|---|
| role | `navigation` |
| 키보드 | `Tab — 브랜드 슬롯의 포커스 가능 요소 → 각 링크/펼침 버튼 순으로 문서 순서 그대로 흐른다. 포커스를 가두지 않는다(사이드바는 모달이 아니다)`, `Enter — 링크를 활성화한다(native <a>). 펼침 버튼에서는 그 가지를 토글한다`, `Space — 펼침 버튼에서 그 가지를 토글한다(native <button>). 링크에서는 브라우저 기본 동작(스크롤)을 막지 않는다`, `접힌 가지의 하위 링크는 DOM 에 없다 — 보이지 않는 것이 탭 순서에 남아 있으면 키보드 사용자가 허공을 지난다` |
| focus-visible | 필수 |
| `aria-label` | <nav> 에 label prop — 랜드마크가 여럿일 때 이름으로 갈린다 |
| `aria-current` | activeHref 와 같은 href 를 가진 링크에 'page'. 시각 표시만 고치고 이걸 빠뜨리면 스크린리더 사용자에겐 하나도 고쳐지지 않는다 |
| `aria-expanded` | 가지의 펼침 버튼 — openId 와 같으면 true |
| `aria-controls` | 가지의 펼침 버튼이 자기 하위 목록의 id 를 가리킨다. 접혀 있을 때는 그 id 를 가진 요소가 없으므로 속성 자체를 내린다 |
| `landmark-complementary` | 바깥 <aside> 는 complementary 랜드마크다. 그 안의 <nav> 가 navigation 랜드마크이며 이 계약의 role 은 후자다 — 사이드바의 존재 이유는 보조 영역이 아니라 이동이다 |
| `section-heading` | 섹션 제목은 <h2> 다. 목록 자체는 <ul>/<li> 라 스크린리더가 항목 수를 읽는다 |
| 최소 대비 | 4.5:1 |

## Tokens

| 시각 속성 | 토큰 경로 | CSS 변수 |
|---|---|---|
| `surface` | `color.surface.default` | `--tds-color-surface-default` |
| `border` | `color.border.default` | `--tds-color-border-default` |
| `borderWidth` | `border-width.thin` | `--tds-border-width-thin` |
| `widthUnit` | `space.6` | `--tds-space-6` |
| `brandHeightUnit` | `space.6` | `--tds-space-6` |
| `brandPadX` | `space.5` | `--tds-space-5` |
| `brandGap` | `space.3` | `--tds-space-3` |
| `navPadX` | `space.3` | `--tds-space-3` |
| `navPadY` | `space.4` | `--tds-space-4` |
| `sectionTitlePadX` | `space.3` | `--tds-space-3` |
| `sectionTitlePadY` | `space.2` | `--tds-space-2` |
| `sectionTitleText` | `color.text.muted` | `--tds-color-text-muted` |
| `sectionTitleFontSize` | `primitive.typography.font-size.12` | `--tds-primitive-typography-font-size-12` |
| `itemGap` | `space.1` | `--tds-space-1` |
| `itemInnerGap` | `space.3` | `--tds-space-3` |
| `itemPadX` | `space.3` | `--tds-space-3` |
| `itemPadY` | `space.3` | `--tds-space-3` |
| `itemText` | `color.text.default` | `--tds-color-text-default` |
| `itemTypography` | `typography.label.md` | `--tds-typography-label-md` |
| `itemActiveText` | `color.action.primary.default` | `--tds-color-action-primary-default` |
| `itemMarkerWidth` | `border-width.medium` | `--tds-border-width-medium` |
| `itemHoverBackground` | `color.surface.raised` | `--tds-color-surface-raised` |
| `subItemPadY` | `space.2` | `--tds-space-2` |
| `subItemIndent` | `space.6` | `--tds-space-6` |
| `subItemText` | `color.text.muted` | `--tds-color-text-muted` |
| `subItemTypography` | `typography.label.md` | `--tds-typography-label-md` |
| `chevronText` | `color.text.muted` | `--tds-color-text-muted` |
| `focusRing` | `color.border.focus` | `--tds-color-border-focus` |
| `transitionDuration` | `motion.duration.fast` | `--tds-motion-duration-fast` |
| `transitionEasing` | `motion.easing.standard` | `--tds-motion-easing-standard` |

> 하드코딩 색상/치수 금지 — 시각 속성은 반드시 위 토큰만 참조합니다.

## Responsive

| 브레이크포인트 | 동작 |
|---|---|
| `sm`, `md`, `lg` | `size-fixed` |
