import { defineComponentMeta } from '../../../core/defineComponent';

export const barChartMeta = defineComponentMeta({
  name: 'BarChart',
  slug: 'bar-chart',
  category: 'molecule',
  description:
    'Categorical magnitude chart. Token-driven SVG bars anchored to the baseline with direct value labels (relief for the palette’s low-contrast hues). Type A: vertical columns · Type B: horizontal bars.',
  tags: ['chart', 'data-viz', 'magnitude'],
  variantProps: [
    {
      name: 'type',
      label: 'Type',
      options: ['A', 'B'],
      default: 'A',
      description: 'Orientation — A: vertical columns · B: horizontal bars.',
    },
    { name: 'color', label: 'Series color', options: ['1', '2', '3', '4', '5', '6'], default: '1' },
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
      name: 'showValues',
      type: 'boolean',
      default: true,
      figmaType: 'BOOLEAN',
      description: 'Direct value labels on bars.',
    },
  ],
  states: ['default'],
  a11y: {
    role: 'img',
    notes: [
      'Rendered as `role="img"` with an `aria-label` summary; each bar has a `<title>` for hover.',
      'Direct value labels satisfy the relief rule for low-contrast categorical hues.',
    ],
  },
  responsive: 'SVG scales to the container width; height is fixed via the `height` prop.',
  figma: {
    layoutMode: 'VERTICAL',
    itemSpacing: 'space.3',
    fill: 'color.bg.surface',
  },
});
