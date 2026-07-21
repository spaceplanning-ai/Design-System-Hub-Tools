---
id: FS-078
title: "결제 설정 (단일 문서 설정)"
screen: SCR-078               # ⚠ 시스템 설정 SCR 미작성 — §7 미결 사항 참조
route: /settings/payment
owner: 기능 명세
reviewer: 명세 리뷰
gate: G9
status: draft
confirmedAt: 2026-07-22
version: 1.0
date: 2026-07-22
---

# FS-078. 결제 설정 (단일 문서 설정)

## 1. 화면 개요

| 항목 | 내용 |
|---|---|
| 목적 | 상품과 프로그램을 **결제로 파는가, 문의로 받는가**를 문서 1건으로 정한다. 스위치 하나(`usePg`)가 그 갈림이고 나머지 칸은 전부 그 스위치에 딸린 값이다 — 켜면 PG사·상점 ID·연동 모드·결제수단을, 끄면 고객에게 보일 문의 전환 안내 문구를 정한다(`PaymentSettingsPage.tsx:3-8`) |
| 역할(주 사용자) | 관리자 (구현에 역할 분기 없음 — 권한은 `useRouteWritePermissions().canUpdate` 로 게이팅한다. `:185` · §4.1) |
| 진입 경로 | 좌측 GNB > 시스템 > 시스템 설정 > 결제 설정 (`nav-config.ts:291` `['결제 설정', '/settings/payment']`) |
| 포함 화면 | 단일 라우트 `/settings/payment` — **하위 라우트가 없다(잎)** (`App.tsx:469`) |
| 문서 필드 | `PaymentSettings { usePg, provider, merchantId, mode, methods, inquiryGuide }` **6필드**(`shared/commerce/payment-settings.ts:63-73`). 출하 기본값은 **OFF** 다: `DEFAULT_PAYMENT_SETTINGS`(`:179-186`)의 `usePg: false` · `merchantId: ''`. 근거가 그 위에 있다(`:176-178`): '이 앱은 아직 PG 계약이 없다. 켜져 있는 것으로 시작하면 **결제되지 않는 「구매하기」가 기본값**이 된다' |
| **범위 밖** | **결제 자격증명(API 키·시크릿)** — 상점 ID 는 식별자이지 비밀키가 아니다. 시크릿은 이 문서에 넣지 않고 `/settings/api-keys` 규약(저장 여부만 알고 평문은 돌려주지 않는다)을 따른다(`payment-settings.ts:192-193` · 화면 힌트 `PaymentSettingsPage.tsx:460`). **결제 실행·결제창 호출·거래 조회** — 이 앱은 결제를 처리하지 않는다. **상품 단위 가격 표시** — '이 상품만 가격문의' 는 **축 B**(`shared/commerce/price-display.ts`)의 일이고 상품 폼이 소유한다(`price-display.ts:3-11`). **잠기는 여섯 구획의 편집** — 이 화면은 잠금의 **원인**이고 그 구획들은 각자의 화면에 있다(§1.1). **PG 없이 파는 운영의 청구·입금** — 영업 관리의 청구·입금(FS-077)이 소유한다 |
| 구현 경로 | `apps/admin/src/pages/settings/payment/**`(`PaymentSettingsPage.tsx` 571행 · `validation.ts` 102행 · `types.ts` 54행 · `data-source.ts` 57행 · `components/CheckoutCtaPreview.tsx` 110행) · **값·규칙의 정본은 화면 밖** `apps/admin/src/shared/commerce/{payment-settings.ts,pg-lock.ts,price-display.ts,PgLockNotice.tsx}` · 공유 골격 `pages/settings/_shared/**` |
| 대응 SCR | SCR-078 (미작성 — §7 #1) |
| 공통 컴포넌트 | `settings/_shared/{SettingsFormShell,ConflictDialog,AuditNote,TextInputField,useSettingsQuery,useSaveSettings,useSubmitLock,createRevisionedStore,isSettingsConflict,divergedLabels,formatAuditAt}` · `shared/ui/{Alert,ConfirmDialog,FormField,SelectField,TextareaField,ToggleSwitch,useToast,useUnsavedChangesDialog,checkboxStyle,controlStyle,errorTextStyle,fieldLabelStyle,hintStyle,buttonStyle}` · `shared/permissions/RequirePermission(useRouteWritePermissions)` · `shared/form/zodResolver` · `shared/async(isAbort)` |

> **검증의 정본은 화면이 아니라 zod 스키마다**(`validation.ts:32-93` `paymentSettingsSchema`) — 형제 설정 화면의 규약을 그대로 따른다(`:3-4`). **그리고 이 화면의 검증은 전부 교차 필드다**(`:6-12`): 어떤 칸이 필수인지가 `usePg` 하나에 달려 있어, 칸별 필수 표시가 아니라 스키마의 `check` 가 판정한다. **상점 ID 의 형식은 검사하지 않는다** — PG 사마다 다르고 어느 형식도 문서로 보장받지 못했다(`:14-17`). 막는 것은 **비어 있음**과 **길이 폭주** 둘뿐이다.

### 1.1 이 화면의 사정거리 (저장이 무엇을 바꾸는가)

이 화면의 저장은 **다른 설정 문서와 달리 화면 밖을 즉시 바꾼다**(`data-source.ts:3-9`). 파생축은 하나 — `pgSellable(settings) = settings.usePg && settings.merchantId.trim() !== ''`(`payment-settings.ts:128-130`)이고 **fail-closed** 다: `usePg` 만 보지 않는 이유가 `:116-127` 에 있다 — 켜 두고 상점 ID 가 비면 결제창을 띄울 수 없고, 그 상태에서 '구매하기' 를 그리면 고객은 **눌러 놓고 아무 일도 일어나지 않는 버튼**을 만난다. 검증이 그런 저장을 막지만 규칙 자체도 닫는 쪽으로 수렴한다.

| 무엇이 바뀌는가 | 어디서 | 근거 |
|---|---|---|
| 상품·프로그램의 구매 CTA | 상품 카드·프로그램 상세의 버튼이 **구매하기/후원하기 ↔ 문의하기** 로 뒤집힌다 | `checkoutCta(settings, domain)`(`payment-settings.ts:143-167`) · 이 화면의 미리보기가 **같은 함수**를 부른다(EL-006) |
| 상품 금액 표시 | 결제창을 열 수 없으면 상품이 '금액 노출' 이라고 말해도 금액 자리에 문구가 들어간다(**전역이 축 B 를 이긴다**) | `resolvePriceDisplay`(`price-display.ts:88-99`) |
| 여섯 구획의 입력 잠금 | `PG_LOCK_SECTIONS = ['product-points','product-coupons','product-stock','product-shipping','coupon-admin','points-policy']`(`pg-lock.ts:26-33`). 각 사유 문자열은 `pg-lock.ts:52-64` 에 한 벌만 있고 잠긴 화면은 `PgLockNotice`(`shared/commerce/PgLockNotice.tsx`)로 **같은 모습**으로 말한다 | 소비처: `ProductFormPage.tsx:492-495` · `ProductPricingCards.tsx:234,344` · `ProductCouponCard.tsx:102` · `ProductOptionMatrix.tsx:103` · `ProductListPage.tsx:196` · `CouponListPage.tsx:126` · `PointsPolicyPage.tsx:103` |
| 사이드바의 조건부 메뉴 | 상품·프로그램의 '문의' 잎이 `'pg-off'` 조건으로 갈린다 | `nav-config.ts:202` |

> **잠금은 입력만 막고 저장된 값은 보존된다** — `pg-lock.ts:7-10` 이 이것을 '제1원칙' 으로 못박는다: 'PG 를 다시 켜면 적립률·쿠폰 설정·배송비가 **저장해 둔 그대로** 살아난다. 지우는 구현은 되돌릴 수 없다 — 운영자는 결제를 잠시 끄는 것과 정책을 폐기하는 것을 구분해서 하고 있는데, 코드가 그 둘을 같은 것으로 만든다.' 무엇이 잠기지 **않는가**도 규칙이다(`:12-16`): 옵션(색상·사이즈)과 상품 등록·수정 자체는 잠기지 않고 **재고 수량만** 잠긴다.
>
> **이 화면 자체는 잠기지 않는다.** `PG_LOCK_SECTIONS` 에 `/settings/payment` 가 없다 — 잠금의 원인이 자기 자신에게 걸리면 되돌릴 길이 사라진다. 이 화면이 읽기 전용으로 내려가는 유일한 조건은 **쓰기 권한 부족**이다(EL-016).
>
> **화면별 파급의 상세 근거는 [`docs/adr/0014-pg-switch-screen-impact.md`](../../../docs/adr/0014-pg-switch-screen-impact.md)(ADR-0014, accepted, 2026-07-22) 가 소유한다.** 이 문서는 그것을 복제하지 않고 링크만 건다 — 두 벌이 되면 구획이 하나 늘어난 날 한쪽에만 늘어난다.

### 1.2 이 화면의 설계 원칙 (요구사항 — 명세에 고정한다)

| 원칙 | 내용과 이유 (코드 근거) |
|---|---|
| **결과를 스위치 옆에 그린다** | 여기서 정한 값의 결과는 **이 화면 밖에서만** 눈에 띈다(상품 카드·프로그램 상세의 버튼). 그래서 스위치 바로 아래에 두 도메인의 버튼을 함께 그린다 — `CheckoutCtaPreview`(`components/CheckoutCtaPreview.tsx:1-8`). `../site` 가 사이트 이름 옆에 OG 카드를 그리는 것과 같은 판단이다(`PaymentSettingsPage.tsx:10-12`) |
| **미리보기가 라벨을 스스로 고르지 않는다** | '구매하기/후원하기/문의하기' 는 `shared/commerce` 의 `checkoutCta` 가 정하고 미리보기는 **같은 함수**를 부른다(`CheckoutCtaPreview.tsx:89-90`). 자기 문구를 따로 쓰면 '정작 고객 화면과 다른 것을 보여 주는 미리보기' 가 된다(`PaymentSettingsPage.tsx:14-15`) |
| **버튼처럼 보이지만 버튼이 아니다** | 미리보기의 CTA 는 DS 버튼의 **시각 토큰만** 빌린 `<span>` 이다(`CheckoutCtaPreview.tsx:98` `buttonStyle(...)`). 근거(`:10-12`): '누를 것이 없는 자리에 진짜 버튼을 두면 운영자는 눌러 보고 아무 일도 일어나지 않는 것을 확인하게 된다' |
| **쓰지 않는 구획은 잠그지 않고 자리를 없앤다** | `usePg` 가 꺼져 있으면 PG 설정 구획이 **렌더되지 않고**(`PaymentSettingsPage.tsx:416`), 켜져 있으면 문의 전환 안내 구획이 렌더되지 않는다(`:510`). 근거(`:413-415`): '잠가 두면 「지금 무엇을 정해야 하는가」 가 흐려진다 — 이 값들은 PG 를 켠 뒤에만 의미가 있고, **이미 저장된 값은 그대로 보관된다**.' **⚠ 이것은 형제 화면 `../site` 의 「잠그되 숨기지 않는다」와 정반대 선택이다**(§7 #12) |
| **판매 방식이 바뀌는 저장이면 그 사실을 앞세운다** | `saveConfirmMessage(next, wasUsingPg)`(`:169-179`) 3분기 — 끄는 중 / 켜는 중(테스트·운영 구분) / 그 밖. 근거(`:163-167`): '이 저장은 이 화면 밖(고객이 보는 버튼)을 즉시 바꾼다. 「저장할까요?」 만 묻고 넘어가면 운영자는 무엇이 일어나는지 모른 채 확인을 누른다' |
| **저장이 성립한 뒤에만 판매 방식을 바꾼다** | `paymentSettingsStore.save` 가 `revisioned.save` 를 먼저 `await` 하고 **그다음에** `writePaymentSettings(saved.value)` 를 부른다(`data-source.ts:41-46`). 근거(`:8-9`): '거절된 저장이 판매 방식을 바꾸면 화면이 말한 것과 앱이 하는 일이 갈라진다' |
| **동시 편집을 덮어쓰지 않는다** | 저장은 내가 읽은 `revision` 을 함께 보내고 어긋나면 409 로 거절돼 충돌 다이얼로그가 뜬다(`_shared/store.ts:143-146`). **입력은 그대로 살아 있다** — EL-024 |
| **권한이 없으면 저장 컨트롤이 없다** | `canUpdate` 가 false 면 저장 버튼·상태 문구를 **렌더하지 않는다**(`_shared/SettingsFormShell.tsx:168-186`) — 눌러 보고 403 을 받는 자리를 만들지 않는다 |
| **첫 로딩과 재조회를 구분한다** | `loading = isFetching && data === undefined`(`:230`) — 재조회 중에는 이전 값을 유지한다(STATE-01) |

## 2. 영역 구성

| 영역번호 | 이름 | 설명 |
|---|---|---|
| FS-078-SEC-01 | 화면 안내문 | 카드 위 muted 1줄(`SettingsFormShell.tsx:144`) |
| FS-078-SEC-02 | 설정 카드 | 제목 '결제 설정' + (저장 실패 배너 · 읽기 전용 안내 · PG 미사용 안내) + **조건부 구획 2~3개** + 푸터 |
| FS-078-SEC-02.1 | 구획 1 · 결제 연동 (항상) | PG 결제 사용 스위치 + 고객 화면 미리보기 |
| FS-078-SEC-02.2 | 구획 2 · PG 설정 (**`usePg` 일 때만**) | PG사 · 연동 모드 · 상점 ID · 결제수단 |
| FS-078-SEC-02.3 | 구획 3 · 문의 전환 안내 (**`!usePg` 일 때만**) | 안내 문구 textarea |
| FS-078-SEC-03 | 카드 푸터 | 감사 기록 + 저장 상태 문구 + 저장 버튼 |
| FS-078-SEC-04 | 조회 실패 배너 (비표시 기본) | 폼 전체를 대체 |
| FS-078-SEC-05 | 첫 로딩 스켈레톤 (비표시 기본) | 구획 자리를 대체 |
| FS-078-SEC-06 | 저장 확인 다이얼로그 (비표시 기본) | 판매 방식 전환이면 문구가 그 사실을 앞세운다 |
| FS-078-SEC-07 | 동시 편집 충돌 다이얼로그 (비표시 기본) | 3-액션(불러오기·덮어쓰기·닫기) |
| FS-078-SEC-08 | 미저장 이탈 가드 (비표시 기본) | 3경로 discard 확인 |

> **SEC-01·03·04·05·08 과 SEC-02 의 배너 3종은 `SettingsFormShell` 소유다**(`_shared/SettingsFormShell.tsx`). 이 화면이 직접 그리는 것은 **구획 3개의 내용물과 두 다이얼로그**뿐이다. 골격은 `../site`·`../oauth`·`../api-keys` 와 공유한다(`SettingsFormShell.tsx:3-16`).

## 3. 요소 명세

| 요소번호 | 영역 | 이름 | 유형 | 동작 | [서버] | 비고 |
|---|---|---|---|---|---|---|
| FS-078-EL-001 | FS-078-SEC-01 | 화면 안내문 | 텍스트 | `<p>` '상품과 프로그램을 결제로 판매할지, 문의로 받을지 정합니다. PG 결제를 끄면 구매·후원 버튼이 문의하기로 바뀝니다.'(`PaymentSettingsPage.tsx:61-62` → `SettingsFormShell.tsx:144`) | — | **in-content `<h1>` 이 없다** — 화면 제목은 AppHeader 가 nav 잎 라벨('결제 설정')로 그린다. IA-02 pass 근거. ⚠ **필수 표기(별표) 안내가 없다** — 필수 여부가 스위치에 따라 바뀌기 때문이다(§1) |
| FS-078-EL-002 | FS-078-SEC-02 | 카드 제목 | 텍스트 | `CardTitle` **'결제 설정'**(`:359` → `SettingsFormShell.tsx:148`) | — | `<h1>` 이 아니다 — 카드 제목 시맨틱. **nav 라벨과 카드 제목이 일치한다**(`../site` 는 갈려 있다 — FS-067 §7 #19) |
| FS-078-EL-003 | FS-078-SEC-02 | PG 미사용 안내 배너 | 배너 | `!values.usePg` 이면 카드 상단 **info** `Alert`(`:371-386` → 셸의 `warning` 슬롯 `:152`): '지금은 **PG 결제를 쓰지 않는 상태**입니다. 상품의 구매하기와 프로그램의 후원하기가 모두 **문의하기**로 보이고, 접수된 문의는 [상품 문의] · [프로그램 문의] 로 들어옵니다.' 두 링크는 `INQUIRY_PATH.product`(`/products/inquiries`) · `INQUIRY_PATH.program`(`/programs/inquiries`)(`payment-settings.ts:100-103`) | — | 비표시 기본. **저장된 값이 아니라 드래프트(`values.usePg`)를 따른다** — 스위치를 내리는 순간 뜬다. 톤이 `warning` 이 아니라 **`info`** 다 — 꺼짐은 고장이 아니라 설정의 결과다(`PgLockNotice.tsx:33` 과 같은 판단). **잠긴 화면으로 가는 링크가 아니라 문의가 쌓이는 곳으로 가는 링크다** |
| FS-078-EL-004 | FS-078-SEC-02.1 | 구획 골격 | 텍스트 | 로컬 `Section({ id, title, description, children })`(`:149-159`) — `<section aria-labelledby>` + `<h3>` 제목 + `<p style={hintStyle}>` 설명 + 본문. 구획 사이는 상단 실선(`:80-82`) | — | 비표시 규칙. 설명을 필수 prop 으로 받는 이유(`:144`): '제목만으로는 결과가 보이지 않는 값들이라 한 줄을 함께 둔다'. ⚠ **`<h2>` 없이 `<h1>`(AppHeader) → `<h3>`(구획) 로 건너뛴다**(§7 #14) |
| FS-078-EL-005 | FS-078-SEC-02.1 | **PG 결제 사용 스위치** | 입력 | DS `ToggleSwitch checked={values.usePg} label="PG 결제 사용" onLabel="사용" offLabel="미사용"`(`:395-404`). `onChange` → `setValue('usePg', next, { shouldDirty: true, shouldValidate: true })` | O | **이 화면의 축이다** — 이 한 값이 구획 2·3 의 존재, 미리보기, 확인 문구, 그리고 §1.1 의 네 파급 전부를 정한다. **`shouldValidate: true`** — 켜는 즉시 '상점 ID 와 결제수단이 필요하다'는 교차 규칙이, 끄는 즉시 '안내 문구가 필요하다'는 규칙이 걸려야 한다(`validation.ts:54-83`). 구획 설명(`:393`)이 결과를 한 문장으로 예고한다 |
| FS-078-EL-006 | FS-078-SEC-02.1 | 고객 화면 미리보기 | 표시 | 라벨 '고객 화면 미리보기'(`:408`) + `CheckoutCtaPreview settings={values}`(`:409`). **두 자리를 나란히** 그린다(`CheckoutCtaPreview.tsx:22-29`): '상품 상세 / 루미엔 경량 패딩 점퍼' · '프로그램 상세 / 도시숲 조성 프로젝트'. 각 자리에 `checkoutCta(settings, domain)` 의 `label` 을 `buttonStyle('primary'\|'secondary')` 를 두른 `<span>` 으로(`:98-100`), 문의 CTA 이고 안내 문구가 비어 있지 않으면 그 문구까지(`:102-104`) | — | 비표시 아님(항상 표시). **폼 값(`watch()`)을 그대로 받아 저장 전 입력에도 결과가 따라온다**(`:81`). 두 도메인을 함께 두는 이유(`:7-8`): 켜져 있을 때 서로 다른 말을 하고(구매하기·후원하기) 꺼지면 같은 말로 수렴한다 — 한쪽만 그리면 그 수렴이 보이지 않는다. 예시 이름은 **가상 픽스처**다(`:21`) — 실제 상품을 끌어오지 않는다. ⚠ 상품·프로그램 화면이 실제로 이 규칙을 소비하는지는 이 문서 범위 밖이다 |
| FS-078-EL-006.1 | FS-078-SEC-02.1 | CTA 파생 규칙 | 텍스트 | `checkoutCta`(`payment-settings.ts:143-167`): `pgSellable` 이 false 면 `kind: 'inquiry'` · 라벨 '문의하기' · `inquiryPath` 는 도메인별 창구, 사유는 **두 갈래**(`:148-150`) — 상점 ID 가 비었으면 'PG 상점 ID 가 비어 있어 결제창을 열 수 없습니다…', 아예 껐으면 'PG 결제를 쓰지 않도록 설정되어 있어…'. true 면 `kind: 'purchase'` · 라벨은 도메인별(구매하기/후원하기) · 사유는 **모드별**(`:161-164`) — 테스트면 '…테스트 모드로 결제창이 열립니다. 실제 결제는 일어나지 않습니다.' | — | 비표시 규칙. **어디에도 저장하지 않는 파생값이다**(`:133-138`): 'CTA 를 상품/프로그램마다 들고 있으면 설정 스위치를 내리는 순간 이미 등록된 수백 건이 전부 낡은 값이 된다.' ⚠ **`reason` 은 이 화면에서 소비되지 않는다** — 미리보기가 `kind`·`label` 만 쓴다(§7 #13) |
| FS-078-EL-006.2 | FS-078-SEC-02.1 | 판매 가능 판정 규칙 (축 A) | 텍스트 | `pgSellable(settings) = settings.usePg && settings.merchantId.trim() !== ''`(`payment-settings.ts:128-130`) — **fail-closed**(`:116-127`). 회귀 `pg-axes.test.ts:22-30` 이 `PG_ON`·`PG_HALF`(공백 상점 ID) 두 픽스처로 이 판정을 고정한다 | — | 비표시 규칙. **§1.1 의 네 파급이 전부 이 한 술어 위에 선다** — 각 화면이 `usePg` 를 다시 읽으면 상점 ID 가 빈 상태를 놓치는 화면이 생기고 그 화면만 '결제됨' 을 전제로 그린다(`:124-127`) |
| FS-078-EL-007 | FS-078-SEC-02.2 | PG사 select | 입력 | **`values.usePg` 일 때만 렌더된다.** `FormField htmlFor="payment-provider" label="PG사" required` + `SelectField {...register('provider')}`(`:423-431`). 선택지 4개 — `PROVIDER_OPTIONS`(`types.ts:28-31`)가 `PAYMENT_PROVIDERS`(`payment-settings.ts:22`)와 `PAYMENT_PROVIDER_LABEL`(`:42-47`)에서 파생: 토스페이먼츠·KG이니시스·나이스페이먼츠·카카오페이 | O | `z.enum(PAYMENT_PROVIDERS)`(`validation.ts:35`) — 목록 밖 값은 파싱 실패. **화면이 라벨을 손으로 나열하지 않는다**(`types.ts:2-5`): PG 사를 하나 늘린 날 목록에만 늘고 안내 문구에는 빠지는 것을 막는다. `SelectField` 라 `required` 가 `aria-required` 로 주입된다 |
| FS-078-EL-008 | FS-078-SEC-02.2 | 연동 모드 select | 입력 | `FormField htmlFor="payment-mode" label="연동 모드" required` + `SelectField`(`:433-450`). 선택지 2개(테스트·운영 — `MODE_OPTIONS` ← `PAYMENT_MODES`·`PAYMENT_MODE_LABEL`). **힌트가 값에 따라 갈린다**(`:437-441`): 테스트 → '테스트 모드에서는 결제창이 열려도 실제 결제가 일어나지 않습니다.' / 운영 → '운영 모드에서는 고객의 결제가 실제로 승인됩니다.' | O | `z.enum(PAYMENT_MODES)`(`:37`). **테스트 모드를 「연동됨」 과 뭉뚱그리지 않는 것이 이 축의 규율이다**(`payment-settings.ts:160`) — 확인 다이얼로그도 같은 구분을 한다(EL-021.1) |
| FS-078-EL-009 | FS-078-SEC-02.2 | 상점 ID 입력 | 입력 | `TextInputField id="payment-merchant-id" label="상점 ID" required`(`:453-464`). `maxLength={MERCHANT_ID_MAX}`(=60 — `validation.ts:27`) · 카운터 `N/60` · placeholder '예: tosspayments-mid-0001' · 힌트 'PG사 관리자에서 발급한 상점 아이디(MID)입니다. **결제 API 키는 여기가 아니라 API 연동 설정에서 관리합니다.**' | O | 두 위반 문구(`validation.ts:50,62`): 60자 초과 → '상점 ID 는 60자를 넘을 수 없습니다.' / 켠 채 비면 → 'PG 결제를 켰다면 상점 ID 를 입력하세요. PG 사에서 발급한 값입니다.' **길이는 켜짐과 무관하게 본다**(`:44-52`) — 꺼진 채로도 저장되는 값이라 폭주를 두지 않는다. **형식을 검사하지 않는다**(§1). `aria-invalid` ↔ `aria-describedby` 짝은 `TextInputField`(`_shared/fields.tsx:16-24,72-74`)가 세운다 — 호출부가 잊을 자리가 없다 |
| FS-078-EL-010 | FS-078-SEC-02.2 | 결제수단 체크박스 묶음 | 입력 | `<ul role="group" aria-label="결제수단 (필수)">` 안에 `<label>` + `<input type="checkbox">` 5개(`:466-505`). 선택지 — `METHOD_OPTIONS`(`types.ts:40-43`) ← `PAYMENT_METHODS`(`payment-settings.ts:27`): 신용·체크카드 · 계좌이체 · 가상계좌 · 휴대폰 결제 · 간편결제. 라벨 위 `<span style={fieldLabelStyle}>결제수단<span aria-hidden> *</span></span>` | O | **묶음 이름이 필수를 싣는다** — 개별 체크박스가 아니라 '고르는 행위' 가 필수다(`:472` 주석 · A11Y-11). 별표는 `aria-hidden` 이고 필수는 `aria-label` 의 '(필수)' 가 전한다 — 시각과 낭독이 각자 한 번씩. 오류가 있으면 `aria-describedby={methodsErrorId}` 를 붙인다(`:477`) |
| FS-078-EL-010.1 | FS-078-SEC-02.2 | 결제수단 토글 규칙 | 텍스트 | `toggleMethod(method, checked)`(`:341-352`): 현재 값을 읽어 **`METHOD_OPTIONS` 순서로 다시 조립**한 뒤 `setValue('methods', next, { shouldDirty: true, shouldValidate: true })` | O | 비표시 규칙. 근거(`:344`): '켰다 껐다 한 순서가 저장 값에 남지 않게 한다' — 순서를 카탈로그 순서로 되맞춘다. 이 정규화가 없으면 **충돌 다이얼로그의 배열 비교(EL-024.2)가 순서 차이로 거짓 양성을 낸다** |
| FS-078-EL-010.2 | FS-078-SEC-02.2 | 결제수단 오류·힌트 슬롯 | 텍스트 | 오류가 없으면 힌트 '고객 결제창에 노출할 수단입니다. PG 계약에 있는 것만 켭니다.', 있으면 `<p id={methodsErrorId} role="alert" style={errorTextStyle}>` 로 **자리를 바꿔** 표시(`:496-504`). 문구 '결제수단을 하나 이상 선택하세요.'(`validation.ts:72`) | — | 비표시 분기. **힌트와 오류가 같은 자리를 쓴다** — 둘이 겹쳐 쌓이지 않는다. `role="alert"` 이라 검증 실패가 즉시 낭독된다 |
| FS-078-EL-011 | FS-078-SEC-02.3 | 문의 전환 안내 문구 입력 | 입력 | **`!values.usePg` 일 때만 렌더된다.** DS `TextareaField label="안내 문구" required rows={4}`(`:516-529`). `maxLength={INQUIRY_GUIDE_MAX}`(=200 — `validation.ts:30`) · 힌트 '상품 카드와 프로그램 상세의 문의하기 버튼 아래에 그대로 보입니다.' · placeholder 가 기본 문구를 그대로 보인다. `onChange` → `setValue(..., { shouldDirty: true, shouldValidate: true })` | O | 두 위반 문구(`validation.ts:81,90`): 비면 'PG 결제를 끄면 고객에게 보일 안내 문구가 필요합니다.' / 200자 초과면 '안내 문구는 200자를 넘을 수 없습니다.'. **길이는 켜짐과 무관하게 본다.** 근거(`:76`): '이 문구가 비면 고객은 왜 살 수 없는지 모른 채 「문의하기」 만 본다'. **이 값이 미리보기에 실시간으로 나타난다**(EL-006) |
| FS-078-EL-012 | FS-078-SEC-02.2/3 | 조건부 구획 렌더 규칙 | 텍스트 | 구획 2 는 `values.usePg &&`(`:416`), 구획 3 은 `!values.usePg &&`(`:510`) — **둘은 배타이고 언제나 정확히 하나만 있다.** 사라진 구획의 값은 폼에 그대로 실려 저장으로 나간다(`onValid` 가 `form` 전체를 쥔다 — `:286-293`) | O | 비표시 규칙. 근거 `:413-415`(§1.2). **결과: PG 를 끄고 저장해도 `merchantId`·`provider`·`methods` 는 보존되고, 다시 켜면 그대로 돌아온다** — `pg-lock.ts:7-10` 의 값 보존 원칙과 같은 방향이다. ⚠ 다만 화면은 그 사실을 **말하지 않는다**(§7 #12) |
| FS-078-EL-013 | FS-078-SEC-02 | 필드 일괄 비활성 규칙 | 텍스트 | `disabled = saving \|\| loading \|\| !canUpdate`(`:232`)를 **컨트롤 전부**에 넘긴다: 스위치 1 · select 2 · 텍스트 1 · 체크박스 5 · textarea 1 | — | 비표시 규칙. 읽기 전용 역할에게는 값이 **보이되 편집되지 않는다** |
| FS-078-EL-014 | FS-078-SEC-03 | 감사 기록 | 텍스트 | `AuditNote` — '마지막 변경: 박관리 · 3시간전'(`data-source.ts:30-31` 시드). 본문은 상대 시각(`formatRelativeOrDate`), `title` 속성은 절대 시각(`formatDateTime`)(`AuditNote.tsx:30-35`). `audit !== null && !loading` 일 때만(`SettingsFormShell.tsx:165`) | O | 상대만 쓰면 감사 정확도가 없고 절대만 쓰면 '최근인가' 를 즉시 알 수 없다 — 둘 다 준다(`AuditNote.tsx:24-29`) |
| FS-078-EL-015 | FS-078-SEC-03 | 저장 상태 문구 | 텍스트 | `canUpdate` 일 때만. 3분기: 저장 중 '저장하는 중입니다…' / dirty '저장하지 않은 변경 사항이 있습니다.' / 그 외 '변경 사항이 없습니다.'(`SettingsFormShell.tsx:170-176`) | — | 비활성 버튼이 '왜' 비활성인지 문구가 말한다 |
| FS-078-EL-016 | FS-078-SEC-03 | 저장 버튼 | 버튼 | `type="submit"` · `primary` · `size="md"`. 라벨 '저장 중…'/'저장'. **비활성 조건** `!dirty \|\| saving \|\| loading`(`SettingsFormShell.tsx:177-184`) | O | **`canUpdate` 가 false 면 이 버튼과 EL-015 가 아예 렌더되지 않는다**(EXC-03 — `:168`) |
| FS-078-EL-017 | FS-078-SEC-02 | 읽기 전용 안내 | 배너 | `!canUpdate` 면 카드 상단 info `Alert`: '조회 권한만 있습니다. 결제 설정을 바꾸려면 시스템 설정 수정 권한이 필요합니다.'(`READ_ONLY_NOTICE` — `:67-68` → `SettingsFormShell.tsx:151`) | — | 비표시 기본. 버튼을 감추기만 하지 않고 **이유**를 말한다 |
| FS-078-EL-018 | FS-078-SEC-04 | 조회 실패 배너 | 배너 | 조회 실패 시 **폼 대신** danger `Alert` '설정을 불러오지 못했습니다.' + '다시 시도'(`refetch`)(`SettingsFormShell.tsx:127-140` ← `:362-363`) | O | 비표시 기본. 토스트로 알리지 않는다(STATE-02). 이때 안내문·카드·푸터가 전부 사라진다. **문구가 도메인 없는 '설정' 이다** — 어느 화면에서 실패했는지 말하지 않는다(§7 #8) |
| FS-078-EL-019 | FS-078-SEC-05 | 첫 로딩 스켈레톤 | 스켈레톤 | `loading` 이면 구획 자리에 DS `Skeleton` **4행 고정** + `aria-busy="true"`(`SettingsFormShell.tsx:154-159`) | — | 비표시. `isFetching && data === undefined` 기준이라 재조회에서는 뜨지 않는다(STATE-01 pass). 행 수는 하드코딩 `[0,1,2,3]`(`:156`) — 실제 컨트롤 수(꺼짐 1+1 / 켜짐 4+미리보기)와 무관하고 **구획이 조건부라 shape 가 두 벌인데 스켈레톤은 하나다**(§7 #7) |
| FS-078-EL-020 | FS-078-SEC-02 | 저장 실패 배너 | 배너 | 카드 상단 danger `Alert` '결제 설정을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'(`:277` → `SettingsFormShell.tsx:150`) | O | 비표시. 표시 조건 `saveError !== null && pending === null && conflict === null`(`:364`) — **다이얼로그가 떠 있는 동안에는 다이얼로그 안에만 보인다.** ✅ **`conflict === null` 을 검사한다** — 형제 화면 `../site` 가 빠뜨린 검사다(FS-067 §7 #5). ⚠ 문구 1종이라 403/422/500 을 구분하지 않는다(§7 #6) |
| FS-078-EL-021 | FS-078-SEC-06 | 저장 확인 다이얼로그 | 모달 | 제출이 검증을 통과하면 **저장하지 않고** 이 다이얼로그를 세운다(`onValid` → `setPending(...)` — `:286-293`). `ConfirmDialog intent="update"` 제목 **'결제 설정 저장'**(`:534-544`) | — | 비표시. `busy={saving}` · `error={saveError}` — **실패해도 닫지 않는다**(재클릭이 곧 재시도). `onValid` 가 `merchantId`·`inquiryGuide` 의 **앞뒤 공백을 다듬은 값**을 쥔다(`:290-291`) — 검증은 `trim()` 후 판정하는데 저장은 원문을 보내는 어긋남을 여기서 막는다 |
| FS-078-EL-021.1 | FS-078-SEC-06 | 확인 문구 분기 규칙 | 텍스트 | `saveConfirmMessage(pending, savedUsingPg)`(`:169-179`) 3분기: **끄는 중** → 'PG 결제를 끕니다. 저장하는 즉시 상품의 구매하기와 프로그램의 후원하기가 문의하기로 바뀌고, 접수된 문의는 상품 문의·프로그램 문의로 들어옵니다. 저장할까요?' · **켜는 중** → 테스트면 '…지금은 테스트 모드라 결제창은 열리지만 실제 결제는 일어나지 않습니다…', 운영이면 '…저장하는 즉시 고객이 상품·프로그램을 실제로 결제할 수 있습니다…' · **그 밖** → '결제 설정을 저장하면 상품·프로그램 화면에 즉시 반영됩니다. 저장할까요?' | — | 비표시 규칙. 기준은 `savedUsingPg = data?.value.usePg ?? false`(`:227`) — **서버가 아는 상태**이지 폼 초기값이 아니다. **켜는 중 분기가 모드까지 갈라 4문구를 만든다** — 테스트/운영을 뭉뚱그리면 운영 전환을 잊는다 |
| FS-078-EL-021.2 | FS-078-SEC-06 | 확인 취소 | 버튼 | `cancelSave`(`:301-308`) → `controllerRef.current?.abort()` · `controllerRef = null` · `save.reset()` · `lock.release()` · `saveError`·`pending` 을 비운다 | — | 비표시. **진행 중이던 저장도 함께 취소한다** — busy 중에도 취소는 살아 있다 |
| FS-078-EL-022 | FS-078-SEC-02 | 저장 실행 규칙 | 텍스트 | `runSave(next, force)`(`:236-283`): ① `data?.revision` 이 없으면 아무것도 하지 않는다(`:238-239`) ② `lock.acquire()` 가 false 면 중단(`:242` · EXC-08) ③ `saveError` 를 비우고 새 `AbortController` 로 `save.mutate({ value, expectedRevision, force, signal })`(`:244-250`) | O | 비표시 규칙 |
| FS-078-EL-022.1 | FS-078-SEC-02 | 동기 제출 잠금 | 텍스트 | `useSubmitLock()`(`_shared/queries.ts:58-75`) — `useRef` 잠금이라 **렌더를 기다리지 않는다.** `disabled={saving}` 만으로는 클릭과 리렌더 사이 틈으로 두 번째 클릭이 통과한다(`queries.ts:51-56`) | — | 비표시 규칙. **멱등키는 없다** — 응답 유실 후 재시도는 새 요청이 되지만 `expectedRevision` 덕에 **중복 적용이 아니라 409** 가 된다(§7 #5) |
| FS-078-EL-022.2 | FS-078-SEC-02 | 저장 성공 처리 | 텍스트 | `lock.release()` → `signal.aborted` 면 중단 → `reset(toPaymentFormValues(next))`(새 기준선 = dirty 해제 = 이탈 가드 내려감) → `pending`·`conflict` 비움 → **토스트가 값에 따라 갈린다**(`:259-263`): 켜짐 '결제 설정을 저장했습니다. 상품·프로그램에서 결제로 판매합니다.' / 꺼짐 '결제 설정을 저장했습니다. 상품·프로그램의 버튼이 문의하기로 바뀌었습니다.' | O | 비표시. `useSaveSettings` 의 `onSuccess` 가 **저장 응답을 캐시에 직접 심는다**(`_shared/queries.ts:45`) — invalidate 만 하면 재조회 전 낡은 revision 으로 두 번째 저장이 409 를 맞는다(`:43-44`) |
| FS-078-EL-022.3 | FS-078-SEC-02 | 판매 방식 반영 규칙 (부수효과) | 텍스트 | `paymentSettingsStore.save` 가 `await revisioned.save(...)` **뒤에** `writePaymentSettings(saved.value)` 를 부른다(`data-source.ts:41-46`) → 모듈 지역 `current`(`payment-settings.ts:188`)가 갱신되고, 그 값을 상품·프로그램·잠금 판정이 **렌더 시점에 동기로** 읽는다(`readPaymentSettings` — `:195-198`) | O | 비표시 규칙. **이 한 줄이 없으면 설정 화면에서는 저장됐는데 상품 카드의 버튼은 그대로인, 가장 설명하기 어려운 어긋남이 생긴다**(`data-source.ts:3-6`). 실패·409 에서는 부르지 않는다. ⚠ **저장은 localStorage 에 남지 않는다** — 새로고침하면 시드로 되돌아간다(§7 #10) |
| FS-078-EL-023 | FS-078-SEC-02 | 언마운트 abort · abort 는 실패가 아니다 | 텍스트 | `useEffect(() => () => controllerRef.current?.abort(), [])`(`:216`). `onError` 에서 `isAbort(cause) \|\| controller.signal.aborted` 면 즉시 return(`:268`), `onSuccess` 도 `aborted` 면 아무것도 하지 않는다(`:254`) | — | 비표시 규칙(EXC-09). 공유 predicate `isAbort`(`shared/async`)를 쓴다 — 로컬 판정을 재발명하지 않는다 |
| FS-078-EL-024 | FS-078-SEC-07 | 충돌 다이얼로그 | 모달 | 저장이 `SettingsConflictError` 로 실패하면(`isSettingsConflict(cause)` — `:271`) `pending` 을 비우고 **최신 문서를 쥔 채** `ConflictDialog subject="결제 설정"` 을 세운다(`:271-275` · `:546-558`). 제목 '결제 설정이 이미 변경되었습니다'(`ConflictDialog.tsx:93`) | O | 비표시. **입력은 그대로 살아 있다** — 사용자가 고르기 전에는 아무것도 사라지지 않는다 |
| FS-078-EL-024.1 | FS-078-SEC-07 | 충돌 본문 | 텍스트 | '내가 이 화면을 연 뒤에 다른 관리자가 결제 설정을 저장했습니다. 그대로 저장하면 그 변경이 사라집니다.' + '마지막 저장: `<updatedBy>` · `<formatAuditAt(updatedAt)>`' + 하단 안내 1문단(`ConflictDialog.tsx:108-130`). `useId` 로 만든 id 가 `Modal` 의 `aria-describedby` 로 연결된다(`:89,94`) | O | 비표시. A11Y-02 pass 근거 |
| FS-078-EL-024.2 | FS-078-SEC-07 | 달라진 항목 목록 | 텍스트 | `divergedLabels<PaymentSettings>(getValues(), conflict.value, PAYMENT_FIELD_LABELS)`(`:333-337`)로 값이 갈린 필드의 **라벨**만 `<ul>` 로 나열한다. 빈 배열이면 목록을 그리지 않는다(`ConflictDialog.tsx:116`) | — | 비표시. 라벨 정본은 `data-source.ts:50-57`(필드 키와 1:1, 6건). ✅ **이 문서는 완전한 평면이라 비교기가 감당한다** — `usePg`(불리언)·`provider`·`merchantId`·`mode`·`inquiryGuide`(문자열)·`methods`(**문자열 배열** — `diff.ts:14-19` 가 내용 비교한다). 형제 화면 `../site` 는 객체 필드 3개 때문에 거짓 양성을 낸다(FS-067 §7 #14) — **여기서는 그 결함이 발현되지 않는다.** 배열 순서 정규화(EL-010.1)가 그것을 뒷받침한다 |
| FS-078-EL-024.3 | FS-078-SEC-07 | '최신 내용 불러오기' | 버튼 | `secondary`. `reset(toPaymentFormValues(latest.value))` → `conflict` 비움 → `refetch()` → 토스트 '최신 결제 설정을 불러왔습니다.'(`:312-319`) | O | **내 입력을 버리는 선택** — 라벨이 그렇게 말한다 |
| FS-078-EL-024.4 | FS-078-SEC-07 | '내 변경으로 덮어쓰기' | 버튼 | **`danger`**. `runSave(getValues(), true)`(`:321-323`) — `force: true` 로 토큰 검사를 건너뛴다(`_shared/store.ts:144`) | O | **상대의 변경을 버리는 선택.** `busy` 중 두 액션 버튼이 잠긴다(`ConflictDialog.tsx:98,101`). ⚠ **`getValues()` 를 그대로 보낸다** — `onValid` 의 trim 을 거치지 않는다(§7 #16) |
| FS-078-EL-024.5 | FS-078-SEC-07 | 충돌 다이얼로그 닫기 | 버튼 | `onClose`(딤·Esc·×) → abort · `controllerRef = null` · `save.reset()` · `lock.release()` · `conflict` 비움(`:325-331`) | — | 비표시. **아무것도 하지 않고 그대로 두는 세 번째 갈래** — 그래서 `ConfirmDialog`(이지선다)가 아니다 |
| FS-078-EL-025 | FS-078-SEC-08 | 미저장 이탈 가드 | 모달 | `useUnsavedChangesDialog(dirty && !saving, { message })`(`SettingsFormShell.tsx:124`). 문구 '결제 설정에 저장하지 않은 변경 사항이 있습니다. 이 화면을 벗어나면 입력한 내용이 사라집니다.'(`:64-65`) | — | 비표시. 3경로: beforeunload · 앱 내 링크 capture · popstate sentinel. **저장 중에는 가드하지 않는다**(곧 not-dirty 가 된다). ⚠ **EL-003 의 두 문의 링크가 앱 내 링크라 이 가드에 잡힌다** — 스위치를 내려 dirty 인 채 '상품 문의' 를 누르면 확인이 뜬다(의도된 동작) |
| FS-078-EL-026 | FS-078-SEC-02 | 폼 초기값 · 리셋 규칙 | 텍스트 | `DEFAULT_FORM_VALUES`(`:564-571` — 전부 빈/꺼짐, `methods: []`)로 시작해 데이터 도착 시 `reset(toPaymentFormValues(data.value))`(`:219-222`). 이 값이 **dirty 판정의 기준선**이다. `toPaymentFormValues`(`types.ts:52-54`)는 **배열만 복사한다** — 근거(`:45-51`): 얕은 전개로 넘기면 RHF 가 저장 문서의 배열을 직접 만지게 되어 되돌리기(reset)가 이미 바뀐 값을 기준선으로 삼는다 | O | 비표시. `useEffect([data, reset])` — **편집 중 재조회가 오면 입력이 덮인다**(§7 #4) |
| FS-078-EL-027 | FS-078-SEC-02 | 제출 경로 | 텍스트 | `<form onSubmit={onSubmit} noValidate>`(`SettingsFormShell.tsx:146` ← `:387` `void handleSubmit(onValid)(event)`) — 브라우저 기본 검증을 끄고 zod 가 판정한다 | — | 비표시. **`onInvalid` 핸들러가 없다** — 첫 오류 필드로 포커스가 가지 않는다(§7 #3). ✅ **다만 오류 필드가 화면 밖에 있을 수는 없다** — 검증 규칙이 `usePg` 로 갈리고 구획도 같은 값으로 갈려, 오류가 꽂히는 필드는 언제나 렌더된 구획 안에 있다(EL-012) |
| FS-078-EL-028 | FS-078-SEC-02 | dirty 판정 | 텍스트 | RHF `formState.isDirty`(`:203` → `:366`) — 기준선 대비 비교. 스위치·체크박스·textarea 는 전부 `shouldDirty: true` 로 dirty 를 만든다 | — | 비표시 |

## 4. 예외 명세

| 요소번호 | 빈 상태 | 로딩 | 실패 | 유효성 | 권한없음 | 경합 | 대량 |
|---|---|---|---|---|---|---|---|
| FS-078-EL-001 | N/A — 정적 문구 | 로딩 중에도 표시(카드 밖) | 조회 실패 시 EL-018 이 화면을 대체해 함께 사라진다 | N/A — 입력 없음 | 권한과 무관하게 표시 | N/A — 정적 | 고정 문구 |
| FS-078-EL-002 | N/A — 정적 문구 | 로딩 중에도 표시 | 조회 실패 시 사라진다 | N/A | 권한과 무관 | N/A | 고정 문구 |
| FS-078-EL-003 | N/A — `!usePg` 여야 성립 | **로딩 중에도 뜬다** — `warning` 슬롯이 스켈레톤 분기 밖이다(`SettingsFormShell.tsx:152`). 이때 값은 `DEFAULT_FORM_VALUES.usePg === false` 라 **도착 전에는 언제나 뜬다**(§7 #9) | 조회 실패 시 미표시(폼째 사라진다) | N/A — 표시 전용 | `!canUpdate` 면 값을 바꿀 수 없어 저장된 값이 꺼짐일 때만 뜬다 | **드래프트 기준**이라 재조회와 무관 | 1건 |
| FS-078-EL-004 | N/A — 골격 | 로딩 중에는 children 대신 스켈레톤이라 구획이 그려지지 않는다 | 조회 실패 시 폼째 사라진다 | N/A — 표시 전용 | 권한과 무관 | N/A — 골격 | 구획 최대 2개 |
| FS-078-EL-005 | N/A — 불리언(초기값 `false`, 출하 기본도 `false`) | `disabled`(EL-013) + 스켈레톤이 자리를 대체 | 저장 실패는 EL-020 | `z.boolean()` — 위반 값이 없다. **교차 규칙이 다른 필드에 오류를 꽂는다**(EL-009·EL-010·EL-011) | 비활성 | 재조회가 오면 값이 덮인다(EL-026 · §7 #4). 충돌 시 'PG 결제 사용' 으로 짚힌다 | N/A — 불리언 |
| FS-078-EL-006 | 도착 전(`methods: []`·`merchantId: ''`)에는 두 자리 모두 '문의하기' 로 그려진다 | 스켈레톤이 자리를 대체해 그려지지 않는다 | N/A — 표시 전용 | N/A — 표시 전용 | 권한과 무관하게 표시 — **읽기 전용 역할도 결과를 본다** | 드래프트 값을 그린다 — 재조회로 값이 덮이면 미리보기도 함께 바뀐다 | 자리 2개 고정 |
| FS-078-EL-006.1 | N/A — 순수 규칙 | N/A — 동기 | N/A — 서버 호출 없음 | **입력을 검증하지 않는다** — 어떤 설정이 와도 CTA 를 낸다(fail-closed 로 수렴) | N/A | N/A — 순수 | 도메인 2종 |
| FS-078-EL-006.2 | `merchantId` 가 공백만이어도 false(`trim()`) | N/A — 동기 | N/A | **이것이 fail-closed 판정.** 회귀 `pg-axes.test.ts` | N/A | N/A — 순수 | 이 술어가 §1.1 의 네 파급 전부의 근원 |
| FS-078-EL-007 | 초기값 `'toss'` | `disabled` + 스켈레톤 | 저장 실패는 EL-020 | `z.enum` — 목록 밖 값은 파싱 실패. 화면에 그 선택지가 없어 실현되지 않는다 | 비활성 | 충돌 시 'PG사' 로 짚힌다 | 선택지 4개 고정 |
| FS-078-EL-008 | 초기값 `'test'`(출하 기본도 `test`) | `disabled` | 저장 실패는 EL-020 | `z.enum` | 비활성 | 충돌 시 '연동 모드' 로 짚힌다 | 선택지 2개 |
| FS-078-EL-009 | 초기값 `''` — **켜 두고 비면 검증이 막는다** | `disabled` | 저장 실패는 EL-020. **입력 보존** | 켠 채 trim 이 비면 missing · **켜짐과 무관하게** 60자 초과면 tooLong. `maxLength=60` 이 입력을 먼저 자른다 + 카운터가 미리 보여 준다 | 비활성 | 충돌 시 '상점 ID' 로 짚힌다 | 60자 상한 + 카운터 |
| FS-078-EL-010 | 초기값 `[]` — **켜져 있으면 검증이 막는다**. 출하 기본은 `['card','transfer']`(`payment-settings.ts:184`) | `disabled` | 저장 실패는 EL-020 | 켠 채 0개면 '결제수단을 하나 이상 선택하세요.'. **꺼져 있으면 판정하지 않는다** | 비활성 | 충돌 시 '결제수단' 으로 짚힌다 — 배열 내용 비교라 **거짓 양성이 없다**(EL-024.2) | 5개 고정 |
| FS-078-EL-010.1 | 빈 배열에서 시작해도 카탈로그 순서로 조립된다 | N/A — 동기 | N/A | `shouldValidate: true` 라 끄는 즉시 '하나 이상' 규칙이 걸린다 | N/A | **순서 정규화가 충돌 비교의 거짓 양성을 막는다** | 5회 필터 |
| FS-078-EL-010.2 | 오류가 없으면 힌트가 자리를 차지한다 | 스켈레톤에 덮인다 | N/A — 표시 전용 | **이것이 오류 표시 자리** — `role="alert"` | 권한과 무관 | N/A | 문구 1개 |
| FS-078-EL-011 | 초기값 `''` — **꺼져 있으면 검증이 막는다**. 출하 기본은 `DEFAULT_INQUIRY_GUIDE`(`payment-settings.ts:172-173`) | `disabled` | 저장 실패는 EL-020 | 끈 채 trim 이 비면 missing · **켜짐과 무관하게** 200자 초과면 tooLong | 비활성 | 충돌 시 '문의 전환 안내 문구' 로 짚힌다 | 200자 상한 |
| FS-078-EL-012 | 언제나 정확히 한 구획이 있다 | 로딩 중에는 어느 구획도 없다(스켈레톤) | 조회 실패 시 폼째 사라진다 | N/A — 규칙 | 구획은 권한과 무관하게 렌더된다(비활성만) | 재조회로 `usePg` 가 바뀌면 **구획이 통째로 갈아 끼워진다** — 편집 중이면 자리가 사라진다(§7 #4 와 결합) | 사라진 구획의 값도 저장으로 나간다 |
| FS-078-EL-013 | N/A — 규칙 | `loading` 이 이 규칙의 입력 | `saving` 이 이 규칙의 입력 | N/A | `!canUpdate` 가 입력 | N/A — 파생 규칙 | 컨트롤 10개 일괄 |
| FS-078-EL-014 | `audit === null`(도착 전)이면 렌더되지 않는다 | `loading` 이면 렌더되지 않는다 | 조회 실패 시 폼째 사라진다 | N/A | 권한과 무관 — **읽기 전용 역할도 누가 바꿨는지 본다** | 저장 성공 시 캐시가 갱신돼 새 감사 정보로 바뀐다 | 1건 |
| FS-078-EL-015 | N/A — 항상 3분기 중 하나 | '저장하는 중입니다…' | N/A — 실패는 EL-020 | N/A | **`!canUpdate` 면 렌더되지 않는다** | 재조회로 기준선이 바뀌면 dirty 판정이 바뀐다 | 고정 문구 |
| FS-078-EL-016 | N/A — 항상 표시(권한 있으면) | 요청 중 '저장 중…' + 비활성 | 실패 시 EL-020 배너, 버튼 재활성, 이동 없음, **입력 보존** | 미변경·로딩 중이면 비활성. 검증 실패는 제출을 막고 필드에 오류를 꽂는다 | **`!canUpdate` 면 렌더되지 않는다**(EXC-03) | 저장 성공이 새 revision 을 캐시에 심어 다음 저장이 곧바로 최신을 쓴다 | 단건 저장(6필드) |
| FS-078-EL-017 | N/A — 권한이 없어야 성립 | 로딩 중에도 표시(카드 상단) | 조회 실패 시 폼째 사라진다 | N/A | **이것이 권한없음 표현** | 권한 스토어가 바뀌면 재렌더된다 | 1건 |
| FS-078-EL-018 | N/A — 실패 상태 | 재시도 시 배너가 사라지고 스켈레톤으로 | **이것이 조회 실패 표현.** 문구 1종 + '다시 시도'. 401/403/404/500 을 구분하지 않는다(§7 #6) | N/A — 입력 없음 | 라우트 read 권한 부족은 여기 오지 않는다 — `RequirePermission` 이 `<Outlet>` 밖에서 403 화면을 그린다(§4.1) | 재시도는 같은 조회를 재발행 | N/A — 표시 전용 |
| FS-078-EL-019 | N/A — 도착 전 상태 | **이것이 로딩 표현.** 4행 고정 + `aria-busy` | 조회 실패 시 EL-018 로 바뀐다 | N/A | 권한과 무관 | **재조회에서는 뜨지 않는다** — 이전 값 유지 | **구획이 조건부라 실제 shape 가 두 벌인데 스켈레톤은 하나다**(§7 #7) |
| FS-078-EL-020 | N/A — 오류가 있어야 성립 | 재저장 시 `setSaveError(null)` 로 먼저 지운다(`:244`) | **이것이 저장 실패 표현.** 문구 1종 · **참조 코드 없음**. abort 는 표시하지 않는다 | 검증 실패는 여기 오지 않는다(필드 오류로 간다) | 서버 403 도 이 문구로 뭉개진다 | **409 는 여기 오지 않는다** — EL-024 로 갈린다. ✅ **`conflict === null` 을 검사해 다이얼로그와 중복 표시되지 않는다** | 1건 |
| FS-078-EL-021 | N/A — 제출이 있어야 성립 | `busy={saving}` → 확인 버튼이 '처리 중…' + 잠김. **취소는 살아 있다** | 실패해도 **닫지 않는다** — 다이얼로그 안 danger 배너 | **검증을 통과한 값만 여기 온다** — `handleSubmit(onValid)` 이 게이트다 | 권한 없으면 저장 버튼이 없어 도달 불가 | 확인 중 다른 관리자가 저장하면 확인 후 409 → EL-024 | 1건 |
| FS-078-EL-021.1 | N/A — 규칙 | N/A — 순수 조립(동기) | N/A — 서버 호출 없음 | N/A — 규칙 | N/A | **기준이 `data?.value.usePg` 라 재조회가 오면 문구가 바뀐다** — 다이얼로그가 떠 있는 동안에도 | 4문구(끄기 1 · 켜기 2 · 그 밖 1) |
| FS-078-EL-021.2 | N/A — 다이얼로그가 떠야 성립 | 저장 중에도 누를 수 있다 — 그것이 abort 경로다 | abort 는 실패로 통지되지 않는다(EL-023) | N/A | N/A | 취소해도 서버 도달 여부는 보장되지 않는다(§7 #11) | 단건 |
| FS-078-EL-022 | N/A — 규칙 | `loading` 중에는 revision 이 없어 아무것도 하지 않는다 | 실패는 EL-020 또는 EL-024 로 갈린다 | N/A — 검증은 상류에서 끝났다 | N/A | **`expectedRevision` 이 이 규칙의 핵심** — 낡으면 409 | 단건 |
| FS-078-EL-022.1 | N/A — 규칙 | 잠금은 렌더와 무관하게 즉시 건다 | 성공·실패 어느 쪽이든 `lock.release()`(`:253,266`) | N/A | N/A | **연타의 2번째가 여기서 멈춘다** | **멱등키가 없다** — 재시도는 새 요청이 되고 낡은 revision 때문에 409 가 된다(§7 #5) |
| FS-078-EL-022.2 | N/A — 성공이 있어야 성립 | N/A — 결과 처리 | N/A — 성공 경로 | N/A | N/A | **`setQueryData(key, saved)`** 로 새 revision 을 즉시 심는다 — 연속 저장이 409 를 맞지 않는다 | 단건. 토스트 2분기 |
| FS-078-EL-022.3 | N/A — 성공이 있어야 성립 | N/A | **실패·409 에서는 부르지 않는다** — 거절된 저장이 판매 방식을 바꾸지 않는다 | N/A | N/A | 모듈 지역 변수라 **다른 탭에는 전파되지 않는다**(§7 #10) | 한 줄 대입 |
| FS-078-EL-023 | N/A — 진행 요청이 있어야 성립 | 이것이 취소 규칙 | **abort 는 실패가 아니다**(EXC-09) | N/A | N/A | 이탈 시 진행 중 저장 취소 — **서버 도달 여부는 보장하지 않는다**(§7 #11) | 단건 |
| FS-078-EL-024 | N/A — 충돌이 있어야 성립 | `busy={saving}` — 덮어쓰기 중 두 액션이 잠긴다 | 덮어쓰기 실패 시 다이얼로그 안 danger 배너 | N/A — 입력 없음 | 권한 없으면 저장 불가라 도달 불가 | **이것이 경합 표현.** 토큰 기반 — '존재 여부' 가 아니라 revision 불일치로 판정 | 1건 |
| FS-078-EL-024.1 | N/A — 충돌이 있어야 성립 | N/A | N/A — 표시 전용 | N/A | N/A | 최신 문서의 `audit` 를 그대로 보인다 | 고정 문구 |
| FS-078-EL-024.2 | **갈린 항목이 0개면 목록을 그리지 않는다** — 이 문서는 평면이라 실제로 0개가 나온다 | N/A — 순수 계산 | N/A | N/A | N/A | `getValues()`(내 입력) vs `conflict.value`(최신) 비교 | 최대 6개 라벨. **거짓 양성 없음**(형제 화면과 다른 점) |
| FS-078-EL-024.3 | N/A | `busy` 면 잠김 | `refetch()` 가 실패하면 EL-018 이 폼을 대체한다 — **불러온 값은 폼에 이미 들어가 있다** | N/A | N/A | reset 후 refetch 라 최신 revision 을 다시 받는다 | 단건 |
| FS-078-EL-024.4 | N/A | `busy` 면 잠김 + '처리 중…' | 실패 시 다이얼로그 유지 + 배너. **재클릭이 재시도** | ⚠ **`getValues()` 를 그대로 보내 trim 을 거치지 않는다**(§7 #16). 검증도 다시 돌지 않는다 | N/A | **`force: true` 라 토큰 검사를 건너뛴다** — 상대 변경이 사라진다(사용자가 알고 고른 것) | 단건 |
| FS-078-EL-024.5 | N/A | 진행 중 저장을 abort 한다 | abort 는 통지하지 않는다 | N/A | N/A | 닫아도 내 입력은 그대로 — 다시 저장하면 또 409(revision 이 여전히 낡음) | 단건 |
| FS-078-EL-025 | N/A — dirty 여야 성립 | **저장 중에는 가드가 꺼진다**(`dirty && !saving`) | N/A — 서버 호출 없음 | N/A — 입력 없음 | `!canUpdate` 면 편집이 불가해 dirty 가 되지 않는다 | 저장 성공 후 `reset` 이 dirty 를 풀어 가드가 내려간다 | 3경로 |
| FS-078-EL-026 | 도착 전에는 `DEFAULT_FORM_VALUES`(스켈레톤에 덮여 사실상 안 보이나 **EL-003 배너는 이 값을 읽는다** — §7 #9) | `data === undefined` 면 reset 하지 않는다 | 조회 실패 시 폼이 렌더되지 않는다 | N/A — 규칙 | N/A | **`useEffect([data, reset])` 가 편집 중 재조회에서도 돈다** — 입력이 덮인다(§7 #4) | 단건 문서(6필드) |
| FS-078-EL-027 | N/A — 제출이 있어야 성립 | 저장 중 버튼이 비활성 + 동기 잠금 | N/A — 검증은 로컬 | **이것이 유효성 게이트.** `noValidate` 로 브라우저 검증을 끄고 zod 가 판정 | 권한 없으면 submit 버튼이 없다(Enter 제출은 가능 — §7 #15) | N/A | 6필드 일괄. **교차 규칙 4갈래** |
| FS-078-EL-028 | 기준선과 같으면 not-dirty | N/A — 동기 판정 | N/A | N/A | N/A | 기준선이 바뀌면 판정도 바뀐다 | N/A — 순수 판정 |

### 4.1 공통 예외 규칙

| 규칙 | 내용 |
|---|---|
| 네트워크 단절 | 조회 실패는 폼을 대체하는 인라인 배너(EL-018), 저장 실패는 카드 배너(EL-020). **오프라인 감지·복귀 재조회가 앱 전역에 없다**(`navigator.onLine` grep 0건) — §7 #11 |
| 세션 만료 | 401 은 **앱 전역 인터셉터**(`shared/query/queryClient.ts:60-66`)가 받아 `notifySessionExpired()` 를 쏘고 `RequireAuth` 가 `/login?returnUrl=%2Fsettings%2Fpayment&reason=session_expired` 로 보낸다. **미저장 입력은 그때 사라진다** — 프로그램적 이동이라 EL-025 가드가 발화하지 않는다 — §7 #11 |
| 요청 타임아웃 | 프론트 상한 없음(`AbortSignal.timeout` 앱 전역 0건). abort 는 언마운트(EL-023)·확인 취소(EL-021.2)·충돌 닫기(EL-024.5)에서만 발생한다 — §7 #11 |
| 중복 제출 | `disabled={!dirty \|\| saving \|\| loading}` + **동기 잠금 `useSubmitLock`**(EL-022.1). **멱등키는 없다** — 다만 `expectedRevision` 이 있어 응답 유실 후 재시도는 **중복 적용이 아니라 409** 가 된다(§7 #5). 단일 문서 전체 치환이라 중복 적용되어도 최종 상태는 같다 |
| 실패 통지의 자리 | ① 조회 실패 = 폼을 대체하는 인라인 배너 ② 저장 실패 = 카드 배너(확인·충돌 다이얼로그가 떠 있으면 그 안에만) ③ 저장 **성공** = 토스트(2분기 — EL-022.2) ④ 409 = 충돌 다이얼로그 ⑤ 검증 실패 = 필드 인라인(결제수단만 `role="alert"`) ⑥ abort = 아무것도 띄우지 않는다 |
| 낙관적 업데이트 | **이 화면에 없다.** 저장은 비관적(응답 후 `reset` + 캐시 심기)이다 — 롤백 경로가 필요 없다. 다만 **미리보기(EL-006)는 드래프트를 그린다** — 저장 전 결과를 보여 주는 것이 목적이므로 이것은 낙관적 업데이트가 아니라 시뮬레이션이다 |
| 동시 조회 | `useSettingsQuery` 가 `queryKey: ['settings','payment']`(`data-source.ts:23`)로 1건만 유지한다. 전역 기본을 따른다 — `staleTime` 30초(`queryClient.ts:70`) · `retry: false`(`:82`) · `refetchOnWindowFocus: false`(`:90`) |
| 권한 없음 | **read** — `RequirePermission` 이 AppShell `<Outlet>` 을 감싸(`AppShell.tsx:408-410`) 권한 없는 deep-link 에 `ForbiddenScreen` 을 렌더한다. 리소스는 라우트에서 파생된다(`page:/settings/payment`). **write** — `useRouteWritePermissions().canUpdate`(`:185`)가 저장 컨트롤을 게이팅한다(EL-016·EL-017)와 모든 입력을 비활성화한다(EL-013). 권한 스토어가 바뀌면 재렌더돼 **강등 reconcile 이 별도 코드 없이 성립한다.** **엔타이틀먼트(플랜) 축은 이 화면을 게이팅하지 않는다** — `MODULE_RESOURCES`(`shared/entitlements/module-resources.ts:29-91`)에 `/settings/**` 가 없어 언제나 `granted` 다(FS-079 §3 참조) |
| 렌더 예외 | AppShell 이 `<Outlet>` 바로 바깥에 `ErrorBoundary` 를 둔다(`AppShell.tsx:395-400`) — 화면이 던져도 사이드바·헤더가 남고 `RouteErrorScreen` 이 뜬다 |
| 상태 전이 규칙 | 이 화면의 '상태' 는 `usePg` 불리언 하나이고 자유 전환이다. **전환의 대가를 확인 다이얼로그가 말한다**(EL-021.1). 되돌리는 전이가 값을 지우지 않는다 — 꺼도 PG 값이, 켜도 안내 문구가 폼에 남아 저장된다(EL-012) |
| 프론트 검증은 보증이 아니다 | zod 는 UX 다. 서버가 같은 규칙을 다시 검증한다 — `data-source.ts:34-35` 의 심이 `422 → 필드 검증 실패` 를 명시한다(BE-078 영역) |

## 5. 서버 연동 지점

| 요소번호 | 이름 | 읽기/쓰기 | 필요 데이터 | 프론트 어댑터 | 비고 |
|---|---|---|---|---|---|
| FS-078-EL-014 / EL-018 / EL-019 / EL-026 / EL-021.1 | 결제 설정 조회 | R | `{ value: PaymentSettings, revision, audit }` | `paymentSettingsStore.fetch(signal)`(`data-source.ts:39` → `_shared/store.ts:128-132`) · `useSettingsQuery(paymentSettingsKey, paymentSettingsStore)`(`:188-191`) | **revision·audit 를 문서와 함께 나른다.** `paymentSettingsKey = ['settings','payment']`(`data-source.ts:23`) |
| FS-078-EL-016 / EL-020 / EL-022 / EL-022.2 / EL-024 / EL-024.4 | 결제 설정 저장 | W | `{ value: PaymentSettings(6필드), expectedRevision, force? }` | `paymentSettingsStore.save(input, signal)`(`data-source.ts:41-46` → `_shared/store.ts:134-152`) · `useSaveSettings` | **`expectedRevision` 불일치 → `SettingsConflictError`(최신 문서 동봉)**. `force: true` 면 토큰 검사를 건너뛴다. ⚠ **응답이 돌아온 뒤 `writePaymentSettings(saved.value)` 라는 부수효과가 하나 더 있다**(EL-022.3) — 이 앱 안의 판매 방식 전역 상태를 갱신한다 |
| FS-078-EL-024.3 | 최신 내용 재조회 | R | 위 조회와 동일 | `refetch()`(react-query) | 충돌 해소 경로 |
| — | 결제 실행·거래 조회 | — | — | **없다** | 이 화면은 결제 API 를 부르지 않는다(§1 범위 밖). 상점 ID 는 저장할 뿐 PG 사에 검증 요청을 보내지 않는다(§7 #17) |

> **현재 구현 상태 (백엔드 명세 참고)**: 백엔드는 없다. `paymentSettingsStore` 는 `createRevisionedStore<PaymentSettings>('payment', readPaymentSettings(), { updatedBy: '박관리', updatedAt: '2026-07-16T01:20:00.000Z' })`(`data-source.ts:29-32`)로 만든 **브라우저 안 mutable 클로저 1건**에 400ms 지연(`LATENCY_MS`)과 개발용 실패·충돌 스위치를 얹은 것이다 — 실제 네트워크 0건. `revision` 은 `rev-<seq>` 단조 증가 문자열(`_shared/store.ts:104-107`)이고 저장 주체는 **하드코딩 `CURRENT_ADMIN = '김운영'`**(`:100`). 재현 스위치가 화면 머리말에 문서화돼 있다(`data-source.ts:11-14`): `?fail=load` · `?fail=save` · `?fail=conflict`. **새로고침하면 시드로 되돌아간다** — 이 화면의 저장에는 영속이 없다(§7 #10).
>
> **TODO(backend) 심은 정확히 2곳이다** — ① `shared/commerce/payment-settings.ts:190-193`(`GET`/`PUT /api/settings/payment` · `PUT` 바디 6필드 + `If-Match: <revision>` · **⚠ 상점 ID 는 식별자이지 비밀키가 아니며 PG 시크릿은 이 문서에 넣지 않는다**) ② `pages/settings/payment/data-source.ts:34-35`(같은 두 엔드포인트 · `200 → { value, revision, audit }` / `409·412 → 동시 편집 충돌` / `422 → 필드 검증 실패`). **두 심이 같은 계약을 두 곳에서 말한다** — BE-078 이 그것을 하나로 접어야 한다.

## 6. 자기 점검 (제출 전 확인)

- [x] 구현 소스를 전수 대조했다 — `PaymentSettingsPage.tsx`(571행) · `validation.ts`(102행) · `types.ts`(54행) · `data-source.ts`(57행) · `components/CheckoutCtaPreview.tsx`(110행) · **규칙의 정본** `shared/commerce/{payment-settings.ts(208행),pg-lock.ts(75행),price-display.ts(116행),PgLockNotice.tsx(53행)}` · 공유 골격 `pages/settings/_shared/{SettingsFormShell,ConflictDialog,AuditNote,fields,queries,store,diff}`
- [x] **출하 기본이 OFF 임을 코드로 확인**했다(`DEFAULT_PAYMENT_SETTINGS.usePg === false` · `merchantId === ''` — `payment-settings.ts:179-186`)하고 그 근거 주석(`:176-178`)을 §1 에 인용했다
- [x] **`pgSellable` 이 fail-closed 임을 코드로 확인**했다(`usePg && merchantId.trim() !== ''` — `:128-130`, 근거 `:116-127`)하고 §1.1 · EL-006.2 에 명시했다. 회귀는 `pg-axes.test.ts` 의 `PG_HALF` 픽스처가 고정한다
- [x] **잠금이 여섯 구획이고 사유가 한 벌임을 코드로 확인**했다(`PG_LOCK_SECTIONS` 6항목 — `pg-lock.ts:26-33` · `LOCK_REASON` — `:52-64`)하고, **소비처를 전수 grep 해 여섯 구획 전부에 호출부가 있음**을 확인했다(§1.1 표)
- [x] **잠금이 값을 지우지 않음을 코드로 확인**했다 — `pgLock` 은 `{ locked, reason }` 만 돌려주고 어떤 저장도 하지 않는다(`:72-75`). 원칙의 근거는 `pg-lock.ts:7-10`. §1.1 에 인용했다
- [x] **이 화면이 잠금 대상이 아님을 코드로 확인**했다(`PG_LOCK_SECTIONS` 에 설정 화면이 없다) — 이 화면이 읽기 전용으로 내려가는 유일한 조건은 쓰기 권한 부족(`READ_ONLY_NOTICE`)이며 §1.1 · EL-017 에 적었다
- [x] **화면별 파급의 상세는 복제하지 않고 `docs/adr/0014-pg-switch-screen-impact.md` 경로 링크만 걸었다.** 그 ADR 은 같은 배치에서 등재됐다(accepted, 2026-07-22) — 링크가 실재하는 문서를 가리킨다
- [x] 보이지 않는 요소(스켈레톤·조회/저장 실패 배너·읽기전용 안내·PG 미사용 안내·확인/충돌 다이얼로그·이탈 가드·동기 잠금·abort 규칙·dirty 판정·reset 규칙·조건부 구획 규칙·CTA 파생 규칙·판매 가능 판정)에 번호를 줬다
- [x] §4 예외 7축 빈칸 0건. 모든 `N/A` 에 사유
- [x] `[서버]` = O 요소가 §5 에 전부 요약됐다 — 조회·저장 2건 + 충돌 재조회 1건. **어댑터를 거치지 않는 호출이 없다**
- [x] 엔드포인트·HTTP·에러코드·DB 스키마를 쓰지 않았다 (BE-078 영역). 다만 TODO 심이 **두 곳에 중복**돼 있다는 사실은 §5 각주에 남겼다
- [x] **이 화면의 검증에 테스트가 0건임을 grep 으로 확인**했다(`paymentSettingsSchema` 히트 = `PaymentSettingsPage.tsx`·`validation.ts` 두 파일뿐) — §7 #2

## 7. 미결 사항 (UI 기획 / 아키텍처 / 백엔드 명세 / 프론트 구현 이관)

| # | 내용 | 이관 대상 |
|---|---|---|
| 1 | 대응 SCR 문서 부재 (시스템 설정 SCR 미작성) | UI 기획 / 아키텍처 |
| 2 | ⚠ **이 화면의 검증에 테스트가 0건이다.** `paymentSettingsSchema` 를 부르는 파일이 리포 전체에 `validation.ts`(정의)와 `PaymentSettingsPage.tsx`(소비) 둘뿐이다 — **교차 규칙 4갈래**(켠 채 빈 상점 ID · 켠 채 빈 결제수단 · 끈 채 빈 안내 문구 · 두 길이 상한)가 **하나도 고정돼 있지 않다.** 대조군이 바로 옆에 있다: 같은 축의 순수 규칙은 `shared/commerce/payment-settings.test.ts`(98행)와 `pg-axes.test.ts`(161행)가 촘촘히 고정한다. **규칙은 지켰고 검증만 비었다** — 스위치를 내렸다 올릴 때마다 필수가 바뀌는 스키마인데 그 뒤집힘을 아무도 지키지 않는다 | **프론트 구현 (최우선)** · 명세 리뷰 |
| 3 | **검증 실패 시 첫 오류 필드로 포커스가 가지 않는다** — `handleSubmit(onValid)`(`:387`)에 `onInvalid` 가 없다. `useCrudForm` 의 `onInvalid`/`setFocus` 경로를 상속하지 못했다. 다행히 오류 필드가 화면 밖에 있을 수는 없다(EL-027 ✅) | UI 기획 쪽 변경 요청 (quality-bar A11Y-13 P1) |
| 4 | 데이터 도착 시 `reset(toPaymentFormValues(data.value))`(`:219-222`)가 **편집 중 재조회에서도 돈다** — 그 밖의 재조회(수동 refetch·캐시 무효화)가 오면 입력이 덮인다. **이 화면에서는 더 나쁘다**: 덮이는 값이 `usePg` 면 **구획이 통째로 갈아 끼워져** 사용자가 입력하던 자리가 화면에서 사라진다(EL-012) | UI 기획 쪽 변경 요청 |
| 5 | 저장에 **멱등키가 없다** — 동기 잠금(EL-022.1)은 연타를 막지만 응답 유실 후 재시도는 새 요청이 된다. `expectedRevision` 덕에 중복 적용이 아니라 409 가 되므로 데이터는 안전하나, 사용자는 영문 모를 충돌 다이얼로그를 본다. 앱에 선례가 둘 있다(`pages/members/components/PointsCard.tsx` · `pages/settings/api-keys/ApiKeysPage.tsx`) | UI 기획 · 백엔드 명세 (BE-078) (quality-bar EXC-08 P0) |
| 6 | 조회 실패(EL-018)·저장 실패(EL-020)가 **status 를 구분하지 않는다** — 401/403/404/422/500 이 한 문구다. `createRevisionedStore` 가 `HttpError`(status 보유)가 아니라 일반 `Error`/`SettingsConflictError` 만 던져 화면이 분기할 근거가 없다. **오류 참조 코드도 없다** — `referenceOf`(`shared/errors/http-error.ts:151`)가 이미 있는데 이 경로가 쓰지 않는다 | UI 기획 · 백엔드 명세 (quality-bar EXC-06 · EXC-20 P1) |
| 7 | 스켈레톤 행 수가 하드코딩 `[0,1,2,3]`(`SettingsFormShell.tsx:156`) — **이 화면은 특히 어긋난다**: 꺼진 상태의 실제 shape 는 '스위치 1 + 미리보기 2칸 + textarea 1' 이고 켜진 상태는 'select 2 + 텍스트 1 + 체크박스 5 + 미리보기 2칸' 이라 **두 벌인데 로딩은 한 벌이다** | UI 기획 쪽 변경 요청 (quality-bar COMP-06 P2) |
| 8 | 조회 실패 배너(EL-018)의 문구가 **'설정을 불러오지 못했습니다.'** 라는 **도메인 없는 문구**다(`SettingsFormShell.tsx:132`) — 셸이 `cardTitle` 을 받는데 배너에 쓰지 않는다. 설정 화면 4개가 같은 문구를 쓴다 | UI 기획 (셸 소유 — 설정 4화면 공통) |
| 9 | **도착 전에는 PG 미사용 배너(EL-003)가 언제나 뜬다** — `warning` 슬롯이 스켈레톤 분기 **밖**이고(`SettingsFormShell.tsx:152`) 그때 `values.usePg` 는 `DEFAULT_FORM_VALUES.usePg === false` 다. 즉 **PG 를 켜 둔 계정도 로딩 400ms 동안 '지금은 PG 결제를 쓰지 않는 상태입니다' 를 읽는다.** 조건에 `!loading` 을 곱하면 사라진다 | 프론트 구현 |
| 10 | **저장이 새로고침을 넘기지 못한다** — `writePaymentSettings` 는 모듈 지역 변수만 바꾸고(`payment-settings.ts:201-203`) `createRevisionedStore` 도 클로저 1건이라 **영속도, 크로스탭 동기화도 없다.** 형제 축인 엔타이틀먼트는 localStorage + `storage` 이벤트를 갖는다(`shared/entitlements/entitlement-store.ts:29-49,154-163`). 픽스처 한정 성질이며 백엔드가 붙으면 사라지지만, **그때까지 「저장했는데 새로고침하면 되돌아간다」 를 운영자가 만난다** | 프론트 구현 (백엔드 연결 시 자연 소멸) |
| 11 | 프론트 타임아웃 상한 없음(`AbortSignal.timeout` 0건) · 오프라인 감지 없음(`navigator.onLine` 0건) · 세션 만료 리다이렉트가 미저장 입력을 버린다(가드 미발화) · 이탈·취소 시 abort 는 **클라이언트만 결과를 버릴 뿐** 서버 도달 여부를 보장하지 않는다 | UI 기획 · 프론트 구현 · 백엔드 명세 (quality-bar EXC-05 · EXC-11 · EXC-19 P1) |
| 12 | **쓰지 않는 구획을 「자리째 없애는」 선택이 형제 화면과 정반대다.** 이 화면은 숨기고(`:413-415`), `../site` 는 잠그되 남긴다(FS-067 §1.1 '잠그되 숨기지 않는다', 근거 `SiteSettingsPage.tsx:505-510`). 두 근거 모두 타당하지만 **같은 섹션의 두 화면이 반대 규약을 쓴다.** 게다가 이 화면은 **숨긴 값이 그대로 저장된다는 사실을 말하지 않는다** — 운영자는 PG 를 껐다 켰을 때 상점 ID 가 남아 있을지 알 수 없다(`../site` 는 그 약속을 문장으로 한다). 규약을 하나로 정할지, 아니면 '숨기되 보존을 고지' 로 갈지 미정 | **UI 기획 쪽 확인 요청** |
| 13 | **`checkoutCta` 의 `reason` 이 이 화면에서 소비되지 않는다** — 미리보기가 `kind`·`label` 만 쓴다(`CheckoutCtaPreview.tsx:98-104`). 그런데 그 문자열은 '운영자 화면이 그대로 힌트로 쓴다(설정을 오해한 채 저장하지 않게)' 는 목적으로 만들어졌다(`payment-settings.ts:93`). **특히 「PG 상점 ID 가 비어 있어 결제창을 열 수 없습니다」 는 이 화면에서만 발생하는 상태인데 그 설명이 화면에 없다** — 켠 채 상점 ID 를 비우면 미리보기가 조용히 '문의하기' 로 바뀌고 이유는 어디에도 안 적힌다(검증 오류는 제출해야 뜬다) | **UI 기획 쪽 변경 요청** |
| 14 | **문서 heading 이 h1 → h3 로 건너뛴다** — AppHeader 가 `<h1>`, 구획 제목이 `<h3>`(`:152`)이고 그 사이 `<h2>` 가 없다(`CardTitle` 은 heading 시맨틱이 아니다). 형제 화면 `../site` 와 같은 결함이다(FS-067 §7 #21) | UI 기획 쪽 변경 요청 (A11Y) · DS(`CardTitle` 시맨틱) |
| 15 | 읽기 전용 역할에게 저장 **버튼**은 없지만 `<form onSubmit>` 은 남아 있다 — 상점 ID 입력에서 Enter 를 누르면 제출이 발화한다. 필드가 전부 `disabled` 라 실현되지 않으나 **방어가 구조가 아니라 우연**이다 | UI 기획 쪽 변경 요청 |
| 16 | **'덮어쓰기' 경로가 trim 과 재검증을 건너뛴다** — `overwrite` 가 `runSave(getValues(), true)`(`:321-323`)로 **폼 원값**을 보낸다. 정상 경로는 `onValid` 가 `merchantId`·`inquiryGuide` 를 `trim()` 하고(`:290-291`) zod 를 통과한 값만 넘긴다. 즉 충돌 후 덮어쓰면 **앞뒤 공백이 그대로 저장되고, 충돌 다이얼로그가 떠 있는 동안 사용자가 값을 바꿨다면 검증 없이 나간다** | 프론트 구현 |
| 17 | **상점 ID 를 저장할 뿐 PG 사에 확인하지 않는다** — 형식도 안 보고(의도 — `validation.ts:14-17`) 연결 테스트도 없다. 오타 하나가 저장되면 '결제창이 열리는 설정' 으로 판정되지만(`pgSellable` 은 공백만 본다) 실제로는 열리지 않는다. **fail-closed 가 「비었을 때」만 닫히고 「틀렸을 때」는 열린다.** 형제 화면 `/settings/api-keys` 는 자격증명 검증 개념을 갖는다 | **아키텍처 · 백엔드 명세 (BE-078)** |
| 18 | **ADR-0014 와 이 문서의 경계가 아직 리뷰되지 않았다** — `docs/adr/0014-pg-switch-screen-impact.md`(accepted, 2026-07-22)가 §1.1 이 요약한 두 축·잠금·값 보존의 상세 근거를 소유한다. 이 문서는 요약과 링크만 두고 내용을 복제하지 않았으나, **어느 쪽이 어디까지 말하는지의 선은 합의된 적이 없다** — 구획이 하나 늘거나 파급 화면이 추가될 때 두 문서 중 어디를 고칠지가 미정이다 | 명세 리뷰 · 아키텍처 |
| 19 | **이 라우트의 e2e 커버리지가 0이다** — `e2e/` 의 스펙은 dashboard · login · quality-bar · users · support · ai · throwaway 뿐이다. 이 화면은 **조건부 구획 교체 · 실시간 미리보기 · 확인/충돌 2단 다이얼로그 · 저장 후 화면 밖 파급**을 한 화면에 얹고 있어 단위 테스트로는 조립을 검증할 수 없다(게다가 그 단위 테스트도 0건 — #2) | 프론트 구현 · 명세 리뷰 |
| 20 | **BE-078 · NFR-078 이 없다.** 그리고 `specs/README.md` §2 번호대 표·§3 화면 색인에 **070 번대 이후 화면이 실려 있지 않다**(결제 설정 078 · 플랜 079 · 청구·입금 077). 색인 갱신은 다른 소유자의 일이라 이 배치에서 손대지 않았다 | 명세 리뷰 (색인 갱신) · 백엔드 명세 |
</content>
