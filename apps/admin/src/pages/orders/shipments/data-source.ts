// 배송 건 데이터 소스 어댑터
//
// [백엔드 연동 지점] 프레임워크 createCrudAdapter 에 시드를 넣는다. 목록은 fetchAll, 송장 등록은
// create, 발송처리·배송완료는 update 다. 삭제 UI 는 없다 — 잘못 붙인 송장은 지우는 것이 아니라
// 다시 붙이는 것이고(수정), 이미 나간 배송의 기록은 남아야 한다(감사 성격).
//
// [주문을 여기서 고치지 않는다] 배송이 주문 상태를 밀어야 할 때가 있지만(송장 완비 → 배송대기,
// 전량 발송 → 배송중), 그 쓰기는 **주문 어댑터**가 한다. 여기서 주문 저장소를 함께 만지면 같은
// 사실을 두 어댑터가 쓰게 되고, 재고 부수효과(orderAdapter.patch)를 우회하는 경로가 생긴다.
// 순서와 판정은 화면이 쥐고, 판정의 규칙은 shared/domain/shipment.ts 하나가 소유한다.
import { createCrudAdapter } from '../../../shared/crud';
import type { Shipment, ShipmentInput } from '../../../shared/domain/shipment';

export const SHIPMENT_RESOURCE = 'shipments';

/**
 * 배송 건 픽스처 — 주문 픽스처(ORDER_SEED)의 **실제 주문번호와 SKU** 를 쓴다.
 *
 * 번호만 맞추지 않고 품목·수량까지 맞춘 이유: 커버리지 판정(shipmentCoverage)은 SKU 로 대조하므로,
 * 여기 SKU 가 주문의 것과 한 글자라도 다르면 그 주문은 영원히 '발송대기' 에 남는다 — 화면은
 * 멀쩡해 보이는데 아무 버튼도 듣지 않는 상태가 되고, 원인은 픽스처에 있다.
 *
 * 네 갈래를 전부 덮는다:
 *   · 발송대기 — ORD-20260720-0002 · ORD-20260718-0004 (배송 건이 아예 없다)
 *   · 배송대기 — ORD-20260716-0005 (송장은 붙었고 아직 안 나갔다)
 *   · 부분발송 — ORD-20260712-0031 (패딩만 나갔고 티셔츠는 송장도 없다)
 *   · 배송완료 — ORD-20260710-0148 · 0092 · 0210 · 0177
 */
export const SHIPMENT_SEED: readonly Shipment[] = [
  {
    id: 'shp-0005-1',
    orderId: 'ORD-20260716-0005',
    carrierId: 'car-1',
    invoiceNo: '4415-2280-0091',
    lines: [{ sku: 'TRA-SNK-207-250', quantity: 1 }],
    status: 'waiting',
    shippedAt: '',
    deliveredAt: '',
  },
  {
    id: 'shp-0031-1',
    orderId: 'ORD-20260712-0031',
    carrierId: 'car-1',
    invoiceNo: '4415-2280-0072',
    // 부분발송 — 패딩만 실렸다. 티셔츠 2개는 아직 송장이 없다.
    lines: [{ sku: 'LMN-PAD-001-블랙-M', quantity: 1 }],
    status: 'shipping',
    shippedAt: '2026-07-13T01:00:00.000Z',
    deliveredAt: '',
  },
  {
    id: 'shp-0148-1',
    orderId: 'ORD-20260710-0148',
    carrierId: 'car-2',
    invoiceNo: '77024471',
    lines: [{ sku: 'TRA-SNK-207-260', quantity: 1 }],
    status: 'delivered',
    shippedAt: '2026-07-11T02:00:00.000Z',
    deliveredAt: '2026-07-12T07:30:00.000Z',
  },
  {
    id: 'shp-0092-1',
    orderId: 'ORD-20260708-0092',
    carrierId: 'car-1',
    invoiceNo: '8834-0217-0011',
    lines: [{ sku: 'NVA-TEE-014-화이트', quantity: 2 }],
    status: 'delivered',
    shippedAt: '2026-07-09T01:10:00.000Z',
    deliveredAt: '2026-07-10T05:20:00.000Z',
  },
  {
    id: 'shp-0210-1',
    orderId: 'ORD-20260705-0210',
    carrierId: 'car-2',
    invoiceNo: '33905521',
    lines: [{ sku: 'OBJ-BAG-338', quantity: 1 }],
    status: 'delivered',
    shippedAt: '2026-07-06T01:30:00.000Z',
    deliveredAt: '2026-07-07T04:05:00.000Z',
  },
  {
    id: 'shp-0177-1',
    orderId: 'ORD-20260703-0177',
    carrierId: 'car-1',
    invoiceNo: '7126-4408-0003',
    lines: [{ sku: 'CML-DNM-051-30', quantity: 1 }],
    status: 'delivered',
    shippedAt: '2026-07-04T00:40:00.000Z',
    deliveredAt: '2026-07-05T06:15:00.000Z',
  },
];

let seq = SHIPMENT_SEED.length;

// TODO(backend): GET /api/shipments · POST /api/shipments · PUT /api/shipments/:id
//   · POST 는 (carrierId, invoiceNo) 유일 제약을 서버에서도 건다 — 화면의 중복 검사는 사전 안내이고,
//     동시에 두 운영자가 같은 번호를 넣는 경합은 서버만 막을 수 있다(409).
//   · 발송처리(waiting → shipping)는 고객 알림의 발화 지점이다. 지금은 이력만 남는다.
export const shipmentAdapter = createCrudAdapter<Shipment, ShipmentInput>({
  scope: SHIPMENT_RESOURCE,
  seed: SHIPMENT_SEED,
  build: (input) => {
    seq += 1;
    return { id: `shp-${String(seq)}`, ...input };
  },
  patch: (shipment, input) => ({ ...shipment, ...input }),
  // 최근 발송이 위. 아직 안 나간 건(shippedAt='')은 가장 위에 모인다 — 그것이 오늘 할 일이다.
  sort: (list) =>
    [...list].sort((a, b) => (a.shippedAt < b.shippedAt ? 1 : a.shippedAt > b.shippedAt ? -1 : 0)),
});

/**
 * 이 택배사로 나간 배송 건수 — `src/wiring.ts` 가 배송 정책 화면의 삭제 가드에 조회기로 꽂는다.
 *
 * [왜 어댑터가 아니라 시드인가] createCrudAdapter 는 현재 목록을 밖에 내주지 않는다(비공개 클로저).
 * 픽스처 단계에서는 시드가 곧 원장이며, 방금 등록한 송장이 삭제 가드에 즉시 반영되지 않는 것이
 * 그 한계다 — 주문(listOrderRefs)이 같은 자리에서 같은 선택을 해 두었다.
 * TODO(backend): GET /api/shipments?carrierId= 의 총건수로 대체하면 사라진다.
 */
export function countShipmentsByCarrier(carrierId: string): number {
  return SHIPMENT_SEED.filter((shipment) => shipment.carrierId === carrierId).length;
}
