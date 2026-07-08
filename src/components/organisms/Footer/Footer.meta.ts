import { defineComponentMeta } from '../../../core/defineComponent';

export const footerMeta = defineComponentMeta({
  name: 'Footer',
  slug: 'footer',
  category: 'organism',
  description:
    'Site footer. Type A/B/C are layout presets: A — multi-column links + bottom bar, B — simple centered brand + social, C — minimal single row.',
  tags: ['layout', 'navigation'],
  variantProps: [
    {
      name: 'type',
      label: 'Type',
      options: ['A', 'B', 'C'],
      default: 'A',
      description: 'Layout preset — A: columns · B: simple · C: minimal.',
    },
    { name: 'variant', label: 'Style', options: ['surface', 'transparent'], default: 'surface' },
  ],
  componentProps: [
    { name: 'brand', type: 'instanceSwap', figmaType: 'INSTANCE_SWAP' },
    { name: 'description', type: 'text', figmaType: 'TEXT' },
    { name: 'columns', type: 'text', figmaType: 'TEXT', description: 'Array of { title, links[] } (links support `external`).' },
    { name: 'newsletter', type: 'instanceSwap', figmaType: 'INSTANCE_SWAP', description: 'Newsletter / subscribe slot.' },
    { name: 'social', type: 'instanceSwap', figmaType: 'INSTANCE_SWAP' },
    { name: 'copyright', type: 'text', figmaType: 'TEXT' },
    { name: 'legal', type: 'instanceSwap', figmaType: 'INSTANCE_SWAP', description: 'Legal / policy link row.' },
  ],
  states: ['default'],
  a11y: {
    role: 'contentinfo',
    notes: ['Rendered as <footer role="contentinfo"> with <nav> landmarks for link groups.'],
  },
  responsive: 'Columns collapse to a stacked list below the tablet breakpoint; bottom bar wraps.',
  figma: {
    layoutMode: 'VERTICAL',
    paddingX: 'space.6',
    paddingY: 'space.8',
    fill: 'color.bg.surface',
    itemSpacing: 'space.6',
  },
});
