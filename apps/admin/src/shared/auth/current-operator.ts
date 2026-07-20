// 지금 로그인한 운영자를 도메인 화면에 알려 주는 얇은 창구
//
// ─────────────────────────────────────────────────────────────────────────────
// [왜 이 파일이 shared/auth 에 있는가 — 관리자 화면이 로그인 화면을 직접 읽으면 결합이다]
//
// 세션 저장소의 정본은 `pages/login/session.ts` 다(그 파일 머리말: "전역 인증 컨텍스트가
// 도입되면 그쪽으로 이관한다 — 현재는 로그인 화면만 세션을 읽고/쓰므로 이 폴더 안에 둔다").
// 그런데 이제 로그인 화면 말고도 세션을 물어야 하는 화면이 생겼다: 관리자 관리(pages/admins)는
// **'지금 로그인한 사람이 누구인가'** 를 알아야 자기 자신을 삭제하거나 자기 권한을 스스로
// 박탈하는 것을 막을 수 있다.
//
// 그 질문을 위해 `pages/admins → pages/login` 을 import 하면 페이지 간 결합이다
// (클린코드 점검 축1, blocker · 임계 0건). 뜻으로 풀어도 틀렸다 — 로그인 화면을 지우거나
// 갈아엎으면 관계없는 관리자 화면이 함께 죽는다는 말이 된다.
//
// 그래서 창구는 공통 층이 갖는다. 같은 폴더의 RequireAuth 가 **이미 같은 이유로** 세션을 읽고
// 있으므로(shared/auth → pages/login 은 기존 방향이다) 새 의존 방향을 만들지 않는다.
//
// [계정(이메일)으로 내려보내는 이유 — 세션에 운영자 id 가 없다]
// AuthSession 은 `{ userId, email, role }` 이고, 이 `userId` 는 **인증 사용자 id**('u-001')이지
// 운영자 명부의 id('A-00001')가 아니다. 지금 두 세계를 잇는 값은 이메일뿐이라, 소비자는
// `AdminUser.account === currentOperatorAccount()` 로 자기 자신을 찾는다. 이 가정은 여기 한 곳에
// 적어 두고, 판정은 pages/admins/guards.ts 가 순수 함수로 한다.
//
// TODO(backend): 세션에 운영자 id 가 실리면 이 가정은 사라진다 — 그때 이 함수를 id 반환으로 바꾸고
//   호출부(guards.ts 의 isCurrentOperator)의 비교 한 줄만 고치면 된다.
// ─────────────────────────────────────────────────────────────────────────────
import { readSession } from '../../pages/login/session';

/**
 * 지금 로그인한 운영자의 계정(이메일) — 세션이 없거나 깨졌으면 null.
 *
 * null 은 '자기 자신이 아니다' 가 아니라 **'알 수 없다'** 이다. 가드는 이 둘을 같게 다루지
 * 않는다: 모르면 자기 보호 규칙을 걸 수 없을 뿐이고, 마지막 시스템 관리자 보호처럼 세션과
 * 무관한 규칙은 그대로 남는다(guards.ts).
 */
export function currentOperatorAccount(): string | null {
  const session = readSession();
  if (session === null) return null;

  const account = session.email.trim();
  return account === '' ? null : account;
}
