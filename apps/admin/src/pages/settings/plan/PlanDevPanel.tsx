// 개발용 플랜 전환 패널 — **운영 빌드에 존재하지 않는다**
//
// [왜 필요한가] 이 앱에는 백엔드가 없어 기본 상태가 '전 기능 가용' 이다(plan.ts 의
// DEFAULT_PLAN_STATE). 그 상태만으로는 잠금 배지도, 업그레이드 화면도, 쿼터 소진도 한 번도
// 그려지지 않는다 — 만들어 놓고 아무도 본 적 없는 화면이 된다. 사내 어드민이 값을 내려 준 상황을
// 손으로 재현하는 자리가 여기다.
//
// [왜 이것이 '플랜을 바꾸는 UI' 가 아닌가] 호출부가 `import.meta.env.DEV` 로 감싸므로 vite 가
// 운영 빌드에서 이 모듈을 통째로 접는다. 운영자가 볼 수 있는 화면에는 플랜을 바꾸는 수단이 없다 —
// 구독·결제·계약은 사내 홈페이지 소관이라는 원칙이 그대로 지켜진다.
import type { CSSProperties } from 'react';

import { cssVar } from '@tds/ui';

import { Card, CardTitle, fieldLabelStyle, hintStyle, SelectField } from '../../../shared/ui';
import { useEntitlementStore } from '../../../shared/entitlements/entitlement-store';
import {
  BILLING_STATES,
  BILLING_STATE_LABEL,
  PLAN_TIERS,
  PLAN_TIER_LABEL,
} from '../../../shared/entitlements/plan';
import type { BillingState, PlanTier } from '../../../shared/entitlements/plan';

const rowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: `repeat(auto-fit, minmax(calc(${cssVar('space.6')} * 5), 1fr))`,
  gap: cssVar('space.4'),
  alignItems: 'start',
};

const groupStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: cssVar('space.2'),
  minWidth: 0,
};

/** 문자열 → 티어. 알 수 없으면 바꾸지 않는다(select 라 실제로는 오지 않는다) */
function toTier(value: string): PlanTier | null {
  return PLAN_TIERS.find((tier) => tier === value) ?? null;
}

function toBillingState(value: string): BillingState | null {
  return BILLING_STATES.find((state) => state === value) ?? null;
}

export function PlanDevPanel() {
  const plan = useEntitlementStore((store) => store.plan);
  const devSetTier = useEntitlementStore((store) => store.devSetTier);
  const devSetBillingState = useEntitlementStore((store) => store.devSetBillingState);

  return (
    <Card aria-labelledby="plan-dev">
      <CardTitle id="plan-dev">개발용 플랜 전환</CardTitle>
      <p style={hintStyle}>
        사내 어드민이 값을 내려 준 상황을 재현합니다. 개발 빌드에만 있는 패널이며 운영 빌드에는
        포함되지 않습니다.
      </p>

      <div style={rowStyle}>
        <div style={groupStyle}>
          <label style={fieldLabelStyle} htmlFor="plan-dev-tier">
            플랜 등급
          </label>
          <SelectField
            id="plan-dev-tier"
            value={plan.tier}
            onChange={(event) => {
              const tier = toTier(event.target.value);
              if (tier !== null) devSetTier(tier);
            }}
          >
            {PLAN_TIERS.map((tier) => (
              <option key={tier} value={tier}>
                {PLAN_TIER_LABEL[tier]}
              </option>
            ))}
          </SelectField>
        </div>

        <div style={groupStyle}>
          <label style={fieldLabelStyle} htmlFor="plan-dev-billing">
            청구 상태
          </label>
          <SelectField
            id="plan-dev-billing"
            value={plan.billingState}
            onChange={(event) => {
              const state = toBillingState(event.target.value);
              if (state !== null) devSetBillingState(state);
            }}
          >
            {BILLING_STATES.map((state) => (
              <option key={state} value={state}>
                {BILLING_STATE_LABEL[state]}
              </option>
            ))}
          </SelectField>
        </div>
      </div>
    </Card>
  );
}
