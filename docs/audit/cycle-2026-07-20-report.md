# 사이클 보고 — 2026-07-20

감사(`ssot-audit-2026-07-20.md`) 이후 실행한 트랙들의 결과와 **오너 검수 항목**을 담는다.

프로세스 규약은 `docs/architecture/work-cycle.md`, 단 순서는 `docs/architecture/ssot-pipeline.md`.

---

## 사이클 2 — DS 승격 · 분류표 정리 (요약)

| 지표 | 사이클 1 종료 | 사이클 2 종료 |
|---|---|---|
| **분류표 커버리지** | 41/286 = 14.3% | **45/275 = 16.4%** |
| 분류표 고유 key | 274 (중복 12) | **275 (중복 0)** |
| 계약 | 44 | **48** |
| DS 컴포넌트 스토리 | 45 | **49** |
| MDX | 45 | **49** |

**승격 4종** — Skeleton · Spinner · Menu · Stepper. 전부 실물이 Admin 에 있던 것이라 창작이 아니라 이동이다.

| 대상 | 중복 | 결과 |
|---|---|---|
| `SkeletonRows` | 9벌 · 시그니처 3종 | **1벌 · 1종** (`{rows, cols}`) |
| Spinner | Button 안 비공개 | 공개 atom |
| Menu | 4구현 (a11y 갈라짐) | **1벌** — 약한 쪽 기준 **+4축**, 강한 쪽 기준 **+2축**, 퇴행 0 |
| Stepper | 2구현 (차이 14줄 전부 도메인 명칭) | **1벌** + `aria-current="step"` 신설 |

Stepper 는 양쪽 모두 `aria-current` 가 없어 **진행 상태가 색·굵기로만 전달되고 비시각 사용자에게는 전혀 전달되지 않았다** — 승격이 a11y 결함을 하나 해소했다.

### 이 사이클이 뒤집은 전제

- **`variantProperties` 는 죽은 필드가 아니었다.** 소비자 7곳(`component-spec.ts:48` 필수 필드 · `ui.html:662` 계약 판별 조건 · `generate-figma-manifest.ts:108` 없으면 throw 등). **지웠다면 플러그인이 44개 파일을 계약으로 인식하지 못하고 codegen 이 실패했다.** 상류 전제를 검증 없이 다음 단에 넘긴 것이 원인이었고, 지시서의 "먼저 소비자가 없는지 확인하고 있으면 멈춰라" 조항이 막았다.
- **"배선만 하면 되는 5건" 은 배선 대상이 아니었다.** `generate-taxonomy.ts:77` 의 `resolve()` 가 카테고리로 계약을 거르므로, 한 key 가 두 카테고리에 걸치면 **나머지 행은 어떤 계약으로도 채울 수 없다.** 유령 행이었고 정본 행은 이미 배선돼 있었다 — 신규 배선 **0건**으로 해소.
- **실제 중복은 7건이 아니라 12건이었다.**
- **`ModePicker`·`VariableMenu` 는 Menu 가 아니다.** 전자는 `menuitemradio` 단일 선택 + 팝업 안에 항목 아닌 것들이 공존, 후자는 33줄 위치 지정 껍데기이고 실체는 검색·트리 picker 로 **`role=` 이 0건**이다. 감사표가 이 둘을 Menu 후보로 올린 것은 오진이었다.

### 신설한 게이트

`taxonomy-key-unique` · `summary-truncation` (`tools/codegen/src/validate-contract.ts`). 둘 다 되돌려 재실패 확인(12위반·6위반 재현).

요약 절단도 함께 고쳤다 — 상한 80 → 160 **그리고 어절 경계 절단**. 상한만 올리면 더 긴 문장에서 재발하므로 절단 기구 자체를 고쳤다. 잘린 요약 9건 → **0건**.

### 사이클 2 게이트

```
validate:contracts   계약 48건 통과 ✔
codegen:check        생성물 199건 최신 ✔
contract-test        PASS 48 · FAIL 0 · SKIP 0
typecheck            14/14
lint                 2/2 (경고 0)
format:check         All matched files use Prettier code style!
sb:build             ✓
apps/admin  test     117/117 files · 1697/1697 tests
packages/ui test     50/51 files · 515/516 — 실패 1건은 부하 의존(아래)
```

`RichTextField.test.tsx` 1건은 **격리 실행 3회 연속 35/35 통과**하고 전체 스위트에서만 깨진다. 지연 로드 청크를 기다리는 `waitFor`(`:209`)가 병렬 부하에서 타임아웃한다 — 코드 결함이 아니라 검사의 부채다. `work-cycle.md` §6 에 실측과 함께 기록했다.

### 사이클 2 미해결 (다음 단으로)

- **Skeleton 승격은 절반이다.** `tds-ui-skeleton` 을 쓰는 프로덕션 파일이 **21개** 남아 있다(상세·폼·통계 화면의 본문 자리표시). 그래서 `shared/ui/ui.css` 의 원본 클래스를 지우지 않고 두 클래스를 공존시켰다. 21곳 이관이 끝나야 원본을 지울 수 있다.
- **10번째 스켈레톤 격자** — `CrudTable.tsx:298` 에 익명 인라인으로 있어 `grep "function SkeletonRows"` 에 안 잡혔다. `<SkeletonRows rows={5} cols={totalCols} />` 로 바로 대체 가능하다.
- **DS 내부 세 번째 스켈레톤** — `ListCard.css:41` 의 `.tds-listcard__skeleton`. Skeleton 으로 흡수할 후보.
- **Button 렌더가 바이트 동일하지 않다.** 클래스가 `tds-button__spinner` → `tds-spinner tds-spinner--inherit` 로 바뀌었다. 공유 atom 이 Button 네임스페이스 클래스를 낼 수는 없으므로 원리적으로 불가피하다. 토큰·`1em`·`currentColor` 를 전부 승계해 **픽셀은 동일**하나 **VRT 로 확정하지 않았다.**
- **`--tds-shadow-md` 는 존재하지 않는 토큰이다.** 삭제한 `IntegrationOverflowMenu.tsx:61` 이 이걸 참조하고 있었다 — **그림자가 조용히 안 그려지고 있었다.** 어드민 인라인 스타일은 TokenGuard 대상이 아니라 아무도 못 잡았다. 실제 이름은 `shadow.overlay`·`raised`·`modal`·`sticky` 4종. **같은 부류의 죽은 var 이 더 있을 수 있고 검사 축이 없다.**
- **계약 스키마 `anatomyStyles` 에 `effect` 키가 없다** — shadow 토큰을 `anatomy` 에 바인딩할 수 없어 Figma 로 그림자가 전달되지 않는다(감사 §8 "shadow 12건 미매핑" 과 같은 뿌리).
- **`taxonomy/taxonomy.v1.json` 의 `$schema` 가 죽은 참조다** (`./schemas/taxonomy.v1.json` 부재). 신설한 `taxonomy-key-unique` 가 현재 이 파일의 유일한 구조 검사다.
- **`loading` 분류 키를 비워 뒀다.** Skeleton + Spinner 로 덮이고, 일반 Loading 컴포넌트를 요구하는 호출부가 리포 전체에 0건이다. `Feedback` 에 `progress`·`progress-circle` 이 따로 있어 `loading` 이 그 우산 이름일 가능성 — **제품 판단 대기.**
- **`ModePicker.tsx:287`** 의 `"AI 모델 연동 설정 열기"` 링크 라벨이 nav 라벨 변경(`API Key 설정`)을 따라가지 않았다.
- **`tds-pages.json` 재생성** — nav 라벨을 바꿨으므로 파생물 갱신 필요.

---

---

## 1. 최종 게이트 — 전부 초록

```
format:check          All matched files use Prettier code style!
typecheck             14/14 successful
lint                  2/2 successful (경고 0)
validate:contracts    계약 44건 검증 통과 ✔
codegen:check         생성물 183건 모두 최신 상태 ✔
contract-test         계약 44건 — PASS 44 · FAIL 0 · SKIP 0
sb:build              ✓ built in 17.54s
apps/admin  test      Test Files 117 passed (117) · Tests 1697 passed (1697)
packages/ui test      Test Files  47 passed  (47) · Tests  468 passed  (468)
```

착수 시점 상태와의 대비:

| 게이트 | 착수 시 | 지금 |
|---|---|---|
| `format:check` | **18파일 실패** | 통과 |
| `apps/admin` test | 6 files / 13~22 tests 실패 (요동) | **117/117 · 1697/1697** |
| `packages/ui` test | `RichTextField` 1~2건 실패 (flaky) | **47/47 · 468/468** |
| `contract-test` a11y-role 축 | 검사 자체가 없음 | PASS 44 · FAIL 0 |

---

## 2. 트랙별 결과

| 트랙 | 산출 | 검사 |
|---|---|---|
| Admin CTA 게이팅 (비마케팅) | 12 화면 | 신규 24건 · 되돌려 재실패 확인 |
| Admin CTA + 발송 게이팅 (마케팅) | 7 화면 + 어댑터 3 | 신규 12건 · 되돌려 재실패 2건 |
| a11y role 결함 + 게이트 신설 | 4건 수정 + `axes/react.ts` 축 | 되돌려 재실패 확인 |
| Figma 타이포 배관 | 어댑터 굵기 배선 | 505 → **515** · 되돌려 재실패 4건 |
| Storybook 축 | RTL 6 · Responsive 10 · Playground 14 · a11y 2 | 브라우저 실측 |
| MDX 문서화 | **45 / 45** | `sb:build` 통과 |
| 계약 산문 정정 | STALE 2건 + MDX 2건 | codegen 5건 재생성 |
| ColorField 회귀 (아래 §3) | 1건 | 신규 1건 · 되돌려 재실패 확인 |

### 축 커버리지 변화

| 축 | 감사 시점 | 지금 |
|---|---|---|
| MDX | **0 / 47** | **45 / 45** |
| RTL | 39 / 45 | **45 / 45** |
| Responsive | 0 / 91 | 10 컴포넌트 |
| Playground | 0 / 91 | 14 컴포넌트 |
| A11y 스토리 파라미터 | 0 / 45 | 2 (포털 2건만 — 아래 근거) |

Responsive·Playground·a11y 를 전수 적용하지 않은 것은 **의도된 판단**이다.

- **Responsive** — 폭 기반 `@media` 는 리포 전체 **0건**이다. 실제 폭 의존은 `overflow-x:auto`(DataTable) · `auto-fill minmax()`(ImageGalleryField) · `flex-wrap`(6종) · viewBox 스케일(LineAreaChart) · `inline-size:100%`(Modal) 뿐이라 그 10개만 넣었다.
- **Playground** — 컨트롤 8개 이상인 14개. 2~4개짜리는 Default+Controls 로 이미 한눈에 보이므로 필러가 된다.
- **A11y 파라미터** — **규칙을 끄는 파라미터는 한 건도 넣지 않았다.** `tools/a11y` 는 story parameters 를 읽지 않고 Playwright 로 axe 를 직접 주입하므로, 규칙을 끄면 **패널만 초록이 되고 게이트는 빨간** 상태가 된다. 넣은 2건(Modal · ConfirmDialog)은 규칙을 끄는 것이 아니라 포털로 `#storybook-root` 밖에 렌더되는 다이얼로그를 검사 **범위에 넣는** 것이다.

---

## 3. 이번 사이클이 만든 회귀 — 잡아서 고쳤다

**`ColorField` 접근 가능 이름 중복.** a11y role 트랙이 계약 `role:"group"` 을 충족시키려고 컨테이너에 `aria-label={label}` 을 추가했는데, 같은 계약의 `a11y.aria.label` 이 이미 그 이름을 hex 입력에 배정하고 **"이름이 갈려야 어느 쪽에 있는지 알 수 있다"** 고 못박고 있었다. 접근 가능 이름이 둘이 되어 `apps/admin` 소비처가 깨졌다 (`EmailBuilder.test.tsx` `getByLabelText('바깥 배경색')` 2건 매치).

**두 작업자 모두 놓친 이유**: a11y 담당은 `packages/ui` 테스트만 돌렸고, 마케팅 담당은 자기 변경만 대조해 "선재 결함" 으로 분류했다. **패키지 경계를 넘는 회귀라 각자의 시야에 들어오지 않았다.**

처방: 그룹에서 `aria-label` 을 제거했다(이름 없는 `role="group"` 은 유효하며 경계만 알린다 — FileChip 과 같은 처리). 그리고 **소비처가 실제로 쓰는 조회 방식으로 검사를 추가**했다. 기존 검사는 `getByRole('textbox', {name})` 으로 역할을 좁혀 조회해 group 과의 충돌을 구조적으로 잡지 못했다.

**교훈 — 다음 사이클의 규칙으로 삼는다: 공유 패키지(`packages/ui`)를 고쳤으면 소비처(`apps/admin`) 테스트를 반드시 함께 돌린다.** 루트 `pnpm test` 는 `@tds/ui` 에서 멈추면 admin 을 아예 실행하지 않으므로 초록을 봐도 증거가 되지 않는다.

---

## 4. 오너 검수 항목

에이전트가 **원리적으로 확인 불가능한 것**만 모았다. 나머지는 전부 위 게이트로 증명됐다.

### 4.1 Figma — 플러그인 실행 (최우선)

`networkAccess: none` 이라 플러그인이 리포를 읽지 못한다. 오퍼레이터가 44개 파일을 수동 업로드해야 한다.
실행 순서: **① Variables → ② Component Set → ③ TDS 문서.** ②를 건너뛰고 ③만 돌리면 "검사 기록 없음" 이 뜨는데 이는 버그가 아니다.

| # | 확인할 것 | 기대 | 어긋나면 |
|---|---|---|---|
| 1 | **Button · Badge · StatsCard 라벨이 굵어 보이는가** | 계약이 600·700 을 말하는 레이어가 Semi Bold/Bold | **이번 작업의 핵심 판정 항목.** 전부 Regular 면 `ctx.fonts` 전달이 끊긴 것 |
| 2 | 텍스트 레이어 선택 시 폰트 패널 | Regular · Medium · Semi Bold · Bold 가 섞여 나타남 | 수정 전에는 전부 Regular 였다 |
| 3 | ② 실행 로그의 `[바인딩 실패] …fontWeight` | **0건** | 그 굵기 스타일이 파일에 미설치 — 로그의 폰트 이름을 `fonts.ts` `PRIMARY_FAMILIES` 에 추가 |
| 4 | ② 로그의 `unloaded font` 중단 | 0건, 44/44 조립 | `Pretendard SemiBold`(공백 없음) 주의 |
| 5 | Icon 세트 59종이 서로 다른 글리프인가 | 236 변형 = 59 도형 | 전부 같으면 자산 표 전달 끊김 (테스트는 통과 중이므로 목/실행 괴리) |
| 6 | **Pagination · RowActions 버튼 테두리** | **보이지 않는 것이 정상** | 보여야 한다면 **계약 결함** — `borderWidth` 만 있고 `stroke` 가 없다. 플러그인 수정으로 해결 안 됨 |

**알려진 실행 실패 1순위**: 무료 Figma 플랜은 컬렉션당 1모드다. dark 모드 `addMode` 가 throw 한다 (`main.ts:150`).

**계약 수정 후 재실행해야 사라지는 것** (지금 실행에서는 그대로 보인다): `HelpTip` 의 `ⓘ`, `ImageGalleryField` 의 `×`, `RichTextField` 툴바의 `•` `🔗` `⌫` 가 텍스트로 남아 있다.

### 4.2 Storybook — 시각 판정

`pnpm sb` → http://localhost:6006

| # | 확인할 것 | 비고 |
|---|---|---|
| 1 | Docs 페이지 45개의 렌더 | 빌드 성공 ≠ 렌더 정상 |
| 2 | Button · Icon · TextField Docs 의 스크롤 길이·성능 | `<Story>` 20개 이상 실린 페이지 |
| 3 | Responsive 스토리 10건이 360px 에서 보기 좋은가 | 폭이 적용된다는 것만 실측됨 |
| 4 | RTL 6건의 아랍어 카피 적절성 | 기존 39건 패턴을 따랐을 뿐 원어민 검수 아님 |

### 4.3 접근성 — 스크린리더

`ColorField` · `DateRangeField` · `FileChip` 의 group 경계·이름 낭독 (NVDA / VoiceOver).

### 4.4 제품 판단이 필요한 것

| # | 항목 | 선택지 |
|---|---|---|
| 1 | **행별 편집 어포던스** | 발송완료 행의 연필 아이콘이 여전히 보인다. 눌러도 동작은 막히지만 **어포던스가 거짓말을 한다.** `CrudTable` 의 `canUpdate` 가 표 전체 단위라 행별 손잡이가 없다 — `canEditRow?: (item) => boolean` 을 껍데기에 추가할지 |
| 2 | **`/new` deep-link** | 등록 버튼을 가려도 폼 라우트는 열린다. `RequirePermission` 이 read 만 본다. 라우트 가드를 추가할지 |
| 3 | `sendActionsFor` 의 `canCancel`·`canDelete` | 소비자 0. 이번에 고친 결함(`isEditableSend` 소비자 0)과 **같은 형태**다. UI 에 배선할지 걷어낼지 |
| 4 | raw `<table>` 27건 | 전부 공유 `tableStyle` 을 써 시각 divergence 는 없다. `DataTable` 이관 비용 대비 편익 미계산 |

---

## 5. 남은 작업

순서는 오너 승인 완료. **8번(Figma 전량 재생성)은 Storybook ↔ Admin 100% 동기화 이후에만 착수한다.**

| # | 작업 | 상태 |
|---|---|---|
| 1 | Storybook 컴포넌트 축 | ✅ 완료 |
| 2 | a11y role 결함 + 게이트 | ✅ 완료 |
| 3 | 발송 플로우 게이팅 | ✅ 완료 |
| 4 | **DS 승격 — Menu · Stepper · FilterPanel 계약 신설 → 구현 → 스토리** | 다음 |
| 5 | **Storybook 페이지 129 신규 + 3 재작성** | 최대 물량 |
| 6 | templates 계층 (현재 0) | |
| 7 | `/new` deep-link 게이팅 | 오너 판단 대기 |
| 8 | **여기서 계약이 굳는다 → Figma 전량 재생성** | 4~7 완료 후 |
| 9 | 오너 Figma 실행 검수 | |
| 10 | VRT 기준 이미지 (13/646) → 문서 → 커밋 · PR | |

### 동기화 완료 판정 기준

"됐다고 치고" 넘어가지 않도록 못박는다.

| 조건 | 현재 | 완료 기준 |
|---|---|---|
| **23모듈 분류표** | **41 / 286 = 14.3%** | 286/286 |
| Admin 이 쓰는 UI 가 전부 계약에 있다 | Sidebar · Header · Menu · Stepper · FilterPanel 등 누락 | 차집합 0 |
| 계약 44개끼리 1:1 | 44/45 = 97.8% | 신규 포함 전량 1:1 |
| **페이지** | **0 / 132** | 129 신규 + 3 재작성, **DS 조립 확인** |
| templates 계층 | 0 | 실체 존재 |

### 분모를 혼동하지 마라 — 이 보고서가 실제로 저지른 실수다

**"동기화율 97.8%" 는 계약 44개끼리의 1:1 비율이지 커버리지가 아니다.** 분모가 44지 286이 아니다. 이 숫자를 진척으로 읽으면 실제 14.3% 를 97.8% 로 **7배 부풀려 보고**하게 된다 — 2026-07-20 사이클에서 실제로 그렇게 보고했고 오너가 카탈로그의 "미구현" 표시를 보고 지적해 드러났다.

두 숫자는 다른 것을 잰다:

| 지표 | 분모 | 뜻 |
|---|---|---|
| 44/45 = 97.8% | 계약에 등재된 것 | **등재된 것끼리** 계약·구현·스토리·Figma 가 어긋나지 않는가 |
| **41/286 = 14.3%** | 23모듈 분류표 전체 | **만들어야 할 것 중 얼마나 만들었는가** |

진척 보고에는 **후자를 쓴다.** 전자는 "이미 만든 것이 서로 맞는가" 라는 별개의 질문이다.

### 원지침이 245건을 요구한다 — 범위 밖이 아니다

- **§4 자동 생성** — "누락된 컴포넌트는 Admin 에서 아직 사용하지 않더라도 **무조건 생성한다.** 절대 '사용하지 않으므로 생략' 이라는 판단을 하지 않는다."
- **§9 누락 금지** — "'미구현' 표시" 금지. 지금 카탈로그에 뜨는 **미구현 245건이 그 자체로 §9 위반**이다.
- §5 구현 범위가 Navigation(Header·Navbar·Sidebar·Bottom Navigation·Breadcrumb·Stepper) · Layout · Authentication · Commerce · Chat · Charts · Mobile · **한국어 컴포넌트 17종**을 명시 열거한다.

### 감사가 AppShell 을 놓쳤다

B단(Admin 로컬 컴포넌트) 감사가 Menu · Stepper · FilterPanel 은 찾았으나 **Sidebar · Header 를 놓쳤다.** 실물이 `apps/admin/src/shared/layout/AppShell.tsx:507`(`<aside>`) · `:512`(`<nav aria-label="주 내비게이션">`) · `AppHeader.tsx` 에 약 700줄로 존재한다.

원인: 그 감사자가 스캔 대상을 `shared/ui/` · `components/` · `_shared/` 로 잡아 **`shared/layout/` 이 패턴에서 빠졌다.** 그리고 스스로 "140개 로컬 컴포넌트 중 정독은 12개뿐" 이라고 미확인에 적어 뒀다 — 미확인 칸이 이번에도 제 역할을 했다.

---

## 6. 넘겨받았으나 이번 사이클에서 처리하지 않은 것

소유권 밖이라 기록만 하고 전달한다 (`ssot-pipeline.md` §4).

1. **`known-violations.json` 의 storyId 4건이 stale** — 23모듈 분류 개편(HEAD `a91b288`)의 title 개명 때문이다. `atoms-card--dark-theme` → 실제 `data-display-card--dark-theme` 등. **`pnpm a11y` 가 빨간 진짜 이유**이며 이번 작업과 무관하다.
2. **Modal · ConfirmDialog 의 `DarkTheme` 스토리가 실제로는 라이트로 렌더된다.** Radix `Dialog.Portal` 이 `document.body` 에 붙어 데코레이터의 `<div data-theme="dark">` 가 조상이 아니다(브라우저 실측). 다크 축이 45/45 로 집계되지만 그중 2건은 **거짓 초록**이다. 대비가 통과하므로 a11y 게이트가 원리적으로 잡지 못한다. 고치면 픽셀이 바뀌어 VRT 기준 이미지를 무효화하므로 VRT 단과 함께 처리해야 한다.
3. **`packages/ui/pages/_data/pages.ts` 가 정본에서 표류.** 없는 화면 5개(`/reservations` 4 + `/settings/languages`)를 광고하고 실재하는 `/ai/chat` · `/ai/conversations` 를 누락한다. eslint `banApps` 로 import 가 구조적으로 금지돼 **CI 가 원리적으로 못 잡는다** — 값 대조 스크립트가 필요하다.
4. **specs 7개 파일이 사실과 다르다** — `newsletters/BE-033:221,234,303` · `FS-033:166,201` · `NFR-033:160,187` · `sms/FS-034:231` · `NFR-034:26,73,85,95,97,196,247` · `email/FS-035:240`. ⑦ 문서화 단에서 처리.
5. **`pnpm lint` 이 도는 곳은 2/14 패키지뿐.** `@tds/ui` · `@tds/admin` 만 lint 스크립트를 가진다. figma-plugin 은 `main.ts` 576줄 · `tds-doc.ts` 2582줄인데 린트를 한 번도 통과한 적이 없다. **"lint 2/2 successful" 이 초록인 것은 12개를 건너뛴 결과다.**
6. **`taxonomyItem` 누락 9건** — TriStateCheckbox · ImageGalleryField · RichTextField · RowActions · RowSelectCell · SelectAllHeaderCell · SelectionBar · ListCard · TodoCard.
7. **P1 45건 · P2 28건 목록이 존재하지 않는다.** 이전 감사 산출물이 코드 주석으로만 남았다 (`CrudListShell.tsx:110-111`). 재작성 필요.

---

## 7. 미확인 — 비워 두지 않는다

- **Figma 플러그인을 실행하지 않았다.** §4.1 전부 미확인.
- **브라우저 시각 판정을 하지 않았다.** Docs 45개·Responsive 10건의 렌더 정확성 미확인. `sb:build` 성공은 빌드 성공이지 렌더 정확성이 아니다.
- **`pnpm a11y` · VRT · e2e 를 돌리지 않았다.** a11y 는 §6-1 때문에 지금 빨갛고, VRT 는 신규 스토리 24건의 기준 이미지가 없다.
- **`pnpm verify:all` 전체를 마지막에 돌리지 않았다.** 개별 게이트는 전부 초록이나 통합 실행은 미확인.
- 나머지 33개 계약의 산문은 키워드 미검출이라 전수 정독하지 않았다 — **키워드에 안 걸리는 스테일 주장이 있을 수 있다.**
- 262개 페이지 tsx 각각이 라우트에 닿는지 전수 대조하지 않았다 — **"고아 페이지 0건" 은 주장하지 않는다.**
- 140개 Admin 로컬 컴포넌트 중 정독은 12개뿐이다. "도메인 조립체이므로 정상" 은 **표본 판정**이다.
