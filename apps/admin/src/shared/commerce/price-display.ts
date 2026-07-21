// 가격 표시 — **상품 단위**의 두 번째 축
//
// ┌ 왜 축이 둘인가 ──────────────────────────────────────────────────────────┐
// │ 축 A `pgSellable` : 결제창을 열 수 있는가.  **사이트 전역**(payment-settings) │
// │ 축 B `priceDisplay`: 이 상품의 금액을 노출하는가. **상품 단위**(이 파일)      │
// │                                                                          │
// │ 둘을 하나로 묶으면 "PG 는 쓰지만 이 상품만 가격문의" 라는 흔한 운영을 표현할  │
// │ 수 없다 — 주문 제작·B2B 납품·시공처럼 견적이 있어야 값이 정해지는 상품은      │
// │ 결제를 켠 쇼핑몰에도 섞여 있다. 아임웹이 '가격 설정' 스위치를 상품마다 두고,   │
// │ 끄면 목록·상세 모두 금액 대신 '가격문의'(문구 편집 가능)를 보여 주는 이유다.   │
// └──────────────────────────────────────────────────────────────────────────┘
//
// [저장하지 않는다 — checkoutCta 와 같은 어법] 화면이 그리는 것은 `resolvePriceDisplay` 의
// 결과이지 어딘가 저장된 '표시 상태' 가 아니다. 전역 스위치를 내리는 순간 이미 등록된 수백 건이
// 낡은 값이 되는 일을 만들지 않는다(payment-settings.ts 의 checkoutCta 머리말과 같은 판단).
//
// [왜 shared 인가] 이 함수를 목록(ProductListPage)·폼(ProductPricingCards)·미리보기
// (ProductCardPreview)가 함께 쓴다. 화면마다 조건을 다시 쓰면 목록은 '가격문의' 인데 미리보기는
// 금액을 그리는 상태가 만들어진다 — 운영자는 어느 쪽이 고객이 보는 화면인지 알 수 없다.
import { pgSellable } from './payment-settings';
import type { PaymentSettings } from './payment-settings';

/** 금액을 그대로 보이는가(amount), 문구로 대체하는가(inquiry) */
export const PRICE_DISPLAYS = ['amount', 'inquiry'] as const;

export type PriceDisplay = (typeof PRICE_DISPLAYS)[number];

/** 운영자가 문구를 비워 두면 쓰는 기본값 — 국내 쇼핑몰이 공통으로 쓰는 낱말이다 */
export const DEFAULT_PRICE_INQUIRY_TEXT = '가격문의';

/** 대체 문구 길이 상한 — 목록 한 칸에 들어가야 한다(줄바꿈되면 표 높이가 행마다 달라진다) */
export const PRICE_INQUIRY_TEXT_MAX = 20;

/** 폼의 라디오 선택지 — 라벨·설명을 여기 한 벌만 둔다 */
export const PRICE_DISPLAY_OPTIONS: readonly {
  readonly id: PriceDisplay;
  readonly label: string;
  readonly hint: string;
}[] = [
  { id: 'amount', label: '금액 노출', hint: '판매가와 할인가를 그대로 보여 줍니다.' },
  {
    id: 'inquiry',
    label: '가격문의로 대체',
    hint: '목록·상세·미리보기의 금액 자리에 아래 문구가 대신 들어갑니다.',
  },
];

/** 상품이 들고 있는 가격 표시 정책 — Product.pricing 의 두 필드만 본다 */
export interface PriceDisplayPolicy {
  readonly priceDisplay: PriceDisplay;
  /** 금액 대신 보일 문구. 비어 있으면 기본값 */
  readonly inquiryText: string;
}

/**
 * 지금 이 상품의 금액 칸에 무엇이 들어가는가.
 *
 * 내보내지 않는다 — 호출부는 결과를 그대로 쓰고 타입 이름을 부르지 않는다(CheckoutCta 와 같은 규약).
 */
interface ResolvedPriceDisplay {
  readonly kind: PriceDisplay;
  /** kind === 'inquiry' 일 때 금액 자리에 들어갈 글자. amount 면 빈 문자열 */
  readonly text: string;
  /** 왜 지금 이 표시인지 — 폼의 힌트가 그대로 쓴다(운영자가 오해한 채 저장하지 않게) */
  readonly reason: string;
  /**
   * 할인·과세 입력을 잠글 것인가.
   *
   * **잠금은 값을 지우지 않는다** — '금액 노출' 로 되돌리면 저장된 할인율·과세 구분이 그대로
   * 살아난다. 지우면 되돌리는 순간 운영자가 예전 값을 기억으로 복원해야 한다.
   */
  readonly amountFieldsLocked: boolean;
}

/** 빈 문구는 기본값으로 — 목록 한 칸이 빈 채로 남는 것이 가장 나쁜 결과다 */
function textOf(policy: PriceDisplayPolicy): string {
  const trimmed = policy.inquiryText.trim();
  return trimmed === '' ? DEFAULT_PRICE_INQUIRY_TEXT : trimmed;
}

/**
 * 두 축을 합쳐 **금액 칸 하나**를 낸다.
 *
 * [전역이 이긴다] 결제창을 열 수 없으면(축 A) 상품이 '금액 노출' 이라고 말해도 금액을 그리지
 * 않는다 — 살 수 없는 상품의 가격표는 고객에게 "지금 결제된다" 는 거짓 신호다. 반대 방향은
 * 성립하지 않는다: PG 를 켜 두어도 상품이 '가격문의' 면 그 상품만 문구로 대체된다(축 B).
 */
export function resolvePriceDisplay(
  settings: PaymentSettings,
  policy: PriceDisplayPolicy,
): ResolvedPriceDisplay {
  if (!pgSellable(settings)) {
    return {
      kind: 'inquiry',
      text: textOf(policy),
      reason: '결제(PG)를 쓰지 않는 설정이라 모든 상품의 금액 자리에 문의 문구가 들어갑니다.',
      amountFieldsLocked: true,
    };
  }

  if (policy.priceDisplay === 'inquiry') {
    return {
      kind: 'inquiry',
      text: textOf(policy),
      reason: '이 상품은 금액 대신 문의 문구를 노출하도록 설정되어 있습니다.',
      amountFieldsLocked: true,
    };
  }

  return {
    kind: 'amount',
    text: '',
    reason: '판매가와 할인가를 그대로 노출합니다.',
    amountFieldsLocked: false,
  };
}
