// 파트너사 데이터 소스 어댑터
//
// [백엔드 연동 지점] 로고 목록 공용 어댑터(createLogoAdapter)에 파트너사 시드를 넣는다. 실제 연동 시
// 아래 // TODO(backend) 엔드포인트로 어댑터 본문을 바꾼다(화면·공용 모듈 코드는 그대로).
// [더미] 실명·실제 회사명 금지. 이미지는 앱이 직접 서빙하는 자리표시 자산(public/fixtures/)을 가리킨다 —
// 예전에는 cdn.example.com 을 가리켰는데 그 호스트는 **실재하지 않아서** 화면마다 이미지가 깨지고
// 콘솔에 ERR_NAME_NOT_RESOLVED 가 쌓였다(전 라우트 순회에서 36건). 백엔드가 없는 픽스처 앱이라
// 외부 호스트는 영원히 해석되지 않는다 — 자리표시는 앱 안에 있어야 실제로 그려진다.
import { createLogoAdapter } from '../logo-list/adapter';
import type { LogoItem } from '../logo-list/types';

const PARTNER_SEED: readonly LogoItem[] = [
  {
    id: 'partners-1',
    name: '알파클라우드',
    logoUrl: '/fixtures/placeholder-image.svg',
    linkUrl: 'https://example.com/alpha',
    order: 1,
    active: true,
  },
  {
    id: 'partners-2',
    name: '베타로지스틱스',
    logoUrl: '/fixtures/placeholder-image.svg',
    linkUrl: 'https://example.com/beta',
    order: 2,
    active: true,
  },
  {
    id: 'partners-3',
    name: '감마소프트',
    logoUrl: '/fixtures/placeholder-image.svg',
    linkUrl: '',
    order: 3,
    active: false,
  },
  {
    id: 'partners-4',
    name: '델타네트웍스',
    logoUrl: '/fixtures/placeholder-image.svg',
    linkUrl: 'https://example.com/delta',
    order: 4,
    active: true,
  },
];

// TODO(backend): GET/POST /api/company/partners · PUT/DELETE /api/company/partners/:id · PUT /api/company/partners/reorder · PATCH /api/company/partners/:id/active
export const partnersAdapter = createLogoAdapter('partners', PARTNER_SEED);
