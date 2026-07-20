<!-- AUTO-GENERATED from contracts/Spinner.contract.json — DO NOT EDIT (pnpm codegen) -->

# Spinner API

> ⚠️ **자동 생성 문서** — 이 파일은 계약에서 생성됩니다. 직접 수정하지 마세요.
> 변경이 필요하면 `contracts/Spinner.contract.json` 을 수정한 뒤 `pnpm codegen` 을 실행하세요.

원형 로딩 인디케이터. 출처: packages/ui/src/atoms/Button/Button.tsx 의 **비공개** `function Spinner()` — 이미 구현돼 있었으나 배럴로 나가지 않아 Button 밖에서는 쓸 수 없었다. 즉 이 계약은 새 컴포넌트를 만드는 것이 아니라 갇혀 있던 것을 꺼내는 것이다.

기본 크기 `inherit` 는 승계한 Button 스피너의 `1em`(글자 크기 상대) 을 그대로 뜻한다 — Button 이 size sm/md/lg 마다 다른 font-size 를 갖는데 스피너가 따라 커지던 동작이 이 값 하나에 담겨 있다. 고정 크기가 필요한 자리(빈 영역 중앙 등)만 sm/md/lg 를 쓴다.

색은 `currentColor` 다. 토큰을 직접 읽지 않고 부모의 글자색을 따르므로 Button 의 네 variant 위에서 각각 옳은 색이 나온다 — 이 규칙을 색 토큰으로 바꾸면 danger 버튼 위에서 스피너만 파랗게 남는다.

[label 과 aria] Button 안에서는 `aria-busy` 가 이미 버튼에 붙어 로딩을 알리므로 스피너는 장식(`aria-hidden`)이어야 한다 — 그래서 label 의 기본값이 빈 문자열이고, 그때 `aria-hidden="true"` 를 낸다. 독립적으로 쓸 때만 label 을 주어 `role="status"` 로 승격시킨다. 기본을 반대로 잡으면 Button 하나가 로딩 상태에서 두 번 낭독된다.

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
| `size` | `'inherit'` \| `'sm'` \| `'md'` \| `'lg'` | `"inherit"` | — | `Size` | 지름. inherit = `1em` 으로 부모 글자 크기를 따른다(Button 이 쓰는 값 — 버튼 size 가 바뀌면 스피너도 함께 바뀐다). sm/md/lg 는 space 토큰 고정값이며 글자 문맥이 없는 자리에 쓴다 |
| `label` | `string` | `""` | — | — | 스크린리더에 낭독할 진행 문구(예: '불러오는 중'). 빈 문자열(기본)이면 장식으로 보고 `aria-hidden="true"` 를 낸다 — 부모가 `aria-busy` 로 이미 알리는 Button 안의 용법이다. 값이 있으면 `role="status"` + `aria-label` 로 승격된다 |

## Events

_계약에 정의된 이벤트가 없습니다._

## States

`default`

> Story 커버리지는 enum prop 값 곱 × boolean prop 당 2 조합 100%가 요구됩니다 (`combinationMatrix` 참조).
> states 는 이 행렬에 포함되지 않습니다 — state 커버리지는 커버리지 축2(contract-states)가 **단언을 가진 테스트**로 따로 강제합니다.

## A11y

| 항목 | 값 |
|---|---|
| role | `status` |
| 키보드 | `none — 비대화형. 포커스 순서에 들어가지 않는다` |
| focus-visible | 해당 없음 |
| aria-busy | 스피너 자신은 aria-busy 를 갖지 않는다. 로딩 중인 영역(Button · 패널)이 갖는다 |
| `aria-hidden` | label 이 빈 문자열일 때. Button 안에서의 기본 용법이며, 버튼의 aria-busy 와 중복 낭독되지 않게 한다 |
| `aria-label` | label 이 있을 때만. 이때 role="status" 가 함께 붙어 polite 라이브 영역이 된다 |
| 최소 대비 | 3:1 |

## Tokens

| 시각 속성 | 토큰 경로 | CSS 변수 |
|---|---|---|
| `track` | `color.transparent` | `--tds-color-transparent` |
| `thickness` | `border-width.medium` | `--tds-border-width-medium` |
| `radius` | `radius.full` | `--tds-radius-full` |
| `duration` | `motion.duration.slow` | `--tds-motion-duration-slow` |
| `sizeSm` | `space.4` | `--tds-space-4` |
| `sizeMd` | `space.5` | `--tds-space-5` |
| `sizeLg` | `space.7` | `--tds-space-7` |

> 하드코딩 색상/치수 금지 — 시각 속성은 반드시 위 토큰만 참조합니다.

## Responsive

| 브레이크포인트 | 동작 |
|---|---|
| `sm`, `md`, `lg` | `size-fixed` |
