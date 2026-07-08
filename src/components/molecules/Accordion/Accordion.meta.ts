import { defineComponentMeta } from '../../../core/defineComponent';

export const accordionMeta = defineComponentMeta({
  name: 'Accordion',
  slug: 'accordion',
  category: 'molecule',
  description:
    'Compound disclosure list (Accordion, Accordion.Item, Accordion.Trigger, Accordion.Content) with single/multiple modes and animated expansion.',
  tags: ['disclosure', 'compound'],
  variantProps: [
    {
      name: 'type',
      label: 'Type',
      options: ['A', 'B'],
      default: 'A',
      description: 'Layout preset — A: divided rows · B: separated cards.',
    },
    {
      name: 'variant',
      label: 'Style',
      options: ['separated', 'contained', 'ghost'],
      default: 'separated',
    },
    { name: 'size', label: 'Size', options: ['sm', 'md', 'lg'], default: 'md' },
    { name: 'mode', label: 'Mode', options: ['single', 'multiple'], default: 'single' },
  ],
  componentProps: [{ name: 'defaultValue', type: 'text', figmaType: 'TEXT' }],
  states: ['default', 'hover', 'focus', 'disabled'],
  a11y: {
    keyboard: ['Enter/Space: toggle', 'Tab: move between triggers'],
    notes: [
      'Trigger is a button with aria-expanded; content region is aria-labelledby the trigger.',
    ],
  },
  responsive: 'Full width; content reflows within the panel.',
  figma: { layoutMode: 'VERTICAL', itemSpacing: 'space.2' },
});
