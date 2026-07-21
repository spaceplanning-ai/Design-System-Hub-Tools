// 배송 처리 화면의 표시 규칙 — 행 모델 · 필터 · 검색 · 집계 (순수)
//
// [무엇이 여기 있고 무엇이 도메인에 있나]
// 커버리지·송장 검증·전이 규칙은 **도메인**(shared/domain/shipment.ts)의 것이다 — 배송 정책 화면도
// 같은 규칙을 읽는다. 이 파일은 그 위에 **이 화면만의 것**을 얹는다: 좌측 필터의 네 갈래와 건수,
// 표에 쓰는 배지 색, 송장 열의 요약 문구, 검색 대상 필드.
//
// [행은 배송 건이 아니라 주문이다 — 이 파일에서 가장 중요한 판단]
// 이 화면이 답하는 질문은 '오늘 무엇을 내보내야 하는가' 다. 그 단위는 주문이다 — 배송 건을 행으로
// 삼으면 **송장이 아직 없는 주문이 목록에 아예 나타나지 않는다**(배송 건이 0개니까). 정작 할 일이
// 가장 많은 주문이 화면에서 사라지는 셈이다. 그래서 행은 주문이고, 배송 건은 그 주문에 딸린다.
import {
  dispatchedShipments,
  hasShipmentLeft,
  shipmentCoverage,
  canDispatchShipment,
  carrierNameOf,
  uninvoicedLines,
} from '../../../shared/domain/shipment';
import type { Shipment, ShipmentCoverage } from '../../../shared/domain/shipment';
import { canTransitionOrder } from '../../../shared/domain/order';
import type { Order } from '../../../shared/domain/order';
import type { StatusTone } from '../../../shared/ui';
import { isCanceled } from '../types';

/* ── 작업 상태 (좌측 필터의 네 갈래) ─────────────────────────────────────────
 *
 * 도메인의 ShipmentStatus 는 배송 건 하나의 상태(대기·중·완료)다. 여기 있는 것은 **주문 하나의
 * 작업 상태**라 값이 하나 더 있다 — 'pending'(발송대기), 곧 송장이 아직 다 붙지 않은 구간이다.
 * 그것은 배송 건의 상태가 아니라 '배송 건이 아직 없다' 는 사실이므로 도메인에 둘 자리가 없다. */

export type ShipmentWorkStatus = 'pending' | 'waiting' | 'shipping' | 'delivered';

export const SHIPMENT_WORK_ALL = 'all';

export type ShipmentWorkFilter = typeof SHIPMENT_WORK_ALL | ShipmentWorkStatus;

export const SHIPMENT_WORK_LABEL: Readonly<Record<ShipmentWorkStatus, string>> = {
  pending: '발송대기',
  waiting: '배송대기',
  shipping: '배송중',
  delivered: '배송완료',
};

interface WorkFilterDef {
  readonly id: ShipmentWorkFilter;
  readonly label: string;
}

/** 좌측 필터 항목 — 전체 · 네 갈래. 순서는 일이 흘러가는 순서다 */
export const SHIPMENT_WORK_FILTERS: readonly WorkFilterDef[] = [
  { id: SHIPMENT_WORK_ALL, label: '전체' },
  { id: 'pending', label: SHIPMENT_WORK_LABEL.pending },
  { id: 'waiting', label: SHIPMENT_WORK_LABEL.waiting },
  { id: 'shipping', label: SHIPMENT_WORK_LABEL.shipping },
  { id: 'delivered', label: SHIPMENT_WORK_LABEL.delivered },
];

/** 허용 값 목록 — parseFilter 가 손으로 고친 URL 을 여기로 되돌린다(캐스팅 금지) */
export const SHIPMENT_WORK_FILTER_VALUES: readonly ShipmentWorkFilter[] = SHIPMENT_WORK_FILTERS.map(
  (filter) => filter.id,
);

const WORK_TONE: Readonly<Record<ShipmentWorkStatus, StatusTone>> = {
  pending: 'warning',
  waiting: 'info',
  shipping: 'info',
  delivered: 'success',
};

export function shipmentWorkTone(status: ShipmentWorkStatus): StatusTone {
  return WORK_TONE[status];
}

export function shipmentWorkLabel(status: ShipmentWorkStatus): string {
  return SHIPMENT_WORK_LABEL[status];
}

/**
 * 이 주문의 작업 상태.
 *
 * [부분발송은 발송대기다] 일부만 나간 주문은 '배송중' 이 아니라 발송대기에 남는다 — 운영자에게
 * 남은 일이 있기 때문이다. 이 목록의 건수는 곧 **오늘 처리할 양**이어야 하고, 반쯤 끝난 일을
 * 완료 쪽에 놓으면 그 숫자가 거짓말이 된다. 얼마나 나갔는지는 표의 '부분발송 1/3' 배지가 말한다.
 */
export function shipmentWorkStatus(
  order: Pick<Order, 'lines'>,
  shipments: readonly Shipment[],
): ShipmentWorkStatus {
  // 송장이 전 품목을 덮지 않았으면 아직 내보낼 것이 남았다.
  if (!shipmentCoverage(order.lines, shipments).complete) return 'pending';
  if (shipments.every((shipment) => shipment.status === 'delivered')) return 'delivered';
  if (shipments.some((shipment) => hasShipmentLeft(shipment))) return 'shipping';
  return 'waiting';
}

/* ── 행 모델 ─────────────────────────────────────────────────────────────── */

export interface ShipmentRow {
  /** 행 id = 주문번호. 선택 상태(useListState)가 이 값으로 움직인다 */
  readonly id: string;
  readonly order: Order;
  readonly shipments: readonly Shipment[];
  readonly work: ShipmentWorkStatus;
  /** 송장이 덮은 정도 — 부분발송 배지의 근거 */
  readonly coverage: ShipmentCoverage;
  /** 아직 송장이 없는 잔량 — 비어 있으면 이 주문에 붙일 송장이 없다 */
  readonly remaining: readonly { readonly sku: string; readonly quantity: number }[];
}

/**
 * 이 주문이 배송 처리 대상인가.
 *
 * 취소된 주문과 입금 전 주문은 뺀다 — 전자는 나갈 일이 없고, 후자는 돈을 받기 전이라 나가면
 * 안 된다(orderTransitionBlock 이 같은 이유로 막는다). 목록에 남겨 두면 아무 버튼도 듣지 않는
 * 행이 쌓여 건수 배지가 할 일의 양을 말하지 못하게 된다.
 */
function isShippable(order: Order): boolean {
  return !isCanceled(order) && order.status !== 'pending';
}

/** 주문 + 배송 건 → 행 목록. 정렬은 주문 목록과 같다(주문이 온 순서대로 처리한다) */
export function buildShipmentRows(
  orders: readonly Order[],
  shipments: readonly Shipment[],
): readonly ShipmentRow[] {
  return orders.filter(isShippable).map((order) => {
    const own = shipments.filter((shipment) => shipment.orderId === order.id);
    return {
      id: order.id,
      order,
      shipments: own,
      work: shipmentWorkStatus(order, own),
      coverage: shipmentCoverage(order.lines, dispatchedShipments(own)),
      remaining: uninvoicedLines(order.lines, own),
    };
  });
}

export function filterRowsByWork(
  rows: readonly ShipmentRow[],
  filter: ShipmentWorkFilter,
): readonly ShipmentRow[] {
  if (filter === SHIPMENT_WORK_ALL) return rows;
  return rows.filter((row) => row.work === filter);
}

/** 좌측 필터의 건수 배지 — **필터 이전** 전체 집합에서 센다(키를 다 적은 Record) */
export function countRowsByWork(
  rows: readonly ShipmentRow[],
): Readonly<Record<ShipmentWorkFilter, number>> {
  const counts: Record<ShipmentWorkFilter, number> = {
    [SHIPMENT_WORK_ALL]: rows.length,
    pending: 0,
    waiting: 0,
    shipping: 0,
    delivered: 0,
  };
  for (const row of rows) counts[row.work] += 1;
  return counts;
}

/**
 * 주문번호·수령인·송장번호 검색(대소문자 무시).
 *
 * 송장번호를 검색 대상에 넣는 이유: 고객이 전화로 부르는 것은 주문번호이지만, 택배사가 부르는
 * 것은 송장번호다. 배송 사고 문의는 대개 후자로 들어온다 — 그때 이 화면에서 찾을 수 없으면
 * 운영자는 엑셀을 연다.
 */
export function searchShipmentRows(
  rows: readonly ShipmentRow[],
  keyword: string,
): readonly ShipmentRow[] {
  const needle = keyword.trim().toLowerCase();
  if (needle === '') return rows;
  return rows.filter(
    (row) =>
      row.id.toLowerCase().includes(needle) ||
      row.order.receiver.name.toLowerCase().includes(needle) ||
      row.shipments.some((shipment) => shipment.invoiceNo.toLowerCase().includes(needle)),
  );
}

/* ── 표시 ─────────────────────────────────────────────────────────────────── */

/** 택배사 열 — 배송 건이 없으면 '—', 여럿이면 첫 이름에 건수를 붙인다 */
export function carrierSummary(row: Pick<ShipmentRow, 'shipments'>): string {
  const [first] = row.shipments;
  if (first === undefined) return '—';
  const names = new Set(row.shipments.map((shipment) => shipment.carrierId));
  const label = carrierNameOf(first.carrierId);
  return names.size === 1 ? label : `${label} 외 ${String(names.size - 1)}곳`;
}

/** 부분발송 표기 — 부분이 아니면 null(붙일 배지가 없다) */
export function partialLabel(row: Pick<ShipmentRow, 'coverage'>): string | null {
  const { covered, total, partial } = row.coverage;
  if (!partial) return null;
  return `부분발송 ${String(covered)}/${String(total)}`;
}

/* ── 일괄 처리 대상 ──────────────────────────────────────────────────────────
 *
 * 버튼의 활성 조건과 저장의 허용 조건이 **같은 술어**를 읽는다 — 30건을 골라 눌렀는데 28건이
 * 조용히 거절당하는 일을 만들지 않는다(주문 목록의 eligibleForTransition 과 같은 규약). */

/** 배송준비중으로 옮길 수 있는 행 — 판정은 주문 도메인이 한다 */
export function eligibleForPreparing(rows: readonly ShipmentRow[]): readonly ShipmentRow[] {
  return rows.filter((row) => canTransitionOrder(row.order, 'preparing'));
}

/** 붙일 송장이 남아 있는 행 — 잔량이 없으면 다이얼로그에 줄을 만들 이유가 없다 */
export function eligibleForInvoice(rows: readonly ShipmentRow[]): readonly ShipmentRow[] {
  return rows.filter((row) => row.remaining.length > 0);
}

/** 지금 발송처리할 수 있는 행 — 송장이 붙은 배송대기 건이 하나라도 있어야 한다 */
export function eligibleForDispatch(rows: readonly ShipmentRow[]): readonly ShipmentRow[] {
  return rows.filter((row) => row.shipments.some((shipment) => canDispatchShipment(shipment)));
}
