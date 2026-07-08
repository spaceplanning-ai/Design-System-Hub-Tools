import { defineComponentMeta } from '../../../core/defineComponent';

export const socialLoginButtonMeta = defineComponentMeta({
  name: 'SocialLoginButton',
  slug: 'social-login-button',
  category: 'atom',
  description:
    'OAuth continue-with button. One brand-locked variant per provider (Kakao, Naver, Apple, Google, Facebook, email) — each carries its official palette and logo mark. Supports a full-width label form and a compact circular icon-only form.',
  tags: ['action', 'auth', 'oauth', 'social-login'],
  variantProps: [
    {
      name: 'provider',
      label: 'Provider',
      options: ['kakao', 'naver', 'apple', 'google', 'facebook', 'email'],
      default: 'kakao',
      description: 'OAuth provider. Selects the brand palette and logo mark.',
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
    {
      name: 'label',
      type: 'text',
      figmaType: 'TEXT',
      description: 'CTA text. Defaults to the provider’s localized label.',
    },
    {
      name: 'fullWidth',
      type: 'boolean',
      default: true,
      figmaType: 'BOOLEAN',
      description: 'Stretch to fill the container.',
    },
    {
      name: 'iconOnly',
      type: 'boolean',
      default: false,
      figmaType: 'BOOLEAN',
      description: 'Render as a circular mark-only button (label becomes the aria-label).',
    },
    { name: 'loading', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
    { name: 'disabled', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
  ],
  states: ['default', 'hover', 'active', 'focus', 'disabled', 'loading'],
  tokens: [
    { property: 'corner-radius', token: 'radius.control' },
    { property: 'height', token: 'size.control.md', when: { size: 'md' } },
    { property: 'padding-x', token: 'space.4' },
    { property: 'transition', token: 'motion.duration.hover' },
  ],
  a11y: {
    role: 'button',
    keyboard: ['Enter / Space: activate'],
    notes: [
      'Native <button>; brand fills are locked per provider (official palettes), not theme tokens.',
      'Icon-only form exposes the provider label via `aria-label`.',
    ],
  },
  responsive: '`fullWidth` stretches to the container; sizes scale via control-height tokens.',
  figma: {
    layoutMode: 'HORIZONTAL',
    itemSpacing: 'space.2',
    paddingX: 'space.4',
    paddingY: 'space.2',
    cornerRadius: 'radius.control',
    height: 'size.control.md',
    primaryAxisAlign: 'CENTER',
    counterAxisAlign: 'CENTER',
  },
});
