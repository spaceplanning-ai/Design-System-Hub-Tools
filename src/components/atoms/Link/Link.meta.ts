import { defineComponentMeta } from '../../../core/defineComponent';

export const linkMeta = defineComponentMeta({
  name: 'Link',
  slug: 'link',
  category: 'atom',
  description: 'Navigational text link with tone and underline options; supports external affordance.',
  tags: ['navigation', 'text'],
  variantProps: [
    { name: 'tone', label: 'Tone', options: ['brand', 'neutral', 'danger'], default: 'brand' },
    { name: 'underline', label: 'Underline', options: ['hover', 'always', 'none'], default: 'hover' },
    { name: 'size', label: 'Size', options: ['sm', 'md', 'lg'], default: 'md' },
  ],
  componentProps: [
    { name: 'children', type: 'text', default: 'Learn more', figmaType: 'TEXT' },
    { name: 'href', type: 'text', default: '#', figmaType: 'TEXT' },
    { name: 'external', type: 'boolean', default: false, figmaType: 'BOOLEAN', description: 'Adds an external-link icon + rel/target.' },
    { name: 'leadingIcon', type: 'instanceSwap', figmaType: 'INSTANCE_SWAP', description: 'Leading icon.' },
    { name: 'trailingIcon', type: 'instanceSwap', figmaType: 'INSTANCE_SWAP', description: 'Trailing icon.' },
    { name: 'disabled', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
  ],
  states: ['default', 'hover', 'focus', 'active', 'disabled'],
  a11y: {
    keyboard: ['Enter: activate'],
    notes: ['External links get rel="noopener noreferrer" and an accessible “(opens in new tab)” hint.'],
  },
  responsive: 'Inline; inherits surrounding line-height.',
  figma: { layoutMode: 'HORIZONTAL', itemSpacing: 'space.1', counterAxisAlign: 'CENTER' },
});
