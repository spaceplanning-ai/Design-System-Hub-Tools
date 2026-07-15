// FAQ 화면의 동작 회귀 테스트 (A41)
//
// 목록 동작=필터 규칙(applyQuery), 폼 동작=검증 규칙(faqSchema·faqCategorySchema).
import { describe, expect, it } from 'vitest';

import { applyQuery, FAQS } from './data-source';
import type { FaqQuery } from './data-source';
import { faqCategorySchema, faqSchema } from './validation';
import type { FaqCategoryFormValues, FaqFormValues } from './validation';
import { CATEGORY_ALL } from './types';
import type { Faq } from './types';

/* ── 표본 ─────────────────────────────────────────────────────────────────── */

function faqOf(overrides: Partial<Faq> & { id: string }): Faq {
  return {
    question: '비밀번호를 잊어버렸어요',
    categoryId: 'account',
    categoryLabel: '계정',
    visible: true,
    order: 1,
    answer: '답변',
    ...overrides,
  };
}

const SAMPLE: readonly Faq[] = [
  faqOf({ id: '1', question: '비밀번호 재설정', categoryId: 'account', visible: true }),
  faqOf({ id: '2', question: '결제 수단 안내', categoryId: 'payment', visible: false }),
  faqOf({ id: '3', question: '배송 기간', categoryId: 'delivery', visible: true }),
  faqOf({ id: '4', question: '계정 탈퇴', categoryId: 'account', visible: false }),
];

function queryOf(overrides: Partial<FaqQuery> = {}): FaqQuery {
  return { categoryId: CATEGORY_ALL, visibility: 'all', keyword: '', page: 1, ...overrides };
}

const idsOf = (faqs: readonly Faq[]) => faqs.map((f) => f.id);

/* ── 필터 ─────────────────────────────────────────────────────────────────── */

describe('applyQuery — 필터', () => {
  it('기본(전체)은 모든 FAQ 를 돌려준다', () => {
    expect(idsOf(applyQuery(queryOf(), SAMPLE))).toEqual(['1', '2', '3', '4']);
  });

  it('카테고리 필터 — 계정만', () => {
    expect(idsOf(applyQuery(queryOf({ categoryId: 'account' }), SAMPLE))).toEqual(['1', '4']);
  });

  it('노출 여부 필터 — 노출만', () => {
    expect(idsOf(applyQuery(queryOf({ visibility: 'visible' }), SAMPLE))).toEqual(['1', '3']);
  });

  it('노출 여부 필터 — 숨김만', () => {
    expect(idsOf(applyQuery(queryOf({ visibility: 'hidden' }), SAMPLE))).toEqual(['2', '4']);
  });

  it('카테고리 × 노출 여부는 AND 로 걸린다', () => {
    expect(
      idsOf(applyQuery(queryOf({ categoryId: 'account', visibility: 'hidden' }), SAMPLE)),
    ).toEqual(['4']);
  });

  it('질문 검색 — 대소문자·앞뒤 공백 무시', () => {
    expect(idsOf(applyQuery(queryOf({ keyword: ' 계정 ' }), SAMPLE))).toEqual(['4']);
  });

  it('빈 상태 — 걸리는 것이 없으면 빈 배열', () => {
    expect(applyQuery(queryOf({ keyword: '없는질문' }), SAMPLE)).toEqual([]);
  });
});

describe('FAQS 픽스처', () => {
  it('정렬 순서 오름차순으로 온다', () => {
    const orders = FAQS.map((faq) => faq.order);
    expect([...orders].sort((a, b) => a - b)).toEqual(orders);
  });
});

/* ── FAQ 폼 검증 ──────────────────────────────────────────────────────────── */

function valuesOf(overrides: Partial<FaqFormValues> = {}): FaqFormValues {
  return {
    question: '질문',
    categoryId: 'account',
    answer: '답변',
    visible: true,
    order: '1',
    ...overrides,
  };
}

function messageFor(values: FaqFormValues, field: keyof FaqFormValues): string | undefined {
  const result = faqSchema.safeParse(values);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe('faqSchema — 폼 검증', () => {
  it('정상 입력은 통과한다', () => {
    expect(faqSchema.safeParse(valuesOf()).success).toBe(true);
  });

  it('질문이 비면 막는다', () => {
    expect(messageFor(valuesOf({ question: '  ' }), 'question')).toBe('질문을 입력하세요.');
  });

  it('카테고리를 고르지 않으면 막는다', () => {
    expect(messageFor(valuesOf({ categoryId: '' }), 'categoryId')).toBe('카테고리를 선택하세요.');
  });

  it('답변이 비면 막는다', () => {
    expect(messageFor(valuesOf({ answer: '' }), 'answer')).toBe('답변을 입력하세요.');
  });

  it('정렬 순서가 정수가 아니면 막는다', () => {
    expect(messageFor(valuesOf({ order: '1.5' }), 'order')).toContain('정수');
    expect(messageFor(valuesOf({ order: 'abc' }), 'order')).toContain('정수');
  });

  it('정렬 순서 0 은 통과한다', () => {
    expect(faqSchema.safeParse(valuesOf({ order: '0' })).success).toBe(true);
  });
});

/* ── 카테고리 모달 검증 ──────────────────────────────────────────────────── */

function categoryMessage(values: FaqCategoryFormValues): string | undefined {
  const result = faqCategorySchema.safeParse(values);
  if (result.success) return undefined;
  return result.error.issues[0]?.message;
}

describe('faqCategorySchema — 카테고리 등록 모달', () => {
  it('정상 입력은 통과한다', () => {
    expect(faqCategorySchema.safeParse({ name: '결제' }).success).toBe(true);
  });

  it('이름이 비면 막는다', () => {
    expect(categoryMessage({ name: '   ' })).toBe('카테고리명을 입력하세요.');
  });

  it('30자를 넘으면 막는다', () => {
    expect(categoryMessage({ name: 'ㄱ'.repeat(31) })).toContain('30자');
  });
});
