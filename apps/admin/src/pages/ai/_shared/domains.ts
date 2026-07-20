// AI 에이전트가 질의할 수 있는 **데이터 도메인 레지스트리**
//
// [이 파일이 정하는 것] `@멘션` 이 가리킬 수 있는 도메인이 무엇이고, 그 도메인의 각 필드가
// **어떤 축으로 걸릴 수 있는지**를 선언한다. 파서(parser.ts)는 이 선언만 읽는다 — 파서 안에
// '회원' 이나 '등급' 같은 도메인 지식이 하드코딩되지 않는다.
//
// [왜 '능력(capability)' 을 선언하는가 — 이 화면의 정직성이 걸린 지점]
// 픽스처의 필드는 전부 같은 축으로 걸리지 않는다. 예를 들어 회원의 `totalPurchase`(누적 구매액)에는
// **기간 정보가 없다** — 언제 산 것인지 데이터가 갖고 있지 않다(shared/fixtures/members.ts:126).
// 그래서 '이번달 구매' 는 계산할 수 없다. 능력을 선언해 두면 파서가 이 불가능을 **실행 전에**
// 알아채고 사용자에게 그대로 말한다. 선언이 없으면 화면은 누적 구매액을 이번달 구매인 척
// 보여주게 된다 — FEEDBACK-03 이 금지하는 '거짓말하는 UI' 다.
//
// [백엔드 없음] 행(row)의 출처는 픽스처다. 실제 조회로 바뀌는 지점은 data-source.ts 의
// // TODO(backend) 주석이며, 이 파일의 선언(별칭·필드·능력)은 그때도 그대로 쓰인다.

/* ── 도메인 ──────────────────────────────────────────────────────────────── */

/** 질의 가능한 도메인 — 새 도메인을 붙이면 여기와 DOMAINS 에 한 줄씩 는다 */
export type DomainId = 'members' | 'products' | 'tickets';

/**
 * 값 축 — 필드가 어떤 조건으로 걸릴 수 있는가.
 *
 * - `equality`  : 값이 같은가 (등급 = VIP)
 * - `presence`  : 값이 있는가 / 0보다 큰가 (구매 이력이 있는가)
 * - `period`    : 기간으로 거를 수 있는가 (이번달 가입) — **날짜 필드만 참이다**
 */
export type FieldAxis = 'equality' | 'presence' | 'period';

/** 필드 하나 — 이름(사람이 쓰는 말)과 걸 수 있는 축 */
export interface DomainField {
  readonly id: string;
  /** 표시용 이름 — 답변 문구가 이 말을 그대로 쓴다 ('구매액에는 기간이 없습니다') */
  readonly label: string;
  /**
   * 사용자가 이 필드를 부를 때 쓰는 말. 파서가 문장에서 이 말을 찾아 기간·조건을 **묶는다**.
   * 긴 것이 앞에 와야 한다 — '누적구매' 가 '구매' 보다 먼저 걸려야 한다.
   */
  readonly nouns: readonly string[];
  readonly axes: readonly FieldAxis[];
  /**
   * equality 축 필드의 허용 값 — 라벨로 찾고 id 로 건다.
   * presence/period 전용 필드는 빈 배열이다.
   */
  readonly values: readonly DomainFieldValue[];
}

export interface DomainFieldValue {
  readonly id: string;
  readonly label: string;
  /** 라벨 외에 사용자가 쓰는 말 (예: 'VIP' 의 '브이아이피') */
  readonly aliases: readonly string[];
}

export interface DomainDef {
  readonly id: DomainId;
  readonly label: string;
  /**
   * `@` 뒤에 올 수 있는 말. 사용자가 '고객목록' 이라 부르든 '회원' 이라 부르든 같은 도메인이다.
   * 첫 항목이 대표 별칭 — 자동완성 목록이 이것을 보여준다.
   */
  readonly aliases: readonly string[];
  /** 결과에서 원본 목록 화면으로 건너갈 경로 — 답변이 '실제로 조작 가능' 해지는 지점 */
  readonly listPath: string;
  readonly fields: readonly DomainField[];
  /**
   * 기간 표현이 **어떤 필드도 지목하지 않았을 때** 붙을 기본 날짜 필드.
   * 없으면 null — 이 도메인은 기간으로 거를 수 없다는 뜻이다.
   */
  readonly defaultPeriodFieldId: string | null;
}

/* ── 회원 ────────────────────────────────────────────────────────────────── */

const TIER_VALUES: readonly DomainFieldValue[] = [
  { id: 'vip', label: 'VIP', aliases: ['브이아이피'] },
  { id: 'vvip', label: 'VVIP', aliases: ['브이브이아이피'] },
  { id: 'normal', label: '일반회원', aliases: ['일반'] },
];

const MEMBER_FIELDS: readonly DomainField[] = [
  {
    id: 'tier',
    label: '등급',
    nouns: ['등급'],
    axes: ['equality'],
    values: TIER_VALUES,
  },
  {
    id: 'joinedAt',
    label: '가입일',
    // '가입한' · '가입일' 을 모두 잡으려면 어간 '가입' 이면 충분하다
    nouns: ['가입'],
    axes: ['period'],
    values: [],
  },
  {
    /**
     * 누적 구매액 — **기간 축이 없다.**
     * 픽스처가 갖고 있는 것은 '지금까지 얼마 샀나' 하나뿐이고 '언제 샀나'는 없다
     * (shared/fixtures/members.ts:126 `totalPurchase: i % 11 === 0 ? 150000 : 0`).
     * 그래서 axes 에 'period' 가 없고, 파서는 '이번달 구매' 를 계산 대신 **거절**한다.
     */
    id: 'totalPurchase',
    label: '누적 구매액',
    nouns: ['누적구매', '구매액', '구매'],
    axes: ['presence'],
    values: [],
  },
  {
    id: 'points',
    label: '적립금',
    nouns: ['적립금', '포인트'],
    axes: ['presence'],
    values: [],
  },
];

/* ── 상품 ────────────────────────────────────────────────────────────────── */

const PRODUCT_FIELDS: readonly DomainField[] = [
  {
    id: 'saleStatus',
    label: '판매상태',
    nouns: ['판매상태', '판매'],
    axes: ['equality'],
    // 값 id 는 ProductSaleStatus(pages/products/_shared/store.ts:109)와 같아야 한다 —
    // 제공자가 이 id 를 그대로 비교에 쓴다
    values: [
      { id: 'on_sale', label: '판매중', aliases: [] },
      { id: 'stopped', label: '판매중지', aliases: ['중지'] },
      { id: 'sold_out', label: '품절', aliases: [] },
    ],
  },
  {
    id: 'displayed',
    label: '전시상태',
    nouns: ['전시'],
    axes: ['equality'],
    values: [
      { id: 'true', label: '전시중', aliases: ['노출'] },
      { id: 'false', label: '숨김', aliases: ['미노출'] },
    ],
  },
];

/* ── 1:1 문의 ────────────────────────────────────────────────────────────── */

const TICKET_FIELDS: readonly DomainField[] = [
  {
    id: 'status',
    label: '처리상태',
    nouns: ['상태'],
    axes: ['equality'],
    // 값 id 는 TicketStatus(pages/support/_shared/domain.ts:52)와 같아야 한다
    values: [
      { id: 'received', label: '접수', aliases: [] },
      { id: 'assigned', label: '배정', aliases: [] },
      { id: 'in_progress', label: '처리중', aliases: [] },
      { id: 'answered', label: '답변완료', aliases: [] },
      { id: 'closed', label: '종결', aliases: [] },
    ],
  },
  {
    id: 'priority',
    label: '우선순위',
    nouns: ['우선순위'],
    axes: ['equality'],
    values: [
      { id: 'urgent', label: '긴급', aliases: [] },
      { id: 'high', label: '높음', aliases: [] },
      { id: 'normal', label: '보통', aliases: [] },
      { id: 'low', label: '낮음', aliases: [] },
    ],
  },
  {
    id: 'receivedAt',
    label: '접수일',
    nouns: ['접수'],
    axes: ['period'],
    values: [],
  },
];

/* ── 레지스트리 ──────────────────────────────────────────────────────────── */

export const DOMAINS: readonly DomainDef[] = [
  {
    id: 'members',
    label: '회원 목록',
    // '고객목록' 이 첫 자리가 아닌 이유: 이 앱의 화면 이름은 '회원 관리' 다(nav-config.ts:101).
    // 사용자가 '고객' 이라 부르는 것도 받아주되, 자동완성은 앱의 말로 제안한다.
    aliases: ['회원목록', '고객목록', '회원', '고객'],
    listPath: '/users/members',
    fields: MEMBER_FIELDS,
    defaultPeriodFieldId: 'joinedAt',
  },
  {
    id: 'products',
    label: '상품 목록',
    aliases: ['상품목록', '상품'],
    listPath: '/products',
    fields: PRODUCT_FIELDS,
    // 상품 픽스처에는 등록일이 없다 — 기간으로 거를 수 없다는 사실을 선언으로 못 박는다
    defaultPeriodFieldId: null,
  },
  {
    id: 'tickets',
    label: '1:1 문의',
    aliases: ['문의목록', '문의', '티켓'],
    listPath: '/support/tickets',
    fields: TICKET_FIELDS,
    defaultPeriodFieldId: 'receivedAt',
  },
];

/** 별칭으로 도메인을 찾는다 — 못 찾으면 null (파서가 '모르는 도메인' 으로 답한다) */
export function findDomainByAlias(alias: string): DomainDef | null {
  const normalized = alias.trim().toLowerCase();
  if (normalized === '') return null;
  return (
    DOMAINS.find((domain) =>
      domain.aliases.some((candidate) => candidate.toLowerCase() === normalized),
    ) ?? null
  );
}

export function findDomainById(id: DomainId): DomainDef | null {
  return DOMAINS.find((domain) => domain.id === id) ?? null;
}

export function findField(domain: DomainDef, fieldId: string): DomainField | null {
  return domain.fields.find((field) => field.id === fieldId) ?? null;
}

/** 이 필드가 이 축으로 걸릴 수 있는가 */
export function fieldSupports(field: DomainField, axis: FieldAxis): boolean {
  return field.axes.includes(axis);
}
