---
id: FS-073
title: "상품 문의 (목록·상세 답변·견적 발행)"
screen: SCR-073               # ⚠ 상품 관리 SCR 미작성 — §7 미결 사항 참조
route: /products/inquiries
owner: 기능 명세
reviewer: 명세 리뷰
gate: G9
status: draft
confirmedAt: 2026-07-22
version: 1.0
date: 2026-07-22
---

# FS-073. 상품 문의 (목록·상세 답변·견적 발행)

## 1. 화면 개요

| 항목 | 내용 |
|---|---|
| 목적 | 결제대행(PG)을 끈 상품 페이지의 '문의하기' 버튼으로 들어온 고객 문의를 **얼마나 오래 답을 못 받았는가**(경과) 기준으로 훑고, 개별 문의에서 답변을 쓰고 상태를 옮기며(답변 착수·답변 저장·종결), 필요하면 **한 건 또는 여러 건을 한 장의 견적으로 발행**한다 |
| 역할(주 사용자) | 관리자. **쓰기 권한 분기가 실제로 배선돼 있다** — 목록은 `useRouteWritePermissions().canUpdate`(`ProductInquiryListPage.tsx:148`), 상세도 같은 훅(`ProductInquiryDetailPage.tsx:129`). 권한이 없으면 견적 바구니 열·모든 액션 버튼이 **렌더되지 않고** 안내문이 그 사실을 말한다(`ProductInquiryListPage.tsx:371` · `ProductInquiryDetailPage.tsx:356-358`) |
| 진입 경로 | 좌측 GNB > 상품 관리 > 문의 (`/products/inquiries` — `nav-config.ts:190`). **조건부 메뉴다** — §1.1 |
| 포함 화면 | 목록 `/products/inquiries` · 상세 답변 `/products/inquiries/:id` (`App.tsx:331-332`) |
| **범위 밖** | **문의 등록** — 문의를 만드는 것은 고객 채널이다(`_shared/store.ts:3-6`, `:315`). 어댑터의 `add` 는 `createStoreAdapter` 계약을 채우는 문일 뿐 호출부가 0건이다(`data-source.ts:26-33`). **문의 삭제** — 마찬가지로 `remove` 는 배선돼 있으나 화면에 진입점이 없다. 그래서 이 목록은 `CrudListShell` 이 아니라 **`CrudReadListShell`**(선택 체크박스·일괄 삭제·행 액션 열이 어떤 역할에게도 없다 — `CrudReadListShell.tsx:1-16`)을 쓴다. **견적의 편집·발송·수주 전환** — 이 화면은 견적을 **만들기만** 하고 그 뒤는 FS-050(견적)이 소유한다. 여기서는 `/sales/quotes/<id>` 로 가는 링크만 준다(`quote-issue.ts:81-83`). **상태를 직접 고르는 select** — 없다. 상태는 버튼이 아니라 전이 규칙이 정한다(`ProductInquiryDetailPage.tsx:6-9`) |
| 구현 경로 | `apps/admin/src/pages/products/inquiries/**` (`ProductInquiryListPage.tsx` · `ProductInquiryDetailPage.tsx` · `types.ts` · `validation.ts` · `data-source.ts` · `_shared/store.ts` · `inquiries.test.ts`) + 페이지 경계를 넘는 이음매 `shared/domain/quote-issue.ts` · `shared/commerce/inquiry-backlog.ts` |
| 대응 SCR | SCR-073 (미작성 — §7 #1) |
| 공통 컴포넌트 | `shared/crud/{CrudReadListShell,CrudTable,DetailCellLink,createStoreAdapter,useCrudListQuery,useCrudUpdate,useListState,parseFilter,dev(LATENCY_MS·failIfRequested)}` · `shared/ui/{Alert,alertActionRowStyle,Button,Card,CardTitle,FilterPanel,FilterRail,SearchField,StatusBadge,TextareaField,Timeline,dl/dt/dd,hintStyle,fieldLabelStyle,pageTitleStyle,Icon,useToast,useUnsavedChangesDialog}` · `shared/permissions/RequirePermission(useRouteWritePermissions)` · `shared/domain/quote-issue` · `shared/errors/http-error(isNotFound)` · `shared/async(isAbort)` · `shared/format(formatDateTime·formatNumber·objectParticle·seoulDayOf·daysBetween)` |

### 1.1 이 화면에 없는 기능 · 이 화면만의 조건

**① 메뉴가 조건부다 — 그러나 라우트는 사라지지 않는다.**
잎이 `visibleWhen: 'pg-off'` 로 선언돼 있다(`nav-config.ts:190`, 축 정의 `:23-29`). 판정은 `inquiryMenuState(readPaymentSettings(), readInquiryBacklog('product'))`(`inquiry-backlog.ts:114-123`)가 하고, `resolveNavLeaf`(`nav-config.ts:314-324`)가 그 답을 메뉴의 말로 옮긴다:

| 판정 | 조건 | 메뉴 |
|---|---|---|
| `open` | PG 로 팔 수 없다(`pgSellable` false) — 지금도 문의가 들어온다 | 평소대로 '문의' |
| `archive` | PG 를 켰지만 **잔여 문의가 있다**(또는 아직 모른다 — 배선 전 `null`) | 라벨에 `INQUIRY_ARCHIVE_SUFFIX = ' · 읽기 전용'`(`inquiry-backlog.ts:132`)이 붙는다 |
| `hidden` | PG 를 켰고 `backlog.total === 0` | 메뉴에서 사라진다 |

`total` 은 **종결 포함 전체 건수**다(`inquiry-backlog.ts:20-25`) — 미종결만 세면 전부 종결된 날 메뉴가 사라져 과거 문의가 접근 불가가 된다. 모를 때 `null` → `archive` 로 읽는 fail-open 도 같은 이유다(`:121`).
**그리고 `collectNavRoutes()` 는 `resolveNavLeaf` 를 지나지 않는다**(`nav-config.ts:327-333`, 근거 주석 `:311-312`) — 메뉴에서 감춰도 `/products/inquiries` 와 `/products/inquiries/:id` 라우트는 살아 있다. '감추는 것과 없애는 것은 다른 결정'이다.

**② 상태 union 이 영업 문의(FS-051)와 같지 않다.**

| | 값 집합 | 개수 |
|---|---|---|
| 상품 문의 `InquiryStatus`(`_shared/store.ts:35`) | `received` · `answering` · `quote_issued` · `answered` · `closed` | **5** |
| 영업 문의 `InquiryStatus`(FS-051-EL-004 — 접수·배정·처리중·보류·견적 발행·완료·종결) | 7종 | **7** |

**`quote_issued` 라는 낱말만 빌렸고 값 집합은 다르다.** `answering`(답변 중)은 영업 문의에 없고, 영업의 '배정·보류'는 여기에 없다. 코드가 그 판단을 명시한다(`_shared/store.ts:30-33`): "영업 문의가 이미 같은 사실을 `quote_issued` 라 부른다. 여기서 'quoted' 나 'estimate_sent' 를 새로 지으면 같은 사건이 두 이름을 갖고, 두 목록의 '견적 발행' 건수가 영원히 합쳐지지 않는다. **어휘는 빌리고 문구는 각자 갖는다**." 문구는 실제로 다르다 — 여기 `quote_issued` 의 라벨은 '견적 발행'이고 톤은 info(`types.ts:31`), 영업 쪽도 info 지만 두 `STATUS_META` 는 별개 상수다. **두 도메인의 상태를 한 표로 합산하려는 코드는 이 사실 위에 서야 한다**(§7 #2).

**③ 상태를 직접 고르는 select 가 없다.** 영업 문의(FS-051-EL-021)는 7개 상태를 자유롭게 고르는 select 를 두고 전이 규칙이 어느 층에도 없다. **이 화면은 정반대다** — 상태는 전이 함수가 옮기고(`applyAnswer`·`applyClose`·`applyBeginAnswering`·`applyQuoteIssued`), 버튼의 존재 조건과 저장소의 거절 조건이 **같은 술어**(`canAnswer`·`canClose`·`canBeginAnswering`·`canIssueQuote`)를 읽는다(`_shared/store.ts:72-76` 주석). 회귀가 그것을 못박는다(`inquiries.test.ts:140-165`).

**④ 처리 이력이 append-only 로그가 아니라 파생값이다.** `inquiryHistory`(`types.ts:211-269`)가 `createdAt`·`status`·`quoteId`·`answeredAt`·`answer` **저장된 값에서만** 타임라인을 만든다 — 별도 이력 테이블이 없다. 그래서 답변을 고치면 이력의 답변 칸도 함께 바뀐다(갈라질 수 없다 — `:203-210`). 영업 문의가 클라이언트에서 이벤트 배열을 조립해 통째로 전송하는 것(FS-051-EL-028)과 정반대 설계다.

## 2. 영역 구성

| 영역번호 | 이름 | 설명 |
|---|---|---|
| FS-073-SEC-01 | 목록 좌측 레일 — 안내문 | 미답변 건수 · PG 설명 · 견적 바구니 설명 · (권한 없으면) 조회 전용 안내 |
| FS-073-SEC-02 | 목록 좌측 레일 — 상태 필터 | 6개 항목(전체 + 상태 5종) · 건수 배지 · `aria-pressed` |
| FS-073-SEC-03 | 목록 툴바 | 검색 입력 + (권한·담김 있을 때만) 견적 바구니 막대 |
| FS-073-SEC-04 | 목록 조회 요약 | 표 상단 건수 · 새로고침 인디케이터 |
| FS-073-SEC-05 | 목록 표 | 순번 + 8열(+ 권한 시 견적 바구니 열). 페이지네이션·선택·일괄 작업 **없음** |
| FS-073-SEC-06 | 목록 조회 실패 배너(비표시 기본) | 요약·표를 대체 |
| FS-073-SEC-07 | 상세 헤더 | '목록으로' 버튼 + `<h1>상품 문의 처리</h1>` |
| FS-073-SEC-08 | 상세 처리 카드 | 제목·상태 배지 · 배지 행 · 정의 목록 6행 · 답변 편집기 · 액션 버튼 묶음 |
| FS-073-SEC-09 | 상세 문의자 정보 카드 | 문의자·연락처·유입 채널 + 회신 안내 |
| FS-073-SEC-10 | 상세 처리 이력 카드 | 파생 타임라인 |
| FS-073-SEC-11 | 상세 로딩·조회 실패(비표시 기본) | 로딩 문구 / 404·오류 분기 배너 |
| FS-073-SEC-12 | 미저장 이탈 가드(비표시 기본) | 작성 중 답변 파기 확인 |

## 3. 요소 명세

| 요소번호 | 영역 | 이름 | 유형 | 동작 | [서버] | 비고 |
|---|---|---|---|---|---|---|
| FS-073-EL-001 | FS-073-SEC-01 | 미답변 건수 안내 | 텍스트 | 조회가 끝났으면 `답변을 기다리는 문의가 N건 있습니다.`, 아직이면 '미답변 건수를 세는 중입니다.'(`ProductInquiryListPage.tsx:358-362`). N 은 `unansweredCount`(`types.ts:114-116`) = `isUnanswered`(접수·답변 중 — `_shared/store.ts:90-92`)인 건수 | O | **필터·검색 이전 전체 집합**에서 센다(`:175` — `items` 기준). 좌측 배지와 같은 단일 정의를 쓴다 |
| FS-073-EL-002 | FS-073-SEC-01 | PG 안내문 | 텍스트 | '결제대행을 끈 상품은 구매하기 대신 문의하기 버튼이 노출되고, 그 문의가 이 목록으로 들어옵니다.'(`:363-366`) | — | 이 화면이 존재하는 이유를 화면이 스스로 밝힌다. **결제 설정으로 가는 링크가 없다** — 상세(FS-074-EL-… 아님, `ProgramDetailPage.tsx:405`)는 그 링크를 갖는다(§7 #12) |
| FS-073-EL-003 | FS-073-SEC-01 | 견적 바구니 안내문 | 텍스트 | '여러 문의를 바구니에 담아 한 견적으로 합칠 수 있습니다. 합친 문의는 모두 같은 견적을 가리킵니다.'(`:367-370`) | — | 권한이 없어도 표시된다 — 담기 열은 없는데 설명은 남는다(§7 #13) |
| FS-073-EL-004 | FS-073-SEC-01 | 조회 전용 안내문 | 텍스트 | `canUpdate` 가 false 일 때만 '답변 권한이 없어 조회만 가능합니다.'(`:371`) | — | 비표시 기본. **없어진 열·버튼의 이유를 미리 밝히는 유일한 문구**(EXC-03) |
| FS-073-EL-005 | FS-073-SEC-02 | 상태 필터 패널 | 입력 | `FilterPanel navLabel="상품 문의 상태 필터" heading="처리 상태"`(`:375-382`). 항목 6개 = `INQUIRY_STATUS_FILTERS`(`types.ts:81-84`) = 전체 + `STATUS_SEQUENCE`(접수 → 답변 중 → 견적 발행 → 답변 완료 → 종결 — `types.ts:45-51`). 선택은 `aria-pressed`(`FilterPanel.tsx:145`), 값은 URL `?status=`(`list.setFilter`) | — | **처리 흐름 순으로 세운다** — 가나다순이 아니다. 모르는 URL 값은 `parseFilter` 가 '전체'로 되돌린다(`ProductInquiryListPage.tsx:153-157`) |
| FS-073-EL-006 | FS-073-SEC-02 | 상태 건수 배지 | 텍스트 | `countInquiriesByStatus`(`types.ts:98-111`). **필터 이전 전체 집합**에서 센다(`:97` 주석 — '필터가 자기 배지를 흔들면 비교가 불가능하다'). 아직 못 셌으면 `counts=null` → `FilterPanel` 이 `'—'` 를 그린다(`FilterPanel.tsx:33,153`) | O | `loaded = !firstLoading && error === null`(`ProductInquiryListPage.tsx:170`) — **0 과 '모름'을 구분한다** |
| FS-073-EL-007 | FS-073-SEC-03 | 검색 입력 | 입력 | `SearchField` 접근 이름 '문의번호·상품명·문의자·제목 검색', placeholder '문의번호 · 상품명 · 문의자 검색'(`:311-318`). `list.searchInputProps` 스프레드 — **IME 조합 중에는 커밋하지 않고** 조합 종료 후 디바운스로 URL `?q=` 에 커밋한다(COMP-10). 커밋된 키워드로 `searchProductInquiries`(`types.ts:119-132`)가 **문의번호(id)·상품명·문의자·제목** 4필드에 대소문자 무시 부분 일치를 건다 | — | 클라이언트 필터 — 서버 재조회가 없다. 검색 대상이 **문의번호를 포함**하는 이유가 코드에 있다(`types.ts:118` — '운영자가 실제로 손에 쥔 단서들') |
| FS-073-EL-008 | FS-073-SEC-03 | 견적 바구니 막대 | 배너 | `canUpdate && basket.size > 0` 일 때만 info 톤 `Alert`(`:322-349`). 문구는 `basketBlock === null` 이면 `문의 N건을 한 견적으로 합칩니다.`, 아니면 **거절 사유 문자열 그대로**(`:326-329`). 버튼 2개: '비우기'(`setBasket(new Set())`) · '견적 발행'(`issue.mutate(basketItems)`, `loading={issue.isPending}`, `disabled={issue.isPending \|\| basketBlock !== null}`) | O | 비표시 기본. **버튼의 disabled 조건과 발행의 거절 조건이 같은 술어를 읽는다**(`quoteIssueBlock` — `quote-issue.ts:136-142`, 근거 주석 `:129-135`) |
| FS-073-EL-009 | FS-073-SEC-04 | 조회 요약 텍스트 | 텍스트 | `CrudReadListShell` 소유(`CrudReadListShell.tsx:118-121`). 최초 로드면 '불러오는 중…', 그 밖에는 `전체 N건`. 재조회 중이면 `' · 새로고침 중…'` 을 덧붙이고 `aria-busy={refreshing}` | — | N 은 **필터·검색 적용 후** 건수(`visibleItems.length`). 재조회 중 건수를 지우지 않는다(STATE-01/03) |
| FS-073-EL-010 | FS-073-SEC-04 | 목록 상태 낭독 | 텍스트 | 항상 마운트된 `aria-live="polite"` 영역(`CrudReadListShell.tsx:110-112`). 문장 3분기(`:73-83`): 실패 '상품 문의 목록을 불러오지 못했습니다.' · 0건 '조건에 맞는 상품 문의 결과가 없습니다.' · 그 밖 `상품 문의 N건을 찾았습니다.` 최초 로드 중에는 침묵 | — | 비표시(시각적으로 숨김). 필터·검색으로 0행이 되는 전환이 이 줄로 들린다(A11Y-16) |
| FS-073-EL-011 | FS-073-SEC-05 | 문의 목록 표 | 표 | `CrudReadListShell` → `CrudTable` → DS `Table`. **전량을 한 화면에 렌더한다 — 페이지네이션이 없다**(§7 #3). 열: 순번(`SeqCell` — `CrudTable.tsx:331`) + 데이터 8열(`:238-276`) + `canUpdate` 면 견적 바구니 1열(`:305`). **선택 체크박스·행 액션 열이 없다** — 껍데기가 `canUpdate=false, canRemove=false` 를 넘기기 때문(`CrudReadListShell.tsx:145-146`). 정렬은 어댑터가 건다(`data-source.ts:28` → `sortProductInquiries` — 접수 최신순, 동시각은 문의번호 내림차순 안정 정렬 — `types.ts:135-140`). 정렬 변경 UI 없음 | O | 캡션은 `'상품 문의 목록 — 조회 전용입니다.'` **고정**이다(`CrudTable.tsx:254-257` — `canUpdate=false` 분기). **행 클릭으로 상세에 간다는 사실을 캡션이 말하지 않는다**(§7 #4) |
| FS-073-EL-011.1 | FS-073-SEC-05 | 순번 셀 | 텍스트 | `SeqCell seq={index + 1}`(`CrudTable.tsx:331`) — 화면상 위치. 주석이 '정렬해도 위에서부터 1,2,3' 임을 못박는다 | — | 페이지네이션이 없어 지금은 어긋나지 않는다(§7 #3) |
| FS-073-EL-011.2 | FS-073-SEC-05 | 문의번호 셀 | 텍스트 | `item.id` 를 `tabular-nums` + `nowrap` + muted 로 그린다(`:115-119,242`). 값은 `PIQ-YYYYMMDD-NNN`(`_shared/store.ts:296-301`) | O | **id 가 곧 문의번호다**(`_shared/store.ts:13-15`) — 고객이 전화로 부르는 번호와 URL 이 같은 값이다. 회귀가 형식을 못박는다(`inquiries.test.ts:416-420`) |
| FS-073-EL-011.3 | FS-073-SEC-05 | 상품명 셀 | 텍스트 | `item.productName` 을 고정 최대폭 + `text-overflow: ellipsis` + `nowrap` 로 자른다(`:121-127,246`) | O | 비정규화 값 — 목록이 상품을 다시 조회하지 않는다(`_shared/store.ts:44`). **잘린 전체 값을 볼 수단이 없다**(title 속성 없음 — §7 #14) |
| FS-073-EL-011.4 | FS-073-SEC-05 | 문의자 셀 | 텍스트 | `item.customerName`, `nowrap`(`:248`) | O | 고객 개인정보 — 목록에 평문 노출 |
| FS-073-EL-011.5 | FS-073-SEC-05 | 제목 링크 | 버튼 | `DetailCellLink to="/products/inquiries/<id>"` 로 `item.subject`(`:250-255`). **행 클릭이 마우스 전용이므로 이것이 키보드 경로다**(`DetailCellLink.tsx:1-17` — 이 컴포넌트가 존재하는 이유가 실측 사고로 기록돼 있다) | — | 링크라 중간클릭·새 탭이 성립한다. truncate 없음 |
| FS-073-EL-011.6 | FS-073-SEC-05 | 채널 셀 | 텍스트 | `inquiryChannelLabel`(`types.ts:63-73`): 상품 페이지(`storefront`) · 모바일 앱 · 전화 · 이메일 · 카카오톡 | O | `storefront` 를 '상품 페이지'로 따로 부르는 이유가 코드에 있다(`types.ts:59-62`) — 일반 상담과 섞이지 않게 |
| FS-073-EL-011.7 | FS-073-SEC-05 | 상태 배지 | 배지 | `StatusBadge` 라벨 `inquiryStatusLabel` · 톤 `inquiryStatusTone`(`types.ts:26-42`): 접수=**warning** · 답변 중=info · 견적 발행=info · 답변 완료=success · 종결=neutral | O | **미답변 두 상태를 같은 색으로 묶지 않는다**(`types.ts:20-25`) — '답변 중'은 이미 사람이 붙은 상태라 방치된 '접수'와 색이 같으면 우선순위를 알 수 없다 |
| FS-073-EL-011.8 | FS-073-SEC-05 | 접수일 셀 | 텍스트 | `formatDateTime(item.createdAt)`(`:267`). 저장은 UTC(Z), 표기는 KST 환산(`_shared/store.ts:17-19`) | O | — |
| FS-073-EL-011.9 | FS-073-SEC-05 | 경과 배지 | 배지 | `StatusBadge` 라벨 `elapsedLabel(item, TODAY)` · 톤 `elapsedTone`(`types.ts:171-196`). 분기: 견적만 나감 → '견적 발행'(info) · 답변됨 → '당일 답변'/`N일 만에 답변`(neutral) · 미답변 → '오늘 접수'(info)/`N일째 미답변`(≥`OVERDUE_DAYS`=**3** 이면 danger, 아니면 warning) · 시각을 읽을 수 없으면 `'—'`(neutral) | O | **이 목록의 중심 열이다**(`ProductInquiryListPage.tsx:3-6`). 색만으로 지연을 말하지 않는다 — 배지 안에 문구가 함께 실린다(`:271`). 기준일 `TODAY = '2026-07-21'` **하드코딩**(`:81`, 사유 `:74-80`) — §7 #5 |
| FS-073-EL-011.10 | FS-073-SEC-05 | 견적 바구니 열 | 버튼 | **`canUpdate` 일 때만 존재한다**(`:305`). 이미 발행됐으면(`quoteId !== ''`) `<a href={issuedQuoteHref(item.quoteId)}>견적 보기</a>`, 아니면 `Button size="sm" aria-pressed={inBasket}` 라벨 '담기'/'담김'(`:279-303`) | O | **`CrudReadListShell` 의 선택 체크박스를 쓰지 않고 열을 따로 만든 이유**가 코드에 있다(`:189-191`) — 그 체크박스는 일괄 삭제용이라 어떤 역할에게도 없고, 여기 필요한 것은 '지우는 선택'이 아니라 '담는 선택'이다. **'견적 보기'는 DS `Link` 가 아니라 네이티브 `<a href>`** 라 전체 페이지 재적재가 일어난다(§7 #6) |
| FS-073-EL-011.11 | FS-073-SEC-05 | 행 전체 클릭 이동 | 텍스트 | `rowTarget = { kind: 'detail', href: item => '/products/inquiries/<id>' }`(`:87-90`). 목적지가 `detail` 이라 **읽기 권한만으로 활성화된다**(`CrudTable.tsx:306` — `activationAllowed = rowTarget.kind === 'detail' ? true : canUpdate`). 인터랙티브 요소 가드·드래그 선택 가드는 DS Table 소유 | — | 비표시 규칙. **마우스 전용** — 키보드 경로는 EL-011.5 |
| FS-073-EL-012 | FS-073-SEC-05 | 목록 로딩 스켈레톤 | 스켈레톤 | `loading={firstLoading}` 을 DS `Table` 에 넘긴다(`CrudReadListShell.tsx:126`). 조건은 `isFetching && data === undefined`(`ProductInquiryListPage.tsx:164`) — **최초 로드에서만** | — | 비표시. 재조회 중에는 이전 행이 유지된다(`useCrudListQuery` 의 `placeholderData: (previous) => previous` — `crud.ts:298`) |
| FS-073-EL-013 | FS-073-SEC-05 | 빈 상태 | 빈상태 | 조회 완료·0건이면 공유 `Empty`(`CrudTable.tsx:378-390`). 맥락은 화면이 준다: `createVerb='접수'` · `hasQuery` · `hasActiveFilters` · `onClearSearch` · `onResetFilters`(`ProductInquiryListPage.tsx:399-405`) → 3분기(검색 0건 / 필터 0건 / 진짜 0건). **생성 CTA 슬롯을 비운다** — 관리자가 문의를 만들지 않는다 | — | 비표시. 조사(이/가)는 `Empty` 가 받침에서 고른다 |
| FS-073-EL-014 | FS-073-SEC-06 | 목록 조회 실패 배너 | 배너 | 조회 실패 시 요약·표 대신 위험 톤 `Alert` '상품 문의 목록을 불러오지 못했습니다.' + '다시 시도'(`CrudReadListShell.tsx:154-161`) | O | 비표시. **툴바·좌측 레일은 남는다**(배너가 껍데기 안쪽만 대체한다) — 조건이 화면에서 사라지지 않는다. **status 로 분기하지 않는다**(§7 #7) |
| FS-073-EL-015 | FS-073-SEC-03 | 견적 발행(목록·다건) 규칙 | 텍스트 | `issue` 뮤테이션(`:208-232`): ① `issueQuote(targets.map(toQuoteIssueSource))`(`quote-issue.ts:153-156`) 로 **한 장의 견적**을 만들고 ② 담긴 문의를 **하나씩 순회하며** `applyQuoteIssued(target, issued.id)` 를 어댑터 `update` 로 저장한다(`:214-219`) ③ 성공 시 목록 쿼리 무효화 + 바구니 비우기 + 토스트 `견적 <번호>를 발행했습니다.` + `navigate(issuedQuoteHref(issued.id))` 로 **견적 상세로 이동**(`:222-227`) | O | 비표시 규칙. **합쳐진 문의는 모두 같은 견적 id 를 갖는다** — 하나라도 빠지면 그 문의는 견적 없이 남는다(`:213`). 그런데 ②는 **원자적이지 않다**(§7 #8) |
| FS-073-EL-016 | FS-073-SEC-03 | 바구니 수명 규칙 | 텍스트 | `status` 또는 `list.keyword` 가 바뀌면 바구니를 비운다(`:200-202`) — 화면에 없는 문의가 담긴 채 '선택 3건 견적 발행'이 되지 않게(STATE-04-b) | — | 비표시 규칙. `basketItems` 는 `items`(필터 이전 전량)에서 되짚으므로(`:204`) 담긴 항목의 데이터는 재조회로 갱신된다 |
| FS-073-EL-017 | FS-073-SEC-07 | '목록으로' 버튼(상단) | 버튼 | 좌상단 `<button type="button">` + `Icon chevron-left` + '목록으로'. `navigate('/products/inquiries')`(`ProductInquiryDetailPage.tsx:262-270`) | — | `<button>` + 프로그램 이동이라 **이탈 가드가 가로채지 못한다**(§7 #9) |
| FS-073-EL-018 | FS-073-SEC-07 | 상세 화면 제목 | 텍스트 | 본문에 `<h1 style={pageTitleStyle}>상품 문의 처리</h1>`(`:273`). **문의 제목이 아니라 고정 문구** | — | AppHeader 가 그리는 `<h1>`(잎 라벨 '문의')과 **중복**된다 — `<h1>` 2개(§7 #10) |
| FS-073-EL-019 | FS-073-SEC-11 | 상세 로딩 표시 | 텍스트 | `inquiry === undefined` 면 `Card` 안에 muted '불러오는 중…'(`:276-279`). 스켈레톤 막대가 아니다 | — | 비표시. 조건이 데이터 유무라 **재조회 중에는 기존 내용을 유지한다** |
| FS-073-EL-020 | FS-073-SEC-11 | 상세 조회 실패 배너 | 배너 | 위험 톤 `Alert`. **404 와 그 밖을 가른다**(`:235-258`, `isNotFound`): 404 → '문의를 찾을 수 없습니다. 이미 삭제되었을 수 있습니다.' + **'목록으로'만** · 그 밖 → '문의를 불러오지 못했습니다.' + '다시 시도' + '목록으로' | O | 비표시. **EXC-12 를 충족한다** — 어댑터가 없는 id 에 `HttpError(404)` 를 던지고(`crud.ts:217-219`) 화면이 그 status 로 분기한다. **영업 문의(FS-051-EL-015)는 이 분기가 없다** |
| FS-073-EL-021 | FS-073-SEC-08 | 처리 카드 제목 | 텍스트 | `CardTitle` 에 `inquiry.subject` + 상태 `StatusBadge`(`:283-289`) | O | — |
| FS-073-EL-022 | FS-073-SEC-08 | 저장 실패 배너 | 배너 | 카드 상단 위험 톤 `Alert` '저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'(`:181,291`). 재저장 시 먼저 지운다(`:168`) | O | 비표시. **403·409·422·500 을 구분하지 않고 참조 코드도 없다**(§7 #7) |
| FS-073-EL-023 | FS-073-SEC-08 | 배지 행 | 배지 | 2개: 채널(info 고정) · 경과(`elapsedTone`/`elapsedLabel`)(`:293-299`) | O | 목록의 경과 배지와 **같은 함수·같은 기준일**을 쓴다(`:67-68` — '두 화면이 다른 날짜를 말하면 안 된다') |
| FS-073-EL-024 | FS-073-SEC-08 | 문의 정보 정의 목록 | 텍스트 | `dl/dt/dd` 6행(`:301-330`): 문의번호 · 상품 · 접수일시 · **답변일시**(미답변이면 '미답변') · 문의 내용 · **발행 견적**. 전부 읽기 전용 | O | 문의 본문은 `white-space: pre-wrap` 이라 **줄바꿈이 보존된다**(`:110-116`) — 영업 문의(FS-051 §7 #7)가 갖지 못한 것이다 |
| FS-073-EL-024.1 | FS-073-SEC-08 | 발행 견적 역링크 | 버튼 | `quoteId === ''` 면 muted '아직 발행된 견적이 없습니다.', 아니면 `<Link to={issuedQuoteHref(quoteId)}>견적 보기</Link>`(`:317-329`) | O | **문의 ↔ 견적 양방향 링크의 한쪽**이다. 반대편은 견적의 `sources`(`quotes/types.ts:384`)와 `findQuoteBySource`(`quotes/data-source.ts:125-127`) |
| FS-073-EL-025 | FS-073-SEC-08 | 답변 편집기 | 입력 | `canAnswer(status)`(= 종결이 아니다)일 때만 `TextareaField`(`:333-347`): 라벨은 `answer === ''` 면 '답변 작성', 아니면 '답변 수정'. `maxLength={PRODUCT_INQUIRY_ANSWER_MAX}`(=1000 — `_shared/store.ts:70`), `rows={6}`, hint `저장하면 상태가 '답변 완료' 로 넘어갑니다.`, placeholder '고객에게 전달할 답변을 입력하세요.'. `disabled={saving \|\| !canUpdate}` | O | `aria-invalid`·`aria-describedby`·카운터는 `TextareaField` 가 내부 배선한다. **hint 가 비가역 상태 전이를 예고하는 유일한 문구다** |
| FS-073-EL-025.1 | FS-073-SEC-08 | 종결 문의의 읽기 전용 답변 | 텍스트 | `canAnswer` 가 false 면 편집기 대신 '발송한 답변' 라벨 + 본문(`pre-wrap`) + '종결된 문의라 답변을 수정할 수 없습니다.'(`:349-353`) | O | 비표시 기본. **이유를 화면이 말한다** — 사라진 편집기를 찾게 두지 않는다 |
| FS-073-EL-026 | FS-073-SEC-08 | 조회 전용 안내 배너 | 배너 | `canUpdate` 가 false 면 info 톤 `Alert` '이 문의에 답변할 권한이 없습니다. 조회만 가능합니다.'(`:356-358`) | — | 비표시. 액션 버튼이 전부 사라진 이유를 밝힌다(EXC-03) |
| FS-073-EL-027 | FS-073-SEC-08 | '목록으로' 버튼(카드) | 버튼 | 액션 묶음 맨 왼쪽. `secondary`, 저장 중 비활성(`:361-363`) | — | EL-017 과 목적지가 같다(중복). 둘 다 가드 밖이다(§7 #9) |
| FS-073-EL-028 | FS-073-SEC-08 | '답변 착수' 버튼 | 버튼 | **`canUpdate && canBeginAnswering(status)`** 일 때만 렌더(`:365-369`). 누르면 `applyBeginAnswering` 결과를 저장하고 토스트 '답변 중으로 변경했습니다.'(`:203-206`) | O | `canBeginAnswering` 은 **접수 상태에서만** true(`_shared/store.ts:116-118`). 회귀 `inquiries.test.ts:154-157` |
| FS-073-EL-029 | FS-073-SEC-08 | '문의 종결' 버튼 | 버튼 | **`canUpdate && canClose(status)`** 일 때만 렌더(`:370-374`). `applyClose` → 토스트 '문의를 종결했습니다.'(`:208-211`) | O | `canClose` 는 **답변 완료에서만** true(`_shared/store.ts:111-113`) — 고객이 답을 못 받은 채 닫히는 길을 막는다. 저장소도 같은 규칙으로 던진다(`:141`), 회귀 `inquiries.test.ts:127-130,187-191` |
| FS-073-EL-030 | FS-073-SEC-08 | '견적 발행' 버튼(단건) | 버튼 | **`canUpdate && issueBlock === null`** 일 때만 렌더(`:376-380`). `issueBlock = quoteIssueBlock([toQuoteIssueCandidate(inquiry)])`(`:159-160`). 누르면 `issueQuote([toQuoteIssueSource(inquiry)])` → `applyQuoteIssued` 저장 → 토스트 `견적 <번호>를 발행했습니다.`(`:223-232`) | O | **발행된 문의에는 버튼이 없다** — 대신 EL-024.1 의 '견적 보기'가 있다(`:375` 주석). 목록과 달리 **발행 후 이동하지 않는다**(§7 #11) |
| FS-073-EL-031 | FS-073-SEC-08 | '답변 저장' 버튼 | 버튼 | **`canUpdate && canAnswer(status)`** 일 때만 렌더(`:381-391`). `variant="primary" size="md" loading={saving}`, `disabled={saving \|\| !dirty}`. 누르면 ① `answerError(answer)` 로 검증 ② 통과하면 `applyAnswer(inquiry, answer, new Date().toISOString())` 저장 ③ 토스트가 **최초/재수정으로 갈린다**: 최초면 '답변을 저장하고 답변 완료로 변경했습니다.', 아니면 '답변을 수정했습니다.'(`:187-201`) | O | **진행 상태를 `loading` prop 으로 표현한다**(손으로 쓴 라벨이 아니다 — COMP-01 충족). **동기 제출 락·멱등키가 없다**(§7 #15) |
| FS-073-EL-032 | FS-073-SEC-08 | 저장의 단일 경로 | 텍스트 | 네 동작(답변·착수·종결·발행)이 전부 `commit(next, message)` 하나를 지난다(`:166-185`): 서버 오류 지우기 → 새 `AbortController` → `update.mutate({ id, input: toProductInquiryInput(next), signal })` → 성공 시 `if (aborted) return` · 토스트 · `detailQuery.refetch()` / 실패 시 `isAbort` 면 무시, 아니면 배너 | O | 비표시 규칙. **'다음 문의 한 벌'을 통째로 보낸다**(부분 갱신이 아니다). 근거 주석 `:162-165` — 넷이 각자 mutate 를 배선하면 성공/실패 처리와 abort 정리가 넷으로 갈라진다 |
| FS-073-EL-033 | FS-073-SEC-08 | 답변 검증 규칙 | 텍스트 | 정본은 `productInquiryAnswerSchema`(`validation.ts:11-18`): 공백만이면 '답변 내용을 입력하세요.', trim 길이 1000 초과면 '답변은 1000자를 넘을 수 없습니다.'. 화면은 `answerError`(`:25-29`)만 부르고 자기 조건문을 갖지 않는다(`:20-23`). **저장소도 같은 규칙으로 한 번 더 막는다**(`applyAnswer` — `_shared/store.ts:129-130`) | — | 비표시 규칙. **RHF 를 얹지 않았다** — 필드 하나짜리 폼이라(`validation.ts:20-23`). 회귀 `inquiries.test.ts:392-411` |
| FS-073-EL-034 | FS-073-SEC-08 | dirty 판정·동기화 규칙 | 텍스트 | `dirty = inquiry !== undefined && answer.trim() !== inquiry.answer`(`:153`). 상세가 도착하면 `setAnswer(inquiry.answer)`(`:148-151`) — 이미 답변한 문의는 그 답변이 폼의 출발점이다(수정 흐름) | — | 비표시 규칙. **그 효과가 편집 중 재조회에서도 돈다** — 저장 후 재조회는 정상이나, 그 밖의 재조회가 오면 입력이 덮인다(§7 #16) |
| FS-073-EL-035 | FS-073-SEC-08 | 최초 답변 시각 불변 규칙 | 텍스트 | `applyAnswer` 가 `answeredAt` 을 **비어 있을 때만** 채운다(`_shared/store.ts:134`). 재수정에서는 바뀌지 않는다 — '얼마나 빨리 응대했는가'라는 사실을 사후에 조작하지 않기 위해서다(`:122-125`) | O | 비표시 규칙. 회귀 `inquiries.test.ts:97-107` |
| FS-073-EL-036 | FS-073-SEC-09 | 문의자 정보 카드 | 텍스트 | `dl` 3행: 문의자 · 연락처 · 유입 채널 + hint '답변은 위 연락처로 회신됩니다. 결제대행을 끈 상품은 구매하기 대신 문의하기 버튼이 노출됩니다.'(`:396-410`) | O | 개인정보. **연락처를 마스킹하지 않는다** — 은닉 정책은 BE-073 소관(§7 #17) |
| FS-073-EL-037 | FS-073-SEC-10 | 처리 이력 타임라인 | 표시 | `Card('처리 이력')` 안 공유 `Timeline events={history} label="상품 문의 처리 이력"`(`:412-415`). `history = inquiryHistory(inquiry)`(`types.ts:211-269`) — 저장된 사실에서 **파생**한다: 접수(작성자 '고객', 채널 문구) → (답변 중이면) 담당 착수 → (`quoteId` 가 있으면) 견적 발행 → (`answeredAt` 이 있으면) 답변 본문 → (종결이면) 종결 | O | **별도 이력 테이블이 없다**(§1.1 ④). 종결 이벤트의 `at` 은 종결 시각이 아니라 **답변 시각**이다 — 종결 시각을 저장하지 않기 때문이며 문구가 그 사실을 밝힌다(`types.ts:264`). 회귀 `inquiries.test.ts:369-388` |
| FS-073-EL-038 | FS-073-SEC-12 | 미저장 이탈 가드 | 모달 | `useUnsavedChangesDialog(dirty && !saving, { message })`(`:154`). 문구 '작성 중인 답변이 저장되지 않았습니다. 이 화면을 벗어나면 입력한 내용이 사라집니다.'(`:69-70`). 3경로(beforeunload · 앱 내 `<a>` 클릭 capture · popstate sentinel) | — | 비표시. **`navigate()` 프로그램 이동(EL-017·EL-027)은 가로채지 못한다**(§7 #9) |
| FS-073-EL-039 | FS-073-SEC-08 | 언마운트 abort | 텍스트 | 화면을 벗어나면 진행 중인 저장을 abort 한다(`:145`). abort 는 실패로 통지하지 않고(`:180`), 성공 콜백도 `controller.signal.aborted` 면 아무것도 하지 않는다(`:175`) | — | 비표시 규칙. **목록의 견적 발행 뮤테이션에는 abort 배선이 없다**(`:208-232` — `AbortController` 0건) — §7 #18 |

## 4. 예외 명세

| 요소번호 | 빈 상태 | 로딩 | 실패 | 유효성 | 권한없음 | 경합 | 대량 |
|---|---|---|---|---|---|---|---|
| FS-073-EL-001 | 미답변 0건이면 '…0건 있습니다' | 조회 중 '미답변 건수를 세는 중입니다.' | 조회 실패면 `loaded=false` → 같은 '세는 중' 문구가 남는다(**실패를 로딩으로 위장한다** — §7 #19) | N/A — 표시 전용 | §4.1 공통 규칙 적용 | 재조회 시점 스냅샷 | 전량 1-pass(O(n)) |
| FS-073-EL-002 | N/A — 정적 문구 | 로딩 중에도 표시 | 조회 실패에도 남는다(레일은 배너 밖) | N/A — 입력 없음 | §4.1 공통 규칙 적용 | N/A — 정적 | 고정 문구 |
| FS-073-EL-003 | N/A — 정적 문구 | 로딩 중에도 표시 | 조회 실패에도 남는다 | N/A — 입력 없음 | **권한이 없어도 표시된다** — 담기 열은 없는데 설명은 남는다(§7 #13) | N/A — 정적 | 고정 문구 |
| FS-073-EL-004 | N/A — 조건부 문구 | 로딩과 무관(권한은 동기 판정) | 조회 실패에도 남는다 | N/A — 입력 없음 | **이것이 권한 없음의 표현이다** | 다른 탭에서 권한이 강등되면 `usePermissions` 구독이 재렌더해 문구가 나타난다 | 1줄 고정 |
| FS-073-EL-005 | 항목 0건이어도 6개 항목은 남고 배지가 '0' | 조회 중 배지 `'—'` | 조회 실패면 `'—'`(0 이라고 거짓말하지 않는다) | 손으로 고친 `?status=거짓말` 은 `parseFilter` 가 '전체'로 되돌린다 | §4.1 공통 규칙 적용 — 필터는 게이팅되지 않는다(읽기 축이다) | **URL 이 단일 원천**이라 새로고침·뒤로가기·링크 공유가 조건을 보존한다(IA-13) | 6개 고정 |
| FS-073-EL-006 | 0건이면 '0' | 아직 모르면 `'—'` | 실패면 `'—'` | N/A — 파생값 | §4.1 공통 규칙 적용 | 상세에서 상태를 바꾸면 목록 키가 무효화되고(`crud.ts:357`) 재조회에 반영된다 | 전량 1-pass |
| FS-073-EL-007 | 매치 0건이면 EL-013 의 '검색 0건' 분기 | 조회 중에도 입력 가능(대상이 비어 결과 0건) | N/A — 서버를 호출하지 않는다 | 자유 텍스트. 길이·문자 제약 없음. 앞뒤 공백 제거(`types.ts:123`). 빈 문자열이면 조건 없음 | §4.1 공통 규칙 적용 | **IME 조합 중에는 커밋하지 않는다** — 자모 부분 문자열이 URL 에 커밋되지 않는다 | 전량이 메모리에 있어 커밋마다 4필드 × 전량을 다시 건다(§7 #3) |
| FS-073-EL-008 | 담긴 것이 0건이면 렌더되지 않는다 | 발행 중 '견적 발행' 버튼이 `loading` + 두 버튼 모두 비활성 | 발행 실패는 **토스트** '견적을 발행하지 못했습니다. 잠시 후 다시 시도해 주세요.'(`:230`). abort 는 표시하지 않는다 | 담긴 문의 중 하나라도 이미 발행됐거나(`QUOTE_ISSUE_ALREADY`) 종결이면(`QUOTE_ISSUE_NOT_ISSUABLE`) 또는 발행기 미배선이면(`QUOTE_ISSUE_UNWIRED`) **버튼이 비활성되고 그 사유가 막대에 그대로 뜬다**(`quote-issue.ts:99-102,136-142`) | **`canUpdate` 가 false 면 막대 자체가 렌더되지 않는다**(`:322`) | 담긴 뒤 다른 관리자가 그중 하나로 견적을 발행하면 화면의 `quoteId` 는 낡는다 — 그때는 저장소의 `findQuoteBySource` 가 **기존 견적을 돌려준다**(`quotes/data-source.ts:148-151`) | 담을 수 있는 건수에 **상한이 없다**. 발행은 문의 수만큼 순차 `update` 를 돈다(§7 #8) |
| FS-073-EL-009 | 0건이면 '전체 0건' | 최초 로드만 '불러오는 중…' | 조회 실패 시 EL-014 가 이 줄을 대체한다 | N/A — 입력 없음 | §4.1 공통 규칙 적용 | 재조회 중 건수를 유지하고 `' · 새로고침 중…'` 을 덧붙인다(STATE-03 충족) | 천 단위 구분(`formatNumber`) |
| FS-073-EL-010 | 0건이면 '조건에 맞는 상품 문의 결과가 없습니다.' | 최초 로드 중에는 **침묵**(아직 알릴 사실이 없다) | '상품 문의 목록을 불러오지 못했습니다.' | N/A — 입력 없음 | §4.1 공통 규칙 적용 | 필터·검색 전환이 이 줄로 들린다 | 건수만 읽는다 |
| FS-073-EL-011 | 0건이면 EL-013 으로 본문 대체 | EL-012 스켈레톤(최초만) | EL-014 로 요약·표 대체 | N/A — 표 자체 입력 없음 | **선택 열·액션 열이 어떤 역할에게도 없다**(껍데기가 `canUpdate=false,canRemove=false` 고정) | 조회 시점 스냅샷. **삭제 경로가 없어 행 소멸 경합이 없다** | **상한 없음** — 접수 건수에 비례해 행이 는다(§7 #3) |
| FS-073-EL-011.1 | 행 없으면 없음 | 스켈레톤 | 미표시 | N/A | §4.1 공통 규칙 적용 | 재조회·필터로 순서가 바뀌면 순번도 다시 매겨진다 | 페이지네이션 도입 시 공식이 틀어진다(§7 #3) |
| FS-073-EL-011.2 | 행 없으면 없음 | 스켈레톤 | 미표시 | N/A — 표시 전용. 형식은 저장소가 보장(`inquiries.test.ts:416-420`) | §4.1 공통 규칙 적용 | 접수 후 불변 | `nowrap` — 줄바꿈되지 않는다 |
| FS-073-EL-011.3 | 상품명이 비면 빈 칸 | 스켈레톤 | 미표시 | N/A — 표시 전용 | §4.1 공통 규칙 적용 | **비정규화 스냅샷** — 상품명이 바뀌어도 이 값은 따라가지 않는다(§7 #20) | ellipsis 로 자른다. **전체 값을 볼 수단이 없다**(§7 #14) |
| FS-073-EL-011.4 | 이름이 비면 빈 칸 | 스켈레톤 | 미표시 | N/A — 표시 전용 | §4.1 공통 규칙 적용 | 접수 후 불변 | 개인정보 평문. truncate 없음 |
| FS-073-EL-011.5 | 제목이 빈 문자열이면 **링크의 접근 이름이 사라진다** | 스켈레톤 행이라 링크가 없다 | N/A — 라우터 내부 이동 | N/A — 입력 없음 | 읽기 권한만으로 동작한다 | 고객이 접수 시 정한 값 — 관리자가 바꾸지 않는다 | truncate 없음 — 긴 제목이 열을 넓힌다(§7 #14) |
| FS-073-EL-011.6 | 행 없으면 없음 | 스켈레톤 | 미표시 | N/A — `Record` 전수 대응이라 미정의 채널이 없다 | §4.1 공통 규칙 적용 | 접수 후 불변 | 5개 고정 |
| FS-073-EL-011.7 | 행 없으면 없음 | 스켈레톤 | 미표시 | N/A — `Record<InquiryStatus, …>` 전수 대응 | §4.1 공통 규칙 적용 | 조회 시점 상태. 상세 저장이 목록 키를 무효화한다 | 5개 고정 |
| FS-073-EL-011.8 | 행 없으면 없음 | 스켈레톤 | `createdAt` 이 유효하지 않으면 `formatDateTime` 폴백이 원본 문자열을 그대로 보인다 | N/A — 표시 전용 | §4.1 공통 규칙 적용 | 불변 | — |
| FS-073-EL-011.9 | 행 없으면 없음 | 스켈레톤 | 시각을 읽을 수 없으면 `'—'` — **0일로 위장하지 않는다**(`types.ts:146-147,184`) | N/A — 파생값 | §4.1 공통 규칙 적용 | **기준일이 고정 상수라 날짜가 지나도 경과가 늘지 않는다**(§7 #5) | 문구+색 2중 인코딩(A11Y-16 충족) |
| FS-073-EL-011.10 | 행 없으면 없음 | 발행 중 담기 버튼 전체가 비활성(`disabled={issue.isPending}` — 화면 단위 플래그) | 발행 실패는 EL-008 의 토스트 | 발행 여부는 `quoteId` 로 판정 — 형태 위반이 없다 | **`canUpdate` 가 false 면 열 자체가 없다** | `quoteId` 가 가리키는 견적이 삭제되면 '견적 보기'가 404 로 간다 — 문의의 `quoteId` 는 정리되지 않는다(§7 #21) | 행마다 최대 1개 |
| FS-073-EL-011.11 | 행 없으면 규칙이 걸리지 않는다 | 스켈레톤 행이라 이동 규칙이 없다 | N/A — 라우터 내부 이동 | N/A — 입력 없음 | **`detail` 이라 읽기 권한만으로 활성화된다**(`CrudTable.tsx:306`) | 이동 후 상세가 최신을 재조회한다 | N/A — 행 단위 |
| FS-073-EL-012 | N/A — 도착 전 상태 | **이것이 로딩 표현** | 조회 실패 시 EL-014 로 바뀐다 | N/A — 입력 없음 | §4.1 공통 규칙 적용 | **재조회에서는 뜨지 않는다** — 이전 행이 유지된다(STATE-01) | 행 수는 DS `Table` 소유 |
| FS-073-EL-013 | **이것이 빈 상태 표현** — 3분기 + 복구 액션 | 최초 로드 중에는 스켈레톤이 이 자리를 쓴다 | 조회 실패 시 EL-014 로 | N/A — 입력 없음 | 생성 CTA 가 애초에 없어 권한 분기가 없다 | 복구 액션이 URL 을 고쳐 즉시 반영된다 | N/A — 1블록 |
| FS-073-EL-014 | N/A — 실패 상태 | 재시도 시 배너가 사라지고 스켈레톤으로 | **이것이 실패 표현.** 문구 1종 + '다시 시도'. **status 로 분기하지 않는다**(§7 #7) | N/A — 입력 없음 | §4.1 공통 규칙 적용 — 권한 부족(403)도 이 배너 | 재시도는 같은 조회를 재발행. 조건은 URL 에 남는다 | N/A — 표시 전용 |
| FS-073-EL-015 | 담긴 것이 0건이면 `QUOTE_ISSUE_EMPTY` 가 먼저 막는다 | 진행 중 버튼 `loading` | 중간 실패는 토스트 1건. **이미 저장된 문의는 되돌려지지 않는다**(§7 #8) | `quoteIssueBlock` 4분기가 정본. 발행기가 미배선이면 `issueQuote` 가 `null` 을 주고 화면이 던진다(`:211-212`) — 그러나 그 경로는 `basketBlock` 이 먼저 막는다 | **`canUpdate` 가 false 면 도달 경로가 없다** | **이중 방어**: ① 호출부 `quoteIssueBlock` ② 저장소 `findQuoteBySource` 교차 확인(`quotes/data-source.ts:148-151`) ③ 문의 쪽 `applyQuoteIssued` 의 `quoteId !== '' → 그대로 반환`(`_shared/store.ts:160`) | 담긴 건수만큼 **순차 `await update`** — N 회 요청. 상한 없음(§7 #8) |
| FS-073-EL-016 | 담긴 것이 없으면 지울 것도 없다 | N/A — 동기 | N/A — 서버 호출 없음 | N/A — 입력 없음 | §4.1 공통 규칙 적용 | **필터·검색이 바뀌면 무조건 비운다** — 화면에 없는 문의가 담긴 채 발행되지 않게 | N/A — 순수 규칙 |
| FS-073-EL-017 | N/A — 항상 표시 | 조회 중에도 표시 | 조회 실패 화면에도 '목록으로'가 있다(EL-020) | N/A — 입력 없음 | §4.1 공통 규칙 적용 | 저장 중에도 누를 수 있다 — 이탈 시 EL-039 가 abort | N/A — 단일 버튼 |
| FS-073-EL-018 | N/A — 정적 문구 | 로딩 중에도 표시 | 조회 실패 시 이 블록 자체가 렌더되지 않는다(에러가 early return) | N/A — 입력 없음 | §4.1 공통 규칙 적용 | N/A | 고정 문구 |
| FS-073-EL-019 | N/A — 도착 전 상태 | **이것이 로딩 표현.** 문구 1줄 | 조회 실패 시 EL-020 으로 | N/A — 입력 없음 | §4.1 공통 규칙 적용 | 조건이 데이터 유무라 **재조회 중에는 뜨지 않는다** | N/A — 단건 |
| FS-073-EL-020 | N/A — 실패 상태 | 404 에는 재조회 수단이 없다(의도) | **이것이 실패 표현.** 404 와 그 밖을 문구·버튼으로 가른다(EXC-12 충족) | N/A — 입력 없음 | §4.1 공통 규칙 적용 — **권한 부족(403)은 '불러오지 못했습니다'로 뭉개진다**(§7 #7) | **저장 성공 후 재조회가 실패하면 화면 전체가 이 배너로 바뀐다**(§7 #22) | N/A — 표시 전용 |
| FS-073-EL-021 | 제목이 비면 배지만 남는다 | EL-019 로 대체 | EL-020 으로 대체 | N/A — 읽기 전용 | §4.1 공통 규칙 적용 | 조회 시점 값 | 제목이 길면 카드 제목이 늘어난다 |
| FS-073-EL-022 | N/A — 오류 없으면 미렌더 | 재저장 시 먼저 지운다(`:168`) | **이것이 저장 실패 표현.** 문구 1종. abort 는 표시하지 않는다 | 클라이언트 검증 위반은 여기 오지 않는다(EL-025 인라인) | §4.1 공통 규칙 적용 — 403 도 이 문구 | **409(어댑터가 던진다 — `crud.ts:257`)도 이 문구.** 충돌 다이얼로그가 없다(§7 #23) | 1건만 표시 |
| FS-073-EL-023 | N/A — 항상 2개 | 상세 로딩 중 미표시 | 조회 실패 시 미표시 | N/A — 파생값 | §4.1 공통 규칙 적용 | 조회 시점 값 | 2개 고정 |
| FS-073-EL-024 | 값이 빈 문자열이면 빈 `dd`. `answeredAt` 이 비면 '미답변' | 상세 로딩 중 미표시 | 조회 실패 시 미표시 | N/A — 읽기 전용 | §4.1 공통 규칙 적용 — 개인정보 은닉은 BE-073 | 저장 후 재조회로 갱신 | **본문 `pre-wrap`** — 줄바꿈이 보존된다. 길이 상한 없음 |
| FS-073-EL-024.1 | 미발행이면 '아직 발행된 견적이 없습니다.' | 상세 로딩 중 미표시 | 조회 실패 시 미표시 | N/A — 표시 전용 | §4.1 공통 규칙 적용 | 견적이 삭제돼도 `quoteId` 가 남아 링크가 404 로 간다(§7 #21) | 문의 1건당 최대 1개 |
| FS-073-EL-025 | 초기값은 원본 답변(미답변이면 빈 문자열) | `disabled={saving \|\| !canUpdate}` | 저장 실패는 EL-022. 실패 시 **입력 보존** | 1000자 네이티브 `maxLength` + 제출 시 zod(EL-033). **상한 도달 시 경고 없이 입력이 멈춘다**(카운터만) | **권한이 없으면 비활성**되지만 **렌더는 된다** — 버튼과 달리 숨기지 않는다(§7 #24) | 상세 재조회가 오면 입력이 원본으로 덮인다(§7 #16) | 1000자. 붙여넣기도 `maxLength` 가 자른다 |
| FS-073-EL-025.1 | 답변이 비어 있는 종결 문의면 빈 문단이 남는다 | 상세 로딩 중 미표시 | 조회 실패 시 미표시 | N/A — 읽기 전용 | §4.1 공통 규칙 적용 | 종결은 되돌릴 수 없어 상태가 되돌아오지 않는다 | `pre-wrap` |
| FS-073-EL-026 | N/A — 조건부 | 로딩과 무관 | 조회 실패 시 미표시 | N/A — 입력 없음 | **이것이 권한 없음의 표현이다** | 권한 강등이 재렌더로 반영된다 | 1건 고정 |
| FS-073-EL-027 | N/A — 항상 표시 | 저장 중 비활성 | N/A — 서버 호출 없음 | N/A — 입력 없음 | **게이팅 없음** — 이동 버튼이라 정당하다 | N/A | N/A |
| FS-073-EL-028 | N/A — 조건부 | 저장 중 비활성 | 저장 실패는 EL-022 | **전이 술어가 존재를 정한다** — 접수가 아니면 렌더되지 않는다. 저장소도 같은 규칙으로 던진다(`_shared/store.ts:147`) | **`canUpdate` 가 false 면 렌더되지 않는다** | 다른 관리자가 먼저 착수하면 재조회 후 버튼이 사라진다 — **그 사이 클릭은 저장소가 던져 막는다** | 단건 |
| FS-073-EL-029 | N/A — 조건부 | 저장 중 비활성 | 저장 실패는 EL-022 | 답변 완료가 아니면 렌더되지 않는다. 저장소도 던진다(`_shared/store.ts:141`) | **`canUpdate` 가 false 면 렌더되지 않는다** | 위와 같다 | 단건 |
| FS-073-EL-030 | N/A — 조건부 | 저장 중 비활성 | 저장 실패는 EL-022 | `quoteIssueBlock` 이 null 일 때만 렌더 — **버튼의 존재 조건과 저장의 거절 조건이 같은 술어**(`:158` 주석) | **`canUpdate` 가 false 면 렌더되지 않는다** | **`quoteId` 가 멱등키다** — 두 번 눌러도 견적은 하나(`_shared/store.ts:160`, 회귀 `inquiries.test.ts:439-442`). 저장소도 `findQuoteBySource` 로 교차 확인 | 단건 |
| FS-073-EL-031 | N/A — 조건부 | 요청 중 `loading` + 비활성 | 실패 시 EL-022, 버튼 재활성, 이동 없음, 입력 보존 | 미변경(`!dirty`)이면 비활성. 검증 실패 시 요청 없이 EL-025 에 인라인 오류 | **`canUpdate` 가 false 면 렌더되지 않는다** | **동기 제출 락·멱등키가 없다** — 비활성 렌더 전 연타가 두 번째 요청을 통과시킬 수 있다(§7 #15). **완화**: 문의 한 벌 전체 치환이라 두 번 실행돼도 최종 상태가 같다 | 단건. 문의 전체(12필드)를 보낸다 |
| FS-073-EL-032 | N/A — 규칙 | 진행 중 `saving` 이 네 버튼을 함께 잠근다 | `isAbort` 면 조용히 반환, 아니면 배너 | N/A — 조립 규칙 | §4.1 공통 규칙 적용 | 성공 시 `refetch()` 로 상세를 다시 읽는다 — 목록·상세 키는 `useCrudUpdate` 가 무효화한다(`crud.ts:357-358`) | 요청 1건 |
| FS-073-EL-033 | 빈 답변은 막힌다 | N/A — 동기 판정 | N/A — 서버 호출 없음 | **이것이 유효성 규칙 자체다.** 2조건(공백 아님 · 1000자 이하). 서버 422 를 필드로 되돌릴 경로가 없다(§7 #25) | §4.1 공통 규칙 적용 | N/A — 순수 판정 | trim 길이 기준(UTF-16 code unit) |
| FS-073-EL-034 | 상세 도착 전에는 빈 문자열이라 `dirty=false` | 도착 전에는 판정 대상이 없다 | 조회 실패면 폼 자체가 사라진다 | N/A — 판정 규칙 | §4.1 공통 규칙 적용 | **재조회가 편집 중 입력을 덮는다**(§7 #16) | N/A — 순수 판정 |
| FS-073-EL-035 | 미답변이면 `answeredAt` 이 빈 문자열이라 이번 저장이 채운다 | N/A — 동기 | N/A | **이것이 불변 규칙이다** | §4.1 공통 규칙 적용 | 시각은 **클라이언트 시계**(`new Date().toISOString()` — `:198`)다. 두 관리자의 시계가 다르면 응대 속도가 갈린다(§7 #26) | N/A |
| FS-073-EL-036 | 값이 비면 빈 `dd` | 상세 로딩 중 미표시 | 조회 실패 시 미표시 | N/A — 읽기 전용 | §4.1 공통 규칙 적용 — **마스킹 없음**(§7 #17) | 조회 시점 값 | 3행 고정 |
| FS-073-EL-037 | 이벤트는 **최소 1건**(접수)이라 '기록된 이력이 없습니다.'가 뜰 수 없다 | 상세 로딩 중 미표시 | 조회 실패 시 미표시 | N/A — 파생값 | §4.1 공통 규칙 적용 — 내부 메모 개념이 없어 노출 경계 문제가 없다 | **파생이라 본문과 갈라질 수 없다** — 답변을 고치면 이력도 함께 바뀐다 | 최대 5칸(접수·답변 중·견적 발행·답변·종결). **무한히 늘지 않는다** |
| FS-073-EL-038 | N/A — 변경이 있어야 성립 | 저장 중에는 비활성(`dirty && !saving`) | N/A — 서버 호출 없음 | N/A — 입력 없음 | §4.1 공통 규칙 적용 | 저장 성공 후 재조회가 `answer` 를 동기화해 dirty 가 풀린다 | N/A |
| FS-073-EL-039 | N/A — 진행 요청이 있어야 성립 | **이것이 취소 규칙** | **abort 는 실패가 아니다** | N/A — 입력 없음 | §4.1 공통 규칙 적용 | 이탈 시 진행 중 저장이 취소된다 — **서버 도달 여부는 보장하지 않는다** | 단건. **목록의 발행 뮤테이션은 덮지 않는다**(§7 #18) |

### 4.1 공통 예외 규칙

| 규칙 | 내용 |
|---|---|
| 네트워크 단절 | 목록 조회 실패는 껍데기 안 배너(EL-014), 상세 조회 실패는 화면 대체 배너(EL-020), 저장 실패는 카드 배너(EL-022), 목록 견적 발행 실패는 **토스트**(EL-008). **오프라인 감지·복귀 재조회는 앱 전역에 없다**(`navigator.onLine` 0건) — §7 #27 |
| 세션 만료 | 조회·저장 어디서든 401 이 오면 앱 전역 401 인터셉터(`shared/query/queryClient.ts:60-66` — `QueryCache`/`MutationCache` `onError` → `handleQueryLayerError` → `notifySessionExpired()`)가 세션을 폐기하고 `/login?returnUrl=<현재경로>&reason=session_expired` 로 보낸다. **미저장 답변은 그때 사라진다** — 프로그램 이동이라 EL-038 가드가 발화하지 않는다 |
| 요청 타임아웃 | 프론트 타임아웃 상한 없음(`AbortSignal.timeout` 앱 전역 0건). abort 는 상세 언마운트(EL-039)에서만 발생한다 |
| 중복 제출 | 상세의 네 액션은 `saving` 으로 함께 비활성되고, 목록의 발행 버튼도 `issue.isPending` 으로 잠긴다. **동기 제출 락(`submitLockRef`)·멱등키가 없다** — 두 화면 모두 `useCrudForm` 이 아니라 `useCrudUpdate`/`useMutation` 을 직접 쓰기 때문이다(그 훅의 `submitLockRef`(`useCrudForm.ts:130`)·`idempotencyKeyRef`(`:145`)를 상속하지 못했다). **어댑터는 이미 멱등 원장을 갖고 있다**(`crud.ts:193,229,243`) — 키만 실으면 성립한다. **완화**: 견적은 `quoteId` 와 `findQuoteBySource` 두 겹이 막고, 답변 저장은 전체 치환이라 최종 상태가 같다 — §7 #15 |
| 실패 통지의 자리 | ① 목록 조회 실패는 인라인 배너 ② 상세 조회 실패는 화면 대체 배너(404/그 밖 분기) ③ 저장 실패는 카드 안 배너 ④ **목록 견적 발행 실패만 토스트** — 같은 화면 안에서 실패 통지의 자리가 갈린다(§7 #28) ⑤ 쓰기 **성공**은 토스트 ⑥ abort 는 아무것도 띄우지 않는다 |
| 낙관적 업데이트 | **이 화면에 없다.** 저장은 비관적(요청 완료 후 재조회 — `:177`)이다 — 롤백 경로가 필요 없다 |
| 동시 조회 | 목록/상세 조회는 각각 1건만 유지된다(react-query). 전역 기본값: `staleTime` 상수(`queryClient.ts:70`) · `retry: false`(`:82`) · `refetchOnWindowFocus: false`(`:90`). 목록은 `placeholderData: (previous) => previous`(`crud.ts:298`)라 재조회 중 이전 행이 유지되지만, **상세는 그것을 쓰지 않는다**(`useQuery` 직접 호출 — `ProductInquiryDetailPage.tsx:131-135`). 검색어는 쿼리 키에 들어가지 않는다(전량을 받아 클라이언트가 거른다) — last-response-wins 경쟁 자체가 없다 |
| 권한 없음 | 라우트 **read** 권한은 AppShell 의 `RequirePermission` 이 `<Outlet>` 바깥에서 가드해 403 화면을 렌더한다. `/products/inquiries` 는 `/products` 보다 긴 잎이라 별개 리소스로 갈린다(`nav-config.ts:382-391` `findCoveringLeaf` 의 '더 긴 잎이 더 구체적이다' 규칙과 같은 `covers()` 를 권한 파생이 쓴다). **쓰기 게이팅은 이 화면이 실제로 배선했다**(`useRouteWritePermissions().canUpdate` — 목록 `:148` · 상세 `:129`) — 담기 열, 견적 바구니 막대, 답변 착수·문의 종결·견적 발행·답변 저장 버튼이 **렌더되지 않는다**. **다만 답변 textarea 는 숨지 않고 비활성만 된다**(§7 #24). 서버 권한 응답(403)은 조회=배너, 저장=카드 배너로 떨어지며 권한 문구로 갈리지 않는다(§7 #7) |
| 렌더 예외 | AppShell 이 `<Outlet>` 바로 바깥에 `ErrorBoundary` 를 둔다 — 화면이 던져도 사이드바·헤더가 남고 복구 화면이 뜬다 |
| 행 선택의 수명 | 목록에 **삭제용 행 선택이 없다**(`CrudReadListShell` 이 `NO_SELECTION` 을 고정으로 넘긴다 — `CrudReadListShell.tsx:87,130`). 대신 **견적 바구니**라는 별도 선택이 있고, 그 수명은 EL-016 이 정한다(필터·검색이 바뀌면 비운다) |
| 상태 전이 규칙 | **네 술어가 정본이다**(`_shared/store.ts:101-118`): `canIssueQuote`(종결 아님) · `canAnswer`(종결 아님) · `canClose`(답변 완료) · `canBeginAnswering`(접수). 화면은 버튼의 **존재 조건**으로 그것을 읽고, 저장소는 같은 술어로 던진다(`:128,141,147,161`) — **눌리는데 실패하는 버튼이 없다**. 되돌아가는 전이는 없다(`:26-28`). 서버는 위반을 409 로 되돌려야 한다(`data-source.ts:23-25`) |
| 견적 발행의 멱등 | **세 겹이다**: ① 화면 — `quoteIssueBlock` 이 이미 발행된 후보를 막는다(`quote-issue.ts:138`) ② 문의 — `applyQuoteIssued` 가 `quoteId !== ''` 면 원본을 그대로 반환한다(`_shared/store.ts:160`) ③ 견적 저장소 — `issueQuoteFromSources` 가 `findQuoteBySource` 로 교차 확인해 **기존 견적을 돌려준다**(`quotes/data-source.ts:148-151`). 서버에서는 이 셋이 한 트랜잭션이어야 한다(`quotes/data-source.ts:142-143` TODO) |

## 5. 서버 연동 지점

| 요소번호 | 이름 | 읽기/쓰기 | 필요 데이터 | 프론트 어댑터 | 비고 |
|---|---|---|---|---|---|
| EL-001 / EL-006 / EL-009 / EL-011 / EL-014 | 문의 목록 조회 | R | 문의 전량(필터·검색·정렬·페이징 없이) | `productInquiryAdapter.fetchAll(signal)`(`data-source.ts:26-33`) — `list` 가 `sortProductInquiries` 를 건다(`:28`) | 필터·검색이 **전부 클라이언트**다. 서버는 조건을 받지 않는다 |
| EL-019 / EL-020 / EL-021 / EL-024 / EL-037 | 문의 상세 조회 | R | 문의 1건 | `productInquiryAdapter.fetchOne(id, signal)` → `useQuery([PRODUCT_INQUIRY_RESOURCE,'detail',id])`(`ProductInquiryDetailPage.tsx:131-135`) | 목록과 **같은 타입**이다(`ProductInquiry` 하나뿐). 없는 id 는 `HttpError(404)`(`crud.ts:217-219`) |
| EL-028 / EL-029 / EL-031 / EL-032 | 답변·상태 전이 저장 | W | 문의 id + `ProductInquiryInput` 전체(12필드) | `productInquiryAdapter.update(id, input, context?)` → `useCrudUpdate`(`:138`) | **전체 치환**(PATCH 가 아니다). 성공 시 목록·상세 키 무효화(`crud.ts:357-358`). **`context.idempotencyKey` 를 실을 자리가 있으나 호출부가 넘기지 않는다**(§7 #15) |
| EL-030 / EL-008 / EL-015 | 견적 발행(부수효과 포함) | W | `QuoteIssueSource[]`(문의 id·문의번호·채널 `'product'`·거래처 라벨=문의자명·문의자명·품목명=상품명·본문) → 발행 후 문의마다 `quoteId`+상태 저장 | ① `issueQuote(sources)`(`quote-issue.ts:153-156`) — **배선된 구현은 `issueQuoteRef`**(`quotes/data-source.ts:163-166` → `issueQuoteFromSources` `:144-155`), 꽂는 곳은 `wiring.ts:188` ② 이어서 문의마다 `productInquiryAdapter.update` | **문의 화면은 견적 모듈을 import 하지 않는다** — 페이지 간 결합 금지(`quote-issue.ts:13-17`). 서버 심: `quotes/data-source.ts:142-143` `// TODO(backend): POST /api/sales/quotes/issue — 서버가 문의 잠금 + 견적 생성 + 역링크 설정을 한 트랜잭션으로 처리하고, 이미 발행된 문의가 섞여 있으면 409 로 거절한다` |
| EL-011.10 / EL-024.1 | 발행 견적 역참조 | R | 견적 id | 없음 — **링크 경로만 만든다**(`issuedQuoteHref` — `quote-issue.ts:81-83`). 견적의 존재 여부를 확인하지 않는다 | 견적이 삭제되면 끊어진 링크가 된다(§7 #21) |
| (메뉴 판정) | 잔여 문의 집계 | R | `{ total, open, slaBreached, averageResponseHours, byTarget }` | `readInquiryBacklog('product')`(`inquiry-backlog.ts:51-53`) — 구현은 `wiring.ts:199-217` 이 `listProductInquiries()` 를 접어 만든다(`inquiryBacklogOf` — `:85-105`, SLA 24시간 `:67`) | **이 화면이 아니라 사이드바·대시보드·통계가 읽는다.** 서버에서는 집계 엔드포인트여야 한다 |
| (범위 밖) | 문의 등록 | — | — | `productInquiryAdapter.create` — **동작하지만 호출부 0건** | 고객 채널이 만든다(§1) |
| (범위 밖) | 문의 삭제 | — | — | `productInquiryAdapter.remove` — **동작하지만 호출부 0건** | 화면에 진입점이 없다 |

> **현재 구현 상태 (백엔드 명세 참고)**: 백엔드는 없다. `productInquiryAdapter` 는 공용 `createStoreAdapter`(`shared/crud/crud.ts:190-283`)를 `_shared/store.ts` 의 모듈 스코프 배열(`inquiries` — `:212-291`, 시드 5건) 위에 배선한 것으로, 400ms 지연(`LATENCY_MS` — `dev.ts:12`)과 개발용 실패 스위치(`failIfRequested`/`?status=save:409` 류 — `dev.ts:16-38`)를 얹어 CRUD 를 흉내 낸다 — 실제 네트워크 0건. 팩토리 덕에 **없는 id 의 `fetchOne` 은 `HttpError(404)`**(`crud.ts:217-219`), **없는 id 의 `update` 는 `HttpError(409, '다른 사용자가 먼저 삭제한 항목입니다.')`**(`:257`)라 유령 저장이 구조적으로 불가능하고, **멱등 원장**(`createIdempotencyLedger` — `:67`)도 이미 연결돼 있다. 새로고침하면 시드로 되돌아간다. 이 화면의 연동 지점은 `data-source.ts:23-25` 한 덩이(`// TODO(backend): GET /api/products/inquiries · GET/PUT /api/products/inquiries/:id · 답변 저장은 본문·답변시각·상태를 한 트랜잭션으로 옮긴다(applyAnswer 와 같은 규칙). · 종결은 답변이 나간 문의에만 허용하고, 위반은 409 로 되돌린다`)이고, 견적 발행 쪽 심은 `quotes/data-source.ts:142-143` 에 따로 있다. 위 표는 백엔드 연결 후 의도된 동작이다.

## 6. 자기 점검 (제출 전 확인)

- [x] 구현 소스를 전수 대조했다 — `ProductInquiryListPage.tsx`(409행) · `ProductInquiryDetailPage.tsx`(423행) · `types.ts`(269행) · `validation.ts`(29행) · `data-source.ts`(33행) · `_shared/store.ts`(353행) · `inquiries.test.ts`(489행) + 소비하는 공용 모듈(`shared/crud/{CrudReadListShell,CrudTable,DetailCellLink,crud,useListState,parseFilter,dev}` · `shared/domain/quote-issue.ts` · `shared/commerce/inquiry-backlog.ts` · `shared/layout/nav-config.ts` · `shared/query/queryClient.ts` · `src/wiring.ts` · `pages/sales/quotes/{data-source,types}.ts`)
- [x] **상태 union 이 영업 문의(FS-051)와 같지 않음을 코드로 확인**했다 — 여기 5종(`_shared/store.ts:35`) vs 영업 7종. `answering` 은 영업에 없다. 코드 주석(`:30-33`)의 '어휘는 빌리고 문구는 각자 갖는다'를 §1.1 ②에 인용했다
- [x] **메뉴가 조건부이되 라우트는 살아 있음을 코드로 확인**했다 — `visibleWhen: 'pg-off'`(`nav-config.ts:190`) · `resolveNavLeaf`(`:314-324`) vs `collectNavRoutes`(`:327-333`, 근거 주석 `:311-312`) · `App.tsx:331-332`
- [x] **견적 발행의 멱등이 세 겹임을 코드로 확인**했다 — 화면(`quoteIssueBlock`) · 문의(`applyQuoteIssued` `:160`) · 견적 저장소(`findQuoteBySource` — `quotes/data-source.ts:148-151`). 회귀 `inquiries.test.ts:431-473`
- [x] **쓰기 게이팅이 실제로 배선돼 있음을 코드로 확인**했다(`useRouteWritePermissions` — 목록 `:148` · 상세 `:129`) — 영업 문의(FS-051 §7 #27)와 갈리는 지점이라 §4.1 에 명시했다. 다만 답변 textarea 만 숨지 않고 비활성됨을 §7 #24 로 남겼다
- [x] 보이지 않는 요소(스켈레톤·빈 상태·실패 배너 3종·이탈 가드·행 클릭 규칙·바구니 수명 규칙·발행 규칙·dirty 규칙·최초 답변 시각 불변 규칙·검증 규칙·abort·낭독 영역)에 번호를 줬다
- [x] §4 예외 7축 빈칸 0건. 모든 `N/A` 에 사유
- [x] `[서버]` = O 요소가 §5 에 전부 요약됐다. 견적 발행이 **어댑터가 아니라 공통 층 이음매**를 지나며 실제 구현이 `wiring.ts:188` 로 꽂힘을 명시했다
- [x] 엔드포인트·HTTP·에러코드·DB 스키마를 쓰지 않았다 (BE-073 영역) — 단 어댑터가 실제로 던지는 `HttpError(404)`/`HttpError(409)` 는 **화면 동작의 원인**이라 §4·§5 에 사실로만 인용했다
- [x] `/sales/inquiries`(FS-051) · `/programs/inquiries`(FS-076) · `/support/tickets`(FS-026)와 **다른 화면**임을 §1·§1.1 에 명시했다
- [x] 프로그램 문의(FS-076)와 **정말 같은 부분**은 그 문서가 이 문서를 가리키게 하고, 여기서는 상품 고유의 사실(경과 3일 기준·`storefront`='상품 페이지'·유형 축 없음)을 적었다

## 7. 미결 사항 (UI 기획 / 아키텍처 / 백엔드 명세 / 프론트 구현 이관)

| # | 내용 | 이관 대상 |
|---|---|---|
| 1 | 대응 SCR 문서 부재 (상품 관리 SCR 미작성). **`specs/README.md` §3 상품 관리 표에도 이 화면이 없다** — 색인이 실재하는 라우트를 놓치고 있다 | UI 기획 / 아키텍처 |
| 2 | **상품 문의와 영업 문의의 상태 union 이 다른데 `quote_issued` 만 같다.** 두 도메인의 '견적 발행' 건수를 한 지표로 합산하려면 그 사실을 아는 층이 필요하다 — 지금 그런 층은 없다(`readQuoteFunnel`(`inquiry-backlog.ts:89`)은 견적 쪽에서 세지 문의 상태를 보지 않는다). 어휘를 빌린 목적(합산 가능성)이 아직 실현되지 않았다 | 아키텍처 (도메인 경계) · 백엔드 명세 |
| 3 | **페이지네이션이 없다** — `CrudReadListShell` 이 전량을 렌더하고 검색·필터도 전량을 매번 훑는다. 문의는 상한 없이 매일 쌓이는 컬렉션이다(quality-bar IA-04 P0). 순번(`index + 1`)도 그때 `startIndex` 가 필요해진다 | UI 기획 · 백엔드 명세 |
| 4 | **표 캡션이 행 클릭 이동을 말하지 않는다.** `CrudTable.tsx:254-257` 이 `canUpdate=false` 면 `rowTargetSentence` 를 버리고 `'상품 문의 목록 — 조회 전용입니다.'` 로 고정한다 — 그런데 `rowTarget.kind === 'detail'` 이라 **행 클릭은 살아 있다**(`:306`). 캡션이 화면이 하는 일을 말하지 않는다. 읽기 전용 목록 전부(문의·상담·티켓·반품)에 걸린다 | UI 기획 (껍데기 소유) |
| 5 | **경과의 기준일이 하드코딩 `TODAY = '2026-07-21'`** 이다(목록 `:81` · 상세 `:68`). 사유는 스토리북 회귀 고정이고 주석이 '백엔드가 붙으면 서버가 내려주는 기준 시각으로 바뀐다'고 적었다 — 그러나 지금 상태로는 **날짜가 지나도 '3일째 미답변'이 늘지 않는다.** 운영 값이 아니다 | 백엔드 명세 · 프론트 구현 |
| 6 | 목록의 '견적 보기'(EL-011.10)가 **DS `Link` 가 아니라 네이티브 `<a href>`** 다(`:285`) — 클릭하면 SPA 라우팅이 아니라 **전체 페이지 재적재**가 일어난다. 상세(EL-024.1)는 `Link` 를 쓴다(`:322`) — 같은 목적지에 두 규칙이 있다 | 프론트 구현 |
| 7 | **status 분기가 조회에만 있고 저장에는 없다.** 상세 조회는 404/그 밖을 정확히 가르는데(EL-020) 저장 실패(EL-022)·목록 조회 실패(EL-014)는 403·409·422·500 을 한 문구로 뭉갠다. **참조 코드도 없다** — `useCrudForm` 은 `errorReference`(`useCrudForm.ts:222`)를 주는데 이 화면이 그 훅을 쓰지 않아 상속하지 못했다(quality-bar EXC-06 · EXC-20 P1) | UI 기획 쪽 변경 요청 |
| 8 | **다건 견적 발행이 원자적이지 않다.** `issue.mutationFn`(`:214-219`)이 담긴 문의를 `for` 로 돌며 **하나씩 `await update`** 한다 — 세 번째에서 실패하면 앞의 둘은 이미 `quoteId` 를 갖고 세 번째만 견적 없이 남는다. 견적은 이미 만들어져 있다. 롤백 경로가 없고 실패 토스트는 어느 것이 남았는지 말하지 않는다. 서버 계약(`quotes/data-source.ts:142-143`)이 이를 한 트랜잭션으로 뒤집는다 | 백엔드 명세 · UI 기획 |
| 9 | 이탈 가드(EL-038)가 **`navigate()` 프로그램 이동을 가로채지 못한다** — 상단 '목록으로'(EL-017)·카드 '목록으로'(EL-027)를 누르면 작성 중인 답변이 조용히 사라진다. 훅이 가로채는 것은 `<a>` 클릭이다 | UI 기획 쪽 변경 요청 |
| 10 | 상세가 **자체 `<h1>상품 문의 처리</h1>`(`:273`)를 그리고 AppHeader 도 `<h1>` 을 그린다** — `<h1>` 이 2개이고 어느 문의인지도 말하지 않는다(quality-bar IA-02 P0) | 프론트 구현 · UI 기획 |
| 11 | **같은 동작이 두 화면에서 다르게 끝난다.** 목록의 견적 발행은 성공 후 `navigate(issuedQuoteHref(...))` 로 견적 상세로 **이동**하고(`:226`), 상세의 견적 발행은 **머문다**(`:228-231`). 어느 쪽이 옳은지 확정이 필요하다 — 상세에 머무는 쪽은 '발행 견적' 링크가 재조회로 채워지므로 정당해 보이지만, 두 경로가 같은 일을 다르게 끝내는 것 자체가 학습 비용이다 | UI 기획 쪽 변경 요청 |
| 12 | 좌측 PG 안내문(EL-002)이 결제 설정으로 가는 **링크를 주지 않는다.** 프로그램 상세는 같은 사실을 말하며 `PAYMENT_SETTINGS_PATH` 링크를 준다(`ProgramDetailPage.tsx:405-407`) — 이 화면만 설명으로 끝난다 | UI 기획 쪽 변경 요청 |
| 13 | 견적 바구니 안내문(EL-003)이 **권한이 없어도 표시된다**(`:367-370` — `canUpdate` 밖) — 담기 열도 막대도 없는 사용자에게 '바구니에 담아 합칠 수 있습니다'를 설명한다. 바로 아래 EL-004 가 '조회만 가능합니다'라고 말해 두 문구가 모순된다 | UI 기획 쪽 변경 요청 |
| 14 | 상품명 셀이 ellipsis 로 잘리는데(`:121-127`) **`title` 속성도 툴팁도 없어 전체 값을 볼 수단이 없다.** 반대로 제목 셀(EL-011.5)은 truncate 가 없어 긴 값이 열을 넓힌다 — 한 표 안에서 두 규칙이 반대 방향으로 어긋난다(quality-bar COMP-09 P2) | UI 기획 쪽 변경 요청 |
| 15 | 저장·발행에 **동기 제출 락·멱등키가 없다.** 이 화면이 `useCrudForm` 을 쓰지 않아 `submitLockRef`(`useCrudForm.ts:130`)·`idempotencyKeyRef`(`:145`)를 상속하지 못했다. **어댑터·`useCrudUpdate` 쪽은 이미 키를 받을 준비가 돼 있다**(`crud.ts:229,243,354-355`) — 호출부가 넘기지 않을 뿐이다(quality-bar EXC-08 P0) | UI 기획 · 프론트 구현 |
| 16 | 상세 도착 시 `setAnswer(inquiry.answer)`(`:148-151`)가 **편집 중 재조회에서도 돈다** — 저장 후 재조회는 정상이나, 그 밖의 재조회가 오면 작성 중인 답변이 덮인다 | UI 기획 쪽 변경 요청 |
| 17 | 문의자 연락처(EL-036)와 이름(EL-011.4)이 **평문으로 노출된다** — 마스킹·부분 표시 정책이 프론트에 없다. 은닉은 서버가 정해야 한다 | 백엔드 명세 · UI 기획 |
| 18 | **목록의 견적 발행 뮤테이션에 abort 배선이 없다**(`:208-232` — `AbortController` 0건). 상세는 정확히 갖고 있다(`:144-145,169-175`). 발행 도중 화면을 떠나면 요청이 계속되고, 성공 콜백의 `navigate`·`toast` 가 언마운트 후에 돈다 | 프론트 구현 |
| 19 | 좌측 미답변 안내(EL-001)의 조건이 `loaded`(= `!firstLoading && error === null`)라 **조회 실패 시에도 '미답변 건수를 세는 중입니다.'** 가 남는다 — 실패를 로딩으로 위장한다. 배지(EL-006)는 같은 상황에서 `'—'` 로 정직하다 | 프론트 구현 |
| 20 | `productName` 이 비정규화 스냅샷이라(`_shared/store.ts:44`) **상품명이 바뀌어도 과거 문의는 옛 이름을 보인다.** 프로그램 카테고리는 라벨 전파를 저장소가 하는데(`programs/_shared/store.ts:507-509`) 여기에는 대응물이 없다 — 의도인지(접수 시점 기록) 미구현인지 확정이 필요하다 | 아키텍처 (도메인) · 백엔드 명세 |
| 21 | 견적 역링크가 **끊어질 수 있다** — 견적이 삭제돼도 문의의 `quoteId` 는 남아 '견적 보기'가 404 로 간다. 반대로 `quoteId` 가 남아 있으면 `quoteIssueBlock` 이 **재발행도 막는다** — 견적을 잃은 문의는 영원히 견적을 가질 수 없다 | 백엔드 명세 · UI 기획 |
| 22 | 저장 성공 직후 `detailQuery.refetch()`(`:177`)가 실패하면 **화면 전체가 EL-020 배너로 대체**된다 — 방금 저장에 성공했는데 '불러오지 못했습니다'만 남는다 | UI 기획 쪽 변경 요청 |
| 23 | **409 를 해소할 UI 가 없다.** 어댑터가 409 를 정확히 던지는데(`crud.ts:257`) 이 화면이 `useCrudForm` 을 쓰지 않아 그 훅의 충돌 다이얼로그(`useCrudForm.ts:193-206`, 입력 보존 + reload/dismiss)를 상속하지 못했다. 프로그램 폼(FS-074)은 그것을 갖고 있다(quality-bar EXC-04 P0) | UI 기획 쪽 변경 요청 |
| 24 | 답변 textarea(EL-025)만 **권한 없을 때 숨지 않고 비활성된다**(`disabled={saving \|\| !canUpdate}` — `:342`). 같은 카드의 버튼 넷은 전부 렌더 자체를 안 한다 — '누를 수 없는 것을 보여 주지 않는다'는 이 화면의 규칙(주석 `:364`)에서 이 필드만 예외다 | UI 기획 쪽 변경 요청 |
| 25 | **서버 검증 오류(422)를 필드로 되돌릴 경로가 없다** — `useCrudForm` 의 `setError`+`setFocus`(`useCrudForm.ts:209-219`)를 상속하지 못했다. 모든 저장 실패가 카드 배너로 간다(quality-bar EXC-07 P1) | UI 기획 |
| 26 | 답변 시각이 **클라이언트 시계**다(`new Date().toISOString()` — `:198`). `applyAnswer` 가 `at` 을 인자로 받는 것은 테스트를 위한 것이고(`_shared/store.ts:125`), 운영에서는 브라우저 시계가 그대로 감사 기록이 된다. 서버가 찍어야 한다 | 백엔드 명세 |
| 27 | 프론트 타임아웃 상한 없음(`AbortSignal.timeout` 0건) · 오프라인 감지 없음(`navigator.onLine` 0건) · 세션 만료 리다이렉트가 작성 중 답변을 버린다(가드 미발화)(quality-bar EXC-05 · EXC-11 · EXC-19 P1) | UI 기획 · 프론트 구현 |
| 28 | **한 화면 안에서 실패 통지의 자리가 갈린다** — 목록의 견적 발행 실패만 토스트고(`:230`) 나머지 실패는 전부 배너다. 토스트는 자동 소멸하므로 놓치면 사라진다: 견적 발행은 이 화면에서 가장 무거운 쓰기인데 가장 약한 통지를 쓴다 | UI 기획 쪽 변경 요청 |
