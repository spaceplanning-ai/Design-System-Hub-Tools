// 두 축의 순수 규칙 — 가격 표시 파생 · 섹션 잠금 · 조건부 메뉴 가시성 · 값 보존
//
// 화면을 렌더하지 않는다. 이 파일이 지키는 것은 '무엇이 참인가' 이고, 그 답이 화면마다 갈리지
// 않게 하는 것이 두 축을 shared 에 둔 이유다.
import { describe, expect, it, afterEach } from 'vitest';

import {
  inquiryCountFor,
  inquiryMenuState,
  readInquiryBacklog,
  registerInquiryBacklogLookup,
  resetInquiryBacklogLookup,
} from './inquiry-backlog';
import type { InquiryBacklog } from './inquiry-backlog';
import { pgLock, PG_LOCK_SECTIONS } from './pg-lock';
import { DEFAULT_PAYMENT_SETTINGS, pgSellable } from './payment-settings';
import type { PaymentSettings } from './payment-settings';
import { DEFAULT_PRICE_INQUIRY_TEXT, resolvePriceDisplay } from './price-display';
import type { PriceDisplayPolicy } from './price-display';

/** PG 를 실제로 열 수 있는 설정 — 상점 ID 까지 채워야 결제창이 열린다 */
const PG_ON: PaymentSettings = {
  ...DEFAULT_PAYMENT_SETTINGS,
  usePg: true,
  merchantId: 'tosspayments-1234',
};

/** 켜 두었지만 상점 ID 가 비어 있는 설정 — fail-closed 판정의 대상 */
const PG_HALF: PaymentSettings = { ...DEFAULT_PAYMENT_SETTINGS, usePg: true, merchantId: '  ' };

const PG_OFF: PaymentSettings = DEFAULT_PAYMENT_SETTINGS;

const AMOUNT: PriceDisplayPolicy = { priceDisplay: 'amount', inquiryText: '' };
const INQUIRY: PriceDisplayPolicy = { priceDisplay: 'inquiry', inquiryText: '견적 문의' };

function backlogOf(partial: Partial<InquiryBacklog>): InquiryBacklog {
  return {
    total: 0,
    open: 0,
    slaBreached: 0,
    averageResponseHours: null,
    byTarget: {},
    ...partial,
  };
}

afterEach(() => {
  resetInquiryBacklogLookup();
});

describe('축 A — pgSellable', () => {
  it('상점 ID 가 비어 있으면 켜 두어도 결제를 열 수 없다(fail-closed)', () => {
    expect(pgSellable(PG_ON)).toBe(true);
    expect(pgSellable(PG_HALF)).toBe(false);
    expect(pgSellable(PG_OFF)).toBe(false);
  });
});

describe('축 B — resolvePriceDisplay', () => {
  it('PG 를 켠 상태에서는 상품별 축이 그대로 답이다', () => {
    expect(resolvePriceDisplay(PG_ON, AMOUNT).kind).toBe('amount');
    expect(resolvePriceDisplay(PG_ON, INQUIRY).kind).toBe('inquiry');
  });

  it('"PG 는 쓰지만 이 상품만 가격문의" 가 표현된다 — 문구는 운영자가 쓴 것', () => {
    const resolved = resolvePriceDisplay(PG_ON, INQUIRY);
    expect(resolved.text).toBe('견적 문의');
    expect(resolved.amountFieldsLocked).toBe(true);
  });

  it('PG 가 꺼져 있으면 상품이 금액 노출이라 해도 전역이 이긴다', () => {
    const resolved = resolvePriceDisplay(PG_OFF, AMOUNT);
    expect(resolved.kind).toBe('inquiry');
    expect(resolved.text).toBe(DEFAULT_PRICE_INQUIRY_TEXT);
  });

  it('문구가 비어 있으면 기본 문구로 채운다 — 금액 칸이 빈 채 남지 않는다', () => {
    const resolved = resolvePriceDisplay(PG_ON, { priceDisplay: 'inquiry', inquiryText: '   ' });
    expect(resolved.text).toBe(DEFAULT_PRICE_INQUIRY_TEXT);
  });

  it('금액 노출이면 할인·과세 필드를 잠그지 않는다', () => {
    expect(resolvePriceDisplay(PG_ON, AMOUNT).amountFieldsLocked).toBe(false);
  });

  it('파생일 뿐 정책을 건드리지 않는다 — 값 보존', () => {
    const policy: PriceDisplayPolicy = { priceDisplay: 'inquiry', inquiryText: '견적 문의' };
    resolvePriceDisplay(PG_OFF, policy);
    expect(policy).toEqual({ priceDisplay: 'inquiry', inquiryText: '견적 문의' });
  });
});

describe('PG off 시 섹션 잠금', () => {
  it('PG 를 열 수 있으면 어느 섹션도 잠기지 않는다', () => {
    for (const section of PG_LOCK_SECTIONS) {
      expect(pgLock(PG_ON, section)).toEqual({ locked: false, reason: '' });
    }
  });

  it('PG 를 열 수 없으면 모든 섹션이 사유와 함께 잠긴다', () => {
    for (const settings of [PG_OFF, PG_HALF]) {
      for (const section of PG_LOCK_SECTIONS) {
        const lock = pgLock(settings, section);
        expect(lock.locked).toBe(true);
        expect(lock.reason).not.toBe('');
      }
    }
  });

  it('사유는 결과가 아니라 원인을 말한다 — 적립·쿠폰은 "결제가 없어" 로 시작한다', () => {
    expect(pgLock(PG_OFF, 'product-points').reason).toContain('결제가 없어');
    expect(pgLock(PG_OFF, 'product-coupons').reason).toContain('결제가 없어');
  });

  it('재고 잠금 사유가 옵션은 계속 편집된다고 말한다 — 견적 품목 명세로 쓰인다', () => {
    expect(pgLock(PG_OFF, 'product-stock').reason).toContain('옵션');
  });
});

describe('조건부 메뉴 가시성', () => {
  it('PG 미사용이면 문의는 지금도 들어온다 — 메뉴는 평소대로', () => {
    expect(inquiryMenuState(PG_OFF, backlogOf({ total: 0 }))).toBe('open');
  });

  it('PG 사용 + 잔여 0건이면 메뉴가 사라진다', () => {
    expect(inquiryMenuState(PG_ON, backlogOf({ total: 0 }))).toBe('hidden');
  });

  it('PG 사용 + 잔여가 남아 있으면 메뉴는 남기고 읽기 전용으로 표시한다', () => {
    expect(inquiryMenuState(PG_ON, backlogOf({ total: 3 }))).toBe('archive');
  });

  it('배선 전(모름)에는 지우지 않는다 — fail-open', () => {
    expect(inquiryMenuState(PG_ON, null)).toBe('archive');
  });

  it('미답변이 0 이어도 종결된 과거 문의가 있으면 남긴다 — 기록의 접근로를 끊지 않는다', () => {
    expect(inquiryMenuState(PG_ON, backlogOf({ total: 12, open: 0 }))).toBe('archive');
  });
});

describe('잔여 문의 조회 seam', () => {
  it('배선 전에는 0 이 아니라 null 이다', () => {
    expect(readInquiryBacklog('product')).toBeNull();
    expect(inquiryCountFor('product', 'prd-1')).toBeNull();
  });

  it('도메인별로 다른 답을 준다 — 상품과 프로그램의 창구가 다르다', () => {
    registerInquiryBacklogLookup((domain) =>
      domain === 'product'
        ? backlogOf({ total: 2, byTarget: { 'prd-1': 2 } })
        : backlogOf({ total: 5 }),
    );

    expect(readInquiryBacklog('product')?.total).toBe(2);
    expect(readInquiryBacklog('program')?.total).toBe(5);
    expect(inquiryCountFor('product', 'prd-1')).toBe(2);
    // 문의가 없는 상품은 '모름' 이 아니라 0 건이다
    expect(inquiryCountFor('product', 'prd-9')).toBe(0);
  });
});
