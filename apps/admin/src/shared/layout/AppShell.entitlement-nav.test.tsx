// 사이드바의 플랜 축 — absent 는 사라지고 locked 는 남는다 (EXC-21) · apps/admin/src/shared/layout/**
//
// ─────────────────────────────────────────────────────────────────────────────
// [무엇을 지키나]
// 메뉴 가시성에서 두 상태가 **반대 방향**으로 움직인다. 이것이 이 축에서 가장 뒤집히기 쉬운 규칙이다:
//   absent (판매하지 않는 모듈) → 항목째 사라진다. 살 수도 권한을 받을 수도 없으니 티저가 된다.
//   locked (상위 플랜에 있음)   → **남긴다.** 자물쇠 꼬리표를 달아 '살 수 있다' 는 사실을 보여 준다.
// 둘을 한 방향으로 뭉개는 것(둘 다 숨김 / 둘 다 표시)이 가장 흔한 사고이고, 어느 쪽으로 뭉개도
// 화면은 멀쩡해 보인다 — 사라진 메뉴를 아무도 그리워하지 않고, 잠긴 메뉴는 눌러 봐야 안다.
//
// [왜 꼬리표가 글자인가 — 단언도 글자로 한다]
// 색·아이콘만으로 상태를 전달하지 않는다(WCAG 1.4.1). 잠금 표시는 라벨에 붙는 글자
// (plan.ts 의 LOCKED_NAV_SUFFIX)이므로 스크린리더가 그대로 읽는다. 그래서 여기서는 접근 가능한
// **이름**으로 단언한다 — 시각 표시만 고치고 이름을 빠뜨리면 SR 사용자에겐 아무것도 고쳐지지 않는다
// (AppShell.nav-active.test.tsx 가 aria-current 로 단언한 것과 같은 판단이다).
//
// [DS Sidebar 는 열린 가지의 자식만 렌더한다]
// 그래서 각 테스트는 자기가 보려는 가지 **안쪽 경로**에서 렌더한다 — 닫힌 가지에서 '자식이 없다' 는
// 단언은 플랜과 무관하게 언제나 통과하는 공허한 단언이 된다.
// ─────────────────────────────────────────────────────────────────────────────
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useEntitlementStore } from '../entitlements/entitlement-store';
import { LOCKED_NAV_SUFFIX, planStateForTier } from '../entitlements/plan';
import type { PlanState } from '../entitlements/plan';
import { PermissionProvider } from '../permissions/PermissionProvider';
import { ToastProvider } from '../ui';
import AppShell from './AppShell';

/** 마케팅 가지 안의 중립 경로 — 이 가지가 펼쳐진 상태에서 형제 잎들을 본다 */
const MARKETING_PATH = '/marketing/events';
/** AI 가지 안의 경로 — 가지 전체가 한 모듈(ai.agent)이라 그룹 라벨까지 함께 볼 수 있다 */
const AI_PATH = '/ai/chat';

const PRISTINE_PLAN = useEntitlementStore.getState().plan;

function seedPlan(plan: PlanState): void {
  useEntitlementStore.getState().receivePlan(plan);
}

/** SMS 를 명시적으로 끈 플랜 — 티어 사다리에 없는 모듈(minTier: null)은 이때만 absent 가 된다 */
function planWithSmsOff(): PlanState {
  return {
    ...planStateForTier('enterprise'),
    overrides: { 'marketing.sms': { kind: 'switch', enabled: false } },
  };
}

/** AppShell.nav-active.test.tsx 와 같은 배선 — 앱과 다른 라우터·Provider 위에서 단언하지 않는다 */
function renderAt(pathname: string): void {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <PermissionProvider>
        <ToastProvider>
          <MemoryRouter
            initialEntries={[pathname]}
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <Routes>
              <Route element={<AppShell />}>
                <Route path="*" element={<div>본문</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </PermissionProvider>
    </QueryClientProvider>,
  );
}

/** 주 내비게이션 안에서만 찾는다 — 본문(잠금 화면)의 글자가 단언에 섞이지 않게 한다 */
function nav(): HTMLElement {
  return screen.getByRole('navigation', { name: '주 내비게이션' });
}

beforeEach(() => {
  // 기본 자세: 전 기능 가용. 각 테스트가 자기가 보려는 모듈 하나만 닫는다.
  seedPlan(planStateForTier('enterprise'));
});

afterEach(() => {
  useEntitlementStore.setState({ plan: PRISTINE_PLAN });
});

/* ── absent — 항목째 사라진다 ─────────────────────────────────────────────── */

describe('absent — 살 수 없는 모듈은 메뉴에서 사라진다', () => {
  /**
   * 앵커다. 이것이 없으면 아래의 '사라진다' 단언은 **메뉴를 통째로 못 그려도** 통과한다
   * (그 종류의 공허한 통과가 이 축에서 가장 비싸다 — 아무도 사라진 메뉴를 그리워하지 않는다).
   */
  it('플랜이 열려 있으면 그 항목이 메뉴에 있다', () => {
    renderAt(MARKETING_PATH);

    expect(within(nav()).getByRole('link', { name: 'SMS 발송' })).not.toBeNull();
  });

  it('명시적으로 꺼진 모듈의 항목은 사라진다 — 형제와 묶음은 그대로 남는다', () => {
    seedPlan(planWithSmsOff());
    renderAt(MARKETING_PATH);

    expect(within(nav()).queryByRole('link', { name: 'SMS 발송' })).toBeNull();
    // 잠금 꼬리표를 달고 남는 것도 아니다 — absent 는 '숨김' 이지 '잠금' 이 아니다
    expect(within(nav()).queryByRole('link', { name: `SMS 발송${LOCKED_NAV_SUFFIX}` })).toBeNull();
    // 한 잎이 사라졌다고 묶음이나 형제까지 사라지지 않는다
    expect(within(nav()).getByRole('link', { name: '이메일 발송' })).not.toBeNull();
    expect(within(nav()).getByRole('button', { name: /마케팅 관리/ })).not.toBeNull();
  });
});

/* ── locked — 남되 잠금 표시가 붙는다 ─────────────────────────────────────── */

describe('locked — 상위 플랜의 모듈은 메뉴에 남고 잠금 표시가 붙는다', () => {
  beforeEach(() => {
    // AI 에이전트는 엔터프라이즈 전에는 잠긴다 — free 는 가장 확실한 잠금 상태다
    seedPlan(planStateForTier('free'));
  });

  it('잎이 사라지지 않는다 — 살 수 있다는 사실을 보여 주는 것이 목적이다', () => {
    renderAt(AI_PATH);

    expect(within(nav()).getByRole('link', { name: `새 채팅${LOCKED_NAV_SUFFIX}` })).not.toBeNull();
    // 꼬리표 없는 원래 이름으로는 더 이상 찾히지 않는다 — 표시가 실제로 붙었다는 뜻이다
    expect(within(nav()).queryByRole('link', { name: '새 채팅' })).toBeNull();
  });

  /**
   * 가지 전체가 한 모듈일 때는 묶음 제목에도 표시가 붙는다. 자식만 표시하면 접힌 상태의
   * 사이드바에서는 잠겼다는 사실이 아예 보이지 않는다 — 운영자는 열어 봐야만 안다.
   */
  it('가지 전체가 한 모듈이면 묶음 제목에도 잠금 표시가 붙는다', () => {
    renderAt(AI_PATH);

    expect(
      within(nav()).getByRole('button', { name: new RegExp(`AI 에이전트${LOCKED_NAV_SUFFIX}`) }),
    ).not.toBeNull();
  });

  /** 반대 방향 — 열린 모듈에 꼬리표가 새어 나가면 모든 메뉴가 잠긴 것처럼 읽힌다 */
  it('열린 모듈에는 꼬리표가 붙지 않는다', () => {
    renderAt(MARKETING_PATH);

    expect(within(nav()).getByRole('link', { name: 'SMS 발송' })).not.toBeNull();
    expect(within(nav()).queryByRole('link', { name: `SMS 발송${LOCKED_NAV_SUFFIX}` })).toBeNull();
  });
});
