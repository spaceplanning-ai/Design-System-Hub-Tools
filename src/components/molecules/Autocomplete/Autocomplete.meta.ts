import { defineComponentMeta } from '../../../core/defineComponent';

export const autocompleteMeta = defineComponentMeta({
  name: 'Autocomplete',
  slug: 'autocomplete',
  category: 'molecule',
  description:
    'Free-text field with live suggestions. Unlike Combobox the typed value is preserved even without a selection — suitable for search boxes and async lookups (loading state included).',
  tags: ['form', 'search', 'suggestions', 'composition'],
  variantProps: [
    { name: 'variant', label: 'Type', options: ['outline', 'filled'], default: 'outline' },
    { name: 'size', label: 'Size', options: ['sm', 'md', 'lg'], default: 'md' },
  ],
  componentProps: [
    { name: 'placeholder', type: 'text', default: '입력해 검색', figmaType: 'TEXT' },
    { name: 'value', type: 'text', figmaType: 'TEXT', description: 'Input text (controlled).' },
    {
      name: 'loading',
      type: 'boolean',
      default: false,
      figmaType: 'BOOLEAN',
      description: 'Async suggestions in flight.',
    },
    { name: 'emptyText', type: 'text', default: '제안이 없습니다', figmaType: 'TEXT' },
    {
      name: 'minChars',
      type: 'number',
      default: 1,
      figmaType: 'TEXT',
      description: 'Chars typed before suggestions open.',
    },
    { name: 'disabled', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
  ],
  states: ['default', 'hover', 'focus', 'loading', 'disabled', 'error'],
  a11y: {
    role: 'combobox',
    keyboard: [
      'ArrowDown / ArrowUp: move active suggestion',
      'Enter: accept active suggestion',
      'Escape: close (keeps typed text)',
    ],
    notes: [
      'Input carries `role="combobox"`, `aria-autocomplete="list"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`.',
      'Suggestions list is `role="listbox"` with `role="option"` items.',
    ],
  },
  responsive: 'Fills container width; the suggestion list anchors below and scrolls when tall.',
  figma: {
    layoutMode: 'VERTICAL',
    itemSpacing: 'space.1',
    cornerRadius: 'radius.control',
    fill: 'color.field.bg',
    strokeColor: 'color.field.border',
    strokeWidth: 'border.width.1',
  },
});
