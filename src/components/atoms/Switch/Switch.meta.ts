import { defineComponentMeta } from '../../../core/defineComponent';

export const switchMeta = defineComponentMeta({
  name: 'Switch',
  slug: 'switch',
  category: 'atom',
  description: 'On/off toggle for immediate settings changes.',
  tags: ['form', 'toggle'],
  variantProps: [
    { name: 'size', label: 'Size', options: ['sm', 'md', 'lg'], default: 'md' },
    { name: 'tone', label: 'Tone', options: ['brand', 'success', 'danger'], default: 'brand' },
    { name: 'labelPosition', label: 'Label', options: ['end', 'start'], default: 'end' },
  ],
  componentProps: [
    { name: 'children', type: 'text', default: 'Enabled', figmaType: 'TEXT' },
    { name: 'checked', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
    { name: 'showIcons', type: 'boolean', default: false, figmaType: 'BOOLEAN', description: 'Check/close glyphs inside the thumb.' },
    { name: 'invalid', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
    { name: 'disabled', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
  ],
  states: ['default', 'hover', 'focus', 'disabled', 'error'],
  a11y: {
    role: 'switch',
    keyboard: ['Space / Enter: toggle'],
    notes: ['Native checkbox with role="switch"; label is programmatically associated.'],
  },
  responsive: 'Fixed track size; label wraps.',
  figma: { layoutMode: 'HORIZONTAL', itemSpacing: 'space.2', counterAxisAlign: 'CENTER' },
});
