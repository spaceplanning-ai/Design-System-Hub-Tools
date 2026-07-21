// 프로그램 폼 검증 규칙 (검증의 정본은 이 zod 스키마다)
//
// 금액·기간은 입력 중 원값을 보존하려 문자열로 받고 여기서 형식·범위를 판정한다.
// 기간은 두 날짜의 **관계**(시작 ≤ 종료)까지 봐야 하므로 refine 으로 교차 검증한다.
import * as z from 'zod/mini';

import { requiredText } from '../../shared/crud';
import { PROGRAM_CATEGORY_NAME_MAX, PROGRAM_SUMMARY_MAX, PROGRAM_TITLE_MAX } from './_shared/store';

const INT_RE = /^\d+$/;

const rewardSchema = z.object({
  id: z.string(),
  title: z.string(),
  amount: z.number(),
  description: z.string(),
  limitCount: z.number(),
  claimedCount: z.number(),
});

export const programSchema = z
  .object({
    title: requiredText('프로그램명', PROGRAM_TITLE_MAX),
    categoryId: z.string().check(z.minLength(1, '카테고리를 선택하세요.')),
    creator: requiredText('창작자', 40),
    summary: requiredText('한 줄 소개', PROGRAM_SUMMARY_MAX),
    story: z.string(),
    goalAmount: z
      .string()
      .check(z.refine((value) => INT_RE.test(value.trim()), '목표 금액은 숫자만 입력하세요.'))
      .check(z.refine((value) => Number(value.trim()) > 0, '목표 금액은 1원 이상이어야 합니다.')),
    startDate: z.string().check(z.minLength(1, '시작일을 입력하세요.')),
    endDate: z.string().check(z.minLength(1, '종료일을 입력하세요.')),
    status: z.enum(['draft', 'scheduled', 'live', 'succeeded', 'failed']),
    coverImageUrl: z.string(),
    rewards: z.array(rewardSchema),
  })
  .check(
    z.refine((values) => values.startDate <= values.endDate, {
      message: '종료일은 시작일과 같거나 그 뒤여야 합니다.',
      path: ['endDate'],
    }),
  );

export type ProgramFormValues = z.infer<typeof programSchema>;

export const programCategorySchema = z.object({
  name: requiredText('카테고리 이름', PROGRAM_CATEGORY_NAME_MAX),
  /** 상위 카테고리 id. 빈 문자열이면 최상위(1Depth) */
  parentId: z.string(),
});

export type ProgramCategoryFormValues = z.infer<typeof programCategorySchema>;
