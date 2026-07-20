<!-- AUTO-GENERATED from contracts/Skeleton.contract.json — DO NOT EDIT (pnpm codegen) -->

# Skeleton API

> ⚠️ **자동 생성 문서** — 이 파일은 계약에서 생성됩니다. 직접 수정하지 마세요.
> 변경이 필요하면 `contracts/Skeleton.contract.json` 을 수정한 뒤 `pnpm codegen` 을 실행하세요.

로딩 자리표시 블록. 출처: apps/admin/src/shared/ui/ui.css 의 `.tds-ui-skeleton` 과 이를 소비하던 표 9곳의 로컬 SkeletonRows (AdminsTable·LogoListTable·BannersTable·FaqTable·NoticesTable·PopupsTable·LoginHistoryTable·LogTable·MembersTable). 아홉 벌 모두 `<span class="tds-ui-skeleton" aria-hidden="true" />` 한 줄을 R×C 로 반복한 것이 전부였고 시각 차이가 없었다 — 즉 반복 구조가 아니라 **블록 한 장**이 DS 의 단위다.

비대화형 장식이며 AT 에 노출되지 않는다 (`aria-hidden`). 로딩 사실을 스크린리더에 알리는 것은 이 컴포넌트가 아니라 이것을 담은 영역의 `aria-busy` 가 할 일이다 — 스켈레톤이 수십 장 렌더되는 표에서 장마다 알림을 내면 낭독이 무너진다.

[반복은 왜 계약에 없나] 표의 R×C 배치는 `<tr>`/`<td>` 구조와 그 표의 컬럼 수에 묶여 있어 DS 가 소유할 수 없다. 호출부가 자기 표의 구조로 반복하고, 그 안의 칸 하나를 이 계약이 채운다.

## 개요

| 항목 | 값 |
|---|---|
| 버전 | `1.0.0` |
| 레벨 | `atom` |
| 카테고리 | `Feedback` |
| 상태 | `beta` |
| 소유 | code `component-eng` · design `ui-design` · figma `figma-eng` |

## Props

| 이름 | 타입 | 기본값 | 필수 | Figma Property | 설명 |
|---|---|---|---|---|---|
| `shape` | `'line'` \| `'circle'` \| `'block'` | `"line"` | — | `Shape` | 자리표시 형태. line = 텍스트 한 줄 높이의 가로 막대(승계한 `.tds-ui-skeleton` 의 형태이며 표 9곳이 쓰던 유일한 형태), circle = 아바타/아이콘 자리의 정원, block = 카드/썸네일 자리의 큰 사각. line/block 은 컨테이너 폭을 채우고 circle 만 정사각 고정이다 |
| `isAnimated` | `boolean` | `true` | — | `Animated` | 맥동(pulse) 애니메이션 여부. false 면 정지한 회색 블록이 된다. 기본이 true 인 이유는 '멈춘 화면' 과 '기다리는 중' 을 구분해 주기 때문이다. `prefers-reduced-motion: reduce` 에서는 이 값과 무관하게 CSS 가 애니메이션을 끄므로, false 는 그 접근성 처리의 대체물이 아니라 정적 스냅샷(VRT·인쇄)용 옵트아웃이다 |

## Events

_계약에 정의된 이벤트가 없습니다._

## States

`default`

> Story 커버리지는 enum prop 값 곱 × boolean prop 당 2 조합 100%가 요구됩니다 (`combinationMatrix` 참조).
> states 는 이 행렬에 포함되지 않습니다 — state 커버리지는 커버리지 축2(contract-states)가 **단언을 가진 테스트**로 따로 강제합니다.

## A11y

| 항목 | 값 |
|---|---|
| role | `none` |
| 키보드 | `none — 비대화형 장식. 포커스 순서에 들어가지 않는다` |
| focus-visible | 해당 없음 |
| `aria-hidden` | 항상 true. 스켈레톤은 내용이 아니라 내용의 부재를 그린 것이라 낭독할 것이 없다 |
| `busy-belongs-to-container` | 로딩 사실은 스켈레톤을 담은 영역(표·카드 리스트)이 `aria-busy="true"` 로 알린다. 블록 하나하나가 알리면 표 한 장에서 수십 번 낭독된다 |

## Tokens

| 시각 속성 | 토큰 경로 | CSS 변수 |
|---|---|---|
| `surface` | `color.surface.skeleton` | `--tds-color-surface-skeleton` |
| `radius` | `radius.sm` | `--tds-radius-sm` |
| `lineHeight` | `space.4` | `--tds-space-4` |
| `circleSize` | `space.5` | `--tds-space-5` |
| `blockHeight` | `space.10` | `--tds-space-10` |
| `duration` | `motion.duration.slow` | `--tds-motion-duration-slow` |

> 하드코딩 색상/치수 금지 — 시각 속성은 반드시 위 토큰만 참조합니다.

## Responsive

| 브레이크포인트 | 동작 |
|---|---|
| `sm`, `md`, `lg` | `fluid` |
