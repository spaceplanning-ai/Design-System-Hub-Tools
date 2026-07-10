# 디자인시스템 플랫폼 v2 — 하네스 프롬프트 통합본 (고도화)

> **v1 문서(PROMPT_BUNDLE.md)의 확장판.** v1의 W0~W15(프레임워크 쇼케이스 + Figma 기본 연동)를 Phase 1로 유지하고,
> 본 문서는 Phase 2 — **토큰 기반 디자인시스템 + 커스텀 Figma 플러그인 + 완전 양방향 동기화 + TDS풍 문서 사이트**를 추가한다.
>
> 각 하네스는 **정해진 규칙만 따르고 창작하지 않는다.** 명세에 없는 것은 만들지 않으며, 모호하면 중단·보고한다.
>
> 실행 순서: `Phase 1(W0~W15) → T1 → T2 → D1 → (D2, D3 병렬) → P1 → P2 → P3 → P4 → P5 → G1 → G2 → V1`

---

## 목차

- §0 공통 규칙 v2 (모든 하네스 필수 선행)
- §1 아키텍처 개요 — 단일 소스 원칙(SSOT)
- §2 양방향 동기화 매트릭스 (무엇이 어느 채널로 오가는가)
- §3 매핑 규약 — Storybook args ↔ Figma Component Properties
- §4 오케스트레이터 v2 프롬프트
- §5 하네스 T1 — 디자인 토큰 시스템 (3 프리셋: Bootstrap / Tailwind / TOSS)
- §6 하네스 T2 — 테마 스위처 (Storybook 툴바 + ThemeScope)
- §7 하네스 D1 — DS 코어 컴포넌트 (매핑 규약 준수 args)
- §8 하네스 D2 — 소셜 로그인 버튼 (Kakao / Google / Facebook / Naver + OAuth 스코프)
- §9 하네스 D3 — Chart.js 차트 (토큰 연동)
- §10 하네스 P1 — Figma 플러그인 스캐폴딩 + UI 폼 스펙
- §11 하네스 P2 — 플러그인: 토큰 → Figma Variables / Text Styles 생성
- §12 하네스 P3 — 플러그인: 컴포넌트 생성 (Variants·Text·Boolean·Instance Swap·Slot)
- §13 하네스 P4 — 플러그인: 문서 페이지 생성 (docs-content.json → Figma 페이지 미러링)
- §14 하네스 P5 — 토큰 양방향 동기화 (Import / Export / 원격 Pull)
- §15 하네스 G1 — TDS풍 문서 사이트 (Storybook 테마·정보 구조)
- §16 하네스 G2 — 컴포넌트 양방향 연동 규약 (story.to.design / Storybook Connect / addon-designs)
- §17 하네스 V1 — 통합 검증 v2
- 부록 A2 — 고정 버전표 (v1 부록 A에 추가)
- 부록 B2 — 파일 트리 v2
- 부록 C — tokens.json 스키마 + 3 프리셋 고정값
- 부록 D — docs-content.json 스키마
- 부록 E — OAuth 스코프 & 소셜 브랜드 규정표
- 부록 F — 양방향 동기화의 현실적 한계 (반드시 문서에 고지)

---

## §0 공통 규칙 v2 (모든 하네스 필수 선행)

v1 §0의 10개 항을 그대로 포함하고, 아래 5개 항을 **추가**한다.

```
[공통 규칙 v2 — v1 10항 + 아래 추가 항 모두 준수]
11. 단일 소스(SSOT): 색·타이포·간격 값은 오직 tokens/ 폴더의 JSON에서만 나온다.
    컴포넌트/스토리/플러그인/문서 어디에도 hex·px 리터럴을 직접 쓰지 않는다.
    (예외: tokens JSON 자신, 그리고 부록 E의 소셜 브랜드 컬러 — 브랜드 규정상 토큰화하되 값 변경 금지)
12. 문서 단일 소스: 가이드 문서의 페이지 구성·문구는 오직 docs/docs-content.json 에서만 나온다.
    Storybook MDX와 Figma 문서 페이지 생성기는 같은 JSON을 읽는다. 문구를 코드에 하드코딩하지 않는다.
13. 매핑 규약 준수: 모든 DS 컴포넌트의 props 이름·타입은 §3 매핑 규약을 따른다.
    Figma 플러그인이 생성하는 컴포넌트 속성 이름은 Storybook args 이름과 문자열까지 동일해야 한다.
14. 브랜드 규정: 소셜 로그인 버튼의 색·문구는 부록 E의 값에서 절대 변경하지 않는다.
15. 플러그인 안전성: Figma 플러그인은 생성 전 기존 산출물(같은 이름의 페이지/컬렉션/컴포넌트)이
    있으면 덮어쓰지 않고 "이미 존재" 경고를 UI에 표시하고 중단한다. 삭제는 절대 하지 않는다.
```

---

## §1 아키텍처 개요 — 단일 소스 원칙(SSOT)

```
                ┌─────────────────────────────┐
                │   tokens/  (JSON, SSOT #1)   │  color·typography·radius·spacing
                │   bootstrap.json / tailwind. │  × 3 프리셋
                │   json / toss.json           │
                └──────┬──────────────┬────────┘
        Style Dictionary│              │Figma 플러그인(P2)이 로드
                        ▼              ▼
        ┌────────────────────┐   ┌──────────────────────────┐
        │ 코드 산출물          │   │ Figma 산출물               │
        │ - css/vars-*.css    │   │ - Variables 컬렉션          │
        │ - src/tokens/       │   │   "DS Color"(3 modes)      │
        │   types.ts (TS 타입) │   │ - Text Styles              │
        │   theme.ts          │   │ - 컴포넌트(P3)·문서 페이지(P4) │
        └─────────┬──────────┘   └──────────┬───────────────┘
                  ▼                          │
        ┌────────────────────┐               │
        │ Storybook           │◀── addon-designs(Design 탭 임베드)
        │ - DS 컴포넌트(D1~D3) │──▶ Chromatic ──▶ story.to.design / Storybook Connect
        │ - TDS풍 문서(G1)     │               (스토리·args → Figma variants·properties)
        └────────────────────┘
                  ▲
                  │ P5: Figma에서 수정된 Variables → tokens.json 재수출(역방향)
                  └───────────────────────────────────────────────
        docs/docs-content.json (SSOT #2) → Storybook MDX(G1) + Figma 문서 페이지(P4) 양쪽 생성
```

핵심: **코드와 Figma 어느 쪽도 "원본"이 아니다. 원본은 tokens JSON과 docs-content JSON이며,
양쪽은 각각의 생성기를 통해 그 원본을 소비하거나(정방향), 원본을 갱신한다(역방향).**

---

## §2 양방향 동기화 매트릭스

각 자산이 어떤 채널로 오가는지 고정한다. 하네스는 이 표 밖의 동기화 수단을 도입하지 않는다.

| 자산 | 코드 → Figma (정방향) | Figma → 코드 (역방향) | 비고 |
|---|---|---|---|
| 컬러/타이포 토큰 | 플러그인 P2가 tokens.json을 읽어 Variables·Text Styles 생성 | 플러그인 P5가 Variables를 tokens.json으로 export → repo 커밋 | 완전 양방향 |
| 스타일 프리셋(3종) | Variables 컬렉션의 **modes** (bootstrap/tailwind/toss) | mode 값 수정 → P5 export | 완전 양방향 |
| 컴포넌트 구조·variants | Chromatic 배포 → **story.to.design**이 stories/args를 Figma 컴포넌트·속성으로 import | Figma 프레임 링크 → **addon-designs** Design 탭 임베드(참조) + 디자이너 변경은 토큰 경유로만 코드 반영 | 구조 편집의 역방향 자동화는 불가(부록 F) |
| 스토리 ↔ Figma 링크 | **Storybook Connect**로 story-컴포넌트 링크 | 링크된 Figma 상태를 Storybook Design 탭에서 확인 | 상호 참조 |
| 문서 페이지 | P4가 docs-content.json → Figma 페이지 생성 | 문서 수정은 JSON 수정으로만(양쪽 재생성) | SSOT 원칙 |
| 차트(Chart.js) | 차트 스토리 → story.to.design 스냅샷 import | 색상만 토큰 경유 역방향. 데이터·형태는 역방향 불가(부록 F) | 부분 양방향 |

---

## §3 매핑 규약 — Storybook args ↔ Figma Component Properties

**이 표는 프로젝트 전체의 법이다.** D1~D3의 props 설계와 P3의 속성 생성이 모두 이 표를 따른다.
story.to.design이 args를 Figma 속성으로 자동 변환할 때 이 규약 덕분에 1:1 대응이 유지된다.

| Storybook arg 타입 | Storybook control | Figma 속성 종류 | 네이밍 규칙 | 예시 |
|---|---|---|---|---|
| union 문자열 (시각 변형) | select | **Variant property** | camelCase, 값도 동일 문자열 | `variant: 'primary' \| 'secondary' \| 'error' \| 'success'` |
| boolean — 스타일이 바뀌는 상태 | boolean | **Variant property** (`true`/`false`) | `disabled`, `selected` | `disabled: boolean` |
| boolean — 레이어 표시/숨김 | boolean | **Boolean property** (레이어 visibility 바인딩) | `show` 접두사 | `showIcon`, `showBadge` |
| string — 표시 텍스트 | text | **Text property** (텍스트 노드 바인딩) | 의미 명사 | `label`, `description` |
| ReactNode — 아이콘 자리 | (스토리에서 고정 예시) | **Instance swap property** (+ preferredValues) | `icon`, `leftIcon`, `rightIcon` | `icon?: ReactNode` |
| children — 자유 콘텐츠 영역 | (스토리에서 고정 예시) | **Slot** = 오토레이아웃 컨테이너 + `content` instance swap. 스왑 대상으로 `_Slot/Placeholder` 컴포넌트 지정 | `children` ↔ `content` | Card 본문 |

추가 규칙:
1. Figma 컴포넌트 이름은 `DS/<컴포넌트명>` (예: `DS/Button`). Storybook title은 `3. 컴포넌트/<컴포넌트명>`.
2. variant 축 순서 고정: `variant` → `size` → `disabled` (Figma 속성 패널 순서 일치).
3. 슬롯용 플레이스홀더 컴포넌트는 `_Slot/Placeholder` 이름으로 P3가 1회 생성(회색 점선 박스 + "Slot" 라벨).
4. 코드에서 시각 상태를 CSS로만 처리하더라도, Figma에는 반드시 대응 variant를 만든다(디자이너가 상태를 볼 수 있어야 함).

---

## §4 오케스트레이터 v2 프롬프트

```
[역할] 너는 이 프로젝트의 오케스트레이터다. 직접 코드를 작성하지 않는다.

[선행] Phase 1(v1 문서 W0~W15)이 완료된 리포지토리에서 시작한다. 미완료면 v1부터 실행시킨다.

[진행 규칙]
- 순서: T1 → T2 → D1 → (D2, D3 병렬) → P1 → P2 → P3 → P4 → P5 → G1 → G2 → V1.
- 의존성 게이트:
  * T1 통과 전 어떤 D/P 하네스도 시작 금지 (토큰이 SSOT이므로).
  * D1 통과 전 P3 시작 금지 (Figma 속성 이름이 D1 args에서 나오므로).
  * docs-content.json(G1의 1단계 산출물)이 없으면 P4 시작 금지.
- 각 하네스 종료 시 해당 §의 [완료 조건]을 점검하고, 실패 시 결함 목록과 함께 재실행.
- §3 매핑 규약 위반(이름 불일치 1건이라도)은 즉시 반려한다.
- 어떤 하네스에게도 범위 확장(컴포넌트·프리셋·프로바이더 추가)을 승인하지 않는다.

[완료 선언] V1의 검증표가 전부 PASS일 때만 완료를 선언한다.
```

---

## §5 하네스 T1 — 디자인 토큰 시스템

```
[목표] 3개 스타일 프리셋(bootstrap / tailwind / toss)의 토큰 JSON과,
이를 CSS 변수·TypeScript 타입으로 컴파일하는 빌드를 만든다.

[할 일]
1. tokens/ 폴더에 부록 C의 세 파일을 "그 값 그대로" 생성:
   tokens/bootstrap.json, tokens/tailwind.json, tokens/toss.json
   (구조·키·값 모두 부록 C 고정. 창작 금지.)
2. devDep 추가: style-dictionary (부록 A2 버전).
3. scripts/build-tokens.mjs 작성 — 각 프리셋 JSON을 읽어 아래 산출물 생성:
   a) src/tokens/generated/vars-<preset>.css
      형식: :root[data-theme='<preset>'] { --ds-color-primary: #...; --ds-font-family: ...; ... }
      변수 네이밍: --ds-<category>-<key> (예: --ds-color-error, --ds-font-size-lg)
   b) src/tokens/generated/types.ts — 아래 타입을 "토큰 JSON 키에서" 생성:
        export type StylePreset = 'bootstrap' | 'tailwind' | 'toss'
        export type ColorToken = 'primary' | 'secondary' | 'error' | 'success' | 'bg' | 'text'
        export type FontSizeToken = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
        export const presets: Record<StylePreset, DesignTokens>  // JSON 값 임베드
   c) src/tokens/generated/theme.ts — CSS 변수명 헬퍼:
        export const cssVar = (t: ColorToken) => `var(--ds-color-${t})`
4. package.json scripts: "build:tokens": "node scripts/build-tokens.mjs"
5. `pnpm build:tokens` 실행, 산출물 커밋. build-storybook 선행 스크립트에 build:tokens 포함:
   "build-storybook": "pnpm build:tokens && pnpm build:tw && storybook build"

[금지] 컴포넌트에서 presets 객체를 직접 import해 hex를 쓰는 것(런타임 테마 전환이 깨짐).
컴포넌트는 오직 CSS 변수(--ds-*)만 참조한다.

[완료 조건]
- 3개 CSS 파일에 프리셋당 동일한 변수 세트 존재(diff로 키 목록 동일 확인).
- types.ts 의 유니온 타입이 JSON 키와 일치. tsc 통과.
```

---

## §6 하네스 T2 — 테마 스위처

```
[목표] Storybook 툴바에서 프리셋(bootstrap/tailwind/toss)을 전환하면
모든 DS 컴포넌트·차트·문서가 해당 토큰으로 다시 그려지게 한다.

[할 일]
1. src/shared/ThemeScope.tsx 생성:
   - props: { preset: StylePreset; children: ReactNode }
   - <div data-theme={preset}> 로 감싸고, generated/vars-*.css 3개를 import (전역 import 허용 —
     :root[data-theme=...] 스코프라 프레임워크 CSS와 충돌하지 않음. v1 FrameworkScope와 별개).
2. .storybook/preview.tsx 에 globalTypes 추가:
     globalTypes = { theme: { toolbar: { title: 'Preset',
       items: ['bootstrap', 'tailwind', 'toss'], dynamicTitle: true } } }
   초기값 'toss'. decorator로 모든 스토리를 <ThemeScope preset={globals.theme}> 로 감싼다.
   단, 'Frameworks/' 로 시작하는 v1 스토리에는 적용하지 않는다(파라미터 noDsTheme: true 로 제외).
3. 폰트 로드: dep pretendard, @fontsource/inter 추가. preview에서 import 하고
   토큰의 fontFamily가 이를 참조(부록 C 값).

[완료 조건] 툴바 전환 시 DS Button의 primary 색이 3프리셋 값(부록 C)으로 정확히 바뀜을
스토리북 화면에서 확인. build-storybook 통과.
```

---

## §7 하네스 D1 — DS 코어 컴포넌트

```
[목표] 토큰 기반 자체 컴포넌트 5종을 만든다. props는 §3 매핑 규약과 100% 일치해야 하며,
이 props 이름이 그대로 P3의 Figma 속성 이름이 된다.

[컴포넌트 명세 — 정확히 이 5종, 이 props]

1. src/ds/Button/Button.tsx
   props: {
     variant: 'primary' | 'secondary' | 'error' | 'success'   // → Figma Variant
     size: 'sm' | 'md' | 'lg'                                 // → Figma Variant
     disabled?: boolean          // 기본 false                  // → Figma Variant(true/false)
     label: string                                             // → Figma Text property
     showIcon?: boolean          // 기본 false                  // → Figma Boolean property
     icon?: ReactNode            // showIcon=true일 때 왼쪽 렌더  // → Figma Instance swap
   }
   스타일: 배경 var(--ds-color-<variant>), 글자 var(--ds-color-bg) 계열 대비색,
   radius var(--ds-radius-md), size별 padding sm=6px 12px / md=10px 16px / lg=14px 20px,
   disabled는 opacity .45 + pointer-events none.

2. src/ds/TextField/TextField.tsx
   props: { label: string; placeholder?: string; disabled?: boolean; error?: boolean;
            description?: string; showDescription?: boolean }
   error=true 시 보더 var(--ds-color-error), description 색 error.

3. src/ds/Card/Card.tsx
   props: { title: string; showFooter?: boolean; children: ReactNode }  // children → Figma Slot
   구조: 헤더(제목) / 본문(children) / 푸터(showFooter 시, Button 1개 자리).

4. src/ds/Alert/Alert.tsx
   props: { variant: 'error' | 'success'; label: string; showIcon?: boolean }

5. src/ds/Badge/Badge.tsx
   props: { variant: 'primary' | 'secondary' | 'error' | 'success'; label: string;
            size: 'sm' | 'md' }

[스토리 규칙]
- 각 컴포넌트당 <이름>.stories.tsx 1개. title: '3. 컴포넌트/<이름>'.
- 모든 props를 argTypes로 노출(union → select 컨트롤). autodocs 태그 부여.
- 스토리: Default 1개 + 각 variant 축을 보여주는 AllVariants 1개(정확히 2개).
- parameters.design 은 v1 §9 규칙(placeholder) 유지.

[금지] hex/px 리터럴 직접 사용(§0-11). styled-components 등 새 스타일 방식 도입 금지 —
DS 컴포넌트는 전부 CSS Modules(.module.css) + CSS 변수로 통일한다.

[완료 조건] 5 컴포넌트 × 스토리 2개 = 10 스토리. 툴바 프리셋 전환 시 색·폰트 반영.
tsc·build-storybook 통과. props 이름이 §3 표와 1:1 대응(검증 스크립트는 V1이 수행).
```

---

## §8 하네스 D2 — 소셜 로그인 버튼

```
[목표] 4개 프로바이더(kakao/google/facebook/naver) 소셜 로그인 버튼과 OAuth 스코프 문서를 만든다.
버튼 UI(색·문구)는 부록 E 고정값. OAuth 실동작(토큰 교환)은 범위 외 — UI + 스코프 문서까지만.

[할 일]
1. src/ds/SocialLoginButton/SocialLoginButton.tsx
   props: {
     provider: 'kakao' | 'google' | 'facebook' | 'naver'   // → Figma Variant
     size: 'md' | 'lg'                                      // → Figma Variant
     label?: string        // 미지정 시 부록 E의 기본 문구      // → Figma Text property
     showLogo?: boolean    // 기본 true                       // → Figma Boolean property
   }
   색·문구·로고 배치: 부록 E 표 그대로. 로고는 src/ds/SocialLoginButton/logos/*.svg 로
   단색 근사 SVG를 두되(정확한 브랜드 로고 에셋은 각사 배포본으로 교체한다고 README에 명시),
   구조는 24px 로고 + 중앙 정렬 라벨.
2. 브랜드 컬러는 tokens와 별도로 src/ds/SocialLoginButton/brand.css 에 CSS 변수
   --brand-kakao-bg 등으로 정의(부록 E 값 고정, 프리셋 전환과 무관).
3. 스토리: title '5. 소셜 로그인/SocialLoginButton'. Default + AllProviders(4종 세로 나열) 2개.
4. OAuth 스코프 문서: docs-content.json 의 'social-login' 섹션(부록 D 참조)에
   부록 E의 스코프 표를 데이터로 넣는다. 하드코딩 금지(§0-12).

[완료 조건] 4 프로바이더 렌더 색상값이 부록 E와 일치(스포이드/스냅샷 확인). 스토리 2개.
```

---

## §9 하네스 D3 — Chart.js 차트

```
[목표] Chart.js 기반 차트 컴포넌트를 토큰과 연동해 만든다. 프리셋 전환 시 차트 색이 바뀐다.

[할 일]
1. dep 추가: chart.js, react-chartjs-2 (부록 A2 버전).
2. src/ds/Chart/DsChart.tsx
   props: {
     type: 'line' | 'bar' | 'doughnut'                      // → Figma Variant
     dataset: 'revenue' | 'traffic' | 'share'               // → Figma Variant (샘플 데이터 3종 고정)
     showLegend?: boolean   // 기본 true                      // → Figma Boolean property
     title?: string                                          // → Figma Text property
   }
   - 샘플 데이터는 src/ds/Chart/sampleData.ts 에 고정(월 6개 라벨 Jan~Jun,
     revenue=[12,19,8,15,22,17], traffic=[30,25,40,35,50,45], share=[45,25,20,10]).
   - 색상: getComputedStyle(document.documentElement) 이 아니라, ThemeScope 내부에서
     CSS 변수를 읽는 유틸 src/ds/Chart/useTokenColors.ts 를 만들어
     primary/secondary/error/success 4색 배열을 차트 palette로 사용한다.
     프리셋 전환(globals.theme 변경) 시 차트가 리렌더되도록 preset을 key로 전달한다.
3. 스토리: title '4. 차트/DsChart'. Default + 각 type 1개씩 = 총 4 스토리.
4. 양방향 범위 명시(부록 F): 정방향은 story.to.design 스냅샷 import,
   역방향은 토큰(색)만. 이 한계를 docs-content.json 'charts' 섹션에 기재.

[완료 조건] 3가지 type 렌더 정상, 프리셋 전환 시 palette 변경 확인, build-storybook 통과.
```

---

## §10 하네스 P1 — Figma 플러그인 스캐폴딩 + UI 폼 스펙

```
[목표] 커스텀 Figma 플러그인 "DS Generator"의 뼈대와 설정 UI를 만든다. 생성 로직은 P2~P4.

[구조 — figma-plugin/ 폴더 (같은 리포, 독립 빌드)]
figma-plugin/
├─ manifest.json
├─ package.json            # devDeps: typescript, esbuild, @figma/plugin-typings
├─ src/code.ts             # 플러그인 메인 스레드
├─ src/ui.html             # 설정 UI (단일 파일, 인라인 CSS/JS)
├─ src/generators/         # P2~P4가 채움 (tokens.ts, components.ts, docs.ts)
└─ scripts/build.mjs       # esbuild 번들 → dist/code.js, dist/ui.html

[manifest.json — 그대로 사용]
{
  "name": "DS Generator",
  "id": "ds-generator-local",
  "api": "1.0.0",
  "main": "dist/code.js",
  "ui": "dist/ui.html",
  "editorType": ["figma"],
  "networkAccess": { "allowedDomains": ["https://raw.githubusercontent.com"] }
}

[UI 폼 스펙 — ui.html. 이 순서·항목 그대로, 추가 금지]
1) 스타일 프리셋 (radio): ● TOSS 버전(기본) ○ Bootstrap 버전 ○ Tailwind 버전
2) 컬러 (프리셋 선택 시 부록 C 값이 프리필되는 color input 6개):
   메인 컬러(primary) / 서브 컬러(secondary) / 에러(error) / 성공(success) / 배경(bg) / 텍스트(text)
3) 타이포그래피: Font Family(text input, 프리셋 기본값 프리필),
   Base size(number, 기본 16), Scale(select: 1.2 / 1.25(기본) / 1.333)
4) ▸ 세부 설정 (접힘 아코디언 — "부수적 요소")
   4-1) 소셜 로그인 (checkbox 4개): 카카오 / 구글 / 페이스북 / 네이버  (기본 모두 해제)
   4-2) 차트 컴포넌트 생성 (checkbox, 기본 해제)
5) 생성 범위 (checkbox): ☑ 토큰(Variables/Styles) ☑ 컴포넌트 ☑ 문서 페이지
6) [디자인시스템 생성] 버튼 / [tokens.json 가져오기(파일)] / [원격에서 가져오기(URL)] /
   [현재 Variables 내보내기] 버튼
UI→code 메시지 프로토콜(postMessage) type:
   'generate' { preset, colors, typography, social: string[], charts: boolean,
                scope: { tokens, components, docs } }
   'import-tokens' { json } / 'import-remote' { url } / 'export-tokens' {}

[빌드] pnpm --dir figma-plugin build → dist/ 생성. README에
"Figma → Plugins → Development → Import plugin from manifest…" 절차 기재.

[완료 조건] 플러그인이 Figma에서 로드되고 UI 폼이 스펙 순서대로 표시됨(스크린샷).
generate 버튼 클릭 시 code.ts가 페이로드를 console에 출력(P2 전 단계 확인).
```

---

## §11 하네스 P2 — 플러그인: 토큰 → Figma Variables / Text Styles

```
[목표] generate 페이로드(또는 import한 tokens.json)로 Figma Variables와 Text Styles를 생성한다.

[생성 규칙 — src/generators/tokens.ts]
1. Variable 컬렉션 "DS Color" 생성. **modes를 프리셋 3개로 만든다**:
   bootstrap / tailwind / toss. (UI에서 사용자가 수정한 값은 선택한 프리셋의 mode에 반영,
   나머지 두 mode는 부록 C 기본값으로 채움.)
   변수(COLOR): color/primary, color/secondary, color/error, color/success, color/bg, color/text
2. Variable 컬렉션 "DS Typography" 생성(단일 mode):
   - font/family (STRING), font/size/xs..xxl (FLOAT — base×scale로 계산, 부록 C 공식),
     font/weight/regular=400, medium=500, bold=700 (FLOAT)
3. Variable 컬렉션 "DS Radius·Spacing" 생성(단일 mode): radius/sm=4, md=8, lg=12,
   spacing/1=4, 2=8, 3=12, 4=16, 5=20, 6=24 (FLOAT)
4. Text Styles 생성: "DS/Display", "DS/Title", "DS/Body", "DS/Caption"
   (size: xxl/xl/md/sm, weight: bold/bold/regular/regular, lineHeight 150%).
   폰트는 figma.loadFontAsync({ family: <font/family 값>, style: 'Regular'|'Bold' }) 선행.
   로드 실패 시 'Inter'로 폴백하고 UI에 경고 표시(중단하지 않음 — 유일한 폴백 허용).
5. §0-15 준수: 같은 이름 컬렉션 존재 시 생성 중단 + UI 경고.

[API 참고 고정]
- figma.variables.createVariableCollection(name)
- collection.addMode(name) / renameMode
- figma.variables.createVariable(name, collection, 'COLOR'|'FLOAT'|'STRING')
- variable.setValueForMode(modeId, value)  // COLOR는 {r,g,b} 0~1 정규화

[완료 조건] Figma 파일에 컬렉션 3개·변수 전체·Text Style 4종 생성.
mode 전환(bootstrap↔toss) 시 변수 값이 부록 C와 일치(스포이드 확인 3색 이상).
```

---

## §12 하네스 P3 — 플러그인: 컴포넌트 생성 (Variants·Text·Boolean·Instance Swap·Slot)

```
[목표] D1·D2·D3와 1:1 대응하는 Figma 컴포넌트를 생성한다. 속성 이름은 §3 매핑 규약,
즉 D1 props 이름과 문자열까지 동일해야 한다. 색은 반드시 P2의 Variables를 바인딩한다(raw hex 금지).

[생성 대상 — "2. 컴포넌트" 페이지에, 이 순서로]
0. _Slot/Placeholder 컴포넌트 1개 (회색 #E5E8EB 점선 보더, 12px 텍스트 "Slot") — §3-3.
   아이콘 스왑용 _Icon/Star, _Icon/Heart, _Icon/Bell 컴포넌트 3개(24px, Variables 색 text 바인딩).
1. DS/Button — ComponentSet:
   - Variant 축: variant(primary|secondary|error|success) × size(sm|md|lg) × disabled(false|true)
     = 24 variants. 오토레이아웃, padding·radius는 Variables 바인딩.
   - addComponentProperty('label', 'TEXT', 'Button') → 텍스트 노드에 바인딩.
   - addComponentProperty('showIcon', 'BOOLEAN', false) → 아이콘 레이어 visible 바인딩.
   - addComponentProperty('icon', 'INSTANCE_SWAP', <_Icon/Star id>) →
     preferredValues에 _Icon/* 3종 지정. 아이콘 인스턴스 레이어에 바인딩.
2. DS/TextField — variant: error(false|true) × disabled(false|true).
   TEXT 속성: label, placeholder, description. BOOLEAN: showDescription.
3. DS/Card — 단일 컴포넌트. TEXT: title. BOOLEAN: showFooter.
   본문 영역 = 오토레이아웃 컨테이너 안의 _Slot/Placeholder 인스턴스 +
   addComponentProperty('content', 'INSTANCE_SWAP', <placeholder id>) 바인딩. (= children 슬롯)
4. DS/Alert — variant(error|success). TEXT: label. BOOLEAN: showIcon.
5. DS/Badge — variant(primary|secondary|error|success) × size(sm|md).  TEXT: label.
6. (UI에서 소셜 로그인 체크 시) DS/SocialLoginButton —
   variant 축: provider(선택된 프로바이더만) × size(md|lg). TEXT: label(부록 E 기본 문구),
   BOOLEAN: showLogo. 색은 부록 E 고정 hex(브랜드 컬러는 Variables 미사용 — §0-14).
7. (차트 체크 시) DS/Chart — variant: type(line|bar|doughnut).
   내부는 P2 색 4종을 사용한 단순 벡터 근사(라인 폴리라인/바 사각형 6개/도넛 아크 4개,
   sampleData 수치 비례). TEXT: title. BOOLEAN: showLegend.

[API 참고 고정]
- 각 variant를 figma.createComponent()로 만들고 이름을 "variant=primary, size=md, disabled=false"
  형식으로 지정 → figma.combineAsVariants(nodes, page)로 ComponentSet 구성.
- 속성: componentSet.addComponentProperty(name, type, defaultValue)
  텍스트 바인딩: textNode.componentPropertyReferences = { characters: <propId> }
  visible 바인딩: node.componentPropertyReferences = { visible: <propId> }
  스왑 바인딩: instanceNode.componentPropertyReferences = { mainComponent: <propId> }
- 색 바인딩: node.fills = [figma.variables.setBoundVariableForPaint(paint, 'color', variable)]

[완료 조건]
- DS/Button 속성 패널에 variant/size/disabled/label/showIcon/icon 6개가 §3 순서로 노출.
- Card의 content 스왑으로 임의 컴포넌트 삽입 가능(슬롯 동작).
- 모든 variant 색이 mode 전환에 반응(Variables 바인딩 증명).
```

---

## §13 하네스 P4 — 플러그인: 문서 페이지 생성 (Figma 페이지 미러링)

```
[목표] docs/docs-content.json(부록 D)을 읽어, Storybook 문서와 동일한 구성의
Figma 페이지들을 생성한다. "1. 타이포그래피 > 타이포그래피 페이지"처럼
사이드바 번호·이름이 Storybook과 문자열까지 일치해야 한다.

[할 일 — src/generators/docs.ts]
1. docs-content.json 을 UI에서 파일 선택 또는 원격 URL로 로드(P1의 import 채널 재사용).
2. sections[] 순회하며 순서대로 Figma 페이지 생성. 페이지 이름 = `${order}. ${title}`
   (부록 D 기준: 0. 시작하기 / 1. 컬러 / 2. 타이포그래피 / 3. 컴포넌트 / 4. 차트 /
    5. 소셜 로그인 / 9. Figma 연동)
3. 각 페이지에 폭 1200 고정 문서 프레임(오토레이아웃 세로, padding 64, gap 40)을 만들고
   blocks[]를 위에서 아래로 렌더:
   - heading  → Text Style "DS/Title"
   - paragraph → "DS/Body"
   - colorGrid → 토큰 색상 카드 그리드(P2 Variables 바인딩, 각 카드: 스와치 120×80 + 토큰명 + 현재 mode hex)
   - typeScale → 폰트 사이즈 표(xs~xxl 실제 크기로 "가나다 ABC 123" 렌더)
   - componentDemo → P3에서 만든 해당 ComponentSet의 기본 variant 인스턴스 배치
   - table → 2열 이상 그리드 프레임으로 렌더(스코프 표 등)
   - callout → 좌측 4px 보더(color/primary) + "DS/Body" 텍스트
4. 렌더 불가한 block type을 만나면 그 블록만 건너뛰고 UI에 "skipped: <type>" 목록 표시.

[대안 경로(문서에만 기재, 구현 금지)] 픽셀 동일 미러링이 필요하면 서드파티
html.to.design 플러그인으로 Storybook 문서 URL을 직접 import하는 방법을
docs/figma-integration-guide.md 에 1문단 추가한다(별도 유료 플러그인임을 명시).

[완료 조건] Figma 페이지 트리가 Storybook 사이드바 상단 구조(§15)와 이름까지 일치.
"2. 타이포그래피" 페이지에 typeScale이 프리셋 폰트로 렌더됨.
```

---

## §14 하네스 P5 — 토큰 양방향 동기화

```
[목표] Figma에서 디자이너가 수정한 Variables를 tokens.json으로 되돌려(역방향),
코드 쪽과 완전한 왕복을 만든다.

[할 일 — src/generators/sync.ts + code.ts 메시지 핸들러]
1. 'export-tokens' 처리: "DS Color/Typography/Radius·Spacing" 컬렉션을 읽어
   부록 C 스키마와 동일한 구조의 JSON 3개(mode당 1개)로 직렬화 →
   UI에서 preset별 .json 파일 다운로드 제공. (COLOR는 {r,g,b}→hex 대문자 6자리 변환)
2. 'import-tokens' 처리: 업로드된 JSON을 부록 C 스키마로 검증(키 누락/타입 오류 시
   어떤 키가 틀렸는지 UI에 표시하고 중단). 통과 시 해당 preset mode의 변수 값만 갱신
   (컬렉션 재생성 금지 — 갱신만).
3. 'import-remote' 처리: raw.githubusercontent.com URL에서 fetch → 2와 동일 검증·갱신.
   (manifest networkAccess에 이미 허용됨. 다른 도메인 요청 금지.)
4. 왕복 규칙(README + 가이드 문서에 기재):
   코드 → Figma: repo의 tokens/<preset>.json 을 [원격에서 가져오기]로 pull
   Figma → 코드: [내보내기]로 받은 JSON을 tokens/ 에 덮어쓰고 커밋 → `pnpm build:tokens`
   → CSS/TS 재생성 → Storybook 자동 반영. 이것이 "디자이너 수정의 유일한 코드 반영 경로"다.

[완료 조건] 왕복 무손실 테스트: export한 JSON을 그대로 import했을 때 변수 값 변화 0.
export JSON이 부록 C 스키마 검증기를 통과.
```

---

## §15 하네스 G1 — TDS풍 문서 사이트

```
[목표] `pnpm storybook`(npm run dev에 해당)으로 뜨는 웹페이지를
tossmini-docs.toss.im/tds-mobile/ 류의 "활용 가이드 문서 사이트"처럼 구성한다.
(참고 구조: 소개/시작하기 → 파운데이션(Colors·Typography) → 컴포넌트 → 유틸리티)

[1단계 — docs-content.json 작성 (P4의 선행 산출물)]
docs/docs-content.json 을 부록 D 스키마·섹션 구성 그대로 생성한다. 문구는 부록 D에
명시된 것만 사용, 임의 마케팅 카피 금지.

[2단계 — 사이드바 정보 구조(스토리 title 고정)]
0. 시작하기            (MDX — 설치·실행·프리셋 선택 안내)
1. 컬러               (MDX — colorGrid 렌더)
2. 타이포그래피         (MDX — typeScale 렌더)
3. 컴포넌트/{Button, TextField, Card, Alert, Badge}
4. 차트/DsChart
5. 소셜 로그인/SocialLoginButton
9. Figma 연동          (v1 W14의 MDX를 이 번호로 이동)
Frameworks/... , Icons/... , Styling/... (v1 산출물은 하단 유지)
.storybook/preview.tsx 의 options.storySort 에 위 순서를 배열로 고정한다.

[3단계 — 렌더러]
src/docs/DocRenderer.tsx : docs-content.json의 blocks를 받아
heading/paragraph/colorGrid/typeScale/componentDemo/table/callout 을 렌더하는 단일 컴포넌트.
MDX 파일들(src/docs/*.mdx)은 각 섹션 id만 지정해 <DocRenderer sectionId="typography" /> 형태로
사용한다(문구 하드코딩 금지 — §0-12).

[4단계 — Storybook 테마]
.storybook/manager.ts + theme.ts : create({ base: 'light',
  brandTitle: 'DS Platform', appBorderRadius: 8,
  colorPrimary/colorSecondary는 toss 프리셋 primary(#3182F6) }) 만 설정. 과도한 커스텀 CSS 금지.
autodocs: 'tag' 활성화, DS 컴포넌트 문서 페이지에 props 표 자동 생성.

[완료 조건] 사이드바가 2단계 트리와 일치(번호 포함). 각 MDX가 DocRenderer 경유로 렌더.
Figma 페이지(P4)와 이름 대조표 전 항목 일치.
```

---

## §16 하네스 G2 — 컴포넌트 양방향 연동 규약

```
[목표] v1 W12~W14 산출물 위에, v2 자산을 잇는 실제 왕복 절차를 규약으로 확정하고
가이드 문서를 갱신한다. (사람 수행 단계 포함 — 계정 필요 작업은 절차서로만)

[할 일]
1. story.to.design 매핑 검증 절차서(docs/figma-integration-guide.md에 §추가):
   - Chromatic 배포 → Figma에서 story.to.design 실행 → DS/Button 스토리 선택 →
     args(variant/size/disabled/label/showIcon)가 Figma 속성으로 import되는지 확인.
   - §3 규약 덕에 P3가 만든 수동 컴포넌트와 이름이 같으므로, 중복 방지 규칙 명시:
     "story.to.design 산출물은 별도 페이지 '__imported'에 두고, 정본은 P3 산출물로 유지.
      차이 발견 시 코드(args)가 우선."
2. Storybook Connect 절차 갱신: v1 W14의 내용에 'DS/' 컴포넌트 링크 단계 추가.
   Chromatic Public 필요 제약(v1 기록) 재명시.
3. addon-designs: D1~D3 스토리의 design.url 을 P3/P4가 만든 실제 Figma 노드 링크로
   교체하는 절차(우클릭 → Copy link to selection → node-id 추출) 기재.
4. 차트·소셜 로그인의 양방향 범위(부록 F)를 가이드에 그대로 인용.

[완료 조건] 가이드 문서에 위 4개 절이 존재. 절차 각 단계가 번호 목록으로 재현 가능.
```

---

## §17 하네스 V1 — 통합 검증 v2

```
[목표] 기계 검증. 코드 수정 금지, 발견 시 보고만.

[체크리스트]
1. `pnpm install --frozen-lockfile && pnpm build:tokens && pnpm build:tw && pnpm build-storybook` 에러 0.
2. 매핑 규약 검증 스크립트 scripts/verify-mapping.mjs 실행:
   - src/ds/*/[이름].tsx 의 props(TS AST 또는 정규식)와
     figma-plugin/src/generators/components.ts 의 addComponentProperty/variant 정의를 대조.
   - 불일치(이름·유니온 값·기본값) 0건이어야 PASS.
3. SSOT 검증: `grep -rEn '#[0-9a-fA-F]{6}' src/ds src/docs` 결과가
   brand.css(부록 E 허용)와 generated/ 외 0건.
4. 문서 동기 검증: docs-content.json sections의 `${order}. ${title}` 목록 ==
   storySort 배열 상단 == P4 페이지 생성 목록(코드 내 상수) — 3자 일치.
5. 토큰 왕복 검증: P5 export 산출 JSON을 스키마 검증기(scripts/validate-tokens.mjs)로 검사.
6. 스토리 수 검증: v1 42개 + D1 10 + D2 2 + D3 4 + MDX 4(0,1,2,9번) = 총계 일치.
7. 플러그인 빌드: `pnpm --dir figma-plugin build` 에러 0, dist/code.js·ui.html 존재.
8. 토큰 하드코딩·시크릿 하드코딩 0건.

[완료 조건] 8항목 표로 보고, 전부 PASS.
```

---

## 부록 A2 — 고정 버전표 (v1 부록 A에 추가)

| 패키지 | 버전 범위 | 용도 | 구분 |
|---|---|---|---|
| chart.js | ^4.4 | 차트 | dep |
| react-chartjs-2 | ^5.2 | React 래퍼 | dep |
| pretendard | ^1.3 | TOSS 프리셋 폰트 | dep |
| @fontsource/inter | ^5.0 | Tailwind 프리셋 폰트 | dep |
| style-dictionary | ^4.0 | 토큰 빌드 | devDep |
| @figma/plugin-typings | ^1.90 | 플러그인 타입 | devDep(figma-plugin) |
| esbuild | ^0.21 | 플러그인 번들 | devDep(figma-plugin) |

---

## 부록 B2 — 파일 트리 v2 (v1 부록 B에 추가되는 부분)

```
css-frameworks-storybook/
├─ tokens/{bootstrap,tailwind,toss}.json          # SSOT #1 (부록 C)
├─ docs/docs-content.json                          # SSOT #2 (부록 D)
├─ scripts/{build-tokens.mjs, verify-mapping.mjs, validate-tokens.mjs}
├─ src/
│  ├─ tokens/generated/{vars-*.css, types.ts, theme.ts}
│  ├─ shared/ThemeScope.tsx
│  ├─ ds/
│  │  ├─ Button/  TextField/  Card/  Alert/  Badge/        # 각: .tsx + .module.css + .stories.tsx
│  │  ├─ SocialLoginButton/{...,brand.css,logos/}
│  │  └─ Chart/{DsChart.tsx, sampleData.ts, useTokenColors.ts, DsChart.stories.tsx}
│  └─ docs/{DocRenderer.tsx, GettingStarted.mdx, Colors.mdx, Typography.mdx, FigmaGuide.mdx}
└─ figma-plugin/
   ├─ manifest.json  package.json  scripts/build.mjs
   └─ src/{code.ts, ui.html, generators/{tokens.ts, components.ts, docs.ts, sync.ts}}
```

---

## 부록 C — tokens.json 스키마 + 3 프리셋 고정값

**스키마 (모든 프리셋 파일 동일 구조):**
```json
{
  "$preset": "<bootstrap|tailwind|toss>",
  "color": { "primary": "#RRGGBB", "secondary": "#RRGGBB", "error": "#RRGGBB",
             "success": "#RRGGBB", "bg": "#RRGGBB", "text": "#RRGGBB" },
  "typography": { "fontFamily": "<string>", "baseSize": 16, "scale": 1.25,
                  "sizes": { "xs": 12, "sm": 14, "md": 16, "lg": 20, "xl": 25, "xxl": 31 },
                  "weights": { "regular": 400, "medium": 500, "bold": 700 } },
  "radius": { "sm": 4, "md": 8, "lg": 12 },
  "spacing": { "1": 4, "2": 8, "3": 12, "4": 16, "5": 20, "6": 24 }
}
```
`sizes`는 `round(baseSize × scale^n)` (n = -2,-1,0,1,2,3)으로 산출한 값을 명시적으로 기록한다.

**프리셋 고정값** (기본값이며, 플러그인 UI에서 사용자가 덮어쓸 수 있다. 코드 기본값은 아래로 고정):

| 키 | bootstrap | tailwind | toss |
|---|---|---|---|
| color.primary | `#0D6EFD` | `#2563EB` | `#3182F6` |
| color.secondary | `#6C757D` | `#64748B` | `#4E5968` |
| color.error | `#DC3545` | `#EF4444` | `#F04452` |
| color.success | `#198754` | `#22C55E` | `#00C471` |
| color.bg | `#FFFFFF` | `#FFFFFF` | `#FFFFFF` |
| color.text | `#212529` | `#0F172A` | `#191F28` |
| typography.fontFamily | `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` | `'Inter', system-ui, sans-serif` | `'Pretendard', -apple-system, sans-serif` |
| typography.scale | 1.25 | 1.25 | 1.2 |

> TOSS 값은 공개된 토스 팔레트의 근사 기본값이다(Toss Product Sans는 사내 전용이므로 Pretendard 대체).
> 실제 프로젝트 확정 시 이 표만 갱신하면 전 시스템(코드+Figma)에 전파된다 — 그것이 SSOT의 목적이다.

---

## 부록 D — docs-content.json 스키마

```json
{
  "sections": [
    { "id": "getting-started", "order": 0, "title": "시작하기",
      "figmaPage": "0. 시작하기", "storybookTitle": "0. 시작하기",
      "blocks": [
        { "type": "heading", "text": "시작하기" },
        { "type": "paragraph", "text": "pnpm install 후 pnpm storybook 으로 실행합니다. 우측 상단 툴바에서 스타일 프리셋(Bootstrap/Tailwind/TOSS)을 전환할 수 있습니다." },
        { "type": "callout", "text": "모든 색·타이포 값은 tokens/ JSON에서만 관리됩니다." }
      ] },
    { "id": "colors", "order": 1, "title": "컬러", "figmaPage": "1. 컬러",
      "storybookTitle": "1. 컬러",
      "blocks": [
        { "type": "heading", "text": "컬러" },
        { "type": "paragraph", "text": "메인·서브·에러·성공 4개 의미 색상과 배경·텍스트 색을 제공합니다." },
        { "type": "colorGrid", "tokens": ["primary", "secondary", "error", "success", "bg", "text"] }
      ] },
    { "id": "typography", "order": 2, "title": "타이포그래피", "figmaPage": "2. 타이포그래피",
      "storybookTitle": "2. 타이포그래피",
      "blocks": [
        { "type": "heading", "text": "타이포그래피" },
        { "type": "paragraph", "text": "프리셋별 폰트 패밀리와 6단계 사이즈 스케일을 사용합니다." },
        { "type": "typeScale", "sizes": ["xs", "sm", "md", "lg", "xl", "xxl"] }
      ] },
    { "id": "components", "order": 3, "title": "컴포넌트", "figmaPage": "3. 컴포넌트",
      "storybookTitle": "3. 컴포넌트",
      "blocks": [
        { "type": "heading", "text": "컴포넌트" },
        { "type": "componentDemo", "component": "Button" },
        { "type": "componentDemo", "component": "TextField" },
        { "type": "componentDemo", "component": "Card" },
        { "type": "componentDemo", "component": "Alert" },
        { "type": "componentDemo", "component": "Badge" }
      ] },
    { "id": "charts", "order": 4, "title": "차트", "figmaPage": "4. 차트",
      "storybookTitle": "4. 차트",
      "blocks": [
        { "type": "heading", "text": "차트" },
        { "type": "paragraph", "text": "Chart.js 기반이며 색상은 토큰 팔레트를 따릅니다. Figma로는 스냅샷이 전달되고, 역방향은 토큰(색상)만 반영됩니다." },
        { "type": "componentDemo", "component": "DsChart" }
      ] },
    { "id": "social-login", "order": 5, "title": "소셜 로그인", "figmaPage": "5. 소셜 로그인",
      "storybookTitle": "5. 소셜 로그인",
      "blocks": [
        { "type": "heading", "text": "소셜 로그인" },
        { "type": "paragraph", "text": "카카오·구글·페이스북·네이버 4개 프로바이더를 지원합니다. 색상·문구는 각 사 브랜드 규정을 따르며 임의 변경할 수 없습니다." },
        { "type": "componentDemo", "component": "SocialLoginButton" },
        { "type": "table", "id": "oauth-scopes" }
      ] },
    { "id": "figma", "order": 9, "title": "Figma 연동", "figmaPage": "9. Figma 연동",
      "storybookTitle": "9. Figma 연동",
      "blocks": [
        { "type": "heading", "text": "Figma 연동" },
        { "type": "paragraph", "text": "토큰은 DS Generator 플러그인으로, 컴포넌트는 story.to.design으로, 스토리 링크는 Storybook Connect로 동기화합니다. 자세한 절차는 figma-integration-guide.md 참고." }
      ] }
  ],
  "tables": {
    "oauth-scopes": {
      "columns": ["프로바이더", "기본 스코프", "버튼 기본 문구"],
      "rows": [
        ["카카오", "profile_nickname, profile_image, account_email", "카카오 로그인"],
        ["구글", "openid, email, profile", "Google로 로그인"],
        ["페이스북", "public_profile, email", "Facebook으로 로그인"],
        ["네이버", "name, email, profile_image", "네이버 로그인"]
      ]
    }
  }
}
```

---

## 부록 E — OAuth 스코프 & 소셜 브랜드 규정표 (변경 금지)

| provider | 배경색 | 라벨색 | 보더 | 기본 문구 | 기본 OAuth 스코프 |
|---|---|---|---|---|---|
| kakao | `#FEE500` | `#191919` | 없음 | 카카오 로그인 | profile_nickname, profile_image, account_email |
| google | `#FFFFFF` | `#1F1F1F` | `1px #747775` | Google로 로그인 | openid, email, profile |
| facebook | `#1877F2` | `#FFFFFF` | 없음 | Facebook으로 로그인 | public_profile, email |
| naver | `#03C75A` | `#FFFFFF` | 없음 | 네이버 로그인 | name, email, profile_image |

- 로고 배치: 좌측 24px, 라벨 중앙 정렬, 버튼 radius는 토큰 radius/md.
- 스코프는 "기본값" 명세다. 실서비스 적용 시 각 사 개발자 콘솔에서 검수·동의항목 설정이 필요함을 문서에 고지한다.
- 정확한 브랜드 로고 원본 에셋은 각 사 브랜드 리소스에서 받아 교체한다(리포에는 근사 SVG placeholder).

---

## 부록 F — 양방향 동기화의 현실적 한계 (가이드 문서에 반드시 고지)

1. **토큰(색·타이포·radius·spacing)은 완전 양방향이다.** 플러그인 import/export가 무손실 왕복을 보장한다.
2. **컴포넌트 "구조"의 역방향(디자이너가 Figma에서 오토레이아웃/레이어를 바꾼 것을 코드로 자동 반영)은
   현존 도구로 불가능하다.** 디자이너 변경은 (a) 토큰 값 변경 → P5 경유 자동 반영, 또는
   (b) 구조 변경 요청 → 개발자가 D1 수정 → story.to.design 재import, 두 경로만 허용한다.
3. **차트**: Figma로 가는 것은 렌더 스냅샷/벡터 근사이며, Figma에서 데이터·축을 편집해도 코드로
   돌아오지 않는다. 색상만 토큰 경유로 왕복한다.
4. **Storybook Connect는 Chromatic Public 프로젝트만 지원**한다(v1 기록 재확인). 사내 Private 정책이면
   story.to.design + addon-designs 조합을 표준 경로로 삼는다.
5. **Figma 폰트**: 프리셋 폰트(Pretendard/Inter)가 Figma에 설치되어 있지 않으면 Text Style 생성이
   Inter로 폴백된다. 조직 폰트 설치가 선행 조건이다.
6. 플러그인은 "생성·갱신"만 하고 "삭제"는 하지 않는다(§0-15). 정리는 사람이 한다.

---

### 실행 명령 요약 v2 (사람용)

```bash
pnpm install
pnpm build:tokens                      # tokens JSON → CSS 변수 + TS 타입
pnpm build:tw                          # (v1) Tailwind 컴파일
pnpm storybook                         # TDS풍 문서 사이트 (localhost:6006)
pnpm build-storybook                   # 통합 빌드 검증
pnpm --dir figma-plugin build          # Figma 플러그인 번들
# Figma → Plugins → Development → Import plugin from manifest… → figma-plugin/manifest.json
CHROMATIC_PROJECT_TOKEN=xxxx pnpm chromatic   # 배포 → story.to.design/Connect 연동
```
