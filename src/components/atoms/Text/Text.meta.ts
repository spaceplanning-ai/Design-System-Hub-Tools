import { defineComponentMeta } from '../../../core/defineComponent';

export const textMeta = defineComponentMeta({
  name: 'Text',
  slug: 'text',
  category: 'atom',
  description:
    'Typography primitive. Every visual style maps to a Text Style token, so React text and Figma Text Styles stay in lockstep.',
  tags: ['typography', 'foundation'],
  variantProps: [
    {
      name: 'variant',
      label: 'Style',
      options: [
        'display',
        'h1',
        'h2',
        'h3',
        'h4',
        'bodyLg',
        'body',
        'bodySm',
        'label',
        'caption',
        'code',
      ],
      default: 'body',
      description: 'Text Style token to apply.',
    },
    {
      name: 'tone',
      label: 'Tone',
      options: ['default', 'muted', 'subtle', 'brand', 'success', 'warning', 'danger', 'inverse'],
      default: 'default',
    },
    {
      name: 'align',
      label: 'Align',
      options: ['start', 'center', 'end'],
      default: 'start',
    },
  ],
  componentProps: [
    { name: 'children', type: 'text', default: 'The quick brown fox', figmaType: 'TEXT' },
    { name: 'truncate', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
    { name: 'as', type: 'text', figmaType: 'TEXT', description: 'Rendered HTML element (polymorphic).' },
  ],
  states: ['default'],
  a11y: { notes: ['Use the `as` prop to keep a correct heading hierarchy independent of visual style.'] },
  responsive: 'Font sizes are fluid via tokens; pair with layout components for reflow.',
  figma: { layoutMode: 'NONE' },
});
