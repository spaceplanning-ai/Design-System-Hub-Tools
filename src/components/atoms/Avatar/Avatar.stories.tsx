import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Avatar';
import { avatarMeta } from './Avatar.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';

const meta: Meta<typeof Avatar> = {
  title: 'Atoms/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  parameters: metaParameters(avatarMeta),
  argTypes: argTypesFromMeta(avatarMeta),
  args: { ...argsFromMeta(avatarMeta), name: 'Jane Doe' },
};
export default meta;

type Story = StoryObj<typeof Avatar>;

export const Initials: Story = {};
export const WithImage: Story = {
  args: { src: 'https://i.pravatar.cc/120?img=5', status: 'online' },
};
export const Sizes: Story = {
  render: (a) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--tds-space-3)' }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((s) => (
        <Avatar key={s} {...a} size={s} />
      ))}
    </div>
  ),
};

export const Fallbacks: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--tds-space-3)' }}>
      <Avatar name="Jane Doe" />
      <Avatar />
      <Avatar src="https://broken.example/x.png" name="Broken" />
    </div>
  ),
};

export const Statuses: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--tds-space-3)' }}>
      {(['online', 'offline', 'busy', 'away'] as const).map((s) => (
        <Avatar key={s} name="User" status={s} />
      ))}
    </div>
  ),
};
