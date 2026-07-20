# SSOT 전수 감사 — 2026-07-20

여섯 영역(Storybook · Design System · Admin · Contracts · Tokens · Figma)의 상호 일치를 읽기 전용으로 감사했다. 코드 수정 0건.

**감사 6단 + 반박 패스 1회.** 모든 숫자에 근거 파일 경로가 있다. 확인하지 못한 것은 "확인 불가" 로 표시했다.

---

## 0. 한 줄 결론

**뿌리(계약 · 토큰 · Figma · 컴포넌트)는 거의 완성돼 있고, 결손은 전부 "표시면"과 "페이지 층"에 몰려 있다.**

원지침이 최우선(P0)으로 지목한 "화면이 DS 를 우회해 자체 제작한 UI 더미" 는 **존재하지 않았다.** 이전 세션들이 이미 승격을 마쳤고 `apps/admin/src/shared/ui/index.ts` 는 사본 더미가 아니라 `@tds/ui` 재수출 배럴이다.

---

## 1. 컴포넌트 대조표 (4집합 차집합)

| 집합 | 수 | 근거 |
|---|---|---|
| 계약 | 44 | `contracts/*.contract.json` |
| DS 구현 | 45 | `packages/ui/src/{atoms,molecules,organisms}` |
| 스토리 | 45 | 동 디렉터리 `*.stories.tsx` |
| Figma | 44 | `tools/figma-plugin/generated/*.figma.json` |

| 차집합 | 개수 | 원소 |
|---|---|---|
| 계약 O / 구현 X | **0** | — |
| 구현 O / 계약 X | 1 | `TableReorder` |
| 구현 O / 스토리 X | **0** | — |
| 계약 O / Figma X | **0** | — |
| Figma O / 계약 X | **0** | — |

계약 ≡ Figma ≡ `generated/argtypes` ≡ `generated/types` 는 이름 기준 **완전 동일(diff 무출력)**.

**컴포넌트 동기화율 44/45 = 97.8%.** 유일한 이탈 `TableReorder` 는 실제 API 가 순수 훅(`useReorderableRows`)이라 단일 컴포넌트 계약 스키마로 표현되지 않는 **의도적 예외**다 (`TableReorder.stories.tsx:3-5` 에 사유 명시). 결함이 아니다.

### 계층 분포

| 계층 | 수 | 비고 |
|---|---|---|
| atoms | 15 | 3가지 방법 교차검증 일치 |
| molecules | 27 (디렉터리 23) | 차이 원인 규명됨 — `FilePicker/` 2파일, `TableSelection/` 3파일, `RichTextField/` 2파일 |
| organisms | 5 | 일치 |
| **templates** | **0** | `README.md` 한 장뿐 — 실체 없음 |

---

## 2. Admin 로컬 컴포넌트 표 (P0)

| 지표 | 값 | 근거 |
|---|---|---|
| `apps/admin/src` tsx (테스트 제외) | 288 | `find` |
| **DS 도달** (직접 + 배럴) | **241 / 288 = 83.7%** | grep 2방식 교차확인 |
| DS 미도달 | 47 | 전부 정당 — 아이콘 모듈 · 라우팅 가드 · 훅 · 순수 SVG · 진입점 |
| 로컬 컴포넌트 파일 | 140 | |
| 내보낸 컴포넌트 심볼 | 350 | `export function` 346 + `export const` 4 |

**"DS 를 써야 하는데 안 쓴 페이지" 는 발견되지 않았다.**

### 통제된 DS 우회 1건

raw `<table>` **27건** 이 `DataTable` 을 우회한다(DataTable 참조는 3파일뿐). 다만 27/27 전부 `shared/ui/styles.ts` 의 공유 `tableStyle`/`thStyle`/`tdStyle` 을 쓰므로 **시각적 divergence 는 없다.** 이관 비용 대비 편익은 **계산하지 않았다** — 판단 필요 항목.

### 토큰 규율 (Admin)

raw px **0건**(12건은 전부 주석 안) · rgb/hsl **0건** · hex 25건은 전부 타사 브랜드 마크 2파일(의도적 예외, 린트 disable 범위 지정됨).

---

## 3. Pages 대조표

| 지표 | 수 | 비율 |
|---|---|---|
| Admin 라우트 (화면 131 + `/login`) | 132 | 100% |
| Storybook Page 있음 | 3 | 2.3% |
| **그중 DS 로 조립된 진짜 구현** | **0** | **0.0%** |
| 플레이스홀더 | 3 | 100% |
| Storybook Page 없음 | 129 | 97.7% |

`packages/ui/pages` 17개 파일 **전부 DS import 가 0건**이다 (Grep 전역 무매치). 추측이 아니라 파일이 스스로 선언한다 — `DashboardPage.stories.tsx:11` `TODO: 모듈 G5 통과 후 실제 컴포넌트로 교체`. 세 파일 모두 `ModuleSlot`(점선 테두리 `<div>`)에 라벨만 넣는다.

17개의 내역: 화면 스토리 3 + 메뉴 목차 스토리 13(화면 아님) + 공용 데이터 모듈 1.

### 3자 대조

- **tds-pages.json 62 ↔ Admin `implemented:true` 62 = 완전 일치** (양방향 차집합 공집합)
- **`packages/ui/pages/_data/pages.ts` 65 가 정본과 어긋난다** — 이번 감사의 실질 불일치

`pages.ts` 에만 있고 라우트에 없는 5개: `/reservations`, `/reservations/applications`, `/reservations/consultations`, `/reservations/schedule`, `/settings/languages`
라우트에 있고 `pages.ts` 에 없는 2개: `/ai/chat`, `/ai/conversations`

`pages.ts` 는 수동 복사본이다(`L5-9` 에 명시). eslint `banApps` 로 import 가 구조적으로 금지돼 **CI 가 원리적으로 이 표류를 잡지 못한다.**

Admin 라우팅 자체는 건강하다 — nav 리프 62 ↔ implemented 62 일치, 죽은 링크 0건.

---

## 4~7. Coverage 요약

| 축 | 총계 | 충족 | 누락 | 근거 |
|---|---|---|---|---|
| **Props** | 227 | 227 | **0** | `generated/types/*` 44/44 정확 일치 |
| Events | 40 | 40 | 0 | 동 |
| **Variant** (enum prop 13 / 값 100) | 100 | 100 | **0** | Icon 59종 = `generated/icons/icon-geometry.ts` 1:1 |
| **States** | 135 | 135 | **0** | 자동 127 + 수동 8 확인 |
| **Token** (리프 248) | — | dangling **0** | — | 계약→토큰 103 distinct, 내부 alias 122 distinct, 양쪽 0 |
| argTypes 프롭 노출 | 44 | 44 (100%) | 0 | 수기 아닌 generated spread |

**미사용 토큰 14건**: primitive 색 10종 + `breakpoint.sm/md/lg` + `shadow.sticky`.
`breakpoint.*` 3종은 CSS `@media` 가 `var()` 를 받지 못하는 구조적 한계라 미사용이 정상일 수 있다 — **판단 보류.**

### DS 토큰 규율

CSS hex **0** · px 리터럴 **0** · rgb() **0** · tsx 내 hex **0**. 45개 CSS 전부 `var(--tds-*)` 만 참조한다. `foundations/TokenGuard.test.ts` 가 강제하며 자기 무력화 방지 로직(빈 스텁 위 통과 금지)까지 있다.

---

## 8. Figma Coverage

| 검사 | 결과 |
|---|---|
| 계약 44 ↔ figma.json 44 ↔ manifest | 차집합 양방향 **0** |
| **checksum** | **44/44 일치** (알고리즘 독립 재구현으로 재계산) |
| variantPropertyCount / version 3자 | 44/44 |
| 플래그 반영 | **108/108, 미반영 0** |
| variant 축 83 / 조합 945 — enum 값 · 기본값 | 불일치 **0** |
| repeat 15건 | samples 12 + uniformRepeat 3 + **무방비 0** |
| 자기 검사 6항목 | **6/6 구현** (`render/self-check.ts`) |
| 문서 ↔ 구현 | 지목 파일 전부 실재, 불일치 **0** |

### Token ↔ Figma Variables

248 leaf → 263 Variable (1:1 매핑 223 + typography 합성 10 → 40 전개).

**미매핑 15건은 누락이 아니다** — `generate-figma-variables.ts:398,407` 에 명시적 skip + 사유 주석. shadow 12(box-shadow 합성값은 Variable 스펙에 대응 없음) + print 3(mm 물리 단위).

**남는 갭**: 이 15개는 Figma 쪽에 정본이 없으므로 디자이너가 그림자 · 인쇄 규격을 Figma 에서 참조할 수단이 없다.

---

## 9. Storybook 8축 커버리지

| 축 | 커버 | 상태 |
|---|---|---|
| Controls | 44/44 | generated argTypes spread |
| Variant / States / Dark | 45/45 | 45개 전부 `DarkTheme` export |
| RTL | 39/45 | 결번 6 |
| **Docs (autodocs)** | **0 / 91** | `tags:['autodocs']` 리포 전체 0건 |
| **MDX** | **0 / 47** | `.mdx` 파일 0개 |
| **Playground** | **0 / 91** | 문자열 0건 |
| **Responsive (viewport)** | **0 / 91** | |
| **A11y 스토리 파라미터** | **0 / 91** | addon 은 `main.ts:11` 에 설치, 사용 0 |

RTL 결번 6: ImageGalleryField · ImageUploadField · Timeline · Toast · ConfirmDialog · Modal

### 스토리 91의 내역 (완전 규명)

```
91 = 45 컴포넌트 + 23 카탈로그 + 7 파운데이션 + 16 페이지
```

**44개의 완벽한 generated argTypes 가 Controls 패널에만 쓰이고 Docs 로는 렌더되지 않는다** — 투자 대비 회수가 가장 큰 미완 지점.

---

## 10. DS 승격 대상 + 우선순위

| 순위 | 대상 | 근거 | 처방 |
|---|---|---|---|
| **P0** | `shared/ui/brand-marks.tsx` ↔ `settings/oauth/components/provider-marks.tsx` | hex 팔레트 11값 완전 동일, **이미 divergence 발생**(`line` 브랜드 유무) | **DS 승격 아님 — shared/ui 단일화.** 브랜드 색은 토큰화 불가(`brand-marks.tsx:18-31` 의 논거 타당) |
| **P1** | Menu / Dropdown | 계약 44개에 **없음**, 독립 구현 4건, **a11y 이미 갈라짐** | **ActionMenu 기준**으로 계약 신설 |
| **P2** | Stepper | `ReturnStatusStepper` ↔ `PipelineStepper` 94줄 중 차이 14줄 전부 도메인 명칭, 스타일 60줄 바이트 동일 | 계약 신설 |
| P3 | `FilterPanel` / `FilterRail` | 소비자 11/12, DS 대응 없음 | 승격 후보 |
| P3 | `VersionHistoryTable` | 소비자 2, DataTable 유사 | |

### Menu a11y divergence — 최약체를 계약으로 삼으면 퇴행한다

| 구현 | 화살표키 | Esc | menuitem | Home/End |
|---|---|---|---|---|
| `members/components/ActionMenu.tsx:167` | O | O | O | O |
| `settings/api-keys/components/IntegrationOverflowMenu.tsx:149` | **X** | O | O | O |
| `ai/components/ModePicker.tsx:212` | — | — | O | — |
| `marketing/.../email/VariableMenu.tsx` | **X** | **X** | **X** | **X** |

`IntegrationOverflowMenu.tsx:3-5` 는 "소비자가 한 곳뿐이라 안 올렸다" 고 적었으나 **ActionMenu 라는 두 번째 구현을 인지하지 못했다.** 리포 자신의 승격 규율("두 번째 소비자가 생길 때 올린다")이 이미 발동된 상태다.

---

## 11. 결함 판정 — 반박 패스 결과

감사가 올린 결함 **18건 중 14건이 가짜**였다. 반박 패스가 걷어냈다.

| 대상 | 판정 | 잔존 |
|---|---|---|
| anatomy style 별칭 미해소 8건 | **반증 성공 — 가짜** | 0 |
| a11y role 불일치 4건 | **반증 실패 — 진짜** | 4 |
| 계약외 prop 6건 | **반증 성공 — 가짜** | 0 |

### 왜 가짜였나

- **anatomy 별칭** — 해소 경로가 `tokens[key]` / `variantTokens[...]` 둘뿐이라고 추측했으나, `tools/figma-plugin/src/spec/tokens.ts:23-32` 의 `tokenKeyCandidates` 가 접미형(`surface`+`Danger`→`surfaceDanger`)과 **접두형**(`neutral`+`Surface`→`neutralSurface`) 후보를 둘 다 생성한다. 스키마에도 명시돼 있다(`component.v1.json:308`: "기본 키만 적으면 된다"). 게다가 `spec/__tests__/contracts.test.ts:128` 이 **44개 전수를 이미 검사 중이고 63 tests 통과**한다.
- **계약외 prop** — 계약 description 본문이 명시적으로 허용한다. Modal: "[imperative props — 계약 밖 컴포넌트 경계] onClose(필수)·onSubmit·initialFocusRef 는 명령형 배선이라 Figma Component Property 대응이 없다". Toast `id`, SelectField `required`(네이티브 패스스루)도 동일.

**오판 패턴은 매번 같았다: 소비자 코드를 읽지 않고 계약 JSON 만 보고 규칙을 추측했다.**

### 진짜 결함 4건 — a11y role

| 계약 | 선언 | 실제 루트 | 위치 |
|---|---|---|---|
| ColorField | `role: "group"` | `<div className="tds-colorfield">` role 없음 | `ColorField.tsx:65` |
| DateRangeField | `role: "group"` | `<div className="tds-daterange">` role 없음 | `DateRangeField.tsx:54` |
| FileChip | `role: "group"` | `<span className="tds-filechip">` role 없음 | `FileChip.tsx:35` |
| FormField | `role: "group"` **↔ 같은 계약의 `aria["no-container-role"]` 가 반대를 명시** | `<div className="tds-formfield">` role 없음 | `FormField.tsx:105` |

반증 시도는 모두 실패했다 — 조건부/스프레드 주입 없음, `<fieldset>` 암묵 충족 없음, `getByRole('group')` 검사 리포 전체 **0건**.

**성격**: `a11y.role` 은 어떤 게이트도 강제하지 않고 소비자는 `generate-docs.ts:129` 문서 표 하나뿐이다. 즉 **런타임 접근성 결함이라기보다 계약/문서 정합성 결함**이다.

**FormField 는 방향이 반대다 — 고칠 곳이 구현이 아니라 계약이다.** 일괄로 `role="group"` 을 다는 것은 FormField 에서 명백히 틀린 처방이다.

전수 재확인 결과 **새로 발견된 role 결함 0건**. 1차로 10건이 걸렸으나 6건은 합성 상속 오탐이었다(ConfirmDialog→Modal, PasswordField→TextField, SelectAllHeaderCell→TriStateCheckbox, ListCard/StatsCard/TodoCard→Card 의 `<section>`).

---

## 12. 미확인 목록

**비워 두지 않는다.** 아래는 이번 감사가 확인하지 못한 것이다.

### 원리적으로 확인 불가 (오너 검수 필요)
- **Figma 플러그인 실행 전부** — 945개 변형 조합 실제 생성, Variable 바인딩률(Detached 0), light/dark 2모드 생성, 폰트 폴백 로드. 자기 검사 기록은 `figma.root` 플러그인 데이터에만 남아 리포에 나올 수 없다.
- 스토리 렌더 결과의 시각적 정확성

### 실행하지 않아 미확인
- **감사 중 테스트를 한 번도 돌리지 않았다.** `.test.tsx` 46개 존재만 확인. (반박 패스만 `contracts.test.ts` 를 실행해 63 통과 확인)
- **Storybook 을 빌드/기동하지 않았다.** glob 이 91개를 잡는다는 것은 경로 패턴 대조이지 실제 인덱싱 결과가 아니다.
- `packages/ui/generated/tokens/tokens.css` 존재 여부 — **없으면 Storybook 이 아예 뜨지 않는다** (`preview.ts:10`)
- 41개 `play` 함수 통과 여부, a11y addon 의 실제 위반 리포트 여부

### 표본만 확인
- **140개 Admin 로컬 컴포넌트 중 정독은 12개뿐.** 나머지 128개의 "무엇을 그리는가" 는 파일명·시그니처 기반 추론이다. "도메인 조립체이므로 정상" 은 표본 판정이다.
- 262개 페이지 tsx 각각이 라우트에 닿는지 전수 대조하지 않았다 — **"고아 페이지 0건" 은 주장하지 않는다.**
- 47개 컴포넌트 `.tsx` 본문 중 props/상태 구간만 발췌했다. 렌더 로직 세부는 미확인.
- catalog 23 + foundations 7 스토리는 파일명·개수만 셌고 내부는 열지 않았다.

### 구조적으로 대조 불가
- **anatomy 노드 ↔ React DOM 구조 일치.** anatomy 는 Figma frame/text 트리이고 React 는 `tds-*` 클래스 트리다. 이름↔클래스명 매핑 규약이 리포에 정의돼 있지 않다. anatomy 의 *토큰 바인딩 정합성* 만 전수 검증했다.
- **계약의 `a11y.keyboard[]` / `aria{}` 하위 항목.** 자유 서술 산문이라 기계 대조 불가.

### 존재하지 않아 확인 불가
- **이전 감사의 "결손 90건 / P0 4 / P1 45 / P2 28" 문서가 리포에 없다.** `specs/`·`docs/`·`reports/`·`orchestration/tasks/` 전수 탐색 결과 부재. 유일한 흔적은 코드 주석이다 — `CrudListShell.tsx:110-111` "감사 결과: 30개 중 3개만 배선, 그 3개조차 canCreate 만 봤다".
  **→ 감사는 실재했으나 산출물이 코드 주석으로만 남았다. P1 45건 · P2 28건의 실제 목록은 재작성이 필요하다.**

---

## 13. 감사가 스스로 정정한 것

기록을 남긴다 — 반박 패스가 없었으면 이것들이 전부 결함 목록에 올라갔다.

| 1차 결과 | 정정 | 원인 |
|---|---|---|
| figma.json 43/44 불일치 | **0건** | `properties` 가 배열인데 객체로 취급 |
| repeat 무방비 8건 | **0건** | `samples` 가 repeat 노드가 아니라 하위 text 노드에 있음 |
| Toast/ToggleSwitch 토큰 오탐 | 정상 | `variantTokens` 3단 중첩을 2단으로 순회 |
| distinct 토큰 참조 84 | **103** | `variantTokens` 누락 |
| anatomy 별칭 8건 결함 | **가짜** | `tokenKeyCandidates` 미독해 |
| 계약외 prop 6건 결함 | **가짜** | 계약 description 본문 미독해 |
| tds-pages 63개 | **62개** | 최초 계수 오류 |
| a11y role 10건 | **4건** | 6건은 합성 상속 오탐 |

---

## 14. 남은 작업 (감사 확정 물량)

| # | 작업 | 물량 | 비고 |
|---|---|---|---|
| 1 | a11y role 결함 | 4 | 건별 판단 필요 (FormField 는 계약 수정) |
| 2 | a11y role 게이트 신설 | 1 | `axes/react.ts` — 현재 검사 없음 |
| 3 | Admin CTA 게이팅 | 19 화면 | 참조 구현 `ProductListPage.tsx:119,256` |
| 4 | 발송 플로우 편집 게이팅 | 3 화면 + 어댑터 | `isEditableSend` 소비자 0 |
| 5 | Storybook MDX | 47 | |
| 6 | Storybook Playground / Responsive / a11y 파라미터 | 각 45 | |
| 7 | Storybook RTL 결번 | 6 | |
| 8 | **Storybook 페이지** | **129 신규 + 3 재작성** | 최대 물량 |
| 9 | DS 승격 (Menu · Stepper) + brand-marks 단일화 | 3 | |
| 10 | `pages.ts` ↔ `nav-config.ts` 동기화 검사 | 1 | CI 가 원리적으로 못 잡는 영역 |
| 11 | P1 45건 · P2 28건 목록 재작성 | — | 원 문서 부재 |
| 11b | **`/new` 폼 라우트 deep-link 게이팅** | 미확정 | 아래 참조 |
| 12 | templates 계층 | 0 → ? | 실체 없음 |
| 13 | VRT 기준 이미지 | 13/646 | |
| 14 | **`pnpm lint` 커버리지 공백** | 12 패키지 | 아래 참조 |
| 15 | 계약 anatomy — 기호 5건 · strokeWeight 6건 | 11 | Figma 트랙이 발견, 상류라 미수정 |
| 16 | 테스트 flakiness | — | 격리 실행은 통과, 병렬 실행은 실패 |

### 14 상세 — lint 가 도는 곳은 2/14 패키지뿐

`pnpm lint` 는 turbo 로 14개 패키지를 순회하지만 **실제로 eslint 가 도는 것은 `@tds/ui` 와 `@tds/admin` 둘뿐이다.**

전수 확인(각 `package.json` 의 `scripts.lint` 존재 여부):

```
YES  @tds/admin          apps/admin/package.json
YES  @tds/ui             packages/ui/package.json
no   @tds/a11y           @tds/code-quality   @tds/codegen
no   @tds/contract-test  @tds/drift          @tds/figma-plugin
no   @tds/naming-guard   @tds/perf           @tds/reuse-guard
no   @tds/test-coverage  @tds/vrt            @tds/boundary(로컬 전용)
```

**Airbnb 0-warning 기준이 도구 계층 전체에 적용되지 않고 있다.** figma-plugin 은 `main.ts` 576줄 · `tds-doc.ts` 2582줄로 리포에서 가장 큰 소스 중 하나인데 린트를 한 번도 통과한 적이 없다. `pnpm lint` 가 "2/2 successful" 로 초록을 내는 것이 **12개 패키지를 건너뛴 결과**라는 사실이 게이트 출력만 봐서는 드러나지 않는다.

---

### 11b 상세 — 등록 CTA 를 가려도 폼은 열린다

CTA 게이팅 작업 중 **범위 밖에서 발견**됐다. 등록 버튼을 `canCreate` 로 가려도 **`/new` 폼 라우트 자체는 여전히 열린다.** `RequirePermission` 이 read 권한만 보기 때문에, 권한 없는 운영자가 URL 을 직접 입력하면 폼에 도달한다.

- **버튼 가리기는 UI 정리이지 접근 통제가 아니다.** 실제 차단은 라우트 가드나 어댑터에 있어야 한다.
- 발송 플로우 쪽은 이 교훈이 이미 반영돼 있다 — 화면 게이팅과 함께 어댑터 `update` 에서 422 로 거절하도록 작업 중이다. `products/returns/data-source.ts:145-155` 가 그 본보기다.
- **미확인**: 12개 화면 각각에서 deep-link 가 실제로 폼을 여는지 브라우저로 확인하지 않았다. 코드 구조상 그렇다는 판정이다.

---

## 부록: 감사 방법

6개 병렬 읽기 전용 감사 + 반박 패스 1회. 각 감사는 자기 결과를 **다른 방법으로 두 번 세어** 교차 확인했고, 불일치가 나면 원인을 규명할 때까지 확정하지 않았다.

반박 패스는 결함 3축에 대해 **"이 결함은 가짜다" 를 기본 자세로** 반증을 시도했고, 반증에 실패한 것만 진짜로 인정했다.

프로세스 규약은 `docs/architecture/ssot-pipeline.md`(단 순서 · 인수인계)와 `docs/architecture/work-cycle.md`(사이클 · 원장 · 게이트 · 함정)에 있다.
