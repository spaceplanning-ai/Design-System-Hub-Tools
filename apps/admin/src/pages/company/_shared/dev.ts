// 개발용 실패 재현 스위치 + 지연 상수 (A41 소유 — apps/admin/src/pages/company/**)
//
// 콘텐츠 어댑터(faq·notices…)의 failIfRequested 규약을 기업 관리 어댑터들이 공유한다.
// 열 개 어댑터가 같은 8줄을 복사하는 대신 여기 한 벌만 둔다(모두 pages/company 아래라 결합이 아니다).
//
// [백엔드 없음] 실제 네트워크 호출은 이 앱 어디에도 없다 — 여기 있는 것은 지연·취소·실패 재현뿐이다.
// 각 어댑터의 함수 본문에 붙은 // TODO(backend) 주석이 실제 연동 지점이다.

/** 픽스처 응답 지연 — 로딩 상태를 화면에서 볼 수 있게 한다 */
export const LATENCY_MS = 400;

/**
 * 실패 경로 재현 스위치(개발용) — 콘텐츠 어댑터와 같은 규약.
 *   ?fail=list · ?fail=save · ?fail=delete · ?fail=all · ?fail=partners:save (스코프 지정)
 */
export function failIfRequested(scope: string, op: string): void {
  const flags = new URLSearchParams(window.location.search).get('fail');
  if (flags === null) return;
  const requested = flags.split(',').map((flag) => flag.trim());
  if (requested.includes('all') || requested.includes(op) || requested.includes(`${scope}:${op}`)) {
    throw new Error('요청을 처리하지 못했습니다.');
  }
}
