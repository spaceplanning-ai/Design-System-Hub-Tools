// 라우트 → 모듈 매핑, 그리고 이 매핑이 조용히 죽는 방식들
//
// [무엇을 지키나] 매핑이 틀리면 게이팅이 **조용히 무력해진다** — 오타 하나면 그 화면은 영원히
// granted 이고(fail-open 이라 아무도 눈치채지 못한다), 두 모듈이 같은 화면을 주장하면 판정이
// 목록 순서에 좌우된다. 둘 다 화면에는 아무 증상이 없어서 테스트 말고는 잡을 방법이 없다.
import { describe, expect, it } from 'vitest';

import { PERMISSION_RESOURCES } from '../permissions/resources';
import { MODULE_RESOURCES, entitlementKeyForResource } from './module-resources';
import { ENTITLEMENT_KEYS, planStateForTier } from './plan';
import { entitlementStateForPath } from './route-entitlement';

/** 권한 모델이 아는 모든 리소스 id — 매핑이 가리킬 수 있는 유일한 좌표계 */
const KNOWN_RESOURCES: ReadonlySet<string> = new Set(
  PERMISSION_RESOURCES.flatMap((resource) => [
    resource.id,
    ...resource.children.map((child) => child.id),
  ]),
);

describe('MODULE_RESOURCES — 매핑 자체의 불변식', () => {
  /**
   * nav 에 없는 경로를 적으면 그 모듈은 아무 화면도 지배하지 않는다. fail-open 이라 화면은
   * 멀쩡히 열리고, '플랜 게이팅을 걸어 뒀다' 는 믿음만 남는다 — 가장 비싼 종류의 조용한 실패다.
   */
  it('모든 매핑 대상이 실재하는 권한 리소스다 — 오타가 매핑을 조용히 죽이지 않는다', () => {
    const unknown: string[] = [];
    for (const key of ENTITLEMENT_KEYS) {
      for (const resourceId of MODULE_RESOURCES[key]) {
        if (!KNOWN_RESOURCES.has(resourceId)) unknown.push(`${key} → ${resourceId}`);
      }
    }
    expect(unknown).toEqual([]);
  });

  it('한 화면을 두 모듈이 주장하지 않는다 — 판정이 목록 순서에 좌우되지 않게', () => {
    const seen = new Map<string, string>();
    const duplicated: string[] = [];

    for (const key of ENTITLEMENT_KEYS) {
      for (const resourceId of MODULE_RESOURCES[key]) {
        const owner = seen.get(resourceId);
        if (owner === undefined) seen.set(resourceId, key);
        else duplicated.push(`${resourceId}: ${owner} · ${key}`);
      }
    }

    expect(duplicated).toEqual([]);
    // '없음' 단언 옆의 '있음' 앵커 — 매핑이 통째로 비어도 위 단언은 통과한다
    expect(seen.size).toBeGreaterThan(0);
  });

  it('역인덱스는 매핑된 화면만 답한다', () => {
    expect(entitlementKeyForResource('page:/ai/chat')).toBe('ai.agent');
    // 앱의 뼈대(대시보드·설정·로그)는 어떤 모듈에도 속하지 않는다 — 플랜과 무관하게 늘 열린다
    expect(entitlementKeyForResource('page:/dashboard')).toBeNull();
    expect(entitlementKeyForResource('page:/settings/site')).toBeNull();
  });
});

describe('entitlementStateForPath — 권한 축과 같은 규칙으로 화면을 식별한다', () => {
  const PRO = planStateForTier('pro');
  const FREE = planStateForTier('free');

  it('사이드바 잎은 자기 모듈로 해석된다', () => {
    expect(entitlementStateForPath(FREE, '/ai/chat').kind).toBe('locked');
    expect(entitlementStateForPath(PRO, '/sales/contracts').kind).toBe('granted');
  });

  /**
   * 상세·폼 라우트는 사이드바에 없다. 여기서 부모 잎의 모듈을 물려받지 않으면 메뉴만 잠그고
   * URL 로는 그대로 들어가지는 반쪽 게이팅이 된다 — deep-link 가 실제로 열리는 곳이 그 라우트들이다.
   */
  it('상세·폼 라우트는 자기를 감싸는 잎의 모듈을 물려받는다', () => {
    expect(entitlementStateForPath(FREE, '/sales/contracts/12/edit').kind).toBe('locked');
    expect(entitlementStateForPath(FREE, '/ai/conversations/abc').kind).toBe('locked');
  });

  it('더 구체적인(긴) 잎이 이긴다 — 쿠폰이 상품 모듈로 뭉개지지 않는다', () => {
    // '/products' 는 commerce.products(쿼터·free 포함), '/products/coupons' 는 commerce.coupons(pro)
    expect(entitlementStateForPath(FREE, '/products').kind).toBe('granted');
    expect(entitlementStateForPath(FREE, '/products/coupons').kind).toBe('locked');
  });

  /**
   * 매핑이 없으면 granted 다 — **차단이 아니다.** 권한 축이 null 을 '해당 없음' 으로 읽는 것과
   * 결론은 같지만 이유가 다르다: 이 축은 모든 미지의 경우가 열리는 쪽으로 수렴한다(fail-open).
   */
  it('어떤 모듈에도 속하지 않는 경로는 granted 다', () => {
    for (const path of ['/', '/login', '/dashboard', '/settings/site', '/logs/api']) {
      expect(entitlementStateForPath(FREE, path).kind).toBe('granted');
    }
  });

  it('어떤 잎에도 속하지 않는 경로도 granted 다 — 판정 실패가 기능 정지가 되지 않는다', () => {
    expect(entitlementStateForPath(FREE, '/products-archive').kind).toBe('granted');
    expect(entitlementStateForPath(FREE, '/전혀-모르는-경로').kind).toBe('granted');
  });
});
