import { defineComponentMeta } from '../../../core/defineComponent';

export const donutChartMeta = defineComponentMeta({
  name: 'DonutChart',
  slug: 'donut-chart',
  category: 'molecule',
  description:
    'Part-to-whole chart. Token-driven SVG segments with a 2px surface gap between slices, a legend carrying direct value/percent labels, and an optional center total. Type A: donut · Type B: pie.',
  tags: ['chart', 'data-viz', 'part-to-whole'],
  variantProps: [
    {
      name: 'type',
      label: 'Type',
      options: ['A', 'B'],
      default: 'A',
      description: 'A: donut (center hole) · B: pie (solid).',
    },
  ],
  componentProps: [
    {
      name: 'total',
      type: 'text',
      figmaType: 'TEXT',
      description: 'Center label (donut). Defaults to the sum.',
    },
    { name: 'showLegend', type: 'boolean', default: true, figmaType: 'BOOLEAN' },
  ],
  states: ['default'],
  a11y: {
    role: 'img',
    notes: [
      'Rendered as `role="img"` with an `aria-label` summary.',
      'Legend gives each slice a label + value/percent, so identity is never color-alone.',
    ],
  },
  responsive: 'Chart is square and scales to width; legend wraps below.',
  figma: { layoutMode: 'VERTICAL', itemSpacing: 'space.3', fill: 'color.bg.surface' },
});
