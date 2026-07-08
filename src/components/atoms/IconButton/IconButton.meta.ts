import { defineComponentMeta } from '../../../core/defineComponent';

export const iconButtonMeta = defineComponentMeta({
  name: 'IconButton',
  slug: 'icon-button',
  category: 'atom',
  description: 'Square, icon-only action. Requires an accessible label.',
  tags: ['action', 'icon', 'interactive'],
  variantProps: [
    { name: 'variant', label: 'Type', options: ['solid', 'outline', 'ghost', 'soft'], default: 'ghost' },
    {
      name: 'tone',
      label: 'Tone',
      options: ['brand', 'neutral', 'success', 'warning', 'danger'],
      default: 'neutral',
    },
    { name: 'size', label: 'Size', options: ['sm', 'md', 'lg'], default: 'md' },
    { name: 'shape', label: 'Shape', options: ['rounded', 'pill', 'square'], default: 'rounded' },
  ],
  componentProps: [
    { name: 'label', type: 'text', default: 'Action', figmaType: 'TEXT', description: 'Required aria-label.' },
    { name: 'icon', type: 'instanceSwap', figmaType: 'INSTANCE_SWAP' },
    { name: 'loading', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
    { name: 'pressed', type: 'boolean', default: false, figmaType: 'BOOLEAN', description: 'Toggle/selected state (aria-pressed).' },
    { name: 'indicator', type: 'boolean', default: false, figmaType: 'BOOLEAN', description: 'Notification dot.' },
    { name: 'disabled', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
  ],
  states: ['default', 'hover', 'active', 'focus', 'disabled', 'loading'],
  a11y: { role: 'button', keyboard: ['Enter / Space: activate'], notes: ['`label` is mandatory for screen readers.'] },
  responsive: 'Fixed square dimensions per size token.',
  figma: {
    layoutMode: 'HORIZONTAL',
    cornerRadius: 'radius.control',
    height: 'size.control.md',
    primaryAxisAlign: 'CENTER',
    counterAxisAlign: 'CENTER',
  },
});
