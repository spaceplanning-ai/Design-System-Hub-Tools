// 배송 정책 · 택배사 데이터 소스
//
// [백엔드 연동 지점] 정책은 단일 문서형 저장소(createDocumentStore)로 1건을 들고 fetch/save 를
// 흉내 낸다. 택배사는 행이 있는 목록이라 목록형 어댑터(createCrudAdapter)를 쓴다 — 같은 화면
// 안에 두 저장소가 사는 이유는 둘의 모양이 다르기 때문이지 화면이 둘이어서가 아니다.
import { createCrudAdapter, createDocumentStore } from '../../../shared/crud';
import type { Carrier, CarrierInput } from '../../../shared/domain/shipment';
import { DEFAULT_SHIPPING_POLICY } from './types';
import type { ShippingPolicyValues } from './validation';

export const shippingPolicyKey = ['shipping-policy'] as const;

// TODO(backend): GET/PUT /api/shipping-policy
export const shippingPolicyStore = createDocumentStore<ShippingPolicyValues>(
  'shipping-policy',
  DEFAULT_SHIPPING_POLICY,
);

/* ── 택배사 ──────────────────────────────────────────────────────────────── */

export const CARRIER_RESOURCE = 'shipping-carriers';

/**
 * 택배사 픽스처 — 실재하는 상호를 쓰지 않는다(리포 관례: 인물·업체는 전부 가상이다).
 *
 * 추적 URL 도 example.com 이다. 진짜 택배사 조회 주소를 넣으면 링크가 실제로 열리면서 '이 관리자가
 * 실 배송을 추적한다' 는 거짓 인상을 준다 — 여기서 하는 일은 템플릿 치환까지가 전부다(규칙 5).
 */
export const CARRIER_SEED: readonly Carrier[] = [
  {
    id: 'car-1',
    name: '가상택배',
    code: 'VIRTUAL',
    trackingUrlTemplate: 'https://tracking.example.com/virtual?invoice={{invoice}}',
    active: true,
  },
  {
    id: 'car-2',
    name: '한빛로지스',
    code: 'HANBIT',
    trackingUrlTemplate: 'https://tracking.example.com/hanbit?no={{invoice}}',
    active: true,
  },
  {
    id: 'car-3',
    name: '새벽퀵',
    code: 'DAWN-QUICK',
    // 추적 페이지가 없는 택배사도 있다 — 그때는 송장번호만 남기고 링크를 만들지 않는다.
    trackingUrlTemplate: '',
    active: true,
  },
  {
    id: 'car-4',
    name: '옛길택배',
    code: 'OLDROAD',
    trackingUrlTemplate: 'https://tracking.example.com/oldroad?invoice={{invoice}}',
    // 계약이 끝난 택배사 — 지우지 않고 끈다. 이 택배사로 나간 지난 배송 건이 이름을 잃지 않는다.
    active: false,
  },
];

let seq = CARRIER_SEED.length;

// TODO(backend): GET/POST /api/shipping/carriers · PUT/DELETE /api/shipping/carriers/:id
//   · DELETE 는 해당 택배사로 나간 배송 건이 있으면 409 로 거절한다(화면도 같은 규칙으로 막는다).
export const carrierAdapter = createCrudAdapter<Carrier, CarrierInput>({
  scope: CARRIER_RESOURCE,
  seed: CARRIER_SEED,
  build: (input) => {
    seq += 1;
    return { id: `car-${String(seq)}`, ...input };
  },
  patch: (carrier, input) => ({ ...carrier, ...input }),
  // 사용 중인 것이 위, 그다음 이름순 — 끈 택배사는 선택지에 없으므로 아래로 내린다.
  sort: (list) =>
    [...list].sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1;
      return a.name.localeCompare(b.name, 'ko');
    }),
});

/**
 * 다른 도메인이 택배사를 풀 때 쓰는 목록 — `src/wiring.ts` 가 이것을 조회기로 꽂는다.
 *
 * [왜 어댑터가 아니라 시드인가] createCrudAdapter 는 현재 목록을 밖에 내주지 않는다(비공개 클로저).
 * 픽스처 단계에서는 시드가 곧 카탈로그이며, 방금 추가한 택배사가 배송 처리 화면의 선택지에 즉시
 * 반영되지 않는 것이 그 한계다 — 주문(listOrderRefs)·쿠폰(listCatalogCoupons)이 같은 자리에서
 * 같은 선택을 해 두었다. TODO(backend): GET /api/shipping/carriers 응답으로 대체하면 사라진다.
 */
export function listShippingCarriers(): readonly Carrier[] {
  return CARRIER_SEED;
}
