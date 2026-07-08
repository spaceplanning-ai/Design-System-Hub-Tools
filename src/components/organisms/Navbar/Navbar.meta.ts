import { defineComponentMeta } from '../../../core/defineComponent';

export const navbarMeta = defineComponentMeta({
  name: 'Navbar',
  slug: 'navbar',
  category: 'organism',
  description:
    'Declarative navigation bar: pass a list of links and it renders them with active-state handling (aria-current), an alignment axis and a responsive collapse into a mobile panel. Slot-based Header is the alternative when you need a custom layout.',
  tags: ['layout', 'navigation'],
  variantProps: [
    {
      name: 'type',
      label: 'Type',
      options: ['A', 'B'],
      default: 'A',
      description: 'Layout preset — A: single inline row · B: brand+actions row with nav below.',
    },
    {
      name: 'variant',
      label: 'Style',
      options: ['surface', 'transparent', 'elevated'],
      default: 'surface',
    },
    { name: 'size', label: 'Size', options: ['sm', 'md', 'lg'], default: 'md' },
    { name: 'align', label: 'Nav align', options: ['start', 'center', 'end'], default: 'start' },
    { name: 'sticky', label: 'Sticky', options: ['false', 'true'], default: 'false' },
  ],
  componentProps: [
    {
      name: 'brand',
      type: 'instanceSwap',
      figmaType: 'INSTANCE_SWAP',
      description: 'Logo / brand slot.',
    },
    {
      name: 'actions',
      type: 'instanceSwap',
      figmaType: 'INSTANCE_SWAP',
      description: 'Trailing actions slot.',
    },
    {
      name: 'menuOpen',
      type: 'boolean',
      default: false,
      figmaType: 'BOOLEAN',
      description: 'Mobile panel open state.',
    },
  ],
  states: ['default'],
  a11y: {
    role: 'navigation',
    keyboard: ['Tab through links', 'Enter / Space toggles the mobile menu button'],
    notes: [
      'Rendered as `<nav aria-label>`; the active link carries `aria-current="page"`.',
      'Below the tablet breakpoint links collapse behind a toggle button controlling an `aria-expanded` panel.',
    ],
  },
  responsive: 'Links show inline on tablet+, and collapse into a togglable panel on mobile.',
  figma: {
    layoutMode: 'HORIZONTAL',
    paddingX: 'space.6',
    fill: 'color.bg.surface',
    height: 'size.control.lg',
    primaryAxisAlign: 'SPACE_BETWEEN',
    counterAxisAlign: 'CENTER',
  },
});
