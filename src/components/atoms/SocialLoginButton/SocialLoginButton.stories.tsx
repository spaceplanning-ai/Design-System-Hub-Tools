import type { Meta, StoryObj } from '@storybook/react';
import { SocialLoginButton } from './SocialLoginButton';
import { socialProviders } from './brand-marks';
import { socialLoginButtonMeta } from './SocialLoginButton.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';

const meta: Meta<typeof SocialLoginButton> = {
  title: 'Atoms/SocialLoginButton',
  component: SocialLoginButton,
  tags: ['autodocs'],
  parameters: metaParameters(socialLoginButtonMeta),
  argTypes: argTypesFromMeta(socialLoginButtonMeta),
  args: { ...argsFromMeta(socialLoginButtonMeta), provider: 'kakao' },
};
export default meta;

type Story = StoryObj<typeof SocialLoginButton>;

export const Playground: Story = {};

export const Providers: Story = {
  render: (args) => (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tds-space-3)', maxWidth: 360 }}
    >
      {socialProviders.map((p) => (
        <SocialLoginButton key={p} {...args} provider={p} />
      ))}
    </div>
  ),
};

export const IconOnly: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--tds-space-3)', alignItems: 'center' }}>
      {socialProviders.map((p) => (
        <SocialLoginButton key={p} {...args} provider={p} iconOnly />
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tds-space-3)', maxWidth: 360 }}
    >
      {(['sm', 'md', 'lg'] as const).map((s) => (
        <SocialLoginButton key={s} {...args} provider="naver" size={s} />
      ))}
    </div>
  ),
};

export const States: Story = {
  render: (args) => (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tds-space-3)', maxWidth: 360 }}
    >
      <SocialLoginButton {...args} provider="apple" />
      <SocialLoginButton {...args} provider="apple" loading />
      <SocialLoginButton {...args} provider="apple" disabled />
    </div>
  ),
};
