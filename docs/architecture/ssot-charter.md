# SSOT 헌장 — 엔터프라이즈 UI 플랫폼

오너가 2026-07-20 확정한 **상시 규범**이다. 개별 작업 지시가 아니라 모든 작업이 그 아래에서 움직이는
상위 규칙이다. 특정 작업이 이 헌장과 충돌하면 **헌장이 이긴다**.

관련 문서 — 이 헌장은 아래를 대체하지 않고 그 위에 선다.

| 문서 | 역할 |
|---|---|
| [specs/quality-bar.md](../../specs/quality-bar.md) | 100개 요구사항(P0 30개)의 인수 기준. TOKEN·COMP·A11Y·IA·EXC·STATE·MOTION·FEEDBACK·ERP |
| [ssot-pipeline.md](ssot-pipeline.md) | 작업 9단 순서와 단 사이 인수인계 6항 규약 |
| [frontend-conventions.md](frontend-conventions.md) | G1~G7 게이트 |
| [contracts/](../../contracts/) | 컴포넌트 계약 — G3 승인 시 코드젠 트리거 |

---

## 1. 불변 원칙

1. **Storybook 이 단일 원천이다.** Storybook 에 없으면 그 컴포넌트는 존재하지 않는다.
2. **페이지 안에서 UI 를 만들지 않는다.** `Foundation → Primitive → Component → Pattern → Template → Page`.
   페이지는 **조합만** 한다. 의존 방향은 단방향이며 역류하지 않는다.
3. **중복 컴포넌트를 만들지 않는다.** `PrimaryButton`·`BlueButton`·`CustomButton` 이 아니라 `Button` 하나에
   `variant`·`size`·`state`·`icon`·`loading`·`shape` 로 흡수한다.
4. **토큰만 쓴다.** `12px`·`#0066FF`·`rgb()`·인라인 색·매직넘버 금지. `spacing-md`·`radius-lg`·
   `color-primary`·`font-body-md`·`elevation-2`·`motion-fast`.
5. **컴포넌트 우선 개발.** `Component → Storybook → 문서 → 테스트 → 애플리케이션`. Admin 페이지에서
   직접 개발하지 않는다.
6. **한 번의 변경이 전부를 갱신한다.** 컴포넌트가 바뀌면 Storybook·React·문서·Figma·토큰·시각 회귀·
   접근성·회귀 테스트가 **함께** 바뀐다. 하나라도 빠지면 그 변경은 끝나지 않은 것이다.

### 최종 아키텍처

```
Admin Application → Reusable Components → Storybook (SSOT) → Figma (1:1)
                 → Design Tokens → Documentation → Testing → Reusable UI Platform
```

---

## 2. 컴포넌트 표준

모든 컴포넌트가 **전부** 만족해야 한다: 완전 재사용 가능 · 가능한 한 무상태 · 접근성(WCAG) ·
반응형 · 테마 인식 · 토큰 구동 · variant 구동 · 문서화 · 테스트 · 프로덕션 준비.

**네이밍**: `Button`·`Input`·`Card`·`Modal`·`Drawer`·`Tabs`·`Table`·`Badge`·`Avatar`·`Typography`·
`Breadcrumb`·`Toast`·`Checkbox`·`Radio`·`Switch`.
금지: `Button2`·`NewButton`·`FinalButton`·`PrimaryButton`·`BlueButton`·`TestComponent`.

**토큰 대상 전체**: 색·타이포·폰트크기·굵기·행간·자간·간격·radius·border width·shadow·elevation·
opacity·motion·transition·duration·easing·grid·breakpoint·z-index.

**Storybook 필수 스토리**: Default·Hover·Focus·Active·Disabled·Loading·Empty·Error·
Responsive·Accessibility·Interaction Tests·Play Functions·Documentation.
(라이트 단일 테마이므로 Dark Mode 스토리는 요구하지 않는다.)

**문서 필수 항목**: Purpose·Usage·Properties·Variants·Accessibility·Do/Don't·Design Guidelines·
Responsive Rules·Examples·Migration Guide.

---

## 3. 로드맵 — 현재 위치

헌장의 Phase 0~8 을 이 리포지토리의 실제 상태에 대응시킨 것이다. **이미 있는 것을 다시 만들지 않기 위한
표이지, 남은 일을 줄이기 위한 표가 아니다.**

| Phase | 헌장이 요구하는 것 | 현재 상태 | 남은 일 |
|---|---|---|---|
| 0 · UI 감사 | 전체 UI 인벤토리 | 부분 — `docs/audit/`, quality-bar 100요구사항이 감사 산출물 | 상태(Empty/Loading/Error)·모션·반응형까지 덮는 전수 인벤토리 |
| 1 · 컴포넌트 인벤토리 | 중복 병합 | 부분 — 계약 53개, 23모듈 분류 체계 확정(a91b288) | Admin 로컬 UI 12종 미승격(아래 §4) |
| 2 · 아키텍처 | 계층·의존 방향 | **있음** — `packages/ui/{foundations,atoms,molecules,organisms,templates}` | 의존 방향 역류 기계 검사 |
| 3 · Storybook | 상태·a11y·인터랙션 전부 | 부분 — 스토리 99개 | 상태 전 축(Hover/Focus/Active/Responsive)·play function 커버리지 |
| 4 · Admin 리팩토링 | Admin 은 소비만 | 부분 — deep import 는 ESLint 로 차단됨 | 로컬 UI 제거 후 `@tds/ui` 소비로 전환 |
| 5 · Figma 동기화 | 1:1 | 부분 — `docs/figma/`, 플러그인 개편됨(96734b6) | variant·property·auto layout 1:1 검증 |
| 6 · 검증 | 시각 드리프트 0 | **없음** | 시각 회귀 파이프라인 |
| 7 · 문서화 | 10항목 전부 | 부분 — `docs/tds/components/*.api.md` | 누락 항목(Do/Don't·Migration) 채우기 |
| 8 · 자동화 | 생성 자동화 | 부분 — 계약→코드젠 | 스토리·스냅샷·a11y 리포트·릴리스노트 자동 생성 |

---

## 4. 지금 가장 큰 위반

`apps/admin/src/shared/ui/` 에 **Storybook 밖의 재사용 UI** 가 남아 있다. 원칙 1 의 정의상 이것들은
"존재하지 않는" 컴포넌트인데 130여 화면이 쓰고 있다 — 헌장과 코드가 어긋나는 지점이다.

```
Card · ConfirmDialog · FilterPanel · SkeletonRows · VersionHistoryTable
ToastProvider · FormSectionNav · brand-marks · styles.ts
useRowSelection · useModalDirtyGuard · useUnsavedChangesDialog
```

승격 경로: 계약 작성(G3) → `packages/ui` 이관 → 스토리 → 문서 → Admin 을 `@tds/ui` 소비로 전환 →
Figma 동기화. `styles.ts` 는 토큰 위반이 숨기 가장 쉬운 파일이라 함께 본다.

---

## 5. 완료 정의

아래가 **전부** 참일 때만 완료다. 부분 충족은 미완료다.

- Admin UI 100% 모듈화 · 재사용 컴포넌트 100% Storybook 등재
- 디자인 토큰 커버리지 100% · 하드코딩 스타일 0
- Storybook ⇄ Figma 100% 동기화 · 중복 컴포넌트 0
- 문서 완비 · 접근성 검증 · 시각 회귀 통과
- **판정 2축이 화면에서 구별된다** (아래 §5.1)
- **새 애플리케이션을 컴포넌트 라이브러리만으로 만들 수 있다**

### 5.1 판정은 2축이고, 거절 문구는 네 가지다 — 섞지 않는다

화면이 무언가를 거절할 때 **왜** 거절했는지가 문구로 갈려야 한다. 갈리지 않으면 운영자는
고칠 수 없는 방향으로 움직이고, 그 움직임의 끝은 언제나 지원 티켓이다.

판정 순서는 **인증 → 플랜(엔타이틀먼트) → 권한 → 설정**이며, 그 순서대로 네 문구가 대응한다.

| 거절 사유 | 문구 계열 | 운영자의 다음 행동 | 쓰면 안 되는 문구 |
|---|---|---|---|
| 플랜에 없음 (`locked`) | **업그레이드 안내** + 플랜 보기 | 계약·결제 (앱 밖) | 403 · '권한이 없습니다' |
| 살 수 없는 모듈 (`absent`) | **완전 숨김** — 문구도 화면도 없다 | 없다 | 업그레이드 안내 (거짓말이 된다) |
| 권한 없음 | **403** '접근 권한이 없습니다' | 관리자에게 권한 요청 | 업그레이드 안내 |
| 테넌트가 고른 운영 방식 | **설정 안내** (info 톤) + 그 설정 화면으로 | 설정 변경 (같은 앱 안) | 403 · danger 톤 |

**완료 판정**: 새 화면이 거절 표면을 하나라도 그리면, 그것이 위 네 계열 중 **정확히 하나**여야 한다.
두 계열을 한 화면에서 동시에 보이거나, 사유가 다른데 문구가 같으면 그 화면은 완료가 아니다.

두 축은 실패 방향도 반대다 — **권한은 fail-closed, 엔타이틀먼트는 fail-open**.
근거와 전문은 [ADR-0013](../adr/0013-entitlement-layer.md), 설정 축(PG 스위치)은 [ADR-0014](../adr/0014-pg-switch-screen-impact.md).
인수 기준은 `specs/quality-bar.md` 의 **EXC-21 · EXC-22** 다.

### PR 게이트

시각 회귀 · 접근성 감사 · 인터랙션 테스트 · 스냅샷 · 반응형 · 크로스브라우저 · 토큰 검증 ·
variant 검증 · 문서 검증. **예외 없음.**

---

## 6. 상시 워크플로

```
1 감사 → 2 중복 제거 → 3 컴포넌트 추출 → 4 토큰 적용 → 5 Storybook 등록 → 6 문서 생성
→ 7 자동 테스트 → 8 Admin 구현 교체 → 9 Figma 동기화 → 10 시각 동등성 검증 → 11 SSOT 무결성 유지
```

속도를 아키텍처보다 앞세우지 않는다. 편의를 위해 일관성을 희생하지 않는다.
확장성·유지보수성·자동화·장기 지속가능성을 기준으로 판단한다.

**Storybook 이 원천이고, 나머지는 전부 그 소비자다.**
