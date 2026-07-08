import { defineComponentMeta } from '../../../core/defineComponent';

export const radioMeta = defineComponentMeta({
  name: 'Radio',
  slug: 'radio',
  category: 'atom',
  description: 'Single-choice selection control, grouped by shared `name`.',
  tags: ['form', 'selection'],
  variantProps: [
    { name: 'size', label: 'Size', options: ['sm', 'md', 'lg'], default: 'md' },
    { name: 'tone', label: 'Tone', options: ['brand', 'success', 'danger'], default: 'brand' },
  ],
  componentProps: [
    { name: 'children', type: 'text', default: 'Label', figmaType: 'TEXT' },
    { name: 'description', type: 'text', figmaType: 'TEXT', description: 'Secondary helper line under the label.' },
    { name: 'checked', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
    { name: 'disabled', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
    { name: 'invalid', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
  ],
  states: ['default', 'hover', 'focus', 'disabled', 'error'],
  a11y: { role: 'radio', keyboard: ['Arrow keys: move within group', 'Space: select'] },
  responsive: 'Fixed control size; label wraps.',
  figma: { layoutMode: 'HORIZONTAL', itemSpacing: 'space.2', counterAxisAlign: 'CENTER' },
});
