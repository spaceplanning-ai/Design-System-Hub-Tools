// 프로그램 화면 전용 타입 + 뷰 헬퍼
//
// 정본(픽스처·규칙)은 ./_shared/store 다. 여기는 화면이 읽는 **표시 규칙**만 둔다 —
// 상태 문구·색, 목록 필터 축, 진행률 문구. 순수 함수라 테스트가 화면 없이 고정한다.
import { formatNumber } from '../../shared/format';
import type { StatusBadgeTone } from '@tds/ui';
import { fundingRate, isGoalReached } from './_shared/store';
import type { Program, ProgramCategoryUsage, ProgramStatus } from './_shared/store';

/* ── 상태 표시 ────────────────────────────────────────────────────────────── */

interface StatusMeta {
  readonly label: string;
  readonly tone: StatusBadgeTone;
}

const STATUS_META: Record<ProgramStatus, StatusMeta> = {
  draft: { label: '작성 중', tone: 'neutral' },
  scheduled: { label: '오픈 예정', tone: 'info' },
  live: { label: '진행 중', tone: 'success' },
  succeeded: { label: '성공', tone: 'success' },
  failed: { label: '실패', tone: 'danger' },
};

export function programStatusLabel(status: ProgramStatus): string {
  return STATUS_META[status].label;
}

export function programStatusTone(status: ProgramStatus): StatusBadgeTone {
  return STATUS_META[status].tone;
}

export const PROGRAM_STATUS_OPTIONS: readonly {
  readonly id: ProgramStatus;
  readonly label: string;
}[] = (['draft', 'scheduled', 'live', 'succeeded', 'failed'] as const).map((status) => ({
  id: status,
  label: STATUS_META[status].label,
}));

/* ── 목록 필터: 상태 ──────────────────────────────────────────────────────── */

export const PROGRAM_STATUS_ALL = 'all';

export type ProgramStatusFilter = typeof PROGRAM_STATUS_ALL | ProgramStatus;

export const PROGRAM_STATUS_FILTERS: readonly {
  readonly id: ProgramStatusFilter;
  readonly label: string;
}[] = [{ id: PROGRAM_STATUS_ALL, label: '전체' }, ...PROGRAM_STATUS_OPTIONS];

export const PROGRAM_STATUS_FILTER_VALUES: readonly ProgramStatusFilter[] =
  PROGRAM_STATUS_FILTERS.map((option) => option.id);

export function filterProgramsByStatus(
  list: readonly Program[],
  filter: ProgramStatusFilter,
): readonly Program[] {
  if (filter === PROGRAM_STATUS_ALL) return list;
  return list.filter((program) => program.status === filter);
}

/** 제목·창작자로 찾는다 — 목록 검색 */
export function searchPrograms(list: readonly Program[], keyword: string): readonly Program[] {
  const needle = keyword.trim().toLowerCase();
  if (needle === '') return list;
  return list.filter(
    (program) =>
      program.title.toLowerCase().includes(needle) ||
      program.creator.toLowerCase().includes(needle),
  );
}

export function countProgramsByStatus(
  list: readonly Program[],
): Record<ProgramStatusFilter, number> {
  const counts = {
    [PROGRAM_STATUS_ALL]: list.length,
    draft: 0,
    scheduled: 0,
    live: 0,
    succeeded: 0,
    failed: 0,
  } as Record<ProgramStatusFilter, number>;
  for (const program of list) counts[program.status] += 1;
  return counts;
}

/* ── 진행률 문구 ──────────────────────────────────────────────────────────── */

/** '143% · 14,320,000원' — 달성률과 모금액을 함께 읽힌다 */
export function fundingSummary(program: Program): string {
  const rate = fundingRate(program.goalAmount, program.pledgedAmount);
  return `${formatNumber(rate)}% · ${formatNumber(program.pledgedAmount)}원`;
}

/** 달성 여부에 따른 색 — 색만으로 전달하지 않게 문구와 함께 쓴다 */
export function fundingTone(program: Program): StatusBadgeTone {
  return isGoalReached(program.goalAmount, program.pledgedAmount) ? 'success' : 'info';
}

/* ── 카테고리 사용량 문구 (상품 카테고리와 같은 규칙) ─────────────────────── */

export function categoryUsageLabel(programCount: number): string {
  return programCount === 0 ? '미사용' : `${formatNumber(programCount)}개 프로그램`;
}

export function filterCategoriesByUsage(
  list: readonly ProgramCategoryUsage[],
  filter: 'all' | 'in-use' | 'unused',
): readonly ProgramCategoryUsage[] {
  if (filter === 'all') return list;
  if (filter === 'in-use') return list.filter((category) => category.programCount > 0);
  return list.filter((category) => category.programCount === 0);
}

/** 카테고리 등록/수정 입력 */
export interface ProgramCategoryInput {
  readonly name: string;
  readonly parentId: string | null;
}
