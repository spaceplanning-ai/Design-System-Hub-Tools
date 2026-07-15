// 배너 관리 화면의 동작 회귀 테스트 (A41)
import { describe, expect, it } from 'vitest';

import { applyQuery, BANNERS } from './data-source';
import type { BannerQuery } from './data-source';
import { bannerSchema } from './validation';
import type { BannerFormValues } from './validation';
import type { Banner } from './types';

function bannerOf(overrides: Partial<Banner> & { id: string }): Banner {
  return {
    title: '봄 시즌 기획전',
    imageUrl: 'https://cdn.example.com/b.png',
    linkUrl: '',
    placement: 'main',
    startAt: '2026-05-01',
    endAt: '2026-05-31',
    enabled: true,
    order: 1,
    ...overrides,
  };
}

const SAMPLE: readonly Banner[] = [
  bannerOf({ id: '1', title: '봄 기획전', placement: 'main' }),
  bannerOf({ id: '2', title: '신상 입고', placement: 'sub' }),
  bannerOf({ id: '3', title: '브랜드데이', placement: 'main' }),
];

function queryOf(overrides: Partial<BannerQuery> = {}): BannerQuery {
  return { placement: 'all', keyword: '', page: 1, ...overrides };
}

const idsOf = (banners: readonly Banner[]) => banners.map((b) => b.id);

describe('applyQuery — 필터', () => {
  it('기본(전체)은 모든 배너', () => {
    expect(idsOf(applyQuery(queryOf(), SAMPLE))).toEqual(['1', '2', '3']);
  });

  it('위치 필터 — 메인만', () => {
    expect(idsOf(applyQuery(queryOf({ placement: 'main' }), SAMPLE))).toEqual(['1', '3']);
  });

  it('위치 필터 — 서브만', () => {
    expect(idsOf(applyQuery(queryOf({ placement: 'sub' }), SAMPLE))).toEqual(['2']);
  });

  it('제목 검색 — 공백/대소문자 무시', () => {
    expect(idsOf(applyQuery(queryOf({ keyword: ' 신상 ' }), SAMPLE))).toEqual(['2']);
  });
});

describe('BANNERS 픽스처', () => {
  it('정렬 순서 오름차순으로 온다', () => {
    const orders = BANNERS.map((banner) => banner.order);
    expect([...orders].sort((a, b) => a - b)).toEqual(orders);
  });
});

function valuesOf(overrides: Partial<BannerFormValues> = {}): BannerFormValues {
  return {
    title: '제목',
    imageUrl: 'https://cdn.example.com/a.png',
    linkUrl: '',
    placement: 'main',
    startAt: '2026-05-01',
    endAt: '2026-05-31',
    enabled: true,
    order: '1',
    ...overrides,
  };
}

function messageFor(values: BannerFormValues, field: keyof BannerFormValues): string | undefined {
  const result = bannerSchema.safeParse(values);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe('bannerSchema — 폼 검증', () => {
  it('정상 입력은 통과한다', () => {
    expect(bannerSchema.safeParse(valuesOf()).success).toBe(true);
  });

  it('이미지 URL 형식이 아니면 막는다', () => {
    expect(messageFor(valuesOf({ imageUrl: 'nope' }), 'imageUrl')).toContain('http');
  });

  it('종료일이 시작일보다 빠르면 막는다', () => {
    expect(messageFor(valuesOf({ startAt: '2026-05-31', endAt: '2026-05-01' }), 'endAt')).toBe(
      '종료일은 시작일보다 빠를 수 없습니다.',
    );
  });

  it('정렬 순서가 정수가 아니면 막는다', () => {
    expect(messageFor(valuesOf({ order: '1.2' }), 'order')).toContain('정수');
  });
});
