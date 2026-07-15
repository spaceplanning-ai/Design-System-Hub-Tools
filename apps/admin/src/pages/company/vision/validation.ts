// 비전·미션 폼 검증 규칙 (A41 — 검증의 정본은 이 zod 스키마다)
import * as z from 'zod/mini';

import { requiredText } from '../_shared/validation';
import {
  MAX_CORE_VALUES,
  MISSION_MAX_LENGTH,
  VALUE_DESC_MAX_LENGTH,
  VALUE_TITLE_MAX_LENGTH,
  VISION_MAX_LENGTH,
} from './types';

const longText = (label: string, max: number) =>
  z.string().check(
    z.refine((value) => value.trim() !== '', { error: `${label}을(를) 입력하세요.` }),
    z.refine((value) => value.length <= max, {
      error: `${label}은(는) ${String(max)}자를 넘을 수 없습니다.`,
    }),
  );

const coreValueSchema = z.object({
  title: requiredText('핵심가치 제목', VALUE_TITLE_MAX_LENGTH),
  description: z.string().check(
    z.refine((value) => value.length <= VALUE_DESC_MAX_LENGTH, {
      error: `설명은 ${String(VALUE_DESC_MAX_LENGTH)}자를 넘을 수 없습니다.`,
    }),
  ),
});

export const visionSchema = z.object({
  vision: longText('비전', VISION_MAX_LENGTH),
  mission: longText('미션', MISSION_MAX_LENGTH),
  coreValues: z.array(coreValueSchema).check(
    z.refine((values) => values.length <= MAX_CORE_VALUES, {
      error: `핵심가치는 최대 ${String(MAX_CORE_VALUES)}개까지 등록할 수 있습니다.`,
    }),
  ),
});

export type VisionFormValues = z.infer<typeof visionSchema>;
