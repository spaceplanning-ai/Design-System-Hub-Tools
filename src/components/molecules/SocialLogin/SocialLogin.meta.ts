import { defineComponentMeta } from '../../../core/defineComponent';

export const socialLoginMeta = defineComponentMeta({
  name: 'SocialLogin',
  slug: 'social-login',
  category: 'molecule',
  description:
    'OAuth sign-in block. Two layout presets: Type A — full-width labelled buttons stacked with a divider and a secondary icon row; Type B — a compact centered grid of circular provider marks.',
  tags: ['auth', 'oauth', 'social-login', 'composition'],
  variantProps: [
    {
      name: 'type',
      label: 'Type',
      options: ['A', 'B'],
      default: 'A',
      description: 'Layout preset — A: full-width stack · B: icon grid.',
    },
    { name: 'size', label: 'Size', options: ['sm', 'md', 'lg'], default: 'md' },
    { name: 'shape', label: 'Shape', options: ['rounded', 'pill', 'square'], default: 'rounded' },
  ],
  componentProps: [
    { name: 'dividerLabel', type: 'text', default: '다른 계정으로 계속하기', figmaType: 'TEXT' },
    {
      name: 'showOthers',
      type: 'boolean',
      default: true,
      figmaType: 'BOOLEAN',
      description: 'Show the secondary icon-only row.',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: false,
      figmaType: 'BOOLEAN',
      description: 'Disable every provider button.',
    },
  ],
  states: ['default', 'loading', 'disabled'],
  a11y: {
    role: 'group',
    notes: ['Rendered as a labelled <div role="group">; each provider is an individual button.'],
  },
  responsive: 'Fills container width; primary buttons stretch, the secondary row centers.',
  figma: {
    layoutMode: 'VERTICAL',
    itemSpacing: 'space.3',
    counterAxisAlign: 'CENTER',
  },
});
