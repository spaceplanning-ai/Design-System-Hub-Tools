import { defineComponentMeta } from '../../../core/defineComponent';

export const modalMeta = defineComponentMeta({
  name: 'Modal',
  slug: 'modal',
  category: 'organism',
  description:
    'Accessible dialog rendered in a portal with focus trapping, scroll lock and scrim dismissal.',
  tags: ['overlay', 'dialog'],
  variantProps: [
    {
      name: 'type',
      label: 'Type',
      options: ['A', 'B', 'C'],
      default: 'A',
      description: 'Presentation preset — A: centered dialog · B: bottom sheet · C: fullscreen.',
    },
    { name: 'size', label: 'Size', options: ['sm', 'md', 'lg', 'xl', 'full'], default: 'md' },
    { name: 'placement', label: 'Placement', options: ['center', 'top'], default: 'center' },
  ],
  componentProps: [
    { name: 'open', type: 'boolean', default: true, figmaType: 'BOOLEAN' },
    { name: 'title', type: 'text', default: 'Dialog title', figmaType: 'TEXT' },
    { name: 'children', type: 'text', figmaType: 'TEXT' },
    { name: 'closable', type: 'boolean', default: true, figmaType: 'BOOLEAN' },
    { name: 'footer', type: 'instanceSwap', figmaType: 'INSTANCE_SWAP' },
  ],
  states: ['default'],
  a11y: {
    role: 'dialog',
    keyboard: ['Escape: close', 'Tab: cycle within (focus trapped)'],
    notes: [
      'role="dialog" aria-modal; labelled by the title; focus returns to the trigger on close.',
    ],
  },
  responsive: 'Sizes cap at viewport width with margins; `full` covers the screen on mobile.',
  figma: {
    layoutMode: 'VERTICAL',
    cornerRadius: 'radius.surface',
    fill: 'color.bg.surface',
    paddingX: 'space.6',
    paddingY: 'space.5',
  },
});
