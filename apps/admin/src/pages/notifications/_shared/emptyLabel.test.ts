// 빈 목록 문구 회귀 테스트 — STATE-05 3분기 + ERP-13 조사
import { describe, expect, it } from 'vitest';

import { emptyLabelFor } from './emptyLabel';

const CREATE_HINT = '이벤트에 묶을 문구를 등록해 주세요.';

function labelFor(overrides: Partial<Parameters<typeof emptyLabelFor>[1]> = {}): string {
  return emptyLabelFor('SMS 템플릿', {
    hasQuery: false,
    keyword: '',
    hasActiveFilters: false,
    createHint: CREATE_HINT,
    ...overrides,
  });
}

describe('emptyLabelFor — STATE-05 3분기', () => {
  it('(a) 진짜 비어있음 — 만들라고 안내한다', () => {
    const label = labelFor();
    expect(label).toContain('등록된 SMS 템플릿이 없습니다');
    expect(label).toContain(CREATE_HINT);
  });

  it('(b) 검색 결과 없음 — 검색어를 되뇌고 지우라고 안내한다', () => {
    const label = labelFor({ hasQuery: true, keyword: '주문' });
    expect(label).toContain("'주문' 조건에 맞는 SMS 템플릿이 없습니다");
    expect(label).toContain('검색어를 바꾸거나 지워 보세요');
  });

  it('(c) 필터 결과 없음 — 필터를 초기화하라고 안내한다', () => {
    const label = labelFor({ hasActiveFilters: true });
    expect(label).toContain('이 분류에 등록된 SMS 템플릿이 없습니다');
    expect(label).toContain('필터를 초기화해 보세요');
  });

  it('검색이 필터보다 우선한다 — 둘 다 걸려 있으면 검색 문구를 낸다', () => {
    const label = labelFor({ hasQuery: true, keyword: '주문', hasActiveFilters: true });
    expect(label).toContain('조건에 맞는');
    expect(label).not.toContain('필터를 초기화');
  });

  it('ERP-13 — 라벨 받침에 맞는 조사를 붙이고 리터럴 이(가) 를 내지 않는다', () => {
    expect(
      emptyLabelFor('발송 규칙', {
        hasQuery: false,
        keyword: '',
        hasActiveFilters: false,
        createHint: '',
      }),
    ).toContain('발송 규칙이 없습니다');
    // 받침 없는 라벨은 '가'
    expect(
      emptyLabelFor('메시지', {
        hasQuery: false,
        keyword: '',
        hasActiveFilters: false,
        createHint: '',
      }),
    ).toContain('메시지가 없습니다');
    expect(labelFor()).not.toContain('이(가)');
  });
});
