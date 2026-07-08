import { defineComponentMeta } from '../../../core/defineComponent';

export const avatarMeta = defineComponentMeta({
  name: 'Avatar',
  slug: 'avatar',
  category: 'atom',
  description: 'Represents a user or entity via image, initials or icon fallback, with optional status.',
  tags: ['media', 'identity'],
  variantProps: [
    { name: 'size', label: 'Size', options: ['xs', 'sm', 'md', 'lg', 'xl'], default: 'md' },
    { name: 'shape', label: 'Shape', options: ['circle', 'rounded'], default: 'circle' },
    { name: 'status', label: 'Status', options: ['none', 'online', 'offline', 'busy', 'away'], default: 'none' },
  ],
  componentProps: [
    { name: 'src', type: 'text', figmaType: 'TEXT', description: 'Image URL.' },
    { name: 'name', type: 'text', default: 'Jane Doe', figmaType: 'TEXT', description: 'Used for initials + alt text.' },
  ],
  states: ['default', 'loading', 'error'],
  a11y: { notes: ['Provide `name` for the accessible label; falls back to initials or an icon on image error.'] },
  responsive: 'Fixed sizes per token; use within flex/grid layouts.',
  figma: { layoutMode: 'NONE', cornerRadius: 'radius.pill', height: 'size.control.md' },
});
