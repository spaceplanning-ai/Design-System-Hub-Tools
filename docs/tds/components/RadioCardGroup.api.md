<!-- AUTO-GENERATED from contracts/RadioCardGroup.contract.json — DO NOT EDIT (pnpm codegen) -->

# RadioCardGroup API

> ⚠️ **자동 생성 문서** — 이 파일은 계약에서 생성됩니다. 직접 수정하지 마세요.
> 변경이 필요하면 `contracts/RadioCardGroup.contract.json` 을 수정한 뒤 `pnpm codegen` 을 실행하세요.

설명이 붙은 카드형 라디오 그룹 — 선택지마다 '제목 + 결과 설명' 을 함께 보여 고르기 전에 무슨 일이 일어나는지 읽히게 한다. 출처: apps/admin/src/shared/ui/RadioCardGroup.tsx (사이트 설정 공개 범위).

[왜 SelectField 가 아닌가] 선택지가 적고 **각각의 결과가 서로 크게 다를 때**(누구나 들어온다 / 관리자만 들어온다) 선택지를 접어 두면 안 된다. 결과 설명을 고르기 전에 읽을 수 있어야 한다 — 그래서 펼쳐 두고, 설명을 라벨과 같은 클릭 영역에 넣는다.

[왜 SegmentedControl 이 아닌가] 세그먼티드는 라벨 한 단어짜리 트랙이다. 여기는 각 선택지가 두 줄(제목+설명)을 갖는 카드라 트랙에 들어가지 않는다.

[a11y] role="radiogroup" + aria-labelledby 로 그룹 이름을 준다. 안의 컨트롤은 **네이티브 <input type="radio">** 다 — 같은 name 을 공유해 화살표 이동과 단일 선택을 브라우저가 공짜로 준다(aria-checked 도 네이티브가 소유한다). 설명 문단은 aria-describedby 로 각 라디오에 잇는다: <label> 이 설명까지 감싸면 접근 가능한 이름이 '전체 공개 누구나 내 사이트에 접속할 수 있어요' 한 덩어리로 읽힌다.

[도메인을 모른다] 선택지는 options 로 주입한다 (ADR-0003) — value 는 문자열이며 좁힌 유니온으로 되돌리는 일은 호출부가 옵션 목록에서 되찾아 한다(SegmentedControl 선례).

## 개요

| 항목 | 값 |
|---|---|
| 버전 | `1.0.0` |
| 레벨 | `molecule` |
| 카테고리 | `Inputs` |
| 상태 | `beta` |
| 소유 | code `component-eng` · design `ui-design` · figma `figma-eng` |

## Props

| 이름 | 타입 | 기본값 | 필수 | Figma Property | 설명 |
|---|---|---|---|---|---|
| `name` | `string` | — | ✅ | — | 라디오들이 공유하는 name — 화면에 그룹이 둘 이상이면 서로 달라야 한다(같으면 브라우저가 한 그룹으로 묶는다). 각 항목의 DOM id 와 legend id 도 여기서 파생한다 |
| `legend` | `string` | — | ✅ | — | 그룹 이름 — 눈에 보이는 제목이자 radiogroup 의 aria-labelledby 대상 |
| `value` | `string` | — | ✅ | — | 선택된 항목의 value. options[].value 중 하나여야 한다 |
| `options` | `array` | — | ✅ | — | 선택지 목록. description 은 '이 선택지를 고르면 무슨 일이 일어나는가' — 고르기 전에 읽히는 자리다. 데이터 prop 이라 Figma Component Property 대응이 없다 (ADR-0003) |
| `disabled` | `boolean` | `false` | — | `Disabled` | 그룹 전체 비활성 — 모든 라디오를 잠그고 라벨을 흐리게 표시한다. onChange 발화 없음 |

## Events

| 이름 | Payload | 발화 차단 상태 | 설명 |
|---|---|---|---|
| `onChange` | `string` | `disabled` | 선택된 항목의 value 를 발화한다. disabled 에서는 발화 금지 — <input disabled> 가 네이티브로 막는다 (Storybook Play Function 이 전수 검증) |

## States

`default` · `hover` · `focus-visible` · `disabled` · `selected`

> Story 커버리지는 enum prop 값 곱 × boolean prop 당 2 조합 100%가 요구됩니다 (`combinationMatrix` 참조).
> states 는 이 행렬에 포함되지 않습니다 — state 커버리지는 커버리지 축2(contract-states)가 **단언을 가진 테스트**로 따로 강제합니다.

## A11y

| 항목 | 값 |
|---|---|
| role | `radiogroup` |
| 키보드 | `Tab`, `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Space` |
| focus-visible | 필수 |
| `aria-labelledby` | legend 를 그린 span 의 id — radiogroup 의 이름 |
| `aria-checked` | 네이티브 <input type=radio> 가 checked 로부터 스스로 노출한다 |
| `aria-describedby` | 각 라디오는 자기 설명 문단의 id 를 describedby 로 잇는다 — 이름(label)과 설명(description)이 분리된다 |
| `locking` | disabled 이면 모든 <input disabled> — onChange 발화가 네이티브로 차단된다 |
| 최소 대비 | 4.5:1 |

## Tokens

| 시각 속성 | 토큰 경로 | CSS 변수 |
|---|---|---|
| `gap` | `space.2` | `--tds-space-2` |
| `optionGap` | `space.3` | `--tds-space-3` |
| `paddingX` | `space.4` | `--tds-space-4` |
| `paddingY` | `space.3` | `--tds-space-3` |
| `borderDefault` | `color.border.default` | `--tds-color-border-default` |
| `borderSelected` | `color.action.primary.default` | `--tds-color-action-primary-default` |
| `borderWidth` | `border-width.thin` | `--tds-border-width-thin` |
| `radius` | `radius.md` | `--tds-radius-md` |
| `surface` | `color.surface.default` | `--tds-color-surface-default` |
| `surfaceSelected` | `color.surface.raised` | `--tds-color-surface-raised` |
| `radioAccent` | `color.action.primary.default` | `--tds-color-action-primary-default` |
| `radioSize` | `space.4` | `--tds-space-4` |
| `legendText` | `color.text.default` | `--tds-color-text-default` |
| `legendTypography` | `typography.label.md` | `--tds-typography-label-md` |
| `labelText` | `color.text.default` | `--tds-color-text-default` |
| `labelTextDisabled` | `color.text.disabled` | `--tds-color-text-disabled` |
| `descriptionText` | `color.text.muted` | `--tds-color-text-muted` |
| `descriptionTypography` | `typography.caption.md` | `--tds-typography-caption-md` |
| `focusRing` | `color.border.focus` | `--tds-color-border-focus` |
| `focusRingWidth` | `border-width.medium` | `--tds-border-width-medium` |

> 하드코딩 색상/치수 금지 — 시각 속성은 반드시 위 토큰만 참조합니다.

## Responsive

| 브레이크포인트 | 동작 |
|---|---|
| `sm`, `md`, `lg` | `fluid` |
