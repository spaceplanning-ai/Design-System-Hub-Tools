---
id: FS-072
title: "배송 처리 (목록 · 송장 등록 · 발송처리)"
screen: SCR-072               # ⚠ 주문 관리 SCR 미작성 — §7 미결 사항 참조
route: /orders/shipments
owner: 기능 명세
reviewer: 명세 리뷰
gate: G9
status: draft
confirmedAt: 2026-07-22
version: 1.0
date: 2026-07-22
---

# FS-072. 배송 처리 (목록 · 송장 등록 · 발송처리)

## 1. 화면 개요

| 항목 | 내용 |
|---|---|
| 목적 | **오늘 무엇을 내보낼 것인가**를 처리한다. 주문 목록이 '무엇이 어디에 고여 있는가'를 보는 곳이라면 여기는 손을 움직이는 곳이다(`ShipmentListPage.tsx:3-5`). 관리자가 하는 일은 셋뿐이다 — **배송준비중으로 옮기고 · 송장을 붙이고 · 발송처리한다** |
| 역할(주 사용자) | 관리자 · `update` 권한이 없는 역할은 **조회만 가능하다** — 체크박스도 일괄 처리 바도 그리지 않는다(`ShipmentListPage.tsx:133,435,460`) |
| 진입 경로 | 좌측 GNB > 주문 관리 > 배송 처리 (`/orders/shipments` — `nav-config.ts:169`) |
| 포함 화면 | **`/orders/shipments` 하나뿐**(`App.tsx:309`). **상세 라우트가 없다** — `/orders/shipments/:id` 도 등록·수정 폼도 없다(`App.tsx:306-313` 전수). 정적 잎이라 `/orders/:id` **앞에** 등록된다(`App.tsx:308` 주석) |
| **행은 배송 건이 아니라 주문이다 — 이 화면에서 가장 중요한 판단** | 근거가 코드에 있다(`types.ts:8-11`): 배송 건을 행으로 삼으면 **송장이 아직 없는 주문이 목록에 아예 나타나지 않는다**(배송 건이 0개니까) — 정작 할 일이 가장 많은 주문이 화면에서 사라지는 셈이다. 그래서 행 id 는 **주문번호**이고(`types.ts:100-101`) 배송 건은 그 행에 딸린다. 회귀 `shipments.test.ts:112`(`배송 건이 하나도 없는 주문도 행으로 선다`) |
| **범위 밖 — 택배사 목록은 이 화면이 소유하지 않는다** | **택배사의 원장은 배송 정책 화면(`/products/shipping`)의 `CarrierSection` 이다**(`pages/products/shipping/components/CarrierSection.tsx` · `shared/domain/shipment.ts:9-13`). 이 화면은 **소비자**이며 조회기로만 닿는다(`activeCarriers()` — `shipment.ts:88-91`, 배선은 `wiring.ts:172`). 등록·수정·삭제·사용여부 토글이 여기 없고, 다이얼로그의 안내도 '상품 관리 > 배송에서 택배사를 먼저 등록해 주세요'(`InvoiceBulkDialog.tsx:222`)라고 그쪽을 가리킨다. 반대 방향의 실도 있다 — 그쪽의 **삭제 가드**가 이 화면의 원장에 '이 택배사로 나간 배송 건이 몇 건인가'를 묻는다(`countShipmentsByCarrier` — `data-source.ts:120-122`, 배선 `wiring.ts:173`) |
| **그 밖의 범위 밖** | **주문 상태 기계** — 도메인이 소유하고(`shared/domain/order.ts`) 이 화면은 `orderShipmentBlock`(`shipment.ts:414-431`)을 지나 **밀기만** 한다. **주문의 취소·메모·입금 확인** — 주문 상세(FS-071)의 것이다. **배송 건 삭제** — 없다. 잘못 붙인 송장은 지우는 것이 아니라 다시 붙이는 것이고, 나간 배송의 기록은 남아야 한다(`data-source.ts:4-5`). **실시간 배송 추적** — 하지 않는다. 링크까지만 만들고 그 뒤는 택배사 사이트가 답한다(`shipment.ts:108-109` 규칙 5 · `ShipmentTable.tsx:11-12`). **고객 알림** — 발송처리가 그 발화 지점이지만 **알림 자체가 없다**(`shipment.ts:22` · `data-source.ts:98`) |
| 구현 경로 | `apps/admin/src/pages/orders/shipments/{ShipmentListPage.tsx(537행),types.ts(220행),data-source.ts(122행),shipments.test.ts(237행),components/ShipmentTable.tsx(209행),components/InvoiceBulkDialog.tsx(319행)}` · **도메인** `apps/admin/src/shared/domain/shipment.ts(494행)` + `shared/domain/order.ts` |
| 대응 SCR | SCR-072 (미작성 — §7 #10) |
| 공통 컴포넌트 | `shared/crud/{useListState,parseFilter,useCrudListQuery,useCrudCreate,useCrudUpdate,createCrudAdapter,DetailCellLink}` · `shared/ui/{Alert,Button,ConfirmDialog,FilterPanel,FilterRail,Modal,SearchField,SelectField,SelectionBar,StatusBadge,RowSelectCell,SelectAllHeaderCell,SeqCell,SeqHeaderCell,tableSelectionState,controlStyle,errorIdOf,errorTextStyle,hintStyle,useModalDirtyGuard,useToast,visuallyHiddenStyle}` · `@tds/ui{Table,Empty,cssVar}` · `shared/permissions/useRouteWritePermissions` · `shared/bulk(settleAllDetailed)` · `shared/async(isAbort)` · `shared/format{formatNumber,formatDateTime}` |

> **배송 도메인은 이번에 새로 생겼다.** 그 이전에는 배송이 **정책 문서 1건**뿐이었고 거기의 `carrier` 는 자유 텍스트 한 줄이라 '대한통운'과 'CJ대한통운'이 나란히 저장될 수 있었다 — 그러면 추적 URL 을 만들 키가 없다. **송장번호·배송 건이라는 개념은 리포 전체에 0건이었다**(`shipment.ts:4-7`). 그래서 이름이 아니라 **`code` 가 식별자**다(`Carrier` — `shipment.ts:35-47`).

> **'배송대기'는 실제 상태다.** 운송장은 출력됐지만 아직 인수인계 전인 구간이 국내 운영에 반드시 있다. 그 구간을 이름으로 부르지 못하면 운영자는 **나가지도 않은 물건을 '배송중'이라고 고객에게 말하게 된다**(`shipment.ts:20-22` · `ShipmentListPage.tsx:7-11`). 그래서 **송장 입력과 발송처리는 다른 조작**이고, `waiting → shipping` 전이가 곧 발송처리다.

> **주문 상태 기계를 다시 짓지 않는다.** 전이 가능 여부는 언제나 `orderShipmentBlock`(`shipment.ts:414-431`)을 지나고, 그 함수가 **가장 먼저** `orderTransitionBlock`(`order.ts:293`)에게 묻는다(`shipment.ts:419-420`). 배송 축이 얹는 것은 한 가지뿐이다 — **전 품목이 덮였는가**(`:422-431`).

> **부분 발송의 셈은 순수 함수 하나가 소유한다.** module-private `allocateCovered`(`shipment.ts:312-328`)가 SKU 별 배송 수량을 품목 순서대로 배정하고, 그 위에 공개 함수 셋이 선다: `shipmentCoverage`(`:347`) · `uninvoicedLines`(`:378`) · `applyShippedQuantities`(`:394`). **주문의 `shippedQuantity` 는 `applyShippedQuantities` 의 결과**이고 화면이 직접 세지 않는다(`:388-392`) — 목록의 '부분배송 1/3' 배지와 저장의 판정이 다른 셈에서 나오면 같은 주문을 두 화면이 다르게 설명하는 순간이 반드시 온다.

## 2. 영역 구성

| 영역번호 | 이름 | 설명 |
|---|---|---|
| FS-072-SEC-01 | 좌측 필터 레일 | `FilterRail` 안내문(2~3줄, 택배사 설정 링크 포함) + `FilterPanel` 배송 상태 필터 5항목과 건수 배지 |
| FS-072-SEC-02 | 라이브 리전 · 조회 요약 | 시각 숨김 `aria-live` 한 줄 + 건수 텍스트 |
| FS-072-SEC-03 | 검색 툴바 | `SearchField` 하나뿐. **등록 버튼이 없다** |
| FS-072-SEC-04 | 선택 바 · 일괄 처리 (비표시 기본) | 선택 1건 이상 + `canUpdate` 일 때만. 버튼 3개(배송준비중 처리 · 송장 입력 · 발송처리) |
| FS-072-SEC-05 | 목록 표 | 선택·순번·주문번호·주문일·수령인·품목·택배사·송장번호·배송 상태 |
| FS-072-SEC-06 | 조회 실패 배너 (비표시 기본) | 요약·선택바·표를 대체 |
| FS-072-SEC-07 | 배송준비중 일괄 확인 다이얼로그 (비표시 기본) | 제외 건수와 사유를 함께 말한다 |
| FS-072-SEC-08 | 송장 일괄 입력 모달 (비표시 기본) | 주문별 한 줄(택배사 select + 송장번호 input) + 택배사 부재 경고 + 하단 안내 |
| FS-072-SEC-09 | 발송처리 확인 다이얼로그 (비표시 기본) | 전 품목이 나간 주문만 배송중이 된다는 사실을 함께 말한다 |
| FS-072-SEC-10 | 송장 모달 파기 확인 (비표시 기본) | `useModalDirtyGuard` — 모달 **밖**에 렌더된다 |

> **세 다이얼로그는 서로를 밀어낸다** — `pending: 'prepare' \| 'invoice' \| 'dispatch' \| null` 하나가 상태를 들어(`ShipmentListPage.tsx:128,189`) 동시에 둘이 열리지 않는다.

> **이 화면도 `CrudListShell`/`CrudReadListShell` 을 쓰지 않는다** — 이유는 주문 목록과 같다(`components/ShipmentTable.tsx:3-6`): 읽기 전용 껍데기에는 체크박스가 없고, 쓰기 껍데기의 체크박스는 일괄 **삭제**에 묶여 있는데 배송 건은 지우지 않는다. 프리미티브는 그대로 쓰되 껍데기를 이 화면이 조립한다. 그 결과 SEC-02·SEC-06 이 셸 문구의 **세 번째 사본**이다(FS-071 §7 #9).

## 3. 요소 명세

| 요소번호 | 영역 | 이름 | 유형 | 동작 | [서버] | 비고 |
|---|---|---|---|---|---|---|
| FS-072-EL-001 | FS-072-SEC-01 | 처리 순서 안내문 | 텍스트 | '송장을 등록하면 배송대기, 발송처리하면 배송중이 됩니다. 일부만 나간 주문은 남은 품목 기준으로 발송대기에 남습니다.'(`ShipmentListPage.tsx:375-378`) | — | **이 화면의 순서 규칙을 사용자에게 말하는 유일한 문구다** |
| FS-072-EL-002 | FS-072-SEC-01 | 택배사 경계 안내문 | 텍스트 | '택배사는 **배송 설정**에 등록된 목록에서만 고를 수 있습니다.' — '배송 설정'이 `/products/shipping` 링크다(`:379-385`, `CARRIER_SETTINGS_PATH = '/products/shipping'` — `:80`) | — | **§1 의 소유권 경계를 화면에서 밝히는 자리다.** 자유 입력이 없는 이유를 함께 말한다 |
| FS-072-EL-003 | FS-072-SEC-01 | 조회 전용 안내문 | 텍스트 | `!canUpdate` 일 때만: '배송을 처리할 권한이 없어 조회만 가능합니다.'(`:386`) | — | 비표시 기본 |
| FS-072-EL-004 | FS-072-SEC-01 | 배송 상태 필터 | 입력 | `FilterPanel navLabel="배송 상태 필터" heading="배송 상태"`(`:390-399`). 항목 5개 = 전체 · **발송대기** · 배송대기 · 배송중 · 배송완료(`types.ts:51-57`). 선택 시 `list.setFilter('work', …)` → URL `?work=` | — | **'발송대기'(`pending`)는 도메인에 없는 이 화면만의 값이다**(`types.ts:26-30`): 도메인의 `ShipmentStatus` 는 **배송 건 하나**의 상태(대기·중·완료)인데 여기 있는 것은 **주문 하나의 작업 상태**라 '배송 건이 아직 없다'는 사실을 담을 값이 하나 더 필요하다. 순서는 일이 흘러가는 순서다 |
| FS-072-EL-005 | FS-072-SEC-01 | 필터 건수 배지 | 텍스트 | 항목마다 건수. **필터 이전 전체 행 집합에서** 센다(`countRowsByWork` — `types.ts:149-161`, 키를 다 적은 `Record`). 아직 못 셌으면 `null` → `'—'`(`ShipmentListPage.tsx:163-164` → `FilterPanel.tsx:33,153`) | O | **0 과 '모름'을 가른다.** 회귀 `shipments.test.ts:161`(`건수의 합은 전체와 같다 — 어느 행도 두 갈래에 동시에 속하지 않는다`) |
| FS-072-EL-006 | FS-072-SEC-01 | 작업 상태 판정 규칙 | 텍스트 | `shipmentWorkStatus(order, shipments)`(`types.ts:86-95`): ① 송장이 **전 품목을 덮지 않았으면** `pending`(발송대기) ② 배송 건이 전부 `delivered` 면 `delivered` ③ 하나라도 창고를 떠났으면 `shipping` ④ 그 밖 `waiting` | — | 비표시 규칙. **부분발송은 '배송중'이 아니라 발송대기다**(`types.ts:82-84`) — 운영자에게 남은 일이 있기 때문이고, **이 목록의 건수는 곧 오늘 처리할 양**이어야 한다. 반쯤 끝난 일을 완료 쪽에 놓으면 그 숫자가 거짓말이 된다. 회귀 `shipments.test.ts:119,125,129,137` |
| FS-072-EL-007 | FS-072-SEC-01 | 행 대상 판정 규칙 | 텍스트 | `isShippable(order)`(`types.ts:118-120`) — **취소된 주문과 입금 전(`pending`) 주문은 행이 되지 않는다** | — | 비표시 규칙. 전자는 나갈 일이 없고 후자는 돈을 받기 전이라 나가면 안 된다(`orderTransitionBlock` 이 같은 이유로 막는다). 목록에 남기면 **아무 버튼도 듣지 않는 행이 쌓여 건수 배지가 할 일의 양을 말하지 못한다**(`types.ts:113-116`). 회귀 `shipments.test.ts:105` |
| FS-072-EL-008 | FS-072-SEC-01 | 필터 값 정규화 규칙 | 텍스트 | `parseFilter(list.filters['work'] ?? 'all', SHIPMENT_WORK_FILTER_VALUES, 'all')`(`:137-141`) — 손으로 고친 `?work=거짓말` 은 '전체'로 되돌린다. 허용 목록은 필터 정의에서 파생(`types.ts:60-62`) | — | 비표시 규칙. 회귀 `shipments.test.ts:166` |
| FS-072-EL-009 | FS-072-SEC-02 | 라이브 리전 | 텍스트 | **항상 마운트된** `aria-live="polite" aria-atomic="true"` 시각 숨김 컨테이너(`:404-412`). 최초 로드 중 침묵 · 실패 `배송 건 목록을 불러오지 못했습니다.` · 0행 `조건에 맞는 배송 건 결과가 없습니다.` · 그 밖 `배송 건 N건을 찾았습니다.` | — | 비표시. `ENTITY_LABEL = '배송 건'`(`:78`)인데 **행은 주문이라** 문구가 세는 단위와 실제 단위가 어긋난다(§7 #4) |
| FS-072-EL-010 | FS-072-SEC-02 | 조회 요약 텍스트 | 텍스트 | 최초 로드 중 '불러오는 중…', 그 외 `전체 N건`. 재조회 중 ' · 새로고침 중…', 선택이 있으면 ' · N건 선택됨'. `aria-busy={refreshing}`(`:429-433`) | — | `refreshing` 이 **두 조회의 OR** 다(`:152`) |
| FS-072-EL-011 | FS-072-SEC-03 | 검색 입력 | 입력 | `SearchField` 접근 이름 '주문번호·수령인·송장번호 검색'(`:416-423`). `{...list.searchInputProps}` 로 IME 안전 + 디바운스 상속. URL `?q=` | — | 필터링은 클라이언트 |
| FS-072-EL-012 | FS-072-SEC-03 | 검색 매칭 규칙 | 텍스트 | `searchShipmentRows`(`types.ts:170-182`): 소문자 부분 일치 OR — **주문번호 · 수령인 이름 · 그 행의 모든 송장번호** | — | 비표시 규칙. **송장번호를 넣은 이유가 코드에 있다**(`types.ts:166-168`): 고객이 부르는 것은 주문번호이지만 **택배사가 부르는 것은 송장번호**이고 배송 사고 문의는 대개 후자로 들어온다. 회귀 `shipments.test.ts:171,175,180`. **주문자(결제한 사람)는 대상이 아니다** — 여기서는 수령인을 본다(주문 목록과 갈리는 지점) |
| FS-072-EL-013 | FS-072-SEC-03 | 조회 상태 URL 직렬화 규칙 | 텍스트 | `work`·`q` 의 단일 원천이 URL 이다(`useListState` — `:135`, 기본값 `:84`). `replace: true` 갱신 | — | 비표시 규칙. **`page`·`sort` 는 소비되지 않는다**(§7 #5) |
| FS-072-EL-014 | FS-072-SEC-04 | 선택 바 | 영역 | `canUpdate` 일 때만(`:435`). `SelectionBar count={selectedCount} onClear={list.clearSelection}` | — | **선택은 `canUpdate` 에 묶인다**(`ShipmentTable.tsx:101` 주석) — 배송 처리는 주문의 **수정**이다 |
| FS-072-EL-015 | FS-072-SEC-04 | '배송준비중 처리' 버튼 | 버튼 | `배송준비중 처리 (N)` — N 은 `eligibleForPreparing(selectedRows).length`(`types.ts:208-210` = `canTransitionOrder(row.order,'preparing')`). `disabled={count === 0 \|\| busy}`(`:438-450,365`) | O | **판정을 주문 도메인이 한다** — 배송 축이 얹을 것이 없는 단계다. 회귀 `shipments.test.ts:198,205`(`배송보류 주문은 배송준비중으로 되돌릴 수 없다 — 흐름은 한 방향이다`) |
| FS-072-EL-016 | FS-072-SEC-04 | '송장 입력' 버튼 | 버튼 | `송장 입력 (N)` — N 은 `eligibleForInvoice(selectedRows).length`(`types.ts:213-215` = **잔량(`remaining`)이 남은 행**). 클릭 시 SEC-08 모달 | — | 잔량이 없으면 다이얼로그에 줄을 만들 이유가 없다. 회귀 `shipments.test.ts:209` |
| FS-072-EL-017 | FS-072-SEC-04 | '발송처리' 버튼 | 버튼 | `발송처리 (N)` — N 은 `eligibleForDispatch(selectedRows).length`(`types.ts:218-220` = **`canDispatchShipment` 을 통과하는 배송 건이 하나라도 있는 행**). `canDispatchShipment`(`shipment.ts:471-473`) = `canTransitionShipment(shipment,'shipping')` | O | **송장 없이는 발송처리할 수 없다** — `shipmentTransitionBlock`(`:450-461`)이 `SHIPMENT_DISPATCH_NO_INVOICE`('송장번호가 없어 발송처리할 수 없습니다.')로 막는다: 송장 없는 '배송중'은 **고객에게 알릴 번호도 추적할 링크도 없다**(`:457`). 회귀 `shipments.test.ts:216` |
| FS-072-EL-018 | FS-072-SEC-04 | 일괄 처리 공통 마무리 규칙 | 텍스트 | `runBulk(items, run, successMessage)`(`:208-239`): `settleAllDetailed` 로 전건 시도 → 전건 성공이면 토스트 + `clearSelection()` + 닫기(`:223-228`), **실패가 남으면 다이얼로그를 닫지 않고** `M건을 처리하지 못했습니다…` 배너(`:229-232`), 전체 실패(catch)는 '처리하지 못했습니다.'(`:237`) | O | 비표시 규칙. `items.length === 0` 이면 즉시 반환(`:213`). abort 는 무시(`:221,235`). **어느 주문이 실패했는지 말하지 않는다**(§7 #6). **멱등키가 없다**(§7 #7) |
| FS-072-EL-019 | FS-072-SEC-05 | 배송 처리 목록 표 | 표 | DS `Table`(`ShipmentTable.tsx:195-208`). 컬럼 7개 + 선행 열(선택·순번). caption 이 `selectable` 로 갈린다(`:197-201`). `loading={loading}` | O | **전량 렌더 — 페이지네이션이 없다**(§7 #5). **행 액션 열이 없다** |
| FS-072-EL-019.1 | FS-072-SEC-05 | 전체 선택 · 행 선택 셀 | 입력 | `selectable` 일 때만. `SelectAllHeaderCell label="이 페이지의 배송 건 전체 선택" labelId="shipments-select-all"`(`ShipmentTable.tsx:128-134` ← `:81,469`) · `RowSelectCell label={`${row.id} 배송 건 선택`}`(`:174-182`). 토글 범위는 **보이는 행뿐**(`ShipmentListPage.tsx:463-468`) | — | 접근 이름이 `<주문번호> 배송 건 선택` 이라 **행이 주문인데 '배송 건'이라고 낭독한다**(§7 #4) |
| FS-072-EL-019.2 | FS-072-SEC-05 | 순번 셀 | 텍스트 | `SeqCell seq={index + 1}`(`ShipmentTable.tsx:185`) | — | 화면상 위치 |
| FS-072-EL-019.3 | FS-072-SEC-05 | 주문번호 셀 (주문 상세 링크) | 링크 | `DetailCellLink to={/orders/<id>} ariaLabel={`${row.id} 주문 상세`}` + `tabular-nums`·`nowrap`(`:147-149,44-47`). 경로는 부모가 준다(`ShipmentListPage.tsx:459`) | — | **배송 건 상세가 없어서 주문 상세로 간다** — 배송에 관해 알아야 할 것은 이 표의 한 줄에 다 있고 그 이상은 주문의 맥락이다(`ShipmentTable.tsx:8-9`). 없는 화면을 만들지 않는다 |
| FS-072-EL-019.4 | FS-072-SEC-05 | 주문일 · 수령인 셀 | 텍스트 | `formatDateTime(row.order.orderedAt)` · `row.order.receiver.name`(`:150-151`) | — | **주문자가 아니라 수령인이다** — 물건을 받을 사람이 이 화면의 관심사다 |
| FS-072-EL-019.5 | FS-072-SEC-05 | 품목 요약 셀 | 텍스트 | `orderLinesSummary(row.order)`(`pages/orders/types.ts:160-165`) — 주문 목록과 **같은 함수**. `ellipsis`+`nowrap`+최대 폭(`:49-55`) | — | 두 화면이 같은 요약을 말한다 |
| FS-072-EL-019.6 | FS-072-SEC-05 | 택배사 셀 | 텍스트 | `carrierSummary(row)`(`types.ts:187-193`) — 배송 건 0개면 `'—'`, 택배사 1곳이면 이름, 여럿이면 `첫이름 외 N곳`. 이름은 `carrierNameOf(id)`(`shipment.ts:101-103`) | O | **삭제된 택배사를 가리키는 옛 배송 건도 무언가는 말한다** — `'알 수 없는 택배사'`(`shipment.ts:102`). **조회기 미배선일 때도 같은 문구가 나온다**(`findCarrier` 가 null — `:94-98`) — '없어졌다'와 '못 읽었다'가 여기서는 뭉개진다(§7 #3). 회귀 `shipments.test.ts:225,229,233` |
| FS-072-EL-019.7 | FS-072-SEC-05 | 송장번호 셀 (추적 링크) | 링크 | 배송 건 0개면 `'—'`, 아니면 **세로로 쌓는다**(`:156-164,58-63`) — 한 줄에 이어 붙이면 어느 번호가 어느 건인지 알 수 없다. 각 줄은 `InvoiceCell`(`:73-94`): `trackingUrl(carrier, invoiceNo)`(`shipment.ts:111-120`)가 만들어지면 `<a target="_blank" rel="noreferrer noopener">` + `aria-label='<번호> 배송 조회 (새 창)'`, 아니면 번호 텍스트만 | O | **`{{invoice}}`(`INVOICE_TOKEN` — `shipment.ts:52`) 치환이 전부다.** 템플릿이 비었거나 토큰이 없거나 송장번호가 유효하지 않으면 **링크를 만들지 않는다**(`:116-118`) — 없는 링크를 그리는 것보다 안 그리는 편이 정직하다(`:42-43`). 값은 `encodeURIComponent` 된다(`:119`). **진행률·상태를 지어내지 않는다**(규칙 5) |
| FS-072-EL-019.8 | FS-072-SEC-05 | 배송 상태 배지 열 | 배지 | `StatusBadge tone={shipmentWorkTone(row.work)}`(`types.ts:64-73`): 발송대기=warning · 배송대기/배송중=info · 배송완료=success. 부분이면 그 옆에 warning `부분발송 N/M`(`partialLabel` — `types.ts:196-200`)(`ShipmentTable.tsx:165-169`) | — | **색만으로 말하지 않는다** — 얼마나 나갔는지는 글자로 함께 선다(주석 `:167`). 배지의 근거인 `coverage` 는 **발송된 건만** 넘겨 계산한다(`types.ts:134` `dispatchedShipments`) |
| FS-072-EL-019.9 | FS-072-SEC-05 | 행 전체 클릭 이동 | 텍스트 | `onActivate: () => navigate(orderPath)`(`ShipmentTable.tsx:187-189`) — **주문 상세로** 간다 | — | 비표시 규칙. 키보드 사용자는 주문번호 링크로 닿는다 |
| FS-072-EL-020 | FS-072-SEC-05 | 행 모델 조립 규칙 | 텍스트 | `buildShipmentRows(orders, shipments)`(`types.ts:123-138`): `isShippable` 로 거른 주문마다 `{id, order, shipments(자기 것만), work, coverage, remaining}` 을 만든다. **정렬은 주문 목록과 같다** — 어댑터가 이미 정렬한 주문 배열의 순서를 그대로 쓴다(주석 `:122`) | — | 비표시 규칙. `remaining = uninvoicedLines(order.lines, own)`(`shipment.ts:378-386`)이 송장 다이얼로그가 만들 품목이 된다 |
| FS-072-EL-021 | FS-072-SEC-05 | 로딩 스켈레톤 | 스켈레톤 | **최초 로드에서만** — `firstLoading` 이 **두 조회의 OR** 다(`:149-151`). DS `Table` 의 `loading` 이 본문을 대체 | — | 비표시. 재조회 중에는 이전 행이 유지된다(`crud.ts:298`). STATE-01 |
| FS-072-EL-022 | FS-072-SEC-05 | 빈 상태 (3분기) | 빈상태 | 공유 `Empty label="배송 건" createVerb="접수"`(`:349-358`)가 맥락으로 갈린다: 검색어 → '검색 지우기' · 필터 → '필터 초기화' · 진짜 없음 | — | 비표시. **주문 목록의 '결제 미사용' 4번째 분기가 여기에는 없다**(§7 #8) — 결제가 꺼져 있으면 이 목록도 자라지 않는데 그 사실을 말하지 않는다 |
| FS-072-EL-023 | FS-072-SEC-06 | 조회 실패 배너 | 배너 | `loadError = orders.error ?? shipments.error`(`:153`)가 null 이 아니면 요약·선택바·표를 대체하는 위험 톤 `Alert` '배송 목록을 불러오지 못했습니다.' + '다시 시도'(**두 조회를 함께 refetch** — `:474-489`) | O | 비표시. **어느 쪽이 실패했는지 말하지 않는다** — 주문 조회와 배송 건 조회가 한 문구로 뭉개진다(§7 #2). 상태코드도 가르지 않는다(§7 #9) |
| FS-072-EL-024 | FS-072-SEC-07 | 배송준비중 확인 다이얼로그 | 모달 | `ConfirmDialog intent="update"` 제목 '배송준비중 일괄 처리'(`:492-507`). 문구 두 갈래: 전건 적격이면 '선택한 주문 N건을 배송준비중으로 진행합니다. 주문 상태는 되돌릴 수 없습니다.', 아니면 '선택한 N건 중 M건만 … 나머지는 이미 지난 단계이거나 입금이 확인되지 않은 주문입니다.' 확인 라벨 `M건 처리` | O | **제외 사유를 함께 말한다.** 다만 여기서는 도메인 상수를 인용하지 않고 **문장을 화면이 직접 썼다**(`:499`) — 주문 목록은 `ORDER_TRANSITION_UNPAID` 를 그대로 인용한다(`OrderListPage.tsx:385`). §7 #11 |
| FS-072-EL-025 | FS-072-SEC-07 | 배송준비중 실행 | 텍스트 | `runPrepare`(`:242-254`): 행마다 `applyOrderStatus(row.order,'preparing',at,'운영자')` → `updateOrder.mutateAsync`. 성공 문구 `N건을 배송준비중으로 처리했습니다.` | O | 비표시 규칙. **주문 축만 움직인다** — 배송 건은 아직 없다(주석 `:241`). `at` 을 루프 밖에서 한 번 만든다(`:243`) |
| FS-072-EL-026 | FS-072-SEC-08 | 송장 일괄 입력 모달 | 모달 | `InvoiceBulkDialog`(`:509-521` ← `InvoiceBulkDialog.tsx:196-313`). `Modal title="송장 일괄 입력"`, `onSubmit={submit}`, `initialFocusRef` 가 **첫 송장번호 입력**(`:200,290`). footer: '취소' / primary `N건 송장 등록`(진행 중 '등록 중…')(`:201-210`) | O | **엑셀 업로드가 아닌 이유가 코드에 있다**(`:3-6`): 파일 왕복은 규격·인코딩·매핑 실패라는 세 겹의 예외를 새로 만들고, 백엔드 없이 흉내 내면 '되는 것처럼 보이지만 아무 데도 닿지 않는' 화면이 된다. 열 건 스무 건은 화면 안 표 입력이 오히려 빠르다(§7 #1) |
| FS-072-EL-027 | FS-072-SEC-08 | 택배사 부재 경고 | 배너 | **두 갈래를 가른다**(`InvoiceBulkDialog.tsx:215-225`): `carriers === null`(**조회기 미배선 — '모른다'**) → warning '택배사 목록을 확인하지 못해 송장을 등록할 수 없습니다. 잠시 후 다시 시도해 주세요.' / `options.length === 0`(**정말 없다**) → warning '사용 중인 택배사가 없습니다. 상품 관리 > 배송에서 택배사를 먼저 등록해 주세요.' | O | 비표시 기본. **`activeCarriers()` 가 빈 배열이 아니라 null 을 주기 때문에 가능한 분기다**(`shipment.ts:77-91`): 전자는 운영자가 할 일이 없고 후자는 있다. 화면 주석이 같은 것을 말한다(`ShipmentListPage.tsx:512-513`) |
| FS-072-EL-028 | FS-072-SEC-08 | 주문별 입력 줄 | 입력 | 행마다 `<li>`: 주문번호 + `<수령인> · 남은 품목 N개`(`:238-246`), 그 아래 **택배사 `SelectField`**(시각 숨김 label `<주문번호> 택배사` — `:250-270`)와 **송장번호 `<input inputMode="numeric" maxLength={INVOICE_NO_MAX}>`**(=30 — `shipment.ts:241`, placeholder '숫자와 하이픈(-)만', 시각 숨김 label — `:274-294`). 폭 비율 1:2(`:94-99`) — 송장번호가 잘리면 오입력을 눈으로 잡을 수 없다 | — | 초기 택배사는 **목록의 첫 줄**이고 목록이 비면 `''`(`:127`) — **임의의 택배사를 골라 두지 않는다**(주석 `:124-126`): 그러면 운영자가 확인하지 않은 값으로 송장이 등록된다. 오류가 있으면 `aria-invalid` + `aria-describedby={errorIdOf(inputId)}` 짝(`:286-288`)과 `<p role="alert">`(`:298-302`) |
| FS-072-EL-029 | FS-072-SEC-08 | 송장 검증 규칙 | 텍스트 | `validate()`(`:153-181`)가 줄마다 **넷을 순차로** 본다: ① 택배사 미선택 → '택배사를 선택하세요.' ② `invoiceNoBlock`(`shipment.ts:263-269`) → 빈 값 '송장번호를 입력하세요.' / 30자 초과 / **형식** `INVOICE_NO_RE = /^\d(?:[\d-]*\d)?$/`(`:250`) 위반 시 '송장번호는 숫자와 하이픈(-)만 입력할 수 있습니다. 한글·공백이 섞이면 택배사 접수 파일이 깨집니다.' ③ `duplicateInvoiceBlock(existing, entry)`(`shipment.ts:282-297`) → '이미 `<주문번호>` 주문에 쓰인 송장번호입니다…' ④ **이 다이얼로그 안의 다른 줄**과 중복 → '이 다이얼로그의 `<주문번호>` 줄과 송장번호가 같습니다.' | — | 비표시 규칙. **왜 이렇게 좁히는지가 코드에 있다**(`shipment.ts:246-248`): 국내 송장번호는 전부 숫자이고 운영자는 엑셀에서 복사해 붙여 넣는데, 한글·공백이 섞이면 **택배사 접수 파일이 그 행에서 깨지고 그것을 아는 시점은 이미 물건이 나간 뒤다**. **중복은 같은 택배사 안에서만 금지한다**(`shipment.ts:276-280`) — 번호 체계가 택배사마다 따로라 다른 택배사에서 같은 숫자가 나오는 것은 정상이고, 실제 사고는 앞 주문의 송장을 복사해 다음 행에 붙여 넣는 것이다. 회귀 `shipments.test.ts:89`. **정규화는 앞뒤 공백만** 떼어 낸다(`:257-260`) — 가운데 공백은 오류이지 정리 대상이 아니다(조용히 고치지 않는다) |
| FS-072-EL-030 | FS-072-SEC-08 | 제출 규칙 (전부 아니면 전무) | 텍스트 | `submit()`(`:183-190`): `validate()` 결과가 하나라도 있으면 `setErrors` 만 하고 **아무것도 저장하지 않는다**. 통과하면 전 줄을 `normalizeInvoiceNo` 해 넘긴다 | O | 비표시 규칙. **한 줄이라도 틀리면 아무것도 저장하지 않는다**(`:8-9`) — 절반만 들어가면 어느 주문에 송장이 붙었는지 다시 세어야 하고, 그 확인은 이 다이얼로그를 다시 여는 것으로만 된다. 오류는 **제출을 눌렀을 때만** 채워진다(`:132`) — 치는 도중 붉게 물들이지 않는다 |
| FS-072-EL-031 | FS-072-SEC-08 | 송장 등록 실행 | 텍스트 | `runInvoice(entries)`(`:263-296`): 항목마다 ① `Shipment` 초안을 만든다 — **남은 잔량 전부를 이 송장에 싣는다**(`row.remaining` — `:278`), `status:'waiting'`, `shippedAt:''` ② `createShipment.mutateAsync` ③ 그 초안을 더한 배열로 `orderShipmentBlock(row.order, next, 'waiting')` 을 물어 **null 이면** 주문을 `waiting` 으로 민다(`:287-292`) | O | 비표시 규칙. **주문을 미는 판정을 화면이 직접 하지 않는다**(`:256-262`) — '전 품목이 덮였는가'는 SKU 단위 셈이고 정본은 도메인이다. **한 주문에 송장 둘을 나눠 붙이는 것은 다음 회차다**(주석 `:277`) — 이 화면에서는 잔량을 쪼갤 수 없다(§7 #1). 성공 문구 `N건에 송장을 등록했습니다. 발송처리하면 배송중이 됩니다.` |
| FS-072-EL-032 | FS-072-SEC-08 | 하단 안내문 | 텍스트 | '송장을 등록하면 배송대기가 됩니다 — **아직 나간 것이 아닙니다.** 실제 발송은 목록에서 `발송처리`를 눌러야 기록됩니다.'(`:308-311`) | — | **두 조작이 다르다는 사실을 그 자리에서 다시 말한다** |
| FS-072-EL-033 | FS-072-SEC-09 | 발송처리 확인 다이얼로그 | 모달 | `ConfirmDialog intent="update"` 제목 '발송처리'(`:523-534`). 문구 '선택한 N건을 발송처리합니다. **전 품목이 나간 주문만 배송중이 되고, 일부만 나간 주문은 발송대기에 남습니다.** 이 작업은 되돌릴 수 없습니다.' 확인 라벨 `N건 발송처리` | O | **결과가 행마다 다를 수 있다는 사실을 미리 말한다** |
| FS-072-EL-034 | FS-072-SEC-09 | 발송처리 실행 | 텍스트 | `runDispatch`(`:305-345`): 행마다 ① `canDispatchShipment` 을 통과하는 배송 건을 `applyShipmentStatus(shipment,'shipping',at)`(`shipment.ts:479-493`)로 옮겨 **병렬로** 저장(`Promise.all` — `:314-322`) ② `applyShippedQuantities(row.order.lines, next)`(`shipment.ts:394-400`)로 **주문 품목의 `shippedQuantity` 를 다시 계산** ③ `orderShipmentBlock(withQuantities, next, 'shipping')` 이 null 이면 주문을 `shipping` 으로 옮기고, 아니면 **수량만 반영한 주문**을 저장(`:331-341`) | O | 비표시 규칙. **주문이 '배송중'이 되는 것은 전 품목이 실제로 나갔을 때뿐이다**(`:298-303`). 일부만 나간 주문은 **상태를 그대로 두고 `shippedQuantity` 만 올라가며**, 그 사실을 주문 목록의 '부분배송 1/3' 배지가 말한다 — **부분발송을 상태로 만들지 않는 것이 주문 도메인의 전제(한 주문 = 한 상태)를 지키는 방법이다.** `applyShipmentStatus` 는 **이미 찍힌 시각을 덮지 않는다**(`shipment.ts:485-492`) |
| FS-072-EL-035 | FS-072-SEC-10 | 송장 모달 파기 확인 | 모달 | `useModalDirtyGuard(dirty && !busy, onCancel)`(`InvoiceBulkDialog.tsx:138`). `dirty` = **송장번호를 한 칸이라도 쳤는가**(`:137`). '취소'·`onClose` 가 `requestClose` 를 지난다(`:198,203`) | — | 비표시. **`discardDialog` 를 모달 밖에 렌더한다**(`:315-316`) — 안에 두면 모달의 포커스 트랩이 확인 다이얼로그를 가둔다 |
| FS-072-EL-036 | FS-072-SEC-04 | 일괄 작업 취소·abort 규칙 | 텍스트 | `closeAction`(`:194-200`)이 `controllerRef.current?.abort()` 후 상태를 지운다. `.then` 은 `signal.aborted` 면 즉시 return, `.catch` 는 `isAbort` 면 무시 | — | 비표시 규칙. **abort 는 실패로 통지되지 않는다** |
| FS-072-EL-037 | FS-072-SEC-04 | 선택 해제 규칙 | 텍스트 | 필터·검색어가 바뀌면 선택이 지워진다 — `useListState` 의 `viewSignature`(`useListState.ts:207-213`). 이 화면은 그 선택 집합을 **직접** 쓴다(`:135,172,462`) | — | 비표시 규칙. FS-050 이 놓친 STATE-04 결함이 여기서는 발현되지 않는다 |
| FS-072-EL-038 | (도메인) | 택배사 카탈로그 조회기 | 텍스트 | `carrierCatalog()`(`shipment.ts:83-85`) / `activeCarriers()`(`:88-91`, `active` 만) / `findCarrier(id)`(`:94-98`) / `carrierNameOf(id)`(`:101-103`). 배선은 `wiring.ts:172` `registerCarrierCatalogLookup(listShippingCarriers)` | O | 비표시 규칙. **배선 전에는 null('모른다')** 이다(`:77-82`) — 화면은 '등록된 택배사가 없습니다'와 '목록을 아직 못 읽었습니다'에 서로 다른 답을 해야 한다(EL-027). 회귀 `shipments.test.ts:229,233` |
| FS-072-EL-039 | (도메인) | 택배사 사용 건수 조회기 (역방향) | 텍스트 | `countShipmentsByCarrier(carrierId)`(`data-source.ts:120-122`) → `wiring.ts:173` `registerCarrierUsageLookup` → 배송 정책 화면의 삭제 가드 `carrierDeleteBlock`(`shipment.ts:154-163`) | O | 비표시 규칙. **방향이 반대인 두 번째 조회기다**(`shipment.ts:122-125`). **미배선은 '삭제 가능'이 아니라 fail-closed 로 막는다**(`:150-152,158`). **⚠ 어댑터가 아니라 `SHIPMENT_SEED` 를 센다**(`data-source.ts:121`) — 방금 등록한 송장이 삭제 가드에 즉시 반영되지 않는다(`:115-118` 이 그 한계를 명시). 회귀 `shipments.test.ts:94` |

## 4. 예외 명세

| 요소번호 | 빈 상태 | 로딩 | 실패 | 유효성 | 권한없음 | 경합 | 대량 |
|---|---|---|---|---|---|---|---|
| FS-072-EL-001 / EL-002 | N/A — 정적 문구 | 로딩 중에도 표시(레일은 그리드 밖) | 조회 실패에도 남는다 — 배너는 우측 컬럼만 대체한다 | N/A — 입력 없음 | 언제나 표시 | N/A — 상태 없음 | 고정 문구. EL-002 의 링크는 **read 권한을 묻지 않는다** |
| FS-072-EL-003 | N/A — 조건부 문구 | 권한은 동기 판정 | N/A | N/A | **이것이 권한 없음 표현 자체** | N/A | 고정 문구 |
| FS-072-EL-004 / EL-008 | 그 갈래가 0건이면 항목은 남고 배지가 0 | 조회 중에도 조작 가능(결과 0행) | N/A — 클라이언트 필터 | `parseFilter` 가 모르는 값을 '전체'로 되돌린다 | §4.1 — read 로만 게이팅 | URL 이 원천. **필터를 바꾸면 선택이 지워진다**(EL-037) | 항목 5개 고정 |
| FS-072-EL-005 | 0건이면 '0' | **아직 못 셌으면 `'—'`** | 실패해도 `'—'` | N/A — 표시 전용 | §4.1 적용 | 재조회 때 다시 센다 | 행 수에 선형 |
| FS-072-EL-006 / EL-007 / EL-020 | 처리 대상 주문이 없으면 행 0개 | 두 조회가 모두 도착해야 행이 완성된다 — 하나만 오면 커버리지가 어긋난다 | N/A — 순수 함수 | N/A — 입력 없음 | N/A | **주문과 배송 건이 각각 캐시되므로 한쪽만 갱신된 중간 상태가 있을 수 있다**(§7 #2) | 행마다 `shipmentCoverage`·`uninvoicedLines` 를 각각 계산하고 그 안에서 `allocateCovered` 가 두 번 돈다 — 주문수 × 품목수 × 배송건수 |
| FS-072-EL-009 | 0행이면 '조건에 맞는 배송 건 결과가 없습니다.' | 최초 로드 중 **침묵** | '배송 건 목록을 불러오지 못했습니다.' | N/A — 표시 전용 | §4.1 적용 | 건수가 바뀌면 다시 announce | 건수만 읽는다. **세는 단위가 실제 행(주문)과 다르다**(§7 #4) |
| FS-072-EL-010 | 0건이면 '전체 0건' | 최초 로드만 '불러오는 중…'. 재조회는 건수 유지 + ' · 새로고침 중…' | 조회 실패 시 EL-023 이 이 줄을 대체 | N/A — 입력 없음 | §4.1 적용 | **`refreshing` 이 두 조회의 OR** — 한쪽만 돌아도 표시된다 | `formatNumber` |
| FS-072-EL-011 / EL-012 | 매치 0건이면 EL-022 의 '검색 결과 없음' 분기 | 조회 중에도 입력 가능 | N/A — 서버 호출 없음 | 자유 텍스트. 제약 없음. 앞뒤 공백 제거 | §4.1 적용 | URL 이 원천. 조합 중 커밋 금지 | 행마다 자기 배송 건 배열까지 훑는다 — 행수 × 배송건수. 디바운스가 묶는다 |
| FS-072-EL-013 | N/A — 규칙 | N/A — 동기 | N/A | 알 수 없는 값은 EL-008 이 정규화 | §4.1 적용 | **이것이 경합 대비 자체** | URL 파라미터 2개 |
| FS-072-EL-014 | 선택 0건이면 렌더되지 않는다 | 조회 중에도 선택 가능 | 실패 시 화면이 배너로 대체돼 사라진다 | N/A — 입력 없음 | **`canUpdate` 가 false 면 통째로 없다** | 필터·검색이 바뀌면 선택이 지워진다 | 전체 선택이 **보이는 행만** 담는다 |
| FS-072-EL-015 | 적격 0건이면 `disabled` | 일괄 진행 중 3개 전부 `disabled`(`busy`) | 실행 실패는 EL-024 다이얼로그 안 배너 | **적법성은 주문 도메인 술어가 사전에 센다** | 렌더되지 않는다 | 저장 시점에 `applyOrderStatus` 가 다시 막는다 — 그 사이 상태가 옮겨졌으면 그 건만 실패 | 선택 수에 선형(렌더마다) |
| FS-072-EL-016 | 잔량 있는 행이 0이면 `disabled` | 위와 같다 | 모달 안에서 처리(EL-027 · EL-031) | 잔량 판정은 `uninvoicedLines` | 렌더되지 않는다 | 모달을 여는 시점의 `rows` 스냅숏으로 줄을 만든다 — 그 사이 다른 관리자가 송장을 붙였으면 중복 검사(EL-029 ③)가 **저장 전 목록으로만** 판정하므로 놓칠 수 있다(§7 #7) | 선택 수에 선형 |
| FS-072-EL-017 | 발송 가능한 배송 건이 없으면 `disabled` | 위와 같다 | 실행 실패는 EL-033 다이얼로그 안 배너 | **송장 없는 건은 술어가 사전에 제외한다**(`SHIPMENT_DISPATCH_NO_INVOICE`) | 렌더되지 않는다 | `applyShipmentStatus` 가 저장 시점에 다시 막는다(던진다 — `shipment.ts:481`) | 행마다 배송 건 전부를 훑는다 |
| FS-072-EL-018 | `items.length === 0` 이면 즉시 반환 | `busy` 가 다이얼로그의 확인 버튼을 잠근다 | **부분 실패를 건수로 보고하고 다이얼로그를 유지**한다. 전체 실패는 '처리하지 못했습니다.' | N/A — 입력 없음 | N/A | **전건 성공에만** 선택을 지우고 닫는다 | **상한·진행률·취소 UI 없음.** N건을 병렬로. **멱등키 없음**(§7 #7) |
| FS-072-EL-019 | 0행이면 EL-022 로 본문 대체 | EL-021 스켈레톤 | EL-023 배너가 표를 대체 | N/A — 표 자체 입력 없음 | caption 이 권한에 따라 갈린다 | 조회 시점 스냅샷 | **상한 없음 — 페이지네이션이 없다**(§7 #5) |
| FS-072-EL-019.1 | 행 없으면 없음 | 스켈레톤 행에는 없다 | 실패 시 미표시 | N/A — 이진 선택 | `selectable=false` 면 열 자체가 없다 | 조건이 바뀌면 선택이 지워진다 | 전체 선택이 보이는 행 전부를 담는다 |
| FS-072-EL-019.2 | 행 없으면 없음 | 스켈레톤 | 실패 시 미표시 | N/A — 표시 전용 | 언제나 표시 | 정렬이 바뀌면 다시 매겨진다 | 페이징 도입 시 공식이 틀어진다 |
| FS-072-EL-019.3 / .9 | 행 없으면 없음 | 스켈레톤 | N/A — 라우터 내부 이동 | N/A — 입력 없음 | **read 로만 게이팅** — 조회 전용 역할도 주문 상세에 간다 | 이미 없는 주문이면 주문 상세가 404 | 행마다 링크 1개 |
| FS-072-EL-019.4 / .5 | 빈 문자열이면 빈 칸 · 품목 0건이면 '품목 없음' | 스켈레톤 | 실패 시 미표시 | N/A — 표시 전용 | 언제나 표시 | 조회 시점 값 | 품목 요약은 한 줄로 자른다 |
| FS-072-EL-019.6 | 배송 건 0개면 `'—'` | 스켈레톤 | **조회기 미배선과 삭제된 택배사가 같은 문구('알 수 없는 택배사')로 뭉개진다**(§7 #3) | N/A — 표시 전용 | 언제나 표시 | 배송 정책에서 이름을 바꾸면 **이 열은 즉시 새 이름을 말한다**(id 참조라 스냅숏이 아니다) | 행마다 `Set` 1개 + 조회 1회 |
| FS-072-EL-019.7 | 배송 건 0개면 `'—'` | 스켈레톤 | **링크를 만들 수 없으면 번호만 그린다** — 깨진 링크를 내보내지 않는다 | 송장번호가 `isValidInvoiceNo` 를 통과하지 못하면 링크가 없다(`shipment.ts:118`) | 언제나 표시 | 템플릿이 바뀌면 즉시 반영된다 | 배송 건마다 한 줄. 여러 장이면 세로로 쌓인다(상한 없음) |
| FS-072-EL-019.8 | 행 없으면 없음 | 스켈레톤 | 실패 시 미표시 | N/A — 파생값 | 언제나 표시 | 조회 시점 값 | 배지 최대 2개. **배송대기와 배송중이 같은 info 톤**(§7 #12) |
| FS-072-EL-021 | N/A — 도착 전 상태 | **이것이 로딩 표현.** **두 조회 중 하나라도 최초 로드면 참**(`:149-151`) | 조회 실패 시 EL-023 으로 바뀐다 | N/A | 언제나 | 재조회에서는 발현되지 않는다 | 행 수는 DS `Table` 이 정한다 |
| FS-072-EL-022 | **이것이 빈 상태 표현 — 3분기** | 최초 로드 중에는 스켈레톤이 이긴다 | 조회 실패 시 EL-023 이 이긴다 | N/A | 언제나 | N/A — 표시 전용 | 1행. **결제 미사용 분기가 없다**(§7 #8) |
| FS-072-EL-023 | N/A — 실패 상태 | 재시도 중에도 배너가 유지된다 | **이것이 실패 표현.** 문구 1종 + '다시 시도'(두 조회 함께) | N/A | §4.1 — **403 도 이 배너**(§7 #9) | 재시도는 두 조회를 모두 재발행 | N/A — 표시 전용 |
| FS-072-EL-024 / EL-025 | 적격 0건이면 `runBulk` 가 즉시 반환 | `busy={busy}` — 확인 버튼 비활성 | **다이얼로그를 열어 둔 채** 배너. 재클릭이 재시도 | N/A — 입력 없음 | 여는 버튼이 없다 | 어댑터가 다시 술어로 막는다. 없는 id 면 409(`crud.ts:145`) | N건 병렬 PUT. 멱등키 없음 |
| FS-072-EL-026 / EL-028 | `rows` 가 비면 `<ul>` 이 비고 저장 버튼은 `0건 송장 등록` 이 된다(§7 #13) | `disabled={busy \|\| noCarriers}` 가 모든 입력·버튼에 걸린다 | 저장 실패는 모달 상단 `Alert`(`serverError` — `:213`) + 모달 유지 | 오류는 **제출 후에만** 표시(EL-030) | 여는 버튼이 없다 | 모달을 여는 시점의 스냅숏으로 줄을 만든다 | **줄 수 상한이 없다** — 선택 30건이면 30줄. 스크롤·가상화 없음(§7 #1) |
| FS-072-EL-027 | **이것이 택배사 부재 표현 — 2분기** | 배선 여부는 동기 판정 | **'모른다'(null)와 '없다'(빈 목록)를 문구로 가른다** | 택배사가 없으면 select 가 `택배사 없음` 하나만 갖고(`:262`) 저장 버튼이 잠긴다(`:206`) | N/A | 배송 정책에서 택배사를 지우면 다음 렌더에 반영된다 | 배너 1개 |
| FS-072-EL-029 / EL-030 | 빈 송장번호는 '송장번호를 입력하세요.' | 검증은 동기 | N/A — 서버 호출 없음 | **이것이 유효성 규칙 자체.** 줄마다 **첫 위반 하나만** 보인다(`continue`) | N/A | **중복 검사는 저장 전 원장으로만 한다** — 동시에 두 운영자가 같은 번호를 넣는 경합은 서버만 막을 수 있다(심 `data-source.ts:96-97`) | 줄 수 × 원장 크기(`existing.find` — `shipment.ts:289`) |
| FS-072-EL-031 | 잔량이 없는 행은 애초에 대상이 아니다 | `busy` 가 버튼을 잠근다 | **부분 실패는 건수로.** `row` 를 못 찾으면 **조용히 건너뛴다**(`:269` — 실패로 세지 않는다, §7 #14) | 검증은 EL-029 가 이미 끝냈다 | N/A | `orderShipmentBlock` 이 저장 직전에 다시 판정한다. **create 는 성공했는데 update 가 실패하면 송장만 남고 주문 상태가 안 옮겨진다**(§7 #2) | 항목마다 POST 1건 + 조건부 PUT 1건 |
| FS-072-EL-032 | N/A — 정적 문구 | 언제나 표시 | N/A | N/A | N/A | N/A | 고정 문구 |
| FS-072-EL-033 / EL-034 | 대상 0건이면 즉시 반환 | `busy` | **부분 실패는 건수로.** 배송 건 저장이 실패하면 그 행 전체가 실패로 센다 | 술어가 사전에 걸렀다 | 여는 버튼이 없다 | `applyShipmentStatus` 가 저장 시점에 던진다. **배송 건 여러 장의 PUT 이 `Promise.all` 이라 일부만 성공할 수 있고**, 그러면 주문 갱신은 실행되지 않는다(`await` 가 reject) — §7 #2 | 행마다 배송건수만큼 PUT + 주문 PUT 1건 |
| FS-072-EL-035 | 아무것도 치지 않았으면 가드가 걸리지 않는다 | 저장 중에는 가드 비활성(`dirty && !busy`) | N/A — 서버 호출 없음 | N/A | N/A | N/A | **모달 밖에 렌더된다** — 포커스 트랩과 충돌하지 않는다 |
| FS-072-EL-036 | N/A — 진행 요청이 있어야 성립 | **이것이 취소 규칙** | **abort 는 실패가 아니다** | N/A | N/A | 이미 서버에 닿은 요청은 되돌리지 않는다 | 컨트롤러 1개 — 배치 전체가 함께 취소된다 |
| FS-072-EL-037 | N/A — 선택이 있어야 의미 | N/A — 동기 | N/A | N/A | N/A | **이것이 경합 대비 자체** | 서명이 실제로 바뀔 때만 지운다 |
| FS-072-EL-038 | 등록된 택배사가 0이면 빈 배열 | N/A — 동기 | **미배선은 null('모른다')** — 실패가 아니다 | N/A | N/A | 배송 정책의 변경이 즉시 보인다(같은 조회기를 통과한다) | 카탈로그 전체를 매 호출 필터링(`:90`) |
| FS-072-EL-039 | 그 택배사로 나간 건이 없으면 0 | N/A — 동기 | **미배선은 null → 삭제를 막는다**(fail-closed) | N/A | N/A | **⚠ 시드를 세므로 방금 등록한 송장이 반영되지 않는다**(§7 #15) | 시드 전체를 매 호출 필터링 |

### 4.1 공통 예외 규칙

| 규칙 | 내용 |
|---|---|
| 네트워크 단절 | 조회 실패는 인라인 배너(EL-023), 일괄 처리 실패는 **그 다이얼로그 안 배너**(닫지 않는다), 송장 저장 실패는 모달 상단 `Alert`. **오프라인 감지·복귀 재조회는 앱 전역에 없다**(`navigator.onLine` 0건) — §7 #16 |
| 세션 만료 | 401 은 **앱 전역 인터셉터**(`shared/query/queryClient.ts:60,65-66`)가 통지하고 `/login?returnUrl=…&reason=session_expired` 로 보낸다. **송장 모달에 입력하던 값은 그때 사라진다** — 프로그램적 이동이라 EL-035 가드가 발화하지 않는다 |
| 요청 타임아웃 | 프론트 타임아웃 상한 없음(`AbortSignal.timeout` 0건). abort 는 다이얼로그 취소·`closeAction` 에서만 |
| 중복 제출 | **모든 쓰기에 멱등키가 없다**(`grep idempotencyKey pages/orders` = 0건) — `useCrudCreate`/`useCrudUpdate` 의 `idempotencyKey`(`crud.ts:323,345`)와 어댑터 원장(`crud.ts:67`)이 열려 있는데 넘기지 않는다. **송장 등록은 `create` 라 값이 멱등이 아니다** — 재시도가 같은 송장을 두 번 만들 수 있고, 그때 중복 검사(EL-029 ③)는 이미 지나간 뒤다. 다만 **서버의 `(carrierId, invoiceNo)` 유일 제약**이 그것을 막는 것이 설계다(심 `data-source.ts:96-97`) — §7 #7 |
| 실패 통지의 자리 | ① 조회 실패 = 인라인 배너(두 조회 공통) ② 일괄 처리 실패 = 그 다이얼로그의 배너 ③ 송장 검증 실패 = **그 줄의 `<p role="alert">`** ④ 성공 = 토스트 ⑤ abort = 아무것도 띄우지 않는다 |
| 낙관적 업데이트 | **이 화면에 없다.** 모든 쓰기가 비관적(응답 후 무효화)이다 |
| 동시 조회 | **두 조회가 이 화면을 만든다** — 주문(`ORDER_RESOURCE`)과 배송 건(`SHIPMENT_RESOURCE`)(`:145-146`). 각각 독립된 쿼리 키라 **한쪽만 갱신된 중간 상태가 존재한다.** `firstLoading`·`refreshing`·`loadError` 는 화면이 손으로 합성한다(`:149-153`). 둘 다 `placeholderData` 로 이전 값을 유지한다(`crud.ts:298`). 자동 재시도·창 포커스 재조회 없음 |
| 권한 없음 | 라우트 **read** 권한은 AppShell 의 `RequirePermission`(`AppShell.tsx:408-410`)이 가드한다. `/orders/shipments` 는 **사이드바 잎 자체**라 리소스가 정확히 자기다(`route-resource.ts:31-34` · `nav-config.ts:169`). **쓰기(update) 게이팅은 배선돼 있다** — `useRouteWritePermissions()`(`:133`)가 체크박스·일괄 바를 전부 가린다(EXC-03 충족). 서버 403 은 배너로 뭉개진다(§7 #9) |
| 렌더 예외 | AppShell 이 `<Outlet>` 바로 바깥에 `ErrorBoundary` 를 둔다(`AppShell.tsx:395-412`) |
| 두 어댑터의 경계 | **배송 어댑터는 주문을 고치지 않는다**(`data-source.ts:7-10`) — 주문 쓰기는 언제나 `orderAdapter` 를 지난다. 여기서 주문 저장소를 함께 만지면 **재고 부수효과(`orderAdapter.patch`)를 우회하는 경로가 생긴다.** 순서와 판정은 화면이 쥐고, 판정의 규칙은 `shared/domain/shipment.ts` 하나가 소유한다 |
| 상태 전이 | 배송 건은 `shipmentTransitionBlock`(`shipment.ts:450-461`) — 되돌리기 금지 + 송장 없이 발송 금지. 주문은 `orderShipmentBlock`(`:414-431`) — **주문 축을 먼저 묻고**(`orderTransitionBlock`) 그 위에 커버리지 하나만 얹는다. 시각 도장은 상태와 함께 찍히고 **이미 찍힌 것은 덮지 않는다**(`:485-492`) |
| 부분 발송 | **셈의 정본은 module-private `allocateCovered`(`shipment.ts:312-328`) 하나다.** 넘기는 배송 건 집합을 바꿔 두 질문에 답한다 — 전부를 넘기면 '송장이 다 붙었는가', 발송된 것만 넘기면 '실제로 다 나갔는가'(`:341-346`). 규칙이 하나라 두 답이 어긋날 수 없다. 품목 수량을 **넘겨 배정하지 않는다**(`:324`) — 과다 입력이 다른 품목까지 '발송됨'으로 만들면 창고에 남은 물건이 화면에서 사라진다. 품목이 0건인 주문은 `complete` 로 통과시키지 않는다(`:358`) |
| 선택 해제 | **규칙이 있다**(EL-037) |
| 목록 정렬·페이징 | 정렬은 주문 배열의 순서를 그대로 물려받는다(`types.ts:122-127`) — **이 화면 고유의 정렬도, 정렬 변경 UI 도, 페이징도 없다**(§7 #5) |

## 5. 서버 연동 지점

| 요소번호 | 이름 | 읽기/쓰기 | 필요 데이터 | 프론트 어댑터 | 비고 |
|---|---|---|---|---|---|
| FS-072-EL-005 ~ EL-023 | 주문 목록 조회 | R | 주문 전량 | `orderAdapter.fetchAll(signal)` ← `useCrudListQuery(ORDER_RESOURCE, orderAdapter)`(`ShipmentListPage.tsx:145`) | **행의 기반이다**(`types.ts:8-11`). 정본은 `pages/orders/data-source.ts` — 이 화면은 소비자다 |
| FS-072-EL-005 ~ EL-023 | 배송 건 목록 조회 | R | 배송 건 전량 | `shipmentAdapter.fetchAll(signal)` ← `useCrudListQuery(SHIPMENT_RESOURCE, shipmentAdapter)`(`:146`) | 심 `data-source.ts:95` `GET /api/shipments` |
| FS-072-EL-025 | 주문 상태 전이 — 배송준비중 | W | id + `OrderInput` 전체 | `orderAdapter.update`(`useCrudUpdate(ORDER_RESOURCE, …)` — `:185,247-251`) | **주문 어댑터를 지난다** — 재고 부수효과(`pages/orders/data-source.ts:44-59`)를 우회하지 않는다 |
| FS-072-EL-031 | 배송 건 생성(송장 등록) | W | `ShipmentInput`(orderId·carrierId·invoiceNo·lines·status·shippedAt·deliveredAt) | `shipmentAdapter.create`(`useCrudCreate` — `:186,284`) | 심 `data-source.ts:95-97`: '**POST 는 (carrierId, invoiceNo) 유일 제약을 서버에서도 건다** — 화면의 중복 검사는 사전 안내이고, 동시에 두 운영자가 같은 번호를 넣는 경합은 서버만 막을 수 있다(409)' |
| FS-072-EL-031 | 주문 상태 전이 — 배송대기 (조건부) | W | id + `OrderInput` 전체 | `orderAdapter.update`(`:288-292`) | **`orderShipmentBlock(row.order, next, 'waiting') === null` 일 때만 발행한다.** 송장이 전 품목을 덮지 않았으면 주문은 그대로 둔다 |
| FS-072-EL-034 | 배송 건 상태 전이(발송처리) | W | id + `ShipmentInput` 전체 | `shipmentAdapter.update`(`useCrudUpdate(SHIPMENT_RESOURCE, …)` — `:187,316-320`) | 행 안에서 **`Promise.all` 로 병렬**. 심이 여기를 고객 알림의 발화 지점으로 적어 둔다(`data-source.ts:98`) — **알림 자체는 아직 없다** |
| FS-072-EL-034 | 주문 갱신 — 출고 수량 + 조건부 배송중 | W | id + `OrderInput` 전체(`lines` 의 `shippedQuantity` 포함) | `orderAdapter.update`(`:337-341`) | **`shippedQuantity` 는 `applyShippedQuantities`(`shipment.ts:394`)의 결과다** — 화면이 세지 않는다. 전 품목이 나갔을 때만 `status: 'shipping'` 이 함께 실린다 |
| FS-072-EL-019.6 / EL-027 / EL-028 / EL-038 | 택배사 카탈로그 조회 | R | `Carrier[]` | **이 화면의 어댑터가 아니다** — `activeCarriers()`/`findCarrier()`(`shipment.ts:88,94`) ← `wiring.ts:172` ← `listShippingCarriers`(`pages/products/shipping/data-source.ts`) | **정본은 배송 정책 화면이다**(§1). 배선 전에는 null |
| FS-072-EL-039 | 택배사 사용 건수 (이 화면이 **제공**) | R | `number` | `countShipmentsByCarrier(carrierId)`(`data-source.ts:120-122`) → `wiring.ts:173` | **방향이 반대다** — 배송 정책의 삭제 가드가 이 원장에 묻는다. 심: `GET /api/shipments?carrierId=` 의 총건수 |
| — | **배송 건 삭제** | — | — | **없다.** `shipmentAdapter.remove` 를 부르는 화면이 없다 | 잘못 붙인 송장은 지우는 것이 아니라 다시 붙이는 것이고, 나간 배송의 기록은 남아야 한다(`data-source.ts:4-5`) |

> **현재 구현 상태 (백엔드 명세 참고)**: 백엔드는 없다. `shipmentAdapter` 는 공용 `createCrudAdapter`(`shared/crud/crud.ts:91-172`)에 시드 6건(`data-source.ts:29-91`)을 넣어 조립되고, 정렬은 **`shippedAt` 내림차순 — 아직 안 나간 건(`''`)이 가장 위**다(`:107-109`, '그것이 오늘 할 일이다'). 시드는 주문 픽스처의 **실제 주문번호와 SKU** 를 쓴다(`:17-27`): 커버리지 판정이 SKU 로 대조하므로 **한 글자라도 다르면 그 주문은 영원히 '발송대기'에 남고 화면은 멀쩡해 보이는데 아무 버튼도 듣지 않는다.** 회귀가 그 대조를 못 박는다(`shipments.test.ts:65,72,83,89,94`). 네 갈래를 전부 덮는 픽스처다(`:23-27`, 회귀 `:153`). **연동 지점은 심 한 곳**(`data-source.ts:95-98`)이며 유일 제약·알림 발화 지점을 함께 적는다. 위 표는 백엔드 연결 후 의도된 동작이다.

## 6. 자기 점검 (제출 전 확인)

- [x] 구현 소스를 전수 대조했다 — `ShipmentListPage.tsx`(537행) · `types.ts`(220행) · `data-source.ts`(122행) · `components/{ShipmentTable,InvoiceBulkDialog}.tsx`(209 · 319행) · `shipments.test.ts`(237행), **도메인** `shared/domain/shipment.ts`(494행) 전문, 그리고 경계 상대(`pages/orders/{data-source,types}.ts` · `pages/products/shipping/components/CarrierSection.tsx` · `wiring.ts:172-173`)
- [x] **상세 라우트가 실제로 없음을 코드로 확인**했다 — `App.tsx:306-313` 전수에 `/orders/shipments/:id` 가 없고, 행 클릭·주문번호 링크가 **주문 상세**로 감을 확인했다(`ShipmentTable.tsx:147,187-189` ← `ShipmentListPage.tsx:459`). 그 판단의 근거 주석(`ShipmentTable.tsx:8-9`)도 함께 인용했다
- [x] **택배사 목록의 소유자가 이 화면이 아님을 코드로 확인**하고 §1 범위 밖에 적었다 — 원장은 `pages/products/shipping/components/CarrierSection.tsx`(등록·수정·삭제·사용여부), 이 화면은 조회기(`shipment.ts:57-103`)로만 닿으며 배선은 `wiring.ts:172`. **역방향 조회기(삭제 가드용 사용 건수)까지 확인**해 EL-039 · §5 에 적었다
- [x] **행이 배송 건이 아니라 주문임을 코드와 회귀로 확인**했다(`types.ts:8-11,100-101,123-138` · `shipments.test.ts:112`) — 그리고 그 결정과 어긋난 문구·접근 이름(`ENTITY_LABEL = '배송 건'`)을 §7 #4 에 적었다
- [x] **부분 발송의 셈이 한 함수(`allocateCovered`)의 것임을 확인**했다 — module-private 이고(`shipment.ts:312`, export 되지 않는다) 그 위의 공개 함수 셋(`shipmentCoverage`·`uninvoicedLines`·`applyShippedQuantities`)이 전부 그것을 부른다. **주문의 `shippedQuantity` 가 `applyShippedQuantities` 의 결과이지 화면의 계산이 아님**을 §1 · EL-034 · §5 에 명시했다
- [x] **송장번호 규칙을 정확히 옮겼다** — `INVOICE_NO_RE = /^\d(?:[\d-]*\d)?$/`(`:250`, 양 끝은 숫자) · `INVOICE_NO_MAX = 30`(`:241`) · `invoiceNoBlock` 의 3분기(`:263-269`) · **중복은 같은 택배사 안에서만**(`duplicateInvoiceBlock:282-297`) · 정규화는 앞뒤 공백만(`:257-260`). 다이얼로그 안 줄 사이의 중복까지 보는 4번째 분기도 확인했다(`InvoiceBulkDialog.tsx:172-178`)
- [x] **주문 축과의 다리를 확인**했다 — `orderShipmentBlock`(`shipment.ts:414-431`)이 **가장 먼저** `orderTransitionBlock` 을 부르고(`:419`) 그 위에 커버리지 하나만 얹는다. 소비처 2곳(`ShipmentListPage.tsx:287,331`)을 대조했다
- [x] **쓰기 권한 게이팅이 배선돼 있음을 확인**했다(`:133,435,460`) — EXC-03 충족
- [x] **두 조회가 화면을 만든다는 사실과 그 합성이 손으로 이뤄짐**을 확인해(`:145-153`) §4.1 '동시 조회'와 §7 #2 에 적었다
- [x] 보이지 않는 요소(작업 상태 판정·행 대상 판정·행 모델 조립·URL 직렬화·라이브 리전·스켈레톤·빈 상태·검증·전부 아니면 전무 제출·일괄 마무리·abort·선택 해제·두 조회기)에 번호를 줬다
- [x] §4 예외 7축 빈칸 0건. 모든 `N/A` 에 사유
- [x] `[서버]` = O 요소가 §5 에 전부 요약됐다 — **한 조작이 두 어댑터를 순서대로 지나는 경로(송장 등록·발송처리)** 를 분리해 적고, 그 사이의 부분 실패를 §7 #2 에 남겼다
- [x] 엔드포인트·HTTP·에러코드·DB 스키마를 쓰지 않았다 (BE-072 영역) — 심의 유일 제약 문장은 **코드에 있는 예고**라 인용으로 표시했다

## 7. 미결 사항 (UI 기획 / 아키텍처 / 백엔드 명세 / 프론트 구현 이관)

| # | 내용 | 이관 대상 |
|---|---|---|
| 1 | **송장을 나눠 붙일 수 없다 — 부분 발송을 만들 수단이 화면에 없다.** 도메인은 부분 발송을 완전히 지원하지만(`allocateCovered`·`uninvoicedLines`·`shipmentCoverage`), 다이얼로그는 **남은 잔량 전부를 한 송장에 싣는다**(`ShipmentListPage.tsx:277-278` 주석이 '한 주문에 송장 둘을 나눠 붙이는 것은 다음 회차다'라고 스스로 적는다). 결과: 픽스처가 만들어 둔 부분발송 상태(`ORD-20260712-0031`)는 **화면에서 재현할 수 없고**, 세 품목 중 하나만 오늘 나가는 실제 운영을 이 화면으로 처리할 수 없다. 또 **줄 수 상한·스크롤·가상화가 없어** 선택 50건이면 50줄이 한 모달에 쌓인다 | **UI 기획 (최우선)** |
| 2 | **한 조작이 두 어댑터를 순서대로 지나는데 트랜잭션이 없다.** ① 송장 등록: `createShipment` 성공 → `updateOrder` 실패면 **송장만 남고 주문은 배송준비중에 머문다**(`:284-292`) ② 발송처리: 배송 건 PUT 여러 장이 `Promise.all` 이라 **일부만 성공할 수 있고**, 그러면 `await` 가 reject 해 주문 갱신(`shippedQuantity` 반영)이 **아예 실행되지 않는다**(`:314-341`) — 나간 배송 건과 주문의 출고 수량이 어긋난 채 남는다. 화면은 그 행을 '실패 1건'으로만 보고한다. 심이 트랜잭션을 예고하지 않는다(`data-source.ts:95-98` 은 유일 제약과 알림만 적는다) | **백엔드 명세 (트랜잭션 경계 — 최우선)** · 아키텍처 |
| 3 | **'택배사를 모른다'와 '택배사가 삭제됐다'가 표에서 뭉개진다.** `carrierNameOf`(`shipment.ts:101-103`)가 두 경우 모두 `'알 수 없는 택배사'` 를 준다 — `findCarrier` 는 미배선일 때도 없는 id 일 때도 null 이다(`:94-98`). **송장 다이얼로그는 그 둘을 정확히 가르는데**(EL-027) 표는 가르지 않는다. 운영자는 '지금 이 화면이 고장인가, 저 택배사가 지워졌나'를 구분할 수 없다 | UI 기획 · 프론트 구현 |
| 4 | **세는 단위가 실제 행과 다르다.** `ENTITY_LABEL = '배송 건'`(`:78`)이지만 행은 **주문**이다(§1). 그래서 라이브 리전이 '배송 건 5건을 찾았습니다'라고 말하는데 실제 배송 건은 8장일 수 있고, 체크박스 접근 이름도 `ORD-… 배송 건 선택`(`ShipmentTable.tsx:177`)이라 낭독이 어긋난다. 빈 상태도 '등록된 배송 건이 없습니다' 계열로 나온다 | UI 기획 (문구) |
| 5 | **페이지네이션·정렬 변경이 없다.** 표가 `visible` 전량을 렌더하고(`ShipmentTable.tsx:140`), `useListState` 의 `page`·`sort` 가 소비되지 않는다. **이 화면은 '오늘 할 일 목록'이라 건수가 곧 작업량인데**, 발송대기가 300건이면 300행이 한 화면에 그려지고 행마다 `allocateCovered` 가 두 번 돈다(`types.ts:134-135`). 마감 임박 순·주문일 오름차순으로 훑을 수도 없다(quality-bar IA-04 P0) | UI 기획 · 백엔드 명세 |
| 6 | **일괄 처리의 부분 실패가 건수만 말한다** — '3건을 처리하지 못했습니다'(`:230-232`)뿐이고 **어느 주문이 왜 실패했는지 말하지 않는다.** `settleAllDetailed` 는 사유를 함께 돌려주는데 화면이 `failed` 만 꺼내 쓴다(`:220`). 진행률·취소 UI 도 없다. 주문 목록(FS-071 §7 #7)과 같은 결함이다 | UI 기획 · 프론트 구현 |
| 7 | **멱등키가 없고, 여기서는 완화가 없다.** `grep idempotencyKey pages/orders` **0건**. 주문 쪽 쓰기는 전체 치환이라 값이 멱등이지만, **송장 등록은 `create` 라 재시도가 같은 송장을 두 번 만든다.** 화면의 중복 검사는 저장 전 원장으로만 하므로 그 재시도를 잡지 못한다. 지금은 서버가 없어 `(carrierId, invoiceNo)` 유일 제약도 없다 — **픽스처에서는 같은 송장 두 장이 실제로 만들어질 수 있다**(quality-bar EXC-08 P0) | 프론트 구현 · 백엔드 명세 |
| 8 | **'결제를 쓰지 않아 주문이 들어오지 않는다'는 사실을 이 화면은 말하지 않는다.** 주문 목록은 그 분기를 빈 상태의 네 번째 갈래로 갖는데(`OrderListPage.tsx:218-235`, `ordersCanArrive()`), 여기서는 `Empty` 3분기뿐이다(`:349-358`). 결제가 꺼져 있으면 이 목록도 자라지 않으므로 같은 사실이 필요하다 | UI 기획 |
| 9 | **실패가 상태코드를 가르지 않고, 두 조회의 실패도 가르지 않는다.** EL-023 이 `orders.error ?? shipments.error`(`:153`)를 한 문구로 뭉갠다 — 주문을 못 읽은 것과 배송 건을 못 읽은 것은 복구 방법이 다를 수 있다. 403/404/409/500 도 구분하지 않는다. `isForbidden`·`isConflict`·`isNotFound`(`shared/errors/http-error.ts`)가 이미 있다(quality-bar EXC-06 P1) | UI 기획 · 프론트 구현 |
| 10 | 대응 SCR 문서 부재 (주문 관리 SCR 미작성) | UI 기획 / 아키텍처 |
| 11 | **제외 사유 문구가 도메인 상수를 인용하지 않는다.** EL-024 의 '나머지는 이미 지난 단계이거나 입금이 확인되지 않은 주문입니다.'(`:499`)는 **화면이 직접 쓴 문장**이다. 주문 목록은 같은 자리에서 `ORDER_TRANSITION_UNPAID` 를 그대로 인용한다(`OrderListPage.tsx:385`). 규칙이 바뀌면 이쪽만 낡는다 | 프론트 구현 (경미) |
| 12 | **배지 색이 겹친다** — `waiting`(배송대기)과 `shipping`(배송중)이 둘 다 `info`(`types.ts:66-67`). 이 화면이 존재하는 이유가 **그 둘을 가르는 것**인데(§1) 색이 같다. 부분발송 배지도 발송대기와 같은 `warning` 이다 | UI 기획 |
| 13 | **`rows` 가 비어도 송장 모달이 열릴 수 있다.** 버튼은 `count === 0` 이면 잠기지만(`:443`), 열린 뒤 선택이 바뀌면 `entries` 는 **초기 렌더의 스냅숏**이라(`InvoiceBulkDialog.tsx:129-131`) 갱신되지 않는다. 저장 버튼 라벨이 `0건 송장 등록` 이 되는 경로가 구조적으로 열려 있고, `submit` 은 빈 배열을 통과시킨다(`:186`) | 프론트 구현 |
| 14 | **`runInvoice` 가 못 찾은 행을 조용히 건너뛴다** — `rows.find(...) === undefined` 면 `return`(`:268-269`) 하고, `settleAllDetailed` 는 그것을 **성공으로 센다.** 그래서 '3건에 송장을 등록했습니다' 토스트가 뜨는데 실제로는 2건일 수 있다. 지금은 도달하기 어려우나 조용한 성공이라 발견도 어렵다 | 프론트 구현 |
| 15 | **`countShipmentsByCarrier` 가 어댑터가 아니라 `SHIPMENT_SEED` 를 센다**(`data-source.ts:120-122`) — 그래서 **방금 등록한 송장이 배송 정책의 삭제 가드에 반영되지 않는다.** 그 상태에서 택배사를 지우면 그 송장은 이름도 추적 링크도 잃는다. 코드가 한계를 스스로 적어 두었고(`:115-118`) 주문의 `listOrderRefs` 가 같은 선택을 했다 | 백엔드 명세 · 아키텍처 |
| 16 | 프론트 타임아웃 상한 없음(`AbortSignal.timeout` 0건) · 오프라인 감지 없음(`navigator.onLine` 0건) · 세션 만료 리다이렉트가 송장 모달의 입력을 버린다(가드 미발화) | 프론트 구현 (quality-bar EXC-05 · EXC-11 · EXC-19) |
| 17 | **고객 알림이 없다.** 발송처리(`waiting → shipping`)가 알림의 발화 지점이라고 도메인(`shipment.ts:22`)과 심(`data-source.ts:98`)이 모두 적어 두었으나 **지금은 이력만 남는다.** 발송 알림 없이 송장만 등록되면 고객은 배송 여부를 스스로 확인해야 한다 | 백엔드 명세 · UI 기획 |
| 18 | **`specs/README.md` 가 이 화면을 모른다** — §2 번호 체계에 주문 관리 번호대(071–072)가 없고 §3 색인에 주문 관리 섹션이 없다. 이 배치는 `specs/orders/**` 밖을 고치지 않았다 | **명세 리뷰 (색인 갱신 — 후속)** |
