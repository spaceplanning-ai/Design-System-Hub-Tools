import { defineComponentMeta } from '../../../core/defineComponent';

export const imageUploadMeta = defineComponentMeta({
  name: 'ImageUpload',
  slug: 'image-upload',
  category: 'molecule',
  description:
    'Image-specific uploader: drag-and-drop or browse, with a thumbnail preview grid and per-image remove. Defaults to accepting images and rendering object-URL previews.',
  tags: ['form', 'upload', 'image', 'media', 'composition'],
  variantProps: [
    {
      name: 'type',
      label: 'Type',
      options: ['A', 'B'],
      default: 'A',
      description: 'Layout preset — A: wrapping grid · B: single-row strip.',
    },
    { name: 'size', label: 'Thumb size', options: ['sm', 'md', 'lg'], default: 'md' },
    { name: 'shape', label: 'Shape', options: ['rounded', 'square', 'circle'], default: 'rounded' },
  ],
  componentProps: [
    { name: 'multiple', type: 'boolean', default: true, figmaType: 'BOOLEAN' },
    { name: 'accept', type: 'text', default: 'image/*', figmaType: 'TEXT' },
    { name: 'hint', type: 'text', figmaType: 'TEXT', description: 'Helper line under the prompt.' },
    { name: 'disabled', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
  ],
  states: ['default', 'hover', 'focus', 'disabled', 'error'],
  a11y: {
    role: 'button',
    keyboard: [
      'Enter / Space: open the file picker',
      'Tab: reach the add tile and each remove button',
    ],
    notes: [
      'Add tile is a labelled `role="button"`; the native file input is visually hidden.',
      'Each preview exposes a remove button labelled with the file name; previews use revoked object URLs.',
    ],
  },
  responsive: 'Thumbnails wrap into a responsive grid; the add tile sits inline with them.',
  figma: {
    layoutMode: 'HORIZONTAL',
    itemSpacing: 'space.3',
    cornerRadius: 'radius.surface',
    counterAxisAlign: 'CENTER',
  },
});
