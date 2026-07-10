import { create } from '@storybook/theming'

// G1 — 과도한 커스텀 금지. colorPrimary/Secondary = toss 프리셋 primary(#3182F6)
export default create({
  base: 'light',
  brandTitle: 'DS Platform',
  appBorderRadius: 8,
  colorPrimary: '#3182F6',
  colorSecondary: '#3182F6',
})
