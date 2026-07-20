<!-- AUTO-GENERATED from contracts/Panel.contract.json — DO NOT EDIT (pnpm codegen) -->

# Panel API

> ⚠️ **자동 생성 문서** — 이 파일은 계약에서 생성됩니다. 직접 수정하지 마세요.
> 변경이 필요하면 `contracts/Panel.contract.json` 을 수정한 뒤 `pnpm codegen` 을 실행하세요.

패널 — 본문 옆에 서는 `<aside>` 껍데기다. 블록 여러 개를 일정한 간격으로 세로로 쌓고, 선택적으로 맨 아래에 **위쪽 구분선으로 갈린 안내 영역**을 둔다. 그것이 전부다: 이 컴포넌트는 자기 안에 무엇이 들어오는지 모른다.

[승격 근거] 실물이 apps/admin/src/shared/ui/FilterPanel.tsx 의 `FilterRail` 로 있었고 어떤 계약·스토리·Figma 에도 없었다. 그 이전에는 AdminGroupPanel 과 RolePanel 에 **글자 하나 다르지 않게 두 벌** 복사돼 있었다(클린코드 점검 축3 `clone:ba83801c796d0f33`). 분류표 `Layout/panel` 행은 그동안 component: null 이었다.

[왜 필터 전용 이름을 버렸나 — 이것이 이 계약의 핵심 판단] 앱에서의 이름은 `FilterRail` 이었으나 **소비처 12곳 중 2곳은 필터를 담지 않는다.** 권한 화면(RolePanel)은 역할 목록을, 상품 등록 폼(ProductFormPage)은 폼 섹션 내비게이션(FormSectionNav)을 담는다. 즉 이 껍데기가 실제로 아는 것은 '곁에 서는 세로 스택 + 아래 안내문' 뿐이고 '필터' 는 **가장 흔한 내용물의 이름**이었을 뿐이다. 내용물의 이름을 껍데기에 박으면 필터가 아닌 두 소비처가 계속 거짓 이름을 import 하게 되고, DS 로 올라온 뒤에는 그 거짓말이 카탈로그와 Figma 까지 퍼진다. Layout 계층의 이름은 **배치**에서 와야 한다.

[안에 들어가는 필터 목록은 왜 함께 올라오지 않았나] 같은 파일의 `FilterPanel`(제목 + aria-pressed 토글 목록 + 건수 배지)은 **이번에 승격하지 않았다.** 두 가지 이유다. (1) 23모듈 275항목 어디에도 '필터 목록' 에 해당하는 정본 행이 없다 — 없는 자리를 만들려면 상류(taxonomy.v1.json)를 고쳐야 하는데 그것은 ② 토큰·계약 단의 일이고 하류에서 몰래 할 일이 아니다. (2) 그 컴포넌트는 실패 안내문('건수를 불러오지 못했습니다')과 미집계 표기('—')를 **한국어 문자열로 직접 들고 있어** 지금 모양 그대로는 DS 가 될 수 없다. 껍데기와 내용물은 실제로 다른 두 컴포넌트이며(소비처가 그것을 증명한다) 서로 다른 속도로 올라간다.

[폭을 정하지 않는다] 이 패널은 자기 폭을 갖지 않고 `min-inline-size: 0` 만 둔다. 좌측 레일이 몇 칸을 차지할지는 그 화면의 격자가 정하는 사실이고, 껍데기가 폭을 박으면 격자와 두 곳에서 싸운다. Sidebar 가 폭을 소유하는 것과 반대인데, 그쪽은 앱 셸의 고정 크롬이고 이쪽은 본문 격자의 한 칸이라 그렇다.

[안내문이 왜 별도 슬롯인가] 안내문은 `<p>` 여러 개일 수 있다 — 운영진 그룹·역할·로그 화면은 세 문단이다. 그래서 이 영역은 `<div>` 이고 호출부가 문단들을 넣는다. `<p>` 로 감싸면 문단 안에 문단이 들어가 브라우저가 태그를 강제로 닫아 마크업이 무너진다. 그리고 이 구분선은 **아래쪽 경계**라 상단 액션바(border-block-end)와 토큰 모양만 닮았을 뿐 변경 축이 달라 합치지 않는다.

## 개요

| 항목 | 값 |
|---|---|
| 버전 | `1.0.0` |
| 레벨 | `molecule` |
| 카테고리 | `Layout` |
| 상태 | `beta` |
| 소유 | code `component-eng` · design `ui-design` · figma `figma-eng` |

## Props

| 이름 | 타입 | 기본값 | 필수 | Figma Property | 설명 |
|---|---|---|---|---|---|
| `children` | ReactNode | — | ✅ | — | 패널이 쌓을 블록들 — 필터 축·역할 목록·폼 섹션 내비게이션 등 무엇이든 온다. 블록 사이 간격은 이 껍데기가 소유한다: 화면마다 그릇을 만들면 축 사이 간격이 화면마다 어긋나고 **실제로 어긋나 있었다** |
| `notice` | ReactNode | `null` | — | — | 맨 아래 안내 영역 — 위쪽 구분선으로 본문과 갈린다. `<div>` 라 문단 여럿을 받는다. null 이면 구분선과 여백까지 함께 사라진다(빈 영역이 남아 아래가 떠 보이지 않게) |

## Events

_계약에 정의된 이벤트가 없습니다._

## States

`default`

> Story 커버리지는 enum prop 값 곱 × boolean prop 당 2 조합 100%가 요구됩니다 (`combinationMatrix` 참조).
> states 는 이 행렬에 포함되지 않습니다 — state 커버리지는 커버리지 축2(contract-states)가 **단언을 가진 테스트**로 따로 강제합니다.

## A11y

| 항목 | 값 |
|---|---|
| role | `complementary` |
| 키보드 | `포커스를 갖지 않는다 — 껍데기이며 상호작용 요소는 전부 children 의 것이다`, `Tab 순서는 children 의 문서 순서 그대로 흐르고, 안내 영역이 맨 마지막이다` |
| focus-visible | 해당 없음 |
| `landmark-complementary` | `<aside>` 는 complementary 랜드마크다 — 본문을 보조하는 곁 영역임을 보조기술에 알린다. 이름(aria-label)은 두지 않는다: 한 화면에 이 패널이 둘 이상인 경우가 어드민에 없고, 이름이 필요한 것은 패널이 아니라 그 안의 각 `<nav>` 다(내용물이 자기 이름을 갖는다) |
| `no-heading` | 패널 자신은 제목을 갖지 않는다. 제목은 안에 들어오는 블록 각자의 것이라 껍데기가 `<h2>` 를 강제하면 블록이 둘일 때 제목이 두 층이 된다 |
| 최소 대비 | 4.5:1 |

## Tokens

| 시각 속성 | 토큰 경로 | CSS 변수 |
|---|---|---|
| `blockGap` | `space.5` | `--tds-space-5` |
| `noticeGap` | `space.3` | `--tds-space-3` |
| `noticePadTop` | `space.4` | `--tds-space-4` |
| `noticePadX` | `space.3` | `--tds-space-3` |
| `noticeBorder` | `color.border.default` | `--tds-color-border-default` |
| `noticeBorderWidth` | `border-width.thin` | `--tds-border-width-thin` |
| `blockText` | `color.text.default` | `--tds-color-text-default` |
| `blockTypography` | `typography.label.md` | `--tds-typography-label-md` |
| `noticeText` | `color.text.muted` | `--tds-color-text-muted` |
| `noticeTypography` | `typography.caption.md` | `--tds-typography-caption-md` |

> 하드코딩 색상/치수 금지 — 시각 속성은 반드시 위 토큰만 참조합니다.

## Responsive

| 브레이크포인트 | 동작 |
|---|---|
| `sm`, `md`, `lg` | `fluid` |
