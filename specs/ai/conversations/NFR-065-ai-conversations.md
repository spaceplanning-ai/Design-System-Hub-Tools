---
id: NFR-065
title: "AI 에이전트 대화 목록 비기능 명세"
functionalSpec: FS-065
backendSpec: BE-065
qualityBar: specs/quality-bar.md
owner: 명세 리뷰
reviewer: 기능 명세
gate: G9
status: draft
version: 1.0
date: 2026-07-19
---

# NFR-065. AI 에이전트 대화 목록 비기능 명세

## 1. 이 문서의 위치

| 항목 | 내용 |
|---|---|
| 대상 화면 | FS-065 AI 에이전트 대화 목록 (`/ai/conversations` — 상단 액션 + 보관 안내 + 대화 목록) |
| 상위 기준 정본 | `specs/quality-bar.md` — 9차원 100요구(P0 30건). **요구 문구의 정본은 그 문서다** |
| 이 문서의 역할 | quality-bar 를 **이 화면에 적용한 판정표**다. 요구를 재서술하지 않고 **ID 로만 참조**하며, '이 화면에서 어떻게 충족되는가(코드 근거)' 와 '무엇을 재현하면 판정되는가(측정 기준)' 만 쓴다 |
| 함께 읽는 문서 | FS-065(요소·예외) · BE-065(엔드포인트·보관 정책). §5 의 gap 은 FS-065 §7 · BE-065 §7.7 과 **같은 항목을 가리킨다**. 형제 판정표는 NFR-064(새 채팅) — **두 화면은 같은 어댑터(`pages/ai/data-source.ts`)와 같은 엔드포인트를 공유하므로**(BE-065 §7.1) 어댑터 축의 gap 이 겹친다 |
| 갱신 규칙 | quality-bar 가 개정되면 §2 의 30행을 재판정한다. 이 화면의 코드가 바뀌면 근거의 `파일:라인` 을 갱신한다. **판정을 코드보다 먼저 고치지 않는다** |
| 판정 방식 | **E2E 미실행 — 판정 근거는 코드 대조다**(§6) |
| 판정 기준일 | **2026-07-19 · HEAD `a91b288`** 기준 코드 대조. **⚠ 이 화면의 구현은 아직 커밋되지 않았다** — `apps/admin/src/pages/ai/**` 는 작업 트리에 untracked 로 존재한다(`git status --porcelain` → `?? apps/admin/src/pages/ai/`). 따라서 `파일:라인` 은 커밋 스냅숏이 아니라 **작업 트리의 현재 내용**을 가리킨다 |
| 이 화면의 성격 | **대화가 보관되지 않는다**(메모리뿐 — `_shared/conversations.ts:41`). 이 화면은 그 사실을 **숨기지 않고 배너로 밝힌다**(`ConversationsPage.tsx:136-139` · FS-065-EL-002). 그것이 이 화면 최대의 강점이며 §2 의 gap 목록과 별개로 §1 에 먼저 적는다 — 없는 기능을 있는 것처럼 보이게 하지 않는 것은 FEEDBACK-03 의 취지 그 자체다. `localStorage` 로 '저장된 척' 하지 않겠다는 판정도 코드 머리말에 남아 있다(`conversations.ts:6-8`) |

### 1.1 표기 규약

| 기호 | 뜻 |
|---|---|
| 적용 `직접` | 이 화면(전용 모듈 `pages/ai/ConversationsPage.tsx`)의 코드가 충족을 결정 — 판정 책임이 이 문서에 있다 |
| 적용 `상속` | AppShell·DS(`@tds/ui`)·공용 프레임워크가 결정하고 이 화면은 소비자 — **이 화면에 그 표면이 실재할 때만** 적는다. 판정은 소유 문서에 종속되며, 여기서는 **이 화면의 어느 표면이 그 계약을 상속하는지**를 못 박는다 |
| 적용 `N/A` | 표면(appliesTo)이 이 화면에 없다 — **반드시 사유** |
| 판정 `pass` | 코드 근거로 충족 확인 |
| 판정 `gap` | 미충족 확인 — §5 로 이관. **P0 의 gap 은 quality-bar '배치 실패' 사유** |
| 판정 `종속` | `상속` 항목 — 소유 문서/DS 판정을 따른다 |

## 2. P0 30건 — 이 화면 적용 판정 (전수)

| 요구 ID | 차원 | 적용 | 이 화면에서의 충족 방식 (코드 근거) | 측정 기준 (재현 절차) | 판정 |
|---|---|---|---|---|---|
| STATE-01 | STATE | 직접 | 4상태 중 **정확히 하나**만 그린다 — 분기가 한 줄의 삼항 사슬로 배타적이다(`ConversationsPage.tsx:141-181`): `isError` → 실패 배너 / `firstLoading` → '불러오는 중…' / `items.length === 0` → `Empty` / 그 외 → 목록. `firstLoading = conversations.isFetching && conversations.data === undefined`(`:93`)라 **최초 로드에만** 로딩이 뜨고, 재조회 중에는 `placeholderData: (previous) => previous`(`queries.ts:24`)가 이전 행을 유지해 목록이 비지 않는다. 실패가 empty 로 폴백하지 않는다(순서상 `isError` 가 먼저다) | `?delay=3000` → '불러오는 중…' 만(빈 상태 문구 없음). `?empty=list` → `Empty` 만. `?fail=ai:list` → 실패 배너만. 삭제 성공 후 배경 재조회(`queries.ts:68`) 중 목록이 스켈레톤·빈 화면으로 바뀌지 **않음** | pass |
| STATE-02 | STATE | 직접 | **부분 충족 — 자리는 옳고 복구 수단이 없다.** 조회 실패가 **인라인 `Alert tone="danger"`** 로 뜨고(`ConversationsPage.tsx:141-142`, FS-065-EL-007) 토스트로 처리되지 않으며 empty 로 폴백하지 않는다(§STATE-01). 그러나 quality-bar 가 함께 요구하는 **'명시적 다시 시도 컨트롤'이 없다** — `conversations.refetch` 를 화면이 호출하지 않는다(`ConversationsPage.tsx` grep = **0건**). 실패하면 관리자가 할 수 있는 일은 브라우저 새로고침뿐이고, 그것은 **대화 자체를 지운다**(§4.3) — 이 화면에서는 재시도 부재가 다른 화면보다 비싸다 | `?fail=ai:list` → danger Alert O · 토스트 0건 O · **'다시 시도' 버튼 0건** X. 배너 안의 focusable 요소 수 = 0 | **gap** |
| STATE-04 | STATE | N/A | **페이지네이션·행 선택 표면이 이 화면에 없다.** FS-065 §1.1 이 둘 다 명시적으로 제외한다(일괄 선택 삭제 없음 · 페이징 없음 — '대화 수가 세션 수명에 묶여 적다'). 목록은 `items` 전량을 한 번에 그리고(`ConversationsPage.tsx:160`) 체크박스가 없다. clamp 할 page 도, 해제할 `selectedIds` 도 존재하지 않는다 | — | n-a |
| TOKEN-01 | TOKEN | 직접 | **미충족 — CSS border 키워드 1건.** hex·px 리터럴은 0건이고 이 화면이 공유하는 `ai.css` 는 완전히 깨끗하다. 그러나 행 구분선이 인라인 style 로 `borderBottom: 'thin solid var(--tds-color-border-subtle)'`(`ConversationsPage.tsx:56`) 이다 — quality-bar TOKEN-01 은 `(outline\|border): (thin\|medium\|thick)` **0건**을 명시한다. **`token-guard.test.ts` 가 이것을 잡지 못한다**: 값 가드는 `cssEntries` 만 순회하고(`token-guard.test.ts:150-160`, 대상 수집 `:51`) `.tsx` 는 '실재하지 않는 토큰 참조' 만 본다 — 그 한계를 가드 자신이 머리말에 적어 뒀다(`:12-15`). 형제 화면(NFR-064)에 같은 위반이 9건 더 있다 | `grep -rnE "(border[a-zA-Z-]*\|outline)\s*:\s*'?(thin\|medium\|thick)" apps/admin/src/pages/ai/ConversationsPage.tsx` → **1건** → 미충족. `#hex` = 0 · `[1-9]px` = 0 → 그 두 절은 충족. **`pnpm vitest token-guard` 초록불을 근거로 삼지 말 것** | **gap** |
| TOKEN-02 | TOKEN | 직접 | **부분 충족 — 링을 갖는 표면과 갖지 않는 표면이 섞여 있다.** DS `Button` 3종(새 채팅 `:130` · 새 채팅 시작 `:151` · 삭제 `:167`)과 `ConfirmDialog` 의 버튼은 DS 가 토큰 링을 소유한다. 그러나 **대화 제목 링크가 bare `<Link>`(`:163`)** 라 `tds-ui-focusable`(`shared/ui/ui.css:14`)이 붙지 않고 UA 기본 링에 맡겨진다 — 이 화면에서 **행을 여는 유일한 키보드 경로**가 그것이다. `grep -n "tds-ui-focusable" apps/admin/src/pages/ai/ConversationsPage.tsx` → **0건** | 목록에서 Tab → 제목 링크의 포커스 표시가 버튼·DS 컨트롤과 **두께·색이 다르다**(브라우저 기본) → 미충족(quality-bar: '두께 일관성') | **gap** |
| TOKEN-03 | TOKEN | 상속 | 이 화면의 easing 소비 표면 2종: 삭제 성공/실패 토스트(`ConversationsPage.tsx:108,114`)의 entrance/exit animation(`Toast.css`)과 삭제 확인 `ConfirmDialog` → Modal 의 enter/exit(`Modal.css`). 이 화면은 easing 값을 직접 참조하지 않는다(`transition`·`animation` grep = **0**) | 판정은 Toast/Modal/tokens codegen 소유 문서에서. 이 화면에서는 삭제 성공 토스트의 entrance 와 확인 다이얼로그의 등장이 실제 재생되는지만 확인 | 종속 |
| TOKEN-04 | TOKEN | 상속 | 이 화면의 elevation 표면 3종: 목록을 담은 `Card`(`ConversationsPage.tsx:158`) · 삭제 확인 `ConfirmDialog` 의 Modal dialog · 토스트. 셋 다 DS 가 shadow 토큰을 소유한다. 화면 자체에 raw `box-shadow` 가 0건이다 | 판정은 Card/Modal/Toast 소유 문서에서. 이 화면에서는 세 표면이 light/dark 양쪽에서 부상하는지만 확인 | 종속 |
| TOKEN-05 | TOKEN | 상속 | 이 화면의 `<h1>` 은 AppHeader 가 그린다(`AppHeader.tsx:101`, `findNavLabel` → `nav-config.ts:193` `['대화 목록', '/ai/conversations']` 잎과 정확히 일치). **화면이 자기 h1 을 그리지 않는 것은 의도된 판정이며 주석으로 근거가 남아 있다**(`ConversationsPage.tsx:122-126` — '여기서 또 그리면 한 화면에 h1 이 둘이 되어 스크린리더가 화면 이름을 두 번 읽는다') | 판정은 tokens/AppHeader 소유 문서에서. 이 화면에서는 헤더 '대화 목록' `<h1>` 이 목록 본문(body-md)보다 가시적으로 큰지, 그리고 본문에 h1 이 없는지만 확인 | 종속 |
| COMP-10 | COMP | N/A | **text-search/filter 입력이 이 화면에 없다.** FS-065 §1.1 이 검색·필터·페이징을 명시적으로 제외한다('좌측 레일의 검색이 이미 있다'). 이 화면에는 `<input>` 이 **하나도 없다**(`ConversationsPage.tsx` grep: `<input`·`SearchField` = 0) — IME 조합 중 발행될 query 도, 커밋할 필터도 존재하지 않는다. **레일 검색의 조합 결함은 형제 화면이 소유한다**(NFR-064 §2 COMP-10) | — | n-a |
| FEEDBACK-02 | FEEDBACK | 직접 | **부분 충족 — 게이트는 있고 실패 계약이 반대다.** ① 확인 게이트: 삭제가 `ConfirmDialog intent="delete"` 로 게이트된다(`ConversationsPage.tsx:185-194`, FS-065-EL-006) — 단일 클릭 비가역 삭제가 없다. ② busy 잠금: `busy={remove.isPending}`(`:189`)로 확인 버튼이 잠긴다. ③ **실패 처리가 계약과 반대다** — quality-bar 는 '실패 시 다이얼로그를 **열어 둔 채** danger Alert 배너를 보이고 재클릭이 retry' 를 요구하는데, `onError` 가 **다이얼로그를 닫고 토스트를 띄운다**(`:112-114` `setConfirming(null)` → `toast.error(…, { retry })`). FEEDBACK-01 도 '다이얼로그 내부 실패는 그 다이얼로그의 error 배너 — modal 뒤에 숨는 toast 금지' 로 같은 것을 말한다. **FS-065-EL-006 이 이 이탈을 명시적으로 규정한다**('다이얼로그를 닫고 FS-065-EL-008 로 알린다') — 즉 구현 실수가 아니라 **FS 와 quality-bar 의 판정 충돌**이다. ④ **cancel/Esc/dim-click 이 in-flight 요청을 abort 하지 않는다** — `onCancel`(`:191-193`)은 `setConfirming(null)` 만 하고 `abortRef.current?.abort()` 를 부르지 않는다(abort 는 다음 삭제 시작 시에만 일어난다 — `:99`) | ① 삭제 클릭 → 확인 다이얼로그 O. ② `?fail=ai:delete` → **다이얼로그가 닫히고 토스트가 뜬다** → 미충족(다이얼로그 유지 + 배너 + 재클릭 retry 여야 한다). ③ 삭제 진행 중(`?delay=3000`) Esc → 다이얼로그는 닫히지만 요청은 계속 살아 있고 성공 토스트가 뒤늦게 뜬다 → 미충족 | **gap** |
| FEEDBACK-04 | FEEDBACK | N/A | **편집 폼이 이 화면에 없다.** 목록 + 삭제뿐이고 입력 컨트롤이 0건이다 — RHF `useForm`·`isDirty`·`useUnsavedChangesDialog` 를 import 하지 않는다(grep = 0). 제목 수정도 없다(FS-065 §1.1 — '제목은 첫 질문에서 파생된다'). 가드할 미저장 변경이 성립하지 않는다 | — | n-a |
| FEEDBACK-06 | FEEDBACK | N/A | **폼을 담은 modal 이 이 화면에 없다.** 유일한 modal 인 삭제 `ConfirmDialog`(`ConversationsPage.tsx:185-194`)는 제목·본문·버튼뿐이고 입력을 담지 않는다 — dirty close 를 가드할 입력이 없다. `useModalDirtyGuard` 를 import 하지 않는다 | — | n-a |
| A11Y-01 | A11Y | 상속 | 이 화면의 live region 표면 2종: 삭제 성공 토스트(`ConversationsPage.tsx:108`)와 실패 토스트(`:114`). 상시 마운트 aria-live viewport 는 `ToastProvider`(앱 전역)가 소유한다 | 판정은 ToastProvider 소유 문서에서. 이 화면에서는 '대화를 삭제했습니다.' / '대화를 삭제하지 못했습니다.' 가 announce 되는지만 확인 | 종속 |
| A11Y-02 | A11Y | 상속 | 이 화면의 dialog 표면: 삭제 `ConfirmDialog`(title='대화를 삭제할까요?' · message='삭제한 대화는 되돌릴 수 없습니다.' — `ConversationsPage.tsx:186-187`). `aria-describedby` ↔ message 연결은 Modal/ConfirmDialog 가 소유한다 | 판정은 Modal/ConfirmDialog 소유 문서에서. 이 화면에서는 다이얼로그 open 시 제목과 **비가역 고지 본문이 둘 다** 읽히는지만 확인 | 종속 |
| A11Y-11 | A11Y | N/A | **폼 컨트롤이 이 화면에 없다.** `<input>`·`<select>`·`<textarea>`·`FormField`·`SelectField` 중 어느 것도 렌더하지 않는다(grep = 0) — 연결할 error `<p>` 도, hint 도, required 도 존재하지 않는다. `aria-invalid`/`aria-required` grep = **0건**이므로 '짝 없는 `aria-invalid`' 도 0건이다(공허한 충족이라 pass 가 아니라 n-a 로 분류한다) | — | n-a |
| A11Y-12 | A11Y | N/A | **좌측 필터 list item 이 이 화면에 없다.** 필터·toggle 표면이 없는 단일 목록이다(FS-065 §1.1 검색·필터 제외). `aria-pressed`/`aria-current` 를 쓸 요소가 존재하지 않는다(이 화면 grep 결과 둘 다 **0건**) — `filterItemStyle` 도 호출하지 않으므로 `a11y-guard.test.ts:88+` 의 스캔 대상이 아니다 | — | n-a |
| MOTION-01 | MOTION | 상속 | 이 화면의 Modal 표면: 삭제 확인 `ConfirmDialog` → Modal organism. enter/exit transition 은 Modal 이 소유한다(형제 NFR-015 §2 가 기록한 대로 CSS-only 로 구현돼 있고 `onAnimationEnd` 가 'exit 후 unmount' 를 달성한다). **이 화면이 상속하는 표면의 한계**: 확인/취소 footer 버튼 경로는 즉시 언마운트된다 | 판정은 Modal 소유 문서에서. 이 화면에서는 삭제 다이얼로그를 Esc/딤으로 닫을 때 backdrop fade + dialog scale 이 보이는지만 확인 | 종속 |
| MOTION-02 | MOTION | 상속 | 이 화면의 toast 표면: 삭제 성공·실패 토스트. exit 애니메이션은 ToastProvider/Toast 가 소유한다 | 판정은 Toast 소유 문서에서. 이 화면에서는 삭제 성공 토스트의 auto-dismiss 가 아래로 가라앉으며 fade out 하는지만 확인 | 종속 |
| MOTION-03 | MOTION | 상속 | **이 화면 전용 motion 이 0건이다** — `transition`·`animation` 선언이 없다(`pages/ai` 전체 grep = 0). reduced-motion 게이트가 걸릴 표면은 전부 상속물(Modal·Toast)이고 둘 다 게이트를 갖고 있다. **행 삭제 시 나머지 행이 즉시 당겨진다** — layout motion 이 없다(그것은 P1 MOTION-04 축이다, §3) | 판정은 글로벌 Motion config/DS 소유 문서에서. 이 화면에서는 `prefers-reduced-motion: reduce` 에뮬레이션 시 다이얼로그·토스트에 move/scale 이 남지 않는지만 확인 | 종속 |
| IA-01 | IA | 직접 | `{ path: '/ai/conversations', element: <AiConversationsPage />, implemented: true }`(`App.tsx:355`)가 AppShell layout route 아래에 있다(`App.tsx:444-450`). 이 화면은 자체 outer frame/sidebar/top bar 를 렌더하지 않는다 — 최상위가 `pageStyle`(flex column) 하나다(`ConversationsPage.tsx:121`) | `/ai/conversations` 진입 → 사이드바·AppHeader·단일 padded `<main>` 안에 렌더. `ConversationsPage.tsx` grep: `<aside`·`<header`·`<nav` = **0** | pass |
| IA-02 | IA | 직접 | 제목 소스가 **하나**다: AppHeader `<h1>`(`AppHeader.tsx:101`)의 `findNavLabel(pathname)`. `/ai/conversations` 는 nav 잎과 정확히 일치하므로(`nav-config.ts:193`) '대화 목록' 이 나오고 가지 라벨('AI 에이전트')로 폴백하지 않는다. **이 화면에는 sub-route 가 없다**(`App.tsx` 에 `/ai/conversations` 1줄뿐) — 구분할 detail/form title 이 생기지 않는다. 중복 h1 0건이며 그 판정의 근거가 코드 주석에 남아 있다(`ConversationsPage.tsx:122-126`) | `/ai/conversations` 의 가시 primary title = '대화 목록'('AI 에이전트' 아님). `ConversationsPage.tsx` grep: `<h1` = **0** | pass |
| IA-04 | IA | 직접 | **부분 충족 — 다섯 요소 중 하나가 없다.** ① toolbar row: primary '새 채팅' 이 우상단이다(`ConversationsPage.tsx:127-134`, spacer `:128` 로 우측 정렬) — 좌측 검색·필터는 FS-065 §1.1 이 명시적으로 제외했다. ② **결과 count 요약이 없다** — '전체 N건' 을 어디에도 그리지 않는다(`items.length` 는 행 렌더에만 쓰인다). 행마다 '2개 메시지' 는 있으나(`:165`) 그것은 행의 속성이지 결과 요약이 아니다. ③ SelectionBar: bulk action 이 없어 대상 아님(FS-065 §1.1). ④ table: `Card` 안의 `<ul>`(`:158-180`) — 컬럼이 4개뿐인 목록이라 `<table>` 이 아니다. ⑤ Pagination: '한 page 초과 가능 시' 조건인데 페이징이 없다(FS-065 §1.1 이 사유를 적었다). **②만 표면이 실재하는 미충족이다** | `/ai/conversations` 진입 → 우상단 '새 채팅' O · **'전체 N건' 표기 0건** X. 대화가 20건일 때 몇 건인지 세지 않고는 알 수 없다 | **gap** |
| IA-05 | IA | N/A | **create·edit 라우트 쌍이 없다.** 이 화면에는 엔티티 폼이 없고(제목 수정 없음 — FS-065 §1.1) `/ai/conversations` 단일 라우트다(`App.tsx:355`). 대화 생성은 폼이 아니라 형제 화면에서 **질문을 보내면 열린다**(FS-064-EL-032). 구분할 `:id` 도, 나눌 등록/수정 title 도 없다 | — | n-a |
| IA-13 | IA | N/A | **URL 에 직렬화할 list query state 가 없다.** page · page-size · filter · keyword · sort **다섯 축 모두 이 화면에 존재하지 않는다**(FS-065 §1.1 이 검색·필터·페이징을 제외했고, 정렬은 `updatedAt` 내림차순 **고정**이다 — `conversations.ts:71` · BE-065-EP-01 '정렬' 행). `useSearchParams`/`useListState` 를 import 하지 않는다(grep = 0). 이 화면은 경로 그 자체가 완전한 view 다 — `/ai/conversations` 를 복사하면 같은 화면이 재현된다 | — | n-a |
| EXC-01 | EXC | 상속 | 이 화면은 **이중 경계 안**에 있다: ① `AppShell.tsx:523-532` 의 `<Outlet>` 바깥 경계(`resetKey={pathname}` → 다른 메뉴로 이동하면 자동 복구, 사이드바·헤더 생존) ② `App.tsx:430` 의 루트 경계. 이 화면은 자체 경계를 두지 않고 상속만 한다 | 판정은 ErrorBoundary/AppShell 소유 문서에서. 이 화면에서는 `ConversationsPage` 강제 throw 시 사이드바가 남고 다른 메뉴로 이동 가능한지만 확인 | 종속 |
| EXC-02 | EXC | 상속 | 두 층이 이 화면을 덮는다: ① route guard — `RequireAuth` 가 AppShell **바깥**이라(`App.tsx:445-447`) 세션 없이 deep-link 시 `/login?returnUrl=/ai/conversations` 로 보낸다(FS-065 §4.1 '세션 만료') ② 401 인터셉터 — `queryClient` 의 `QueryCache`/`MutationCache` `onError` 가 이 화면의 조회 1종·삭제 1종을 모두 덮는다(`queries.ts:21,65`) | 판정은 RequireAuth/queryClient 소유 문서에서. 이 화면에서는 `?status=list:401` · `?status=delete:401` 각각이 `/login?returnUrl=%2Fai%2Fconversations&reason=session_expired` 로 보내는지만 확인 | 종속 |
| EXC-03 | EXC | 직접 | **미충족 — 두 절 중 하나만 성립한다.** ① read 게이팅은 **상속으로 성립한다**: `RequirePermission`(`AppShell.tsx:529`)이 `<Outlet>` 을 감싸므로 `/ai/conversations` read 가 꺼진 역할은 `ForbiddenScreen` 을 본다(FS-065 §4.1 '권한 없음'). ② **write 게이팅이 없다**: 삭제 버튼(`ConversationsPage.tsx:167-176`)의 렌더·활성 조건에 권한이 들어가지 않는다 — `useRouteWritePermissions`/`useRouteCan` 을 `pages/ai` 전체에서 호출하지 않는다(grep = **0건**). quality-bar acceptanceCheck 가 명시하는 'delete 없는 role 이 버튼을 못 봄' 이 성립하지 않는다. ③ 그 결과 **강등 reconcile 도 없다** — 진입 후 권한이 꺼져도 버튼이 그대로이고 서버 403 은 '대화를 삭제하지 못했습니다.' 한 문구로 뭉개진다(`:114`) | ① `page:/ai/conversations` read 를 끈 역할로 deep-link → 403 화면 → 충족. ② **`delete` 를 끈 역할로 진입 → 삭제 버튼이 여전히 렌더되고 눌린다** → 미충족. ③ `?status=delete:403` → 권한 문구가 아니라 generic 실패 토스트 | **gap** |
| EXC-04 | EXC | N/A | **낙관적 동시성 토큰의 대상이 이 화면에 없다.** 편집하는 mutable record 폼이 없고(EXC-03·FEEDBACK-04 참조) 유일한 쓰기는 **멱등 삭제**다 — BE-065-EP-02 가 '멱등 — 이미 지워진 id·타인 소유 id 도 204' 로 명시 판정했고(§3.2·§5), 어댑터 주석도 같은 계약을 적는다(BE-065 §6.1 '멱등 삭제를 신뢰한다'). `If-Match`/`updatedAt` 을 실을 write 가 존재하지 않으며, quality-bar 가 경고한 'ghost saved toast'(id 부재 시 조용한 no-op + success)는 **삭제에서는 정상 수렴**이다. `removeConversations`(`conversations.ts:108-111`)가 없는 id 에도 던지지 않는 것이 그 계약의 구현이다 | — | n-a |
| EXC-08 | EXC | 직접 | **부분 충족 — 잠금이 없고 abort 가 그 자리를 대신한다.** ① pending 중 비활성은 있다: `busy={remove.isPending}`(`ConversationsPage.tsx:189`)가 확인 버튼을 잠근다(FS-065 §4.1 '중복 제출'). ② **동기 submit lock 이 없다** — `confirmDelete`(`:95-118`)에 `submitLockRef` 가 없다. 대신 직전 요청을 abort 하고 새로 건다(`:99-101`)므로 in-flight 는 1건으로 수렴하지만, quality-bar 는 'pending 중 disable **AND** 동기 submit lock' 을 요구한다. ③ **멱등키가 없다** — `deleteConversations`(`data-source.ts:133`)에 `Idempotency-Key` 가 생성되지 않는다. **다만 EXC-04 와 같은 이유로 실피해가 작다**: DELETE 가 멱등이라(BE-065-EP-02) 중복 발사의 결과가 같은 상태로 수렴한다 — 이 절만은 엔드포인트 계약이 실질적으로 대신 만족시킨다 | 확인 버튼 연타 → 잠금 전 틈으로 두 번째 호출이 들어가면 두 번째가 첫 번째를 abort 한다(순 요청 1건). `grep -rn "submitLockRef\|Idempotency" apps/admin/src/pages/ai` → **0건** → 요구 문구 미충족 | **gap** |
| EXC-09 | EXC | 직접 | abort 를 실패로 다루지 않는다 — 공유 predicate 사용(`shared/async.isAbort`, `ConversationsPage.tsx:13`). `onError` 가 `isAbort(error)` 로 **가장 먼저** 걸러 early return 한다(`:111`) → abort 시 실패 토스트도, 다이얼로그 닫힘도 없다(다이얼로그 state 를 건드리지 않고 반환한다). `isPending` 은 mutation settle 로 자동 해제된다. bulk 작업이 없어 실패 count 제외 조항은 이 화면에 해당하지 않는다. **abort 를 일으키는 경로는 '연속 삭제' 하나뿐이다** — 언마운트·취소는 abort 하지 않는다(그 부재는 EXC-09 가 아니라 P0 FEEDBACK-02 ④ 로 판정했다) | 삭제 진행 중 다른 대화의 삭제를 확인 → 첫 요청 abort → **실패 토스트 0건**. `?fail=ai:delete` 는 abort 가 아니므로 실패 토스트가 정상 표시된다(두 경로가 갈리는지 확인) | pass |

### 2.1 P0 판정 요약

| 판정 | 건수 | 요구 ID |
|---|---|---|
| pass | **4** | STATE-01 · IA-01 · IA-02 · EXC-09 |
| 종속(상속) | **10** | TOKEN-03 · TOKEN-04 · TOKEN-05 · A11Y-01 · A11Y-02 · MOTION-01 · MOTION-02 · MOTION-03 · EXC-01 · EXC-02 |
| n-a | **9** | STATE-04 · COMP-10 · FEEDBACK-04 · FEEDBACK-06 · A11Y-11 · A11Y-12 · IA-05 · IA-13 · EXC-04 |
| **gap** | **7** | **STATE-02 · TOKEN-01 · TOKEN-02 · FEEDBACK-02 · IA-04 · EXC-03 · EXC-08** |
| 합계 검산 | **4 + 10 + 9 + 7 = 30** ✓ | (STATE 3 · TOKEN 5 · COMP 1 · FEEDBACK 3 · A11Y 4 · MOTION 3 · IA 5 · EXC 6 = 30) |

> **P0 gap 7건 = quality-bar '배치 실패' 사유**(§How to use: 'P0 하나라도 미충족이면 배치는 acceptance 실패'). 7건은 **세 갈래**다. ① **부분 충족 4건** — 자리·게이트는 옳고 계약의 마지막 절이 빠졌다: STATE-02(배너 O, 재시도 X) · TOKEN-02(DS 버튼 O, bare 링크 X) · IA-04(템플릿 O, count 요약 X) · EXC-08(disable O, 동기 잠금·멱등키 X). ② **판정 충돌 1건** — FEEDBACK-02 는 구현 실수가 아니라 **FS-065-EL-006 이 quality-bar 와 다르게 규정한 것**이다(§5 #4). ③ **섹션 미적용 2건** — TOKEN-01(가드 사각지대) · EXC-03(권한 배선), 둘 다 형제 NFR-064·NFR-015 와 같은 뿌리다.
>
> **형제 화면과의 대조**: NFR-064 는 P0 gap 9건이다. 이 화면이 더 적은 이유는 **DS 컴포넌트(`Card`·`Empty`·`Alert`·`ConfirmDialog`·`Button`·`useToast`)를 그대로 소비**하기 때문이고, 새 채팅 쪽은 대화 UI 를 직접 그렸기 때문이다. 두 화면의 공통 gap 은 TOKEN-01 · TOKEN-02 · EXC-03 · EXC-08 네 건이다.

## 3. 이 화면에 걸리는 P1 · P2 (선별)

표면이 실재하는 것만 적는다.

| 요구 ID | P | 이 화면에서의 상태 | 측정 기준 | 판정 |
|---|---|---|---|---|
| STATE-03 | P1 | `placeholderData: (previous) => previous`(`queries.ts:24`)로 배경 재조회 중 이전 행을 유지한다 — 삭제 성공 후 `invalidateQueries(aiKeys.all)`(`:68`)가 도는 동안 목록이 비지 않는다. `staleTime`(전역 30s)이 재조회 시점을 지배한다 | 삭제 후 목록이 '불러오는 중…' 으로 바뀌지 않고 남은 행이 유지된다 | pass |
| STATE-05 | P1 | 0건을 전용 `Empty` 로, **생성 CTA 와 함께** 그린다 — `<Empty label="대화" createVerb="시작" action={<Link to="/ai/chat"><Button>새 채팅 시작</Button></Link>} />`(`ConversationsPage.tsx:146-156`, FS-065-EL-004). 이 화면에는 검색·필터가 없으므로 quality-bar 가 요구하는 세 갈래 중 **(a) 진짜 비어있음** 하나만 실재하고, 그 하나를 옳게 그린다 | `?empty=list` → '시작된 대화가 없습니다.' 계열 문구 + '새 채팅 시작' CTA | pass |
| STATE-06 | P1 | 삭제 성공 시 `invalidateQueries({ queryKey: aiKeys.all })`(`queries.ts:68`) — 목록과 **열려 있을 수 있는 대화 상세**를 함께 무효화한다. 그래서 다른 탭/화면에서 열어 둔 대화가 다음 조회에서 '없음' 으로 갈리고 FS-064-EL-022 로 이어진다. 넓게 잡은 것이 옳은 이유는 삭제가 두 표면을 모두 stale 하게 만들기 때문이다 | 삭제 후 `/ai/chat?c=<지운id>` 로 이동 → 삭제 안내 배너 | pass |
| FEEDBACK-01 | P1 | **'사라져도 되는가' 규칙을 두 축 중 하나만 지킨다.** read 실패 → 인라인 Alert O(`:141-142`). write 실패 → 재시도 있는 토스트 O(`:114`, `retry: confirmDelete`). **그러나 그 실패가 '다이얼로그 내부 실패' 라 인라인 배너여야 한다** — P0 FEEDBACK-02 ③과 같은 항목이다 | `?fail=ai:list` → 인라인 O. `?fail=ai:delete` → 토스트(배너여야 함) X | 부분(→ FEEDBACK-02) |
| FEEDBACK-03 | P1 | 삭제의 **성공·실패 양 경로에 피드백이 연결돼 있다** — 성공 `toast.success('대화를 삭제했습니다.')`(`:108`) · 실패 `toast.error(…, { retry: confirmDelete })`(`:114`). 실패 토스트는 자동 소멸하지 않고 재시도를 준다(FS-065-EL-008). 클릭이 아무 변화도 안 내는 no-op state 가 없다 | `?fail=ai:delete` → 재시도 버튼이 있는 실패 토스트. 재시도 클릭 → 같은 id 로 재발사(닫힘 클로저가 id 를 쥐고 있다 — `:96`) | pass |
| FEEDBACK-05 | P1 | 비가역 고지가 있는 명시적 confirm 을 제공한다 — '삭제한 대화는 되돌릴 수 없습니다.'(`:187`). undo window 는 없으나 quality-bar 는 **confirm 또는 undo 택일**을 요구하므로 충족이다. **다만 대화가 애초에 휘발성이라**(§4.3) 여기서의 '비가역' 은 새로고침과 같은 무게다 | 단일 미확인 클릭으로 실행되는 delete = 0건 | pass |
| COMP-01 | P1 | 모든 action 버튼이 DS `Button` 이다(`:130,151,167`) — 금지 grep 이 깨끗하다(`buttonStyle(`·`tds-ui-btn-` = **0건**). **그러나 두 곳에서 `<Link>` 가 `<Button>` 을 감싼다**(`:129-133`·`:150-155`) — 인터랙티브 요소의 중첩이라 탭 스톱이 둘 생기고 AT 가 '링크 안의 버튼' 으로 읽는다. `Button` 의 `as`/`asChild` 계열 API 가 없다는 뜻이므로 DS 축으로 이관한다 | `getAllByRole('link')` 와 `getAllByRole('button')` 이 같은 컨트롤을 두 번 센다 | 부분(DS) |
| COMP-08 | P1 | 마지막 컬럼 규칙을 지킨다 — 읽기 전용 행에 **중복 '상세' 버튼이 없고**, 행을 여는 경로는 제목 링크 하나(`:163`), 액션은 삭제 1개라 ActionMenu(⋯)로 승격하지 않는다 | 행에 '상세' secondary 버튼 0건 | pass |
| COMP-09 | P1 | 제목 셀이 `flexGrow: 1, minWidth: 0`(`:59`)이라 그리드를 밀지 않는다. **그러나 truncation 이 없다** — 제목은 30자 상한으로 이미 잘려 저장되므로(`conversations.ts:64,67`) 실무상 넘치지 않지만, 규칙이 **행 스타일이 아니라 데이터 생성 시점**에 있다 | 30자 초과 질문 → 제목이 '…' 로 저장된다(표시 시점 truncation 아님) | 부분(문서화) |
| A11Y-08 | P1 | 행 클릭이 아니라 **행 안의 keyboard-focusable 링크**로 대화를 연다(`:163` `<Link to={/ai/chat?c=…}>`). `useRowNavigation` 을 쓰지 않아 mouse-only 경로가 없다 | 목록을 Tab → 각 행의 제목 링크에 도달하고 Enter 로 열린다 | pass |
| A11Y-15 | P2 | 실패 토스트의 '다시 시도' 가 **한 종류뿐**이라 스택 시 구분 가능한 accessible name 이 없다('대화를 삭제하지 못했습니다.' 가 어느 대화인지 말하지 않는다 — `:114`). 토스트 dismiss 후 포커스 복귀도 DS 소유 미해결 | 두 대화의 삭제를 연달아 실패 → 동일한 이름의 재시도 버튼 2개 | gap(DS + 이 화면의 문구) |
| MOTION-04 | P1 | 행 삭제 시 **나머지 행이 즉시 위로 튄다** — layout(FLIP) motion 이 없다(`transition` grep = 0). 목록이 짧아(세션 수명) 임계값 가드는 필요 없으나, 삭제의 시각적 인과가 끊긴다 | 삭제 확인 → 행이 애니메이션 없이 사라진다 | gap |
| IA-03 | P1 | nav 잎이라 'non-top-level route' breadcrumb 요구의 대상이 아니다 | — | n-a |
| IA-08 | P1 | footer action bar 규격의 대상(폼)이 아니다. 이 화면의 primary action('새 채팅')은 footer 가 아니라 **우상단 toolbar** 에 있고 그것이 list 템플릿(IA-04 ①)의 규정이다 | — | n-a |
| IA-14 | P1 | 행이 `display:flex` + 고정 gap(`:48-57`)이라 좁은 폭에서 제목·메시지 수·시각·삭제가 **한 줄에 눌린다** — collapse 규칙도 미디어 쿼리도 없다(`ai.css` 에 `@media` 0건). 삭제 버튼은 DS `size="sm"` 이라 coarse pointer 최소 타깃을 보장하지 않는다 | 375px → 갱신 시각이 잘리거나 삭제 버튼이 밀려난다 | gap |
| ERP-06 | P1 | 사용자 대상 문구가 존댓말 톤으로 일관된다 — '대화를 삭제했습니다.' · '대화를 삭제하지 못했습니다.' · '삭제한 대화는 되돌릴 수 없습니다.' · 보관 안내(`:136-139`). 조사(助詞) 리터럴('을(를)' 등) 0건 | `grep "을(를)\|이(가)\|은(는)" ConversationsPage.tsx` → **0건** | pass |
| ERP-08 | P1 | **미충족 — 날짜 포맷이 공유 formatter 를 경유하지 않는다.** `formatWhen`(`ConversationsPage.tsx:77-83`)이 `getFullYear`/`getMonth`/`getDate`/`getHours`/`getMinutes` 로 **화면 안에서 직접 조립**한다. `shared/format` 을 import 하지 않는다(grep = 0). 판정 자체는 옳다(문자열을 자르지 않고 `Date` 로 파싱해 현지 시각으로 그린다 — 그 근거가 주석 `:71-76` 과 FS-065 §7.1 에 있다). 문제는 **그 규칙이 이 파일에만 있다**는 것이고, 좌측 레일의 `isToday`(`ConversationRail.tsx:66-74`)가 같은 판단을 **두 번째로** 구현한다 — 같은 함정을 두 곳이 각자 피하고 있다 | `pages/ai` grep: `getFullYear` = **2건**(두 파일). `formatDateTime` 계열 공유 헬퍼 사용 = 0건 | gap |
| ERP-09 | P1 | timestamp 를 **브라우저 로컬 TZ** 로 그린다(위와 같은 근거) — 고정 display TZ(Asia/Seoul) 정책이 없다. BE-065 §6.1 은 '오프셋 포함으로 받는다' 만 규정하고 표시 TZ 를 정하지 않는다 | 다른 TZ 의 관리자가 같은 대화를 다른 시각으로 본다 | gap(앱 전역) |
| ERP-12 | P1 | list-export 가 없다. **대화 목록은 export 대상이 아니다** — 세션 수명 안의 휘발성 데이터이고 세무·오프라인 검토 대상이 아니다. 보관이 붙으면(BE-065 §7.3) 그때 재판정한다 | — | n-a(재판정 예정) |
| EXC-05 | P1 | client timeout 이 없다(`AbortSignal.timeout` grep = **0**). BE-065 §3.4 는 프론트 권고 상한을 **조회 10초 · 삭제 10초**로 못 박았으나 그 값이 코드에 없다 | never-resolving 응답 → '불러오는 중…' 이 무한 지속 | gap |
| EXC-06 | P1 | **실패의 갈래가 없다.** 조회 실패는 문구 1종(`:142`), 삭제 실패도 1종(`:114`)이다 — BE-065 §2.1 이 정의한 400·401·403·429·500·504 가 화면에서 구분되지 않는다. `HttpError` 는 status 를 지니고 `?status=` 가 그것을 던지는데(`dev.ts:90-93`) 화면이 `isAbort` 외 전부를 뭉갠다 | `?status=delete:403` / `delete:429` / `delete:500` → **세 경우 모두 동일 토스트** | gap |
| EXC-11 | P1 | offline 감지가 없다(`navigator.onLine` grep = 앱 전역 0건) | offline 토글 → 배너 없음, 삭제 버튼 경고 없음 | gap |
| EXC-20 | P1 | 5xx 에서 **참조 코드를 표시하지 않는다.** `HttpError.reference`/`referenceOf()` 가 존재하지만 이 화면은 쓰지 않는다. BE-065 §2 는 `traceId` 를 봉투 필수 필드로 규정한다(BE-064 §2 참조) | `?status=list:500` → 배너에 `TDS-…` 참조 코드 없음 | gap |

## 4. quality-bar 가 다루지 않는 축

### 4.1 성능 예산

| 항목 | 예산 | 현재 | 근거 |
|---|---|---|---|
| 목록 조회 p95 | ≤ 300ms | **측정 불가**(백엔드 없음) | 정렬 1회 + 배열 복사(`conversations.ts:71`). BE-065 §3.4 의 서버 상한 3초(504)는 **실패 임계이지 예산이 아니다** |
| 삭제 응답 p95 | ≤ 300ms | **측정 불가** | 배열 필터 1회(`conversations.ts:108-111`) |
| 첫 렌더(로딩 표시) | ≤ 100ms | 라우트 진입 즉시 | `firstLoading` 이 첫 렌더에서 true(`ConversationsPage.tsx:93`) |
| 진입 시 조회 횟수 | **1회** | 1회 | `queries.ts:21` — 목록 쿼리 하나뿐(상세는 이 화면에서 발사되지 않는다) |
| 삭제 후 재조회 횟수 | **1회** | 1회 | `invalidateQueries(aiKeys.all)`(`queries.ts:68`) — 이 화면에 활성 쿼리가 목록 하나뿐이라 실제 재발행은 1건이다 |
| 삭제 요청 수(1회 확인당) | **1** | **1**(픽스처 기준) | 잠금이 아니라 abort-후-재시작으로 수렴한다 — **P0 EXC-08**. 멱등 삭제라 초과 발사의 결과는 같다 |
| 표시 행 상한 | **없음(전량)** | 전량 | 페이징이 없다(FS-065 §1.1). **세션 수명 안에서 대화가 많아지면 이 예산이 깨진다** — BE-065-EP-01 은 커서 페이징(기본 30 · 상한 100)을 이미 규정했으므로 **UI 만 따라가면 된다**(BE-065 §7.7 #2) |
| 메모리 | 누수 0 | **부분** | 대화 배열이 모듈 변수로 무한 증가한다(`conversations.ts:41`) — 세션 수명 안에서만 유효. **`ConversationsPage` 에는 언마운트 abort 가 없다**(`ConversationsPage.tsx` 에 `useEffect` cleanup 0건 — 형제 `NewChatPage.tsx:148` 에는 있다): 삭제 진행 중 이탈하면 요청이 살아남아 언마운트된 컴포넌트의 토스트 콜백을 부른다 |
| 번들 | 화면 전용 코드 최소 | lazy 청크(`App.tsx:163`) | 이 화면은 chart·editor 등 무거운 의존을 갖지 않는다 |

> **`LATENCY_MS = 400`(`shared/crud/dev.ts:12`)은 개발용 지연이다 — 성능 예산이 아니다.** `?delay=` 로 덮어쓸 수 있다(`data-source.ts:47-50`). 백엔드 연결 시 이 상수는 사라진다. 위 예산을 이 값으로 검증해서는 안 된다.

### 4.2 가용성 · 복원력

| 시나리오 | 요구 동작 | 현재 상태 |
|---|---|---|
| 목록 조회 실패(5xx) | 인라인 배너 + 재시도 | **부분** — 배너는 있고(P0 STATE-02) **재시도가 없다**. `retry: false`(전역 queryClient)라 자동 재시도도 없어 **복구 경로가 새로고침뿐이고, 새로고침은 대화를 지운다**(§4.3) — 이 화면에서 가장 비싼 부분 충족이다 |
| 목록 조회 실패와 0건의 구분 | 다른 화면 | **충족** — `isError` 가 `Empty` 보다 먼저 걸린다(`ConversationsPage.tsx:141-145`) |
| 삭제 실패(5xx) | 실패 통지 + 재시도 + 목록 유지 | **부분** — 재시도 있는 토스트 O(`:114`), 목록 유지 O. **자리가 틀렸다** — 다이얼로그 안의 실패는 배너여야 한다(P0 FEEDBACK-02) |
| 삭제 중 화면 이탈 | abort · 유령 실패 없음 | **미충족** — 언마운트 cleanup 이 없어(§4.1) 요청이 살아남는다. `isAbort` 가드(`:111`)는 abort 가 **일어났을 때**만 유효하다 |
| 삭제 중 사용자 취소 | 취소가 in-flight 를 abort | **미충족** — `onCancel`(`:191-193`)이 abort 하지 않는다(P0 FEEDBACK-02 ④) |
| 이미 지워진 대화를 다시 삭제 | 성공으로 수렴 | **충족** — `removeConversations`(`conversations.ts:108-111`)가 없는 id 에 던지지 않는다. BE-065-EP-02 의 멱등 계약과 일치한다(§3.2) |
| 세션 만료 | 재인증 후 원래 경로 복귀 | **부분** — 경로는 복귀하나(P0 EXC-02) **대화 목록은 메모리라 돌아오면 비어 있다**(§4.3) |
| 렌더 예외 | 셸 생존 + 복구 UI | **충족**(P0 EXC-01, `resetKey={pathname}` 자동 복구) |
| 네트워크 단절 | offline 배너 + write 게이트 | **미충족**(P1 EXC-11 — 앱 전역) |
| 응답 없음(무한 대기) | client timeout 후 재시도 안내 | **미충족**(P1 EXC-05). BE-065 §3.4 가 10초를 권고했으나 코드에 없다 |
| 대화가 많아짐 | 페이징 또는 가상 스크롤 | **미충족(현재는 무해)** — 전량 렌더다. 세션 수명 안에서는 수십 건을 넘기 어렵지만 **보관이 붙는 순간 깨진다**. 서버 계약(커서 30/100)은 이미 있다 |

### 4.3 데이터 보존 · 감사

| 항목 | 요구 | 현재 상태 |
|---|---|---|
| 대화 보관 | 새로고침·재접속 후에도 남는다 | **없다 — 메모리뿐이다.** `let conversations: readonly Conversation[] = []`(`conversations.ts:41`)이 모듈 변수라 **새로고침하면 전부 사라진다.** localStorage 를 쓰지 않는 것은 판정이다(`:6-8` — '저장됐다는 인상만 주고 다른 기기에서는 없다'). **이 화면은 그 사실을 배너로 밝힌다**(`ConversationsPage.tsx:136-139` · FS-065-EL-002) — 밝히지 않았다면 관리자는 다음 날 없어진 것을 결함으로 본다. **배너는 보관이 붙는 순간 함께 걷어내야 한다**(BE-065 §7.3 — '문구가 남으면 이번에는 그것이 거짓이 된다') |
| 삭제의 되돌림 | undo 또는 soft-delete | **없다.** 확인 다이얼로그가 '되돌릴 수 없습니다' 를 고지하고(`:187`) 즉시 지운다 — quality-bar FEEDBACK-05 는 confirm/undo 택일이므로 충족이며, 애초에 휘발성 데이터라 undo 의 가치가 낮다 |
| 삭제 감사 | 누가·언제 지웠는가 | **없다.** 대화가 소유자 단위로 격리되고(BE-065 §7.2 — `admin` 도 타인 대화를 보지 않는다) 삭제 이력도 남지 않는다. **그 판정이 옳다** — 조회 이력의 열람은 감사 로그(FS-060)가 통제된 형태로 제공할 일이다. 다만 **에이전트 경유 조회 자체의 감사 로그**는 별개로 필요하다(BE-064 §3.5 · §7.7 #3) |
| 보관 기간 정책 | 정해져 있다 | **없다 — 백엔드로 이관됐다**(BE-065 §7.3 · BE-064 §7.7 #4). 보관이 정해지면 이 표와 §4.2 의 '대화가 많아짐' 행, FS-065-EL-002 배너를 함께 재판정한다 |
| 시각의 정본 | UTC 저장 · 현지 표시 | **부분 충족.** 저장은 ISO(`data-source.ts:107`), 표시는 `Date` 파싱 후 현지 시각(`ConversationsPage.tsx:77-83`) — 문자열을 자르지 않은 판정이 옳다(FS-065 §7.1). 그러나 그 규칙이 **공유 formatter 를 경유하지 않고 이 파일과 `ConversationRail.tsx` 에 두 벌로 존재한다**(P1 ERP-08) |
| 픽스처 휘발성 | — | `resetConversations()`(`conversations.ts:124-127`)가 테스트용 초기화 수단이다. 백엔드 연결 전까지의 성질이며 예산·요구가 아니다 |

## 5. 미충족(gap) 요약 → 이관

| # | 요구 ID | P | 내용 | 범위 | 이관 |
|---|---|---|---|---|---|
| 1 | **STATE-02** | **P0** | 조회 실패 배너에 **'다시 시도' 컨트롤이 없다**(`refetch` 미호출). 자리·tone·토스트 금지는 지킨다. **이 화면에서는 재시도 부재가 특히 비싸다** — 복구 수단이 새로고침뿐인데 그것이 대화 전체를 지운다(§4.3) | 이 화면 | 프론트 구현 |
| 2 | **TOKEN-01** | **P0** | 행 구분선의 `borderBottom: 'thin solid …'` 1건(`ConversationsPage.tsx:56`). **`token-guard.test.ts` 는 `.css` 만 순회하므로 잡지 못한다**(`:51,150-160`, 한계는 `:12-15` 가 스스로 적었다). **가드를 `.tsx` 인라인 style 로 넓히는 것이 근본 해법**이며, 형제 화면에 같은 위반이 9건 더 있다(NFR-064 §5 #2) | 이 화면 + **가드 자체**(앱 전역) | 프론트 구현(가드 확장) |
| 3 | **TOKEN-02** | **P0** | 대화 제목이 bare `<Link>`(`:163`)라 토큰 포커스 링을 렌더하지 않는다 — 이 화면에서 **행을 여는 유일한 키보드 경로**다. DS `Button` 쪽은 충족한다 | 이 화면(+ 앱의 bare 링크 전반) | 프론트 구현 |
| 4 | **FEEDBACK-02** | **P0** | **판정 충돌이다 — 코드만 고쳐서는 닫히지 않는다.** quality-bar 는 '다이얼로그 내부 실패 → 다이얼로그 유지 + danger 배너 + 재클릭 retry' 와 'cancel/Esc/dim-click 이 in-flight 를 abort' 를 요구하는데, 구현은 다이얼로그를 닫고 토스트를 띄우며(`:112-114`) 취소가 abort 하지 않는다(`:191-193`). **FS-065-EL-006 이 그 동작을 명시적으로 규정하고 있으므로**(§3 '다이얼로그를 닫고 FS-065-EL-008 로 알린다') **FS 를 quality-bar 에 맞추든지, quality-bar 예외를 근거와 함께 문서화하든지 먼저 정해야 한다.** FEEDBACK-01(P1)도 같은 항목이다 | 이 화면 · FS-065-EL-006 | UI 기획(판정) → 프론트 구현 |
| 5 | **IA-04** | **P0** | list 템플릿 다섯 요소 중 **결과 count 요약이 없다.** 나머지 넷은 충족이거나 FS-065 §1.1 이 사유와 함께 제외했다. 대화가 몇 건인지 세지 않고는 알 수 없다 | 이 화면 | 프론트 구현 |
| 6 | **EXC-03** | **P0** | 삭제 버튼이 `can(delete)` 를 보지 않는다(`pages/ai` 의 `useRouteWritePermissions`/`useRouteCan` = **0건**). read 게이팅은 `RequirePermission` 으로 상속된다. 형제 NFR-064 §5 #7 · NFR-015 §5 #2 와 같은 뿌리이며, **배선 선례가 이미 앱 안에 있다**(`settings/site` 외 6곳) | AI 섹션 전체 | UI 기획 · 프론트 구현 |
| 7 | **EXC-08** | **P0** | 동기 submit lock·멱등키 없음(`submitLockRef`·`Idempotency` grep = 0). abort-후-재시작이 그 자리를 대신한다. **DELETE 가 멱등이라 실피해는 작다**(BE-065-EP-02) — 우선순위는 형제 화면의 비멱등 write(NFR-064 §5 #8)보다 낮다 | 이 화면(+ 앱 전역의 비폼 write) | 프론트 구현 |
| 8 | ERP-08 · ERP-09 | P1 | 날짜 표시가 공유 formatter 를 경유하지 않고 화면 안에서 조립된다(`ConversationsPage.tsx:77-83`). 같은 판단(현지 날짜로 가른다)이 `ConversationRail.tsx:66-74` 에 **두 번째로** 구현돼 있다 — 한쪽만 고쳐질 위험. 고정 display TZ 정책도 없다 | 이 화면 + 형제 화면 · `shared/format` | 프론트 구현 |
| 9 | EXC-05 · EXC-06 · EXC-20 | P1 | client timeout 부재(BE-065 §3.4 가 10초를 권고했다) · status 분기 부재 · 참조 코드(`traceId`) 미표시 | 이 화면(+ 앱 전역) | 프론트 구현 · UI 기획 |
| 10 | EXC-11 | P1 | offline 감지 없음 | 앱 전역 | 프론트 구현 |
| 11 | MOTION-04 · IA-14 · A11Y-15 | P1·P2 | 행 삭제 layout motion 없음 · 좁은 폭 collapse 규칙 없음 · 실패 토스트의 재시도 버튼이 어느 대화인지 말하지 않음 | 이 화면 · DS | 프론트 구현 · DS |
| 12 | COMP-01 · COMP-09 | P1 | `<Link>` 가 `<Button>` 을 감싸 탭 스톱이 둘 생긴다(`:129-133,150-155`) — DS 에 `as`/`asChild` 가 없다 · 제목 truncation 이 표시 시점이 아니라 데이터 생성 시점에 있다(`conversations.ts:64`) | DS · 이 화면 | DS · 프론트 구현 |
| 13 | (신규 · quality-bar 밖) | — | **언마운트 abort 없음**(§4.1·§4.2 — 형제 화면에는 있다) · **페이징 UI 없음**(서버 계약은 이미 커서 30/100) · **보관 확정 시 배너를 함께 걷어내야 함** | 이 화면 | 프론트 구현 · 백엔드 명세 |

> **§5 ↔ FS-065 §7 ↔ BE-065 §7.7 대조**: #1·#2·#3·#5·#6·#7·#9·#10·#11·#12→(신규, 비기능 축이라 FS 미기재) · #4→FS §3 FS-065-EL-006(quality-bar 와 판정 충돌 — FS 개정 또는 예외 문서화 필요) · #8→(신규, FS §7.1 이 '현지 시각으로 그린다' 판정만 남기고 헬퍼 위치를 규정하지 않았다) · #13→FS §7 #1·#2 · BE §7.7 #1·#2. **BE-065 §7.7 #3(클라이언트 정렬 제거)** 은 이 문서의 gap 이 아니다 — 페이징이 붙기 전까지 `conversations.ts:71` 의 정렬은 정확하고, 순서가 어긋나는 조건(페이지 경계)이 아직 존재하지 않는다.

## 6. 측정 도구 · 재현 스위치

**E2E 미실행 — 이 문서의 모든 판정 근거는 코드 대조다.** 아래 스위치는 판정을 **재현**하기 위한 것이며, 이 문서가 그 실행 결과를 주장하지 않는다.

이 화면의 어댑터 scope 는 **`ai`**(`data-source.ts:45`)이고, 이 화면이 실제로 쓰는 op 은 **`list` · `delete` 2개**다(`:62,138` — `detail`·`ask` 는 형제 화면이 쓴다). 어댑터·엔드포인트를 형제 화면과 공유하므로(BE-065 §7.1) **같은 스위치가 두 화면에 동시에 걸린다.**

| 스위치 | 효과 | 근거 |
|---|---|---|
| `?delay=<ms>` | 픽스처 지연을 덮어쓴다(기본 `LATENCY_MS=400`) → STATE-01 의 '불러오는 중…' 과 삭제 진행 중 잠금을 실제로 볼 수 있다 | `data-source.ts:47-50` |
| `?fail=ai:list` | 목록 조회 실패 → FS-065-EL-007 인라인 danger 배너(재시도 부재를 여기서 확인한다) | `dev.ts:117-124` |
| `?fail=ai:delete` | 삭제 실패 → FS-065-EL-008 재시도 토스트(**다이얼로그가 닫히는 것**을 여기서 확인한다 — P0 FEEDBACK-02) | 동일 |
| `?fail=ai:detail` · `?fail=ai:ask` | 이 화면에는 표면이 없다 — 형제 화면(NFR-064)용 | 동일 |
| `?fail=list` · `?fail=delete` | scope 없이 op 만 지정 — **다른 화면의 같은 op 도 함께 실패한다**(`list`·`delete` 는 앱 안에서 흔한 op 이름이다) | `dev.ts:122` |
| `?fail=all` | 네 op 모두 실패 | `dev.ts:122` |
| `?empty=list` | 대화 목록이 0건으로 온다 → FS-065-EL-004 `Empty` + CTA | `data-source.ts:52-57,64` |
| `?status=<op>:<code>` | 지정 HTTP status 의 `HttpError` 를 던진다. **재현 가능 code: 400·401·403·404·409·412·422·429·500**(`dev.ts:27-37`). 예: `?status=delete:403` · `?status=list:500` | `dev.ts:66-79,90-93` |

**주의 — 쓰면 안 되는 것 / 동작하지 않는 것**

| 항목 | 사실 |
|---|---|
| `?status=ai:delete:403` | **파싱되지 않는다.** `dev.ts:71` 이 `entry.split(':')` 결과를 `[target, code]` **2개로만** 구조분해하므로 3세그먼트 입력은 `target='ai'`·`code='delete'` 가 되고 `Number.parseInt('delete')` → NaN 으로 무시된다. `:73` 의 `${scope}:${op}` 비교는 `?status=` 경로에서 **도달 불가능한 죽은 분기**다(형제 NFR-015·NFR-064 §6 이 같은 사실을 기록했다). scope 지정이 필요하면 `?fail=` 쪽을 쓴다 — 그쪽은 `${scope}:${op}` 를 정상 비교한다(`dev.ts:122`) |
| `?empty=` 로 삭제 후 상태 재현 | `isEmptyRequested` 는 `fetchConversations` 에서만 호출된다(`data-source.ts:64`) — **삭제 결과를 시뮬레이션하지 않는다.** 삭제 후 0건은 실제로 전부 지워 재현한다 |
| `?fail=ai:delete` 로 STATE-01 판정 | **부적절하다.** 삭제 실패는 `isError` 가 아니라 mutation 의 실패이므로 목록 분기(`ConversationsPage.tsx:141`)를 건드리지 않는다 — 목록은 그대로 남는다(그것이 옳다). read 상태 판정은 `?fail=ai:list` 로 한다 |
| 보관·페이징 재현 | **스위치가 없다.** 대화는 메모리이고 페이징 UI 가 없다(§4.1·§4.2) — 두 축은 코드 대조로만 판정했고, 서버 계약(BE-065-EP-01 커서 30/100)과의 대조로 '**미구현**' 임을 확인했다 |
| 새로고침으로 상태 초기화 | 가능하지만 **대화가 전부 사라진다**(§4.3). 그래서 STATE-02 의 '다시 시도' 부재가 이 화면에서 특히 비싸다 — 판정 재현 시 목록을 다시 만들려면 형제 화면에서 질문을 다시 보내야 한다 |

**단위 검증**: **이 화면 전용 테스트는 0건이다.** `pages/ai/**` 의 vitest 40건은 전부 형제 화면과 그 하위 모듈을 덮는다 — 파서 17건(`_shared/parser.test.ts`) · Composer a11y 12건(`components/Composer.test.tsx`) · NewChatPage 11건(`NewChatPage.test.tsx`). `ConversationsPage.test.tsx` 는 **존재하지 않는다**(`ls apps/admin/src/pages/ai` 로 확인). 따라서 §2 의 P0 gap 7건 중 **어느 것도 현재 테스트가 잡지 못하며**, pass 로 판정한 4건(STATE-01·IA-01·IA-02·EXC-09)에도 회귀 방어선이 없다 — **`?fail=ai:list` / `?empty=list` / `?delay=` 로 재현 가능한 STATE-01 은 테스트로 고정하기 가장 쉬운 항목**이므로 §5 와 함께 이관한다.

**E2E**: **이 두 화면의 e2e 스펙은 커밋되지 않았다.** 구현 중 임시 스펙으로 화면을 구동했고 폐기했다 — quality-bar 가 요구하는 '콜드 E2E 63건 유지' 에 이 화면 몫은 **0건**이다.

## 7. 자기 점검

- [x] P0 30건을 quality-bar 의 지정 순서대로 전수 판정했다 — 빈칸 0건
- [x] §2.1 합계 검산 = 4 + 10 + 9 + 7 = **30** ✓ (차원별 STATE 3 · TOKEN 5 · COMP 1 · FEEDBACK 3 · A11Y 4 · MOTION 3 · IA 5 · EXC 6)
- [x] 모든 `n-a`(9건)에 '이 화면에 그 표면이 없다' 는 사유를 FS-065 §1.1 의 제외 판정 또는 grep 근거와 함께 적었다
- [x] 모든 `pass`(4건)에 `파일:라인` 코드 근거를 적었다
- [x] 모든 `gap`(7건)에 재현 가능한 측정 기준을 적었고 §5 로 이관했다
- [x] 모든 `종속`(10건)에 **이 화면의 어느 표면이 그 계약을 상속하는지**를 못 박았다 — 표면이 없는 요구는 `상속` 이 아니라 `n-a` 로 분류했다
- [x] quality-bar 요구 문구를 복제하지 않고 ID 로만 참조했다
- [x] `?fail=` scope 를 어댑터의 `const SCOPE = 'ai'`(`data-source.ts:45`)에서, 이 화면이 쓰는 op 2종을 `failIfRequested` 호출부에서 직접 확인했다. **`?status=ai:delete:403` 이 파싱되지 않음을 §6 에 명시했다**
- [x] `LATENCY_MS = 400` 이 개발용 지연이며 성능 예산이 아님을 §4.1 에 명시했다
- [x] E2E 를 실행하지 않았고, **이 화면 전용 단위 테스트가 0건임**을 §6 에 명시했다 — 없는 검증을 있다고 적지 않았다
- [x] **`token-guard.test.ts` 통과를 TOKEN-01 충족 근거로 쓰지 않았다** — 그 가드가 `.css` 만 본다는 사실을 가드 자신의 코드(`:51,150-160`)와 머리말(`:12-15`)로 확인하고 §2·§5 에 적었다
- [x] **FEEDBACK-02 의 미충족이 구현 실수가 아니라 FS-065-EL-006 과 quality-bar 의 판정 충돌임**을 §2·§5 #4 에 밝혔다 — 코드만 고쳐 닫을 수 없는 항목을 그렇게 표시했다
- [x] **대화가 보관되지 않는다는 사실을 화면이 배너로 밝히는 것**을 §1 에 강점으로 먼저 기록하고, 보관이 붙을 때 그 배너를 걷어내야 함을 §4.3·§5 #13 에 남겼다
- [x] 형제 NFR-064 와 **어댑터·엔드포인트를 공유한다는 사실**과 공통 gap 4건(TOKEN-01·TOKEN-02·EXC-03·EXC-08)을 §2.1 에 대조했다
- [x] §5 의 gap 이 FS-065 §7 · BE-065 §7.7 과 어디서 만나고 어디서 **만나지 않는지**(신규 항목)를 대조표에 명시했고, **BE-065 §7.7 #3 을 gap 으로 세지 않은 이유**도 함께 적었다
