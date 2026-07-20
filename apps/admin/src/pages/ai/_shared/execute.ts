// 질의 실행기 — 파싱된 질의를 **실제 데이터**에 건다
//
// [답은 지어내지 않는다] 여기서 나오는 행은 전부 픽스처의 실제 행이다. 요약 문장도 실행 결과에서
// 계산한다(건수·조건). 모델이 문장을 만드는 자리는 이 앱에 없다.
//
// [도메인 결합을 피하는 방법 — wiring.ts 관례를 따른다]
// 회원 표본은 shared/fixtures 에 있어 누구나 읽어도 되지만, 상품·문의는 각 화면(pages/products,
// pages/support)이 소유한다. AI 화면이 그 스토어를 직접 import 하면 pages/ai → pages/products
// 결합이 된다(code-quality 축1). 그래서 여기서는 **자리만** 만들고(registerDomainProvider),
// 실제 구현을 꽂는 일은 두 도메인을 모두 아는 src/wiring.ts 가 한다 — 관리자 그룹 ↔ 메시지 템플릿이
// 이미 쓰고 있는 바로 그 패턴이다.
//
// [백엔드 없음] 실제 조회로 바뀌는 지점은 data-source.ts 의 // TODO(backend) 다.
import type { DomainId } from './domains';
import { findDomainById } from './domains';
import type { Condition, ParsedQuery, PeriodRange } from './parser';

/* ── 결과 ────────────────────────────────────────────────────────────────── */

/** 결과 표 한 행 — 표시용 문자열만 담는다(화면이 값을 다시 가공하지 않게) */
export interface ResultRow {
  readonly id: string;
  readonly cells: readonly string[];
  /** 원본 상세로 가는 경로 — 없으면 null */
  readonly href: string | null;
}

export interface QueryOutcome {
  readonly domainId: DomainId;
  readonly domainLabel: string;
  readonly columns: readonly string[];
  /** 화면에 그릴 행 — 상한(ROW_LIMIT)까지만 담는다 */
  readonly rows: readonly ResultRow[];
  /** 조건을 만족하는 **전체** 건수 — rows.length 와 다를 수 있다 */
  readonly total: number;
  /** 사람이 읽는 조건 요약 ('등급 VIP · 누적 구매액 있음') */
  readonly conditionSummary: string;
  /** 같은 조건이 걸린 원본 목록 화면 — 답변에서 건너뛸 수 있게 한다 */
  readonly listUrl: string;
}

/**
 * 한 번에 그리는 행의 상한.
 *
 * 회원 표본이 497건이라 조건이 느슨하면 수백 행이 온다. 채팅 말풍선 안에 수백 행을 그리면
 * 화면이 멈추고, 관리자는 어차피 그것을 채팅에서 읽지 않는다 — 앞부분만 보여주고 전체는
 * 원본 목록 화면으로 보낸다(listUrl).
 */
export const ROW_LIMIT = 20;

/* ── 도메인 제공자(provider) 슬롯 ────────────────────────────────────────── */

/**
 * 도메인 하나가 자기 데이터를 어떻게 거르고 어떻게 표로 만드는지 아는 물건.
 * 필드 의미(등급이 뭔지, 가입일이 뭔지)는 **여기만** 안다 — 파서도 화면도 모른다.
 */
export interface DomainProvider {
  readonly columns: readonly string[];
  /**
   * 조건을 걸어 행을 돌려준다.
   * @param now 기간 계산의 기준 시각 — 주입받는다(테스트가 '이번달' 을 고정할 수 있게)
   */
  run(
    conditions: readonly Condition[],
    now: Date,
  ): { readonly rows: readonly ResultRow[]; readonly total: number };
  /** 같은 조건을 목록 화면의 쿼리스트링으로 옮긴다 — 옮길 수 없는 조건은 버린다 */
  listUrl(conditions: readonly Condition[]): string;
}

const providers = new Map<DomainId, DomainProvider>();

/** 제공자를 꽂는다 — 여러 번 불러도 결과가 같다(멱등). 배선 지점은 src/wiring.ts */
export function registerDomainProvider(id: DomainId, provider: DomainProvider): void {
  providers.set(id, provider);
}

export function hasDomainProvider(id: DomainId): boolean {
  return providers.has(id);
}

/* ── 기간 → 날짜 범위 ────────────────────────────────────────────────────── */

export interface DateRange {
  /** 'YYYY-MM-DD' — 경계 포함 */
  readonly from: string;
  readonly to: string;
}

function iso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** 기간 표현을 실제 날짜 경계로 바꾼다 — '지금' 을 주입받으므로 테스트가 고정할 수 있다 */
export function resolvePeriod(period: PeriodRange, now: Date): DateRange {
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (period.kind) {
    case 'today':
      return { from: iso(now), to: iso(now) };
    case 'yesterday': {
      const yesterday = new Date(year, month, now.getDate() - 1);
      return { from: iso(yesterday), to: iso(yesterday) };
    }
    case 'this-week': {
      // 주의 시작은 월요일 — 국내 관리자 화면 관례 (일요일 시작이면 '이번주'가 하루 어긋난다)
      const weekday = (now.getDay() + 6) % 7;
      const monday = new Date(year, month, now.getDate() - weekday);
      return { from: iso(monday), to: iso(now) };
    }
    case 'this-month':
      return { from: iso(new Date(year, month, 1)), to: iso(new Date(year, month + 1, 0)) };
    case 'last-month':
      return { from: iso(new Date(year, month - 1, 1)), to: iso(new Date(year, month, 0)) };
    case 'this-year':
      return { from: iso(new Date(year, 0, 1)), to: iso(new Date(year, 11, 31)) };
    case 'last-days': {
      const start = new Date(year, month, now.getDate() - (period.days - 1));
      return { from: iso(start), to: iso(now) };
    }
  }
}

/** 'YYYY-MM-DD' 가 범위 안에 있는가 — 문자열 비교로 충분하다(고정 폭 ISO) */
export function withinRange(dateIso: string, range: DateRange): boolean {
  const day = dateIso.slice(0, 10);
  return day >= range.from && day <= range.to;
}

/* ── 실행 ────────────────────────────────────────────────────────────────── */

/**
 * 실행할 수 없는 이유 — 화면이 그대로 문장으로 옮긴다.
 * 지금은 한 가지뿐이다: 도메인은 아는데 데이터가 아직 연결되지 않았다(제공자 미배선).
 */
export interface ExecuteFailure {
  readonly kind: 'not-wired';
  readonly domainLabel: string;
}

export type ExecuteResult =
  | { readonly kind: 'ok'; readonly outcome: QueryOutcome }
  | { readonly kind: 'failed'; readonly failure: ExecuteFailure };

function summarize(conditions: readonly Condition[]): string {
  if (conditions.length === 0) return '조건 없음(전체)';
  return conditions.map((condition) => condition.label).join(' · ');
}

/**
 * 파싱된 질의를 실행한다.
 *
 * 던지지 않는다 — 실패도 값으로 돌려준다. 채팅 화면에서 예외가 위로 튀면 대화 전체가
 * 에러 화면으로 바뀌고, 그때까지의 대화가 사라진다.
 */
export function executeQuery(query: ParsedQuery, now: Date): ExecuteResult {
  const domain = findDomainById(query.domainId);
  const provider = providers.get(query.domainId);

  if (domain === null || provider === undefined) {
    return {
      kind: 'failed',
      failure: { kind: 'not-wired', domainLabel: domain?.label ?? query.domainId },
    };
  }

  const { rows, total } = provider.run(query.conditions, now);

  return {
    kind: 'ok',
    outcome: {
      domainId: query.domainId,
      domainLabel: domain.label,
      columns: provider.columns,
      rows,
      total,
      conditionSummary: summarize(query.conditions),
      listUrl: provider.listUrl(query.conditions),
    },
  };
}
