// 상품 카테고리 동작 회귀 테스트 (A41) — 사용량 문구 + 폼 검증
import { describe, expect, it } from 'vitest';

import { usageLabel } from './types';
import { productCategorySchema } from './validation';

describe('usageLabel — 사용 여부 문구', () => {
  it('미사용 / N개 상품', () => {
    expect(usageLabel(0)).toBe('미사용');
    expect(usageLabel(3)).toBe('3개 상품');
  });
});

describe('productCategorySchema — 폼 검증', () => {
  it('정상 입력은 통과한다', () => {
    expect(productCategorySchema.safeParse({ name: '아우터' }).success).toBe(true);
  });

  it('이름이 비면 막는다', () => {
    const result = productCategorySchema.safeParse({ name: '  ' });
    expect(result.success).toBe(false);
  });
});
