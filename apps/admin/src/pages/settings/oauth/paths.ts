// OAuth 화면의 경로 (시스템 설정 섹션 소유 — apps/admin/src/pages/settings/oauth/**)
//
// 목록과 상세가 서로의 주소를 만든다(타일 → 상세, 뒤로가기 → 목록). 문자열을 양쪽에 적어 두면
// 한쪽만 고쳐졌을 때 **링크가 조용히 죽는다** — 타입 검사도 테스트도 그걸 잡아 주지 못한다.
// 그래서 주소는 여기 한 군데서만 만든다.
import type { OAuthProviderId } from './validation';

/** 제공자 목록 — 두 묶음(사용 중 / 이용 가능)과 표시 정책이 사는 곳 */
export const OAUTH_LIST_PATH = '/settings/oauth';

/** 제공자 하나의 자격증명 화면 — App.tsx 의 `/settings/oauth/:provider` 와 짝이다 */
export function oauthProviderPath(provider: OAuthProviderId): string {
  return `${OAUTH_LIST_PATH}/${provider}`;
}
