// 조직도 폼 검증 규칙 (A41 — 검증의 정본은 이 zod 스키마다)
import * as z from 'zod/mini';

import { requiredText } from '../_shared/validation';
import { NAME_MAX_LENGTH, TITLE_MAX_LENGTH } from './types';

export const orgSchema = z.object({
  name: requiredText('이름', NAME_MAX_LENGTH),
  type: z.string().check(
    z.refine((value) => value === 'department' || value === 'member', {
      error: '구분을 선택하세요.',
    }),
  ),
  // 상위부서 — 빈 문자열은 최상위를 뜻한다(선택)
  parentId: z.string(),
  // 직책 — 구성원일 때 쓰인다(선택)
  title: z.string().check(
    z.refine((value) => value.trim().length <= TITLE_MAX_LENGTH, {
      error: `직책은 ${String(TITLE_MAX_LENGTH)}자를 넘을 수 없습니다.`,
    }),
  ),
});

export type OrgFormValues = z.infer<typeof orgSchema>;
