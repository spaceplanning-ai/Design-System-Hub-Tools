import type { Meta, StoryObj } from '@storybook/react';
import { SocialLogin } from './SocialLogin';
import { socialLoginMeta } from './SocialLogin.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';

const meta: Meta<typeof SocialLogin> = {
  title: 'Molecules/SocialLogin',
  component: SocialLogin,
  tags: ['autodocs'],
  parameters: { ...metaParameters(socialLoginMeta), layout: 'centered' },
  argTypes: argTypesFromMeta(socialLoginMeta),
  args: argsFromMeta(socialLoginMeta),
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof SocialLogin>;

/** Matches the reference: Kakao / Naver / Apple primary, Facebook + email as “other accounts”. */
export const Playground: Story = {};

export const AllProviders: Story = {
  args: {
    providers: ['kakao', 'naver', 'apple', 'google'],
    otherProviders: ['facebook', 'email'],
  },
};

export const NoOthers: Story = {
  args: { showOthers: false },
};

/** Type B — compact centered grid of circular provider marks. */
export const TypeBGrid: Story = {
  args: {
    type: 'B',
    providers: ['kakao', 'naver', 'apple', 'google', 'facebook', 'email'],
  },
};

/** A spinner on the loading provider disables the rest. */
export const Loading: Story = {
  render: () => <SocialLogin loadingProvider="kakao" onProviderSelect={() => {}} />,
};
