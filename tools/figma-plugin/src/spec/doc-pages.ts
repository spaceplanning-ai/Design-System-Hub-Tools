/**
 * 문서 페이지 순서 계획 — **순수 계층**. Figma API 를 참조하지 않는다.
 *
 * 페이지 순서는 조용히 퇴행하기 쉬운 축이다(한 줄만 밀려도 아무도 눈치채지 못한다).
 * 그래서 "어떤 페이지가 어떤 순서로, 구분선은 어디에" 를 여기서 결정하고 vitest 가 전수 검사한다.
 * tds-doc.ts 는 이 계획을 받아 페이지를 확보/정렬하기만 한다.
 */

/** 파운데이션 페이지의 역할 — 표시명(=멱등 키)과 분리해 둔다 */
export type DocPageRole =
  | 'validation'
  | 'cover'
  | 'colors'
  | 'typography'
  | 'icon'
  | 'spacing'
  | 'component'
  | 'menu'
  | 'pages';

export type DocPagePlanItem =
  | {
      kind: 'page';
      /** 페이지 멱등 키(tdsBase). 표시명은 여기에 순번 접두어가 붙은 형태다 */
      base: string;
      role: DocPageRole;
    }
  | { kind: 'divider' };

export interface DocPagePlanInput {
  /** 파운데이션 5장의 멱등 키 */
  foundations: {
    /** 검증 페이지 — 맨 앞에 온다. 이 한 장만 열어도 산출물 상태를 판단할 수 있어야 한다 */
    validation: string;
    cover: string;
    colors: string;
    typography: string;
    icon: string;
    spacing: string;
  };
  /** 🧩 Components — <카테고리> 페이지들 (정본 카테고리 순서로 이미 정렬돼 있어야 한다) */
  componentBases: readonly string[];
  /**
   * 앱 nav 구조 — 섹션(일반 관리·비즈니스…)마다 메뉴 페이지가 딸린다.
   * 비어 있으면 단일 안내 페이지(pages) 하나로 떨어진다.
   */
  menuSections: ReadonlyArray<{ title: string; menuBases: readonly string[] }>;
  /** menuSections 가 비었을 때 쓸 단일 '📄 Pages' 안내 페이지의 멱등 키 */
  pagesFallbackBase: string;
}

/**
 * 최종 페이지 순서를 계획한다.
 *
 *   Validation → Cover → Colors → Typography → Icon → Spacing·Radius·Shadow
 *   → 구분선 → 🧩 Components(카테고리별)
 *   → (섹션마다) 구분선 → 메뉴 페이지들
 *
 * 구분선은 🧩 Components **앞**과 각 Pages 섹션 **앞**에 놓인다 — Figma 페이지 목록이
 * '파운데이션 / 컴포넌트 / 화면' 세 덩어리로 읽힌다.
 */
export function planDocPages(input: DocPagePlanInput): DocPagePlanItem[] {
  const { foundations } = input;
  const plan: DocPagePlanItem[] = [
    // 검증 페이지가 **맨 앞**이다. 산출물이 깨졌는지 알려면 문서를 뒤질 게 아니라
    // 첫 장을 열면 되어야 한다 — 이번 세션에 결함을 사람이 스크린샷으로 찾아야 했던 이유가 그것이다.
    { kind: 'page', base: foundations.validation, role: 'validation' },
    { kind: 'page', base: foundations.cover, role: 'cover' },
    { kind: 'page', base: foundations.colors, role: 'colors' },
    { kind: 'page', base: foundations.typography, role: 'typography' },
    { kind: 'page', base: foundations.icon, role: 'icon' },
    { kind: 'page', base: foundations.spacing, role: 'spacing' },
  ];

  // 🧩 Components 앞 구분선 — 컴포넌트 페이지가 하나도 없어도 경계는 유지한다
  plan.push({ kind: 'divider' });
  for (const base of input.componentBases) {
    plan.push({ kind: 'page', base, role: 'component' });
  }

  if (input.menuSections.length === 0) {
    plan.push({ kind: 'divider' });
    plan.push({ kind: 'page', base: input.pagesFallbackBase, role: 'pages' });
    return plan;
  }

  for (const section of input.menuSections) {
    plan.push({ kind: 'divider' });
    for (const base of section.menuBases) {
      plan.push({ kind: 'page', base, role: 'menu' });
    }
  }
  return plan;
}

/** 계획에서 실제 페이지(구분선 제외)만 뽑는다 — 순번 부여 대상과 같다 */
export function numberedPages(plan: readonly DocPagePlanItem[]): string[] {
  return plan
    .filter((item): item is Extract<DocPagePlanItem, { kind: 'page' }> => item.kind === 'page')
    .map((item) => item.base);
}
