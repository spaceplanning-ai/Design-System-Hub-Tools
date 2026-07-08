import { defineComponentMeta } from '../../../core/defineComponent';

export const popoverMeta = defineComponentMeta({
  name: 'Popover',
  slug: 'popover',
  category: 'molecule',
  description:
    'Anchored overlay that floats arbitrary content next to a trigger. Positioned on a side × align grid with an optional arrow — the base primitive for Menu, Combobox, Autocomplete and DatePicker.',
  tags: ['overlay', 'popover', 'floating', 'composition'],
  variantProps: [
    {
      name: 'side',
      label: 'Side',
      options: ['top', 'right', 'bottom', 'left'],
      default: 'bottom',
      description: 'Which side of the trigger the panel opens on.',
    },
    {
      name: 'align',
      label: 'Align',
      options: ['start', 'center', 'end'],
      default: 'center',
      description: 'Alignment along the chosen side.',
    },
    { name: 'size', label: 'Size', options: ['sm', 'md'], default: 'md' },
  ],
  componentProps: [
    {
      name: 'arrow',
      type: 'boolean',
      default: true,
      figmaType: 'BOOLEAN',
      description: 'Show the pointer arrow.',
    },
    { name: 'title', type: 'text', figmaType: 'TEXT', description: 'Optional header title.' },
    {
      name: 'open',
      type: 'boolean',
      default: false,
      figmaType: 'BOOLEAN',
      description: 'Controlled open state.',
    },
  ],
  states: ['default'],
  tokens: [
    { property: 'background', token: 'color.bg.surface' },
    { property: 'border-color', token: 'color.border.default' },
    { property: 'corner-radius', token: 'radius.surface' },
    { property: 'shadow', token: 'shadow.lg' },
  ],
  a11y: {
    role: 'dialog',
    keyboard: ['Escape: close', 'Enter / Space on trigger: toggle'],
    notes: [
      'Trigger gets `aria-haspopup="dialog"`, `aria-expanded` and `aria-controls`.',
      'Non-modal: closes on outside click and Escape; focus is not trapped (use Modal for that).',
    ],
  },
  responsive:
    'Panel width is content-driven with a max-width; flips are the caller’s responsibility (CSS-anchored).',
  figma: {
    layoutMode: 'VERTICAL',
    itemSpacing: 'space.2',
    paddingX: 'space.4',
    paddingY: 'space.3',
    cornerRadius: 'radius.surface',
    fill: 'color.bg.surface',
    strokeColor: 'color.border.default',
    strokeWidth: 'border.width.1',
  },
});
