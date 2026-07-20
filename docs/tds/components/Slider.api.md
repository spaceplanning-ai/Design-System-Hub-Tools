<!-- AUTO-GENERATED from contracts/Slider.contract.json — DO NOT EDIT (pnpm codegen) -->

# Slider API

> ⚠️ **자동 생성 문서** — 이 파일은 계약에서 생성됩니다. 직접 수정하지 마세요.
> 변경이 필요하면 `contracts/Slider.contract.json` 을 수정한 뒤 `pnpm codegen` 을 실행하세요.

값 표시가 옆에 붙은 단일 범위 입력. 출처: apps/admin/src/pages/marketing/message-templates/email/controls/Slider.tsx (이메일 빌더의 여백 4면·글자 크기·테두리 반경·미디어 크기·구분선 높이 등 12곳). 도메인을 모른다 — 무엇을 조절하는지 알지 못하고 숫자 범위와 콜백·접근성 라벨·단위 문구만 받는다.

[네이티브 <input type="range"> 를 쓴다] 손으로 만든 트랙+썸은 키보드(←/→/Home/End)·터치·스크린리더 지원을 전부 다시 구현해야 한다. 네이티브가 그것을 공짜로 준다 — accent-color 로 트랙 색만 토큰에 맞춘다. 그래서 이 컴포넌트의 a11y 표면(role=slider · aria-valuemin/max/now)은 브라우저가 소유한다.

[값 표시는 장식이다] 옆에 붙는 숫자 span 은 aria-hidden 이다 — 같은 값을 네이티브가 이미 aria-valuenow 로 알린다. 자릿수가 바뀌어도 트랙이 흔들리지 않게 tabular-nums + space.8 고정 폭을 준다.

## 개요

| 항목 | 값 |
|---|---|
| 버전 | `1.0.0` |
| 레벨 | `atom` |
| 카테고리 | `Inputs` |
| 상태 | `beta` |
| 소유 | code `component-eng` · design `ui-design` · figma `figma-eng` |

## Props

| 이름 | 타입 | 기본값 | 필수 | Figma Property | 설명 |
|---|---|---|---|---|---|
| `value` | `number` | — | ✅ | — | 현재 값. 제어 값이며 onChange 로만 바뀐다 |
| `min` | `number` | — | ✅ | — | 허용 최솟값 — 네이티브가 aria-valuemin 으로 노출한다 |
| `max` | `number` | — | ✅ | — | 허용 최댓값 — 네이티브가 aria-valuemax 로 노출한다 |
| `step` | `number` | `1` | — | — | 증감 단위. 화살표 키 한 번이 움직이는 크기이기도 하다 |
| `label` | `string` | — | ✅ | — | 스크린 리더용 이름(aria-label) — 보이는 <label> 이 없는 자리(패널 상자 안)에서 무엇을 조절하는지 알린다('Padding top' 등) |
| `unit` | `string` | `""` | — | — | 값 옆에 붙는 단위 표기('px' 등). 비우면 숫자만 보인다. 값 표시는 aria-hidden 장식이므로 이 문구가 접근 가능한 이름을 오염시키지 않는다 |
| `id` | `string` | `""` | — | — | range 입력의 DOM id — 한 화면에 슬라이더가 여럿일 때 호출부가 유니크 id 를 주입한다. 비우면 id 속성을 렌더하지 않는다 |
| `disabled` | `boolean` | `false` | — | `Disabled` | 비활성 — 잠그고 흐리게 표시한다. onChange 발화 없음 |

## Events

| 이름 | Payload | 발화 차단 상태 | 설명 |
|---|---|---|---|
| `onChange` | `number` | `disabled` | 새 값(정수)을 인자로 발화한다. disabled 에서는 발화 금지 — <input disabled> 가 네이티브로 막는다 (Storybook Play Function 이 전수 검증) |

## States

`default` · `hover` · `focus-visible` · `disabled`

> Story 커버리지는 enum prop 값 곱 × boolean prop 당 2 조합 100%가 요구됩니다 (`combinationMatrix` 참조).
> states 는 이 행렬에 포함되지 않습니다 — state 커버리지는 커버리지 축2(contract-states)가 **단언을 가진 테스트**로 따로 강제합니다.

## A11y

| 항목 | 값 |
|---|---|
| role | `slider` |
| 키보드 | `Tab`, `ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`, `Home`, `End` |
| focus-visible | 필수 |
| `label` | 보이는 라벨이 없으므로 label prop 을 aria-label 로 준다 |
| `aria-valuenow` | 네이티브 <input type=range> 가 value 로부터 스스로 노출한다 — 옆의 숫자 span 은 aria-hidden 장식이라 중복 통지가 없다 |
| `locking` | disabled 이면 <input disabled> 로 잠근다 — onChange 발화가 네이티브로 차단된다 |
| 최소 대비 | 4.5:1 |

## Tokens

| 시각 속성 | 토큰 경로 | CSS 변수 |
|---|---|---|
| `gap` | `space.3` | `--tds-space-3` |
| `trackAccent` | `color.action.primary.default` | `--tds-color-action-primary-default` |
| `valueMinWidth` | `space.8` | `--tds-space-8` |
| `valueText` | `color.text.default` | `--tds-color-text-default` |
| `valueTextDisabled` | `color.text.disabled` | `--tds-color-text-disabled` |
| `typography` | `typography.label.sm` | `--tds-typography-label-sm` |
| `focusRing` | `color.border.focus` | `--tds-color-border-focus` |
| `focusRingWidth` | `border-width.medium` | `--tds-border-width-medium` |
| `focusRingOffset` | `space.1` | `--tds-space-1` |
| `focusRingRadius` | `radius.sm` | `--tds-radius-sm` |

> 하드코딩 색상/치수 금지 — 시각 속성은 반드시 위 토큰만 참조합니다.

## Responsive

| 브레이크포인트 | 동작 |
|---|---|
| `sm`, `md`, `lg` | `fluid` |
