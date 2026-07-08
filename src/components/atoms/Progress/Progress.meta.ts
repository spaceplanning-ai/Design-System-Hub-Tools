import { defineComponentMeta } from '../../../core/defineComponent';

export const progressMeta = defineComponentMeta({
  name: 'Progress',
  slug: 'progress',
  category: 'atom',
  description: 'Linear progress indicator supporting determinate and indeterminate modes.',
  tags: ['feedback', 'loading'],
  variantProps: [
    { name: 'tone', label: 'Tone', options: ['brand', 'success', 'warning', 'danger'], default: 'brand' },
    { name: 'size', label: 'Size', options: ['sm', 'md', 'lg'], default: 'md' },
    { name: 'shape', label: 'Shape', options: ['pill', 'square'], default: 'pill' },
  ],
  componentProps: [
    { name: 'value', type: 'number', default: 60, figmaType: 'TEXT' },
    { name: 'max', type: 'number', default: 100, figmaType: 'TEXT' },
    { name: 'variant', type: 'select', options: ['linear', 'circular'], default: 'linear', figmaType: 'TEXT', description: 'Bar or ring.' },
    { name: 'indeterminate', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
    { name: 'showValue', type: 'boolean', default: false, figmaType: 'BOOLEAN', description: 'Render the percentage.' },
    { name: 'label', type: 'text', figmaType: 'TEXT' },
  ],
  states: ['default', 'loading'],
  a11y: { role: 'progressbar', notes: ['Exposes aria-valuenow / aria-valuemin / aria-valuemax.'] },
  responsive: 'Fills container width; height per size token.',
  figma: { layoutMode: 'NONE', cornerRadius: 'radius.pill', fill: 'color.bg.muted' },
});
