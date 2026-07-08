import { defineComponentMeta } from '../../../core/defineComponent';

export const paginationMeta = defineComponentMeta({
  name: 'Pagination',
  slug: 'pagination',
  category: 'molecule',
  description: 'Page navigation with previous/next controls and truncated page ranges.',
  tags: ['navigation'],
  variantProps: [
    { name: 'variant', label: 'Type', options: ['outline', 'ghost'], default: 'ghost' },
    { name: 'size', label: 'Size', options: ['sm', 'md', 'lg'], default: 'md' },
    { name: 'shape', label: 'Shape', options: ['rounded', 'pill'], default: 'rounded' },
  ],
  componentProps: [
    { name: 'page', type: 'number', default: 1, figmaType: 'TEXT' },
    { name: 'count', type: 'number', default: 10, figmaType: 'TEXT' },
    { name: 'siblingCount', type: 'number', default: 1, figmaType: 'TEXT' },
    { name: 'showEdges', type: 'boolean', default: false, figmaType: 'BOOLEAN', description: 'First/last page jump buttons.' },
  ],
  states: ['default', 'hover', 'focus', 'disabled'],
  a11y: {
    role: 'navigation',
    keyboard: ['Tab: move between controls', 'Enter/Space: go to page'],
    notes: ['Wrapped in <nav aria-label="Pagination"; current page uses aria-current="page".'],
  },
  responsive: 'Reduces visible page count on narrow viewports.',
  figma: { layoutMode: 'HORIZONTAL', itemSpacing: 'space.1', counterAxisAlign: 'CENTER' },
});
