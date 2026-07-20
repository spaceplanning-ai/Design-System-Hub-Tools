// 사이드바 활성 표시는 **상세·편집 라우트에서도 켜져 있다** · apps/admin/src/shared/layout/**
//
// ─────────────────────────────────────────────────────────────────────────────
// [무엇을 지키나]
// 예전 사이드바는 `<NavLink ... end>` — 즉 **정확 일치** 였다. 그래서 잎 경로를 벗어나는 순간
// 메뉴가 통째로 꺼졌다:
//   /settings/oauth/kakao   → 'OAuth 설정' 이 비활성
//   /users/members/U-0001   → '회원 관리' 가 비활성
//   /products/prd-2/edit    → '상품' 이 비활성
// 상세·편집 라우트는 이 앱의 절반이다. 운영자는 자기가 어느 메뉴 안에 있는지 잃었고,
// aria-current 도 함께 사라져 스크린리더에는 '현재 페이지' 가 아예 없었다.
//
// `end` 를 그냥 떼는 것은 답이 아니다 — '/products' 가 '/products/categories' 까지 삼킨다.
// 필요한 것은 **세그먼트 경계 기준 최장 일치**이고, 그것은 nav-config 의 findCoveringLeaf 가
// 이미 하고 있다(헤더 <h1> 이 같은 함수를 쓴다). 판정이 두 벌이 되면 헤더와 사이드바가 서로
// 다른 곳을 가리키므로, 사이드바도 같은 함수를 쓴다.
//
// [왜 aria-current 로 단언하나] 시각 표시(배경색)는 인라인 스타일이라 단언이 토큰 문자열에
// 묶인다. aria-current 는 '지금 이 페이지' 를 말하는 **계약**이고, 접근성이 실제로 소비하는
// 값이다. 시각 표시만 고치고 이걸 빠뜨리면 스크린리더 사용자에겐 하나도 고쳐지지 않는다.
// ─────────────────────────────────────────────────────────────────────────────
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { PermissionProvider } from '../permissions/PermissionProvider';
import { ToastProvider } from '../ui';
import AppShell from './AppShell';
import { findCoveringLeaf } from './nav-config';

function renderAt(pathname: string): void {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <PermissionProvider>
        <ToastProvider>
          {/* main.tsx 와 같은 v7 동작으로 맞춘다 — 앱과 다른 라우터 설정 위에서 단언하지 않는다 */}
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

/** 주 내비게이션 안에서 'aria-current=page' 를 단 항목들의 href */
function activeNavHrefs(): string[] {
  const nav = screen.getByRole('navigation', { name: '주 내비게이션' });
  return [...nav.querySelectorAll('[aria-current="page"]')].map(
    (el) => el.getAttribute('href') ?? '',
  );
}

describe('사이드바 활성 표시 — 잎 아래의 라우트도 자기 메뉴를 켠다', () => {
  /** 이것이 이 파일의 본체다 — 전부 예전에는 **아무것도 켜지지 않던** 경로다 */
  it.each([
    ['/settings/oauth/kakao', '/settings/oauth'],
    ['/users/members/U-0001', '/users/members'],
    ['/content/notices/3/edit', '/content/notices'],
    ['/company/history/new', '/company/history'],
    ['/marketing/templates/mt-1/edit', '/marketing/templates'],
  ])('%s 에서는 %s 항목이 현재 페이지다', (pathname, expected) => {
    renderAt(pathname);
    expect(activeNavHrefs()).toStrictEqual([expected]);
  });

  /**
   * 반대 방향의 회귀 — `end` 를 그냥 떼면 여기서 '/products' 가 함께 켜진다.
   * 최장 일치라야 형제 잎이 서로를 삼키지 않는다.
   */
  it('상위 프리픽스를 공유하는 형제 잎은 함께 켜지지 않는다', () => {
    renderAt('/products/categories');
    expect(activeNavHrefs()).toStrictEqual(['/products/categories']);
  });

  it('목록 화면은 자기 하나만 켠다', () => {
    renderAt('/users/members');
    expect(activeNavHrefs()).toStrictEqual(['/users/members']);
  });

  /**
   * 사이드바와 헤더가 **같은 판정**을 쓰는지 — 이 둘이 갈리면 화면 이름과 켜진 메뉴가 어긋난다.
   * 기대값을 손으로 적지 않고 findCoveringLeaf 에서 가져오는 것이 요점이다.
   */
  it('활성 항목은 언제나 findCoveringLeaf 의 답과 같다', () => {
    for (const pathname of [
      '/dashboard',
      '/settings/oauth/google',
      '/portfolio/case-studies/cs-1/edit',
      '/support/tickets/tk-1',
    ]) {
      const expected = findCoveringLeaf(pathname);
      expect(expected).not.toBeNull();
      renderAt(pathname);
      expect(activeNavHrefs()).toStrictEqual([expected?.to]);
      screen.getByRole('navigation', { name: '주 내비게이션' });
      // 다음 경로를 위해 DOM 을 비운다 — render 는 컨테이너를 계속 쌓는다
      document.body.innerHTML = '';
    }
  });
});
