import { defineComponentMeta } from '../../../core/defineComponent';

export const imageMeta = defineComponentMeta({
  name: 'Image',
  slug: 'image',
  category: 'atom',
  description: 'Responsive image with aspect-ratio, object-fit, loading skeleton and error fallback.',
  tags: ['media'],
  variantProps: [
    { name: 'fit', label: 'Fit', options: ['cover', 'contain', 'fill'], default: 'cover' },
    { name: 'radius', label: 'Radius', options: ['none', 'sm', 'md', 'lg', 'full'], default: 'md' },
    { name: 'ratio', label: 'Ratio', options: ['auto', 'square', '4:3', '16:9', '3:2'], default: 'auto' },
  ],
  componentProps: [
    { name: 'src', type: 'text', figmaType: 'TEXT' },
    { name: 'alt', type: 'text', default: '', figmaType: 'TEXT' },
    { name: 'caption', type: 'text', figmaType: 'TEXT', description: 'Caption under the image (renders a <figure>).' },
  ],
  states: ['default', 'loading', 'error'],
  a11y: { notes: ['`alt` is required for informative images; use empty string for decorative.'] },
  responsive: 'Fills container; maintains chosen aspect ratio across breakpoints.',
  figma: { layoutMode: 'NONE', cornerRadius: 'radius.md', fill: 'color.bg.subtle' },
});
