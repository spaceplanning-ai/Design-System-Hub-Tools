<!-- AUTO-GENERATED from contracts/Header.contract.json — DO NOT EDIT (pnpm codegen) -->

# Header API

> ⚠️ **자동 생성 문서** — 이 파일은 계약에서 생성됩니다. 직접 수정하지 마세요.
> 변경이 필요하면 `contracts/Header.contract.json` 을 수정한 뒤 `pnpm codegen` 을 실행하세요.

헤더 — 콘텐츠 영역 맨 위에 붙는 banner 랜드마크다. 왼쪽에 눈썹 문구(브랜드·역할)와 **그 화면의 제목(<h1>)** 이 오고, 오른쪽에 메타 슬롯(날짜·계정 등)이 온다.

[승격 근거] 실물이 apps/admin/src/shared/layout/AppHeader.tsx 에 112줄로 있었고 계약·스토리·Figma 어디에도 없었다. Sidebar 와 같은 뿌리의 결손이다 — 2026-07-20 감사가 shared/layout/ 을 스캔 대상에서 빠뜨렸다(docs/audit/cycle-2026-07-20-report.md §5).

[앱에서 가장 많이 보이는 <h1> 이다] 어드민의 화면 130여 개가 자기 제목을 그리지 않고 이 헤더 하나에 맡긴다(IA-02). 그래서 title 은 slot 이 아니라 string 이고, 이 컴포넌트가 <h1> 을 **소유한다** — 화면이 자기 <h1> 을 또 그리면 문서에 h1 이 둘이 된다.

[무엇이 DS 이고 무엇이 앱인가] 제목 문자열이 어디서 나오는지(어드민은 nav-config 의 findCoveringLeaf 로 경로에서 유도한다), 오늘이 며칠인지, 누가 로그인해 있는지는 전부 앱의 사실이다. DS 는 그것들을 **받아서 배치만** 한다 — meta 가 node 슬롯인 이유이며, 날짜 포맷·세션 조회가 DS 로 새어 들어오지 않게 하는 경계다.

[Navbar 가 아니다] 이 바에는 링크가 하나도 없다. 화면의 현재 위치를 말할 뿐 이동을 제공하지 않으므로 role 은 navigation 이 아니라 banner 이고, 분류표의 navbar 항목을 이 계약이 채우지 않는다(그 항목은 실물이 없어 비워 뒀다).

[높이가 Sidebar 의 브랜드 영역과 같다] 두 영역의 아래 구분선이 한 줄로 이어져야 한다. 내용 높이에 따라 흘러가게 두면 선이 어긋나므로 같은 토큰 배수로 고정한다.

## 개요

| 항목 | 값 |
|---|---|
| 버전 | `1.0.0` |
| 레벨 | `organism` |
| 카테고리 | `Navigation` |
| 상태 | `beta` |
| 소유 | code `component-eng` · design `ui-design` · figma `figma-eng` |

## Props

| 이름 | 타입 | 기본값 | 필수 | Figma Property | 설명 |
|---|---|---|---|---|---|
| `title` | `string` | — | ✅ | — | 지금 화면의 이름 — <h1> 이 된다. 앱에서 가장 많이 보이는 제목이며 라우트마다 바뀐다. 어드민은 nav-config 의 findCoveringLeaf 로 경로에서 유도하는데, 그 판정은 DS 밖의 일이라 결과 문자열만 받는다 |
| `eyebrow` | `string` | `""` | — | — | 제목 위에 붙는 작은 문구 — 브랜드·역할 같은 상위 맥락('LOGO · 관리자'). 빈 문자열이면 그 줄을 아예 그리지 않는다(빈 <p> 를 남기면 제목이 아래로 밀린다) |
| `meta` | ReactNode | `null` | — | — | 오른쪽 끝 슬롯 — 오늘 날짜·로그인 계정처럼 화면과 무관한 상시 정보가 온다. 날짜 포맷도 세션 조회도 앱의 일이라 DS 는 자리만 준다. 주지 않으면 제목이 폭을 다 쓴다 |

## Events

_계약에 정의된 이벤트가 없습니다._

## States

`default`

> Story 커버리지는 enum prop 값 곱 × boolean prop 당 2 조합 100%가 요구됩니다 (`combinationMatrix` 참조).
> states 는 이 행렬에 포함되지 않습니다 — state 커버리지는 커버리지 축2(contract-states)가 **단언을 가진 테스트**로 따로 강제합니다.

## A11y

| 항목 | 값 |
|---|---|
| role | `banner` |
| 키보드 | `이 컴포넌트 자체에는 상호작용 요소가 없다 — 탭 순서에 끼는 것은 meta 슬롯에 주입된 요소뿐이며 그 키보드 계약은 주입한 쪽이 진다`, `제목은 <h1> 이라 스크린리더의 제목 탐색(H 키)에서 화면 이름으로 잡힌다` |
| focus-visible | 해당 없음 |
| `landmark-banner` | <header> 가 문서 최상위(article/section 안이 아님)에 있어 암묵 role 이 banner 다. 별도 role 속성을 달지 않는다 — 네이티브 시맨틱으로 충분하다 |
| `heading-level` | 제목은 <h1> 이며 화면당 하나다. 화면이 자기 <h1> 을 또 그리면 문서에 h1 이 둘이 된다 |
| `no-eyebrow-heading` | 눈썹 문구는 <p> 다 — 제목이 아니므로 제목 계층에 넣지 않는다. <h2> 로 만들면 스크린리더 제목 목록이 브랜드 이름으로 오염된다 |
| 최소 대비 | 4.5:1 |

## Tokens

| 시각 속성 | 토큰 경로 | CSS 변수 |
|---|---|---|
| `surface` | `color.surface.default` | `--tds-color-surface-default` |
| `border` | `color.border.default` | `--tds-color-border-default` |
| `borderWidth` | `border-width.thin` | `--tds-border-width-thin` |
| `heightUnit` | `space.6` | `--tds-space-6` |
| `padX` | `space.6` | `--tds-space-6` |
| `gap` | `space.4` | `--tds-space-4` |
| `stackGap` | `space.1` | `--tds-space-1` |
| `eyebrowText` | `color.text.muted` | `--tds-color-text-muted` |
| `eyebrowTypography` | `typography.label.md` | `--tds-typography-label-md` |
| `titleText` | `color.text.default` | `--tds-color-text-default` |
| `titleTypography` | `typography.title.xl` | `--tds-typography-title-xl` |
| `metaTypography` | `typography.label.md` | `--tds-typography-label-md` |
| `metaText` | `color.text.muted` | `--tds-color-text-muted` |

> 하드코딩 색상/치수 금지 — 시각 속성은 반드시 위 토큰만 참조합니다.

## Responsive

| 브레이크포인트 | 동작 |
|---|---|
| `sm`, `md`, `lg` | `fluid` |
