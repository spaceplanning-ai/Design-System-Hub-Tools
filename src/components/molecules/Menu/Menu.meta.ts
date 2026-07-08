import { defineComponentMeta } from '../../../core/defineComponent';

export const menuMeta = defineComponentMeta({
  name: 'Menu',
  slug: 'menu',
  category: 'molecule',
  description:
    'Composable action menu: a trigger plus freely-arranged MenuItem / MenuLabel / MenuSeparator children, with roving-focus keyboard navigation, icons and shortcut hints. Use over Dropdown when items need grouping, labels or custom content.',
  tags: ['overlay', 'menu', 'navigation', 'composition'],
  variantProps: [
    {
      name: 'placement',
      label: 'Placement',
      options: ['bottom-start', 'bottom-end', 'top-start', 'top-end'],
      default: 'bottom-start',
    },
    { name: 'size', label: 'Size', options: ['sm', 'md'], default: 'md' },
  ],
  componentProps: [
    {
      name: 'trigger',
      type: 'instanceSwap',
      figmaType: 'INSTANCE_SWAP',
      description: 'Element that opens the menu.',
    },
  ],
  states: ['default'],
  a11y: {
    role: 'menu',
    keyboard: [
      'ArrowDown / ArrowUp: move between items (wraps, skips disabled)',
      'Enter / Space: activate item',
      'Escape: close and return focus to the trigger',
      'Tab: close',
    ],
    notes: [
      'Trigger gets `aria-haspopup="menu"` and `aria-expanded`.',
      'Container is `role="menu"`; items are `role="menuitem"`; separators `role="separator"`; labels `role="presentation"`.',
    ],
  },
  responsive:
    'Menu width is content-driven with a min-width; anchors to the trigger via placement.',
  figma: {
    layoutMode: 'VERTICAL',
    itemSpacing: 'space.0',
    paddingX: 'space.1',
    paddingY: 'space.1',
    cornerRadius: 'radius.surface',
    fill: 'color.bg.surface',
    strokeColor: 'color.border.default',
    strokeWidth: 'border.width.1',
  },
});
