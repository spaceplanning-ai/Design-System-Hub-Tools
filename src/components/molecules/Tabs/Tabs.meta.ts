import { defineComponentMeta } from '../../../core/defineComponent';

export const tabsMeta = defineComponentMeta({
  name: 'Tabs',
  slug: 'tabs',
  category: 'molecule',
  description:
    'Compound tabbed navigation (Tabs, Tabs.List, Tabs.Tab, Tabs.Panel) with roving-tabindex keyboard support.',
  tags: ['navigation', 'compound'],
  variantProps: [
    {
      name: 'type',
      label: 'Type',
      options: ['A', 'B', 'C'],
      default: 'A',
      description:
        'Orientation preset — A: tabs on top · B: tabs on the left (vertical) · C: tabs on the bottom.',
    },
    { name: 'variant', label: 'Style', options: ['line', 'solid', 'pill'], default: 'line' },
    { name: 'size', label: 'Size', options: ['sm', 'md', 'lg'], default: 'md' },
    { name: 'align', label: 'Align', options: ['start', 'center', 'stretch'], default: 'start' },
  ],
  componentProps: [
    { name: 'value', type: 'text', figmaType: 'TEXT', description: 'Controlled active tab value.' },
    { name: 'defaultValue', type: 'text', figmaType: 'TEXT' },
  ],
  states: ['default', 'hover', 'focus', 'active', 'disabled'],
  a11y: {
    role: 'tablist',
    keyboard: ['Arrow Left/Right: move', 'Home/End: first/last', 'Enter/Space: activate'],
    notes: ['Implements the WAI-ARIA Tabs pattern with aria-selected + aria-controls.'],
  },
  responsive: 'Tab list scrolls horizontally on overflow; stretch fills width.',
  figma: { layoutMode: 'VERTICAL', itemSpacing: 'space.4' },
});
