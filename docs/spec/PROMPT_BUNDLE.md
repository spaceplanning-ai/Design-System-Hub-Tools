# CSS 프레임워크 통합 Storybook + Figma 양방향 연동 — 하네스 프롬프트 통합본

> 이 문서는 **AI 작업자(하네스)에게 그대로 붙여넣어 지시**하기 위한 프롬프트 모음이다.
> 각 하네스는 **정해진 규칙만 따르고 창작하지 않는다.** 명세에 없는 것은 만들지 말고, 모호하면 멈추고 오케스트레이터에게 보고한다.
>
> 사용법: `§0 공통 규칙`을 모든 하네스 프롬프트 앞에 항상 포함시킨 뒤, 해당 하네스의 프롬프트 본문을 이어 붙여 실행한다.
> 실행 순서: **W0 → W1 → W2 → (W3~W9 병렬) → W10 → W11 → W12 → W13 → W14 → W15**

---

## 목차

- §0 공통 규칙 (모든 하네스 필수 선행)
- §1 최종 산출물 명세 (Definition of Done)
- §2 오케스트레이터(감독) 프롬프트
- §3 하네스 W0 — 환경 검증
- §4 하네스 W1 — 프로젝트 스캐폴딩
- §5 하네스 W2 — 스타일 격리 컴포넌트 `FrameworkScope`
- §6 하네스 W3~W9 — 프레임워크 스토리 (템플릿 + 데이터 표)
- §7 하네스 W10 — 아이콘 갤러리 (Bootstrap Icons, Heroicons/Tailwind SVG)
- §8 하네스 W11 — React+TS 스타일링 조합 비교 (CSS / SCSS / CSS Modules / styled-components)
- §9 하네스 W12 — Figma `@storybook/addon-designs` 연동 (Figma → Storybook)
- §10 하네스 W13 — Chromatic 배포 스크립트 (Storybook → Figma 준비)
- §11 하네스 W14 — Figma 연동 가이드 문서 (Storybook Connect / story.to.design)
- §12 하네스 W15 — 통합 검증
- 부록 A — 고정 버전표
- 부록 B — 파일 트리 (완성 기준)

---

## §0 공통 규칙 (모든 하네스 필수 선행)

아래 규칙을 **모든 하네스 프롬프트 맨 앞에 그대로 포함**한다.

```
[공통 규칙 — 반드시 준수]
1. 창작 금지: 본 명세에 명시되지 않은 파일/컴포넌트/스토리/의존성/스크립트를 임의로 만들지 않는다.
   디자인 토큰, 색상, 카피 문구도 명세에 있는 값만 사용한다.
2. 결정론: 파일 경로·이름·export 이름·패키지 이름은 명세에 적힌 문자열과 100% 일치해야 한다.
   대소문자, 확장자, 폴더 구분까지 동일해야 한다.
3. 범위 고정: 프레임워크는 정확히 7종 (Bootstrap, Foundation, Bulma, Tailwind, Materialize,
   Semantic UI, Skeleton). 프레임워크당 컴포넌트는 정확히 5종 (Button, Card, Form, Alert, Navbar).
   더하거나 빼지 않는다.
4. 버전 고정: 부록 A 고정 버전표의 버전 범위를 package.json에 그대로 기입한다.
   설치 후 pnpm-lock.yaml을 커밋하여 재현성을 보장한다.
5. 스타일 격리: 모든 프레임워크 UI는 반드시 §5의 <FrameworkScope>로 감싼다.
   전역(document head)에 프레임워크 CSS를 절대 주입하지 않는다. (Tailwind preflight 포함)
6. 패키지 매니저: pnpm만 사용한다. npm/yarn 명령을 섞지 않는다.
7. 타입 안전: 모든 스토리는 TypeScript(.tsx) + CSF3 + `satisfies Meta<...>` 형식.
   any 사용 금지, ts-ignore 금지.
8. 실패 처리: 명령이 실패하거나 명세가 모호하면 즉시 중단하고, 무엇이 왜 막혔는지
   한 문단으로 보고한다. 추측으로 우회하지 않는다.
9. 검증 우선: 각 하네스는 종료 전 자신의 산출물이 `pnpm build-storybook`을 깨지 않는지
   확인한다(해당되는 경우). 확인 불가 시 그 사실을 보고한다.
10. 보고 형식: 종료 시 (a) 생성/수정한 파일 목록, (b) 실행한 명령, (c) 통과/실패 여부만
    보고한다. 장황한 설명 금지.
```

---

## §1 최종 산출물 명세 (Definition of Done)

완성된 프로젝트는 아래를 **모두** 만족해야 한다. 하나라도 어긋나면 미완성이다.

1. 단일 Storybook 프로젝트(`@storybook/react-vite`, TypeScript)가 `pnpm storybook`으로 구동된다.
2. 사이드바 구조가 아래와 정확히 일치한다.
   - `Frameworks/Bootstrap/{Button,Card,Form,Alert,Navbar}`
   - `Frameworks/Foundation/{...5종...}`
   - `Frameworks/Bulma/{...}`, `Frameworks/Tailwind/{...}`, `Frameworks/Materialize/{...}`,
     `Frameworks/Semantic UI/{...}`, `Frameworks/Skeleton/{...}`
   - `Icons/Bootstrap Icons`, `Icons/Heroicons (Tailwind SVG)`
   - `Styling/CSS`, `Styling/SCSS`, `Styling/CSS Modules`, `Styling/styled-components`
   - `Docs/Figma 연동 가이드` (MDX)
3. 7개 프레임워크 CSS가 서로 충돌하지 않는다(각 스토리가 §5 격리로 렌더).
4. 모든 스토리에 `parameters.design`(Figma 연동 탭)이 붙어 있고 Design 탭이 노출된다.
5. `pnpm build-storybook`이 에러 0으로 통과한다.
6. `pnpm chromatic` 스크립트가 존재하고 문서화되어 있다(토큰은 환경변수로 주입).
7. `docs/figma-integration-guide.md`(한글)와 MDX Docs 페이지가 존재한다.
8. README에 실행/배포/연동 절차가 기재되어 있다.

---

## §2 오케스트레이터(감독) 프롬프트

```
[역할] 너는 이 프로젝트의 오케스트레이터다. 직접 코드를 작성하지 않고, 하네스 W0~W15를
순서대로 배정·검수한다.

[진행 규칙]
- 순서: W0 → W1 → W2 → (W3~W9 병렬 가능) → W10 → W11 → W12 → W13 → W14 → W15.
- 각 하네스 종료 후, 그 하네스의 "Definition of Done"(각 §의 완료 조건)을 점검한다.
  통과하지 못하면 같은 하네스에게 결함 목록을 주고 재실행시킨다. 다음 단계로 넘어가지 않는다.
- 어떤 하네스도 §1의 범위를 확장하지 못하게 막는다(프레임워크 7종·컴포넌트 5종 고정).
- W2가 통과하기 전에는 W3~W9를 시작하지 않는다(격리 컴포넌트가 선행 의존성이기 때문).
- 최종적으로 W15의 검증 로그(빌드 통과, 사이드바 트리 일치)를 근거로만 완료를 선언한다.

[금지]
- 하네스에게 "알아서 예쁘게" 같은 창작 여지를 주는 지시 금지.
- 명세에 없는 프레임워크/컴포넌트/애드온 추가 승인 금지.
```

---

## §3 하네스 W0 — 환경 검증

```
[목표] 빌드 환경이 요구사항을 충족하는지 확인만 한다. 코드/파일 생성 금지.

[할 일]
1. `node -v` 가 v20 이상인지 확인.
2. `pnpm -v` 가 존재하는지 확인. 없으면 `corepack enable && corepack prepare pnpm@latest --activate`
   실행 후 재확인.
3. npm 레지스트리 접근 가능 여부 확인: `pnpm view react version` 이 버전 문자열을 반환하는지 확인.
   - 403/네트워크 오류가 나면 즉시 중단하고 "레지스트리 접근 차단"으로 보고한다.
     (해결: 환경의 network egress 허용목록에 registry.npmjs.org 추가 필요.)

[완료 조건] node/pnpm 버전 + 레지스트리 접근 가능 여부를 3줄로 보고.
```

---

## §4 하네스 W1 — 프로젝트 스캐폴딩

```
[목표] Vite React-TS + Storybook 베이스와 모든 의존성을 설치한다.

[할 일 — 순서대로]
1. `pnpm create vite@latest css-frameworks-storybook --template react-ts` 로 프로젝트 생성.
2. 프로젝트 루트로 이동 후 `pnpm install`.
3. Storybook 초기화: `pnpm dlx storybook@latest init --builder vite --yes`.
4. 부록 A 고정 버전표의 dependencies / devDependencies를 package.json에 반영하고 `pnpm install`.
5. package.json scripts에 아래 3개가 있는지 확인/추가:
     "storybook": "storybook dev -p 6006"
     "build-storybook": "storybook build"
     "chromatic": "chromatic --exit-zero-on-changes"
6. 불필요 데모 제거: Storybook init이 생성한 src/stories/ 폴더의 예제(Button.tsx, Header.tsx,
   Page.tsx, *.stories.*, *.mdx, assets)를 전부 삭제한다. (우리 스토리로 대체할 것이므로)
7. `.storybook/main.ts` 의 stories 글롭을 아래로 고정한다:
     stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)']
8. `.gitignore` 에 node_modules, storybook-static, chromatic-build 이 포함되어 있는지 확인.

[완료 조건]
- `pnpm build-storybook` 이 (스토리가 비어 있어도) 에러 없이 통과.
- 데모 스토리 잔존 0개.
```

---

## §5 하네스 W2 — 스타일 격리 컴포넌트 `FrameworkScope`

```
[목표] 7개 프레임워크 CSS가 한 Storybook 안에서 충돌하지 않도록, 각 프레임워크 CSS를
Shadow DOM 안에만 주입하는 래퍼를 만든다. 전역 오염 절대 금지.

[핵심 규칙]
- Vite의 `?inline` 쿼리로 CSS를 "문자열"로 import 한다(전역 <link> 주입 아님).
- 문자열 CSS를 Shadow Root 내부의 <style>로만 삽입한다.
- children은 createPortal로 Shadow Root 안에 렌더한다.

[생성 파일 1] src/shared/FrameworkScope.tsx  (아래 내용 그대로)
------------------------------------------------------------
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  /** 주입할 CSS 문자열들 (Vite `?inline` import 결과) */
  styles: string[]
  /** 프레임워크 루트에 부여할 클래스(예: Semantic UI의 "ui" 스코프 등) */
  rootClassName?: string
  children: ReactNode
}

/**
 * 프레임워크 CSS를 Shadow DOM 안에만 주입해 전역 충돌을 차단한다.
 * 명세 외 스타일을 추가하지 않는다.
 */
export function FrameworkScope({ styles, rootClassName, children }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' })
    // 재렌더 대비 초기화
    shadow.innerHTML = ''
    for (const css of styles) {
      const styleEl = document.createElement('style')
      styleEl.textContent = css
      shadow.appendChild(styleEl)
    }
    const mount = document.createElement('div')
    if (rootClassName) mount.className = rootClassName
    shadow.appendChild(mount)
    setMountNode(mount)
    return () => {
      shadow.innerHTML = ''
      setMountNode(null)
    }
  }, [styles, rootClassName])

  return <div ref={hostRef}>{mountNode && createPortal(children, mountNode)}</div>
}
------------------------------------------------------------

[생성 파일 2] src/shared/vite-inline-css.d.ts  (타입 선언)
------------------------------------------------------------
declare module '*.css?inline' {
  const css: string
  export default css
}
declare module '*.scss?inline' {
  const css: string
  export default css
}
------------------------------------------------------------

[완료 조건]
- 타입 에러 없이 컴파일. `pnpm build-storybook` 통과.
- FrameworkScope를 임시로 하나의 스토리에서 사용해 Bootstrap 버튼이 렌더되고,
  같은 페이지의 다른 요소에 Bootstrap 스타일이 새지 않음을 확인(스크린샷 또는 DOM 확인).
```

---

## §6 하네스 W3~W9 — 프레임워크 스토리 (템플릿 + 데이터 표)

각 프레임워크는 **동일한 템플릿**을 따른다. 프레임워크마다 아래 "데이터 표"의 값만 바꿔 넣는다.
각 프레임워크당 **정확히 5개 스토리 파일**을 만든다: `Button, Card, Form, Alert, Navbar`.

```
[목표] 배정된 프레임워크 1종에 대해 5개 컴포넌트 스토리를 템플릿대로 생성한다.

[규칙]
- 파일 위치: src/frameworks/<slug>/<Component>.stories.tsx
  (slug: bootstrap, foundation, bulma, tailwind, materialize, semantic-ui, skeleton)
- 각 스토리 파일은 반드시:
  (a) 해당 프레임워크 CSS를 `?inline`으로 import,
  (b) <FrameworkScope styles={[css]} rootClassName={...}>로 마크업을 감싸고,
  (c) title을 'Frameworks/<표시명>/<Component>' 로 지정,
  (d) parameters.design 을 §9 규칙대로 포함(placeholder URL 허용, 표의 nodeId 사용),
  (e) CSF3 + satisfies Meta 형식.
- 마크업은 "해당 프레임워크 공식 문서의 표준 마크업"만 사용한다(창작 금지).
  아래 데이터 표의 CSS import 경로와 루트 클래스, 마크업 규칙을 그대로 따른다.

[스토리 파일 템플릿] (Button 예시 — 나머지 4종도 동일 골격)
------------------------------------------------------------
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import css from '<CSS_IMPORT_PATH>?inline'

const meta = {
  title: 'Frameworks/<표시명>/Button',
  parameters: {
    design: { type: 'figma', url: '<FIGMA_URL>' }, // §9 참조
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <FrameworkScope styles={[css]} rootClassName="<ROOT_CLASS>">
      <'''해당 프레임워크 표준 버튼 마크업 — 데이터 표 참조'''>
    </FrameworkScope>
  ),
}
------------------------------------------------------------

[완료 조건] 배정 프레임워크의 5개 스토리 파일이 모두 존재하고 build-storybook 통과.
```

### 데이터 표 (프레임워크별 고정값)

| slug | 표시명(title) | CSS `?inline` import 경로 | 루트 클래스 | 비고 |
|---|---|---|---|---|
| bootstrap | Bootstrap | `bootstrap/dist/css/bootstrap.min.css` | (없음) | 버튼 `btn btn-primary`, 카드 `card`, 폼 `form-control`, 얼럿 `alert alert-warning`, 네비 `navbar navbar-expand` |
| foundation | Foundation | `foundation-sites/dist/css/foundation.min.css` | (없음) | 버튼 `button`, 카드 `card`, 얼럿 `callout`, 네비 `top-bar` |
| bulma | Bulma | `bulma/css/bulma.min.css` | (없음) | 버튼 `button is-primary`, 카드 `card`, 폼 `input`, 얼럿 `notification`, 네비 `navbar` |
| tailwind | Tailwind | `src/frameworks/tailwind/tailwind.generated.css` | (없음) | ★ Tailwind는 아래 특별 규칙 참조 |
| materialize | Materialize | `materialize-css/dist/css/materialize.min.css` | (없음) | 버튼 `btn waves-effect`, 카드 `card`, 얼럿 `card-panel`, 네비 `nav` (JS 불필요한 정적 마크업만) |
| semantic-ui | Semantic UI | `semantic-ui-css/semantic.min.css` | `ui` | 버튼 `ui button`, 카드 `ui card`, 폼 `ui form`, 얼럿 `ui message`, 네비 `ui menu` |
| skeleton | Skeleton | `skeleton-css/css/skeleton.css` | (없음) | Skeleton은 `normalize.css`도 함께 `?inline` import 하여 styles 배열에 [normalize, skeleton] 순서로 전달 |

**★ Tailwind 특별 규칙 (W6):**
```
Tailwind는 유틸리티 클래스라 컴파일된 CSS가 필요하다. 아래를 정확히 수행한다.
1. src/frameworks/tailwind/tailwind.source.css 생성, 내용:
     @tailwind base;
     @tailwind components;
     @tailwind utilities;
2. tailwind.config.cjs 생성, content: ['./src/frameworks/tailwind/**/*.{ts,tsx}']
3. package.json scripts에 추가:
     "build:tw": "tailwindcss -i src/frameworks/tailwind/tailwind.source.css -o src/frameworks/tailwind/tailwind.generated.css --minify"
4. `pnpm build:tw` 실행하여 tailwind.generated.css 를 생성(이 파일을 커밋).
5. 스토리는 tailwind.generated.css?inline 을 import 한다.
   주의: Tailwind base(preflight)가 Shadow DOM 안에만 적용되므로 전역 오염 없음.
6. Tailwind 마크업은 표준 유틸 조합만 사용:
   - Button: <button class="px-4 py-2 rounded bg-blue-600 text-white font-medium">Button</button>
   - Card: <div class="max-w-sm rounded-lg border shadow p-4">…</div>
   - Form: <input class="border rounded px-3 py-2 w-full" placeholder="Email" />
   - Alert: <div class="rounded border-l-4 border-yellow-400 bg-yellow-50 p-4">Warning</div>
   - Navbar: <nav class="flex items-center gap-4 bg-gray-800 text-white px-4 py-3">…</nav>
```

**각 컴포넌트 표준 마크업 지침(창작 금지 — 공식 문서 최소 예제만):**
- **Button**: 해당 프레임워크의 기본 primary 버튼 1개 + disabled 변형 1개.
- **Card**: 제목 + 본문 텍스트 + 액션 버튼 1개를 담은 표준 카드.
- **Form**: 라벨 + 텍스트 input + submit 버튼으로 된 최소 폼.
- **Alert**: 경고(warning) 성격의 표준 알림/콜아웃/notification 1개.
- **Navbar**: 브랜드명 + 링크 3개(Home, Docs, About)로 된 표준 상단 내비게이션.
- 카피 문구 고정: 카드 제목 "Card title", 본문 "This is a sample card.", 버튼 "Button",
  얼럿 문구 "This is a warning message.", 브랜드명 "Acme".

---

## §7 하네스 W10 — 아이콘 갤러리

```
[목표] 두 개의 아이콘 세트 스토리를 만든다. 창작 금지 — 아래 목록만 렌더.

[W10-A] Bootstrap Icons
- 의존성: bootstrap-icons (부록 A 버전).
- 파일: src/icons/BootstrapIcons.stories.tsx, title: 'Icons/Bootstrap Icons'.
- bootstrap-icons/font/bootstrap-icons.css 를 `?inline` 으로 import 후 FrameworkScope로 감싼다
  (폰트 아이콘이므로 CSS만으로 렌더).
- 렌더 목록(정확히 이 12개, <i class="bi bi-<name>"> 형태):
  alarm, bell, book, calendar, camera, cart, chat, cloud, gear, heart, house, star
- 각 아이콘 아래에 이름 라벨 표기. 4열 그리드.

[W10-B] Heroicons (Tailwind SVG)
- 의존성: @heroicons/react (부록 A 버전). ("Tailwind SVG" = Tailwind 팀의 Heroicons)
- 파일: src/icons/Heroicons.stories.tsx, title: 'Icons/Heroicons (Tailwind SVG)'.
- @heroicons/react/24/outline 에서 아래 12개를 import 하여 렌더(각 24x24, className="w-6 h-6"):
  BellIcon, BookOpenIcon, CalendarIcon, CameraIcon, ChatBubbleLeftIcon, CloudIcon,
  Cog6ToothIcon, HeartIcon, HomeIcon, ShoppingCartIcon, StarIcon, UserIcon
- SVG는 currentColor를 쓰므로 인라인 렌더로 충분(격리 불필요). 4열 그리드 + 이름 라벨.

[완료 조건] 두 스토리 렌더, 아이콘 개수 각 12개 정확, build-storybook 통과.
```

---

## §8 하네스 W11 — React+TS 스타일링 조합 비교

```
[목표] 동일한 "ProfileCard" UI를 4가지 스타일링 방식으로 구현해 나란히 비교하는 스토리를 만든다.
UI 스펙은 아래 하나로 고정(모든 방식이 시각적으로 동일해야 함) — 창작 금지.

[공통 UI 스펙 — ProfileCard]
- 컨테이너: 너비 280px, 흰 배경, radius 12px, 그림자, padding 20px.
- 상단: 지름 56px 원형 아바타(배경 #6366f1), 이름 "Jane Doe"(굵게 16px), 역할 "Designer"(회색 13px).
- 하단: "Follow" 버튼(배경 #6366f1, 흰 글자, radius 8px, padding 8px 16px).

[구현 — 각 파일 동일 UI, 방식만 다름]
1. src/styling/css/ProfileCard.tsx + ProfileCard.css        → title 'Styling/CSS'
2. src/styling/scss/ProfileCard.tsx + ProfileCard.scss      → title 'Styling/SCSS'
   (devDep: sass)
3. src/styling/css-modules/ProfileCard.tsx + ProfileCard.module.css → title 'Styling/CSS Modules'
4. src/styling/styled/ProfileCard.tsx (styled-components)    → title 'Styling/styled-components'
   (dep: styled-components, devDep: @types/styled-components)

각 방식마다 <Component>.stories.tsx 를 만들고 위 title 로 노출한다.
이 컴포넌트들은 앱 스코프(로컬) CSS이므로 FrameworkScope 불필요하나, 클래스명 충돌 방지를 위해
CSS/SCSS 버전은 접두사 `sc-css-`/`sc-scss-` 를 클래스에 붙인다(모듈/styled는 자동 격리).

[완료 조건] 4개 스토리가 시각적으로 동일한 카드로 렌더, build-storybook 통과.
```

---

## §9 하네스 W12 — Figma `@storybook/addon-designs` 연동 (Figma → Storybook)

```
[목표] 모든 스토리에 Figma Design 탭이 뜨도록 애드온을 설정한다.

[할 일]
1. 의존성: `pnpm add -D @storybook/addon-designs` (부록 A 버전).
2. .storybook/main.ts 의 addons 배열에 '@storybook/addon-designs' 추가.
3. 전역 기본 design 파라미터는 두지 않는다(스토리별로 지정). 대신 각 스토리 meta 에
   parameters.design 이 이미 §6~§8에서 포함되도록 되어 있는지 점검한다.
4. Figma URL 규칙(창작 금지 — placeholder 고정):
   - 공통 파일 URL 상수를 src/shared/figma.ts 에 둔다:
       export const FIGMA_FILE = 'https://www.figma.com/file/REPLACE_ME/Design-System'
   - 스토리에서는 design.url 에 `${FIGMA_FILE}?node-id=<nodeId>` 형태를 쓰되,
     nodeId 를 모를 경우 '0-1' 로 둔다. 실제 nodeId 는 디자이너가 나중에 교체.
5. README 에 "각 스토리의 design.url 을 실제 Figma 프레임 링크로 교체" 절차 1문단 추가.

[완료 조건] Storybook 실행 시 임의 스토리에서 "Design" 탭이 보이고, 클릭 시 Figma 임베드
프레임(placeholder라도)이 로드 시도됨. build-storybook 통과.
```

---

## §10 하네스 W13 — Chromatic 배포 스크립트 (Storybook → Figma 준비)

```
[목표] Storybook Connect / story.to.design 가 읽을 수 있도록 Chromatic 배포 파이프라인을
코드로 준비한다(실제 배포는 토큰 필요 — 사람이 실행).

[할 일]
1. 의존성: `pnpm add -D chromatic` (부록 A 버전).
2. package.json script 확인: "chromatic": "chromatic --exit-zero-on-changes"
3. .github/workflows/chromatic.yml 생성(아래 내용 그대로):
------------------------------------------------------------
name: Chromatic
on: push
jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build:tw
      - uses: chromaui/action@latest
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
------------------------------------------------------------
4. 절대 토큰을 코드에 하드코딩하지 않는다. 로컬 실행은
   `CHROMATIC_PROJECT_TOKEN=xxxx pnpm chromatic` 로 안내한다.
5. README 에 Chromatic 프로젝트 생성 → 토큰 발급 → GitHub secret 등록 절차를 5줄로 기재.

[완료 조건] 워크플로 파일 존재, 스크립트 존재, 토큰 하드코딩 0건.
```

---

## §11 하네스 W14 — Figma 연동 가이드 문서

```
[목표] 사람이 수행해야 하는 Figma 양방향 연동 절차를 한글 문서로 남긴다.
사용자가 제공한 velog 기록을 근거로, 성공 경로(story.to.design)를 권장으로 명시한다.

[생성 파일 1] docs/figma-integration-guide.md (한글, 아래 목차 준수)
  1. 개요: 방향 2가지 정의
     - Figma → Storybook : @storybook/addon-designs (이미 W12에서 코드 완료)
     - Storybook → Figma : Chromatic 배포 후 Figma 플러그인으로 임포트
  2. Figma → Storybook 절차
     - addon-designs 설치/설정(완료 상태), 스토리 design.url 교체 방법, Design 탭 확인.
  3. Storybook → Figma 절차 — 3개 플러그인 비교 (사용자 기록 반영)
     3-1. Storybook Connect : Chromatic 배포 + Public 필요. Private 프로젝트 한계 명시.
          Chromatic 도메인 형식만 허용: https://<branch>--<projectId>.chromatic.com
     3-2. Anima : 베타 토큰 필요, 설정 복잡 → 비권장(사용자 판단 기록).
     3-3. story.to.design : 제약 적고 간단 → ★권장. Select story → args import → Add to canvas.
  4. 권장 워크플로 요약: story.to.design 우선, 사내 Private면 Storybook Connect는 Public 전환 필요.
  5. 트러블슈팅: "Failed to fetch dynamically imported module" 시 팝업 닫고 재시도 등.

[생성 파일 2] src/docs/FigmaGuide.mdx (title: 'Docs/Figma 연동 가이드')
  - 위 md 내용의 핵심 요약을 Storybook Docs 페이지로 노출(Meta of title 'Docs/Figma 연동 가이드').

[완료 조건] md + mdx 두 문서 존재, Storybook 사이드바에 'Docs/Figma 연동 가이드' 노출.
```

---

## §12 하네스 W15 — 통합 검증

```
[목표] 최종 산출물이 §1을 모두 만족하는지 기계적으로 검증한다. 코드 수정 금지(발견 시 보고만).

[체크리스트 실행]
1. `pnpm install --frozen-lockfile` 성공.
2. `pnpm build:tw` 성공(tailwind.generated.css 생성 확인).
3. `pnpm build-storybook` 에러 0 통과. 로그 저장.
4. 스토리 파일 개수 검증:
   - Frameworks: 7 × 5 = 35개.
   - Icons: 2개. Styling: 4개. Docs(mdx): 1개. → 총 스토리 엔트리 42 + 1 MDX.
5. 전역 오염 검증: 빌드 산출물/DOM에서 프레임워크 CSS가 document head에 들어가지 않았는지 확인
   (FrameworkScope 미사용 스토리 0건 — grep 로 확인).
6. design 파라미터 검증: 모든 프레임워크/아이콘 스토리 meta 에 parameters.design 존재(grep).
7. 토큰 하드코딩 0건(grep 로 chromatic token/figma token 문자열 없음 확인).

[완료 조건] 위 7항목 결과를 표로 보고. 하나라도 실패면 FAIL 표시 + 원인 파일 지목.
```

---

## 부록 A — 고정 버전표

> 설치 시점 최신 안정 버전이 아래와 다르면, **메이저는 고정**하고 마이너/패치만 상향 허용.
> 설치 후 반드시 `pnpm-lock.yaml`을 커밋한다.

**dependencies**

| 패키지 | 버전 범위 | 용도 |
|---|---|---|
| react | ^18.3 | 런타임 |
| react-dom | ^18.3 | 런타임 |
| bootstrap | ^5.3 | 프레임워크 |
| foundation-sites | ^6.9 | 프레임워크 |
| bulma | ^1.0 | 프레임워크 |
| materialize-css | ^1.0.0 | 프레임워크 (정적 마크업만 사용) |
| semantic-ui-css | ^2.5 | 프레임워크 |
| skeleton-css | ^2.0 | 프레임워크 |
| normalize.css | ^8.0 | Skeleton 선행 리셋 |
| bootstrap-icons | ^1.11 | 아이콘(폰트) |
| @heroicons/react | ^2.1 | 아이콘(Tailwind SVG) |
| styled-components | ^6.1 | 스타일링 조합 |

**devDependencies**

| 패키지 | 버전 범위 | 용도 |
|---|---|---|
| typescript | ^5.4 | 타입 |
| vite | ^5.x | 번들러 |
| @vitejs/plugin-react | ^4.x | React 플러그인 |
| storybook | ^8.x | Storybook 코어 |
| @storybook/react-vite | ^8.x | 프레임워크 |
| @storybook/addon-essentials | ^8.x | 기본 애드온 |
| @storybook/addon-designs | ^8.x | Figma Design 탭 |
| tailwindcss | ^3.4 | Tailwind |
| postcss | ^8.x | Tailwind 빌드 |
| autoprefixer | ^10.x | Tailwind 빌드 |
| sass | ^1.x | SCSS |
| @types/styled-components | ^5.1 | 타입 |
| @types/react | ^18.3 | 타입 |
| @types/react-dom | ^18.3 | 타입 |
| chromatic | ^11.x | 배포 |

---

## 부록 B — 파일 트리 (완성 기준)

```
css-frameworks-storybook/
├─ .storybook/
│  ├─ main.ts                 # addons에 addon-designs, stories 글롭 고정
│  └─ preview.ts
├─ .github/workflows/chromatic.yml
├─ docs/
│  └─ figma-integration-guide.md
├─ src/
│  ├─ shared/
│  │  ├─ FrameworkScope.tsx
│  │  ├─ vite-inline-css.d.ts
│  │  └─ figma.ts
│  ├─ frameworks/
│  │  ├─ bootstrap/{Button,Card,Form,Alert,Navbar}.stories.tsx
│  │  ├─ foundation/{...5}.stories.tsx
│  │  ├─ bulma/{...5}.stories.tsx
│  │  ├─ tailwind/
│  │  │  ├─ tailwind.source.css
│  │  │  ├─ tailwind.generated.css   # build:tw 산출물(커밋)
│  │  │  └─ {...5}.stories.tsx
│  │  ├─ materialize/{...5}.stories.tsx
│  │  ├─ semantic-ui/{...5}.stories.tsx
│  │  └─ skeleton/{...5}.stories.tsx
│  ├─ icons/
│  │  ├─ BootstrapIcons.stories.tsx
│  │  └─ Heroicons.stories.tsx
│  ├─ styling/
│  │  ├─ css/{ProfileCard.tsx,ProfileCard.css,ProfileCard.stories.tsx}
│  │  ├─ scss/{ProfileCard.tsx,ProfileCard.scss,ProfileCard.stories.tsx}
│  │  ├─ css-modules/{ProfileCard.tsx,ProfileCard.module.css,ProfileCard.stories.tsx}
│  │  └─ styled/{ProfileCard.tsx,ProfileCard.stories.tsx}
│  └─ docs/FigmaGuide.mdx
├─ tailwind.config.cjs
├─ postcss.config.cjs
├─ package.json
├─ pnpm-lock.yaml
└─ README.md
```

---

### 실행 명령 요약 (사람용)

```bash
pnpm install
pnpm build:tw          # Tailwind CSS 생성 (스토리 렌더 선행 필요)
pnpm storybook         # 로컬 개발 (http://localhost:6006)
pnpm build-storybook   # 정적 빌드 검증
CHROMATIC_PROJECT_TOKEN=xxxx pnpm chromatic   # 배포 (토큰 필요)
```
