// 도메인 배선 — 서로를 모르는 두 도메인을 합성 지점에서 잇는다
//
// [왜 필요한가] 관리자 그룹 삭제 가드는 "이 그룹을 발신 프로필로 쓰는 템플릿이 있나?" 를 알아야
// 하는데 그 답은 메시지 템플릿(마케팅)이 갖고 있다. 관리자 화면이 마케팅 스토어를 직접 import
// 하면 pages/admins → pages/marketing 결합이 되고 code-quality 축1 이 blocker 로 잡는다.
// 그래서 공통 층이 조회기의 **자리만** 만들고(shared/fixtures/admin-groups.ts), 구현을 꽂는 일은
// 두 도메인을 모두 아는 이 파일이 한다. 화면끼리는 끝까지 서로를 모른다.
//
// [왜 App.tsx 가 아니라 별도 파일인가] 배선은 앱이 뜰 때도, **테스트가 그 경로를 밟을 때도** 필요하다.
// App.tsx 안에 두면 페이지 단위 테스트는 App 을 렌더하지 않으므로 배선이 빠진 채로 돈다 — 그러면
// 조회기가 없어 삭제가 전부 거절되고(fail-closed), 테스트는 제품이 아니라 미배선 상태를 검증하게 된다.
// import 한 번으로 끝나는 부수효과라 파일 하나로 떼어 두 곳이 같은 것을 쓰게 한다.
//
// [AI 도메인 배선은 여기 없다 — wiring-ai.ts] 이유는 같지만 비용이 다르다. 그쪽은 상품·문의
// 스토어를 통째로 끌어오므로, 여기 두면 `wireDomains()` 를 부르는 운영자 그룹 테스트가 자기와
// 무관한 픽스처까지 매번 적재한다. 배선은 필요한 곳만 지불하면 된다.
import { registerSenderUsageLookup } from './shared/fixtures/admin-groups';
import { templateNamesBySenderProfile } from './pages/marketing/message-templates/store';
import { registerTemplateVariableCatalog } from './shared/domain/template-variables';
import { TEMPLATE_VARIABLE_CATALOG } from './shared/domain/template-variable-catalog';

/**
 * 배선을 건다 — 여러 번 불러도 결과가 같다(멱등).
 *
 * 테스트는 파일마다 모듈을 새로 들여올 수 있으므로 '한 번만 호출' 을 요구하지 않는다.
 */
export function wireDomains(): void {
  registerSenderUsageLookup(templateNamesBySenderProfile);

  // 치환 변수 카탈로그 — 6개 도메인(회원·영업·콘텐츠·상품·포트폴리오·고객센터)의 값 목록을
  // 마케팅 편집기가 쓸 수 있게 꽂는다.
  //
  // [왜 편집기가 직접 import 하지 않나] 그러면 '어떤 목록을 쓰는가' 를 편집기가 정하게 된다.
  // 카탈로그는 6개 도메인의 지식이고 편집기는 마케팅의 것이라 소유자가 다르다 — 소유자가
  // 다른 둘을 잇는 자리가 여기다(이 파일 머리말의 첫 문단과 같은 이유).
  //
  // [배선 전에는 '모른다'] 등록되지 않으면 조회기가 빈 배열이 아니라 null 을 준다. 발신 프로필
  // 쪽의 fail-closed 와 반대 방향인 이유는 template-variables.ts 머리말에 적었다 — 요약하면,
  // 빈 목록으로 뭉개면 '알 수 없는 토큰' 경고가 멀쩡한 본문을 전부 오타로 신고한다.
  registerTemplateVariableCatalog(TEMPLATE_VARIABLE_CATALOG);
}
