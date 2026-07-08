import { defineComponentMeta } from '../../../core/defineComponent';

export const cardMeta = defineComponentMeta({
  name: 'Card',
  slug: 'card',
  category: 'molecule',
  description:
    'Surface container with a compound API (Card, Card.Header, Card.Body, Card.Footer, Card.Media). Card.Header covers the standalone header pattern.',
  tags: ['surface', 'container', 'compound'],
  variantProps: [
    {
      name: 'type',
      label: 'Type',
      options: ['A', 'B', 'C'],
      default: 'A',
      description: 'Layout preset — A: vertical (stacked) · B: horizontal (media beside content) · C: overlay (media background).',
    },
    { name: 'variant', label: 'Style', options: ['elevated', 'outlined', 'filled'], default: 'elevated' },
    { name: 'padding', label: 'Padding', options: ['none', 'sm', 'md', 'lg'], default: 'md' },
    { name: 'radius', label: 'Radius', options: ['md', 'lg', 'xl'], default: 'lg' },
  ],
  componentProps: [
    { name: 'interactive', type: 'boolean', default: false, figmaType: 'BOOLEAN', description: 'Adds hover/press affordance + focusability.' },
    { name: 'selected', type: 'boolean', default: false, figmaType: 'BOOLEAN', description: 'Selected accent (for selectable card grids).' },
  ],
  states: ['default', 'hover', 'focus', 'active'],
  a11y: { notes: ['Interactive cards receive role/button semantics and keyboard activation.'] },
  responsive: 'Fills its column; media maintains aspect ratio.',
  figma: {
    layoutMode: 'VERTICAL',
    cornerRadius: 'radius.surface',
    fill: 'color.bg.surface',
    strokeColor: 'color.border.default',
    strokeWidth: 'border.width.1',
  },
});
