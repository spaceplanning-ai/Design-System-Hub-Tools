<!-- AUTO-GENERATED from contracts/SegmentedControl.contract.json — DO NOT EDIT (pnpm codegen) -->

# SegmentedControl API

> ⚠️ **자동 생성 문서** — 이 파일은 계약에서 생성됩니다. 직접 수정하지 마세요.
> 변경이 필요하면 `contracts/SegmentedControl.contract.json` 을 수정한 뒤 `pnpm codegen` 을 실행하세요.

세그먼티드 컨트롤 — 트랙(회색 배경) 위에 선택된 세그먼트만 알약으로 떠 있는 단일 선택 컨트롤. 라디오 그룹 시맨틱을 소유한다. 도메인 중립: 옵션은 options prop 으로 주입하며 '일/주/월' 같은 도메인 의미는 조립하는 organism/page 가 정한다 (ADR-0003). 출처 구현: apps/admin/src/pages/dashboard/components/RangeToggle.tsx

[1.1.0 — 아이콘 세그먼트] options[].icon 과 options[].labelHidden 이 늘었다. 1.0.x 는 label 이 string 뿐이라 **아이콘만 있는 세그먼트를 표현할 방법이 아예 없었고**, 그래서 이메일 빌더의 캔버스 폭 전환([🖥|📱])이 배타 선택·radiogroup·로빙 tabindex 라는 시맨틱을 전부 필요로 하면서도 이 컴포넌트로 이관되지 못하고 로컬 IconToggleGroup 에 남아 있었다. prop 이 늘기만 했고 기존 호출부는 그대로 동작하므로 MINOR 다.

[아이콘 세그먼트의 접근 가능한 이름 — label 이 언제나 유일한 원천이다] icon 을 줘도 label 은 여전히 required 이며, labelHidden=true 는 label 을 **시각적으로만** 감춘다 — 텍스트는 DOM 과 접근성 트리에 그대로 남으므로 아이콘만 보이는 세그먼트도 이름을 잃지 않는다(SearchField 의 숨긴 라벨과 같은 처리). 세그먼트에 aria-label 을 덧붙이지 않는 것이 규약이다: 이름의 경로가 하나뿐이어야 보이는 라벨과 감춘 라벨이 같은 규칙을 타고, 이름이 둘로 갈리는 ColorField 류 회귀가 원천적으로 불가능해진다. 아이콘은 어떤 경우에도 접근 가능한 이름에 기여하지 않는다(Icon 의 label 을 비워 aria-hidden 으로 낸다). labelHidden=true 인데 icon 이 없으면 눈에 보이는 내용이 사라지므로 그 조합은 계약 위반이다.

[왜 icon 이 ReactNode 가 아니라 Icon 이름 유니온인가] 임의 노드를 받으면 세그먼트 안에 무엇이든 들어올 수 있어 24 그리드·currentColor·크기 규약이 깨진다. 그래서 contracts/Icon.contract.json 의 name enum 과 **같은 값 집합**만 받는다. 이 유니온은 지금 손으로 옮겨 적힌 사본이므로(생성기가 계약 간 타입 import 를 만들지 못한다) SegmentedControl.test.tsx 가 IconName 과의 **양방향 할당 가능성**을 컴파일 타임에 단언해 표류를 막는다 — 한쪽에만 아이콘이 늘면 pnpm typecheck 가 죽는다.

## 개요

| 항목 | 값 |
|---|---|
| 버전 | `1.1.0` |
| 레벨 | `molecule` |
| 카테고리 | `Selection` |
| 상태 | `beta` |
| 소유 | code `component-eng` · design `ui-design` · figma `figma-eng` |
| 의존 컴포넌트 | `Icon` |

## Props

| 이름 | 타입 | 기본값 | 필수 | Figma Property | 설명 |
|---|---|---|---|---|---|
| `value` | `string` | — | ✅ | — | 선택된 세그먼트의 id. options[].id 중 하나여야 한다 |
| `options` | `array` | — | ✅ | — | 세그먼트 목록. 데이터 prop — Figma Component Property 대응 없음 (ADR-0003).  id 는 value/onChange 가 쓰는 키, label 은 **언제나 접근 가능한 이름**이다. icon 은 Icon 계약의 name enum 과 같은 값 집합이며 label 앞에 붙는다. labelHidden=true 면 label 을 시각적으로만 감춘다(텍스트는 DOM 에 남아 접근 가능한 이름이 된다) — 아이콘만 보이는 세그먼트가 이름을 잃지 않게 하는 장치이므로 icon 없이 쓰면 안 된다 |
| `size` | `'sm'` \| `'md'` | `"md"` | — | `Size` | 세그먼트 높이·좌우 패딩 스케일 |
| `disabled` | `boolean` | `false` | — | `Disabled` | 그룹 전체 비활성. onChange 차단 + aria-disabled |
| `ariaLabel` | `string` | — | ✅ | — | radiogroup 의 접근 가능한 이름 (예: '조회 기간'). 시각 레이블이 없으므로 필수 |

## Events

| 이름 | Payload | 발화 차단 상태 | 설명 |
|---|---|---|---|
| `onChange` | `string` | `disabled` | 선택된 세그먼트의 id 를 전달. disabled 에서는 발화 금지 — Storybook Play Function이 전수 검증 |

## States

`default` · `hover` · `focus-visible` · `disabled` · `selected`

> Story 커버리지는 enum prop 값 곱 × boolean prop 당 2 조합 100%가 요구됩니다 (`combinationMatrix` 참조).
> states 는 이 행렬에 포함되지 않습니다 — state 커버리지는 커버리지 축2(contract-states)가 **단언을 가진 테스트**로 따로 강제합니다.

## A11y

| 항목 | 값 |
|---|---|
| role | `radiogroup` |
| 키보드 | `Tab`, `ArrowLeft`, `ArrowRight`, `Space`, `Enter` |
| focus-visible | 필수 |
| aria-disabled | when disabled |
| `aria-label` | radiogroup 에만 붙는다 — ariaLabel prop. 세그먼트에는 어떤 경우에도 aria-label 을 달지 않는다: 이름은 언제나 렌더된 label 텍스트에서 온다 (labelHidden=true 여도 텍스트는 DOM·접근성 트리에 남고 시각적으로만 감춰진다 — SearchField 의 숨긴 라벨과 같은 처리). 기구가 하나뿐이라 이름이 둘로 갈릴 경로가 없다 |
| `aria-checked` | 각 세그먼트(role=radio) — value 와 일치하면 true |
| `icon-decorative` | options[].icon 이 그리는 Icon 은 label 을 비워 aria-hidden 으로 나간다 — 이름은 언제나 label 하나에서만 온다 |
| 최소 대비 | 4.5:1 |

## Tokens

| 시각 속성 | 토큰 경로 | CSS 변수 |
|---|---|---|
| `trackBackground` | `color.surface.raised` | `--tds-color-surface-raised` |
| `trackRadius` | `radius.full` | `--tds-radius-full` |
| `trackPadding` | `space.1` | `--tds-space-1` |
| `trackGap` | `space.1` | `--tds-space-1` |
| `segmentBackgroundSelected` | `color.surface.default` | `--tds-color-surface-default` |
| `segmentBorderSelected` | `color.border.default` | `--tds-color-border-default` |
| `segmentRadius` | `radius.full` | `--tds-radius-full` |
| `segmentPaddingX` | `space.3` | `--tds-space-3` |
| `segmentPaddingY` | `space.1` | `--tds-space-1` |
| `segmentGap` | `space.1` | `--tds-space-1` |
| `segmentText` | `color.text.muted` | `--tds-color-text-muted` |
| `segmentTextSelected` | `color.text.default` | `--tds-color-text-default` |
| `segmentTextDisabled` | `color.text.disabled` | `--tds-color-text-disabled` |
| `typography` | `typography.label.md` | `--tds-typography-label-md` |
| `focusRing` | `color.border.focus` | `--tds-color-border-focus` |
| `transitionDuration` | `motion.duration.fast` | `--tds-motion-duration-fast` |
| `transitionEasing` | `motion.easing.standard` | `--tds-motion-easing-standard` |

> 하드코딩 색상/치수 금지 — 시각 속성은 반드시 위 토큰만 참조합니다.

## Responsive

| 브레이크포인트 | 동작 |
|---|---|
| `sm`, `md`, `lg` | `size-fixed` |
