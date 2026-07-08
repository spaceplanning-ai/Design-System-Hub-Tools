import { defineComponentMeta } from '../../../core/defineComponent';

export const listItemMeta = defineComponentMeta({
  name: 'ListItem',
  slug: 'list-item',
  category: 'molecule',
  description:
    'Row with leading media, title/description text and trailing content; optionally interactive/selectable.',
  tags: ['list', 'composition'],
  variantProps: [
    {
      name: 'type',
      label: 'Type',
      options: ['A', 'B'],
      default: 'A',
      description: 'Layout preset — A: compact row · B: comfortable two-line.',
    },
    { name: 'variant', label: 'Type', options: ['default', 'interactive'], default: 'default' },
    { name: 'size', label: 'Size', options: ['sm', 'md', 'lg'], default: 'md' },
  ],
  componentProps: [
    { name: 'title', type: 'text', default: 'List item title', figmaType: 'TEXT' },
    { name: 'description', type: 'text', figmaType: 'TEXT' },
    { name: 'leading', type: 'instanceSwap', figmaType: 'INSTANCE_SWAP' },
    { name: 'trailing', type: 'instanceSwap', figmaType: 'INSTANCE_SWAP' },
    { name: 'selected', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
    {
      name: 'withChevron',
      type: 'boolean',
      default: false,
      figmaType: 'BOOLEAN',
      description: 'Trailing navigation chevron.',
    },
    {
      name: 'dragHandle',
      type: 'boolean',
      default: false,
      figmaType: 'BOOLEAN',
      description: 'Leading drag handle for reordering.',
    },
    { name: 'disabled', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
  ],
  states: ['default', 'hover', 'focus', 'active', 'disabled'],
  a11y: {
    keyboard: ['Enter/Space: activate (interactive)'],
    notes: ['Interactive items render as a button with aria-current when selected.'],
  },
  responsive: 'Fills container width; trailing content wraps below on very narrow rows.',
  figma: {
    layoutMode: 'HORIZONTAL',
    itemSpacing: 'space.3',
    paddingX: 'space.3',
    paddingY: 'space.2',
    counterAxisAlign: 'CENTER',
  },
});
