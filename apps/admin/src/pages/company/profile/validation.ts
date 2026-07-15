// 회사 정보 폼 검증 규칙 (A41 — 검증의 정본은 이 zod 스키마다. 진입점은 zod/mini)
import * as z from 'zod/mini';

import { optionalHttpUrl, requiredText } from '../_shared/validation';
import {
  ADDRESS_MAX_LENGTH,
  COMPANY_NAME_MAX_LENGTH,
  CONTACT_MAX_LENGTH,
  NAME_MAX_LENGTH,
} from './types';

/** 사업자등록번호 — 3-2-5 숫자 */
const BUSINESS_NUMBER_RE = /^\d{3}-\d{2}-\d{5}$/;

export const companyProfileSchema = z.object({
  companyName: requiredText('회사명', COMPANY_NAME_MAX_LENGTH),
  businessNumber: z.string().check(
    z.refine((value) => value.trim() !== '', { error: '사업자등록번호를 입력하세요.' }),
    z.refine((value) => BUSINESS_NUMBER_RE.test(value.trim()), {
      error: '사업자등록번호 형식이 올바르지 않습니다. (예: 123-45-67890)',
    }),
  ),
  address: requiredText('주소', ADDRESS_MAX_LENGTH),
  ceoName: requiredText('대표자명', NAME_MAX_LENGTH),
  contact: requiredText('연락처', CONTACT_MAX_LENGTH),
  // 로고는 선택 — 비우면 통과하고, 채우면 http(s) URL 이어야 한다.
  logoUrl: optionalHttpUrl('로고 이미지 URL'),
});

export type CompanyProfileFormValues = z.infer<typeof companyProfileSchema>;
