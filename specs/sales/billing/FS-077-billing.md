---
id: FS-077
title: "청구·입금 (목록 · 상세 입금확인)"
screen: SCR-077               # ⚠ 영업 관리 SCR 미작성 — §7 미결 사항 참조
route: /sales/billing
owner: 기능 명세
reviewer: 명세 리뷰
gate: G9
status: draft
confirmedAt: 2026-07-22
version: 1.0
date: 2026-07-22
---

# FS-077. 청구·입금 (목록 · 상세 입금확인)

## 1. 화면 개요

| 항목 | 내용 |
|---|---|
| 목적 | 수주로 전환된 견적에서 생긴 **청구서 1건**을 관리한다 — 청구액·청구 방식(계좌이체/개인결제창)·개인결제창 링크·비고를 두고, **사람이 확인한 입금을 기록**하며, 고객에게 청구를 안내한 사실을 남긴다. 목록은 입금 상태·키워드로 좁혀 훑고 **미수금 합계**를 상단에 띄운다 |
| 역할(주 사용자) | 관리자 (쓰기 게이팅 있음 — `useRouteWritePermissions().canUpdate` 를 목록·상세 양쪽이 소비한다: `BillingListPage.tsx:99` · `BillingDetailPage.tsx:161`) |
| 진입 경로 | 좌측 GNB > 영업 관리 > 청구·입금 (`nav-config.ts:211` `['청구·입금', '/sales/billing']`) |
| 포함 화면 | 목록 `/sales/billing` · 상세 `/sales/billing/:id` (`App.tsx:361-362`). **등록·수정 라우트가 없다** |
| **등록 진입점이 이 화면 밖이다 — 이 화면의 고유 축** | 청구를 만드는 버튼은 **견적 상세**에 있다(`QuoteDetailPage.tsx:278-280` `'청구 만들기'`). 그것도 **수주 전환된 견적에서만** 뜬다 — 표시 조건과 저장 거절이 같은 술어 `billingCreateBlock(quoteStatus, existingBillingId)`(`billing/types.ts:162-169`)를 읽고, 그 술어가 `isOrderedQuote`(`quotes/types.ts:234-236`)를 통과하지 못하면 `BILLING_CREATE_NOT_ORDERED`, 이미 청구가 있으면 `BILLING_CREATE_DONE`(`billing/types.ts:148-149`)을 돌려준다. 실행 경로에도 같은 가드가 한 번 더 있다(`QuoteDetailPage.tsx:182`). **멱등키는 `Billing.quoteId`**(`types.ts:70`)이고 데이터소스가 그 키로 이중 방어한다 — `createBillingFromQuote` 가 `findBillingIdByQuote` 로 먼저 묻고 있으면 **새로 만들지 않고 기존 청구를 돌려준다**(`data-source.ts:142-159`). 폼이 없다 — 물어볼 것이 견적에 이미 다 있다(`QuoteDetailPage.tsx:174-179` 주석) |
| **범위 밖** | **결제 그 자체** — 앱은 결제를 처리하지 않는다. 개인결제창은 **링크를 보관만** 하고 결제는 링크 너머에서 일어나며, 앱은 그 링크를 눌러 결제 상태를 조회하지도 완료를 추측하지도 않는다(`types.ts:8-13,75-80`). **메시지 발송** — '청구 안내'는 **보낸 사실의 기록**이지 발송 기능이 아니다(`BillingDetailPage.tsx:552-555`). **입금의 정정·취소·환불** — 되돌리는 전이가 **없다**(§3 FS-077-EL-045). **과오납 처리** — 잔액을 넘는 입금은 다른 업무로 보고 거절한다(`types.ts:176-179`). **세금계산서 발행** — 비고에 적을 뿐 발행 수단이 없다. **청구 삭제** — 어댑터에는 `remove` 가 있으나 두 화면 어디에도 호출부가 없다(§7 #11) |
| 구현 경로 | `apps/admin/src/pages/sales/billing/**` (`BillingListPage.tsx` 260행 · `BillingDetailPage.tsx` 652행 · `types.ts` 397행 · `data-source.ts` 174행 · `billing.test.ts` 312행). **`validation.ts` 가 없다** — 이 화면에 zod 스키마가 존재하지 않는다(§7 #2). 도메인 공용 `pages/sales/_shared/{business.ts,AccountLink.tsx,account-reference.ts}` |
| 대응 SCR | SCR-077 (미작성 — §7 #1) |
| 공통 컴포넌트 | `shared/crud/{CrudReadListShell,CrudTable,DetailCellLink,useCrudListQuery,useCrudUpdate,useListState,parseFilter,createStoreAdapter,rowTarget}` · `shared/ui/{FilterRail,FilterPanel,SearchField,StatusBadge,Alert,Button,Card,CardTitle,FormField,SelectField,TextareaField,Icon,controlStyle,tableStyle,thStyle,tdStyle,dlStyle,dtStyle,ddStyle,hintStyle,pageTitleStyle,numericCellStyle,mutedTextStyle,visuallyHiddenStyle,alertActionRowStyle,fieldLabelStyle}` · `shared/permissions/RequirePermission(useRouteWritePermissions)` · `shared/errors/http-error(isNotFound,HttpError,HTTP_STATUS)` · `shared/async(isAbort)` · `shared/format(formatDateTime)` |

### 1.1 이 화면의 설계 원칙 (요구사항 — 명세에 고정한다)

세 원칙 전부가 코드 머리말(`types.ts:16-20`)에 회계 규칙으로 적혀 있다. 화면은 그것을 되풀이하지 않고 따른다.

| 원칙 | 내용과 이유 (코드 근거) |
|---|---|
| **입금 상태를 저장하지 않는다 — 누적 합에서 파생한다** | `BillingPaymentState = 'unpaid' \| 'partial' \| 'paid'`(`types.ts:36`)는 **필드가 아니다.** `billingPaymentState(billing)`(`types.ts:114-120`)가 `paidAmount`(`:99-101` — `payments` 의 `reduce`)를 청구액과 비교해 매번 만든다. 근거는 그 함수 주석(`:108-113`): '상태를 따로 저장하면 「입금 3건은 있는데 상태는 미입금」 인 순간이 생기고, 목록 배지와 잔액이 동시에 거짓말을 한다.' **그래서 상세에 상태를 고르는 select 가 없다**(`BillingDetailPage.tsx:9-10`). 회귀가 이것을 가장 먼저 고정한다(`billing.test.ts:66-105` 5건) |
| **완료 판정은 마지막 한 건이 아니라 합이다** | 400,000 + 600,000 = 1,000,000 이면 **어느 한 건도 청구액에 닿지 않았는데 완료**다(`billing.test.ts:80-90`). 완납일도 잔액을 0 으로 만든 **그 입금**의 날짜다(`paidOnDate` — `types.ts:123-130`) |
| **되돌리는 전이를 만들지 않는다 (append-only)** | `applyPayment`·`applyNotice`(`types.ts:215-226`)는 배열에 **덧붙이기만** 한다. 감액 기록의 문을 열지 않는 이유가 코드에 있다(`:51-55`): '되돌리는 문을 미리 열어 두면 그것이 곧 「입금 취소」 버튼이 된다.' 그 문은 `recordPaymentBlock` 이 **`amount <= 0` 을 거절**해(`:186` → `PAYMENT_AMOUNT_POSITIVE`) 음수 엔트리 자체를 못 만들게 함으로써 닫힌다 |
| **버튼의 disabled 와 저장의 거절이 같은 술어를 읽는다** | `recordPaymentBlock`·`sendNoticeBlock`·`billingCreateBlock` 세 술어가 사유 문자열을 돌려주고, 화면은 그것으로 **버튼을 잠그고 같은 문장을 옆에 적는다**(`BillingDetailPage.tsx:252-254,485-487,590`). 규약 근거 `types.ts:142-146`. `applyPayment` 는 막힌 기록이 오면 **던진다** — 술어가 먼저 걸렀어야 하므로 도달하면 버그다(`:216-217`, 회귀 `billing.test.ts:151-155`) |
| **청구액은 견적 합계의 스냅숏이다** | `buildBillingFromQuote` 가 `computeTotals(quote.items, quote.taxMode).total` 을 **값으로 복사**한다(`types.ts:391`). 참조로 두지 않는 이유(`:371-377`): 견적을 나중에 고치면 이미 보낸 청구서의 금액이 사후에 바뀌고 그 청구서를 근거로 받은 입금이 전부 어긋난다 |
| **목록에 등록·삭제·일괄작업이 없다** | 그래서 `CrudListShell` 이 아니라 **`CrudReadListShell`** 을 쓴다(`BillingListPage.tsx:7-9,236`). 껍데기가 `canUpdate=false`·`canRemove=false` 를 넘겨 선택 체크박스와 액션 열을 지우면서, `rowTarget.kind === 'detail'` 이라 **행 클릭은 살린다**(`CrudReadListShell.tsx:143-146` · `CrudTable.tsx:306`) |

## 2. 영역 구성

| 영역번호 | 이름 | 설명 |
|---|---|---|
| FS-077-SEC-01 | 목록 필터 레일 | 좌측 고정 폭 `<aside>` — 안내문 4문단 + 입금 상태 필터 패널 |
| FS-077-SEC-02 | 목록 툴바 | 검색 입력 1개. **'청구 등록' 버튼이 없다** |
| FS-077-SEC-03 | 목록 라이브 리전 · 조회 요약 | 스크린리더 전용 한 줄 + 건수 텍스트 |
| FS-077-SEC-04 | 목록 표 | 10열. 선택 열·행 액션 열이 **없다**. 페이지네이션 없음(§7 #15) |
| FS-077-SEC-05 | 목록 조회 실패 배너 (비표시 기본) | 요약·표를 대체 |
| FS-077-SEC-06 | 등록 진입점 — **이 화면 밖** | 견적 상세의 '청구 만들기' 버튼과 그 가드·멱등 규칙 |
| FS-077-SEC-07 | 상세 머리 | '목록으로' + `<h1>` + 상태/방식 배지 |
| FS-077-SEC-08 | 상세 라이브 리전 (시각 숨김) | 저장 결과를 스크린리더에 알린다 |
| FS-077-SEC-09 | 상세 알림 영역 (비표시 기본) | 저장 실패 배너 · 읽기 전용 안내 |
| FS-077-SEC-10 | 청구 요약 카드 | `<dl>` 7항목 (거래처·원 견적·청구일·청구액·입금액·잔액·완납일) |
| FS-077-SEC-11 | 청구 방식 카드 | 방식 select + (조건부) 개인결제창 링크 + 비고 |
| FS-077-SEC-12 | 입금확인 카드 | 입력 3개 + 차단 사유 경고 + 기록 버튼 + 입금 내역 표 |
| FS-077-SEC-13 | 청구 안내 카드 | 창구 select + 메모 + 차단 사유 경고 + 기록 버튼 + 발송 기록 표 |
| FS-077-SEC-14 | 상세 하단 액션 | '목록으로' 버튼 |
| FS-077-SEC-15 | 상세 조회 실패 대체 화면 (비표시 기본) | 404 / 일반 오류 분기 — 화면 전체를 대체 |
| FS-077-SEC-16 | 상세 로딩 카드 (비표시 기본) | '불러오는 중…' 한 줄 |

> **SEC-01~05 는 목록(`BillingListPage.tsx`), SEC-07~16 은 상세(`BillingDetailPage.tsx`) 소유이고 SEC-06 은 어느 쪽도 소유하지 않는다** — 이 화면에 없는 동작을 기술하는 자리다. 명세에 넣는 이유는 '청구가 어떻게 생기는가' 의 답이 이 문서 밖에 있으면 이 화면의 빈 상태를 설명할 수 없기 때문이다.

## 3. 요소 명세

| 요소번호 | 영역 | 이름 | 유형 | 동작 | [서버] | 비고 |
|---|---|---|---|---|---|---|
| FS-077-EL-001 | FS-077-SEC-01 | 미수금 안내문 | 텍스트 | 조회가 끝났으면 `아직 받지 못한 금액은 <금액>입니다.`, 아니면 '미수금을 세는 중입니다.'(`BillingListPage.tsx:209-213`). 값은 `totalOutstanding(items)`(`:118` → `types.ts:325-327`) | O | **필터·검색 이전 전체 집합**에서 센다(`:112` 의 `items`). 완납 건은 `Math.max(…, 0)` 으로 0 이 들어간다 — 초과 입금이 막히므로 실제로 음수가 나오지 않는다 |
| FS-077-EL-002 | FS-077-SEC-01 | 생성 경로 안내문 | 텍스트 | '청구는 수주로 전환된 견적에서만 만들어집니다. 견적 상세의 「청구 만들기」로 시작하세요.'(`:214-217`) | — | **목록에 등록 버튼이 없는 이유를 사용자에게 말하는 유일한 문장이다.** ⚠ 링크가 아니라 문장이다 — 견적 목록으로 가는 경로를 주지 않는다(§7 #16) |
| FS-077-EL-003 | FS-077-SEC-01 | 되돌릴 수 없음 안내문 | 텍스트 | '결제대행을 쓰지 않으므로 입금은 사람이 확인해 기록합니다. 기록한 입금은 되돌릴 수 없습니다.'(`:218-221`) | — | append-only 규칙(§1.1)을 **입금하기 전에** 알린다. 상세에도 같은 취지의 문장이 있다(EL-028) |
| FS-077-EL-004 | FS-077-SEC-01 | 조회 전용 안내문 | 텍스트 | `!canUpdate` 일 때만 '입금확인 권한이 없어 조회만 가능합니다.'(`:222`) | — | 비표시 기본. **목록에서 미리 밝힌다** — 상세에 들어가 버튼이 없는 것을 보고 알아채게 하지 않는다(상세의 EL-022 와 짝) |
| FS-077-EL-005 | FS-077-SEC-01 | 입금 상태 필터 | 입력 | `FilterPanel navLabel="청구 입금 상태 필터" heading="입금 상태"`(`:226-233`). 선택지 4개(`BILLING_STATE_FILTERS` — `types.ts:293-298`): 전체·미입금·부분입금·입금완료. `<nav>` 안 `<button aria-pressed>` 목록(`FilterPanel.tsx:120,145-147`). 선택 시 `list.setFilter('state', next)` → URL `?state=` | — | 필터링은 **클라이언트**(`filterBillings` — `types.ts:304-310`). 기본값(`all`)과 같으면 URL 에서 지운다(`useListState.ts:115`) |
| FS-077-EL-005.1 | FS-077-SEC-01 | 필터 값 정규화 규칙 | 텍스트 | `parseFilter(list.filters['state'] ?? 'all', BILLING_STATE_FILTER_VALUES, 'all')`(`BillingListPage.tsx:103-107`) — 손으로 고친 `?state=거짓말` 은 '전체'로 되돌린다 | — | 비표시 규칙 |
| FS-077-EL-005.2 | FS-077-SEC-01 | 건수 배지 규칙 | 텍스트 | 각 선택지 우측 배지. `countBillingsByState(items)`(`:117` → `types.ts:313-322`)를 **필터 이전 전체 집합**에서 센다. 아직 못 셌으면 `null` 을 넘겨 `FilterPanel` 이 '—' 를 띄운다(`:117` 의 `loaded` · `FilterPanel.tsx:155`) | O | 비표시 규칙. 근거 주석(`BillingListPage.tsx:114-115`): '0 과 「모름」은 다른 사실이다'. **필터가 자기 배지를 흔들지 않는다**(`types.ts:312`) |
| FS-077-EL-006 | FS-077-SEC-02 | 검색 입력 | 입력 | `SearchField` 접근 이름 '청구번호·견적번호·거래처 검색'(`:192-199`). `{...list.searchInputProps}` 스프레드로 **IME 조합 중 커밋 금지 + 조합 중 Enter 차단 + 250ms 디바운스**를 상속한다(`useDebouncedSearch.ts:23,87,121-127`) | — | 커밋된 값은 URL `?q=`. 필터링은 클라이언트 |
| FS-077-EL-006.1 | FS-077-SEC-02 | 검색 매칭 규칙 | 텍스트 | `searchBillings`(`types.ts:329-338`): 앞뒤 공백 제거·소문자화 후 **청구번호 · 견적번호 · 거래처명**에 부분 일치(OR) | — | 비표시 규칙. **비고·입금자명 메모는 검색 대상이 아니다** — '「대성물산(선금)」이 어느 청구였나'를 찾을 수 없다(§7 #16) |
| FS-077-EL-007 | FS-077-SEC-02 | 조회 상태 URL 직렬화 규칙 | 텍스트 | 상태 필터·검색어의 **단일 원천이 URL 쿼리스트링**이다(`useListState({ filterDefaults: { state: 'all' } })` — `:54,101`). `replace: true` 갱신(`useListState.ts:125`)이라 history 가 쌓이지 않으면서 상세→Back 이 조건을 복원한다 | — | 비표시 규칙. **`page`·`sort` 는 소비되지 않는다**(§7 #15) |
| FS-077-EL-008 | FS-077-SEC-03 | 목록 라이브 리전 | 텍스트 | **항상 마운트된** `aria-live="polite" aria-atomic="true"` 시각 숨김 컨테이너(`CrudReadListShell.tsx:110-112`). `청구 N건을 찾았습니다.` / `조건에 맞는 청구 결과가 없습니다.` / `청구 목록을 불러오지 못했습니다.`(`:79-83`) | — | 비표시. 최초 로드 중에는 침묵(`firstLoading` → `''`) |
| FS-077-EL-009 | FS-077-SEC-03 | 조회 요약 텍스트 | 텍스트 | 최초 로드 중 '불러오는 중…', 그 외 `전체 N건`. 재조회 중에는 건수를 유지하고 ' · 새로고침 중…' 만 덧붙인다. `aria-busy={refreshing}`(`CrudReadListShell.tsx:118-121`) | — | N 은 필터·검색 적용 후 건수(`visible.length`). **선택 개념이 없어 「N건 선택됨」 이 붙지 않는다** |
| FS-077-EL-010 | FS-077-SEC-04 | 청구 목록 표 | 표 | `CrudReadListShell` → `CrudTable`. caption(시각 숨김) **'청구 목록 — 행을 누르면 상세 화면으로 이동합니다.'**(`rowTarget.ts:61-62` — `rowTarget.kind === 'detail'` 에서 파생). 컬럼 10개, **선택 열·액션 열 없음**(`CrudReadListShell.tsx:145-146`). 전량 렌더 | O | 목록 조회는 `useCrudListQuery(BILLING_RESOURCE, billingAdapter)`(`:109`). 기본 정렬은 청구일 내림차순(EL-014) |
| FS-077-EL-010.1 | FS-077-SEC-04 | 청구번호 셀 | 링크 | `DetailCellLink to={/sales/billing/<id>}`(`:128-133`) — 'BL-YYYYMMDD-NNN'. `nowrap` | — | **상세로 가는 키보드 경로다.** 행 클릭은 마우스 전용이라 이 링크가 없으면 키보드로 상세에 닿을 수 없다(`DetailCellLink.tsx:1-16` — 그 결함이 실제로 발생했던 기록까지 남아 있다) |
| FS-077-EL-010.2 | FS-077-SEC-04 | 거래처 셀 | 링크 | `AccountLink account={item}`(`:134`). 등록 거래처면 `/sales/accounts/<accountId>` 링크 + 접근 이름 `'<거래처명> 거래처 상세'`, 미등록(`accountId === ''`)이면 흐린 `'<거래처명> (미등록)'`(`AccountLink.tsx:25-36`) | — | **왜 링크가 없는지를 말한다** — 그냥 텍스트로 두지 않는다 |
| FS-077-EL-010.3 | FS-077-SEC-04 | 원 견적 셀 (역링크) | 링크 | `quoteId !== ''` 이면 `<Link to={/sales/quotes/<quoteId>}>` + 접근 이름 `'<청구번호> 원 견적 <견적번호>'`(`:136-151`). 아니면 muted '—' | — | **견적↔청구 양방향 링크의 한쪽 끝**이다(다른 끝은 EL-016.5). `quoteNo` 는 승계 스냅숏(`types.ts:73`)이라 견적이 지워지면 문자열은 남고 **링크만 깨진다**(§7 #12) |
| FS-077-EL-010.4 | FS-077-SEC-04 | 청구 방식 셀 | 텍스트 | `billingMethodLabel(item.method)`(`:152` → `types.ts:252-254`) — '계좌이체' / '개인결제창'. `nowrap` | — | 두 값뿐인 이유가 코드에 있다(`types.ts:30-31`): '앱이 카드를 받지 않는데 선택지에 있으면 운영자가 고르고, 고른 뒤에 할 일이 없다' |
| FS-077-EL-010.5 | FS-077-SEC-04 | 청구액 셀 | 텍스트 | `formatWon(item.amount)`(`:153` → `business.ts:45-47`) → '3,960,000원'. `numeric: true` 라 우측 정렬(`CrudTable.tsx:269`) | — | **저장된 스냅숏 값이다** — 견적 합계를 다시 계산하지 않는다(견적 목록의 합계금액 셀과 다른 점 — FS-050-EL-009.7). **'원'이 숫자에 붙어 있어** 우측 정렬에서 단위가 마지막 자릿수를 따라다닌다(quality-bar ERP-07) |
| FS-077-EL-010.6 | FS-077-SEC-04 | 입금액 셀 | 텍스트 | `formatWon(paidAmount(item))`(`:154`) — **누적 합**(`types.ts:99-101`). `numeric` | — | 파생값. 저장된 필드가 아니다 |
| FS-077-EL-010.7 | FS-077-SEC-04 | 잔액 셀 | 텍스트 | `formatWon(outstandingAmount(item))`(`:155-159` → `types.ts:104-106`) = 청구액 − 입금액. `numeric` | — | 파생값. **초과 입금을 막으므로 음수가 되지 않는다**(`types.ts:103`) |
| FS-077-EL-010.8 | FS-077-SEC-04 | 안내 발송 셀 | 배지 | `hasSentNotice(item)`(`types.ts:133-135`)이면 success `StatusBadge` `발송 N회`, 아니면 warning '미발송'(`:160-170`) | — | 근거 주석(`:161`): '미입금인데 안내조차 안 나간 건이 운영자가 가장 먼저 집을 행이다' |
| FS-077-EL-010.9 | FS-077-SEC-04 | 입금 상태 배지 | 배지 | `billingStateMeta(billingPaymentState(item))`(`:171-178` → `types.ts:278-286`): 미입금=warning · 부분입금=info · 입금완료=success | — | **저장된 상태가 아니라 행마다 다시 계산하는 파생값이다**(§1.1). 부분입금을 미입금과 같은 색으로 두지 않는 이유가 코드에 있다(`types.ts:272-277`): 운영자가 할 일이 다르다 |
| FS-077-EL-010.10 | FS-077-SEC-04 | 입금일 셀 | 텍스트 | `paidOnDate(item)`(`types.ts:123-130`) — **잔액을 0 으로 만든 그 입금의 날짜**. 아직이면 muted '—'(`:179-186`) | — | 파생값. 부분입금 상태에서는 언제나 '—' 다 — '마지막으로 돈이 들어온 날'이 아니다 |
| FS-077-EL-010.11 | FS-077-SEC-04 | 행 전체 클릭 이동 | 텍스트 | `ROW_TARGET = { kind: 'detail', href: (item) => /sales/billing/<id> }`(`:57-60`). `CrudTable` 이 `rowTarget.kind === 'detail'` 이면 **`canUpdate` 와 무관하게** 행 활성화를 허용한다(`CrudTable.tsx:306`) | — | 비표시 규칙. **조회 전용 역할도 상세로 갈 수 있다** — 라우트 진입은 `RequirePermission` 이 이미 막았으므로 여기서 또 막지 않는다(`CrudReadListShell.tsx:14-16`) |
| FS-077-EL-011 | FS-077-SEC-04 | 목록 로딩 스켈레톤 | 스켈레톤 | **최초 로드에서만**(`firstLoading = isFetching && data === undefined` — `:111`) 표 본문을 스켈레톤으로 대체한다(`CrudTable` 의 `loading` → DS `Table`) | — | 비표시. 근거 주석(`:110`): 재조회 중에는 이전 행을 유지한다(STATE-01) |
| FS-077-EL-012 | FS-077-SEC-04 | 빈 상태 (3분기) | 빈상태 | 조회 완료·0행이면 공유 `Empty`(`CrudTable.tsx:379-390`)가 맥락으로 갈린다: 검색어 → '검색 지우기', 필터 → '필터 초기화', 아무것도 없으면 '등록된 청구가 없습니다' 계열. `createVerb: '생성'`(`:251`) | — | 비표시. 맥락은 `:250-256` 이 넘긴다. **`createAction` 을 넘기지 않는다** — 이 화면에서 만들 수 없기 때문이다(EL-002 가 그 대신 말한다) |
| FS-077-EL-013 | FS-077-SEC-05 | 목록 조회 실패 배너 | 배너 | 조회 실패 시 요약·표를 **danger `Alert`** '청구 목록을 불러오지 못했습니다.' + '다시 시도'(`refetch`)로 대체한다(`CrudReadListShell.tsx:154-161`) | O | 비표시. **필터 레일은 남는다** — 좌측 안내문·필터가 그대로 보이고 건수 배지만 '—' 가 된다(`:116` 의 `loaded` 가 false) |
| FS-077-EL-014 | FS-077-SEC-04 | 정렬 규칙 | 텍스트 | `sortBillings`(`types.ts:341-346`) — **청구일 내림차순**(최근이 위), 같은 날짜는 청구번호 내림차순. 저장소가 `list`·쓰기 직후에 적용한다(`data-source.ts:93,106,117,125,157`). **정렬 변경 UI 가 없다** | — | 비표시 규칙. **잔액·입금 상태로 정렬할 수 없다** — 고액 미수 순으로 훑을 수 없다(§7 #15) |
| FS-077-EL-015 | FS-077-SEC-04 | 필터·검색 결합 규칙 | 텍스트 | `searchBillings(filterBillings(items, state), list.keyword)`(`:120-123`) — 상태로 먼저 좁히고 그 결과에 검색어를 건다. `useMemo` | — | 비표시 규칙 |
| FS-077-EL-016 | FS-077-SEC-06 | **'청구 만들기' 버튼 (이 화면 밖)** | 버튼 | 견적 상세 우상단. `canUpdate && billingCreateBlock(quote.status, billingId) === null` 일 때만 렌더된다(`QuoteDetailPage.tsx:278-280`). 클릭 → `onCreateBilling`(`:181-188`): 가드 재확인 → `createBillingFromQuote(quote, 오늘)` → 목록 캐시 무효화 → **새 청구 상세로 이동** | O | **확인 다이얼로그가 없다 — 한 번의 클릭으로 청구가 생긴다.** 다만 멱등이라 두 번 눌러도 청구는 하나다(EL-016.2). 폼이 없는 이유가 코드에 있다(`:174-179`): '물어볼 것이 없는 화면을 한 장 세우지 않는다' |
| FS-077-EL-016.1 | FS-077-SEC-06 | 청구 생성 가드 규칙 | 텍스트 | `billingCreateBlock(quoteStatus, existingBillingId)`(`types.ts:162-169`): ① `isOrderedQuote` 가 false → `BILLING_CREATE_NOT_ORDERED` '수주로 전환된 견적만 청구할 수 있습니다.' ② `existingBillingId !== ''` → `BILLING_CREATE_DONE` '이미 청구가 생성된 견적입니다.' ③ 그 밖 → `null` | — | 비표시 규칙. `ordered` **하나만** 문을 연다 — 승인(`accepted`)만으로는 열리지 않는다(`quotes/types.ts:229-236` 이 그 이유를 적는다). 회귀 3건(`billing.test.ts:210-225`)이 draft·sent·accepted·rejected·expired **다섯을 전수**로 막는다 |
| FS-077-EL-016.2 | FS-077-SEC-06 | 멱등 생성 규칙 (이중 방어) | 텍스트 | ① 화면: `findBillingIdByQuote(quote.id)`(`QuoteDetailPage.tsx:171`)를 **렌더 시점에 동기로** 물어 버튼 표시를 정한다 — 비동기로 나중에 알면 버튼이 잠깐 살아 있다가 죽고 그 사이 누른 사람이 두 번째 청구를 만든다(`:161-165` 주석). ② 데이터소스: `createBillingFromQuote` 가 같은 조회를 다시 해 **이미 있으면 새로 만들지 않고 기존 청구를 돌려준다**(`data-source.ts:153-159`) | O | 비표시 규칙. **멱등키는 `Billing.quoteId`**(`types.ts:70` '한 견적에 청구는 하나다'). 서버 계약 자리는 `data-source.ts:151-152` `POST /api/sales/quotes/:id/billing` — '이미 청구된 견적이면 409 로 거절한다' |
| FS-077-EL-016.3 | FS-077-SEC-06 | 견적 → 청구 승계 규칙 | 텍스트 | `buildBillingFromQuote(quote, issuedAt)`(`types.ts:381-397`)이 승계 필드의 **단일 정의**다: `quoteId`·`quoteNo`·`accountId`·`accountName` 승계, `amount = computeTotals(...).total` **스냅숏**, `method: 'bank_transfer'`, `paymentLinkUrl: ''`, `notices: []`·`payments: []`, `billNo: ''`(자동 채번에 맡긴다) | — | 비표시 규칙. 기본 방식이 계좌이체인 이유(`:378-379`): 개인결제창은 링크를 먼저 만들어야 성립하는데 이 시점에 링크가 없다. 회귀 4건(`billing.test.ts:227-255`) |
| FS-077-EL-016.4 | FS-077-SEC-06 | 청구번호 자동 채번 규칙 | 텍스트 | `nextBilling`(`data-source.ts:97-101`)이 `billNo.trim() === ''` 이면 `makeBillNo(issuedAt, seq)`(`types.ts:366-369`) → `'BL-' + 청구일숫자 + '-' + 3자리 순번`. **사람이 정하지 않는다**(`types.ts:383`) | O | 비표시 규칙. 회귀 `billing.test.ts:252-254`. 순번 `seq` 는 모듈 지역 카운터라 **삭제해도 되돌아가지 않는다** |
| FS-077-EL-016.5 | FS-077-SEC-06 | 견적 상세의 청구 역링크 | 링크 | 청구가 이미 있으면 견적 상세가 `/sales/billing/<billingId>` 링크를 보인다(`QuoteDetailPage.tsx:367-371`) | — | **양방향 링크의 다른 끝**(EL-010.3 과 짝). 이 링크와 '청구 만들기' 버튼은 **서로 배타**다 — 같은 `billingId` 가 둘의 조건을 가른다 |
| FS-077-EL-017 | FS-077-SEC-07 | 상세 '목록으로' 버튼 (상단) | 버튼 | 좌상단 `<button>` + `Icon name="chevron-left"` + '목록으로'(`BillingDetailPage.tsx:299-307`). `navigate('/sales/billing')` | — | `navigate()` 프로그램 이동이다. **이 화면에 이탈 가드가 없으므로**(§7 #21) 가로챌 것도 없다 |
| FS-077-EL-018 | FS-077-SEC-08 | 상세 라이브 리전 | 텍스트 | **항상 마운트된** `aria-live="polite" aria-atomic="true"` 시각 숨김 `<div>`(`:310-312`). `statusMessage` 를 읽는다 — '입금을 확인 처리했습니다.' / '청구 안내 발송을 기록했습니다.' / '청구 방식을 변경했습니다.' / '개인결제창 링크를 저장했습니다.' / '비고를 저장했습니다.' | — | 비표시. 근거 주석(`:179`): '토스트만 쓰면 스크린리더 사용자가 결과를 놓친다'(A11Y-16). **⚠ 이 화면은 토스트를 쓰지 않는다** — 저장 성공의 유일한 통지가 이 시각 숨김 문구다(§7 #22). ⚠ 같은 문구를 두 번 저장하면 state 가 그대로라 **다시 읽히지 않는다**(§7 #22) |
| FS-077-EL-019 | FS-077-SEC-07 | 상세 화면 제목 | 텍스트 | `<h1 style={pageTitleStyle}>{`청구 ${billing.billNo}`}</h1>`(`:316`) | — | **AppHeader 의 `<h1>` 과 중복** — 그 자리는 nav 잎 라벨 '청구·입금'을 보인다(IA-02 · §7 #23) |
| FS-077-EL-020 | FS-077-SEC-07 | 상태 · 방식 배지 | 배지 | 제목 아래 두 개(`:317-320`): 입금 상태(`billingStateMeta` — 파생) + info 톤 청구 방식 | — | 상태 배지는 **저장된 값이 아니다**(§1.1) |
| FS-077-EL-021 | FS-077-SEC-09 | 저장 실패 배너 | 배너 | `serverError !== null` 이면 danger `Alert` '저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'(`:324` ← `:206`). 재저장 시 먼저 지운다(`:191`) | O | 비표시. **문구 1종** — 400/403/409/422/500 을 전부 뭉갠다(§7 #13). **오류 참조 코드가 없다** — `referenceOf`(`http-error.ts:151`)가 있는데 이 경로가 쓰지 않는다. abort 는 표시하지 않는다(`:205`) |
| FS-077-EL-022 | FS-077-SEC-09 | 읽기 전용 안내 | 배너 | `!canUpdate` 면 info `Alert` '입금확인 권한이 없습니다. 이 화면은 조회만 가능합니다.'(`:326-328`) | — | 비표시 기본. 버튼을 감추기만 하지 않고 **이유**를 말한다(목록의 EL-004 와 짝) |
| FS-077-EL-023 | FS-077-SEC-10 | 청구 요약 목록 | 표시 | `<dl>` 7항목(`:332-368`): **거래처**(`AccountLink`) · **원 견적**(링크 또는 '견적 없이 만든 청구입니다.') · 청구일 · 청구액 · **입금액(누적)** · **잔액** · **입금 완료일**('—' 또는 날짜). 숫자 4항목은 `tabular-nums` + `nowrap`(`:129-132`) | O | 뒤 넷이 전부 파생값이다(`paidAmount`·`outstandingAmount`·`paidOnDate`). **'견적 없이 만든 청구' 는 픽스처에만 있다** — 이 앱에 견적 없이 청구를 만드는 경로가 없다(§7 #12) |
| FS-077-EL-024 | FS-077-SEC-11 | 청구 방식 안내문 | 텍스트 | '결제대행을 쓰지 않으므로 앱은 결제를 처리하지 않습니다. 개인결제창은 링크를 보관만 하고, 입금 사실은 아래에서 사람이 확인해 기록합니다.'(`:373-376`) | — | **범위 밖(§1)을 사용자에게 말하는 문장이다** |
| FS-077-EL-025 | FS-077-SEC-11 | 청구 방식 select | 입력 | `FormField htmlFor="billing-method" label="청구 방식"` + `SelectField`(`:378-394`). 선택지 2개(`BILLING_METHOD_OPTIONS` — `types.ts:235-238`). `disabled={saving \|\| !canUpdate}`. 타입가드 `isBillingMethod`(`:149-151`)를 통과한 값만 `onChangeMethod` 로 간다 | O | **고르는 즉시 저장된다** — 저장 버튼이 없다(EL-043). **`required` 를 넘기지 않는다** — 언제나 값이 있다 |
| FS-077-EL-025.1 | FS-077-SEC-11 | 방식 전환 부수효과 규칙 | 텍스트 | `onChangeMethod(next)`(`:285-295`): 계좌이체로 되돌리면 `paymentLinkUrl` 을 **`''` 로 비운다**. 근거 주석(`:286`): '남겨 두면 안내 문면과 어긋난다' | O | 비표시 규칙. **되돌릴 수 없는 삭제다** — 개인결제창으로 다시 바꾸면 링크를 새로 입력해야 한다. 확인을 묻지 않는다(§7 #24) |
| FS-077-EL-026 | FS-077-SEC-11 | 개인결제창 링크 입력 | 입력 | **`method === 'payment_link'` 일 때만 렌더된다**(`:395-417`). `FormField htmlFor="billing-link" label="개인결제창 링크" hint="링크만 보관합니다 — 결제 상태를 조회하지 않습니다."` + `<input type="url" placeholder="https://">`. `value={billing.paymentLinkUrl}`(**서버 값 그대로**) | O | ⚠⚠ **`onChange` 가 곧바로 `commit` 을 부른다**(`:409-414`) — 한 글자를 칠 때마다 저장 요청이 하나 나가고, 화면의 값은 refetch 가 돌아와야 갱신된다. **입력이 사실상 불가능하다**(§7 #3 — 이 화면 최대 결함). `type="url"` 이지만 `<form>` 밖이라 브라우저 검증이 걸리지 않고, zod 스키마도 없다(§7 #2) — 아무 문자열이나 저장된다 |
| FS-077-EL-027 | FS-077-SEC-11 | 비고 입력 | 입력 | DS `TextareaField label="비고"` `maxLength={BILLING_NOTE_MAX}`(=300 — `types.ts:93`) `rows={2}` placeholder '결제조건·세금계산서 발행 등을 기록하세요.'(`:419-427`) | O | ⚠ **EL-026 과 같은 즉시 커밋 결함**(`:422`) — 한 글자마다 요청이 나간다(§7 #3). 길이는 `maxLength` 로만 강제된다 — 서버 검증 자리가 없다(§7 #19) |
| FS-077-EL-028 | FS-077-SEC-12 | 입금확인 안내문 | 텍스트 | '통장에 찍힌 입금을 기록합니다. 여러 번 나눠 들어오면 그때마다 기록하고, 누적 합이 청구액에 닿으면 입금완료가 됩니다. **기록한 입금은 되돌릴 수 없습니다.**'(`:434-437`) | — | **§1.1 의 세 원칙을 한 문단으로 말한다.** '되돌릴 수 없습니다' 만 `<strong>` 이다 |
| FS-077-EL-029 | FS-077-SEC-12 | 입금일 입력 | 입력 | `FormField htmlFor="payment-date" label="입금일" required` + `<input type="date">`(`:440-450`). 초기값 **하드코딩 `TODAY = '2026-07-21'`**(`:74`). `disabled={saving \|\| !canUpdate \|\| state === 'paid'}` | — | 로컬 state 다 — 기록 버튼을 눌러야 서버로 간다. 하드코딩 이유가 코드에 있다(`:73`): '화면이 `new Date()` 를 읽으면 스토리·회귀 비교가 매일 깨진다'. ⚠ **그래서 사용자가 보는 기본 입금일이 오늘이 아니다**(§7 #7). 저장은 `paidOn` 을 비우지 않는다 — 입금일은 통장에 찍힌 날이지 입력한 날이 아니다(`types.ts:59`) |
| FS-077-EL-030 | FS-077-SEC-12 | 입금액 입력 | 입력 | `FormField htmlFor="payment-amount" label="입금액" required hint={`잔액 <금액>`}` + `<input type="text" inputMode="numeric" placeholder="0">`(`:451-468`). 같은 3조건으로 비활성 | — | 힌트가 **상한을 미리 말한다**. `maxLength` 가 없다 — 실질 상한은 `PAYMENT_OVER_OUTSTANDING` 검증뿐이다(§7 #14) |
| FS-077-EL-030.1 | FS-077-SEC-12 | 금액 파싱 규칙 | 텍스트 | `digitsToNumber(raw)`(`:144-147`) — 숫자가 아닌 문자를 전부 버리고 남은 것을 `Number` 로. 빈 문자열이면 0. 근거 주석(`:143`): `'1,200,000원'` 을 붙여 넣어도 값이 살아남는다 | — | 비표시 규칙. **입력 원문은 그대로 보인다** — 화면이 되돌려 쓰지 않는다. 결과적으로 `'12abc34'` → `1234` 로 **조용히** 읽힌다 |
| FS-077-EL-031 | FS-077-SEC-12 | 입금자명 · 메모 입력 | 입력 | `FormField htmlFor="payment-memo" label="입금자명 · 메모"` + `<input maxLength={BILLING_MEMO_MAX}>`(=60 — `types.ts:94`), placeholder '통장 표기가 다르면 적어 두세요'(`:469-481`) | — | 필수 아님. 근거(`types.ts:62`): '통장 표기가 주문자와 다를 때 이 칸이 유일한 단서다' |
| FS-077-EL-032 | FS-077-SEC-12 | 입금 차단 사유 경고 | 배너 | `canUpdate && paymentBlock !== null && amountInput !== ''` 일 때만 warning `Alert` 로 `paymentBlock` 문자열 그대로(`:485-487`) | — | 비표시 기본. 근거 주석(`:484`): '왜 못 누르는지를 버튼 옆에 적는다 — disabled 와 이 문장이 같은 술어에서 나온다'. **`amountInput === ''` 조건 때문에 아직 아무것도 안 친 상태에서는 뜨지 않는다** — 첫 진입에 경고가 번쩍이지 않는다 |
| FS-077-EL-033 | FS-077-SEC-12 | '입금확인 기록' 버튼 | 버튼 | `canUpdate` 일 때만 렌더(`:490-500`). `variant="primary" size="md" loading={saving}` · `disabled={saving \|\| paymentBlock !== null}`. 클릭 → `onRecordPayment`(`:256-269`): 가드 재확인 → `applyPayment(billing, { id: 'bp-<Date.now()>', paidOn, amount, memo: memo.trim() })` → `commit` → **입금액·메모 입력을 즉시 비운다** | O | **권한이 없으면 버튼 자체가 없다**(EXC-03). ⚠ **멱등키가 없다** — append-only 라 중복 요청이 통과하면 **입금이 두 건 쌓이고 되돌릴 수 없다**(§7 #4 — 이 화면 최고 위험). ⚠ **동기 제출 락이 없다**(§7 #5). ⚠ **입력 비우기가 응답 전에 일어난다**(`:267-268` 이 `commit` 밖) — 저장이 실패해도 사용자가 친 금액·메모가 사라진다(§7 #25) |
| FS-077-EL-034 | FS-077-SEC-12 | 입금 내역 표 | 표 | `<table>` 3열(입금일·입금액·입금자명 · 메모), caption '입금 내역 — 덧붙이기만 하는 기록입니다.'(`:503-547`). 비어 있으면 한 행 '아직 입금 기록이 없습니다.'. 금액은 `numericCellStyle`, 메모가 비면 muted '—' | O | `billing.payments` 를 **저장 순서 그대로** 그린다 — 정렬하지 않는다. **행 액션이 없다** — 수정·삭제 버튼이 존재하지 않는 것이 append-only 의 화면 표현이다 |
| FS-077-EL-035 | FS-077-SEC-13 | 안내 창구 select | 입력 | `FormField htmlFor="notice-channel" label="안내 창구"` + `SelectField`. 선택지 4개(`BILLING_NOTICE_CHANNEL_OPTIONS` — `types.ts:240-245`): 이메일·문자·카카오톡·전화. 기본값 `'email'`(`:176`). 타입가드 `isNoticeChannel`(`:153-155`) | — | 로컬 state — 고르는 것만으로 저장되지 않는다(EL-025 와 다르다) |
| FS-077-EL-036 | FS-077-SEC-13 | 안내 메모 입력 | 입력 | `FormField htmlFor="notice-memo" label="메모"` + `<input maxLength={BILLING_MEMO_MAX}>` placeholder '무엇을 안내했는지 적어 두세요'(`:575-587`) | — | 필수 아님 |
| FS-077-EL-037 | FS-077-SEC-13 | 안내 차단 사유 경고 | 배너 | `canUpdate && noticeBlock !== null` 이면 warning `Alert`(`:590`). 사유는 `NOTICE_LINK_REQUIRED` '개인결제창 링크를 먼저 등록해야 안내를 보낼 수 있습니다.' 하나뿐(`types.ts:154`) | — | 비표시 기본. `sendNoticeBlock`(`types.ts:198-205`)의 근거(`:193-196`): 개인결제창인데 링크가 없으면 고객은 '결제해 달라' 는 말만 받고 결제할 수단을 못 받는다. **계좌이체는 막지 않는다** — 계좌 안내가 문면에 있다. 회귀 `billing.test.ts:160-175` |
| FS-077-EL-038 | FS-077-SEC-13 | '안내 발송 기록' 버튼 | 버튼 | `canUpdate` 일 때만(`:593-601`). `variant="secondary"` · `disabled={saving \|\| noticeBlock !== null}`. 클릭 → `onRecordNotice`(`:271-283`): `applyNotice(billing, { id: 'bn-<Date.now()>', at: new Date().toISOString(), channel, memo })` → `commit` → 메모 비움 | O | ⚠ `loading={saving}` 을 주지 않는다 — 형제 버튼(EL-033)은 준다. 진행 표시가 갈린다(§7 #26). ⚠ 발송 시각이 **클라이언트 시계**다(`:276` · §7 #9). ⚠ EL-033 과 같은 멱등키·제출 락 부재 |
| FS-077-EL-039 | FS-077-SEC-13 | 안내 발송 기록 표 | 표 | `<table>` 3열(발송 시각·창구·메모), caption '청구 안내 발송 기록'(`:604-640`). 시각은 `formatDateTime(notice.at)`(공용 포매터 — ERP-08). 비어 있으면 '아직 안내를 보내지 않았습니다.' | O | 행 액션 없음(EL-034 와 같은 이유). `lastNoticeAt`(`types.ts:138-140`)은 **이 화면이 소비하지 않는다**(§7 #17) |
| FS-077-EL-040 | FS-077-SEC-14 | 하단 '목록으로' 버튼 | 버튼 | 화면 맨 아래 우측 `variant="secondary"`(`:645-649`). `navigate(LIST_PATH)` | — | EL-017 과 **같은 일을 하는 두 번째 버튼**이다 |
| FS-077-EL-041 | FS-077-SEC-15 | 상세 조회 실패 대체 화면 | 배너 | 조회 실패 시 **화면 전체**를 danger `Alert` 로 대체한다(`:212-236`). `isNotFound(error)`(`http-error.ts:133`)로 갈린다: 404 → '청구를 찾을 수 없습니다. 이미 삭제되었을 수 있습니다.' + **'목록으로' 만** / 그 밖 → '청구를 불러오지 못했습니다.' + '다시 시도' + '목록으로' | O | 비표시. 근거 주석(`:212`): '삭제된 청구에 「다시 시도」는 영원히 실패한다'(EXC-12). 404 의 근원은 `getBilling`(`data-source.ts:109-114`)이 던지는 `HttpError(404)` |
| FS-077-EL-042 | FS-077-SEC-16 | 상세 로딩 카드 | 스켈레톤 | `billing === undefined` 면 `Card` 안 muted '불러오는 중…' 한 줄(`:238-246`) | — | 비표시. **스켈레톤이 아니라 문구 한 줄이다** — 실제 화면의 shape 를 흉내 내지 않는다(§7 #27). `aria-busy` 도 없다 |
| FS-077-EL-043 | FS-077-SEC-11~13 | **저장의 단일 경로 (commit)** | 텍스트 | `commit(next, message)`(`:189-210`): ① `serverError` 를 비운다 ② 이전 컨트롤러를 **abort** 하고 새 `AbortController` 를 건다 ③ `update.mutate({ id, input: toBillingInput(next), signal })` ④ 성공: `signal.aborted` 면 중단, 아니면 `detailQuery.refetch()` + `statusMessage` 설정 ⑤ 실패: `isAbort(cause)` 면 중단, 아니면 배너 | O | 비표시 규칙. 근거 주석(`:185-188`): 입금·안내·설정 세 동작이 각자 mutate 를 배선하면 성공/실패 처리와 abort 정리가 셋으로 갈라진다. **문서 전체 치환이다** — `toBillingInput`(`types.ts:348-363`)이 `id` 만 빼고 전부 보낸다. ⚠ **이전 요청을 abort 하므로 연속 커밋에서 앞선 저장이 조용히 버려진다**(EL-026·EL-027 의 한 글자마다 커밋과 결합하면 실제로 발생한다 — §7 #3) |
| FS-077-EL-044 | FS-077-SEC-10~12 | 입금 상태 파생 규칙 | 텍스트 | 이 화면 어디에도 `paymentState` 필드가 없다. 목록 배지(EL-010.9)·상세 배지(EL-020)·잔액(EL-023)·입력 비활성(EL-047)·기록 가드(EL-032)가 **전부 `billingPaymentState(billing)` 한 함수**에서 나온다(`types.ts:114-120`) | — | 비표시 규칙. **파생이면 갈라질 수 없다**(`:110-112`). 서버 계약에도 상태 필드를 두지 않아야 한다(§5) |
| FS-077-EL-045 | FS-077-SEC-12~13 | append-only 규칙 (되돌리는 전이의 부재) | 텍스트 | `applyPayment`·`applyNotice`(`types.ts:215-226`)가 **배열 끝에 덧붙이기만** 한다. 감액 엔트리는 `recordPaymentBlock` 의 `amount <= 0` 거절(`:186`)로 **만들 수 없다.** 입금 내역 표·안내 기록 표에 수정·삭제 액션이 없고(EL-034·EL-039), 상세에 삭제 버튼이 없다(`BillingDetailPage.tsx:6-7`) | — | 비표시 규칙(부재). 근거 `types.ts:51-55` · `BillingDetailPage.tsx:6-7`. **결과: 잘못 기록한 입금을 앱 안에서 고칠 방법이 전혀 없다**(§7 #10) |
| FS-077-EL-046 | FS-077-SEC-11~13 | 언마운트 abort | 텍스트 | `useEffect(() => () => controllerRef.current?.abort(), [])`(`:183`) | — | 비표시 규칙. abort 는 실패로 통지하지 않는다(`:205` `isAbort` → 즉시 return). ⚠ `onSuccess` 에는 `signal.aborted` 가드가 있다(`:199`) |
| FS-077-EL-047 | FS-077-SEC-11~13 | 필드 일괄 비활성 규칙 | 텍스트 | 방식·링크·비고·안내 창구·안내 메모 = `saving \|\| !canUpdate`. 입금 3필드 = `saving \|\| !canUpdate \|\| state === 'paid'`(`:447,465,478`) | — | 비표시 규칙. **입금완료 청구는 입금 입력이 잠긴다** — `PAYMENT_ALREADY_PAID` 와 같은 판정을 시각으로도 미리 준다. **비고·안내는 완료 후에도 열려 있다** — 세금계산서 발행 등 후속 기록이 남기 때문이다 |

## 4. 예외 명세

| 요소번호 | 빈 상태 | 로딩 | 실패 | 유효성 | 권한없음 | 경합 | 대량 |
|---|---|---|---|---|---|---|---|
| FS-077-EL-001 | 0건이면 '아직 받지 못한 금액은 0원입니다.' | '미수금을 세는 중입니다.'(`loaded === false`) | 조회 실패 시에도 `loaded === false` 라 같은 문구 — **실패를 「세는 중」 으로 위장한다**(§7 #28) | N/A — 표시 전용 | 권한과 무관하게 표시 | 재조회 중에는 이전 합계가 남는다(`items` 유지) | 전량 합산. `reduce` 1회 |
| FS-077-EL-002 | N/A — 정적 문구 | 로딩 중에도 표시(레일은 셸 밖) | 조회 실패에도 남는다 | N/A | 권한과 무관 | N/A — 정적 | 고정 문구 |
| FS-077-EL-003 | N/A — 정적 문구 | 로딩 중에도 표시 | 조회 실패에도 남는다 | N/A | 권한과 무관 | N/A | 고정 문구 |
| FS-077-EL-004 | N/A — 권한이 없어야 성립 | 로딩 중에도 표시 | 조회 실패에도 남는다 | N/A | **이것이 권한없음 표현** | 권한 스토어가 바뀌면 재렌더된다(`RequirePermission.tsx` 강등 reconcile) | 1건 |
| FS-077-EL-005 | N/A — 항상 한 값이 선택돼 있다(기본 `all`) | 로딩 중에도 조작 가능 — 클라이언트 필터라 즉시 반영된다 | 조회 실패 시에도 조작 가능하나 표가 없다 | `parseFilter` 가 목록 밖 값을 `all` 로 되돌린다(EL-005.1) | 권한과 무관 — 조회 축이다 | URL 이 단일 원천이라 뒤로 가기가 조건을 복원한다 | 선택지 4개 고정 |
| FS-077-EL-005.1 | N/A — 규칙 | N/A — 동기 판정 | N/A — 서버 호출 없음 | **이것이 유효성 규칙** | N/A | N/A — 순수 판정 | 값 4개 |
| FS-077-EL-005.2 | 0건이면 전부 `0` | **`null` → '—'** (0 으로 위장하지 않는다) | 실패도 `null` → '—' | N/A — 표시 전용 | 권한과 무관 | 재조회 중에는 이전 건수가 남는다 | 전량 1회 순회(`types.ts:320`) |
| FS-077-EL-006 | 초기값 `''` (URL `?q=` 가 있으면 그 값) | 로딩 중에도 입력 가능 | 조회 실패 시에도 입력 가능 | 형식 제약 없음. **`maxLength` 없음** | 권한과 무관 | 250ms 디바운스 뒤 URL 커밋. **조합 중에는 커밋하지 않는다** | 클라이언트 필터 — 전량 순회 |
| FS-077-EL-006.1 | 빈 키워드면 원본 그대로 반환 | N/A — 동기 | N/A — 서버 호출 없음 | 앞뒤 공백 제거 + 소문자화 | N/A | N/A — 순수 함수 | 3필드 × 전량. **비고·메모는 대상이 아니다**(§7 #16) |
| FS-077-EL-007 | 기본값과 같은 값은 URL 에서 지운다 | N/A — 규칙 | N/A | 손으로 고친 값은 EL-005.1 이 정규화 | N/A | `replace: true` 라 history 가 쌓이지 않는다 | `page`·`sort` 미소비(§7 #15) |
| FS-077-EL-008 | '조건에 맞는 청구 결과가 없습니다.' | **최초 로드 중에는 침묵** — 빈 문자열 | '청구 목록을 불러오지 못했습니다.' | N/A — 입력 없음 | 권한과 무관 | 재조회 중에는 이전 건수 문장이 유지된다 | 문장 1개 |
| FS-077-EL-009 | `전체 0건` | '불러오는 중…' | 조회 실패 시 EL-013 이 이 자리를 대체한다 | N/A | 권한과 무관 | 재조회 중 `aria-busy` + ' · 새로고침 중…' | N 은 필터·검색 후 건수 |
| FS-077-EL-010 | 0행이면 EL-012 | 최초 로드에만 스켈레톤(EL-011) | 조회 실패 시 EL-013 | N/A — 표시 전용 | **선택·액션 열이 어떤 역할에게도 없다**(`canUpdate=false` 고정) | 재조회 중 이전 행 유지 | **전량 렌더 — 페이지네이션 없음**(§7 #15) |
| FS-077-EL-010.1 | N/A — 행이 있어야 성립 | 스켈레톤에 덮인다 | N/A — 표시 전용 | N/A | **권한과 무관하게 링크가 산다** — 상세는 read 로 열린다 | 삭제된 청구의 링크는 404(EL-041)로 떨어진다 | 행마다 1개 |
| FS-077-EL-010.2 | `accountName === ''` 이면 '(이름 없음)' | 스켈레톤에 덮인다 | N/A | `isRegisteredAccount` 가 `accountId === ''` 를 미등록으로 판정 | 권한과 무관 | 거래처가 지워지면 링크가 깨진다 | 행마다 1개 |
| FS-077-EL-010.3 | `quoteId === ''` 이면 muted '—' | 스켈레톤에 덮인다 | N/A | N/A — 표시 전용 | 권한과 무관 | **견적이 지워지면 문자열은 남고 링크만 깨진다**(§7 #12) | 행마다 최대 1개 |
| FS-077-EL-010.4 | N/A — 언제나 값이 있다 | 스켈레톤 | N/A | `Record` 조회라 위반 값이 없다 | 권한과 무관 | 상세에서 방식을 바꾸면 다음 조회에 반영 | 값 2종 |
| FS-077-EL-010.5 | 0 이면 '0원' | 스켈레톤 | N/A | 스냅숏이라 재계산하지 않는다 | 권한과 무관 | **견적을 고쳐도 움직이지 않는다**(설계 — §1.1) | 우측 정렬 |
| FS-077-EL-010.6 | 입금이 없으면 '0원' | 스켈레톤 | N/A | 파생 — 위반 값이 없다 | 권한과 무관 | 입금 기록이 늘면 즉시 따라온다 | `reduce` 1회/행 |
| FS-077-EL-010.7 | 입금이 없으면 청구액 전부 | 스켈레톤 | N/A | **음수가 되지 않는다**(초과 입금 차단) | 권한과 무관 | 위와 동일 | 행마다 계산 |
| FS-077-EL-010.8 | 안내가 없으면 warning '미발송' | 스켈레톤 | N/A | `notices.length` 만 본다 | 권한과 무관 | 안내를 기록하면 즉시 `발송 N회` | 횟수만 — 창구는 목록에 없다 |
| FS-077-EL-010.9 | 입금이 없으면 '미입금' | 스켈레톤 | N/A | **3상태 전수 커버** — 파생이라 다른 값이 나올 수 없다 | 권한과 무관 | **저장하지 않으므로 상태와 잔액이 갈릴 수 없다**(§1.1) | 행마다 계산 |
| FS-077-EL-010.10 | 완납 전이면 muted '—' | 스켈레톤 | N/A | 파생 — `paidOnDate` 가 빈 문자열을 '아직'으로 쓴다 | 권한과 무관 | 완납되는 순간 그 입금의 날짜가 뜬다 | 행마다 선형 순회 |
| FS-077-EL-010.11 | N/A — 행이 있어야 성립 | 로딩 중에는 행이 없다 | N/A | N/A — 규칙 | **`rowTarget.kind === 'detail'` 이라 read 로 게이팅된다** — 조회 전용 역할도 상세로 간다 | 삭제된 청구를 누르면 EL-041 | 마우스 전용 — 키보드는 EL-010.1 |
| FS-077-EL-011 | N/A — 도착 전 상태 | **이것이 로딩 표현** | 조회 실패 시 EL-013 으로 바뀐다 | N/A | 권한과 무관 | **재조회에서는 뜨지 않는다**(`data !== undefined`) | 행 수는 DS `Table` 이 정한다 |
| FS-077-EL-012 | **이것이 빈 상태 표현** — 3분기 | 로딩 중에는 뜨지 않는다 | 조회 실패는 EL-013 이 담당 | N/A | 권한과 무관 | 필터를 바꾸면 문구가 갈린다 | **생성 CTA 를 넘기지 않는다**(이 화면에서 만들 수 없다) |
| FS-077-EL-013 | N/A — 실패 상태 | 재시도 시 배너가 사라지고 스켈레톤으로 | **이것이 조회 실패 표현.** 문구 1종 — 401/403/404/500 을 구분하지 않는다(§7 #13) | N/A | 라우트 read 권한 부족은 여기 오지 않는다 — `RequirePermission` 이 `<Outlet>` 밖에서 403 화면을 그린다(§4.1) | 재시도는 같은 조회를 재발행 | N/A — 표시 전용 |
| FS-077-EL-014 | 0건이면 빈 배열 | N/A — 동기 | N/A | 안정 정렬이 아니다(`Array.sort`) — 청구번호 tie-break 로 실질 결정적 | N/A | 쓰기 직후 저장소가 다시 정렬한다 | 전량 정렬 |
| FS-077-EL-015 | 어느 쪽이든 0건이면 EL-012 | N/A — `useMemo` 동기 | N/A | N/A — 순수 조합 | N/A | 의존성이 바뀔 때만 재계산 | 전량 2회 순회 |
| FS-077-EL-016 | N/A — 견적이 있어야 성립 | 견적 상세가 로딩 중이면 버튼이 없다(`quote === undefined`) | `createBillingFromQuote` 는 **동기 호출이라 실패 경로가 없다** — 실제 서버가 붙으면 이 자리에 실패 통지가 필요하다(§7 #29) | 표시 조건과 실행 가드가 같은 술어(EL-016.1) | **`canUpdate` 가 false 면 버튼이 없다**(`QuoteDetailPage.tsx:278`) | **멱등이라 두 번 눌러도 청구는 하나다**(EL-016.2) | 단건 |
| FS-077-EL-016.1 | N/A — 규칙 | N/A — 동기 | N/A | **이것이 유효성 규칙** — 사유 2종. 회귀 3건 | 이 술어는 권한을 보지 않는다 — 권한은 버튼 쪽 조건이다 | 화면이 쥔 `billingId` 가 낡으면 데이터소스가 한 번 더 막는다 | 상태 6종 전수 |
| FS-077-EL-016.2 | 청구가 없으면 새로 만든다 | N/A — 동기 조회 | N/A | N/A — 규칙 | N/A | **이것이 경합 방어.** 멱등키 = `quoteId` | 조회 1회 + 생성 1회 |
| FS-077-EL-016.3 | 견적에 품목이 없으면 `amount === 0` | N/A — 순수 | N/A | 승계 값을 검증하지 않는다 — 견적이 이미 검증됐다는 전제 | N/A | **스냅숏이라 이후 견적 변경과 무관** | 품목 수만큼 합산 |
| FS-077-EL-016.4 | `billNo === ''` 면 채번한다 | N/A — 동기 | N/A | 형식 검증 없음 — 만드는 쪽이 하나뿐이라 성립 | N/A | `seq` 는 모듈 지역 카운터 — **삭제해도 되돌아가지 않는다** | 단건 |
| FS-077-EL-016.5 | 청구가 없으면 이 링크 대신 EL-016 버튼 | 견적 로딩 중에는 없다 | N/A | N/A | 권한과 무관하게 링크는 산다 | 청구가 삭제되면 링크가 깨진다 | 최대 1개 |
| FS-077-EL-017 | N/A — 항상 표시 | 로딩 중에도 표시(카드 밖) | 조회 실패 시 EL-041 안의 '목록으로'가 대신한다 | N/A | 권한과 무관 | **이탈 가드가 없어 진행 중 입력이 그대로 사라진다**(§7 #21) | 1개 |
| FS-077-EL-018 | 초기값 `''` — 아무것도 읽지 않는다 | 로딩 중에는 마운트되지 않는다(조기 return) | 조회 실패 시에도 마운트되지 않는다 | N/A | 권한이 없으면 저장이 없어 영원히 빈 채 남는다 | 저장할 때마다 문구가 바뀐다 | ⚠ **같은 문구 연속 저장은 다시 읽히지 않는다**(§7 #22) |
| FS-077-EL-019 | N/A — 청구가 있어야 성립 | 로딩 중에는 없다 | 조회 실패 시 없다 | N/A | 권한과 무관 | 청구번호는 바뀌지 않는다 | 1개. **AppHeader h1 과 중복**(§7 #23) |
| FS-077-EL-020 | 입금이 없으면 '미입금' + 방식 | 로딩 중에는 없다 | 조회 실패 시 없다 | 파생 — 위반 값이 없다 | 권한과 무관 | 입금·방식 저장 후 refetch 로 갱신 | 배지 2개 |
| FS-077-EL-021 | N/A — 오류가 있어야 성립 | 재저장 시 먼저 지운다(`:191`) | **이것이 저장 실패 표현.** 문구 1종 · **참조 코드 없음**. abort 는 표시하지 않는다 | 서버 검증 오류를 필드로 되돌릴 경로가 없다 — 폼이 아니다(§7 #2) | 서버 403 도 이 문구로 뭉개진다 | **409(다른 사용자가 먼저 삭제)도 이 문구다** — 충돌 다이얼로그가 없다(§7 #6) | 1건만 표시 |
| FS-077-EL-022 | N/A — 권한이 없어야 성립 | 로딩 중에는 없다 | 조회 실패 시 없다 | N/A | **이것이 권한없음 표현** | 권한 스토어 변경 시 재렌더 | 1건 |
| FS-077-EL-023 | 입금 없음 → 입금액 0원·잔액=청구액·완납일 '—' | 로딩 중에는 EL-042 | 조회 실패 시 EL-041 | 파생값 4개는 위반 값이 없다 | 권한과 무관하게 전부 보인다 — **읽기 전용 역할도 숫자를 본다** | 저장 후 refetch 로 갱신 | 항목 7개 고정 |
| FS-077-EL-024 | N/A — 정적 문구 | 로딩 중에는 없다 | 조회 실패 시 없다 | N/A | 권한과 무관 | N/A | 고정 문구 |
| FS-077-EL-025 | N/A — 언제나 값이 있다 | `disabled={saving}` | 저장 실패는 EL-021. **select 는 이미 새 값을 보이지만 서버는 옛 값이다**(§7 #30) | `isBillingMethod` 타입가드가 목록 밖 값을 버린다 | `!canUpdate` 면 비활성(값은 보인다) | **저장 버튼이 없어 즉시 커밋된다** — 앞선 커밋은 abort 된다(EL-043) | 선택지 2개 |
| FS-077-EL-025.1 | N/A — 규칙 | N/A | 저장 실패 시 링크 삭제도 반영되지 않는다(전체 치환) | N/A — 규칙 | N/A | N/A | **확인을 묻지 않는 파괴적 부수효과**(§7 #24) |
| FS-077-EL-026 | 빈 값이면 placeholder 'https://' | `disabled={saving}` — **커밋 중에는 입력이 잠긴다** | 저장 실패는 EL-021 | **검증이 없다** — `type="url"` 은 `<form>` 밖이라 무력하고 zod 스키마도 없다(§7 #2) | `!canUpdate` 면 비활성 | ⚠⚠ **한 글자마다 커밋 + 값이 서버 값이라 입력이 사실상 불가능하다**(§7 #3) | 1개 |
| FS-077-EL-027 | 빈 값이면 placeholder | `disabled={saving}` | 저장 실패는 EL-021 | `maxLength=300` 만. 서버 검증 자리 없음(§7 #19) | `!canUpdate` 면 비활성 | ⚠ EL-026 과 같은 즉시 커밋(§7 #3) | 300자 상한. **카운터 없음** |
| FS-077-EL-028 | N/A — 정적 문구 | 로딩 중에는 없다 | 조회 실패 시 없다 | N/A | 권한과 무관하게 표시 | N/A | 고정 문구 |
| FS-077-EL-029 | 초기값 `'2026-07-21'` 고정(§7 #7) | `disabled={saving}` | 저장 실패해도 값이 남는다(로컬 state, 비우지 않는다) | `recordPaymentBlock` 의 `DATE_RE`(`types.ts:172`)가 `YYYY-MM-DD` 만 통과. 회귀 `billing.test.ts:127-130`. **달력 실재는 보지 않는다** — `2026-02-31` 통과 | `!canUpdate` 면 비활성 | 입금완료가 되면 잠긴다 | 1개 |
| FS-077-EL-030 | 초기값 `''` → 파싱 결과 0 → `PAYMENT_AMOUNT_POSITIVE` | `disabled={saving}` | ⚠ **저장 실패해도 비워진다**(`:267` 이 `commit` 밖 — §7 #25) | 정수·양수·잔액 이하 3중 판정(`types.ts:186-187`). 회귀 4건(`billing.test.ts:112-135`) | `!canUpdate` 면 비활성 | 입금완료면 잠긴다 + `PAYMENT_ALREADY_PAID` | **`maxLength` 없음** — 실질 상한은 잔액 |
| FS-077-EL-030.1 | 빈 문자열 → 0 | N/A — 동기 | N/A | **숫자 아닌 문자를 조용히 버린다** — `'12abc34'` → `1234` | N/A | N/A — 순수 | 문자열 길이만큼 |
| FS-077-EL-031 | 빈 값 허용 — 저장 시 `''` 로 들어간다 | `disabled={saving}` | ⚠ EL-030 과 같이 실패해도 비워진다(§7 #25) | `maxLength=60` 만. `trim()` 후 저장(`:263`) | `!canUpdate` 면 비활성 | 입금완료면 잠긴다 | 60자. **카운터 없음** |
| FS-077-EL-032 | **`amountInput === ''` 이면 뜨지 않는다** — 첫 진입에 번쩍이지 않는다 | 로딩 중에는 없다 | N/A — 로컬 판정 | **이것이 유효성 표현** — 사유 5종 중 해당 1건 | `!canUpdate` 면 아예 렌더되지 않는다 | 다른 탭의 입금은 반영되지 않는다(재조회 전) | 1건만 표시 — 첫 위반이 이긴다 |
| FS-077-EL-033 | N/A — 권한이 있어야 표시 | `loading={saving}` + 비활성 | 실패 시 EL-021 배너, 버튼 재활성, **입력은 이미 비워졌다**(§7 #25) | `paymentBlock !== null` 이면 비활성 — 사유는 EL-032 | **`!canUpdate` 면 렌더되지 않는다**(EXC-03) | ⚠⚠ **멱등키·제출 락 없음 + append-only** = 중복 통과 시 **입금 2건**(§7 #4·#5) | 단건. 문서 전체를 보낸다 |
| FS-077-EL-034 | '아직 입금 기록이 없습니다.' 한 행 | 로딩 중에는 없다 | 조회 실패 시 없다 | N/A — 표시 전용 | 권한과 무관하게 보인다 | 저장 후 refetch 로 갱신 | **전량 렌더 · 정렬 없음 · 행 액션 없음** |
| FS-077-EL-035 | 기본값 `'email'` | `disabled={saving}` | N/A — 로컬 state | `isNoticeChannel` 타입가드 | `!canUpdate` 면 비활성 | 로컬 state 라 재조회와 무관 | 선택지 4개 |
| FS-077-EL-036 | 빈 값 허용 | `disabled={saving}` | 실패해도 비워진다(`:282` — §7 #25) | `maxLength=60` 만 | `!canUpdate` 면 비활성 | 로컬 state | 60자 |
| FS-077-EL-037 | N/A — 개인결제창 + 링크 없음이어야 성립 | 로딩 중에는 없다 | N/A — 로컬 판정 | **이것이 유효성 표현** — 사유 1종 | `!canUpdate` 면 렌더되지 않는다 | 링크를 저장하면 사라진다 | 1건 |
| FS-077-EL-038 | N/A — 권한이 있어야 표시 | ⚠ **`loading` 을 주지 않는다** — 비활성만 된다(§7 #26) | 실패 시 EL-021 | `noticeBlock !== null` 이면 비활성 | **`!canUpdate` 면 렌더되지 않는다** | EL-033 과 같은 멱등키·락 부재 — **안내가 2건 쌓인다** | 단건 |
| FS-077-EL-039 | '아직 안내를 보내지 않았습니다.' 한 행 | 로딩 중에는 없다 | 조회 실패 시 없다 | N/A | 권한과 무관하게 보인다 | 저장 후 refetch | 전량 렌더 · 행 액션 없음 |
| FS-077-EL-040 | N/A — 항상 표시 | 로딩 중에는 없다(카드만 뜬다) | 조회 실패 시 EL-041 안의 버튼이 대신한다 | N/A | 권한과 무관 | EL-017 과 동일 | EL-017 과 **중복**(§7 #31) |
| FS-077-EL-041 | N/A — 실패 상태 | 재시도 시 EL-042 로 바뀐다 | **이것이 조회 실패 표현.** 404 와 그 밖을 가른다 — 404 에는 '다시 시도'를 **주지 않는다** | N/A | 라우트 read 권한 부족은 여기 오지 않는다(§4.1) | 다른 관리자가 지운 청구를 열면 404 | N/A — 표시 전용 |
| FS-077-EL-042 | N/A — 도착 전 상태 | **이것이 로딩 표현** — 문구 1줄 | 조회 실패 시 EL-041 로 바뀐다 | N/A | 권한과 무관 | 재조회 중에는 뜨지 않는다(`billing !== undefined`) | **shape 를 흉내 내지 않는다**(§7 #27) |
| FS-077-EL-043 | N/A — 규칙 | `saving` 이 이 규칙의 출력 | 실패는 EL-021 · abort 는 무통지 | N/A — 검증은 술어가 한다 | `id === undefined` 면 즉시 return(`:190`) | ⚠ **연속 커밋에서 앞선 요청을 abort 한다** — 마지막만 살아남는다 | 문서 전체 치환(12필드) |
| FS-077-EL-044 | 입금이 없으면 `unpaid` | N/A — 동기 파생 | N/A | 3상태 외 값이 나올 수 없다 | N/A | **저장하지 않으므로 갈릴 수 없다** | 호출마다 `reduce` |
| FS-077-EL-045 | N/A — 규칙(부재) | N/A | N/A | `amount <= 0` 거절로 감액 엔트리를 봉쇄 | N/A | append 라 두 사람의 기록이 **원리상** 충돌하지 않는다 — 다만 전체 치환 저장이 그것을 깬다(§7 #6) | **되돌리는 경로 0건**(§7 #10) |
| FS-077-EL-046 | N/A — 진행 요청이 있어야 성립 | 이것이 취소 규칙 | **abort 는 실패가 아니다**(`isAbort` → return) | N/A | N/A | 이탈 시 진행 중 저장 취소 — **서버 도달 여부는 보장하지 않는다** | 단건 |
| FS-077-EL-047 | N/A — 규칙 | `saving` 이 입력 | N/A | `state === 'paid'` 가 입력 | `!canUpdate` 가 입력 | 재조회로 `state` 가 바뀌면 잠금도 바뀐다 | 컨트롤 8개 일괄 |

### 4.1 공통 예외 규칙

| 규칙 | 내용 |
|---|---|
| 네트워크 단절 | 목록 조회 실패는 표를 대체하는 인라인 배너(EL-013), 상세 조회 실패는 화면 전체 대체(EL-041), 저장 실패는 카드 밖 배너(EL-021). **오프라인 감지·복귀 재조회가 앱 전역에 없다**(`navigator.onLine` grep 0건) — §7 #20 |
| 세션 만료 | 401 은 **앱 전역 인터셉터**(`shared/query/queryClient.ts:60-66` 의 `QueryCache`/`MutationCache` `onError` → `handleQueryLayerError` → `notifySessionExpired()`)가 받고 `RequireAuth` 가 `/login?returnUrl=…&reason=session_expired` 로 보낸다. **입력한 입금액·메모는 그때 사라진다** — 로컬 state 이고 이탈 가드도 없다(§7 #21) |
| 요청 타임아웃 | 프론트 상한 없음(`AbortSignal.timeout` 앱 전역 0건). abort 는 **언마운트(EL-046)와 다음 커밋(EL-043 ②)** 에서만 발생한다 — §7 #20 |
| 중복 제출 | 두 기록 버튼은 `disabled={saving}` 만 갖는다. **동기 제출 락(`useSubmitLock` 같은 ref 잠금)이 없고 멱등키도 없다** — `UpdateVars.idempotencyKey`(`crud.ts:344`)와 어댑터의 재생 원장(`crud.ts:246-247` `ledger.isReplay`)이 **이미 존재하는데 이 화면이 쓰지 않는다.** 형제 화면은 쓴다(`pages/members/components/PointsCard.tsx`). 완화가 **없다**: 저장이 전체 치환이라 방식·비고·링크는 두 번 실행돼도 결과가 같지만, **입금·안내는 append 라 두 건이 쌓이고 되돌릴 수 없다**(quality-bar EXC-08 P0 — §7 #4) |
| 실패 통지의 자리 | ① 목록 조회 실패 = 표를 대체하는 배너 ② 상세 조회 실패 = 화면 대체 배너(404 분기) ③ 저장 실패 = 카드 밖 danger 배너(참조 코드 없음) ④ 저장 **성공** = **토스트가 아니라 시각 숨김 live region 한 줄**(EL-018) ⑤ 규칙 위반 = 버튼 옆 warning `Alert`(EL-032·EL-037) ⑥ abort = 아무것도 띄우지 않는다. **이 화면에 `useToast` 소비가 0건이다** — 성공을 시각으로 알리는 자리가 없다(§7 #22) |
| 낙관적 업데이트 | **이 화면에 없다.** 저장은 비관적(응답 후 `refetch`)이다 — 롤백 경로가 필요 없다. 다만 EL-025 의 select 는 브라우저가 즉시 새 값을 보이므로 실패 시 화면과 서버가 갈린다(§7 #30) |
| 동시 조회 | 목록은 `useCrudListQuery(BILLING_RESOURCE, billingAdapter)`, 상세는 `useQuery({ queryKey: [BILLING_RESOURCE, 'detail', billingId] })`(`:163-167`). 전역 기본을 따른다 — `staleTime` 30초(`queryClient.ts:70`) · `retry: false`(`:82`) · `refetchOnWindowFocus: false`(`:90`). 저장 성공 시 `useCrudUpdate` 가 목록·상세 키를 **둘 다 invalidate** 하고(`crud.ts:357-358`) 화면이 `refetch()` 를 한 번 더 부른다(`:201`) — **중복이다**(§7 #32) |
| 권한 없음 | **read** — `RequirePermission` 이 AppShell `<Outlet>` 을 감싸 권한 없는 deep-link 에 `ForbiddenScreen` 을 렌더한다. 리소스는 라우트에서 파생된다(`route-resource.ts` → `page:/sales/billing`). **write** — `useRouteWritePermissions().canUpdate` 를 **목록과 상세가 모두** 소비한다: 목록은 안내문 한 줄(EL-004), 상세는 **기록 버튼 2개를 렌더하지 않고**(EL-033·EL-038) 모든 입력을 비활성화한다(EL-047). 목록의 표는 원래 `canUpdate=false` 로 고정돼 있어 권한과 무관하게 선택·액션 열이 없다 |
| 렌더 예외 | AppShell 이 `<Outlet>` 바로 바깥에 `ErrorBoundary` 를 둔다(`AppShell.tsx:395-400`) — 화면이 던져도 사이드바·헤더가 남고 `RouteErrorScreen` 이 뜬다. ⚠ **`applyPayment`/`applyNotice` 가 던지는 `Error`(`types.ts:217,224`)가 여기로 떨어진다** — 술어가 먼저 걸러 주므로 도달하면 버그다 |
| 행 선택의 수명 | N/A — **이 목록에 선택이 없다.** `CrudReadListShell` 이 `NO_SELECTION`(빈 Set)과 no-op 콜백을 넘긴다(`CrudReadListShell.tsx:87-90,130-133`) — 그래서 형제 목록의 '필터를 바꿔도 선택이 남는' 결함(FS-050-EL-014)이 **구조적으로 발생하지 않는다** |
| 상태 전이 규칙 | 입금 상태는 **전이하지 않는다 — 파생된다**(EL-044). 청구 방식만 사람이 바꾸며 두 값 사이 자유 전환이고(EL-025) 계좌이체로 되돌리면 링크가 지워진다(EL-025.1). **되돌리는 전이는 어디에도 없다**(EL-045) |
| 프론트 검증은 보증이 아니다 | 이 화면의 검증은 zod 가 아니라 `types.ts` 의 순수 술어 3종이다(§7 #2). 서버가 같은 규칙을 다시 검증해야 한다 — `data-source.ts:164-166` 의 심이 그 자리를 예고한다(BE-077 영역) |

## 5. 서버 연동 지점

| 요소번호 | 이름 | 읽기/쓰기 | 필요 데이터 | 프론트 어댑터 (data-source.ts) | 비고 |
|---|---|---|---|---|---|
| FS-077-EL-001 / EL-005.2 / EL-010~015 | 청구 목록 조회 | R | `Billing[]` 전량 (기록 배열 포함) | `billingAdapter.fetchAll` ← `createStoreAdapter({ list: listBillings })`(`:105-107,167-174`) · 화면은 `useCrudListQuery(BILLING_RESOURCE, billingAdapter)`(`BillingListPage.tsx:109`) | **서버 페이지네이션·정렬·검색이 없다** — 전량을 받아 클라이언트가 거른다. **입금 상태·잔액·미수금 합계를 서버가 주지 않는다** — 전부 `payments` 배열에서 파생한다(EL-044). 응답에 상태 필드를 넣으면 §1.1 이 깨진다 |
| FS-077-EL-019 / EL-023 / EL-034 / EL-039 / EL-041 / EL-042 | 청구 상세 조회 | R | `Billing` 1건 | `billingAdapter.fetchOne(billingId, signal)`(`BillingDetailPage.tsx:165`) ← `getBilling`(`:109-114`) | **없는 id 에 `HttpError(404)`** 를 던진다 — 화면이 그것으로 404/그 밖을 가른다(EL-041). `queryKey: [BILLING_RESOURCE, 'detail', billingId]` |
| FS-077-EL-025 / EL-025.1 / EL-026 / EL-027 / EL-033 / EL-038 / EL-043 | 청구 저장 (입금·안내·설정 **한 통로**) | W | `BillingInput` 전체(12필드 — `types.ts:348-363`) | `billingAdapter.update(id, input, { signal })` ← `updateBilling`(`:120-128`) · 화면은 `useCrudUpdate(BILLING_RESOURCE, billingAdapter)`(`BillingDetailPage.tsx:170`) | **문서 전체 치환**(`{ ...billing, ...input, id }`). 없는 id 면 `HttpError(409)` '다른 사용자가 먼저 삭제한 청구입니다.'(`:122-124` — 유령 저장 방지). ⚠ **`idempotencyKey` 를 넘기지 않는다**(자리는 `crud.ts:344` 에 있다). ⚠ **낙관적 동시성 토큰이 없다** — 두 관리자의 입금 기록이 서로를 덮는다(§7 #6). 서버 계약 자리 `data-source.ts:164-166`: `GET /api/sales/billing` · `GET/PUT /api/sales/billing/:id` · `POST /:id/payments` · `POST /:id/notices` — **심이 이미 입금·안내를 별도 엔드포인트로 예고한다**(전체 치환이 아니라 append 로) |
| FS-077-EL-016 / EL-016.2 / EL-016.3 / EL-016.4 | 견적 → 청구 생성 | W | `Quote` + 청구일 | `createBillingFromQuote(quote, issuedAt)`(`:153-159`) — **어댑터를 거치지 않는 동기 함수** | ⚠ **이 앱에서 유일하게 react-query 밖에 있는 쓰기다.** 지연·실패 재현·abort·로딩 상태가 전혀 없다(`fixtureRequest` 를 타지 않는다). 호출부가 목록 캐시를 손으로 무효화한다(`QuoteDetailPage.tsx:185-186`). 서버 계약 자리 `data-source.ts:151-152`: `POST /api/sales/quotes/:id/billing` — '서버가 견적 상태 확인 + 청구 생성 + 역링크를 한 트랜잭션으로 처리하고, 이미 청구된 견적이면 409 로 거절한다' |
| FS-077-EL-016 / EL-016.2 / EL-016.5 | 견적 → 청구 역방향 조회 | R | `quoteId` → `billingId` | `findBillingIdByQuote(quoteId)`(`:142-145`) — **동기**. 호출부 `QuoteDetailPage.tsx:171` | ⚠ **렌더 중에 모듈 지역 배열을 직접 읽는다.** 백엔드가 붙으면 동기 계약이 성립하지 않는다 — 그때 이 값은 견적 상세 응답에 `billingId` 로 실려 와야 한다(§7 #29). 없으면 `''`(`AccountRef.accountId` 와 같은 규약 — `:139-140`) |

> **현재 구현 상태 (백엔드 명세 참고)**: 백엔드는 없다. 저장소는 **모듈 지역 변수 `billings`(3건 시드) + `seq`**(`data-source.ts:93-94`)이고, `createStoreAdapter`(`shared/crud/crud.ts`)가 그 위에 400ms 지연(`LATENCY_MS`)·개발용 실패 스위치(`?fail=…`, 스코프 `'sales-billing'`)·**멱등 재생 원장**(`crud.ts:230-234,246-247`)을 얹는다 — 실제 네트워크 0건. 새로고침하면 시드로 되돌아간다. 시드의 `bl-1.quoteId = 'qt-2'` 는 견적 저장소의 실제 견적을 가리킨다(`:19-22` 가 그 이유를 적는다: '이름만 같고 연결이 없는 행이 하나라도 있으면 청구 상세의 「원 견적」 링크가 조용히 죽는다'). **`createCrudAdapter` 가 아니라 저장소 + `createStoreAdapter` 인 이유**가 파일 머리말에 있다(`:6-8`): 견적 상세가 '이 견적에 이미 청구가 있는가' 를 **동기로** 물어야 하는데 `createCrudAdapter` 는 목록을 클로저에 가둬 비동기로만 내준다.
>
> **TODO(backend) 심은 정확히 2곳이다** — ① `data-source.ts:151-152`(견적 → 청구 생성) ② `data-source.ts:164-166`(목록·상세·입금·안내 4엔드포인트). ②가 **입금과 안내를 각각 `POST` 로 예고한다는 점이 지금 구현과 다르다** — 지금은 셋 다 `PUT` 문서 전체 치환이다. BE-077 이 이 갈림을 명시해야 한다.

## 6. 자기 점검 (제출 전 확인)

- [x] 구현 소스를 전수 대조했다 — `BillingListPage.tsx`(260행) · `BillingDetailPage.tsx`(652행) · `types.ts`(397행) · `data-source.ts`(174행) · `billing.test.ts`(312행) · 진입점 `../quotes/QuoteDetailPage.tsx` · `../quotes/types.ts`(`isOrderedQuote`·`computeTotals`) · 소비하는 공용 모듈(`shared/crud/{CrudReadListShell,CrudTable,DetailCellLink,rowTarget,crud,useListState,useDebouncedSearch,parseFilter}` · `shared/ui/FilterPanel` · `pages/sales/_shared/{business,AccountLink,account-reference}`)
- [x] **`pages/sales/billing/validation.ts` 가 존재하지 않음을 확인**했다(`ls` — 5파일뿐). 이 화면의 검증 정본은 zod 가 아니라 `types.ts` 의 순수 술어 3종(`billingCreateBlock`·`recordPaymentBlock`·`sendNoticeBlock`)이며 §3·§7 #2 에 그렇게 적었다
- [x] **입금 상태가 저장되지 않는 파생값임을 코드로 확인**했다(`Billing` 인터페이스(`types.ts:66-89`)에 상태 필드가 없다 · `billingPaymentState` 가 매 호출 계산 · 상세에 상태 select 가 없다). §1.1 · EL-010.9 · EL-020 · EL-044 · §5 에 명시했다
- [x] **되돌리는 전이가 없음을 코드로 확인**했다(`applyPayment`/`applyNotice` 가 spread-append 뿐 · `recordPaymentBlock` 이 `amount <= 0` 을 거절 · 두 표에 행 액션 0건 · 상세에 삭제 버튼 0건). EL-045 · §7 #10
- [x] **등록 진입점이 이 화면 밖임을 코드로 확인**했다(`BillingListPage` 에 '등록' 문자열 0건 · `createBillingFromQuote` 의 유일한 호출부가 `QuoteDetailPage.tsx:183`). SEC-06 · EL-016 계열에 번호를 줬다
- [x] 보이지 않는 요소(스켈레톤·빈 상태·조회/저장 실패 배너·읽기 전용 안내·차단 사유 경고·라이브 리전·정렬/필터/검색 규칙·URL 직렬화·저장 단일 경로·파생 규칙·append-only 규칙·abort·일괄 비활성)에 번호를 줬다
- [x] §4 예외 7축 빈칸 0건. 모든 `N/A` 에 사유
- [x] `[서버]` = O 요소가 §5 에 전부 요약됐다 — **조회 2건 · 쓰기 2건 · 동기 역조회 1건**이며, 그중 **둘(생성·역조회)이 react-query 밖에 있다**는 사실을 명시했다
- [x] 엔드포인트·HTTP·에러코드·DB 스키마를 쓰지 않았다 (BE-077 영역). 다만 `data-source.ts` 의 TODO 심이 예고하는 **모양의 갈림**(PUT 전체 치환 vs POST append)은 §5 각주에 사실로 남겼다
- [x] §7 의 미결 항목을 BE-077 · NFR-077 이 아직 존재하지 않는다는 사실과 함께 기록했다(§7 #33)

## 7. 미결 사항 (UI 기획 / 아키텍처 / 백엔드 명세 / 프론트 구현 이관)

| # | 내용 | 이관 대상 |
|---|---|---|
| 1 | 대응 SCR 문서 부재 (영업 관리 SCR 미작성) | UI 기획 / 아키텍처 |
| 2 | **이 화면에 zod 스키마가 없다** — `pages/sales/billing/validation.ts` 가 실재하지 않는다(형제 화면 `quotes`·`settings/payment` 는 갖는다). 검증은 `types.ts` 의 순수 술어 3종이 전부이고, 그것은 **입금·안내·생성 세 동작만** 덮는다. **덮지 않는 것**: 개인결제창 링크 형식(EL-026) · 비고/메모 길이(브라우저 `maxLength` 뿐) · 입금액 상한. 서버가 붙을 때 프론트 계약 검증의 정본이 될 파일이 없다 | 프론트 구현 · 백엔드 명세 |
| 3 | ⚠⚠ **개인결제창 링크와 비고가 「한 글자마다 저장 요청」 이다** — `onChange` 가 곧바로 `commit` 을 부르고(`BillingDetailPage.tsx:409-414,422`), 입력의 `value` 는 폼 state 가 아니라 **서버 데이터 `billing.paymentLinkUrl`/`billing.note`** 다. 즉 ① 타이핑 → 요청 발사 ② 다음 커밋이 **앞선 요청을 abort**(EL-043 ②) ③ 화면 값은 refetch 가 끝나야 갱신 — **사실상 입력이 불가능하고, 400ms 지연 픽스처에서 그것이 그대로 드러난다.** 형제 화면들은 RHF 로 폼 state 를 들고 저장 버튼에서 한 번 보낸다. **이 화면 최대 결함** | **UI 기획 쪽 변경 요청 (최우선)** · 프론트 구현 |
| 4 | ⚠⚠ **입금·안내 기록에 멱등키가 없다.** `commit` 이 `update.mutate({ id, input, signal })` 만 넘기고 `idempotencyKey` 를 주지 않는다(`:196`) — **자리는 이미 있다**(`UpdateVars.idempotencyKey` — `crud.ts:344`, 어댑터의 재생 원장 `crud.ts:246`). 다른 쓰기(방식·링크·비고)는 전체 치환이라 두 번 실행돼도 결과가 같지만 **입금과 안내는 append 라 두 건이 쌓이고, 그것을 지울 수단이 앱에 없다**(#10). 응답 유실 후 재시도가 곧 이중 입금이다 | **백엔드 명세 (BE-077) · 프론트 구현 (최우선)** (quality-bar EXC-08 P0) |
| 5 | **동기 제출 락이 없다** — `disabled={saving}` 만이라 클릭과 리렌더 사이 틈으로 두 번째 클릭이 통과한다. 앱에 선례가 둘 있다(`pages/settings/_shared/queries.ts:58-75` `useSubmitLock` · 로그인 화면의 `submitLockRef`). #4 와 결합하면 **연타 한 번이 입금 2건**이다 | 프론트 구현 (quality-bar EXC-08 P0) |
| 6 | **낙관적 동시성이 없다** — `updateBilling`(`data-source.ts:120-128`)은 **존재 여부만** 검사하고(없으면 409), 있으면 `{ ...billing, ...input, id }` 로 **문서를 통째로 덮는다.** 두 관리자가 같은 청구를 열어 각각 입금을 기록하면 나중 저장이 **앞선 사람의 `payments` 배열을 통째로 되돌린다** — append-only 규칙이 저장 층에서 깨진다. 형제 섹션은 revision 토큰을 쓴다(`pages/settings/_shared/store.ts:143-146`). 서버 심(`data-source.ts:165`)이 예고하는 `POST /:id/payments` 형태로 가면 이 문제가 구조적으로 사라진다 | **백엔드 명세 (BE-077) · 아키텍처** (quality-bar EXC-04 P0) |
| 7 | **입금일 기본값이 하드코딩된 과거 날짜다** — `TODAY = '2026-07-21'`(`:74`). 스토리·회귀의 결정성을 위한 것이라고 코드가 밝히지만(`:73`), 그 대가로 **운영자가 매번 날짜를 고쳐야 하고 안 고치면 잘못된 입금일이 기록된다.** 결정성은 주입(시계 provider)으로 얻을 수 있다 | 프론트 구현 |
| 8 | **기록의 id 를 클라이언트가 만든다** — `bp-${Date.now()}` · `bn-${Date.now()}`(`:260,275`). 같은 밀리초에 두 번 기록하면 키가 충돌하고(React `key` 중복), 서버가 붙으면 이 id 는 무의미해진다 | 백엔드 명세 · 프론트 구현 |
| 9 | **안내 발송 시각이 클라이언트 시계다** — `new Date().toISOString()`(`:276`). 감사 성격의 기록인데 사용자의 시계를 신뢰한다. 입금일(`paidOn`)은 사람이 통장을 보고 적는 값이라 다르지만, 발송 시각은 서버가 찍어야 한다 | 백엔드 명세 (BE-077) |
| 10 | **잘못 기록한 입금을 고칠 방법이 앱에 전혀 없다** — 이것은 **의도된 설계**다(`types.ts:51-55`: 되돌리는 문을 열면 그것이 곧 '입금 취소' 버튼이 된다). 다만 회계의 정석인 **반대 부호 기록(감액 엔트리)** 도 함께 막혀 있어(`amount <= 0` 거절), 실수의 유일한 복구가 '데이터베이스를 직접 고친다' 다. 언제 그 문을 열지가 미정 | 아키텍처 (도메인) · UI 기획 |
| 11 | **소비자 0건인 삭제 경로** — `removeBilling`(`data-source.ts:130-135`)과 어댑터의 `remove` 가 있으나 목록·상세 어디에도 호출부가 없다(`CrudReadListShell` 은 삭제를 그리지 않는다). 죽은 표면은 다음 사람에게 '여기 삭제가 있다'고 잘못 말한다 | 프론트 구현 (정리) |
| 12 | **'견적 없이 만든 청구' 를 만들 경로가 없는데 화면이 그 경우를 그린다** — 시드 2건(`bl-2`·`bl-3`)의 `quoteId` 가 `''` 라 목록은 '—'(EL-010.3), 상세는 '견적 없이 만든 청구입니다.'(`:342`)를 보인다. 그러나 **청구를 만드는 유일한 경로가 견적 상세**라 실제로는 발생할 수 없다. 픽스처가 존재하지 않는 상태를 가르치고 있거나, 아니면 '견적 없는 직접 청구' 기능이 빠진 것이다 — 어느 쪽인지 미확인 | UI 기획 쪽 확인 요청 |
| 13 | **실패가 status 를 구분하지 않는다** — 저장 실패(EL-021)가 400/403/409/422/500 을 한 문구로 뭉갠다. **특히 409 를 뭉갠다** — `updateBilling` 이 '다른 사용자가 먼저 삭제한 청구입니다.' 라는 **정확한 문장을 이미 들고 오는데**(`data-source.ts:123`) 화면이 그것을 버리고 자기 문구를 쓴다(`:206`). `isConflict`(`http-error.ts:141`)·`referenceOf`(`:151`)가 이미 있다. 목록 조회 실패(EL-013)도 마찬가지 | UI 기획 쪽 변경 요청 (quality-bar EXC-06 · EXC-20 P1) |
| 14 | **입금액 입력에 상한·`maxLength` 가 없다** — `type="text" inputMode="numeric"` 이고 `digitsToNumber` 가 숫자만 남긴다. 실질 상한은 `PAYMENT_OVER_OUTSTANDING` 뿐이라 잔액 이하는 무엇이든 통과한다. 또 `digitsToNumber` 가 `'12abc34'` 를 **조용히** `1234` 로 읽는다 — 사용자는 자기가 무엇을 저장했는지 화면에서 확인할 수 없다(입력 원문이 그대로 남는다) | UI 기획 쪽 변경 요청 |
| 15 | **목록에 페이지네이션·정렬 UI 가 없다** — 전량 렌더이고 `useListState` 의 `page`·`sort` 를 소비하지 않는다. 정렬은 청구일 내림차순 고정(EL-014)이라 **고액 미수 순·완납 임박 순으로 훑을 수 없다.** 청구는 시간이 갈수록 단조 증가하는 회계 기록이라 이 화면이 가장 먼저 커진다 | UI 기획 쪽 변경 요청 |
| 16 | **검색이 비고·입금자명 메모를 보지 않는다**(`types.ts:329-338`) — 통장 표기가 주문자와 다를 때 `memo` 가 '유일한 단서' 라고 코드가 적어 두었는데(`:62`), 그 단서로 검색할 수 없다. EL-002 의 안내문도 **견적 목록으로 가는 링크가 아니라 문장**이라 '청구를 만들려면' 사이드바로 나가야 한다 | UI 기획 쪽 변경 요청 |
| 17 | **`lastNoticeAt`(`types.ts:138-140`)의 화면 소비가 0건이다** — 회귀 테스트(`billing.test.ts:185`)만 부른다. 목록의 안내 열은 **횟수만** 보이고 '언제 마지막으로 안내했는가' 를 말하지 않는다 — 미입금 독촉의 판단 근거가 바로 그 값이다 | 프론트 구현 · UI 기획 |
| 18 | **이 라우트의 e2e 커버리지가 0이다** — `e2e/` 의 스펙은 dashboard · login · quality-bar · users · support · ai · throwaway 뿐이다. `billing.test.ts` 312행은 **전부 순수 함수 회귀**이고 화면 조립(즉시 커밋·권한 게이팅·404 분기·live region)을 검증하는 테스트가 **한 건도 없다** | 프론트 구현 · 명세 리뷰 |
| 19 | **길이 제한이 `maxLength` 로만 강제된다** — `BILLING_NOTE_MAX`(300)·`BILLING_MEMO_MAX`(60)가 zod 를 거치지 않아 붙여넣기는 브라우저가 자르고 서버 재검증 자리가 없다. **카운터도 없다**(`CountedInput` 선례가 `pages/settings/site` 에 있다) | 프론트 구현 (quality-bar COMP-12) |
| 20 | 프론트 타임아웃 상한 없음(`AbortSignal.timeout` 0건) · 오프라인 감지 없음(`navigator.onLine` 0건) · 세션 만료 리다이렉트가 입력을 버린다 | UI 기획 · 프론트 구현 (quality-bar EXC-05 · EXC-11 · EXC-19 P1) |
| 21 | **미저장 이탈 가드가 없다** — `useUnsavedChangesDialog` 소비 0건. 입금액·메모·안내 메모를 친 뒤 '목록으로'(EL-017·EL-040)를 누르면 아무 확인 없이 사라진다. 다만 이 화면은 즉시 커밋 모델이라 **dirty 라는 개념 자체가 없어** 형제 폼 화면의 가드를 그대로 옮길 수 없다 — #3 을 폼 모델로 고치면 함께 해결된다 | UI 기획 쪽 변경 요청 |
| 22 | **저장 성공을 시각으로 알리는 자리가 없다** — 이 화면에 `useToast` 소비가 **0건**이고, 성공 통지는 시각 숨김 live region(EL-018) 한 줄뿐이다. 시각 사용자는 표에 행이 늘어난 것으로만 성공을 안다. 게다가 `setStatusMessage(message)` 는 **같은 문구를 두 번 넣으면 state 가 바뀌지 않아 다시 읽히지 않는다** — 입금을 연속 두 번 기록하면 두 번째는 스크린리더도 침묵한다 | UI 기획 쪽 변경 요청 (A11Y) |
| 23 | **`<h1>` 이 둘이다** — 상세의 `<h1>청구 BL-…`(`:316`)와 AppHeader 의 `<h1>`(nav 잎 '청구·입금'). 형제 상세 화면들과 같은 구조적 결함이다(quality-bar IA-02) | UI 기획 쪽 변경 요청 |
| 24 | **청구 방식을 계좌이체로 되돌리면 보관하던 링크가 확인 없이 지워진다**(EL-025.1). 되돌릴 수 없는 파괴적 부수효과인데 select 조작 한 번으로 즉시 일어난다. 사유는 타당하나(`:286`) **알리지 않는다** | UI 기획 쪽 변경 요청 |
| 25 | **저장 실패해도 입력이 비워진다** — `setAmountInput('')`·`setMemo('')`(`:267-268`)와 `setNoticeMemo('')`(`:282`)가 `commit` **밖**에서, 즉 요청 결과를 기다리지 않고 실행된다. 저장이 실패하면 사용자는 배너만 보고 방금 친 금액·입금자명을 **다시 입력해야 한다** | 프론트 구현 |
| 26 | **두 기록 버튼의 진행 표시가 갈린다** — 입금 버튼은 `loading={saving}`(`:494`), 안내 버튼은 **주지 않는다**(`:594-597`) — 비활성만 된다. 같은 카드 구조의 두 버튼이 다른 계약을 갖는다 | 프론트 구현 (quality-bar COMP-01) |
| 27 | **상세 로딩이 스켈레톤이 아니라 문구 한 줄이다**(EL-042 — `:238-246`). `aria-busy` 도 없다. 실제 화면은 카드 4장·표 2개인데 로딩은 '불러오는 중…' 한 줄이라 shape 가 전혀 다르다 | UI 기획 쪽 변경 요청 (quality-bar COMP-06) |
| 28 | **미수금 안내문이 실패를 「세는 중」 으로 위장한다** — `loaded = !firstLoading && error === null`(`:116`)이라 조회 실패에도 '미수금을 세는 중입니다.' 가 남는다(EL-001). 필터 배지는 같은 상황에서 '—' 로 **모름을 정직하게 말하는데**(EL-005.2) 이 문장만 그러지 않는다 | 프론트 구현 |
| 29 | **청구 생성과 역조회가 react-query 밖의 동기 호출이다**(§5). 백엔드가 붙으면 `findBillingIdByQuote` 의 동기 계약이 성립하지 않고, `createBillingFromQuote` 에는 로딩·실패·중복 클릭 방어가 **전부 새로 필요하다.** 지금은 그 자리들이 비어 있다 | **아키텍처 · 백엔드 명세 (BE-077)** |
| 30 | **청구 방식 select 가 낙관적으로 보인다** — 브라우저가 새 값을 즉시 그리는데 저장이 실패하면 되돌리지 않는다(`value={billing.method}` 지만 리렌더 전까지 DOM 값이 앞선다). 실패 배너와 select 값이 서로 다른 말을 하는 순간이 생긴다 | 프론트 구현 |
| 31 | **'목록으로' 버튼이 한 화면에 둘이다**(EL-017 상단 · EL-040 하단). 같은 일을 하는 두 컨트롤이라 스크린리더 사용자는 같은 이름을 두 번 만난다 | UI 기획 쪽 확인 요청 |
| 32 | **저장 성공 시 상세를 두 번 재조회한다** — `useCrudUpdate` 의 `onSuccess` 가 목록·상세 키를 invalidate 하고(`crud.ts:357-358`) 화면이 `detailQuery.refetch()`(`:201`)를 한 번 더 부른다. 400ms 지연 픽스처에서 요청이 두 번 나간다 | 프론트 구현 (정리) |
| 33 | **BE-077 · NFR-077 이 없다.** 이 문서가 이 번호대의 첫 문서이고, `specs/README.md` §2 번호대 표(현재 060–063 · 067–070 까지)와 §3 화면 색인에 **070 번대 이후가 없다** — 청구·입금(077)·결제 설정(078)·플랜(079)이 색인에 실려 있지 않다. 색인 갱신은 다른 소유자의 일이라 이 배치에서 손대지 않았다 | 명세 리뷰 (색인 갱신) · 백엔드 명세 |
</content>
</invoke>
