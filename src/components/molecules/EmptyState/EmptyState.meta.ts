import { defineComponentMeta } from '../../../core/defineComponent';

export const emptyStateMeta = defineComponentMeta({
  name: 'EmptyState',
  slug: 'empty-state',
  category: 'molecule',
  description:
    'Placeholder shown when there is no data, no results or an error — an icon, a title, a supporting message and an optional primary action.',
  tags: ['feedback', 'data-display', 'composition'],
  variantProps: [
    { name: 'size', label: 'Size', options: ['sm', 'md', 'lg'], default: 'md' },
    { name: 'align', label: 'Align', options: ['center', 'start'], default: 'center' },
    {
      name: 'tone',
      label: 'Tone',
      options: ['neutral', 'brand', 'danger'],
      default: 'neutral',
      description: 'Colors the icon medallion.',
    },
  ],
  componentProps: [
    { name: 'title', type: 'text', default: '표시할 항목이 없습니다', figmaType: 'TEXT' },
    { name: 'description', type: 'text', figmaType: 'TEXT', description: 'Supporting message.' },
    {
      name: 'icon',
      type: 'instanceSwap',
      figmaType: 'INSTANCE_SWAP',
      description: 'Illustration / icon slot.',
    },
    {
      name: 'action',
      type: 'instanceSwap',
      figmaType: 'INSTANCE_SWAP',
      description: 'Primary action slot.',
    },
    {
      name: 'secondaryAction',
      type: 'instanceSwap',
      figmaType: 'INSTANCE_SWAP',
      description: 'Secondary action slot.',
    },
  ],
  states: ['default'],
  a11y: {
    role: 'status',
    notes: ['Renders in a `role="status"` region so screen readers announce the empty condition.'],
  },
  responsive: 'Centers within its container; the medallion and type scale with `size`.',
  figma: {
    layoutMode: 'VERTICAL',
    itemSpacing: 'space.4',
    paddingX: 'space.6',
    paddingY: 'space.8',
    primaryAxisAlign: 'CENTER',
    counterAxisAlign: 'CENTER',
  },
});
