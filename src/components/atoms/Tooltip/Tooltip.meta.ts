import { defineComponentMeta } from '../../../core/defineComponent';

export const tooltipMeta = defineComponentMeta({
  name: 'Tooltip',
  slug: 'tooltip',
  category: 'atom',
  description: 'Contextual label revealed on hover/focus of a trigger, with a Motion-token entrance.',
  tags: ['overlay', 'feedback'],
  variantProps: [
    { name: 'placement', label: 'Placement', options: ['top', 'right', 'bottom', 'left'], default: 'top' },
    { name: 'tone', label: 'Tone', options: ['inverse', 'default'], default: 'inverse' },
  ],
  componentProps: [
    { name: 'content', type: 'text', default: 'Tooltip', figmaType: 'TEXT' },
    { name: 'delay', type: 'number', default: 150, figmaType: 'TEXT', description: 'Show delay (ms).' },
    { name: 'closeDelay', type: 'number', default: 0, figmaType: 'TEXT', description: 'Hide delay (ms).' },
    { name: 'children', type: 'instanceSwap', figmaType: 'INSTANCE_SWAP', description: 'Trigger element.' },
  ],
  states: ['default', 'hover', 'focus'],
  a11y: {
    role: 'tooltip',
    keyboard: ['Focus trigger: show', 'Escape: hide'],
    notes: ['Associated to the trigger via aria-describedby.'],
  },
  responsive: 'Repositions via `placement`; content wraps at max-width.',
  figma: {
    layoutMode: 'HORIZONTAL',
    paddingX: 'space.2',
    paddingY: 'space.1',
    cornerRadius: 'radius.sm',
    fill: 'color.bg.inverse',
  },
});
