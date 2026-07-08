import { defineComponentMeta } from '../../../core/defineComponent';

export const sidebarMeta = defineComponentMeta({
  name: 'Sidebar',
  slug: 'sidebar',
  category: 'organism',
  description:
    'Vertical navigation rail with a compound API (Sidebar, Sidebar.Section, Sidebar.Item) and a collapsed icon-only mode.',
  tags: ['layout', 'navigation', 'compound'],
  variantProps: [
    {
      name: 'type',
      label: 'Type',
      options: ['A', 'B', 'C'],
      default: 'A',
      description:
        'Density / grouping preset — A: standard · B: compact (condensed) · C: boxed (sections in cards).',
    },
    { name: 'variant', label: 'Style', options: ['surface', 'floating'], default: 'surface' },
    { name: 'width', label: 'Width', options: ['narrow', 'default', 'wide'], default: 'default' },
    { name: 'collapsed', label: 'Collapsed', options: ['false', 'true'], default: 'false' },
  ],
  componentProps: [
    { name: 'header', type: 'instanceSwap', figmaType: 'INSTANCE_SWAP' },
    { name: 'footer', type: 'instanceSwap', figmaType: 'INSTANCE_SWAP' },
  ],
  states: ['default', 'hover', 'focus'],
  a11y: {
    role: 'navigation',
    keyboard: ['Tab: move between items', 'Enter/Space: activate'],
    notes: ['Rendered as <nav>; active item uses aria-current="page".'],
  },
  responsive: 'Collapses to an icon rail on tablet; hidden behind a Drawer on mobile.',
  figma: {
    layoutMode: 'VERTICAL',
    itemSpacing: 'space.1',
    paddingX: 'space.3',
    paddingY: 'space.4',
    fill: 'color.bg.surface',
  },
});
