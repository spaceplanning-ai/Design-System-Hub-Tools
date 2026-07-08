import { defineComponentMeta } from '../../../core/defineComponent';

export const drawerMeta = defineComponentMeta({
  name: 'Drawer',
  slug: 'drawer',
  category: 'organism',
  description: 'Edge-anchored panel (portal + focus trap) that slides in from any side.',
  tags: ['overlay', 'panel'],
  variantProps: [
    {
      name: 'type',
      label: 'Type',
      options: ['A', 'B', 'C'],
      default: 'A',
      description:
        'Form-factor preset — A: flush (edge-anchored) · B: floating (inset card) · C: full (fills the cross axis).',
    },
    { name: 'side', label: 'Side', options: ['right', 'left', 'top', 'bottom'], default: 'right' },
    { name: 'size', label: 'Size', options: ['sm', 'md', 'lg'], default: 'md' },
  ],
  componentProps: [
    { name: 'open', type: 'boolean', default: true, figmaType: 'BOOLEAN' },
    { name: 'title', type: 'text', default: 'Panel', figmaType: 'TEXT' },
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
  responsive: 'Left/right panels become full-width bottom sheets on mobile.',
  figma: {
    layoutMode: 'VERTICAL',
    fill: 'color.bg.surface',
    paddingX: 'space.5',
    paddingY: 'space.5',
  },
});
