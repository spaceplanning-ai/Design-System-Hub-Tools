import { defineComponentMeta } from '../../../core/defineComponent';

export const chipMeta = defineComponentMeta({
  name: 'Chip',
  slug: 'chip',
  category: 'atom',
  description: 'Interactive, selectable/removable token for filters and multi-select input.',
  tags: ['selection', 'filter', 'interactive'],
  variantProps: [
    { name: 'variant', label: 'Type', options: ['soft', 'outline', 'solid'], default: 'soft' },
    { name: 'tone', label: 'Tone', options: ['brand', 'neutral', 'success', 'warning', 'danger', 'info'], default: 'neutral' },
    { name: 'size', label: 'Size', options: ['sm', 'md'], default: 'md' },
  ],
  componentProps: [
    { name: 'children', type: 'text', default: 'Chip', figmaType: 'TEXT' },
    { name: 'selected', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
    { name: 'removable', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
    { name: 'disabled', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
    { name: 'icon', type: 'instanceSwap', figmaType: 'INSTANCE_SWAP' },
  ],
  states: ['default', 'hover', 'focus', 'active', 'disabled'],
  a11y: {
    keyboard: ['Enter / Space: toggle selection', 'Backspace/Delete on remove button'],
    notes: ['Selectable chips expose aria-pressed; remove control has its own label.'],
  },
  responsive: 'Intrinsic width; wraps in chip groups.',
  figma: {
    layoutMode: 'HORIZONTAL',
    itemSpacing: 'space.1',
    paddingX: 'space.2',
    cornerRadius: 'radius.pill',
    counterAxisAlign: 'CENTER',
  },
});
