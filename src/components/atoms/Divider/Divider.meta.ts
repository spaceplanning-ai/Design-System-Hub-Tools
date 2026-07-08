import { defineComponentMeta } from '../../../core/defineComponent';

export const dividerMeta = defineComponentMeta({
  name: 'Divider',
  slug: 'divider',
  category: 'atom',
  description: 'Visual or semantic separator between content, with an optional inline label.',
  tags: ['layout', 'separator'],
  variantProps: [
    { name: 'orientation', label: 'Orientation', options: ['horizontal', 'vertical'], default: 'horizontal' },
    { name: 'variant', label: 'Style', options: ['solid', 'dashed'], default: 'solid' },
    { name: 'tone', label: 'Tone', options: ['subtle', 'default', 'strong'], default: 'default' },
  ],
  componentProps: [
    { name: 'label', type: 'text', figmaType: 'TEXT', description: 'Optional inline label (horizontal only).' },
    { name: 'labelPosition', type: 'select', options: ['start', 'center', 'end'], default: 'center', figmaType: 'TEXT', description: 'Label alignment along the rule.' },
  ],
  states: ['default'],
  a11y: { role: 'separator', notes: ['Renders `role="separator"` with matching `aria-orientation`.'] },
  responsive: 'Horizontal stretches to container width; vertical to container height.',
  figma: { layoutMode: 'NONE', strokeColor: 'color.border.default', strokeWidth: 'border.width.1' },
});
