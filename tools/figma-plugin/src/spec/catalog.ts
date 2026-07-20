/**
 * 카테고리 분류/정렬 — **순수 계층**.
 *
 * 카테고리 정본 순서는 main.ts 의 COMPONENT_CATEGORY_ORDER 와 tds-doc.ts 의 COMPONENT_CATEGORIES
 * 가 각각 텍스트로 들고 있고(tools/codegen validate-contract 의 checkCategoryOrderSync 가 4개
 * 소비처를 텍스트 동기화 검사한다), 이 모듈은 그 배열을 **인자로 받는다** — 정본을 옮기지 않는다.
 */

export interface CategorizedItem {
  name: string;
  category: string;
}

export interface CategoryGroup<T extends CategorizedItem> {
  category: string;
  items: T[];
}

/** 카테고리 미지정 계약이 떨어지는 기본 칸 */
export const FALLBACK_CATEGORY = 'Utilities';

/**
 * 계약을 카테고리별로 묶는다.
 * - 정본 순서를 그대로 따르고, 계약이 0개인 카테고리도 **빈 그룹으로 남긴다**(Figma 페이지 골격 유지).
 * - 정본에 없는 카테고리는 뒤에 등장 순서대로 붙인다(누락 0).
 * - 그룹 안 순서는 이름 오름차순 — 재실행해도 같은 격자가 나오도록 결정적으로 고정한다.
 */
export function groupByCategory<T extends CategorizedItem>(
  items: readonly T[],
  categoryOrder: readonly string[],
): Array<CategoryGroup<T>> {
  const byCategory = new Map<string, T[]>();
  for (const item of items) {
    const category = item.category.length > 0 ? item.category : FALLBACK_CATEGORY;
    const bucket = byCategory.get(category);
    if (bucket) bucket.push(item);
    else byCategory.set(category, [item]);
  }

  const extras = [...byCategory.keys()].filter((c) => categoryOrder.indexOf(c) < 0).sort();
  const ordered = [...categoryOrder, ...extras];

  return ordered.map((category) => ({
    category,
    items: [...(byCategory.get(category) ?? [])].sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
    ),
  }));
}

/** 카테고리 → Figma 페이지 이름. main.ts/tds-doc.ts 가 같은 규칙을 써야 페이지가 맞물린다 */
export function categoryPageBase(category: string): string {
  return `🧩 Components — ${category}`;
}
