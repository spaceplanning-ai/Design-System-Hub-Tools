import { defineComponentMeta } from '../../../core/defineComponent';

export const alertMeta = defineComponentMeta({
  name: 'Alert',
  slug: 'alert',
  category: 'organism',
  description:
    'Contextual message with tone-driven icon, optional title, action and dismissal. Type A/B/C are layout presets: A — inline, B — full-width banner, C — prominent (left accent bar).',
  tags: ['feedback', 'status'],
  variantProps: [
    {
      name: 'type',
      label: 'Type',
      options: ['A', 'B', 'C'],
      default: 'A',
      description:
        'Layout preset — A: inline · B: banner (full-width) · C: prominent (accent bar).',
    },
    { name: 'variant', label: 'Style', options: ['subtle', 'solid', 'outline'], default: 'subtle' },
    {
      name: 'tone',
      label: 'Tone',
      options: ['info', 'success', 'warning', 'danger', 'neutral'],
      default: 'info',
    },
  ],
  componentProps: [
    { name: 'title', type: 'text', default: 'Heads up', figmaType: 'TEXT' },
    { name: 'children', type: 'text', default: 'This is an alert message.', figmaType: 'TEXT' },
    { name: 'showIcon', type: 'boolean', default: true, figmaType: 'BOOLEAN' },
    { name: 'closable', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
    { name: 'action', type: 'instanceSwap', figmaType: 'INSTANCE_SWAP' },
  ],
  states: ['default'],
  a11y: { role: 'alert', notes: ['role="alert" announces the message; icon is decorative.'] },
  responsive: 'Fills container; content wraps and action drops below on narrow widths.',
  figma: {
    layoutMode: 'HORIZONTAL',
    itemSpacing: 'space.3',
    paddingX: 'space.4',
    paddingY: 'space.3',
    cornerRadius: 'radius.lg',
    fill: 'color.info.subtle',
  },
});
