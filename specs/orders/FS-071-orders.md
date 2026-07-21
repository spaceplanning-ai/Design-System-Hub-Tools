---
id: FS-071
title: "주문 (목록·상세 처리)"
screen: SCR-071               # ⚠ 주문 관리 SCR 미작성 — §7 미결 사항 참조
route: /orders
owner: 기능 명세
reviewer: 명세 리뷰
gate: G9
status: draft
confirmedAt: 2026-07-22
version: 1.0
date: 2026-07-22
---

# FS-071. 주문 (목록·상세 처리)

## 1. 화면 개요

| 항목 | 내용 |
|---|---|
| 목적 | 고객의 결제로 만들어진 주문을 **상태별로 훑고**(좌측 필터의 건수) **여러 건을 골라 다음 단계로 옮기며**(일괄 상태 처리), 개별 주문에서 입금을 확인하고 상태를 진행하고 취소하고 처리 메모를 남긴다 |
| 역할(주 사용자) | 관리자 · `update` 권한이 없는 역할은 **조회만 가능하다** — 체크박스·일괄 처리 바·전이 버튼·메모 저장이 전부 사라진다(`OrderListPage.tsx:121,316,345` · `OrderDetailPage.tsx:152,370-374,519`) |
| 진입 경로 | 좌측 GNB > 주문 관리 > 주문 (`/orders` — `nav-config.ts:167-168`) |
| 포함 화면 | 목록 `/orders` · 상세 처리 `/orders/:id` (`App.tsx:307,313`). **`/orders/:id` 는 정적 잎(`/orders/shipments`·`/orders/claims`)보다 뒤에 등록된다**(`App.tsx:308` 주석) |
| **등록 폼이 없다 — 이 화면의 가장 큰 구조적 사실** | `/orders/new` 도 `/orders/:id/edit` 도 **라우트가 없다**(`App.tsx:306-313` 전수). 주문은 **고객의 결제가 만든다**(`data-source.ts:5` · `_shared/store.ts:3-5` · `OrderListPage.tsx:3-5`). 어댑터의 `build`(`data-source.ts:69-73`)는 `createCrudAdapter` 계약이 요구해 열어 둘 뿐 **호출부가 관리자 화면에 없다**(주석 `:68`). **삭제도 없다** — 주문은 거래 기록이라 지우지 않는다(`data-source.ts:4-5`) |
| **범위 밖** | **송장·발송처리** — 배송 처리 화면(FS-072 `/orders/shipments`)이 소유한다. 이 화면의 `shippedQuantity`(`shared/domain/order.ts:114`)는 그쪽 `applyShippedQuantities`(`shared/domain/shipment.ts:394`)의 **결과**이고 여기서는 읽기만 한다. **취소·교환·반품의 접수·심사·환불** — 클레임 화면(FS-044 `/orders/claims`)이 소유한다. 이 화면의 '주문 취소'는 **출고 전 주문에 취소 사실을 얹는 것**이고, 출고 후 되돌아오는 것은 반품이라 창구가 다르다(`shared/domain/order.ts:20-22,283-284`). **재고 차감 시점 설정** — 값은 `_shared/store.ts:31-57` 에 있으나 **그것을 바꾸는 화면이 앱에 없다**(§7 #1). **상품·SKU 재고의 정본** — 상품 저장소가 소유하고 주문은 `applyStockMovements`(`shared/domain/stock.ts:102`)로 요청만 한다 |
| 구현 경로 | `apps/admin/src/pages/orders/{OrderListPage.tsx(396행),OrderDetailPage.tsx(616행),types.ts(209행),validation.ts(49행),data-source.ts(99행),orders.test.ts(642행),components/OrderTable.tsx(194행),_shared/store.ts(930행)}` · **도메인** `apps/admin/src/shared/domain/order.ts(562행)` |
| 대응 SCR | SCR-071 (미작성 — §7 #12) |
| 공통 컴포넌트 | `shared/crud/{useListState,parseFilter,useCrudListQuery,useCrudItem,useCrudUpdate,createCrudAdapter}` · `shared/ui/{Alert,Button,Card,CardTitle,ConfirmDialog,FilterPanel,FilterRail,Modal,SearchField,SelectionBar,StatusBadge,TextareaField,Timeline,Icon,RowSelectCell,SelectAllHeaderCell,SeqCell,SeqHeaderCell,tableSelectionState,useToast,useUnsavedChangesDialog,pageTitleStyle,dlStyle,dtStyle,ddStyle,hintStyle,alertActionRowStyle,visuallyHiddenStyle}` · `@tds/ui{Table,Timeline,Empty,cssVar}` · `shared/crud/DetailCellLink` · `shared/permissions/useRouteWritePermissions` · `shared/errors/http-error{isNotFound,referenceOf}` · `shared/bulk(settleAllDetailed)` · `shared/async(isAbort)` · `shared/format{formatNumber,formatDateTime}` · `shared/commerce/payment-settings{PAYMENT_METHOD_LABEL,PAYMENT_SETTINGS_PATH,INQUIRY_PATH}` |

> **상태 어휘는 새로 짓지 않고 통계에서 승격했다.** 7개 상태 `pending\|preparing\|holding\|waiting\|shipping\|delivered\|confirmed`(`shared/domain/order.ts:37-38`)는 원래 `pages/stats/orders/types.ts` 에 있어 집계 행에만 쓰이던 카페24의 실제 주문 상태였고, **타입과 라벨을 도메인으로 올리고 통계가 재수출한다**(`order.ts:12-15`). 그래서 통계의 '배송준비중 12건' 과 이 목록의 건수가 같은 낱말을 쓴다. 회귀가 그 개수와 순서를 못 박는다(`orders.test.ts:629-642`).

> **규칙은 화면이 아니라 도메인이 소유한다.** 전이 가능 여부는 `orderTransitionBlock(order, to) → string \| null`(`order.ts:293-303`) 하나가 정하고, **버튼 목록**(`nextOrderStatuses` — `:313-317`)과 **저장의 거절**(`applyOrderStatus` 가 그 문자열을 `throw` — `:349-351`)이 **같은 함수**를 읽는다. 그래서 '눌리는데 거부당하는 버튼' 이 구조적으로 생기지 않는다(`order.ts:272-277` 주석). 회귀 `orders.test.ts:173`(`버튼(nextOrderStatuses)과 저장(applyOrderStatus)이 같은 술어를 읽는다`).

> **취소는 상태가 아니라 나란한 사실이다.** `canceledAt`·`cancelReason`(`order.ts:236-237`)이 상태 유니온 밖에 있고, 화면은 `isCanceled`(`pages/orders/types.ts:50-52`) 한 줄로 판정한다. 필터에서만 별도 항목 `ORDER_STATUS_CANCELED = 'canceled'`(`types.ts:22`)로 선다. 같은 유니온에 끼워 넣으면 '배송중이면서 취소 접수된' 주문을 담을 자리가 사라진다(`order.ts:17-22`).

> **금액은 저장하지 않는다.** 품목은 주문 시점의 `productName`·`optionLabel`·`unitPrice`·`pointRate`·`sku` 를 **스냅숏으로 복사해 들고**(`OrderLine` — `order.ts:96-117`), 합계는 `orderAmounts`(`:169-175`)가 매번 파생한다. 상품 가격을 고쳐도 지난 주문의 결제금액이 움직이지 않는다(`order.ts:24-29`). 결제도 같다 — `OrderPayment`(`:130-144`)가 `couponName` 까지 스냅숏으로 든다(`:138-139`).

## 2. 영역 구성

| 영역번호 | 이름 | 설명 |
|---|---|---|
| FS-071-SEC-01 | 목록 좌측 필터 레일 | `FilterRail` 안내문(2~3줄) + `FilterPanel` 주문 상태 필터 9항목(전체·7상태·취소)과 건수 배지 |
| FS-071-SEC-02 | 목록 라이브 리전 · 조회 요약 | 시각 숨김 `aria-live` 한 줄 + 건수 텍스트 |
| FS-071-SEC-03 | 목록 검색 툴바 | `SearchField` 하나뿐. **등록 버튼이 없다**(§1) |
| FS-071-SEC-04 | 선택 바 · 일괄 상태 처리 (비표시 기본) | 선택 1건 이상 + `canUpdate` 일 때만. 전이 버튼 4개 |
| FS-071-SEC-05 | 목록 표 | 선택·순번·주문번호·주문일시·주문자·상품·결제수단·결제금액·상태. **행 액션 열·페이지네이션이 없다** |
| FS-071-SEC-06 | 목록 조회 실패 배너 (비표시 기본) | 요약·선택바·표를 대체 |
| FS-071-SEC-07 | 일괄 전이 확인 다이얼로그 (비표시 기본) | 제외 건수와 사유를 함께 말한다 |
| FS-071-SEC-08 | 상세 헤더 | '목록으로' 버튼 + `<h1>주문 상세</h1>` |
| FS-071-SEC-09 | 상세 주문 요약·처리 카드 | 주문번호 + 상태/취소/부분배송 배지 · 저장 실패 배너 · 취소 배너 · 일시/입금/재고 dl · 전이·입금확인·취소 액션 |
| FS-071-SEC-10 | 상세 주문자·수령인 카드 | 주문자·이메일·회원 구분·수령인·배송지·요청사항 |
| FS-071-SEC-11 | 상세 주문 품목 카드 | 스냅숏 안내문 + 품목 표(7열) + 적립 예정액 |
| FS-071-SEC-12 | 상세 결제 정보 카드 | 결제수단·상품금액·배송비·할인·쿠폰·적립금·최종 결제금액 |
| FS-071-SEC-13 | 상세 처리 이력 카드 | `Timeline` — 추가만 되는 원장 |
| FS-071-SEC-14 | 상세 처리 메모 카드 | textarea + '메모 저장' |
| FS-071-SEC-15 | 상세 로딩·조회 실패 (비표시 기본) | 로딩 문구 / 404 vs 일반 분기 배너 |
| FS-071-SEC-16 | 진행 확인 다이얼로그 · 취소 모달 (비표시 기본) | 되돌릴 수 없는 조작 둘. 취소만 사유 입력이 있어 모달이다 |
| FS-071-SEC-17 | 미저장 이탈 가드 (비표시 기본) | 처리 메모 파기 확인 |

> **목록이 `CrudListShell` / `CrudReadListShell` 을 쓰지 않는다.** 이유가 코드에 적혀 있다(`components/OrderTable.tsx:4-13`): 읽기 전용 껍데기에는 **어떤 역할에게도** 체크박스가 없는데 이 화면의 핵심 동작이 '여러 건을 골라 상태를 옮기는 것'이고, 쓰기 껍데기의 체크박스는 **`canRemove`(일괄 삭제)에 묶여 있는데** 주문은 지우지 않는다. 그래서 **프리미티브(`RowSelectCell`·`SeqCell`·DS `Table`)는 그대로 쓰되 껍데기를 이 화면이 조립한다** — 선행 사례는 `LoginHistoryTable` 이다. 결과로 SEC-02·SEC-05·SEC-06 의 문구·구조가 셸의 것과 **글자까지 같되 소유자가 다르다**(§7 #9).

## 3. 요소 명세

| 요소번호 | 영역 | 이름 | 유형 | 동작 | [서버] | 비고 |
|---|---|---|---|---|---|---|
| FS-071-EL-001 | FS-071-SEC-01 | 레일 안내문 | 텍스트 | '주문은 고객의 결제로 만들어집니다. 이 화면에서는 상태를 진행하고 취소·메모를 남깁니다.'(`OrderListPage.tsx:252-254`) | — | **등록 버튼이 없는 이유를 사용자에게 말하는 유일한 문구다** |
| FS-071-EL-002 | FS-071-SEC-01 | 결제 미사용 안내문 | 텍스트 | `!canArrive` 일 때만 한 줄 더: '결제 설정이 꺼져 있어 새 주문이 들어오지 않습니다.' + `/settings/payment` · 상품 문의 링크(`:255-266`) | — | 비표시 기본. 판정은 `ordersCanArrive()`(`_shared/store.ts:65-67`) → `checkoutCta(readPaymentSettings(),'product').kind === 'purchase'`. **렌더 시점에 읽는다**(`OrderListPage.tsx:148`) — 조회 결과가 아니라 설정이다 |
| FS-071-EL-003 | FS-071-SEC-01 | 조회 전용 안내문 | 텍스트 | `!canUpdate` 일 때만: '상태를 바꿀 권한이 없어 조회만 가능합니다.'(`:267`) | — | 비표시 기본. **게이팅을 문구로도 알린다** — 사라진 버튼을 찾게 하지 않는다 |
| FS-071-EL-004 | FS-071-SEC-01 | 주문 상태 필터 | 입력 | `FilterPanel navLabel="주문 상태 필터" heading="주문 상태"`(`:271-280`). 항목 9개 = 전체 + `ORDER_STATUS_SEQUENCE` 7개 + 취소(`types.ts:38-42`). 골격은 `nav > h2 > ul > li > button[aria-pressed]`(`FilterPanel.tsx:6`). 선택 시 `list.setFilter('status', …)` → URL `?status=` | — | **상태 순서를 직접 나열하지 않고 도메인 배열에서 파생한다**(`types.ts:35-37,40`) — 한쪽만 고치면 같은 목록이 화면마다 다른 순서로 보인다 |
| FS-071-EL-005 | FS-071-SEC-01 | 필터 건수 배지 | 텍스트 | 항목마다 건수. **필터 이전 전체 집합에서** 센다(`countOrdersByStatus` — `types.ts:71-90`, 키를 다 적은 `Record`). 아직 못 셌으면 `null` → **`'—'`**(`OrderListPage.tsx:138-139` → `FilterPanel.tsx:33,153`) | O | **0 과 '모름' 을 가른다** — 로딩·실패를 0으로 위장하지 않는다. 회귀 `orders.test.ts:450`(`건수 배지는 모든 키를 갖는다`) |
| FS-071-EL-006 | FS-071-SEC-01 | 상태 필터 적용 규칙 | 텍스트 | `filterOrdersByStatus`(`types.ts:61-68`): '전체'는 취소까지 전부 · '취소'는 취소된 것만 · **상태 7종은 취소된 주문을 뺀다**(`:67`) | — | 비표시 규칙. 근거가 코드에 있다(`types.ts:56-59`): '배송준비중'을 고른 운영자가 보려는 것은 지금 준비해야 할 주문이고, **그 목록의 건수가 곧 할 일의 양**이어야 한다. 회귀 3건(`orders.test.ts:436,440,444`) |
| FS-071-EL-007 | FS-071-SEC-01 | 필터 값 정규화 규칙 | 텍스트 | `parseFilter(list.filters['status'] ?? 'all', ORDER_STATUS_FILTER_VALUES, 'all')`(`OrderListPage.tsx:125-129`) — 손으로 고친 `?status=거짓말` 은 '전체'로 되돌린다. 허용 목록은 필터 정의에서 파생한다(`types.ts:45-47`, 캐스팅 금지) | — | 비표시 규칙 |
| FS-071-EL-008 | FS-071-SEC-02 | 목록 라이브 리전 | 텍스트 | **항상 마운트된** `aria-live="polite" aria-atomic="true"` 시각 숨김 컨테이너(`OrderListPage.tsx:285-293`). 최초 로드 중 **침묵** · 실패 `주문 목록을 불러오지 못했습니다.` · 0행 `조건에 맞는 주문 결과가 없습니다.` · 그 밖 `주문 N건을 찾았습니다.` | — | 비표시. 문구가 `CrudReadListShell.tsx:80-82` 와 같으나 **이 화면이 자기 사본을 들고 있다**(§7 #9) |
| FS-071-EL-009 | FS-071-SEC-02 | 조회 요약 텍스트 | 텍스트 | 최초 로드 중 '불러오는 중…', 그 외 `전체 N건`. 재조회 중에는 **건수를 유지**하고 ' · 새로고침 중…' 만 덧붙인다. 선택이 있으면 ' · N건 선택됨'. `aria-busy={isFetching && !firstLoading}`(`:310-314`) | — | N 은 필터·검색 적용 후 건수(`visible` — `:141-144`) |
| FS-071-EL-010 | FS-071-SEC-03 | 검색 입력 | 입력 | `SearchField` 접근 이름 '주문번호·주문자·상품명 검색'(`:296-305`). `{...list.searchInputProps}` 스프레드로 **IME 조합 중 커밋 금지 + 조합 중 Enter 차단 + 디바운스**를 상속한다. 커밋된 값은 URL `?q=` | — | 필터링은 **클라이언트**(`searchOrders`) — 서버 재조회 없음 |
| FS-071-EL-011 | FS-071-SEC-03 | 검색 매칭 규칙 | 텍스트 | `searchOrders`(`types.ts:100-109`): 앞뒤 공백 제거·소문자화 후 **주문번호 · 주문자명 · 모든 품목의 상품명**에 부분 일치(OR) | — | 비표시 규칙. **품목 전부를 훑는다** — 첫 품목만 보면 두 번째 줄에 담긴 상품으로는 영영 검색되지 않는다(`types.ts:97-98`). 회귀 `orders.test.ts:462,469`. **수령인·송장번호는 대상이 아니다**(그쪽은 FS-072 의 검색이다) |
| FS-071-EL-012 | FS-071-SEC-03 | 조회 상태 URL 직렬화 규칙 | 텍스트 | 상태 필터·검색어의 **단일 원천이 URL 쿼리스트링**이다(`useListState` — `OrderListPage.tsx:123`). 기본값(`status=all` — `:71`)과 같은 값은 URL 에서 지운다. `replace: true` 갱신(`useListState.ts:125`)이라 history 가 쌓이지 않으면서 상세→Back 이 조건을 복원한다 | — | 비표시 규칙. **`page`·`sort` 는 소비되지 않는다**(§7 #6) |
| FS-071-EL-013 | FS-071-SEC-04 | 선택 바 | 영역 | `canUpdate` 일 때만 렌더된다(`:316`). `SelectionBar count={selectedCount} onClear={list.clearSelection}` | — | **선택은 `canUpdate` 에 묶인다 — `canRemove` 가 아니다**(`OrderTable.tsx:15-16`). 이 화면에서 선택이 하는 일은 상태 전이, 곧 **수정**이다 |
| FS-071-EL-014 | FS-071-SEC-04 | 일괄 전이 버튼 4개 | 버튼 | `BULK_TRANSITIONS = ['preparing','waiting','shipping','delivered']`(`types.ts:188-193`)마다 `<Button variant="secondary">배송준비중 처리 (12)</Button>`(`:319-335`). **괄호 안은 처리 가능한 건수**(`eligibleForTransition(selectedOrders, target).length` — `:320`). `disabled={count === 0 \|\| bulkBusy}`(`:326`) | O | **7개 상태를 전부 열지 않는다**: 입금전은 되돌아가는 방향이고, 구매확정은 고객의 의사이지 운영자가 무더기로 찍을 일이 아니다(`types.ts:183-186`). **건수를 미리 세어 글자에 싣는 것이 이 화면의 규약이다** — 30건을 골라 눌렀는데 28건이 조용히 거절당하지 않는다(`OrderListPage.tsx:7-10`). 회귀 `orders.test.ts:482` |
| FS-071-EL-015 | FS-071-SEC-05 | 주문 목록 표 | 표 | DS `Table`(`OrderTable.tsx:180-192`). 컬럼 7개 + 선행 열(선택·순번). caption 이 `selectable` 로 갈린다(`:182-186`): '체크박스로 여러 건을 골라 상태를 한 번에 처리할 수 있습니다.' vs '상태를 바꿀 권한이 없어 조회만 가능합니다.' `loading={firstLoading}` | O | **전량 렌더 — 페이지네이션이 없다**(§7 #6). 정렬은 고정(EL-024) |
| FS-071-EL-015.1 | FS-071-SEC-05 | 전체 선택 헤더 셀 | 입력 | `selectable` 일 때만. `SelectAllHeaderCell label="이 페이지의 주문 전체 선택" labelId="orders-select-all"`(`OrderTable.tsx:114-120` ← `OrderListPage.tsx:68,354`). `tableSelectionState(orders, selectedIds)`(`:109`)가 부분 선택 상태를 계산한다. 토글 범위는 **화면에 보이는 행뿐**(`OrderListPage.tsx:348-353`) | — | — |
| FS-071-EL-015.2 | FS-071-SEC-05 | 행 선택 셀 | 입력 | `RowSelectCell label={`${order.id} 주문 선택`}`(`OrderTable.tsx:156-164`) | — | **`selectable` 이 false 면 `selected` 도 넘기지 않는다**(`:176` 주석) — 없는 선택 조작을 있다고 낭독하지 않는다 |
| FS-071-EL-015.3 | FS-071-SEC-05 | 순번 셀 | 텍스트 | `SeqCell seq={index + 1}`(`OrderTable.tsx:168`) | — | 화면상 위치다. 페이지네이션 도입 시 공식이 틀어진다(§7 #6) |
| FS-071-EL-015.4 | FS-071-SEC-05 | 주문번호 셀 (상세 링크) | 링크 | `DetailCellLink to={/orders/<id>} ariaLabel={`${order.id} 주문 상세`}` + `tabular-nums`·`nowrap`(`OrderTable.tsx:134-136,57-60`) | — | **주문번호가 곧 id 다**(`order.ts:219-224`) — 고객이 전화로 부르는 번호와 관리자가 여는 URL 이 같은 값이라야 서로를 지목할 수 있다. 경로의 정본은 `detailPathOf`(`OrderListPage.tsx:74`). 회귀 `orders.test.ts:539`(`상세 경로는 한 곳에서만 만든다`) |
| FS-071-EL-015.5 | FS-071-SEC-05 | 주문일시 셀 | 텍스트 | `formatDateTime(order.orderedAt)`(`OrderTable.tsx:137`) | — | — |
| FS-071-EL-015.6 | FS-071-SEC-05 | 주문자 셀 | 텍스트 | `order.customer.name`(`:138`) | — | 인물·연락처는 전부 가상이다(`_shared/store.ts:17`) |
| FS-071-EL-015.7 | FS-071-SEC-05 | 상품 요약 셀 | 텍스트 | `orderLinesSummary`(`types.ts:160-165`) — '루미엔 경량 패딩 점퍼 외 2건'. `ellipsis` + `nowrap`, 최대 폭 고정(`OrderTable.tsx:63-69`) | — | 첫 품목만 쓰고 나머지를 건수로 접는다 — 열 하나에 상품명 다섯을 늘어놓으면 금액·상태 열이 화면 밖으로 나간다(`types.ts:156-158`). 품목 0건이면 '품목 없음'(`types.ts:162`) |
| FS-071-EL-015.8 | FS-071-SEC-05 | 결제수단 셀 | 텍스트 | `PAYMENT_METHOD_LABEL[order.payment.method]`(`OrderTable.tsx:142`) | — | 어휘의 정본은 `shared/commerce/payment-settings` 다(`order.ts:131`) |
| FS-071-EL-015.9 | FS-071-SEC-05 | 결제금액 셀 | 텍스트 | `${formatNumber(orderTotal(order))}원`(`OrderTable.tsx:143`), `align: 'end'`·`nowrap`(`:52`) | — | **저장된 값이 아니라 파생값이다** — `orderTotal`(`types.ts:175-177`)이 도메인 `orderAmounts` 를 그대로 부른다(화면은 더하지 않는다). **'원'이 숫자에 붙어 있어** 우측 정렬에서 단위가 마지막 자릿수를 따라다닌다 |
| FS-071-EL-015.10 | FS-071-SEC-05 | 상태 배지 열 (배지 2개) | 배지 | `StatusBadge tone={orderStatusTone(status)}`(`types.ts:127-139`): 입금전=warning · 배송준비중/배송대기/배송중=info · **배송보류=danger** · 배송완료=success · 구매확정=neutral. 그 옆에 **취소이면 danger '취소'**, 취소가 아니면서 부분배송이면 **warning '부분배송 1/3'**(`OrderTable.tsx:144-151`) | — | **취소는 상태 배지를 지우지 않고 옆에 선다**(`OrderTable.tsx:18-19`) — 취소는 상태가 아니다. 부분배송 문구는 `partialShipmentLabel`(`types.ts:168-172`) ← `shipmentProgress`(`order.ts:558-562`). **배송준비중·배송대기·배송중이 같은 info 톤이라** 색만으로는 구분되지 않는다(§7 #10) |
| FS-071-EL-015.11 | FS-071-SEC-05 | 취소 행 색조 | 텍스트 | 취소된 행에 `tone: 'danger'`(`OrderTable.tsx:174`) | — | 비표시 규칙. **색만으로 말하지 않는다** — 뜻은 상태 칸의 '취소' 배지가 전한다(주석 `:173`) |
| FS-071-EL-015.12 | FS-071-SEC-05 | 행 전체 클릭 이동 | 텍스트 | `onActivate: () => navigate(detailPath)`(`OrderTable.tsx:170-172`) | — | 비표시 규칙. **행 클릭은 마우스 보조 수단이고 키보드 사용자는 주문번호 링크로 닿는다**(`:105-107`) — DS `Table` 의 가드가 `<a>` 내부 클릭을 행 활성화에서 제외한다. **행 액션(연필·휴지통)이 없다** — 수정 폼도 삭제도 없다(§1) |
| FS-071-EL-016 | FS-071-SEC-05 | 목록 로딩 스켈레톤 | 스켈레톤 | **최초 로드에서만**(`firstLoading = isFetching && data === undefined` — `OrderListPage.tsx:133`) DS `Table` 의 `loading` 이 표 본문을 대체한다 | — | 비표시. **재조회 중에는 이전 행이 유지된다**(`useCrudListQuery` 의 `placeholderData: (previous) => previous` — `crud.ts:298`). STATE-01 |
| FS-071-EL-017 | FS-071-SEC-05 | 빈 상태 (4분기) | 빈상태 | **이 화면에는 분기가 넷이다**(`OrderListPage.tsx:218-245`). ① **결제 미사용**(`!canArrive && !hasQuery && !hasActiveFilters`) → info `Alert`: '현재 결제를 사용하지 않아 주문이 들어오지 않습니다… 고객의 글은 상품 문의로 접수됩니다.' + '결제 설정 열기' + **'상품 문의 열기'**(`:220-235`). ② 검색어 → '검색 지우기' ③ 필터 → '필터 초기화' ④ 진짜 없음 — ②③④는 공유 `Empty label="주문" createVerb="접수"`(`:237-244`) | — | 비표시. **①이 이 화면의 고유 축이다**: '오늘 주문이 0건' 과 '주문이 들어올 통로 자체가 없다' 는 **구조적으로 다른 사실**이고 갈 곳도 다르다(`OrderListPage.tsx:12-14`). `createVerb="접수"` 라 ④의 문구가 '등록'을 권하지 않는다 |
| FS-071-EL-018 | FS-071-SEC-06 | 목록 조회 실패 배너 | 배너 | 조회 실패 시 요약·선택바·표를 대체하는 위험 톤 `Alert` '주문 목록을 불러오지 못했습니다.' + '다시 시도'(`refetch`)(`OrderListPage.tsx:359-373`) | O | 비표시. **404/403/5xx 를 구분하지 않는다**(§7 #11). 좌측 필터 레일은 남는다(그리드 밖이다) |
| FS-071-EL-019 | FS-071-SEC-07 | 일괄 전이 확인 다이얼로그 | 모달 | `ConfirmDialog intent="update"`(`:378-393`). 제목 `<상태> 일괄 처리`. 문구가 **두 갈래**: 전건 적격이면 '선택한 주문 N건을 …(으)로 진행합니다. 주문 상태는 되돌릴 수 없습니다.', 아니면 '선택한 N건 중 M건만 … 나머지 K건은 이미 지난 단계이거나, 취소되었거나, `ORDER_TRANSITION_UNPAID`'(`:382-386`). 확인 라벨 `M건 처리`. `busy={bulkBusy}` | O | **`intent='update'` 인 이유가 코드에 있다**(`:376-377`): 이것은 삭제가 아니라 '진행'이다. **제외되는 건수와 그 이유를 함께 말하는 것이 이 다이얼로그의 존재 이유다.** 사유 문자열을 도메인 상수에서 그대로 가져온다(`order.ts:282`) — 화면이 지어내지 않는다 |
| FS-071-EL-020 | FS-071-SEC-07 | 일괄 전이 실행 | 텍스트 | `runBulk`(`:176-214`): `applyOrderStatus(order, to, at, '운영자')` 로 **다음 주문을 만들고** `toOrderInput` 으로 저장한다(`:189`). `settleAllDetailed`(`shared/bulk.ts:40`)가 전건을 시도하고 **부분 실패를 건수로** 보고한다. 전건 성공 → 토스트 `N건을 <상태>(으)로 처리했습니다.` + `clearSelection()` + 닫기(`:196-202`). 실패가 남으면 **다이얼로그를 닫지 않고** `M건을 처리하지 못했습니다…` 배너(`:204-207`) | O | 비표시 규칙. `at` 을 루프 **밖에서 한 번** 만든다(`:179`) — 같은 배치의 이력이 같은 시각을 갖는다. **어느 주문이 실패했는지는 말하지 않는다**(§7 #7). **멱등키가 실리지 않는다**(`grep idempotencyKey pages/orders` = 0건 — §7 #4) |
| FS-071-EL-021 | FS-071-SEC-04 | 일괄 처리 취소·abort 규칙 | 텍스트 | `closeBulk`(`:170-174`)가 `controllerRef.current?.abort()` 후 상태를 지운다. `.then` 은 `controller.signal.aborted` 면 즉시 return(`:194`), `.catch` 는 `isAbort(cause)` 면 무시(`:210`) | — | 비표시 규칙. **abort 는 실패로 통지되지 않는다** |
| FS-071-EL-022 | FS-071-SEC-04 | 선택 해제 규칙 | 텍스트 | **필터·검색어가 바뀌면 선택이 자동으로 지워진다** — `useListState` 의 `viewSignature`(`useListState.ts:207-213`)가 `page\|keyword\|sort\|filters` 를 서명으로 삼아 실제로 바뀔 때만 `setSelectedIds(new Set())` 한다 | — | 비표시 규칙. **이 화면은 `useCrudList` 가 아니라 `useListState` 의 선택 집합을 직접 쓰므로**(`OrderListPage.tsx:123,159,347`) 그 해제가 **실제로 닿는다** — FS-050(견적)이 놓친 STATE-04 결함이 여기서는 발현되지 않는다 |
| FS-071-EL-023 | FS-071-SEC-04 | 일괄 대상 판정 규칙 | 텍스트 | `eligibleForTransition(orders, to)`(`types.ts:207-209`) = `orders.filter(order => canTransitionOrder(order, to))`. `selectedOrders` 는 **`visible` 안에서만** 고른다(`OrderListPage.tsx:158-161`) | — | 비표시 규칙. **버튼의 활성 조건과 저장의 허용 조건이 같은 술어를 읽는다**(`types.ts:202-205`) |
| FS-071-EL-024 | FS-071-SEC-05 | 정렬 규칙 | 텍스트 | `sortOrders`(`types.ts:112-117`) — **주문 일시 내림차순**(최근이 위), 같은 시각은 주문번호로 안정 정렬. 어댑터가 `sort` 로 물고 있어 쓰기 직후에도 다시 적용된다(`data-source.ts:75`) | — | 비표시 규칙. **정렬 변경 UI 가 없다** — 금액 순·상태 순으로 훑을 수 없다(§7 #6). 회귀 `orders.test.ts:478` |
| FS-071-EL-025 | FS-071-SEC-05 | 필터·검색 결합 규칙 | 텍스트 | `searchOrders(filterOrdersByStatus(items, status), list.keyword)`(`OrderListPage.tsx:141-144`) — 상태로 먼저 좁히고 그 결과에 검색어를 건다. `useMemo` | — | 비표시 규칙 |
| FS-071-EL-026 | FS-071-SEC-08 | '목록으로' 버튼 | 버튼 | 상세 좌상단. `<button>` + `Icon name="chevron-left"` + '목록으로'(`OrderDetailPage.tsx:308-316`). `navigate('/orders')` | — | **`navigate()` 라 이탈 가드(EL-046)가 가로채지 못한다**(§7 #8) |
| FS-071-EL-027 | FS-071-SEC-08 | 상세 화면 제목 | 텍스트 | `<h1 style={pageTitleStyle}>주문 상세</h1>`(`:319`) | — | **AppHeader 의 `<h1>`(`AppHeader.tsx:56` `findNavLabel(pathname)`)과 중복된다** — 그 자리는 '주문'을 보인다. h1 2개(§7 #2) |
| FS-071-EL-028 | FS-071-SEC-09 | 주문번호 + 배지 줄 | 텍스트 | `CardTitle` 안에 `order.id` + 배지들(`:322-333`): 상태 배지 · 취소이면 danger '취소' · 취소가 아니면서 부분배송이면 warning '부분배송 N/M' | — | 목록의 상태 칸(EL-015.10)과 **같은 규칙**이다 |
| FS-071-EL-029 | FS-071-SEC-09 | 저장 실패 배너 | 배너 | 위험 톤 `Alert` '저장하지 못했습니다. 잠시 후 다시 시도해 주세요.' + `errorReference !== null` 이면 '오류 코드 …'(`:335-342`). `referenceOf(cause)`(`http-error.ts`)에서 온다. 재저장 시 먼저 지운다(`:186-187`) | O | 비표시. **참조 코드가 있다** — 단일 문서형 화면들(FS-046 §7 #9)과 갈리는 지점이다. 다만 **400/403/409/422/500 을 한 문구로 뭉갠다**(§7 #11). 전이 술어가 던진 사유도 이 자리에 그대로 실린다(`:228,247`) |
| FS-071-EL-030 | FS-071-SEC-09 | 취소 사실 배너 | 배너 | 취소된 주문에만 경고 톤 `Alert`: `<취소일시>에 취소된 주문입니다. 사유: <cancelReason>`(`:344-348`) | — | 비표시 |
| FS-071-EL-031 | FS-071-SEC-09 | 주문 요약 dl | 텍스트 | `주문일시` · `입금·결제`(미확인 / 시각) · **`재고 차감`** · 복원됐으면 `재고 복원`(`:350-368`) | — | **재고 차감 줄이 지금 규칙과 실제 결과를 나란히 말한다**(주석 `:356`): 미차감이면 `아직 차감되지 않았습니다 (설정: 입금 확인 시)`, 차감됐으면 `<시각> 차감 (설정: …)`(`:357-361`). 설정값은 `STOCK_DEDUCT_LABEL[readStockDeductAt()]`(`order.ts:405-408` · `_shared/store.ts:40-42`) — **읽기만 한다**(§7 #1) |
| FS-071-EL-032 | FS-071-SEC-09 | 조회 전용 안내 | 배너 | `!canUpdate` 이면 info `Alert` '이 주문을 처리할 권한이 없습니다. 조회만 가능합니다.'(`:370-372`) | — | 비표시. 그 아래 액션 블록 전체가 렌더되지 않는다(`:374`) |
| FS-071-EL-033 | FS-071-SEC-09 | '입금 확인' 버튼 | 버튼 | `unpaid && !canceled` 일 때만 primary(`:377-386`). 클릭 시 `pending = {kind:'paid'}` → EL-042 확인 창 | O | `unpaid = order.payment.paidAt === ''`(`:302`). **입금 확인은 두 가지를 동시에 푼다**: `pending` 을 벗어날 전제이자(`order.ts:301`), 차감 시점이 `'payment'` 일 때의 재고 차감 방아쇠다(`order.ts:449`). `applyOrderPaid`(`order.ts:365-378`)는 **이미 확인된 주문에 아무 일도 하지 않는다**(`:367` — 이력이 늘지 않는다. 회귀 `orders.test.ts:189`) |
| FS-071-EL-034 | FS-071-SEC-09 | 상태 전이 버튼들 | 버튼 | `nextOrderStatuses(order)`(`order.ts:313-317`)가 준 목록을 그대로 버튼으로 그린다(`:387-398`). 라벨 `<상태> 처리`. **첫 버튼만 primary**(`index === 0 && !unpaid` — `:391`) — 바로 다음 단계가 기본 동작이고 나머지는 건너뛰는 예외 경로다. `disabled={saving}` | O | **갈 수 없는 단계는 버튼이 아예 없다** — 비활성 버튼을 세우지 않는다(`OrderDetailPage.tsx:6-8`). 입금 확인 전에는 `ORDER_TRANSITION_UNPAID` 때문에 목록이 비고(`order.ts:301`), 확인되면 **뒤 단계 전부가 한꺼번에 열린다**(회귀 `orders.test.ts:149`) — 그래서 '배송완료'로 바로 건너뛸 수 있다(§7 #5) |
| FS-071-EL-035 | FS-071-SEC-09 | 다음 단계 없음 사유 | 텍스트 | `nextStatuses.length === 0` 이면 `orderTransitionBlock(order,'confirmed')` 의 문장을 그대로 쓴다(`:304,399`) — '취소된 주문은 상태를 바꿀 수 없습니다.' / '구매확정된 주문은 더 이상 진행할 단계가 없습니다.' / '입금이 확인되지 않아 배송 단계로 넘길 수 없습니다.' | — | 비표시. **화면이 사유를 지어내지 않는다**(`:303` 주석) |
| FS-071-EL-036 | FS-071-SEC-09 | '주문 취소' 버튼 / 취소 불가 사유 | 버튼 | `orderCancelBlock(order)`(`order.ts:320-325`)가 null 이면 danger '주문 취소'(`:403-411`), 아니면 **비활성 버튼 대신 그 사유 문장**을 둔다(`:412-415`): `ORDER_CANCEL_DONE`('이미 취소된 주문입니다.') 또는 `ORDER_CANCEL_SHIPPED`('배송이 시작된 주문은 취소할 수 없습니다. 교환/반품으로 접수해 주세요.') | O | **없는 버튼을 찾게 하지 않는다**(주석 `:413`). 취소·반품을 가르는 선은 `hasLeftWarehouse`(`order.ts:84-86`)이고 **클레임의 취소 가드가 같은 함수를 읽는다**(`claims/types.ts:256`) — 두 화면이 같은 답을 한다. 회귀 `orders.test.ts:199,205` |
| FS-071-EL-037 | FS-071-SEC-10 | 주문자·수령인 dl | 텍스트 | 주문자(`이름 · 전화`) · 이메일 · **회원 구분**(`memberId === '' ? '비회원 주문' : '회원 주문'`) · 수령인 · 배송지(`(우편번호) 주소 상세`) · 요청사항(없으면 '없음')(`:423-438`) | — | **회원 구분이 환불의 전제다** — 비회원 주문은 적립금 원장이 없어 클레임의 환불완료가 막힌다(`claims/refund.ts:209`). **다만 이 화면에서 회원 상세로 가는 링크가 없다**(§7 #3) |
| FS-071-EL-038 | FS-071-SEC-11 | 스냅숏 안내문 | 텍스트 | '상품명·옵션·단가는 주문 시점에 복사된 값입니다. 상품을 수정해도 지난 주문의 금액은 바뀌지 않습니다.'(`:444-447`) | — | **도메인의 가장 중요한 판단을 사용자에게 말하는 유일한 문구다**(`order.ts:24-29`) |
| FS-071-EL-039 | FS-071-SEC-11 | 주문 품목 표 | 표 | DS `Table` 7열 `상품·옵션·SKU·수량·출고·단가·금액`(`:126-134,448-466`). 금액은 `lineAmount(line)`(`order.ts:120-122`). caption '주문 품목 — 주문 시점의 상품명·옵션·단가와 수량별 금액입니다.' `empty="주문 품목이 없습니다."` | — | **'출고' 열이 부분배송을 드러낸다** — `shippedQuantity < quantity` 인 행에 `tone: 'warning'`(`:462-463`). 그 값의 정본은 배송 화면의 `applyShippedQuantities`(`shipment.ts:394-400`)이고 **이 화면은 세지 않는다**. `productId` 가 있는데 **상품 상세로 가는 링크가 없다**(§7 #3) |
| FS-071-EL-040 | FS-071-SEC-11 | 적립 예정액 | 텍스트 | `적립 예정 N원 — 주문 시점의 적립률로 계산합니다.`(`:467-469`). 품목별 `linePoint`(`order.ts:125-127`)의 합 — **원 단위 미만은 버린다**(`Math.floor`) | — | **`orderAmounts(order).point` 와 같은 값을 화면이 다시 계산한다**(`order.ts:171` ↔ `OrderDetailPage.tsx:468`) — 규칙 6('화면이 더하지 않는다')을 이 한 줄이 비켜 간다(§7 #13) |
| FS-071-EL-041 | FS-071-SEC-12 | 결제 정보 dl | 텍스트 | 결제수단 · 상품금액 · **배송비(0이면 '무료')** · 할인 · **쿠폰 할인(`couponName` 이 있으면 괄호에 이름)** · 적립금 사용 · **최종 결제금액(굵게)**(`:474-495`). 값은 전부 `orderAmounts(order)`(`:297`)에서 온다 | — | 금액 계산의 **유일한 자리**는 `orderAmounts`(`order.ts:169-175`)다 — 총액은 `Math.max(0, …)` 라 0 아래로 내려가지 않는다(회귀 `orders.test.ts:246`). **`couponName` 이 스냅숏이라 쿠폰이 삭제돼도 주문서는 이름을 말한다**(`order.ts:138-139`). 다만 **쿠폰 상세로 가는 링크는 없다** |
| FS-071-EL-042 | FS-071-SEC-13 | 처리 이력 Timeline | 표시 | DS `Timeline`(`:500-504`). `toTimelineEvents`(`:137-146`)가 `OrderEvent` → `TimelineEvent` 로 옮긴다. 배지 색은 `orderEventTone`(`types.ts:141-152`): order=neutral · payment=success · status=info · **stock=warning** · cancel=danger · note=neutral. `emptyLabel='기록된 처리 이력이 없습니다.'` | — | **추가만 되는 원장이다** — 지우지 않는다(`order.ts:205`). 이력은 상태와 **한 함수에서 함께** 움직인다(`withEvent` — `order.ts:340-343`): 둘이 갈라지면 '배송중인데 이력에는 없는' 주문이 생긴다(회귀 `orders.test.ts:182`). id 에 시각과 종류를 함께 넣어 같은 밀리초 충돌을 막는다(`order.ts:341`) |
| FS-071-EL-043 | FS-071-SEC-14 | 처리 메모 입력 | 입력 | `TextareaField label="처리 메모" rows={4} maxLength={ORDER_NOTE_MAX}`(=500 — `order.ts:250`), placeholder '배송 지연 사유, 고객 통화 내용 등 처리 내역을 기록하세요.', `disabled={saving \|\| !canUpdate}`(`:509-518`). 오류는 `orderNoteError(note)`(`validation.ts:39-43`) | O | 상세가 로드되면 `useEffect` 가 `setNote(order.adminNote)`(`:171-174`). **`maxLength` 와 스키마가 이중으로 막는다** — 네이티브가 먼저 잘라 스키마 오류는 사실상 도달 불가 |
| FS-071-EL-044 | FS-071-SEC-14 | '메모 저장' 버튼 | 버튼 | `canUpdate` 일 때만(`:519`). `loading={saving}` · `disabled={saving \|\| !noteDirty \|\| noteFieldError !== null}`(`:521-527`). `saveNote`(`:251-254`)가 `{...order, adminNote: note.trim()}` 을 저장 | O | **되돌릴 수 있는 저장이라 확인을 묻지 않는다**(`OrderDetailPage.tsx:10-12`) — 되돌릴 수 있는 일에까지 확인을 붙이면 정작 중요한 확인이 무시된다. `loading` prop 을 실제로 쓴다(FS-046 §7 #10 과 갈리는 지점) |
| FS-071-EL-045 | FS-071-SEC-16 | 진행 확인 다이얼로그 | 모달 | `pending !== null` 일 때(`:536-554`). `ConfirmDialog intent="update"`. **입금 확인**: '입금을 확인 처리합니다. 재고 차감 시점이 `입금 확인 시`이면 이 시점에 재고가 빠지며, 되돌릴 수 없습니다.' / **상태 전이**: '주문 `<id>`을(를) `<상태>`(으)로 진행합니다. 주문 상태는 되돌릴 수 없습니다.' `busy={saving}` · `error={serverError}` | O | **되돌릴 수 없는 것에만 확인을 묻는다**(`:10-12`). 실패해도 다이얼로그를 닫지 않는다 — 재클릭이 곧 재시도다(`:534-535`). 취소(onCancel)가 진행 중 요청을 abort 한다(`:549-552`) |
| FS-071-EL-046 | FS-071-SEC-16 | 주문 취소 모달 | 모달 | `Modal title="주문 취소"` + `Icon name="x-circle"`(`:558-611`). 본문 '주문 `<id>`을(를) 취소합니다. 취소는 되돌릴 수 없으며, **이미 차감된 재고는 자동으로 복원됩니다.**'(`:593-595`) + 저장 실패 `Alert` + 취소 사유 `TextareaField`(`maxLength=200` — `order.ts:251`, rows 3). footer '닫기' / danger '주문 취소' | O | **확인 다이얼로그가 아니라 모달인 이유가 코드에 있다**(`:556-557`): 사유를 받아야 하고, **사유 없는 취소는 '왜 취소됐나' 에 답할 수 없는 기록이다**(`validation.ts:11-12`). 오류는 `cancelTouched` 이후에만 보인다(`:605-608`) — 치는 도중 붉게 물들이지 않는다 |
| FS-071-EL-047 | FS-071-SEC-16 | 취소 사유 검증 | 텍스트 | `orderCancelReasonError`(`validation.ts:45-49`) ← `orderCancelSchema`(`:25-32`, `zod/mini`): 공백만이면 '취소 사유를 입력하세요.', 200자 초과면 '취소 사유는 200자를 넘을 수 없습니다.' `runCancel` 이 먼저 `setCancelTouched(true)` 하고 오류가 있으면 **저장하지 않고 반환**한다(`:234-235`) | — | 비표시 규칙. **검증의 정본은 zod 스키마다**(`validation.ts:3`). 회귀 `orders.test.ts:492,497`. **RHF 를 얹지 않는 이유가 적혀 있다**(`validation.ts:34-37`) — 필드 하나짜리 입력이라 화면이 직접 드는 편이 얇고, 판정은 여전히 스키마가 한다 |
| FS-071-EL-048 | FS-071-SEC-15 | 상세 로딩 문구 | 텍스트 | `order === undefined` 이면 `Card` 안 '주문을 불러오는 중…' 한 줄로 **화면 전체를 대체**한다(`:287-295`) | — | 비표시. **스켈레톤이 아니라 문구다** — 로딩 shape 가 실제 화면(카드 6개)과 다르다(§7 #10) |
| FS-071-EL-049 | FS-071-SEC-15 | 상세 조회 실패 배너 | 배너 | `detailQuery.error !== null` 이면 화면 전체를 위험 톤 `Alert` 로 대체(`:257-285`). **404 와 그 밖을 가른다**(`isNotFound`): 404 → '주문을 찾을 수 없습니다. 주문번호를 다시 확인해 주세요.' + **'다시 시도' 없음**, 그 밖 → '주문을 불러오지 못했습니다.' + '다시 시도'. 두 경우 모두 '목록으로' | O | 비표시. **없는 주문에 '다시 시도'는 영원히 실패한다**(주석 `:256`). 404 의 정본은 어댑터다(`crud.ts:109-113`) |
| FS-071-EL-050 | FS-071-SEC-09 | 쓰기의 단일 통로 | 텍스트 | 모든 쓰기가 `save(next, message, onDone?)`(`:184-206`)를 지난다 — **도메인 함수가 만든 다음 주문을 그대로 `toOrderInput` 해 저장한다**(`:191`). 성공 시 토스트 + `detailQuery.refetch()`(`:193-198`), 실패 시 배너 + 참조 코드(`:199-203`), abort 는 무시 | O | 비표시 규칙. **화면이 필드를 직접 조립하지 않는다**(주석 `:180-183`) — 상태와 이력이 갈라지는 저장이 생기지 않게 하려는 것이다. `onSuccess` 에 `signal.aborted` 가드가 있다(`:194`) |
| FS-071-EL-051 | FS-071-SEC-17 | 미저장 이탈 가드 | 모달 | `useUnsavedChangesDialog(noteDirty && !saving, { message: … })`(`:178`). 문구 '처리 메모에 저장하지 않은 변경이 있습니다. 이 화면을 벗어나면 입력한 내용이 사라집니다.'(`:71-72`) | — | 비표시. **`noteDirty` 만 본다**(`:176`) — 취소 사유·확인 대기 상태는 dirty 로 세지 않는다. **`navigate()` 프로그램 이동(EL-026 · EL-049 의 '목록으로')은 가로채지 못한다**(§7 #8) |
| FS-071-EL-052 | FS-071-SEC-09 | 언마운트 abort | 텍스트 | `useEffect(() => () => controllerRef.current?.abort(), [])`(`:169`) — 화면을 벗어나면 진행 중 저장을 취소한다. 다이얼로그·모달의 취소도 같은 컨트롤러를 abort 한다(`:550,563,575`) | — | 비표시 규칙. **abort 는 실패가 아니다**(`isAbort` → 즉시 return — `:200`). **서버 도달 여부는 보장하지 않는다** |
| FS-071-EL-053 | (도메인) | 재고 부수효과 | 텍스트 | 저장 한 번의 재고 이동은 **어댑터의 `patch` 안에서** 일어난다(`data-source.ts:44-59,74`). 순서: ① `shouldRestoreStock`(취소 복원 — `order.ts:453-457`) ② `shouldDeductStock(next, readStockDeductAt())`(차감 — `order.ts:443-450`). 계획은 `planOrderRestore`/`planOrderDeduction`(`:482,460`), 못 박기는 `withStockRestored`/`withStockApplied`(`:524,499`) | O | 비표시 규칙. **화면이 '주문 저장'과 '재고 증감'을 두 번 부르지 않는다**(`data-source.ts:7-9`) — 하나만 성공하는 창을 없앤다. **멱등 키는 `stockAppliedAt`·`stockRestoredAt`**(`order.ts:238-241`). **`applyStockMovements` 가 false('적용할 곳을 모른다')를 주면 키를 찍지 않는다**(`data-source.ts:40-42,50,55`) — 재고는 그대로인데 주문만 '차감 완료'라고 말하는 상태를 만들지 않는다. 복원은 **품목이 아니라 기록된 출고 이동을 뒤집는다**(`order.ts:476-480`). 회귀 6건(`orders.test.ts:546-628`) |
| FS-071-EL-054 | (도메인) | 재고 차감 시점 설정 | 텍스트 | `StockDeductAt = 'order' \| 'payment'`(`order.ts:403`), 기본값 **`'payment'`**(`_shared/store.ts:31`). 읽기 `readStockDeductAt()`(`:40-42`), 쓰기 `writeStockDeductAt`/`setStockDeductAtFromValue`(`:45-52`), 선택지·설명 `STOCK_DEDUCT_OPTIONS`(`order.ts:411-426`) | — | 비표시. **⚠ 이 설정을 바꾸는 화면이 앱에 없다** — `writeStockDeductAt`·`setStockDeductAtFromValue`·`STOCK_DEDUCT_OPTIONS` 의 소비처가 **테스트뿐**이다(`grep` — `orders.test.ts:55,613` 외 0건). 화면은 EL-031 에서 **읽어 보여 주기만** 한다(`OrderDetailPage.tsx:359-360`). 기본값이 `'payment'` 인 이유는 코드에 있다(`_shared/store.ts:26-30`): 재고를 지키는 쪽이 기본값이어야 한다. §7 #1 |
| FS-071-EL-055 | (도메인) | 주문 조회기(다른 도메인에의 노출) | 텍스트 | `listOrderRefs()`(`data-source.ts:90-99`)가 `OrderRef`(id·주문일시·상태·주문자명·총액·취소 여부)만 내주고, `wiring.ts:142` 가 `registerOrderLookup` 으로 꽂는다 | O | 비표시 규칙. **클레임·적립 원장·통계가 주문의 내부를 알지 못하게 좁힌 표면이다**(`data-source.ts:80-83`). **⚠ 어댑터가 아니라 `ORDER_SEED` 를 읽는다**(`:91`) — 방금 옮긴 상태가 클레임 화면의 참조에 **즉시 반영되지 않는다**(`:85-88` 이 그 한계를 명시). 회귀 `orders.test.ts:505-544` |

## 4. 예외 명세

| 요소번호 | 빈 상태 | 로딩 | 실패 | 유효성 | 권한없음 | 경합 | 대량 |
|---|---|---|---|---|---|---|---|
| FS-071-EL-001 | N/A — 정적 문구 | 로딩 중에도 표시(레일은 그리드 밖) | 조회 실패에도 남는다 — 배너는 우측 컬럼만 대체한다 | N/A — 입력 없음 | 언제나 표시 | N/A — 상태 없음 | 고정 문구 |
| FS-071-EL-002 | N/A — 조건부 문구 | 설정은 조회가 아니라 렌더 시점에 읽는다(`:148`) — 로딩과 무관 | N/A — 서버 호출 없음(로컬 설정) | N/A — 입력 없음 | 결제 설정 화면의 read 권한은 묻지 않고 링크만 건다 | 설정을 바꾸면 **다음 렌더**가 곧바로 새 규칙을 쓴다 | 링크 2개 고정 |
| FS-071-EL-003 | N/A — 조건부 문구 | 권한은 동기 판정 | N/A | N/A — 입력 없음 | **이것이 권한 없음 표현 자체다** | N/A | 고정 문구 |
| FS-071-EL-004 / EL-007 | 그 상태가 0건이면 항목은 남고 배지가 0 | 조회 중에도 조작 가능(결과 0행) | N/A — 클라이언트 필터 | `parseFilter` 가 모르는 값을 '전체'로 되돌린다 | §4.1 공통 규칙 — read 로만 게이팅된다 | URL 이 원천이라 뒤로/새로고침/공유가 값을 보존한다. **필터를 바꾸면 선택이 지워진다**(EL-022) | 항목 9개 고정 |
| FS-071-EL-005 | 0건이면 '0' | **아직 못 셌으면 `'—'`**(`counts === null`) | 실패해도 `'—'` — 0으로 위장하지 않는다 | N/A — 표시 전용 | §4.1 공통 규칙 적용 | 재조회 때 다시 센다 | 필터 이전 전체를 1회 순회(`types.ts:85-88`) |
| FS-071-EL-006 | 취소만 있고 상태 필터를 고르면 0행 | 조회 중에는 대상이 빈 배열 | N/A — 순수 함수 | N/A — 입력 없음 | §4.1 공통 규칙 적용 | N/A — 순수 | 건수에 선형 |
| FS-071-EL-008 | 0행이면 '조건에 맞는 주문 결과가 없습니다.' | 최초 로드 중에는 **침묵**(`firstLoading ? ''`) | '주문 목록을 불러오지 못했습니다.' | N/A — 표시 전용 | §4.1 공통 규칙 적용 | 재조회로 건수가 바뀌면 다시 announce | 건수만 읽는다 |
| FS-071-EL-009 | 0건이면 '전체 0건' | 최초 로드만 '불러오는 중…'. **재조회는 건수 유지 + ' · 새로고침 중…'** | 조회 실패 시 EL-018 이 이 줄을 대체 | N/A — 입력 없음 | §4.1 공통 규칙 적용 | 재조회 시점에 갱신 | `formatNumber` 로 천 단위 구분 |
| FS-071-EL-010 / EL-011 | 매치 0건이면 EL-017 의 '검색 결과 없음' 분기 | 조회 중에도 입력 가능 — 대상이 빈 배열이라 결과 0건 | N/A — 서버를 호출하지 않는다 | 자유 텍스트. 길이·문자 제약 없음. 앞뒤 공백 제거. 빈 문자열이면 조건 해제 | §4.1 공통 규칙 적용 | URL 이 원천. 조합 중에는 커밋하지 않는다 | **전량이 메모리에 있어 커밋마다 전체를 훑고, 주문마다 품목 배열까지 순회한다**(`types.ts:107`) — 건수 × 품목수. 디바운스가 이를 묶는다 |
| FS-071-EL-012 | N/A — 규칙 | N/A — 동기 | N/A — 서버 호출 없음 | 알 수 없는 파라미터는 EL-007 이 정규화 | §4.1 공통 규칙 적용 | **이것이 경합 대비 자체** — 상세→뒤로가 조건을 잃지 않는다 | URL 파라미터 2개 |
| FS-071-EL-013 | 선택 0건이면 `SelectionBar` 가 렌더되지 않는다 | 조회 중에도 선택 가능(스켈레톤 행에는 체크박스가 없다) | 실패 시 화면이 배너로 대체돼 사라진다 | N/A — 입력 없음 | **`canUpdate` 가 false 면 통째로 없다**(`:316`) | 필터·검색이 바뀌면 선택이 지워진다(EL-022) | 전체 선택이 **보이는 행만** 담는다(`:348-353`) |
| FS-071-EL-014 | 적격 0건이면 그 버튼만 `disabled` | 조회 중에도 누를 수 있다. 일괄 진행 중에는 4개 전부 `disabled`(`bulkBusy`) | 실행 실패는 EL-019 다이얼로그 안 배너 | N/A — 입력 없음. **전이 적법성은 술어가 사전에 센다**(EL-023) | `canUpdate` 없으면 렌더되지 않는다 | 선택 집합이 바뀌면 건수가 즉시 다시 계산된다(`useMemo`) | 버튼 4개 고정. 각 버튼이 렌더마다 선택 전체를 훑는다(`:320`) |
| FS-071-EL-015 | 0행이면 EL-017 로 본문 대체 | EL-016 스켈레톤 | EL-018 배너가 표를 대체 | N/A — 표 자체 입력 없음 | caption 이 권한에 따라 갈린다(`OrderTable.tsx:182-186`) | 조회 시점 스냅샷. 다른 관리자의 변경은 재조회 시점에만 | **상한 없음 — 페이지네이션이 없다**(§7 #6). 행마다 `orderTotal`·`partialShipmentLabel` 을 다시 계산한다 |
| FS-071-EL-015.1 / .2 | 행 없으면 없음 | 스켈레톤 행에는 없다 | 실패 시 미표시 | N/A — 이진 선택 | **`selectable=false` 면 열 자체가 없고 `selected` 도 넘기지 않는다** | 조건이 바뀌면 선택이 지워진다(EL-022) | '전체 선택'이 보이는 행 전부를 한 번에 담는다 |
| FS-071-EL-015.3 | 행 없으면 없음 | 스켈레톤 | 실패 시 미표시 | N/A — 표시 전용 | 언제나 표시 | 재조회·필터로 순서가 바뀌면 순번도 다시 매겨진다 | 페이징 도입 시 공식이 틀어진다(§7 #6) |
| FS-071-EL-015.4 | 주문번호는 id 라 빈 값이 성립하지 않는다 | 스켈레톤 | 실패 시 미표시 | N/A — 표시 전용 | **링크는 read 권한만으로 살아 있다** | 이미 삭제된 주문을 열면 EL-049 의 404 분기 | `nowrap` + `tabular-nums`. truncate 없음 |
| FS-071-EL-015.5 / .6 | 빈 문자열이면 빈 칸 | 스켈레톤 | 실패 시 미표시 | N/A — 표시 전용 | 언제나 표시 | 조회 시점 값 | **truncate 없음** — 긴 이름이 열을 넓힌다 |
| FS-071-EL-015.7 | 품목 0건이면 '품목 없음'(`types.ts:162`) | 스켈레톤 | 실패 시 미표시 | N/A — 표시 전용 | 언제나 표시 | 조회 시점 값 | 한 줄 `ellipsis` + 최대 폭 고정 — 전부는 상세가 보인다 |
| FS-071-EL-015.8 | 결제수단은 enum 이라 빈 값이 없다 | 스켈레톤 | 실패 시 미표시 | N/A — 표시 전용 | 언제나 표시 | 조회 시점 값 | 라벨 Record 조회 1회 |
| FS-071-EL-015.9 | 품목 0건이면 배송비만 남아 그 값이 표시된다 | 스켈레톤 | 실패 시 미표시 | N/A — 파생값. **단가·수량에 상한이 없어** 안전 정수를 넘으면 합계가 조용히 뭉개진다(§7 #14) | 언제나 표시 | 조회 시점 값 | **행마다 `orderAmounts` 를 다시 계산한다** — 건수 × 품목수 |
| FS-071-EL-015.10 / .11 | 행 없으면 없음 | 스켈레톤 | 실패 시 미표시 | N/A — enum + 파생 | 언제나 표시 | 취소·부분배송은 조회 시점 사실 | 배지 최대 2개. **info 톤 3개가 겹친다**(§7 #10) |
| FS-071-EL-015.12 | 행 없으면 규칙이 걸리지 않는다 | 스켈레톤 행에는 걸리지 않는다 | N/A — 라우터 내부 이동 | N/A — 입력 없음 | **read 로만 게이팅된다** — 조회 전용 역할도 상세에 간다 | 이미 삭제된 행을 누르면 상세가 404(EL-049) | N/A — 행 단위 |
| FS-071-EL-016 | N/A — 도착 전 상태 | **이것이 로딩 표현.** 최초 로드만 | 조회 실패 시 EL-018 로 바뀐다 | N/A — 입력 없음 | 언제나 | **재조회에서는 발현되지 않는다** — 이전 행이 유지된다(`crud.ts:298`) | 행 수는 DS `Table` 이 정한다 |
| FS-071-EL-017 | **이것이 빈 상태 표현 — 4분기** | 최초 로드 중에는 스켈레톤이 이긴다 | 조회 실패 시 EL-018 이 이긴다 | N/A — 입력 없음 | 언제나 | ①의 판정은 조회가 아니라 설정이라 재조회와 무관하다 | 1행 |
| FS-071-EL-018 | N/A — 실패 상태 | 재시도 중에는 배너가 유지된다(`error` 가 남아 있다) | **이것이 실패 표현.** 문구 1종 + '다시 시도' | N/A — 입력 없음 | §4.1 — **403 도 이 배너로 뭉개진다**(§7 #11) | 재시도는 같은 조회를 재발행 | N/A — 표시 전용 |
| FS-071-EL-019 / EL-020 | 적격 0건이면 `runBulk` 가 즉시 반환한다(`:177`) | 확인 버튼 `busy` — `bulkBusy` 중 재클릭 차단 | **부분 실패를 건수로 보고하고 다이얼로그를 유지**한다. 전체 실패(catch)는 '상태를 처리하지 못했습니다.' | N/A — 입력 없음. 적법성은 EL-023 이 사전 판정 | `canUpdate` 없으면 여는 버튼이 없다 | **어댑터가 다시 같은 술어로 막는다** — 사이에 다른 관리자가 상태를 옮겼으면 `applyOrderStatus` 가 던지고 그 건만 실패한다. 없는 id 면 어댑터가 409(`crud.ts:143-146`) | **상한·진행률·취소 UI 가 없다.** N건의 개별 PUT 을 병렬로 낸다(`settleAllDetailed`). **멱등키 없음**(§7 #4) — 다만 값이 멱등(같은 목표 상태)이라 최종 상태는 같다 |
| FS-071-EL-021 | N/A — 진행 요청이 있어야 성립 | **이것이 취소 규칙** | **abort 는 실패가 아니다** — 배너·토스트를 띄우지 않는다 | N/A — 입력 없음 | N/A | 이미 서버에 닿은 요청은 되돌리지 않는다 | 컨트롤러가 하나뿐이라 **배치 전체가 함께 취소된다** |
| FS-071-EL-022 | N/A — 선택이 있어야 의미 | N/A — 동기 | N/A — 서버 호출 없음 | N/A — 입력 없음 | N/A | **이것이 경합 대비 자체** — 보이지 않는 행이 선택된 채 남지 않는다 | 서명이 실제로 바뀔 때만 지운다(`useListState.ts:210`) — 매 렌더 setState 하지 않는다 |
| FS-071-EL-023 | 선택 0건이면 결과도 0건 | 조회 중에는 대상이 빈 배열 | N/A — 순수 함수 | **이것이 유효성 판정 자체** | N/A | 판정 시점과 저장 시점 사이의 변화는 어댑터가 다시 막는다 | 선택 수 × 버튼 4개 |
| FS-071-EL-024 / EL-025 | 0행이면 정렬·결합할 것이 없다 | 어댑터가 응답 직전에 정렬한다(`data-source.ts:75`) | N/A — 순수 함수 | N/A — 입력 없음 | N/A | 쓰기 직후에도 재정렬된다 — 주문일시는 바뀌지 않으므로 행이 자리를 옮기지 않는다 | 건수에 선형. **정렬 변경 불가**(§7 #6) |
| FS-071-EL-026 | N/A — 항상 표시 | 상세 로딩 중에도 표시 | 조회 실패 화면에도 '목록으로'가 있다(EL-049) | N/A — 입력 없음 | 언제나 표시 | 저장 중에도 누를 수 있다 — 이탈 시 EL-052 가 abort | N/A |
| FS-071-EL-027 | N/A — 정적 | N/A | 조회 실패 시 화면이 대체돼 제목도 사라진다 | N/A — 입력 없음 | 언제나 표시 | N/A | 고정 문구. **h1 이 2개다**(§7 #2) |
| FS-071-EL-028 | N/A — 주문이 있어야 성립 | 로딩 중에는 카드 자체가 없다(EL-048) | 조회 실패 시 사라진다 | N/A — 표시 전용 | 언제나 표시 | 저장 성공 후 `refetch` 로 갱신된다 | 배지 최대 2개 |
| FS-071-EL-029 | N/A — 오류 없으면 미렌더 | 재저장 시 먼저 지운다(`:186-187`) | **이것이 저장 실패 표현.** 문구 1종 + 오류 코드. abort 는 오지 않는다 | **클라이언트 검증 위반은 여기 오지 않는다** — 취소 사유는 인라인, 메모는 필드 오류. 다만 **술어가 던진 사유는 여기로 온다**(`:228,247`) | §4.1 — **403 도 같은 문구** | **409(다른 관리자가 먼저 삭제)도 같은 문구다** — 충돌 다이얼로그·재조회 경로가 없다(§7 #11) | 1건만 표시 |
| FS-071-EL-030 | N/A — 취소된 주문에만 | 로딩 중 미렌더 | N/A — 표시 전용 | N/A | 언제나 표시 | 저장 직후 `refetch` 로 나타난다 | 1건 |
| FS-071-EL-031 | 재고 복원 줄은 `stockRestoredAt !== ''` 일 때만(`:362`) | 로딩 중 미렌더 | N/A — 표시 전용 | N/A | 언제나 표시 | **설정은 렌더 시점에 읽는다** — 설정이 바뀌면 이미 차감된 주문의 문구도 새 설정 이름을 말한다(설정은 주문에 저장되지 않는다 — `_shared/store.ts:35-37`) | 값 3~4개 |
| FS-071-EL-032 | N/A — 조건부 | 로딩 중 미렌더 | N/A | N/A | **이것이 권한 없음 표현 자체** | N/A | 고정 문구 |
| FS-071-EL-033 | `paidAt !== ''` 이거나 취소됐으면 미렌더 | `disabled={saving}` | 실패는 EL-045 다이얼로그의 error 배너 | N/A — 입력 없음 | `canUpdate` 없으면 렌더되지 않는다 | **`applyOrderPaid` 는 이미 확인된 주문에 아무것도 하지 않는다**(`order.ts:367`) — 두 번 눌러도 이력이 늘지 않는다. 취소된 주문이면 던진다(`:366`) | 단건 |
| FS-071-EL-034 / EL-035 | 갈 곳이 없으면 버튼 0개 + EL-035 사유 문구 | `disabled={saving}` | 실패는 EL-045 의 error 배너 + EL-029 | **전이 적법성은 도메인이 판정한다** — 갈 수 없는 단계는 버튼이 없다 | `canUpdate` 없으면 렌더되지 않는다 | **저장 시점에 술어를 다시 지난다**(`applyOrderStatus` 가 던진다 — `order.ts:350-351`). 그 사유가 EL-029 배너로 나온다(`:226-229`) | 버튼 최대 6개. **단계를 건너뛸 수 있다**(§7 #5) |
| FS-071-EL-036 | 취소 불가면 버튼 대신 사유 문구 | `disabled={saving}` | 실패는 EL-046 모달 안 `Alert` | 사유 입력은 EL-047 | `canUpdate` 없으면 렌더되지 않는다 | **`applyOrderCancel` 이 저장 시점에 다시 막는다**(`order.ts:382-383`) — 그 사이 배송이 시작됐으면 거절된다 | 단건 |
| FS-071-EL-037 | 요청사항이 없으면 '없음' · 상세주소가 없으면 `trim()` 이 흡수 | 로딩 중 미렌더 | 조회 실패 시 사라진다 | N/A — 표시 전용 | 언제나 표시 | 조회 시점 값 | **마스킹이 없다** — 전화·이메일·주소가 전부 그대로 보인다(§7 #15) |
| FS-071-EL-038 | N/A — 정적 문구 | 로딩 중 미렌더 | 조회 실패 시 사라진다 | N/A | 언제나 표시 | N/A | 고정 문구 |
| FS-071-EL-039 | 품목 0건이면 '주문 품목이 없습니다.' | 로딩 중 미렌더 | 조회 실패 시 사라진다 | N/A — 표시 전용 | 언제나 표시 | **출고 수량은 배송 화면이 쓴 결과다** — 이 화면에서 재조회 전에는 낡은 값을 보인다 | 품목 수에 선형. 상한 없음 |
| FS-071-EL-040 | 품목 0건이면 '적립 예정 0원' | 로딩 중 미렌더 | 조회 실패 시 사라진다 | N/A — 파생값 | 언제나 표시 | N/A | **화면이 직접 `reduce` 한다**(§7 #13) |
| FS-071-EL-041 | 배송비 0이면 '무료', 쿠폰명이 없으면 괄호 없이 | 로딩 중 미렌더 | 조회 실패 시 사라진다 | N/A — 파생값. **총액은 0 아래로 내려가지 않는다** | 언제나 표시 | 조회 시점 스냅숏 | 값 7개. 렌더마다 `orderAmounts` 1회(`:297`) |
| FS-071-EL-042 | 이력 0건이면 '기록된 처리 이력이 없습니다.' | 로딩 중 미렌더 | 조회 실패 시 사라진다 | N/A — 표시 전용 | 언제나 표시 | **추가만 된다** — 중간 삽입이 없어 순서가 흔들리지 않는다(`order.ts:337-338`) | **상한·페이징 없음** — 오래된 주문일수록 길어진다(§7 #6) |
| FS-071-EL-043 | 초기값은 저장된 `adminNote` | `disabled={saving \|\| !canUpdate}` | 저장 실패는 EL-029 — **입력 보존** | `orderNoteError` — 500자 초과면 '처리 메모는 500자를 넘을 수 없습니다.' **`maxLength` 가 먼저 막아 사실상 도달 불가** | `!canUpdate` 면 `disabled` | **재조회가 오면 `useEffect`(`:171-174`)가 입력을 덮는다** — 저장 성공 후 `refetch` 가 도는 경로가 정상 흐름이지만, 다른 이유의 재조회에서도 같은 일이 일어난다(§7 #16) | 500자. 카운터는 `TextareaField` 소관 |
| FS-071-EL-044 | 미변경이면 `disabled` | `loading={saving}` + `disabled` | 실패 시 EL-029 배너, 버튼 재활성, 입력 보존 | 오류가 있으면 `disabled` + `saveNote` 가 재확인(`:252`) | `canUpdate` 없으면 렌더되지 않는다 | **동기 제출 락·멱등키가 없다** — `saving` 렌더 전 연타의 창이 남는다. **완화**: 값이 멱등(같은 메모 전체 치환)이라 최종 상태가 같다(§7 #4) | 단건. 주문 **전체**를 보낸다(`toOrderInput` — 전체 치환) |
| FS-071-EL-045 | N/A — `pending` 이 있어야 성립 | `busy={saving}` — 확인 버튼 비활성 + '처리 중…' | **다이얼로그를 열어 둔 채** error 배너. 재클릭이 재시도 | N/A — 입력 없음 | `canUpdate` 없으면 열 수 없다 | 사이에 상태가 바뀌었으면 `runPending` 의 `try/catch` 가 술어의 사유를 EL-029 로 보낸다(`:226-229`) | 단건 |
| FS-071-EL-046 / EL-047 | 사유가 비면 제출이 막힌다 | `disabled={saving}` · `loading={saving}` | 모달 안 `Alert` + 모달 유지 | **`cancelTouched` 이후에만 오류를 보인다.** 공백만 → '취소 사유를 입력하세요.' · 200자 초과 → 문구(단, `maxLength` 가 먼저 막는다) | `canUpdate` 없으면 여는 버튼이 없다 | `applyOrderCancel` 이 저장 시점에 다시 막는다 — 그 사이 배송이 시작됐으면 `ORDER_CANCEL_SHIPPED` | 단건. **취소는 재고 복원을 부른다**(EL-053) |
| FS-071-EL-048 | N/A — 도착 전 상태 | **이것이 로딩 표현 — 문구 한 줄** | 실패면 EL-049 가 먼저 이긴다(`:257` 이 앞에 있다) | N/A | 언제나 | 재조회 중에는 뜨지 않는다(`order` 가 이미 있다) | **로딩 shape 가 실제 화면과 다르다**(§7 #10) |
| FS-071-EL-049 | N/A — 실패 상태 | `loadingDetail` 중에는 뜨지 않는다 | **이것이 실패 표현 — 404 와 그 밖을 문구·액션으로 가른다** | N/A — 입력 없음 | §4.1 — **403 은 '불러오지 못했습니다'로 뭉개진다**(§7 #11) | 다른 관리자가 먼저 지웠다면(현재 삭제 UI 는 없다) 404 | N/A — 표시 전용 |
| FS-071-EL-050 | N/A — 저장이 있어야 성립 | `update.isPending` 이 화면 전체의 `saving` 이다 | 실패 시 배너 + 참조 코드. abort 는 무시 | 클라이언트 검증은 호출부가 먼저 본다 | `canUpdate` 없으면 호출부가 없다 | **성공 시 `refetch` 로 최신을 다시 읽는다**(`:196`). **낙관적 업데이트가 없다** — 롤백 경로가 필요 없다 | **주문 전체 치환**(`toOrderInput`) — 부분 갱신이 아니다 |
| FS-071-EL-051 | N/A — 변경이 있어야 성립 | 저장 중에는 가드가 비활성(`noteDirty && !saving`) | N/A — 서버 호출 없음 | N/A | N/A | 저장 성공 후 `refetch` → `useEffect` 가 `note` 를 되맞춰 dirty 가 풀린다 | **프로그램 이동(EL-026·EL-049)이 가드 밖**(§7 #8) |
| FS-071-EL-052 | N/A — 진행 요청이 있어야 성립 | **이것이 취소 규칙** | **abort 는 실패가 아니다** | N/A | N/A | 이탈 시 진행 중 저장이 취소된다 — **서버 도달 여부는 보장하지 않는다** | 컨트롤러 1개 — 마지막 요청만 붙잡는다 |
| FS-071-EL-053 | 품목 수량이 0이면 이동에서 빠진다(`order.ts:465`) | N/A — 저장의 동기 부수효과 | **적용기 미배선이면 멱등 키를 찍지 않는다**(조용한 성공을 만들지 않는다). 재고 부족은 `applyMovements` 가 음수를 만들지 않는 쪽으로 처리한다(회귀 `orders.test.ts:366`) | N/A — 입력 없음 | 저장 권한이 곧 이 부수효과의 권한이다 | **멱등 키(`stockAppliedAt`·`stockRestoredAt`)가 재차감·재복원을 막는다.** 회귀 `orders.test.ts:581`(중복 차감 방지) | 품목마다 이동 1건. 복원은 기록된 출고 수만큼 |
| FS-071-EL-054 | N/A — 언제나 값이 있다(기본 `'payment'`) | N/A — 동기 | N/A — 로컬 변수 | `setStockDeductAtFromValue` 가 모르는 값을 **무시한다**(`_shared/store.ts:50-52`) | N/A — **바꾸는 화면이 없다** | **프로세스 지역 변수라 새로고침하면 기본값으로 되돌아간다** | 값 1개. §7 #1 |
| FS-071-EL-055 | 배선 전에는 `orderCatalog()` 가 null('모른다') | N/A — 동기 | 미배선은 실패가 아니라 '모른다' — 클레임의 취소 가드가 fail-closed 로 막는다(`claims/types.ts:255`) | N/A | N/A | **⚠ 시드를 읽으므로 방금 옮긴 상태가 반영되지 않는다**(§7 #17) | 주문 수에 선형. 매 호출마다 `orderAmounts` 를 전건 계산한다(`data-source.ts:96`) |

### 4.1 공통 예외 규칙

| 규칙 | 내용 |
|---|---|
| 네트워크 단절 | 목록 조회 실패는 인라인 배너(EL-018), 상세 조회 실패는 화면 대체 배너(EL-049), 저장 실패는 카드 안 배너 + 오류 코드(EL-029), 일괄 처리 실패는 **다이얼로그 안 배너**(EL-019). **오프라인 감지·복귀 재조회는 앱 전역에 없다**(`navigator.onLine` 0건) — §7 #18 |
| 세션 만료 | 조회·쓰기 어디서든 401 이 오면 **앱 전역 401 인터셉터**(`shared/query/queryClient.ts:60,65-66` 의 `QueryCache`/`MutationCache` `onError` → `handleQueryLayerError`)가 통지하고 `/login?returnUrl=…&reason=session_expired` 로 보낸다. **미저장 메모는 그때 사라진다** — 프로그램적 이동이라 EL-051 가드가 발화하지 않는다 |
| 요청 타임아웃 | 프론트 타임아웃 상한 없음(`AbortSignal.timeout` 앱 전역 0건). abort 는 언마운트·다이얼로그 취소·모달 닫기에서만(EL-021 · EL-052) |
| 중복 제출 | **모든 쓰기에 멱등키가 없다**(`grep idempotencyKey pages/orders` = 0건) — `useCrudUpdate` 의 `UpdateVars.idempotencyKey`(`crud.ts:345`)가 열려 있는데 이 화면이 넘기지 않는다. 방어는 `disabled`/`busy` 뿐이라 렌더 전 연타의 창이 남는다. **완화**: 모든 저장이 주문 **전체 치환**이고 목표 상태가 고정이라 두 번 실행돼도 최종 상태가 같으며, 재고 부수효과는 멱등 키가 따로 막는다(EL-053) — §7 #4 |
| 실패 통지의 자리 | ① 목록 조회 실패 = 인라인 배너 ② 상세 조회 실패 = 화면 대체 배너(404 분기) ③ 저장 실패 = 카드 안 배너 + 오류 코드 ④ 다이얼로그·모달 안의 실패 = **그 다이얼로그의 배너**(닫지 않는다) ⑤ 저장 **성공** = 토스트 ⑥ abort = 아무것도 띄우지 않는다 |
| 낙관적 업데이트 | **이 화면에 없다.** 모든 쓰기가 비관적이다(응답 후 무효화 + `refetch`) — 롤백 경로가 필요 없다 |
| 동시 조회 | 목록/상세 조회는 각각 동시에 1건만 유지된다(react-query). **목록에는 `placeholderData` 가 있고**(`crud.ts:298`) 상세에는 없다(`:302-312`) — 그래서 상세는 재조회 때 잠깐 `undefined` 로 돌아가지 않는다(같은 키의 캐시가 남는다). `staleTime` 은 전역값, **자동 재시도 없음**(`queryClient.ts:82`), **창 포커스 재조회 없음**(`:90`) |
| 권한 없음 | 라우트 **read** 권한은 AppShell 의 `RequirePermission` 이 `<Outlet>` 바깥에서 가드해 403 화면을 렌더한다(`AppShell.tsx:408-410`). 리소스 파생은 `resourceIdForPath` → `findCoveringLeaf`(`route-resource.ts:31-34`)라 **`/orders/:id` 도 `/orders` 잎으로 덮인다**. **쓰기(update) 게이팅은 이 화면이 배선했다** — `useRouteWritePermissions()`(`OrderListPage.tsx:121` · `OrderDetailPage.tsx:152`)가 체크박스·일괄 바·전이/취소/메모 버튼을 전부 가린다(EXC-03 충족). 서버 403 은 배너로 뭉개진다(§7 #11) |
| 렌더 예외 | AppShell 이 `<Outlet>` 바로 바깥에 `ErrorBoundary` 를 둔다(`AppShell.tsx:395-412`) — 화면이 던져도 사이드바·헤더가 남는다 |
| 금액 계산 | **클라이언트 파생이다** — `Order` 에 합계 필드가 없고(`order.ts:218-246` 전수) `orderAmounts`(`:169-175`)가 매번 만든다. 목록(EL-015.9)·상세(EL-041)가 **같은 함수**를 읽어 두 화면이 다른 금액을 말하지 않는다. **예외 1건**: 적립 예정액을 상세가 직접 `reduce` 한다(EL-040 · §7 #13) |
| 상태 전이 | **규칙의 정본은 `orderTransitionBlock`(`order.ts:293-303`) 하나다.** 되돌리기 금지 · 취소된 주문 금지 · 구매확정은 종점 · 입금 전 배송 단계 금지. 버튼 목록(`nextOrderStatuses`)·일괄 대상 판정(`eligibleForTransition`)·저장(`applyOrderStatus`)이 전부 이것을 읽는다. **단계 건너뛰기는 허용된다**(§7 #5) |
| 취소 축 | 취소는 상태가 아니라 `canceledAt` 이라는 나란한 사실이다(`order.ts:232-237`). 그래서 ① 상태 배지가 지워지지 않고 ② 상태 필터에서 빠지며 ③ '취소' 항목에서만 보인다. **배송 시작 이후의 반환은 이 화면이 아니라 클레임(FS-044)이 받는다** |
| 선택 해제 | **규칙이 있다**(EL-022) — `useListState` 의 `viewSignature` 가 필터·검색 변화에 선택을 지운다. FS-050 이 놓친 STATE-04 결함이 여기서는 발현되지 않는다 |
| 목록 정렬·페이징 | 정렬은 고정(EL-024), 페이징은 **없다**(§7 #6) |

## 5. 서버 연동 지점

| 요소번호 | 이름 | 읽기/쓰기 | 필요 데이터 | 프론트 어댑터 (data-source.ts) | 비고 |
|---|---|---|---|---|---|
| FS-071-EL-005 / EL-008 ~ EL-018 / EL-024 / EL-025 | 주문 목록 조회 | R | 주문 전량(품목·결제·수령인·이력·재고 이동 포함) | `orderAdapter.fetchAll(signal)`(`crud.ts:99-100`) ← `useCrudListQuery(ORDER_RESOURCE, orderAdapter)`(`OrderListPage.tsx:131`) | 필터·검색·정렬·**금액 계산**이 **전부 클라이언트**다. `placeholderData` 로 재조회 중 이전 행 유지 |
| FS-071-EL-028 ~ EL-043 / EL-048 / EL-049 | 주문 상세 조회 | R | 주문 1건 | `orderAdapter.fetchOne(id, signal)`(`crud.ts:102-116`) ← `useCrudItem(…, id ?? '')`(`OrderDetailPage.tsx:154`) | 없으면 **`HttpError(404)`**(`crud.ts:112`) — EL-049 의 404 분기가 여기서 온다. `id === ''` 이면 조회하지 않는다(`crud.ts:310`) |
| FS-071-EL-020 (일괄) · EL-033 · EL-034 · EL-036 · EL-044 (단건) | 주문 갱신 — 상태 전이 · 입금 확인 · 취소 · 처리 메모 | W | id + `OrderInput` **전체**(`order.ts:248,254-270`) | `orderAdapter.update(id, input, { signal, idempotencyKey })`(`crud.ts:132-152`) ← `useCrudUpdate`(`OrderListPage.tsx:152` · `OrderDetailPage.tsx:157`) | **네 조작이 모두 같은 PUT 이다** — 전용 엔드포인트가 없다. **부분 갱신이 아니라 전체 치환.** 없는 id 면 `HttpError(409)`(`crud.ts:145`). **`idempotencyKey` 를 넘기지 않는다**(§7 #4) |
| FS-071-EL-053 | 재고 이동(주문 갱신의 부수효과) | W | 위 PUT 에 포함 | `patch: applyStockEffects`(`data-source.ts:44-59,74`) → `applyStockMovements`(`shared/domain/stock.ts:102`) | **별도 호출이 아니다** — 주문 갱신과 한 덩이다. 심(`data-source.ts:61-63`)이 예고한다: '서버는 주문 갱신 + SKU 재고 증감을 한 트랜잭션으로 처리하고, 재고가 모자라면 422 로 거절한다. 멱등키는 `stockAppliedAt` · `stockRestoredAt` 이다' |
| FS-071-EL-054 | 재고 차감 시점 설정 | R/W | `{ stockDeductAt }` | **없다** — 심만 있다(`_shared/store.ts:35-37` `GET/PUT /api/settings/orders`). 읽기는 모듈 지역 변수(`:33,40-42`) | **호출부가 화면에 없다**(§7 #1). 심이 규칙을 함께 적는다: 차감 시점 변경은 **앞으로의 주문**에만 적용된다 |
| FS-071-EL-055 | 주문 참조 목록(다른 도메인용) | R | `OrderRef[]`(id·일시·상태·주문자·총액·취소 여부) | `listOrderRefs()`(`data-source.ts:90-99`) ← `wiring.ts:142` `registerOrderLookup` | **어댑터가 아니라 `ORDER_SEED` 를 읽는다**(`:91`) — 심이 대체를 예고한다(`:88` `GET /api/orders`) |
| — | **주문 등록** | — | — | **없다.** `orderAdapter.build`(`data-source.ts:69-73`)는 계약이 요구해 열어 둘 뿐 호출부가 없다 | 심이 명시적으로 닫는다(`data-source.ts:64`): '**POST 는 열지 않는다**: 주문을 만드는 것은 관리자가 아니라 고객의 결제다' |
| — | **주문 삭제** | — | — | **없다.** `orderAdapter.remove` 를 부르는 화면이 없다 | 거래 기록이라 지우지 않는다(`data-source.ts:4-5`) |

> **현재 구현 상태 (백엔드 명세 참고)**: 백엔드는 없다. `orderAdapter` 는 공용 `createCrudAdapter`(`shared/crud/crud.ts:91-172`)로 조립되고, 모듈 지역 배열에 지연(`LATENCY_MS`)과 개발용 실패 스위치(`failIfRequested('orders', op)`)를 얹어 CRUD 를 흉내 낸다 — 실제 네트워크 0건. 새로고침하면 시드로 되돌아간다. **연동 지점은 심 두 곳이다**: `data-source.ts:61-64`(주문 조회·갱신 + 재고 트랜잭션 + POST 를 열지 않는다는 선언) · `_shared/store.ts:35-37`(차감 시점 설정). 404/409 가드는 어댑터가 갖는다(`crud.ts:109-113,143-146`). 위 표는 백엔드 연결 후 의도된 동작이다.

## 6. 자기 점검 (제출 전 확인)

- [x] 구현 소스를 전수 대조했다 — `OrderListPage.tsx`(396행) · `OrderDetailPage.tsx`(616행) · `types.ts`(209행) · `validation.ts`(49행) · `data-source.ts`(99행) · `components/OrderTable.tsx`(194행) · `_shared/store.ts`(930행 — 설정 블록 `:24-67` 과 시드) · `orders.test.ts`(642행), 그리고 **도메인** `shared/domain/order.ts`(562행) 전문과 소비하는 공용 코드(`shared/crud/{crud.ts,useListState.ts,CrudReadListShell.tsx}` · `shared/ui/FilterPanel.tsx` · `shared/permissions/{route-resource.ts,RequirePermission.tsx}` · `shared/domain/{stock.ts,order-ref.ts}` · `wiring.ts`)
- [x] **등록·삭제 라우트가 실제로 없음을 코드로 확인**했다 — `App.tsx:306-313` 전수에 `/orders/new`·`/orders/:id/edit`·삭제 경로가 없고, 어댑터의 `build` 에 호출부가 없음을 주석(`data-source.ts:68`)과 함께 §1 · §5 에 적었다
- [x] **상태 어휘가 통계에서 승격된 것임을 코드로 확인**했다(`shared/domain/order.ts:12-15` 머리말 + 회귀 `orders.test.ts:629-642`) — 새로 지은 어휘가 아님을 §1 에 명시했다
- [x] **버튼과 저장이 같은 술어를 읽음을 체인으로 확인**했다 — `orderTransitionBlock`(`order.ts:293`) → `nextOrderStatuses`(`:313`) → 버튼(`OrderDetailPage.tsx:387-398`) / `applyOrderStatus`(`order.ts:349-351`) → 어댑터 `patch`. 회귀 `orders.test.ts:173`
- [x] **취소가 상태가 아님을 필드·필터·배지 세 곳에서 확인**했다(`order.ts:236` · `types.ts:22,50,66` · `OrderTable.tsx:149`) — §1 · §4.1 '취소 축'
- [x] **재고 차감 시점 설정을 소비하는 화면이 없음을 grep 으로 확인**했다 — `writeStockDeductAt`·`setStockDeductAtFromValue`·`STOCK_DEDUCT_OPTIONS` 의 소비처가 **테스트뿐**이고, 화면은 `readStockDeductAt` 을 표시에만 쓴다(`OrderDetailPage.tsx:359-360`). EL-054 · §7 #1
- [x] **쓰기 권한 게이팅이 배선돼 있음을 코드로 확인**했다(`OrderListPage.tsx:121` · `OrderDetailPage.tsx:152`) — 형제 화면 다수가 빠뜨린 EXC-03 을 이 화면은 충족한다. 선택이 `canRemove` 가 아니라 `canUpdate` 에 묶인 이유도 확인했다(`OrderTable.tsx:15-16`)
- [x] **선택 해제 규칙이 실제로 닿음을 확인**했다 — 이 화면은 `useListState` 의 선택 집합을 **직접** 쓰므로(`OrderListPage.tsx:123,159,347`) `viewSignature` 해제(`useListState.ts:207-213`)가 유효하다. FS-050 §7 #5 와 갈리는 지점이다
- [x] **금액이 클라이언트 파생임을 확인**하고(`Order` 에 합계 필드 0건) **예외 1건**(적립 예정액을 상세가 직접 `reduce` — `OrderDetailPage.tsx:468`)까지 찾아 §7 #13 에 적었다
- [x] 보이지 않는 요소(URL 직렬화·라이브 리전·스켈레톤·빈 상태 4분기·실패 배너·선택 해제·정렬·결합·일괄 대상 판정·abort·쓰기 단일 통로·재고 부수효과·차감 시점 설정·주문 조회기)에 번호를 줬다
- [x] §4 예외 7축 빈칸 0건. 모든 `N/A` 에 사유
- [x] `[서버]` = O 요소가 §5 에 전부 요약됐다 — **네 조작(전이·입금·취소·메모)이 모두 같은 PUT** 임과 재고가 그 PUT 의 부수효과임을 구분해 적었다
- [x] 엔드포인트·HTTP·에러코드·DB 스키마를 쓰지 않았다 (BE-071 영역) — `HttpError(404)`/`HttpError(409)` 는 **어댑터가 던지는 프론트 값**이라 현재 동작으로 적었다
- [x] `useListState`·`useCrudListQuery`·`useCrudItem`·`useCrudUpdate` 소비를 직접 확인했다 — IA-13 · STATE-01 · STATE-04 판정 근거

## 7. 미결 사항 (UI 기획 / 아키텍처 / 백엔드 명세 / 프론트 구현 이관)

| # | 내용 | 이관 대상 |
|---|---|---|
| 1 | **🔴 재고 차감 시점 설정을 바꾸는 화면이 없다.** 모델(`StockDeductAt` — `order.ts:403`) · 라벨 · **선택지와 설명문까지 갖춘 `STOCK_DEDUCT_OPTIONS`(`order.ts:411-426`)** · 저장 함수(`writeStockDeductAt`·`setStockDeductAtFromValue` — `_shared/store.ts:45-52`)가 전부 있는데 **소비처가 테스트뿐**이다. 화면은 주문 상세에서 그 값을 **읽어 보여 주기만** 한다(`OrderDetailPage.tsx:359-360`). 결과: 운영자는 '설정: 입금 확인 시'라는 문구를 보지만 **그 설정을 어디서도 바꿀 수 없고**, 값은 프로세스 지역 변수라 새로고침하면 되돌아간다. 심은 이미 있다(`_shared/store.ts:35-37`) | **UI 기획 (화면 신설 — 최우선)** · 백엔드 명세 |
| 2 | **상세에 `<h1>` 이 2개다** — AppHeader 의 '주문'(`AppHeader.tsx:56`)과 본문의 '주문 상세'(`OrderDetailPage.tsx:319`). 단일 문서형 화면들이 `CardTitle`(`<h2>`)만 쓰는 형태(FS-046 §7 #3)를 따르면 해소된다(IA-02) | UI 기획 |
| 3 | **주문이 가리키는 것들로 건너뛸 실이 없다.** ① 품목의 `productId`(`order.ts:99`)가 있는데 **상품 상세 링크가 없다** ② `customer.memberId`(`:186`)가 있는데 **회원 상세 링크가 없다** ③ `couponName` 은 보이는데 **쿠폰 링크가 없다** ④ **이 주문에 걸린 클레임·배송 건으로 가는 링크가 없다** — 반대 방향은 있다(클레임 상세가 주문으로 온다 — `ClaimDetailPage.tsx:391`). 운영자는 주문 상세에서 '이 주문 반품 접수됐나'를 물을 수 없고 클레임 목록을 따로 검색해야 한다 | UI 기획 |
| 4 | **모든 쓰기에 멱등키가 없다** — `grep idempotencyKey pages/orders` **0건**인데 `useCrudUpdate` 의 `UpdateVars.idempotencyKey`(`crud.ts:345`)와 어댑터의 원장(`crud.ts:67,137`)이 **이미 열려 있다**. 특히 **일괄 전이는 N건의 PUT 을 병렬로** 내므로 재시도 창이 N배다. 완화는 값의 멱등성뿐이다(quality-bar EXC-08 P0) | 프론트 구현 · 백엔드 명세 |
| 5 | **단계를 건너뛸 수 있다.** `orderTransitionBlock` 은 **뒤로만** 막고(`order.ts:299`) 앞으로는 얼마든지 건너뛴다 — 입금 확인 직후 '배송완료' 버튼이 '배송준비중'과 나란히 서고(회귀 `orders.test.ts:149` 가 그것을 **정상으로 못 박는다**), 누르면 준비·대기·배송중을 건너뛴 이력이 남는다. **배송 축(FS-072)은 순서를 강제하는데**(`orderShipmentBlock` 이 커버리지를 요구 — `shipment.ts:414-431`) 이 화면은 강제하지 않아 **같은 주문에 두 규칙이 있다**. 의도인지 확인이 필요하다 | 아키텍처 (도메인) · UI 기획 |
| 6 | **페이지네이션·정렬 변경·이력 페이징이 전부 없다.** 목록은 `visible` 전량을 렌더하고(`OrderTable.tsx:126`), `useListState` 의 `page`·`sort` 가 소비되지 않으며(`OrderListPage.tsx:123` 이 `filterDefaults` 만 넘긴다), 상세의 처리 이력도 전량 렌더한다(`OrderDetailPage.tsx:500`). **주문은 커머스에서 가장 빨리 쌓이는 컬렉션이고**, 행마다 `orderAmounts` 를 다시 계산하므로 비용이 건수 × 품목수에 비례한다. 금액 순·상태 순으로 훑을 수도 없다(quality-bar IA-04 P0) | UI 기획 · 백엔드 명세 |
| 7 | **일괄 처리의 부분 실패가 건수만 말한다** — '3건을 처리하지 못했습니다'(`OrderListPage.tsx:205-207`)뿐이고 **어느 주문이 왜 실패했는지 말하지 않는다.** `settleAllDetailed` 는 사유를 함께 돌려주는데(`shared/bulk.ts:24` 주석) 화면이 `failed` 만 꺼내 쓴다(`:193`). 진행률·취소 UI 도 없다 | UI 기획 · 프론트 구현 |
| 8 | **프로그램 이동이 이탈 가드 밖이다** — 상단 '목록으로'(`OrderDetailPage.tsx:312`) · 조회 실패 화면의 '목록으로'(`:278`)가 `navigate()` 라 `useUnsavedChangesDialog`(`:178`)가 가로채지 못한다. 메모를 치던 중 '목록으로'를 누르면 입력이 조용히 사라진다(quality-bar EXC-19) | UI 기획 · 프론트 구현 |
| 9 | **목록 껍데기가 공용이 아니다.** `CrudListShell`/`CrudReadListShell` 을 쓰지 못하는 이유는 정당하고 코드에 적혀 있으나(`OrderTable.tsx:4-13`), 그 결과 **라이브 리전 문구·조회 요약·실패 배너가 셸의 사본으로 이 화면에 다시 쓰여 있다**(`OrderListPage.tsx:285-293,310-314,359-373` ↔ `CrudReadListShell.tsx:80-82,118-121,154-161`). 같은 사본이 배송 처리 화면(FS-072)에도 있어 **지금 3벌이다.** '선택 있는 읽기 목록' 껍데기가 필요하다 | 아키텍처 (공통 층) |
| 10 | **상태 배지의 색이 겹치고 로딩 shape 가 실제와 다르다.** ① `preparing`·`waiting`·`shipping` 이 전부 `info`(`types.ts:129-132`)라 색만으로는 세 단계가 구분되지 않는다 ② 상세의 로딩이 스켈레톤이 아니라 문구 한 줄이다(`OrderDetailPage.tsx:287-295`) — 카드 6개짜리 화면이 한 줄로 접혔다가 튀어나온다(quality-bar COMP-06) | UI 기획 |
| 11 | **실패가 상태코드를 가르지 않는다.** 목록 조회(EL-018)·저장(EL-029)이 **400/403/409/422/500 을 한 문구로 뭉갠다.** 상세 조회만 404 를 가른다(`isNotFound` — `:258`). `isForbidden`·`isConflict`·`isUnprocessable`(`shared/errors/http-error.ts`)이 이미 있는데 이 화면이 쓰지 않는다. 특히 **409(다른 관리자가 먼저 바꿈)에 재조회·충돌 다이얼로그 경로가 없다** — 폼 화면들이 갖는 `FormConflictDialog` 에 대응하는 것이 이 처리형 화면에는 없다(quality-bar EXC-06 P1 · EXC-04 P0) | UI 기획 · 프론트 구현 |
| 12 | 대응 SCR 문서 부재 (주문 관리 SCR 미작성) | UI 기획 / 아키텍처 |
| 13 | **금액 계산의 '유일한 자리' 규칙에 예외 1건이 있다** — 적립 예정액을 상세가 직접 `order.lines.reduce((s,l) => s + linePoint(l), 0)`(`OrderDetailPage.tsx:468`) 한다. 같은 값이 `orderAmounts(order).point`(`order.ts:171`)로 **이미 계산돼 `amounts` 에 들어 있는데**(`:297`) 쓰지 않는다. 지금은 결과가 같지만 규칙이 바뀌면 두 곳이 갈라진다 | 프론트 구현 (경미) |
| 14 | **금액·수량에 상한이 없다.** `unitPrice`·`quantity` 는 스냅숏으로 들어오는 값이라 이 화면에 입력 검증이 없고, `orderAmounts` 도 안전 정수 검사를 하지 않는다(`order.ts:169-175`). 고객 채널이 만든 값이라 지금은 표면이 없지만, 백엔드가 붙으면 신뢰 경계가 생긴다 | 백엔드 명세 · 아키텍처 |
| 15 | **개인정보가 마스킹 없이 그대로 보인다** — 주문자 전화·이메일, 수령인 전화, 배송지 전체(`OrderDetailPage.tsx:423-438`). 클레임 화면은 신청자 이름을 `'김**'` 으로 마스킹해 든다(`claims/data-source.ts:50`)는 점에서 **같은 앱 안에 두 기준이 있다.** 목록·상세의 노출 범위와 역할별 마스킹 정책을 정해야 한다 | UI 기획 · 백엔드 명세 |
| 16 | **재조회가 편집 중인 메모를 덮는다** — `useEffect(() => { setNote(order.adminNote) }, [order])`(`OrderDetailPage.tsx:171-174`)가 `order` **참조**가 바뀔 때마다 돈다. 정상 흐름(저장 성공 후 `refetch`)에서는 옳지만, 그 밖의 재조회에서도 입력이 덮인다 | UI 기획 · 프론트 구현 |
| 17 | **`listOrderRefs()` 가 어댑터가 아니라 시드를 읽는다**(`data-source.ts:90-99`) — 그래서 **이 화면에서 방금 옮긴 상태·취소가 클레임 화면의 취소 가드에 즉시 반영되지 않는다.** 코드가 그 한계를 스스로 적어 두었고(`:85-88`) 쿠폰 카탈로그가 같은 선택을 했다. `GET /api/orders` 로 대체하면 사라진다 | 백엔드 명세 · 아키텍처 |
| 18 | 프론트 타임아웃 상한 없음(`AbortSignal.timeout` 0건) · 오프라인 감지 없음(`navigator.onLine` 0건) · 세션 만료 리다이렉트가 미저장 메모를 버린다(가드 미발화) | 프론트 구현 (quality-bar EXC-05 · EXC-11 · EXC-19) |
| 19 | **`specs/README.md` 가 이 화면을 모른다** — §2 번호 체계 표에 **주문 관리 번호대(071–072)가 없고**, §3 화면 색인에 주문 관리 섹션이 없으며, `/products/returns` 가 여전히 상품 관리 표에 실려 있다(README `:115`). 이 배치는 `specs/orders/**` 밖을 고치지 않았으므로 색인 갱신이 남았다 | **명세 리뷰 (색인 갱신 — 후속)** |
