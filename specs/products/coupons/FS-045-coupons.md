---
id: FS-045
title: "쿠폰 (목록·등록·수정·발급 현황)"
screen: SCR-045               # ⚠ 상품 관리 SCR 미작성 — §7 미결 사항 참조
route: /products/coupons
owner: 기능 명세
reviewer: 명세 리뷰
gate: G9
status: draft
confirmedAt: 2026-07-22
version: 1.1
date: 2026-07-22
---

# FS-045. 쿠폰 (목록·등록·수정·발급 현황)

> ## 개정 이력 — v1.1 (2026-07-22): 쿠폰이 **캠페인 모델**이 됐다
>
> v1.0 이 기술하던 쿠폰은 '할인 규칙' 한 덩어리였다. 이번 라운드에서 축이 셋 늘고 화면이 하나 늘었다.
>
> | 무엇이 | v1.0 | v1.1 |
> |---|---|---|
> | **발급 기준(트리거)** | 없었다 | **판별 유니온 6종** — `manual`·`signup`·`first_order`·`tier_up{tier}`·`birthday{daysBefore}`·`download{from,to}` (§1.1) |
> | **사용 대상** | 유형(`target`)만 있고 **고를 입력이 없었다**(구 §7 #1) | `targetIds` + `CouponTargetPicker` — **해소됐다** |
> | **사용 기간** | 캠페인 기간 한 축 | 캠페인 기간 + **한 장의 수명**(`usagePeriod`) 두 축 (§1.1) |
> | **중복 사용** | 없었다 | `stackable` 토글 |
> | **상품과의 충돌** | 없었다 | `conflictingProducts` — **상품이 이긴다** (§1.1) |
> | **발급 현황** | 없었다 | `/products/coupons/issuance` — 이 문서가 함께 기술한다(SEC-14~17) |
> | **PG 스위치** | 없었다 | 결제를 쓰지 않으면 이 화면이 잠긴다(EL-058) |
>
> v1.0 의 미결 #1(대상 지정 입력 부재)은 **해소**됐다. 나머지 번호는 §7 에서 그대로 유지한다.

## 1. 화면 개요

| 항목 | 내용 |
|---|---|
| 목적 | 고객에게 발급할 쿠폰을 등록·수정·삭제하고, **발급 기준(언제 누구에게 나가는가)·사용 대상(어디에 쓸 수 있는가)·사용 기간(한 장이 며칠짜리인가)** 세 축을 정하며, 발급유형·발급기준·키워드로 좁혀 소진율과 상태를 훑고 목록에서 발급 상태를 바로 켜고 끈다. 실제로 얼마나 나갔고 얼마나 쓰였는지는 **발급 현황**(`/products/coupons/issuance`)이 답한다 |
| 역할(주 사용자) | 관리자 — 목록의 등록 CTA 는 `canCreate` 로 게이팅된다(`CouponListPage.tsx:277`). **폼의 제출 버튼은 여전히 권한을 묻지 않는다**(§7 #4) |
| 진입 경로 | 좌측 GNB > 상품 관리 > 쿠폰 (`/products/coupons` — `nav-config.ts:185`) |
| 포함 화면 | 목록 `/products/coupons` · **발급 현황 `/products/coupons/issuance`** · 등록 `/products/coupons/new` · 수정 `/products/coupons/:id/edit` (`App.tsx:320-325` — **네 라우트가 세 컴포넌트**: 등록·수정이 `CouponFormPage` 하나다) |
| **발급 현황이 사이드바 잎이 아닌 이유** | `/products/coupons/issuance` 는 **정적 하위 라우트**다(`App.tsx:323`). 잎을 새로 만들지 않으므로 권한이 갈라지지 않는다 — `findCoveringLeaf` 가 `/products/coupons` 로 되돌려 목록과 **같은 권한 한 벌**로 덮인다(`App.tsx:321-322` 주석). 그래서 이 문서가 두 화면을 함께 기술한다(IA §1 '하위 라우트는 사이드바에 올리지 않는다'). 선언 순서도 그것을 지킨다 — `issuance` 가 `:id/edit` **위**에 있어야 `:id` 로 먹히지 않는다 |
| **범위 밖** | **발급 실행** — 이 화면은 쿠폰의 **정의**만 만든다. 트리거 6종은 '언제 나갈지' 를 **선언**할 뿐 그것을 도는 스케줄러·이벤트 구독이 앱에 없다(§7 #28). `issuedCount` 는 읽기 전용 표시값이며 이 화면이 늘리지 않는다(§7 #12). **고객 쿠폰함** — 회원 상세의 `IssuedCoupon`(`shared/domain/member`)이 같은 사건을 반대편에서 본다(`types.ts:418-423`). **쿠폰 사용·할인 계산** — 주문 도메인의 관심사다. **상품별 쿠폰 사용 설정** — 상품 폼(`ProductCouponCard`)이 소유한다. 이 화면은 그 설정과 어긋난 사실을 **드러내기만** 하고 판정을 뒤집지 않는다(§1.1) |
| 구현 경로 | `apps/admin/src/pages/products/coupons/{CouponListPage.tsx(308행),CouponFormPage.tsx(785행),CouponIssuanceListPage.tsx(347행),types.ts(492행),validation.ts(196행),data-source.ts(373행),coupons.test.ts(556행),components/{CouponCardPreview.tsx(145행),CouponTargetPicker.tsx(150행)}}` · 경계 `pages/products/_shared/store.ts`(`productAllowsCoupon`) |
| 대응 SCR | SCR-045 (미작성 — §7 #14) |
| 공통 컴포넌트 | `shared/ui/{SearchField,SelectField,StatusBadge,ToggleSwitch,DateRangeField,Alert,Button,Card,CardTitle,FormField,PlusCircleIcon,ChevronLeftIcon,controlStyle,errorIdOf,fieldStyle,fieldLabelStyle,pageTitleStyle,useUnsavedChangesDialog}` · `shared/crud/{CrudListShell,CrudTable,useCrudList,useCrudRowUpdate,useCrudForm,useListState,parseFilter,createCrudAdapter,FormServerError,FormConflictDialog,requiredText,dev}` · `shared/format` |

> **검증의 정본은 zod 스키마다**: `coupons/validation.ts` 의 `couponSchema` 가 이 화면의 유일한 검증 원천이며(`validation.ts:1-2` 주석), 화면은 그것을 `useCrudForm` 에 넘길 뿐 규칙을 재선언하지 않는다.

### 1.1 이 화면을 지배하는 네 규칙 (v1.1 신설)

#### ① 발급 기준은 **판별 유니온**이다 — 말이 안 되는 조합을 만들 수 없다

`CouponTrigger`(`types.ts:37-47`)는 6종이고 **종류마다 필요한 값이 다르다**:
`manual` · `signup` · `first_order`(파라미터 없음) · `tier_up{tier: MemberTier}` ·
`birthday{daysBefore: number}` · `download{from: string, to: string}`.

**왜 평평한 객체가 아닌가**(`types.ts:30-35`): `{ type, tier, daysBefore, from, to }` 로 두면
*'가입 시 발급인데 승급 등급이 VVIP'* 같은 값이 **타입상 만들어진다**. 그런 값은 저장은 되고
동작만 어긋나서 나중에 '왜 이 쿠폰이 안 나가지' 로 되돌아온다. 유니온이면 **아예 만들 수 없다.**

폼은 평평하고(RHF 는 칸 하나에 문자열 하나) 도메인은 유니온이라, **둘을 잇는 문이 하나뿐**이다 —
`buildCouponTrigger(draft)`(`types.ts:126-140`). 고르지 않은 종류의 칸은 **거기서 버려진다**:
'승급 시' 로 저장한 뒤 종류만 '가입 시' 로 바꿨을 때 예전 등급이 데이터에 남아 되살아나지 않게
한다(`:121-125`). 되돌아오는 문 `toValues`(`CouponFormPage.tsx:192-202`)는 반대로
**종류가 맞을 때만** 값을 꺼내고 아니면 기본값을 쓴다.

검증도 같은 원리다 — `couponSchema` 는 **고른 종류가 요구하는 칸만** 본다
(`validation.ts:118-166`, 근거 주석 `:5-7`). `manual`·`signup`·`first_order` 는 검사할 것이 없다.

**트리거가 `target` 과 별도 축인 이유**(`types.ts:7-9`): *'누구에게 쓸 수 있나(target)'* 와
*'언제 손에 들어오나(trigger)'* 는 다른 질문이다. VIP 승급 쿠폰이 전 상품에 쓰일 수 있고,
전 회원이 받아 가는 다운로드 쿠폰이 특정 카테고리에만 쓰일 수 있다. 한 필드로 묶으면 그 조합이
표현되지 않는다.

#### ② `targetIds` 가 `target` 에 **의미를 준다** — 비어 있으면 `target` 은 아무 말도 하지 않는다

`target`(`all`·`member_grade`·`category`·`product`)은 **무엇을 가리키는지의 종류**일 뿐이고,
실제 대상은 `targetIds: readonly string[]` 다(`types.ts:177-183`). 그 배열의 원소가 무엇인지는
`target` 이 정한다 — `member_grade` → `MemberTier` · `category` → 카테고리 id · `product` → 상품 id.

**`target === 'all'` 이면 `targetIds` 는 항상 빈 배열이다** — 저장 경로가 강제한다
(`CouponFormPage.tsx:172` `targetNeedsIds(values.target) ? [...values.targetIds] : []`).
반대로 `all` 이 아닌데 비어 있으면 **검증이 막는다**(`validation.ts:167-180`):
'{대상 회원등급|대상 카테고리|대상 상품}을(를) 한 개 이상 선택하세요.' 그 근거가 주석에 있다
(`:168-169`) — *"target 이 무엇을 가리키는지 정하는 값이라, 비어 있으면 target 은 아무 말도 하지 않는다."*

#### ③ 사용 기간은 **두 축**이다 — 캠페인 기간과 한 장의 수명

| 축 | 필드 | 뜻 |
|---|---|---|
| 캠페인 기간 | `startAt` · `endAt` | **이 쿠폰이 살아 있는 기간** |
| 한 장의 수명 | `usagePeriod` | `{ kind: 'fixed' }` 또는 `{ kind: 'days_from_issue', days }` |

**왜 합치지 않는가**(`types.ts:148-155`): 가입 축하 쿠폰은 캠페인이 3개월이어도 **한 장은
발급일로부터 30일**이다. 두 값을 한 축으로 합치면 그 흔한 운영이 표현되지 않는다.

**`days_from_issue` 는 캠페인 종료일에서 잘린다.** `couponExpiryFor(coupon, issuedAt)`
(`types.ts:296-303`)가 `shiftDays(issuedAt, days)` 와 `endAt` 중 **빠른 날**을 만료로 준다.
근거(`:288-294`): *"'발급일로부터 30일' 쿠폰을 캠페인 마지막 날에 받으면 산술로는 캠페인이 끝난
뒤에도 30일이 남는다. 쿠폰이 끝났는데 쓸 수 있다고 말하는 화면이 되므로 둘 중 빠른 날이 만료다."*
폼의 hint 가 그것을 미리 말한다(`CouponFormPage.tsx:687`) — '최대 365일. 쿠폰 사용 종료일이 먼저
오면 그날 만료됩니다.' 상한은 `USAGE_DAYS_MAX = 365`(`types.ts:161`) — 1년을 넘기면 기간이 아니라 무기한이다.

같은 '받아도 쓸 수 없는 쿠폰을 만들지 않는다' 규칙이 **다운로드 기간에도** 걸린다
(`validation.ts:157-165`): 다운로드 종료일이 캠페인 종료일보다 늦으면 거절한다 —
'다운로드 종료일을 쿠폰 사용 종료일 이내로 맞추세요. 받아도 쓸 수 없습니다.'

#### ④ 상품 ↔ 쿠폰 충돌 — **상품이 이긴다**

쿠폰이 '이 상품에 쓰라' 고 지목했는데 그 상품의 쿠폰 사용 설정이 거부하면, **거부가 이긴다.**
판정의 정본은 쿠폰 쪽이 아니라 상품 쪽 한 함수다 — `productAllowsCoupon(policy, couponId)`
(`products/_shared/store.ts:171-176`).

**왜 상품이 이기는가**(`store.ts:166-169`): *"쿠폰은 **캠페인**(기간이 끝나면 사라진다)이고
쿠폰 불가는 **상품의 원가 사실**(마진이 없다)이라, 둘이 어긋날 때 손해를 보는 쪽은 언제나 상품이다.
그래서 계산은 상품 편에서 끝내고, 어긋났다는 사실은 화면이 경고로 드러낸다(조용히 지지 않는다)."*

이 화면이 하는 일은 **드러내는 것뿐**이다. `conflictingProducts(coupon, products)`
(`types.ts:400-411`)가 어긋난 상품을 모으고, 목록은 상태 배지 **옆에** 경고 배지를 붙이며
(`CouponListPage.tsx:189-199`), 폼은 카드 하단에 `Alert tone="warning"` 를 띄운다(`:723-731`).

**충돌은 상태가 아니라 경고다**(`CouponListPage.tsx:190-191`) — 상태 배지를 덮지 않는다.
승자가 상품이므로 쿠폰은 **여전히 '진행중'** 이고, 다만 그 상품에는 붙지 않는다.

**지목한 경우만 충돌로 센다**(`types.ts:392-398`): '전체 회원' 쿠폰 아래에 쿠폰 불가 상품이 섞여
있는 것은 **정상**이다 — 특가 한 건만 빼 두는 것이 바로 그 설정의 목적이다. 그래서
`conflictingProducts` 는 `target` 이 `product`·`category` 일 때만 계산한다.

## 2. 영역 구성

| 영역번호 | 이름 | 설명 |
|---|---|---|
| FS-045-SEC-01 | 목록 툴바 | PG 잠금 안내(조건부) + 검색 + **발급유형 필터 + 발급 기준 필터** + '발급 현황'·'쿠폰 등록' 버튼 |
| FS-045-SEC-02 | 목록 조회 요약 | 건수 + 재조회 표시 + 선택 건수 |
| FS-045-SEC-03 | 일괄 삭제 바(비표시 기본) | 선택이 1건 이상일 때만 |
| FS-045-SEC-04 | 목록 표 | 선택 체크박스·순번·쿠폰명·코드·할인·**발급 기준**·사용 기간·소진율·상태(+**충돌 경고**)·발급 토글·행 액션 |
| FS-045-SEC-05 | 목록 조회 실패 배너(비표시 기본) | 요약·표 대신 |
| FS-045-SEC-06 | 삭제 확인 다이얼로그(비표시 기본) | 단건 / 일괄 |
| FS-045-SEC-07 | 폼 헤더 | '목록으로' 버튼 + 화면 제목 + 설명문 |
| FS-045-SEC-08 | 폼 카드 — 쿠폰 정보 | 쿠폰명·코드·발급 유형·할인값·최대 할인·발급 수량·쿠폰 사용 기간·발급 여부 |
| FS-045-SEC-09 | 폼 미리보기 카드 | 고객 쿠폰함 카드 실시간 미리보기 |
| FS-045-SEC-10 | 폼 액션 | 취소 · 등록/저장 |
| FS-045-SEC-11 | 폼 로딩·조회 실패(비표시 기본) | 스켈레톤 없음(비활성만) / 404 vs 일반 배너 |
| FS-045-SEC-12 | 충돌 다이얼로그(비표시 기본) | 409/412 — 입력 보존 |
| FS-045-SEC-13 | 미저장 이탈 가드(비표시 기본) | 입력 파기 확인 |
| FS-045-SEC-14 | 폼 카드 — **발급 기준** (v1.1) | 발급 시점 select + 종류별 조건부 칸(승급 등급 / 생일 일수 / 다운로드 기간) + 요약 한 줄 |
| FS-045-SEC-15 | 폼 카드 — **사용 조건** (v1.1) | 사용 대상 select + 최소 주문 금액 + 대상 선택기(조건부) + 사용 가능 기간 + 사용 가능 일수(조건부) + 중복 사용 토글 + **충돌 경고**(조건부) |
| FS-045-SEC-16 | **발급 현황** — 툴바 (v1.1) | 검색 + 쿠폰 필터 + 발급 기준 필터 |
| FS-045-SEC-17 | **발급 현황** — 쿠폰별 요약 표 (v1.1) | 쿠폰명(목록 링크)·발급·사용·사용률·트리거별 건수 배지 |
| FS-045-SEC-18 | **발급 현황** — 발급 이력 표 (v1.1) | 쿠폰·발급 기준·회원·발급일·만료일·사용 여부. **조회 전용**(선택·삭제 없음) |
| FS-045-SEC-19 | **발급 현황** — 목록으로 돌아가기 (v1.1) | 하단 링크 |

> **폼 카드가 하나에서 셋이 됐다**(v1.1). v1.0 은 `쿠폰 정보` 한 카드에 8필드였는데, 축이 늘면서
> **'무엇을 주는가(정보)' · '언제 나가는가(발급 기준)' · '어디에 쓰는가(사용 조건)'** 로 갈렸다.
> 카드 경계가 §1.1 의 축 경계와 같다 — 한 카드를 읽으면 한 질문의 답이 끝난다.

## 3. 요소 명세

| 요소번호 | 영역 | 이름 | 유형 | 동작 | [서버] | 비고 |
|---|---|---|---|---|---|---|
| FS-045-EL-001 | FS-045-SEC-01 | 검색 입력 | 입력 | `SearchField`, 접근 이름 '쿠폰명·코드 검색'(`CouponListPage.tsx:174-181`). **IME 조합 중에는 커밋하지 않고 조합 종료 후 250ms 디바운스로 커밋**한다(`{...list.searchInputProps}` — `:180` → `useDebouncedSearch.ts:106-131`). 조합 중 Enter 는 가로챈다. 커밋된 값은 **URL `?q=`** | — | 서버 재조회 없음 — 쿠폰명·코드에 대해 대소문자 무시 부분 일치로 클라이언트에서 거른다(`:112-117`) |
| FS-045-EL-002 | FS-045-SEC-01 | 발급유형 필터 | 입력 | `SelectField`, 접근 이름 '발급유형으로 거르기'(`:182-195`). '전체 유형' + 정액 할인(원)·정률 할인(%)·무료배송(`types.ts:56-63`). **URL `?issue=`**. 손으로 고친 값은 `parseFilter`(`:89-93`)가 '전체'로 되돌린다 | — | 클라이언트 필터(`filterCoupons` — `types.ts:151-157`) |
| FS-045-EL-003 | FS-045-SEC-01 | '쿠폰 등록' 버튼 | 버튼 | 툴바 우상단. DS `<Button variant="primary" size="md">` + `PlusCircleIcon`(`:197-200`). 클릭 시 `/products/coupons/new` 이동 | — | **쓰기 권한을 묻지 않는다** — `useRouteWritePermissions` 를 소비하지 않아 read 전용 역할도 이 버튼을 본다(§7 #4) |
| FS-045-EL-004 | FS-045-SEC-01 | URL 조회 상태 규칙 | 텍스트 | 발급유형·검색어의 **단일 원천이 URL 쿼리스트링**이다(`useListState({ filterDefaults: FILTER_DEFAULTS })` — `:87`, `FILTER_DEFAULTS = { issue: 'all' }` `:54`). 기본값과 같은 값은 URL 에서 지워지고(`useListState.ts:114-118`) 갱신은 `replace: true`(`:125`). 상세를 열었다 Back 하면 조건이 복원되고 링크 공유가 된다 | — | 비표시 규칙. **`page`·`sort` 는 쓰이지 않는다** — 페이지네이션·정렬 UI 가 없다(§7 #2) |
| FS-045-EL-005 | FS-045-SEC-01 | 필터 + 검색 결합 규칙 | 텍스트 | 발급유형 → 검색어 순으로 **AND** 결합한다(`:110-118`) | — | 비표시 규칙. 필터 변경 시 서버 재조회 없음 |
| FS-045-EL-006 | FS-045-SEC-02 | 목록 상태 라이브 리전 | 텍스트 | **항상 마운트된** `aria-live="polite" aria-atomic="true"` 시각 숨김 영역(`CrudListShell.tsx:107-109`). 최초 로드 중에는 침묵하고, 완료 후 `쿠폰 N건을 찾았습니다.` / `조건에 맞는 쿠폰 결과가 없습니다.` / `쿠폰 목록을 불러오지 못했습니다.` 를 주입한다(`:72-82`) | — | 비표시. **내용과 함께 생성되는 live region 은 신뢰할 수 없어** 껍데기가 지속 컨테이너를 소유한다(`:99-106` 주석 — ToastProvider 와 같은 이유) |
| FS-045-EL-007 | FS-045-SEC-02 | 조회 요약 텍스트 | 텍스트 | 최초 로드 중 '불러오는 중…', 그 밖에는 `전체 N건`(`CrudListShell.tsx:118-122`). **재조회 중에는 건수를 지우지 않고 '· 새로고침 중…'을 덧붙인다**(`:120`). 선택이 있으면 `· N건 선택됨`(`:121`). `aria-busy={refreshing}` | — | 조건이 `firstLoading` 이라 재조회에 건수가 살아남는다 |
| FS-045-EL-008 | FS-045-SEC-03 | 일괄 삭제 바 | 버튼 | 선택 1건 이상일 때 `SelectionBar` 안에 `<Button variant="danger">선택 N건 삭제</Button>`(`CrudListShell.tsx:125-133`). 클릭 시 FS-045-EL-014 다이얼로그 | — | 삭제 진행 중이면 비활성(`deletingId !== null`) |
| FS-045-EL-009 | FS-045-SEC-04 | 쿠폰 목록 표 | 표 | `CrudTable`(`CrudListShell.tsx:135-154`). **전량을 한 화면에 렌더한다 — 페이지네이션이 없다**(§7 #2). 컬럼 10개: 선택 + 순번 + `columns` 7개(`CouponListPage.tsx:120-169`) + 행 액션. `aria-busy={loading}`(`CrudTable.tsx:116`). caption '쿠폰 목록 — 행을 누르면 해당 항목으로 이동합니다. 체크박스·수정·삭제 버튼은 각자의 동작을 수행합니다.'(`:117-120`). 기본 정렬은 **사용 기간 시작일 내림차순**(`sortCoupons` — `types.ts:143-148`, 같은 날짜는 id 내림차순 안정 정렬) — 정렬 변경 UI 없음 | O | — |
| FS-045-EL-009.1 | FS-045-SEC-04 | 전체 선택 헤더 셀 | 입력 | `SelectAllHeaderCell`, 라벨 '이 페이지의 쿠폰 전체 선택', `labelId="coupon-select-all"`(`CrudTable.tsx:124-129` · `CouponListPage.tsx:217`). `tableSelectionState` 가 부분 선택을 tri-state 로 표현한다 | — | **선택 범위가 '현재 화면에 보이는 행'이다** — 페이지네이션이 없어 곧 전량이다. `onToggleAll` 이 `visibleItems.map(id)` 를 넘긴다(`CrudListShell.tsx:143-148`) |
| FS-045-EL-009.2 | FS-045-SEC-04 | 행 선택 셀 | 입력 | `RowSelectCell`, 접근 이름 `'<쿠폰명> 선택'`(`CrudTable.tsx:173-178`) | — | 손조립 checkbox 가 아니다 |
| FS-045-EL-009.3 | FS-045-SEC-04 | 순번 셀 | 텍스트 | `SeqCell seq={index + 1}`(`CrudTable.tsx:179`) | — | 페이지네이션이 없어 현재는 어긋나지 않는다(§7 #2) |
| FS-045-EL-009.4 | FS-045-SEC-04 | 쿠폰명 셀 | 텍스트 | `item.name`(`:121`) | — | truncate 없음 — 긴 이름이 열을 넓힌다(§7 #10) |
| FS-045-EL-009.5 | FS-045-SEC-04 | 코드 셀 | 텍스트 | `item.code`, `nowrap`(`:122`) | — | 고객이 입력하는 값. **`tabular-nums`·mono 가 아니다** |
| FS-045-EL-009.6 | FS-045-SEC-04 | 할인 셀 | 텍스트 | `discountLabel(item)`(`types.ts:83-87` · `:123`): 무료배송 → '무료배송' · 정률 → `15% 할인` · 정액 → `5,000원 할인`(`formatNumber`) | — | 미리보기(EL-031)와 **같은 함수**를 쓴다 — 목록과 미리보기가 갈리지 않는다 |
| FS-045-EL-009.7 | FS-045-SEC-04 | 사용기간 셀 | 텍스트 | `<span style={periodStyle}>{item.startAt} ~ {item.endAt}</span>`, `nowrap` + `tabular-nums` + muted(`:77-80,124-128`) | — | 날짜 문자열을 **포맷 함수 없이 그대로** 잇는다 |
| FS-045-EL-009.8 | FS-045-SEC-04 | 소진율 셀 | 텍스트 | `numeric` 열(우측 정렬 + `tabular-nums` — `CrudTable.tsx:184`). 발급 수량이 0(무제한)이면 **'무제한'**, 아니면 `640/1,000 (64%)`(`formatNumber` + `usageRate` — `types.ts:90-93` · `:129-136`) | — | `usageRate` 는 `Math.min(100, …)` 로 상한을 100% 로 깎는다 — 발급 수량을 줄이면 실제로 100% 를 넘을 수 있다(§7 #13) |
| FS-045-EL-009.9 | FS-045-SEC-04 | 상태 배지 셀 | 배지 | `StatusBadge`. `couponStatus(item, today)`(`types.ts:98-106`) → `couponStatusMeta`(`:113-122`): 중지(꺼짐)=neutral · 예정(기간 전)=info · 만료(기간 후)=neutral · 진행중=success. `today` 는 **렌더마다 `formatDate(new Date())`**(`:95`) | — | **파생값이다 — 저장된 필드가 아니다.** '중지'와 '만료'가 **같은 톤(neutral)**이라 배지 색으로 구분되지 않는다(§7 #11) |
| FS-045-EL-009.10 | FS-045-SEC-04 | 발급 토글 셀 | 입력 | `ToggleSwitch`, 라벨 `'<쿠폰명> 발급 여부'`, 켜짐 '발급중' / 꺼짐 '중지'(`:146-168`). 변경 시 **목록에서 바로 저장한다**(`useCrudRowUpdate.run` — `useCrudRowUpdate.ts:38-60`): 진행 중 행은 `busy`, 성공 시 토스트(`'<쿠폰명>' 쿠폰을 발급중으로 바꿨습니다.` / `'<쿠폰명>' 쿠폰 발급을 중지했습니다.`), 실패 시 error 토스트 | O | **쓰기 권한을 묻지 않는다**(§7 #4). **비관적**이다 — `onMutate`/`setQueryData` 가 없어 응답 후에야 값이 바뀐다(`useCrudRowUpdate.ts:44-59`). 새 `run` 은 이전 요청을 abort 한다(`:39`) |
| FS-045-EL-009.11 | FS-045-SEC-04 | 행 액션(수정·삭제) | 버튼 | `RowActions`, 접근 이름 `'<쿠폰명> 수정'` / `'<쿠폰명> 삭제'`(`CrudTable.tsx:190-199` → `RowActions.tsx`). 수정 → `/products/coupons/<id>/edit`(`CouponListPage.tsx:219`), 삭제 → FS-045-EL-013 다이얼로그 | O | **이것이 유일한 키보드 상세 도달 경로다** — 쿠폰명 셀이 링크가 아니다(§7 #9). 삭제 진행 중이면 둘 다 비활성 |
| FS-045-EL-009.12 | FS-045-SEC-04 | 행 전체 클릭 이동 | 텍스트 | 행 빈 영역 클릭 시 `onEdit(item)` → 수정 폼 이동(`rowActivateProps` — `CrudTable.tsx:172`). 행 안의 체크박스·버튼·토글은 자기 동작만 수행하고, 텍스트 드래그 선택 중이면 이동하지 않는다(`useRowNavigation.ts:45-48`) | — | 비표시 규칙. **마우스 전용**(`<tr>` 에 tabIndex 없음) |
| FS-045-EL-010 | FS-045-SEC-04 | 목록 로딩 스켈레톤 | 스켈레톤 | **최초 로드에서만** 표 본문을 **5행 고정** 스켈레톤으로 대체한다(`CrudTable.tsx:143-152`). 셀 수는 `columns.length + 3` 으로 파생한다(`:113`) | — | 비표시. 조건이 `firstLoading = isFetching && data === undefined`(`useCrudList.tsx:71`)라 **재조회에서는 이전 행이 유지된다**. 행 수는 하드코딩 `length: 5`(§7 #6) |
| FS-045-EL-011 | FS-045-SEC-04 | 빈 상태 | 빈상태 | 조회 완료·0건이면 표 본문 1행에 `Empty`(`CrudTable.tsx:153-169`). **3분기**(`Empty.tsx:52-99`): 검색 0건 → '조건에 맞는 쿠폰이 없습니다' + '검색 지우기' · 필터 0건 → '필터에 맞는 쿠폰이 없습니다' + '필터 초기화' · 진짜 0건 → '등록된 쿠폰이 없습니다'. `role="status"` | — | 비표시. 맥락은 `list.hasQuery`·`list.hasActiveFilters` 로 전달된다(`CouponListPage.tsx:211-216`). **진짜 0건의 생성 CTA(`createAction`)를 넘기지 않아** '새로 추가하면 여기에 표시됩니다.' 만 나오고 등록 버튼이 빈 상태 안에 없다(§7 #7) |
| FS-045-EL-012 | FS-045-SEC-05 | 목록 조회 실패 배너 | 배너 | 조회 실패 시 요약·표 대신 위험 톤 `Alert` '쿠폰 목록을 불러오지 못했습니다.' + '다시 시도'(`CrudListShell.tsx:156-165`) | O | **툴바는 남는다** — `{toolbar}` 가 error 분기 바깥에 있다(`:111`). 교환/반품 목록과 다르다 |
| FS-045-EL-013 | FS-045-SEC-06 | 단건 삭제 확인 다이얼로그 | 모달 | `ConfirmDialog intent="delete"`, 제목 '쿠폰 삭제', 문구 `'<쿠폰명>'을(를) 삭제합니다. 이 작업은 되돌릴 수 없습니다.` — **조사는 이름의 받침이 고른다**(`objectParticle` — `useCrudList.tsx:158`), 확인 라벨 '삭제'(`:154-165`). `busy={deleting}` · 실패 시 다이얼로그 안 `error` 배너 '삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.'(`:112`) · **닫으면 진행 중 요청을 abort 하고 mutation 을 reset 한다**(`:86-92`) | O | 비표시. 성공 시 토스트 `'<쿠폰명>'을(를) 삭제했습니다.`(`:108`) |
| FS-045-EL-014 | FS-045-SEC-06 | 일괄 삭제 확인 다이얼로그 | 모달 | `ConfirmDialog intent="delete"`, 제목 '쿠폰 일괄 삭제', 문구 `선택한 쿠폰 N건을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`, 확인 라벨 `N건 삭제`(`useCrudList.tsx:166-177`). **부분 실패는 다이얼로그를 열어 둔 채 `N건 중 M건을 삭제하지 못했습니다.` 배너**(`:136-142`) — 전건 성공에서만 닫고 선택을 지우고 토스트를 띄운다 | O | 비표시. `settleAll`(`bulk.ts`)이 실패 **건수**만 돌려준다 — **어느 행이 실패했는지 알 수 없고 재시도가 전건을 재실행한다**(§7 #8) |
| FS-045-EL-015 | FS-045-SEC-04 | 선택 수명 규칙 | 텍스트 | 발급유형·검색어가 바뀌면 선택을 지운다(`useEffect(() => { clear(); }, [filter, keyword, clear])` — `:106-108`) — 보이지 않는 행이 선택된 채 남아 '선택 N건 삭제'가 화면에 없는 것을 지우는 것을 막는다 | — | 비표시 규칙. 선택 자체는 `useCrudList` 의 `useRowSelection` 이 소유한다(`useCrudList.tsx:59`) — `useListState.selectedIds` 가 아니다(**두 선택 상태가 공존하나 이 화면은 전자만 쓴다** — §7 #16) |
| FS-045-EL-016 | FS-045-SEC-07 | 폼 '목록으로' 버튼 | 버튼 | 좌상단. `ChevronLeftIcon` + '목록으로'(`CouponFormPage.tsx:224-232`). 클릭 시 `navigate('/products/coupons')` | — | `navigate()` 프로그램 이동이라 이탈 가드가 가로채지 못한다(§7 #5) |
| FS-045-EL-017 | FS-045-SEC-07 | 폼 화면 제목 | 텍스트 | `<h1 style={pageTitleStyle}>{isEdit ? '쿠폰 수정' : '쿠폰 등록'}</h1>`(`:235`, title.xl). `isEdit` 는 라우트에 `:id` 가 있는지로 갈린다(`useCrudForm.ts:74-75`) | — | AppHeader 가 그리는 `<h1>` 과 **중복**된다 — 그 자리는 잎 라벨 '쿠폰'을 보인다(§7 #3) |
| FS-045-EL-018 | FS-045-SEC-07 | 폼 설명문 | 텍스트 | '별표(*) 항목은 필수입니다. 오른쪽 미리보기로 고객 쿠폰함에 보일 모습을 확인하세요.'(`:236-238`) | — | — |
| FS-045-EL-019 | FS-045-SEC-11 | 폼 조회 실패 배너 | 배너 | **수정 진입 시** 상세 조회 실패면 폼 대신 위험 톤 `Alert`(`:198-220`). **404 와 일반 오류를 가른다**(`loadFailure` — `useCrudForm.ts:144-149`): 404 → '쿠폰을 찾을 수 없습니다. 이미 삭제되었을 수 있습니다.' + '목록으로'만 · 그 밖 → '쿠폰을 불러오지 못했습니다.' + '다시 시도' + '목록으로' | O | 비표시. **등록(`/new`)에서는 상세를 조회하지 않아 이 배너가 걸리지 않는다**(`loadError = isEdit ? detailQuery.error : null` — `useCrudForm.ts:143`) |
| FS-045-EL-020 | FS-045-SEC-08 | 폼 저장 실패 배너 | 배너 | `FormServerError`(`:242`). 위험 톤 `Alert` '저장하지 못했습니다. 잠시 후 다시 시도해 주세요.' + **복사 가능한 참조 코드** `오류 코드 TDS-…`(`FormFeedback.tsx:38-47`, `userSelect: 'all'` + `tabular-nums`). raw 서버 body·stack·status 를 노출하지 않는다 | O | 비표시. **422 는 이 자리에 오지 않는다** — 그 필드의 인라인 오류로 간다(`useCrudForm.ts:182-192`). **409/412 도 오지 않는다** — 충돌 다이얼로그로 간다(EL-034) |
| FS-045-EL-021 | FS-045-SEC-08 | 쿠폰명 입력 | 입력 | `FormField htmlFor="coupon-name" label="쿠폰명" required`(`:248-261`). `<input type="text" maxLength={60}>`(`COUPON_NAME_MAX` — `types.ts:53`), placeholder '예: 신규 가입 15% 할인'. 자식이 네이티브 `input` 이라 **`required` 가 런타임에 `aria-required` 로 주입**된다(`FormField.tsx:50-56`). 오류 시 `controlStyle(true)` + `aria-invalid` + `aria-describedby={errorIdOf('coupon-name')}` **짝**(`:253,257-258`) | O | 검증: `requiredText('쿠폰명', 60)`(`validation.ts:31`) |
| FS-045-EL-022 | FS-045-SEC-08 | 쿠폰 코드 입력 | 입력 | `FormField htmlFor="coupon-code" label="쿠폰 코드" required`(`:264-284`). `maxLength={30}`(`COUPON_CODE_MAX`), placeholder '예: WELCOME15'. `aria-invalid`+`aria-describedby` 짝(`:278-281`). **저장 시 대문자로 정규화한다**(`toInput` — `:117`) | O | 검증 3단(`validation.ts:32-40`): 비어 있지 않을 것 · 30자 이하 · **영문·숫자·하이픈만**(`/^[A-Za-z0-9-]+$/`). **중복 검사는 클라이언트에 없다**(§7 #15) |
| FS-045-EL-023 | **FS-045-SEC-15** | 사용 대상 select | 입력 | `FormField htmlFor="coupon-target" label="사용 대상" required`(`CouponFormPage.tsx:623-631`). 전체 회원 · 회원등급 · 특정 카테고리 · 특정 상품(`COUPON_TARGET_OPTIONS` — `types.ts:212-221`). 자식이 DS `SelectField` 라 `aria-required` 주입 | O | **v1.1 에서 카드가 옮겨졌다**(쿠폰 정보 → 사용 조건) 그리고 **라벨이 '발급 대상' → '사용 대상' 으로 바뀌었다** — 트리거 축이 생기면서 '발급' 이라는 낱말이 그쪽으로 갔다. **v1.0 의 '대상을 고를 입력이 없다' 는 해소됐다** — 이 select 가 종류를 정하고 실제 대상은 EL-046 이 고른다(§1.1 ②) |
| FS-045-EL-024 | FS-045-SEC-08 | 발급 유형 select | 입력 | `FormField htmlFor="coupon-issue-type" label="발급 유형" required`(`:298-306`). 정액 할인(원) · 정률 할인(%) · 무료배송. **값에 따라 EL-025·EL-026 이 나타나고 사라진다** | O | `aria-required` 주입. 무료배송을 고르면 할인값 입력이 사라지고 저장 시 `discountValue: 0` 으로 강제된다(`toInput` — `:114,119`) |
| FS-045-EL-025 | FS-045-SEC-08 | 할인값 입력 | 입력 | **`issueType !== 'free_shipping'` 일 때만 렌더된다**(`:308-332`). 라벨이 유형에 따라 '할인율 (%)' / '할인 금액 (원)', placeholder '예: 15' / '예: 5000'. `inputMode="numeric"` 이나 `type="text"` 다(**원값 보존** — `validation.ts:3`). `aria-invalid`+`aria-describedby` 짝(`:323-328`) | O | 검증(`validation.ts:53-75`): 무료배송이면 건너뛰고, 그 밖에는 정수여야 하며, **정률이면 1~100%**. `maxLength` 가 없다 — 상한이 검증으로만 걸린다 |
| FS-045-EL-026 | FS-045-SEC-08 | 최대 할인 입력 | 입력 | **`issueType === 'percent'` 일 때만 렌더된다**(`:334-352`). 라벨 '최대 할인 (원)', hint '0 이면 상한 없음'. **`required` 가 아니다** | O | **`aria-invalid`·`aria-describedby` 를 세우지 않는다**(`:341-350`) — 형제 필드와 계약이 갈린다(§7 #17). 검증도 없다(`maxDiscount: z.string()` — `validation.ts:43`) — 어떤 문자열이든 통과하고 `toInput` 이 `Number(…) \|\| 0` 으로 삼킨다(`:120`) |
| FS-045-EL-027 | FS-045-SEC-08 | 최소 주문 금액 입력 | 입력 | `FormField … label="최소 주문 금액 (원)" required` hint '0 이면 조건 없음'(`:356-373`) | O | **`aria-invalid`·`aria-describedby` 를 세우지 않는데 오류는 렌더된다**(§7 #17). 검증 `intString('최소 주문 금액')`(`validation.ts:44`) — 빈 값·비정수를 막는다 |
| FS-045-EL-028 | FS-045-SEC-08 | 발급 수량 입력 | 입력 | `FormField … label="발급 수량" required` hint '0 이면 무제한'(`:375-392`) | O | EL-027 과 같은 미배선(§7 #17). 검증 `intString('발급 수량')`(`validation.ts:47`) |
| FS-045-EL-029 | FS-045-SEC-08 | 사용 기간 입력 | 입력 | `DateRangeField label="사용 기간" required`(`:395-404`). 두 `<input type="date">` 를 '~' 로 잇고 각 칸에 시각 숨김 라벨('사용 기간 시작일'·'사용 기간 종료일')을 준다(`DateRangeField.tsx:60-92`). **`required` 와 `aria-required` 를 두 칸 각각에 자체 배선**하고(`:48`), 오류 시 `aria-invalid`+`aria-describedby` 를 **짝으로** 준다(`:45`). RHF `setValue(…, { shouldDirty: true })` 로 값을 쓴다(`:400-401`) | O | 오류는 `errors.startAt?.message ?? errors.endAt?.message`(`:193`) — **두 필드의 오류가 한 슬롯을 공유한다.** 검증(`validation.ts:70-91`): 실재 날짜 · **종료 ≥ 시작**. **실재 판정은 정본 `isCalendarDate` 로 수렴했다**(`:74` — import `:6` · 정의 `shared/format.ts:244-249`): 타입가드이며 `noonUtcOf` 로 만든 정오 UTC 를 `dayOfUtc(noon) === value` 로 **왕복 대조**해 `2026-02-31` 을 정확히 거부한다(회귀 테스트 `format.test.ts:133`). **형식만 보던 로컬 사본이 아니다** — 이 화면에 있던 사본 `isRealDate` 가 바로 그 결함을 갖고 있었고(회귀 테스트가 그 사실을 주석으로 남긴다 — `coupons.test.ts:139-142`), 사본 11벌 중 10벌이 이 정본으로 수렴했다(ERP-09). 프리셋('오늘/최근 7일/…')이 없다(§7 #18) |
| FS-045-EL-030 | FS-045-SEC-08 | 발급 상태 토글 | 입력 | `fieldStyle` 안에 라벨 '발급 상태' + `ToggleSwitch`, 켜짐 '발급중' / 꺼짐 '중지'(`:406-416`). `setValue('enabled', next, { shouldDirty: true })` | O | **`FormField` 가 아니라 `fieldStyle` + `<span style={fieldLabelStyle}>`** 로 손조립했다 — 토글은 `required` 가 성립하지 않는 컨트롤이라 마커가 필요 없다 |
| FS-045-EL-031 | FS-045-SEC-09 | 쿠폰 카드 미리보기 | 표시 | `CouponCardPreview`(`:421-431`). 왼쪽 입력이 바뀌면 **즉시** 고객 쿠폰함 카드 모습을 그린다(`CouponCardPreview.tsx:126-146`): 할인 문구(`discountLabel` — 목록과 같은 함수) · 쿠폰명(비면 '쿠폰명') · 조건 줄(`최소주문원 이상 구매 시 · 최대 N원 · <대상라벨>`) · 기간(비면 '사용 기간 미설정') · 'COUPON' 점선 스텁. **꺼짐이면 카드를 흐리게**(`opacity: 0.55`) 하고 캡션이 '중지 — 저장해도 고객에게 발급되지 않습니다.' | — | 문자열 입력을 `toNum`(`:194` — `Number((raw.trim() \|\| '0').replace(/\D/g, '')) \|\| 0`)으로 환산해 넘긴다 — **검증 전 값이라 미리보기가 저장 결과와 다를 수 있다**(§7 #19). `opacity: 0.55` 가 토큰이 아닌 리터럴이다(§7 #20) |
| FS-045-EL-032 | FS-045-SEC-10 | 취소 버튼 | 버튼 | 우측 정렬 그룹의 왼쪽. `type="button" variant="secondary" size="md"`. 저장 중 비활성(`:436-444`). 클릭 시 목록 이동 | — | EL-016 과 **목적지가 같다** |
| FS-045-EL-033 | FS-045-SEC-10 | 제출 버튼 | 버튼 | 우측. `type="submit" variant="primary" size="md"`. 라벨 `{saving ? '저장 중…' : isEdit ? '저장' : '등록'}`(`:445-447`). 비활성 조건: 저장 중 또는 상세 로딩 중(`disabled` — `:179`) | O | **진행 상태를 `loading` prop 이 아니라 손으로 쓴 라벨로 표현한다**(§7 #21). **미변경(`!isDirty`)에서도 눌린다** — 교환/반품(`ReturnDetailPage.tsx:356`)·적립금(`DocumentFormShell.tsx:149`)과 다르다 |
| FS-045-EL-034 | FS-045-SEC-12 | 충돌 다이얼로그 | 모달 | 저장이 409/412 로 실패하면 `FormConflictDialog`(`:451` → `FormFeedback.tsx:58-74`). `ConfirmDialog intent="delete"`, 제목 '다른 사용자가 먼저 변경했습니다', 문구 `<서버 문구> 최신 내용을 불러오면 지금 입력한 내용은 사라집니다. 입력한 내용을 지키려면 '이어서 편집'을 선택하세요.`, 확인 '최신 내용 불러오기'(입력을 버리고 재조회) / 취소 '이어서 편집'(다이얼로그만 닫는다). `suppressCancelToast` | O | 비표시. **입력이 살아 있다** — 다이얼로그가 폼 위에 뜰 뿐 언마운트하지 않는다(`FormFeedback.tsx:51-53`). 성공 토스트·목록 이동 없음. 어댑터가 없는 id 에 `HttpError(409, '다른 사용자가 먼저 삭제한 항목입니다.')` 를 던진다(`crud.ts:126-128`) |
| FS-045-EL-035 | FS-045-SEC-13 | 미저장 이탈 가드 | 모달 | `useUnsavedChangesDialog(isDirty && !saving, { message: UNSAVED_MESSAGE })`(`:181`). `isDirty` 는 **RHF `formState.isDirty`**(`useCrudForm.ts:261`). 3경로(beforeunload · 앱 내 링크 capture · popstate sentinel). 문구 '쿠폰에 저장하지 않은 변경 사항이 있습니다. 이 화면을 벗어나면 입력한 내용이 사라집니다.'(`:42-43`) | — | 비표시. **`navigate()` 프로그램 이동(EL-016·EL-032)과 저장 성공 후 이동(`useCrudForm.ts:223`)은 가로채지 않는다** — 후자는 정상(저장했으니 가드가 필요 없다), 전자는 결함(§7 #5) |
| FS-045-EL-036 | FS-045-SEC-08/14/15 | 검증 규칙 | 텍스트 | 정본은 `couponSchema`(`validation.ts:35-194`). **필드 20개 + 교차 검증 5건**(v1.0 은 8필드·2건이었다): ① 할인값(발급 유형 종속 — `:73-95`) ② 캠페인 기간(실재 날짜 + 종료≥시작 — `:96-117`) ③ **발급 기준**(고른 종류가 요구하는 칸만 — `:118-166`) ④ **사용 대상**(`all` 이 아니면 `targetIds` 1개 이상 — `:167-180`) ⑤ **사용 기간**(`days_from_issue` 면 1~365일 — `:181-194`). 실재 판정은 정본 `isCalendarDate`. 오류 문구의 조사는 `objectParticle`·`topicParticle` 로 받침에서 고른다(`:11,28,31,178`) — **리터럴 '을(를)' 을 출하하지 않는다** | — | 비표시 규칙. `zodResolver` 가 RHF 에 잇는다(`useCrudForm.ts:80`). 검증 실패 시 첫 invalid 필드로 포커스가 간다(RHF `shouldFocusError` + `onInvalid` 명시). **③④⑤ 가 전부 조건부 검사다** — 고르지 않은 종류의 칸은 저장 시 버려지므로 검사하지 않는다(`validation.ts:119`). ⚠ 그 결과 **버려질 칸에 쓰레기가 남아 있어도 통과한다**(무해하지만 §7 #29) |
| FS-045-EL-037 | FS-045-SEC-08 | 값 변환 규칙 | 텍스트 | **폼은 숫자를 문자열로 든다**(`validation.ts:3` — 입력 원값 보존). `toValues`(`:131-146`)가 항목 → 폼 값(숫자를 `String()`, 무료배송이면 할인값을 `''`), `toInput`(`:113-129`)이 폼 값 → 저장 입력(`trim` · 코드 대문자화 · `Number(… \|\| '0')` · 무료배송이면 `discountValue: 0`) | — | 비표시 규칙 |
| FS-045-EL-038 | FS-045-SEC-10 | 제출 잠금·멱등키 규칙 | 텍스트 | ① **동기 제출 락** — `submitLockRef`(`useCrudForm.ts:103,202-203`)가 렌더를 기다리지 않고 두 번째 제출을 막는다. `onSettled` 에서 풀고(`:213-215`) 검증 실패 시에도 푼다(`:246-248`). ② **제출 시도 단위 멱등키** — `idempotencyKeyRef`/`takeIdempotencyKey`(`:118-123`)가 mutationFn **밖**에서 키를 만들어 variables 로 싣는다(`:211,228,235`) → 어댑터 원장이 재생 처리한다(`crud.ts:62-72,114,121`). **성공해야 키를 버린다**(`:220`) | — | 비표시 규칙. 백엔드 연결 시 `Idempotency-Key` 헤더가 된다(`crud.ts:39-41`) |
| FS-045-EL-039 | FS-045-SEC-10 | 저장 성공 토스트 | 토스트 | `쿠폰을 등록했습니다.` / `쿠폰을 저장했습니다.`(`useCrudForm.ts:222` — `${entityLabel}${objectParticle(entityLabel)} ${verb}했습니다.`). 이어서 목록으로 `replace` 이동(`:223`) | — | 비표시. 조사가 받침에서 나온다 — 리터럴 '을(를)' 이 아니다 |
| FS-045-EL-040 | FS-045-SEC-08 | `issuedCount` 보존 규칙 | 텍스트 | 발급된 수량은 **폼에 입력이 없고** 스키마에 `z.number()` 로 남아(`validation.ts:44-45`) `toValues`/`toInput` 이 그대로 옮긴다(`:144,124`). 등록 시 초기값 0(`EMPTY` — `:110`) | O | 비표시 규칙. **클라이언트가 이 값을 되돌려 보낸다** — 서버가 신뢰하면 소진율을 조작할 수 있다(BE-045 §7.2) |
| FS-045-EL-041 | FS-045-SEC-01 | 발급 기준 필터 | 입력 | `SelectField aria-label="발급 기준으로 거르기"`(`CouponListPage.tsx:256-269`). '전체 발급 기준' + 6종(`COUPON_TRIGGER_OPTIONS` — `types.ts:58-70`). 선택 시 `list.setFilter('trigger', …)` → URL `?trigger=` | — | **v1.1 신설.** 손편집 URL 은 `parseFilter(…, 'all')` 가 되돌린다(`:135-139`). 결합 순서는 `filterByTrigger(filterCoupons(items, issue), trigger)` 후 검색(`:157-163`) — 두 필터가 AND 다 |
| FS-045-EL-042 | FS-045-SEC-01 | '발급 현황' 버튼 | 버튼 | 툴바 우측. `Button variant="secondary" size="md"` + `Icon name="bar-chart"`(`CouponListPage.tsx:274-277`). `navigate('/products/coupons/issuance')` | — | **v1.1 신설. 권한 게이팅이 없다 — 의도된 것이다**(`:273` 주석): 발급 현황은 조회 전용이고 read 권한은 라우트 가드가 이미 본다. **PG 잠금과도 무관하다** — 잠겨도 과거 발급 기록은 볼 수 있어야 한다 |
| FS-045-EL-043 | FS-045-SEC-04 | 발급 기준 셀 | 텍스트 | `triggerSummary(item.trigger)`(`CouponListPage.tsx:171` → `types.ts:91-107`), `nowrap` | — | **v1.1 신설. 파라미터를 문구에 싣는다** — 'VIP 승급 시' 와 'VVIP 승급 시' 는 다른 정책인데 둘 다 '회원 등급 승급 시' 로만 보이면 목록에서 구분할 수 없다(`types.ts:84-88`). 생일은 `0` 이면 '생일 당일', 아니면 '생일 N일 전'. 다운로드는 기간까지 적는다 |
| FS-045-EL-044 | FS-045-SEC-04 | 충돌 경고 배지 | 배지 | 상태 셀 안에서 상태 배지 **옆에** `StatusBadge tone="warning" label={conflictLabel(n)}`(`CouponListPage.tsx:189-199`). 문구는 `'쿠폰 불가 상품 N건'`(`types.ts:413-415`). 충돌이 0건이면 렌더되지 않는다 | O | **v1.1 신설. 상태를 덮지 않는다**(`:190-191`) — 승자가 상품이므로 쿠폰은 여전히 '진행중' 이고 다만 그 상품에는 붙지 않는다(§1.1 ④). 계산은 `conflictingProductsOf`(`data-source.ts:355`)가 상품 저장소를 **동기로** 읽는다 — react-query 밖이라 로딩·실패 상태가 없다(§7 #30) |
| FS-045-EL-045 | FS-045-SEC-14 | 발급 시점 select | 입력 | `FormField htmlFor="coupon-trigger-type" label="발급 시점" required hint={triggerHint}`(`CouponFormPage.tsx:523-542`). 6종. **hint 가 종류에 따라 바뀐다** — `COUPON_TRIGGER_OPTIONS[].hint`(`types.ts:58-70`)에서 고른다(`:315-316`): 예) 첫 구매 → '첫 주문이 결제 완료되면 자동 발급됩니다.' | O | **v1.1 신설.** `z.enum` 6종이라 위반 값이 올 수 없다. 이 select 가 아래 세 조건부 칸(EL-046~048)의 표시를 지배한다 |
| FS-045-EL-046 | FS-045-SEC-14 | 승급 대상 등급 select (조건부) | 입력 | **`triggerType === 'tier_up'` 일 때만**(`CouponFormPage.tsx:543-563`). `FormField label="승급 대상 등급" required`, 3종(`MEMBER_TIER_TARGETS` — `types.ts:223-227`, 라벨의 정본은 `shared/domain/member` 의 `TIER_LABEL`) | O | **v1.1 신설.** 다른 종류를 고르면 **칸이 사라지고 저장 시 값이 버려진다**(`buildCouponTrigger`) — 그러나 **폼 상태에는 남는다**(`:136-141` 초기값이 모든 칸을 늘 들고 있다) 그래서 되돌아오면 값이 살아 있다 |
| FS-045-EL-047 | FS-045-SEC-14 | 생일 며칠 전 발급 입력 (조건부) | 입력 | **`triggerType === 'birthday'` 일 때만**(`CouponFormPage.tsx:564-589`). `<input type="text" inputMode="numeric">` + `aria-invalid`·`aria-describedby` 짝 | O | **v1.1 신설.** 검증(`validation.ts:122-133`): 빈 값·비정수·`BIRTHDAY_DAYS_MAX`(60 — `types.ts:49`) 초과면 '생일 발급 시점은 0일(당일) 이상 60일 이전 사이로 입력하세요.' **0 이 허용된다**(생일 당일). 상한 60의 근거(`types.ts:48`): '두 달을 넘기면 생일 쿠폰이 아니라 상시 쿠폰이다' |
| FS-045-EL-048 | FS-045-SEC-14 | 다운로드 기간 (조건부) | 입력 | **`triggerType === 'download'` 일 때만**(`CouponFormPage.tsx:592-603`). DS `DateRangeField label="다운로드 기간" required`. 오류는 `errors.triggerFrom?.message ?? errors.triggerTo?.message`(`:268`) — **두 칸이 한 슬롯을 공유한다** | O | **v1.1 신설.** 검증 3단(`validation.ts:135-165`): ① 실재 날짜 ② 종료 ≥ 시작 ③ **종료 ≤ 캠페인 종료일** — '받아도 쓸 수 없는 쿠폰을 만들지 않는다'(`:157`). ③ 이 이 화면에서 **두 축을 잇는 유일한 교차 검증**이다 |
| FS-045-EL-049 | FS-045-SEC-14 | 발급 기준 요약 한 줄 | 텍스트 | 카드 하단 muted `'요약 — {triggerSummary(buildCouponTrigger(초안))}'`(`CouponFormPage.tsx:605-615`) | — | **v1.1 신설.** **폼이 실제로 저장할 유니온을 그대로 그린다** — `buildCouponTrigger` 를 거치므로 버려질 칸이 요약에 섞이지 않는다. 운영자가 '무엇을 저장하는지' 를 저장 전에 본다 |
| FS-045-EL-050 | FS-045-SEC-15 | 대상 선택기 (조건부) | 입력 | **`targetNeedsIds(target)` 일 때만**(`CouponFormPage.tsx:653-666`). `CouponTargetPicker`(`components/CouponTargetPicker.tsx`) — 라벨은 `targetPickerLabel(target)`(`types.ts:243-256`: 대상 회원등급 / 대상 카테고리 / 대상 상품), 선택은 `setValue('targetIds', …, { shouldDirty: true, shouldValidate: true })` | O | **v1.1 신설 — v1.0 §7 #1 의 해소본.** `loading` 은 **카테고리일 때만** `categoriesQuery.isPending`(`:665`) — 회원등급은 상수, 상품은 동기 저장소다. 오류는 `targetIdsError`(`:269` — RHF 배열 필드라 타입 단언을 거친다) |
| FS-045-EL-051 | FS-045-SEC-15 | 사용 가능 기간 select | 입력 | `FormField htmlFor="coupon-usage-kind" label="사용 가능 기간" required hint="발급일 기준을 고르면 회원마다 만료일이 달라집니다."`(`CouponFormPage.tsx:668-683`). 2종 — '쿠폰 사용 기간과 동일'(`fixed`) · '발급일 기준 N일'(`days_from_issue`) | O | **v1.1 신설.** hint 가 **이 선택의 결과**를 말한다 — 회원마다 만료일이 달라진다는 사실이 운영에서 가장 자주 잊히는 지점이다(§1.1 ③) |
| FS-045-EL-052 | FS-045-SEC-15 | 사용 가능 일수 입력 (조건부) | 입력 | **`usageKind === 'days_from_issue'` 일 때만**(`CouponFormPage.tsx:685-708`). `hint` 가 절단 규칙을 미리 말한다 — '최대 365일. 쿠폰 사용 종료일이 먼저 오면 그날 만료됩니다.' `aria-invalid`·`aria-describedby` 짝 | O | **v1.1 신설.** 검증(`validation.ts:181-194`): 1일 이상 `USAGE_DAYS_MAX(365)` 이하. **절단은 검증이 아니라 파생이다** — `couponExpiryFor` 가 발급 1건마다 계산한다(§1.1 ③ · EL-057) |
| FS-045-EL-053 | FS-045-SEC-15 | 중복 사용 토글 | 입력 | `ToggleSwitch label="다른 쿠폰과 중복 사용 여부" onLabel="중복 사용 가능" offLabel="1주문 1쿠폰"`(`CouponFormPage.tsx:710-720`). `setValue('stackable', next, { shouldDirty: true })` | O | **v1.1 신설.** 기본값 `false`(`:144`) — 국내 커머스는 1주문 1쿠폰이 기본이다(`types.ts:184`). 라벨이 **꺼짐 상태의 의미('1주문 1쿠폰')를 말한다** — '끔' 이라고만 하면 무엇이 꺼지는지 알 수 없다 |
| FS-045-EL-054 | FS-045-SEC-15 | 충돌 경고 배너 (조건부) | 배너 | **충돌이 1건 이상일 때만** `Alert tone="warning"`(`CouponFormPage.tsx:723-731`): `'쿠폰 불가 상품 N건이 대상에 들어 있습니다 ({상품명, …}). 해당 상품은 쿠폰 사용 불가로 설정되어 있어 이 쿠폰이 적용되지 않습니다 — 상품의 쿠폰 사용 설정을 먼저 풀어 주세요.'` | O | **v1.1 신설. 저장을 막지 않는다** — 경고일 뿐이다(§1.1 ④). 복구 경로를 **문장으로만** 준다 — 그 상품으로 가는 링크가 없다(§7 #31). 계산은 `useMemo`(`:308-313`)이고 `target`·`targetIds` 가 바뀔 때마다 다시 돈다 |
| FS-045-EL-055 | FS-045-SEC-16 | 발급 현황 툴바 | 입력 | 검색(`label="회원·쿠폰명 검색"` — `CouponIssuanceListPage.tsx:186-192`) + 쿠폰 필터(`aria-label="쿠폰으로 거르기"` — `:194-205`) + 발급 기준 필터(`aria-label="발급 기준으로 거르기"` — `:208-219`). 셋 다 `useListState` 로 URL 에 실린다(`:103`) | — | **v1.1 신설.** 쿠폰 필터의 선택지는 **실제 쿠폰 목록**에서 온다(`fetchCouponsForIssuance` — `data-source.ts:343`) — 상수가 아니다 |
| FS-045-EL-056 | FS-045-SEC-17 | 쿠폰별 요약 표 | 표 | 시각 노출 `<caption style={hintStyle}>`(`CouponIssuanceListPage.tsx:239-241`). 행마다 쿠폰명(목록으로 가는 `Link` — `:276-281`) · 발급 · 사용 · 사용률 배지(`:289`) · **트리거별 건수 배지**(`:304`). 집계는 `summarizeIssuances`(`types.ts:451-465`) | O | **v1.1 신설.** `bySource` 는 **여섯 키가 항상 있다**(`emptySourceCounts` — `types.ts:446-448`) — 그래서 화면이 폴백을 적지 않는다(`types.ts:443`). `usedRate` 는 발급 0이면 0 이다 |
| FS-045-EL-057 | FS-045-SEC-18 | 발급 이력 표 | 표 | `CrudReadListShell`(`CouponIssuanceListPage.tsx:318-327`) — **선택·삭제가 없다**(`:6` 주석: '보기만 한다'). 6열: 쿠폰 · 발급 기준(`triggerTypeLabel`) · 회원 · 발급일 · **만료일** · 사용 여부(미사용 neutral / '{날짜} 사용' success) | O | **v1.1 신설. 만료일이 파생값이다** — `couponExpiryFor(coupon, issuedAt)`(`:166` → `types.ts:296-303`)가 **캠페인 종료일에서 자른다**(§1.1 ③). 즉 같은 쿠폰이라도 **발급일마다 만료일이 다르다** — 이 열이 그 규칙이 실제로 보이는 유일한 자리다 |
| FS-045-EL-058 | FS-045-SEC-01/08/14/15 | **PG 잠금 규칙** | 텍스트 | `pgLock(readPaymentSettings(), 'coupon-admin')`(`CouponListPage.tsx:126`). 잠기면 ① 툴바 위에 `PgLockNotice`(info 톤 — `:229`) ② 발급 토글 `disabled`(`:208`) ③ '쿠폰 등록' 버튼 **미렌더**(`:278` `canCreate && !lock.locked`) | O | **v1.1 신설.** 결제를 쓰지 않으면 쿠폰이 붙을 주문이 없다. **잠금은 입력만 막고 저장된 값은 보존된다** — 근거와 전문은 [ADR-0014](../../../docs/adr/0014-pg-switch-screen-impact.md). **발급 현황은 잠기지 않는다**(EL-042) |
| FS-045-EL-059 | FS-045-SEC-19 | 목록으로 돌아가기 | 링크 | 발급 현황 하단 `<Link to="/products/coupons" class="tds-ui-link tds-ui-focusable">`(`CouponIssuanceListPage.tsx:341-343`) | — | **v1.1 신설.** 발급 현황에는 back-link 버튼이 없고 이 링크 하나다 — 사이드바의 '쿠폰' 이 여전히 활성이라(`findCoveringLeaf`) 길을 잃지는 않는다 |
| FS-045-EL-060 | — | 트리거 ↔ 발급 이력 축 일치 규칙 | 텍스트 | `CouponIssuance.source` 의 타입이 **`CouponTriggerType` 그 자체**다(`types.ts:429`). 그래서 발급 이력의 '어디서 왔는가' 와 쿠폰의 '언제 나가는가' 가 **같은 어휘를 쓴다** — 필터(`filterIssuancesBySource` — `types.ts:486-491`)와 집계(`bySource`)가 재매핑 없이 성립한다 | — | **v1.1 신설.** 비표시 규칙. 두 축을 다른 열거로 두면 '다운로드로 나간 건수' 를 세는 코드가 두 어휘를 잇는 표를 하나 더 들고 있어야 한다 |


## 4. 예외 명세

| 요소번호 | 빈 상태 | 로딩 | 실패 | 유효성 | 권한없음 | 경합 | 대량 |
|---|---|---|---|---|---|---|---|
| FS-045-EL-001 | 매치 0건이면 EL-011 의 '검색' 분기 | 조회 중에도 입력 가능하나 대상 배열이 비어 결과가 0건 | N/A — 서버를 호출하지 않는다(클라이언트 필터) | 자유 텍스트. 길이·문자 제약 없음. 앞뒤 공백 제거 후 커밋. 빈 문자열은 '검색 해제'라 통과 | **§4.1 공통 규칙 — 이 화면에 쓰기 게이팅이 없다** | 커밋된 값이 URL 에 있어 새로고침·뒤로가기로 복원된다 | 전량이 메모리에 있어 커밋마다 전체를 다시 건다. 디바운스가 자모당 연산을 막는다 |
| FS-045-EL-002 | 그 유형 0건이면 EL-011 의 '필터' 분기 | 조회 중 조작 가능(결과 0건) | N/A — 클라이언트 필터 | 모르는 값은 `parseFilter` 가 '전체'로 되돌린다 | §4.1 공통 규칙 적용 | URL 이 원천이라 새로고침·뒤로가기에 살아남는다 | 선택지 3+1개 고정 |
| FS-045-EL-003 | N/A — 항상 표시 | 조회 중에도 표시 | N/A — 라우터 내부 이동 | N/A — 입력 없음 | **미충족 — 쓰기 권한 없는 역할도 이 버튼을 본다**(§7 #4) | N/A — 이동뿐 | N/A — 단일 버튼 |
| FS-045-EL-004 | N/A — 규칙 자체는 행 수와 무관 | 조회 중에도 URL 은 이미 확정돼 있다 | N/A — 서버 호출 없음 | `?page=0`·`?page=abc` 는 1로 보정되나 이 화면은 page 를 쓰지 않는다 | §4.1 공통 규칙 적용 | **이것이 경합 방어 자체다** — 수정 폼에서 Back 해도 조건이 복원된다 | URL 길이는 필터 1개 + 검색어라 상한 문제가 없다 |
| FS-045-EL-005 | 필터 AND 검색 결과가 0건이면 EL-011 | 조회 중에는 대상이 빈 배열 | N/A — 클라이언트 연산 | N/A — select + 검색어라 자유 입력 위반이 없다 | §4.1 공통 규칙 적용 | N/A — 조회 시점 배열에만 적용 | 결과가 많아도 전량 렌더(§7 #2) |
| FS-045-EL-006 | 0건이면 '조건에 맞는 쿠폰 결과가 없습니다.' 를 announce | **최초 로드 중에는 침묵한다** — 아직 알릴 사실이 없다(`CrudListShell.tsx:78`) | 실패면 '쿠폰 목록을 불러오지 못했습니다.' 를 announce | N/A — 입력 없음 | §4.1 공통 규칙 적용 | 재조회 결과가 바뀌면 다시 announce | 건수는 `formatNumber` |
| FS-045-EL-007 | 0건이면 '전체 0건' | 최초 로드만 '불러오는 중…' | 조회 실패 시 EL-012 가 이 자리를 대체한다 | N/A — 입력 없음 | §4.1 공통 규칙 적용 | **재조회 중에도 건수가 유지되고 '· 새로고침 중…'이 붙는다** | 천 단위 구분 |
| FS-045-EL-008 | 선택 0건이면 미렌더 | 삭제 진행 중 비활성 | 실패는 EL-014 다이얼로그 안 배너 | N/A — 입력 없음 | **미충족 — 삭제 권한 없는 역할도 이 바를 본다**(§7 #4) | 선택된 행이 그 사이 지워지면 그 id 의 삭제가 409 로 실패한다(`crud.ts:139-141`) — 부분 실패로 집계된다 | **선택 범위가 '보이는 전량'이라 상한이 없다.** 임계값 초과 시 강화 확인·진행률·취소가 없다(§7 #8) |
| FS-045-EL-009 | 0건이면 EL-011 로 본문 대체 | EL-010 스켈레톤 + `aria-busy` | EL-012 로 요약·표 대체(툴바는 남는다) | N/A — 표 자체 입력 없음 | §4.1 공통 규칙 적용 | 조회 시점 스냅샷. 다른 관리자의 변경은 재조회 시점에만 반영된다 | **상한 없음** — 쿠폰 수에 비례해 행이 는다(§7 #2) |
| FS-045-EL-009.1 | 행 없으면 렌더되나 아무것도 선택하지 않는다 | 조회 중 스켈레톤 행이라 체크박스가 없다 | 조회 실패 시 미표시 | N/A — 이진 | §4.1 공통 규칙 적용 | 재조회로 행이 사라지면 그 선택은 남는다 — **필터·검색 변경만 선택을 지운다**(EL-015). 삭제 성공 시에는 `clear()`(`useCrudList.tsx:145`) | **'보이는 전량'을 한 번에 선택한다** — 페이지네이션이 없어 cross-page 개념이 없다 |
| FS-045-EL-009.2 | 행 없으면 없음 | 조회 중 스켈레톤 | 조회 실패 시 미표시 | N/A — 이진 | §4.1 공통 규칙 적용 | 위와 동일 | Shift-click 범위 선택이 없다(§7 #8) |
| FS-045-EL-009.3 | 행 없으면 없음 | 조회 중 스켈레톤 | 조회 실패 시 미표시 | N/A — 입력 없음 | §4.1 공통 규칙 적용 | 재조회·필터로 순서가 바뀌면 순번도 다시 매겨진다 | 페이지네이션 도입 시 값 공식이 틀어진다(§7 #2) |
| FS-045-EL-009.4 | 쿠폰명이 빈 문자열이면 빈 칸(스키마가 막으므로 실제로는 없다) | 조회 중 스켈레톤 | 조회 실패 시 미표시 | N/A — 표시 전용 | §4.1 공통 규칙 적용 | 조회 시점 값 | **truncate 없음**(§7 #10) |
| FS-045-EL-009.5 | 행 없으면 없음 | 조회 중 스켈레톤 | 조회 실패 시 미표시 | N/A — 표시 전용 | §4.1 공통 규칙 적용 | 조회 시점 값 | nowrap. mono·tabular 가 아니라 자릿수가 정렬되지 않는다 |
| FS-045-EL-009.6 | 행 없으면 없음 | 조회 중 스켈레톤 | 조회 실패 시 미표시 | N/A — 파생값 | §4.1 공통 규칙 적용 | 조회 시점 값 | nowrap. 3분기 고정 |
| FS-045-EL-009.7 | 행 없으면 없음 | 조회 중 스켈레톤 | **포맷 함수를 거치지 않아 잘못된 값도 그대로 렌더된다**(§7 #22) | N/A — 표시 전용 | §4.1 공통 규칙 적용 | 조회 시점 값 | nowrap + tabular-nums |
| FS-045-EL-009.8 | 행 없으면 없음. 발급 수량 0 이면 '무제한' | 조회 중 스켈레톤 | 조회 실패 시 미표시 | N/A — 파생값 | §4.1 공통 규칙 적용 | `issuedCount` 는 조회 시점 값 — 발급이 계속 나가면 즉시 낡는다 | **`Math.min(100, …)` 로 100% 를 넘지 않게 깎는다** — 발급 수량을 발급된 수보다 작게 저장하면 실제 초과를 숨긴다(§7 #13) |
| FS-045-EL-009.9 | 행 없으면 없음 | 조회 중 스켈레톤 | 조회 실패 시 미표시 | N/A — 파생값 | §4.1 공통 규칙 적용 | **`today` 가 렌더마다 계산된다**(`:95`) — 자정을 넘기면 배지가 저절로 바뀐다. 다만 리렌더가 없으면 멈춰 있다 | 4분기. **'중지'와 '만료'가 같은 톤(neutral)** 이라 색으로 구분되지 않는다(§7 #11) |
| FS-045-EL-009.10 | 행 없으면 없음 | 진행 중 행은 `busy` | 실패 시 error 토스트 '변경하지 못했습니다. 잠시 후 다시 시도해 주세요.'(`useCrudRowUpdate.ts:53`). 값은 원래대로 남는다(비관적) | N/A — 이진 | **미충족 — 쓰기 권한 없는 역할도 토글할 수 있다**(§7 #4) | **다른 관리자가 그 사이 지운 쿠폰을 토글하면 409** → error 토스트로 뭉개진다(충돌 다이얼로그 없음 — §7 #23). **낙관적 갱신이 아니라 롤백 경로가 필요 없다** | 행마다 1개. 여러 행을 잇달아 토글하면 **이전 요청이 abort 된다**(`:39`) — 마지막 것만 살아남는 것이 아니라 앞선 것이 취소된다(§7 #24) |
| FS-045-EL-009.11 | 행 없으면 없음 | 삭제 진행 중 비활성 | 삭제 실패는 EL-013 다이얼로그 안 배너 | N/A — 입력 없음 | **미충족 — 수정·삭제 권한 없는 역할도 본다**(§7 #4) | 이미 지워진 쿠폰의 삭제는 409(`crud.ts:139-141`) → 다이얼로그 안 배너 | 행마다 2개 |
| FS-045-EL-009.12 | 행 없으면 규칙이 걸리지 않는다 | 조회 중 스켈레톤 행이라 이동 규칙이 걸리지 않는다 | N/A — 라우터 내부 이동 | N/A — 입력 없음 | §4.1 공통 규칙 적용 | 이동 후 폼이 상세를 재조회한다 | N/A — 행 단위 |
| FS-045-EL-010 | N/A — 도착 전 상태 | 이것이 로딩 표현. 5행 × 10셀 | 조회 실패 시 EL-012 로 바뀐다 | N/A — 입력 없음 | §4.1 공통 규칙 적용 | **재조회에서는 뜨지 않는다** — 이전 행이 유지된다(`useCrudList.tsx:71`) | 행 수가 하드코딩 `length: 5`(§7 #6) |
| FS-045-EL-011 | 이것이 빈 상태 표현 — 3분기 | 최초 로드 중에는 스켈레톤이 우선한다 | 조회 실패 시 EL-012 로 | N/A — 입력 없음 | §4.1 공통 규칙 적용 | 맥락이 URL 에서 파생되므로 새로고침 후에도 같은 분기 | **진짜 0건에 생성 CTA 가 없다**(§7 #7) |
| FS-045-EL-012 | N/A — 실패 상태 | 재시도 시 배너가 사라지고 스켈레톤으로 | 이것이 실패 표현. 1문구 고정. 복구 '다시 시도' | N/A — 입력 없음 | §4.1 공통 규칙 적용 — **권한 부족(403)도 이 배너**로 뭉개진다(§7 #25) | 재시도는 같은 조회를 재발행. 필터는 URL 에 있어 유지된다 | N/A — 표시 전용 |
| FS-045-EL-013 | N/A — 대상이 있어야 성립 | `busy={deleting}` — 확인 버튼 비활성 | 이것이 실패 표현. **다이얼로그를 열어 둔 채 배너**를 띄우고 재클릭이 retry | N/A — 입력 없음 | §4.1 공통 규칙 적용 | 이미 지워진 쿠폰이면 409 → 같은 배너로 뭉개진다 | 단건 |
| FS-045-EL-014 | 선택 0건이면 확인이 no-op(`:127-128`) | `busy={bulkDeleting}` | **부분 실패는 다이얼로그를 열어 둔 채 `N건 중 M건 실패` 배너.** 전건 성공에서만 닫는다 | N/A — 입력 없음 | §4.1 공통 규칙 적용 | 선택 중 일부가 이미 지워졌으면 그 id 만 409 로 실패 → 부분 실패 | **실패 id 를 알 수 없다** — `settleAll` 이 건수만 준다. 재시도가 전건을 재실행한다(성공분 재요청 — §7 #8). 진행률·취소 없음 |
| FS-045-EL-015 | N/A — 선택이 있어야 성립 | N/A — 로컬 상태 | N/A — 서버 호출 없음 | N/A — 입력 없음 | §4.1 공통 규칙 적용 | **이것이 경합 방어 규칙 자체다** — 보이지 않는 행의 선택을 지운다 | 필터·검색 변경 시 전건 해제 |
| FS-045-EL-016 | N/A — 항상 표시 | 조회 중에도 표시 | N/A — 서버 호출 없음 | N/A — 입력 없음 | §4.1 공통 규칙 적용 | 저장 중에도 누를 수 있다 — 이탈 시 `useCrudForm` 의 언마운트 abort(`:93`) | N/A — 단일 버튼 |
| FS-045-EL-017 | N/A — 정적 문구 | 로딩 중에도 표시(등록/수정 구분은 라우트가 정한다) | N/A — 서버 호출 없음 | N/A — 입력 없음 | §4.1 공통 규칙 적용 | N/A — 저장 상태 없음 | 2분기 고정 |
| FS-045-EL-018 | N/A — 정적 문구 | 로딩 중에도 표시 | N/A — 서버 호출 없음 | N/A — 입력 없음 | §4.1 공통 규칙 적용 | N/A | 고정 문구 |
| FS-045-EL-019 | N/A — 실패 상태 | 재시도 시 배너가 사라진다 | 이것이 실패 표현. **404 에는 '다시 시도'를 주지 않는다** | N/A — 입력 없음 | §4.1 공통 규칙 적용 — **403 은 404 와 다른 문구를 갖지 못한다**(§7 #25) | 다른 관리자가 지운 쿠폰의 수정 링크를 열면 404 | N/A — 표시 전용 |
| FS-045-EL-020 | N/A — 오류 없으면 미렌더 | 재저장 시 기존 문구·참조 코드를 먼저 지운다(`useCrudForm.ts:205-206`) | 이것이 저장 실패 표현. 문구 1종 + 참조 코드. abort 는 표시하지 않는다 | **422 는 이 자리에 오지 않는다** — 그 필드의 인라인 오류로 간다 | §4.1 공통 규칙 적용 — 권한 부족(403)도 이 문구로 뭉개진다 | **409/412 도 이 자리에 오지 않는다** — EL-034 충돌 다이얼로그로 간다 | 1건만 표시 |
| FS-045-EL-021 | 등록 시 빈 문자열, placeholder 노출 | 수정 진입 시 상세 로딩 중 비활성 | 저장 실패는 EL-020. 실패 시 **입력 보존** | `requiredText('쿠폰명', 60)` — 빈 값·60자 초과를 막는다. `maxLength` 가 네이티브로도 자른다. `aria-invalid`+`aria-describedby` 짝 · `aria-required` 주입 | §4.1 공통 규칙 적용 | 상세가 도착하면 `reset(toValues(loaded))`(`useCrudForm.ts:131-134`)가 입력을 덮는다 — 충돌 다이얼로그의 '최신 내용 불러오기'가 의도적으로 이 경로를 쓴다 | 60자 상한. **카운터가 없다**(§7 #26) |
| FS-045-EL-022 | 등록 시 빈 문자열 | 수정 진입 시 비활성 | 저장 실패는 EL-020 | 3단 검증(비어 있지 않음 · 30자 이하 · 영문·숫자·하이픈). **중복 검사는 서버만**(§7 #15). `aria-invalid`+`aria-describedby` 짝 · `aria-required` 주입 | §4.1 공통 규칙 적용 | 다른 관리자가 같은 코드를 먼저 저장하면 **서버 409/422 로만 알 수 있다** | 30자 상한 |
| FS-045-EL-023 | N/A — 항상 값이 있다(기본 '전체 회원') | 수정 진입 시 비활성 | 저장 실패는 EL-020 | `z.enum(['all','member_grade','category','product'])`. `aria-required` 주입 | §4.1 공통 규칙 적용 | 조회 시점 값 | 선택지 4개 고정. **대상 지정 입력이 없다**(§7 #1) |
| FS-045-EL-024 | N/A — 항상 값이 있다(기본 '정액 할인') | 수정 진입 시 비활성 | 저장 실패는 EL-020 | `z.enum(['amount','percent','free_shipping'])`. `aria-required` 주입 | §4.1 공통 규칙 적용 | 조회 시점 값 | 선택지 3개. **값을 바꾸면 EL-025·EL-026 이 사라진다 — 그때 그 입력의 값은 남아 있고 저장 시 무료배송이면 0 으로 강제된다**(`:119`) |
| FS-045-EL-025 | **무료배송이면 렌더되지 않는다.** 등록 시 빈 문자열 | 수정 진입 시 비활성 | 저장 실패는 EL-020 | 무료배송이면 검사를 건너뛴다. 그 밖에는 정수 필수, 정률이면 1~100%. `aria-invalid`+`aria-describedby` 짝 · `aria-required` 주입 | §4.1 공통 규칙 적용 | 조회 시점 값 | **`maxLength` 가 없다** — 100자를 쳐도 입력이 멈추지 않고 검증만 막는다 |
| FS-045-EL-026 | **정률이 아니면 렌더되지 않는다.** 기본 '0' | 수정 진입 시 비활성 | 저장 실패는 EL-020 | **검증이 없다**(`z.string()`) — 어떤 문자열이든 통과하고 `toInput` 이 `Number(…) \|\| 0` 으로 삼킨다. `'abc'` → 0(상한 없음). **`aria-invalid`·`aria-describedby` 미배선**(§7 #17) | §4.1 공통 규칙 적용 | 조회 시점 값 | 상한 없음 |
| FS-045-EL-027 | 기본 '0' | 수정 진입 시 비활성 | 저장 실패는 EL-020 | `intString` — 빈 값·비정수를 막는다. **상한이 없다**(1조원도 통과). **`aria-invalid`·`aria-describedby` 미배선인데 오류는 렌더된다**(§7 #17) | §4.1 공통 규칙 적용 | 조회 시점 값 | 상한 없음 |
| FS-045-EL-028 | 기본 '0'(= 무제한) | 수정 진입 시 비활성 | 저장 실패는 EL-020 | `intString`. **상한이 없고, `issuedCount` 보다 작게 저장하는 것을 막지 않는다**(§7 #13). EL-027 과 같은 미배선(§7 #17) | §4.1 공통 규칙 적용 | 조회 시점 값 | 상한 없음 |
| FS-045-EL-029 | 등록 시 두 칸 빈 문자열 → '사용 기간을 YYYY-MM-DD 형식으로 입력하세요.' | 수정 진입 시 비활성 | 저장 실패는 EL-020 | 실재 날짜 + **종료 ≥ 시작**. 위반 시 `startAt`/`endAt` 중 하나에 오류가 붙고 **한 슬롯을 공유**해 표시된다(`:193`). `required`+`aria-required` 를 두 칸 각각에 자체 배선(`DateRangeField.tsx:48`) | §4.1 공통 규칙 적용 | 조회 시점 값 | **프리셋이 없다**(§7 #18). 네이티브 date picker 의 로케일·키보드는 브라우저 소관 |
| FS-045-EL-030 | N/A — 항상 값이 있다(기본 켜짐) | 수정 진입 시 비활성 | 저장 실패는 EL-020 | N/A — 이진 | §4.1 공통 규칙 적용 | 조회 시점 값 | N/A — 단일 토글 |
| FS-045-EL-031 | 쿠폰명이 비면 '쿠폰명', 기간이 비면 '사용 기간 미설정' | 로딩 중에도 렌더된다(빈 값 기준) | N/A — 순수 계산 | **검증 전 값을 그린다** — `toNum` 이 비숫자를 0 으로 삼켜(`:194`) 미리보기가 저장 결과와 다를 수 있다(§7 #19) | §4.1 공통 규칙 적용 | N/A — 로컬 파생 | 조건 줄은 최대 3항목 |
| FS-045-EL-032 | N/A — 항상 표시 | 저장 중 비활성 | N/A — 서버 호출 없음 | N/A — 입력 없음 | §4.1 공통 규칙 적용 | N/A | N/A — 단일 버튼 |
| FS-045-EL-033 | N/A — 항상 표시 | 요청 중 라벨이 '저장 중…' + 비활성. **DS `loading` 스피너가 아니다**(§7 #21) | 실패 시 EL-020 배너, 버튼 재활성, 이동 없음, 입력 보존 | 검증 실패 시 제출되지 않고 **첫 invalid 필드로 포커스가 간다**(`useCrudForm.ts:260`) | §4.1 공통 규칙 적용 — **쓰기 권한을 묻지 않는다**(§7 #4) | **동기 제출 락 + 멱등키가 있다**(EL-038) — 연타가 두 요청을 만들지 않고, 재시도는 같은 키를 재사용해 서버가 최초 응답을 재생한다 | 단건 저장 |
| FS-045-EL-034 | N/A — 충돌이 있어야 성립 | `busy={false}` — 이 다이얼로그에 서버 요청이 없다 | N/A — 표시 전용 | N/A — 입력 없음 | §4.1 공통 규칙 적용 | **이것이 경합 표현 자체다.** '최신 내용 불러오기' 는 입력을 버리고 재조회, '이어서 편집' 은 입력을 지킨다 | 1건 |
| FS-045-EL-035 | N/A — 변경이 있어야 성립 | 저장 중에는 가드가 비활성(`isDirty && !saving`) | N/A — 서버 호출 없음 | N/A — 입력 없음 | §4.1 공통 규칙 적용 | 저장 성공 후 `navigate(replace)` 는 가드를 거치지 않는다 — 저장했으므로 정상 | N/A — 표시 전용 |
| FS-045-EL-036 | N/A — 검증 규칙 | N/A — 동기 판정 | N/A — 서버 호출 없음 | **이것이 유효성 규칙 자체다** | §4.1 공통 규칙 적용 | N/A — 순수 판정 | 필드 8개 + 교차 검증 2건 |
| FS-045-EL-037 | N/A — 변환 규칙 | N/A — 동기 | N/A — 서버 호출 없음 | **`Number(… \|\| '0')` 가 비숫자를 `NaN` 이 아니라 0 으로 만들지 않는다** — `Number('abc')` 는 `NaN` 이다. 검증이 먼저 막으므로 정상 경로에서는 발생하지 않으나, 검증이 없는 `maxDiscount` 는 `NaN` 이 될 수 있다(§7 #17) | §4.1 공통 규칙 적용 | N/A — 순수 변환 | N/A |
| FS-045-EL-038 | N/A — 제출이 있어야 성립 | 이것이 중복 제출 방어 자체다 | 실패해도 키를 버리지 않는다 — **재시도가 같은 키를 재사용한다**(`useCrudForm.ts:220` 은 성공에서만 null 로) | 검증 실패 시 락을 푼다(`:246-248`) | §4.1 공통 규칙 적용 | **어댑터 원장이 같은 키의 재요청을 재생 처리한다**(`crud.ts:114,121`) — 적용에 **성공한 뒤에만** 기록해(`:56-60`) 실패한 첫 시도가 키를 태우지 않는다 | 단건 |
| FS-045-EL-039 | N/A — 성공이 있어야 성립 | N/A — 결과 통지 | N/A — 실패는 배너가 담당 | N/A — 입력 없음 | §4.1 공통 규칙 적용 | **abort 된 요청의 성공 콜백은 아무것도 하지 않는다**(`useCrudForm.ts:218`) | 1건 |
| FS-045-EL-040 | 등록 시 0 | 수정 진입 시 상세에서 채워진다 | N/A — 표시 없음 | `z.number()` — 어떤 수든 통과 | §4.1 공통 규칙 적용 | **조회 시점 값을 되돌려 보낸다** — 그 사이 발급이 나갔으면 **저장이 그것을 되돌린다**(BE-045 §7.2 lost update) | N/A — 단일 값 |
| FS-045-EL-041 | N/A — 항상 '전체 발급 기준' 이 있다 | 목록 로딩 중에도 조작 가능 | 조회 실패는 EL-012 | 손편집 URL 은 `parseFilter` 가 `'all'` 로 되돌린다 | §4.1 공통 규칙 적용 | 필터가 바뀌면 선택이 해제된다(`CouponListPage.tsx:154`) | 선택지 7개 고정 |
| FS-045-EL-042 | N/A — 항상 표시 | N/A — 즉시 이동 | 이동 실패 경로 없음 | N/A | **게이팅 없음(의도)** — 조회 전용이라 read 권한이면 충분하다 | N/A | 1개 |
| FS-045-EL-043 | N/A — 트리거는 항상 있다 | 스켈레톤이 대신한다 | N/A — 파생 문구 | 유니온이라 위반 값이 존재할 수 없다 | §4.1 공통 규칙 적용 | 조회 시점 값 | 문구 6종 |
| FS-045-EL-044 | 충돌 0건이면 **렌더되지 않는다** | 상품 저장소를 동기로 읽어 로딩이 없다 | **실패 상태가 없다** — react-query 밖이라 조회 실패를 표현할 자리가 없다(§7 #30) | N/A — 파생 | §4.1 공통 규칙 적용 | **상품이 바뀌어도 이 목록이 재조회되지 않는다** — 쿠폰 쿼리만 무효화된다(§7 #30) | 상품 수만큼 훑는다 |
| FS-045-EL-045 | N/A — 기본 `manual` | 수정 진입 시 비활성 | 저장 실패는 EL-020 | `z.enum` 6종 | §4.1 공통 규칙 적용 | 조회 시점 값 | 선택지 6개 고정 |
| FS-045-EL-046 | `tier_up` 이 아니면 **미렌더** | 위와 동일 | 위와 동일 | `z.enum(['normal','vip','vvip'])` — 위반 값 불가 | §4.1 공통 규칙 적용 | 위와 동일 | 3종 |
| FS-045-EL-047 | `birthday` 가 아니면 **미렌더**. 기본값 `'7'` | 위와 동일 | 위와 동일 | 0~60 정수. 초과·비정수·빈 값 거절. `aria-invalid`+`aria-describedby` 짝 | §4.1 공통 규칙 적용 | 위와 동일 | 상한 60 |
| FS-045-EL-048 | `download` 가 아니면 **미렌더**. 기본값 두 칸 빈 문자열 | 위와 동일 | 위와 동일 | 3단 검증(실재 날짜 → 종료≥시작 → **종료 ≤ 캠페인 종료일**). **두 칸이 오류 슬롯 하나를 공유한다** | §4.1 공통 규칙 적용 | 위와 동일 | 프리셋 없음 |
| FS-045-EL-049 | N/A — 항상 표시(발급 기준 카드 안) | N/A — 파생 | N/A | **검증 전 값도 그대로 요약한다** — 잘못된 일수여도 요약은 나온다 | §4.1 공통 규칙 적용 | N/A — 순수 | 1줄 |
| FS-045-EL-050 | `target === 'all'` 이면 **미렌더** | 카테고리일 때만 `loading` — 회원등급·상품은 즉시 | 카테고리 조회 실패 시 **선택지가 빈 채로 남는다**(전용 실패 표면 없음 — §7 #32) | 1개 이상 필수. `shouldValidate: true` 라 **고르는 즉시 오류가 사라진다** | §4.1 공통 규칙 적용 | 상품·카테고리가 지워지면 **끊어진 id 가 남는다**(§7 #33) | 선택지 수 제한 없음 |
| FS-045-EL-051 | N/A — 기본 `fixed` | 수정 진입 시 비활성 | 저장 실패는 EL-020 | `z.enum(['fixed','days_from_issue'])` | §4.1 공통 규칙 적용 | 조회 시점 값 | 2종 |
| FS-045-EL-052 | `fixed` 면 **미렌더**. 기본값 `'30'` | 위와 동일 | 위와 동일 | 1~365 정수. `aria-invalid`+`aria-describedby` 짝 | §4.1 공통 규칙 적용 | 위와 동일 | 상한 365 |
| FS-045-EL-053 | N/A — 기본 `false` | 위와 동일 | 위와 동일 | `z.boolean()` — 위반 값 불가 | §4.1 공통 규칙 적용 | 위와 동일 | 2상태 |
| FS-045-EL-054 | 충돌 0건이면 **미렌더** | N/A — 동기 파생 | **저장을 막지 않는다** — 경고로만 남는다 | N/A — 검증이 아니다 | §4.1 공통 규칙 적용 | 상품 설정이 바뀌어도 폼이 재조회하지 않는다(§7 #30) | 상품명을 **전부 나열한다** — 대상이 많으면 문장이 길어진다(§7 #31) |
| FS-045-EL-055 | 필터 기본값은 전부 '전체' | 이력·쿠폰 두 쿼리를 각각 기다린다 | 조회 실패는 `CrudReadListShell` 의 배너 | 손편집 URL 은 `parseFilter` 가 되돌린다 | **쓰기 게이팅 없음** — 조회 전용 화면이다 | 두 쿼리가 따로 갱신된다 | 쿠폰 수만큼 선택지 |
| FS-045-EL-056 | 이력이 0건이면 모든 행이 `0` · 사용률 `0%` | 이력 로딩 중에는 표가 비어 있다 | 조회 실패는 아래 이력 표의 배너와 **같은 쿼리**를 공유한다 | N/A — 표시 전용 | 위와 동일 | 쿠폰 목록과 이력이 **다른 쿼리**라 잠깐 어긋날 수 있다 | 쿠폰 수만큼 행 · 트리거 배지 최대 6개 |
| FS-045-EL-057 | 0행이면 `Empty`(검색·필터 맥락 3분기) | `CrudReadListShell` 의 스켈레톤 | 인라인 danger 배너 + '다시 시도' | N/A — 조회 전용 | **선택·삭제가 구조적으로 없다** — 감사 성격 | 이력은 append-only 가정 | 페이지네이션 없음 — 전량 렌더(§7 #34) |
| FS-045-EL-058 | 결제를 쓰면 잠금 요소가 전부 미렌더 | N/A — 동기 판정 | `readPaymentSettings` 는 모듈 스코프 변수라 실패하지 않는다 | N/A — 파생 불리언 | §4.1 공통 규칙 적용 | **설정이 바뀌어도 열려 있던 화면은 따라오지 않는다** — 재마운트가 필요하다(§7 #35) | 구획 1개(`coupon-admin`) |
| FS-045-EL-059 | N/A — 항상 표시 | N/A | N/A | N/A | 권한과 무관 | N/A | 1개 |
| FS-045-EL-060 | N/A — 타입 규칙 | N/A | N/A | **타입이 규칙이다** — 두 축이 갈라질 수 없다 | N/A | N/A | 6종 |


### 4.1 공통 예외 규칙

| 규칙 | 내용 |
|---|---|
| 네트워크 단절 | 목록 조회 실패는 인라인 배너(EL-012), 폼 상세 조회 실패는 화면 대체 배너(EL-019), 저장 실패는 폼 배너(EL-020), 토글 실패는 error 토스트(EL-009.10), 삭제 실패는 다이얼로그 안 배너(EL-013·EL-014). **오프라인 감지·복귀 재조회는 앱 전역에 없다**(`navigator.onLine` 0건) — §7 #27 |
| 세션 만료 | 조회·저장 어디서든 401 이 오면 **앱 전역 401 인터셉터**(`shared/query/queryClient.ts`)가 `notifySessionExpired()` 를 쏘고 `RequireAuth` 가 `/login?returnUrl=<현재경로>&reason=session_expired` 로 보낸다. **다만 미저장 입력은 그때 사라진다** — 프로그램적 이동이라 EL-035 가드가 발화하지 않는다 — §7 #27 |
| 요청 타임아웃 | 프론트 타임아웃 상한 없음(`AbortSignal.timeout` 앱 전역 0건). abort 는 언마운트·다이얼로그 닫기·토글 재실행에서만 발생한다 — §7 #27 |
| 중복 제출 | **폼 저장은 방어된다** — `submitLockRef` 동기 락 + 제출 시도 단위 멱등키(EL-038). **그러나 목록의 토글·삭제는 방어되지 않는다** — `useCrudRowUpdate.run`(`useCrudRowUpdate.ts:38-60`)과 `useCrudList` 의 삭제(`useCrudList.tsx:94-116,126-150`)는 키를 넘기지 않는다. 토글은 이전 요청을 abort 해 창을 좁히고(`:39`), 삭제는 확인 다이얼로그가 `busy` 로 잠근다 |
| 실패 통지의 자리 | ① 목록·폼 read 실패는 인라인 배너 ② 폼 저장 실패(5xx 등)는 폼 배너 + 참조 코드 ③ **422 는 그 입력의 인라인 오류** ④ **409/412 는 충돌 다이얼로그** ⑤ 삭제 실패는 그 다이얼로그 안 배너 ⑥ 토글 실패는 error 토스트 ⑦ 저장·삭제·토글 **성공**은 토스트 ⑧ abort 는 아무것도 띄우지 않는다 |
| 낙관적 업데이트 | **이 화면에 없다.** 토글도 비관적이다(`useCrudRowUpdate` 가 `onMutate`/`setQueryData` 를 쓰지 않는다) — 롤백 경로가 필요 없다 |
| 동시 조회 | 목록/상세 조회는 각각 동시에 1건만 유지된다(react-query). `staleTime` 30초 · 자동 재시도 없음 · 창 포커스 재조회 없음 |
| 권한 없음 | 라우트 read 권한은 AppShell 의 `RequirePermission` 이 `<Outlet>` 바깥에서 가드해 403 화면을 렌더한다(`AppShell.tsx:490-492`) — `/products/coupons/new` 같은 하위 라우트도 `findCoveringLeaf` 로 덮인다. **그러나 쓰기 게이팅(`useRouteWritePermissions`)이 이 화면에 배선돼 있지 않아** 쓰기 권한 없는 역할도 등록 버튼·토글·수정·삭제·일괄 삭제를 보고 누를 수 있다(§7 #4). **형제 화면 `products/items/ProductListPage.tsx:119` 와 `products/returns/ReturnDetailPage.tsx:110` 은 이미 배선했다** — 같은 섹션 안에서 계약이 갈린다. 서버 권한 응답은 조회=배너, 저장=배너, 토글=토스트로 떨어지며 권한 문구로 갈리지 않는다(§7 #25) |
| 렌더 예외 | AppShell 이 `<Outlet>` 바로 바깥에 `ErrorBoundary` 를 둔다(`AppShell.tsx:484-493`) — 화면이 던져도 사이드바·헤더가 남고 복구 화면이 뜬다 |
| 행 선택의 수명 | 필터·검색 변경 시 전건 해제(EL-015). 삭제 전건 성공 시 해제(`useCrudList.tsx:145`). **재조회로 행이 사라져도 그 선택은 남는다** — 페이지네이션이 없어 clamp 개념이 없다 |
| 상태 전이 규칙 | N/A — 쿠폰 상태(예정·진행중·만료·중지)는 **저장된 필드가 아니라 `enabled` + 기간에서 파생된 표시값**이다(`couponStatus` — `types.ts:98-106`). 전이가 없으므로 규칙도 없다 |

## 5. 서버 연동 지점

| 요소번호 | 이름 | 읽기/쓰기 | 필요 데이터 | 프론트 어댑터 (data-source.ts) | 비고 |
|---|---|---|---|---|---|
| FS-045-EL-005 / EL-007 / EL-009 / EL-012 | 쿠폰 목록 조회 | R | 쿠폰 전량(필터·검색·정렬·페이징 없이) | `couponAdapter.fetchAll(signal)` (`createCrudAdapter` — `crud.ts:94-98`) | 필터·검색·정렬이 **전부 클라이언트**다 |
| FS-045-EL-019 / EL-021~EL-030 (수정 진입) | 쿠폰 상세 조회 | R | 쿠폰 1건 | `couponAdapter.fetchOne(id, signal)` (`crud.ts:99-109`) → `useCrudItem`(`crud.ts:258-268`) | 없으면 **`HttpError(404)`** — 화면이 404/5xx 를 가른다 |
| FS-045-EL-033 (등록) / EL-039 | 쿠폰 등록 | W | `CouponInput` 전체 | `couponAdapter.create(input, { signal, idempotencyKey })` (`crud.ts:110-117`) | **멱등키가 전달된다**(EL-038) — 어댑터 원장이 재생 처리 |
| FS-045-EL-033 (수정) / EL-039 | 쿠폰 수정 | W | 쿠폰 id + `CouponInput` 전체 | `couponAdapter.update(id, input, { signal, idempotencyKey })` (`crud.ts:118-132`) | 전체 치환. 없는 id 면 **409**(유령 저장 방지 — `crud.ts:126-128`) → EL-034 |
| FS-045-EL-009.10 | 발급 상태 토글 | W | 쿠폰 id + `CouponInput` 전체(`enabled` 만 다름) | `couponAdapter.update(id, input, { signal })` — `useCrudRowUpdate.run`(`useCrudRowUpdate.ts:44-59`) | **멱등키를 넘기지 않는다.** 토글 하나를 위해 **전체 치환**을 보낸다(`{ ...toCouponInput(item), enabled: next }` — `:155`) — `issuedCount` 를 포함한 조회 시점 스냅샷을 되돌려 보낸다(BE-045 §7.2) |
| FS-045-EL-013 | 쿠폰 삭제(단건) | W | 쿠폰 id | `couponAdapter.remove(id, { signal })` (`crud.ts:133-145`) | **멱등키를 넘기지 않는다**(`crud.ts:330`). 이미 없으면 409 |
| FS-045-EL-014 | 쿠폰 삭제(일괄) | W | 쿠폰 id 배열 | `settleAll(ids, (id) => adapter.remove(id, { signal }))` (`crud.ts:349-350`) | **실패 건수만 돌려준다** — 실패 id 를 알 수 없다(§7 #8) |
| FS-045-EL-044 / EL-054 | 충돌 판정용 상품 조회 | R | 상품 전량(쿠폰 사용 설정 포함) | `conflictingProductsOf(coupon)` (`data-source.ts:355-361`) — 상품 저장소를 **동기로** 읽는다 | ⚠ **react-query 를 거치지 않는다.** 로딩·실패·무효화가 없고, 상품이 바뀌어도 이 화면이 다시 계산하지 않는다(§7 #30). 판정 자체는 상품 쪽 `productAllowsCoupon` 이 소유한다(§1.1 ④) |
| FS-045-EL-050 | 대상 선택기 — 카테고리 목록 조회 | R | 상품 카테고리 전량 | 상품 카테고리 쿼리(`categoriesQuery` — `CouponFormPage.tsx:665` 가 `isPending` 만 소비) | **회원등급은 상수**(`MEMBER_TIER_TARGETS`), **상품은 동기 저장소**라 이 셋 중 비동기는 카테고리 하나뿐이다 |
| FS-045-EL-055 / EL-056 | 발급 현황 — 쿠폰 목록 조회 | R | 쿠폰 전량(이름·기간·사용기간) | `fetchCouponsForIssuance(signal)` (`data-source.ts:343`) | `// TODO(backend): GET /api/coupons`(`:342`). 요약 표의 쿠폰명·만료일 계산이 이 응답을 쓴다 |
| FS-045-EL-055 / EL-056 / EL-057 | 발급 현황 — 발급 이력 조회 | R | `CouponIssuance` 전량 | `fetchCouponIssuances(signal)` (`data-source.ts:333`) → `useQuery({ queryKey: ['coupons','issuances'] })`(`CouponIssuanceListPage.tsx:121-122`) | `// TODO(backend): GET /api/coupons/issuances?couponId=&source=`(`:332`) — **심의 쿼리 파라미터를 화면이 쓰지 않는다.** 전량을 받아 클라이언트에서 거른다 |
| FS-045-EL-050 (상품 대상) | 대상 선택기 — 상품 목록 조회 | R | 상품 전량(id·이름) | 상품 저장소 동기 읽기 | 위 첫 행과 같은 한계다 — 백엔드가 붙으면 두 자리가 함께 비동기가 된다 |

> **현재 구현 상태 (백엔드 명세 참고)**: 백엔드는 없다. `couponAdapter` 는 공용 `createCrudAdapter`(`shared/crud/crud.ts:86-147`)에 `COUPON_SEED` 4건을 넣어 브라우저 안 mutable 배열에 400ms 지연(`LATENCY_MS`)과 개발용 실패 스위치(`failIfRequested('coupons', op)`)를 얹어 CRUD 를 흉내 낸다 — 실제 네트워크 0건. `fetchAll` 은 `sortCoupons` 로 시작일 내림차순 정렬한 전량, `fetchOne` 은 없으면 `HttpError(404, '항목을 찾을 수 없습니다.')`, `create`/`update`/`remove` 는 **멱등키 원장**(`createIdempotencyLedger` — `:62-72`)을 거쳐 같은 키의 재시도를 재생하고, `update`/`remove` 는 없는 id 에 **`HttpError(409)`** 를 던진다(`:126-128,139-141`). `build` 는 `cpn-<seq>` 로 채번한다(`data-source.ts:78-81`). 새로고침하면 시드로 되돌아간다. `data-source.ts:74` 의 `// TODO(backend): GET/POST /api/coupons · GET/PUT/DELETE /api/coupons/:id` 가 **이 화면의 유일한 연동 지점**이며 5개 CRUD 를 전부 덮는다. 위 표는 백엔드 연결 후 의도된 동작이다.

## 6. 자기 점검 (제출 전 확인)

- [x] 구현 소스를 전수 대조했다 — `CouponListPage` · `CouponFormPage` · `components/CouponCardPreview` · `data-source.ts` · `types.ts` · `validation.ts` · `coupons.test.ts` · 소비하는 공용 모듈(`shared/crud/{crud,CrudListShell,CrudTable,useCrudList,useCrudRowUpdate,useCrudForm,useListState,useDebouncedSearch,parseFilter,FormFeedback,dev}` · `packages/ui/{FormField,DateRangeField,Empty,RowActions,ToggleSwitch}`)
- [x] 보이지 않는 요소(스켈레톤·빈 상태·실패 배너·충돌 다이얼로그·이탈 가드·라이브 리전·URL 조회 상태 규칙·선택 수명 규칙·검증 규칙·값 변환 규칙·제출 잠금/멱등키 규칙·성공 토스트·`issuedCount` 보존 규칙)에 번호를 줬다
- [x] §4 예외 7축 빈칸 0건. 모든 `N/A` 에 사유
- [x] `[서버]` = O 요소가 §5 에 전부 요약됐다 — CRUD 5개 + 토글·일괄 삭제의 경로 차이를 명시했다
- [x] **쓰기 권한 게이팅이 이 화면에 없음을 코드로 확인**했다(`useRouteWritePermissions` grep — 이 디렉터리 0건, 형제 `products/items`·`products/returns` 는 있다) — §4.1·§7 #4
- [x] **`maxDiscount`·`minOrderAmount`·`totalQuantity` 세 입력이 `error` 를 그리면서 `aria-invalid`/`aria-describedby` 를 세우지 않음**을 코드로 확인했다(`:341-350,363-372,382-391` ↔ 형제 `:257-258,278-281,323-328`) — §7 #17
- [x] 엔드포인트·HTTP·에러코드·DB 스키마를 쓰지 않았다 (BE-045 영역)
- [x] §7 의 미결 항목이 BE-045 §7.9 후속 이관 · NFR-045 §5 와 일치한다 — **다만 v1.1 에서 늘어난 #28~#36 은 아직 어느 쪽에도 반영되지 않았다**(#36)

### 6.1 v1.1 개정 시 추가로 확인한 것

- [x] **트리거가 판별 유니온임을 코드로 확인**했다 — `CouponTrigger`(`types.ts:37-47`) 6종, 폼↔도메인의 유일한 문 `buildCouponTrigger`(`:126-140`), 되돌아오는 문 `toValues`(`CouponFormPage.tsx:192-202`), 조건부 검증(`validation.ts:118-166`). **말이 안 되는 조합이 타입상 불가능함**을 §1.1 ① 에 근거 주석과 함께 적었다
- [x] **`targetIds` 가 `target` 에 의미를 준다는 규칙을 양방향으로 확인**했다 — `all` 이면 저장 경로가 비우고(`CouponFormPage.tsx:172`), `all` 이 아니면 검증이 1개 이상을 요구한다(`validation.ts:167-180`)
- [x] **`days_from_issue` 가 캠페인 종료일에서 잘림을 확인**했다 — `couponExpiryFor`(`types.ts:296-303`)가 `shiftDays` 와 `endAt` 중 빠른 날을 준다. 같은 규칙이 다운로드 기간에도 검증으로 걸린다(`validation.ts:157-165`). **발급 이력의 만료일 열(EL-057)이 그 규칙이 눈에 보이는 유일한 자리**임을 명시했다
- [x] **상품↔쿠폰 충돌의 승자가 상품임을 코드로 확인**했다 — 판정의 정본은 쿠폰 쪽이 아니라 `products/_shared/store.ts:171-176` 의 `productAllowsCoupon` 이고, 그 이유(쿠폰=캠페인 / 쿠폰 불가=원가의 사실)가 `:166-169` 주석에 있다. 이 화면은 **드러내기만** 하고 계산을 뒤집지 않음을 §1.1 ④ 에 적었다
- [x] **발급 현황이 별도 FS 가 아니라 이 문서에 속함을 라우트로 확인**했다 — `/products/coupons/issuance` 는 사이드바 잎이 아니라 정적 하위 라우트이고(`App.tsx:323`) 권한이 `findCoveringLeaf` 로 `/products/coupons` 에 합류한다(`:321-322` 주석). specs/README §2 의 '화면 하나가 폴더 하나' 규약과 IA §1 의 '하위 라우트는 사이드바에 올리지 않는다' 를 함께 지킨다
- [x] **v1.0 미결 #1 이 실제로 해소됐음을 코드로 확인**하고 §7 에 해소 표시를 남겼다(번호는 결번으로 두지 않고 해소 기록으로 유지)

## 7. 미결 사항 (UI 기획 / 아키텍처 / 백엔드 명세 / 프론트 구현 이관)

| # | 내용 | 이관 대상 |
|---|---|---|
| 1 | ✅ **해소됨 (v1.1)** — 사용 대상이 유형만 고르고 대상을 지정할 입력이 없던 결함이 `targetIds`(`types.ts:177-183`) + `CouponTargetPicker`(EL-050)로 풀렸다. `target === 'all'` 이면 배열이 **항상 비고**(저장 경로가 강제 — `CouponFormPage.tsx:172`), `all` 이 아닌데 비면 **검증이 막는다**(`validation.ts:167-180`). 근거는 §1.1 ②. **잔여**: 참조 무결성이 없다(#33) | ~~아키텍처~~ → 해소 |
| 2 | **페이지네이션이 없다** — `CrudListShell` 이 `Pagination` 을 렌더하지 않는다(`<Pagination` grep: 앱 11파일 중 이 경로 0건). 쿠폰은 누적되며 `SeqCell seq={index + 1}`(`CrudTable.tsx:179`)도 도입 시 `startIndex + index + 1` 로 바뀌어야 한다(quality-bar IA-04 P0 · COMP-07 P2) | UI 기획 · 백엔드 명세 (BE-045 §7.6) |
| 3 | 폼이 **자체 `<h1>쿠폰 등록/수정</h1>`(`:235`) 를 그리고 AppHeader 도 `<h1>` 을 그린다** — `findCoveringLeaf` 덕에 AppHeader 는 잎 라벨 '쿠폰'을 옳게 보이지만, 결과적으로 **`<h1>` 이 2개**다. 목록은 in-content h1 이 없어 title 소스 모델이 화면 타입마다 모순이다(quality-bar IA-02 P0) | 프론트 구현 · UI 기획 |
| 4 | **쓰기 권한 게이팅이 배선돼 있지 않다** — `useRouteWritePermissions` 를 소비하지 않아 read 전용 역할도 '쿠폰 등록'(EL-003)·발급 토글(EL-009.10)·수정/삭제(EL-009.11)·일괄 삭제(EL-008)·제출(EL-033)을 본다. **같은 섹션의 `products/items/ProductListPage.tsx:119` 와 `products/returns/ReturnDetailPage.tsx:110` 은 이미 배선했다**(quality-bar EXC-03 P0) | UI 기획 쪽 변경 요청 |
| 5 | 이탈 가드(EL-035)가 **`navigate()` 프로그램 이동을 가로채지 못한다** — '목록으로'(EL-016)·'취소'(EL-032)를 누르면 미저장 입력이 조용히 사라진다 | UI 기획 쪽 변경 요청 |
| 6 | 스켈레톤 행 수가 하드코딩 `Array.from({ length: 5 })`(`CrudTable.tsx:144`)다 — 페이지네이션이 없어 'PAGE_SIZE 와 같음'을 만족시킬 기준값 자체가 없다(quality-bar COMP-06 P2) | UI 기획 (#2 와 함께) |
| 7 | 빈 상태(EL-011)의 **진짜 0건 분기에 생성 CTA 가 없다** — `CrudTable` 이 `empty.createAction` 을 받는데(`CrudTable.tsx:162`) 이 화면이 넘기지 않는다. '새로 추가하면 여기에 표시됩니다.' 라고만 하고 버튼은 툴바에만 있다(quality-bar STATE-05 P1) | UI 기획 쪽 변경 요청 |
| 8 | 일괄 삭제(EL-014)가 **실패 id 를 모른다** — `settleAll` 이 건수만 준다. 재시도가 전건을 재실행(성공분 재요청)하고, 임계값 초과 시 강화 확인·진행률·취소가 없으며 Shift-click 범위 선택도 없다(quality-bar EXC-10 · EXC-18 P1) | UI 기획 쪽 변경 요청 |
| 9 | 쿠폰명 셀이 **링크가 아니다** — 키보드 상세 도달 경로가 `RowActions` 의 연필 버튼(EL-009.11)뿐이다. `ReturnsListPage.tsx:240-246` 은 같은 자리에서 식별자를 `<Link>` 로 승격했다(quality-bar A11Y-08 P1 · COMP-08 P2) | UI 기획 쪽 변경 요청 |
| 10 | 쿠폰명 셀에 truncate 가 없어 긴 값이 표 열을 넓힌다. `ReviewListPage.tsx:78-84` 가 같은 문제를 `contentStyle` 로 풀었다(quality-bar COMP-09 P2) | UI 기획 쪽 변경 요청 |
| 11 | **'중지'와 '만료'가 같은 톤(neutral)** 이라(`types.ts:113-118`) 배지 색으로 구분되지 않는다 — 라벨을 읽어야 안다. 두 상태의 복구 수단이 다르다(중지는 토글, 만료는 기간 수정) | UI 기획 쪽 변경 요청 |
| 12 | **`issuedCount` 가 폼 값으로 왕복한다**(EL-040) — 화면이 조회 시점 스냅샷을 되돌려 보낸다. 그 사이 발급이 나갔으면 저장이 그것을 되돌린다 | 백엔드 명세 (BE-045 §7.2) · UI 기획 |
| 13 | **발급 수량(EL-028)을 `issuedCount` 보다 작게 저장하는 것을 막지 않는다** — 소진율이 100% 를 넘어야 하는데 `usageRate` 가 `Math.min(100, …)`(`types.ts:92`)로 깎아 **초과 발급을 숨긴다** | 아키텍처 (도메인) · 백엔드 명세 · UI 기획 |
| 14 | 대응 SCR 문서 부재 (상품 관리 SCR 미작성) | UI 기획 / 아키텍처 |
| 15 | **쿠폰 코드 중복 검사가 클라이언트에 없다** — 스키마가 형식만 본다(`validation.ts:32-40`). 서버 응답(409/422)으로만 알 수 있는데 그 경로가 검증되지 않았다 | 백엔드 명세 (BE-045 §7.3) · UI 기획 |
| 16 | **선택 상태가 두 벌 존재한다** — `useCrudList` 의 `useRowSelection`(`useCrudList.tsx:59`)과 `useListState` 의 `selectedIds`(`useListState.ts:186`). 이 화면은 전자만 쓰고 후자는 마운트만 된 채 방치된다 — `useListState` 의 '뷰 서명이 바뀌면 선택 해제'(`:205-213`)가 이 화면의 선택에 걸리지 않아 EL-015 가 그 일을 **손으로 다시 한다** | UI 기획 쪽 변경 요청 |
| 17 | **`maxDiscount`(EL-026)·`minOrderAmount`(EL-027)·`totalQuantity`(EL-028) 세 입력이 `error` 를 FormField 에 넘겨 `<p role="alert">` 를 그리면서도 자신에게 `aria-invalid`·`aria-describedby` 를 세우지 않는다** — 형제 필드(`coupon-name`·`coupon-code`·`coupon-discount-value`)는 세운다. 같은 파일 안에서 계약이 갈린다. `minOrderAmount`/`totalQuantity` 는 `intString` 이 실제로 오류를 내므로 이 경로는 실재한다. hint 도 `hintIdOf` 로 연결되지 않는다 — `settings/_shared/fields.tsx:22` 는 그 배선을 갖고 있다(quality-bar A11Y-11 P0) | UI 기획 쪽 변경 요청 |
| 18 | 사용 기간(EL-029)에 **프리셋('오늘/최근 7일/이번 달/지난 달')이 없다**(quality-bar COMP-11 P1) | UI 기획 쪽 변경 요청 |
| 19 | 미리보기(EL-031)가 **검증 전 값을 그린다** — `toNum` 이 `'1,000'` 의 콤마를 지워 1000 으로 보이게 하는데(`replace(/\D/g, '')`), 저장은 `Number('1,000'.trim() \|\| '0')` = `NaN` 이다(`:120`). 실제로는 스키마가 먼저 막지만 **미리보기와 검증이 다른 규칙을 쓴다** | UI 기획 쪽 변경 요청 |
| 20 | 미리보기의 꺼짐 표현이 `opacity: 0.55` **리터럴**이다(`CouponCardPreview.tsx:129`) — `ReviewPreview.tsx:139` 도 같은 값을 쓴다. quality-bar TOKEN-07 이 'coupon/review preview-disabled' 를 appliesTo 에 명시 지목한다(P1) | UI 기획 쪽 변경 요청 |
| 21 | 제출 버튼(EL-033)이 진행 상태를 **`loading` prop 이 아니라 손으로 쓴 '저장 중…' 라벨**로 표현한다(`:446`). 같은 섹션의 `ReturnDetailPage.tsx:355` 는 `loading={saving}` 을 쓴다(quality-bar COMP-01 P1) | UI 기획 쪽 변경 요청 |
| 22 | 사용기간 셀(EL-009.7)이 날짜 문자열을 **포맷 함수 없이 그대로** 잇는다 — 값이 'YYYY-MM-DD' 가 아니면 그대로 새어 나온다(quality-bar ERP-08 P2) | UI 기획 쪽 변경 요청 |
| 23 | **토글(EL-009.10) 실패가 409 를 error 토스트로 뭉갠다** — 폼은 충돌 다이얼로그를 갖는데(EL-034) 토글은 `useCrudRowUpdate` 를 쓰므로 그 경로가 없다. 같은 화면 안에서 같은 오류의 UX 가 갈린다 | UI 기획 쪽 변경 요청 |
| 24 | 토글을 여러 행에 잇달아 누르면 **이전 요청이 abort 된다**(`useCrudRowUpdate.ts:39` — controllerRef 가 1개다). 사용자는 두 행을 껐는데 하나만 반영될 수 있고, abort 는 실패로 통지되지 않아 **조용히 사라진다** | UI 기획 쪽 변경 요청 |
| 25 | 조회·저장·토글 실패가 **403/429/5xx 를 같은 문구로 뭉갠다.** `isForbidden`(`http-error.ts:93-95`)이 존재하는데 쓰지 않는다(quality-bar EXC-06 P1) | UI 기획 쪽 변경 요청 |
| 26 | 쿠폰명(EL-021)·코드(EL-022)에 **글자수 카운터가 없다** — `maxLength` 가 조용히 자른다. `TextareaField` 는 카운터를 갖는데 `<input>` 경로에는 없다(quality-bar COMP-12 P2) | UI 기획 쪽 변경 요청 |
| 27 | 프론트 타임아웃 상한 없음(`AbortSignal.timeout` 0건) · 오프라인 감지 없음(`navigator.onLine` 0건) · 세션 만료 리다이렉트가 미저장 입력을 버린다(가드 미발화) | UI 기획 · 프론트 구현 (quality-bar EXC-05 · EXC-11 · EXC-19 P1) |
| 28 | ⚠⚠ **트리거 6종을 실제로 도는 코드가 앱에 없다 — v1.1 최대 공백.** `CouponTrigger` 는 '언제 나가는가' 를 **선언**하지만, 가입·승급·첫 구매·생일을 감지해 발급을 만드는 스케줄러·이벤트 구독이 프론트에도 심에도 없다(`data-source.ts` 에 발급 생성 함수 0건). `isAutoIssued(trigger)`(`types.ts:109-111`)는 '자동/수동' 을 **표시하기 위해서만** 쓰인다. 즉 지금 화면은 **아무도 실행하지 않는 규칙을 정교하게 저장한다** — `CouponIssuance` 픽스처도 그 규칙과 무관하게 손으로 씌어 있다. FS-046(적립금 정책) §7 #1 과 정확히 같은 계열의 공백이다 | **아키텍처 (도메인 경계 — 선행) · 백엔드 명세 (BE-045)** |
| 29 | **버려질 칸은 검증하지 않는다** — `couponSchema` 가 고른 종류가 요구하는 칸만 보므로(`validation.ts:119`), 예컨대 `manual` 로 저장할 때 `triggerBirthdayDays` 에 `'999'` 가 남아 있어도 통과한다. `buildCouponTrigger` 가 그 값을 버리므로 **결과는 무해하다**. 다만 '검증을 통과한 폼 값' 과 '저장되는 도메인 값' 이 서로 다른 집합이라는 사실이 어디에도 적혀 있지 않아, 다음 사람이 폼 값을 그대로 신뢰할 위험이 남는다 | 명세 리뷰 (기록) · 프론트 구현 |
| 30 | ⚠ **충돌 판정이 react-query 밖에서 상품 저장소를 동기로 읽는다** — `conflictingProductsOf`(`data-source.ts:355-361`). 그래서 ① 로딩·실패 상태가 없고 ② **상품의 쿠폰 사용 설정을 바꿔도 이 화면이 다시 계산하지 않는다**(쿠폰 쿼리만 무효화된다) ③ 백엔드가 붙으면 이 자리가 비동기가 되어 목록 셀·폼 배너 **두 곳의 렌더 계약이 함께 바뀐다.** 지금은 픽스처가 같은 모듈에 있어 동작하는 것뿐이다 | **아키텍처 · 프론트 구현 · 백엔드 명세 (BE-045)** |
| 31 | **충돌 경고(EL-054)에 복구 경로가 문장뿐이다** — '상품의 쿠폰 사용 설정을 먼저 풀어 주세요' 라고 말하면서 **그 상품으로 가는 링크가 없다.** 대상이 많으면 상품명이 전부 나열돼 문장이 길어지고(잘림 규칙 없음), 운영자는 이름을 외워 상품 화면에서 다시 찾아야 한다. 목록의 경고 배지(EL-044)도 같다 — 건수만 말하고 어느 상품인지 말하지 않는다 | UI 기획 쪽 변경 요청 |
| 32 | **대상 선택기(EL-050)의 카테고리 조회 실패에 전용 표면이 없다** — `loading` 만 소비하고(`CouponFormPage.tsx:665`) `isError` 를 보지 않아, 실패하면 **선택지가 빈 채로 남는다.** 운영자는 '카테고리가 없다' 로 읽고 검증은 '한 개 이상 선택하세요' 를 요구한다 — 빠져나갈 수 없는 조합이다 | 프론트 구현 |
| 33 | **`targetIds` 에 참조 무결성이 없다** — 대상으로 지목한 상품·카테고리가 삭제돼도 id 가 그대로 남는다. 선택기는 없는 id 를 그리지 못하고, `conflictingProducts` 는 `Set` 조회라 조용히 지나간다. 즉 **끊어진 대상이 화면 어디에도 드러나지 않는다.** 견적↔문의의 끊어진 역링크(FS-050 §7 #11)와 같은 계열이며, 여기서는 **할인 적용 범위**가 걸려 있어 더 무겁다 | 아키텍처 (도메인) · 백엔드 명세 (BE-045) |
| 34 | **발급 이력(EL-057)에 페이지네이션이 없다** — 전량을 받아 클라이언트에서 거른다. 발급 이력은 쿠폰·상품과 달리 **회원 수 × 캠페인 수만큼 누적**되므로 이 목록 중 가장 먼저 한계에 닿는다. 심(`data-source.ts:332`)이 `?couponId=&source=` 를 예고하는데 **화면이 그 파라미터를 쓰지 않는다** — 서버 필터링 자리가 준비돼 있는데 클라이언트가 전량을 받는다(quality-bar ERP-15 P1) | UI 기획 · 백엔드 명세 (BE-045) |
| 35 | **PG 설정 변경이 열려 있는 화면에 전파되지 않는다** — `pgLock(readPaymentSettings(), …)`(`CouponListPage.tsx:126`)이 **렌더 시점의 모듈 스코프 변수**를 읽을 뿐 구독하지 않는다. 다른 탭·다른 화면에서 결제 설정을 바꿔도 이 화면은 재마운트 전까지 옛 판정을 쓴다. 엔타이틀먼트 축은 같은 문제를 크로스탭 구독으로 풀었다(`entitlement-store.ts:154-163`) — 두 축이 같은 성질인데 한쪽만 구독한다 | 아키텍처 · 프론트 구현 |
| 36 | **발급 현황(SEC-16~19)에 대응 SCR·BE 항목이 없다.** 이 문서가 FS-045 안에서 함께 기술하지만(§1 '발급 현황이 사이드바 잎이 아닌 이유'), BE-045 는 v1.0 시점 계약이라 `GET /api/coupons/issuances` 를 다루지 않는다. 그리고 **NFR-045 도 v1.0 기준**이라 이번에 늘어난 요소 20개(EL-041~060)가 품질 판정을 받지 않았다 | 백엔드 명세 (BE-045 개정) · 비기능 명세 (NFR-045 개정) |
