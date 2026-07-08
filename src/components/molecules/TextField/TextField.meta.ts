import { defineComponentMeta } from '../../../core/defineComponent';

export const textFieldMeta = defineComponentMeta({
  name: 'TextField',
  slug: 'text-field',
  category: 'molecule',
  description:
    'Label + Input composed into a ready-to-use field. Three purpose-built layouts: Type A (stacked label), Type B (floating label), Type C (inline label). Wires the accessibility relationships automatically.',
  tags: ['form', 'input', 'composition'],
  variantProps: [
    {
      name: 'type',
      label: 'Type',
      options: ['A', 'B', 'C'],
      default: 'A',
      description: 'A — label stacked above · B — floating label · C — label inline (left).',
    },
    { name: 'size', label: 'Size', options: ['sm', 'md', 'lg'], default: 'md' },
  ],
  componentProps: [
    { name: 'label', type: 'text', default: 'Email address', figmaType: 'TEXT' },
    { name: 'inputType', type: 'text', default: 'text', figmaType: 'TEXT', description: 'HTML input type (text, password, email…).' },
    { name: 'placeholder', type: 'text', default: 'you@example.com', figmaType: 'TEXT' },
    { name: 'hint', type: 'text', figmaType: 'TEXT', description: 'Helper text below the field.' },
    { name: 'error', type: 'text', figmaType: 'TEXT', description: 'Error message with alert icon (overrides hint).' },
    { name: 'success', type: 'text', figmaType: 'TEXT', description: 'Success message with check icon.' },
    { name: 'required', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
    { name: 'optional', type: 'boolean', default: false, figmaType: 'BOOLEAN', description: 'Muted "(optional)" label hint.' },
    { name: 'labelHint', type: 'text', figmaType: 'TEXT', description: 'Help-circle tooltip on the label.' },
    { name: 'disabled', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
    { name: 'status', type: 'select', options: ['default', 'error', 'success'], default: 'default', figmaType: 'TEXT' },
    { name: 'clearable', type: 'boolean', default: false, figmaType: 'BOOLEAN', description: 'Clear (×) button (via Input).' },
    { name: 'revealable', type: 'boolean', default: false, figmaType: 'BOOLEAN', description: 'Password reveal toggle (via Input).' },
    { name: 'loading', type: 'boolean', default: false, figmaType: 'BOOLEAN', description: 'Trailing async spinner (via Input).' },
    { name: 'iconStart', type: 'instanceSwap', figmaType: 'INSTANCE_SWAP' },
    { name: 'iconEnd', type: 'instanceSwap', figmaType: 'INSTANCE_SWAP' },
  ],
  states: ['default', 'hover', 'focus', 'disabled', 'error', 'success', 'readonly'],
  tokens: [
    { property: 'gap', token: 'space.1.5' },
    { property: 'label-color', token: 'color.fg.default' },
    { property: 'field-border', token: 'color.field.border' },
    { property: 'field-border', token: 'color.border.focus', when: { status: 'default' } },
  ],
  a11y: {
    keyboard: ['Tab: focus the input', 'Standard text-editing keys'],
    notes: [
      'The label is programmatically bound to the input via htmlFor/id.',
      'Hint and error are linked with aria-describedby; aria-invalid is set on error.',
    ],
  },
  responsive: 'Type C collapses from inline to stacked below the tablet breakpoint; all types fill the container.',
  figma: {
    layoutMode: 'VERTICAL',
    itemSpacing: 'space.1.5',
    cornerRadius: 'radius.control',
  },
});
