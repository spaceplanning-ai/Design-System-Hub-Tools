// 배송 정책 · 택배사 폼 검증 회귀 테스트
import { describe, expect, it } from 'vitest';

import { carrierUsageLabel, DEFAULT_SHIPPING_POLICY } from './types';
import { carrierSchema, shippingPolicySchema } from './validation';
import type { CarrierFormValues, ShippingPolicyValues } from './validation';
import { CARRIER_SEED, listShippingCarriers } from './data-source';

function valuesOf(overrides: Partial<ShippingPolicyValues> = {}): ShippingPolicyValues {
  return { ...DEFAULT_SHIPPING_POLICY, ...overrides };
}

describe('shippingPolicySchema — 폼 검증', () => {
  it('기본값은 통과한다', () => {
    expect(shippingPolicySchema.safeParse(valuesOf()).success).toBe(true);
  });

  it('기본 택배사를 고르지 않으면 막는다', () => {
    const result = shippingPolicySchema.safeParse(valuesOf({ defaultCarrierId: '' }));
    expect(result.success).toBe(false);
  });

  it('기본 배송비가 숫자가 아니면 막는다', () => {
    const result = shippingPolicySchema.safeParse(valuesOf({ baseFee: '삼천원' }));
    expect(result.success).toBe(false);
  });

  it('조건부 무료인데 기준 금액이 없으면 막는다', () => {
    const result = shippingPolicySchema.safeParse(
      valuesOf({ feeType: 'conditional', freeThreshold: '' }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join('.') === 'freeThreshold')).toBe(
        true,
      );
    }
  });

  it('무료배송이면 기준 금액이 없어도 통과한다', () => {
    expect(
      shippingPolicySchema.safeParse(valuesOf({ feeType: 'free', freeThreshold: '' })).success,
    ).toBe(true);
  });

  it('기본 택배사는 실재하는 택배사를 가리킨다 — 픽스처가 죽은 참조로 출발하지 않는다', () => {
    expect(
      listShippingCarriers().some(
        (carrier) => carrier.id === DEFAULT_SHIPPING_POLICY.defaultCarrierId,
      ),
    ).toBe(true);
  });
});

/* ── 택배사 ──────────────────────────────────────────────────────────────── */

function carrierOf(overrides: Partial<CarrierFormValues> = {}): CarrierFormValues {
  return {
    name: '가상택배',
    code: 'VIRTUAL',
    trackingUrlTemplate: 'https://tracking.example.com/track?invoice={{invoice}}',
    active: true,
    ...overrides,
  };
}

describe('carrierSchema — 택배사 폼 검증', () => {
  it('기본 입력은 통과한다', () => {
    expect(carrierSchema.safeParse(carrierOf()).success).toBe(true);
  });

  it('이름이 비면 막는다', () => {
    expect(carrierSchema.safeParse(carrierOf({ name: '  ' })).success).toBe(false);
  });

  it('코드가 비면 막는다', () => {
    expect(carrierSchema.safeParse(carrierOf({ code: '' })).success).toBe(false);
  });

  it('소문자·한글 코드는 막는다 — 대조되는 값이라 표기가 갈리면 안 된다', () => {
    expect(carrierSchema.safeParse(carrierOf({ code: 'virtual' })).success).toBe(false);
    expect(carrierSchema.safeParse(carrierOf({ code: '가상' })).success).toBe(false);
  });

  it('추적 URL 은 비워 둘 수 있다 — 추적 페이지가 없는 택배사가 있다', () => {
    expect(carrierSchema.safeParse(carrierOf({ trackingUrlTemplate: '' })).success).toBe(true);
  });

  it('http(s) 가 아니면 막는다', () => {
    const result = carrierSchema.safeParse(
      carrierOf({ trackingUrlTemplate: 'tracking.example.com/{{invoice}}' }),
    );
    expect(result.success).toBe(false);
  });

  it('치환 토큰이 없으면 막는다 — 송장을 끼울 자리가 없는 링크는 추적이 아니다', () => {
    const result = carrierSchema.safeParse(
      carrierOf({ trackingUrlTemplate: 'https://tracking.example.com/track' }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.path.join('.') === 'trackingUrlTemplate'),
      ).toBe(true);
    }
  });
});

describe('택배사 픽스처 · 사용 현황 문구', () => {
  it('코드는 서로 겹치지 않는다 — 겹치면 연동 키의 뜻이 사라진다', () => {
    const codes = CARRIER_SEED.map((carrier) => carrier.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('픽스처는 스키마를 통과한다 — 화면이 열자마자 오류인 행을 두지 않는다', () => {
    for (const carrier of CARRIER_SEED) {
      expect(
        carrierSchema.safeParse({
          name: carrier.name,
          code: carrier.code,
          trackingUrlTemplate: carrier.trackingUrlTemplate,
          active: carrier.active,
        }).success,
      ).toBe(true);
    }
  });

  it('사용 현황은 0 과 모름을 다르게 말한다', () => {
    expect(carrierUsageLabel(null)).toBe('사용 현황 확인 중');
    expect(carrierUsageLabel(0)).toBe('미사용');
    expect(carrierUsageLabel(2)).toBe('배송 2건 사용 중');
  });
});
