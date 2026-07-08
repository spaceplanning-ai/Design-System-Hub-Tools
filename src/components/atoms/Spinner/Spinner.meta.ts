import { defineComponentMeta } from '../../../core/defineComponent';

export const spinnerMeta = defineComponentMeta({
  name: 'Spinner',
  slug: 'spinner',
  category: 'atom',
  description: 'Indeterminate loading indicator driven by Motion tokens.',
  tags: ['feedback', 'loading'],
  variantProps: [
    { name: 'size', label: 'Size', options: ['xs', 'sm', 'md', 'lg', 'xl'], default: 'md' },
    {
      name: 'tone',
      label: 'Tone',
      options: ['brand', 'neutral', 'success', 'warning', 'danger'],
      default: 'brand',
    },
  ],
  componentProps: [
    { name: 'label', type: 'text', default: 'Loading', figmaType: 'TEXT' },
    { name: 'labelPlacement', type: 'select', options: ['hidden', 'end', 'bottom'], default: 'hidden', figmaType: 'TEXT', description: 'Visible label position.' },
  ],
  states: ['default', 'loading'],
  a11y: { role: 'status', notes: ['Announces via `role="status"` and a visually-hidden label.'] },
  responsive: 'Fixed sizes via tokens; inherits color from `tone`.',
  figma: { layoutMode: 'NONE', height: 'size.control.sm' },
});
