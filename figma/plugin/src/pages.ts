// Page taxonomy + deterministic classifier for the reproduced design system.
// Output is organized into auto-generated Figma Pages by functional category
// (instead of three category sections on one page). The order below is deliberate.

import type { ComponentDef } from './types';
import { log, warn } from './log';

/**
 * Ordered page taxonomy. The first doc page carries no component sets:
 * index 0 (Foundation) holds the design-system cover + the token showcase.
 * The rest are component pages.
 */
export const PAGE_TITLES = [
  'Foundation',
  'Layout',
  'Navigation',
  'Actions',
  'Input',
  'Data Display',
  'Feedback',
  'Overlay',
] as const;

export type PageTitle = (typeof PAGE_TITLES)[number];

/** Canonical page node name, e.g. "TDS · 2. Layout". */
export function pageName(title: string): string {
  const idx = PAGE_TITLES.indexOf(title as PageTitle);
  return `TDS · ${idx + 1}. ${title}`;
}

/**
 * Map a component to its functional page. Rules are evaluated FIRST MATCH WINS —
 * this order resolves multi-tag components correctly (e.g. Tooltip is
 * `overlay,feedback` but belongs to Feedback; Toast is `feedback,overlay` → Feedback).
 */
export function pageForComponent(comp: ComponentDef): PageTitle {
  const tags = (comp.tags || []).map((t) => t.toLowerCase());
  const has = (...want: string[]) => want.some((w) => tags.includes(w));

  if (has('chart', 'data-viz')) return 'Data Display';
  if (has('feedback')) return 'Feedback';
  if (has('overlay')) return 'Overlay';
  if (has('layout', 'surface', 'container', 'separator', 'list')) return 'Layout';
  if (has('navigation')) return 'Navigation';
  if (has('action', 'auth', 'oauth', 'social-login')) return 'Actions';
  if (has('form', 'input', 'selection', 'search', 'upload', 'date', 'toggle', 'range'))
    return 'Input';
  return 'Data Display';
}

/** Count classified components per page, surfacing drift if the sum ≠ defs.length. */
export function classifyCounts(defs: ComponentDef[]): Record<PageTitle, number> {
  const counts = {} as Record<PageTitle, number>;
  for (const t of PAGE_TITLES) counts[t] = 0;
  for (const d of defs) counts[pageForComponent(d)]++;
  const sum = PAGE_TITLES.reduce((a, t) => a + counts[t], 0);
  if (sum !== defs.length) {
    warn(`Page classifier drift: classified ${sum} components but manifest has ${defs.length}`);
  }
  return counts;
}

export interface Pages {
  byTitle: Map<PageTitle, PageNode>;
  order: PageNode[];
}

/**
 * Create the pages in order. The current page is reused as the first page (Foundation,
 * renamed); the rest are created with figma.createPage(). Callers set the current page
 * with setCurrentPageAsync before creating that page's nodes.
 */
export function createPages(): Pages {
  const byTitle = new Map<PageTitle, PageNode>();
  const order: PageNode[] = [];
  PAGE_TITLES.forEach((title, i) => {
    const page = i === 0 ? figma.currentPage : figma.createPage();
    page.name = pageName(title);
    byTitle.set(title, page);
    order.push(page);
  });

  log(`Pages: ${order.length} (Foundation reused + ${order.length - 1} created)`);
  return { byTitle, order };
}
