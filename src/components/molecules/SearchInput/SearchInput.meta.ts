import { defineComponentMeta } from '../../../core/defineComponent';

export const searchInputMeta = defineComponentMeta({
  name: 'SearchInput',
  slug: 'search-input',
  category: 'molecule',
  description: 'Search field composing Input with a leading search icon, clear affordance and submit-on-Enter.',
  tags: ['form', 'search', 'composition'],
  variantProps: [
    { name: 'variant', label: 'Type', options: ['outline', 'filled'], default: 'outline' },
    { name: 'size', label: 'Size', options: ['sm', 'md', 'lg'], default: 'md' },
  ],
  componentProps: [
    { name: 'placeholder', type: 'text', default: 'Search…', figmaType: 'TEXT' },
    { name: 'value', type: 'text', figmaType: 'TEXT' },
    { name: 'loading', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
    { name: 'clearable', type: 'boolean', default: true, figmaType: 'BOOLEAN' },
    { name: 'filterActive', type: 'boolean', default: false, figmaType: 'BOOLEAN', description: 'Highlight the filter button (needs onFilter).' },
    { name: 'disabled', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
  ],
  states: ['default', 'focus', 'loading', 'disabled'],
  a11y: { role: 'searchbox', keyboard: ['Enter: submit', 'Escape: clear'] },
  responsive: 'Fills container width.',
  figma: { layoutMode: 'HORIZONTAL', itemSpacing: 'space.2', counterAxisAlign: 'CENTER' },
});
