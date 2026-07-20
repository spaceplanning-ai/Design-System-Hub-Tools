// 등록 CTA 는 create 권한이 있을 때만 존재한다 (EXC-03) — 목록 화면 12종
//
// ─────────────────────────────────────────────────────────────────────────────
// [무엇을 지키나]
// CrudListShell 은 **수정·삭제**를 스스로 게이팅한다(canUpdate/canRemove). 그런데 등록 CTA 는
// 화면이 toolbar 로 넘기는 ReactNode 라 껍데기가 붙잡을 손잡이가 없고(CrudListShell.tsx:114-115),
// 그래서 아래 12개 화면은 **읽기 전용 역할에게도 등록 버튼을 그대로 보여 주고 있었다.** 누르면
// /new 폼까지 열린다 — RequirePermission 은 read 만 보므로 폼도 막지 않는다.
//
// 이는 EXC-03 이 고쳤다고 선언한 바로 그 결함("read 전용 역할이 등록 버튼을 그대로 보고 누를 수
// 있었다")이 목록 화면에 남아 있던 것이다. ProductListPage 가 이미 옳은 형태다
// (products/items/ProductListPage.tsx:119,256 — canCreate 로 CTA 자체를 만들지 않는다).
//
// [왜 표본이 아니라 12개 전부인가]
// 지시는 대표 3~4개면 족하다고 했다. 그런데 이 결함의 성질이 **화면마다 독립**이다 — 껍데기가
// 아니라 각 화면이 따로 canCreate 를 적어야 하므로, 한 화면이 빠지면 그 화면만 조용히 무방비가
// 된다(route-resource.ts 가 화면별 resourceId 배선을 거부한 것과 같은 논리). 표본 검사는 바로
// 그 '한 곳만 빠뜨림' 을 원리적으로 못 잡는다. 12개가 구조적으로 동일해 테이블 한 벌로 전수
// 커버가 되므로, 표본을 고를 이유가 없다.
//
// [왜 '뷰어' 역할인가] 손으로 매트릭스를 조립하지 않는다. '뷰어'는 앱이 실제로 배포하는 기본
// 역할 3종 중 하나이며(roles.ts createDefaultRoles) 정의상 전 리소스 read-only 다. 손으로 만든
// 매트릭스는 enforceMatrix 의 불변식(read 의존)을 우회할 수 있어 실제 운영 상태가 아니게 된다.
//
// [왜 toolbar 를 로딩과 무관하게 단언할 수 있나] CrudListShell 은 firstLoading·error 와 무관하게
// toolbar 를 항상 렌더한다(CrudListShell.tsx:132 — 분기 바깥). 따라서 어댑터 응답을 기다릴
// 필요가 없고, 이 테스트는 데이터 소스에 의존하지 않는다.
// ─────────────────────────────────────────────────────────────────────────────
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ComponentType } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { usePermissionStore } from '../shared/permissions/permission-store';
import { OPERATOR_ROLE_ID, VIEWER_ROLE_ID } from '../shared/permissions/roles';
import { ToastProvider } from '../shared/ui';

import CertificatesListPage from './company/certificates/CertificatesListPage';
import EsgListPage from './company/esg/EsgListPage';
import HistoryListPage from './company/history/HistoryListPage';
import CaseStudyListPage from './portfolio/case-studies/CaseStudyListPage';
import PortfolioListPage from './portfolio/items/PortfolioListPage';
import CouponListPage from './products/coupons/CouponListPage';
import AccountListPage from './sales/accounts/AccountListPage';
import ContractListPage from './sales/contracts/ContractListPage';
import ProjectListPage from './sales/projects/ProjectListPage';
import QuoteListPage from './sales/quotes/QuoteListPage';
import DownloadListPage from './support/downloads/DownloadListPage';
import RepliesPage from './support/replies/RepliesPage';

interface ListScreen {
  /** 라우트 — 여기서 권한 리소스가 파생된다 (route-resource.ts) */
  readonly path: string;
  readonly Page: ComponentType;
  /** 등록 버튼의 접근성 이름. 아이콘은 aria-hidden 이라 텍스트만 남는다 */
  readonly createLabel: string;
}

/** 각 화면의 LIST_PATH 상수와 등록 버튼 라벨을 그대로 옮긴 것 */
const SCREENS: readonly ListScreen[] = [
  { path: '/company/certificates', Page: CertificatesListPage, createLabel: '인증서/특허 등록' },
  { path: '/company/esg', Page: EsgListPage, createLabel: 'ESG 활동 등록' },
  { path: '/company/history', Page: HistoryListPage, createLabel: '연혁 등록' },
  { path: '/portfolio/case-studies', Page: CaseStudyListPage, createLabel: '성공 사례 등록' },
  { path: '/portfolio/items', Page: PortfolioListPage, createLabel: '포트폴리오 등록' },
  { path: '/products/coupons', Page: CouponListPage, createLabel: '쿠폰 등록' },
  { path: '/sales/accounts', Page: AccountListPage, createLabel: '거래처 등록' },
  { path: '/sales/contracts', Page: ContractListPage, createLabel: '계약 등록' },
  { path: '/sales/projects', Page: ProjectListPage, createLabel: '프로젝트 등록' },
  { path: '/sales/quotes', Page: QuoteListPage, createLabel: '견적 등록' },
  { path: '/support/downloads', Page: DownloadListPage, createLabel: '자료 등록' },
  { path: '/support/replies', Page: RepliesPage, createLabel: '템플릿 등록' },
];

function renderAt({ path, Page }: ListScreen): void {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}>
          <Page />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

/** 스토어는 모듈 싱글턴이라 테스트 사이에 역할이 새지 않게 매번 되돌린다 */
beforeEach(() => {
  usePermissionStore.getState().activateRole(OPERATOR_ROLE_ID);
});

afterEach(() => {
  usePermissionStore.getState().activateRole(OPERATOR_ROLE_ID);
});

describe('목록 등록 CTA 는 create 권한을 따른다 (EXC-03)', () => {
  it.each(SCREENS.map((screenDef) => [screenDef.path, screenDef] as const))(
    '%s — create 권한이 없으면 등록 버튼이 존재하지 않는다',
    (_path, screenDef) => {
      usePermissionStore.getState().activateRole(VIEWER_ROLE_ID);
      renderAt(screenDef);

      expect(screen.queryByRole('button', { name: screenDef.createLabel })).toBeNull();
    },
  );

  /**
   * 반대 방향 — 이게 없으면 '버튼을 아예 지웠다' 로도 위 단언이 통과한다.
   * 즉 위 12건이 헛돌지 않는다는 것을 같은 파일 안에서 보장한다.
   */
  it.each(SCREENS.map((screenDef) => [screenDef.path, screenDef] as const))(
    '%s — create 권한이 있으면 등록 버튼이 보인다',
    (_path, screenDef) => {
      renderAt(screenDef);

      expect(screen.queryByRole('button', { name: screenDef.createLabel })).not.toBeNull();
    },
  );
});
