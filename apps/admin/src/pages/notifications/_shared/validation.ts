// 알림 관리 폼 검증 공용 조각 (apps/admin/src/pages/notifications/**)
//
// [왜 shared/crud 의 requiredText 를 쓰지 않는가 — ERP-13]
//   공용 requiredText 는 '${label}을(를) 입력하세요.' / '${label}은(는) …' 처럼 **리터럴 조사**를 낸다.
//   스펙 ERP-13 은 사용자 대상 문자열에서 '이(가)'·'을(를)'·'은(는)' 을 0건으로 요구한다. shared/** 는
//   이번 배치에서 수정 금지라 공용 헬퍼를 고칠 수 없어, 이 섹션 문구용으로 조사를 골라 붙이는 같은 모양의
//   조각을 여기 둔다(동작은 동일, 문구만 올바르다).
//   → shared/crud/validation.requiredText 자체를 조사 헬퍼로 고치는 것이 정답이라 보고서에 올린다.
import * as z from 'zod/mini';

import { objectParticle, topicParticle } from './notification';

/** 필수 텍스트 — 공백만이면 막고, 최대 길이를 넘으면 막는다. 조사는 라벨 받침에 맞춰 고른다 */
export function requiredKoreanText(label: string, max: number) {
  return z.string().check(
    z.refine((value) => value.trim() !== '', {
      error: `${label}${objectParticle(label)} 입력하세요.`,
    }),
    z.refine((value) => value.trim().length <= max, {
      error: `${label}${topicParticle(label)} ${String(max)}자를 넘을 수 없습니다.`,
    }),
  );
}
