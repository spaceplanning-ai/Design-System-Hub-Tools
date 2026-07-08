import { defineComponentMeta } from '../../../core/defineComponent';

export const selectMeta = defineComponentMeta({
  name: 'Select',
  slug: 'select',
  category: 'molecule',
  description: 'Accessible single-select built on a native <select> styled to match the Input language.',
  tags: ['form', 'selection'],
  variantProps: [
    { name: 'variant', label: 'Type', options: ['outline', 'filled'], default: 'outline' },
    { name: 'size', label: 'Size', options: ['sm', 'md', 'lg'], default: 'md' },
  ],
  componentProps: [
    { name: 'placeholder', type: 'text', default: 'Select an option', figmaType: 'TEXT' },
    { name: 'value', type: 'text', figmaType: 'TEXT' },
    { name: 'status', type: 'select', options: ['default', 'error', 'success'], default: 'default', figmaType: 'TEXT' },
    { name: 'iconStart', type: 'instanceSwap', figmaType: 'INSTANCE_SWAP', description: 'Leading icon slot.' },
    { name: 'statusIcon', type: 'boolean', default: true, figmaType: 'BOOLEAN', description: 'Auto status icon for error/success.' },
    { name: 'disabled', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
  ],
  states: ['default', 'hover', 'focus', 'disabled', 'error', 'success'],
  a11y: { keyboard: ['Native select keyboard behaviour'], notes: ['Uses the platform listbox for full a11y + mobile support.'] },
  responsive: 'Fills container width; native popup adapts per platform.',
  figma: {
    layoutMode: 'HORIZONTAL',
    paddingX: 'space.3',
    cornerRadius: 'radius.control',
    fill: 'color.field.bg',
    strokeColor: 'color.field.border',
    strokeWidth: 'border.width.1',
    height: 'size.control.md',
    counterAxisAlign: 'CENTER',
  },
});
