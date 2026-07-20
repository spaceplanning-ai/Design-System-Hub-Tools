<!-- AUTO-GENERATED from contracts/Stepper.contract.json — DO NOT EDIT (pnpm codegen) -->

# Stepper API

> ⚠️ **자동 생성 문서** — 이 파일은 계약에서 생성됩니다. 직접 수정하지 마세요.
> 변경이 필요하면 `contracts/Stepper.contract.json` 을 수정한 뒤 `pnpm codegen` 을 실행하세요.

진행 단계 표시기 — 정해진 흐름의 단계를 번호 점과 라벨로 늘어놓고 현재 단계까지 채운다. 비대화형이다: 단계를 누를 수 없고 흐름을 바꾸지도 않는다. 흐름을 '보여 주기만' 한다.

[숫자 입력 스텝퍼가 아니다] 분류표에는 stepper 항목이 두 곳에 있다 — Inputs(2번, number-input·slider·range-slider 옆)와 Navigation(4번, breadcrumb·pagination·tabs 옆). 이 계약은 **후자**다. 값을 증감시키는 +/- 컨트롤이 아니라 진행 상태를 읽히는 표시기이며, 그래서 category 가 Navigation 이다. Inputs 쪽 stepper 는 여전히 미구현으로 남는다.

[승격 근거] 어드민에 94줄짜리 구현이 둘 있었고 diff 는 14줄, 그 14줄이 전부 도메인 명칭이었다 — apps/admin/src/pages/products/returns/components/ReturnStatusStepper.tsx(접수→수거중→검수중→완료)와 apps/admin/src/pages/sales/projects/components/PipelineStepper.tsx(리드→상담→제안→협상→수주). 스타일 60줄은 바이트 단위로 같았다. 두 파일 모두 머리말에 '한 곳만 쓰므로 페이지 전용' 이라 적었으나 **서로의 존재를 몰랐다.**

[흐름 밖 종료는 담지 않는다] 반려·실주처럼 흐름을 벗어나 끝난 상태는 이 컴포넌트가 그리지 않는다. 단계 목록에 없는 값이 오면 아무 단계도 채우지 않고(currentIndex = -1) 흐름만 보여 준다 — 호출부가 danger 배너/배지로 따로 알린다. 두 출처 구현이 이미 그렇게 갈라 두었고 그 판단을 그대로 옮긴다.

[states 이름이 도메인 말과 다른 이유] 스키마의 states enum 은 고정 목록이라 '완료/현재/미도달' 을 그대로 적을 수 없다. 매핑은 default = 미도달(upcoming) · checked = 완료(done, 현재 단계까지 채워진 칸) · selected = 현재 단계(current, 테두리가 굵어지고 라벨이 bold 가 된다) 이다.

[번호는 장식이다] 점 안의 번호와 연결선은 aria-hidden 이다. 스크린 리더에는 라벨만 읽히고 순서는 <ol> 이 전달한다 — 번호를 읽히면 '1 접수 2 수거중' 처럼 라벨마다 숫자가 덧붙어 목록이 두 배로 길어진다.

## 개요

| 항목 | 값 |
|---|---|
| 버전 | `1.0.0` |
| 레벨 | `molecule` |
| 카테고리 | `Navigation` |
| 상태 | `beta` |
| 소유 | code `component-eng` · design `ui-design` · figma `figma-eng` |

## Props

| 이름 | 타입 | 기본값 | 필수 | Figma Property | 설명 |
|---|---|---|---|---|---|
| `steps` | `array` | — | ✅ | — | 흐름의 단계 목록. 순서가 곧 흐름이다. 데이터 prop — Figma Component Property 대응 없음 (ADR-0003). 도메인 상태→라벨 변환은 호출부가 소유한다(statusLabel/stageLabel) |
| `current` | `string` | — | ✅ | — | 현재 단계의 id. steps[].id 중 하나면 그 단계까지 채워지고, 목록에 없는 값(흐름 밖 종료 — 반려·실주)이면 아무 단계도 채우지 않는다 |
| `ariaLabel` | `string` | — | ✅ | — | 단계 목록의 접근 가능한 이름 (예: '처리 진행 단계', '파이프라인 단계') |

## Events

_계약에 정의된 이벤트가 없습니다._

## States

`default` · `checked` · `selected`

> Story 커버리지는 enum prop 값 곱 × boolean prop 당 2 조합 100%가 요구됩니다 (`combinationMatrix` 참조).
> states 는 이 행렬에 포함되지 않습니다 — state 커버리지는 커버리지 축2(contract-states)가 **단언을 가진 테스트**로 따로 강제합니다.

## A11y

| 항목 | 값 |
|---|---|
| role | `list` |
| 키보드 | `none — 비대화형이다. 단계는 버튼이 아니라 텍스트라 포커스 순서에 들어가지 않는다. 흐름을 바꾸는 조작은 이 컴포넌트 밖(상태 변경 폼)에 있다` |
| focus-visible | 해당 없음 |
| `aria-label` | ariaLabel prop — <ol> 의 이름 |
| `aria-current` | 현재 단계의 <li> 에 'step'. 스크린 리더가 목록 어디까지 왔는지 말할 수 있는 유일한 신호다 — 색과 굵기는 시각 채널뿐이라 이것이 없으면 진행 상태가 비시각 사용자에게 전달되지 않는다 |
| `ordered-list` | <ol> 이 순서를 전달한다 — 그래서 점 안의 번호를 따로 읽힐 필요가 없다 |
| `decoration-hidden` | 번호 점과 연결선은 aria-hidden — 라벨만 읽힌다 |
| `color-not-alone` | 완료/현재를 색으로만 구분하지 않는다 (WCAG 1.4.1) — aria-current 와 굵기가 함께 신호한다 |
| 최소 대비 | 4.5:1 |

## Tokens

| 시각 속성 | 토큰 경로 | CSS 변수 |
|---|---|---|
| `dotSize` | `space.5` | `--tds-space-5` |
| `dotSurface` | `color.surface.default` | `--tds-color-surface-default` |
| `dotSurfaceDone` | `color.action.primary.default` | `--tds-color-action-primary-default` |
| `dotBorder` | `color.border.default` | `--tds-color-border-default` |
| `dotBorderDone` | `color.action.primary.default` | `--tds-color-action-primary-default` |
| `dotBorderWidth` | `border-width.thin` | `--tds-border-width-thin` |
| `dotBorderWidthCurrent` | `border-width.medium` | `--tds-border-width-medium` |
| `dotText` | `color.text.muted` | `--tds-color-text-muted` |
| `dotTextDone` | `color.surface.default` | `--tds-color-surface-default` |
| `dotTypography` | `typography.caption.md` | `--tds-typography-caption-md` |
| `label` | `color.text.muted` | `--tds-color-text-muted` |
| `labelDone` | `color.text.default` | `--tds-color-text-default` |
| `labelTypography` | `typography.label.sm` | `--tds-typography-label-sm` |
| `labelWeightCurrent` | `primitive.typography.font-weight.bold` | `--tds-primitive-typography-font-weight-bold` |
| `labelWeight` | `primitive.typography.font-weight.regular` | `--tds-primitive-typography-font-weight-regular` |
| `connector` | `color.border.default` | `--tds-color-border-default` |
| `connectorLength` | `space.5` | `--tds-space-5` |
| `connectorThickness` | `border-width.thin` | `--tds-border-width-thin` |
| `gap` | `space.1` | `--tds-space-1` |

> 하드코딩 색상/치수 금지 — 시각 속성은 반드시 위 토큰만 참조합니다.

## Responsive

| 브레이크포인트 | 동작 |
|---|---|
| `sm`, `md`, `lg` | `fluid` |
