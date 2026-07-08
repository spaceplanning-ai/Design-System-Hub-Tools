import { defineComponentMeta } from '../../../core/defineComponent';

export const textareaMeta = defineComponentMeta({
  name: 'Textarea',
  slug: 'textarea',
  category: 'atom',
  description: 'Multi-line text field sharing the Input visual language and state matrix.',
  tags: ['form', 'input'],
  variantProps: [
    { name: 'variant', label: 'Type', options: ['outline', 'filled'], default: 'outline' },
    { name: 'size', label: 'Size', options: ['sm', 'md', 'lg'], default: 'md' },
    { name: 'resize', label: 'Resize', options: ['none', 'vertical', 'both'], default: 'vertical' },
  ],
  componentProps: [
    { name: 'placeholder', type: 'text', default: 'Write something…', figmaType: 'TEXT' },
    { name: 'rows', type: 'number', default: 4, figmaType: 'TEXT' },
    { name: 'status', type: 'select', options: ['default', 'error', 'success'], default: 'default', figmaType: 'TEXT' },
    { name: 'showCount', type: 'boolean', default: false, figmaType: 'BOOLEAN', description: 'Live character counter (uses maxLength).' },
    { name: 'autoResize', type: 'boolean', default: false, figmaType: 'BOOLEAN', description: 'Grow to fit content.' },
    { name: 'disabled', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
    { name: 'readOnly', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
  ],
  states: ['default', 'hover', 'focus', 'disabled', 'error', 'success', 'readonly'],
  a11y: { notes: ['Pair with FormField for label + error association.'] },
  responsive: 'Fills container width; height grows with `rows` / user resize.',
  figma: {
    layoutMode: 'VERTICAL',
    paddingX: 'space.3',
    paddingY: 'space.2',
    cornerRadius: 'radius.control',
    fill: 'color.field.bg',
    strokeColor: 'color.field.border',
    strokeWidth: 'border.width.1',
  },
});
