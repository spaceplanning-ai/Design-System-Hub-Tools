// 문의 잔여량 조회 seam — '문의 메뉴를 지워도 되는가' 에 답하는 자리
//
// [왜 seam 인가] 이 질문의 답은 상품 문의(pages/products/inquiries)와 프로그램 문의
// (pages/programs/inquiries)가 갖고 있고, 묻는 쪽은 사이드바(shared/layout)와 대시보드
// (pages/dashboard)와 통계(pages/stats)다. 묻는 쪽이 답하는 쪽을 직접 import 하면 페이지 간
// 결합(code-quality 축1 · 임계 0)이고, shared → pages 역의존까지 생긴다. 그래서 공통 층은
// **자리만** 만들고, 두 도메인을 모두 아는 src/wiring.ts 가 구현을 꽂는다
// (shared/fixtures/admin-groups.ts · shared/domain/order-ref.ts 와 같은 판단).
//
// [배선 전에는 '모른다'(null) — 빈 값이 아니다]
// 조회기가 없을 때 0 을 돌려주면 **메뉴가 사라진다**. 그 결과는 과거 문의로 가는 길이 통째로
// 끊기는 것이고, 원인은 데이터가 없어서가 아니라 배선을 잊어서다. 그래서 모를 때는 null 이고,
// 메뉴 규칙은 null 을 '남긴다' 쪽으로 읽는다(fail-open). 지우는 쪽으로 실패하면 복구가 없다.
import { pgSellable } from './payment-settings';
import type { CommerceDomain, PaymentSettings } from './payment-settings';

/** 한 도메인의 잔여 문의 — 사이드바·대시보드·통계가 함께 읽는다 */
export interface InquiryBacklog {
  /**
   * **보관 중인 전체 문의 건수(종결 포함)** — 메뉴를 지워도 되는지 판정하는 값.
   *
   * 미종결만 세면 안 된다: 답변을 끝낸 문의도 고객이 전화로 문의번호를 대며 다시 물을 기록이고,
   * 감사 대상이다. 그걸 0 으로 읽고 메뉴를 지우면 과거 문의가 통째로 접근 불가가 된다.
   */
  readonly total: number;
  /** 아직 종결되지 않은 문의 건수 — 대시보드의 '답변 대기', 통계의 '문의 건수' */
  readonly open: number;
  /** 응답 기한(SLA)을 넘긴 건수 — 대시보드의 '지금 급한 것' */
  readonly slaBreached: number;
  /** 최초 응답까지 걸린 평균 시간(시간 단위). 답변 이력이 없으면 null */
  readonly averageResponseHours: number | null;
  /** 대상(상품 id · 프로그램 id) → 미종결 건수. 목록의 행 배지가 읽는다 */
  readonly byTarget: Readonly<Record<string, number>>;
}

type InquiryBacklogLookup = (domain: CommerceDomain) => InquiryBacklog;

let lookup: InquiryBacklogLookup | null = null;

/** 앱 부팅(wiring.ts)에서 한 번 꽂는다 — 여러 번 불러도 결과가 같다 */
export function registerInquiryBacklogLookup(next: InquiryBacklogLookup): void {
  lookup = next;
}

/** 배선을 걷어낸다 — 테스트가 서로의 등록을 물려받지 않게 한다 */
export function resetInquiryBacklogLookup(): void {
  lookup = null;
}

/** 지금 잔여 문의. **배선 전에는 null(모름)** — 0 과 구분된다(머리말) */
export function readInquiryBacklog(domain: CommerceDomain): InquiryBacklog | null {
  return lookup === null ? null : lookup(domain);
}

/** 이 상품/프로그램에 달린 미종결 문의 건수. 모르면 null */
export function inquiryCountFor(domain: CommerceDomain, targetId: string): number | null {
  const backlog = readInquiryBacklog(domain);
  // noUncheckedIndexedAccess — 없는 키는 undefined 다. '문의 0건' 과 같은 뜻이라 0 으로 읽는다
  return backlog === null ? null : (backlog.byTarget[targetId] ?? 0);
}

/* ── 견적 퍼널 seam ────────────────────────────────────────────────────────── */

/**
 * 결제가 없는 동안 매출을 대신하는 지표 — 견적이 얼마나 나갔고 얼마나 받아들여졌는가.
 *
 * 정본은 영업(pages/sales/quotes)이다. 통계 화면(pages/stats)이 직접 읽으면 페이지 간 결합이라
 * 위 문의 조회기와 같은 자리에 seam 을 둔다. 배선 전에는 null(모름) — 0% 를 그리지 않는다.
 */
export interface QuoteFunnel {
  /** 기간 안에 발행한 견적 건수 */
  readonly issued: number;
  /** 그중 수락된 건수 */
  readonly accepted: number;
}

type QuoteFunnelLookup = () => QuoteFunnel;

let quoteLookup: QuoteFunnelLookup | null = null;

export function registerQuoteFunnelLookup(next: QuoteFunnelLookup): void {
  quoteLookup = next;
}

export function resetQuoteFunnelLookup(): void {
  quoteLookup = null;
}

export function readQuoteFunnel(): QuoteFunnel | null {
  return quoteLookup === null ? null : quoteLookup();
}

/** 수락률(%) — 발행이 0 이면 나눌 것이 없다(0%) */
export function quoteAcceptanceRate(funnel: QuoteFunnel): number {
  return funnel.issued === 0 ? 0 : (funnel.accepted / funnel.issued) * 100;
}

/* ── 조건부 메뉴 규칙 ──────────────────────────────────────────────────────── */

/**
 * 문의 메뉴가 지금 어떤 상태인가.
 *
 * - `open`    : 문의가 정상 유입된다(PG 미사용) — 평소의 메뉴
 * - `archive` : 새 문의는 들어오지 않지만 **과거 문의가 남아 있다** — 메뉴는 남기고 읽기 전용 표기
 * - `hidden`  : 새 문의도, 남은 문의도 없다 — 메뉴를 없앤다
 *
 * [왜 지우지 않고 archive 를 두는가] 오너의 요구는 "PG 사용이면 2Depth 에서 문의 항목이 사라지게"
 * 다. 그대로 지우면 **어제까지 받은 문의가 접근 불가**가 된다 — 답변 중이던 건, 고객이 전화로
 * 물을 문의번호, 감사 대상 기록이 전부 URL 을 아는 사람만 볼 수 있는 자리로 밀린다. 그래서
 * 사라지는 조건에 '남은 것이 없을 때' 를 더한다. 잔여가 0 이 되는 날 메뉴는 스스로 사라진다.
 */
export type InquiryMenuState = 'open' | 'archive' | 'hidden';

export function inquiryMenuState(
  settings: PaymentSettings,
  backlog: InquiryBacklog | null,
): InquiryMenuState {
  // 결제창을 열 수 없으면 구매 버튼이 '문의하기' 다 — 문의는 지금도 들어온다
  if (!pgSellable(settings)) return 'open';
  // 모르면 남긴다(fail-open) — 배선을 잊은 대가가 데이터 유실이면 안 된다
  if (backlog === null) return 'archive';
  return backlog.total === 0 ? 'hidden' : 'archive';
}

/**
 * archive 상태의 메뉴 라벨에 붙는 꼬리표.
 *
 * DS Sidebar 의 하위 항목은 `{ id, label, href }` 만 받는다 — 배지 슬롯이 없다(계약
 * Sidebar.contract.json). 계약을 넓히는 것은 DS 의 판단이므로, 그때까지는 **라벨 자체가**
 * 상태를 말한다. 문구를 여기 한 곳에 두어 사이드바와 그 설명이 갈라지지 않게 한다.
 */
export const INQUIRY_ARCHIVE_SUFFIX = ' · 읽기 전용';

/** 같은 사실의 긴 표현 — 화면 안 안내문이 쓴다 */
export const INQUIRY_ARCHIVE_HINT = '읽기 전용 · 신규 유입 없음';
