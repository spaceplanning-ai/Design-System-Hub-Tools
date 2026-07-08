import { defineComponentMeta } from '../../../core/defineComponent';

export const tableMeta = defineComponentMeta({
  name: 'Table',
  slug: 'table',
  category: 'organism',
  description:
    'Data grid with column config, density, striping/bordering, sticky header, sortable columns, row selection and a loading state.',
  tags: ['data', 'layout'],
  variantProps: [
    {
      name: 'type',
      label: 'Type',
      options: ['A', 'B'],
      default: 'A',
      description: 'Layout preset — A: comfortable · B: compact density.',
    },
    {
      name: 'variant',
      label: 'Style',
      options: ['default', 'striped', 'bordered'],
      default: 'default',
    },
    { name: 'size', label: 'Density', options: ['sm', 'md', 'lg'], default: 'md' },
  ],
  componentProps: [
    {
      name: 'columns',
      type: 'text',
      figmaType: 'TEXT',
      description: 'Column definitions (supports `sortable`).',
    },
    { name: 'data', type: 'text', figmaType: 'TEXT', description: 'Row data.' },
    { name: 'stickyHeader', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
    {
      name: 'selectable',
      type: 'boolean',
      default: false,
      figmaType: 'BOOLEAN',
      description: 'Row selection checkboxes + select-all.',
    },
    {
      name: 'loading',
      type: 'boolean',
      default: false,
      figmaType: 'BOOLEAN',
      description: 'Loading row with spinner.',
    },
    { name: 'caption', type: 'text', figmaType: 'TEXT' },
  ],
  states: ['default', 'hover', 'loading'],
  a11y: {
    notes: [
      'Semantic <table> with scoped <th>; caption provides an accessible name.',
      'Sortable headers are buttons exposing aria-sort; selection uses aria-selected on rows.',
    ],
  },
  responsive: 'Horizontally scrolls within its container (min-width: max-content).',
  figma: { layoutMode: 'VERTICAL', fill: 'color.bg.surface', cornerRadius: 'radius.lg' },
});
