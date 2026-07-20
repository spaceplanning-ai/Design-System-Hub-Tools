---
id: NFR-064
title: "AI 에이전트 새 채팅 비기능 명세"
functionalSpec: FS-064
backendSpec: BE-064
qualityBar: specs/quality-bar.md
owner: 명세 리뷰
reviewer: 기능 명세
gate: G9
status: draft
version: 1.0
date: 2026-07-19
---

# NFR-064. AI 에이전트 새 채팅 비기능 명세

## 1. 이 문서의 위치

| 항목 | 내용 |
|---|---|
| 대상 화면 | FS-064 AI 에이전트 새 채팅 (`/ai/chat` — 좌측 레일 + 메시지 목록 + 입력줄) |
| 상위 기준 정본 | `specs/quality-bar.md` — 9차원 100요구(P0 30건). **요구 문구의 정본은 그 문서다** |
| 이 문서의 역할 | quality-bar 를 **이 화면에 적용한 판정표**다. 요구를 재서술하지 않고 **ID 로만 참조**하며, '이 화면에서 어떻게 충족되는가(코드 근거)' 와 '무엇을 재현하면 판정되는가(측정 기준)' 만 쓴다 |
| 함께 읽는 문서 | FS-064(요소·예외) · BE-064(엔드포인트·보안 판정). §5 의 gap 은 FS-064 §7 · BE-064 §7.7 과 **같은 항목을 가리킨다** |
| 갱신 규칙 | quality-bar 가 개정되면 §2 의 30행을 재판정한다. 이 화면의 코드가 바뀌면 근거의 `파일:라인` 을 갱신한다. **판정을 코드보다 먼저 고치지 않는다** |
| 판정 방식 | **E2E 미실행 — 판정 근거는 코드 대조다**(§6) |
| 판정 기준일 | **2026-07-19 · HEAD `a91b288`** 기준 코드 대조. **⚠ 이 화면의 구현은 아직 커밋되지 않았다** — `apps/admin/src/pages/ai/**` 는 작업 트리에 untracked 로 존재한다(`git status --porcelain` → `?? apps/admin/src/pages/ai/`). 따라서 이 문서의 `파일:라인` 은 커밋된 스냅숏이 아니라 **작업 트리의 현재 내용**을 가리킨다. 커밋 후 라인이 밀리면 §2 를 갱신한다 |
| 이 화면의 성격 | **백엔드도 언어 모델도 없다.** 답변은 결정적 파서(`_shared/parser.ts`)와 픽스처 조회로만 만들어지며, 연동 자리는 `data-source.ts:8-21`(`askAgent` 머리말)에 명시돼 있다. 이 사실은 판정을 무르게 하는 사유가 아니다 — **화면이 이미 렌더되고 관리자가 실제로 조작하는 표면**은 전부 quality-bar 의 대상이다 |
| 이 화면의 강점 (판정 전 명시) | 이 화면은 **답할 수 없는 요청을 거절한다**(멘션 없음 · 모르는 도메인 · 지원하지 않는 의도 — `_shared/answer.ts:81-105`). 지어낸 문장을 데이터 답변인 것처럼 그리는 경로가 유니온에 아예 없다(`answer.ts:24-39`). 이것은 **FEEDBACK-03 의 취지(클릭이 아무 변화도 안 내는 no-op·거짓 신호를 남기지 않는다)를 가장 강하게 만족하는 구현**이며, §2 의 gap 목록과 별개로 기록한다. 응답 모드 4종 중 3종을 `aria-disabled` + '미연결' 로 남긴 판정(§3 참조)도 같은 축이다 |

### 1.1 표기 규약

| 기호 | 뜻 |
|---|---|
| 적용 `직접` | 이 화면(전용 모듈 `pages/ai/**`)의 코드가 충족을 결정 — 판정 책임이 이 문서에 있다 |
| 적용 `상속` | AppShell·DS(`@tds/ui`)·공용 프레임워크가 결정하고 이 화면은 소비자 — **이 화면에 그 표면이 실재할 때만** 적는다. 판정은 소유 문서에 종속되며, 여기서는 **이 화면의 어느 표면이 그 계약을 상속하는지**를 못 박는다 |
| 적용 `N/A` | 표면(appliesTo)이 이 화면에 없다 — **반드시 사유** |
| 판정 `pass` | 코드 근거로 충족 확인 |
| 판정 `gap` | 미충족 확인 — §5 로 이관. **P0 의 gap 은 quality-bar '배치 실패' 사유** |
| 판정 `종속` | `상속` 항목 — 소유 문서/DS 판정을 따른다 |

## 2. P0 30건 — 이 화면 적용 판정 (전수)

| 요구 ID | 차원 | 적용 | 이 화면에서의 충족 방식 (코드 근거) | 측정 기준 (재현 절차) | 판정 |
|---|---|---|---|---|---|
| STATE-01 | STATE | 직접 | **충족 (2026-07-19 수정).** 본문에 first-load 분기를 넣었다: `conversationFirstLoading = conversationId !== null && conversation.isFetching && conversation.data === undefined` 일 때 '대화를 불러오는 중…'(`aria-busy="true"`)을 그리고, 빈 상태 조건에서 이 경우를 제외한다(`NewChatPage.tsx` — `conversationFirstLoading` 선언부와 빈 상태 분기). 재조회(`data` 가 이미 있음)에는 걸리지 않아 목록이 지워지지 않는다. 좌측 레일은 이전부터 옳았다(`ConversationRail.tsx` `loading` 분기). 회귀 방지 테스트: `NewChatPage.test.tsx` — '대화를 처음 불러오는 동안 빈 상태 대신 로딩을 그린다' | `/ai/chat?c=CV-0001&delay=3000` → 3초 동안 '대화를 불러오는 중…' 이 뜨고 '무엇을 조회할까요?' 는 **뜨지 않는다**. 도착 후 메시지로 바뀐다 | pass |
| ~~STATE-01 (수정 전)~~ | STATE | 직접 | **미충족이었다 — 본문이 first-load 를 empty 로 그렸다.** 좌측 레일은 옳다: `loading={conversations.isFetching && conversations.data === undefined}`(`NewChatPage.tsx:234`) → `ConversationRail.tsx:135` 이 그때만 '기록을 불러오는 중…' 을 그린다. **본문(메시지 목록)에는 그 분기가 없다**: `messages = conversation.data?.messages ?? []`(`NewChatPage.tsx:150`)이고, 빈 상태 조건이 `messages.length === 0 && pending === null`(`:263`) 뿐이라 **`?c=` 로 대화를 여는 최초 조회 동안 `data === undefined` 가 `[]` 로 붕괴해 '무엇을 조회할까요?' 빈 상태가 렌더된다.** `conversation.isFetching`·`conversation.isLoading` 을 이 파일 어디에서도 읽지 않는다(grep = 0) | `/ai/chat?c=CV-0001&delay=3000` → 3초 동안 **'무엇을 조회할까요?' + 시작 제안 3건**이 뜬 뒤 메시지로 바뀐다. 로딩 표시가 0건 → 미충족(quality-bar: '로드 중 empty 가 번쩍이면 운영자가 오판한다'). 레일 쪽은 같은 조건에서 '기록을 불러오는 중…' 이 옳게 뜬다 | **gap** |
| STATE-02 | STATE | 직접 | **미충족 — 두 조회 모두 계약을 벗어난다.** ① 대화 상세: `conversation.isError` 를 **한 번도 읽지 않는다**(`NewChatPage.tsx` grep = 0). 실패해도 `messages` 가 `[]` 라 STATE-01 과 같은 빈 상태가 뜬다 — 인라인 Alert 도, '다시 시도' 도, 실패라는 신호 자체가 없다. `deletedWhileOpen`(`:153-154`)은 `conversation.isSuccess && data === null` 이라 **실패 경로에 걸리지 않는다**(FS-064-EL-022 가 의도한 대로 '없음'과 '실패'를 가르지만, 실패 쪽에 받아 줄 표면이 없다). ② 레일: `failed` → `ConversationRail.tsx:134` 이 **muted `<p>`** 로 '기록을 불러오지 못했습니다.' 를 그린다 — `Alert tone="danger"` 가 아니고 **'다시 시도' 컨트롤이 없다**(`refetch` 를 레일에 넘기지 않는다) | ① `/ai/chat?c=CV-0001&fail=ai:detail` → 인라인 danger Alert 0건 · 재시도 0건 · 빈 상태가 대신 뜸 → 미충족. ② `/ai/chat?fail=ai:list` → 레일에 회색 한 줄만. `Alert tone="danger"` 렌더 0건 · 재시도 버튼 0건 → 미충족 | **gap** |
| STATE-04 | STATE | N/A | **페이지네이션·행 선택 표면이 이 화면에 없다.** 레일 기록은 두 묶음 고정(FS-064-EL-003)이고 페이지 개념이 없다. 결과 표는 읽기 전용이라 `selectedIds` 가 존재하지 않는다(FS-064 §4.1 '행 선택의 수명 — N/A'). clamp 할 page 도, 해제할 선택도 없다 | — | n-a |
| TOKEN-01 | TOKEN | 직접 | **미충족 — CSS border 키워드 10건.** hex·px 리터럴은 0건이고 CSS 파일(`ai.css`)은 완전히 깨끗하다. 그러나 **인라인 style 의 `border: 'thin solid …'`** 가 이 화면에 10건 있다: `ConversationsPage.tsx:56`(형제 화면) · `AnswerView.tsx:45,61,73` · `Composer.tsx:31,73` · `ConversationRail.tsx:21` · `ModePicker.tsx:29,50,106`. quality-bar TOKEN-01 은 `(outline\|border): (thin\|medium\|thick)` **0건**을 명시한다. **`token-guard.test.ts` 가 이것을 잡지 못한다** — 값 가드(hex·px·border 키워드)는 `cssEntries` 만 순회하고(`token-guard.test.ts:150-160`, 스캔 대상 `collectFiles(SRC_DIR, ['.css'])` — `:51`) `.tsx` 는 '실재하지 않는 토큰 참조' 만 본다. 그 한계는 가드 자신이 머리말에 적어 뒀다(`:12-15` '값 가드는 CSS 만 … 남은 구멍으로 보고했다'). 부수로 `ConversationRail.tsx:33` 이 semantic 이 아닌 **primitive 토큰**(`--tds-primitive-typography-font-weight-medium`)을 직접 참조한다 | `grep -rnE "(border[a-zA-Z-]*\|outline)\s*:\s*'?(thin\|medium\|thick)" apps/admin/src/pages/ai` → **10건** → 미충족. `#hex` = 0 · `[1-9]px` = 0 → 그 두 절은 충족. **`pnpm vitest token-guard` 초록불을 근거로 삼지 말 것** — 위 근거대로 그 가드는 `.tsx` 의 값을 보지 않는다 | **gap** |
| TOKEN-02 | TOKEN | 직접 | **충족 (2026-07-19 수정).** 입력의 `outline: 'none'` 을 제거하고, 초점 링을 감싼 상자가 그리도록 `.tds-ai-composer:focus-within` 을 추가했다(`ai.css`) — `border-color` + `outline` 을 `--tds-color-border-focus` 로 준다. 인라인 스타일로는 `:focus-within` 을 쓸 수 없어 CSS 파일에 둔다 | 키보드 Tab 으로 입력줄 진입 → 상자에 초점 링이 보인다. 이전에는 표시가 없었다 | pass |
| ~~TOKEN-02 (수정 전)~~ | TOKEN |  | **미충족이었다 — 이 화면의 주 입력에 포커스 링이 없다.** 앱의 단일 링은 `.tds-ui-focusable:focus-visible`(`shared/ui/ui.css:14`)이 소유하는데, ① 질문 입력이 **링을 명시적으로 제거한다**: `outline: 'none'`(`Composer.tsx:46`, `border: 'none'` 과 함께) 이고 `tds-ui-focusable` 을 붙이지 않으며 감싼 `formStyle`(`:21-34`)에 `:focus-within` 대체 표시도 없다 → **Tab 으로 들어와도 어디에 있는지 보이지 않는다.** ② 모드 트리거·메뉴 항목(`ModePicker.tsx:170-182`·`:188-193`·`:229-233`), 멘션 후보 `option`(`Composer.tsx:184-195`), 레일 기록 링크(`.tds-ai-railitem` — `ai.css:36-56` 에 `:focus-visible` 규칙 없음)는 UA 기본 링에 맡겨져 토큰 쌍을 쓰지 않는다. **이 화면에서 토큰 링을 렌더하는 표면은 후속 제안 버튼 1종뿐이다**(`ai.css:30-33` — `var(--tds-border-width-medium)` + `var(--tds-color-border-focus)`) | `/ai/chat` 진입 → Tab. 질문 입력에서 **가시 링 0건**(`outline: none`) → 미충족. 후속 제안(↳)에서는 2px 토큰 링이 보인다(두 표면이 갈리는지 확인). `grep -n "tds-ui-focusable" apps/admin/src/pages/ai` → **0건** | **gap** |
| TOKEN-03 | TOKEN | N/A | **easing 을 소비할 표면이 이 화면에 없다.** `grep -rn "transition\|animation" apps/admin/src/pages/ai` → **0건**(주석 포함 0). 이 화면은 Modal·Toast·스켈레톤을 쓰지 않는다 — 조회 중 표시는 정적 텍스트('조회 중…', `NewChatPage.tsx:297`)이고, 실패·통지는 정적 `Alert` 다. 유효한 timing-function 으로 계산될 선언이 존재하지 않는다 | — | n-a |
| TOKEN-04 | TOKEN | 직접 | **미충족 — 이 화면의 floating surface 두 개가 평면이다.** quality-bar 가 appliesTo 에 **dropdown/popover 를 명시**하는데, 이 화면의 두 팝업이 그림자 없이 테두리만으로 떠 있다: 멘션 후보 listbox(`Composer.tsx:60-77` — `position:absolute` · `zIndex:2` · `border` + `background`, `box-shadow` 없음)와 응답 모드 menu(`ModePicker.tsx:39-54` — `zIndex:3`, 동일). 둘 다 본문 위에 겹쳐 뜨므로 층을 시각적으로 말해야 하는 바로 그 표면이다. raw `box-shadow` 리터럴은 0건이라 **금지 절은 지키고 적용 절을 놓쳤다** | `grep -n "box-shadow" apps/admin/src/pages/ai` → **0건**. `@` 를 입력해 후보 목록을 띄우고 그 뒤의 본문 텍스트와의 경계를 확인 → 테두리 1px 뿐, 부상 없음 → 미충족 | **gap** |
| TOKEN-05 | TOKEN | 상속 | 이 화면의 `<h1>` 은 AppHeader 가 그린다(`AppHeader.tsx:101`, `findNavLabel(pathname)` → `nav-config.ts:192` `['새 채팅', '/ai/chat']` 잎과 정확히 일치). 화면 자체는 h1 을 그리지 않고 빈 상태 제목만 `<h2>`(`NewChatPage.tsx:265`, `--tds-typography-title-md-*` — `:112-122`) · 레일 묶음 머리글을 `<h3>`(`ConversationRail.tsx:108`, caption-md)로 둔다 — 계층이 h1 > h2 > h3 로 내려간다 | 판정은 tokens/AppHeader 소유 문서에서. 이 화면에서는 헤더 '새 채팅' `<h1>` 이 빈 상태 `<h2>` 보다, 그것이 본문(body-md)보다 가시적으로 큰지만 확인 | 종속 |
| COMP-10 | COMP | 직접 | **충족 (2026-07-19 수정).** `Composer.tsx` onKeyDown 첫 줄에서 `event.nativeEvent.isComposing` 이면 즉시 반환한다 — 한글 조합 확정용 Enter 가 질문을 보내거나 후보를 고르지 않는다. 회귀 방지 테스트: `Composer.test.tsx` — '조합 중(isComposing)의 Enter 는 제출도 후보 선택도 하지 않는다' | 한글로 '@회원목록 VIP 뽑아줘' 입력 후 마지막 글자 확정 Enter → 전송되지 않음. 조합 종료 후 Enter → 전송 | pass |
| ~~COMP-10 (수정 전)~~ | COMP | 직접 | **미충족이었다 — IME 조합 처리가 이 화면 전체에 0건이다.** 표면이 둘 있다: ① **레일 검색**(`ConversationRail.tsx:127` `SearchField` → `NewChatPage.tsx:232` `onKeywordChange={setRailKeyword}`)이 **매 키 입력마다** 즉시 필터를 커밋한다(`ConversationRail.tsx:97-100`) — 조합 중 '자모마다 결과가 뒤바뀐다'. 앱에는 이미 이 문제를 푼 공용 훅이 있으나(`shared/crud/useDebouncedSearch.ts` — `isComposing`/`compositionend` 처리 + 디바운스) **이 화면이 쓰지 않는다.** ② **질문 입력의 Enter 제출**(`Composer.tsx:173-176`)이 `event.nativeEvent.isComposing` 을 보지 않는다 — 한글 질문을 치고 조합을 확정하려 누른 Enter 가 **조합 중인 문장을 그대로 전송**한다. FS-064-EL-033 은 '후보 목록이 닫혀 있을 때만 제출' 만 규정하고 조합 축을 다루지 않는다. **네트워크 발행이 없어 debounce·stale-response 절은 이 화면에서 무해하나, 조합 절은 그대로 위반이다** | `grep -rn "isComposing\|compositionend" apps/admin/src/pages/ai` → **0건**. ① 레일 검색에 '홍길동' 을 IME 로 입력 → 자모 단계마다 목록이 바뀐다. ② 질문 입력에 '@회원목록 VIP 보여줘' 를 IME 로 치고 마지막 음절 조합 중 Enter → **미완성 문장이 전송된다**(1회 완성 후 1건이어야 한다) → 미충족 | **gap** |
| FEEDBACK-02 | FEEDBACK | N/A | **파괴적·비가역 액션이 이 화면에 없다.** 대화 삭제는 형제 화면(FS-065 / NFR-065)이 소유한다. '새 채팅'(`NewChatPage.tsx:191-201`)은 진행 중 요청을 abort 하고 `?c=` 를 지울 뿐 저장된 것을 지우지 않으며, 질문 전송은 append 라 되돌릴 대상이 없다. `ConfirmDialog` 를 import 하지 않는다(grep = 0) | — | n-a |
| FEEDBACK-04 | FEEDBACK | N/A | **RHF 폼이 이 화면에 없다.** 입력은 질문 한 줄(`draft`, `NewChatPage.tsx:136`)이고 `useForm`·`isDirty`·`useUnsavedChangesDialog` 를 import 하지 않는다(grep = 0) — 가드할 '저장하지 않은 변경' 개념이 성립하지 않는다. **단, 작성 중인 질문은 이탈 시 사라진다** — 그것은 이 요구의 대상(폼 초안)이 아니므로 §4.3 에 별도로 기록한다 | — | n-a |
| FEEDBACK-06 | FEEDBACK | N/A | **편집 가능한 폼을 담은 modal 이 이 화면에 없다.** 이 화면의 팝업 둘은 멘션 후보 listbox 와 응답 모드 menu 이며 **입력을 담지 않는다**(선택지와 정적 안내뿐 — `ModePicker.tsx:184-246`). `Modal`·`useModalDirtyGuard` 를 import 하지 않는다 | — | n-a |
| A11Y-01 | A11Y | N/A | **이 화면은 toast 를 쓰지 않는다.** `useToast` 를 import 하지 않는다(`NewChatPage.tsx` grep = 0) — 조회 실패조차 토스트가 아니라 **대화 안의 메시지**로 남긴다(FS-064 §4.1 '실패 통지의 자리'; `NewChatPage.tsx:203-206,301-306`). ToastProvider viewport 는 이 화면에 표면이 없다. 이 화면 고유의 live region(`role="status" aria-live="polite" aria-label="응답 상태"` — `:255-261`)은 **상시 마운트**이고 텍스트만 갈아끼우므로 A11Y-01 이 지적하는 '내용과 함께 생성되는 region' 함정에 해당하지 않는다(그 판정은 A11Y-16 축이다 — §3) | — | n-a |
| A11Y-02 | A11Y | N/A | **dialog 표면이 이 화면에 없다.** `Modal`·`ConfirmDialog` 를 import 하지 않는다(grep = 0). `aria-describedby` 로 연결할 다이얼로그 본문이 존재하지 않는다 | — | n-a |
| A11Y-11 | A11Y | 직접 | 이 화면의 폼 컨트롤은 둘이고 **짝 없는 `aria-invalid` 가 0건**이다: `grep -rn "aria-invalid\|aria-required" apps/admin/src/pages/ai` → **0건**. ① 질문 입력은 프로그램적 이름을 `aria-label="질문 입력"` 으로 갖고(`Composer.tsx:208`) 검증 상태가 없다 — 이 화면은 값을 거절하지 않고 **파서가 못 알아들으면 답변으로 안내한다**(`answer.ts:81-105`), 그래서 연결할 error `<p>` 도 hint 도 존재하지 않는다. ② 레일 검색은 DS `SearchField` 가 `label="대화 검색"` 으로 라벨을 소유한다(`ConversationRail.tsx:127`). required 필드가 없어 `aria-required` 대상도 없다 | `apps/admin/src/pages/ai` grep: `aria-describedby` 없는 `aria-invalid` = **0**. RTL: `getByRole('combobox', { name: '질문 입력' })` 가 해석된다(`NewChatPage.test.tsx:43` 이 이 조회로 화면을 구동한다 — 이름이 깨지면 11건이 함께 깨진다) | pass |
| A11Y-12 | A11Y | N/A | **좌측 '필터' list item 이 이 화면에 없다.** 좌측 레일은 toggle 필터가 아니라 **진짜 내비게이션**이다 — 항목이 `<Link to={/ai/chat?c=…}>` 이고(`ConversationRail.tsx:112-118`) 클릭하면 URL 이 바뀐다. 그래서 `aria-current="page"`(`:115`)가 옳으며, 이는 quality-bar A11Y-12 가 `Pagination` 에 대해 명시한 **'진짜 내비게이션이라 정당한 예외'** 와 같은 축이다. `filterItemStyle` 을 호출하지 않고 파일명이 `*Filter.tsx`/`*Panel.tsx` 도 아니므로 `a11y-guard.test.ts:67-88` 의 스캔 대상이 아니다(그 가드가 침묵하는 것이 사각지대가 아니라 **범위 밖**임을 여기에 못 박는다) | — | n-a |
| MOTION-01 | MOTION | N/A | **Modal organism 이 이 화면에 없다**(A11Y-02 와 같은 사유). enter/exit transition 을 상속할 표면이 존재하지 않는다 | — | n-a |
| MOTION-02 | MOTION | N/A | **toast 표면이 이 화면에 없다**(A11Y-01 과 같은 사유) | — | n-a |
| MOTION-03 | MOTION | N/A | **이 화면에 motion 이 0건이다** — 자체 선언도(`transition`/`animation` grep = 0), 상속 표면도(Modal·Toast·스켈레톤 pulse 중 어느 것도 렌더하지 않는다) 없다. reduced-motion 게이트가 걸릴 대상이 존재하지 않는다. 상태 변화는 전부 즉시 교체다(후보 목록 open/close · 메뉴 open/close · 메시지 추가) | — | n-a |
| IA-01 | IA | 직접 | `{ path: '/ai/chat', element: <NewChatPage />, implemented: true }`(`App.tsx:354`)가 AppShell layout route 아래에 있다(`App.tsx:444-450` — `RequireAuth > AppShell` 의 자식). 이 화면은 자체 outer frame 을 렌더하지 않는다 — 최상위가 `layoutStyle` grid 하나다(`NewChatPage.tsx:227`). **좌측 레일의 `<nav aria-label="대화 기록">`(`ConversationRail.tsx:126`)은 앱 사이드바가 아니라 `<main>` 안의 화면 내부 영역**이며(FS-064-SEC-01), AppShell 의 nav 를 대체하거나 가리지 않는다 — 라벨을 붙여 두 landmark 가 AT 에서 구분된다 | `/ai/chat` 진입 → 앱 사이드바·AppHeader·단일 padded `<main>` 안에 렌더. `pages/ai` grep: `<aside`·`<header` = **0**. `<nav` = 1건(레일, 라벨 있음) | pass |
| IA-02 | IA | 직접 | 제목 소스가 **하나**다: AppHeader `<h1>`(`AppHeader.tsx:101`)의 `findNavLabel(pathname)`. `/ai/chat` 은 nav 잎과 정확히 일치하므로(`nav-config.ts:192`) '새 채팅' 이 나오고 가지 라벨('AI 에이전트')로 폴백하지 않는다. **이 화면에는 sub-route 가 없다** — 열어 둔 대화는 라우트가 아니라 쿼리스트링(`?c=`)에 실린다(`App.tsx:351-353` 주석이 그 판정을 남긴다), 그래서 IA-02 가 지적하는 '모호한 branch label' 경로가 생기지 않는다. 화면 자체는 h1 을 그리지 않아 중복 h1 이 0건이다 | `/ai/chat` · `/ai/chat?c=CV-0001` 둘 다 가시 primary title = '새 채팅'. `pages/ai` grep: `<h1` = **0** | pass |
| IA-04 | IA | N/A | **list 화면이 아니다.** toolbar row · 결과 count 요약 · SelectionBar · table · Pagination 로 이뤄진 list 템플릿의 대상이 아니라 **대화 화면**이다(FS-064 §2 의 세 영역: 레일 · 메시지 목록 · 입력줄). 레일 기록은 목록이지만 검색·페이징·bulk 가 없는 내비게이션이고(FS-064-EL-003), 답변 안의 결과 표는 **답변의 일부**이지 화면의 list 표면이 아니다 — 전체는 원본 목록 화면으로 넘긴다(`AnswerView.tsx:161-170`) | — | n-a |
| IA-05 | IA | N/A | **create·edit 라우트 쌍이 없다.** 이 화면에는 엔티티 폼이 없고 `/ai/chat` 단일 라우트다(`App.tsx:354`) — 구분할 `:id` 도, 나눌 등록/수정 title 도 존재하지 않는다. `useCrudForm` 을 import 하지 않는다 | — | n-a |
| IA-13 | IA | 직접 | **충족 (2026-07-19 수정).** 열어 둔 대화(`?c=`)에 더해 레일 검색어도 URL(`?q=`)에 싣는다 — `NewChatPage.tsx` 의 `railKeyword = params.get('q') ?? ''` / `setRailKeyword` 가 `setParams(..., { replace: true })` 로 갱신한다(히스토리를 타이핑으로 더럽히지 않는다). 응답 모드는 선택 가능한 값이 하나라 복원할 view 차이가 없다. 회귀 방지 테스트: `NewChatPage.test.tsx` — '`?q=` 로 들어오면 기록이 그 검색어로 좁혀진 채 복원된다' | `/ai/chat?c=CV-0001&q=VIP` 를 새 탭에 복사 → 같은 대화 + 같은 검색어로 좁혀진 기록이 재현된다 | pass |
| ~~IA-13 (수정 전)~~ | IA | 직접 | **부분 충족이었다 — 두 축 중 하나가 URL 밖에 있다.** ① **열어 둔 대화는 충족한다**: `useSearchParams`(`NewChatPage.tsx:133`)로 `?c=` 를 읽고(`:134`) 새 대화가 열리면 URL 에 붙이며(`:175-179`) '새 채팅' 은 지운다(`:196-200`) — 새로고침·뒤로가기·링크 공유가 같은 대화를 재현한다. ② **레일 검색 키워드는 컴포넌트 state 에만 있다**: `const [railKeyword, setRailKeyword] = useState('')`(`:135`). quality-bar IA-13 은 직렬화 대상에 **keyword 를 명시**한다 — 좁혀 둔 기록 view 는 새로고침하면 풀리고 링크로 공유할 수 없다. ③ 응답 모드(`modeId`, `:137`)도 state 지만 **선택 가능한 값이 하나뿐이라**(`modes.ts:26-31`) 복원할 view 차이가 지금은 생기지 않는다 | ① `/ai/chat?c=CV-0001` 을 새 탭에 복사 → 같은 대화 재현 → 충족. ② 레일 검색에 'VIP' 입력 → 목록이 좁혀짐 → F5 → **검색어가 사라지고 전체 기록이 돌아온다**. URL 에 `keyword`/`q` 없음 → 미충족 | **gap** |
| EXC-01 | EXC | 상속 | 이 화면은 **이중 경계 안**에 있다: ① `AppShell.tsx:523-532` 의 `<Outlet>` 바깥 경계(`resetKey={pathname}` → 다른 메뉴로 이동하면 자동 복구, 사이드바·헤더 생존) ② `App.tsx:430` 의 루트 경계(셸 자체가 던질 때). 이 화면은 자체 경계를 두지 않고 상속만 한다. **실행기가 던지지 않는 설계**(`execute.ts:151-156` — '채팅 화면에서 예외가 위로 튀면 대화 전체가 에러 화면으로 바뀐다')가 이 경계에 도달하는 경로 자체를 줄인다 | 판정은 ErrorBoundary/AppShell 소유 문서에서. 이 화면에서는 `NewChatPage` 강제 throw 시 사이드바가 남고 다른 메뉴로 이동 가능한지만 확인 | 종속 |
| EXC-02 | EXC | 상속 | 두 층이 이 화면을 덮는다: ① route guard — `RequireAuth` 가 AppShell **바깥**이라(`App.tsx:445-447`) 세션 없이 `/ai/chat` deep-link 시 셸도 그리지 않고 `/login?returnUrl=/ai/chat` 로 보낸다(FS-064 §4.1 '세션 만료') ② 401 인터셉터 — `queryClient` 의 `QueryCache`/`MutationCache` `onError` 가 이 화면의 조회 2종·전송 1종을 모두 덮는다(셋 다 같은 client 를 쓴다 — `queries.ts:21,31,50`) | 판정은 RequireAuth/queryClient 소유 문서에서. 이 화면에서는 `?status=list:401` · `?status=ask:401` 각각이 `/login?returnUrl=%2Fai%2Fchat&reason=session_expired` 로 보내는지만 확인 | 종속 |
| EXC-03 | EXC | 직접 | **미충족 — 두 절 중 하나만 성립한다.** ① read 게이팅은 **상속으로 성립한다**: `RequirePermission`(`AppShell.tsx:529`)이 `<Outlet>` 을 감싸므로 `/ai/chat` read 가 꺼진 역할은 `ForbiddenScreen` 을 본다(FS-064 §4.1 '권한 없음'). ② **write 게이팅이 없다**: 질문 전송은 BE-064-EP-03 기준 **쓰기**인데(`POST …/messages`, 비멱등) 보내기 버튼의 `disabled` 는 `busy || value.trim() === ''` 뿐이다(`Composer.tsx:233`) — `useRouteWritePermissions`/`useRouteCan` 을 `pages/ai` 전체에서 호출하지 않는다(grep = **0건**). ③ **더 큰 축: 멘션 도메인의 권한 승계가 프론트에 없다.** BE-064 §3.5 가 '이 화면이 권한 우회 통로가 될 수 있다' 고 판정한 바로 그 경로다 — `provider-members.ts:72` 가 `MEMBERS` 픽스처를 **권한 검사 없이** 직접 필터한다. `/users/members` read 가 꺼진 운영자도 `@회원목록` 으로 실제 회원 행(닉네임·계정·등급·가입일·누적 구매액 — `:69`)을 받는다 | ① `page:/ai/chat` read 를 끈 역할로 deep-link → 403 화면 → 충족. ② `/ai/chat` 의 write 를 끈 역할로 진입 → **보내기 버튼이 그대로 렌더되고 눌린다** → 미충족. ③ `/users/members` read 를 끈 역할로 `@회원목록 VIP 보여줘` → **행이 그대로 나온다** → 미충족(BE-064 §3.5 는 422 → `kind='guidance'` 를 요구한다) | **gap** |
| EXC-04 | EXC | N/A | **낙관적 동시성 토큰을 실을 write 가 이 화면에 없다.** 이 화면의 유일한 쓰기는 **append**(질문 전송)이고 기존 값을 덮어쓰는 record 폼이 존재하지 않는다 — `Conversation` 은 `updatedAtIso` 를 갖지만(`conversations.ts:30`) 화면이 그것을 편집하지 않는다. '그 사이 대화가 사라졌다' 는 경합은 **덮어쓰기가 아니라 갈래로** 처리된다: `askAgent` 가 `ConversationGoneError` 를 던지고(`data-source.ts:119,127`) 화면이 그 종류를 보고 안내를 바꾼다(`NewChatPage.tsx:185` → `:239-248` FS-064-EL-022) — quality-bar 가 경고한 'ghost saved toast' 가 발생하지 않는다. BE-064 §5 의 409 는 서버 측 동시 append 조정이지 클라이언트 If-Match 대상이 아니다 | — | n-a |
| EXC-08 | EXC | 직접 | **부분 충족 — 잠금과 멱등키가 없다.** ① pending 중 비활성은 있다: 입력 `disabled={busy}`(`Composer.tsx:216`) · 보내기 `disabled={busy \|\| …}`(`:233`), `busy = ask.isPending`(`NewChatPage.tsx:315`). ② **동기 submit lock 이 없다** — `send`(`:156-189`)에 `submitLockRef` 가 없다. 대신 **직전 요청을 abort 하고 새로 건다**(`:160-162`). 그래서 픽스처 경로에서는 결과적으로 in-flight 가 1건으로 수렴하지만(abort 된 요청은 `wait` 에서 거절돼 append 에 도달하지 못한다 — `data-source.ts:104`), **실서버에서는 abort 가 이미 처리된 요청을 되돌리지 못한다**(BE-064-EP-03 은 **비멱등**이라고 명시한다). ③ **멱등키가 없다** — BE-064-EP-03 이 `Idempotency-Key` 헤더를 요구하는데 `askAgent`(`data-source.ts:102`)의 시그니처·본문 어디에도 그 값이 생성되지 않는다 | 보내기 연타 / 응답 전 Enter 연타 → 픽스처에서는 마지막 1건만 대화에 남는다(abort 덕). `grep -rn "submitLockRef\|Idempotency" apps/admin/src/pages/ai` → **0건** → quality-bar 의 'AND 동기 submit lock … per-submit-attempt idempotency key' 미충족 | **gap** |
| EXC-09 | EXC | 직접 | abort 를 실패로 다루지 않는다 — 공유 predicate 사용(`shared/async.isAbort`, `NewChatPage.tsx:19`). ① mutation `onError` 가 `isAbort(error)` 로 **먼저** 걸러 early return 한다(`:184`) ② 실패 답변 자체가 abort 를 제외한다(`failedAnswer = ask.isError && !gone && !isAbort(ask.error)` — `:203-206`) — 그래서 abort 된 요청이 대화에 실패 메시지를 남기지 않는다 ③ abort 원인 3곳이 모두 의도적이다: 언마운트 cleanup(`:148`) · 새 전송(`:160`) · '새 채팅'(`:192`) ④ `pending` 은 성공·실패 양쪽에서 리셋된다(`:172,183`). bulk 작업이 없어 실패 count 제외 조항은 이 화면에 해당하지 않는다 | 조회 진행 중(`?delay=3000`) 다른 메뉴로 이동 → 실패 메시지·토스트 0건. 조회 진행 중 두 번째 질문 전송 → 첫 요청은 조용히 사라지고 두 번째 답변만 남는다. `?fail=ai:ask` 는 abort 가 아니므로 실패 답변이 정상 표시된다(두 경로가 갈리는지 확인) | pass |

### 2.1 P0 판정 요약

| 판정 | 건수 | 요구 ID |
|---|---|---|
| pass | **8** | A11Y-11 · IA-01 · IA-02 · EXC-09 · **STATE-01** · **TOKEN-02** · **COMP-10** · **IA-13** |
| 종속(상속) | **3** | TOKEN-05 · EXC-01 · EXC-02 |
| n-a | **14** | STATE-04 · TOKEN-03 · FEEDBACK-02 · FEEDBACK-04 · FEEDBACK-06 · A11Y-01 · A11Y-02 · A11Y-12 · MOTION-01 · MOTION-02 · MOTION-03 · IA-04 · IA-05 · EXC-04 |
| **gap** | **5** | **STATE-02 · TOKEN-01 · TOKEN-04 · EXC-03 · EXC-08** |
| 합계 검산 | **8 + 3 + 14 + 5 = 30** ✓ | (STATE 3 · TOKEN 5 · COMP 1 · FEEDBACK 3 · A11Y 4 · MOTION 3 · IA 5 · EXC 6 = 30) |

> **v1.0 최초 판정에서 gap 이던 4건(STATE-01 · TOKEN-02 · COMP-10 · IA-13)은 판정 당일 고쳤다.** 판정표를 무르게 고친 것이 아니라
> **코드를 고치고 판정을 따라 옮겼다** — 각 행에 수정 내용과 회귀 방지 테스트를 남겼고, 수정 전 판정은 취소선 행으로 함께 보존한다
> (`~~STATE-01 (수정 전)~~` 등). 무엇이 왜 틀렸었는지가 사라지면 같은 실수가 돌아온다.

> **P0 gap 9건 = quality-bar '배치 실패' 사유**(§How to use: 'P0 하나라도 미충족이면 배치는 acceptance 실패'). 9건은 **세 뿌리**로 갈린다. ① **공용 셸을 쓰지 않았다** — 이 화면은 `CrudListShell`·`FormPageShell`·`DocumentFormShell` 중 어느 것도 경유하지 않고 레이아웃·상태 분기를 직접 그린다. 그래서 그 셸들이 이미 갖고 있던 계약(first-load 분기 · read 실패 배너 · 포커스 링 클래스 · 디바운스 검색 훅)이 **상속되지 않았다**: STATE-01 · STATE-02 · TOKEN-02 · COMP-10. ② **인라인 style 이 CSS 가드의 사각지대에 있다** — TOKEN-01 · TOKEN-04. ③ **권한·중복 제출 방어가 이 섹션에 미적용** — EXC-03 · EXC-08(형제 NFR-015 와 같은 뿌리). IA-13 만 단독이다. §5 참조.
>
> **n-a 14건이 많은 것은 판정의 무름이 아니다.** 이 화면에는 페이지네이션·행 선택·RHF 폼·modal·toast·Modal 모션·list 템플릿·create/edit 라우트가 **하나도 없다** — 대화 화면이기 때문이다. 각 행에 '왜 없는가' 를 grep 근거와 함께 적었다.

## 3. 이 화면에 걸리는 P1 · P2 (선별)

표면이 실재하는 것만 적는다.

| 요구 ID | P | 이 화면에서의 상태 | 측정 기준 | 판정 |
|---|---|---|---|---|
| STATE-03 | P1 | **반쪽이다.** 대화 목록은 `placeholderData: (previous) => previous`(`queries.ts:24`)로 이전 행을 유지한다 — 질문 전송 후 `invalidateQueries`(`:53`)가 도는 동안 레일이 비지 않는다. **대화 상세에는 그 옵션이 없다**(`:28-36`) — 키가 id 별이라 `?c=` 를 갈아탈 때마다 `data === undefined` 가 되고, STATE-01 의 결함과 겹쳐 **빈 상태가 번쩍인다** | 레일: 질문 전송 후 기록이 유지된다 O. 본문: 대화 A → B 전환 시 '무엇을 조회할까요?' 가 한 번 뜬다 X | 부분(STATE-01 과 동근) |
| STATE-05 | P1 | 결과 0행을 **'아직 없음'이 아니라 '필터 결과 없음'으로** 말한다 — `<Empty label={outcome.domainLabel} hasActiveFilters />`(`AnswerView.tsx:126`). 조건을 **푸는** 후속 제안을 함께 준다(`answer.ts:66-69` — '조건 없이 … 전체 보기'). 레일의 0건도 두 갈래다: '아직 대화가 없습니다.' vs '검색 결과가 없습니다.'(`ConversationRail.tsx:139`) | `@회원목록 오늘 가입한 VVIP 보여줘` → 필터 empty + '↳ 조건 없이' 제안. `NewChatPage.test.tsx:127-137` 이 이를 고정한다 | pass |
| STATE-06 | P1 | 전송 성공 시 **그것이 stale 로 만든 두 키만** 무효화한다 — 대화 목록과 그 대화(`queries.ts:53-54`). 삭제는 `aiKeys.all`(`:68`) — 목록과 상세 모두에 영향이 가므로 옳다 | 질문 전송 후 레일의 갱신 시각·순서가 즉시 반영된다. 다른 도메인 캐시는 건드리지 않는다 | pass |
| COMP-01 | P1 | **부분.** 보내기·새 채팅·삭제 안내 버튼은 DS `Button` 이다(`Composer.tsx:229` · `ConversationRail.tsx:129` · `NewChatPage.tsx:243`). 금지 grep 은 깨끗하다(`buttonStyle(`·`tds-ui-btn-` = **0건**). 그러나 **로컬 버튼이 셋 남는다**: 후속 제안(`.tds-ai-followup` — `ai.css:14-33`), 모드 트리거·메뉴 항목(`ModePicker.tsx:170,188,229`), 멘션 후보 `option`(`Composer.tsx:184`). 앞의 둘은 링크·메뉴 성격이라 `Button` 으로 표현하기 어려운 표면이고, 그 사실이 TOKEN-02 gap(포커스 링 부재)의 원인이기도 하다 | `grep -rn "buttonStyle(\|tds-ui-btn-" apps/admin/src/pages/ai` → 0건 O. 로컬 버튼 스타일 3종 존재 X | 부분(문서화) |
| COMP-03 | P1 | 레일 검색이 DS `SearchField` 다(`ConversationRail.tsx:127`) — raw `<input type="search">` 재구현이 없다 | `pages/ai` grep: `type="search"` = **0** | pass |
| COMP-09 | P1 | 레일 항목은 ellipsis 로 truncate 한다(`ai.css:44-46`). 결과 표의 셀은 `whiteSpace: 'nowrap'`(`AnswerView.tsx:65,75`)이라 잘리지 않고 늘어나지만, 감싼 컨테이너가 `overflowX: 'auto'`(`:44`)이고 그리드가 `minmax(0, 1fr)`(`NewChatPage.tsx:35`)이라 **표가 페이지 레이아웃을 밀지 않는다** — 대신 표 안에서 가로 스크롤된다 | 긴 닉네임 행 → 표 안에서 가로 스크롤, 본문 폭 불변. 레일의 긴 제목 → '…' | pass |
| COMP-12 | P2 | 질문 입력에 **길이 상한이 없다**(`Composer.tsx:204-223` — `maxLength` 없음). BE-064-EP-03 은 **1–1000자**를 요구하고 초과를 400 `VALIDATION_FAILED` 로 거절한다 — 지금은 카운터도 인라인 차단도 없어 실연동 시 **제출해야 거절을 안다**. FS-064-EL-030 은 '길이 상한을 두지 않는다' 고 적어 프론트/백엔드 판정이 갈려 있다 | 1000자 초과 질문 입력 → 경고 0건 · 전송 가능 | gap |
| A11Y-08 | P1 | 결과 표의 행은 whole-row 클릭이 아니라 **첫 셀의 키보드 도달 가능한 링크**로 상세에 간다(`AnswerView.tsx:148-150` — `row.href !== null` 일 때 `<Link>`; 회원 행의 href 는 `provider-members.ts:47`). `useRowNavigation` 을 쓰지 않아 mouse-only 경로가 없다 | 표를 Tab → 각 행 첫 셀에서 회원 상세 링크에 도달한다 | pass |
| A11Y-13 | P1 | 폼이 없어 '첫 invalid 필드 포커스' 대상은 없다. **진입 시 질문 입력에 자동 포커스가 없다** — `setFocus`/`autoFocus` 가 0건이라 관리자는 Tab 을 눌러 입력을 찾아야 하고, TOKEN-02 gap 때문에 **찾았는지도 보이지 않는다.** 후보 선택 후에는 포커스를 입력으로 되돌린다(`Composer.tsx:142`) — 그쪽 계약은 지킨다 | `/ai/chat` 진입 → `document.activeElement` = `<body>`(입력 아님) | gap |
| A11Y-16 | P1 | **이 화면의 최대 강점이자 마지막 한 칸이 빈 항목이다.** 충족: semantic role(combobox/listbox/option — `Composer.tsx:207,182,187`; menu/menuitemradio — `ModePicker.tsx:185,190`), 키보드 조작(↓/↑ 순환 · Enter/Tab 채움 · Escape 닫기 — `Composer.tsx:145-177`), overlay Esc dismiss(`ModePicker.tsx:154-158`, 포커스를 트리거로 되돌린다 `:157`), 프로그램적 라벨(`aria-label` 4종), **비동기 status live-region**(`NewChatPage.tsx:255-261`), 이중 인코딩(비활성 모드는 색만이 아니라 '미연결' 배지 — `ModePicker.tsx:205`), `aria-disabled` 노출(`:192`). **미충족: 가시 focus-visible ring**(P0 TOKEN-02) 과 **menu 의 roving 키보드 조작**(메뉴가 열려도 ↓/↑ 로 항목을 옮길 수 없고 Tab 순회에만 의존한다 — `ModePicker.tsx` 에 `onKeyDown` 이 Escape 외 없다) | `Composer.test.tsx`(12건)가 combobox 계약을 고정한다. 모드 메뉴를 열고 ↓ → **아무 일도 일어나지 않는다** X. 어느 항목에 있는지 링으로 보이지 않는다 X | 부분(→ TOKEN-02) |
| MOTION-07 | P2 | 금지 목록을 어기지 않는다 — 이 화면에 motion 이 0건이라(P0 MOTION-03) focus ring transition · 추가 skeleton motion · 무한 애니메이션 · 대형 entrance 가 모두 부재한다 | `pages/ai` grep: `transition`·`animation` = **0** | pass |
| IA-03 | P1 | nav 잎이라 breadcrumb 요구의 'non-top-level route' 에 해당하지 않는다. `?c=` 는 라우트가 아니다 | — | n-a |
| IA-08 | P1 | footer action bar 규격의 대상(폼)이 아니다. 입력줄의 보내기 버튼은 우측 정렬이고(`Composer.tsx:226-238`, spacer `:228`) 취소 슬롯이 없다 — 대화 화면에 되돌릴 저장이 없기 때문이다 | 보내기가 입력줄 우측 | n-a(문서화) |
| IA-14 | P1 | **반응형 계약이 없다.** `gridTemplateColumns: 'calc(var(--tds-space-10) * 5) minmax(0, 1fr)'`(`NewChatPage.tsx:35`)이 **고정 2열**이라 좁은 폭에서 레일이 본문을 압박한다 — collapse breakpoint 도 미디어 쿼리도 없다(`ai.css` 에 `@media` 0건). 결과 표는 bounded 가로 스크롤이라 이 축은 충족한다(COMP-09) | 375px → 레일이 화면의 절반 이상을 먹고 본문이 뭉개진다 | gap |
| ERP-06 | P1 | 사용자 대상 문구가 존댓말 톤으로 일관된다 — '무엇을 조회할까요?' · '조회하지 못했습니다. 잠시 후 다시 시도해 주세요.'(`NewChatPage.tsx:205`) · '…할 수 없는 요청입니다.'(`answer.ts:101`). 거절 문구가 **무엇을 할 수 있는지**로 이어진다(`capabilityDetail()` — `answer.ts:49-52`) | 거절 3종의 문구가 전부 대안을 제시한다 | pass |
| ERP-08 | P1 | 표의 숫자가 공유 formatter 를 경유한다 — 건수 `formatNumber(outcome.total)`(`AnswerView.tsx:120,163`) · 누적 구매액 `formatNumber(member.totalPurchase)`(`provider-members.ts:45`). 가입일은 픽스처의 `YYYY-MM-DD` 를 그대로 쓴다(변환 없음) | 표의 raw `toString()` = 0건 | pass |
| ERP-12 | P1 | 결과 표에 **CSV/엑셀 내보내기가 없다.** 다만 이 화면은 전체를 스스로 내보내는 대신 **같은 조건이 걸린 원본 목록 화면으로 넘긴다**(`AnswerView.tsx:161-170` · `provider-members.ts:58-66`) — export 는 그 목록 화면(FS-003)이 소유해야 할 기능이라는 판정이다. 단 **옮길 수 있는 조건이 `?tier=` 뿐**이라(같은 주석) 기간·구매 조건으로 좁힌 결과는 목록에서 재현되지 않는다 | `@회원목록 구매한 VIP` → '목록 화면에서 보기' 는 `?tier=vip` 만 갖는다(구매 조건 소실) | 부분(FS-064 §7 #3) |
| EXC-05 | P1 | client timeout 이 없다(`AbortSignal.timeout` grep = **0**). `wait(readDelayMs(), signal)`(`data-source.ts:61,72,104,137`)은 상한이 아니라 픽스처 지연이다. BE-064 §3.4 는 프론트 권고 상한을 **조회 10초 · 질문 15초(모델 연동 후 90초)** 로 못 박았는데 그 값이 코드에 없다 | never-resolving 응답 → '조회 중…' 이 무한 지속 | gap |
| EXC-06 | P1 | **실패의 갈래가 없다.** `HttpError` 는 status 를 지니고(`shared/errors/http-error.ts`) `?status=` 가 그것을 던지지만(`dev.ts:90-93`), 화면은 `isAbort` 외 **전부를 한 문구로 뭉갠다**(`NewChatPage.tsx:203-206` → '조회하지 못했습니다. 잠시 후 다시 시도해 주세요.'). BE-064 §2.1 이 정의한 400·403·404·422·429·504 가 화면에서 구분되지 않는다 — 특히 **422(멘션 도메인 권한 없음)는 실패가 아니라 `kind='guidance'` 여야 한다**(BE-064 §3.5) | `?status=ask:403` · `ask:422` · `ask:429` · `ask:500` → **네 경우 모두 동일한 실패 답변** | gap |
| EXC-11 | P1 | offline 감지가 없다(`navigator.onLine` grep = 앱 전역 0건) | offline 토글 → 배너 없음, 보내기 버튼 경고 없음 | gap |
| EXC-19 | P1 | 세션 만료 시 **작성 중인 질문과 진행 중 대화가 소실된다** — `SessionExpiryWatcher` 가 programmatic navigate 하므로 가드가 없고(FEEDBACK-04 는 이 화면에 n-a), 대화 자체가 메모리에만 있어(§4.3) 재로그인 후 돌아와도 비어 있다 | dirty 입력 상태에서 `?status=ask:401` → 재로그인 후 대화·입력 모두 소실 | gap |
| EXC-20 | P1 | 5xx 에서 **참조 코드를 표시하지 않는다.** `HttpError.reference`/`referenceOf()` 가 존재하지만 이 화면은 쓰지 않는다 — 실패 답변 문구가 고정 1종이다(`NewChatPage.tsx:205`). raw stack 노출은 없다. BE-064 §2 는 `traceId` 를 봉투 필수 필드로 규정한다 | `?status=ask:500` → 답변에 `TDS-…` 참조 코드 없음 | gap |

## 4. quality-bar 가 다루지 않는 축

### 4.1 성능 예산

| 항목 | 예산 | 현재 | 근거 |
|---|---|---|---|
| 대화 목록 조회 p95 | ≤ 300ms | **측정 불가**(백엔드 없음) | BE-064 §3.4 의 서버 상한 3초(504)는 **실패 임계이지 예산이 아니다** |
| 질문 처리 p95 (규칙 기반) | ≤ 500ms | **측정 불가** | 파싱은 순수 함수(`parser.ts`)이고 조회는 497행 배열 1회 순회(`provider-members.ts:72-74`) — 조인·집계가 없다 |
| 질문 처리 p95 (모델 연동 후) | — | 해당 없음 | BE-064 §3.4 가 서버 60초 · 프론트 권고 90초 + **스트리밍 권고**(§7.7 #1). 통째로 기다리면 화면이 멈춘 것처럼 보인다 — 지금은 스트리밍 경로가 **없다**(§5) |
| 첫 렌더(레일 로딩 표시) | ≤ 100ms | 라우트 진입 즉시 | `loading` 이 첫 렌더에서 true(`NewChatPage.tsx:234`) |
| 첫 렌더(본문 로딩 표시) | ≤ 100ms | **표시 자체가 없다** | **P0 STATE-01 gap** — 빈 상태가 그 자리를 차지한다 |
| 표시 행 상한 | **20행** | 20행 | `ROW_LIMIT = 20`(`execute.ts:49`) — 회원 표본 497건에서 조건이 느슨하면 수백 행이 온다. 초과분은 그리지 않고 **전체 건수 + 목록 화면 링크**로 넘긴다(`AnswerView.tsx:161-165`). 말풍선 안에 수백 행을 그리지 않겠다는 의도적 상한이며, 이 값을 늘리면 이 예산이 깨진다 |
| 진입 시 조회 횟수 | 대화 목록 1회(+`?c=` 면 상세 1회) | 동일 | `queries.ts:21,31`. 상세는 `enabled: id !== null`(`:34`)이라 `?c=` 없이는 발사되지 않는다 |
| 전송 후 재조회 횟수 | **2회**(목록 + 그 대화) | 2회 | `queries.ts:53-54` — 두 키만 |
| 전송 요청 수(1회 제출당) | **1** | **1**(픽스처 기준) | 잠금이 아니라 **abort-후-재시작**으로 수렴한다 — **P0 EXC-08**. 실서버에서는 이 등식이 깨진다 |
| 메모리 | 누수 0 | 누수 없음 | 언마운트 abort(`NewChatPage.tsx:148`) · 문서 리스너 정리(`ModePicker.tsx:162-165`). **단 대화 배열은 모듈 변수로 무한 증가한다**(`conversations.ts:41`) — 세션 수명 안에서만 유효(§4.3) |
| 번들 | 화면 전용 코드 최소 | lazy 청크 2개(`App.tsx:162-163`) | 이 화면은 chart·editor 등 무거운 의존을 갖지 않는다. 파서·실행기는 순수 TS 다 |

> **`LATENCY_MS = 400`(`shared/crud/dev.ts:12`)은 개발용 지연이다 — 성능 예산이 아니다.** `?delay=` 로 덮어쓸 수 있다(`data-source.ts:47-50`). 픽스처가 로딩 상태를 화면에서 볼 수 있게 넣은 인위적 대기이며 실제 응답 시간과 무관하다. 위 예산을 이 값으로 검증해서는 안 된다.
>
> **'403ms 동안 조회함'(FS-064-EL-011)은 실측값이다** — `Date.now()` 차이(`data-source.ts:103,112`)를 그대로 표시한다(`NewChatPage.tsx:125-130`). 지금 그 값이 사실상 `LATENCY_MS` 를 반영한다는 뜻이므로, **이 표시를 성능 지표로 읽어서는 안 된다.**

### 4.2 가용성 · 복원력

| 시나리오 | 요구 동작 | 현재 상태 |
|---|---|---|
| 대화 목록 조회 실패 | 인라인 danger 배너 + 재시도 | **미충족** — muted 텍스트 한 줄, 재시도 없음(P0 STATE-02) |
| 대화 상세 조회 실패 | 인라인 danger 배너 + 재시도, 빈 상태와 구분 | **미충족 — 이 화면 최대 결함.** 실패가 **빈 상태로 위장된다**(P0 STATE-01·STATE-02). 관리자는 대화가 사라졌다고 읽는다 |
| 질문 처리 실패(5xx) | 대화 안의 실패 메시지 + 대화 유지 | **충족**(FS-064-EL-016 · `NewChatPage.tsx:301-306`). **대화가 살아남는다** — 실패가 토스트가 아니라 메시지 1건이다. 단 참조 코드·status 갈래 없음(P1 EXC-20·EXC-06) |
| 질문 처리 중 화면 이탈 | abort · 유령 실패 없음 | **충족**(P0 EXC-09, `:148,184,204`) |
| 질문 처리 중 사용자 취소 | 취소 수단 제공 | **미충족** — '조회 중지' 버튼이 없다. abort 는 언마운트·새 전송·'새 채팅' 으로만 발생한다 |
| 열어 둔 대화가 삭제됨 | 알리고 새 대화 경로 제공 | **충족**(FS-064-EL-022 — `:153-154,239-248`). '없음'(`data === null`)과 '실패'(throw)를 어댑터가 갈라 준다(`data-source.ts:75` vs `:119`) |
| 세션 만료 | 재인증 후 원래 경로 복귀 | **부분** — 경로는 복귀하나(P0 EXC-02) **대화 자체가 메모리라 돌아오면 비어 있다**(P1 EXC-19 · §4.3) |
| 렌더 예외 | 셸 생존 + 복구 UI | **충족**(P0 EXC-01). 실행기가 **던지지 않는 설계**(`execute.ts:151-156`)라 도달 경로가 좁다 |
| 네트워크 단절 | offline 배너 + write 게이트 | **미충족**(P1 EXC-11 — 앱 전역) |
| 응답 없음(무한 대기) | client timeout 후 재시도 안내 | **미충족**(P1 EXC-05). BE-064 §3.4 가 권고 상한을 정했으나 코드에 없다 |
| 모델 연동 후 장시간 응답 | 스트리밍 또는 진행 표시 | **미충족 — 지금 판정해 둘 것.** 화면은 완료된 `AgentAnswer` 1건만 받아 그린다(`data-source.ts:129`). 60초 응답을 통째로 기다리면 '조회 중…' 텍스트 하나로 1분을 버틴다(BE-064 §7.7 #1) |
| 도메인 제공자 미배선 | 도메인을 알지만 데이터가 없음을 구분 | **충족** — `kind='not-wired'` 로 실패와 갈린다(`execute.ts:161-166` → `answer.ts:110-116` → `AnswerView.tsx:88-96`). '고장' 과 '아직 연결 안 됨' 이 다른 문장으로 나온다 |

### 4.3 데이터 보존 · 감사

| 항목 | 요구 | 현재 상태 |
|---|---|---|
| 대화 보관 | 다시 열면 그대로 있다 | **없다 — 메모리뿐이다.** `let conversations: readonly Conversation[] = []`(`conversations.ts:41`)이 모듈 변수라 **새로고침하면 전부 사라진다.** localStorage 를 쓰지 않는 것은 판정이다(`:6-8` — '저장됐다는 인상만 주고 다른 기기에서는 없다'). **이 화면(새 채팅)에는 그 고지가 없다** — 형제 화면(FS-065-EL-002)만 배너로 밝힌다. 관리자가 `/ai/chat` 로 직행하면 사실을 모른 채 대화를 쌓는다 |
| 작성 중 질문 | 이탈·만료 시 보존 | **없다.** `draft` 는 컴포넌트 state(`NewChatPage.tsx:136`)이고 '새 채팅' 은 그것을 지운다(`:195`) — 확인 없이 지운다 |
| 답변의 근거 | 숫자가 어디서 왔는가 | **충족(설계로 강제).** `AgentAnswer` 유니온에 '지어낸 문장' 종류가 없고(`answer.ts:24-39`), `kind='result'` 의 행·건수는 provider 가 실제 데이터에서 계산한다(`provider-members.ts:71-76`). 조건 요약도 파싱 결과에서 조립한다(`execute.ts:146-149`). **모델이 붙어도 유지해야 하는 계약**이 코드 머리말(`data-source.ts:13-17`)과 BE-064 §7.1 양쪽에 적혀 있다 |
| 지난 대화의 답변 | 열면 그때 그 답이 보인다 | **부분.** 답변은 메시지에 값으로 저장되므로(`conversations.ts:19`) 세션 안에서는 재현된다. 그러나 픽스처 초기 대화에는 답변을 넣지 않는다(`:34-40` — '꾸며내면 픽스처가 거짓 답변을 갖게 된다'). 데이터가 그 사이 바뀌면 **표는 조회 시점의 스냅숏이라 현재와 다를 수 있다**(FS-064-EL-012 경합 열) |
| 감사 로그 | 에이전트 경유 조회도 열람 기록에 남는다 | **없다.** BE-064 §3.5 가 '경로만 다를 뿐 같은 열람' 이라며 원본 도메인 조회 로그를 요구하지만, 프론트가 픽스처를 직접 읽으므로(`provider-members.ts:72`) 남길 기록이 생기지 않는다 — **서버 연동 시 반드시 함께 붙어야 한다**(BE-064 §7.7 #3) |
| 픽스처 휘발성 | — | `resetConversations()`(`conversations.ts:124-127`)가 테스트용 초기화 수단이다. 백엔드 연결 전까지의 성질이며 예산·요구가 아니다 |

## 5. 미충족(gap) 요약 → 이관

| # | 요구 ID | P | 내용 | 범위 | 이관 |
|---|---|---|---|---|---|
| 1 | **STATE-01 · STATE-02** | **P0** | **본문이 4상태 중 3개를 하나로 뭉갠다.** `?c=` 조회의 first-load 와 read 실패가 **둘 다 빈 상태('무엇을 조회할까요?')로 렌더된다** — `conversation.isFetching`·`isError` 를 화면이 한 번도 읽지 않기 때문이다(`NewChatPage.tsx:150,263`). 레일은 로딩 갈래는 있으나 실패에 `Alert tone="danger"` 와 '다시 시도' 가 없다(`ConversationRail.tsx:134`). **실패가 '대화가 없다' 로 보이는 것이 이 화면 최대 결함이다** | 이 화면 | 프론트 구현 · UI 기획 |
| 2 | **TOKEN-01** | **P0** | 인라인 style 의 `border: 'thin solid …'` **10건**(§2 근거 목록). ai.css 는 깨끗하다. **`token-guard.test.ts` 는 이것을 잡지 못한다** — 값 가드가 `.css` 만 순회한다(`token-guard.test.ts:51,150-160`, 그 한계는 `:12-15` 가 스스로 적었다). **가드를 `.tsx` 인라인 style 로 넓히는 것이 근본 해법**이며, 그 순간 이 화면 밖에서도 같은 위반이 드러날 수 있다 | 이 화면 + **가드 자체**(앱 전역) | 프론트 구현(가드 확장) |
| 3 | **TOKEN-02** | **P0** | 질문 입력이 `outline: 'none'`(`Composer.tsx:46`) 으로 포커스 링을 **제거하고 대체를 주지 않는다.** 모드 트리거·메뉴 항목·후보 option·레일 링크는 UA 기본 링에 맡겨져 토큰 쌍을 쓰지 않는다. 이 화면에서 `tds-ui-focusable` 사용 = **0건**. A11Y-13·A11Y-16 의 잔여 항목과 같은 뿌리다 | 이 화면 | 프론트 구현 |
| 4 | **TOKEN-04** | **P0** | 이 화면의 floating surface 둘(멘션 후보 listbox · 응답 모드 menu)이 **그림자 없이 테두리만으로** 본문 위에 뜬다. quality-bar 가 appliesTo 에 dropdown/popover 를 명시한다. raw `box-shadow` 리터럴은 0건이라 **금지 절은 지키고 적용 절을 놓쳤다** | 이 화면(+ 앱의 다른 팝오버) | 프론트 구현 · DS |
| 5 | **COMP-10** | **P0** | IME 조합 처리 **0건**. ① 레일 검색이 자모마다 필터를 커밋한다 — 공용 `shared/crud/useDebouncedSearch.ts` 가 이미 이 문제를 풀어 뒀는데 쓰지 않는다. ② **질문 입력의 Enter 가 `isComposing` 을 보지 않아 조합 중인 한글 문장이 그대로 전송된다**(`Composer.tsx:173-176`) — 한국 운영자의 실사용 1순위 불만 경로다. **FS-064-EL-033 에 조합 축이 없다 — FS 도 함께 고쳐야 한다** | 이 화면 · FS-064-EL-033 | 프론트 구현 · UI 기획 |
| 6 | **IA-13** | **P0** | 레일 검색 키워드가 URL 이 아니라 컴포넌트 state 에만 있다(`NewChatPage.tsx:135`) — 좁혀 둔 기록 view 를 새로고침하면 풀리고 링크로 공유할 수 없다. **`?c=` 축은 충족한다**(`:133-134,175-179,196-200`) — 이 화면의 주 view state 는 URL 에 있고, 남은 것은 keyword 하나다 | 이 화면 | 프론트 구현 |
| 7 | **EXC-03** | **P0** | ① 보내기 버튼이 `can(write)` 를 보지 않는다(`pages/ai` 의 `useRouteWritePermissions`/`useRouteCan` = **0건**). ② **더 큰 축 — 멘션 도메인의 권한 승계가 없다**: `provider-members.ts:72` 가 회원 픽스처를 권한 검사 없이 읽으므로 `/users/members` read 가 꺼진 운영자도 `@회원목록` 으로 실제 회원 명단을 받는다. **BE-064 §3.5 가 '이 화면이 권한 우회 통로가 될 수 있다' 고 판정한 그 경로가 프론트에서 실재한다** — 서버 연동 시 422 → `kind='guidance'` 로 받는 분기도 함께 필요하다 | 이 화면 · AI 섹션 전체 | 백엔드 명세(BE-064 §3.5) · UI 기획 |
| 8 | **EXC-08** | **P0** | 동기 submit lock·멱등키 없음. 지금은 **abort-후-재시작**(`NewChatPage.tsx:160-162`)이 픽스처 경로에서 요청을 1건으로 수렴시키지만, BE-064-EP-03 은 **비멱등**이며 `Idempotency-Key` 를 요구한다 — 실서버에서는 abort 된 요청이 이미 append 됐을 수 있다. 형제 NFR-015 §5 #4 와 같은 뿌리(공용 폼 계층의 방어가 이 화면에 상속되지 않았다) | 이 화면(+ 앱 전역의 비폼 write) | 프론트 구현 · 백엔드 명세 |
| 9 | EXC-05 · EXC-06 · EXC-20 | P1 | 실패의 갈래 없음 — client timeout 부재(BE-064 §3.4 가 권고 상한을 정했다) · status 분기 부재 · 참조 코드(`traceId`) 미표시. **특히 422 는 실패가 아니라 `kind='guidance'` 여야 한다**(BE-064 §3.5) | 이 화면(+ 앱 전역) | 프론트 구현 · UI 기획 |
| 10 | EXC-11 · EXC-19 | P1 | offline 감지 없음 · 세션 만료 시 대화와 입력이 함께 소실됨 | 앱 전역 · 이 화면 | 프론트 구현 · 백엔드 명세(보관) |
| 11 | A11Y-13 · A11Y-16 | P1 | 진입 시 질문 입력 자동 포커스 없음 · 모드 menu 의 ↓/↑ roving 조작 없음. **가시 포커스 링 부재(#3)와 합쳐지면 키보드 사용자가 위치를 알 수 없다** | 이 화면 | 프론트 구현 |
| 12 | IA-14 | P1 | 고정 2열 그리드(`NewChatPage.tsx:35`)라 좁은 폭에서 레일이 본문을 압박한다. collapse breakpoint 없음 | 이 화면(+ AppShell 전역 gap) | UI 기획 · 프론트 구현 |
| 13 | COMP-12 | P2 | 질문 길이 카운터·인라인 차단 없음. BE-064-EP-03 은 **1–1000자**를 강제하는데 FS-064-EL-030 은 '상한을 두지 않는다' 고 적어 **두 명세가 갈려 있다** — 먼저 판정을 맞춰야 한다 | 이 화면 · FS-064-EL-030 | UI 기획 · 백엔드 명세 |
| 14 | (신규 · quality-bar 밖) | — | **모델 연동 시 스트리밍 부재**(§4.2) · **에이전트 경유 조회의 감사 로그 부재**(§4.3) · **`/ai/chat` 에는 '대화가 보관되지 않는다' 고지가 없다**(형제 화면에만 있다 — §4.3) | 이 화면 · 아키텍처 | BE-064 §7.7 #1·#3 · UI 기획 |

> **§5 ↔ FS-064 §7 ↔ BE-064 §7.7 대조**: #1→(신규, FS 미기재 — FS-064-EL-012 의 로딩/실패 열이 '조회 중에는 렌더하지 않는다' 로만 적혀 실패 표면을 규정하지 않는다) · #2·#3·#4·#6·#11·#12→(신규, 비기능 축이라 FS 미기재) · #5→FS §3 FS-064-EL-033(조합 축 누락 — FS 개정 필요) · #7→BE §3.5 · BE §7.7 #3 · #8→BE §4 EP-03(멱등성 행) · #9→BE §3.4 · §2.1 · #10→FS §7 #1 · BE §7.7 #4 · #13→FS §3 FS-064-EL-030 ↔ BE §4 EP-03 요청 본문(상한 판정 충돌) · #14→BE §7.7 #1·#3 · FS-065 §1.1.

## 6. 측정 도구 · 재현 스위치

**E2E 미실행 — 이 문서의 모든 판정 근거는 코드 대조다.** 아래 스위치는 판정을 **재현**하기 위한 것이며, 이 문서가 그 실행 결과를 주장하지 않는다.

이 화면의 어댑터 scope 는 **`ai`**(`data-source.ts:45`)이고 op 은 **`list` · `detail` · `ask` · `delete` 4개**다(`:62,73,105,138`).

| 스위치 | 효과 | 근거 |
|---|---|---|
| `?delay=<ms>` | 픽스처 지연을 덮어쓴다(기본 `LATENCY_MS=400`). **이 화면에서 실제로 동작한다** — 형제 NFR-015 의 문서형 화면과 갈리는 지점이다 | `data-source.ts:47-50` |
| `?fail=ai:list` | 대화 목록 조회 실패 → 레일 실패 문구(STATE-02 판정용) | `dev.ts:117-124` |
| `?fail=ai:detail` | 대화 상세 조회 실패 → **표면이 없어 빈 상태가 뜬다**(STATE-01·STATE-02 gap 재현) | 동일 |
| `?fail=ai:ask` | 질문 1건 실패 → 대화 안의 실패 메시지, **대화 유지**(FS-064-EL-016) | 동일 |
| `?fail=ai:delete` | 삭제 실패(이 화면에는 삭제 UI 가 없다 — 형제 화면 NFR-065 용) | 동일 |
| `?fail=list` · `?fail=ask` … | scope 없이 op 만 지정 — **다른 화면의 같은 op 도 함께 실패한다** | `dev.ts:122` |
| `?fail=all` | 네 op 모두 실패 | `dev.ts:122` |
| `?empty=list` | 대화 목록이 0건으로 온다 → 레일 '아직 대화가 없습니다.' | `data-source.ts:52-57,64` |
| `?status=<op>:<code>` | 지정 HTTP status 의 `HttpError` 를 던진다. **재현 가능 code: 400·401·403·404·409·412·422·429·500**(`dev.ts:27-37`). 예: `?status=ask:403` | `dev.ts:66-79,90-93` |
| `?status=ai:ask:403` | scope 지정 형태도 `requestedStatus` 의 비교 대상이다(`dev.ts:73` `target !== \`${scope}:${op}\``) — **그러나 아래 주의 참조** | `dev.ts:71-73` |

**주의 — 쓰면 안 되는 것 / 동작하지 않는 것**

| 항목 | 사실 |
|---|---|
| `?status=ai:ask:403` | **파싱되지 않는다.** `dev.ts:71` 이 `entry.split(':')` 결과를 `[target, code]` **2개로만** 구조분해하므로 3세그먼트 입력은 `target='ai'`·`code='ask'` 가 되고 `Number.parseInt('ask')` → NaN 으로 무시된다. `:73` 의 `${scope}:${op}` 비교는 `?status=` 경로에서 **도달 불가능한 죽은 분기**다(형제 NFR-015 §6 이 같은 사실을 기록했다). scope 지정이 필요하면 `?fail=` 쪽을 쓴다 — 그쪽은 `${scope}:${op}` 를 정상 비교한다(`dev.ts:122`) |
| `?empty=detail` | **없다.** `isEmptyRequested` 는 `fetchConversations` 에서만 호출된다(`data-source.ts:64`). 대화 상세의 '없음'(→ FS-064-EL-022)은 스위치가 아니라 **형제 화면에서 실제로 삭제해** 재현한다 |
| `?delay=` 로 STATE-01 판정 | **가능하다** — 다만 이 화면에서는 그 결과가 **빈 상태**이지 로딩 표시가 아니다(§2 STATE-01). '스켈레톤만 보인다' 는 quality-bar 의 acceptanceCheck 를 이 화면은 통과하지 못한다 |
| `?status=ask:401` 의 세션 만료 재현 | 401 처리는 `queryClient` 인터셉터(앱 전역)가 소유한다 — 이 화면에서 확인할 것은 **복귀 경로가 `/ai/chat` 인지**뿐이며, **작성 중이던 대화는 어차피 메모리라 돌아오지 않는다**(§4.3 · P1 EXC-19) |
| 모델 관련 스위치 | **존재하지 않는다.** 언어 모델이 없으므로 지연·스트리밍·토큰 한도를 재현할 스위치가 없다. §4.2 의 '모델 연동 후' 행은 코드 대조가 아니라 **BE-064 §3.4·§7.7 의 계약을 근거로 한 사전 판정**이다 |

**단위 검증**: `pages/ai/**` 아래 **vitest 40건**이 있다 — 파서 17건(`_shared/parser.test.ts`) · Composer a11y 12건(`components/Composer.test.tsx`) · NewChatPage 11건(`NewChatPage.test.tsx`). 이 화면이 덮이는 범위와 덮이지 않는 범위를 갈라 둔다.

| 덮인다 | 덮이지 않는다 |
|---|---|
| 문장 → 질의 파싱(기간 결합·거절 3종) · 조합 후 화면 출력(사용자 예시 질의가 **실제 픽스처 9행**을 돌려주는지 — `NewChatPage.test.tsx:65-80`) · 못 알아들은 요청에 **표를 그리지 않는지**(`:100-123`) · 0행 빈 상태 · live region announce(`:141-151`) · 표 caption(`:153-159`) · combobox 계약 12건 | **§2 의 P0 gap 9건 중 어느 것도 잡지 못한다.** 로딩/실패 상태 분기(STATE-01·02)를 단언하는 테스트가 없고, 토큰·포커스 링(TOKEN-01·02·04)은 값 검사 대상 밖이며(§5 #2), IME 조합(COMP-10)·URL keyword(IA-13)·권한(EXC-03)·중복 제출(EXC-08)을 구동하는 테스트가 없다 |

**E2E**: **이 두 화면의 e2e 스펙은 커밋되지 않았다.** 구현 중 임시 스펙으로 화면을 구동했고 폐기했다 — 따라서 quality-bar 가 요구하는 '콜드 E2E 63건 유지' 에 이 화면 몫은 **0건**이며, 위 gap 9건 중 재현이 가장 쉬운 것들(STATE-01·02 · IA-13)조차 회귀 방어선이 없다. §5 #1 과 함께 이관한다.

## 7. 자기 점검

- [x] P0 30건을 quality-bar 의 지정 순서대로 전수 판정했다 — 빈칸 0건
- [x] §2.1 합계 검산 = 4 + 3 + 14 + 9 = **30** ✓ (차원별 STATE 3 · TOKEN 5 · COMP 1 · FEEDBACK 3 · A11Y 4 · MOTION 3 · IA 5 · EXC 6)
- [x] 모든 `n-a`(14건)에 '이 화면에 그 표면이 없다' 는 사유를 grep 근거와 함께 적었다
- [x] 모든 `pass`(4건)에 `파일:라인` 코드 근거를 적었다
- [x] 모든 `gap`(9건)에 재현 가능한 측정 기준을 적었고 §5 로 이관했다
- [x] 모든 `종속`(3건)에 **이 화면의 어느 표면이 그 계약을 상속하는지**를 못 박았다 — 표면이 없는 요구는 `상속` 이 아니라 `n-a` 로 분류했다
- [x] quality-bar 요구 문구를 복제하지 않고 ID 로만 참조했다
- [x] `?fail=` scope 를 어댑터의 `const SCOPE = 'ai'`(`data-source.ts:45`)에서, op 4종을 `failIfRequested` 호출부에서 직접 확인했다. **`?delay=` 가 이 화면에서 동작함을 근거와 함께 §6 에 적었고, `?status=ai:ask:403` 이 파싱되지 않음도 함께 적었다**
- [x] `LATENCY_MS = 400` 이 개발용 지연이며 성능 예산이 아님을, 그리고 **'403ms 동안 조회함' 표시가 그 값을 반영하므로 성능 지표가 아님**을 §4.1 에 명시했다
- [x] E2E 를 실행하지 않았고, **이 화면의 e2e 스펙이 커밋되지 않았음**을 §6 에 명시했다 — 없는 검증을 있다고 적지 않았다
- [x] **`token-guard.test.ts` 통과를 TOKEN-01 충족 근거로 쓰지 않았다** — 그 가드가 `.css` 만 본다는 사실을 가드 자신의 코드(`:51,150-160`)와 머리말(`:12-15`)로 확인하고 §2·§5 에 적었다
- [x] **이 화면이 거절을 답으로 삼는 설계(FEEDBACK-03 축)를 §1 에 강점으로 먼저 기록했다** — gap 목록이 그 판정을 덮지 않게 했다
- [x] 백엔드·언어 모델 부재를 판정 완화 사유로 쓰지 않았다. 렌더되는 표면은 전부 판정했고, 모델 연동 후에만 성립하는 축(스트리밍·감사 로그)은 §4 에 별도로 적었다
- [x] §5 의 gap 이 FS-064 §7 · BE-064 §7.7 과 어디서 만나고 어디서 **만나지 않는지**(신규 항목)를 대조표에 명시했다
