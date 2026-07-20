<!-- AUTO-GENERATED from contracts/Icon.contract.json — DO NOT EDIT (pnpm codegen) -->

# Icon API

> ⚠️ **자동 생성 문서** — 이 파일은 계약에서 생성됩니다. 직접 수정하지 마세요.
> 변경이 필요하면 `contracts/Icon.contract.json` 을 수정한 뒤 `pnpm codegen` 을 실행하세요.

단색 선 아이콘 — 24 그리드 stroke 아이콘 59종을 name 으로 고른다. 모양의 정본은 packages/ui 의 Icon 구현과 apps/admin 의 인라인 SVG 아이콘이며, codegen 이 거기서 SVG 를 추출해 Figma 에서 진짜 벡터 노드로 만든다 — 사본을 손으로 유지하지 않는다. 색은 currentColor 로 부모를 따르고, 크기만 토큰으로 고정한다. 비대화형 표시 전용 — 클릭 이벤트를 갖지 않으며 버튼이 필요하면 Button 안에 넣는다.

## 개요

| 항목 | 값 |
|---|---|
| 버전 | `1.0.0` |
| 레벨 | `atom` |
| 카테고리 | `Media` |
| 상태 | `beta` |
| 소유 | code `component-eng` · design `ui-design` · figma `figma-eng` |

## Props

| 이름 | 타입 | 기본값 | 필수 | Figma Property | 설명 |
|---|---|---|---|---|---|
| `name` | `'align-bottom'` \| `'align-center'` \| `'align-left'` \| `'align-middle'` \| `'align-right'` \| `'align-top'` \| `'arrow-left'` \| `'avatar'` \| `'bar-chart'` \| `'bell'` \| `'box'` \| `'briefcase'` \| `'building'` \| `'button'` \| `'chevron-down'` \| `'chevron-left'` \| `'chevron-right'` \| `'close'` \| `'collapse-left'` \| `'collapse-right'` \| `'columns'` \| `'desktop'` \| `'divider'` \| `'download'` \| `'eye'` \| `'file-text'` \| `'footer'` \| `'heading'` \| `'headset'` \| `'image'` \| `'layout-grid'` \| `'list'` \| `'lock'` \| `'logo'` \| `'megaphone'` \| `'menu'` \| `'mic'` \| `'mobile'` \| `'more-horizontal'` \| `'pencil'` \| `'plus'` \| `'plus-circle'` \| `'redo'` \| `'scroll-text'` \| `'search'` \| `'send'` \| `'settings'` \| `'shopping-bag'` \| `'social'` \| `'spacer'` \| `'sparkle'` \| `'sparkles'` \| `'text'` \| `'trash'` \| `'undo'` \| `'upload'` \| `'users'` \| `'video'` \| `'x-circle'` | — | ✅ | `Name` | 그릴 아이콘. 값 집합은 앱·DS 의 실제 아이콘 구현에서 codegen 이 전수 추출한 것이며(손으로 적은 목록이 아니다), 구현에 아이콘이 늘면 자동으로 따라온다 |
| `size` | `'inherit'` \| `'sm'` \| `'md'` \| `'lg'` | `"inherit"` | — | `Size` | 사각 크기. inherit(기본)=1.25em 으로 부모 font-size 를 따라간다 — 아이콘은 대개 텍스트 옆에 서므로 글자와 함께 커지는 것이 기본값이다(승격 전 apps/admin 의 동작과 동일). sm=space.4 · md=space.5 · lg=space.6 은 텍스트 문맥 밖에서 크기를 고정해야 할 때 쓴다. 색은 어느 경우에도 currentColor 로 부모를 따른다 |
| `label` | `string` | `""` | — | — | 접근 가능한 이름. 비우면 장식으로 간주해 aria-hidden 처리한다(인접 텍스트가 의미를 제공하는 경우). 값을 주면 role=img 와 aria-label 이 붙는다 |

## Events

_계약에 정의된 이벤트가 없습니다._

## States

`default`

> Story 커버리지는 enum prop 값 곱 × boolean prop 당 2 조합 100%가 요구됩니다 (`combinationMatrix` 참조).
> states 는 이 행렬에 포함되지 않습니다 — state 커버리지는 커버리지 축2(contract-states)가 **단언을 가진 테스트**로 따로 강제합니다.

## A11y

| 항목 | 값 |
|---|---|
| role | `img` |
| 키보드 | `none — 비대화형. 포커스 순서에 들어가지 않는다` |
| focus-visible | 해당 없음 |
| `labelling` | label 이 비면 aria-hidden=true (장식). label 이 있으면 role=img + aria-label 로 이름을 노출한다 |
| `contrast` | 색을 스스로 정하지 않고 currentColor 를 따르므로 대비 책임은 부모 문맥에 있다 |

## Tokens

| 시각 속성 | 토큰 경로 | CSS 변수 |
|---|---|---|
| `sizeSm` | `space.4` | `--tds-space-4` |
| `sizeMd` | `space.5` | `--tds-space-5` |
| `sizeLg` | `space.6` | `--tds-space-6` |

> 하드코딩 색상/치수 금지 — 시각 속성은 반드시 위 토큰만 참조합니다.

## Responsive

| 브레이크포인트 | 동작 |
|---|---|
| `sm`, `md`, `lg` | `size-fixed` |
