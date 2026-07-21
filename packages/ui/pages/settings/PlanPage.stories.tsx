/**
 * Design System/Templates/Settings/Plan — 플랜·이용 현황 화면 (조립 전용 · 게이트 G5).
 *
 * 카테고리는 영문 메뉴명이다: `/settings/plan` → 메뉴 en = "Settings"(시스템 설정), 화면 en =
 * "Plan" (packages/ui/pages/_data/pages.ts 의 인벤토리 — Settings 그룹의
 * `['/settings/plan', '플랜·이용 현황', 'Plan']`).
 *
 * 대응 실화면: apps/admin/src/pages/settings/plan/PlanPage.tsx (라우트 /settings/plan) 와 그 모델
 * (shared/entitlements/plan.ts).
 *
 * [왜 이런 구조인가 — 이 화면은 **읽기 전용**이다] 플랜을 바꾸지 않는다. 구독·결제·계약은 사내
 * 홈페이지 소관이고 이 어드민은 그 값을 **받는 쪽**이다. 여기에 변경 수단을 두면 실제 계약과
 * 어긋나는 두 번째 정본이 생긴다 — 화면에서는 프로인데 청구는 베이직인 상태가 만들어지고, 그때
 * 어느 쪽이 맞는지 아무도 답할 수 없다. 청구서·인보이스·카드 등록도 같은 이유로 여기 없다.
 * 그래서 이 템플릿에는 저장 툴바도 폼도 없고, 바깥으로 나가는 링크 하나만 있다.
 *
 * [그래서 무엇을 하는 화면인가] 잠금을 만난 운영자가 **'무엇을 쓰고 있고 무엇이 잠겨 있는지'** 를
 * 한 번에 확인하는 곳이다. 카드가 둘인 것도 그 두 질문에 대응한다: 현재 플랜(무엇을 계약했나) ·
 * 포함 기능(그래서 무엇이 열려 있나).
 *
 * [잠김은 권한 거부가 아니다] 잠긴 기능의 상태 칸은 **'프로 플랜부터'** 라고 말한다 — 사지 않은
 * 기능에 권한 문구를 쓰면 운영자는 관리자에게 권한을 요청하고, 관리자도 켤 수 없어 지원 티켓이
 * 된다. 잠금은 이미 쌓인 데이터를 지우지도 않는다.
 *
 * [팔지 않는 모듈은 목록에도 없다] 티어 사다리로 팔지 않는 모듈(예: SMS — 발송사 계약이 따로 있어야
 * 켤 수 있다)은 행 자체를 그리지 않는다. 살 수 없는 것에 자물쇠를 달면 그것이 곧 티저이고,
 * 운영자는 결제 페이지를 뒤지다 아무것도 찾지 못한다.
 *
 * [쿼터는 숫자로만 말한다] '214/200' 은 다운그레이드 직후 정상적으로 존재하는 상태다. 어느 항목이
 * 초과분인지는 앱이 임의로 정하지 않는다 — 정하면 그 순간 앱이 데이터를 판결한다.
 *
 * [조립 원칙] `../../src` public DS 컴포넌트만 조합한다 — 이 폴더에서 신규 DS 컴포넌트를 만들지 않고
 * apps/admin 을 import 하지 않는다(레이어 경계). 앱 전용 조각은 DS 표면·토큰 레이아웃으로 갈음한다:
 *   CardTitle(action 슬롯) → Card + 토큰 <h2> + 우측 StatusBadge
 *   tableStyle 이 붙은 raw <table> → DS Table(행 머리 열은 첫 셀의 강조 텍스트로 갈음)
 *
 * 실화면 ↔ DS 컴포넌트 매핑:
 *   미납·정지 안내             → Alert(warning) — 기능을 지우지 않고 조회만 남긴다
 *   플랜 변경 예고             → Alert(info) — 날짜와 확인처까지만 말한다
 *   현재 플랜 카드 + 계약명 배지  → Card + 토큰 <h2> + StatusBadge(info)
 *   플랜 등급 · 청구 상태 · 적용 예정 → 토큰 <dl> + StatusBadge(청구 상태)
 *   사내 홈페이지로 나가는 링크   → 토큰 <a>(target=_blank · rel=noopener noreferrer)
 *   포함 기능 표               → Table (기능 · 상태 · 사용량/수준)
 *   포함 · 잠김 배지            → StatusBadge (success / neutral — '프로 플랜부터')
 *
 * 하드코딩 색상(hex)/px 리터럴 0건 — 시각 값은 토큰 CSS 변수(cssVar/typography)와 rem·calc·% 만 참조한다.
 */
import type { Meta, StoryObj } from '@storybook/react';
import type { CSSProperties, ReactNode } from 'react';
import { useId } from 'react';

import { Alert, Card, StatusBadge, Table, cssVar, typography } from '../../src';
import type { StatusBadgeTone, TableProps } from '../../src';

const meta: Meta = {
  title: 'Design System/Templates/Settings/Plan',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

/* ── 도메인 어휘(실화면 shared/entitlements/plan.ts 미러) ────────────────────────────────────── */

/** 낮은 순서 → 높은 순서. 배열 순서가 곧 포함 관계다(상위 티어는 하위 티어를 전부 포함한다) */
const PLAN_TIERS = ['free', 'basic', 'pro', 'enterprise'] as const;

type PlanTier = (typeof PLAN_TIERS)[number];

const PLAN_TIER_LABEL: Readonly<Record<PlanTier, string>> = {
  free: '무료',
  basic: '베이직',
  pro: '프로',
  enterprise: '엔터프라이즈',
};

const tierRank = (tier: PlanTier): number => PLAN_TIERS.indexOf(tier);

/** 이 티어가 minTier 이상인가. minTier 가 null 이면 **어떤 티어에도 없다**(판매하지 않는 모듈) */
const tierIncludes = (minTier: PlanTier | null, tier: PlanTier): boolean =>
  minTier !== null && tierRank(tier) >= tierRank(minTier);

/** 미납·정지는 기능을 **지우지 않는다** — 전부 읽기 전용으로 내려앉을 뿐이다 */
type BillingState = 'active' | 'past_due' | 'suspended';

const BILLING_STATE_LABEL: Readonly<Record<BillingState, string>> = {
  active: '정상',
  past_due: '결제 지연',
  suspended: '이용 정지',
};

/** 문구가 의미를 싣고 색은 보조다 (WCAG 1.4.1) */
const BILLING_TONE: Readonly<Record<BillingState, StatusBadgeTone>> = {
  active: 'success',
  past_due: 'warning',
  suspended: 'danger',
};

type EntitlementKey =
  | 'commerce.orders'
  | 'commerce.products'
  | 'commerce.coupons'
  | 'commerce.points'
  | 'commerce.shipping'
  | 'sales.pipeline'
  | 'cms.pages'
  | 'marketing.email'
  | 'marketing.sms'
  | 'ai.agent'
  | 'stats.advanced';

/** level 종의 '없음' — 이 값이면 그 모듈은 꺼진 것으로 읽는다 */
const LEVEL_NONE = 'none';

const LEVEL_LABEL: Readonly<Record<string, string>> = {
  [LEVEL_NONE]: '미포함',
  basic: '기본',
  advanced: '고급',
};

/**
 * 모듈 한 줄의 정의.
 *
 * [minTier === null 은 '어떤 플랜에도 번들되지 않는다' 다] 티어 사다리로 팔지 않는 모듈이고,
 * 사내 어드민이 명시적으로 꺼서 보내면 **잠금이 아니라 완전 숨김**이 된다.
 */
type ModuleSpec = {
  readonly key: EntitlementKey;
  readonly label: string;
  /** 기능 설명의 정본은 카탈로그다 — 화면이 지어내면 모듈마다 말투가 갈린다 */
  readonly description: string;
  readonly minTier: PlanTier | null;
} & (
  | { readonly kind: 'switch' }
  | { readonly kind: 'quota'; readonly limits: Readonly<Record<PlanTier, number | 'unlimited'>> }
  | { readonly kind: 'level'; readonly levels: Readonly<Record<PlanTier, string>> }
);

const MODULE_SPECS: readonly ModuleSpec[] = [
  {
    kind: 'switch',
    key: 'commerce.orders',
    label: '주문 관리',
    description: '고객 주문의 접수·상태 변경·환불 처리를 한 곳에서 봅니다.',
    minTier: 'basic',
  },
  {
    kind: 'quota',
    key: 'commerce.products',
    label: '상품 관리',
    description: '판매 상품과 카테고리를 등록하고 노출을 관리합니다.',
    minTier: 'free',
    // 다운그레이드해도 이미 등록한 상품은 지우지 않는다 — 초과분은 숫자로만 말하고 신규 등록만 잠근다
    limits: { free: 20, basic: 200, pro: 2000, enterprise: 'unlimited' },
  },
  {
    kind: 'switch',
    key: 'commerce.coupons',
    label: '쿠폰',
    description: '할인 쿠폰을 발급하고 사용 조건·기간을 관리합니다.',
    minTier: 'pro',
  },
  {
    kind: 'switch',
    key: 'commerce.points',
    label: '적립금',
    description: '적립·차감 원장과 적립 정책을 운영합니다.',
    minTier: 'pro',
  },
  {
    kind: 'switch',
    key: 'commerce.shipping',
    label: '배송·교환/반품',
    description: '배송 정책과 교환·반품 접수를 관리합니다.',
    minTier: 'basic',
  },
  {
    kind: 'switch',
    key: 'sales.pipeline',
    label: '영업 관리',
    description: '거래처·계약·견적·프로젝트를 잇는 영업 파이프라인입니다.',
    minTier: 'pro',
  },
  {
    kind: 'switch',
    key: 'cms.pages',
    label: '콘텐츠 관리',
    description: '공지·FAQ·팝업·배너 등 홈페이지 콘텐츠를 편집합니다.',
    minTier: 'free',
  },
  {
    kind: 'switch',
    key: 'marketing.email',
    label: '이메일·뉴스레터 발송',
    description: '뉴스레터와 이메일 캠페인을 만들고 발송합니다.',
    minTier: 'basic',
  },
  {
    kind: 'switch',
    key: 'marketing.sms',
    label: 'SMS 발송',
    description: '문자·알림톡을 발송하고 발송 이력을 봅니다.',
    // 티어 번들이 아니다 — 발신번호 등록과 발송사 계약이 따로 있어야 켤 수 있다
    minTier: null,
  },
  {
    kind: 'switch',
    key: 'ai.agent',
    label: 'AI 에이전트',
    description: '멘션한 데이터를 조건으로 조회하는 대화형 도우미입니다.',
    minTier: 'enterprise',
  },
  {
    kind: 'level',
    key: 'stats.advanced',
    label: '고급 통계',
    description: '유입 분석·검색어 분석·매출 통계 등 심화 리포트를 봅니다.',
    minTier: 'pro',
    levels: { free: LEVEL_NONE, basic: LEVEL_NONE, pro: 'basic', enterprise: 'advanced' },
  },
];

/** 구독·결제·계약을 실제로 바꾸는 곳 — **사내 홈페이지다** */
const PLAN_PORTAL_URL = 'https://spaceplanning.ai/pricing';

const PAGE_DESCRIPTION =
  '지금 계약된 플랜과 그 플랜에 포함된 기능입니다. 플랜 변경·결제는 사내 홈페이지에서 진행합니다.';

/** 예고 배너의 기준일 — 화면이 `new Date()` 를 읽으면 스토리 비교가 매일 깨진다 */
const TODAY = '2026-07-22';

/* ── 데모 데이터(실화면 PlanState 미러) ───────────────────────────────────────────────────── */

interface DemoPlan {
  readonly tier: PlanTier;
  /** 계약서에 적힌 플랜 이름 — 티어 표시명과 다를 수 있다('프로 연간' 등) */
  readonly planLabel: string;
  readonly billingState: BillingState;
  /** 예고된 플랜 변경의 적용일 'YYYY-MM-DD'. 없으면 null */
  readonly effectiveAt: string | null;
  /**
   * 사내 어드민이 **명시적으로 꺼서 보낸** 키 — 티어 정의를 이긴다.
   * 티어 번들이 아닌 모듈(minTier === null)이 여기 들어오면 잠금이 아니라 완전 숨김이 된다.
   */
  readonly disabledKeys: readonly EntitlementKey[];
  /** 쿼터 종 모듈의 실제 사용량 — 픽스처가 안다 */
  readonly usage: Readonly<Partial<Record<EntitlementKey, number>>>;
}

/** 베이직 — 상품 180/200 을 쓰는 중이고 프로부터 열리는 기능 넷이 잠겨 있다 */
const BASIC_PLAN: DemoPlan = {
  tier: 'basic',
  planLabel: '베이직 플랜',
  billingState: 'active',
  effectiveAt: null,
  // 발송사 계약이 없어 사내 어드민이 꺼서 보냈다 — SMS 행은 목록에 아예 없다
  disabledKeys: ['marketing.sms'],
  usage: { 'commerce.products': 180 },
};

const FREE_PLAN: DemoPlan = {
  tier: 'free',
  planLabel: '무료 플랜',
  billingState: 'active',
  effectiveAt: null,
  disabledKeys: ['marketing.sms'],
  usage: { 'commerce.products': 18 },
};

const ENTERPRISE_PLAN: DemoPlan = {
  tier: 'enterprise',
  planLabel: '2026 전사 계약',
  billingState: 'active',
  effectiveAt: null,
  disabledKeys: [],
  usage: { 'commerce.products': 4210 },
};

/** 다운그레이드 예고 + 쿼터 초과 — 214/200 은 정상적으로 존재하는 상태다 */
const DOWNGRADE_PLAN: DemoPlan = {
  tier: 'basic',
  planLabel: '베이직 플랜',
  billingState: 'active',
  effectiveAt: '2026-08-01',
  disabledKeys: ['marketing.sms'],
  usage: { 'commerce.products': 214 },
};

/** 결제 지연 — 기능을 지우지 않는다. 조회는 그대로 열려 있고 쓰기만 잠긴다 */
const PAST_DUE_PLAN: DemoPlan = {
  tier: 'pro',
  planLabel: '프로 연간',
  billingState: 'past_due',
  effectiveAt: null,
  disabledKeys: ['marketing.sms'],
  usage: { 'commerce.products': 640 },
};

/* ── 순수 규칙(실화면 미러) ───────────────────────────────────────────────────────────────── */

const fmt = (value: number): string => value.toLocaleString('ko-KR');

/** 읽기 전용으로 내려앉은 이유 — 정상이면 null(배너를 그리지 않는다) */
function billingNotice(plan: DemoPlan): string | null {
  if (plan.billingState === 'past_due') {
    return '결제가 확인되지 않아 지금은 조회만 가능합니다. 사내 홈페이지에서 결제 상태를 확인해 주세요.';
  }
  if (plan.billingState === 'suspended') {
    return '구독이 정지되어 지금은 조회만 가능합니다. 사내 홈페이지에서 구독을 다시 활성화해 주세요.';
  }
  return null;
}

/**
 * 다운그레이드 예고 — **무엇이 사라지는지는 말하지 않는다.**
 * 이 어드민은 받는 쪽이라 다음 플랜의 엔타이틀먼트를 아직 모르고, 모르는 것을 지어내면 예고와
 * 실제가 갈라진다. 날짜와 '어디서 확인하는지' 까지만 말한다.
 */
function planChangeNotice(plan: DemoPlan): string | null {
  if (plan.effectiveAt === null || plan.effectiveAt <= TODAY) return null;
  return `${plan.effectiveAt}에 플랜 변경이 적용됩니다. 변경 내용은 사내 홈페이지에서 확인해 주세요.`;
}

/**
 * 이 모듈의 판정 3상태 — boolean 하나로 뭉치면 **숨김과 잠금을 구분할 수 없다.**
 *   locked → 사내 홈페이지에서 상위 플랜으로 올린다 (살 수 있다)
 *   absent → 할 수 있는 일이 없다 (살 수 없는 것을 티저하면 노이즈다)
 */
type EntitlementState =
  | { readonly kind: 'granted' }
  | { readonly kind: 'locked'; readonly upgradeTo: PlanTier }
  | { readonly kind: 'absent' };

function entitlementStateOf(plan: DemoPlan, spec: ModuleSpec): EntitlementState {
  const disabled = plan.disabledKeys.includes(spec.key);
  // 티어가 그 모듈에 대해 할 말이 없으면 granted 로 읽는다(fail-open) — 끄는 것은 명시적일 때뿐이다
  if (spec.minTier === null) return disabled ? { kind: 'absent' } : { kind: 'granted' };
  if (!disabled && tierIncludes(spec.minTier, plan.tier)) return { kind: 'granted' };
  return { kind: 'locked', upgradeTo: spec.minTier };
}

/**
 * 값의 형태(switch·quota·level)를 사람의 말로 옮긴다.
 * 쿼터는 **숫자로만** 말한다 — 어느 항목이 초과분인지는 앱이 정하지 않는다.
 */
function moduleDetail(plan: DemoPlan, spec: ModuleSpec): string {
  if (spec.kind === 'quota') {
    const limit = spec.limits[plan.tier];
    const used = plan.usage[spec.key] ?? 0;
    return limit === 'unlimited'
      ? `${spec.label} ${fmt(used)}건 · 무제한`
      : `${spec.label} ${fmt(used)}/${fmt(limit)}`;
  }
  if (spec.kind === 'level') {
    const level = spec.levels[plan.tier];
    return `${LEVEL_LABEL[level] ?? level} 수준`;
  }
  return '';
}

interface ModuleRow {
  readonly key: EntitlementKey;
  readonly label: string;
  readonly description: string;
  readonly tone: StatusBadgeTone;
  readonly status: string;
  /** 쿼터 사용량·수준처럼 '얼마나' 를 말하는 값. 말할 것이 없으면 빈 문자열 */
  readonly detail: string;
}

function toRows(plan: DemoPlan): readonly ModuleRow[] {
  const rows: ModuleRow[] = [];
  for (const spec of MODULE_SPECS) {
    const state = entitlementStateOf(plan, spec);
    // 판매하지 않는 모듈 — 목록에도 올리지 않는다
    if (state.kind === 'absent') continue;
    rows.push({
      key: spec.key,
      label: spec.label,
      description: spec.description,
      tone: state.kind === 'granted' ? 'success' : 'neutral',
      status: state.kind === 'granted' ? '포함' : `${PLAN_TIER_LABEL[state.upgradeTo]} 플랜부터`,
      detail: state.kind === 'granted' ? moduleDetail(plan, spec) : '',
    });
  }
  return rows;
}

/* ── 표 열 정의 ───────────────────────────────────────────────────────────────────────────── */

const COLUMNS: TableProps['columns'] = [
  { id: 'feature', header: '기능' },
  { id: 'status', header: '상태', nowrap: true },
  { id: 'detail', header: '사용량 · 수준', nowrap: true },
];

/* ── 스타일(토큰·rem·calc·% 만) ───────────────────────────────────────────────────────────── */

const pageStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: cssVar('space.5'),
  padding: cssVar('space.6'),
  minBlockSize: '100vh',
  background: cssVar('color.surface.default'),
  color: cssVar('color.text.default'),
};

const headingStyle: CSSProperties = {
  ...typography('typography.title.lg'),
  margin: 0,
};

const noteRowStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: cssVar('space.3'),
  minWidth: 0,
};

const cardBodyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: cssVar('space.4'),
  minWidth: 0,
};

const cardHeadStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: cssVar('space.3'),
  flexWrap: 'wrap',
};

const cardTitleStyle: CSSProperties = {
  ...typography('typography.title.md'),
  margin: 0,
  color: cssVar('color.text.default'),
};

const dlStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: `calc(${cssVar('space.6')} * 4) minmax(0, 1fr)`,
  gap: cssVar('space.2'),
  margin: 0,
};

const dtStyle: CSSProperties = {
  ...typography('typography.label.md'),
  color: cssVar('color.text.muted'),
  margin: 0,
};

const ddStyle: CSSProperties = {
  ...typography('typography.label.md'),
  color: cssVar('color.text.default'),
  margin: 0,
};

const hintStyle: CSSProperties = {
  ...typography('typography.caption.md'),
  color: cssVar('color.text.muted'),
  margin: 0,
};

const featureNameStyle: CSSProperties = {
  ...typography('typography.label.md'),
  color: cssVar('color.text.default'),
};

const featureCellStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: cssVar('space.1'),
};

const numericStyle: CSSProperties = {
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
};

const linkStyle: CSSProperties = {
  color: cssVar('color.action.primary.default'),
  textDecoration: 'underline',
};

const tableScrollStyle: CSSProperties = {
  overflowX: 'auto',
  minWidth: 0,
};

/* ── 카드 제목 조립(DS Card 는 표면만 소유 — 제목 <h2> 는 토큰으로 조립하고 aria 로 잇는다) ── */

function PlanCard({
  title,
  action,
  children,
}: {
  readonly title: string;
  readonly action?: ReactNode;
  readonly children: ReactNode;
}) {
  const titleId = useId();
  return (
    <section aria-labelledby={titleId}>
      <Card aria-labelledby={titleId}>
        <div style={cardBodyStyle}>
          <div style={cardHeadStyle}>
            <h2 id={titleId} style={cardTitleStyle}>
              {title}
            </h2>
            {action}
          </div>
          {children}
        </div>
      </Card>
    </section>
  );
}

/* ── 화면(읽기 전용이라 상태를 들지 않는다 — 훅이 없다) ────────────────────────────────────── */

function PlanScreen({ plan }: { readonly plan: DemoPlan }) {
  const rows = toRows(plan);
  const billing = billingNotice(plan);
  const change = planChangeNotice(plan);

  const tableRows: TableProps['rows'] = rows.map((row) => ({
    id: row.key,
    cells: [
      <span key="feature" style={featureCellStyle}>
        <span style={featureNameStyle}>{row.label}</span>
        <span style={hintStyle}>{row.description}</span>
      </span>,
      <StatusBadge key="status" tone={row.tone} label={row.status} />,
      <span key="detail" style={numericStyle}>
        {row.detail === '' ? '—' : row.detail}
      </span>,
    ],
  }));

  return (
    <div style={pageStyle}>
      <h1 style={headingStyle}>플랜·이용 현황</h1>

      {(billing !== null || change !== null) && (
        <div style={noteRowStyle}>
          {/* 미납·정지는 기능을 지우지 않는다 — 조회는 그대로 열려 있고 쓰기만 잠긴다 */}
          {billing !== null && <Alert tone="warning">{billing}</Alert>}
          {/* 다운그레이드 예고 — 무엇이 사라지는지는 말하지 않는다 */}
          {change !== null && <Alert tone="info">{change}</Alert>}
        </div>
      )}

      <PlanCard title="현재 플랜" action={<StatusBadge tone="info" label={plan.planLabel} />}>
        <p style={hintStyle}>{PAGE_DESCRIPTION}</p>

        <dl style={dlStyle}>
          <dt style={dtStyle}>플랜 등급</dt>
          <dd style={ddStyle}>{PLAN_TIER_LABEL[plan.tier]}</dd>

          <dt style={dtStyle}>청구 상태</dt>
          <dd style={ddStyle}>
            <StatusBadge
              tone={BILLING_TONE[plan.billingState]}
              label={BILLING_STATE_LABEL[plan.billingState]}
            />
          </dd>

          <dt style={dtStyle}>변경 적용 예정</dt>
          <dd style={{ ...ddStyle, ...numericStyle }}>{plan.effectiveAt ?? '없음'}</dd>
        </dl>

        <p style={hintStyle}>
          플랜을 바꾸려면{' '}
          <a href={PLAN_PORTAL_URL} target="_blank" rel="noopener noreferrer" style={linkStyle}>
            사내 홈페이지의 요금제 안내
          </a>
          에서 진행해 주세요. 이 화면에서는 바꿀 수 없습니다.
        </p>
      </PlanCard>

      <PlanCard title="포함 기능">
        <p style={hintStyle}>
          잠긴 기능은 메뉴에 남아 있고, 들어가면 어떤 플랜에서 열리는지 안내합니다. 상위 플랜에서
          사용할 수 있으며, 잠금은 이미 쌓인 데이터를 지우지 않습니다.
        </p>

        <div style={tableScrollStyle}>
          <Table
            caption="플랜에 포함된 기능과 사용량 — 팔지 않는 모듈은 목록에 올리지 않습니다."
            columns={COLUMNS}
            rows={tableRows}
            empty="표시할 기능이 없습니다."
          />
        </div>
      </PlanCard>
    </div>
  );
}

/**
 * 정상(베이직): 상품 180/200 을 쓰는 중이고 프로부터 열리는 넷(쿠폰·적립금·영업 관리·고급 통계)과
 * 엔터프라이즈의 AI 에이전트가 잠겨 있다. SMS 는 발송사 계약이 없어 **행 자체가 없다**.
 */
export const Default: Story = {
  render: () => <PlanScreen plan={BASIC_PLAN} />,
};

/** 무료: 잠금이 가장 많은 상태 — 상품 쿼터도 20건으로 좁다(18/20) */
export const Free: Story = {
  render: () => <PlanScreen plan={FREE_PLAN} />,
};

/** 엔터프라이즈: 잠금 0 · 상품은 무제한 — 계약명이 티어 표시명과 다를 수 있다('2026 전사 계약') */
export const Enterprise: Story = {
  render: () => <PlanScreen plan={ENTERPRISE_PLAN} />,
};

/**
 * 다운그레이드 예고 + 쿼터 초과: '214/200' 은 버그가 아니라 정상적으로 존재하는 상태다.
 * 이미 등록한 상품을 지우지 않고 신규 등록만 잠근다 — 어느 항목이 초과분인지는 앱이 정하지 않는다.
 */
export const Downgrade: Story = {
  render: () => <PlanScreen plan={DOWNGRADE_PLAN} />,
};

/** 결제 지연: 기능을 지우지 않는다 — 조회는 그대로 열려 있고 쓰기만 잠긴다는 사실을 배너가 말한다 */
export const PastDue: Story = {
  render: () => <PlanScreen plan={PAST_DUE_PLAN} />,
};
