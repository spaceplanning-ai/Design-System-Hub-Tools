import { defineComponentMeta } from '../../../core/defineComponent';

export const radarChartMeta = defineComponentMeta({
  name: 'RadarChart',
  slug: 'radar-chart',
  category: 'molecule',
  description:
    'Multivariate comparison chart. Token-driven SVG polar grid with one axis per variable, recessive concentric gridlines and a legend for multiple series. Type A: filled polygons · Type B: line-only outlines.',
  tags: ['chart', 'data-viz', 'multivariate'],
  variantProps: [
    {
      name: 'type',
      label: 'Type',
      options: ['A', 'B'],
      default: 'A',
      description: 'A: translucent filled polygons · B: line-only outlines.',
    },
  ],
  componentProps: [
    {
      name: 'size',
      type: 'number',
      default: 220,
      figmaType: 'TEXT',
      description: 'Square plot size in px.',
    },
  ],
  states: ['default'],
  a11y: {
    role: 'img',
    notes: [
      'Rendered as `role="img"` with an `aria-label` summary.',
      'Legend + per-vertex axis labels give identity beyond color (never color-alone).',
    ],
  },
  responsive: 'SVG scales to the container width; the plot stays square via a fixed viewBox.',
  figma: {
    layoutMode: 'VERTICAL',
    itemSpacing: 'space.3',
    fill: 'color.bg.surface',
  },
});
