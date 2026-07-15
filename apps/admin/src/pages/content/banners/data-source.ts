// 배너 데이터 소스 어댑터 (A41 소유 — apps/admin/src/pages/content/banners/**)
//
// [백엔드 연동 지점] 함수 시그니처가 프론트 ↔ 백엔드 계약이다. 지금은 픽스처를 돌려준다.
// [이미지 업로드 없음] 이미지는 URL 문자열로만 저장한다 — TODO(backend): POST /api/uploads.
import { wait } from '../../../shared/async';
import { PAGE_SIZE } from './types';
import type { Banner, BannerListResult, BannerPlacement } from './types';

const LATENCY_MS = 400;

type FailureOp = 'all' | 'list' | 'save' | 'delete';

function failIfRequested(op: FailureOp): void {
  const flags = new URLSearchParams(window.location.search).get('fail');
  if (flags === null) return;
  const requested = flags.split(',').map((flag) => flag.trim());
  if (requested.includes('all') || requested.includes(op)) {
    throw new Error('요청을 처리하지 못했습니다.');
  }
}

/* ── 픽스처 ──────────────────────────────────────────────────────────────── */

const PLACEMENTS: readonly BannerPlacement[] = ['main', 'sub'];
const TITLE_SEED = ['봄 시즌 기획전', '신상품 입고', '무료배송 이벤트', '브랜드데이'];

function makeBanner(index: number): Banner {
  const placement = PLACEMENTS[index % PLACEMENTS.length] ?? 'main';
  const seq = String(index + 1).padStart(3, '0');
  const month = (index % 12) + 1;
  const mm = String(month).padStart(2, '0');
  return {
    id: `BN-${seq}`,
    title: `${TITLE_SEED[index % TITLE_SEED.length] ?? '배너'} (${seq})`,
    imageUrl: `https://cdn.example.com/banners/${seq}.png`,
    linkUrl: index % 3 === 0 ? '' : `https://example.com/promo/${seq}`,
    placement,
    startAt: `2026-${mm}-01`,
    endAt: `2026-${mm}-28`,
    enabled: index % 4 !== 0,
    order: index + 1,
  };
}

/** 정렬 순서 오름차순 — 서버가 order 기준으로 내려주는 것을 흉내 낸다 */
export const BANNERS: readonly Banner[] = Array.from({ length: 12 }, (_, index) =>
  makeBanner(index),
).sort((a, b) => a.order - b.order);

/* ── 조회 ────────────────────────────────────────────────────────────────── */

export interface BannerQuery {
  readonly placement: 'all' | BannerPlacement;
  readonly keyword: string;
  readonly page: number;
}

/** 위치 + 제목 키워드 — 서버 쿼리로 대체될 자리. **테스트가 이 함수를 직접 부른다.** */
export function applyQuery(
  query: BannerQuery,
  source: readonly Banner[] = BANNERS,
): readonly Banner[] {
  const keyword = query.keyword.trim().toLowerCase();
  return source.filter((banner) => {
    if (query.placement !== 'all' && banner.placement !== query.placement) return false;
    if (keyword === '') return true;
    return banner.title.toLowerCase().includes(keyword);
  });
}

// TODO(backend): GET /api/banners?placement=&keyword=&page=&size=
export async function fetchBanners(
  query: BannerQuery,
  signal: AbortSignal,
): Promise<BannerListResult> {
  await wait(LATENCY_MS, signal);
  failIfRequested('list');

  const filtered = applyQuery(query);
  const start = (query.page - 1) * PAGE_SIZE;
  return {
    banners: filtered.slice(start, start + PAGE_SIZE),
    total: filtered.length,
  };
}

/* ── 쓰기 계열 ───────────────────────────────────────────────────────────── */

export interface BannerInput {
  readonly title: string;
  readonly imageUrl: string;
  readonly linkUrl: string;
  readonly placement: BannerPlacement;
  readonly startAt: string;
  readonly endAt: string;
  readonly enabled: boolean;
  readonly order: number;
}

// TODO(backend): POST /api/banners
export async function createBanner(input: BannerInput, signal?: AbortSignal): Promise<void> {
  void input;
  await wait(LATENCY_MS, signal);
  failIfRequested('save');
}

// TODO(backend): PUT /api/banners/:id
export async function updateBanner(
  id: string,
  input: BannerInput,
  signal?: AbortSignal,
): Promise<void> {
  void id;
  void input;
  await wait(LATENCY_MS, signal);
  failIfRequested('save');
}

// TODO(backend): DELETE /api/banners/:id
export async function deleteBanner(id: string, signal?: AbortSignal): Promise<void> {
  void id;
  await wait(LATENCY_MS, signal);
  failIfRequested('delete');
}
