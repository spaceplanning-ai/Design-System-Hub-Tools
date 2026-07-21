// PlanPage — 플랜·이용 현황 (라우트: /settings/plan) · 시스템 설정 섹션
//
// ┌ 이 화면이 하지 않는 일 ──────────────────────────────────────────────────┐
// │ **플랜을 바꾸지 않는다.** 구독·결제·계약은 사내 홈페이지 소관이고 이 어드민 │
// │ 은 그 값을 받는 쪽이다. 여기에 변경 수단을 두면 실제 계약과 어긋나는       │
// │ **두 번째 정본**이 생긴다 — 화면에서는 프로인데 청구는 베이직인 상태가     │
// │ 만들어지고, 그때 어느 쪽이 맞는지 아무도 답할 수 없다.                     │
// │ 청구서·인보이스·카드 등록도 같은 이유로 여기 없다.                        │
// └──────────────────────────────────────────────────────────────────────────┘
//
// [그래서 이 화면은 무엇인가] 잠금을 만난 운영자가 **'무엇을 쓰고 있고 무엇이 잠겨 있는지'** 를
// 한 번에 확인하는 곳이다. 잠금 화면(UpgradeScreen)이 여기로 보내고, 여기서 사내 홈페이지로 나간다.
//
// [숨김 모듈은 목록에도 없다] 판매하지 않는 모듈(absent)은 행 자체를 그리지 않는다. 살 수 없는 것을
// 표에 올리면 그것이 곧 티저이고, 운영자는 결제 페이지를 뒤지다 아무것도 찾지 못한다.
//
// [데이터] 백엔드 없음. 값은 localStorage 픽스처(shared/entitlements/entitlement-store.ts)에서 온다.
// TODO(backend): GET /api/tenant/entitlements — 이 화면은 조회만 한다(쓰기 엔드포인트가 없다).
import type { CSSProperties } from 'react';

import { cssVar } from '@tds/ui';

import {
  Alert,
  Card,
  CardTitle,
  ddStyle,
  dlStyle,
  dtStyle,
  hintStyle,
  StatusBadge,
  tableStyle,
  tdStyle,
  thStyle,
} from '../../../shared/ui';
import type { StatusTone } from '../../../shared/ui';
import { usePlan } from '../../../shared/entitlements/RequireEntitlement';
import { planQuotaStatus } from '../../../shared/entitlements/entitlement-store';
import {
  BILLING_STATE_LABEL,
  LEVEL_LABEL,
  MODULE_SPECS,
  PLAN_PORTAL_URL,
  PLAN_TIER_LABEL,
  billingNotice,
  entitlementStateOf,
  formatPlanDate,
  planChangeNotice,
  resolveEntitlement,
} from '../../../shared/entitlements/plan';
import type { BillingState, EntitlementKey, PlanState } from '../../../shared/entitlements/plan';
import { PlanDevPanel } from './PlanDevPanel';

/* ── 스타일 (토큰 변수만) ──────────────────────────────────────────────────── */

const pageStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: cssVar('space.5'),
  minWidth: 0,
};

const noteRowStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: cssVar('space.3'),
  minWidth: 0,
};

/* ── 문구 ──────────────────────────────────────────────────────────────────── */

const PAGE_DESCRIPTION =
  '지금 계약된 플랜과 그 플랜에 포함된 기능입니다. 플랜 변경·결제는 사내 홈페이지에서 진행합니다.';

/** 청구 상태의 색 의도 — 문구가 의미를 싣고 색은 보조다 (WCAG 1.4.1) */
const BILLING_TONE: Readonly<Record<BillingState, StatusTone>> = {
  active: 'success',
  past_due: 'warning',
  suspended: 'danger',
};

/* ── 모듈 행 ───────────────────────────────────────────────────────────────── */

interface ModuleRow {
  readonly key: EntitlementKey;
  readonly label: string;
  readonly description: string;
  readonly tone: StatusTone;
  readonly status: string;
  /** 쿼터 사용량·수준처럼 '얼마나' 를 말하는 값. 말할 것이 없으면 빈 문자열 */
  readonly detail: string;
}

/**
 * 값의 형태(switch·quota·level)를 사람의 말로 옮긴다.
 *
 * 쿼터는 **숫자로만** 말한다 — '201/200' 은 다운그레이드 직후 정상적으로 존재하는 상태이고,
 * 어느 항목이 초과분인지는 앱이 임의로 정하지 않는다(정하면 그 순간 앱이 데이터를 판결한다).
 */
function moduleDetail(plan: PlanState, key: EntitlementKey): string {
  const value = resolveEntitlement(plan, key);
  if (value === undefined) return '';

  if (value.kind === 'quota') {
    const status = planQuotaStatus(plan, key);
    return status === null ? '' : status.text;
  }
  if (value.kind === 'level') {
    return `${LEVEL_LABEL[value.level] ?? value.level} 수준`;
  }
  return '';
}

function toRows(plan: PlanState): readonly ModuleRow[] {
  const rows: ModuleRow[] = [];

  for (const spec of MODULE_SPECS) {
    const state = entitlementStateOf(plan, spec.key);
    // 판매하지 않는 모듈 — 목록에도 올리지 않는다(위 머리말)
    if (state.kind === 'absent') continue;

    rows.push({
      key: spec.key,
      label: spec.label,
      description: spec.description,
      tone: state.kind === 'granted' ? 'success' : 'neutral',
      status: state.kind === 'granted' ? '포함' : `${PLAN_TIER_LABEL[state.upgradeTo]} 플랜부터`,
      detail: state.kind === 'granted' ? moduleDetail(plan, spec.key) : '',
    });
  }

  return rows;
}

/* ── 화면 ──────────────────────────────────────────────────────────────────── */

export default function PlanPage() {
  const plan = usePlan();
  const rows = toRows(plan);
  const billing = billingNotice(plan);
  const change = planChangeNotice(plan);

  return (
    <div style={pageStyle}>
      {(billing !== null || change !== null) && (
        <div style={noteRowStyle}>
          {/* 미납·정지는 기능을 지우지 않는다 — 조회는 그대로 열려 있고 쓰기만 잠긴다 */}
          {billing !== null && <Alert tone="warning">{billing}</Alert>}
          {/* 다운그레이드 예고 — 무엇이 사라지는지는 말하지 않는다. 이 앱은 다음 플랜의
              엔타이틀먼트를 아직 모르고, 모르는 것을 지어내면 예고와 실제가 갈라진다. */}
          {change !== null && <Alert tone="info">{change}</Alert>}
        </div>
      )}

      <Card aria-labelledby="plan-current">
        <CardTitle id="plan-current" action={<StatusBadge tone="info" label={plan.planLabel} />}>
          현재 플랜
        </CardTitle>
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
          <dd style={ddStyle}>
            {plan.effectiveAt === null ? '없음' : formatPlanDate(new Date(plan.effectiveAt))}
          </dd>
        </dl>

        <p style={hintStyle}>
          플랜을 바꾸려면{' '}
          <a
            href={PLAN_PORTAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="tds-ui-link tds-ui-focusable"
          >
            사내 홈페이지의 요금제 안내
          </a>
          에서 진행해 주세요. 이 화면에서는 바꿀 수 없습니다.
        </p>
      </Card>

      <Card aria-labelledby="plan-modules">
        <CardTitle id="plan-modules">포함 기능</CardTitle>
        <p style={hintStyle}>
          잠긴 기능은 메뉴에 남아 있고, 들어가면 어떤 플랜에서 열리는지 안내합니다. 잠금은 이미 쌓인
          데이터를 지우지 않습니다.
        </p>

        <table style={tableStyle}>
          <caption style={hintStyle}>플랜에 포함된 기능과 사용량</caption>
          <thead>
            <tr>
              <th scope="col" style={thStyle}>
                기능
              </th>
              <th scope="col" style={thStyle}>
                상태
              </th>
              <th scope="col" style={thStyle}>
                사용량 · 수준
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <th scope="row" style={tdStyle}>
                  {row.label}
                  <span style={hintStyle}> — {row.description}</span>
                </th>
                <td style={tdStyle}>
                  <StatusBadge tone={row.tone} label={row.status} />
                </td>
                <td style={tdStyle}>{row.detail === '' ? '—' : row.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* 개발용 전환 패널 — import.meta.env.DEV 로 감싼다. vite 가 운영 빌드에서 이 분기를
          상수 false 로 접어 패널 코드까지 통째로 제거한다(운영 화면에 플랜 변경 수단이 없다). */}
      {import.meta.env.DEV && <PlanDevPanel />}
    </div>
  );
}
