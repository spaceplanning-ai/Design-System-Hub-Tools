// 엔타이틀먼트 판정 규칙 — 이 축이 조용히 틀리는 방식들
//
// [무엇을 지키나] 이 층의 사고는 전부 '조용히' 일어난다. 판정이 반대로 서면 메뉴가 통째로 사라지고,
// 아무도 이유를 알 수 없다. 특히 위험한 셋을 못박는다:
//   1. **fail-open** — 조회 실패·응답 누락이 기능 정지가 되면 안 된다(권한 축과 반대 방향이다).
//   2. **overrides 가 tier 를 이긴다** — 영업 예외가 티어 정의에 먹히면 계약이 지켜지지 않는다.
//   3. **잠금은 값을 지우지 않는다** — 쿼터 초과는 생성만 막고 조회·수정은 그대로 연다.
import { describe, expect, it } from 'vitest';

import {
  DEFAULT_PLAN_STATE,
  ENTITLEMENT_KEYS,
  PLAN_STATE_VERSION,
  PLAN_TIERS,
  entitlementStateOf,
  entitlementsForTier,
  normalizePlanState,
  planChangeNotice,
  planReadOnly,
  planStateForTier,
  quotaCreateBlock,
  quotaStatusOf,
  resolveEntitlement,
} from './plan';
import type { PlanState } from './plan';

/* ── 3상태 ─────────────────────────────────────────────────────────────────── */

describe('판정은 3상태다 — boolean 하나로 뭉치면 숨김과 잠금을 구분할 수 없다', () => {
  it('산 기능은 granted 다', () => {
    const plan = planStateForTier('enterprise');
    expect(entitlementStateOf(plan, 'commerce.coupons').kind).toBe('granted');
    expect(entitlementStateOf(plan, 'ai.agent').kind).toBe('granted');
  });

  it('상위 플랜에 있는 기능은 locked 이고 **어느 플랜에서 열리는지**를 함께 낸다', () => {
    const state = entitlementStateOf(planStateForTier('basic'), 'commerce.coupons');
    expect(state.kind).toBe('locked');
    if (state.kind !== 'locked') throw new Error('locked 가 아니다');
    // 화면이 사유 문구를 각자 짓지 않게 상태와 한 벌로 나온다(checkoutCta 와 같은 형태)
    expect(state.upgradeTo).toBe('pro');
    expect(state.reason).toContain('프로');
  });

  it('AI 에이전트는 엔터프라이즈 전에는 잠긴다 — 티어 사다리가 실제로 동작한다', () => {
    for (const tier of ['free', 'basic', 'pro'] as const) {
      expect(entitlementStateOf(planStateForTier(tier), 'ai.agent').kind).toBe('locked');
    }
    expect(entitlementStateOf(planStateForTier('enterprise'), 'ai.agent').kind).toBe('granted');
  });

  /**
   * absent 는 '살 수 없다' 는 뜻이고 locked 는 '아직 안 샀다' 는 뜻이다. 살 수 없는 것에 자물쇠를
   * 달면 운영자는 결제 페이지를 뒤지다 아무것도 찾지 못한다 — 두 말투를 섞지 않는 근거가 이 규칙이다.
   * SMS 는 발송사 계약이 따로 있어야 하므로 티어 사다리에 없다(minTier=null).
   */
  it('번들되지 않는 모듈을 명시적으로 끄면 absent 다 — 잠그지 않고 숨긴다', () => {
    const plan: PlanState = {
      ...planStateForTier('enterprise'),
      overrides: { 'marketing.sms': { kind: 'switch', enabled: false } },
    };
    expect(entitlementStateOf(plan, 'marketing.sms').kind).toBe('absent');
  });

  it('번들되지 않는 모듈은 어느 티어에서도 잠기지 않는다 — 플랜을 올려도 저절로 열리는 것이 아니다', () => {
    for (const tier of PLAN_TIERS) {
      // 티어 정의는 이 키에 대해 아무 말도 하지 않는다 → granted (fail-open)
      expect(entitlementsForTier(tier)['marketing.sms']).toBeUndefined();
      expect(entitlementStateOf(planStateForTier(tier), 'marketing.sms').kind).toBe('granted');
    }
  });
});

/* ── overrides ─────────────────────────────────────────────────────────────── */

describe('overrides 가 tier 를 이긴다 — 영업 예외는 여기로만 표현한다', () => {
  it('티어에 없는 기능도 예외로 열린다 (grandfathering)', () => {
    const plan: PlanState = {
      ...planStateForTier('free'),
      overrides: { 'commerce.coupons': { kind: 'switch', enabled: true } },
    };
    expect(entitlementStateOf(plan, 'commerce.coupons').kind).toBe('granted');
  });

  it('티어에 있는 기능도 예외로 닫힌다', () => {
    const plan: PlanState = {
      ...planStateForTier('enterprise'),
      overrides: { 'sales.pipeline': { kind: 'switch', enabled: false } },
    };
    expect(entitlementStateOf(plan, 'sales.pipeline').kind).toBe('locked');
  });

  it('쿼터도 예외가 이긴다 — 티어 정의를 고객별로 포크하지 않는다', () => {
    const plan: PlanState = {
      ...planStateForTier('free'),
      overrides: { 'commerce.products': { kind: 'quota', limit: 5000, usage: 10 } },
    };
    expect(quotaStatusOf(plan, 'commerce.products')?.limit).toBe(5000);
  });
});

/* ── billingState ──────────────────────────────────────────────────────────── */

describe('billingState 는 기능을 지우지 않고 읽기 전용으로 내려앉힌다', () => {
  it('정상 계정은 읽기 전용이 아니다', () => {
    expect(planReadOnly(planStateForTier('pro'))).toBe(false);
  });

  it('미납·정지는 읽기 전용이다', () => {
    for (const billingState of ['past_due', 'suspended'] as const) {
      expect(planReadOnly({ ...planStateForTier('pro'), billingState })).toBe(true);
    }
  });

  /** 데이터를 감추면 운영자는 무엇을 결제해야 하는지도 확인할 수 없다 */
  it('정지 상태에서도 기능 자체는 granted 로 남는다 — 조회는 열려 있어야 한다', () => {
    const plan: PlanState = { ...planStateForTier('pro'), billingState: 'suspended' };
    expect(entitlementStateOf(plan, 'sales.pipeline').kind).toBe('granted');
  });
});

/* ── 쿼터 경계 ─────────────────────────────────────────────────────────────── */

describe('쿼터 — 경계에서 생성만 잠근다', () => {
  function withProductQuota(limit: number | 'unlimited', usage: number): PlanState {
    return {
      ...planStateForTier('basic'),
      overrides: { 'commerce.products': { kind: 'quota', limit, usage } },
    };
  }

  it('한도 아래면 막지 않는다', () => {
    expect(quotaCreateBlock(withProductQuota(200, 199), 'commerce.products')).toBeNull();
  });

  it('딱 채우면 그때부터 막는다 (200/200 — 경계는 포함이다)', () => {
    const blocked = quotaCreateBlock(withProductQuota(200, 200), 'commerce.products');
    expect(blocked).not.toBeNull();
    expect(blocked).toContain('200/200');
  });

  /**
   * 다운그레이드 직후의 정상 상태다. ① 삭제하지 않고 ② 조회·내보내기는 열어 두며
   * ③ 어느 항목이 초과분인지 앱이 정하지 않는다 — '201/200' 이라고만 말한다.
   */
  it('한도를 넘겨도 화면은 granted 다 — 초과분을 지우거나 판결하지 않는다', () => {
    const plan = withProductQuota(200, 201);
    expect(entitlementStateOf(plan, 'commerce.products').kind).toBe('granted');
    expect(quotaStatusOf(plan, 'commerce.products')?.text).toBe('상품 관리 201/200');
  });

  it('무제한은 아무리 써도 막지 않는다', () => {
    expect(quotaCreateBlock(withProductQuota('unlimited', 99999), 'commerce.products')).toBeNull();
  });

  it('한도 0 은 쿼터 소진이 아니라 미포함이다 — 화면째 잠긴다', () => {
    expect(entitlementStateOf(withProductQuota(0, 0), 'commerce.products').kind).toBe('locked');
  });

  it('쿼터 종이 아닌 모듈에는 셀 것이 없다', () => {
    expect(quotaStatusOf(planStateForTier('pro'), 'sales.pipeline')).toBeNull();
    expect(quotaCreateBlock(planStateForTier('pro'), 'sales.pipeline')).toBeNull();
  });
});

/* ── fail-open ─────────────────────────────────────────────────────────────── */

describe('fail-open — 권한 축과 실패 방향이 정반대다', () => {
  /**
   * 이 리포의 기존 이음매는 전부 fail-closed 관성이다(모르면 막는다). 그것을 그대로 복사하면
   * '엔타이틀먼트 조회 실패 = 전 기능 정지' 가 된다 — 고객이 돈을 낸 기능이 우리 파싱 실패로 멈춘다.
   */
  it('저장값이 없으면 전 기능 가용이다', () => {
    expect(normalizePlanState(null)).toEqual(DEFAULT_PLAN_STATE);
    expect(normalizePlanState(undefined)).toEqual(DEFAULT_PLAN_STATE);
    expect(normalizePlanState('깨진 값')).toEqual(DEFAULT_PLAN_STATE);
  });

  it('버전이 다르거나 티어를 못 읽으면 기본 상태로 되돌아간다', () => {
    expect(normalizePlanState({ version: 99, tier: 'pro' })).toEqual(DEFAULT_PLAN_STATE);
    expect(normalizePlanState({ version: PLAN_STATE_VERSION, tier: '없는티어' })).toEqual(
      DEFAULT_PLAN_STATE,
    );
  });

  it('기본 상태의 모든 모듈은 granted 다 — 이 층을 추가한 것만으로 화면이 사라지지 않는다', () => {
    for (const key of ENTITLEMENT_KEYS) {
      expect(entitlementStateOf(DEFAULT_PLAN_STATE, key).kind).toBe('granted');
    }
  });

  /**
   * 앱이 서버 카탈로그보다 앞선 순간이다. 이것을 차단으로 읽으면 새 모듈이 출시일에 전 고객에게서
   * 사라진다 — shared/permissions/resources.ts 의 unseenResourceGrant 가 배운 것과 같은 교훈이다.
   */
  it('응답에 없는 키는 granted 다 — 새 모듈이 출시일에 전 고객에게서 사라지지 않는다', () => {
    const plan = normalizePlanState({
      version: PLAN_STATE_VERSION,
      tier: 'free',
      entitlements: { 'cms.pages': { kind: 'switch', enabled: true } },
    });
    expect(resolveEntitlement(plan, 'ai.agent')).toBeUndefined();
    expect(entitlementStateOf(plan, 'ai.agent').kind).toBe('granted');
  });

  it('형태가 깨진 값은 없는 것으로 둔다 — 파손이 차단이 되지 않는다', () => {
    const plan = normalizePlanState({
      version: PLAN_STATE_VERSION,
      tier: 'pro',
      entitlements: { 'commerce.coupons': { kind: '알 수 없음' } },
    });
    expect(entitlementStateOf(plan, 'commerce.coupons').kind).toBe('granted');
  });

  it('모르는 청구 상태는 정상으로 읽는다 — 오탈자 하나가 전 고객을 읽기 전용으로 만들지 않는다', () => {
    const plan = normalizePlanState({
      version: PLAN_STATE_VERSION,
      tier: 'pro',
      billingState: 'weird',
    });
    expect(plan.billingState).toBe('active');
  });
});

/* ── 티어 정의 ─────────────────────────────────────────────────────────────── */

describe('티어 정의는 카탈로그에서 파생된다 — 고객별로 포크하지 않는다', () => {
  it('상위 티어는 하위 티어를 포함한다', () => {
    const basic = entitlementsForTier('basic');
    const pro = entitlementsForTier('pro');
    for (const [key, value] of Object.entries(basic)) {
      if (value.kind !== 'switch' || !value.enabled) continue;
      expect(pro[key as never]).toEqual({ kind: 'switch', enabled: true });
    }
  });

  it('쿼터 한도는 티어가 오를수록 줄지 않는다', () => {
    const free = entitlementsForTier('free')['commerce.products'];
    const pro = entitlementsForTier('pro')['commerce.products'];
    if (free?.kind !== 'quota' || pro?.kind !== 'quota') throw new Error('쿼터가 아니다');
    expect(pro.limit === 'unlimited' || free.limit === 'unlimited' || pro.limit > free.limit).toBe(
      true,
    );
  });
});

/* ── 다운그레이드 예고 ─────────────────────────────────────────────────────── */

describe('effectiveAt — 미래의 변경만 예고한다', () => {
  const NOW = new Date('2026-07-22T00:00:00.000Z');

  it('예정이 없으면 배너가 없다', () => {
    expect(planChangeNotice(planStateForTier('pro'), NOW)).toBeNull();
  });

  it('이미 지난 시각은 예고가 아니다 — 지나간 변경을 계속 알리지 않는다', () => {
    const plan: PlanState = { ...planStateForTier('pro'), effectiveAt: '2026-07-01T00:00:00.000Z' };
    expect(planChangeNotice(plan, NOW)).toBeNull();
  });

  it('미래면 날짜와 함께 예고한다', () => {
    const plan: PlanState = { ...planStateForTier('pro'), effectiveAt: '2026-08-01T12:00:00.000Z' };
    expect(planChangeNotice(plan, NOW)).toContain('2026-08-01');
  });

  it('깨진 날짜는 예고하지 않는다 — Invalid Date 를 화면에 찍지 않는다', () => {
    const plan: PlanState = { ...planStateForTier('pro'), effectiveAt: '언젠가' };
    expect(planChangeNotice(plan, NOW)).toBeNull();
  });
});
