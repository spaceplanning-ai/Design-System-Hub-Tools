import { defineComponentMeta } from '../../../core/defineComponent';

export const scatterChartMeta = defineComponentMeta({
  name: 'ScatterChart',
  slug: 'scatter-chart',
  category: 'molecule',
  description:
    'Correlation chart plotting (x, y) points on two numeric axes. Token-driven SVG with recessive gridlines, per-point hover tooltip and a legend for multiple series. Type A: points · Type B: points + linear (least-squares) trend line.',
  tags: ['chart', 'data-viz', 'correlation', 'scatter'],
  variantProps: [
    {
      name: 'type',
      label: 'Type',
      options: ['A', 'B'],
      default: 'A',
      description: 'A: 점 · B: 점+회귀 추세선(옵션)',
    },
  ],
  componentProps: [
    {
      name: 'height',
      type: 'number',
      default: 220,
      figmaType: 'TEXT',
      description: 'Plot height in px.',
    },
    {
      name: 'xLabel',
      type: 'text',
      figmaType: 'TEXT',
      description: 'X-axis caption.',
    },
    {
      name: 'yLabel',
      type: 'text',
      figmaType: 'TEXT',
      description: 'Y-axis caption.',
    },
  ],
  states: ['default'],
  a11y: {
    role: 'img',
    notes: [
      'Rendered as `role="img"` with an `aria-labelledby` summary.',
      'Legend gives series identity beyond color (never color-alone).',
    ],
  },
  responsive: 'SVG scales to the container width; height fixed via the `height` prop.',
  figma: { layoutMode: 'VERTICAL', itemSpacing: 'space.3', fill: 'color.bg.surface' },
});
