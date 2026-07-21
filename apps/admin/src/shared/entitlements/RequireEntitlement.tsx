// 엔타이틀먼트 라우트 가드 + 소비 훅
//
// ┌ 중첩 순서가 곧 판정 순서다 ──────────────────────────────────────────────┐
// │   <RequireEntitlement>      ② 샀는가        → 숨김 / 잠금                │
// │     <RequirePermission>     ③ 권한이 있는가 → 403                        │
// │       <Outlet />            ④ 도메인 설정은 화면 안의 일                  │
// │     </RequirePermission>                                                 │
// │   </RequireEntitlement>                                                  │
// └──────────────────────────────────────────────────────────────────────────┘
// 플랜이 바깥에 있어야 하는 이유는 plan.ts 머리말에 적었다 — 사지 않은 기능에 '권한이 없습니다'
// 라고 말하면 운영자는 관리자에게 권한을 요청하고, 관리자도 켤 수 없어 지원 티켓이 된다.
// **이 두 줄의 순서가 그 진단을 결정한다.** 뒤집지 마라.
//
// [프론트 게이팅은 UX 층이지 보안이 아니다]
// TODO(backend): 서버에서 동일 판정을 재검증한다. 위조된 localStorage 로 이 가드는 우회되며,
// 그때 실제로 막는 것은 API 응답의 402/403 이다. 둘은 대체재가 아니라 층이다
// (shared/permissions/RequirePermission.tsx 가 권한 축에 대해 적어 둔 것과 같다).
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { UpgradeScreen } from '../errors/ErrorScreens';
import {
  planQuotaCreateBlock,
  planQuotaStatus,
  subscribeToOtherTabs,
  useEntitlementStore,
} from './entitlement-store';
import { billingNotice, entitlementStateOf } from './plan';
import type { EntitlementKey, EntitlementState, PlanState, QuotaStatus } from './plan';
import { entitlementStateForPath } from './route-entitlement';

/* ── 구독 ─────────────────────────────────────────────────────────────────── */

/** 지금 플랜 — 스토어 조각 구독이라 플랜이 바뀌지 않으면 재렌더도 없다 */
export function usePlan(): PlanState {
  return useEntitlementStore((store) => store.plan);
}

/**
 * 다른 탭의 플랜 변경을 따라간다 — AppShell 이 mount 시 한 번 건다.
 *
 * [왜 main.tsx 의 Provider 가 아닌가] 권한 축은 PermissionProvider 를 main.tsx 에 두지만, 플랜은
 * 인증 이후 화면에서만 의미가 있고 그 전부가 AppShell 안에 있다. 셸에 두면 배선 지점이 한 곳이고
 * 앱 진입(main.tsx)을 건드리지 않는다.
 */
export function useEntitlementSync(): void {
  useEffect(() => subscribeToOtherTabs(), []);
}

/* ── 판정 ─────────────────────────────────────────────────────────────────── */

/** 지금 서 있는 라우트의 3상태 — 화면이 자기 모듈 키를 알 필요가 없다(route-entitlement.ts) */
export function useRouteEntitlement(): EntitlementState {
  const { pathname } = useLocation();
  const plan = usePlan();
  return entitlementStateForPath(plan, pathname);
}

/** 특정 모듈의 3상태 — 화면 안에서 한 조각만 잠글 때 쓴다(위젯·탭·행 액션) */
export function useEntitlement(key: EntitlementKey): EntitlementState {
  return entitlementStateOf(usePlan(), key);
}

/** 쿼터 현황 — 쿼터 종이 아니면 null. 배선된 실제 건수가 저장값 usage 를 이긴다 */
export function useQuota(key: EntitlementKey): QuotaStatus | null {
  return planQuotaStatus(usePlan(), key);
}

/**
 * 신규 생성을 막아야 하는 사유 — 막지 않아도 되면 null.
 *
 * 두 갈래가 같은 결론('지금은 만들 수 없다')에 이르지만 말이 다르다:
 *   쿼터 소진   → '상품 200/200 · 상위 플랜에서 늘릴 수 있습니다.'
 *   청구 미납   → '결제가 확인되지 않아 지금은 조회만 가능합니다.'
 * 둘을 한 문구로 뭉치면 운영자는 무엇을 해야 하는지 알 수 없다 — 늘리는 일과 결제하는 일은
 * 다른 사람이 다른 행동을 해야 한다.
 */
export function useCreateBlock(key: EntitlementKey): string | null {
  const plan = usePlan();
  return billingNotice(plan) ?? planQuotaCreateBlock(plan, key);
}

/**
 * 청구 상태 때문에 쓰기가 잠겼는가 — 잠겼으면 그 사유 문구, 아니면 null.
 *
 * 화면은 이 값이 있으면 등록·수정·삭제 컨트롤을 잠근다. **조회·내보내기는 잠그지 않는다** —
 * 결제가 밀렸다고 데이터를 감추면 운영자는 무엇을 결제해야 하는지도 확인할 수 없다.
 */
export function usePlanWriteBlock(): string | null {
  return billingNotice(usePlan());
}

/* ── 가드 ─────────────────────────────────────────────────────────────────── */

/**
 * 사지 않은 화면은 본문 대신 잠금 화면을 렌더한다.
 *
 * AppShell 의 <Outlet> 을 감싸므로 **모든 라우트가 한 번에** 덮인다 — 화면마다 가드를 붙이는
 * 방식은 새 화면이 추가될 때마다 빠뜨릴 수 있다(권한 축이 같은 이유로 셸에 붙어 있다).
 *
 * [absent 는 왜 화면이 없나] 판매하지 않는 모듈이라 살 수도, 권한을 받을 수도 없다. 그 URL 은
 * 이 계정에 **존재하지 않는 주소**이므로 설명 대신 대시보드로 되돌린다 — 살 수 없는 것을 설명하는
 * 화면은 그 자체가 티저이고, 운영자는 사내 홈페이지를 뒤지다 아무것도 찾지 못한다.
 * (replace 다 — 뒤로 가기가 없는 주소로 되돌아가는 고리를 만들지 않는다.)
 */
export function RequireEntitlement({ children }: { readonly children: ReactNode }) {
  const state = useRouteEntitlement();

  if (state.kind === 'granted') return <>{children}</>;
  if (state.kind === 'absent') return <Navigate to="/dashboard" replace />;

  return <UpgradeScreen reason={state.reason} upgradeTo={state.upgradeTo} />;
}
