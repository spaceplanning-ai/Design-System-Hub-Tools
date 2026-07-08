import { defineComponentMeta } from '../../../core/defineComponent';

export const skeletonMeta = defineComponentMeta({
  name: 'Skeleton',
  slug: 'skeleton',
  category: 'atom',
  description:
    'Loading placeholder that mimics the shape of content while it loads. Text, circle and rectangle shapes with an optional shimmer animation.',
  tags: ['feedback', 'loading', 'placeholder'],
  variantProps: [
    {
      name: 'shape',
      label: 'Shape',
      options: ['text', 'circle', 'rect', 'rounded'],
      default: 'text',
      description: 'Silhouette of the placeholder.',
    },
    {
      name: 'animation',
      label: 'Animation',
      options: ['shimmer', 'pulse', 'none'],
      default: 'shimmer',
    },
  ],
  componentProps: [
    {
      name: 'width',
      type: 'text',
      figmaType: 'TEXT',
      description: 'CSS width (e.g. 100%, 240px).',
    },
    {
      name: 'height',
      type: 'text',
      figmaType: 'TEXT',
      description: 'CSS height (e.g. 1em, 48px).',
    },
    {
      name: 'lines',
      type: 'number',
      default: 1,
      figmaType: 'TEXT',
      description: 'Number of text lines (shape="text").',
    },
  ],
  states: ['loading'],
  tokens: [
    { property: 'background', token: 'color.bg.muted' },
    { property: 'corner-radius', token: 'radius.sm' },
  ],
  a11y: {
    role: 'status',
    notes: [
      'Renders `aria-hidden` bones inside a `role="status"` live region; announce loading at the container level.',
    ],
  },
  responsive:
    'Width defaults to 100% of the container; height follows the current line-height for text shapes.',
  figma: {
    layoutMode: 'VERTICAL',
    itemSpacing: 'space.2',
    cornerRadius: 'radius.sm',
    fill: 'color.bg.muted',
  },
});
