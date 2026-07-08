import { defineComponentMeta } from '../../../core/defineComponent';

export const comboboxMeta = defineComponentMeta({
  name: 'Combobox',
  slug: 'combobox',
  category: 'molecule',
  description:
    'Single-select with type-to-filter. Composes the Input field with a filtered listbox popup and full keyboard navigation (ARIA combobox pattern).',
  tags: ['form', 'selection', 'search', 'composition'],
  variantProps: [
    { name: 'variant', label: 'Type', options: ['outline', 'filled'], default: 'outline' },
    { name: 'size', label: 'Size', options: ['sm', 'md', 'lg'], default: 'md' },
  ],
  componentProps: [
    { name: 'placeholder', type: 'text', default: '검색 또는 선택', figmaType: 'TEXT' },
    {
      name: 'value',
      type: 'text',
      figmaType: 'TEXT',
      description: 'Selected option value (controlled).',
    },
    { name: 'emptyText', type: 'text', default: '결과가 없습니다', figmaType: 'TEXT' },
    { name: 'clearable', type: 'boolean', default: true, figmaType: 'BOOLEAN' },
    { name: 'disabled', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
  ],
  states: ['default', 'hover', 'focus', 'disabled', 'error'],
  a11y: {
    role: 'combobox',
    keyboard: [
      'ArrowDown / ArrowUp: open + move active option',
      'Enter: select active option',
      'Escape: close',
      'Home / End: first / last option',
    ],
    notes: [
      'Input carries `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-autocomplete="list"` and `aria-activedescendant`.',
      'The list is `role="listbox"`; each item is `role="option"` with `aria-selected`.',
    ],
  },
  responsive: 'Fills container width; the listbox is anchored below and scrolls when tall.',
  figma: {
    layoutMode: 'VERTICAL',
    itemSpacing: 'space.1',
    cornerRadius: 'radius.control',
    fill: 'color.field.bg',
    strokeColor: 'color.field.border',
    strokeWidth: 'border.width.1',
  },
});
