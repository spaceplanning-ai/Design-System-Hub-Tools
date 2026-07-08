import { defineComponentMeta } from '../../../core/defineComponent';

export const dropdownMeta = defineComponentMeta({
  name: 'Dropdown',
  slug: 'dropdown',
  category: 'molecule',
  description: 'Menu surface anchored to a trigger, with keyboard navigation and outside-click dismissal.',
  tags: ['overlay', 'menu'],
  variantProps: [
    { name: 'placement', label: 'Placement', options: ['bottom-start', 'bottom-end', 'top-start', 'top-end'], default: 'bottom-start' },
    { name: 'size', label: 'Size', options: ['sm', 'md'], default: 'md' },
  ],
  componentProps: [
    { name: 'trigger', type: 'instanceSwap', figmaType: 'INSTANCE_SWAP' },
    { name: 'items', type: 'text', figmaType: 'TEXT', description: 'Array of menu items.' },
  ],
  states: ['default', 'hover', 'focus', 'active'],
  a11y: {
    role: 'menu',
    keyboard: ['Arrow Up/Down: move', 'Enter/Space: select', 'Escape: close', 'Tab: close + move on'],
    notes: ['Trigger exposes aria-haspopup + aria-expanded; items use role="menuitem".'],
  },
  responsive: 'Repositions via placement; menu constrained to viewport width.',
  figma: {
    layoutMode: 'VERTICAL',
    paddingY: 'space.1',
    cornerRadius: 'radius.lg',
    fill: 'color.bg.surface',
    strokeColor: 'color.border.default',
    strokeWidth: 'border.width.1',
  },
});
