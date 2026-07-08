import { defineComponentMeta } from '../../../core/defineComponent';

export const labelMeta = defineComponentMeta({
  name: 'Label',
  slug: 'label',
  category: 'atom',
  description: 'Form field label with required/optional and disabled affordances.',
  tags: ['form', 'typography'],
  variantProps: [{ name: 'size', label: 'Size', options: ['sm', 'md', 'lg'], default: 'md' }],
  componentProps: [
    { name: 'children', type: 'text', default: 'Email address', figmaType: 'TEXT' },
    { name: 'required', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
    { name: 'optional', type: 'boolean', default: false, figmaType: 'BOOLEAN', description: 'Muted "(optional)" hint.' },
    { name: 'hint', type: 'text', figmaType: 'TEXT', description: 'Trailing help-circle icon with this accessible label.' },
    { name: 'disabled', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
    { name: 'htmlFor', type: 'text', figmaType: 'TEXT', description: 'Associates the label with a control id.' },
  ],
  states: ['default', 'disabled'],
  a11y: { notes: ['Use `htmlFor` to bind to the control for click-to-focus and screen readers.'] },
  responsive: 'Inline-block; wraps with content.',
  figma: { layoutMode: 'HORIZONTAL', itemSpacing: 'space.1' },
});
