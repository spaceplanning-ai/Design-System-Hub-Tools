---
id: FS-076
title: "프로그램 문의 (목록·상세 답변·견적 발행)"
screen: SCR-076               # ⚠ 프로그램 관리 SCR 미작성 — §7 미결 사항 참조
route: /programs/inquiries
owner: 기능 명세
reviewer: 명세 리뷰
gate: G9
status: draft
confirmedAt: 2026-07-22
version: 1.0
date: 2026-07-22
---

# FS-076. 프로그램 문의 (목록·상세 답변·견적 발행)

## 1. 화면 개요

| 항목 | 내용 |
|---|---|
| 목적 | 결제대행(PG)을 끈 프로그램 페이지의 '문의하기' 버튼으로 들어온 **후원자** 문의를 상태·유형 두 축으로 좁혀 훑고, 개별 문의에서 답변을 쓰고 상태를 옮기며(답변 착수·답변 저장·종결), 필요하면 **한 건 또는 여러 건을 한 장의 견적으로 발행**한다. 펀딩은 **마감이 있는 판매**라 답이 늦으면 후원 자체가 사라진다 — 그래서 이 목록의 중심 열도 제목이 아니라 **경과**다(`ProgramInquiryListPage.tsx:3-5`) |
| 역할(주 사용자) | 관리자. 목록·상세 모두 `useRouteWritePermissions().canUpdate` 를 실제로 배선했다(`ProgramInquiryListPage.tsx:146` · `ProgramInquiryDetailPage.tsx:131`) — 권한이 없으면 견적 바구니 열·모든 액션 버튼이 **렌더되지 않고** 안내문이 그 사실을 말한다(`:386` · `:365-367`) |
| 진입 경로 | 좌측 GNB > 프로그램 관리 > 문의 (`/programs/inquiries` — `nav-config.ts:202`). **조건부 메뉴다** — §1.1 |
| 포함 화면 | 목록 `/programs/inquiries` · 상세 답변 `/programs/inquiries/:id` (`App.tsx:340-341`) |
| **범위 밖** | **문의 등록·삭제** — 문의를 만드는 것은 후원자 채널이다(`_shared/store.ts:3-5,329`). 어댑터의 `add`/`remove` 는 `createStoreAdapter` 계약을 채우는 문일 뿐 호출부가 0건이다. 그래서 목록은 `CrudListShell` 이 아니라 **`CrudReadListShell`** 을 쓴다. **견적의 편집·발송** — FS-050(견적)이 소유한다. **상태를 직접 고르는 select** — 없다. 상태는 전이 규칙이 정한다(`ProgramInquiryDetailPage.tsx:6-9`). **프로그램 편집** — FS-074 가 소유한다 |
| 구현 경로 | `apps/admin/src/pages/programs/inquiries/**`(`ProgramInquiryListPage.tsx` · `ProgramInquiryDetailPage.tsx` · `types.ts` · `validation.ts` · `data-source.ts` · `_shared/store.ts` · `inquiries.test.ts`) + 이음매 `shared/domain/quote-issue.ts` · `shared/commerce/inquiry-backlog.ts` |
| 대응 SCR | SCR-076 (미작성 — §7 #1) |
| 공통 컴포넌트 | FS-073 §1 과 **동일하다** — `shared/crud/{CrudReadListShell,CrudTable,DetailCellLink,createStoreAdapter,useCrudListQuery,useCrudUpdate,useListState,parseFilter}` · `shared/ui/{Alert,Button,Card,CardTitle,FilterPanel,FilterRail,SearchField,StatusBadge,TextareaField,Timeline,…}` · `shared/permissions/RequirePermission` · `shared/domain/quote-issue` · `shared/errors/http-error(isNotFound)` · `shared/async(isAbort)` · `shared/format` |

### 1.1 상품 문의(FS-073)와의 관계 — 무엇이 같고 무엇이 다른가

**이 화면은 상품 문의의 쌍둥이다.** 두 모듈은 파일 구성·화면 골격·전이 규칙·견적 발행 경로가 **함수 이름의 접두사(`Program`)와 도메인 명사(프로그램/후원자)만 빼면 같다.** 아래에 **다른 것만** 적고, 같은 것은 그 사실을 명시한 뒤 FS-073 의 해당 절을 가리킨다 — 다만 요소 번호는 이 문서가 독립적으로 갖는다.

**① 조건부 메뉴 — FS-073 §1.1 ① 과 규칙이 완전히 같다.** 잎이 `visibleWhen: 'pg-off'`(`nav-config.ts:202`)이고 판정은 `inquiryMenuState(readPaymentSettings(), readInquiryBacklog('program'))`(`inquiry-backlog.ts:114-123`), `archive` 면 라벨에 `INQUIRY_ARCHIVE_SUFFIX = ' · 읽기 전용'`(`:132`)이 붙으며, **`collectNavRoutes()` 는 그 필터를 타지 않아 라우트가 살아 있다**(`nav-config.ts:327-333`, 근거 `:311-312`). 도메인 인자만 `'program'` 이고(`resolveNavLeaf` → `inquiryDomainOf(leaf.to)` — `:317`), 백로그 구현은 `wiring.ts:209-216` 이 `listProgramInquiries()` 를 접어 만든다(`targetId` 는 `programId`).

**② 상태 union — 상품 문의와 값 집합이 같고, 영업 문의(FS-051)와는 다르다.**
`ProgramInquiryStatus = 'received' | 'answering' | 'quote_issued' | 'answered' | 'closed'`(`_shared/store.ts:34-35`) — **5종**이다. 영업 문의는 7종이고 `answering` 이 없다. 주석이 그 판단을 적는다(`:29-32`): "영업 문의와 상품 문의가 이미 같은 사실을 `quote_issued` 라 부른다. 여기서 다른 이름을 지으면 같은 사건이 **세 이름**을 갖고, 세 목록의 '견적 발행'이 영원히 합쳐지지 않는다. **어휘는 빌리고 문구는 각자 갖는다.**" 실제로 `STATUS_META` 는 세 모듈이 각자 갖는 별개 상수다(`types.ts:31-38`).

**③ 이 화면에만 있는 축 — 문의 유형(topic).**

| | 상품 문의 | 프로그램 문의 |
|---|---|---|
| 필터 축 | 상태 1개 | **상태 + 유형 2개**(`ProgramInquiryListPage.tsx:390-405`) |
| 유형 값 | 없음 | `reward`(리워드) · `delivery`(배송) · `refund`(환불) · `payment`(결제) · `etc`(기타) — `_shared/store.ts:45` |
| 표 열 | 8열 | **9열**(유형 배지 1열 추가 — `:261-270`) |

**왜 이 축이 필요한가**가 코드에 있다(`_shared/store.ts:40-44` · `types.ts:63-66`): 프로그램은 **아직 만들어지지 않은 것에 돈을 먼저 거는 일**이라 문의가 리워드 구성·배송 예정·환불 조건에 몰리고, **처리하는 사람이 다르다** — 리워드·배송은 창작자 확인이 필요하고 환불·결제는 운영이 바로 답할 수 있다. 톤도 그 판단을 따른다(`types.ts:67-73`): **돈이 걸린 유형(환불·결제)이 warning**, 나머지는 info/neutral(회귀 `inquiries.test.ts:225-230`).

**④ 지연 경고가 하루 빠르다.** `OVERDUE_DAYS = 2`(`types.ts:214`) — 상품 문의는 3이다(`products/inquiries/types.ts:145`). 이유가 코드에 있다(`types.ts:208-213`): "펀딩은 **마감이 있는 판매**라, 답이 늦으면 후원 자체가 사라진다. 답을 못 받은 사람은 기다리지 않고 그냥 후원을 접는다." 회귀가 그 차이를 못박는다(`inquiries.test.ts:397-406`).

**⑤ 낱말이 다르다.** 채널 `storefront` = **'프로그램 페이지'**(`types.ts:99`, 상품은 '상품 페이지'). 처리 이력의 접수 작성자 = **'후원자'**(`types.ts:269`, 상품은 '고객'). 문의번호 접두사 = **`PGQ-`**(`_shared/store.ts:314`, 상품은 `PIQ-`). 견적 발행 채널 = `'program'`(`:180`). 리소스 키 = `'program-inquiries'`(`data-source.ts:21`). 답변 placeholder = '후원자에게 전달할 답변을 입력하세요.'(`ProgramInquiryDetailPage.tsx:354`).

**⑥ 처리 이력의 접수 문구가 두 축을 함께 말한다.** `` `${채널} 채널로 ${유형} 문의가 접수되었습니다.` ``(`types.ts:286`) — 상품 문의는 채널만 말한다(`products/inquiries/types.ts:219`). 회귀 `inquiries.test.ts:417-423`.

**⑦ 그 밖은 전부 같다** — 상태 전이 술어 4개(`canAnswerProgramInquiry`·`canCloseProgramInquiry`·`canBeginAnsweringProgramInquiry`·`canIssueProgramQuote` — `_shared/store.ts:104-121`), 답변·상태를 한 함수가 옮기는 규약(`applyProgramAnswer` — `:130-144`), `answeredAt` 불변 규칙(`:141`), 견적 발행 멱등(`applyProgramQuoteIssued` — `:164-168`), 답변 검증(`programInquiryAnswerSchema` — `validation.ts:11-18`), 처리 이력이 저장된 사실에서 **파생**된다는 설계(`types.ts:272-277`), 읽기 전용 껍데기, URL 소유 조회 상태, 견적 바구니. **그 설계 판단들의 근거는 FS-073 §1.1 ③④ 와 §4.1 에 적었고 여기서 되풀이하지 않는다.**

## 2. 영역 구성

| 영역번호 | 이름 | 설명 |
|---|---|---|
| FS-076-SEC-01 | 목록 좌측 레일 — 안내문 | 미답변 건수 · PG+마감 설명 · 견적 바구니 설명 · (권한 없으면) 조회 전용 안내 |
| FS-076-SEC-02 | 목록 좌측 레일 — 처리 상태 필터 | 전체 + 상태 5종, 건수 배지, `aria-pressed` |
| FS-076-SEC-03 | 목록 좌측 레일 — 문의 유형 필터 | 전체 + 유형 5종, 건수 배지 (**이 화면에만 있다**) |
| FS-076-SEC-04 | 목록 툴바 | 검색 입력 + (권한·담김 있을 때만) 견적 바구니 막대 |
| FS-076-SEC-05 | 목록 조회 요약 | 건수 · 새로고침 인디케이터 · 낭독 영역 |
| FS-076-SEC-06 | 목록 표 | 순번 + 9열(+ 권한 시 견적 바구니 열). 페이지네이션·선택·일괄 작업 **없음** |
| FS-076-SEC-07 | 목록 조회 실패 배너(비표시 기본) | 요약·표 대체 |
| FS-076-SEC-08 | 상세 헤더 | '목록으로' 버튼 + `<h1>프로그램 문의 처리</h1>` |
| FS-076-SEC-09 | 상세 처리 카드 | 제목·상태 배지 · 배지 행 3개 · 정의 목록 6행 · 답변 편집기 · 액션 버튼 묶음 |
| FS-076-SEC-10 | 상세 문의자 정보 카드 | 문의자·연락처·**문의 유형**·유입 채널 + 회신 안내 |
| FS-076-SEC-11 | 상세 처리 이력 카드 | 파생 타임라인 |
| FS-076-SEC-12 | 상세 로딩·조회 실패(비표시 기본) | 로딩 문구 / 404·오류 분기 배너 |
| FS-076-SEC-13 | 미저장 이탈 가드(비표시 기본) | 작성 중 답변 파기 확인 |

## 3. 요소 명세

| 요소번호 | 영역 | 이름 | 유형 | 동작 | [서버] | 비고 |
|---|---|---|---|---|---|---|
| FS-076-EL-001 | FS-076-SEC-01 | 미답변 건수 안내 | 텍스트 | 조회가 끝났으면 `답변을 기다리는 문의가 N건 있습니다.`, 아직이면 '미답변 건수를 세는 중입니다.'(`:373-377`). N 은 `unansweredCount`(`types.ts:178-180`) = `isProgramInquiryUnanswered`(접수·답변 중 — `_shared/store.ts:96-98`) | O | 필터 이전 전체 집합에서 센다(`:182`). **FS-073-EL-001 과 동일** |
| FS-076-EL-002 | FS-076-SEC-01 | PG·마감 안내문 | 텍스트 | '결제대행을 끈 프로그램은 후원하기 대신 문의하기 버튼이 노출되고, 그 문의가 이 목록으로 들어옵니다. **마감이 있는 펀딩이라 답변이 늦으면 후원이 사라집니다.**'(`:378-381`) | — | **상품 문의와 문구가 다르다** — 두 번째 문장이 §1.1 ④ 의 근거를 사용자에게도 말한다. 결제 설정 링크는 없다(§7 #10) |
| FS-076-EL-003 | FS-076-SEC-01 | 견적 바구니 안내문 | 텍스트 | '여러 문의를 바구니에 담아 한 견적으로 합칠 수 있습니다. 합친 문의는 모두 같은 견적을 가리킵니다.'(`:382-385`) | — | 권한이 없어도 표시된다(§7 #11) |
| FS-076-EL-004 | FS-076-SEC-01 | 조회 전용 안내문 | 텍스트 | `canUpdate` 가 false 일 때만 '답변 권한이 없어 조회만 가능합니다.'(`:386`) | — | 비표시 기본. 사라진 열·버튼의 이유를 미리 밝힌다(EXC-03) |
| FS-076-EL-005 | FS-076-SEC-02 | 처리 상태 필터 | 입력 | `FilterPanel navLabel="프로그램 문의 상태 필터" heading="처리 상태"`(`:390-397`). 항목 6개 = `PROGRAM_INQUIRY_STATUS_FILTERS`(`types.ts:117-120`) = 전체 + `STATUS_SEQUENCE`(접수 → 답변 중 → 견적 발행 → 답변 완료 → 종결 — `:49-55`). URL `?status=`, 모르는 값은 `parseFilter` 가 '전체'로(`:151-155`) | — | **처리 흐름 순**으로 세운다 |
| FS-076-EL-005.1 | FS-076-SEC-02 | 상태 건수 배지 | 텍스트 | `countProgramInquiriesByStatus`(`types.ts:147-160`). **필터 이전 전체 집합**에서 센다(`:146` 주석). 못 셌으면 `null` → `'—'` | O | `loaded = !firstLoading && error === null`(`:173`) |
| FS-076-EL-006 | FS-076-SEC-03 | 문의 유형 필터 | 입력 | `FilterPanel navLabel="프로그램 문의 유형 필터" heading="문의 유형"`(`:398-405`). 항목 6개 = `PROGRAM_INQUIRY_TOPIC_FILTERS`(`types.ts:125-128`) = 전체 + 리워드·배송·환불·결제·기타. URL `?topic=`, `parseFilter` 로 되돌림(`:156-160`) | — | **이 화면에만 있는 축**(§1.1 ③). 두 패널이 같은 `FilterRail` 안에 세로로 쌓인다 |
| FS-076-EL-006.1 | FS-076-SEC-03 | 유형 건수 배지 | 텍스트 | `countProgramInquiriesByTopic`(`types.ts:162-175`). 상태와 마찬가지로 **필터 이전 전체 집합**에서 센다(`:178-181`) | O | **두 축이 서로의 배지를 흔들지 않는다** — 유형 필터를 걸어도 상태 배지가 그대로다 |
| FS-076-EL-007 | FS-076-SEC-02/03 | 2축 AND + 검색 결합 규칙 | 텍스트 | `searchProgramInquiries(filterProgramInquiries(items, status, topic), keyword)`(`:184-187`). `filterProgramInquiries`(`types.ts:134-144`)가 **두 축을 한 번에 건다** — 화면이 `filter().filter()` 로 순서를 만들지 않게(`:133` 주석) | — | 비표시 규칙. 전부 클라이언트 연산 — 서버 재조회가 없다. 회귀 `inquiries.test.ts:278-285` |
| FS-076-EL-008 | FS-076-SEC-04 | 검색 입력 | 입력 | `SearchField` 접근 이름 '문의번호·프로그램명·문의자·제목 검색', placeholder '문의번호 · 프로그램명 · 문의자 검색'(`:326-333`). IME 안전 커밋(COMP-10), URL `?q=`. `searchProgramInquiries`(`types.ts:183-196`)가 **문의번호·프로그램명·문의자·제목** 4필드에 부분 일치 | — | FS-073-EL-007 과 대상 필드 구성이 같다(상품명 자리에 프로그램명) |
| FS-076-EL-009 | FS-076-SEC-04 | 견적 바구니 막대 | 배너 | `canUpdate && basket.size > 0` 일 때만 info 톤 `Alert`(`:337-364`). 문구는 `basketBlock === null` 이면 `문의 N건을 한 견적으로 합칩니다.`, 아니면 **거절 사유 문자열 그대로**. 버튼 2개: '비우기' · '견적 발행'(`loading`/`disabled` 는 `issue.isPending`·`basketBlock`) | O | 비표시 기본. **버튼의 disabled 조건과 발행의 거절 조건이 같은 술어를 읽는다**(`quoteIssueBlock` — `quote-issue.ts:136-142`). FS-073-EL-008 과 동일 |
| FS-076-EL-010 | FS-076-SEC-05 | 조회 요약 텍스트 | 텍스트 | `CrudReadListShell` 소유(`CrudReadListShell.tsx:118-121`): 최초 로드면 '불러오는 중…', 그 밖에는 `전체 N건` + 재조회 중이면 `' · 새로고침 중…'`, `aria-busy={refreshing}` | — | N 은 2축 필터 + 검색 적용 후 건수 |
| FS-076-EL-011 | FS-076-SEC-05 | 목록 상태 낭독 | 텍스트 | 항상 마운트된 `aria-live="polite"`(`CrudReadListShell.tsx:110-112`), 3분기 문장에 `entityLabel='프로그램 문의'` 가 들어간다(`:70,386`) | — | 비표시(시각적 숨김). A11Y-16 |
| FS-076-EL-012 | FS-076-SEC-06 | 문의 목록 표 | 표 | `CrudReadListShell` → `CrudTable` → DS `Table`. **페이지네이션 없음**(§7 #2). 열: 순번 + 데이터 **9열**(`:243-291`) + `canUpdate` 면 견적 바구니 1열(`:320`). 선택 체크박스·행 액션 열 없음(껍데기가 `canUpdate=false, canRemove=false` 를 넘긴다). 정렬은 어댑터가 건다(`data-source.ts:28` → `sortProgramInquiries` — 접수 최신순, 동시각은 문의번호 내림차순 안정 정렬 — `types.ts:199-204`) | O | 캡션은 `'프로그램 문의 목록 — 조회 전용입니다.'` **고정**이다(`CrudTable.tsx:254-257`) — **행 클릭으로 상세에 간다는 사실을 말하지 않는다**(§7 #3) |
| FS-076-EL-012.1 | FS-076-SEC-06 | 순번 셀 | 텍스트 | `SeqCell seq={index + 1}`(`CrudTable.tsx:331`) | — | 화면상 위치 |
| FS-076-EL-012.2 | FS-076-SEC-06 | 문의번호 셀 | 텍스트 | `item.id` 를 `tabular-nums` + `nowrap` + muted(`:113-117,247`). 값은 `PGQ-YYYYMMDD-NNN`(`_shared/store.ts:310-315`) | O | **id 가 곧 문의번호다**(`:16-18`). 회귀 `inquiries.test.ts:464-472` |
| FS-076-EL-012.3 | FS-076-SEC-06 | 프로그램명 셀 | 텍스트 | `item.programName` 을 고정 최대폭 + ellipsis + `nowrap`(`:119-125,251`) | O | 비정규화 값(`_shared/store.ts:51-52`). **잘린 전체 값을 볼 수단이 없다**(§7 #12) |
| FS-076-EL-012.4 | FS-076-SEC-06 | 문의자 셀 | 텍스트 | `item.customerName`, `nowrap`(`:253`) | O | 개인정보 평문 |
| FS-076-EL-012.5 | FS-076-SEC-06 | 제목 링크 | 버튼 | `DetailCellLink to="/programs/inquiries/<id>"` 로 `item.subject`(`:255-259`) | — | **행 클릭이 마우스 전용이므로 이것이 키보드 경로다**(`DetailCellLink.tsx:1-17`) |
| FS-076-EL-012.6 | FS-076-SEC-06 | 유형 배지 | 배지 | `StatusBadge tone={programInquiryTopicTone} label={programInquiryTopicLabel}`(`:261-270`). 톤(`types.ts:67-73`): 리워드=info · 배송=info · **환불=warning** · **결제=warning** · 기타=neutral | O | **이 화면에만 있는 열**(§1.1 ③). 돈이 걸린 유형이 눈에 띄는 색을 받는다(회귀 `inquiries.test.ts:225-230`) |
| FS-076-EL-012.7 | FS-076-SEC-06 | 채널 셀 | 텍스트 | `programInquiryChannelLabel`(`types.ts:98-108`): **프로그램 페이지**(`storefront`) · 모바일 앱 · 전화 · 이메일 · 카카오톡(`:271`) | O | `storefront` 를 따로 부르는 이유는 상품 문의와 같다(`types.ts:94-97`) |
| FS-076-EL-012.8 | FS-076-SEC-06 | 상태 배지 | 배지 | `programInquiryStatusLabel`/`Tone`(`types.ts:31-46`): 접수=**warning** · 답변 중=info · 견적 발행=info · 답변 완료=success · 종결=neutral(`:272-281`) | O | 미답변 두 상태를 같은 색으로 묶지 않는다(`types.ts:25-30`) |
| FS-076-EL-012.9 | FS-076-SEC-06 | 접수일 셀 | 텍스트 | `formatDateTime(item.createdAt)`(`:282`). 저장 UTC, 표기 KST(`_shared/store.ts:16-18`) | O | — |
| FS-076-EL-012.10 | FS-076-SEC-06 | 경과 배지 | 배지 | `elapsedLabel`/`elapsedTone`(`types.ts:240-265`). 분기는 상품 문의와 같되 **danger 임계가 `OVERDUE_DAYS = 2`**(`:214`)다. 견적만 나감 → '견적 발행'(info) · 답변됨 → '당일 답변'/`N일 만에 답변`(neutral) · 미답변 → '오늘 접수'(info)/`N일째 미답변`(2일 이상 danger, 1일 warning) · 읽을 수 없으면 `'—'` | O | **이 목록의 중심 열이다.** 색만으로 지연을 말하지 않는다(`:286` 주석). 기준일 `TODAY = '2026-07-21'` **하드코딩**(`:77`) — §7 #4 |
| FS-076-EL-012.11 | FS-076-SEC-06 | 견적 바구니 열 | 버튼 | **`canUpdate` 일 때만**(`:320`). 발행됐으면 `<a href={issuedQuoteHref(item.quoteId)}>견적 보기</a>`, 아니면 `Button size="sm" aria-pressed={inBasket}` 라벨 '담기'/'담김'(`:294-318`) | O | `CrudReadListShell` 의 선택 체크박스를 쓰지 않는 이유는 `:195-197` 주석(FS-073-EL-011.10 과 동일). **'견적 보기'가 네이티브 `<a href>`** 라 전체 페이지 재적재가 일어난다(§7 #5) |
| FS-076-EL-012.12 | FS-076-SEC-06 | 행 전체 클릭 이동 | 텍스트 | `rowTarget = { kind: 'detail', href: item => '/programs/inquiries/<id>' }`(`:86-89`). `detail` 이라 **읽기 권한만으로 활성화된다**(`CrudTable.tsx:306`) | — | 비표시 규칙. 마우스 전용 — 키보드 경로는 EL-012.5 |
| FS-076-EL-013 | FS-076-SEC-06 | 목록 로딩 스켈레톤 | 스켈레톤 | `loading={firstLoading}`(`CrudReadListShell.tsx:126`), 조건은 `isFetching && data === undefined`(`:167`) | — | 비표시. 재조회 중에는 이전 행 유지(`placeholderData` — `crud.ts:298`) |
| FS-076-EL-014 | FS-076-SEC-06 | 빈 상태 | 빈상태 | 공유 `Empty` 3분기(`CrudTable.tsx:378-390` ← `:422-428`): `createVerb='접수'` · `hasQuery` · `hasActiveFilters` · `onClearSearch` · `onResetFilters`. **생성 CTA 슬롯은 비운다** | — | 비표시. 조사는 `Empty` 소유 |
| FS-076-EL-015 | FS-076-SEC-07 | 목록 조회 실패 배너 | 배너 | 위험 톤 `Alert` '프로그램 문의 목록을 불러오지 못했습니다.' + '다시 시도'(`CrudReadListShell.tsx:154-161`) | O | 비표시. 툴바·좌측 레일은 남는다. **status 로 분기하지 않는다**(§7 #6) |
| FS-076-EL-016 | FS-076-SEC-04 | 견적 발행(목록·다건) 규칙 | 텍스트 | `issue` 뮤테이션(`:213-237`): ① `issueQuote(targets.map(toProgramQuoteIssueSource))` 로 **한 장의 견적**을 만들고 ② 담긴 문의를 **하나씩 순회하며** `applyProgramQuoteIssued(target, issued.id)` 를 어댑터 `update` 로 저장(`:219-224`) ③ 성공 시 목록 무효화 + 바구니 비우기 + 토스트 `견적 <번호>를 발행했습니다.` + `navigate(issuedQuoteHref(issued.id))`(`:227-232`) | O | 비표시 규칙. `toProgramQuoteIssueSource`(`_shared/store.ts:176-186`)가 넘기는 것: 문의 id·문의번호·채널 `'program'`·**거래처 라벨 = 후원자 이름**(개인 후원자라 회사가 없다 — `:173`)·후원자 이름·**품목명 = 프로그램명**·본문. **②는 원자적이지 않다**(§7 #7) |
| FS-076-EL-017 | FS-076-SEC-04 | 바구니 수명 규칙 | 텍스트 | `status`·`topic`·`list.keyword` **셋 중 하나라도** 바뀌면 바구니를 비운다(`:205-207`) | — | 비표시 규칙. **상품 문의(2개 의존)보다 축이 하나 많다** — 유형 필터를 건드려도 담긴 것이 사라진다 |
| FS-076-EL-018 | FS-076-SEC-08 | '목록으로' 버튼(상단) | 버튼 | 좌상단 `<button type="button">` + `chevron-left` → `navigate('/programs/inquiries')`(`:267-275`) | — | 프로그램 이동이라 **이탈 가드가 가로채지 못한다**(§7 #8) |
| FS-076-EL-019 | FS-076-SEC-08 | 상세 화면 제목 | 텍스트 | `<h1 style={pageTitleStyle}>프로그램 문의 처리</h1>`(`:278`). **문의 제목이 아니라 고정 문구** | — | AppHeader 의 `<h1>` 과 중복(§7 #9) |
| FS-076-EL-020 | FS-076-SEC-12 | 상세 로딩 표시 | 텍스트 | `inquiry === undefined` 면 `Card` 안에 muted '불러오는 중…'(`:281-284`) | — | 비표시. 조건이 데이터 유무라 재조회 중에는 기존 내용 유지 |
| FS-076-EL-021 | FS-076-SEC-12 | 상세 조회 실패 배너 | 배너 | 위험 톤 `Alert`. **404 와 그 밖을 가른다**(`:240-263`, `isNotFound`): 404 → '문의를 찾을 수 없습니다. 이미 삭제되었을 수 있습니다.' + '목록으로'만 · 그 밖 → '문의를 불러오지 못했습니다.' + '다시 시도' + '목록으로' | O | 비표시. **EXC-12 충족** — 어댑터가 `HttpError(404)` 를 던지고(`crud.ts:217-219`) 화면이 status 로 분기한다 |
| FS-076-EL-022 | FS-076-SEC-09 | 처리 카드 제목 | 텍스트 | `CardTitle` 에 `inquiry.subject` + 상태 `StatusBadge`(`:288-294`) | O | — |
| FS-076-EL-023 | FS-076-SEC-09 | 저장 실패 배너 | 배너 | 카드 상단 위험 톤 `Alert` '저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'(`:186,296`). 재저장 시 먼저 지운다(`:173`) | O | 비표시. **403·409·422·500 을 구분하지 않고 참조 코드도 없다**(§7 #6) |
| FS-076-EL-024 | FS-076-SEC-09 | 배지 행 | 배지 | **3개**(`:298-308`): 유형(`programInquiryTopicTone`/`Label`) · 채널(info 고정) · 경과(`elapsedTone`/`elapsedLabel`) | O | **상품 문의는 2개다**(채널·경과) — 유형 배지가 이 화면에만 있다. 목록의 유형 배지(EL-012.6)와 **같은 톤 함수**를 쓴다 — 한 값이 두 화면에서 다른 색이 되지 않는다(영업 문의 FS-051 §7 #10 과 대비된다) |
| FS-076-EL-025 | FS-076-SEC-09 | 문의 정보 정의 목록 | 텍스트 | `dl/dt/dd` 6행(`:310-339`): 문의번호 · **프로그램** · 접수일시 · 답변일시(미답변이면 '미답변') · 문의 내용 · **발행 견적** | O | 문의 본문은 `white-space: pre-wrap` 이라 줄바꿈이 보존된다(`:112-118`) |
| FS-076-EL-025.1 | FS-076-SEC-09 | 발행 견적 역링크 | 버튼 | `quoteId === ''` 면 muted '아직 발행된 견적이 없습니다.', 아니면 `<Link to={issuedQuoteHref(quoteId)}>견적 보기</Link>`(`:326-338`) | O | 문의 ↔ 견적 양방향 링크의 한쪽. 반대편은 견적의 `sources`(`quotes/types.ts:384`)와 `findQuoteBySource`(`quotes/data-source.ts:125-127`) |
| FS-076-EL-026 | FS-076-SEC-09 | 답변 편집기 | 입력 | `canAnswerProgramInquiry(status)` 일 때만 `TextareaField`(`:342-356`): 라벨 '답변 작성'/'답변 수정', `maxLength={PROGRAM_INQUIRY_ANSWER_MAX}`(=1000 — `_shared/store.ts:78`), `rows={6}`, hint `저장하면 상태가 '답변 완료' 로 넘어갑니다.`, placeholder '**후원자**에게 전달할 답변을 입력하세요.'. `disabled={saving \|\| !canUpdate}` | O | `aria-invalid`·`aria-describedby`·카운터는 `TextareaField` 가 내부 배선 |
| FS-076-EL-026.1 | FS-076-SEC-09 | 종결 문의의 읽기 전용 답변 | 텍스트 | `canAnswerProgramInquiry` 가 false 면 '발송한 답변' 라벨 + 본문(`pre-wrap`) + '종결된 문의라 답변을 수정할 수 없습니다.'(`:357-362`) | O | 비표시 기본 |
| FS-076-EL-027 | FS-076-SEC-09 | 조회 전용 안내 배너 | 배너 | `canUpdate` 가 false 면 info 톤 `Alert` '이 문의에 답변할 권한이 없습니다. 조회만 가능합니다.'(`:365-367`) | — | 비표시 |
| FS-076-EL-028 | FS-076-SEC-09 | '목록으로' 버튼(카드) | 버튼 | 액션 묶음 맨 왼쪽. `secondary`, 저장 중 비활성(`:370-372`) | — | EL-018 과 목적지가 같다. 둘 다 가드 밖(§7 #8) |
| FS-076-EL-029 | FS-076-SEC-09 | '답변 착수' 버튼 | 버튼 | **`canUpdate && canBeginAnsweringProgramInquiry(status)`** 일 때만(`:374-378`). `applyProgramBeginAnswering` → 토스트 '답변 중으로 변경했습니다.'(`:208-211`) | O | 접수 상태에서만 열린다(`_shared/store.ts:119-121`). 회귀 `inquiries.test.ts:137-143` |
| FS-076-EL-030 | FS-076-SEC-09 | '문의 종결' 버튼 | 버튼 | **`canUpdate && canCloseProgramInquiry(status)`** 일 때만(`:379-383`). `applyProgramClose` → 토스트 '문의를 종결했습니다.'(`:234-237`) | O | 답변 완료에서만 열린다(`_shared/store.ts:114-116`) — 후원자가 답을 못 받은 채 닫히는 길을 막는다. 저장소도 던진다(`:148`). 회귀 `inquiries.test.ts:130-136,187-192` |
| FS-076-EL-031 | FS-076-SEC-09 | '견적 발행' 버튼(단건) | 버튼 | **`canUpdate && issueBlock === null`** 일 때만(`:385-389`). `issueBlock = quoteIssueBlock([toProgramQuoteIssueCandidate(inquiry)])`(`:164-165`). `issueQuote([...])` → `applyProgramQuoteIssued` 저장 → 토스트 `견적 <번호>를 발행했습니다.`(`:223-232`) | O | **발행된 문의에는 버튼이 없다** — 대신 EL-025.1 의 '견적 보기'가 있다(`:384` 주석). **발행 후 이동하지 않는다**(목록과 다르다 — §7 #13) |
| FS-076-EL-032 | FS-076-SEC-09 | '답변 저장' 버튼 | 버튼 | **`canUpdate && canAnswerProgramInquiry(status)`** 일 때만(`:390-400`). `variant="primary" loading={saving}`, `disabled={saving \|\| !dirty}`. ① `programAnswerError(answer)` 검증 ② `applyProgramAnswer(inquiry, answer, new Date().toISOString())` 저장 ③ 토스트가 최초/재수정으로 갈린다(`:192-206`) | O | **진행 상태를 `loading` prop 으로 표현한다**(COMP-01 충족). **동기 제출 락·멱등키가 없다**(§7 #14) |
| FS-076-EL-033 | FS-076-SEC-09 | 저장의 단일 경로 | 텍스트 | 네 동작(답변·착수·종결·발행)이 전부 `commit(next, message)` 하나를 지난다(`:171-190`): 오류 지우기 → 새 `AbortController` → `update.mutate({ id, input: toProgramInquiryInput(next), signal })` → 성공 시 `if (aborted) return` · 토스트 · `detailQuery.refetch()` / 실패 시 `isAbort` 면 무시, 아니면 배너 | O | 비표시 규칙. **'다음 문의 한 벌'을 통째로 보낸다.** 근거 주석 `:167-170` |
| FS-076-EL-034 | FS-076-SEC-09 | 답변 검증 규칙 | 텍스트 | 정본은 `programInquiryAnswerSchema`(`validation.ts:11-18`): 공백만이면 '답변 내용을 입력하세요.', trim 길이 1000 초과면 '답변은 1000자를 넘을 수 없습니다.'. 화면은 `programAnswerError`(`:24-28`)만 부른다. **저장소도 같은 규칙으로 한 번 더 막는다**(`applyProgramAnswer` — `_shared/store.ts:136-137`) | — | 비표시 규칙. RHF 를 얹지 않았다(`validation.ts:20-22`). 회귀 `inquiries.test.ts:441-461` |
| FS-076-EL-035 | FS-076-SEC-09 | dirty 판정·동기화 규칙 | 텍스트 | `dirty = inquiry !== undefined && answer.trim() !== inquiry.answer`(`:155`). 상세가 도착하면 `setAnswer(inquiry.answer)`(`:150-153`) | — | 비표시 규칙. **편집 중 재조회에서도 돈다**(§7 #15) |
| FS-076-EL-036 | FS-076-SEC-09 | 최초 답변 시각 불변 규칙 | 텍스트 | `applyProgramAnswer` 가 `answeredAt` 을 **비어 있을 때만** 채운다(`_shared/store.ts:141`) — "후원자에게 한 약속이 언제 나갔는지는 나중에 고쳐 쓸 수 없는 사실"(`:126-127`) | O | 비표시 규칙. 회귀 `inquiries.test.ts:101-111` |
| FS-076-EL-037 | FS-076-SEC-10 | 문의자 정보 카드 | 텍스트 | `dl` **4행**(`:405-421`): 문의자 · 연락처 · **문의 유형** · 유입 채널 + hint '답변은 위 연락처로 회신됩니다. 결제대행을 끈 프로그램은 후원하기 대신 문의하기 버튼이 노출됩니다.' | O | **상품 문의는 3행이다** — '문의 유형' 줄이 이 화면에만 있다. 연락처를 마스킹하지 않는다(§7 #16) |
| FS-076-EL-038 | FS-076-SEC-11 | 처리 이력 타임라인 | 표시 | `Card('처리 이력')` 안 `Timeline events={history} label="프로그램 문의 처리 이력"`(`:423-426`). `history = programInquiryHistory(inquiry)`(`types.ts:278-336`) — 저장된 사실에서 **파생**: 접수(작성자 **'후원자'**, 문구가 **채널과 유형을 함께** 말한다) → (답변 중이면) 담당 착수 → (`quoteId` 가 있으면) 견적 발행 → (`answeredAt` 이 있으면) 답변 본문 → (종결이면) 종결 | O | **별도 이력 테이블이 없다.** 종결 이벤트의 `at` 은 종결 시각이 아니라 **답변 시각**이다(종결 시각을 저장하지 않는다 — `types.ts:331`). 회귀 `inquiries.test.ts:416-437` |
| FS-076-EL-039 | FS-076-SEC-13 | 미저장 이탈 가드 | 모달 | `useUnsavedChangesDialog(dirty && !saving, { message })`(`:156`). 문구 '작성 중인 답변이 저장되지 않았습니다. 이 화면을 벗어나면 입력한 내용이 사라집니다.'(`:71-72`). 3경로(beforeunload · `<a>` 클릭 capture · popstate) | — | 비표시. **`navigate()` 프로그램 이동은 가로채지 못한다**(§7 #8) |
| FS-076-EL-040 | FS-076-SEC-09 | 언마운트 abort | 텍스트 | 화면을 벗어나면 진행 중인 저장을 abort 한다(`:147`). abort 는 실패로 통지하지 않고(`:185`), 성공 콜백도 `aborted` 면 아무것도 하지 않는다(`:180`) | — | 비표시 규칙. **목록의 견적 발행 뮤테이션에는 abort 배선이 없다**(`:213-237`) — §7 #17 |

## 4. 예외 명세

| 요소번호 | 빈 상태 | 로딩 | 실패 | 유효성 | 권한없음 | 경합 | 대량 |
|---|---|---|---|---|---|---|---|
| FS-076-EL-001 | 미답변 0건이면 '…0건 있습니다' | '미답변 건수를 세는 중입니다.' | 조회 실패면 `loaded=false` → 같은 '세는 중' 문구가 남는다(**실패를 로딩으로 위장한다** — §7 #18) | N/A — 표시 전용 | §4.1 공통 규칙 적용 | 재조회 시점 스냅샷 | 전량 1-pass |
| FS-076-EL-002 | N/A — 정적 문구 | 로딩 중에도 표시 | 조회 실패에도 남는다 | N/A — 입력 없음 | §4.1 공통 규칙 적용 | N/A | 고정 문구 |
| FS-076-EL-003 | N/A — 정적 문구 | 로딩 중에도 표시 | 조회 실패에도 남는다 | N/A — 입력 없음 | **권한이 없어도 표시된다**(§7 #11) | N/A | 고정 문구 |
| FS-076-EL-004 | N/A — 조건부 문구 | 권한은 동기 판정 | 조회 실패에도 남는다 | N/A — 입력 없음 | **이것이 권한 없음의 표현이다** | 권한 강등이 재렌더로 반영된다 | 1줄 |
| FS-076-EL-005 | 0건이어도 6항목이 남고 배지가 '0' | 배지 `'—'` | 실패면 `'—'` | `?status=거짓말` 은 `parseFilter` 가 '전체'로 | §4.1 공통 규칙 적용 | **URL 이 단일 원천**(IA-13) | 6개 고정 |
| FS-076-EL-005.1 | 0건이면 '0' | 아직 모르면 `'—'` | 실패면 `'—'` | N/A — 파생값 | §4.1 공통 규칙 적용 | 상세 저장이 목록 키를 무효화(`crud.ts:357`) | 전량 1-pass |
| FS-076-EL-006 | 0건이어도 6항목이 남고 배지가 '0' | 배지 `'—'` | 실패면 `'—'` | `?topic=거짓말` 은 `parseFilter` 가 '전체'로 | §4.1 공통 규칙 적용 | URL 이 단일 원천 | 6개 고정 |
| FS-076-EL-006.1 | 0건이면 '0' | 아직 모르면 `'—'` | 실패면 `'—'` | N/A — 파생값 | §4.1 공통 규칙 적용 | **다른 축의 필터를 반영하지 않는다** — 두 배지가 서로를 흔들지 않는다 | 전량 1-pass |
| FS-076-EL-007 | 두 축 AND + 검색 결과가 0건이면 EL-014 | 조회 중에는 대상이 빈 배열 | N/A — 클라이언트 연산 | select 조합 + 검증된 키워드라 위반 값이 없다 | §4.1 공통 규칙 적용 | 조회 시점 배열에만 적용 | 결과가 많아도 전량 렌더(§7 #2) |
| FS-076-EL-008 | 매치 0건이면 EL-014 의 '검색 0건' | 조회 중에도 입력 가능 | N/A — 서버 호출 없음 | 자유 텍스트, 앞뒤 공백 제거, 빈 문자열이면 조건 없음 | §4.1 공통 규칙 적용 | **IME 조합 중 커밋 금지** | 커밋마다 4필드 × 전량 |
| FS-076-EL-009 | 담긴 것이 0건이면 렌더되지 않는다 | 발행 중 두 버튼 비활성, 발행 버튼 `loading` | 발행 실패는 **토스트** '견적을 발행하지 못했습니다. 잠시 후 다시 시도해 주세요.'(`:235`) | 이미 발행됨/종결/미배선이면 **버튼이 비활성되고 사유가 막대에 뜬다**(`quote-issue.ts:99-102,136-142`) | **`canUpdate=false` 면 막대 자체가 없다** | 담긴 뒤 다른 관리자가 발행하면 저장소의 `findQuoteBySource` 가 기존 견적을 돌려준다(`quotes/data-source.ts:148-151`) | 담을 수 있는 건수에 **상한이 없다**(§7 #7) |
| FS-076-EL-010 | 0건이면 '전체 0건' | 최초 로드만 '불러오는 중…' | EL-015 가 이 줄을 대체 | N/A — 입력 없음 | §4.1 공통 규칙 적용 | 재조회 중 건수 유지 + '새로고침 중…' | 천 단위 구분 |
| FS-076-EL-011 | 0건이면 '조건에 맞는 프로그램 문의 결과가 없습니다.' | 최초 로드 중 **침묵** | '프로그램 문의 목록을 불러오지 못했습니다.' | N/A | §4.1 공통 규칙 적용 | 필터·검색 전환이 이 줄로 들린다 | 건수만 읽는다 |
| FS-076-EL-012 | 0건이면 EL-014 로 본문 대체 | EL-013 스켈레톤(최초만) | EL-015 로 요약·표 대체 | N/A — 표 자체 입력 없음 | **선택 열·액션 열이 어떤 역할에게도 없다** | 조회 시점 스냅샷. **삭제 경로가 없어 행 소멸 경합이 없다** | **상한 없음**(§7 #2). 열이 10칸이라 가로 스크롤 컨테이너를 쓴다(`CrudReadListShell.tsx:123`) |
| FS-076-EL-012.1 | 행 없으면 없음 | 스켈레톤 | 미표시 | N/A | §4.1 공통 규칙 적용 | 재정렬 시 다시 매겨진다 | 페이지네이션 도입 시 공식이 틀어진다 |
| FS-076-EL-012.2 | 행 없으면 없음 | 스켈레톤 | 미표시 | 형식은 저장소가 보장(회귀 `inquiries.test.ts:464-472`) | §4.1 공통 규칙 적용 | 접수 후 불변 | `nowrap` |
| FS-076-EL-012.3 | 비면 빈 칸 | 스켈레톤 | 미표시 | N/A — 표시 전용 | §4.1 공통 규칙 적용 | **비정규화 스냅샷** — 프로그램명이 바뀌어도 따라가지 않는다(§7 #19) | ellipsis. **전체 값을 볼 수단이 없다**(§7 #12) |
| FS-076-EL-012.4 | 비면 빈 칸 | 스켈레톤 | 미표시 | N/A | §4.1 공통 규칙 적용 | 접수 후 불변 | 개인정보 평문 |
| FS-076-EL-012.5 | 제목이 비면 **링크 접근 이름이 사라진다** | 스켈레톤 행이라 링크 없음 | N/A — 라우터 내부 이동 | N/A | 읽기 권한만으로 동작 | 후원자가 접수 시 정한 값 | truncate 없음 — 긴 제목이 열을 넓힌다(§7 #12) |
| FS-076-EL-012.6 | 행 없으면 없음 | 스켈레톤 | 미표시 | N/A — `Record<ProgramInquiryTopic,…>` 전수 대응 | §4.1 공통 규칙 적용 | **유형은 접수 후 불변** — 관리자가 재분류할 수단이 없다(§7 #20) | 5개 고정. 문구+색 2중 인코딩 |
| FS-076-EL-012.7 | 행 없으면 없음 | 스켈레톤 | 미표시 | N/A — 전수 대응 | §4.1 공통 규칙 적용 | 접수 후 불변 | 5개 고정 |
| FS-076-EL-012.8 | 행 없으면 없음 | 스켈레톤 | 미표시 | N/A — 전수 대응 | §4.1 공통 규칙 적용 | 상세 저장이 목록을 무효화 | 5개 고정 |
| FS-076-EL-012.9 | 행 없으면 없음 | 스켈레톤 | 유효하지 않으면 `formatDateTime` 폴백이 원본을 보인다 | N/A | §4.1 공통 규칙 적용 | 불변 | — |
| FS-076-EL-012.10 | 행 없으면 없음 | 스켈레톤 | 읽을 수 없으면 `'—'` — **0일로 위장하지 않는다**(`types.ts:215-216,253`) | N/A — 파생값 | §4.1 공통 규칙 적용 | **기준일이 고정 상수라 날짜가 지나도 늘지 않는다**(§7 #4) | 문구+색 2중 인코딩 |
| FS-076-EL-012.11 | 행 없으면 없음 | 발행 중 담기 버튼 전체 비활성(화면 단위 플래그) | 발행 실패는 EL-009 토스트 | `quoteId` 로 판정 — 형태 위반이 없다 | **`canUpdate=false` 면 열 자체가 없다** | 견적이 삭제되면 '견적 보기'가 404 로 간다(§7 #21) | 행마다 최대 1개 |
| FS-076-EL-012.12 | 행 없으면 규칙이 걸리지 않는다 | 스켈레톤 행이라 이동 규칙 없음 | N/A — 라우터 내부 이동 | N/A | **`detail` 이라 읽기 권한만으로 활성화** | 이동 후 상세가 최신을 재조회 | N/A |
| FS-076-EL-013 | N/A — 도착 전 | **이것이 로딩 표현** | 실패 시 EL-015 로 | N/A | §4.1 공통 규칙 적용 | **재조회에서는 뜨지 않는다**(STATE-01) | 행 수는 DS 소유 |
| FS-076-EL-014 | **이것이 빈 상태 표현** — 3분기 + 복구 | 최초 로드 중에는 스켈레톤이 이 자리 | 실패 시 EL-015 로 | N/A | 생성 CTA 가 없어 권한 분기가 없다 | 복구 액션이 URL 을 고쳐 즉시 반영 | N/A — 1블록 |
| FS-076-EL-015 | N/A — 실패 상태 | 재시도 시 스켈레톤으로 | **이것이 실패 표현.** 문구 1종 + 재시도. **status 분기 없음**(§7 #6) | N/A | §4.1 공통 규칙 적용 — 403 도 이 배너 | 재시도는 같은 조회를 재발행. 조건은 URL 에 남는다 | N/A |
| FS-076-EL-016 | 담긴 것이 0건이면 `QUOTE_ISSUE_EMPTY` 가 먼저 막는다 | 진행 중 버튼 `loading` | 중간 실패는 토스트 1건. **이미 저장된 문의는 되돌려지지 않는다**(§7 #7) | `quoteIssueBlock` 4분기가 정본 | **`canUpdate=false` 면 도달 경로가 없다** | **삼중 방어**: ① `quoteIssueBlock` ② `applyProgramQuoteIssued` 의 `quoteId !== '' → 원본 반환`(`_shared/store.ts:165`) ③ 견적 저장소 `findQuoteBySource`(`quotes/data-source.ts:148-151`). 회귀 `inquiries.test.ts:487-491` | 담긴 건수만큼 **순차 `await update`** — 상한 없음 |
| FS-076-EL-017 | 담긴 것이 없으면 지울 것도 없다 | N/A — 동기 | N/A — 서버 호출 없음 | N/A | §4.1 공통 규칙 적용 | **3축 중 하나만 바뀌어도 비운다** | N/A |
| FS-076-EL-018 | N/A — 항상 표시 | 조회 중에도 표시 | 실패 화면에도 '목록으로'가 있다(EL-021) | N/A | §4.1 공통 규칙 적용 | 저장 중에도 누를 수 있다 — 이탈 시 EL-040 이 abort | N/A |
| FS-076-EL-019 | N/A — 정적 문구 | 로딩 중에도 표시 | 실패 시 이 블록이 렌더되지 않는다(early return) | N/A | §4.1 공통 규칙 적용 | N/A | 고정 문구 |
| FS-076-EL-020 | N/A — 도착 전 | **이것이 로딩 표현** | 실패 시 EL-021 로 | N/A | §4.1 공통 규칙 적용 | 재조회 중에는 뜨지 않는다 | N/A — 단건 |
| FS-076-EL-021 | N/A — 실패 상태 | 404 에는 재조회 수단이 없다(의도) | **이것이 실패 표현.** 404/그 밖 분기(EXC-12 충족) | N/A | §4.1 공통 규칙 적용 — **403 은 '불러오지 못했습니다'로 뭉개진다**(§7 #6) | **저장 성공 후 재조회가 실패하면 화면 전체가 이 배너로 바뀐다**(§7 #22) | N/A |
| FS-076-EL-022 | 제목이 비면 배지만 남는다 | EL-020 으로 대체 | EL-021 로 대체 | N/A — 읽기 전용 | §4.1 공통 규칙 적용 | 조회 시점 값 | 길면 카드 제목이 늘어난다 |
| FS-076-EL-023 | N/A — 오류 없으면 미렌더 | 재저장 시 먼저 지운다 | **이것이 저장 실패 표현.** 문구 1종. abort 는 표시하지 않는다 | 클라이언트 검증 위반은 여기 오지 않는다(EL-026 인라인) | §4.1 공통 규칙 적용 — 403 도 이 문구 | **409(`crud.ts:257`)도 이 문구.** 충돌 다이얼로그가 없다(§7 #23) | 1건만 표시 |
| FS-076-EL-024 | N/A — 항상 3개 | 상세 로딩 중 미표시 | 실패 시 미표시 | N/A — 파생값 | §4.1 공통 규칙 적용 | 조회 시점 값 | 3개 고정 |
| FS-076-EL-025 | 값이 비면 빈 `dd`. `answeredAt` 이 비면 '미답변' | 상세 로딩 중 미표시 | 실패 시 미표시 | N/A — 읽기 전용 | §4.1 공통 규칙 적용 — 개인정보 은닉은 BE-076 | 저장 후 재조회로 갱신 | 본문 `pre-wrap`. 길이 상한 없음 |
| FS-076-EL-025.1 | 미발행이면 '아직 발행된 견적이 없습니다.' | 상세 로딩 중 미표시 | 실패 시 미표시 | N/A — 표시 전용 | §4.1 공통 규칙 적용 | 견적이 삭제돼도 `quoteId` 가 남아 링크가 404 로 간다(§7 #21) | 문의 1건당 최대 1개 |
| FS-076-EL-026 | 초기값은 원본 답변(미답변이면 빈 문자열) | `disabled={saving \|\| !canUpdate}` | 저장 실패는 EL-023. 실패 시 **입력 보존** | 1000자 네이티브 `maxLength` + 제출 시 zod(EL-034). 상한 도달 시 **경고 없이 입력이 멈춘다** | **권한이 없으면 비활성되지만 렌더는 된다** — 버튼과 달리 숨기지 않는다(§7 #24) | 재조회가 오면 입력이 원본으로 덮인다(§7 #15) | 1000자. 붙여넣기도 잘린다 |
| FS-076-EL-026.1 | 답변이 빈 종결 문의면 빈 문단이 남는다 | 상세 로딩 중 미표시 | 실패 시 미표시 | N/A — 읽기 전용 | §4.1 공통 규칙 적용 | 종결은 되돌릴 수 없다 | `pre-wrap` |
| FS-076-EL-027 | N/A — 조건부 | 로딩과 무관 | 실패 시 미표시 | N/A | **이것이 권한 없음의 표현이다** | 권한 강등이 재렌더로 반영 | 1건 |
| FS-076-EL-028 | N/A — 항상 표시 | 저장 중 비활성 | N/A — 서버 호출 없음 | N/A | **게이팅 없음** — 이동 버튼이라 정당 | N/A | N/A |
| FS-076-EL-029 | N/A — 조건부 | 저장 중 비활성 | 저장 실패는 EL-023 | **전이 술어가 존재를 정한다.** 저장소도 던진다(`_shared/store.ts:154-156`) | **`canUpdate=false` 면 렌더되지 않는다** | 다른 관리자가 먼저 착수하면 재조회 후 버튼이 사라진다 — 그 사이 클릭은 저장소가 막는다 | 단건 |
| FS-076-EL-030 | N/A — 조건부 | 저장 중 비활성 | 저장 실패는 EL-023 | 답변 완료가 아니면 렌더되지 않는다. 저장소도 던진다(`:148`) | **`canUpdate=false` 면 렌더되지 않는다** | 위와 같다 | 단건 |
| FS-076-EL-031 | N/A — 조건부 | 저장 중 비활성 | 저장 실패는 EL-023 | `quoteIssueBlock` 이 null 일 때만 렌더 — **버튼의 존재 조건과 저장의 거절 조건이 같은 술어**(`:163` 주석) | **`canUpdate=false` 면 렌더되지 않는다** | **`quoteId` 가 멱등키다**(회귀 `inquiries.test.ts:487-491`) + 저장소 교차 확인 | 단건 |
| FS-076-EL-032 | N/A — 조건부 | 요청 중 `loading` + 비활성 | 실패 시 EL-023, 버튼 재활성, 이동 없음, 입력 보존 | 미변경이면 비활성. 검증 실패 시 요청 없이 EL-026 에 인라인 오류 | **`canUpdate=false` 면 렌더되지 않는다** | **동기 제출 락·멱등키가 없다**(§7 #14). **완화**: 전체 치환이라 두 번 실행돼도 최종 상태가 같다 | 단건. 문의 전체(13필드)를 보낸다 |
| FS-076-EL-033 | N/A — 규칙 | `saving` 이 네 버튼을 함께 잠근다 | `isAbort` 면 조용히 반환, 아니면 배너 | N/A — 조립 규칙 | §4.1 공통 규칙 적용 | 성공 시 `refetch()` + `useCrudUpdate` 가 목록·상세 키 무효화(`crud.ts:357-358`) | 요청 1건 |
| FS-076-EL-034 | 빈 답변은 막힌다 | N/A — 동기 판정 | N/A — 서버 호출 없음 | **이것이 유효성 규칙 자체다.** 서버 422 를 필드로 되돌릴 경로가 없다(§7 #25) | §4.1 공통 규칙 적용 | N/A — 순수 판정 | trim 길이 기준 |
| FS-076-EL-035 | 도착 전에는 빈 문자열이라 `dirty=false` | 도착 전에는 판정 대상이 없다 | 조회 실패면 폼 자체가 사라진다 | N/A — 판정 규칙 | §4.1 공통 규칙 적용 | **재조회가 편집 중 입력을 덮는다**(§7 #15) | N/A |
| FS-076-EL-036 | 미답변이면 이번 저장이 채운다 | N/A — 동기 | N/A | **이것이 불변 규칙이다** | §4.1 공통 규칙 적용 | 시각이 **클라이언트 시계**다(`:203`) — §7 #26 | N/A |
| FS-076-EL-037 | 값이 비면 빈 `dd` | 상세 로딩 중 미표시 | 실패 시 미표시 | N/A — 읽기 전용 | §4.1 공통 규칙 적용 — **마스킹 없음**(§7 #16) | 조회 시점 값 | 4행 고정 |
| FS-076-EL-038 | 이벤트는 **최소 1건**(접수)이라 '기록된 이력이 없습니다.'가 뜰 수 없다 | 상세 로딩 중 미표시 | 실패 시 미표시 | N/A — 파생값 | §4.1 공통 규칙 적용 — 내부 메모 개념이 없다 | **파생이라 본문과 갈라질 수 없다** | 최대 5칸. **무한히 늘지 않는다** |
| FS-076-EL-039 | N/A — 변경이 있어야 성립 | 저장 중 비활성(`dirty && !saving`) | N/A — 서버 호출 없음 | N/A | §4.1 공통 규칙 적용 | 저장 성공 후 재조회가 `answer` 를 동기화해 dirty 가 풀린다 | N/A |
| FS-076-EL-040 | N/A — 진행 요청이 있어야 성립 | **이것이 취소 규칙** | **abort 는 실패가 아니다** | N/A | §4.1 공통 규칙 적용 | 이탈 시 진행 중 저장이 취소된다 — 서버 도달 여부는 보장하지 않는다 | 단건. **목록의 발행 뮤테이션은 덮지 않는다**(§7 #17) |

### 4.1 공통 예외 규칙

| 규칙 | 내용 |
|---|---|
| 네트워크 단절 | 목록 조회 실패는 껍데기 안 배너(EL-015), 상세 조회 실패는 화면 대체 배너(EL-021), 저장 실패는 카드 배너(EL-023), 목록 견적 발행 실패는 **토스트**(EL-009). **오프라인 감지·복귀 재조회는 앱 전역에 없다** — §7 #27 |
| 세션 만료 | 401 이 오면 앱 전역 인터셉터(`queryClient.ts:60-66`)가 `notifySessionExpired()` 를 쏘고 `/login?returnUrl=<현재경로>&reason=session_expired` 로 보낸다. **미저장 답변은 그때 사라진다** — 프로그램 이동이라 EL-039 가드가 발화하지 않는다 |
| 요청 타임아웃 | 프론트 타임아웃 상한 없음(`AbortSignal.timeout` 0건). abort 는 상세 언마운트(EL-040)에서만 발생한다 |
| 중복 제출 | 상세의 네 액션은 `saving` 으로, 목록의 발행 버튼은 `issue.isPending` 으로 잠긴다. **동기 제출 락·멱등키가 없다** — 두 화면 모두 `useCrudForm` 이 아니라 `useCrudUpdate`/`useMutation` 을 직접 쓴다. **어댑터는 이미 멱등 원장을 갖고 있다**(`crud.ts:193,243`). **완화**: 견적은 세 겹이 막고, 답변 저장은 전체 치환이라 최종 상태가 같다 — §7 #14 |
| 실패 통지의 자리 | ① 목록 조회 실패는 인라인 배너 ② 상세 조회 실패는 화면 대체 배너(404/그 밖 분기) ③ 저장 실패는 카드 안 배너 ④ **목록 견적 발행 실패만 토스트**(§7 #28) ⑤ 쓰기 **성공**은 토스트 ⑥ abort 는 아무것도 띄우지 않는다 |
| 낙관적 업데이트 | **이 화면에 없다.** 저장은 비관적(요청 완료 후 재조회 — `:182`) |
| 동시 조회 | 목록/상세 조회가 각각 1건씩. 전역 기본값: `staleTime`(`queryClient.ts:70`) · `retry: false`(`:82`) · `refetchOnWindowFocus: false`(`:90`). 목록은 `placeholderData: (previous) => previous`(`crud.ts:298`)를 쓰고 **상세는 쓰지 않는다**(`useQuery` 직접 — `:133-137`). 검색·필터는 쿼리 키에 들어가지 않는다(전량 클라이언트 처리) |
| 권한 없음 | 라우트 **read** 는 AppShell 의 `RequirePermission` 이 `<Outlet>` 바깥에서 가드한다. **`/programs/inquiries` 는 `/programs` 보다 긴 잎이라 별개 리소스로 갈린다**(`nav-config.ts:382-391` 의 규칙과 같은 `covers()`). **쓰기 게이팅은 이 화면이 실제로 배선했다**(`:146` · `:131`) — 담기 열, 견적 바구니 막대, 액션 버튼 넷이 **렌더되지 않는다**. **다만 답변 textarea 는 숨지 않고 비활성만 된다**(§7 #24). 서버 403 은 조회=배너, 저장=카드 배너로 떨어지며 권한 문구로 갈리지 않는다(§7 #6) |
| 렌더 예외 | AppShell 이 `<Outlet>` 바로 바깥에 `ErrorBoundary` 를 둔다 |
| 행 선택의 수명 | 목록에 **삭제용 행 선택이 없다**(`CrudReadListShell` 이 `NO_SELECTION` 고정 — `CrudReadListShell.tsx:87,130`). 대신 **견적 바구니**가 있고 그 수명은 EL-017 이 정한다(상태·유형·검색 **셋 중 하나라도** 바뀌면 비운다) |
| 상태 전이 규칙 | **네 술어가 정본이다**(`_shared/store.ts:104-121`): `canIssueProgramQuote`(종결 아님) · `canAnswerProgramInquiry`(종결 아님) · `canCloseProgramInquiry`(답변 완료) · `canBeginAnsweringProgramInquiry`(접수). 화면은 버튼의 **존재 조건**으로 읽고 저장소는 같은 술어로 던진다(`:135,148,154-156,166`) — **눌리는데 실패하는 버튼이 없다**. 되돌아가는 전이는 없다(`:25-27`). 서버는 위반을 409 로 되돌려야 한다(`data-source.ts:23-25`) |
| 견적 발행의 멱등 | **세 겹이다** — ① `quoteIssueBlock` ② `applyProgramQuoteIssued`(`_shared/store.ts:165`) ③ `findQuoteBySource`(`quotes/data-source.ts:148-151`). 상품 문의(FS-073 §4.1)와 **같은 구조이며 같은 발행기(`issueQuoteRef` — `wiring.ts:188`)를 공유한다** — 상품 문의와 프로그램 문의를 한 견적으로 합칠 수는 없다(각 화면의 바구니가 자기 도메인 항목만 담기 때문). 서버에서는 셋이 한 트랜잭션이어야 한다(`quotes/data-source.ts:142-143`) |

## 5. 서버 연동 지점

| 요소번호 | 이름 | 읽기/쓰기 | 필요 데이터 | 프론트 어댑터 | 비고 |
|---|---|---|---|---|---|
| EL-001 / EL-005.1 / EL-006.1 / EL-010 / EL-012 / EL-015 | 문의 목록 조회 | R | 문의 전량(필터·검색·정렬·페이징 없이) | `programInquiryAdapter.fetchAll(signal)`(`data-source.ts:26-33` — `list` 가 `sortProgramInquiries` 를 건다) | 두 축 필터·검색이 **전부 클라이언트**다 |
| EL-020 / EL-021 / EL-022 / EL-025 / EL-038 | 문의 상세 조회 | R | 문의 1건 | `programInquiryAdapter.fetchOne(id, signal)` → `useQuery([PROGRAM_INQUIRY_RESOURCE,'detail',id])`(`:133-137`) | 목록과 **같은 타입**(`ProgramInquiry`). 없는 id 는 `HttpError(404)`(`crud.ts:217-219`) |
| EL-029 / EL-030 / EL-032 / EL-033 | 답변·상태 전이 저장 | W | 문의 id + `ProgramInquiryInput` 전체(13필드 — 상품 문의보다 `topic` 하나 많다 — `_shared/store.ts:198-214`) | `programInquiryAdapter.update(id, input, context?)` → `useCrudUpdate`(`:140`) | **전체 치환**. 성공 시 목록·상세 키 무효화. **`context.idempotencyKey` 를 실을 자리가 있으나 호출부가 넘기지 않는다**(§7 #14) |
| EL-031 / EL-009 / EL-016 | 견적 발행(부수효과 포함) | W | `QuoteIssueSource[]`(문의 id·문의번호·채널 `'program'`·거래처 라벨=후원자명·후원자명·품목명=프로그램명·본문) → 발행 후 문의마다 `quoteId`+상태 저장 | ① `issueQuote(sources)`(`quote-issue.ts:153-156`) — 배선된 구현은 `issueQuoteRef`(`quotes/data-source.ts:163-166` → `issueQuoteFromSources` `:144-155`), 꽂는 곳은 `wiring.ts:188` ② 이어서 문의마다 `programInquiryAdapter.update` | **문의 화면은 견적 모듈을 import 하지 않는다** — `pages/programs → pages/sales` 는 페이지 간 결합이다(`quote-issue.ts:13-17` · `ProgramInquiryDetailPage.tsx:216-218`). 서버 심: `quotes/data-source.ts:142-143` |
| EL-012.11 / EL-025.1 | 발행 견적 역참조 | R | 견적 id | 없음 — **링크 경로만 만든다**(`issuedQuoteHref`). 견적의 존재를 확인하지 않는다 | 견적이 삭제되면 끊어진 링크가 된다(§7 #21) |
| (메뉴 판정) | 잔여 문의 집계 | R | `{ total, open, slaBreached, averageResponseHours, byTarget }` | `readInquiryBacklog('program')`(`inquiry-backlog.ts:51-53`) — 구현은 `wiring.ts:209-216` 이 `listProgramInquiries()` 를 접어 만든다(`targetId` 는 `programId`, SLA 24시간 — `:67`) | **이 화면이 아니라 사이드바·대시보드·통계가 읽는다** |
| (범위 밖) | 문의 등록·삭제 | — | — | `programInquiryAdapter.create` / `.remove` — **동작하지만 호출부 0건** | 후원자 채널이 만든다(§1) |

> **현재 구현 상태 (백엔드 명세 참고)**: 백엔드는 없다. `programInquiryAdapter` 는 공용 `createStoreAdapter`(`shared/crud/crud.ts:190-283`)를 `_shared/store.ts` 의 모듈 스코프 배열(`inquiries` — `:221-305`, 시드 5건) 위에 배선한 것으로, 400ms 지연(`LATENCY_MS`)과 개발용 실패 스위치(`dev.ts:16-38`)를 얹어 CRUD 를 흉내 낸다 — 실제 네트워크 0건. 팩토리 덕에 **404(`fetchOne`)·409(`update`/`remove`)·멱등 원장**이 주어지고, 이 화면은 그중 **404 분기만** 활용한다(§7 #14·#23). 새로고침하면 시드로 되돌아간다. 연동 지점은 `data-source.ts:23-25` 한 덩이(`// TODO(backend): GET /api/programs/inquiries · GET/PUT /api/programs/inquiries/:id · 답변 저장은 본문·답변시각·상태를 한 트랜잭션으로 옮긴다(applyProgramAnswer 와 같은 규칙). · 종결은 답변이 나간 문의에만 허용하고, 위반은 409 로 되돌린다`)이고, 견적 발행 쪽 심은 `quotes/data-source.ts:142-143` 에 따로 있다. 위 표는 백엔드 연결 후 의도된 동작이다.

## 6. 자기 점검 (제출 전 확인)

- [x] 구현 소스를 전수 대조했다 — `ProgramInquiryListPage.tsx`(432행) · `ProgramInquiryDetailPage.tsx`(434행) · `types.ts`(336행) · `validation.ts`(28행) · `data-source.ts`(33행) · `_shared/store.ts`(367행) · `inquiries.test.ts`(530행 이상) + 공용 모듈(`shared/crud/{CrudReadListShell,CrudTable,DetailCellLink,crud,useListState,parseFilter}` · `shared/domain/quote-issue.ts` · `shared/commerce/inquiry-backlog.ts` · `shared/layout/nav-config.ts` · `src/wiring.ts` · `pages/sales/quotes/{data-source,types}.ts`)
- [x] **상품 문의(FS-073)와 정말 같은 부분과 다른 부분을 코드로 대조**해 §1.1 에 7항목으로 갈랐다 — 같은 것은 FS-073 을 가리키고 되풀이하지 않았으며, 요소 번호는 이 문서가 독립적으로 갖는다
- [x] **유형(topic) 축이 이 화면에만 있음을 코드로 확인**했다(`_shared/store.ts:45` · `types.ts:67-73,125-131` · `ProgramInquiryListPage.tsx:261-270,398-405` · `ProgramInquiryDetailPage.tsx:299-302,412-413`) — 상품 문의 모듈에 `topic` 이 0건임을 대조했다
- [x] **지연 경고 임계가 상품(3)과 다른 2 임을 코드로 확인**하고(`types.ts:214` vs `products/inquiries/types.ts:145`) 그 근거 주석(`:208-213`)을 §1.1 ④ 에 인용했다
- [x] **상태 union 이 5종이고 영업 문의(7종)와 다름을 코드로 확인**했다(`_shared/store.ts:34-35`). 코드 주석의 '세 이름을 갖지 않기 위해 어휘를 빌렸다'(`:29-32`)를 §1.1 ② 에 인용했다
- [x] **메뉴가 조건부이되 라우트는 살아 있음을 코드로 확인**했다(`nav-config.ts:202,314-333` · `App.tsx:340-341`)
- [x] **쓰기 게이팅이 실제로 배선돼 있음을 코드로 확인**했다(`:146` · `:131`) — 다만 답변 textarea 만 숨지 않고 비활성됨을 §7 #24 로 남겼다
- [x] 보이지 않는 요소(스켈레톤·빈 상태·실패 배너 3종·이탈 가드·행 클릭 규칙·2축 결합 규칙·바구니 수명 규칙·발행 규칙·dirty 규칙·최초 답변 시각 불변 규칙·검증 규칙·abort·낭독 영역)에 번호를 줬다
- [x] §4 예외 7축 빈칸 0건. 모든 `N/A` 에 사유
- [x] `[서버]` = O 요소가 §5 에 전부 요약됐다. 견적 발행이 **공통 층 이음매**를 지나며 실제 구현이 `wiring.ts:188` 로 꽂힘을 명시했다
- [x] 엔드포인트·HTTP·에러코드·DB 스키마를 쓰지 않았다 (BE-076 영역) — 어댑터가 던지는 404/409 만 화면 동작의 원인으로 인용했다

## 7. 미결 사항 (UI 기획 / 아키텍처 / 백엔드 명세 / 프론트 구현 이관)

> **#2·#3·#5·#6·#8·#9·#11~#18·#21~#28 은 상품 문의(FS-073)의 동일 번호대 항목과 같은 뿌리다** — 두 모듈이 같은 코드 형태를 공유하기 때문이다. **한쪽만 고치면 갈라진다.** 이 화면에만 있는 것은 #20·#29 다.

| # | 내용 | 이관 대상 |
|---|---|---|
| 1 | 대응 SCR 문서 부재 (프로그램 관리 SCR 미작성). `specs/README.md` 색인에도 이 화면이 없다 | UI 기획 / 아키텍처 |
| 2 | **페이지네이션이 없다** — `CrudReadListShell` 이 전량을 렌더하고 2축 필터·검색도 전량을 매번 훑는다. 문의는 상한 없이 쌓인다(quality-bar IA-04 P0). 순번(`index + 1`)도 그때 `startIndex` 가 필요하다 | UI 기획 · 백엔드 명세 |
| 3 | **표 캡션이 행 클릭 이동을 말하지 않는다** — `CrudTable.tsx:254-257` 이 `canUpdate=false` 면 `'프로그램 문의 목록 — 조회 전용입니다.'` 로 고정하는데 `rowTarget.kind === 'detail'` 이라 행 클릭은 살아 있다. 읽기 전용 목록 전부에 걸린 껍데기 결함이다(FS-073 §7 #4 와 동일) | UI 기획 (껍데기 소유) |
| 4 | **경과의 기준일이 하드코딩 `TODAY = '2026-07-21'`** 이다(목록 `:77` · 상세 `:70`). 날짜가 지나도 '2일째 미답변'이 늘지 않는다. **프로그램 도메인은 이 상수를 다섯 파일에 복제해 갖고 있다**(프로그램 목록·상세·폼 + 문의 목록·상세) | 백엔드 명세 · 프론트 구현 |
| 5 | 목록의 '견적 보기'(EL-012.11)가 **DS `Link` 가 아니라 네이티브 `<a href>`** 다(`:300`) — 전체 페이지 재적재가 일어난다. 상세(EL-025.1)는 `Link` 를 쓴다(`:331`) | 프론트 구현 |
| 6 | **status 분기가 조회에만 있고 저장에는 없다.** 상세 조회는 404/그 밖을 정확히 가르는데(EL-021) 저장 실패(EL-023)·목록 조회 실패(EL-015)는 403·409·422·500 을 한 문구로 뭉갠다. **참조 코드도 없다**(quality-bar EXC-06 · EXC-20 P1) | UI 기획 쪽 변경 요청 |
| 7 | **다건 견적 발행이 원자적이지 않다.** `issue.mutationFn`(`:219-224`)이 담긴 문의를 `for` 로 돌며 하나씩 `await update` 한다 — 중간에 실패하면 앞의 것만 `quoteId` 를 갖고 나머지는 견적 없이 남는다. 견적은 이미 만들어져 있고 롤백 경로가 없다 | 백엔드 명세 · UI 기획 |
| 8 | 이탈 가드(EL-039)가 **`navigate()` 프로그램 이동을 가로채지 못한다** — 상단·카드 '목록으로'를 누르면 작성 중인 답변이 조용히 사라진다 | UI 기획 쪽 변경 요청 |
| 9 | 상세가 **자체 `<h1>프로그램 문의 처리</h1>`(`:278`)를 그리고 AppHeader 도 `<h1>` 을 그린다** — `<h1>` 이 2개이고 어느 문의인지 말하지 않는다(quality-bar IA-02 P0) | 프론트 구현 · UI 기획 |
| 10 | 좌측 PG 안내문(EL-002)이 결제 설정으로 가는 **링크를 주지 않는다.** 프로그램 상세(FS-074-EL-032)는 같은 사실을 말하며 `PAYMENT_SETTINGS_PATH` 링크를 준다 — **같은 도메인 안에서 갈렸다** | UI 기획 쪽 변경 요청 |
| 11 | 견적 바구니 안내문(EL-003)이 **권한이 없어도 표시된다**(`:382-385`) — 바로 아래 EL-004 의 '조회만 가능합니다'와 모순된다 | UI 기획 쪽 변경 요청 |
| 12 | 프로그램명 셀이 ellipsis 로 잘리는데(`:119-125`) **전체 값을 볼 수단이 없고**(title 없음), 제목 셀은 truncate 가 없어 긴 값이 열을 넓힌다 — 한 표 안에서 두 규칙이 반대다(quality-bar COMP-09 P2) | UI 기획 쪽 변경 요청 |
| 13 | **같은 동작이 두 화면에서 다르게 끝난다.** 목록의 견적 발행은 성공 후 견적 상세로 **이동**하고(`:231`), 상세의 견적 발행은 **머문다**(`:228-231`) | UI 기획 쪽 변경 요청 |
| 14 | 저장·발행에 **동기 제출 락·멱등키가 없다.** `useCrudForm` 의 `submitLockRef`(`useCrudForm.ts:130`)·`idempotencyKeyRef`(`:145`)를 상속하지 못했다. **어댑터·`useCrudUpdate` 는 이미 키를 받을 준비가 돼 있다**(`crud.ts:243,354-355`)(quality-bar EXC-08 P0) | UI 기획 · 프론트 구현 |
| 15 | 상세 도착 시 `setAnswer(inquiry.answer)`(`:150-153`)가 **편집 중 재조회에서도 돈다** — 그 밖의 재조회가 오면 작성 중인 답변이 덮인다 | UI 기획 쪽 변경 요청 |
| 16 | 후원자 연락처(EL-037)와 이름(EL-012.4)이 **평문으로 노출된다** — 마스킹 정책이 프론트에 없다 | 백엔드 명세 · UI 기획 |
| 17 | **목록의 견적 발행 뮤테이션에 abort 배선이 없다**(`:213-237`). 상세는 갖고 있다(`:146-147,174-180`). 발행 도중 이탈하면 성공 콜백의 `navigate`·`toast` 가 언마운트 후에 돈다 | 프론트 구현 |
| 18 | 좌측 미답변 안내(EL-001)가 조회 실패 시에도 '미답변 건수를 세는 중입니다.'를 보인다 — **실패를 로딩으로 위장한다.** 배지(EL-005.1·EL-006.1)는 같은 상황에서 `'—'` 로 정직하다 | 프론트 구현 |
| 19 | `programName` 이 비정규화 스냅샷이라(`_shared/store.ts:51-52`) **프로그램명이 바뀌어도 과거 문의는 옛 이름을 보인다.** 카테고리 라벨은 저장소가 전파하는데(`programs/_shared/store.ts:507-509`) 문의의 프로그램명에는 대응물이 없다 | 아키텍처 (도메인) · 백엔드 명세 |
| 20 | **문의 유형(topic)을 관리자가 바꿀 수 없다.** 접수 시 값이 그대로 굳는다 — 목록·상세 어디에도 재분류 수단이 없고 `ProgramInquiryInput` 에는 필드가 있다(`_shared/store.ts:205`). 그런데 이 축의 존재 이유가 '**처리하는 사람이 다르다**'(`types.ts:64-65`)이므로, 후원자가 잘못 고른 유형은 영원히 잘못된 담당에게 남는다 | 아키텍처 (도메인) · UI 기획 |
| 21 | 견적 역링크가 **끊어질 수 있다** — 견적이 삭제돼도 `quoteId` 가 남아 '견적 보기'가 404 로 가고, 동시에 `quoteIssueBlock` 이 **재발행도 막는다** | 백엔드 명세 · UI 기획 |
| 22 | 저장 성공 직후 `detailQuery.refetch()`(`:182`)가 실패하면 **화면 전체가 EL-021 배너로 대체**된다 | UI 기획 쪽 변경 요청 |
| 23 | **409 를 해소할 UI 가 없다.** 어댑터가 409 를 정확히 던지는데(`crud.ts:257`) `useCrudForm` 의 충돌 다이얼로그(`useCrudForm.ts:193-206`)를 상속하지 못했다. **같은 도메인의 프로그램 폼(FS-074-EL-052)은 그것을 갖고 있다**(quality-bar EXC-04 P0) | UI 기획 쪽 변경 요청 |
| 24 | 답변 textarea(EL-026)만 **권한 없을 때 숨지 않고 비활성된다**(`:351`). 같은 카드의 버튼 넷은 렌더 자체를 안 한다 — '누를 수 없는 것을 보여 주지 않는다'는 이 화면의 규칙(주석 `:373`)에서 이 필드만 예외다 | UI 기획 쪽 변경 요청 |
| 25 | **서버 검증 오류(422)를 필드로 되돌릴 경로가 없다** — `useCrudForm` 의 `setError`+`setFocus`(`useCrudForm.ts:209-219`)를 상속하지 못했다(quality-bar EXC-07 P1) | UI 기획 |
| 26 | 답변 시각이 **클라이언트 시계**다(`new Date().toISOString()` — `:203`). 운영에서는 브라우저 시계가 그대로 감사 기록이 된다 — 서버가 찍어야 한다 | 백엔드 명세 |
| 27 | 프론트 타임아웃 상한 없음 · 오프라인 감지 없음 · 세션 만료 리다이렉트가 작성 중 답변을 버린다(quality-bar EXC-05 · EXC-11 · EXC-19 P1) | UI 기획 · 프론트 구현 |
| 28 | **한 화면 안에서 실패 통지의 자리가 갈린다** — 목록의 견적 발행 실패만 토스트고(`:235`) 나머지는 배너다. 견적 발행은 가장 무거운 쓰기인데 가장 약한(자동 소멸하는) 통지를 쓴다 | UI 기획 쪽 변경 요청 |
| 29 | **상품 문의 모듈과 이 모듈이 사실상 같은 코드를 두 벌 갖는다.** 화면 2개 · `types.ts` · `validation.ts` · `data-source.ts` · `_shared/store.ts` 가 접두사와 도메인 명사만 다르다(전이 술어·`applyAnswer`·`applyQuoteIssued`·경과 계산·`inquiryHistory`·목록 껍데기·바구니 뮤테이션이 모두 같은 형태다). 실제 차이는 **유형 축 · `OVERDUE_DAYS` · 낱말** 셋뿐이다. **§7 의 결함 대부분이 두 문서에 같은 번호로 실린 것이 그 증거다** — 한쪽만 고치면 갈라진다. 공통 층으로 올릴지(문의 도메인 제네릭) 두 벌을 유지할지 판단이 필요하다 | 아키텍처 (중복 · 선행 판단) |
