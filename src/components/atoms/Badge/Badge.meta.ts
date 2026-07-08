import { defineComponentMeta } from '../../../core/defineComponent';

export const badgeMeta = defineComponentMeta({
  name: 'Badge',
  slug: 'badge',
  category: 'atom',
  description: 'Compact status/label indicator. Non-interactive.',
  tags: ['status', 'label'],
  variantProps: [
    { name: 'variant', label: 'Type', options: ['solid', 'soft', 'outline'], default: 'soft' },
    {
      name: 'tone',
      label: 'Tone',
      options: ['brand', 'neutral', 'success', 'warning', 'danger', 'info'],
      default: 'neutral',
    },
    { name: 'size', label: 'Size', options: ['sm', 'md'], default: 'md' },
    { name: 'shape', label: 'Shape', options: ['rounded', 'pill'], default: 'pill' },
  ],
  componentProps: [
    { name: 'children', type: 'text', default: 'Badge', figmaType: 'TEXT' },
    { name: 'dot', type: 'boolean', default: false, figmaType: 'BOOLEAN', description: 'Show a leading status dot.' },
    { name: 'icon', type: 'instanceSwap', figmaType: 'INSTANCE_SWAP', description: 'Leading icon slot.' },
    { name: 'count', type: 'number', figmaType: 'TEXT', description: 'Numeric value; renders as {max}+ above the cap.' },
    { name: 'max', type: 'number', default: 99, figmaType: 'TEXT', description: 'Cap for count.' },
  ],
  states: ['default'],
  a11y: { notes: ['Decorative by default; convey status in text, not color alone.'] },
  responsive: 'Intrinsic width; wraps with surrounding text.',
  figma: {
    layoutMode: 'HORIZONTAL',
    itemSpacing: 'space.1',
    paddingX: 'space.2',
    paddingY: 'space.0.5',
    cornerRadius: 'radius.pill',
    fill: 'color.neutral.subtle',
  },
});
