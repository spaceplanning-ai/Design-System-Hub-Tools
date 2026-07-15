// 기업 관리 폼 검증 공용 조각 (A41 소유 — apps/admin/src/pages/company/**)
//
// 열 개 화면의 zod 스키마가 같은 규칙을 반복한다: '비면 막고, 최대 길이를 넘으면 막는다',
// '선택 URL 은 비어 있거나 http(s) 여야 한다'. 규칙의 정본은 각 화면의 스키마지만, 이 두 조각은
// 문구까지 같아 여기 한 벌만 둔다(모두 pages/company 아래라 결합이 아니다).
import * as z from 'zod/mini';

/** URL 은 http(s) 로 시작하는 문자열만 받는다 */
const HTTP_URL_RE = /^https?:\/\/\S+$/;

/** 필수 텍스트 — 공백만이면 막고, 최대 길이를 넘으면 막는다 */
export function requiredText(label: string, max: number) {
  return z.string().check(
    z.refine((value) => value.trim() !== '', { error: `${label}을(를) 입력하세요.` }),
    z.refine((value) => value.trim().length <= max, {
      error: `${label}은(는) ${String(max)}자를 넘을 수 없습니다.`,
    }),
  );
}

/** 선택 URL — 비어 있으면 통과, 채우면 http(s) 여야 한다 */
export function optionalHttpUrl(label = '이미지 URL') {
  return z.string().check(
    z.refine((value) => value.trim() === '' || HTTP_URL_RE.test(value.trim()), {
      error: `${label} 은 http:// 또는 https:// 로 시작해야 합니다.`,
    }),
  );
}

/** 필수 URL — 비면 막고, http(s) 가 아니면 막는다 */
export function requiredHttpUrl(label = '이미지 URL') {
  return z.string().check(
    z.refine((value) => value.trim() !== '', { error: `${label}을(를) 입력하세요.` }),
    z.refine((value) => HTTP_URL_RE.test(value.trim()), {
      error: `${label} 은 http:// 또는 https:// 로 시작해야 합니다.`,
    }),
  );
}
