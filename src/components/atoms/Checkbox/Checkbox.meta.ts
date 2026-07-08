import { defineComponentMeta } from '../../../core/defineComponent';

export const checkboxMeta = defineComponentMeta({
  name: 'Checkbox',
  slug: 'checkbox',
  category: 'atom',
  description: 'Binary (and indeterminate) selection control with an optional label.',
  tags: ['form', 'selection'],
  variantProps: [
    { name: 'size', label: 'Size', options: ['sm', 'md', 'lg'], default: 'md' },
    { name: 'tone', label: 'Tone', options: ['brand', 'success', 'danger'], default: 'brand' },
  ],
  componentProps: [
    { name: 'children', type: 'text', default: 'Label', figmaType: 'TEXT' },
    { name: 'description', type: 'text', figmaType: 'TEXT', description: 'Secondary helper line under the label.' },
    { name: 'checked', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
    { name: 'indeterminate', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
    { name: 'disabled', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
    { name: 'invalid', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
  ],
  states: ['default', 'hover', 'focus', 'disabled', 'error'],
  a11y: {
    role: 'checkbox',
    keyboard: ['Space: toggle'],
    notes: ['Uses a native <input type="checkbox"> visually replaced by a styled box.'],
  },
  responsive: 'Control size fixed by tokens; label wraps.',
  figma: { layoutMode: 'HORIZONTAL', itemSpacing: 'space.2', counterAxisAlign: 'CENTER' },
});
