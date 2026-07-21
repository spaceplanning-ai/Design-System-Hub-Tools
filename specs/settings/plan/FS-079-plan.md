---
id: FS-079
title: "플랜·이용 현황 (읽기 전용)"
screen: SCR-079               # ⚠ 시스템 설정 SCR 미작성 — §7 미결 사항 참조
route: /settings/plan
owner: 기능 명세
reviewer: 명세 리뷰
gate: G9
status: draft
confirmedAt: 2026-07-22
version: 1.0
date: 2026-07-22
---

# FS-079. 플랜·이용 현황 (읽기 전용)

## 1. 화면 개요

| 항목 | 내용 |
|---|---|
| 목적 | 지금 계약된 **플랜 등급·청구 상태·변경 예정일**과 그 플랜에 **포함된 기능 목록**을 보여 준다. 잠금(`UpgradeScreen`)을 만난 운영자가 '무엇을 쓰고 있고 무엇이 잠겨 있는지' 를 한 번에 확인하는 자리이며, 여기서 사내 홈페이지로 나간다(`PlanPage.tsx:11-12`) |
| 역할(주 사용자) | 관리자 (**이 화면에 쓰기 권한 분기가 없다** — `useRouteWritePermissions` 소비 0건. 쓰기가 없으므로 필요하지 않다. §4.1) |
| 진입 경로 | ① 좌측 GNB > 시스템 > 시스템 설정 > 플랜·이용 현황 (`nav-config.ts:293`) ② **잠금 화면의 '현재 플랜 확인' 버튼**(`shared/errors/ErrorScreens.tsx:134-136` → `PLAN_PAGE_PATH` — `plan.ts:510`) |
| 포함 화면 | 단일 라우트 `/settings/plan` — **하위 라우트가 없다(잎)** (`App.tsx:471`) |
| **읽기 전용 — 이 화면의 정체** | **플랜을 바꾸지 않는다.** 구독·결제·계약은 사내 홈페이지 소관이고 이 어드민은 값을 **받는 쪽**이다(`PlanPage.tsx:3-9`). 근거가 그 머리말에 있다: '여기에 변경 수단을 두면 실제 계약과 어긋나는 **두 번째 정본**이 생긴다 — 화면에서는 프로인데 청구는 베이직인 상태가 만들어지고, 그때 어느 쪽이 맞는지 아무도 답할 수 없다.' 사용자에게도 그렇게 말한다(`:179-190`: '…이 화면에서는 바꿀 수 없습니다.'). **나가는 길은 상수 하나뿐** — `PLAN_PORTAL_URL = 'https://spaceplanning.ai/pricing'`(`plan.ts:507`), 그 상수의 존재 이유가 주석(`:501-506`)에 적혀 있다 |
| **범위 밖** | **플랜 변경·업그레이드·다운그레이드** · **결제수단 등록·청구서·인보이스** — 전부 사내 홈페이지 소관이다(`PlanPage.tsx:8`). **화면 안 잠금 표시**(쿼터 소진 시 등록 차단·미납 시 쓰기 잠금) — 훅은 있으나(`useCreateBlock`·`usePlanWriteBlock`·`useEntitlement`·`useQuota`) **소비하는 화면이 0건이다**(§7 #6). **라우트 잠금 그 자체** — `RequireEntitlement` 가 AppShell 에서 하고(`AppShell.tsx:407-411`) 잠금 화면은 `UpgradeScreen`(`ErrorScreens.tsx:106`)이 그린다. **엔타이틀먼트 값의 수정** — 이 앱이 플랜을 바꾸는 유일한 통로는 `receivePlan`(`entitlement-store.ts:88`)이고 그것을 부르는 화면이 없다(사내 어드민/웹훅 자리) |
| 구현 경로 | `apps/admin/src/pages/settings/plan/{PlanPage.tsx(237행),PlanDevPanel.tsx(104행)}` · **모델·판정의 정본은 화면 밖** `apps/admin/src/shared/entitlements/{plan.ts(603행),entitlement-store.ts(163행),RequireEntitlement.tsx(114행),module-resources.ts(110행),route-entitlement.ts(42행)}` |
| 대응 SCR | SCR-079 (미작성 — §7 #1) |
| 공통 컴포넌트 | `shared/entitlements/{usePlan,planQuotaStatus,MODULE_SPECS,entitlementStateOf,resolveEntitlement,billingNotice,planChangeNotice,formatPlanDate,PLAN_TIER_LABEL,BILLING_STATE_LABEL,LEVEL_LABEL,PLAN_PORTAL_URL}` · `shared/ui/{Alert,Card,CardTitle,StatusBadge,SelectField,dlStyle,dtStyle,ddStyle,hintStyle,tableStyle,thStyle,tdStyle,fieldLabelStyle}` |

### 1.1 이 화면의 설계 원칙 (요구사항 — 명세에 고정한다)

| 원칙 | 내용과 이유 (코드 근거) |
|---|---|
| **판정은 3상태다 — boolean 으로 뭉치지 않는다** | `EntitlementState = { granted } \| { locked, reason, upgradeTo } \| { absent }`(`plan.ts:109-112`). 숨김과 잠금은 **운영자가 해야 할 행동이 다르다**(`:100-107`): locked → 사내 홈페이지에서 상위 플랜으로 올린다(살 수 있다) / absent → 할 수 있는 일이 없다(살 수 없는 것을 티저하면 노이즈다). 사유·`upgradeTo` 를 상태와 **한 벌로** 낸다 |
| **숨김(absent) 모듈은 표에도 없다** | `toRows` 가 `state.kind === 'absent'` 인 spec 을 `continue` 로 건너뛴다(`PlanPage.tsx:119-120`). 근거(`:14-15`): '살 수 없는 것을 표에 올리면 그것이 곧 티저이고, 운영자는 결제 페이지를 뒤지다 아무것도 찾지 못한다' |
| **실패 방향이 권한과 정반대다 (fail-open)** | 권한(RBAC)은 fail-closed(모르면 막는다), 엔타이틀먼트는 **fail-open**(모르면 연다 — 가용성 우선). `plan.ts:19-28` 이 이것을 '이 파일에서 가장 중요한 문장' 이라고 적는다: '고객이 돈을 낸 기능이 우리 조회 실패로 멈추는 것은 어떤 과금 실수보다 나쁘다.' 모든 '모르겠다' 경로가 granted 로 수렴한다 — 저장값 없음·파손 → `DEFAULT_PLAN_STATE`(전 기능 가용) · 키가 응답에 없음 → granted(`:383`) · 경로 매핑 없음 → granted(`route-entitlement.ts:40`) |
| **판정 순서는 플랜 → 권한이다** | ① 인증 ② 엔타이틀먼트 ③ 권한 ④ 도메인 설정(`plan.ts:10-17`). `RequireEntitlement` 가 `RequirePermission` **바깥**에 중첩된다(`AppShell.tsx:407-411`, 근거 주석 `:401-406`). 뒤집으면 **사지 않은 기능에 '권한이 없습니다' 라고 말하게 되고** 운영자는 켜 줄 수 없는 관리자에게 권한을 요청해 지원 티켓이 된다 |
| **잠금은 데이터를 지우지 않는다** | 화면이 그렇게 말한다(`PlanPage.tsx:195-198`): '잠긴 기능은 메뉴에 남아 있고, 들어가면 어떤 플랜에서 열리는지 안내합니다. 잠금은 이미 쌓인 데이터를 지우지 않습니다.' 미납·정지도 마찬가지 — 기능을 지우지 않고 **읽기 전용으로 내려앉힐 뿐**이다(`plan.ts:68-71,396-404`) |
| **쿼터는 숫자로만 말한다** | `'201/200'` 은 다운그레이드 직후 **정상적으로 존재하는 상태**이고, 어느 항목이 초과분인지 앱이 임의로 정하지 않는다(`PlanPage.tsx:97-99` · `plan.ts:424-427,458-464`). 표기는 두 형태뿐이다 — 한도가 숫자면 `'<라벨> <사용>/<한도>'`, 무제한이면 `'<라벨> <사용>건 · 무제한'`(`plan.ts:451-454`). 경계는 **포함**이라 `200/200` 부터 소진이다(`exhausted = limit !== 'unlimited' && used >= limit` — `:450`, 회귀 `plan.test.ts:136`) |
| **다운그레이드는 데이터를 지우지 않는다 — 생성만 잠근다** | 한도를 넘겨도 판정은 **`granted`** 다(회귀 `plan.test.ts:146` '한도를 넘겨도 화면은 granted 다 — 초과분을 지우거나 판결하지 않는다'). `quotaCreateBlock` 의 주석(`plan.ts:461-463`)이 세 가지를 못박는다: ① **삭제하지 않는다** ② **읽기·내보내기는 그대로 열어 둔다** ③ 어느 항목이 초과분인지 앱이 임의로 정하지 않는다. 남는 조치는 '더 만들지 못하게' 뿐이고, 그것은 권한 액션 5종 중 `create` **하나로 이미 표현된다** — 새 개념을 만들지 않는다. 청구 미납(`past_due`·`suspended`)도 같은 방향이다: 기능을 `locked` 로 만들지 않고 **읽기 전용으로 내려앉힐 뿐**이며(`:396-404`), 그래야 운영자가 무엇을 결제해야 하는지 확인할 수 있다. ⚠ **이 두 규칙을 집행하는 화면이 아직 0건이다**(§7 #6) — 규칙은 완성돼 있고 소비처가 없다 |
| **한도 0 ≠ 쿼터 소진** | `limit: 0` 은 '쓸 수 없다'라 **화면째 잠긴다**(`entitlementEnabled` — `plan.ts:362-367`). `200/200` 은 화면이 열리고 생성만 막힌다. 회귀가 둘을 따로 고정한다(`plan.test.ts:136,156`) |
| **다음 플랜에 무엇이 있는지 말하지 않는다** | 변경 예고 배너가 **날짜와 「어디서 확인하는지」 까지만** 말한다(`plan.ts:477-482`): 이 어드민은 받는 쪽이라 다음 플랜의 엔타이틀먼트를 아직 모르고, 모르는 것을 지어내면 예고와 실제가 갈라진다 |
| **개발용 전환 패널은 운영 빌드에 없다** | `{import.meta.env.DEV && <PlanDevPanel />}`(`PlanPage.tsx:234`) — vite 가 운영 빌드에서 이 분기를 상수 `false` 로 접어 **패널 코드까지 통째로 제거한다**(`:232-233` · `PlanDevPanel.tsx:8-10`). 그래서 이 패널의 존재가 '플랜 변경 UI 를 두지 않는다' 는 원칙을 깨지 않는다 |

> **이 열 원칙의 결정 근거는 [`docs/adr/0013-entitlement-layer.md`](../../../docs/adr/0013-entitlement-layer.md)(ADR-0013, accepted, 2026-07-22) 가 소유한다** — 엔타이틀먼트 축을 권한 축에서 분리한 이유, 판정 순서, 3상태, fail 방향, 그리고 플랜 변경 UI 를 두지 않는 이유. 이 문서는 그 결정을 **이 화면에서 어떻게 보이는가**로만 옮기고 근거를 복제하지 않는다. 결정을 뒤집으려면 ADR 을 먼저 뒤집어야 한다.

## 2. 영역 구성

| 영역번호 | 이름 | 설명 |
|---|---|---|
| FS-079-SEC-01 | 알림 영역 (비표시 기본) | 청구 상태 배너 + 플랜 변경 예고 배너. 둘 다 없으면 컨테이너째 렌더되지 않는다 |
| FS-079-SEC-02 | 현재 플랜 카드 | 제목 + 플랜 라벨 배지 + 안내문 + `<dl>` 3항목 + 사내 홈페이지 안내 |
| FS-079-SEC-03 | 포함 기능 카드 | 제목 + 안내문 + 기능 표(3열) |
| FS-079-SEC-04 | 개발용 플랜 전환 패널 (**DEV 빌드 전용**) | 플랜 등급 select + 청구 상태 select |
| FS-079-SEC-05 | 이 화면 밖의 결과 (참조) | 사이드바 잠금 꼬리표 · 잠금 화면 · 대시보드 리다이렉트 — 이 화면이 설명하는 상태가 실제로 나타나는 자리들 |

> **이 화면에 로딩·조회 실패·빈 상태·폼·저장·이탈 가드 영역이 없다.** `usePlan()` 이 zustand 조각 구독(`RequireEntitlement.tsx:36-38`)이라 **동기로 값이 있고**, 값의 출처는 네트워크가 아니라 localStorage 다(`entitlement-store.ts:40-49`). 백엔드가 붙으면 그 세 영역이 전부 새로 필요하다(§7 #3).

## 3. 요소 명세

| 요소번호 | 영역 | 이름 | 유형 | 동작 | [서버] | 비고 |
|---|---|---|---|---|---|---|
| FS-079-EL-001 | FS-079-SEC-01 | 청구 상태 배너 | 배너 | `billingNotice(plan) !== null` 이면 warning `Alert`(`PlanPage.tsx:148`). 문구 2종(`plan.ts:407-415`): `past_due` → '결제가 확인되지 않아 지금은 조회만 가능합니다. 사내 홈페이지에서 결제 상태를 확인해 주세요.' / `suspended` → '구독이 정지되어 지금은 조회만 가능합니다. 사내 홈페이지에서 구독을 다시 활성화해 주세요.' / `active` → `null`(배너 없음) | O | 비표시 기본. **정지·미납이 기능을 지우지 않는다**(`plan.ts:68-71`) — 조회는 그대로 열리고 쓰기만 잠긴다. ⚠ **그 「쓰기 잠금」 을 실제로 집행하는 화면이 0건이다**(§7 #6) — 이 배너가 약속하는 상태가 앱에 구현돼 있지 않다. 톤이 `warning` 인 이유: 정지도 복구 가능한 계약 상태이지 고장이 아니다 |
| FS-079-EL-002 | FS-079-SEC-01 | 플랜 변경 예고 배너 | 배너 | `planChangeNotice(plan) !== null` 이면 info `Alert`(`:151`). `plan.effectiveAt` 이 **미래**일 때만: `'<YYYY-MM-DD>에 플랜 변경이 적용됩니다. 변경 내용은 사내 홈페이지에서 확인해 주세요.'`(`plan.ts:484-489`) | O | 비표시 기본. **무엇이 사라지는지 열거하지 않는다**(§1.1). 세 갈래로 침묵한다(`plan.ts:485-487`): `effectiveAt === null` · 파싱 불가(`Number.isNaN`) · 이미 지난 시각. 회귀 4건(`plan.test.ts:249-269`) — 그중 `:266` 이 **'깨진 날짜는 예고하지 않는다 — Invalid Date 를 화면에 찍지 않는다'** 를 이름으로 못박는다. ⚠ **그런데 같은 값을 EL-007 이 검사 없이 찍는다**(§7 #4) |
| FS-079-EL-003 | FS-079-SEC-01 | 알림 컨테이너 렌더 규칙 | 텍스트 | `(billing !== null \|\| change !== null) &&` 일 때만 세로 스택을 그린다(`:145-153`) | — | 비표시 규칙. 둘 다 없으면 **빈 여백도 남기지 않는다** |
| FS-079-EL-004 | FS-079-SEC-02 | 현재 플랜 카드 제목 · 플랜 배지 | 텍스트 | `Card aria-labelledby="plan-current"` + `CardTitle id="plan-current" action={<StatusBadge tone="info" label={plan.planLabel} />}` '현재 플랜'(`:155-158`) | O | `planLabel` 은 **계약서에 적힌 이름**이라 티어 표시명과 다를 수 있다('프로 연간' · '2026 전사 계약' — `plan.ts:275`). 기본값은 `'<티어 표시명> 플랜'`(`:339`), 저장값이 비면 그것으로 되돌린다(`:588-591`) |
| FS-079-EL-005 | FS-079-SEC-02 | 화면 안내문 | 텍스트 | `<p style={hintStyle}>` '지금 계약된 플랜과 그 플랜에 포함된 기능입니다. 플랜 변경·결제는 사내 홈페이지에서 진행합니다.'(`PAGE_DESCRIPTION` — `:72-73`, 렌더 `:159`) | — | **in-content `<h1>` 이 없다** — 화면 제목은 AppHeader 가 nav 잎 라벨('플랜·이용 현황')로 그린다. IA-02 pass 근거. ⚠ **카드 안에 있다** — 형제 설정 화면들은 카드 **위**에 둔다(`SettingsFormShell.tsx:144`) |
| FS-079-EL-006 | FS-079-SEC-02 | 플랜 등급 | 텍스트 | `<dt>플랜 등급</dt><dd>{PLAN_TIER_LABEL[plan.tier]}</dd>`(`:162-163`). 4종(`plan.ts:39,50-55`): 무료·베이직·프로·엔터프라이즈 | O | `PLAN_TIERS` 의 **배열 순서가 곧 포함 관계**다(`plan.ts:38`) — 상위 티어는 하위 티어를 전부 포함한다(`tierIncludes` — `:62-64`, 회귀 `plan.test.ts:228`). 표시명을 한 벌만 두는 이유(`:43-49`)는 결제 설정의 `PAYMENT_PROVIDER_LABEL` 과 같다 |
| FS-079-EL-007 | FS-079-SEC-02 | 변경 적용 예정 | 텍스트 | `<dt>변경 적용 예정</dt><dd>{plan.effectiveAt === null ? '없음' : formatPlanDate(new Date(plan.effectiveAt))}</dd>`(`:173-177`) | O | ⚠⚠ **`Number.isNaN` 검사가 없다.** `formatPlanDate`(`plan.ts:492-497`)는 `getFullYear()` 등을 그대로 문자열화하므로 파싱 불가 `effectiveAt` 이면 화면에 **`'NaN-NaN-NaN'`** 이 찍힌다. `normalizePlanState` 는 문자열이기만 하면 통과시키고(`:601`), 형제 소비자 `planChangeNotice` 는 같은 값에 `Number.isNaN` 가드를 둔다(`:487`). **테스트가 그 가드를 「Invalid Date 를 화면에 찍지 않는다」 는 이름으로 못박고 있는데 이 자리가 그것을 어긴다**(§7 #4). ⚠ 또 **이미 지난 `effectiveAt` 도 그대로 표시된다** — 배너(EL-002)는 침묵하는데 이 항목만 과거 날짜를 '적용 예정' 으로 말한다(§7 #5) |
| FS-079-EL-008 | FS-079-SEC-02 | 청구 상태 배지 | 배지 | `<dt>청구 상태</dt><dd><StatusBadge tone={BILLING_TONE[plan.billingState]} label={BILLING_STATE_LABEL[plan.billingState]} /></dd>`(`:165-171`). 3종(`plan.ts:72,76-80`): 정상(success) · 결제 지연(warning) · 이용 정지(danger) | O | 톤 지도는 화면 소유(`:75-80`)이고 주석이 그 이유를 적는다: '문구가 의미를 싣고 색은 보조다(WCAG 1.4.1)' |
| FS-079-EL-009 | FS-079-SEC-02 | 사내 홈페이지 안내 · 링크 | 링크 | '플랜을 바꾸려면 [사내 홈페이지의 요금제 안내]에서 진행해 주세요. **이 화면에서는 바꿀 수 없습니다.**'(`:179-190`). 링크는 `<a href={PLAN_PORTAL_URL} target="_blank" rel="noopener noreferrer">` | — | **이 화면에서 나가는 유일한 길이다.** 외부 이동이라 진짜 `<a>` 다 — DS `Button` 은 `<button>` 만 렌더하는 Frozen 계약이고 새 탭·복사·미리보기 같은 링크의 기본 동작을 버튼으로 흉내 낼 수 없다(같은 판단이 `ErrorScreens.tsx:120-122` 에 적혀 있다). `rel` 은 `noopener`·`noreferrer` 둘 다. ⚠ **URL 이 하드코딩 상수다** — 환경별 분기가 없다(§7 #9) |
| FS-079-EL-010 | FS-079-SEC-03 | 포함 기능 카드 제목 | 텍스트 | `Card aria-labelledby="plan-modules"` + `CardTitle id="plan-modules"` '포함 기능'(`:193-194`) | — | 두 카드가 `aria-labelledby` 로 자기 제목을 가리킨다 — 랜드마크 탐색에서 구분된다 |
| FS-079-EL-011 | FS-079-SEC-03 | 포함 기능 안내문 | 텍스트 | '잠긴 기능은 메뉴에 남아 있고, 들어가면 어떤 플랜에서 열리는지 안내합니다. 잠금은 이미 쌓인 데이터를 지우지 않습니다.'(`:195-198`) | — | **잠금의 성질을 사용자에게 말하는 유일한 문장이다**(§1.1). ⚠ '메뉴에 남아 있고' 는 **locked 에만 참이다** — absent 는 메뉴째 사라지는데(`AppShell.tsx:292-293`) 이 문장은 그 갈래를 말하지 않는다. 다만 absent 는 표에도 없으므로(EL-013) 화면 안에서 모순이 드러나지는 않는다 |
| FS-079-EL-012 | FS-079-SEC-03 | 기능 표 | 표 | `<table>` 3열(기능 · 상태 · 사용량 · 수준), caption '플랜에 포함된 기능과 사용량'(`:200-229`). 각 행의 첫 칸이 `<th scope="row">`(`:218`) | O | **정렬·필터·페이지네이션이 없다** — `MODULE_SPECS` 배열 순서 그대로다(`plan.ts:173-257`). 최대 11행(`ENTITLEMENT_KEYS` — `:126-138`), absent 를 뺀 수 |
| FS-079-EL-012.1 | FS-079-SEC-03 | 기능 열 (라벨 + 설명) | 텍스트 | `<th scope="row">{row.label}<span style={hintStyle}> — {row.description}</span></th>`(`:218-221`). 정본은 `MODULE_SPECS`(`plan.ts:173-257`) | O | 설명의 정본이 카탈로그인 이유(`plan.ts:152-153`): '「무엇을 사는 것인지」 를 잠금 화면이 스스로 지어내면 모듈마다 말투가 갈린다.' **잠금 화면(`UpgradeScreen`)과 이 표가 같은 문장을 쓴다** |
| FS-079-EL-012.2 | FS-079-SEC-03 | 상태 열 (배지) | 배지 | `StatusBadge tone={row.tone} label={row.status}`(`:222-224`). granted → success `'포함'` / locked → neutral `'<상위 티어 표시명> 플랜부터'`(`:126-127`) | O | ⚠ locked 행이 **`upgradeTo` 만** 말하고 **잠금 사유 문구(`lockReason` — `plan.ts:369-371`)를 보이지 않는다** — 같은 정보를 `UpgradeScreen` 은 문장으로 준다(§7 #10) |
| FS-079-EL-012.3 | FS-079-SEC-03 | 사용량 · 수준 열 | 텍스트 | `{row.detail === '' ? '—' : row.detail}`(`:225`). `moduleDetail`(`:100-112`)이 값의 형태로 갈린다: `quota` → `planQuotaStatus(plan, key)?.text`('상품 200/200' 또는 '상품 12건 · 무제한') / `level` → `'<수준 표시명> 수준'` / `switch` → `''` → '—' | O | **locked 행은 언제나 '—' 다**(`:128` — `granted` 일 때만 `moduleDetail` 을 부른다). `LEVEL_LABEL[value.level] ?? value.level`(`:109`) — **표시명이 없는 level 은 원문이 그대로 노출된다**(§7 #11) |
| FS-079-EL-013 | FS-079-SEC-03 | 행 구성 규칙 (absent 제외) | 텍스트 | `toRows(plan)`(`:114-133`): `MODULE_SPECS` 를 순회하며 `entitlementStateOf(plan, spec.key)` 를 묻고 **`absent` 면 `continue`**(`:119-120`) | O | 비표시 규칙. ⚠ **오늘 이 앱에서 `absent` 는 어떤 경로로도 발현되지 않는다** — 유일한 후보인 `marketing.sms`(`minTier: null` — `plan.ts:240`)는 `entitlementsForTier` 가 **키 자체를 넣지 않고**(`:299`) `overrides` 도 비어 있어 `resolveEntitlement` 가 `undefined` → fail-open `granted` 가 된다(`:383`). absent 가 되려면 사내 어드민이 그 키를 **명시적으로 꺼서 보내야** 하는데 그 통로(`receivePlan`)를 부르는 화면이 없다(§7 #7). 회귀는 이 경로를 직접 구성해 고정한다(`plan.test.ts:57-64`) |
| FS-079-EL-014 | FS-079-SEC-03 | 판정 규칙 (3상태) | 텍스트 | `entitlementStateOf(plan, key)`(`plan.ts:380-392`): ① `resolveEntitlement` 가 `undefined` → **granted**(fail-open) ② 값이 켜져 있으면 → granted ③ 카탈로그에 없는 키 → **granted**(무엇을 사야 하는지 말할 수 없으므로 열어 둔다) ④ `spec.minTier === null` → **absent** ⑤ 그 밖 → `{ locked, reason: lockReason(spec, minTier), upgradeTo: minTier }` | O | 비표시 규칙. `resolveEntitlement`(`:357-359`)는 **`overrides` 가 `tier` 를 이긴다** — 영업 예외·grandfathering 은 그것으로만 표현하고 티어 정의를 고객별로 포크하지 않는다(`:278-284`). '켜져 있는가' 판정(`entitlementEnabled` — `:362-367`): switch → `enabled` / quota → `limit === 'unlimited' \|\| limit > 0`(**한도 0 은 「쓸 수 없다」이지 쿼터 소진이 아니다**) / level → `level !== 'none'`. 회귀 `plan.test.ts:29-101` |
| FS-079-EL-015 | FS-079-SEC-02/03 | 플랜 상태 조회 규칙 | 텍스트 | `usePlan()`(`RequireEntitlement.tsx:36-38`) → `useEntitlementStore((store) => store.plan)`. 스토어 초기값은 `loadState()`(`entitlement-store.ts:40-49,109`) — `localStorage['tds-admin.plan']` 을 읽어 `normalizePlanState` 를 통과시키고, **어느 갈래로 실패해도 `DEFAULT_PLAN_STATE`(전 기능 가용)** 로 떨어진다 | O | 비표시 규칙. **조각 구독이라 플랜이 바뀌지 않으면 재렌더도 없다**(`:35`). 기본값이 가장 낮은 티어가 아니라 `enterprise` 인 이유(`plan.ts:316-322`): '이 앱에는 백엔드가 없다. 즉 「주입 전」 이 정상 상태다. 그때 기본값을 낮은 티어로 두면 이 층을 추가한 것만으로 기존 화면 절반이 사라진다' |
| FS-079-EL-016 | FS-079-SEC-03 | 쿼터 사용량 주입 규칙 | 텍스트 | `planQuotaStatus(plan, key)`(`entitlement-store.ts:138-140`)가 `quotaStatusOf(plan, key, entitlementUsageOf(key))` 를 부른다. **실제 건수는 주입된 조회기가 안다** — `registerEntitlementUsageLookup`(`:70-72`)의 유일한 배선 지점이 `wiring.ts:178-180` 이고 거기서 `key === 'commerce.products' ? listProducts().length : null` 을 꽂는다 | O | 비표시 규칙. 의존 방향을 뒤집는 이음매다(`entitlement-store.ts:51-63`) — `shared/entitlements` 가 `pages/products` 를 import 하면 페이지 결합(code-quality 축1 임계치 0)이 곧바로 잡힌다. **모르는 키에는 `0` 이 아니라 `null` 을 준다** — 0 은 '아무것도 안 썼다' 로 읽혀 한도가 찬 계정의 등록을 열어 버린다(`wiring.ts:177`). ⚠ **쿼터 종 모듈은 `commerce.products` 하나뿐이라 실질 배선도 한 건이다** |
| FS-079-EL-017 | FS-079-SEC-04 | 개발용 패널 마운트 조건 | 텍스트 | `{import.meta.env.DEV && <PlanDevPanel />}`(`PlanPage.tsx:234`) | — | 비표시 규칙(운영). 근거(`:232-233`): 'vite 가 운영 빌드에서 이 분기를 상수 false 로 접어 패널 코드까지 통째로 제거한다(운영 화면에 플랜 변경 수단이 없다)'. **§1 의 「플랜을 바꾸지 않는다」 원칙과 이 패널이 공존하는 근거가 이 한 줄이다** |
| FS-079-EL-018 | FS-079-SEC-04 | 개발용 패널 카드 · 안내문 | 텍스트 | `Card aria-labelledby="plan-dev"` + `CardTitle` '개발용 플랜 전환' + '사내 어드민이 값을 내려 준 상황을 재현합니다. 개발 빌드에만 있는 패널이며 운영 빌드에는 포함되지 않습니다.'(`PlanDevPanel.tsx:54-59`) | — | 왜 필요한가(`:3-6`): 기본 상태가 '전 기능 가용' 이라 그것만으로는 잠금 배지도, 업그레이드 화면도, 쿼터 소진도 **한 번도 그려지지 않는다** — '만들어 놓고 아무도 본 적 없는 화면' 이 된다 |
| FS-079-EL-019 | FS-079-SEC-04 | 개발용 플랜 등급 select | 입력 | `<label htmlFor="plan-dev-tier">플랜 등급</label>` + `SelectField`(`PlanDevPanel.tsx:62-80`). 4종. `toTier`(`:40-42`)를 통과한 값만 `devSetTier(tier)`(`entitlement-store.ts:115-123`) | — | **DEV 전용.** `devSetTier` 는 `planStateForTier(tier)` 로 갈아끼우되 **`overrides`·`billingState`·`effectiveAt` 은 남긴다**(`:118-121`) — 그 셋은 티어와 다른 축이다. 갱신은 `mutate` 를 거쳐 localStorage 에 저장된다(`:100-106`) |
| FS-079-EL-020 | FS-079-SEC-04 | 개발용 청구 상태 select | 입력 | `<label htmlFor="plan-dev-billing">청구 상태</label>` + `SelectField`(`:82-100`). 3종. `toBillingState`(`:44-46`) 통과 후 `devSetBillingState`(`entitlement-store.ts:125-127`) | — | **DEV 전용.** EL-001 배너를 재현하는 유일한 수단이다 |
| FS-079-EL-021 | FS-079-SEC-05 | 사이드바 잠금 꼬리표 (이 화면 밖) | 텍스트 | `entitledLabel(resourceId, label)`(`AppShell.tsx:290-295`): absent → `null`(**메뉴째 사라진다**) / locked → `'<라벨> · 잠금'`(`LOCKED_NAV_SUFFIX` — `plan.ts:520`) / granted → 그대로 | O | 비표시(이 화면 밖). **아이콘 배지가 아니라 글자인 이유**(`plan.ts:512-519`): ① `@tds/ui` Sidebar 계약의 하위 항목은 `{ id, label, href }` 뿐이라 배지를 꽂을 슬롯이 없다 ② **색·아이콘만으로 상태를 전달하지 않는다**(WCAG 1.4.1) — 글자는 스크린리더가 그대로 읽는다. 가시성은 플랜 ∩ 권한 교집합이고 **진단 순서만 반대(플랜 먼저)** 다(`AppShell.tsx:280-289`) |
| FS-079-EL-022 | FS-079-SEC-05 | 잠금 화면 · 대시보드 리다이렉트 (이 화면 밖) | 텍스트 | `RequireEntitlement`(`RequireEntitlement.tsx:107-114`)가 AppShell `<Outlet>` 을 감싼다: granted → 통과 / **absent → `<Navigate to="/dashboard" replace />`** / locked → `<UpgradeScreen reason upgradeTo />`. `UpgradeScreen`(`ErrorScreens.tsx:106-140`)은 제목 `'<티어> 플랜에서 사용할 수 있습니다'` + 사유 + '플랜을 올리면 이 화면이 그대로 열리고, 지금까지 쌓인 데이터도 그대로 남아 있습니다.' + 두 액션(**'플랜 보기'** → 외부 `PLAN_PORTAL_URL` / **'현재 플랜 확인'** → 이 화면) | O | 비표시(이 화면 밖). **이 화면의 두 번째 진입 경로가 그 두 번째 버튼이다**(§1). 403 과 섞지 않는 이유(`ErrorScreens.tsx:91-98`): '「권한 요청」 과 「결제 필요」 는 **다른 사람이 다른 행동을 해야 한다**'. **참조 코드가 없다** — 신고할 고장이 아니라 계약 상태다(`:100`). absent 에 화면 대신 리다이렉트인 이유(`RequireEntitlement.tsx:102-105`): 그 URL 은 이 계정에 존재하지 않는 주소이고, 살 수 없는 것을 설명하는 화면은 그 자체가 티저다 |
| FS-079-EL-023 | FS-079-SEC-02/03 | 크로스탭 동기화 규칙 | 텍스트 | `useEntitlementSync()`(`RequireEntitlement.tsx:47-49`)를 **AppShell 이 마운트 시 한 번** 건다(`AppShell.tsx:226`) → `subscribeToOtherTabs`(`entitlement-store.ts:154-163`)가 `storage` 이벤트에서 키 `'tds-admin.plan'` 만 골라 `syncFromStorage()` 를 부른다 | O | 비표시 규칙. `storage` 이벤트는 **그 이벤트를 낸 탭 이외에서만** 발화하므로 저장→재로드 루프가 생기지 않는다(`:148-149`). 근거(`:151-152`): '사내 어드민이 플랜을 내리면 이 앱의 모든 탭이 같은 순간에 같은 화면을 보여야 한다.' **이 화면이 열려 있는 채 다른 탭에서 DEV 패널을 만지면 즉시 따라온다** |
| FS-079-EL-024 | FS-079-SEC-02/03 | 저장값 방어 규칙 | 텍스트 | `normalizePlanState(raw)`(`plan.ts:575-603`): 객체가 아니거나 티어를 못 읽거나 `version !== 1` 이면 **`DEFAULT_PLAN_STATE`**. 개별 엔타이틀먼트는 형태가 깨졌으면 **그 키만 없는 것으로 둔다**(`:553-554`) — 없으면 granted 로 읽히므로 **파손이 차단이 되지 않는다.** 모르는 청구 상태는 `'active'` 로 읽는다(`:563-566`) — '오탈자 하나가 전 고객을 읽기 전용으로 만든다' | O | 비표시 규칙. **응답에 없던 키를 티어 정의로 채우지 않는다**(`:592-598`) — 채우면 앱이 서버 카탈로그보다 앞선 순간 새 모듈이 전 고객에게서 잠긴다. 권한 축의 `normalizeMatrix` 가 좁은 쪽으로 되돌리는 것과 **정확히 반대 방향**이다. 회귀 6건(`plan.test.ts:168-225`) |
| FS-079-EL-025 | — | **이 화면에 없는 것 (부재 규칙)** | 텍스트 | ① **폼·저장·dirty·이탈 가드가 없다**(`useForm`·`useUnsavedChangesDialog` 소비 0건) ② **로딩·조회 실패·재시도가 없다**(`usePlan` 이 동기) ③ **빈 상태가 없다** — 모듈이 전부 absent 여도 표는 머리만 남는다(오늘은 발현 불가 — EL-013) ④ **쓰기 권한 게이팅이 없다**(`useRouteWritePermissions` 소비 0건) — 쓰기가 없으므로 필요하지 않다 ⑤ **토스트가 없다** ⑥ **이 라우트는 엔타이틀먼트 게이팅 대상이 아니다** — `MODULE_RESOURCES`(`module-resources.ts:29-91`)에 `/settings/**` 가 없어 언제나 granted 다(`route-entitlement.ts:28`) | — | 비표시 규칙(부재). ⑥이 중요하다: **잠금을 설명하는 화면이 잠기면 설명을 볼 수 없다.** 매핑이 없는 화면을 granted 로 두는 규칙(`module-resources.ts:15-17`: '대부분의 화면은 어떤 모듈에도 속하지 않는다 … 플랜과 무관하게 늘 열려 있어야 하는 앱의 뼈대다')이 그것을 보장한다 |

## 4. 예외 명세

| 요소번호 | 빈 상태 | 로딩 | 실패 | 유효성 | 권한없음 | 경합 | 대량 |
|---|---|---|---|---|---|---|---|
| FS-079-EL-001 | `billingState === 'active'` 면 `null` — 렌더되지 않는다 | **N/A — 이 화면에 로딩이 없다**(`usePlan` 동기 · §7 #3) | **N/A — 조회 실패 경로가 없다.** localStorage 파손은 `DEFAULT_PLAN_STATE`(`billingState: 'active'`)로 수렴해 배너가 사라진다 | 모르는 청구 상태는 `'active'` 로 읽힌다(EL-024) — 배너가 뜨지 않는다(fail-open) | 권한과 무관하게 표시 | 다른 탭이 값을 바꾸면 `storage` 이벤트로 즉시 갱신된다(EL-023) | 문구 2종 |
| FS-079-EL-002 | `effectiveAt === null` 이면 렌더되지 않는다 | N/A — 동기 | N/A | **세 갈래로 침묵한다** — null · 파싱 불가 · 과거 시각(`plan.ts:485-487`). 회귀 `plan.test.ts:249-269` | 권한과 무관 | 위와 동일 | 문구 1종 |
| FS-079-EL-003 | **둘 다 없으면 컨테이너째 렌더되지 않는다** | N/A | N/A | N/A — 규칙 | 권한과 무관 | N/A | 최대 2배너 |
| FS-079-EL-004 | `planLabel` 이 비면 `'<티어 표시명> 플랜'` 으로 되돌린다(EL-024) | N/A — 동기 | N/A | 저장값이 문자열이 아니거나 공백뿐이면 기본 라벨(`plan.ts:588-591`) | 권한과 무관 | 위와 동일 | **길이 상한이 없다** — 긴 계약명이 배지를 넘칠 수 있다 |
| FS-079-EL-005 | N/A — 정적 문구 | N/A | N/A | N/A | 권한과 무관 | N/A | 고정 문구 |
| FS-079-EL-006 | N/A — 언제나 값이 있다 | N/A — 동기 | N/A | 티어를 못 읽으면 `DEFAULT_PLAN_STATE.tier === 'enterprise'`(fail-open) | 권한과 무관 | 위와 동일 | 4종 고정 |
| FS-079-EL-007 | `null` 이면 '없음' | N/A — 동기 | N/A | ⚠ **파싱 불가 값에 `'NaN-NaN-NaN'` 을 찍는다** — 이 화면 유일의 실재 표시 결함(§7 #4). ⚠ 과거 날짜도 그대로 '적용 예정' 으로 보인다(§7 #5) | 권한과 무관 | 위와 동일 | 문자열 1개 |
| FS-079-EL-008 | N/A — 언제나 3상태 중 하나 | N/A — 동기 | N/A | 모르는 값은 `'active'`(EL-024) | 권한과 무관 | 위와 동일 | 3종 고정 |
| FS-079-EL-009 | N/A — 정적 링크 | N/A | **외부 URL 이라 도달 가능 여부를 검증하지 않는다** — 죽은 링크여도 화면은 모른다 | N/A | 권한과 무관 — **읽기 전용 역할도 나갈 수 있다** | N/A | 1개. **하드코딩 URL**(§7 #9) |
| FS-079-EL-010 | N/A — 정적 문구 | N/A | N/A | N/A | 권한과 무관 | N/A | 고정 문구 |
| FS-079-EL-011 | N/A — 정적 문구 | N/A | N/A | N/A | 권한과 무관 | N/A | 고정 문구. ⚠ absent 갈래를 말하지 않는다 |
| FS-079-EL-012 | **행이 0개여도 표 머리는 남는다** — 빈 상태 문구가 없다(§7 #8). 오늘은 발현 불가(EL-013) | N/A — 동기 | N/A | N/A — 표시 전용 | 권한과 무관하게 전부 보인다 | 플랜이 바뀌면 행 집합이 통째로 바뀐다 | **최대 11행 · 페이지네이션·정렬 없음**(실용상 충분) |
| FS-079-EL-012.1 | N/A — 카탈로그가 정본 | N/A | N/A | 라벨·설명은 상수라 위반 값이 없다 | 권한과 무관 | N/A — 정적 | 11건 |
| FS-079-EL-012.2 | N/A — 언제나 granted 또는 locked | N/A | N/A | 3상태 중 absent 는 이 자리에 오지 않는다(EL-013 이 걸렀다) | 권한과 무관 | 플랜 변경 시 배지가 따라온다 | ⚠ **locked 사유 문구를 보이지 않는다**(§7 #10) |
| FS-079-EL-012.3 | `detail === ''` 이면 '—' | N/A | 조회기가 배선되지 않았으면 저장값의 `usage` 로 되돌아간다(0 이 아니다) | ⚠ `LEVEL_LABEL` 에 없는 level 은 **원문 그대로 노출**(§7 #11) | 권한과 무관 | 상품 건수가 바뀌면 다음 렌더에 따라온다 | 쿼터 종 1개 · level 종 1개 · 나머지 switch |
| FS-079-EL-013 | 전부 absent 면 빈 표(오늘은 불가) | N/A — 동기 | N/A | **이것이 숨김 규칙** | N/A | 플랜이 바뀌면 다시 계산된다 | ⚠ **오늘 이 앱에서 absent 가 발현되는 경로가 없다**(§7 #7) |
| FS-079-EL-014 | 응답에 키가 없으면 granted | N/A — 순수 | **모든 실패가 granted 로 수렴한다(fail-open)** | **이것이 판정 규칙.** 회귀 `plan.test.ts:29-101,168-225` | 권한 축과 **실패 방향이 정반대**(§1.1) | `overrides` 가 `tier` 를 이긴다 | 키 11개 |
| FS-079-EL-015 | 저장값 없음 → `DEFAULT_PLAN_STATE`(전 기능 가용) | **동기 — 로딩 상태가 없다** | localStorage 접근 불가(프라이빗 모드)·JSON 파손 → `DEFAULT_PLAN_STATE`(`entitlement-store.ts:45-48`) | `normalizePlanState` 가 방어(EL-024) | 권한과 무관 | 조각 구독이라 `plan` 이 안 바뀌면 재렌더도 없다 | 문서 1건 |
| FS-079-EL-016 | 조회기 미배선이면 `null` → 저장값 `usage` 사용 | N/A — 동기 | 조회기가 던지면 그대로 전파된다 — **try/catch 가 없다**(§7 #12) | **`0` 이 아니라 `null` 을 준다** — 모르는 것과 없는 것은 다르다 | N/A | 상품 저장소를 렌더 시점에 읽는다 | 쿼터 종 1개뿐 |
| FS-079-EL-017 | N/A — 규칙 | N/A | N/A | `import.meta.env.DEV` 는 빌드 시 상수로 접힌다 | N/A | N/A | **운영 빌드에는 코드가 없다** |
| FS-079-EL-018 | N/A — DEV 에서 항상 표시 | N/A | N/A | N/A | 권한과 무관 — **DEV 빌드에서는 조회 전용 역할도 플랜을 바꿀 수 있다**(§7 #13) | N/A | 1카드 |
| FS-079-EL-019 | N/A — 언제나 한 값이 선택돼 있다 | N/A | 저장 실패(localStorage)는 **조용히 무시된다**(`entitlement-store.ts:34-36`) | `toTier` 가 목록 밖 값을 `null` 로 만들고 그때는 바꾸지 않는다 | 위와 동일 | 저장 즉시 다른 탭에 전파(EL-023) | 4종 |
| FS-079-EL-020 | N/A — 언제나 한 값 | N/A | 위와 동일 | `toBillingState` 동일 | 위와 동일 | 위와 동일 | 3종 |
| FS-079-EL-021 | absent 면 항목 자체가 사라진다 | N/A | N/A | N/A — 파생 라벨 | **가시성은 플랜 ∩ 권한 교집합** — 플랜이 열려도 역할이 막으면 안 보인다 | 플랜이 바뀌면 사이드바가 다시 그려진다 | 잎 전수 |
| FS-079-EL-022 | N/A — 잠긴 라우트에서만 성립 | N/A | N/A | **`RequireEntitlement` 가 `RequirePermission` 바깥이다** — 순서가 진단을 정한다 | **사지 않은 기능에 403 을 말하지 않는다** — 이 순서가 그것을 보장한다 | 플랜이 바뀌면 즉시 통과/차단이 바뀐다 | 라우트 전수 1회 |
| FS-079-EL-023 | N/A — 다른 탭이 있어야 성립 | N/A | 이벤트 구독 실패 경로 없음 | 키가 다르면 무시(`:156`) | N/A | **이것이 경합 표현** — 저장→재로드 루프가 없다 | 탭 수만큼 |
| FS-079-EL-024 | 저장값 없으면 기본 상태 | N/A — 순수 | **모든 파손이 「기능이 늘어나는 쪽」 으로 수렴** | **이것이 저장값 유효성 규칙.** 회귀 6건 | N/A | N/A — 순수 | 키 11개 순회 |
| FS-079-EL-025 | **N/A — 부재 규칙** | **로딩 영역이 없다는 것이 이 규칙의 내용**(§7 #3) | **조회 실패 영역이 없다는 것이 이 규칙의 내용** | 입력이 없어 유효성 개념이 없다 | **쓰기가 없어 쓰기 게이팅이 필요하지 않다** | 저장이 없어 충돌이 없다 | **이 라우트는 플랜 게이팅 대상이 아니다** — 잠금을 설명하는 화면이 잠기지 않는다 |

### 4.1 공통 예외 규칙

| 규칙 | 내용 |
|---|---|
| 네트워크 단절 | **이 화면은 네트워크를 쓰지 않는다.** 값의 출처가 localStorage(`entitlement-store.ts:40-49`)라 오프라인에서도 그대로 그려진다. 백엔드가 붙으면(`PlanPage.tsx:18` `GET /api/tenant/entitlements`) 조회 실패·재시도·스켈레톤 세 상태가 **전부 새로 필요하다**(§7 #3). 그때도 **판정은 fail-open 이어야 한다** — 조회 실패가 전 기능 정지가 되면 안 된다(`plan.ts:19-28`) |
| 세션 만료 | 이 화면 자체는 요청을 내지 않으므로 401 을 만들지 않는다. 앱 전역 인터셉터(`shared/query/queryClient.ts:60-66`)는 다른 화면의 요청에서만 발화한다. **미저장 입력이 없어 잃을 것도 없다** |
| 요청 타임아웃 | N/A — 요청이 없다 |
| 중복 제출 | N/A — 제출이 없다. DEV 패널의 select 는 zustand 동기 갱신이라 중복 개념이 없다 |
| 실패 통지의 자리 | **이 화면에 실패 통지 자리가 없다.** 유일한 실패 경로(localStorage 읽기/쓰기)는 **조용히 삼킨다** — 읽기는 `DEFAULT_PLAN_STATE` 로(`entitlement-store.ts:45-48`), 쓰기는 아무것도 하지 않는다(`:34-36`, 주석: '현재 세션 동안은 메모리 상태로 계속 동작한다'). 의도된 fail-open 이지만 **DEV 패널에서 플랜을 바꿨는데 저장이 안 된 것을 알 방법이 없다**(§7 #12) |
| 낙관적 업데이트 | N/A — 쓰기가 없다. DEV 패널의 갱신은 로컬 상태 변경이라 롤백 개념이 없다 |
| 동시 조회 | N/A — react-query 를 쓰지 않는다. 전역 스토어 1건을 조각 구독한다(`RequireEntitlement.tsx:37`) |
| 권한 없음 | **read** — `RequirePermission` 이 AppShell `<Outlet>` 을 감싸(`AppShell.tsx:408-410`) 권한 없는 deep-link 에 `ForbiddenScreen` 을 렌더한다. 리소스는 라우트에서 파생된다(`page:/settings/plan`). **write** — **없다.** 이 화면에 쓰기 컨트롤이 없으므로 `useRouteWritePermissions` 를 부르지 않는다(소비 0건). **entitlement** — `MODULE_RESOURCES` 에 `/settings/**` 가 없어 이 라우트는 **언제나 granted** 다(`route-entitlement.ts:22-29` · `module-resources.ts:15-17`) — 잠금을 설명하는 화면이 잠기지 않는다. ⚠ **DEV 빌드에서는 조회 전용 역할도 EL-019·EL-020 으로 플랜을 바꿀 수 있다**(§7 #13) |
| 렌더 예외 | AppShell 이 `<Outlet>` 바로 바깥에 `ErrorBoundary` 를 둔다(`AppShell.tsx:395-400`) — 화면이 던져도 사이드바·헤더가 남고 `RouteErrorScreen` 이 뜬다. ⚠ **쿼터 조회기가 던지면 여기로 떨어진다** — `entitlementUsageOf` 에 방어가 없다(§7 #12) |
| 상태 전이 규칙 | **이 화면에 전이가 없다.** 플랜 상태를 바꾸는 통로는 `receivePlan`(사내 어드민/웹훅 자리 — 호출부 0건)과 DEV 전용 `devSetTier`·`devSetBillingState` 뿐이다(`entitlement-store.ts:88-92`). 운영 빌드에서 이 화면은 **읽기만 한다** |
| 프론트 게이팅은 보안이 아니다 | `plan.ts:34` · `RequireEntitlement.tsx:14-17` · `entitlement-store.ts:16` 세 곳이 같은 말을 한다: '**위조된 localStorage 로 이 가드는 우회되며, 그때 실제로 막는 것은 API 응답의 402/403 이다. 둘은 대체재가 아니라 층이다.**' 서버가 동일 판정을 재검증해야 한다(BE-079 영역) |

## 5. 서버 연동 지점

| 요소번호 | 이름 | 읽기/쓰기 | 필요 데이터 | 프론트 어댑터 | 비고 |
|---|---|---|---|---|---|
| FS-079-EL-001 ~ EL-016 / EL-021 ~ EL-024 | 테넌트 엔타이틀먼트 조회 | R | `PlanState { version, tier, planLabel, entitlements, overrides, billingState, effectiveAt }` | `usePlan()` → `useEntitlementStore((s) => s.plan)` ← `loadState()`(`entitlement-store.ts:40-49`) | **이 화면의 유일한 연동 지점이다.** TODO 심 `PlanPage.tsx:18`: `GET /api/tenant/entitlements` — 바로 다음 줄이 '이 화면은 **조회만 한다**(쓰기 엔드포인트가 없다)' 라고 못박는다 |

> **현재 구현 상태 (백엔드 명세 참고)**: 백엔드는 없다. 값은 **localStorage 키 `'tds-admin.plan'`** 에서 오고(`entitlement-store.ts:29`), 없거나 깨졌으면 `DEFAULT_PLAN_STATE`(전 기능 가용 · `tier: 'enterprise'`)다(`plan.ts:324-332`). 실제 네트워크 0건. 쓰는 쪽은 **DEV 패널 두 액션뿐**이고 운영 빌드에는 그 코드가 없다(EL-017).
>
> **TODO(backend) 심은 정확히 4곳이고 전부 같은 계약을 가리킨다** — ① `PlanPage.tsx:18`(`GET /api/tenant/entitlements` — **이 화면 몫**) ② `plan.ts:30-34`(같은 GET + `webhook /entitlements.updated` + 응답 바디 7필드 + **⚠ 엔타이틀먼트를 액세스 토큰 클레임에 싣지 않는다** — 플랜 변경이 토큰 만료까지 반영되지 않는다 + 서버 재검증) ③ `entitlement-store.ts:13-16`(`loadState`/`saveState` 두 함수만 갈아끼우면 화면 코드는 그대로 · **웹훅 수신·서명 검증은 서버의 일이다** + 서버 재검증) ④ `RequireEntitlement.tsx:15-17`(프론트 가드는 UX 층이지 보안이 아니다 — 실제로 막는 것은 402/403). **쓰기 엔드포인트가 계약에 없다** — 이 어드민은 값을 받는 쪽이다(§1).
>
> **응답에 없는 키를 서버 카탈로그 갱신 지연으로 읽는 규칙**(`plan.ts:592-598`)이 계약의 일부다: 서버가 새 모듈 키를 아직 안 보내도 그 모듈은 열려 있어야 한다. BE-079 가 이것을 명시하지 않으면 **새 모듈이 출시일에 전 고객에게서 사라진다.**

## 6. 자기 점검 (제출 전 확인)

- [x] 구현 소스를 전수 대조했다 — `PlanPage.tsx`(237행) · `PlanDevPanel.tsx`(104행) · **모델·판정의 정본** `shared/entitlements/{plan.ts(603행),entitlement-store.ts(163행),RequireEntitlement.tsx(114행),module-resources.ts(110행),route-entitlement.ts(42행)}` · 잠금 화면 `shared/errors/ErrorScreens.tsx` · 소비 지점 `shared/layout/AppShell.tsx`(226·290-295·407-411) · 조회기 배선 `wiring.ts:178-180` · 테스트 `plan.test.ts`(270행) · `route-entitlement.test.ts`(99행)
- [x] **`PLAN_TIERS` 4종 · `BILLING_STATES` 3종 · `Entitlement` 3 kind · `EntitlementState` 3상태 · `ENTITLEMENT_KEYS` 11개**를 코드에서 세어 확인했다(`plan.ts:39,72,90-93,109-112,126-138`)
- [x] **`absent` 모듈이 표에서 빠짐을 코드로 확인**했다(`PlanPage.tsx:119-120` `continue`)하고, **오늘 이 앱에서 그 상태가 발현되는 경로가 없음**을 `entitlementsForTier` 의 `filter(spec.minTier !== null)`(`plan.ts:299`) → `resolveEntitlement` undefined → fail-open granted(`:383`) 로 추적해 §7 #7 에 적었다
- [x] **플랜 변경 UI 가 없음을 코드로 확인**했다 — 근거 헤더(`PlanPage.tsx:1-9`) · 사용자 문구(`:179-190`) · 나가는 길은 `PLAN_PORTAL_URL`(`plan.ts:507`) 하나뿐 · `receivePlan` 의 화면 호출부 0건
- [x] **`PlanDevPanel` 이 `import.meta.env.DEV` 분기 안에서만 마운트됨을 코드로 확인**했다(`PlanPage.tsx:234`) — 운영 빌드에 없다(EL-017)
- [x] **조회 전용이라 §5 가 1건임을 확인**했다 — `TODO(backend): GET /api/tenant/entitlements`(`PlanPage.tsx:18`)가 유일한 연동 지점이고, 같은 계약을 가리키는 심이 세 곳 더 있음(§5 각주)을 함께 적었다
- [x] **엔타이틀먼트 축에 컴포넌트 테스트가 0건임을 grep 으로 전수 확인**했다 — `UpgradeScreen`·`RequireEntitlement`·`LOCKED_NAV_SUFFIX` 를 **렌더하는** 테스트 파일이 `apps/`·`packages/`·`e2e/` 전체에 **없다**(히트는 전부 정의·import·주석). 그리고 **`module-resources.test.ts` 는 실재하지 않는다** — `module-resources.ts:97` 이 그 파일명을 인용하지만 `shared/entitlements/` 의 테스트는 `plan.test.ts`·`route-entitlement.test.ts` 둘뿐이고, 문제의 단언('한 화면을 두 모듈이 주장하지 않는다')은 **`route-entitlement.test.ts:21-59`** 에 있다. §7 #2 에 기록했다
- [x] 보이지 않는 요소(알림 컨테이너 조건·행 구성 규칙·판정 규칙·플랜 조회 규칙·쿼터 주입 규칙·DEV 마운트 조건·크로스탭 동기화·저장값 방어·부재 규칙)에 번호를 줬다
- [x] §4 예외 7축 빈칸 0건. 모든 `N/A` 에 사유 — 특히 **로딩·실패 축의 `N/A` 가 「없어서」 임을 EL-025 로 명시**하고 §7 #3 에 이관했다
- [x] 엔드포인트·HTTP·에러코드·DB 스키마를 쓰지 않았다 (BE-079 영역)
- [x] **결정의 근거는 복제하지 않고 `docs/adr/0013-entitlement-layer.md` 를 가리켰다** — 이 문서는 그 결정이 이 화면에서 어떻게 보이는가만 기술한다

## 7. 미결 사항 (UI 기획 / 아키텍처 / 백엔드 명세 / 프론트 구현 이관)

| # | 내용 | 이관 대상 |
|---|---|---|
| 1 | 대응 SCR 문서 부재 (시스템 설정 SCR 미작성) | UI 기획 / 아키텍처 |
| 2 | ⚠⚠ **엔타이틀먼트 축에 컴포넌트 테스트가 0건이다.** 전수 grep(2026-07-22) 결과 `UpgradeScreen`·`RequireEntitlement`·`LOCKED_NAV_SUFFIX` 를 **렌더하는 테스트가 리포 전체에 한 건도 없다** — 히트는 전부 정의·import·주석이다. 즉 **잠금 화면이 실제로 뜨는가 · 사이드바에 「· 잠금」 이 붙는가 · absent 가 정말 `/dashboard` 로 리다이렉트되는가 · 이 화면이 absent 행을 빼는가**를 아무도 지키지 않는다. 순수 규칙(`plan.test.ts` 270행 · `route-entitlement.test.ts` 99행)은 촘촘한데 **화면 조립만 비었다.** 게다가 **`module-resources.ts:97` 이 인용하는 `module-resources.test.ts` 는 실재하지 않는다** — 그 주석이 약속하는 '중복을 막는 테스트' 는 실제로 `route-entitlement.test.ts:21-59` 에 있다. **파일명을 잘못 가리키는 주석은 다음 사람에게 없는 안전망을 있다고 말한다** | **프론트 구현 (최우선 · 테스트 신설) · 프론트 구현 (주석 정정)** |
| 3 | **이 화면에 로딩·조회 실패·재시도가 없다** — `usePlan()` 이 zustand 동기 조회이고 값의 출처가 localStorage 라 그 세 상태가 **존재하지 않는다.** `TODO(backend): GET /api/tenant/entitlements`(`PlanPage.tsx:18`)가 실현되는 순간 스켈레톤·인라인 실패 배너·'다시 시도' 가 전부 새로 필요하고, **그 조회의 실패는 fail-open 이어야 한다**(`plan.ts:19-28`) — 즉 실패 배너를 띄우면서도 기능은 열어 두는, 이 앱에 선례가 없는 조합이다. 지금 그 설계가 정해져 있지 않다 | **아키텍처 · UI 기획 · 백엔드 명세 (BE-079)** |
| 4 | ⚠ **'변경 적용 예정' 이 Invalid Date 를 화면에 찍는다** — `formatPlanDate(new Date(plan.effectiveAt))`(`PlanPage.tsx:175`)에 `Number.isNaN` 가드가 없어 파싱 불가 문자열이면 **`'NaN-NaN-NaN'`** 이 렌더된다. `normalizePlanState` 는 '문자열이고 비어 있지 않으면' 통과시키고(`plan.ts:601`), **형제 소비자 `planChangeNotice` 는 같은 값에 가드를 둔다**(`:487`). 그리고 그 가드를 지키는 테스트가 **`'깨진 날짜는 예고하지 않는다 — Invalid Date 를 화면에 찍지 않는다'`**(`plan.test.ts:266`)라는 이름으로 존재한다 — **테스트가 이름으로 금지한 것을 다른 자리가 하고 있다** | **프론트 구현** |
| 5 | **이미 지난 `effectiveAt` 도 '변경 적용 예정' 으로 표시된다** — 예고 배너(EL-002)는 과거 시각에 침묵하는데(`plan.ts:487`) `<dl>` 항목은 검사 없이 날짜를 찍는다. 배너가 사라진 뒤에도 이 줄만 남아 지나간 변경을 계속 예고한다 | 프론트 구현 |
| 6 | ⚠ **화면 안 잠금이 어디에도 배선되지 않았다.** `useCreateBlock`·`usePlanWriteBlock`·`useEntitlement`·`useQuota`(`RequireEntitlement.tsx:61-92`) 네 훅의 **소비처가 리포 전체에 0건**이다(전수 grep). 그 결과: ① **쿼터 소진(상품 200/200)이 등록을 실제로 막지 않는다** — 판정은 완성돼 있고(`quotaCreateBlock` — `plan.ts:465-473`) 회귀도 있는데(`plan.test.ts:124-166`) 그것을 읽는 화면이 없다 ② **미납·정지가 쓰기를 실제로 잠그지 않는다** — 이 화면의 배너(EL-001)가 '지금은 조회만 가능합니다' 라고 **말하는데 앱은 그렇게 동작하지 않는다.** 화면이 사실이 아닌 것을 말한다 | **UI 기획 쪽 변경 요청 (최우선) · 프론트 구현** |
| 7 | **`absent` 상태가 오늘 이 앱에서 발현되지 않는다** — 유일한 후보 `marketing.sms`(`minTier: null`)는 `entitlementsForTier` 가 키를 넣지 않아(`plan.ts:299`) `resolveEntitlement` 가 `undefined` → fail-open `granted` 가 된다. absent 가 되려면 사내 어드민이 그 키를 명시적으로 꺼서 `receivePlan` 으로 보내야 하는데 **그 통로를 부르는 코드가 앱에 없다**(호출부 0건 — 웹훅 자리). 즉 **EL-013(absent 행 제외)·EL-021(메뉴째 삭제)·EL-022(대시보드 리다이렉트) 세 경로가 전부 도달 불가**이며, DEV 패널로도 재현할 수 없다(티어 전환은 absent 를 만들지 않는다). **테스트도 화면을 렌더하지 않으므로**(#2) 이 갈래는 **어느 층에서도 실제로 실행된 적이 없다** | **프론트 구현 (DEV 패널에 overrides 주입 추가) · 명세 리뷰** |
| 8 | **기능 표에 빈 상태가 없다** — 행이 0개여도 `<thead>` 만 남는다(`PlanPage.tsx:215-228`). 오늘은 #7 때문에 발현되지 않지만, absent 가 실제로 오기 시작하면(사내 어드민이 모듈을 끄면) 머리만 있는 표가 그려질 수 있다 | UI 기획 쪽 변경 요청 |
| 9 | **`PLAN_PORTAL_URL` 이 하드코딩 상수다**(`plan.ts:507` `'https://spaceplanning.ai/pricing'`) — 스테이징·데모·온프레미스 배포에서 같은 주소를 가리킨다. 링크의 도달 가능 여부도 검증하지 않는다. 이 상수는 `UpgradeScreen`(`ErrorScreens.tsx:126`)과 이 화면(EL-009) 두 곳이 쓴다 | 아키텍처 (환경 설정) |
| 10 | **표의 locked 행이 잠금 사유를 보이지 않는다** — 배지가 `'<티어> 플랜부터'` 만 말하고(`PlanPage.tsx:127`), `entitlementStateOf` 가 함께 낸 `reason`(`'<모듈> 기능은 <티어> 플랜부터 사용할 수 있습니다.'` — `plan.ts:369-371`)은 버려진다. **같은 상태를 `UpgradeScreen` 은 문장으로 설명하는데 이 화면은 배지로만 말한다** — '무엇을 쓰고 있고 무엇이 잠겨 있는지 한 번에 확인하는 곳'(`:11-12`)이라는 목적에 비해 정보가 적다 | UI 기획 쪽 변경 요청 |
| 11 | **`LEVEL_LABEL` 에 없는 level 값이 원문 그대로 노출된다** — `LEVEL_LABEL[value.level] ?? value.level`(`PlanPage.tsx:109`). 지도는 3개(`none`·`basic`·`advanced` — `plan.ts:167-171`)뿐인데 저장값 정규화(`normalizeEntitlement` — `:540-543`)는 **어떤 문자열이든 통과시킨다.** 서버가 `'premium'` 을 보내면 화면에 '`premium` 수준' 이 찍힌다 — 화면이 'advanced 를 그대로 찍지 않게 한다'(`:166`)는 그 지도의 목적이 무너진다 | 프론트 구현 · 백엔드 명세 |
| 12 | **실패를 조용히 삼키는 자리가 셋이다** — ① localStorage 저장 실패(`entitlement-store.ts:34-36`) ② 읽기 실패(`:45-48`) ③ **쿼터 조회기에 방어가 없다**(`entitlementUsageOf` — `:75-77`): 주입된 함수가 던지면 렌더 중 예외가 되어 `ErrorBoundary` 로 떨어진다. ①②는 의도된 fail-open 이지만 **DEV 패널에서 플랜을 바꿨는데 저장이 안 된 것을 알 방법이 없고**, ③은 fail-open 원칙에 **어긋난다** — 사용량을 못 세는 것이 화면 전체를 죽이면 안 된다 | 프론트 구현 |
| 13 | **DEV 빌드에서는 조회 전용 역할도 플랜을 바꿀 수 있다**(EL-019·EL-020). 개발 편의를 위한 의도된 성질이고 운영 빌드에는 코드 자체가 없지만(EL-017), **개발·스테이징 환경을 실제 운영자에게 보여 주는 순간 그것이 「플랜 변경 UI」 로 보인다** — 패널이 '개발 빌드에만 있는 패널' 이라고 말하지만(EL-018) 그 문장을 믿을 근거는 화면에 없다 | UI 기획 쪽 확인 요청 |
| 14 | **화면 안내문이 카드 안에 있다**(`PlanPage.tsx:159`) — 형제 설정 화면은 카드 **위**에 둔다(`SettingsFormShell.tsx:144`). 이 화면만 `SettingsFormShell` 을 쓰지 않아 생긴 차이이며(폼이 아니라 정당하다), 그 결과 **시스템 설정 섹션 안에서 이 화면만 레이아웃 리듬이 다르다** | UI 기획 쪽 확인 요청 |
| 15 | **이 라우트의 e2e 커버리지가 0이다** — `e2e/` 의 스펙은 dashboard · login · quality-bar · users · support · ai · throwaway 뿐이다. #2 와 합치면 **엔타이틀먼트 축은 단위·컴포넌트·e2e 세 층 중 순수 단위 하나만** 덮여 있다 | 프론트 구현 · 명세 리뷰 |
| 16 | **BE-079 · NFR-079 가 없다.** `specs/README.md` 의 번호대 표·화면 색인은 같은 배치에서 갱신됐다(071–079 등재 · §4.0 '신설 9화면에 BE·NFR 이 없다'). NFR 부재가 특히 아픈 자리다 — 이 화면은 `quality-bar.md` 에 이번에 들어온 **EXC-21(거절 4계열 · P0)** 의 판정을 가장 먼저 받아야 할 화면이다 | 백엔드 명세 · 비기능 명세 |
