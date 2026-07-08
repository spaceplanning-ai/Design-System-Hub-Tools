import { defineComponentMeta } from '../../../core/defineComponent';

export const lineChartMeta = defineComponentMeta({
  name: 'LineChart',
  slug: 'line-chart',
  category: 'molecule',
  description:
    'Change-over-time chart. Token-driven SVG with one axis, recessive gridlines, a legend for multiple series and direct end-labels. Type A: lines · Type B: filled area.',
  tags: ['chart', 'data-viz', 'time-series'],
  variantProps: [
    {
      name: 'type',
      label: 'Type',
      options: ['A', 'B'],
      default: 'A',
      description: 'A: line · B: filled area.',
    },
  ],
  componentProps: [
    {
      name: 'height',
      type: 'number',
      default: 200,
      figmaType: 'TEXT',
      description: 'Plot height in px.',
    },
    {
      name: 'showDots',
      type: 'boolean',
      default: false,
      figmaType: 'BOOLEAN',
      description: 'Show point markers.',
    },
  ],
  states: ['default'],
  a11y: {
    role: 'img',
    notes: [
      'Rendered as `role="img"` with an `aria-label` summary.',
      'Legend + direct end-labels give identity beyond color (never color-alone).',
    ],
  },
  responsive: 'SVG scales to the container width; height fixed via the `height` prop.',
  figma: { layoutMode: 'VERTICAL', itemSpacing: 'space.3', fill: 'color.bg.surface' },
});
