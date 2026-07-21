// 라우트 → 엔타이틀먼트 판정
//
// shared/permissions/route-resource.ts 와 **대칭**이다: 같은 질문('지금 이 화면은 무엇인가')에
// 같은 규칙(nav-config 의 findCoveringLeaf — 자기를 감싸는 가장 구체적인 잎)으로 답한다.
// 두 축이 서로 다른 규칙으로 화면을 식별하면 상세·폼 라우트에서 답이 갈린다 — 권한은 상품으로
// 푸는데 플랜은 카테고리로 푸는 식이다. 그래서 잎 판정은 계속 nav-config 한 곳이 소유한다.
//
// [단 하나 반대인 것 — 매핑이 없을 때]
// route-resource 는 null(권한 모델에 없음)을 돌려주고 RequirePermission 이 그것을 '통과' 로 읽는다.
// 여기서는 그 자리에서 곧바로 **granted** 를 돌려준다. 결론은 같지만 이유가 다르다:
// 권한 축은 '이 경로는 게이팅 대상이 아니다' 이고, 엔타이틀먼트 축은 '모르면 연다(fail-open)' 다.
// 이 축은 **모든** 미지의 경우가 granted 로 수렴한다 — 판정 실패가 기능 정지가 되면 안 된다.
import { findCoveringLeaf } from '../layout/nav-config';
import { navPageResourceId } from '../permissions/resources';
import type { ResourceId } from '../permissions/resources';
import { entitlementKeyForResource } from './module-resources';
import { entitlementStateOf } from './plan';
import type { EntitlementState, PlanState } from './plan';

const GRANTED: EntitlementState = { kind: 'granted' };

/** 이 리소스의 판정 — 모듈에 속하지 않는 화면은 granted (앱의 뼈대는 플랜과 무관하다) */
export function entitlementStateForResource(
  plan: PlanState,
  resourceId: ResourceId,
): EntitlementState {
  const key = entitlementKeyForResource(resourceId);
  return key === null ? GRANTED : entitlementStateOf(plan, key);
}

/**
 * 이 경로의 판정.
 *
 * 상세·폼 라우트('/sales/contracts/12/edit')는 사이드바에 없지만 자기를 감싸는 잎의 모듈을
 * 물려받는다 — deep-link 로 실제로 열리는 곳이 바로 그 라우트들이라, 여기서 상속하지 않으면
 * 메뉴만 잠그고 화면은 그대로 열리는 반쪽 게이팅이 된다(EXC-03 이 권한 축에서 배운 것과 같다).
 */
export function entitlementStateForPath(plan: PlanState, pathname: string): EntitlementState {
  const leaf = findCoveringLeaf(pathname);
  if (leaf === null) return GRANTED;
  return entitlementStateForResource(plan, navPageResourceId(leaf.to));
}
