import { defineComponentMeta } from '../../../core/defineComponent';

export const headerMeta = defineComponentMeta({
  name: 'Header',
  slug: 'header',
  category: 'organism',
  description:
    'Application top bar with brand, primary navigation and action slots. Type A/B/C are layout presets: A — standard (brand · nav · actions), B — centered brand with nav below, C — compact (nav hidden).',
  tags: ['layout', 'navigation'],
  variantProps: [
    {
      name: 'type',
      label: 'Type',
      options: ['A', 'B', 'C'],
      default: 'A',
      description: 'Layout preset — A: standard · B: centered brand · C: compact.',
    },
    { name: 'variant', label: 'Style', options: ['surface', 'transparent', 'elevated'], default: 'surface' },
    { name: 'size', label: 'Size', options: ['sm', 'md', 'lg'], default: 'md' },
    { name: 'sticky', label: 'Sticky', options: ['false', 'true'], default: 'false' },
  ],
  componentProps: [
    { name: 'brand', type: 'instanceSwap', figmaType: 'INSTANCE_SWAP' },
    { name: 'search', type: 'instanceSwap', figmaType: 'INSTANCE_SWAP', description: 'Search slot (nav ↔ actions).' },
    { name: 'actions', type: 'instanceSwap', figmaType: 'INSTANCE_SWAP' },
    { name: 'menuOpen', type: 'boolean', default: false, figmaType: 'BOOLEAN', description: 'Mobile menu open state (with onMenuToggle).' },
  ],
  states: ['default'],
  a11y: { role: 'banner', notes: ['Rendered as <header role="banner"> with a <nav> landmark for links.'] },
  responsive: 'Navigation collapses behind a menu button below the tablet breakpoint.',
  figma: {
    layoutMode: 'HORIZONTAL',
    paddingX: 'space.6',
    fill: 'color.bg.surface',
    height: 'size.control.lg',
    primaryAxisAlign: 'SPACE_BETWEEN',
    counterAxisAlign: 'CENTER',
  },
});
