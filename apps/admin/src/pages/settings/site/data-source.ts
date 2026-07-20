// 사이트 기본 설정 데이터 소스 (시스템 설정 섹션 소유 — apps/admin/src/pages/settings/**)
//
// [백엔드 연동 지점] revision(낙관적 동시성 토큰)을 함께 나르는 저장소로 설정 1건을 흉내 낸다.
// **실제 HTTP 호출은 한 줄도 없다** — 실행되는 서버가 없다. 백엔드가 붙으면 store 본문만 바뀐다.
//
// [실패/충돌 재현]
//   /settings/site?fail=load      → 조회 실패 (인라인 배너 + 다시 시도)
//   /settings/site?fail=save      → 저장 실패 (확인 다이얼로그 안 danger 배너)
//   /settings/site?fail=conflict  → 저장이 409 (동시 편집 충돌 다이얼로그)
//   /settings/site?fail=upload    → 파일 업로드 실패 (해당 항목 인라인 오류 + 재선택 가능)
import { wait } from '../../../shared/async';
import { failIfRequested, LATENCY_MS } from '../../../shared/crud';
import { createRevisionedStore } from '../_shared/store';
import type { SiteAsset, SiteSettingsValues } from './validation';

export const siteSettingsKey = ['settings', 'site'] as const;

/** `?fail=` 스위치의 스코프 — store 와 업로드가 같은 이름을 쓴다 */
const SCOPE = 'site';

/**
 * 픽스처 자산의 미리보기 소스.
 *
 * 인라인 SVG data URI 다 — 이 앱에는 정적 이미지 자산 파이프라인이 없고, 미리보기(브라우저 탭 목업·
 * OG 카드)가 **실제로 그림을 그려야** 정렬과 비율을 확인할 수 있기 때문이다. 색은 CSS 이름 색을 쓴다
 * (SVG 문자열 안에서는 토큰 CSS 변수가 해석되지 않고, hex 는 린트가 막는다 — 픽스처 한정 예외다).
 */
function svgDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const FAVICON_FIXTURE = svgDataUri(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'>" +
    "<rect width='32' height='32' rx='7' fill='steelblue'/>" +
    "<text x='16' y='23' font-family='sans-serif' font-size='19' font-weight='700'" +
    " text-anchor='middle' fill='white'>T</text></svg>",
);

const OG_IMAGE_FIXTURE = svgDataUri(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 63'>" +
    "<rect width='120' height='63' fill='lightsteelblue'/>" +
    "<rect x='10' y='14' width='46' height='6' rx='3' fill='steelblue'/>" +
    "<rect x='10' y='26' width='72' height='4' rx='2' fill='white'/>" +
    "<rect x='10' y='35' width='58' height='4' rx='2' fill='white'/>" +
    "<circle cx='96' cy='42' r='14' fill='steelblue'/></svg>",
);

const PRIVATE_IMAGE_FIXTURE = svgDataUri(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 63'>" +
    "<rect width='120' height='63' fill='gainsboro'/>" +
    "<rect x='48' y='26' width='24' height='18' rx='3' fill='slategray'/>" +
    "<path d='M54 26v-6a6 6 0 0 1 12 0v6' fill='none' stroke='slategray' stroke-width='3'/></svg>",
);

/** 현재 운영 중인 사이트 설정(이라고 가정하는 값) — 화면의 초기 상태다 */
const DEFAULT_SITE_SETTINGS: SiteSettingsValues = {
  siteName: 'TDS 스페이스플래닝',
  siteDescription: '공간 기획·설계·시공을 한 팀이 맡는 종합 공간 솔루션',

  messagingNameEnabled: true,
  messagingName: 'TDS 스페이스플래닝 고객센터',

  siteUrl: 'https://tds-spaceplanning.com',

  favicon: { name: 'favicon.ico', size: 13 * 1024, url: FAVICON_FIXTURE },
  ogImage: { name: 'og-cover.png', size: 248 * 1024, url: OG_IMAGE_FIXTURE },

  visibility: 'public',
  privateImage: { name: 'private-cover.png', size: 96 * 1024, url: PRIVATE_IMAGE_FIXTURE },

  // 기본값은 스펙이 정한 것이다 — 복사 방지 ON · 모바일 확대 OFF · 로그인 유지 ON
  copyProtection: true,
  mobileZoomAllowed: false,
  keepSignedIn: true,
};

// TODO(backend): GET /api/settings/site · PUT /api/settings/site
//   PUT 요청: If-Match: <revision> 헤더 + 바디 { siteName, siteDescription, messagingNameEnabled,
//             messagingName, favicon, ogImage, visibility, privateImage, copyProtection,
//             mobileZoomAllowed, keepSignedIn }
//   응답: 200 → { value, revision, audit } / 409·412 → 동시 편집 충돌(최신 문서를 실어 보낸다)
//        422 → 필드 검증 실패(프론트 검증은 UX 이지 보증이 아니다 — 서버가 다시 검증한다)
export const siteSettingsStore = createRevisionedStore<SiteSettingsValues>(
  SCOPE,
  DEFAULT_SITE_SETTINGS,
  { updatedBy: '박관리', updatedAt: '2026-07-09T02:14:00.000Z' },
);

/**
 * 파일 업로드 — 자산 1건을 올리고 저장 가능한 값으로 돌려받는다.
 *
 * TODO(backend): POST /api/uploads (multipart) → 응답 { name, size, url }.
 *
 * ⚠ 지금 돌려주는 url 은 `URL.createObjectURL(file)` 이 만든 **미리보기 핸들**이다. 저장된 자산이
 * 아니다 — 문서 세션이 끝나면 죽는다. 가짜 성공을 지어내지 않는 대신 이 사실을 여기 적어 둔다
 * (@tds/ui ImageUploadField 머리말과 같은 판정). 호출부는 revoke 책임을 함께 진다.
 */
export async function uploadSiteAsset(file: File, signal?: AbortSignal): Promise<SiteAsset> {
  await wait(LATENCY_MS, signal);
  failIfRequested(SCOPE, 'upload');

  return { name: file.name, size: file.size, url: URL.createObjectURL(file) };
}

/** 충돌 다이얼로그가 '어느 항목이 달라졌는지' 짚을 때 쓰는 라벨 — 필드 키와 1:1 */
export const SITE_FIELD_LABELS: Readonly<Record<keyof SiteSettingsValues, string>> = {
  siteName: '사이트 이름',
  siteDescription: '사이트 설명',
  messagingNameEnabled: '메일·SMS 전용 사이트 이름 사용',
  messagingName: '메일·SMS 전용 사이트 이름',
  siteUrl: '사이트 주소',
  favicon: '파비콘',
  ogImage: '대표 이미지',
  visibility: '공개 범위',
  privateImage: '비공개용 이미지',
  copyProtection: '복사 방지',
  mobileZoomAllowed: '모바일 확대 허용',
  keepSignedIn: '로그인 상태 유지',
};
