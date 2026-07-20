---
id: NFR-036
title: "메시지 템플릿 비기능 명세"
functionalSpec: FS-036
backendSpec: BE-036
qualityBar: specs/quality-bar.md
owner: 명세 리뷰
reviewer: 기능 명세
gate: G9
status: draft
version: 2.0
date: 2026-07-18
---

# NFR-036. 메시지 템플릿 비기능 명세

> **2.0 개정 (2026-07-18) — 채점 대상이 바뀌었다.**
> 1.0 은 알림톡 심사 모델(`pages/marketing/templates/**`)을 채점했다. `/marketing/templates` 는 이제 **메시지 템플릿**(`pages/marketing/message-templates/**`)이 서비스한다. **1.0 의 판정을 하나도 재사용하지 않았다** — 표면이 다르고(상세 화면·이메일 블록 빌더가 생겼다) 공용 셸도 다르다(`FormPageShell` → 화면이 소유한 `TemplateEditorShell`). 1.0 이 pass 로 뒤집었던 것 중 **EXC-04 는 다시 gap 이 된다** — 상태 변경 경로가 어댑터 밖으로 나갔기 때문이다(§2 · §5 #1).

## 1. 이 문서의 위치

| 항목 | 내용 |
|---|---|
| 대상 화면 | FS-036 메시지 템플릿 (`/marketing/templates` · `/new?kind=` · `/:id` · `/:id/edit`) |
| 상위 기준 정본 | `specs/quality-bar.md` — 9차원 100요구(P0 30건). **이 문서는 그 요구를 재서술하지 않는다.** 요구 문구는 ID 로만 참조한다 |
| 이 문서의 역할 | quality-bar 의 **이 화면 적용본**. '이 화면에서 어떻게 충족되는가 / 무엇을 재현하면 판정되는가' 만 적는다 |
| 함께 읽는 문서 | FS-036(요소·예외) · BE-036(엔드포인트 · **상태 전이표 판정** · 이메일 블록 검증) · BE-003 §2·§3(에러 봉투·권한) |
| 갱신 규칙 | quality-bar 가 바뀌면 §2 표를 다시 채점한다. 화면 코드가 바뀌면 gap 행의 근거(파일:라인)를 다시 확인한다 |
| 판정 시점 | **2026-07-18** · 작업 트리 기준 코드 대조. **1.0(`a5c2639`, 알림톡 모델) 판정을 재사용하지 않고 30행 전수 재채점했다.** 이 화면은 **표면이 넓어졌다** — 목록(1) + 상세(1) + 편집기(2종) + 이메일 블록 빌더(13파일)로, 1.0 의 2화면 체제보다 채점 대상이 많다. **E2E 미실행 — 판정 근거는 전부 코드 대조다** |

### 1.1 표기 규약

| 기호 | 뜻 |
|---|---|
| 적용 `직접` | 이 화면(전용 모듈) 또는 **이 화면이 소비하는 공용 CRUD 프레임워크**(`shared/crud`)의 코드가 충족을 결정 — 판정 책임이 이 문서에 있다 |
| 적용 `상속` | AppShell·DS(`@tds/ui`)·앱 전역 배관이 결정하고 이 화면은 소비자 — **이 화면에 그 표면이 실재할 때만** 적는다 |
| 적용 `N/A` | 표면(appliesTo)이 이 화면에 없다 — **반드시 사유** |
| 판정 `pass` | 코드 근거로 충족 확인 |
| 판정 `gap` | 미충족 확인 — §5 로 이관. **P0 의 gap 은 quality-bar '배치 실패' 사유** |
| 판정 `종속` | `상속` 항목 — 소유 문서/DS 판정을 따른다 |

> **`직접` 에 `shared/crud` 를 포함하는 이유**: 목록은 `useCrudList`+`CrudListShell` 에, 편집기는 `useCrudForm` 에, 상세는 `useCrudItem`+`useCrudDelete` 에 데이터 배선을 위임한다. 그 훅을 **소비하는 선택**(그리고 상태 변경만 그 밖으로 뺀 선택)이 이 화면의 것이므로 충족·미충족의 책임을 이 문서가 진다. **반대로 편집기 셸은 공용이 아니다** — `FormPageShell` 대신 화면이 소유한 `TemplateEditorShell`(`TemplateEditorShell.tsx:104-175`)이라 셸 관련 요구(IA-07·IA-08 등)는 이 화면이 직접 책임진다.

## 2. P0 30건 — 이 화면 적용 판정 (전수)

| 요구 ID | 차원 | 적용 | 이 화면에서의 충족 방식 (코드 근거) | 측정 기준 (재현 절차) | 판정 |
|---|---|---|---|---|---|
| STATE-01 | STATE | 직접 | **목록 축 충족 · 상세/편집기 축 미충족.** 목록은 `useCrudList` 가 `firstLoading = isFetching && data === undefined` 로 스켈레톤을 최초 로드에만 묶고(`useCrudList.tsx:133`) `refreshing` 을 따로 준다(`:134`) — 4상태 배타가 성립한다. **그러나 상세와 편집기에는 '로딩' 상태 표현이 아예 없다**: 상세는 `if (template === undefined) return null`(`MessageTemplateDetailPage.tsx:247`), 편집기 라우트는 `if (detail.data === undefined) return null`(`MessageTemplateEditorPage.tsx:64`). 도착 전 화면이 **빈 흰 판**이다. 편집기 라우트의 그 선택에는 근거가 있으나(`:62-63` — 먼저 그렸다가 갈아치우면 입력이 사라진다) **그 근거는 '스켈레톤도 그리지 말라'는 뜻이 아니다** | `/marketing/templates` 최초 진입 → 스켈레톤만 ✓. `/marketing/templates/mt-text-active` 진입 → **`LATENCY_MS = 400`(`shared/crud/dev.ts:12`) 동안 사이드바만 있고 본문이 비어 있다**(스켈레톤·스피너·문구 0건). `/marketing/templates/mt-email-active/edit` → 동일 | **gap** (목록 축 pass) |
| STATE-02 | STATE | 직접 | 실패가 전부 **인라인**이다. 목록 조회 실패는 danger `Alert` + '다시 시도'가 표·요약·선택바를 대체(`CrudListShell`). 편집기 로드 실패는 화면 대체 Alert 이고 **404 와 5xx 를 문구·복구수단으로 가른다**(`TextTemplateEditor.tsx:250-271` · `EmailTemplateEditor.tsx:149-170`). 상세 로드 실패도 인라인 Alert(`MessageTemplateDetailPage.tsx:234-245`). 저장 실패는 `FormServerError`(`TextTemplateEditor.tsx:313`). **토스트로 처리하는 실패 0건** | `?fail=marketing-message-templates:list` → 인라인 danger Alert + '다시 시도', 토스트 0건. `?fail=marketing-message-templates:detail` + `/:id/edit` → 편집기 자리에 인라인 Alert. `?fail=…:save` → 셸 상단 배너 | pass |
| STATE-04 | STATE | 직접 | **선택 리셋 축**: 검색어·종류·상태 중 하나라도 바뀌면 `clear()` 로 행 선택을 전부 해제한다(`MessageTemplateListPage.tsx:138-140`). 일괄 삭제 전원 성공 시에도 해제(`useCrudList.tsx:205`). **page clamp 축**: 페이지네이션이 없어 page 상태가 존재하지 않는다 — clamp 대상이 없다(공전). 부재 자체는 IA-04 로 판정 | 3행 선택 → 종류 필터를 'Email' 로 변경 → 선택 바가 사라진다. 상태 필터·검색어도 동일. **clamp 는 재현 대상이 없다** | pass |
| TOKEN-01 | TOKEN | 직접 | **하드코딩 0건이다.** 이 화면 39개 소스의 `CSSProperties` 값이 전부 `var(--tds-*)` 또는 `calc(var(--tds-space-*) * n)` 이다. **이메일 블록의 색은 예외가 아니라 데이터다** — 그 값들은 화면 스타일이 아니라 **발송되는 메일의 데이터**이고(`store.ts:65-68` — 수신자의 Gmail 에는 우리 스타일시트가 없어 `var(--tds-…)` 는 통째로 사라진다), 린트를 끄는 대신 `hexColor('1F2033')`(`email/blocks.ts:22-24`)로 **표현을 통해 구분한다**(`:7-12` 가 그 판단을 남긴다) | 39개 소스에 `#[0-9a-f]{3,8}` **문자열 리터럴** grep = **0**(히트는 `hexColor()` 호출과 `#{변수}` 토큰뿐). `[0-9]px` grep = **0**(히트 5건 전부 주석 — `styles.ts:50` · `email/blocks.ts:58` · `email/controls/PaddingField.tsx:22` · `validation.ts:47` · `components/ImageAttachRow.tsx:9`). ESLint 0 warning | pass |
| TOKEN-02 | TOKEN | 상속 | 이 화면의 포커스 가능 표면이 `className="tds-ui-focusable"` 로 DS 포커스 링을 상속한다 — 편집기 백링크·제목 입력(`TemplateEditorShell.tsx:120,137`) · 발송 회선 칩(`TextTemplateEditor.tsx:290`) · 상세 백링크·삭제 버튼(`MessageTemplateDetailPage.tsx:257,285`) | DS 소유 문서 판정. 이 화면에서는 **테두리가 투명한 제목 입력**(`TemplateEditorShell.tsx:65`)의 focus-visible 링이 DS 버튼과 픽셀 동일한지만 확인 | 종속 |
| TOKEN-03 | TOKEN | 상속 | 성공 통지(저장·삭제 토스트)가 전부 `ToastProvider` 를 지나 Toast entrance easing 계약을 상속한다 | DS 소유 문서 판정. 저장 성공 토스트가 entrance 애니메이션을 재생하는지만 확인 | 종속 |
| TOKEN-04 | TOKEN | 상속 | 부상 표면 — `Card`(3단 레이아웃의 카드 다수) · `Modal`/`ConfirmDialog`(종류 선택·블록 피커·삭제 확인·충돌·미저장 가드) · Toast — 이 DS shadow 토큰을 상속한다 | DS 소유 문서 판정. **종류 선택 다이얼로그와 블록 피커**가 light/dark 양쪽에서 부상하는지만 확인 | 종속 |
| TOKEN-05 | TOKEN | 상속 | 상세의 `<h1>` 이 title.xl tier 를 쓰고(`MessageTemplateDetailPage.tsx:96-99`) **편집기의 제목 입력도 같은 tier 를 쓴다**(`TemplateEditorShell.tsx:67-70`) — 입력이지만 시각적으로 h1 이다. AppHeader `<h1>` 도 같은 계층 | DS/토큰 소유 문서 판정. **편집기의 큰 제목이 `<h1>` 이 아니라 `<input aria-label="템플릿명">` 이라는 사실은 IA-02 로 판정** | 종속 |
| COMP-10 | COMP | 직접 | `MessageTemplateListPage.tsx:120` 이 `useListState({ filterDefaults })` 를 쓰고, 화면이 `{...list.searchInputProps}` 를 `SearchField` 에 **스프레드한다**(`:161`, 주석 `:160` 이 그 의도를 밝힌다). 그 props 가 `useDebouncedSearch` 의 세 축을 잇는다 — 조합 중 커밋 금지 · 디바운스 · 조합 중 Enter 차단. stale 응답 경합은 react-query 가 키워드를 쿼리 키에 넣어 이미 닫혀 있다 | 검색창에 '주문' 을 IME 로 입력 → 'ㅈ'·'주'·'주ㅁ' 단계에서 커밋 **0건**, 조합 확정 후 **1회** 커밋 → `?q=주문`. 조합 중 Enter → 부분 문자열 커밋 0건. **grep 주의**: `MessageTemplateListPage.tsx` 에 `useDebouncedSearch` 직접 import 는 0건 — 소비는 `useListState` 경유다 | pass |
| FEEDBACK-02 | FEEDBACK | 직접 | **두 자리 모두 게이트된다.** 목록은 `useCrudList` 의 `ConfirmDialog`(`intent="delete"`) — busy 중 확인 버튼 잠금, 실패 시 다이얼로그를 **열어둔 채** error 배너, 재클릭이 retry. **상세는 자기 것을 직접 소유한다**(`MessageTemplateDetailPage.tsx:389-400`)지만 같은 계약을 지킨다: `busy={remove.isPending}` · `error={deleteError}` · 취소·닫기가 in-flight 요청을 abort 하고 상태를 리셋(`:204-210`) · 실패 시 닫지 않고 배너(`:226-229`) | `?fail=marketing-message-templates:delete` → 목록 행 삭제 → 다이얼로그 유지 + danger 배너, 재클릭이 재요청 ✓. **상세에서 삭제 → 같은 동작** ✓. 요청 중 취소 → 토스트 없이 닫히고 상태 복원 ✓ | pass |
| FEEDBACK-04 | FEEDBACK | 직접 | 두 편집기가 각각 `useUnsavedChangesDialog(isDirty && !saving, { message })` 를 배선한다(`TextTemplateEditor.tsx:138` · `EmailTemplateEditor.tsx:109`, 문구 `:35-36`/`:33-34`). 훅이 3경로를 덮는다 — beforeunload · capture-phase 링크 가로채기 · popstate sentinel. 저장 성공 시 not-dirty 가 되어 가드가 풀린다. **이메일 편집기에서 특히 값지다** — 블록 스택 전체가 폼 값 하나(`content`)라 이탈하면 전부 잃는다 | 이메일 편집기에서 블록을 하나 넣은 뒤 ① 탭 닫기 ② 사이드바 링크 ③ 브라우저 Back → 각각 discard 다이얼로그. 저장 성공 후 같은 이동 → 프롬프트 없이 통과 | pass |
| FEEDBACK-06 | FEEDBACK | N/A | **이 화면에 편집 폼을 담은 modal 이 없다.** 등록·수정은 전용 라우트(`/new` · `/:id/edit`)이고, modal 은 5종 전부 입력 필드가 없다 — 종류 선택(2択 버튼 — `components/NewTemplateKindDialog.tsx:70-80`) · 블록 피커(7択) · 삭제 확인 2종 · 충돌 · 미저장 가드. dirty 개념이 성립하지 않는다 | 재현 대상 없음 — 입력을 담은 modal 이 존재하지 않는다 | n-a |
| A11Y-01 | A11Y | 상속 | 결과 통지(삭제·저장 성공 토스트)가 `ToastProvider` 의 **항상 마운트된** live region 을 지난다. 목록 상태 라이브 리전도 항상 마운트(`CrudListShell.tsx:117`) | DS/Provider 소유 문서 판정. 상세에서 삭제 성공 토스트가 announce 되는지만 확인 | 종속 |
| A11Y-02 | A11Y | 상속 | 이 화면의 5개 modal 이 DS `Modal`/`ConfirmDialog` 의 `aria-describedby` 계약을 상속한다 | DS 소유 문서 판정. 삭제 다이얼로그 open 시 `'<템플릿명>'을(를) 삭제합니다…` 본문이 읽히는지만 확인 | 종속 |
| A11Y-11 | A11Y | 직접 | **짝 없는 `aria-invalid` 가 0건이다.** 5개 지점 전부 `aria-describedby` 가 붙는다 — 편집기 제목(`TemplateEditorShell.tsx:143-145`, 조건부) · 본문 textarea(`components/ContentInputCard.tsx:111-116`, hint id 를 항상 잇고 오류 시 error id 를 덧붙인다) · 발신 프로필·발신번호(`components/SenderProfileCard.tsx:107-108,127-128`, 조건부 스프레드) · 이메일 이미지 폭(`email/InspectPanel.tsx:660-661`). 필수 표식은 `aria-required`(`ContentInputCard.tsx:110`)와 `FieldBox required`(`email/controls/FieldBox.tsx:85-89`, `*` 는 `aria-hidden` 장식)가 나눠 진다 | `/marketing/templates/new?kind=text` → 제목·본문을 비우고 포커스 이탈 → `<input id="message-template-name" aria-invalid="true" aria-describedby="message-template-name-error">` 와 그 id 의 `<p role="alert">` 가 함께 존재. `EmailBuilder.test.tsx:224-243` 이 이미지 폭 축을 고정한다. **⚠ 역방향 결함은 있다** — `aria-describedby={widthErrorId}` 가 **무조건** 붙는데 helper 가 빈 문자열이면 `<p>` 를 그리지 않아(`FieldBox.tsx:93-97`) **폭이 800 이하일 때 가리키는 대상이 없는 참조가 남는다.** A11Y-11 의 문면(짝 없는 `aria-invalid`)은 충족하나 §3 · §5 #9 로 이관한다 | pass |
| A11Y-12 | A11Y | N/A | **이 화면에 좌측 필터 list item 이 없다.** 종류·상태 필터는 `SelectField` 드롭다운이고(`MessageTemplateListPage.tsx:163-185`) 필터 패널·토글 버튼이 없다. **`aria-pressed` 를 쓰는 표면은 있으나 필터가 아니다** — 이메일 툴바의 패널 접기(`email/EmailToolbar.tsx:240`)와 기기 폭 토글(`email/controls/IconToggleGroup.tsx`)이고, 둘 다 조회 조건이 아니라 편집기 뷰 상태다 | 목록 3파일에 `aria-current` grep = 0 · 필터 자리의 `aria-pressed` = 0(표면 없음). 이메일 툴바의 히트는 뷰 토글이라 이 요구의 대상이 아니다 | n-a |
| MOTION-01 | MOTION | 상속 | 이 화면의 `Modal` 표면 5종이 DS Modal 의 enter/exit 계약을 상속한다(backdrop fade + dialog scale + reduced-motion 게이트). **라이브러리가 아니라 CSS-only 이고** exit 완료 후 unmount 는 네이티브 `onAnimationEnd` 로 동등 달성한다 — 라이브러리 부재를 gap 으로 볼지는 DS 소유 문서의 몫 | DS 소유 문서 판정. 이 화면에서는 **종류 선택 다이얼로그**의 open/close 에 fade + scale 이 보이고 reduced-motion 에서 즉시 처리되는지만 확인 | 종속 |
| MOTION-02 | MOTION | 상속 | 성공 토스트(저장·삭제)가 ToastProvider 의 exit 애니메이션 계약을 상속한다 | DS 소유 문서 판정. 저장 성공 토스트의 auto-dismiss 가 exit 애니메이션을 보이는지만 확인 | 종속 |
| MOTION-03 | MOTION | 상속 | 이 화면은 자체 Motion 라이브러리를 도입하지 않는다 — 모든 움직임이 DS 소유다. **`ToggleSwitch` 표면이 실재한다**(상세 헤더의 사용 여부 토글 — `MessageTemplateDetailPage.tsx:274-279`). 1.0 대상 화면에는 없던 표면이므로 **이 화면은 DS ToggleSwitch 의 reduced-motion 게이트에 실제로 의존한다** | DS 소유 문서 판정. `prefers-reduced-motion: reduce` 에뮬레이션 시 **사용 여부 토글의 노브 이동**과 다이얼로그·토스트에 move/scale 이 남지 않는지 확인 | 종속 |
| IA-01 | IA | 직접 | 네 라우트가 전부 `APP_ROUTES` 에 등재돼(App.tsx:331,340,345,346) `RequireAuth > AppShell` 레이아웃 라우트 아래에서 렌더된다. 세 페이지 컴포넌트 중 자체 sidebar/header/outer frame 을 그리는 것은 없다. **옛 경로도 죽지 않았다** — `/marketing/message-templates*` 는 `<Navigate replace>` 로 넘겨준다(App.tsx:341-348) | 네 라우트 모두 사이드바+헤더가 유지된 채 `<main>` 안에 그려진다. 세 소스에 `<header>`/`<aside>` grep = 0. `/marketing/message-templates/abc` 를 치면 `/marketing/templates` 로 replace 이동 | pass |
| IA-02 | IA | 직접 | **단일 title 메커니즘 미충족 — 라우트마다 사정이 다르다.** ① **목록** — AppHeader `<h1>`(`AppHeader.tsx:92,101` → `findNavLabel` → `findCoveringLeaf`(`nav-config.ts:278-284,306-308`) → 잎 라벨 **'발송 템플릿 관리'**) 1개, in-content h1 없음 → **그 축은 pass**. ② **상세** — `<h1>` 이 **2개**다: AppHeader 의 '발송 템플릿 관리' + `MessageTemplateDetailPage.tsx:268` 의 템플릿명. ③ **편집기** — in-content 제목이 `<h1>` 이 아니라 **`<input aria-label="템플릿명">`**(`TemplateEditorShell.tsx:134-147`)이다. h1 은 1개지만 **화면의 주 제목이 heading 이 아니어서 heading 탐색으로 도달할 수 없고**, 그 라벨('발송 템플릿 관리')이 지금 하는 일(등록/수정)을 반영하지 않는다. ④ 잎 라벨('발송 템플릿 관리')과 화면의 엔티티 라벨('메시지 템플릿' — `MessageTemplateListPage.tsx:29`)이 **서로 다른 낱말이다** | `/marketing/templates` → `document.querySelectorAll('h1').length === 1` ✓. `/marketing/templates/mt-text-active` → **`=== 2`**, `[0]`='발송 템플릿 관리', `[1]`='주문 완료 안내'. `/marketing/templates/new?kind=text` → `=== 1` 이지만 화면의 큰 제목은 `<input>` 이고 h1 은 '발송 템플릿 관리' 다. 토스트·빈 상태는 '메시지 템플릿' 이라 부른다 | **gap** (목록 축 pass) |
| IA-04 | IA | 직접 | **미충족(Pagination 축).** 나머지는 성립한다: 툴바 좌측 검색+필터 2개 + 우상단 primary '새 템플릿'(`MessageTemplateListPage.tsx:152-191`) → 결과 count 요약 → `SelectionBar` → 표. **그러나 Pagination 이 없다** — `visibleItems` 전량을 렌더한다(`:195-210`). 종류 2종 × 문구 종류만큼 누적되는 목록이라 'page size 초과 가능' 이다. BE-036 EP-01 도 페이징 파라미터가 없다 | `/marketing/templates` → 표 하단에 Pagination 컴포넌트가 없다. 시드를 30건으로 늘리면 30행이 모두 한 화면에 렌더된다. `pages/marketing/message-templates` 에 `Pagination` import = **0** | **gap** |
| IA-05 | IA | 직접 | `/marketing/templates/new` 와 `/marketing/templates/:id/edit` 가 **같은 `MessageTemplateEditorPage`** 로 해석된다(App.tsx:333,346). 그 안에서 `useParams().id` 유무로 등록/수정을 가르고(`MessageTemplateEditorPage.tsx:43-46`), 등록 전용/수정 전용 페이지가 따로 없다. **종류(문자/이메일)로도 라우트를 가르지 않은 것이 같은 판단이다** — 가르면 수정 경로도 갈라야 하고 목록의 링크가 항목마다 다른 경로를 계산해야 한다(`:5-7`) | App.tsx:333,346 의 두 라우트가 동일 element 를 가리킨다. `/new?kind=email` → 빈 이메일 빌더, `/:id/edit` → 같은 빌더에 prefill. 레이아웃 동일 | pass |
| IA-13 | IA | 직접 | **조회 상태의 단일 원천이 URL 쿼리스트링이다.** `MessageTemplateListPage.tsx:120` 이 `useListState({ filterDefaults: { status:'all', kind:'all' } })`(`:39`)를 쓴다: `useListState.ts:87` `useSearchParams` → 갱신은 `patchParams` 한 통로로만 나가고 **`replace: true`**(`:125`)라 히스토리가 쌓이지 않는다. 기본값과 같은 값은 URL 에서 지운다(`:104`). 손으로 고친 `?kind=거짓말` 은 공용 `parseFilter`(`:122-127`)가 허용 목록으로 걸러 '전체'로 되돌린다. **page·sort 표면은 없다**(IA-04 gap) | '이메일' + '초안' + '리마인드' 검색 → URL 이 **`?kind=email&status=draft&q=리마인드`**. 행을 열어 상세 진입 후 Back → **그 조건 그대로** ✓. URL 을 새 탭에 복사 → 같은 view ✓. '전체 종류'로 되돌리면 `?kind=` 가 사라진다 ✓ | pass |
| EXC-01 | EXC | 상속 | 이 화면의 렌더 예외는 `AppShell` 의 `<Outlet>` 바로 바깥 `ErrorBoundary` 가 잡는다(`resetKey={pathname}`). App root 에도 최후 경계가 있다 | AppShell/App 소유 문서 판정. **이메일 빌더가 이 화면에서 가장 깊은 렌더 트리다**(캔버스 × 블록 N) — 블록 렌더에 강제 throw 를 넣으면 사이드바가 유지된 채 복구 UI 가 뜨는지만 확인 | 종속 |
| EXC-02 | EXC | 상속 | **route guard**: `RequireAuth` 가 `AppShell` 바깥을 감싸 세션 없이 딥링크 시 `/login?returnUrl=…`. **401 인터셉터**: 이 화면의 모든 조회·쓰기가 전역 `QueryCache`/`MutationCache` 의 `onError` → `notifySessionExpired()` 로 수렴한다. **단 상태 변경 mutation 은 `onError` 를 자기 쪽에 두지 않으므로 전역 캐시 핸들러에만 의존한다**(`MessageTemplateDetailPage.tsx:186-194`) | AppShell/queryClient 소유 문서 판정. 세션 제거 후 딥링크가 `/login?returnUrl=%2Fmarketing%2Ftemplates` 로 가는지만 확인. **작성 중 폼 소실은 §4.2·§5** | 종속 |
| EXC-03 | EXC | 직접 | **부분 미충족(쓰기 게이팅 축).** **읽기**는 상속으로 충족 — `RequirePermission` 이 `<Outlet>` 을 감싸 read 권한 없는 딥링크에 403 화면을 렌더한다. **쓰기 게이팅이 없다**: '새 템플릿'(`MessageTemplateListPage.tsx:187-189`) · 행 액션 · `SelectionBar` 일괄 삭제 · **상세의 삭제·수정·발행·사용 여부 토글**(`MessageTemplateDetailPage.tsx:272-315`) · 편집기의 저장·발행이 권한을 조회하지 않는다. **`useRouteWritePermissions` 를 `pages/marketing/**` 에서 쓰는 코드가 0건이다** — 훅과 선례(products·settings)는 완비돼 있고 이 섹션 배선만 남았다. **이 화면에서 특히 중한 이유**: `사용 여부 토글`은 '지금 발송에 쓰이는 문구' 를 켜고 끈다 — 조회 권한만 가진 운영자가 캠페인을 중단시킬 수 있다 | remove=false·update=false 인 역할로 로그인 → **상세 헤더의 토글·삭제·수정·발행이 여전히 보이고 조작된다**. read=false 로 바꾸면 403 화면은 정상 렌더(읽기 축 pass). `grep -rln "useRouteWritePermissions" apps/admin/src/pages/marketing` → **0건** | **gap** |
| EXC-04 | EXC | 직접 | **CRUD 축 pass · 상태 변경 축 미충족 — 1.0 이 pass 로 뒤집었던 판정이 새 표면에서 되살아났다.** CRUD 4종은 `createStoreAdapter` 의 존재 검사가 덮는다: `crud.ts:196` `exists()` → `:217-219` `fetchOne` **404** · `:256-258` `update` **409 '다른 사용자가 먼저 삭제한 항목입니다.'** · `:275-277` `remove` **409**. 편집기는 `FormConflictDialog`(`TextTemplateEditor.tsx:384`)로 복구 경로를 이미 갖는다. **그러나 상태 변경(발행·사용 여부 토글)이 이 계약 밖에 있다** — `setMessageTemplateStatus` 를 mutationFn 안에서 직접 부르므로(`MessageTemplateDetailPage.tsx:186-194` → `store.ts:325-331`) ⓐ 존재 검사 없음(`store.ts:326` `map` — **없는 id 에 조용히 성공**) ⓑ `onError` 없음 → **실패 표면이 아예 없다** ⓒ `signal`·멱등키 미전달. **⚠ 그리고 CRUD 축의 409 조차 낙관적 동시성이 아니다** — '존재 여부' 기반이지 version/ETag 가 아니라 둘 다 존재하는 동시 편집은 last-write-wins 다. **이메일에서 손실이 특히 크다**: 블록 스택 전체가 폼 값 하나라 나중 저장이 상대의 블록을 통째로 지운다 | ① `/marketing/templates/mt-text-inactive/edit` 진입 → 다른 탭에서 그 템플릿 삭제 → 저장 → **충돌 다이얼로그 + 입력 보존** ✓ ② `/marketing/templates/mt-text-inactive` 진입 → 다른 탭에서 삭제 → **사용 여부 토글 클릭 → 아무 일도 일어나지 않고 오류도 없다**(무효화 후 재조회에서야 상세가 실패 배너로 바뀐다) ✗ ③ `?fail=marketing-message-templates:save` 로 저장은 실패시킬 수 있으나 **토글은 어떤 스위치로도 실패시킬 수 없다** ✗ | **gap** (CRUD 축 pass) |
| EXC-08 | EXC | 직접 | 편집기 제출이 `useCrudForm` 의 **동기 제출 락**(`useCrudForm.ts:210-211`)으로 disabled 렌더 이전의 두 번째 제출을 막고, 셸이 `disabled={saving \|\| loadingDetail \|\| !valid}` 로 이중 차단한다(`TextTemplateEditor.tsx:221,232,242`). **멱등키는 mutationFn 밖 ref** 에서 제출 **시도** 단위로 만들어(`:126-129`) 재시도가 같은 키를 재사용하고 성공 시 버린다(`:228`). 키는 `WriteContext` 로 실려 `createStoreAdapter` 의 ledger(`crud.ts:193`)가 `:232,245,272` 에서 `isReplay` 로 판정하며 **기록은 적용에 성공한 뒤에만** 한다. 삭제는 `ConfirmDialog` 의 `busy` 잠금(목록·상세 둘 다) | 제출 버튼 더블클릭 / 응답 전 Enter 연타 → 정확히 1개 요청. `?status=marketing-message-templates:save:500` 으로 실패시킨 뒤 재제출 → 같은 키 유지. **⚠ 상태 토글은 `busy` disabled 뿐이고 멱등키를 지나지 않는다**(EXC-04) — 다만 전이가 멱등이라(BE-036 §4 EP-05) 중복이 두 벌을 만들지는 않는다 | pass |
| EXC-09 | EXC | 직접 | 단일 공유 predicate `isAbort` 로 수렴한다. **편집기**: `useCrudForm` 이 abort 를 조용히 흘리고 언마운트 시 진행 요청을 abort 한다. **목록**: 삭제 `onError` 가 `isAbort` 로 배너를 띄우지 않고, 다이얼로그 닫기가 abort + reset. 일괄 삭제는 `signal.aborted` 면 결과를 무시한다. **상세**: 자기 삭제 흐름에서 같은 계약을 손으로 지킨다 — `closeDelete` 가 `deleteControllerRef.current?.abort()` + `remove.reset()`(`MessageTemplateDetailPage.tsx:204-210`), `onSuccess` 는 `controller.signal.aborted` 를 먼저 보고(`:222`), `onError` 첫 줄이 `isAbort(cause)` 를 흘린다(`:227`) | 상세에서 '삭제' 클릭 직후(응답 전) 다이얼로그 닫기 → **토스트·배너 0건**, 목록 이동 없음, 버튼 state 복원 ✓. 편집기 저장 중 사이드바로 이탈 → 실패 토스트 없음 ✓. 일괄 삭제 중 취소 → 'N건 중 M건 실패' 배너가 뜨지 않는다 ✓ | pass |

### 2.1 P0 판정 요약

| 판정 | 건수 | 요구 ID |
|---|---|---|
| pass | **12** | STATE-02 · STATE-04 · TOKEN-01 · COMP-10 · FEEDBACK-02 · FEEDBACK-04 · A11Y-11 · IA-01 · IA-05 · IA-13 · EXC-08 · EXC-09 |
| 종속 | **11** | TOKEN-02 · TOKEN-03 · TOKEN-04 · TOKEN-05 · A11Y-01 · A11Y-02 · MOTION-01 · MOTION-02 · MOTION-03 · EXC-01 · EXC-02 |
| n-a | **2** | FEEDBACK-06(폼 modal 없음) · A11Y-12(좌측 필터 패널 없음) |
| gap | **5** | **STATE-01** · IA-02 · IA-04 · EXC-03 · **EXC-04** |
| **합계** | **30** | 12 + 11 + 2 + 5 = **30** ✅ (차원별 STATE 3 · TOKEN 5 · COMP 1 · FEEDBACK 3 · A11Y 4 · MOTION 3 · IA 5 · EXC 6 = **30** ✓) |

> **1.0(알림톡 모델) 대비 변화** — 판정을 재사용하지 않고 전수 재채점했으므로 '뒤집혔다' 가 아니라 **'다른 화면의 새 채점'** 이다. 그럼에도 비교가 의미 있는 두 축을 적는다:
>
> - **EXC-04 가 다시 gap 이다.** 1.0 은 `createStoreAdapter` 에 존재 검사가 생기면서 pass 로 뒤집혔었다. 그 검사는 여전히 유효하고 이 화면의 CRUD 4종도 그 수혜자다. **그런데 이 화면은 그 계약 밖에 새 쓰기 경로를 하나 만들었다** — 상태 변경이다. 어댑터를 우회한 판단 자체에는 근거가 있으나(`store.ts:319-322`), **그 대가로 존재 검사·실패 표면·abort·재현 스위치를 한꺼번에 잃었다.** 공용 계약을 벗어나면 그 계약이 주던 것도 함께 잃는다는 것을 이 화면이 보여 준다.
> - **STATE-01 이 새로 gap 이다.** 1.0 대상 화면에는 **상세가 없었다**. 상세·편집기라는 새 표면이 생기면서 '도착 전 빈 화면' 이라는 새 미충족이 따라 들어왔다.
> - **1.0 의 최대 위험(승인 상태 클라이언트 지정)은 이 화면에 존재하지 않는다** — 심사 개념이 없는 모델이고, 쓰기 입력 타입(`MessageTemplateDraft` — `store.ts:201-204`)에 이력 필드가 아예 없다. **그 위험은 닫힌 것이 아니라 `/marketing/templates/alimtalk` 로 옮겨가 도달 불가 상태가 됐다**(BE-036 §4.9 · §5 #14).
>
> **P0 gap 5건 = quality-bar '배치 실패' 사유.** **IA-02 · IA-04 는 앱 전역 문제**, **EXC-03 은 이 섹션 배선**, **STATE-01 · EXC-04 는 이 화면 고유**다. §5 참조.

## 3. 이 화면에 걸리는 P1 · P2 (선별)

표면이 실재하는 것만 적는다.

| 요구 ID | P | 이 화면에서의 상태 | 측정 기준 | 판정 |
|---|---|---|---|---|
| STATE-03 | P1 | `useCrudListQuery` 가 `placeholderData: (previous) => previous` 로 이전 행을 유지하고 `refreshing` 이 요약에 '새로고침 중…' 만 덧붙인다(`CrudListShell.tsx:128`). `staleTime` 30초 · `refetchOnWindowFocus: false`. **편집기와 상세가 같은 react-query 키를 공유해**(`MessageTemplateEditorPage.tsx:9-10`) 상세 → 편집기 이동 시 재조회가 없다 | 데이터가 있는 상태에서 캐시 무효화 → 이전 행 유지 + '새로고침 중…'. 상세에서 '수정' 클릭 → 네트워크 재조회 0회 | pass |
| STATE-05 | P1 | **충족.** 목록 호출부가 `Empty` 에 4개 맥락을 모두 넘긴다 — `hasQuery`·`onClearSearch`·`hasActiveFilters`·`onResetFilters`(`MessageTemplateListPage.tsx:201-206`). 검색 0행이면 '검색 지우기', 필터 0행이면 '필터 초기화', 진짜 0건이면 등록 CTA 로 갈린다. **1.0 이 gap 으로 잡았던 축이 이 화면에서는 처음부터 충족돼 있다** | 종류를 '이메일' + 상태를 '초안' 으로 두고 해당 조합을 0건으로 만든다 → '**필터 초기화**' 버튼이 뜬다. 검색 0행일 때는 '검색 지우기' | pass |
| STATE-06 | P1 | 등록·수정·삭제 성공 시 `list` 키를 무효화하고 수정은 `detail` 키도 함께 무효화한다. **상태 변경은 리소스 전체를 무효화한다**(`MessageTemplateDetailPage.tsx:192` — `queryKey: [MESSAGE_TEMPLATE_RESOURCE]`) — 목록·상세가 함께 갱신된다 | 상세에서 사용 여부 토글 → 배지가 바뀐다. 목록으로 돌아가면 수동 새로고침 없이 상태 셀이 갱신돼 있다 | pass |
| COMP-04 | P1 | **부분 충족.** 본문 textarea 가 `required` + `aria-required="true"`(`components/ContentInputCard.tsx:109-110`), 이메일 INSPECT 는 `FieldBox required`(`email/controls/FieldBox.tsx:85-89`). **그러나 편집기의 필수 입력 셋 중 시각적 `*` 표식을 갖는 것이 없다** — 템플릿명은 라벨 자체가 없고(`TemplateEditorShell.tsx:132-133`), 본문·발신 프로필도 섹션 제목만 있다. 잠긴 저장 버튼이 '아직 덜 됐다' 를 알리는 유일한 신호다(`TemplateEditorShell.tsx:13-15` 가 그것을 의도로 못 박는다) | 빈 편집기에서 어느 칸이 필수인지 시각적으로 구분되지 않는다. 저장 버튼만 회색이다 | gap |
| COMP-09 | P2 | **미충족.** 목록 5컬럼 중 truncation 을 가진 셀이 **하나도 없다** — 템플릿명은 `item.name` 그대로(`MessageTemplateListPage.tsx:74`), 발신 프로필·최종 수정은 `nowrap` 만 있고 `text-overflow` 가 없다(`:61-69`). **1.0 화면에는 본문 미리보기 셀에 60자 컷 + ellipsis 이중 방어가 있었으나 이 화면은 본문 셀 자체를 없앴고**, 대신 긴 이름이 컬럼을 민다. 템플릿명 상한 60자가 완화할 뿐이다 | 60자 템플릿명 시드 → 이름 셀이 늘어나 다른 컬럼을 민다. hover/expand 로 전체를 보는 경로도 없다(`title` 속성 0건) | gap |
| COMP-12 | P2 | **미충족 — 기준 불일치가 1.0 보다 커졌다.** 본문 카운터는 `(N / 2000자)`(`copy.ts`)인데 등급 표시는 바이트다(`TextTemplateEditor.tsx:305-307`). **콜아웃은 90 을 `자` 라고 부른다**(`copy.ts`) — 실제 SMS 한도는 90 byte 이고 한글 45자에서 넘는다. **템플릿명(60)에는 카운터도 `maxLength` 도 없다**(`TemplateEditorShell.tsx:134-147`) — 61번째 글자가 잘리지도, 예고되지도 않는다. 이메일 제목은 상한 자체가 없다. 블록 본문만 `(N / 10 000자)` 를 갖는다(`email/InspectPanel.tsx`) | 문자 편집기에 한글 1,500자 입력 → 카운터 '(1500 / 2000자)'(여유 있음)인데 등급은 `LMS · 3000 byte`(한도 2000 초과) — **저장이 통과한다**. 템플릿명에 70자 입력 → 잘리지 않고 저장 버튼만 잠긴다 | gap |
| FEEDBACK-01 | P1 | 배치 규칙이 성립한다: read 실패 → 인라인 Alert / write 성공 → 토스트 / 다이얼로그 내부 실패 → 그 다이얼로그 error 배너(목록·상세 둘 다) / 폼 저장 실패 → 셸 상단 배너. page 가 임의 배너 state 를 갖지 않는다 | `?fail=…:delete` → 다이얼로그 배너(토스트 아님). `?fail=…:list` → 인라인 Alert(토스트 아님) | pass |
| FEEDBACK-03 | P1 | **미충족.** 저장·삭제·일괄 삭제는 성공·실패 피드백을 모두 갖는다. **그러나 상태 변경(발행·사용 여부 토글)에는 실패 피드백이 없고 성공 피드백도 없다** — `changeStatus` 에 `onError` 도 `toast` 도 없다(`MessageTemplateDetailPage.tsx:186-194`). 성공은 배지가 바뀌는 것으로 암묵 통지되지만 **실패는 아무 흔적도 남기지 않는다**. 이 화면에서 가장 흔한 조작이라고 화면 스스로 말하는 바로 그 조작이다(`MessageTemplateListPage.tsx:6-7`) | 삭제된 템플릿의 상세에서 토글 → **UI 가 그대로이고 오류도 성공도 없다**. `?fail=` 로도 재현 불가(어댑터를 지나지 않는다) | gap |
| FEEDBACK-05 | P2 | 모든 삭제가 `ConfirmDialog`(비가역 고지 '이 작업은 되돌릴 수 없습니다.')로 게이트된다 — 목록·상세 양쪽. undo window 없음 — 확인 방식으로 충족. **단 `active` 템플릿 삭제도 같은 문구다** — 지금 발송에 쓰이는 문구가 사라진다는 사실을 알리지 않는다(BE-036 §7.7) | 단일 미확인 클릭으로 실행되는 삭제 0건 ✓. `active` 와 `draft` 의 확인 문구가 동일 | pass |
| A11Y-05 | P1 | `SelectField isInvalid` 가 `aria-invalid` 를 설정한다(DS 소유). 이 화면의 검증 대상 select 는 발신 프로필·발신번호이고 둘 다 오류 시 `aria-invalid` + `aria-describedby` 를 함께 준다(`components/SenderProfileCard.tsx:107-108,127-128`). 필터 select·발송 회선 select 는 열거라 검증 실패 경로가 없다 | 발신 프로필을 비운 채 저장 시도 → 그 select 에 `aria-invalid="true"` 와 인라인 오류 | pass |
| A11Y-08 | P1 | 행 클릭이 `onEdit` 콜백으로 **상세**를 연다(`MessageTemplateListPage.tsx:209`). **템플릿명 셀이 링크가 아니다**(`:74`). 다만 행 안의 `RowActions` 연필이 **같은 목적지**로 가는 키보드 도달 가능 컨트롤이다 — 계약 문면은 충족되나 등가물이 아이콘 버튼이라 발견성이 낮고, **아이콘이 연필(수정)인데 실제로는 상세로 간다** | 행을 Tab 하면 체크박스 → 연필 → 휴지통에 도달하고 연필 Enter 가 행 클릭과 같은 `/marketing/templates/<id>` 를 연다 | pass |
| A11Y-11(역방향) | P1 | **가리키는 대상이 없는 `aria-describedby` 가 있다.** `email/InspectPanel.tsx:661` 이 `aria-describedby={widthErrorId}` 를 **무조건** 붙이는데, `FieldBox` 는 `helper` 가 빈 문자열이면 `<p>` 를 렌더하지 않는다(`email/controls/FieldBox.tsx:93-97`). 폭이 800 이하인 **정상 상태에서 dangling reference 가 남는다** — 스크린리더가 조용히 무시하거나 검증 도구가 오류로 잡는다 | 이미지 블록을 넣고 폭을 기본값 600 으로 둔 채 DevTools → `aria-describedby` 가 존재하지 않는 id 를 가리킨다. `EmailBuilder.test.tsx:230,254` 는 `aria-invalid="false"` 만 단언해 이 축을 잡지 못한다 | gap |
| A11Y-13 | P1 | `useCrudForm.submit` 이 `handleSubmit(onValid, onInvalid)` 를 부르고 RHF 의 `shouldFocusError` 가 첫 invalid 필드로 포커스를 옮긴다. 서버 422 도 첫 위반 필드로 `setFocus`(`useCrudForm.ts:198`). **폼 진입 시 첫 필드 자동 포커스는 없다.** 그리고 **이 화면에서는 그 경로가 잘 발현되지 않는다** — 저장 버튼이 유효할 때만 열리므로(FS-036-EL-036) '빈 폼 제출 → 포커스 이동' 을 사용자가 만들 수 없다 | 빈 폼에서 제출을 시도할 방법이 없다(버튼이 잠겨 있다). `/new?kind=text` 진입 직후 → `activeElement` 가 `<body>` | gap |
| A11Y-16 | P1 | 목록 상태 라이브 리전이 **항상 마운트**돼 있다(`CrudListShell.tsx:117`). 변수 칩이 `aria-label`(`components/EditorToolbar.tsx:235`), 표가 `aria-busy`. **live region 이 필요한데 없는 자리가 셋이다**: ① **SMS→LMS 승격**(`TextTemplateEditor.tsx:305-307`) — 실시간으로 바뀌는데 announce 되지 않는다 ② **사용 여부 토글 결과** — 배지가 바뀔 뿐 통지가 없다(FEEDBACK-03) ③ **블록 추가/삭제** — 캔버스가 바뀌지만 announce 되지 않는다(`email/EmailBuilder.tsx:107-124`) | 종류 필터로 0행 전환 → '조건에 맞는 …' announce ✓. 본문 입력으로 SMS→LMS 승격 → **무음** ✗. 블록 삭제 → **무음** ✗ | gap |
| IA-03 | P1 | breadcrumb 이 없다 — `/marketing/templates/mt-text-active/edit` 에 '마케팅 관리 > 발송 템플릿 관리 > 주문 완료 안내 > 수정' trail 이 없다. **이 화면은 3단 깊이라 1.0 보다 필요가 크다**(목록 → 상세 → 편집기) | 상세·편집기 라우트에 breadcrumb 요소 0건. 편집기에서 '목록으로' 를 누르면 **상세를 건너뛰고 목록으로 간다**(`TemplateEditorShell.tsx:122`) | gap |
| IA-06 | P1 | 무게 규칙에 맞는다 — 메시지 템플릿은 rich 엔티티(블록 스택·발신 프로필·상태 흐름)라 전용 form route 이고 modal edit 이 없다. **종류 선택만 modal 인 것이 옳다** — 2択이고 그 뒤 라우트가 갈린다(`components/NewTemplateKindDialog.tsx:2-5`) | `/new`·`/:id/edit` 가 전용 라우트. 폼 modal 0건 | pass |
| IA-07 | P1 | 백링크가 '목록으로' + `chevron-left` + 좌상단으로 **일관돼 있다** — 편집기(`TemplateEditorShell.tsx:118-126`)와 상세(`MessageTemplateDetailPage.tsx:255-263`)가 같은 라벨·같은 아이콘·같은 위치. **단 공유 셸이 아니라 두 파일이 각각 그린다** — 스타일 객체도 복제돼 있다(`TemplateEditorShell.tsx:41-57` vs `MessageTemplateDetailPage.tsx:116-132`). drift 를 막는 것은 지금은 규율뿐이다 | 두 화면의 백링크 라벨·아이콘이 같다 ✓. 두 파일에 거의 동일한 `backLinkStyle` 이 각각 선언돼 있다 | pass(동작 기준. 중복은 FS-036 §7 #8) |
| IA-08 | P1 | **이 화면은 footer 액션을 두지 않는다** — 저장·발행이 **헤더 우상단**에 있다(`TemplateEditorShell.tsx:158-169`). 목업이 정한 배치이며 이메일 빌더처럼 세로로 긴 캔버스에서는 하단 footer 가 스크롤 끝에 묻힌다. **그러나 앱의 다른 폼(뉴스레터·SMS)은 하단에 둔다** — 같은 앱에서 두 배치가 공존한다 | 이 화면: 취소·저장·발행이 상단 우측. 뉴스레터: 카드 밖 하단 | pass(이 화면 기준. 앱 전역 불일치는 별도) |
| IA-10 | P2 | **충족 — 우측 preview panel 이 실재한다.** 문자 편집기는 3단 중 우측이 `TextPreviewCard`(`TextTemplateEditor.tsx:371-380`), 이메일은 캔버스 자체가 미리보기이며 편집/미리보기 탭으로 전환한다(`email/EmailToolbar.tsx:151-166`). 상세도 우측이 미리보기다. **1.0 이 지적한 '존재하지 않는 미리보기를 가리키는 문구' 문제가 이 화면에는 없다** | `/new?kind=text` → 우측에 휴대폰 미리보기. 접기 버튼으로 감출 수 있다(`:371`) | pass |
| IA-12 | P2 | **미충족.** 이 화면은 `FormPageShell` 을 소비하지 않고 `TemplateEditorShell` 을 **직접 소유한다.** 두 편집기가 그것을 공유하는 것은 옳으나(`TemplateEditorShell.tsx:9-11`), **상세는 그 셸을 쓰지 않고 백링크·헤더·액션 행을 다시 그린다**(`MessageTemplateDetailPage.tsx:74-132,255-317`) — 스타일 객체 4개가 두 파일에 중복돼 있다(`headerStyle`·`eyebrowStyle`·`actionsStyle`·`backLinkStyle`) | `TemplateEditorShell.tsx` 와 `MessageTemplateDetailPage.tsx` 에서 같은 이름·거의 같은 내용의 `CSSProperties` 상수 4쌍을 찾을 수 있다 | gap |
| IA-14 | P1 | 목록 표에 가로 스크롤 컨테이너가 없다. 8컬럼(선택·순번·이름·종류·상태·발신·최종수정·액션). **편집기는 더 나쁘다** — 3단 그리드의 기준 폭이 1280px 기준으로 잡혀 있고(`styles.ts:50` 주석), 이메일 빌더는 [프리셋 레일][캔버스][속성 패널] 3단이다. 최소 지원 폭 선언이 없다 | 375px 에서 이메일 편집기 3단이 어떻게 되는지 확인 필요. 패널 접기(`email/EmailToolbar.tsx:236-244`)가 수동 완화책이지만 자동 반응형이 아니다 | gap |
| ERP-01 | P1 | 상태→tone 이 **단일 레지스트리**에서 온다 — `statusToneOf`(`status.ts:18-21`)를 목록(`MessageTemplateListPage.tsx:86`)과 상세(`MessageTemplateDetailPage.tsx:351`)가 함께 소비한다. per-page meta helper 없음. **세 상태의 tone 이 서로 다르다**(success/info/neutral)는 것이 의도이며 근거가 코드에 남아 있다(`status.ts:13-16`). **단 종류 배지는 두 종류 모두 `tone="neutral"` 하드코딩**(`MessageTemplateListPage.tsx:79`) — 종류는 status 가 아니므로 레지스트리 대상은 아니나 색이 정보를 주지 않는다 | 3상태 전부 정의된 tone 으로 해석되고 서로 다르다 ✓. 종류 배지는 색으로 구분되지 않는다 | pass |
| ERP-06 | P1 | 날짜가 `shared/format`(`formatDateTime`)을 경유한다(`MessageTemplateListPage.tsx:97` · `MessageTemplateDetailPage.tsx:362-364`). 셀에 raw `toString()` 없음. **톤도 한 벌이다** — 편집기와 상세가 같은 한글 문구 한 벌을 공유한다(`copy.ts`). 테스트가 고정하는 것은 언어가 아니라 '편집기 전용 크롬(입력 라벨·헤더 액션)이 상세로 새어 나오지 않는다' 다(`MessageTemplateDetailPage.test.tsx:69-90`) | 상세 라벨 8종이 전부 한글 ✓. 편집기 라벨도 전부 한글 ✓. 상태 배지만 양쪽에서 영문(라벨이 아니라 상태값이라 예외 — `copy.ts`) | pass |
| ERP-08 | P2 | 저장 시각이 `new Date().toISOString()`(UTC — `store.ts:214-216`)이고 시드는 로컬 표기 문자열(`:102` `'2026-05-02T09:12:00'`)이라 **저장 값과 시드 값의 시간대 기준이 다르다**. `formatDateTime` 이 브라우저 로컬 getter 로 렌더하므로 다른 TZ 의 관리자는 같은 템플릿의 시각을 다르게 본다 | 시드 템플릿과 방금 저장한 템플릿의 '최종 수정' 이 같은 규칙으로 해석되지 않는다(UTC vs 로컬 문자열) | gap |
| ERP-12 | P2 | 목록 export(CSV/xlsx) affordance 가 없다. **단 개별 본문 내려받기는 있다** — 문자 편집기의 `.txt` 내보내기(`TextTemplateEditor.tsx:196-204`). 이메일의 대응물(`HTML 내려받기`)은 **배선되지 않았다**(`email/EmailToolbar.tsx:215-222`) | 툴바에 목록 export 버튼 0건. 이메일 HTML 내려받기 클릭 → 아무 일 없음 | gap |
| ERP-13 | P1 | **부분 미충족 — 한 화면 안에서 두 규칙이 공존한다.** 공용 경로는 조사 헬퍼를 쓴다: 목록의 삭제 토스트·확인 문구가 **템플릿명의 받침**으로 고르고(`useCrudList.tsx:170,218` → `objectParticle`), 저장 토스트도 `objectParticle('메시지 템플릿')` 이다(`useCrudForm.ts`). **그런데 상세 화면이 리터럴 `을(를)` 을 3곳에서 출하한다** — 삭제 성공 토스트(`MessageTemplateDetailPage.tsx:223`) · 로드 실패 문구(`:238`) · 삭제 확인 본문(`:393`). 상세가 공용 셸을 쓰지 않고 직접 그리면서 헬퍼를 함께 놓쳤다 | 사용자 대상 문자열의 `'을(를)'` grep → **`MessageTemplateDetailPage.tsx` 에서 3건**. 목록에서 '주문 완료 안내' 를 지우면 '…안내를 삭제했습니다' ✓, **상세에서 같은 템플릿을 지우면 '…안내'을(를) 삭제했습니다'** ✗ | gap |
| ERP-15 | P1 | 대형 목록 계약이 없다 — 전량 렌더, virtualization·page size cap 없음(IA-04 gap 과 같은 뿌리). **이메일 빌더에도 같은 문제가 있다** — 블록 수 상한이 없고 캔버스가 전량 렌더하며, 되돌리기 이력이 **본문 전체 스냅샷 50벌**을 든다(`email/useHistory.ts:12-13`) | 시드 1,000건 → 1,000행 DOM. 블록 200개짜리 이메일 → 캔버스 전량 렌더 + 스냅샷 50벌 | gap |
| EXC-05 | P1 | 프론트 타임아웃 상한 없음 — 앱 전체 `AbortSignal.timeout` 0건 | 응답하지 않는 어댑터를 넣으면 로딩이 무한 지속(그리고 STATE-01 gap 때문에 **빈 화면**으로 지속된다) | gap |
| EXC-06 | P1 | 에러 타입이 status 를 지닌다(`HttpError`) — `?status=<op>:<code>` 로 재현 가능. **실제 데이터 조건으로도 404·409 가 발현된다**(어댑터의 존재 검사 — `crud.ts:196,217-219,256-258,275-277`) — 1.0 이 gap 으로 잡았던 '스위치로만 재현' 문제는 CRUD 축에서 해소돼 있다. **그러나 403·429·400 전용 surface 는 여전히 없고**, **상태 변경 경로는 두 방식 모두 재현 불가**다(어댑터 밖) | `/marketing/templates/nope/edit` → 실제로 404 갈래 ✓. `?status=…:save:403` → 일반 실패 배너로 수렴(권한 전용 문구 없음) ✗. 토글 실패는 어떤 방식으로도 재현 불가 ✗ | gap |
| EXC-07 | P1 | 422 + `violations` 를 `setError` 로 그 입력에 꽂고 첫 필드로 `setFocus`(`useCrudForm.ts:198`). 폼 레벨 배너는 generic 전용. **단 이메일은 필드 경로가 중첩이다**(`content.subject`·`content.blocks` — `validation.ts:194,211`) — 서버가 그 경로를 정확히 내려야 인라인이 붙는다 | `?status=…:save:422` + violations 픽스처 → 해당 필드 인라인 + 포커스. **블록 단위 위반은 붙을 자리가 없다**(INSPECT 는 선택된 블록만 그린다) | pass |
| EXC-10 | P1 | `settleAll` 로 allSettled semantics, 'N건 중 M건 실패' 보고, 전원 성공에만 invalidate + 선택 해제. **실패 id 를 돌려주지 않아** 재시도가 성공분까지 재실행한다. **없는 id 는 이제 실패로 집계된다**(어댑터 409 — `crud.ts:275-277`) — 유령 삭제는 아니다 | 부분 실패 시 어느 행이 실패했는지 UI 에 표시되지 않는다 | gap |
| EXC-11 | P1 | 오프라인 감지 없음 — 앱 전체 `navigator.onLine` 0건 | offline 토글 → 배너 없음 | gap |
| EXC-12 | P1 | **부분 충족.** `useCrudForm` 이 `isNotFound` 로 `'not-found'`/`'error'` 를 가르고 편집기가 404 에는 '다시 시도' 를 주지 않는다(`TextTemplateEditor.tsx:250-271` · `EmailTemplateEditor.tsx:149-170`). 어댑터가 `crud.ts:217-219` 에서 실제로 `HttpError(404)` 를 던지므로 **스위치 없이 실제 데이터로 발현된다.** **그러나 두 곳이 이 갈래를 버린다**: ① 편집기 **라우트**가 `detail.error` 를 먼저 잡아 한 문구로 끝낸다(`MessageTemplateEditorPage.tsx:48-60`) — 편집기 안의 404 문구에 도달하기 어렵다 ② **상세는 갈래 자체가 없다**(`MessageTemplateDetailPage.tsx:234-245` — 한 문구 + 재시도 없음), 게다가 그 문구가 '이미 삭제되었을 수 있습니다' 라 **5xx 일 때 사실이 아닌 말을 한다** | `/marketing/templates/nope/edit` → **라우트의 '메시지 템플릿을 불러오지 못했습니다.' + 목록으로**(편집기의 '찾을 수 없습니다' 가 아니다). `/marketing/templates/nope` → '메시지 템플릿을(를) 불러오지 못했습니다. 이미 삭제되었을 수 있습니다.' — 404 와 500 이 같은 문구 | gap |
| EXC-14 | P1 | 이 화면에 optimistic write 가 없다 — 모든 쓰기가 비관적이다. **사용 여부 토글도 낙관 반영이 아니다** — 무효화 후 재조회로 배지가 바뀐다(`MessageTemplateDetailPage.tsx:191-193`). 롤백할 낙관 반영이 없다 | 토글 클릭 → `LATENCY_MS` 뒤에 배지가 바뀐다(즉시 바뀌었다가 되돌아가는 일이 없다) | pass(해당 없음에 준함) |
| EXC-18 | P1 | selection scope 가 '현재 보이는 행' 이다. Shift-click range 없음 · 대량 임계값 강화 confirm 없음 · progress/cancel 없음 | 50행 선택은 클릭 50회. 일괄 삭제에 progress·cancel 없음 | gap |
| EXC-19 | P1 | 세션 만료 전 연장 프롬프트 없음. dirty 폼 draft 스냅샷 없음 — 401 리다이렉트가 프로그램적이라 FEEDBACK-04 가드가 발화하지 못한다. **이 화면에서 손실이 특히 크다** — 이메일 편집기는 블록 스택 전체가 저장되지 않은 폼 값이고, 되돌리기 이력 50벌도 함께 사라진다 | `?status=…:save:401` → `/login` 이동, 블록 스택 소실 | gap |
| EXC-20 | P1 | 5xx 실패가 `referenceOf(cause)` 로 참조 코드를 뽑아(`useCrudForm.ts:203`) `FormServerError` 배너에 '오류 코드 <ref>' 로 노출하고 복사 가능하다. raw body/stack/status 를 산문으로 렌더하지 않는다. **단 상세의 실패 표면 3종(로드·삭제·상태변경)에는 참조 코드가 없다** — 화면이 직접 그린 리터럴 문구다(`MessageTemplateDetailPage.tsx:228,238`) | `?status=…:save:500` → '저장하지 못했습니다' + 복사 가능한 오류 코드 ✓. `?status=…:delete:500` → 상세에서 '삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.' — **코드 없음** | gap |

## 4. quality-bar 가 다루지 않는 축

### 4.1 성능 예산

| 축 | 예산 | 현재 |
|---|---|---|
| 목록 첫 렌더(p95) | 사용자 조작 → 첫 행 가시 **1.5초 이내**(백엔드 연결 후) | **측정 불가** — 픽스처. `LATENCY_MS = 400`(`shared/crud/dev.ts:12`)은 **로딩 상태를 화면에서 볼 수 있게 하는 개발용 지연이며 예산이 아니다** |
| 목록 응답(p95) | `GET /api/marketing/message-templates` **400ms 이내** | 미정 — BE-036 EP-01 이 **전량 반환 + 이메일 블록 스택 포함**. **목록은 블록을 쓰지 않는다**(검색은 이름과 문자 본문/이메일 제목만 — `MessageTemplateListPage.tsx:102-113`) → 서버 검색 도입 시 `blocks` 제외 검토(BE-036 §7.12 #13) |
| 상세·편집기 첫 렌더 | 진입 → 무언가 보이기 **즉시** | **미충족** — `LATENCY_MS` 동안 **빈 화면**이다(STATE-01 gap). 스켈레톤 0건 |
| 재조회 횟수 | 목록 진입당 1회. `staleTime` 30초 내 재진입 0회. 창 포커스 재조회 0회 | 충족. **상세 → 편집기 이동은 같은 키를 공유해 재조회 0회**(`MessageTemplateEditorPage.tsx:9-10`) |
| 검색 입력당 연산 | 서버 검색 도입 시 **키워드 확정당 요청 1회**(디바운스) | 충족(COMP-10 pass). 클라이언트 필터 비용은 1.0 보다 낮다 — 이메일은 제목만 훑는다 |
| 표 DOM | 한 화면 **최대 10행**(페이지네이션 전제) | **미충족** — 전량 렌더(IA-04 gap) |
| 등급·바이트 갱신 | 입력 → 반영 **동기(1 프레임)** | 충족하나 **메모이제이션이 없다** — `byteLengthOf(values.body)` 가 매 렌더 본문 전체를 순회한다(`TextTemplateEditor.tsx:212`). 2,000자면 2,000회 `codePointAt`. 프레임 예산 안이지만 **키 입력마다 재계산**된다 |
| 폼 유효성 판정 | 입력 → 저장 버튼 상태 반영 **동기** | **비용이 크다** — `isTextTemplateValid(values)`/`isEmailTemplateValid(values)` 가 **폼 전체를 zod `safeParse`** 한다(`TextTemplateEditor.tsx:208` · `EmailTemplateEditor.tsx:111`). `watch()` 가 값 변경마다 새 객체를 주므로 `useMemo` 가 사실상 매 키 입력마다 재실행된다. 이메일은 그 값에 **블록 스택 전체**가 들어 있다 |
| 되돌리기 메모리 | 상한 있음 | 충족(50) — **단 이메일은 스냅샷 1벌이 블록 스택 전체다**(`email/useHistory.ts:12-13`). 블록이 많은 템플릿에서 50벌은 작지 않다 |
| 번들 | 이 화면 전용 청크 예산 미정 | **라우트 분할이 되어 있다** — 세 페이지 전부 `lazy()`(App.tsx:147-157). **이메일 빌더(13파일 · `email/InspectPanel.tsx` 868줄 · `email/styles.ts` 457줄)가 목록 진입에도 함께 로드되는지**는 확인 필요 — `MessageTemplateEditorPage` 만 `EmailTemplateEditor` 를 정적 import 하므로 목록 청크에는 들어가지 않아야 한다 |

### 4.2 가용성 · 복원력

| 시나리오 | 요구 동작 | 현재 상태 |
|---|---|---|
| 목록 조회 실패 | 인라인 배너 + 재시도 | 충족(STATE-02) |
| 저장 중 서버 5xx | 입력 보존 + 배너 + 참조 코드 | 충족(EXC-20) — **편집기 한정.** 상세의 실패에는 참조 코드가 없다 |
| 저장 중 동시 삭제 | 유령 저장 금지 + 충돌 다이얼로그 + 입력 보존 | **충족** — 어댑터가 409 를 던지고(`crud.ts:256-258`) `FormConflictDialog` 가 받는다 |
| **상태 변경 중 동시 삭제** | **실패 통지 + 화면 갱신** | **미충족** — 조용히 성공한다(`store.ts:326` `map`). 오류도 성공 통지도 없다(EXC-04 · FEEDBACK-03 gap) |
| **둘 다 존재하는 동시 편집** | **충돌 감지(version/ETag)** | **미충족** — last-write-wins. **이메일은 블록 스택 전체가 치환되므로 상대의 블록이 통째로 사라진다**(BE-036 §7.3-2) |
| 삭제된 템플릿 링크 열기 | '찾을 수 없음' + 목록으로(재시도 없음) | **부분 충족** — 편집기 라우트는 한 문구로 끝내고(`MessageTemplateEditorPage.tsx:48-60`), 상세는 404/5xx 를 가르지 않는다(EXC-12 gap) |
| 저장 중 세션 만료(401) | 재인증 후 원래 경로 + 입력 복원 | **미충족** — 블록 스택·되돌리기 이력이 사라진다(EXC-19 gap) |
| 응답 없는 서버 | 상한에서 abort + '시간이 초과되었습니다' | **미충족** — 타임아웃 상한 없음(EXC-05). 게다가 상세·편집기는 **빈 화면**으로 무한 대기한다(STATE-01) |
| 오프라인 | 배너 + write 경고 + 복귀 시 refetch | **미충족**(EXC-11 gap) |
| 화면 이탈 중 요청 | abort, 실패로 세지 않음 | 충족(EXC-09) — **상태 변경만 예외**(signal 미전달) |
| 렌더 예외 | 셸 유지 + 복구 UI | 충족(EXC-01 상속) |
| **Active 템플릿의 URL 직접 편집** | **차단 또는 서버 거절** | **미충족** — 라우트 가드가 없어(App.tsx:339) `status.ts:56-59` 의 규칙이 무력화된다. **서버가 유일한 방어선이 될 수 있으나 그 판정도 미정**(BE-036 §7.12 #14) |
| **미완성 블록으로 발행** | **차단** | **미충족** — 검증이 블록 개수만 본다(`validation.ts:207-214`). URL 없는 버튼이 고객에게 나간다(BE-036 §7.5) |
| **발송 불가 길이로 발행** | **차단** | **미충족** — 한글 2000자(4000byte)가 LMS 한도의 2배인데 저장이 통과한다(COMP-12 · BE-036 §7.4) |

### 4.3 데이터 보존 · 감사

| 축 | 요구 | 현재 |
|---|---|---|
| **상태 전이 이력** | 누가 언제 발행했고 언제 껐는가 | **없음** — 상태는 현재값 1개뿐이다. 상세의 카드 제목이 '상태 이력'(`copy.ts:110`)인데 내용은 현재값 8줄이다(`MessageTemplateDetailPage.tsx:344-366`) — **UI 가 없는 것을 있다고 부른다** |
| 편집자 기록의 해상도 | '내용을 고친 사람' 과 '스위치를 누른 사람' 구분 | **미충족** — 상태 변경도 `lastEditedBy` 를 덮는다(`store.ts:328`). 토글 한 번이 본문 작성자를 지운다 |
| 이력 필드의 출처 | 서버가 인증 주체로 채운다 | **구조는 충족, 값은 미충족** — 쓰기 입력 타입에 이력 필드가 없어(`MessageTemplateDraft` — `store.ts:201-204`) 클라이언트가 보낼 수 없다. **다만 현재는 픽스처 상수(`CURRENT_EDITOR = '홍성보'` — `:212`)를 찍는다.** `TODO(backend)` 가 그 자리에 있다(`:210`) |
| 시각의 신뢰성 | 서버 시각 기준 | **부분 충족** — 저장은 `new Date().toISOString()`(클라이언트 UTC — `:214-216`), 시드는 로컬 표기 문자열. 두 기준이 섞여 있다(ERP-08 gap) |
| 템플릿 변경 이력 | 발송에 쓰인 문구가 나중에 바뀌면 추적 가능한가 | **없음** — 버전 이력이 없다. 다만 삽입이 값 복사라 이미 만들어진 회차는 자기 본문을 보존한다(BE-036 §7.7) |
| 삭제 복구 | soft-delete 계약 | **없음**. `inactive` 가 '끄기' 를 담당하므로 삭제는 진짜 삭제다(`types.ts:16-17` 이 그 구분을 명시한다) — 계약으로는 일관되나 **복구 경로는 없다** |
| 첨부 파일 | 업로드된 바이트의 보존 | **파일이 존재하지 않는다** — 파일명만 저장된다(`components/ImageAttachRow.tsx:142-143`). 템플릿을 복원해도 이미지는 복원할 것이 없다 |

## 5. 미충족(gap) 요약 → 이관

| # | 요구 ID | P | 내용 | 범위 | 이관 |
|---|---|---|---|---|---|
| 1 | **EXC-04** · FEEDBACK-03 · EXC-06 | **P0** | **상태 변경(발행·사용 여부 토글)이 공용 어댑터 계약 밖에 있다** — `setMessageTemplateStatus` 직접 호출(`MessageTemplateDetailPage.tsx:186-194` → `store.ts:325-331`). 존재 검사 없음(없는 id 에 조용히 성공 — `store.ts:326`) · `onError` 없음(**실패 표면 0**) · `signal`·멱등키 미전달 · `?fail=`/`?status=` 재현 불가. **이 화면에서 가장 흔한 조작이라고 스스로 말하는 그 조작이다**(`MessageTemplateListPage.tsx:6-7`). 어댑터를 우회한 판단 자체에는 근거가 있으나(`store.ts:319-322`) 그 대가가 계약 전체다 | **이 화면** | **프론트 구현(최우선) · 백엔드 명세(BE-036 §7.2 · §7.12 #1)** |
| 2 | **STATE-01** | **P0** | **상세·편집기에 로딩 표현이 없다** — 둘 다 도착 전 `return null`(`MessageTemplateDetailPage.tsx:247` · `MessageTemplateEditorPage.tsx:64`). 사이드바만 있고 본문이 빈 흰 판이다. 편집기 라우트의 근거(`:62-63` — 먼저 그렸다가 갈아치우면 입력이 사라진다)는 '스켈레톤도 그리지 말라' 는 뜻이 아니다. **목록 축은 pass** | **이 화면**(호출부 2곳) | UI 기획 · 프론트 구현 |
| 3 | **IA-04** | **P0** | Pagination 이 없다 — 필터 결과 전량 렌더. BE-036 EP-01 도 페이징 파라미터가 없다 | 앱 전역 | UI 기획 · 백엔드 명세 |
| 4 | **IA-02** | **P0** | 단일 title 메커니즘 미충족 — ① 상세에 `<h1>` 이 **2개**(`AppHeader.tsx:101` + `MessageTemplateDetailPage.tsx:268`) ② **편집기의 주 제목이 heading 이 아니라 `<input aria-label>`**(`TemplateEditorShell.tsx:134-147`)이라 heading 탐색으로 도달할 수 없고, 상단 h1 이 지금 하는 일(등록/수정)을 반영하지 않는다 ③ 잎 라벨('발송 템플릿 관리' — nav-config.ts:181)과 엔티티 라벨('메시지 템플릿' — `MessageTemplateListPage.tsx:29`)이 **서로 다른 낱말이다**. **목록 라우트는 h1 1개 — 그 축은 pass** | 앱 전역(`AppHeader`) + **이 화면**(②③) | UI 기획 · 프론트 구현 |
| 5 | **EXC-03** | **P0** | 쓰기 권한 게이팅 미배선 — **상세 헤더의 삭제·수정·발행·사용 여부 토글도 권한을 조회하지 않는다**. 조회 권한만 가진 운영자가 캠페인을 중단시킬 수 있다. `useRouteWritePermissions` 를 `pages/marketing/**` 에서 쓰는 코드가 0건(훅·선례는 완비) | **이 섹션**(앱 전역 아님) | UI 기획 · 프론트 구현 |
| 6 | ERP-13 | P1 | **한 화면 안에서 조사 규칙이 갈렸다** — 상세가 리터럴 `을(를)` 을 3곳에서 출하한다(`MessageTemplateDetailPage.tsx:223,238,393`). 목록의 같은 다이얼로그는 `objectParticle` 로 받침을 고른다(`useCrudList.tsx:170,218`). 상세가 공용 셸을 안 쓰면서 헬퍼도 함께 놓쳤다 | **이 화면**(3줄) | UI 기획 · 프론트 구현 |
| 7 | EXC-12 · EXC-20 | P1 | **상세의 실패 표면이 얇다** — ① 404 와 5xx 를 가르지 않고 재시도도 없다(`:234-245`)면서 문구는 '이미 삭제되었을 수 있습니다' 라 5xx 일 때 거짓말을 한다 ② 참조 코드(`traceId`)를 노출하지 않는다(`:228,238`) ③ 편집기 **라우트**도 `detail.error` 를 먼저 잡아 편집기 안의 404 갈래에 도달하기 어렵게 만든다(`MessageTemplateEditorPage.tsx:48-60`) | **이 화면** | 프론트 구현 · UI 기획 |
| 8 | COMP-12 | P2 | **길이 기준이 갈렸고 발송 불가능한 템플릿이 발행된다** — 카운터는 문자, 등급은 바이트, **콜아웃은 90 을 `자` 라 부른다**(`copy.ts`). 템플릿명(60)에 카운터도 `maxLength` 도 없고 이메일 제목은 상한 자체가 없다 | 이 화면 | UI 기획 · 백엔드 명세(BE-036 §7.4) |
| 9 | A11Y-11(역방향) · A11Y-16 · A11Y-13 · COMP-04 · IA-03 | P1 | **접근성 4건** — ① 이미지 폭 입력의 `aria-describedby` 가 정상 상태에서 **가리키는 대상이 없다**(`email/InspectPanel.tsx:661` vs `email/controls/FieldBox.tsx:93-97`) ② SMS→LMS 승격·토글 결과·블록 추가삭제가 **announce 되지 않는다** ③ 폼 진입 첫 필드 포커스 없음(그리고 버튼이 잠겨 있어 '제출 → 포커스 이동' 경로 자체가 잘 발현되지 않는다) ④ 필수 표식(`*`)이 편집기에 하나도 없다 ⑤ breadcrumb 없음(3단 깊이라 필요가 크다) | 이 화면 + 앱 전역 | UI 기획 · 프론트 구현 |
| 10 | IA-12 · COMP-09 · IA-14 | P1/P2 | **셸 중복 · truncation 부재 · 반응형 미선언** — 상세가 `TemplateEditorShell` 을 쓰지 않고 헤더·백링크 스타일 4쌍을 복제한다. 목록 5컬럼에 truncation 이 하나도 없다. 이메일 빌더 3단의 최소 지원 폭이 선언돼 있지 않다(`styles.ts:50` 은 1280px 기준을 주석으로만 남긴다) | 이 화면 | 프론트 리팩터 · UI 기획 |
| 11 | ERP-12 · ERP-15 · ERP-08 | P1/P2 | 목록 export 없음 · **이메일 `HTML 내려받기` 가 배선되지 않음**(`email/EmailToolbar.tsx:215-222`) · 대형 목록/대형 블록 스택 계약 없음 · `lastEditedAt` 이 UTC 저장 + 로컬 렌더라 시드와 기준이 다름 | 앱 전역 + 이 화면 | UI 기획 · 백엔드 명세 |
| 12 | EXC-19 · EXC-05 · EXC-11 | P1 | 세션 만료 시 **블록 스택 + 되돌리기 이력 50벌**이 사라짐 · 프론트 타임아웃 상한 없음(게다가 빈 화면으로 무한 대기 — #2와 겹친다) · 오프라인 감지 없음 | 앱 전역 | 프론트 구현 · 백엔드 명세 |
| 13 | EXC-10 · EXC-18 | P1 | 일괄 삭제가 실패 id 를 안 줌 · Shift-range/대량 confirm/progress/cancel 없음. **없는 id 는 이제 실패로 집계된다**(어댑터 409) — 유령 삭제는 아니다 | 앱 전역 | UI 기획 |
| 14 | (quality-bar 밖) | — | **미완성 블록·발송 불가 길이로 발행이 가능하다** — 검증이 블록 개수만 보고(`validation.ts:207-214`) 바이트 한도를 보지 않는다. URL 없는 버튼이 고객에게 나간다. **quality-bar 에 이를 겨냥한 요구가 없어 §2 에 행이 없으나 실무 위험은 P0 gap 에 준한다** | **이 화면** | **UI 기획 · 백엔드 명세(BE-036 §7.4 · §7.5) — 최우선** |
| 15 | (quality-bar 밖) | — | **[해소 — 2026-07-19]** ~~치환변수 어휘가 두 벌이다~~ — 결함은 실재했다(문자 5종 한글 키 · 이메일 7종 영문 키, 상호 미검증, 픽스처가 이미 어휘 밖 토큰 사용). **두 목록이 모두 삭제되고 `shared/domain/template-variable-catalog.ts` 한 벌로 통합되어 해소됐다** — 카탈로그 밖 토큰은 네 스키마 전부에서 저장이 거절된다(`validation.ts` `unknownVariableError`). 기술은 FS-036 §3.5 · EL-091 | 이 화면 | **해소. 서버측 화이트리스트만 BE-036 §7.6 에 남는다** |
| 16 | (quality-bar 밖) | — | **테스트 공백** — `MessageTemplateListPage`(필터·검색·행 클릭 목적지)·`MessageTemplateEditorPage`(`?kind=` 낙하·종류 분기)·`TextTemplateEditor` 컴포넌트를 겨누는 테스트가 **0건**이다. 덮인 것은 순수 함수(`message-templates.test.ts` 380줄) · 이메일 빌더(`email/EmailBuilder.test.tsx` 460줄) · 상세의 문구 갈림(`MessageTemplateDetailPage.test.tsx` 136줄)뿐 | 이 화면 | 프론트 구현(테스트) |
| 17 | (quality-bar 밖) | — | **옛 알림톡 화면이 고아로 남아 있다** — `/marketing/templates/alimtalk*`(App.tsx:334-336)에 라우트는 살아 있으나 사이드바에 없고 링크도 없다. **1.0 이 지적한 결함들(승인 상태 클라이언트 지정 등)은 닫힌 것이 아니라 도달 불가다** — 재구축 시점·모델이 미정(BE-036 §4.9) | 앱 전역 | **아키텍처 · UI 기획** |

## 6. 측정 도구 · 재현 스위치

> **E2E 미실행 — 이 문서의 모든 판정 근거는 코드 대조다.** 아래는 판정을 재현할 때 쓸 스위치이며, 실제 구동 결과가 아니다.

**실패 재현** — `shared/crud/dev.ts` 의 `failIfRequested(scope, op)`(`:90`) 규약. 이 화면의 **scope 는 `marketing-message-templates`**(`data-source.ts:17,41`), **op 는 `list` · `detail` · `save` · `delete`** 4종(`createStoreAdapter` 에서 `create`/`update` 가 **같은 `save` op 를 공유**한다).

| 스위치 | 효과 | 이 화면에서 보는 것 |
|---|---|---|
| `?fail=marketing-message-templates:list` | 목록 조회 실패 | FS-036-EL-011 배너 (STATE-02) |
| `?fail=marketing-message-templates:detail` | 상세 조회 실패 | **두 곳이 다르게 그린다** — `/:id` 는 FS-036-EL-089(한 문구·재시도 없음), `/:id/edit` 는 FS-036-EL-031 ①(라우트 배너) |
| `?fail=marketing-message-templates:save` | 등록·수정 실패(둘 다) | FS-036-EL-039 배너 |
| `?fail=marketing-message-templates:delete` | 삭제 실패 | 목록·상세 각각의 다이얼로그 안 배너 (FEEDBACK-02) |
| `?fail=all` | 전 op 실패 | 위 전부. **상태 변경은 제외 — 어댑터를 지나지 않는다**(§5 #1) |

**status 재현** — `?status=<op>:<code>` · `?status=<scope>:<op>:<code>` · `?status=all:<code>`.

| 스위치 | 이 화면에서 보는 것 |
|---|---|
| `?status=save:409` | 충돌 다이얼로그. **실제 동시 삭제로도 뜬다**(`crud.ts:256-258`) — 스위치 전용이 아니다 |
| `?status=save:422` | 필드 인라인 + 첫 위반 포커스 (EXC-07). **이메일은 `content.subject` 같은 중첩 경로가 필요하다** |
| `?status=save:500` | 배너 + 복사 가능한 오류 코드 (EXC-20) |
| `?status=detail:404` | 편집기의 '찾을 수 없습니다' 갈래. **단 편집기 라우트가 먼저 잡으므로**(`MessageTemplateEditorPage.tsx:48-60`) 그 문구를 보려면 라우트 분기를 건너뛰어야 한다(EXC-12) |
| `?status=list:401` | 전역 인터셉터 → `/login?…&reason=session_expired` (EXC-02) |
| `?status=save:403` | 일반 실패 배너로 수렴 — 권한 전용 문구 없음(EXC-06) |

> **이 화면의 진단상 특이점**: 1.0 에서는 '스위치로는 뜨는데 실제 데이터로는 안 뜨는' 대비가 결함의 증거였다. **여기서는 반대다** — CRUD 4종은 실제 데이터로도 404/409 가 발현되는데(어댑터의 `exists` — `crud.ts:196`), **상태 변경은 스위치로도 실제 데이터로도 아무것도 발현되지 않는다.** 그 '어떤 방법으로도 실패시킬 수 없다' 는 사실이 §5 #1 의 가장 짧은 재현이다.

**`?delay=` 는 이 화면에 없다.** `shared/crud/dev.ts` 는 이 스위치를 구현하지 않으며 지연은 `LATENCY_MS = 400`(`:12`) 상수 고정이다. STATE-01 의 두 축은 그 400ms 안에 판정한다 — **목록은 스켈레톤, 상세·편집기는 빈 화면**이다.

**그 밖의 도구**: 저장소 직접 조작(DevTools 에서 `removeMessageTemplate(id)` 호출 → §5 #1 재현) · 조사 폴백형 grep(`을(를)` → `MessageTemplateDetailPage.tsx` 3건) · hex/px 리터럴 grep(TOKEN-01) · `document.querySelectorAll('h1').length`(IA-02 — 목록 1 / 상세 2 / 편집기 1) · `useRouteWritePermissions` import grep(EXC-03 — marketing 0건) · 한글 1,500자 본문(COMP-12 바이트 초과 재현) · 이미지 블록 기본 폭 600 에서 `aria-describedby` 대상 확인(§5 #9) · ESLint/stylelint 0 warning.

## 7. 자기 점검

- [x] **채점 대상이 바뀌었다는 사실**을 문서 머리와 §1 에 명시하고, 1.0 판정을 **하나도 재사용하지 않았다**(30행 전수 재채점)
- [x] quality-bar 요구 문구를 **재서술하지 않았다** — ID 로만 참조하고 '이 화면에서 어떻게/무엇으로 판정하는가' 만 적었다
- [x] §2 가 **P0 30건 전수**를 담았다. 빈칸 0건
- [x] 모든 `pass` 에 코드 근거(파일:라인). 모든 `gap` 에 재현 가능한 측정 기준. 모든 `N/A` 에 사유. 모든 `종속` 에 '이 화면의 어느 표면이 상속하는가'
- [x] §2.1 산수 검산 — 12(pass) + 11(종속) + 2(n-a) + 5(gap) = **30** ✅ (차원별 STATE 3 · TOKEN 5 · COMP 1 · FEEDBACK 3 · A11Y 4 · MOTION 3 · IA 5 · EXC 6 = **30** ✓)
- [x] §3 은 **표면이 실재하는 P1·P2 만** 담았다. 1.0 에 없던 표면(`ToggleSwitch`·이메일 빌더·우측 미리보기)이 생겨 MOTION-03·IA-10 의 적용이 바뀐 것을 반영했다
- [x] §4.1 에 **`LATENCY_MS = 400` 이 개발용 지연이며 예산이 아님**을 명시했다
- [x] §6 의 `?fail=` scope(`marketing-message-templates`)·op 목록을 **어댑터 코드에서 직접 확인**했다. `?delay=` 를 쓰지 않았고 이 화면에 없음을 명시했다
- [x] 'E2E 미실행 — 판정 근거는 코드 대조' 를 §6 머리에 명시했다
- [x] §5 의 gap 이 FS-036 §7 · BE-036 §7.12 와 상호 참조된다
- [x] **브리핑의 사실 주장을 그대로 쓰지 않고 코드로 재확인했다.** 바로잡은 것: ① `createStoreAdapter` 의 존재 검사 줄번호는 `crud.ts:196,217-219,256-258,275-277` 이다 ② 이 화면의 빈 상태는 4개 맥락을 모두 넘기므로 1.0 이 gap 이던 STATE-05 가 **pass** 다(`MessageTemplateListPage.tsx:201-206`) ③ 옛 폼이 SMS 바이트를 강제했다는 주장은 사실이 아니다(`TemplateFormPage.tsx:476-481` 은 표시 전용) — COMP-12 근거에서 뺐다
- [x] **코드로 새로 발견해 §2·§3·§5 에 넣은 것**: 상세·편집기의 로딩 표현 부재(STATE-01) · 상태 변경 경로의 실패 표면 부재(EXC-04 · FEEDBACK-03 · EXC-06) · 상세의 리터럴 조사 3건(ERP-13) · **정상 상태의 dangling `aria-describedby`**(§3 A11Y-11 역방향) · 편집기 주 제목이 heading 이 아님(IA-02) · 상세가 셸을 복제함(IA-12) · 폼 유효성 판정이 매 키 입력마다 전체 `safeParse`(§4.1)
- [x] **quality-bar 에 행이 없는 실무 위험(미완성 블록·발송 불가 길이로 발행 · 치환변수 어휘 이중화)을 §2 표에 억지로 끼워 넣지 않고 §4.2 · §5 #14·#15 로 명시했다**
