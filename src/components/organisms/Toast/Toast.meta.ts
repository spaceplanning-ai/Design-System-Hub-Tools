import { defineComponentMeta } from '../../../core/defineComponent';

export const toastMeta = defineComponentMeta({
  name: 'Toast',
  slug: 'toast',
  category: 'organism',
  description:
    'Transient notification managed by ToastProvider/useToast, with tone, action and auto-dismiss.',
  tags: ['feedback', 'overlay'],
  variantProps: [
    {
      name: 'type',
      label: 'Type',
      options: ['A', 'B'],
      default: 'A',
      description: 'Layout preset — A: compact · B: rich with title/actions.',
    },
    {
      name: 'tone',
      label: 'Tone',
      options: ['neutral', 'info', 'success', 'warning', 'danger'],
      default: 'neutral',
    },
    {
      name: 'placement',
      label: 'Placement',
      options: ['bottom-right', 'bottom-center', 'top-right', 'top-center'],
      default: 'bottom-right',
    },
  ],
  componentProps: [
    { name: 'title', type: 'text', default: 'Saved', figmaType: 'TEXT' },
    { name: 'description', type: 'text', figmaType: 'TEXT' },
    { name: 'duration', type: 'number', default: 4000, figmaType: 'TEXT' },
    { name: 'closable', type: 'boolean', default: true, figmaType: 'BOOLEAN' },
    { name: 'action', type: 'instanceSwap', figmaType: 'INSTANCE_SWAP' },
  ],
  states: ['default'],
  a11y: { role: 'status', notes: ['role="status" with aria-live="polite"; errors use assertive.'] },
  responsive: 'Anchored to a viewport corner; full-width on mobile.',
  figma: {
    layoutMode: 'HORIZONTAL',
    itemSpacing: 'space.3',
    paddingX: 'space.4',
    paddingY: 'space.3',
    cornerRadius: 'radius.lg',
    fill: 'color.bg.surface',
  },
});
