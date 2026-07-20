# TDS 문서 스타일 규격 (tds-doc-style)

Figma 플러그인(TDS Sync)의 **TDS 문서 생성기**(`tools/figma-plugin/src/tds-doc.ts`)가
피그마 파일에 만들어내는 문서 페이지의 단일 규격이다. Storybook과 동일한 원천
(`tokens/tokens.json` → `pnpm codegen` → `generated/tokens/figma-variables.json` /
`generated/<Name>.figma.json`)만 입력으로 받으므로, 컬러 팔레트·폰트 컬러·타이포그래피가
Storybook 문서와 항상 같은 값을 보여준다.

- 담당: Figma 플러그인 (`tools/figma-plugin/**` + 이 문서)
- 검수: Figma 리뷰 (G7) — Detached 스캔·바인딩률 판정의 기준 문서
- 소비: Figma 컴포넌트/변수/레이아웃 (생성 결과 위에 Variant 내용·레이아웃·화면을 채움), 디자인 드리프트 감시

## 1. 페이지 구성 (이름 = 멱등 키)

생성기는 아래 **정확한 페이지 이름**으로 페이지를 찾고, 있으면 내용을 비우고 재생성한다
(멱등). 없으면 새로 만들고, 항상 이 순서로 문서 페이지를 파일 맨 앞에 정렬한다.
목록 밖의 페이지는 절대 건드리지 않는다 (P2 계약 우선 — 파괴적 변경 금지).

| 순서 | 페이지 이름 | 내용 |
|---|---|---|
| 1 | `📕 Cover` | 커버 (타이틀/버전/생성일/SSOT 경로) |
| 2 | `🎨 Foundations-Colors` | 컬러 팔레트 — Semantic / Primitive / Component 스와치 |
| 3 | `Aa Typography` | 폰트 컬러 + 타이포 램프 스펙시먼 + 폰트 패밀리 |
| 4 | `✦ Icon` | 아이콘 카탈로그 — 계약 `Icon` 의 name enum 전량 + 이름 라벨 |
| 5 | `📐 Spacing·Radius·Shadow` | 간격 바 / 반경 카드 / 셰도 / 모션 |
| — | `---------` | 구분선 (라벨 없음) |
| 6~ | `🧩 Components — <카테고리>` | 카테고리별 컴포넌트 시트 (Property 표 + Variant 매트릭스 + 토큰 표) |
| — | `---------` | 구분선 (섹션마다 하나) |
| ~N | `📄 <메뉴>` | 화면 아트보드 (1440 데스크톱 + SCR ID 라벨) |

페이지 순서의 **정본은 코드가 아니라 순수 계층**이다 —
`tools/figma-plugin/src/spec/doc-pages.ts` 의 `planDocPages()` 가 이 표를 그대로 구현하고
vitest(`__tests__/doc-pages.test.ts`)가 전체 시퀀스를 못박는다. 표를 바꾸면 그 테스트도 바꿀 것.

표시명에는 순번 접두어(`4. ✦ Icon`)가 붙지만 **식별은 pluginData `tdsBase`(접두어 없는 이름)** 로
한다 — 순번이 바뀌어도 같은 페이지를 다시 찾아 멱등하다. 구분선은 `tdsBase` 가 없어 번호를 받지 않는다.

각 페이지의 루트는 `TDS Doc` 이름의 세로 Auto Layout 프레임 하나다 (x=0, y=0,
배경 fill은 `color/surface/default` Variable 바인딩). 재생성 시 페이지의 모든 자식을
지우고 루트부터 다시 만든다 — 문서 페이지 위에 수동 작업물을 두지 말 것.

## 2. 8pt 그리드

- 기본 단위 `GRID = 8`. 모든 프레임 치수·패딩·간격은 GRID 배수.
- 타이포·미세 간격은 4pt 서브그리드(`GRID/2`) 허용.
- 문서 크롬(제목/라벨) 타입 스케일은 고정 5단: **40 / 24 / 16 / 14 / 12**
  (title / section / group / body / caption). 12·14는 4pt 서브그리드 허용 항목이다.
- 헤어라인(구분선 strokeWeight 1)은 그리드 예외로 허용한다.
- 주요 치수 상수 (tds-doc.ts와 1:1):

| 상수 | 값 | 용도 |
|---|---|---|
| `PAGE_PAD` | GRID×8 = 64 | 루트 프레임 패딩 |
| `SECTION_GAP` | GRID×6 = 48 | 섹션 간 간격 |
| `CARD_GAP` | GRID×3 = 24 | 카드/행 간 간격 |
| `CONTENT_W` | GRID×140 = 1120 | 섹션 콘텐츠 폭 (wrap 기준 폭) |
| `SWATCH` | GRID×15 = 120 | 스와치 정사각 한 변 |
| `COVER_W × COVER_H` | GRID×160 × GRID×90 = 1280×720 | 커버 프레임 |
| `ARTBOARD_W × ARTBOARD_H` | GRID×180 × GRID×128 = 1440×1024 | Pages 데스크톱 아트보드 |

## 3. 커버 레이아웃 (`📕 Cover`)

1280×720 고정 프레임, 세로 Auto Layout, 패딩 GRID×10, 간격 GRID×4.

1. 액센트 바 — GRID×16 × GRID, fill = `color/action/primary/default` 바인딩
2. 타이틀 `TDS 디자인 시스템` — 40 Bold, fill = `color/text/default`
3. 서브타이틀 `TDS Documentation — Figma 미러 (Storybook과 동일 원천)` — 16, `color/text/muted`
4. 메타 블록 (14, `color/text/muted`, 줄 간격 GRID):
   - `버전: <meta.version | '-'>`
   - `생성일: <meta.generatedAt | 실행일 ISO(YYYY-MM-DD)>`
   - `SSOT: tokens/tokens.json · contracts/<Name>.contract.json`
   - `생성기: tools/figma-plugin (TDS Sync) — pnpm codegen 산출물만 입력`

## 4. 스와치 카드 규격 (`🎨 Foundations-Colors`)

섹션(그룹) 구성 — 페이로드 Variable 이름으로 자동 분류:

- **Semantic**: `color/<group>/…` → 그룹별 섹션 (`action`, `text`, `surface`, `border` …)
- **Primitive**: `primitive/color/<ramp>/…` → 램프별 섹션 (`blue`, `gray` …)
- **Component**: `component/<name>/…` 중 type=COLOR → 컴포넌트별 섹션

카드 규격 — 세로 Auto Layout, 간격 GRID/2, 폭 SWATCH 고정. 카드들은 CONTENT_W 폭의
가로 Auto Layout(WRAP, 간격 CARD_GAP)에 배치:

1. **스와치** — SWATCH×SWATCH 프레임. fill은 반드시
   `figma.variables.setBoundVariableForPaint(paint, 'color', variable)`로 해당 Variable에
   바인딩 (**Detach 0 원칙** — raw hex fill 금지). cornerRadius는 `radius/sm` Variable 바인딩,
   stroke는 `color/border/default` 바인딩 (밝은 스와치 대비 확보), strokeWeight 1.
2. **토큰 경로** — 12 Medium, `color/text/default`. 점 표기 (예: `color.action.primary.default`)
3. **hex** — 12, `color/text/muted`. 형식 `L #2563EB · D #60A5FA` (페이로드 values의 라이트/다크 raw 값을 데이터로 렌더링 — 허용)
4. **변수명** — 12, `color/text/muted`. 슬래시 표기 (예: `color/action/primary/default`)
5. (참조 토큰이면) **alias** — 12, `color/text/muted`. `→ <alias.light>` 형식

페이로드에 있는데 파일에 없는 Variable은 카드를 생략하고 경고 로그만 남긴다
(선행 단계 "토큰 → Variables 동기화" 누락 신호).

## 5. 타이포그래피 (`Aa Typography`)

### 5.1 폰트 컬러 섹션

`color/text/*` Variable 전수. 행마다: 샘플 텍스트 `가나다라 ABC 0123` (16, fill = 해당
Variable 바인딩) + 라벨(토큰 경로 · hex · 변수명, 12 muted). 행 배경은
`color/surface/default`, 하단 헤어라인 `color/border/default`.

### 5.2 타이포 스펙시먼 행 규격

페이로드에서 `typography/<role>/<size>/font-size` 패턴으로 램프를 수집하고, 같은
프리픽스의 `font-weight` / `line-height` / `font-family` 서브 Variable을 묶는다.
램프 항목마다 한 행:

1. **스펙시먼** — `한글 타이포그래피 Ag 0123` 텍스트.
   - fontSize: 토큰 값 적용 + `setBoundVariable('fontSize', …)` 바인딩
   - fontWeight: 토큰 값(400/500/700→Regular/Medium/Bold) 적용 + `setBoundVariable('fontWeight', …)` 바인딩 시도
   - fontFamily: 토큰 스택의 첫 패밀리(예: Pretendard)를 `loadFontAsync` 시도, 미설치면
     Inter로 대체하고 경고 로그
   - fill = `color/text/default` 바인딩
2. **메타 라벨** — 12 muted: `typography.label.md · size 14 · weight 500 · lh 1.2 · Pretendard, …`

**바인딩 예외 (명시 허용)** — Detach 0 원칙은 아래 2건을 예외로 한다. 둘 다 값 라벨을
병기해 드리프트 검수(디자인 드리프트)가 데이터로 대조할 수 있게 한다:

- `line-height`: 토큰이 배수형(1.2/1.5)이라 Figma FLOAT Variable(px 해석)과 단위가
  불일치 — 바인딩 대신 PERCENT(값×100)로 적용.
- `font-family`: 토큰이 콤마 스택 문자열이라 Figma 단일 패밀리 규약과 불일치 — 바인딩 생략.

### 5.3 폰트 패밀리 섹션

`primitive/typography/font-family/*` STRING Variable을 값 라벨 행으로 나열.

## 6. Spacing · Radius · Shadow (`📐 Spacing·Radius·Shadow`)

- **Spacing**: semantic `space/*` Variable을 값 오름차순으로. 행 = 라벨(`space/4 · 16px`,
  12) + 바(높이 GRID, 폭 = 토큰 값, fill = `color/action/primary/default` 바인딩,
  폭은 `setBoundVariable('width', …)` 바인딩 시도).
- **Radius**: `radius/*` 카드 — GRID×8 정사각, fill = `color/surface/raised`, stroke =
  `color/border/default`, 4개 코너 radius 전부 해당 Variable에 `setBoundVariable`
  (`radius/full`=9999는 원형으로 렌더링됨). 라벨 = 이름 + px 값.
- **Shadow**: `shadow/*` 또는 `elevation/*` Variable이 있으면 카드로 렌더링, 현재
  tokens.json에 셰도 토큰이 없으므로 안내 문구
  `shadow 토큰 없음 — tokens.json에 추가 시 자동 렌더링`을 남긴다.
- **Motion** (동일 원천 보너스 섹션): `motion/duration/*`(ms) · `motion/easing/*`
  (cubic-bezier 문자열) 값 라벨 행.

## 7. 컴포넌트 카드 (`🧩 Components — <카테고리>`)

입력: `generated/<Name>.figma.json` 배열. 카드 구조·순서의 **정본은 순수 계층**
(`tools/figma-plugin/src/spec/doc-layout.ts` 의 `planComponentCard()`)이며
vitest(`__tests__/doc-layout.test.ts`)가 블록 순서와 "prop 하나당 섹션 하나"를 못박는다.

페이지는 카테고리 제목 + 한 줄 설명으로 시작하고, 컴포넌트마다 **테두리 카드**(폭 GRID×68)를
가로 WRAP 으로 나란히 놓는다. 카드 안 순서:

1. **머리** — `<Name>`(24 Bold) + 한 줄 설명(계약 `summary`, 없으면 `description` 첫 문장) +
   칩 줄(`v<version>` · status · level · category). status=`stable` 만 초록
   (`color/feedback/success/*`), 나머지는 회색. 그다음 헤어라인.
2. **prop 섹션** — 계약 `properties` **선언 순서 그대로** 하나씩. 헤더는 prop 이름(16 Bold) +
   허용 값 칩들, 그 아래 한 줄 설명, 그 아래 값마다 렌더 칸(GRID×28)이 WRAP 격자로 깔린다.
   값 도출: `VARIANT`→values · `BOOLEAN`→`false`/`true` · `TEXT`/`INSTANCE_SWAP`→`없음`/`있음`.
   VARIANT 칸은 그 축만 바꾸고 나머지 축은 기본값으로 고정한 **실제 변형 인스턴스**를 놓는다.
3. **preview** — 투명(체커보드) · 기본 표면 · 융기 표면 세 무대 위의 같은 컴포넌트.
   체커보드는 이미지가 아니라 `color/surface/raised` 사각형을 격자로 깐 **실제 도형**이다.
4. **인터랙션 매트릭스** — `color/feedback/info/surface` 배경 + 파선 테두리로 구분되는 블록.
   열은 `Interaction` / `Active` / `Focus` / `Active+Focus` 고정, 행은 계약 `states`
   (열로 승격된 `active`·`focus-visible` 은 행에서 제외). 칸마다 조건 라벨을 적는다.
5. **Resource** — 컴포넌트를 이루는 원재료. 계약 `anatomy` 의 **직속 부위**를 회색
   (`color/surface/skeleton`) 패널에 부위 이름 그대로 하나씩 담는다.
6. **토큰 바인딩 목록** — 계약 tokens 블록을 용도별로 묶어 `키 · 토큰 경로`. Variable 이 파일에
   없으면 ` (미생성)`을 붙이고 경고 로그.
7. **Component Set** — sync-components 가 만든 실제 세트를 카드 안으로 재부모화한다.

## 8. Pages 프레임 (`📄 Pages`)

입력(선택): pages 메타 — 아래 형식의 JSON (작성 원천: `docs/plan/ui/SCR-NNN.md`의
Screen Spec ID. 수기 작성 파일이며 codegen 산출물이 아니다):

```json
{
  "$kind": "tds-pages",
  "pages": [
    { "id": "SCR-001", "name": "대시보드", "description": "관리자 홈" }
  ]
}
```

항목마다:

1. **SCR ID 라벨** — `SCR-001 · 대시보드` (16 Semibold, `color/text/default`),
   description은 14 muted로 아래 병기
2. **아트보드** — 1440×1024 프레임 (데스크톱), 이름 `SCR-001 — 대시보드`,
   fill = `color/surface/default`, stroke = `color/border/default`, clipsContent.
   내용은 비워 둔다 — 화면 조립은 Figma 레이아웃 소유.

pages 메타가 없으면 안내 카드 1장만 렌더링한다.

## 9. 섹션 헤더 스타일 (공통)

- 텍스트 24 Semibold(Inter), fill = `color/text/default`
- 아래 CONTENT_W 폭 헤어라인 (`color/border/default`, strokeWeight 1)
- 그룹(하위) 헤더는 16 Medium, 헤어라인 없음

## 10. Detach 0 원칙 · 필수 크롬 Variable

- 모든 fill/stroke 색은 Variable 바인딩으로만 칠한다. 코드에 색 리터럴 금지 —
  바인딩 전 플레이스홀더 페인트는 바인딩이 즉시 대체한다. hex/px **텍스트 라벨**은
  페이로드 값을 데이터로 렌더링하는 것이므로 허용.
- 문서 크롬이 요구하는 Variable (없으면 생성 중단 + 명확한 오류):
  `color/text/default` · `color/text/muted` · `color/surface/default` ·
  `color/surface/raised` · `color/border/default` · `color/action/primary/default`
- 따라서 실행 순서는 항상 **① pnpm codegen → ② 토큰 → Variables 동기화 → ③ TDS 문서 생성**.
- 예외 2건(5.2의 line-height/font-family)과 헤어라인 외의 Detached는 G7 검수(Figma 리뷰)의
  Detached 스캔에서 0건이어야 한다.

## 11. 입력 페이로드 (`generate-tds-doc` 메시지)

```jsonc
{
  "tokens":     { /* generated/tokens/figma-variables.json 그대로 */ },
  "components": [ /* generated/<Name>.figma.json 그대로, 0개 이상 */ ],
  "pages":      [ { "id": "SCR-001", "name": "대시보드" } ],   // 선택
  "meta":       { "version": "1.0.0", "generatedAt": "2026-07-14" } // 선택
}
```

플러그인 UI의 "TDS 문서 생성" 다중 파일 입력이 파일 내용을 자동 분류해 이 페이로드를
조립한다 (`collection+variables[]`→tokens, `properties[]`/`variantProperties`→components,
`pages[]`→pages). 붙여넣기 영역에 위 combined JSON을 직접 넣어도 된다.
