import { defineComponentMeta } from '../../../core/defineComponent';

export const sliderMeta = defineComponentMeta({
  name: 'Slider',
  slug: 'slider',
  category: 'atom',
  description:
    'Single-value range slider built on a native <input type="range"> for full keyboard and accessibility support, styled across sizes and tones with a live value readout.',
  tags: ['form', 'input', 'range'],
  variantProps: [
    { name: 'size', label: 'Size', options: ['sm', 'md', 'lg'], default: 'md' },
    {
      name: 'tone',
      label: 'Tone',
      options: ['brand', 'neutral', 'success', 'warning', 'danger'],
      default: 'brand',
    },
  ],
  componentProps: [
    { name: 'min', type: 'number', default: 0, figmaType: 'TEXT' },
    { name: 'max', type: 'number', default: 100, figmaType: 'TEXT' },
    { name: 'step', type: 'number', default: 1, figmaType: 'TEXT' },
    { name: 'value', type: 'number', figmaType: 'TEXT' },
    {
      name: 'showValue',
      type: 'boolean',
      default: false,
      figmaType: 'BOOLEAN',
      description: 'Show the live value readout.',
    },
    { name: 'disabled', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
  ],
  states: ['default', 'hover', 'focus', 'disabled'],
  tokens: [
    { property: 'fill', token: 'color.brand.solid', when: { tone: 'brand' } },
    { property: 'track', token: 'color.bg.muted' },
    { property: 'corner-radius', token: 'radius.pill' },
  ],
  a11y: {
    role: 'slider',
    keyboard: ['Arrow keys: step', 'Home / End: min / max', 'PageUp / PageDown: large step'],
    notes: [
      'Native range input exposes value/min/max to assistive tech; pass `aria-label` when there is no visible label.',
    ],
  },
  responsive: 'Fills container width; the thumb and track scale with `size`.',
  figma: {
    layoutMode: 'HORIZONTAL',
    itemSpacing: 'space.3',
    counterAxisAlign: 'CENTER',
  },
});
