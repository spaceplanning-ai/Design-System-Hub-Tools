import { defineComponentMeta } from '../../../core/defineComponent';

export const formFieldMeta = defineComponentMeta({
  name: 'FormField',
  slug: 'form-field',
  category: 'molecule',
  description:
    'Composes Label + control + hint/error text and wires the accessibility relationships (id, aria-describedby, aria-invalid).',
  tags: ['form', 'composition'],
  variantProps: [
    { name: 'layout', label: 'Layout', options: ['vertical', 'horizontal'], default: 'vertical' },
    { name: 'size', label: 'Size', options: ['sm', 'md', 'lg'], default: 'md' },
  ],
  componentProps: [
    { name: 'label', type: 'text', default: 'Email', figmaType: 'TEXT' },
    { name: 'hint', type: 'text', figmaType: 'TEXT', description: 'Helper text below the control.' },
    { name: 'error', type: 'text', figmaType: 'TEXT', description: 'Error message with alert icon (overrides hint).' },
    { name: 'success', type: 'text', figmaType: 'TEXT', description: 'Success message with check icon.' },
    { name: 'required', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
    { name: 'optional', type: 'boolean', default: false, figmaType: 'BOOLEAN', description: 'Muted "(optional)" label hint.' },
    { name: 'labelHint', type: 'text', figmaType: 'TEXT', description: 'Help-circle tooltip on the label.' },
    { name: 'disabled', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
  ],
  states: ['default', 'error', 'success', 'disabled'],
  a11y: {
    notes: [
      'Generates a stable id and passes it to the control via cloning/render-prop.',
      'Binds hint and error text with aria-describedby; sets aria-invalid when errored.',
    ],
  },
  responsive: 'Horizontal layout collapses to vertical below the tablet breakpoint.',
  figma: { layoutMode: 'VERTICAL', itemSpacing: 'space.1.5' },
});
