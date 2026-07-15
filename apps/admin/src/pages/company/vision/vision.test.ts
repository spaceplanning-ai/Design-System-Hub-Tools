// 비전·미션 화면의 폼 검증 회귀 테스트 (A41)
import { describe, expect, it } from 'vitest';

import { MAX_CORE_VALUES } from './types';
import { visionSchema } from './validation';
import type { VisionFormValues } from './validation';

function valuesOf(overrides: Partial<VisionFormValues> = {}): VisionFormValues {
  return {
    vision: '공간의 가능성을 넓힌다.',
    mission: '고객의 성공을 함께 만든다.',
    coreValues: [{ title: '정직', description: '사실을 있는 그대로 전한다.' }],
    ...overrides,
  };
}

function messageFor(values: VisionFormValues, path: string): string | undefined {
  const result = visionSchema.safeParse(values);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path.map(String).join('.') === path)?.message;
}

describe('visionSchema — 비전·미션 폼 검증', () => {
  it('정상 입력은 통과한다', () => {
    expect(visionSchema.safeParse(valuesOf()).success).toBe(true);
  });

  it('핵심가치가 하나도 없어도 통과한다', () => {
    expect(visionSchema.safeParse(valuesOf({ coreValues: [] })).success).toBe(true);
  });

  it('비전이 비면 막는다', () => {
    expect(messageFor(valuesOf({ vision: '  ' }), 'vision')).toBe('비전을(를) 입력하세요.');
  });

  it('미션이 비면 막는다', () => {
    expect(messageFor(valuesOf({ mission: '' }), 'mission')).toBe('미션을(를) 입력하세요.');
  });

  it('핵심가치 제목이 비면 해당 행을 막는다', () => {
    expect(
      messageFor(valuesOf({ coreValues: [{ title: '', description: 'x' }] }), 'coreValues.0.title'),
    ).toContain('입력');
  });

  it('핵심가치가 최대 개수를 넘으면 막는다', () => {
    const many = Array.from({ length: MAX_CORE_VALUES + 1 }, (_, i) => ({
      title: `가치 ${String(i)}`,
      description: '',
    }));
    expect(messageFor(valuesOf({ coreValues: many }), 'coreValues')).toContain('최대');
  });
});
