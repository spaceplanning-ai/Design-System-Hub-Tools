// 로고 목록 폼 검증 규칙 (A41 — 검증의 정본은 이 zod 스키마다)
import * as z from 'zod/mini';

import { optionalHttpUrl, requiredHttpUrl, requiredText } from '../_shared/validation';
import { NAME_MAX_LENGTH } from './types';

export const logoSchema = z.object({
  name: requiredText('이름', NAME_MAX_LENGTH),
  logoUrl: requiredHttpUrl('로고 이미지 URL'),
  linkUrl: optionalHttpUrl('링크 URL'),
});

export type LogoFormValues = z.infer<typeof logoSchema>;
