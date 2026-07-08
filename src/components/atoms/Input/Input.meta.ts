import { defineComponentMeta } from '../../../core/defineComponent';

export const inputMeta = defineComponentMeta({
  name: 'Input',
  slug: 'input',
  category: 'atom',
  description:
    'Single-line text field with three visual types, adornment slots and the full validation-state matrix.',
  tags: ['form', 'input', 'interactive'],
  variantProps: [
    { name: 'variant', label: 'Type', options: ['outline', 'filled', 'underline'], default: 'outline' },
    { name: 'size', label: 'Size', options: ['sm', 'md', 'lg'], default: 'md' },
  ],
  componentProps: [
    { name: 'placeholder', type: 'text', default: 'Placeholder', figmaType: 'TEXT' },
    { name: 'value', type: 'text', figmaType: 'TEXT' },
    { name: 'status', type: 'select', options: ['default', 'error', 'success'], default: 'default', figmaType: 'TEXT' },
    { name: 'disabled', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
    { name: 'readOnly', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
    { name: 'clearable', type: 'boolean', default: false, figmaType: 'BOOLEAN', description: 'Show a clear (×) button while the field has a value.' },
    { name: 'revealable', type: 'boolean', default: false, figmaType: 'BOOLEAN', description: 'Password reveal (eye) toggle.' },
    { name: 'loading', type: 'boolean', default: false, figmaType: 'BOOLEAN', description: 'Trailing async spinner.' },
    { name: 'statusIcon', type: 'boolean', default: true, figmaType: 'BOOLEAN', description: 'Auto status icon for error/success.' },
    { name: 'iconStart', type: 'instanceSwap', figmaType: 'INSTANCE_SWAP' },
    { name: 'iconEnd', type: 'instanceSwap', figmaType: 'INSTANCE_SWAP' },
  ],
  states: ['default', 'hover', 'focus', 'disabled', 'error', 'success', 'readonly'],
  tokens: [
    { property: 'background', token: 'color.field.bg' },
    { property: 'border-color', token: 'color.field.border' },
    { property: 'corner-radius', token: 'radius.control' },
    { property: 'height', token: 'size.control.md', when: { size: 'md' } },
  ],
  a11y: {
    keyboard: ['Tab: focus', 'Standard text-editing keys'],
    notes: ['Pair with FormField for a programmatic label + error association (aria-describedby).'],
  },
  responsive: 'Fills container width; height scales with size tokens.',
  figma: {
    layoutMode: 'HORIZONTAL',
    itemSpacing: 'space.2',
    paddingX: 'space.3',
    cornerRadius: 'radius.control',
    fill: 'color.field.bg',
    strokeColor: 'color.field.border',
    strokeWidth: 'border.width.1',
    height: 'size.control.md',
    counterAxisAlign: 'CENTER',
  },
});
