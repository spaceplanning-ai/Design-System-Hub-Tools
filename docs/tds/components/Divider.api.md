<!-- AUTO-GENERATED from contracts/Divider.contract.json — DO NOT EDIT (pnpm codegen) -->

# Divider API

> ⚠️ **자동 생성 문서** — 이 파일은 계약에서 생성됩니다. 직접 수정하지 마세요.
> 변경이 필요하면 `contracts/Divider.contract.json` 을 수정한 뒤 `pnpm codegen` 을 실행하세요.

구획선. 출처는 두 툴바가 각자 그리던 인라인 스타일이다 — 이메일 빌더의 `toolbarDividerStyle`(apps/admin/.../email/styles.ts)과 문자·알림톡 편집기의 `dividerStyle`(.../components/EditorToolbar.tsx:35). 값(border-width.thin · color.border.subtle)은 우연히 같았으나 **마크업이 갈라져 있었다**: 후자는 `<span aria-hidden="true">`, 전자는 `<div>` 로 aria-hidden 이 없었다.

[왜 항상 aria-hidden 인가] 이 선은 아무 정보도 나르지 않는다. 스크린리더 사용자에게 '구분선' 이라는 낭독이 도움이 되는 경우는 **선이 나누는 두 덩이가 그 자체로 의미 단위일 때**뿐이고, 툴바에서 아이콘 묶음을 시각적으로 띄우는 이 선은 그 경우가 아니다. 그래서 장식이 옵션이 아니라 정의이며, `aria-hidden="true"` 를 항상 낸다.

정확히 말하면 aria-hidden 없는 빈 `<div>` 가 '구분선으로 낭독' 되지는 않는다 — role 이 없으므로 generic 이다. 그래도 접근성 트리에 generic 노드로 남고, 순회 도구·일부 AT 의 요소 목록에 잡힌다. 없는 편이 옳으며, 두 벌 중 명시적인 쪽을 정본으로 삼는다.

[의미 있는 구분선(role="separator")은 일부러 담지 않았다] `role="separator"` 는 실재하는 필요이지만(예: 메뉴 항목 그룹 사이) 이 리포에 그 호출부가 지금 0건이다. 쓰지 않는 축을 계약에 넣으면 Figma 변형과 Story 조합만 늘고 검증되지 않는 표면이 생긴다 — 분류표 `loading` 키를 비워 둔 것과 같은 판단이다. 필요해지면 MINOR 로 `isDecorative` 를 추가한다.

[두께를 border 가 아니라 크기로 그린다] 세로선을 `border-inline-start` 로 그리면 부모의 정렬·간격 계산에서 폭이 0인 요소가 되어 gap 이 어긋난다. 두께만큼의 inline-size(세로) 또는 block-size(가로)를 갖는 실제 상자로 그리고 배경색으로 칠한다 — 두 수제 구현이 모두 이 방식이었다.

## 개요

| 항목 | 값 |
|---|---|
| 버전 | `1.0.0` |
| 레벨 | `atom` |
| 카테고리 | `Data Display` |
| 상태 | `beta` |
| 소유 | code `component-eng` · design `ui-design` · figma `figma-eng` |

## Props

| 이름 | 타입 | 기본값 | 필수 | Figma Property | 설명 |
|---|---|---|---|---|---|
| `orientation` | `'horizontal'` \| `'vertical'` | `"horizontal"` | — | `Orientation` | 선의 방향. `horizontal`(기본)은 부모 폭을 채우는 가로선이고, `vertical` 은 부모 높이에 맞춰(`align-self: stretch`) 늘어나는 세로선이다 — 툴바가 쓰는 쪽이 후자다. 논리 속성(inline-size/block-size)으로 그리므로 RTL 에서 따로 뒤집을 것이 없다 |

## Events

_계약에 정의된 이벤트가 없습니다._

## States

`default`

> Story 커버리지는 enum prop 값 곱 × boolean prop 당 2 조합 100%가 요구됩니다 (`combinationMatrix` 참조).
> states 는 이 행렬에 포함되지 않습니다 — state 커버리지는 커버리지 축2(contract-states)가 **단언을 가진 테스트**로 따로 강제합니다.

## A11y

| 항목 | 값 |
|---|---|
| role | `none — 순수 장식이다. 항상 aria-hidden="true" 이므로 접근성 트리에 어떤 role 로도 나타나지 않는다. 의미 있는 구분(role="separator")이 필요한 자리는 이 컴포넌트의 대상이 아니다 (description 참조)` |
| 키보드 | `none — 비대화형. 포커스 순서에 들어가지 않는다` |
| focus-visible | 해당 없음 |
| `aria-hidden` | 항상 true. prop 으로 끌 수 없다 — 장식임이 이 컴포넌트의 정의이기 때문이다 |

## Tokens

| 시각 속성 | 토큰 경로 | CSS 변수 |
|---|---|---|
| `color` | `color.border.subtle` | `--tds-color-border-subtle` |
| `thickness` | `border-width.thin` | `--tds-border-width-thin` |

> 하드코딩 색상/치수 금지 — 시각 속성은 반드시 위 토큰만 참조합니다.

## Responsive

| 브레이크포인트 | 동작 |
|---|---|
| `sm`, `md`, `lg` | `fluid` |
