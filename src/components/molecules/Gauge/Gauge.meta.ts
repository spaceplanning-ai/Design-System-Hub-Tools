import { defineComponentMeta } from '../../../core/defineComponent';

export const gaugeMeta = defineComponentMeta({
  name: 'Gauge',
  slug: 'gauge',
  category: 'molecule',
  description:
    'Single-value radial gauge. A recessive track arc with a token-driven value arc filled to the value ratio, plus a large tabular value read-out and label. Type A: 180° semicircle · Type B: 270° arc.',
  tags: ['chart', 'data-viz', 'single-value'],
  variantProps: [
    {
      name: 'type',
      label: 'Type',
      options: ['A', 'B'],
      default: 'A',
      description: 'A: 반원 180° · B: 270° 아크.',
    },
    { name: 'color', label: 'Series color', options: ['1', '2', '3', '4', '5', '6'], default: '1' },
  ],
  componentProps: [
    {
      name: 'value',
      type: 'number',
      figmaType: 'TEXT',
      description: 'Current value, clamped to [min, max].',
    },
    { name: 'min', type: 'number', default: 0, figmaType: 'TEXT', description: 'Scale minimum.' },
    { name: 'max', type: 'number', default: 100, figmaType: 'TEXT', description: 'Scale maximum.' },
    { name: 'label', type: 'text', figmaType: 'TEXT', description: 'Caption below the value.' },
    {
      name: 'size',
      type: 'number',
      default: 180,
      figmaType: 'TEXT',
      description: 'Gauge diameter in px.',
    },
  ],
  states: ['default'],
  a11y: {
    role: 'meter',
    notes: [
      'Rendered as `role="meter"` with `aria-valuenow` / `aria-valuemin` / `aria-valuemax` and an `aria-label`.',
      'The value read-out is shown as text, so identity never depends on the arc color alone.',
    ],
  },
  responsive: 'SVG scales to the container width; aspect ratio fixed by the `size` prop and type.',
  figma: { layoutMode: 'VERTICAL', itemSpacing: 'space.3', fill: 'color.bg.surface' },
});
