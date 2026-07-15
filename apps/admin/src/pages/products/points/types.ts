// 적립금 정책 화면 전용 타입 · 옵션 (A41 소유 — apps/admin/src/pages/products/**)
//
// 적립금은 회원 상세의 PointsCard(개별 회원 잔액)와 별개의 **정책 설정형**이다: 적립률·기준·사용조건·
// 유효기간을 문서 1건으로 관리한다. 단일 문서형 프레임워크(createDocumentStore + DocumentFormShell)를 쓴다.
import type { PointsPolicyValues } from './validation';

/** 적립 기준 — 결제금액/주문금액 */
export const EARN_BASELINE_OPTIONS = [
  { id: 'payment', label: '실결제금액' },
  { id: 'order', label: '주문금액(할인 전)' },
] as const;

/** 화면 진입 시 기본값(픽스처) */
export const DEFAULT_POINTS_POLICY: PointsPolicyValues = {
  earnRate: '1',
  earnBaseline: 'payment',
  signupBonus: '3000',
  minUseAmount: '5000',
  useUnit: '100',
  maxUseRate: '50',
  expireMonths: '12',
} as const;
