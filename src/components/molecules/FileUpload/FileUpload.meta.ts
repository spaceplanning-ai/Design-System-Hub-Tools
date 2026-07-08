import { defineComponentMeta } from '../../../core/defineComponent';

export const fileUploadMeta = defineComponentMeta({
  name: 'FileUpload',
  slug: 'file-upload',
  category: 'molecule',
  description:
    'Drag-and-drop file input with click-to-browse, accept/size/count validation and a removable file list. Single or multiple files.',
  tags: ['form', 'upload', 'file', 'composition'],
  variantProps: [
    {
      name: 'type',
      label: 'Type',
      options: ['A', 'B'],
      default: 'A',
      description: 'Layout preset — A: full dropzone · B: compact inline row.',
    },
    { name: 'size', label: 'Size', options: ['sm', 'md', 'lg'], default: 'md' },
    {
      name: 'tone',
      label: 'Tone',
      options: ['neutral', 'brand'],
      default: 'neutral',
      description: 'Dropzone accent while idle.',
    },
  ],
  componentProps: [
    { name: 'multiple', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
    { name: 'accept', type: 'text', figmaType: 'TEXT', description: 'e.g. image/*,.pdf' },
    { name: 'hint', type: 'text', figmaType: 'TEXT', description: 'Helper line under the prompt.' },
    { name: 'disabled', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
  ],
  states: ['default', 'hover', 'focus', 'disabled', 'error'],
  a11y: {
    role: 'button',
    keyboard: [
      'Enter / Space: open the file picker',
      'Tab: reach the dropzone and each remove button',
    ],
    notes: [
      'Dropzone is a labelled `role="button"`; the native file input is visually hidden.',
      'Drag-over state is reflected via `data-dragging` for styling and is announced by the prompt text.',
    ],
  },
  responsive: 'Dropzone fills container width; the file list stacks below.',
  figma: {
    layoutMode: 'VERTICAL',
    itemSpacing: 'space.3',
    paddingX: 'space.6',
    paddingY: 'space.6',
    cornerRadius: 'radius.surface',
    fill: 'color.bg.subtle',
    strokeColor: 'color.border.strong',
    strokeWidth: 'border.width.1',
    primaryAxisAlign: 'CENTER',
    counterAxisAlign: 'CENTER',
  },
});
