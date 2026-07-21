// 프로그램(펀딩) 회귀 테스트 — 파생값·목록 필터·카테고리 2단계 규칙·폼 검증
//
// 화면 없이 고정할 수 있는 규칙만 여기서 잠근다. 달성률·남은 일수는 저장값에서 계산되는
// 파생값이라 계산이 틀리면 목록·상세가 동시에 거짓말을 한다 — 그래서 가장 먼저 고정한다.
import { describe, expect, it } from 'vitest';

import {
  PROGRAM_STATUS_ALL,
  categoryUsageLabel,
  countProgramsByStatus,
  filterCategoriesByUsage,
  filterProgramsByStatus,
  fundingSummary,
  fundingTone,
  programStatusLabel,
  programStatusTone,
  searchPrograms,
} from './types';
import { programCategorySchema, programSchema } from './validation';
import {
  addProgramCategory,
  daysLeft,
  fundingRate,
  isGoalReached,
  listProgramCategoryChildren,
  listProgramCategoryRoots,
  listProgramCategoryUsage,
  listPrograms,
  programCategoryPath,
  removeProgramCategory,
  updateProgramCategory,
} from './_shared/store';
import type { Program, ProgramCategoryUsage } from './_shared/store';

/* ── 파생값 ───────────────────────────────────────────────────────────────── */

describe('fundingRate — 달성률', () => {
  it('목표 대비 비율을 반올림해 낸다', () => {
    expect(fundingRate(10_000_000, 14_320_000)).toBe(143);
    expect(fundingRate(3_000_000, 1_000_000)).toBe(33);
  });

  it('초과 달성은 100을 넘겨 그대로 보여준다', () => {
    expect(fundingRate(1_000, 2_500)).toBe(250);
  });

  it('목표가 0이면 0 — 0으로 나누지 않는다', () => {
    expect(fundingRate(0, 500)).toBe(0);
  });
});

describe('isGoalReached — 목표 달성 여부', () => {
  it('모금액이 목표 이상이면 달성', () => {
    expect(isGoalReached(1_000, 1_000)).toBe(true);
    expect(isGoalReached(1_000, 1_200)).toBe(true);
  });

  it('모자라면 미달성', () => {
    expect(isGoalReached(1_000, 999)).toBe(false);
  });

  it('목표가 0이면 달성으로 치지 않는다 — 목표 없는 프로그램은 성공 판정 대상이 아니다', () => {
    expect(isGoalReached(0, 500)).toBe(false);
  });
});

describe('daysLeft — 남은 일수', () => {
  it('종료일까지 남은 날을 센다', () => {
    expect(daysLeft('2026-07-31', '2026-07-21')).toBe(10);
  });

  it('이미 지났으면 0 — 음수를 내지 않는다', () => {
    expect(daysLeft('2026-05-31', '2026-07-21')).toBe(0);
  });

  it('종료일 당일도 0', () => {
    expect(daysLeft('2026-07-21', '2026-07-21')).toBe(0);
  });
});

/* ── 상태 표시 ────────────────────────────────────────────────────────────── */

describe('상태 문구·색', () => {
  it('상태마다 한국어 문구를 준다', () => {
    expect(programStatusLabel('draft')).toBe('작성 중');
    expect(programStatusLabel('live')).toBe('진행 중');
    expect(programStatusLabel('succeeded')).toBe('성공');
    expect(programStatusLabel('failed')).toBe('실패');
  });

  it('실패만 danger — 색으로 성패를 구분한다', () => {
    expect(programStatusTone('failed')).toBe('danger');
    expect(programStatusTone('succeeded')).toBe('success');
  });
});

/* ── 목록 필터·검색 ───────────────────────────────────────────────────────── */

describe('목록 필터(순수)', () => {
  const list = listPrograms();

  it('전체는 그대로 통과시킨다', () => {
    expect(filterProgramsByStatus(list, PROGRAM_STATUS_ALL)).toHaveLength(list.length);
  });

  it('상태로 거른다', () => {
    const live = filterProgramsByStatus(list, 'live');
    expect(live.length).toBeGreaterThan(0);
    expect(live.every((program) => program.status === 'live')).toBe(true);
  });

  it('집계는 전체 수와 상태별 수를 함께 낸다', () => {
    const counts = countProgramsByStatus(list);
    expect(counts[PROGRAM_STATUS_ALL]).toBe(list.length);
    expect(counts.live + counts.succeeded + counts.failed + counts.scheduled + counts.draft).toBe(
      list.length,
    );
  });
});

describe('searchPrograms — 제목·창작자', () => {
  const list = listPrograms();

  it('빈 검색어는 전체를 돌려준다', () => {
    expect(searchPrograms(list, '   ')).toHaveLength(list.length);
  });

  it('제목 일부로 찾는다', () => {
    expect(searchPrograms(list, '헤드폰').map((program) => program.id)).toEqual(['pgm-1']);
  });

  it('창작자 이름으로도 찾는다', () => {
    expect(searchPrograms(list, '노크우드').map((program) => program.id)).toEqual(['pgm-2']);
  });
});

/* ── 진행률 문구 ──────────────────────────────────────────────────────────── */

describe('fundingSummary / fundingTone', () => {
  const program: Program = {
    id: 'x',
    title: 't',
    categoryId: 'tech',
    categoryLabel: '테크·가전',
    creator: 'c',
    summary: 's',
    story: '',
    goalAmount: 10_000_000,
    pledgedAmount: 14_320_000,
    backerCount: 1,
    startDate: '2026-06-01',
    endDate: '2026-07-31',
    status: 'live',
    coverImageUrl: '',
    rewards: [],
  };

  it('달성률과 모금액을 함께 읽힌다 — 색만으로 전달하지 않는다', () => {
    expect(fundingSummary(program)).toBe('143% · 14,320,000원');
  });

  it('달성하면 success, 못 채웠으면 info', () => {
    expect(fundingTone(program)).toBe('success');
    expect(fundingTone({ ...program, pledgedAmount: 100 })).toBe('info');
  });
});

/* ── 카테고리 사용량 ──────────────────────────────────────────────────────── */

describe('카테고리 사용량 문구·필터', () => {
  const list: readonly ProgramCategoryUsage[] = [
    { id: 'tech', label: '테크·가전', parentId: null, programCount: 0, hasChildren: true },
    { id: 'tech-audio', label: '음향기기', parentId: 'tech', programCount: 2, hasChildren: false },
  ];

  it('미사용 / N개 프로그램', () => {
    expect(categoryUsageLabel(0)).toBe('미사용');
    expect(categoryUsageLabel(2)).toBe('2개 프로그램');
  });

  it('사용 중·미사용을 갈라낸다', () => {
    expect(filterCategoriesByUsage(list, 'in-use').map((c) => c.id)).toEqual(['tech-audio']);
    expect(filterCategoriesByUsage(list, 'unused').map((c) => c.id)).toEqual(['tech']);
    expect(filterCategoriesByUsage(list, 'all')).toHaveLength(2);
  });
});

/* ── 카테고리 2단계 규칙 (상품 카테고리와 같은 규칙) ──────────────────────── */

describe('카테고리 2Depth 규칙', () => {
  it('대분류만 최상위로 센다', () => {
    const roots = listProgramCategoryRoots();
    expect(roots.every((category) => category.parentId === null)).toBe(true);
    expect(roots.map((category) => category.id)).toContain('tech');
  });

  it('대분류 밑의 중분류를 찾는다', () => {
    expect(listProgramCategoryChildren('tech').map((category) => category.id)).toEqual([
      'tech-audio',
      'tech-mobile',
    ]);
  });

  it("경로는 '대분류 > 중분류' 로 읽힌다", () => {
    expect(programCategoryPath('tech-audio')).toBe('테크·가전 > 음향기기');
    expect(programCategoryPath('tech')).toBe('테크·가전');
  });

  it('중분류 밑에는 만들 수 없다 — 3단계 금지', () => {
    expect(() => {
      addProgramCategory('초소형', 'tech-audio');
    }).toThrow('카테고리는 2단계까지만 만들 수 있습니다.');
  });

  it('하위가 있는 대분류는 다른 대분류 밑으로 옮기지 못한다', () => {
    expect(() => {
      updateProgramCategory('tech', '테크·가전', 'life');
    }).toThrow('하위 카테고리가 있는');
  });

  it('사용 중인 카테고리는 삭제하지 않는다', () => {
    expect(() => {
      removeProgramCategory('tech-audio');
    }).toThrow('사용 중인 카테고리는 삭제할 수 없습니다.');
  });

  it('하위가 있는 카테고리도 삭제하지 않는다', () => {
    expect(() => {
      removeProgramCategory('tech');
    }).toThrow('하위 카테고리가 있는 카테고리는 삭제할 수 없습니다.');
  });

  it('사용량 목록은 하위 보유 여부를 함께 낸다 — 목록이 접기/펼치기를 그릴 근거', () => {
    const usage = listProgramCategoryUsage();
    const tech = usage.find((category) => category.id === 'tech');
    expect(tech?.hasChildren).toBe(true);
    const audio = usage.find((category) => category.id === 'tech-audio');
    expect(audio?.hasChildren).toBe(false);
    expect(audio?.programCount).toBe(1);
  });
});

/* ── 폼 검증 ──────────────────────────────────────────────────────────────── */

describe('programSchema — 등록 폼 검증', () => {
  const valid = {
    title: '무선 헤드폰',
    categoryId: 'tech-audio',
    creator: '사운드랩',
    summary: '스튜디오 모니터링을 그대로',
    story: '',
    goalAmount: '10000000',
    startDate: '2026-08-01',
    endDate: '2026-09-10',
    status: 'draft' as const,
    coverImageUrl: '',
    rewards: [],
  };

  it('정상 입력은 통과한다', () => {
    expect(programSchema.safeParse(valid).success).toBe(true);
  });

  it('카테고리를 고르지 않으면 막는다', () => {
    const result = programSchema.safeParse({ ...valid, categoryId: '' });
    expect(result.success).toBe(false);
  });

  it('목표 금액은 숫자만 받는다', () => {
    expect(programSchema.safeParse({ ...valid, goalAmount: '1,000만' }).success).toBe(false);
  });

  it('목표 금액 0원은 막는다', () => {
    expect(programSchema.safeParse({ ...valid, goalAmount: '0' }).success).toBe(false);
  });

  it('종료일이 시작일보다 앞서면 막는다 — 오류는 종료일 필드에 붙인다', () => {
    const result = programSchema.safeParse({
      ...valid,
      startDate: '2026-09-10',
      endDate: '2026-08-01',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes('endDate'))).toBe(true);
    }
  });

  it('같은 날 시작·종료는 허용한다 — 하루짜리 프로그램', () => {
    expect(
      programSchema.safeParse({ ...valid, startDate: '2026-08-01', endDate: '2026-08-01' }).success,
    ).toBe(true);
  });
});

describe('programCategorySchema — 카테고리 폼 검증', () => {
  it('이름이 비면 막는다', () => {
    expect(programCategorySchema.safeParse({ name: '  ', parentId: '' }).success).toBe(false);
  });

  it("상위 없음은 빈 문자열로 받는다 — 화면의 '없음(대분류)' 선택", () => {
    expect(programCategorySchema.safeParse({ name: '테크·가전', parentId: '' }).success).toBe(true);
  });
});
