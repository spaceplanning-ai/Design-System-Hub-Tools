import { defineComponentMeta } from '../../../core/defineComponent';

export const tagMeta = defineComponentMeta({
  name: 'Tag',
  slug: 'tag',
  category: 'atom',
  description: 'Static, optionally-dismissable keyword label for categorisation.',
  tags: ['label', 'metadata'],
  variantProps: [
    { name: 'variant', label: 'Type', options: ['soft', 'outline', 'solid'], default: 'outline' },
    { name: 'tone', label: 'Tone', options: ['brand', 'neutral', 'success', 'warning', 'danger', 'info'], default: 'neutral' },
    { name: 'size', label: 'Size', options: ['sm', 'md'], default: 'md' },
    { name: 'shape', label: 'Shape', options: ['rounded', 'pill'], default: 'rounded' },
  ],
  componentProps: [
    { name: 'children', type: 'text', default: 'Tag', figmaType: 'TEXT' },
    { name: 'icon', type: 'instanceSwap', figmaType: 'INSTANCE_SWAP', description: 'Leading icon or status dot.' },
    { name: 'closable', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
    { name: 'disabled', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
  ],
  states: ['default', 'hover', 'focus', 'disabled'],
  a11y: { notes: ['Dismiss control carries its own aria-label.'] },
  responsive: 'Intrinsic width; wraps in tag lists.',
  figma: {
    layoutMode: 'HORIZONTAL',
    itemSpacing: 'space.1',
    paddingX: 'space.2',
    cornerRadius: 'radius.sm',
    counterAxisAlign: 'CENTER',
  },
});
