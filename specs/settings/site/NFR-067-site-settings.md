---
id: NFR-067
functionalSpec: FS-067
backendSpec: BE-067
qualityBar: specs/quality-bar.md
title: "사이트 설정 비기능 명세"
owner: 명세 리뷰
reviewer: 기능 명세
gate: G9
status: draft
version: 1.1
date: 2026-07-18
---

# NFR-067. 사이트 설정 비기능 명세

> **1.1 갱신 요지 (2026-07-18)** — 대상 화면이 워킹 트리에서 전면 재작성됐다. 판정 자체가 뒤집힌 것은 **A11Y-11 `pass` → `gap` 1건**이다: 이전 판은 `FormField` 가 런타임에 `aria-required` 를 주입하는 경로를 근거로 pass 했으나, **재작성된 화면은 `FormField` 를 쓰지 않고 `SettingRow`+`CountedInput` 을 쓰며 required 를 AT 에 노출하는 경로가 0건**이다(요구문의 'required 는 native required/aria-required 로 노출' 절 위반). 나머지 P0 29건은 표면이 그대로이거나 근거 파일:줄만 바뀌었다. **P0 gap 1 → 2**(A11Y-11 · EXC-08). §3 에서는 **ERP-14 가 `pass` → `n-a`** 로 바뀐다(전화번호 필드가 사라져 masked input 표면이 없다). 또한 **파일 업로드라는 새 표면**이 생겼다 — 이전 판이 '이 화면에 없는 표면'으로 명시 제외했던 축이다(§3 머리말 · §5 #12).

## 1. 이 문서의 위치

| 항목 | 내용 |
|---|---|
| 대상 화면 | FS-067 사이트 설정 (`/settings/site`) |
| 상위 기준 정본 | `specs/quality-bar.md` — 9차원 100요구(P0 30건). **이 문서는 그것을 재서술하지 않는다** |
| 이 문서의 역할 | quality-bar 의 각 요구가 **이 화면에서 어떻게 충족되는가 / 무엇을 재현하면 판정되는가** 만 기록한다. 요구 문구는 ID 로만 참조한다 |
| 함께 읽는 문서 | FS-067(요소·예외) · BE-067(계약·보안 판정) · `specs/quality-bar.md`(요구 정본) |
| 갱신 규칙 | quality-bar 가 바뀌면 이 문서의 판정을 다시 매긴다. 이 문서가 quality-bar 를 바꾸지 않는다. gap 은 §5 를 거쳐 이관되며 FS-067 §7 · BE-067 §7.6 과 번호가 일치해야 한다 |
| 판정 근거 | **판정 기준일 2026-07-18. 기준 트리는 커밋이 아니라 워킹 트리다** — 시스템 설정 섹션 재작성이 아직 커밋되지 않아 `HEAD` 해시를 근거로 댈 수 없다. 그래서 이 문서는 **커밋 해시를 인용하지 않고**, 인용한 `파일:줄` 을 판정 시점 워킹 트리에서 전건 확인했다는 사실로 근거를 대신한다. **E2E 미실행 — 판정 근거는 코드 대조다**(§6) |
| 이번 기준 갱신으로 뒤집힌 판정 | **A11Y-11 `pass` → `gap`** (P0) · **ERP-14 `pass` → `n-a`** (P1). 둘 다 **화면 재작성으로 표면이 바뀐 결과**이며 판정 기준이 달라진 것이 아니다. 직전 배치에서 뒤집혔던 MOTION-01/02/03 은 DS 쪽 표면이 그대로라 판정을 유지한다. **P0 gap 1 → 2** |

### 1.1 표기 규약

| 기호 | 뜻 |
|---|---|
| 적용 `직접` | 이 화면(전용 모듈 `pages/settings/site/**` · 섹션 공유 `pages/settings/_shared/**`)의 코드가 충족을 결정 — 판정 책임이 이 문서에 있다 |
| 적용 `상속` | AppShell·DS(`@tds/ui`)·공용 프레임워크가 결정하고 이 화면은 소비자 — **이 화면에 그 표면이 실재할 때만** 적는다 |
| 적용 `N/A` | 표면(appliesTo)이 이 화면에 없다 — **반드시 사유** |
| 판정 `pass` | 코드 근거로 충족 확인 |
| 판정 `gap` | 미충족 확인 — §5 로 이관. **P0 의 gap 은 quality-bar '배치 실패' 사유** |
| 판정 `종속` | `상속` 항목이되 소유 문서의 판정이 아직 확정되지 않은 것 — 소유 문서를 따른다 |

> **`상속` + `gap` 조합에 대하여**: 소유가 DS 라도 **그 상태가 코드로 확정된 경우**(예: Motion 라이브러리 미도입)에는 `종속` 이 아니라 `gap` 으로 적는다. 이 화면에 표면이 실재하는 이상 사용자는 그 결함을 겪기 때문이다. 다만 **해소는 앱 코드로 불가능**하며 이관 대상이 DS 임을 §5 에 명시한다.

### 1.2 화면 성격

**단일 문서 폼(잎 라우트)이다.** 목록이 아니다 — 표·검색·필터·정렬·페이지네이션·행 선택이 **하나도 없다**(`grep -rn "useListState\|useSearchParams\|SearchField\|useDebouncedSearch" pages/settings/` → **0건**). 그래서 목록 계열 요구(STATE-04 · COMP-10 · IA-13 · A11Y-12)는 표면 부재로 N/A 가 된다. 대신 **폼·다이얼로그·동시성 계열**(FEEDBACK-04 · EXC-04 · EXC-08 · EXC-09)이 이 화면의 중심이다.

**1.1 에서 달라진 성격 셋**:
1. **네 개의 하위 섹션으로 나뉜 긴 폼**이 됐다(`SettingSection`/`SettingRow` — `components/SettingLayout.tsx`). 컨트롤이 9개에서 **11개**로 늘고, `<h3>` 섹션 제목이 생겼다(`SettingLayout.tsx:62`).
2. **파일 업로드 표면이 생겼다**(파비콘·대표 이미지·비공개용 이미지 — `useAssetUpload.ts`). 이전 판이 '이 화면에 없는 표면'으로 명시 제외했던 축이다.
3. **미리보기(목업) 표면이 생겼다**(`Previews.tsx`) — 입력값을 되풀이하는 장식이라 `aria-hidden` 이고 캡션만 노출된다(`:122,124,230,232`).

이 화면은 **시크릿을 다루지 않는다**(그 축은 NFR-069·NFR-070 이 다룬다) — 그러나 **위험 설정**(공개 범위 비공개 전환)을 다루므로 확인 다이얼로그·충돌 해소가 실질 안전장치다.

## 2. P0 30건 — 이 화면 적용 판정 (전수)

| 요구 ID | 차원 | 적용 | 이 화면에서의 충족 방식 (코드 근거) | 측정 기준 (재현 절차) | 판정 |
|---|---|---|---|---|---|
| STATE-01 | STATE | 직접 | **충족.** `SiteSettingsPage.tsx:179` 가 `const loading = isFetching && data === undefined` 로 **첫 로딩만** 판정한다 — `isFetching` 직결이 아니다. 그 `loading` 이 `SettingsFormShell.tsx:152` 의 스켈레톤 분기를 지배하므로 **재조회 중에는 이전 폼 값이 유지된다.** 셸이 세 상태를 배타적으로 그린다: 조회 실패 → 배너만(`:125-138`, early return) / 첫 로딩 → 스켈레톤만(`:152-157`) / 그 외 → 폼(`:159`). 0행 empty 는 이 화면에 해당 없음(단일 문서) | `/settings/site` 진입 → 폼 렌더 확인 → `staleTime` 30초 경과 후 재진입(또는 devtools 로 invalidate). **폼이 스켈레톤으로 바뀌지 않고 값이 유지되면 pass.** `?fail=load` → 배너만, 폼 없음 | **pass** |
| STATE-02 | STATE | 직접 | **충족.** `SettingsFormShell.tsx:125-138` 이 조회 실패 시 `<Alert tone="danger">` + '다시 시도'(`onRetry` → `refetch` — `SiteSettingsPage.tsx:318`)를 **폼 대신** 렌더한다. error toast 를 쓰지 않는다 — 이 화면의 `toast` 호출은 성공 2건뿐(`:232` 저장 · `:284` 최신 불러오기). 저장 실패도 토스트가 아니라 카드 배너(`:246` → `:319`). **업로드 실패도 토스트가 아니라 자리별 인라인 오류**다(`useAssetUpload.ts:6-12` 가 그 판정을 계약으로 적는다 · 렌더는 `AssetField.tsx:89-92`) | `/settings/site?fail=load` 진입 → **danger Alert + '다시 시도' 버튼이 뜨고 토스트가 없으면 pass.** `?fail=upload` 로 파일 업로드 → **그 항목 옆 인라인 오류만 뜨면 pass** | **pass** |
| STATE-04 | STATE | N/A | **표면이 없다.** 이 화면에 ① **페이지네이션이 없다** ② **행 선택이 없다** ③ 목록 자체가 없다 — 단일 문서 폼이다(§1.2). 'total 축소 시 page clamp' · '필터/page 변경 시 selection 리셋' 이 걸릴 표면이 존재하지 않는다. 페이지네이션 부재는 이 화면에서 **결함이 아니라 화면 성격**이다(IA-04 도 같은 이유로 N/A) | 목록·선택이 도입되면 이 판정을 다시 매긴다 | **n-a** |
| TOKEN-01 | TOKEN | 직접 | **충족.** `grep -rnE "#[0-9a-fA-F]{3,6}\b\|[0-9]+px\|'(thin\|medium\|thick)'" apps/admin/src/pages/settings/` → **0건**(2026-07-18 재확인, 재작성된 파일 전부 포함). 이 화면의 모든 스타일 객체가 `var(--tds-*)` 만 참조한다. **파생 치수도 토큰 배수로만 표현한다** — 라벨 열 폭 `minmax(0, calc(var(--tds-space-10) * 3))`(`SettingLayout.tsx:16`) · OG 카드 이미지 높이 `calc(var(--tds-space-10) * 2)`(`Previews.tsx:160`) · 탭 목업 폭 `calc(var(--tds-space-10) * 7)`(`:38`). border-width 도 토큰(`--tds-border-width-thin`). ⚠ **픽스처의 인라인 SVG data URI 만 CSS 이름 색을 쓴다**(`data-source.ts:32-53`) — 코드가 이유를 적어 뒀다(`:24-27`: SVG 문자열 안에서는 토큰 CSS 변수가 해석되지 않고 hex 는 린트가 막는다). **픽스처 한정 예외이며 렌더 스타일이 아니다** | 위 grep → **0건이어야 한다.** ESLint/stylelint 0 warning | **pass** |
| TOKEN-02 | TOKEN | 상속 | 이 화면의 포커스 가능 표면은 전부 DS/공유 클래스를 소비한다: `tds-ui-input tds-ui-focusable`(`site/components/CountedInput.tsx:79`) · 힌트 안 링크 `tds-ui-link tds-ui-focusable`(`SiteSettingsPage.tsx:418`) · DS `<Button>`·`<RadioCardGroup>`·`<ToggleSwitch>`·`<FileDropzone>`·`<FileChip>`·`<HelpTip>`. **이 화면이 focus ring 을 직접 선언하지 않는다**(로컬 `:focus-visible` 0건). ※ 이전 판이 근거로 든 `_shared/fields.tsx:74` 는 **이 화면의 경로가 아니게 됐다**(§5 #13) | DS 토큰 문서 판정을 따른다. 이 화면에서는 `:focus-visible` outline 을 선언하는 로컬 CSS 가 0건임만 확인 | **종속** |
| TOKEN-03 | TOKEN | 상속 | easing 토큰 소비 표면: 스켈레톤 펄스(`tds-ui-skeleton` — `SettingsFormShell.tsx:155`) · **Toast enter/exit**(`Toast.css:26-27` enter · `:32-37` exit) · **Modal enter/exit**(`Modal.css:20-21,30-38,58-59`, 같은 recipe) · DS `<Button>`·`<ToggleSwitch>` transition. `component.overlay.{enter,exit}-easing` 을 `Toast`·`Modal` 이 **함께 쓴다**(`tokens/tokens.json` — '오버레이는 한 몸처럼 움직인다'). **이 화면이 animation/transition 을 직접 선언하지 않는다**(`grep -rniE "transition\|animation\|transform" pages/settings/site pages/settings/_shared` → **0건**, 2026-07-18) | tokens codegen · `Toast.css` 판정에 종속 | **종속** |
| TOKEN-04 | TOKEN | 상속 | shadow 토큰 소비 표면: `<Card>`(`SettingsFormShell.tsx:145`) · Modal(확인·충돌 다이얼로그 — `Modal.css:20` `box-shadow: var(--tds-shadow-overlay)`) · Toast. **이 화면이 `box-shadow` 를 직접 선언하지 않는다**(grep 0건) | Card/Modal/Toast 토큰 판정에 종속 | **종속** |
| TOKEN-05 | TOKEN | 상속 | **이 화면에 in-content `<h1>` 이 없다**(`grep -rn "h1" apps/admin/src/pages/settings/` → **0건**, 2026-07-18). 화면 제목은 **AppHeader 가 소유**하며(`AppHeader.tsx:101` `<h1 style={titleStyle}>`) nav 잎 라벨 '사이트 설정'을 렌더한다(FS-067-EL-001). 카드 제목(`CardTitle` — `SettingsFormShell.tsx:146`)은 `<h1>` 이 아니라 카드 시맨틱이다. **재작성으로 `<h3>` 섹션 제목 4개가 새로 생겼다**(`SettingLayout.tsx:62`) — `--tds-typography-title-md-*` 토큰만 참조하며 로컬 타이포 선언이 아니다(`:39-42`). ⚠ **h1 → h3 로 건너뛴다**(h2 가 없다) — 문서 구조 요구는 A11Y 쪽 축이며 이 요구의 대상은 아니다(§5 #14) | AppHeader `titleStyle` 이 `--tds-typography-title-*`(>18px tier + weight 600)를 참조하는지 확인. 이 화면에서는 로컬 title 스타일 선언이 0건임만 확인 | **종속** |
| COMP-10 | COMP | N/A | **표면이 없다.** 이 화면에 **검색 입력이 없다** — `grep -rn "SearchField\|useDebouncedSearch" pages/settings/` → **0건**(2026-07-18). 단일 문서 폼이라 조회할 query 자체가 없다(§1.2). 'IME 조합 중 커밋 금지 + 디바운스 + stale 응답 무효'가 걸릴 자리가 존재하지 않는다. **텍스트 입력은 있지만 서버 query 를 발화하지 않는다** — 폼 값일 뿐이다(미리보기는 순수 렌더다) | 검색 입력이 도입되면 이 판정을 다시 매긴다 | **n-a** |
| FEEDBACK-02 | FEEDBACK | 직접 | **충족.** 이 화면의 파괴적 서버 액션 표면은 **저장 확인 다이얼로그**(FS-067-EL-021)다 — intent 는 `delete` 가 아니라 `update` 이나, **비공개 전환 저장은 사이트를 닫는 파괴적 행위**이며 요구가 정한 계약(강제실패 시 dialog 유지 + retry, 중간닫기 = abort)이 그대로 걸린다. ① **강제실패가 다이얼로그를 유지한다** — `onError` 가 `setSaveError(...)`(`:246`)만 하고 `setPending(null)` 을 하지 않아 다이얼로그가 살아 있고, `error={saveError}`(`:607`)로 그 안에 배너가 뜬다. **재클릭이 곧 재시도**다 ② **중간닫기 = abort** — `cancelSave`(`:266-273`)가 `controllerRef.current?.abort()` + `save.reset()` + `lock.release()` 를 하고, DS 가 busy 중에도 취소를 살려 둔다(`ConfirmDialog.tsx:144` 'busy 중에도 취소는 살아 있다 — 이것이 진행 중 요청의 abort 경로다'). intent→tone/label/icon 매핑과 초기 포커스는 DS 가 소유 | `/settings/site?fail=save` 에서 값을 바꿔 저장 → 확인. **다이얼로그가 열린 채 danger 배너가 뜨고 확인 버튼이 재활성되면 pass.** 저장 중(400ms) '취소' 클릭 → 실패 토스트·배너가 뜨지 않아야 한다 | **pass** |
| FEEDBACK-04 | FEEDBACK | 직접 | **충족.** `SettingsFormShell.tsx:122` 이 `useUnsavedChangesDialog(dirty && !saving, { message: unsavedMessage })` 를 배선한다. `dirty` 는 RHF `formState.isDirty`(`SiteSettingsPage.tsx:144` → `:321`)이고 기준선은 `reset(data.value)`(`:162`)다. 3경로(beforeunload · 앱 내 링크 capture · popstate sentinel)는 훅이 소유한다. **저장 후 통과**: 성공 시 `reset(values)`(`:229`)로 새 기준선이 서서 dirty 가 풀리고 가드가 내려간다. **저장 중에는 가드하지 않는다**(`dirty && !saving`) — 곧 not-dirty 가 되기 때문. **업로드 결과도 dirty 를 만든다**(`:192` `shouldDirty: true`) — 파일만 갈아 끼우고 이탈해도 가드가 뜬다 | 사이트 이름을 고친 뒤 ① 탭 닫기 ② 사이드바 링크 클릭 ③ 브라우저 뒤로 — **세 경로 모두 discard 다이얼로그가 떠야 pass.** 파비콘만 새로 올린 뒤 같은 3경로도 확인. 저장 성공 후 같은 이동은 프롬프트 없이 통과 | **pass** |
| FEEDBACK-06 | FEEDBACK | N/A | **표면이 없다.** 이 화면에 **편집 가능한 폼을 담은 modal 이 없다** — 폼은 modal 이 아니라 라우트 본문의 `<Card>` 로 렌더된다(`SettingsFormShell.tsx:145`). 이 화면의 modal 은 둘 다 **입력 필드가 없는 확인 다이얼로그**다: 저장 확인 `ConfirmDialog`(FS-067-EL-021) · 충돌 `ConflictDialog`(FS-067-EL-024, 본문이 `<p>`·`<ul>`·`<Alert>` 뿐 — `ConflictDialog.tsx:106-132`). 이탈 가드 다이얼로그도 확인 전용이다. **파일 선택도 modal 이 아니다** — 네이티브 파일 picker 다. 'modal 4경로 dirty 가드'가 걸릴 dirty 상태가 modal 안에 존재하지 않는다 — **라우트 레벨 dirty 는 FEEDBACK-04 가 담당한다**. (참고: 같은 섹션의 `CreateApiKeyModal` 은 폼 modal 이라 NFR-069 에서 이 요구가 `직접` 으로 살아난다) | 폼 modal 이 도입되면 이 판정을 다시 매긴다 | **n-a** |
| A11Y-01 | A11Y | 상속 | 이 화면의 toast 표면 2건: 저장 성공 `toast.success('기본 설정을 저장했습니다.')`(`:232`) · 충돌 해소 `toast.success('최신 기본 설정을 불러왔습니다.')`(`:284`). 지속 live region 은 `ToastProvider` 가 소유한다(비-error=polite · error=assertive 2벌) — 이 화면은 주입만 한다. ⚠ **업로드 진행·실패는 toast 가 아니라 `role="alert"` 문단**(`AssetField.tsx:90`)과 무-role 진행 문단(`:95`)이다 — 진행 상태는 AT 에 능동 통지되지 않는다(§5 #12) | ToastProvider 판정에 종속. 이 화면에서는 저장 성공이 announce 되는지만 확인 | **종속** |
| A11Y-02 | A11Y | 상속 | 이 화면의 dialog 표면 3건 모두 `aria-describedby` 가 배선돼 있다: ① **저장 확인** — DS `ConfirmDialog` 가 `useId` 로 message id 를 만들어 `Modal describedBy` 로 넘긴다(`ConfirmDialog.tsx:130,135`) ② **충돌** — `ConflictDialog.tsx:88` `const messageId = useId()` → `:93` `describedBy={messageId}` → `:107` `<p id={messageId}>` (섹션 자체 컴포넌트이나 DS `Modal` 의 계약을 정확히 소비한다) ③ **이탈 가드** — 훅이 `ConfirmDialog` 를 렌더한다. `Modal` 이 `aria-describedby={describedBy}` 를 dialog 노드에 건다 | DS 판정에 종속. 이 화면에서는 충돌 다이얼로그 open 시 본문 문구가 title 과 함께 읽히는지 확인 | **종속** |
| A11Y-11 | A11Y | 직접 | **부분 미충족 — 이 배치에서 `pass` 가 뒤집혔다.** 요구는 세 절이며 **둘은 충족, 하나는 미충족**이다. ① **aria-invalid ↔ describedby 페어링 — 충족.** 이 화면의 `aria-invalid` 는 `CountedInput.tsx:82` 한 곳이고 바로 다음 줄(`:83`)이 `aria-describedby={describedBy}` 를 짝으로 세운다. `describedBy`(`:69-71`)는 **오류가 있으면 `${id}-error`, 없으면 힌트 id 를 쓰고 카운터 id 는 언제나 붙인다** — 그 오류 `<p>` 를 같은 컴포넌트가 같은 id 로 `role="alert"` 와 함께 렌더한다(`:93-97`). 업로드도 같은 규율이다: `AssetField.tsx:61-63` 이 `invalid \|\| busy` 면 `messageId`, 아니면 `hintId` 를 `FileDropzone describedBy` 로 넘기고 `:89-98` 이 그 id 의 문단을 렌더한다 ② **hint 는 valid 일 때만 — 충족**(위 `:69` 삼항) ③ **⚠ required 노출 — 미충족.** 사이트 이름은 스키마상 필수인데(`validation.ts:118-121`) **화면에 `required` 도 `aria-required` 도 0건**이다(`grep -rn "required" pages/settings/site` 히트는 전부 zod 헬퍼 이름). 원인은 구조적이다: 이전 판은 `FormField` 가 `isRequirableChild` → `withAriaRequired` 로 **런타임 주입**하는 경로를 근거로 pass 했으나, **재작성된 화면은 `FormField` 를 전혀 쓰지 않는다**(라벨이 왼쪽 열로 빠져 `SettingRow` 가 대신 그린다 — `CountedInput.tsx:3-6` 이 그 이유를 적는다). 새 경로에는 required 를 AT 로 잇는 코드가 **없다** | `grep -rn "aria-invalid" pages/settings/site` → 각 히트마다 같은 요소에 `aria-describedby` 가 있는지 확인(①). **`grep -rn "aria-required\|required=" pages/settings/site` → 0건이면 ③은 gap.** RTL: 사이트 이름을 비우고 저장 → `input.getAttribute('aria-describedby')` 에 `screen.getByRole('alert').id` 가 포함되는지 assert(①), `aria-required` 가 `null` 인지 확인(③) | **gap** |
| A11Y-12 | A11Y | N/A | **표면이 없다.** 이 화면에 **필터가 없다**(단일 문서 폼 — §1.2). `aria-pressed` 를 쓸 toggle 필터 list item 이 존재하지 않으며, 이 화면 전체에 `aria-current` **0건**. **ToggleSwitch 4개(FS-067-EL-029·038·039·040)와 RadioCardGroup(EL-035)은 필터가 아니라 폼 값**이며 DS 가 각각 `aria-checked` 로 상태를 노출한다(`ToggleSwitch.css:35` 셀렉터가 그것을 증명한다 — 색이 아니라 aria 속성이 상태를 소유한다) — 이 요구의 appliesTo 가 아니다 | 좌측 토글 필터가 도입되면 이 판정을 다시 매긴다 | **n-a** |
| MOTION-01 | MOTION | 상속 | **CSS-only 로 구현돼 있다(라이브러리는 미도입).** Modal 표면이 실재한다(저장 확인 · 충돌 · 이탈 가드 — 3종). backdrop fade + dialog scale 이 실재한다: backdrop enter `Modal.css:20-21` · exit `:30-33` · dialog enter `:58-59`(opacity 0→1 · `scale(0.96)→scale(1)`) · exit `:35-38`. reduced-motion 게이트 `:173-180`. `component.overlay` recipe 소비. **`AnimatePresence` 는 없고**(`packages/ui/src` Motion/framer-motion 소비 **0건**) 요구문의 'exit 완료 후에만 unmount' 를 **네이티브 `onAnimationEnd`** 로 동등 달성한다. **잔여**: 애니메이션되는 닫힘은 Modal 소유 3경로(Esc · 딤 · ×)뿐이고 **footer 버튼은 즉시 언마운트** — **이 화면의 다이얼로그 3종은 footer 가 주 닫기 수단이다**. **라이브러리 부재를 gap 으로 볼지는 DS 소유 문서의 몫** — 이 화면이 애니메이션을 선언하지 않으므로 앱 코드로 결정할 수 없다 | `/settings/site` 에서 저장 확인 다이얼로그를 연다. **backdrop 이 fade in 하고 dialog 가 `scale(0.96)→1` 로 들어오면 enter 는 충족.** Esc 로 닫아 exit 를 관찰하고, **footer '취소' 로 닫으면 exit 없이 즉시 사라지는 것**을 대조한다 | **종속** |
| MOTION-02 | MOTION | 상속 | **충족.** Toast 표면이 실재한다(저장 성공 · 최신 불러오기 — `:232,284`). exit 애니메이션이 실재한다: `.tds-toast--exiting` `Toast.css:32-37`(`tds-toast-out … forwards` + `pointer-events: none`) → `@keyframes tds-toast-out :121-131`(opacity 1→0 · `translateY(0)→translateY(var(--tds-space-3))`). enter `:26-27`/`:109-119`. **요구가 명시한 'exit duration fast~normal · easing accelerate' 를 정확히 충족** — `component.overlay.exit-duration` = `{motion.duration.fast}`(150ms) · `exit-easing` = `{motion.easing.accelerate}`. exit 완료 후 unmount 는 `onAnimationEnd` 대조로 달성. reduced-motion 게이트 `Toast.css:136-141`. queue/ARIA 유지는 `ToastProvider` 가 소유 | 저장 성공 → 토스트 자동소멸 관찰. **opacity fade + 아래로 translate 후 사라지면 pass** | **pass** |
| MOTION-03 | MOTION | 상속 | **충족.** reduced-motion 게이트가 걸려야 할 이 화면의 표면: **`ToggleSwitch` 4개**(FS-067-EL-029·038·039·040) · `RadioCardGroup` · 스켈레톤 펄스 · Toast · Modal · Button. **요구가 명시 지목한 `ToggleSwitch` 의 게이트가 실재한다** — `ToggleSwitch.css:79-84` `@media (prefers-reduced-motion: reduce) { .tds-toggle__track, .tds-toggle__knob { transition: none; } }`. 남아 있는 transition 선언 2건(`:32` `background-color` · `:56` `transform`)을 **둘 다 이 게이트가 끈다** → 손잡이가 즉시 최종 위치로 스냅한다. 근거 주석 `:76-78`: 손잡이 transform 은 **움직임**이라 vestibular 장애에 직접 영향이고, 상태(on/off)는 색·위치·`aria-checked` 로 이미 전달되므로 전환을 없애도 **정보 손실이 0** 이다. **나머지 표면도 각자 게이트를 갖는다** — Modal `Modal.css:173-180` · Toast `Toast.css:136-141` · 스켈레톤 `shared/ui/ui.css`. **이 화면 자신은 transition/animation 을 0건 선언한다**(grep) | OS 를 reduced-motion 으로 두고 `/settings/site` 에서 복사 방지 스위치를 토글. **손잡이가 즉시 점프하면 pass.** `grep -n "prefers-reduced-motion" packages/ui/src/atoms/ToggleSwitch/ToggleSwitch.css` → **`:79` 히트**(2026-07-18 확인) | **pass** |
| IA-01 | IA | 직접 | **충족.** 라우트가 AppShell layout route 아래에 등록된다(`App.tsx:365` `{ path: '/settings/site', element: <SiteSettingsPage />, implemented: true }` — `APP_ROUTES`). **이 화면은 자체 outer frame/sidebar/top bar 를 도입하지 않는다** — 최상위가 평범한 `<div style={pageStyle}>`(`SettingsFormShell.tsx:141`, `flexDirection: column` + gap 뿐)이다. `App.tsx:362-364` 주석이 이 구조를 스스로 밝힌다: '403 게이팅은 이 섹션이 따로 하지 않는다 — AppShell 이 `<Outlet>` 을 RequirePermission 으로 감싸 모든 라우트를 한 번에 덮는다' | `/settings/site` 진입 시 사이드바·AppHeader 가 유지되고, 화면이 자체 nav/header 를 그리지 않는지 확인 | **pass** |
| IA-02 | IA | 직접 | **충족.** `/settings/site` 는 **nav 잎**이다(`nav-config.ts:214` `['사이트 설정', '/settings/site']`) — 하위 라우트가 없다. `findCoveringLeaf('/settings/site')`(`nav-config.ts:278`)가 **자기 자신을 정확히 찾고**, `findNavLabel`(`:306-307`)이 `'사이트 설정'` 을 반환한다. AppHeader 가 그것을 `<h1>` 으로 렌더한다(`AppHeader.tsx:101`). **이 화면은 in-content `<h1>` 을 그리지 않는다** — grep 0건(2026-07-18). 따라서 **`<h1>` 이 정확히 1개이고 title 메커니즘이 단일하다.** 요구의 'sub-route 가 구체 title' 절은 하위 라우트가 없어 발생하지 않는다. ⚠ **카드 제목이 '기본 설정'이라 `<h1>`('사이트 설정')과 다른 이름을 쓴다** — title 메커니즘의 이중이 아니라 **명명 불일치**이며 이 요구의 위반은 아니다(FS-067 §7 #19 로 이관) | `/settings/site` 진입. **AppHeader 의 가시 `<h1>` 이 '사이트 설정'이고 `document.querySelectorAll('h1').length === 1` 이면 pass** | **pass** |
| IA-04 | IA | N/A | **표면이 없다.** 이 화면은 **list 화면이 아니다** — 단일 문서 폼이다(§1.2). 표·결과 count·우상단 목록 action·SelectionBar·Pagination 이 **하나도 없고**, 있어야 할 이유도 없다(문서가 1건이다). 요구의 appliesTo('list 템플릿')가 성립하지 않는다. **이것은 페이지네이션 누락이 아니라 목록 부재다** | 이 라우트에 목록이 도입되면 이 판정을 다시 매긴다 | **n-a** |
| IA-05 | IA | N/A | **표면이 없다.** 이 화면에 **엔티티 create·edit 폼 라우트 쌍이 존재하지 않는다.** `/settings/site` 단일 라우트이며 `/new`·`/:id/edit` 가 없다 — **설정 문서는 생성·삭제되지 않고 편집만 된다**(BE-067 §5 의 404 축: '문서는 항상 존재한다'). '`new` 와 `:id/edit` 가 동일 폼 컴포넌트' 라는 요구 자체가 걸리지 않는다 | 폼 라우트 쌍이 생기면 이 판정을 다시 매긴다 | **n-a** |
| IA-13 | IA | N/A | **표면이 없다.** 이 화면에 **URL 에 직렬화할 list state 가 없다** — 필터·검색·정렬·페이지가 하나도 없다(§1.2). `grep -rn "useListState\|useSearchParams" pages/settings/` → **0건**(2026-07-18). 폼 입력값은 list state 가 아니다(URL 에 넣으면 미저장 설정이 히스토리·리퍼러에 남는다 — 넣지 않는 것이 옳다). 'Back/복사링크가 필터 view 복원' 이 걸릴 상태가 존재하지 않는다. **단, `?fail=`·`?status=` 개발 스위치는 URL 을 읽지만 그것은 list state 가 아니다**(`store.ts:61`) | 필터·검색이 도입되면 이 판정을 다시 매긴다 | **n-a** |
| EXC-01 | EXC | 상속 | 이 화면의 렌더 예외를 받는 경계: AppShell 이 `<Outlet>` 바로 바깥에 두는 `ErrorBoundary`(`AppShell.tsx:18,520-529` + `shared/errors/ErrorBoundary.tsx` · `RouteErrorScreen`). 이 화면은 자체 경계를 두지 않고 그 경계의 **소비자**다. `AppShell.tsx:514` 이 경계의 자리를 밝힌다: '`<Outlet>` 바로 바깥이다. 화면이 던져도 여기서 멈추므로' 사이드바가 산다. 루트 경계도 별도로 있다 | ErrorBoundary 소유 문서 판정에 종속. 이 화면에서는 컴포넌트 강제 throw 시 사이드바가 유지되고 복구 화면이 뜨는지만 확인 | **종속** |
| EXC-02 | EXC | 상속 | 이 화면이 상속하는 두 경로: ① **진입 가드** — `RequireAuth`(`shared/auth/RequireAuth.tsx`)가 세션 부재 시 `/login?returnUrl=<현재경로+쿼리>` 로 `Navigate` ② **세션 중 401** — `queryClient` 의 `QueryCache`/`MutationCache` `onError` → `notifySessionExpired()` → `SessionExpiryWatcher` 가 세션 폐기 후 `reason=session_expired` 로 이동. **이 화면의 조회·저장·업로드 실패가 전부 이 인터셉터를 통과한다** — 화면별 배선이 없다 | auth/session 소유 문서 판정에 종속. 이 화면에서는 `?status=load:401` 로 조회를 401 시켜 `/login?returnUrl=%2Fsettings%2Fsite&reason=session_expired` 로 이동하는지 확인. (미저장 입력 유실은 EXC-19 P1 사안 — §4.2) | **종속** |
| EXC-03 | EXC | 직접 | **충족.** ① **read 게이팅(상속)** — `RequirePermission` 이 AppShell `<Outlet>` 을 감싸(`AppShell.tsx:526-528`) 권한 없는 deep-link 에 `ForbiddenScreen` 을 렌더한다. 리소스는 라우트에서 파생된다(`route-resource.ts:32-35` → `findCoveringLeaf` → `navPageResourceId`(`resources.ts:65-67`) → `page:/settings/site`) ② **write 게이팅(직접)** — `SiteSettingsPage.tsx:130` `const { canUpdate } = useRouteWritePermissions()` → `:322` `canUpdate={canUpdate}` → `SettingsFormShell.tsx:166` `{canUpdate && (…저장 버튼…)}`. **버튼을 disabled 로 두지 않고 렌더 자체를 하지 않는다**(`:165` '눌러 보고 403 을 받는 자리를 만들지 않는다'). 대신 info 배너로 **이유를 말한다**(`:149`). **컨트롤 11개가 전부 비활성**(`SiteSettingsPage.tsx:181` `disabled = saving \|\| loading \|\| !canUpdate`) — 업로드 드롭존·파일 칩도 포함(`AssetField.tsx:73,82`) ③ **강등 reconcile** — `useRouteCan` 이 `usePermissions()` 를 구독하므로 권한 스토어가 바뀌면(다른 탭의 강등 포함) 재렌더돼 **버튼이 그냥 사라진다**(`RequirePermission.tsx:23-25` 가 이를 설계로 선언) | 권한 스토어에서 `page:/settings/site` 의 `update` 를 끄고 `/settings/site` 진입. **저장 버튼·상태 문구가 사라지고 '조회 권한만 있습니다…' info 배너가 뜨며 컨트롤 11개가 전부 비활성이면 pass.** `read` 를 끄면 403 화면(`ForbiddenScreen`)이 뜨는지도 확인. 화면을 연 채 스토어에서 update 를 끄면 버튼이 즉시 사라지는지(강등 reconcile) | **pass** |
| EXC-04 | EXC | 직접 | **충족(핵심 계약) — 다만 'diverge 표시' 절이 지금 거짓말을 한다.** ① **409/412 conflict dialog** — `_shared/store.ts:124-126` 이 `input.expectedRevision !== current.revision` 이면 `SettingsConflictError(current)` 를 던지고, 화면이 `isSettingsConflict(cause)`(`:240`)로 일반 실패와 갈라 `ConflictDialog` 를 세운다(`:613-625`). **3-액션**(최신 불러오기 · 덮어쓰기 · 닫기)이며 `ConflictDialog.tsx:5-10` 이 왜 `ConfirmDialog`(이지선다)가 아닌지 밝힌다 ② **입력 보존** — 다이얼로그가 뜬 동안 폼은 그대로 살아 있다(`ConflictDialog.tsx:11-13`). `setConflict` 만 하고 `reset` 을 하지 않는다(`:241-242`) ③ **ghost saved 없음** — `createRevisionedStore` 는 `map` no-op 이 아니라 클로저 1건을 통째로 교체하므로(`store.ts:128-132`) '없는 대상을 조용히 지나치고 성공' 경로가 **구조적으로 없다**. ⚠ **`createStoreAdapter` 와 다르다** — 그쪽 409 는 '존재 여부' 기반이라 동시 편집이 last-write-wins 지만, 여기는 **revision 토큰 비교**라 둘 다 존재해도 거절된다. 회귀 테스트 7건이 못박는다(`store.test.ts:54-69`: '거절됐으므로 상대의 값이 그대로 살아 있다'). ⚠⚠ **'가능하면 diverge 한 field 를 표시' 절은 구현돼 있으나 결과가 틀리다** — `divergedLabels`(`:300-303`)의 비교기 `sameValue`(`diff.ts:13-20`)가 배열만 내용 비교하고 나머지는 `Object.is` 인데 자산 3필드는 **객체**라 항상 '달라졌다'로 나온다(FS-067 §7 #14). **요구의 필수 절(다이얼로그·입력 보존·유령 저장 없음)은 전부 충족하고 '가능하면(가산)' 절이 오작동하는 형태**라 판정은 pass 로 두되 §5 #10 으로 이관한다 | `/settings/site?fail=conflict` 에서 값을 바꿔 저장 → 확인. **'기본 설정이 이미 변경되었습니다' 다이얼로그가 뜨고 내 입력이 폼에 그대로 있으면 pass.** **사이트 이름만 고쳤는데 목록에 '파비콘·대표 이미지·비공개용 이미지'가 함께 뜨면 §5 #10 의 재현이다.** `store.test.ts` 7건 통과로도 ①③을 판정한다 | **pass** |
| EXC-08 | EXC | 직접 | **부분 미충족.** ① **`submitLockRef` + disable — 충족.** `useSubmitLock()`(`_shared/queries.ts:58-75`)이 `useRef` 동기 잠금을 제공하고 `runSave` 첫머리에서 `if (!lock.acquire()) return`(`:215`)으로 건다. 성공·실패 양쪽에서 `release`(`:226,235`). 버튼도 `disabled={!dirty \|\| saving \|\| loading}`(`SettingsFormShell.tsx:179`). `queries.ts:54-55` 가 왜 disabled 만으로 부족한지 밝힌다 ② **'retry 가 동일 Idempotency-Key' — 미충족.** 이 화면에 멱등키가 **없다**(`grep -rn "Idempotency" pages/settings/site` → **0건**, 2026-07-18). 앱에 선례가 **둘** 있는데도 쓰지 않는다(`members/components/PointsCard.tsx:103,162-173` · **같은 섹션의** `api-keys/ApiKeysPage.tsx:150,185-186`). **완화 요인(중요)**: PUT + `expectedRevision` 이라 응답 유실 후 재시도는 **중복 적용이 아니라 409** 가 된다 — 데이터는 안전하다(BE-067 §7.4). **남는 결함은 UX 다**: 사용자는 자기 저장이 이미 성공한 줄 모르고 재시도했다가 '다른 관리자가 저장했다'는 **거짓 충돌 다이얼로그**를 본다 ③ ⚠ **업로드에는 잠금도 멱등키도 없다** — 같은 자리에 파일을 다시 고르면 요청이 하나 더 나가고 나중 응답이 이긴다(FS-067 §4.1 · BE-067 §7.6 #11) | 저장 확인 다이얼로그에서 확인 버튼을 최대한 빠르게 2회 클릭(또는 네트워크 스로틀). **요청이 1건만 나가면 ①은 pass.** `grep -rn "Idempotency" pages/settings/site` → **0건이면 ②는 gap.** 드롭존에 파일을 연속 2회 떨어뜨려 요청이 2건 나가면 ③의 재현 | **gap** |
| EXC-09 | EXC | 직접 | **충족.** 네 지점이 전부 배선돼 있다. ① **onError** — `if (isAbort(cause) \|\| controller.signal.aborted) return;`(`:237`)로 abort 를 실패로 처리하지 않는다(배너·토스트 없음). 공유 predicate `isAbort`(`shared/async.ts`)를 쓴다 — 로컬 판정을 재발명하지 않는다 ② **onSuccess** — `if (controller.signal.aborted) return;`(`:227`)로 취소된 요청의 성공 콜백이 토스트·reset 을 일으키지 않는다 ③ **mutation.reset** — `cancelSave`(`:269`) · `closeConflict`(`:295`)가 `save.reset()` 을 부른다 ④ **unmount** — `useEffect(() => () => controllerRef.current?.abort(), [])`(`:157`). **업로드도 같은 규율을 독립적으로 갖춘다** — 컨트롤러 배열을 언마운트에서 전건 abort 하고(`useAssetUpload.ts:71-77`) `catch` 에서 abort 를 오류로 치지 않으며(`:125`) `finally` 가 busy 를 정리하되 aborted 면 setState 하지 않는다(`:100`). bulk 표면이 없어 '실패 count 제외' 절은 무관하다 | 저장 중(400ms 창) 확인 다이얼로그의 '취소' 클릭. **error toast 나 실패 배너가 뜨지 않아야 pass.** 저장 성공 토스트도 뜨지 않아야 한다(취소된 요청). 업로드 중 사이드바 링크로 이탈 → 콘솔 경고·오류 0건이어야 한다 | **pass** |

### 2.1 P0 판정 요약

| 판정 | 건수 | 요구 ID |
|---|---|---|
| `pass` | **12** | STATE-01 · STATE-02 · TOKEN-01 · FEEDBACK-02 · FEEDBACK-04 · MOTION-02 · MOTION-03 · IA-01 · IA-02 · EXC-03 · EXC-04 · EXC-09 |
| `종속` | **9** | TOKEN-02 · TOKEN-03 · TOKEN-04 · TOKEN-05 · A11Y-01 · A11Y-02 · MOTION-01 · EXC-01 · EXC-02 |
| `n-a` | **7** | STATE-04 · COMP-10 · FEEDBACK-06 · A11Y-12 · IA-04 · IA-05 · IA-13 |
| `gap` | **2** | **A11Y-11** · EXC-08 |
| **합계** | **30** | 12 + 9 + 7 + 2 = **30** ✓ |

**검산 (P0 30건 전수 · 지정 순서대로 나열해 셈)**

| # | 요구 ID | 판정 | # | 요구 ID | 판정 |
|---|---|---|---|---|---|
| 1 | STATE-01 | pass | 16 | MOTION-01 | 종속 |
| 2 | STATE-02 | pass | 17 | MOTION-02 | pass |
| 3 | STATE-04 | n-a | 18 | MOTION-03 | pass |
| 4 | TOKEN-01 | pass | 19 | IA-01 | pass |
| 5 | TOKEN-02 | 종속 | 20 | IA-02 | pass |
| 6 | TOKEN-03 | 종속 | 21 | IA-04 | n-a |
| 7 | TOKEN-04 | 종속 | 22 | IA-05 | n-a |
| 8 | TOKEN-05 | 종속 | 23 | IA-13 | n-a |
| 9 | COMP-10 | n-a | 24 | EXC-01 | 종속 |
| 10 | FEEDBACK-02 | pass | 25 | EXC-02 | 종속 |
| 11 | FEEDBACK-04 | pass | 26 | EXC-03 | pass |
| 12 | FEEDBACK-06 | n-a | 27 | EXC-04 | pass |
| 13 | A11Y-01 | 종속 | 28 | EXC-08 | **gap** |
| 14 | A11Y-02 | 종속 | 29 | EXC-09 | pass |
| 15 | A11Y-11 | **gap** | 30 | A11Y-12 | n-a |

> 30행 전수 · `pass` 12 + `종속` 9 + `n-a` 7 + `gap` 2 = **30** ✓
>
> **P0 gap 2건 — 이번 기준으로 1건에서 늘었다.** 늘어난 것은 **A11Y-11** 이며, **화면 재작성이 `FormField` 경로를 버리면서 required 를 AT 에 노출하는 코드가 함께 사라진 결과**다. 판정 기준이 엄해진 것이 아니라 **표면이 실제로 후퇴했다** — 이전 판이 pass 근거로 든 `FormField.tsx` 의 `withAriaRequired` 런타임 주입이 이 화면에서는 더 이상 실행되지 않는다.
>
> **나머지 P0 gap 은 EXC-08 의 멱등키 1건**이며, 그마저 `If-Match` 가 데이터 안전을 이미 보장해 **잔여 위험은 UX 다**(BE-067 §7.4). ⚠ **같은 섹션의 API Key 화면은 EXC-08 이 pass 다**(발급에 멱등키가 붙었다 — `api-keys/data-source.ts:110-147` · `api-keys/ApiKeysPage.tsx:150,185-186`) — **선례가 섹션 안에 있는데 이 화면만 안 쓴다.**
>
> **이 화면이 해소한 앱 전역 gap 2건 (기록 유지)**: **EXC-03** — 기존 문서가 '`useRouteWritePermissions` 소비자 앱 전체 0건'으로 gap 판정했으나 이 화면이 소비자다(`SiteSettingsPage.tsx:130`). **EXC-04** — 기존 문서가 '유령 저장 · 토큰 없음'으로 gap 판정했으나 이 섹션은 revision 토큰을 쓴다(`store.ts:124-126`). 두 판정은 **화면별로 다시 매겨야 하며** 앱 전역 결론으로 일반화하면 틀린다.

## 3. 이 화면에 걸리는 P1 · P2 (선별)

> 표면이 실재하는 것만. 이 화면에 없는 표면(목록·검색·필터·페이지네이션·재정렬·CSV·시크릿 등)은 적지 않는다. ⚠ **1.1 에서 '이미지 업로드'가 제외 목록에서 빠졌다** — 이제 실재하는 표면이다. quality-bar 에 파일 업로드 전용 요구 ID 가 별도로 있는지는 이 문서가 확정하지 못했다(§5 #12).

| 요구 ID | P | 이 화면에서의 상태 | 측정 기준 | 판정 |
|---|---|---|---|---|
| STATE-03 | P1 | 재조회 중 이전 폼 값이 유지된다 — `loading = isFetching && data === undefined`(`:179`)라 스켈레톤이 덮지 않는다. 단 `useEffect([data, reset])`(`:160-163`)가 **편집 중 재조회에서도 `reset` 을 돌려** 입력을 덮는다(FS-067 §7 #7) — 이전 '행'이 아니라 **사용자 입력**이 사라지는 결이라 STATE-03 의 취지와 반대 방향으로 위반한다. **업로드해 둔 자산 값도 함께 사라진다** — 파일을 다시 올려야 한다 | 값을 고치는 중 devtools 로 invalidate → 입력이 유지되는지 | **gap** |
| STATE-05 | P1 | **표면 부재.** 단일 문서라 0건 상태가 없다 — 문서는 항상 존재한다(BE-067 §5) | — | **n-a** |
| STATE-06 | P1 | 저장 성공 시 `useSaveSettings.onSuccess` 가 `setQueryData(key, saved)` + `invalidateQueries`(`_shared/queries.ts:45-46`) — 자기 변경이 즉시 보이고 새 revision 이 곧바로 유효하다. `queries.ts:43-44` 가 왜 invalidate 만으로 부족한지 밝힌다 | 저장 후 감사 문구(`AuditNote`)가 갱신되는지 | **pass** |
| COMP-01 | P1 | DS `<Button>`·`<RadioCardGroup>`·`<ToggleSwitch>`·`<Alert>`·`<Card>`·`<Modal>`·`<FileChip>`·`<FileDropzone>`·`<HelpTip>` 를 쓴다. `buttonStyle()`/`tds-ui-btn-*` 손조립 **0건**(grep, 2026-07-18). **다만 저장 버튼이 `loading` prop 대신 라벨을 바꾼다**(`SettingsFormShell.tsx:181` `{saving ? '저장 중…' : '저장'}`) — 요구가 명시로 금지한 '손수 쓴 저장 중…' 이다. `disabled` 와 함께 쓰고 DS Button 의 `aria-busy` 패스스루 경로가 열려 있으나(`ConflictDialog.tsx:100` 은 실제로 `aria-busy={busy}` 를 명시한다) **셸의 저장 버튼에는 `aria-busy` 가 없다** | `grep -rn "buttonStyle(\|tds-ui-btn-" pages/settings/` → 0건. 저장 중 버튼에 `aria-busy="true"` 가 붙는지 | **pass(경미한 예외)** |
| COMP-04 | P1 | 텍스트 입력이 `<input className="tds-ui-input tds-ui-focusable">` + `controlStyle(invalid, disabled)` 관례를 따르되, **이 화면은 섹션 공용 `_shared/fields.tsx` 대신 화면 전용 `CountedInput` 을 쓴다.** `CountedInput.tsx:3-6` 이 이유를 밝힌다(라벨이 왼쪽 열로 빠져 `FormField` 의 '라벨+카운터 한 줄'이 성립하지 않는다) — **정당한 분기이며 복사가 아니다**(입력 2곳이 한 컴포넌트를 공유하고, 업로드 3곳이 `AssetField` 를 공유한다). ⚠ **그 결과 `_shared/fields.tsx` 의 소비자가 앱 전체 0건이 됐다** — 관례가 갈라진 채 죽은 한 벌이 남았다(§5 #13) | 필드 블록이 복사되지 않았는지. `grep -rn "TextInputField" apps/admin/src` → 정의 자신 외 히트가 있는지 | **pass(정리 필요)** |
| COMP-12 | P2 | 길이 제한 필드 3개에 **실시간 카운터**가 있다: 사이트 이름 `N/20`(`:346`) · 설명 `N/100`(`:364`) · **전용 이름 `N/40 byte`**(`:398`). **counting 기준을 정의하라는 절은 부분 충족**이다 — 앞 둘은 `value.length`(UTF-16 code unit), 셋째는 `byteLengthOf`(`marketing/_shared/messaging.ts:282-289`)이고 **단위를 화면에 적어 둔다**('byte'). ⚠ 그러나 **'서버 강제와 일치'는 확정되지 않았다** — `byteLengthOf` 는 진짜 EUC-KR 인코더가 아니라 '코드포인트 > 0x7F 면 2byte' 근사인데 코드는 두 곳에서 EUC-KR 이라고 단언한다(`validation.ts:159` · `SiteSettingsPage.tsx:397`). 이모지·라틴1 에서 서버와 갈린다(BE-067 §7.6 #10). **상한 근접 경고도 없고**, 앞 두 필드는 `maxLength` 가 조용히 자른다 | 20자 근접 시 경고가 뜨는지. `byteLengthOf('🙂')` 가 2 를 돌려주는지(실제 UTF-8 4byte · EUC-KR 표현 불가) | **gap** |
| FEEDBACK-01 | P1 | 배치가 규칙과 일치한다: read 실패 = 인라인 Alert(`SettingsFormShell.tsx:128`) · write 성공 = toast(`:232`) · write 실패 = 카드/다이얼로그 배너(`:319,607`) · **업로드 실패 = 그 항목 옆 인라인 오류**(`AssetField.tsx:89-92`). write 실패가 toast 가 아닌 것은 **폼 맥락**(입력을 보존한 채 그 자리에서 재시도)이라 `FormServerError` 와 같은 결이며 이탈로 보지 않는다 | 강제 실패 저장이 배너로, 성공이 toast 로, 업로드 실패가 인라인으로 뜨는지 | **pass** |
| FEEDBACK-03 | P1 | 저장 성공(toast) · 실패(배너) 양 경로가 배선돼 있다(`:225-247`). **no-op 클릭이 없다** — 저장 버튼은 `!dirty` 면 비활성이고, 그 이유를 문구가 말한다('변경 사항이 없습니다.' — `SettingsFormShell.tsx:173`). **업로드도 침묵 0** — 5경로 전부 말이 되어 나온다(`useAssetUpload.ts:6-12`) | `?fail=save` · `?fail=upload` 로 각각 가시 실패가 나오는지 | **pass** |
| FEEDBACK-05 | P1 | 파괴적 저장(비공개 전환)의 확인 문구가 **결과를 말한다** — '저장하는 즉시 관리자를 제외한 방문자는 사이트에 접속할 수 없습니다'(`:118`). '저장할까요?'만 묻지 않는다. 전환 방향까지 3분기(`saveConfirmMessage` — `:116-124`). 저장 **전에** warning 배너도 함께 뜬다(`:326-333`) | 확인 문구가 결과를 명시하는지 | **pass** |
| A11Y-13 | P1 | **폼 진입 시 첫 필드 자동 포커스가 없고, 검증 실패 시 첫 오류 필드로 포커스가 이동하지 않는다** — `handleSubmit(onValid)`(`:334`)에 `onInvalid` 콜백이 없어 `setFocus` 경로가 없다. `useCrudForm` 의 `onInvalid`/`setFocus`(`shared/crud/useCrudForm.ts:165,198,254,268`)를 상속하지 못했다. (같은 섹션의 `CreateApiKeyModal` 은 `initialFocusRef` 로 첫 필드 포커스를 구현한다 — `components/CreateApiKeyModal.tsx:181`. 이 화면만 빠졌다) | 사이트 이름을 비운 채 저장 → activeElement 가 사이트 이름 입력인지 | **gap** |
| A11Y-15 | P1 | 충돌 다이얼로그의 액션 이름이 서로 구분된다('최신 내용 불러오기' / '내 변경으로 덮어쓰기') — 헤더 ×(`aria-label='닫기'`)와 겹치지 않는다. `ConflictDialog.tsx:9-10` 이 '파괴적 선택일수록 라벨이 결과를 말해야 한다'를 근거로 남긴다. **업로드 3자리의 드롭존도 접근 이름이 서로 다르다**(`label` 이 '파비콘'·'대표 이미지'·'비공개용 이미지' — `SiteSettingsPage.tsx:429,462,512`) | 다이얼로그·폼 내 같은 접근 이름의 컨트롤이 둘 이상인지 | **pass** |
| A11Y-16 | P1 | ToggleSwitch 의 선택 상태가 **색이 아니라 `aria-checked` 로 인코딩**된다 — `ToggleSwitch.css:35,59,72` 의 셀렉터가 전부 `[aria-checked='true']` 를 근거로 삼는다. 나머지 표면도 계약을 만족한다: 오류 `role="alert"`(`CountedInput.tsx:94` · `AssetField.tsx:90`) · `aria-busy` 스켈레톤(`SettingsFormShell.tsx:153`) · 비공개용 이미지의 잠금이 **색만이 아니라 문구로도 전달된다**(`SiteSettingsPage.tsx:526-531`) · 미리보기 목업은 `aria-hidden` 이고 `<figcaption>` 이 이름을 준다(`Previews.tsx:122,124,230,232`) | 스위치가 `aria-checked` 를 노출하는지. 잠긴 필드의 이유가 텍스트로도 있는지 | **pass** |
| ERP-06 | P1 | 사용자 대상 문자열이 존댓말로 일관되고 시각이 `shared/format`(`formatDateTime`·`formatRelativeOrDate`)을 경유한다(`AuditNote.tsx:31-32` · `diff.ts:43-47`). **인라인 포맷 0건** — `diff.ts:42` 가 'ERP-08: 인라인 포맷 금지'를 근거로 남긴다. 파일 용량 표기도 DS `FileChip` 이 소유한다(화면이 손으로 계산하지 않는다) | 인라인 `toString()`/`toLocaleDateString` 이 0건인지 | **pass** |
| ERP-08 | P1 | 감사 시각이 `formatAuditAt`(`diff.ts:43-47`) → `formatDateTime`, 상대 시각이 `formatRelativeOrDate`(`AuditNote.tsx:32`)를 경유한다. **둘 다 `Number.isNaN(parsed.getTime())` 가드가 있다**(`diff.ts:45,52`) — 깨진 ISO 면 원본을 그대로 보인다. 카운터는 `String(n)` 이나 20/100/40 상한이라 천 단위가 발생하지 않는다 | 셀의 raw numeric toString 이 없는지 | **pass** |
| ERP-13 | P1 | **이 화면의 사용자 대상 문자열에 리터럴 조사 폴백이 0건이다** — `grep -rn "을(를)\|이(가)\|은(는)\|(으)로" pages/settings/` 히트 2건은 **둘 다 `_shared/validation.ts:4-5` 의 주석**이고 렌더되지 않는다(2026-07-18 재확인). `_shared/validation.ts:3-9` 가 근거를 남긴다: `shared/crud` 의 `requiredText` 는 문구를 **조립**해 '사이트명을(를) 입력하세요'가 그대로 렌더되므로 쓰지 않고, **이 섹션의 라벨은 전부 작성 시점 확정 리터럴**이라 문구를 통째로 받는다. 그래서 `'사이트 이름을 입력하세요.'`(`site/validation.ts:119`)처럼 **옳은 조사가 손으로 박혀 있다.** ⚠ `_shared/validation.ts:11-12` 가 '조사 헬퍼가 **아직 없다**'고 적으나 **`shared/format.ts:267+` 에 이미 승격돼 있다** — 낡은 주석(§5 #7) | 사용자 대상 문자열의 `이(가)`/`을(를)`/`은(는)`/`(으)로` grep = 0 | **pass** |
| ERP-14 | P1 | **표면 부재 — 이 배치에서 `pass` 가 `n-a` 로 바뀌었다.** 이전 판은 대표 전화번호의 blur 정규화(`normalizePhone`)를 근거로 pass 했으나 **전화번호·이메일 필드가 재작성에서 삭제**됐다. 이 화면에 사업자등록번호·전화번호·금액·날짜 입력이 **하나도 없다** — masked/validated input primitive 가 걸릴 자리가 없다. ⚠ `normalizePhone`(`_shared/validation.ts:58-74`)은 코드에 남아 있으나 **소비자 0건**이다(§5 #13) | 한국형 ERP 타입 입력이 도입되면 이 판정을 다시 매긴다 | **n-a** |
| EXC-05 | P1 | `AbortSignal.timeout` 이 **앱 전역 0건**(grep) — 이 화면도 상한이 없다. abort 는 언마운트·확인 취소·충돌 닫기·업로드 언마운트에서만 발생한다. **업로드는 특히 상한이 필요한 자리다**(5MB) | never-resolving fixture 가 ceiling 에서 abort 되는지 | **gap(앱 전역)** |
| EXC-06 | P1 | **이 화면이 status 로 분기하지 않는다.** 조회 실패가 401/403/404/500 을 같은 문구로(`SettingsFormShell.tsx:130`), 저장 실패가 403/422/500 을 같은 배너로(`:246`), **업로드 실패가 413/415/429/500 을 같은 인라인 문구로**(`useAssetUpload.ts:23,126`) 뭉갠다. 근본 원인은 `createRevisionedStore`·`uploadSiteAsset` 이 **`HttpError`(status 보유)를 던지지 않는 것** — `failIfRequested` 의 generic Error 와 `SettingsConflictError` 뿐이다. **409 만 유일하게 갈린다**(`isSettingsConflict`). ⚠ 업로드는 '파일이 너무 큽니다' 와 '형식이 맞지 않습니다' 를 구분해야 사용자가 고칠 수 있는데 지금은 둘 다 '잠시 후 다시 시도해 주세요' 다 | `?status=load:404` 와 `?status=load:500` 이 다른 surface 를 그리는지 | **gap** |
| EXC-07 | P1 | 서버 422 의 `error.fields` 를 RHF `setError` 로 필드에 꽂는 경로가 없다 — `useCrudForm` 미사용이라 그 훅의 422 처리(`shared/crud/useCrudForm.ts:190-205`)를 상속하지 못했다. 모든 저장 실패가 form-level 배너로 간다(BE-067 §7.6 #2). (같은 섹션의 `CreateApiKeyModal` 은 중복 이름 오류를 `setError('name', …)` 로 필드에 꽂는다 — `:151`. 패턴은 섹션 안에 이미 있다) | field path 있는 422 fixture 가 인라인 error + 포커스를 내는지 | **gap** |
| EXC-11 | P1 | `navigator.onLine` 이 **앱 전역 0건**(grep) — offline 배너·write 게이팅·복귀 refetch 가 없다 | offline 토글이 배너를 내는지 | **gap(앱 전역)** |
| EXC-12 | P1 | **표면 부재에 가깝다.** 단일 문서라 '찾을 수 없음'이 정상 경로에 없다(BE-067 §5 404 축: 문서는 항상 존재한다). 다만 **서버가 시딩하지 않아 404 를 내면 화면에 그 분기가 없어** generic 배너로 뭉개진다(BE-067 §7.6 #5). **자산 404 도 같다** — 참조하는 이미지가 삭제되면 미리보기만 깨지고 화면은 아무 말도 하지 않는다 | 없는 문서로 진입 → 전용 문구가 뜨는지. 죽은 자산 url 로 진입 → 화면이 그 사실을 말하는지 | **gap(잠재)** |
| EXC-14 | P1 | **낙관적 업데이트가 이 화면에 없다** — 저장이 전부 비관적(응답 후 `reset` + `setQueryData`)이다. `onMutate`/롤백 0건. 업로드도 성공 응답이 와야 폼 값을 바꾼다(`useAssetUpload.ts:117-119`). 요구는 'optimism 을 쓸 때 rollback 을 페어링하라'이므로 **위반 표면이 없다** | 이 화면에 `onMutate` 가 0건인지 | **pass** |
| EXC-19 | P1 | 401 감지·리다이렉트는 구현됐으나(`queryClient` + `RequireAuth`) **미저장 입력이 유실된다** — 프로그램적 이동이라 이탈 가드(FS-067-EL-025)가 발화하지 않는다. **업로드해 둔 자산도 함께 사라진다** | 세션 만료 중 입력 → 재로그인 후 복원되는지 | **gap(앱 전역)** |
| EXC-20 | P1 | 5xx 실패 시 **복사 가능한 error reference 를 보여주지 않는다** — `HttpError.reference`(`shared/errors/http-error.ts:54,66` · `createErrorReference()` `:106-110` · `referenceOf()` `:151-152`)가 존재하고 `useCrudForm` 은 `errorReference` 로 노출하는데, 이 화면은 고정 문구(`:246`)만 쓴다. raw stack 노출은 없다(그 절은 충족) | 강제 500 이 복사 가능한 reference code 를 보이는지 | **gap** |

## 4. quality-bar 가 다루지 않는 축

### 4.1 성능 예산

| 축 | 예산 | 현재 상태 (근거) |
|---|---|---|
| 조회 응답 p95 | ≤ 300ms (BE-067 §2 서버 상한 5초 → 504) | **측정 불가 — 백엔드 없음.** `LATENCY_MS = 400`(`shared/crud/dev.ts:12`)은 **개발용 지연 상수이며 성능 예산이 아니다** — 로딩 상태를 화면에서 볼 수 있게 하려고 넣은 인위적 `wait()` 다(`_shared/store.ts:109,115`). 실제 네트워크 0건 |
| 저장 응답 p95 | ≤ 500ms | 위와 동일 |
| **업로드 응답 p95** | **별도 예산 — 공통 5초 상한을 적용하지 않는다** | **미정.** 5MB 파일이 5초 안에 끝난다고 가정할 수 없다(BE-067 §4 EP-03 · §7.6 #11). 픽스처는 `LATENCY_MS` 400ms 고정이라 **실제 업로드의 체감을 전혀 재현하지 못한다** — 진행률 UI 도 없고 '올리는 중입니다…' 한 줄뿐이다(`AssetField.tsx:96`) |
| 첫 렌더 | ≤ 1.0s (LCP) | 미측정. **문서 1건 · 컨트롤 11개 고정**이라 데이터 규모에 비례하지 않는다 — 이 화면의 렌더 비용은 상수다. ⚠ 다만 **미리보기가 자산 3건을 디코드**하므로 큰 이미지에서는 상수가 커진다(픽스처는 인라인 SVG 라 무시할 수준) |
| 재조회 횟수 | 진입당 1회. `staleTime` 30초 내 재진입은 0회. 창 포커스 재조회 0회 | 전역 `queryClient` 가 `staleTime: 30_000`(`shared/query/queryClient.ts:70`) · `retry: false`(`:82`) · `refetchOnWindowFocus: false`(`:90`)를 명시하고 **이 화면이 재정의하지 않는다**(`_shared/queries.ts:15-19` 는 `queryKey`·`queryFn` 만 준다) — **충족** |
| 저장 요청 크기 | ≤ 4KB | **조건부 충족** — 12필드이며 텍스트는 20/100/40byte 상한이 걸려 있다. 목록·이력을 싣지 않는다. ⚠ **자산 3필드의 `url` 에 길이 상한이 없다**(BE-067 §7.6 #4) — 픽스처는 data URI 를 쓰므로(`data-source.ts:32-53`) **지금은 실제로 URL 3개가 요청의 대부분을 차지한다.** 백엔드가 붙어 짧은 자산 주소가 오면 사라지는 문제지만, **상한이 계약에 없다는 사실은 남는다** |
| **업로드 요청 크기** | ≤ 5MB(대표·비공개용) / ≤ 100KB(파비콘) | **프론트가 먼저 거른다**(`validation.ts:58,70`) — 다만 **서버가 다시 걸어야 한다**(BE-067 §4 EP-03) |
| 메모리 | 문서 1건 + 자산 3건 | 상수. ⚠ **`URL.createObjectURL` 핸들이 회수되지 않는다**(FS-067 §7 #16) — 세션 중 자산을 여러 번 갈아 끼우면 핸들이 누적된다. **픽스처 한정** |
| 번들 | 이 화면 고유 코드 ≤ 15KB(gzip) | 미측정. 재작성으로 파일이 6개 늘었다(`useAssetUpload` · `components/` 4종). 외부 의존 0(전부 공용 모듈·DS·zod/mini) |
| 검증 비용 | 제출당 1회 | zod `safeParse` 1회. **입력마다 돌지 않는다**(`mode` 미지정 = RHF 기본 `onSubmit`) — 단 `setValue(..., { shouldValidate: true })`(전용 이름 스위치·공개 범위·업로드 성공)는 그 시점에 1회 돈다. **바이트 카운터는 렌더마다 문자열을 순회한다**(`byteLengthOf` — `SiteSettingsPage.tsx:307`) — 40byte 상한이라 비용은 상수에 가깝다 |

### 4.2 가용성 · 복원력

| 시나리오 | 요구 동작 | 현재 상태 |
|---|---|---|
| 조회 실패 | 인라인 danger Alert + 다시 시도 | **충족**(`SettingsFormShell.tsx:125-138`). 폼 대신 배너 — STATE-02 pass |
| 저장 실패(5xx) | 배너 + 입력 보존 + 재시도 + reference code | **부분 충족** — 배너·입력 보존·재시도(다이얼로그 유지)는 되나 **reference 없음**(EXC-20 gap) |
| **업로드 실패** | 그 자리 인라인 오류 + 재선택 가능 + 다른 자리에 영향 없음 | **충족** — 자리별 오류·busy 상태(`useAssetUpload.ts:46-48,62-67`), 5경로 전부 문구가 나온다(`:6-12`). ⚠ **413/415 를 구분하지 못한다**(EXC-06) |
| 저장 중 이탈 | abort · 실패 통지 없음 | **충족**(EXC-09 pass). 업로드도 언마운트에서 전건 abort(`useAssetUpload.ts:71-77`) |
| **동시 편집(두 관리자)** | 나중 저장이 앞선 변경을 덮지 않는다 | **충족 — 이 화면의 핵심 강점.** revision 토큰 불일치 → 409 → 충돌 다이얼로그(3-액션) + 입력 보존(EXC-04 pass). `store.test.ts` 7건이 회귀를 막는다. ⚠ **'무엇이 달라졌는지'는 틀리게 말한다**(§5 #10) |
| 저장 응답 유실 후 재시도 | 중복 적용 없음 + 사용자가 성공을 안다 | **부분 충족** — `If-Match` 가 중복 적용을 막으나(데이터 안전), 사용자는 **거짓 충돌 다이얼로그**를 본다(EXC-08 gap · BE-067 §7.4) |
| **업로드 응답 유실 후 재시도** | 중복 자산 없음 | **미충족** — 멱등키도 잠금도 없다. 자산이 두 건 생기고 하나는 고아가 된다(BE-067 §7.6 #11) |
| 세션 만료 중 편집 | 재인증 후 입력 복원 | **미충족** — 401 리다이렉트가 미저장 입력을 버린다(EXC-19 · FS-067 §7 #11) |
| 네트워크 단절 | offline 배너 + write 게이팅 | **미충족**(EXC-11, 앱 전역) |
| 무응답 백엔드 | client timeout → 재시도 가능 실패 | **미충족**(EXC-05, 앱 전역). **업로드에서 특히 아프다** |
| 렌더 예외 | 사이드바 유지 + 복구 화면 | **충족(상속)** — AppShell `<Outlet>` 바깥 `ErrorBoundary`(`AppShell.tsx:520-529`) |
| 편집 중 재조회 | 입력이 유지된다 | **미충족** — `useEffect([data, reset])`(`:160-163`)가 입력을 덮는다. **업로드한 자산까지 사라진다**(STATE-03 gap · FS-067 §7 #7) |

### 4.3 안전성 — 위험 설정의 취급

사이트 설정은 **켜는 순간 사이트가 닫히는 값**(공개 범위 = 비공개)과 **방문자 브라우저 동작을 바꾸는 값**(복사 방지 · 모바일 확대 허용 · 로그인 상태 유지)을 담는다. quality-bar 는 이 축을 다루지 않으므로 여기서 정한다.

| 요구 | 현재 상태 |
|---|---|
| 위험 값의 결과를 **저장 전에** 알린다 | **충족** — `visibility === 'private'` 이면 즉시 warning 경고(`:326-333`). 드래프트 기준이라 저장 전에 뜬다. ⚠ **tone 이 `danger` 가 아니라 `warning`** 이다 — 사이트가 닫히는 값이므로 위계가 적정한지 재검토 여지가 있다 |
| 확인 문구가 **결과를 말한다**(‘저장할까요?’만 묻지 않는다) | **충족** — `saveConfirmMessage`(`:116-124`)가 전환 방향별 3분기로 결과를 명시 |
| 위험 값이 **불완전한 상태로 저장되지 않는다** | **부분 충족** — 비공개 + 반쯤 올라간 이미지는 스키마가 거부한다(`validation.ts:172-183` · 테스트 `site.test.ts:155-160`). 그러나 **비공개 + 이미지 없음은 통과**한다(`site.test.ts:162-166`) — 기본 비공개 페이지가 대신 뜬다는 전제이며, **그 기본 페이지의 존재는 이 계약 밖이다**(BE-067 §7.6 #6). 이전 판의 '유지보수 모드 + 빈 안내문 거부' 같은 **강한 완결성 규칙은 사라졌다** |
| 위험 값의 **집행이 보장된다** | **미정 — 이 계약 밖이다.** 저장은 되는데 사이트 렌더러가 읽지 않으면 이 화면은 거짓말이 된다(BE-067 §7.6 #6). '관리자만 접근할 수 있어요'(EL-035 선택지 설명) · '모바일 확대 방지'(EL-039 힌트) · 비공개 페이지 렌더 규칙(EL-037 콜아웃) 세 약속 모두 집행 주체가 보장해야 한다. **EL-039 힌트는 그 한계를 스스로 인정한다**('브라우저 설정에 따라 동작하지 않을 수 있습니다') |
| 위험 값의 **변경 이력**이 남는다 | **부분 — 마지막 1건만.** `AuditNote` 가 '마지막 변경: 누가 · 언제'를 보인다. '지난주에 왜 비공개였나'는 답할 수 없다(BE-067 §7.6 #8) |
| 감사 주체가 **위조 불가**하다 | **미충족(픽스처)** — `updatedBy` 가 하드코딩 `'김운영'`(`_shared/store.ts:84`). 서버가 세션에서 찍어야 한다(BE-067 §7.3) — **심이 이미 그렇게 선언한다**(`store.ts:83`) |
| **방문자에게 렌더되는 값이 안전하다** | **미정 — 서버 몫이다.** `siteName`·`siteDescription`·`messagingName` 은 방문자 페이지의 `<title>`·`<meta>`·OG 태그·문자 본문으로 흘러가고, **자산 3필드의 `url` 은 스키마에 스킴 검사조차 없다**(`validation.ts:87-93`). 어드민 화면 자체는 안전하다(미리보기가 텍스트 노드·`<img src>` 로만 그린다) — **위험은 소비자 쪽에 있고 정제는 저장 시 서버가 한다**(BE-067 §7.1) |
| **업로드 파일이 안전하다** | **미충족(프론트) · 미정(서버)** — 프론트는 **파일명 확장자만** 본다(`validation.ts:48-51`). `payload.svg` → `payload.png` 로 이름만 바꾸면 통과한다. SVG 는 화이트리스트 밖이지만(`:64`) 그 화이트리스트가 확장자에만 걸려 있어 무력하다. **서버가 매직 넘버로 재판정해야 한다**(BE-067 §4 EP-03) |

## 5. 미충족(gap) 요약 → 이관

| # | 요구 ID | P | 내용 | 범위 | 이관 |
|---|---|---|---|---|---|
| 1 | MOTION-01 | P0 → **종속** | 오버레이 모션은 CSS-only 로 구현돼 있다(`Modal.css:20-21,30-38,58-59` + reduced-motion 게이트 `:173-180`) — **MOTION-02·03 은 pass** 다. **라이브러리는 미도입**(`packages/ui/src` Motion/AnimatePresence 0건)이나 'exit 후 unmount' 는 `onAnimationEnd` 로 동등 달성했다. **잔여**: footer 버튼 경로는 즉시 언마운트이고 **이 화면의 다이얼로그 3종은 footer 가 주 닫기 수단**이다. **라이브러리 부재/footer 경로를 gap 으로 볼지는 DS 소유 문서가 정한다** | **`packages/ui`(DS)** | **프론트 리팩터 / DS (판정 대기)** |
| 2 | EXC-08 | P0 | 저장에 **멱등키 없음**(`grep Idempotency pages/settings/site` = 0건). 동기 잠금(`useSubmitLock`)은 있어 연타는 막힌다. **`If-Match` 가 중복 적용을 막아 데이터는 안전** — 잔여 위험은 '자기 저장에 대해 거짓 충돌 다이얼로그를 보는' UX. **선례가 둘**(`members/components/PointsCard.tsx:103,162-173` · `api-keys/ApiKeysPage.tsx:150,185-186`). ⚠ **업로드는 잠금조차 없다** — #12 참조 | 이 화면 + BE 계약 | UI 기획 · 백엔드 명세 (BE-067 §7.4 · FS-067 §7 #4) |
| 3 | STATE-03 | P1 | `useEffect([data, reset])`(`:160-163`)가 **편집 중 재조회에서도 `reset`** 을 돌려 입력을 덮는다. **업로드해 둔 자산까지 사라져 파일을 다시 올려야 한다** | 이 화면(설정 3화면 공통 패턴) | UI 기획 쪽 변경 요청 (FS-067 §7 #7) |
| 4 | EXC-06 · EXC-12 | P1 | 조회·저장·**업로드** 실패가 status 를 구분하지 않는다. 근본 원인은 `createRevisionedStore`·`uploadSiteAsset` 이 **`HttpError`(status 보유)를 던지지 않는 것** — 409 만 `SettingsConflictError` 로 갈린다. 업로드는 **413(용량)과 415(형식)를 구분해야 사용자가 고칠 수 있는데** 한 문구다 | 이 화면 + `_shared/store.ts` + 어댑터 | UI 기획 · 백엔드 명세 (FS-067 §7 #2) |
| 5 | EXC-07 · EXC-20 | P1 | 422 `error.fields` → RHF `setError` 매핑 없음 · 5xx reference code 미표시(`http-error.ts:106-110` 에 `createErrorReference` 가 있는데도). 패턴은 섹션 안에 이미 있다(`CreateApiKeyModal.tsx:151` 의 `setError('name', …)`) | 이 화면 | UI 기획 (BE-067 §7.6 #2) |
| 6 | A11Y-13 | P1 | `handleSubmit(onValid)`(`:334`)에 **`onInvalid` 가 없어** 검증 실패 시 첫 오류 필드로 포커스가 가지 않는다. 폼 진입 첫 필드 포커스도 없다. **화면이 네 섹션으로 길어져 이 결함의 비용이 커졌다** — 오류가 스크롤 밖에 있을 수 있다 | 이 화면(설정 3화면 공통) | UI 기획 쪽 변경 요청 (FS-067 §7 #3) |
| 7 | ERP-13 (주석) | — | `_shared/validation.ts:11-12` 가 '조사 헬퍼가 **아직 없다**'고 적으나 **`shared/format.ts:267+` 에 승격돼 있다** — 낡은 주석. 판정 자체는 pass(이 화면에 보간 문구가 없다) | 이 화면(주석) | UI 기획 쪽 변경 요청(경미) |
| 8 | COMP-12 | P2 | 카운터는 3개 다 있으나 **상한 근접 경고가 없고** `maxLength` 가 조용히 자른다(사이트 이름·설명). **counting 기준은 화면에 적혀 있으나**('byte') **서버 강제와 일치가 확정되지 않았다** — #11 참조 | 이 화면(설정 3화면 공통) | UI 기획 |
| 9 | EXC-05 · EXC-11 · EXC-19 | P1 | `AbortSignal.timeout` 0건 · `navigator.onLine` 0건 · 세션 만료가 미저장 입력을 버린다. **업로드가 생기며 타임아웃 부재의 비용이 커졌다**(5MB) | **앱 전역** | 프론트 구현 · UI 기획 |
| 10 | (FS-067 §7 #14) | — | **⚠ 충돌 다이얼로그가 이미지 3필드를 거짓으로 '달라졌다'고 보고한다** — `_shared/diff.ts:13-20` 의 `sameValue` 가 배열만 내용 비교하고 나머지는 `Object.is` 인데, `favicon`·`ogImage`·`privateImage` 는 **객체**(`site/validation.ts:87-93`)이고 RHF `reset` 이 깊은 복사를 하므로 참조가 결코 같지 않다. 사이트 이름만 고쳐도 목록에 3건이 함께 뜬다. **세 줄의 거짓말이 운영자를 '다시 불러오기'로 밀어 자기 작업을 잃게 만든다.** `diff.ts:22-27` 이 스스로 '평면 객체만 다룬다'고 밝히는데 **이 문서는 이미 평면이 아니다.** 객체 필드를 덮는 테스트 0건 | 이 화면 + `_shared/diff.ts` | **UI 기획 쪽 변경 요청 (최우선)** |
| 11 | (BE-067 §7.6 #10) | — | **바이트 계산이 EUC-KR 을 자칭하지만 근사다** — `byteLengthOf`(`marketing/_shared/messaging.ts:282-289`)는 '코드포인트 > 0x7F 면 2byte' 이고, `site/validation.ts:159` 와 `SiteSettingsPage.tsx:397` 는 이를 EUC-KR 이라 단언한다. **이모지·라틴1·전각에서 서버와 판정이 갈린다.** 계약이 기준 인코딩을 먼저 정해야 하고, 그 뒤 주석·구현을 맞춰야 한다 | 이 화면 + 마케팅 도메인 + BE 계약 | **백엔드 명세(선결) · 프론트 구현** (FS-067 §7 #15) |
| 12 | (FS-067 §7 #16 · BE-067 §7.6 #11) | — | **업로드 계약이 통째로 미확정이다** — 비멱등 + 잠금 없음 / 고아 자산 GC 정책 없음 / 자리별 규칙(파비콘 100KB·16px)의 판정 위치가 갈림 / 타임아웃 상한 미정 / **응답 `url` 이 세션 수명의 objectURL 이고 회수되지 않음**(`site/data-source.ts:94-96,102`, 호출부 revoke 책임 미이행). **픽스처 한정 누수이며 제품 결함이 아니다** — 코드가 그 사실을 스스로 적어 뒀다. 아울러 **quality-bar 에 파일 업로드 전용 요구가 있는지 이 문서가 확정하지 못했다** — 있다면 이 화면에서 다시 판정해야 한다 | 이 화면 + BE 계약 + quality-bar | **백엔드 명세(신설) · 명세 리뷰** |
| 13 | (FS-067 §7 #17) | — | **이 화면이 버린 공유 코드가 소비자 0건으로 남았다** — `_shared/fields.tsx` 의 `TextInputField`(앱 전체 import 0건) · `_shared/validation.ts` 의 `requiredEmail`(`:37-42`)·`requiredPhone`(`:47-52`)·`normalizePhone`(`:58-74`)(전부 0건, 2026-07-18 grep 확인). 죽은 코드는 다음 사람에게 '이 관례를 따르라'고 잘못 말한다. **TOKEN-02·COMP-04·ERP-14 의 이전 판 근거가 전부 이 파일들이었다** | 이 화면 + `_shared` | 프론트 구현 (정리) |
| 14 | (신규 관찰) | — | **문서 heading 이 h1 → h3 로 건너뛴다** — AppHeader 가 `<h1>`(`AppHeader.tsx:101`), 섹션 제목이 `<h3>`(`SettingLayout.tsx:62`)이고 그 사이 `<h2>` 가 없다(카드 제목 `CardTitle` 은 heading 이 아니다). 스크린리더 heading 탐색에서 한 단계가 비어 보인다. **P0 요구(TOKEN-05·IA-02)의 위반은 아니다** — 그 둘은 `<h1>` 유일성과 title 소유를 묻는다 | 이 화면(+ DS `CardTitle` 시맨틱) | UI 기획 (A11Y) |
| 15 | (FS-067 §7 #18) | — | **이 라우트의 e2e 커버리지가 0이다** — `e2e/` 에 dashboard · login · quality-bar · users · support · throwaway 만 있다. 이 화면은 업로드·미리보기·조건부 잠금·2단 다이얼로그를 한 화면에 얹고 있어 `site.test.ts` 25건(전부 순수 검증 규칙)으로는 조립을 검증할 수 없다. **§2·§3 의 모든 '재현 절차'가 아직 사람 손으로만 실행 가능하다** | 이 화면 | 프론트 구현 · 명세 리뷰 |
| 16 | (FS-067 §7 #20) | **P0** | **A11Y-11 required 노출 미충족** — 사이트 이름이 스키마상 필수인데 화면에 `required`/`aria-required` 0건이다. `FormField` 경로를 버리면서 주입이 사라졌다. **해법 두 갈래**: ① `CountedInput` 이 `required` prop 을 받아 `<input required aria-required>` 를 달게 한다 ② `SettingRow` 가 필수 표기(별표 + `aria-required` 연결)를 소유한다. **어느 쪽이든 시각 표기(별표)도 함께 돌아와야 한다** — 이전 화면의 안내문 '별표(*) 항목은 필수입니다'도 사라졌다 | 이 화면 | **UI 기획 쪽 변경 요청 (P0)** |
| 17 | (FS-067 §7 #5 · #6 · #8 · #19 · BE-067 §7.6 #5·#6·#7·#8) | — | **판정에 직접 걸리지 않으나 §5 가 함께 추적하는 항목**: 저장 실패 배너가 충돌 다이얼로그와 중복 표시(`SiteSettingsPage.tsx:331` 이 `conflict === null` 미검사 — 형제 화면 `oauth/OAuthPage.tsx:277` 은 검사한다) · 저장한 값의 집행 주체 계약 부재 · 스켈레톤 4행 하드코딩(실제 컨트롤 11) · nav 라벨('사이트 설정')과 카드 제목('기본 설정') 불일치 · 미설정 문서 시딩 계약 · PUT 바디 목록의 `siteUrl` 누락 · 변경 이력 계약 부재 | 이 화면 + BE 계약 | UI 기획 · 백엔드 명세 |

> **v1.0 에서 폐기된 gap 항목 (기록)**: `timezone` 미소비(#11) · `baseUrl`/`contactEmail`/`contactPhone` 길이 상한·authority 트릭(#12) · `maintenanceMessage` XSS(#14) · 유지보수 모드 집행(#16) · `_shared/access.tsx` 낡은 주석(#17 의 뒷절). **대상 필드·주석이 재작성으로 사라졌기 때문**이며 판정을 완화한 것이 아니다. 같은 성질의 위험이 남은 자리(자산 URL · `siteName`/`siteDescription` XSS · 공개 범위 집행)로는 위 #10~#12·#17 에 옮겨 세웠다. 낡은 주석 건은 **코드가 고쳐져 해소**됐다(FS-067 §7 #12).

## 6. 측정 도구 · 재현 스위치

> **E2E 미실행 — 이 문서의 모든 판정 근거는 코드 대조다**(기준일 2026-07-18). **기준 트리는 커밋이 아니라 워킹 트리다** — 시스템 설정 섹션 재작성이 미커밋이라 `HEAD` 해시가 이 화면의 상태를 대표하지 않는다. 그래서 커밋 해시를 인용하지 않고, 인용한 `파일:줄` 을 전건 확인한 사실로 근거를 댄다. 아래 스위치는 판정을 재현·검증할 때 쓰는 수단이며, 이 문서가 그것을 실행해 얻은 결과를 적은 것이 아니다.

**이 화면의 `?fail=` scope 와 op (코드 확인)**

`siteSettingsStore` 는 `createRevisionedStore('site', …)`(`data-source.ts:83-87`, `SCOPE = 'site'` — `:19`)로 만들어지므로 scope = **`site`** 이고, `failIfRequested(scope, op)` 를 **세 곳**에서 부른다:

| op | 호출 지점 | 재현 |
|---|---|---|
| `load` | `fetch` (`_shared/store.ts:110`) | `?fail=load` · `?fail=site:load` · `?fail=all` |
| `save` | `save` (`_shared/store.ts:116`) | `?fail=save` · `?fail=site:save` · `?fail=all` |
| **`upload`** | `uploadSiteAsset` (`site/data-source.ts:100`) | `?fail=upload` · `?fail=site:upload` · `?fail=all` |

**충돌 재현 스위치(이 섹션 고유 — `dev.ts` 에 없다)**

`conflictRequested(scope)`(`_shared/store.ts:60-65`)가 `?fail=` 파라미터를 **직접** 읽어 `conflict` / `site:conflict` 를 찾는다. 걸리면 저장 직전에 revision 을 바꿔(`:120`) 토큰을 어긋나게 만든다 — 즉 **다른 관리자가 먼저 저장한 상황을 재현**한다.

| 재현 | 결과 |
|---|---|
| `/settings/site?fail=conflict` | 저장이 409 → **충돌 다이얼로그**(EXC-04 판정) |
| `/settings/site?fail=site:conflict` | 이 화면에서만 |

- **`?delay=` 는 이 화면에 존재하지 않는다.** `shared/crud/dev.ts` 에 그런 스위치가 없다. **STATE-01 재현은 `?delay=` 가 아니라 `staleTime` 30초 경과 후 재진입 또는 devtools invalidate 로 한다.**
- **`?status=<op>:<code>` 스위치**(`shared/crud/dev.ts:15-22`, 판정 `:90`)는 `failIfRequested` 를 거치는 op 에 걸리므로 `?status=load:404` · `?status=save:500` · **`?status=upload:413`** 등이 이 화면에도 적용된다. 다만 **이 화면이 status 로 분기하지 않아**(EXC-06 gap) 결과 화면이 같다 — 그것이 곧 gap 의 재현이다.

| 판정 | 재현 |
|---|---|
| STATE-01 (재조회가 폼을 덮지 않는다) | 값 확인 → 30초 후 재진입. **스켈레톤이 뜨면 gap** |
| STATE-02 (조회 실패 / 업로드 실패의 자리) | `?fail=load` — danger Alert + '다시 시도' 없으면 gap. `?fail=upload` — 토스트가 뜨면 gap |
| **A11Y-11 (required 노출)** | `grep -rn "aria-required\|required=" apps/admin/src/pages/settings/site` — **0건이면 gap**(현재 0건). RTL: 사이트 이름 입력의 `aria-required` 가 `null` 인지 |
| EXC-04 (409 충돌) | `?fail=conflict` — **충돌 다이얼로그 + 입력 보존이면 필수 절 pass.** 사이트 이름만 고쳤는데 이미지 3건이 '달라진 항목'에 뜨면 **§5 #10 의 재현** |
| EXC-03 (write 게이팅) | 권한 스토어에서 `page:/settings/site` 의 `update` off — **저장 버튼이 사라지고 컨트롤 11개가 비활성이면 pass** |
| EXC-08 (연타) | 확인 버튼 2연타 — 요청 1건이면 ① pass. `grep Idempotency` = 0건이면 ② gap. 드롭존 연속 2회 = 요청 2건이면 ③ 재현 |
| EXC-09 (abort) | 저장 중 '취소' — 실패 배너·토스트가 없으면 pass. 업로드 중 이탈 — 콘솔 경고 0건 |
| EXC-06 (status별 surface) | `?status=save:422` · `save:500` · `upload:413` · `upload:415` — 전부 같은 문구면 gap |
| MOTION-03 (reduced-motion) | OS reduced-motion + 복사 방지 스위치 토글 — **손잡이가 즉시 점프하면 pass**(`ToggleSwitch.css:79-84`) |
| **§5 #11 (바이트 근사)** | 콘솔에서 `byteLengthOf('🙂')` — **2 를 돌려주면 근사임이 확정**(실제 UTF-8 4byte · EUC-KR 표현 불가) |

**LATENCY_MS 주의**: `LATENCY_MS = 400`(`dev.ts:12`)은 **개발용 지연이며 성능 예산이 아니다**(§4.1). 실제 네트워크는 0건이므로 이 값으로 응답 시간을 판정하면 안 된다. **업로드에도 같은 400ms 가 걸려 있어**(`data-source.ts:99`) 5MB 업로드의 체감을 전혀 재현하지 못한다.

**그 밖의 도구**: `grep`(TOKEN-01 · A11Y-11 · A11Y-12 · IA-02 · ERP-13 · EXC-08 판정) · RTL(A11Y-11 의 describedby↔alert id 일치 · `aria-required` 부재 확인) · **`site.test.ts`(검증 규칙 회귀 25건 — 이름/설명 상한 5 · 바이트 경계 7 · 공개범위↔비공개이미지 6 · 파비콘 파일 규칙 4 · 이미지 파일 규칙 3)** · `_shared/store.test.ts`(**낙관적 동시성 회귀 7건 — EXC-04 의 근거**) · `_shared/secret.test.ts`(이 화면과 무관 — 시크릿 축은 NFR-069·070).

## 7. 자기 점검

- [x] quality-bar 를 재서술하지 않았다 — 요구 문구를 복제하지 않고 ID 로만 참조했다
- [x] **P0 30건 전수** 를 지정된 순서로 판정했다. 빈칸 0건
- [x] 모든 `pass` 에 코드 근거(파일:라인)를 댔다 — **2026-07-18 워킹 트리에서 전건 재확인**했고, 사라진 대상을 가리키던 인용(`_shared/fields.tsx` 계열 · `LanguagesPage.tsx` · 유지보수 모드 관련)은 살아남은 등가물로 옮기거나 폐기했다
- [x] 모든 `gap` 에 재현 가능한 측정 기준을 댔다
- [x] 모든 `N/A` 에 사유를 댔다 (STATE-04·IA-04 목록 부재 · COMP-10 검색 부재 · FEEDBACK-06 폼 modal 부재 · A11Y-12 토글 필터 부재 · IA-05 폼 라우트 쌍 부재 · IA-13 list state 부재 · **ERP-14 한국형 입력 표면 부재**)
- [x] **§2.1 산수 검산 — 12 pass + 9 종속 + 7 n-a + 2 gap = 30 ✓** (요약표 + 30행 전수 나열 2중 검산)
- [x] **뒤집힌 판정 2건의 사유가 '표면 변화'임을 명시**했다 — A11Y-11(`pass`→`gap`, `FormField` 경로 상실) · ERP-14(`pass`→`n-a`, 전화번호 필드 삭제). 기준을 바꾸지 않았다
- [x] **A11Y-11 을 세 절로 나눠 판정**했다 — ①aria-invalid↔describedby ②hint 조건부 ③required 노출. ①②는 충족이고 ③만 미충족임을 근거와 함께 적었다(요구 전체를 뭉뚱그려 gap 으로 처리하지 않았다)
- [x] `상속` 항목은 **이 화면에 그 표면이 실재하는 것만** 적고, 어느 표면이 계약을 상속하는지 못 박았다
- [x] **`상속` + `gap` 조합의 근거를 §1.1 에 규약으로 명시**했다
- [x] §3 은 표면이 실재하는 P1·P2 만 선별했다 — **1.1 에서 '이미지 업로드'가 실재 표면이 되어 제외 목록에서 뺐다**(§3 머리말)
- [x] §4.1 에 **`LATENCY_MS = 400` 이 개발용 지연이며 예산이 아님**을 명시하고, **업로드 예산을 별도 축으로 신설**했다
- [x] §6 의 `?fail=` scope(`site`)와 **op 3종**(load·save·**upload**)을 호출부에서 확인했고, **이 섹션 고유의 `?fail=conflict` 스위치**(`store.ts:60-65`)를 별도로 기록했으며, **`?delay=` 를 쓰지 않았다**(이 화면에 존재하지 않음)
- [x] 'E2E 미실행 — 판정 근거는 코드 대조' 를 §1 과 §6 에 명시했다
- [x] **기준일 2026-07-18 을 §1·§6 에 명시하고, 커밋 해시 대신 '워킹 트리가 HEAD 보다 앞서 있음'을 근거로 적었다** — 확인할 수 없는 해시를 인용하지 않는다
- [x] §5 의 gap 이 FS-067 §7 · BE-067 §7.6 과 일치한다
- [x] **EXC-03 · EXC-04 가 이 화면에서 pass 이며 그것이 기존 배치의 앱 전역 gap 판정을 뒤집는다는 사실**을 §2.1 하단에 기록했다. **다만 EXC-04 의 '가산 절'(diverge 표시)이 오작동함을 §5 #10 으로 분리**해 pass 가 그 결함을 덮지 않게 했다
