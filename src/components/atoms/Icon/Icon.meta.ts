// Pure metadata — relative imports only (loaded by the Node manifest generator).
import { defineComponentMeta } from '../../../core/defineComponent';
import { iconNames } from './icon-names';

export const iconMeta = defineComponentMeta({
  name: 'Icon',
  slug: 'icon',
  category: 'atom',
  description:
    'Reusable SVG icon system rendered on a 24×24 grid with `currentColor`. Supports size, color, stroke width and filled/stroke modes.',
  tags: ['icon', 'svg', 'foundation'],
  variantProps: [
    {
      name: 'name',
      label: 'Icon',
      options: [...iconNames],
      default: 'star',
      description: 'The glyph to render. Each name maps to a Figma vector/component.',
    },
    {
      name: 'size',
      label: 'Size',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      default: 'md',
    },
    {
      name: 'mode',
      label: 'Mode',
      options: ['stroke', 'filled'],
      default: 'stroke',
    },
  ],
  componentProps: [
    { name: 'strokeWidth', type: 'number', default: 2, figmaType: 'TEXT', description: 'Stroke width (stroke mode).' },
    { name: 'color', type: 'text', figmaType: 'TEXT', description: 'CSS color override (defaults to currentColor).' },
    { name: 'spin', type: 'boolean', default: false, figmaType: 'BOOLEAN', description: 'Continuously rotate (inline spinner for loader/refresh).' },
    { name: 'title', type: 'text', figmaType: 'TEXT', description: 'Accessible label; omit for decorative icons.' },
  ],
  states: ['default'],
  a11y: {
    role: 'img',
    notes: [
      'Decorative icons are aria-hidden; provide `title` to expose an accessible name.',
    ],
  },
  responsive: 'Scales with the `size` prop; inherits color from text context.',
  figma: {
    layoutMode: 'NONE',
    height: 'size.control.sm',
  },
});
