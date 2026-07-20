<!-- AUTO-GENERATED from contracts/Result.contract.json — DO NOT EDIT (pnpm codegen) -->

# Result API

> ⚠️ **자동 생성 문서** — 이 파일은 계약에서 생성됩니다. 직접 수정하지 마세요.
> 변경이 필요하면 `contracts/Result.contract.json` 을 수정한 뒤 `pnpm codegen` 을 실행하세요.

결과 화면 — 요청한 내용을 그릴 수 없을 때 그 자리를 대신 채우는 상태 블록이다. 제목 한 줄, 설명 한 문단, 신고용 참조 코드, 그리고 빠져나갈 액션으로 이루어진다.

[승격 근거] 실물이 apps/admin/src/shared/errors/ErrorScreens.tsx 에 119줄로 있었고 두 벌이었다 — 렌더 예외 복구 화면(RouteErrorScreen, EXC-01)과 권한 없음 화면(ForbiddenScreen, EXC-03). 골격은 같고 문구와 액션 개수만 달랐다. 분류표 Feedback/result-page 행은 그동안 component: null 이었다.

[무엇이 DS 이고 무엇이 앱인가] Sidebar 가 세운 기준을 그대로 따른다 — DS 는 그리고 앱이 정한다. 어드민의 두 화면은 네 가지를 한 파일에서 했다: (1) 블록의 시각·배치, (2) 무슨 일이 일어났는지 설명하는 문구, (3) 오류 객체에서 참조 코드를 뽑는 일, (4) 어디로 빠져나갈지와 그 이동. DS 는 (1)만 가진다. (2)는 제품 카피라 title·description 으로 들어오고, (3)은 이 앱의 HTTP 오류 모양을 아는 shared/errors/http-error.ts 의 referenceOf 가 계산해 문자열로만 넘어오며, (4)는 액션 슬롯이라 라우터를 아는 앱이 Button 을 넣는다. 문구를 DS 가 들면 다른 제품에서 쓸 수 없고, FilterPanel 승격이 막힌 이유가 정확히 그것이었다.

[Empty 와 무엇이 다른가] Empty 는 data view 가 0행일 때의 상태이고 왜 비었는지를 context(hasQuery/hasActiveFilters)로 스스로 분기해 문구를 조립한다 — 비어 있다는 사실의 종류가 유한하기 때문이다. Result 는 화면 전체가 실패했을 때의 상태이고 그 사유는 유한하지 않다(렌더 예외·권한·점검·정지 등). 그래서 Empty 는 문구를 만들고 Result 는 문구를 받는다. 두 계약이 갈라지는 지점이 여기다.

[상태(status) 축을 만들지 않았다] 403 은 자물쇠, 500 은 경고 삼각형처럼 사유별 아이콘·색을 주는 설계가 흔하지만, 어드민의 두 화면은 지금 시각적으로 완전히 동일하고 사유는 오직 제목 문구로만 갈린다. 없는 구분을 계약에 넣으면 검증되지 않은 축이 Storybook 조합 행렬만 늘리고 승격이 픽셀을 바꾼다 — Sidebar 가 접기 축을 만들지 않은 것과 같은 규율이다. 아이콘·색으로 사유를 구분할지는 제품 판단이므로 오너에게 올린다.

[제목이 h2 인 이유] 페이지의 h1 은 화면 이름을 가진 Header 가 소유한다. 이 블록은 그 화면 **안의** 상태이므로 h1 을 하나 더 만들면 한 문서에 제목이 둘이 된다. 그래서 h2 로 고정하고 단계 prop 을 두지 않았다 — 실제로 h1 이 필요한 호출부(준비 중 화면)는 아직 이 컴포넌트를 쓰지 않는다.

[참조 코드를 왜 계약에 두나 — EXC-20] 이 블록은 raw 서버 body·stack trace·status 코드를 산문으로 노출하지 않는다. 내부 구조를 흘리고 고장처럼 읽히기 때문이다. 대신 로깅된 오류와 대조 가능한 짧은 코드 하나만 보인다. 그 코드는 운영자가 그대로 복사해 티켓에 붙이는 것이 유일한 용도이므로 자릿수가 흔들리지 않게 tabular 로 고정하고 한 번의 클릭으로 전체가 선택되게 한다 — 그 두 가지가 시각·상호작용 관심사라 DS 가 가진다.

## 개요

| 항목 | 값 |
|---|---|
| 버전 | `1.0.0` |
| 레벨 | `molecule` |
| 카테고리 | `Feedback` |
| 상태 | `beta` |
| 소유 | code `component-eng` · design `ui-design` · figma `figma-eng` |
| 의존 컴포넌트 | `Button` |

## Props

| 이름 | 타입 | 기본값 | 필수 | Figma Property | 설명 |
|---|---|---|---|---|---|
| `title` | `string` | — | ✅ | — | 무슨 일이 일어났는지 한 줄로 — 문제가 발생했어요 · 접근 권한이 없습니다 등. h2 로 렌더된다. 제품 카피라 DS 가 만들지 않고 받는다 |
| `description` | `string` | `""` | — | — | 제목을 보충하는 한 문단 — 무엇을 해 보면 되는지까지 적는다. 빈 문자열이면 렌더하지 않는다 |
| `reference` | `string` | `""` | — | — | 신고에 붙일 짧은 상관관계 코드 (EXC-20). 빈 문자열이면 렌더하지 않는다 — 코드가 없는 결과 화면(권한 없음 등)이 빈 줄을 남기지 않게 한다. 값을 계산하는 것은 오류의 모양을 아는 앱이다 |
| `actions` | ReactNode (허용: Button) | `null` | — | — | 빠져나갈 수단 — Button 하나 또는 여럿이 한 줄로 놓인다. 어디로 가는지도 다시 시도가 무엇을 뜻하는지도 라우터와 경계를 아는 앱만 알기 때문에 슬롯이다. 주지 않으면 액션 줄 자체를 그리지 않는다 |

## Events

_계약에 정의된 이벤트가 없습니다._

## States

`default`

> Story 커버리지는 enum prop 값 곱 × boolean prop 당 2 조합 100%가 요구됩니다 (`combinationMatrix` 참조).
> states 는 이 행렬에 포함되지 않습니다 — state 커버리지는 커버리지 축2(contract-states)가 **단언을 가진 테스트**로 따로 강제합니다.

## A11y

| 항목 | 값 |
|---|---|
| role | `alert` |
| 키보드 | `Tab — 액션 슬롯의 Button 으로 문서 순서 그대로 흐른다. 블록 자체는 포커스를 받지 않는다`, `Enter · Space — 액션 Button 이 DS Button 이라 활성화와 focus-visible 링을 그대로 상속한다` |
| focus-visible | 필수 |
| `role` | alert(=aria-live assertive) — 화면이 그려지지 못했다는 사실은 보조기술 사용자에게 즉시 전달돼야 한다. 이 값은 승격 전 두 화면(ErrorScreens.tsx)이 이미 쓰던 것을 그대로 승계한 것이며 동작을 바꾸지 않았다 |
| `heading` | 제목은 h2 다. 페이지의 h1 은 화면 이름을 가진 Header 가 소유하므로 여기서 h1 을 더 만들면 한 문서에 제목이 둘이 된다 |
| `reference-select` | 참조 코드는 user-select 전체 선택이라 한 번의 클릭·드래그로 통째로 복사된다. 자릿수가 흔들리지 않게 tabular-nums 로 고정한다 |
| `no-raw-detail` | stack trace·서버 body·status 코드를 노출하지 않는다 (EXC-20). 계약에 그런 prop 이 없는 것이 그 규율의 강제 수단이다 |
| 최소 대비 | 4.5:1 |

## Tokens

| 시각 속성 | 토큰 경로 | CSS 변수 |
|---|---|---|
| `gap` | `space.4` | `--tds-space-4` |
| `paddingBlock` | `space.6` | `--tds-space-6` |
| `maxWidthUnit` | `space.6` | `--tds-space-6` |
| `titleText` | `color.text.default` | `--tds-color-text-default` |
| `titleTypography` | `typography.title.xl` | `--tds-typography-title-xl` |
| `descriptionText` | `color.text.muted` | `--tds-color-text-muted` |
| `descriptionTypography` | `typography.body.md` | `--tds-typography-body-md` |
| `referenceText` | `color.text.muted` | `--tds-color-text-muted` |
| `referenceTypography` | `typography.caption.md` | `--tds-typography-caption-md` |
| `actionsGap` | `space.2` | `--tds-space-2` |

> 하드코딩 색상/치수 금지 — 시각 속성은 반드시 위 토큰만 참조합니다.

## Responsive

| 브레이크포인트 | 동작 |
|---|---|
| `sm`, `md`, `lg` | `fluid` |
