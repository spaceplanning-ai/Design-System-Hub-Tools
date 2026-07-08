import { defineComponentMeta } from '../../../core/defineComponent';

export const heatmapMeta = defineComponentMeta({
  name: 'Heatmap',
  slug: 'heatmap',
  category: 'molecule',
  description:
    'Matrix magnitude chart. A single-hue sequential ramp encodes each cell value (light = low → dark = high) over `var(--chart-1)`, with row/column labels, a hover tooltip and a low→high scale legend. Type A: square cells · Type B: value labels shown in cells.',
  tags: ['chart', 'data-viz', 'matrix', 'heatmap'],
  variantProps: [
    {
      name: 'type',
      label: 'Type',
      options: ['A', 'B'],
      default: 'A',
      description: 'A: 사각 셀 · B: 값 라벨 표시.',
    },
  ],
  componentProps: [
    {
      name: 'ariaLabel',
      type: 'text',
      figmaType: 'TEXT',
      description: 'Accessible summary; falls back to an auto-generated matrix summary.',
    },
  ],
  states: ['default'],
  a11y: {
    role: 'img',
    notes: [
      'Rendered as `role="img"` with an `aria-labelledby` summary (dimensions + min/max).',
      'Magnitude is a single-hue sequential ramp; hover tooltips and Type B value labels give a non-color read of each cell.',
    ],
  },
  responsive: 'CSS grid fills the container width; cells share a fixed aspect and reflow with it.',
  figma: {
    layoutMode: 'VERTICAL',
    itemSpacing: 'space.3',
    fill: 'color.bg.surface',
  },
});
