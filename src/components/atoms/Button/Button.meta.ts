import { defineComponentMeta } from '../../../core/defineComponent';

export const buttonMeta = defineComponentMeta({
  name: 'Button',
  slug: 'button',
  category: 'atom',
  description:
    'Primary interactive control. Fully token-driven across five visual types and six tones, with loading and icon affordances.',
  tags: ['action', 'form', 'interactive'],
  variantProps: [
    {
      name: 'type',
      label: 'Type',
      options: ['A', 'B', 'C'],
      default: 'A',
      description: 'Content layout preset — A: label only · B: icon + label · C: icon only (square).',
    },
    {
      name: 'variant',
      label: 'Style',
      options: ['solid', 'outline', 'ghost', 'soft', 'link'],
      default: 'solid',
      description: 'Visual emphasis / fill style of the button.',
    },
    {
      name: 'tone',
      label: 'Tone',
      options: ['brand', 'neutral', 'success', 'warning', 'danger'],
      default: 'brand',
      description: 'Semantic color role.',
    },
    {
      name: 'size',
      label: 'Size',
      options: ['sm', 'md', 'lg'],
      default: 'md',
    },
    {
      name: 'shape',
      label: 'Shape',
      options: ['rounded', 'pill', 'square'],
      default: 'rounded',
    },
  ],
  componentProps: [
    { name: 'children', type: 'text', default: 'Button', figmaType: 'TEXT', description: 'Label text.' },
    { name: 'loading', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
    { name: 'disabled', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
    { name: 'fullWidth', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
    { name: 'iconStart', type: 'instanceSwap', figmaType: 'INSTANCE_SWAP', description: 'Leading icon slot.' },
    { name: 'iconEnd', type: 'instanceSwap', figmaType: 'INSTANCE_SWAP', description: 'Trailing icon slot.' },
  ],
  states: ['default', 'hover', 'active', 'focus', 'disabled', 'loading'],
  tokens: [
    { property: 'background', token: 'color.brand.solid', when: { variant: 'solid', tone: 'brand' } },
    { property: 'color', token: 'color.brand.fg', when: { variant: 'solid', tone: 'brand' } },
    // Outline border is tone-specific (CSS `--button-border`); the CSS scan only derives the
    // brand default, so bind every tone explicitly (these merge after and win per combo).
    { property: 'border-color', token: 'color.brand.border', when: { variant: 'outline', tone: 'brand' } },
    { property: 'border-color', token: 'color.neutral.border', when: { variant: 'outline', tone: 'neutral' } },
    { property: 'border-color', token: 'color.success.border', when: { variant: 'outline', tone: 'success' } },
    { property: 'border-color', token: 'color.warning.border', when: { variant: 'outline', tone: 'warning' } },
    { property: 'border-color', token: 'color.danger.border', when: { variant: 'outline', tone: 'danger' } },
    { property: 'corner-radius', token: 'radius.control' },
    { property: 'height', token: 'size.control.md', when: { size: 'md' } },
    { property: 'transition', token: 'motion.duration.hover' },
  ],
  a11y: {
    role: 'button',
    keyboard: ['Enter / Space: activate'],
    notes: ['Uses native <button>; `aria-busy` while loading; disabled removes it from the tab order.'],
  },
  responsive: '`fullWidth` stretches to container; sizes scale via control-height tokens.',
  figma: {
    layoutMode: 'HORIZONTAL',
    itemSpacing: 'space.2',
    paddingX: 'space.4',
    paddingY: 'space.2',
    cornerRadius: 'radius.control',
    fill: 'color.brand.solid',
    height: 'size.control.md',
    primaryAxisAlign: 'CENTER',
    counterAxisAlign: 'CENTER',
  },
});
