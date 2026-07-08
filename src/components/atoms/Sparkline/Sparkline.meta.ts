import { defineComponentMeta } from '../../../core/defineComponent';

export const sparklineMeta = defineComponentMeta({
  name: 'Sparkline',
  slug: 'sparkline',
  category: 'atom',
  description:
    'Compact, axis-less trend chart sized to sit inline with text or in a stat tile. Token-driven SVG. Type A: line (with optional emphasized endpoint) · Type B: bars.',
  tags: ['chart', 'data-viz', 'inline'],
  variantProps: [
    {
      name: 'type',
      label: 'Type',
      options: ['A', 'B'],
      default: 'A',
      description: 'A: line · B: bars.',
    },
    { name: 'color', label: 'Series color', options: ['1', '2', '3', '4', '5', '6'], default: '1' },
  ],
  componentProps: [
    { name: 'width', type: 'number', default: 96, figmaType: 'TEXT' },
    { name: 'height', type: 'number', default: 28, figmaType: 'TEXT' },
    {
      name: 'endDot',
      type: 'boolean',
      default: true,
      figmaType: 'BOOLEAN',
      description: 'Emphasize the last point (line).',
    },
  ],
  states: ['default'],
  a11y: {
    role: 'img',
    notes: [
      'Rendered as `role="img"` with an `aria-label`; pair with a visible value for meaning.',
    ],
  },
  responsive: 'Fixed width/height; meant to be small and inline.',
  figma: { layoutMode: 'NONE' },
});
