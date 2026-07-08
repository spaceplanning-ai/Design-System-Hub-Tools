import { defineComponentMeta } from '../../../core/defineComponent';

export const breadcrumbMeta = defineComponentMeta({
  name: 'Breadcrumb',
  slug: 'breadcrumb',
  category: 'molecule',
  description: 'Hierarchical navigation trail with configurable separators and overflow collapsing.',
  tags: ['navigation'],
  variantProps: [
    { name: 'size', label: 'Size', options: ['sm', 'md'], default: 'md' },
    { name: 'separator', label: 'Separator', options: ['chevron', 'slash', 'dot'], default: 'chevron' },
  ],
  componentProps: [
    { name: 'items', type: 'text', figmaType: 'TEXT', description: 'Array of { label, href, current, icon }.' },
    { name: 'maxItems', type: 'number', figmaType: 'TEXT', description: 'Collapse the middle once items exceed this count.' },
  ],
  states: ['default', 'hover', 'focus'],
  a11y: { role: 'navigation', notes: ['Wrapped in <nav aria-label="Breadcrumb">; current page uses aria-current="page".'] },
  responsive: 'Collapses middle items on narrow viewports.',
  figma: { layoutMode: 'HORIZONTAL', itemSpacing: 'space.2', counterAxisAlign: 'CENTER' },
});
