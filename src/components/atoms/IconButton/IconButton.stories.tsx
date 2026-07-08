import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { IconButton } from './IconButton';
import { iconButtonMeta } from './IconButton.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';
import { Icon } from '../Icon';

const meta: Meta<typeof IconButton> = {
  title: 'Atoms/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  parameters: metaParameters(iconButtonMeta),
  argTypes: argTypesFromMeta(iconButtonMeta),
  args: { ...argsFromMeta(iconButtonMeta), label: 'Settings', icon: <Icon name="settings" size="sm" /> },
};
export default meta;

type Story = StoryObj<typeof IconButton>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (a) => (
    <div style={{ display: 'flex', gap: 'var(--tds-space-2)' }}>
      {(['solid', 'outline', 'ghost', 'soft'] as const).map((v) => (
        <IconButton key={v} {...a} variant={v} tone="brand" />
      ))}
    </div>
  ),
};

export const Indicator: Story = {
  render: () => <IconButton icon={<Icon name="bell" />} label="Notifications" indicator />,
};

export const Toggle: Story = {
  render: () => {
    const [pressed, setPressed] = useState(false);
    return (
      <IconButton
        icon={<Icon name="star" />}
        label="Favorite"
        pressed={pressed}
        onClick={() => setPressed((p) => !p)}
      />
    );
  },
};
