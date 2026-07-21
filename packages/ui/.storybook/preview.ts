// Storybook 프리뷰 설정 (@tds/ui)
// 문서 방향(ltr/rtl)을 툴바 전역으로 노출하고, 데코레이터가 html 루트에 dir 속성으로 주입한다.
//
// [다크 테마는 없다 — 2026-07-20] 어드민이 다크를 켜는 곳이 한 군데도 없다(data-theme·
// prefers-color-scheme·테마 토글 전부 0건). 쓰지 않는 표면을 유지하면 그만큼 검사·VRT 기준
// 이미지·Figma 모드가 따라 붙고, 실제로 Modal/ConfirmDialog 의 다크 스토리는 포털 때문에
// **라이트로 렌더되면서도 초록**이었다 — 아무도 보지 않는 거짓 초록이다. 그래서 걷어냈다.
import type { Decorator, Preview } from '@storybook/react';

// [주의] 아래 CSS는 tools/codegen 산출물이다 (tokens/tokens.json → generated/tokens/tokens.css).
// 리포 초기 상태에는 파일이 아직 존재하지 않으므로, Storybook 실행/빌드 전 반드시
// 루트에서 `pnpm codegen`을 선행해야 한다 (packages/ui/README.md 참고).
// 이 import 구문은 토큰 파이프라인 계약의 일부이므로 삭제/주석 처리 금지.
import '../generated/tokens/tokens.css';

// 방향 데코레이터 — RTL 스토리 검수(G5 체크리스트)용.
const withDirection: Decorator = (Story, context) => {
  const direction = String(context.globals['direction'] ?? 'ltr');
  document.documentElement.setAttribute('dir', direction);
  return Story();
};

// 뷰포트 목록 — Responsive 축 검수용.
// [왜 여기서 직접 정의하나] addon-viewport 의 INITIAL_VIEWPORTS(iPhone 5 …)는 기기 카탈로그라
// 이 제품의 폭과 무관하다. 또 `@storybook/addon-viewport` 는 packages/ui 가 직접 의존하지 않고
// addon-essentials 가 끌고 오는 전이 의존이라, 스토리에서 import 하면 phantom dependency 가 된다.
// 프리뷰 전역에 두면 각 스토리는 defaultViewport 로 이름만 가리키면 된다 (파라미터는 깊게 병합된다).
//
// [등록 경로] addon-viewport 는 main.ts 에 따로 적지 않는다 — addon-essentials 8.6.14 의
// preset 이 controls/actions/docs/backgrounds/**viewport**/toolbars/measure/outline/highlight 를
// 자동 등록한다 (`addon-essentials/dist/preset.js` 의 addons() 배열 · 실측 확인).
const VIEWPORTS = {
  mobile: {
    name: 'Mobile (360)',
    styles: { width: '360px', height: '740px' },
    type: 'mobile' as const,
  },
  tablet: {
    name: 'Tablet (768)',
    styles: { width: '768px', height: '1024px' },
    type: 'tablet' as const,
  },
  desktop: {
    name: 'Desktop (1280)',
    styles: { width: '1280px', height: '800px' },
    type: 'desktop' as const,
  },
};

const preview: Preview = {
  decorators: [withDirection],
  globalTypes: {
    direction: {
      description: '문서 방향 — html[dir]로 주입 (RTL 검수용)',
      toolbar: {
        title: 'Direction',
        icon: 'transfer',
        items: ['ltr', 'rtl'],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    direction: 'ltr',
  },
  parameters: {
    // 사이드바 정렬 — 단일 루트 'Design System' 아래 4계층(+Catalog) 순서.
    // Foundations(토큰) → Components(컴포넌트) → Patterns(합성) → Templates(어드민 페이지) → Catalog(분류표 체크리스트).
    options: {
      storySort: {
        order: ['Design System', ['Foundations', 'Components', 'Patterns', 'Templates', 'Catalog']],
      },
    },
    // 배경 — 표면 대비를 눈으로 확인하는 용도만 남긴다. 하드코딩 hex 0건.
    // (예전엔 light/dark 페어였으나 다크 테마를 걷어내면서 dark 항목이 함께 사라졌다.)
    backgrounds: {
      default: 'surface',
      values: [{ name: 'surface', value: 'var(--tds-primitive-color-gray-0)' }],
    },
    // 뷰포트 — 목록만 전역으로 깔고 default 는 지정하지 않는다.
    // 여기서 defaultViewport 를 박으면 스토리 501건의 렌더 폭이 한꺼번에 바뀌어
    // VRT 기준 이미지(A70 소유)를 전건 무효화한다. 폭 고정은 각 컴포넌트의
    // Responsive 전용 스토리가 자기 파라미터로만 한다.
    viewport: {
      viewports: VIEWPORTS,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
