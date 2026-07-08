import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Slider } from './Slider';
import { sliderMeta } from './Slider.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';

const meta: Meta<typeof Slider> = {
  title: 'Atoms/Slider',
  component: Slider,
  tags: ['autodocs'],
  parameters: metaParameters(sliderMeta),
  argTypes: argTypesFromMeta(sliderMeta),
  args: { ...argsFromMeta(sliderMeta), defaultValue: 40, showValue: true },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof Slider>;

export const Playground: Story = {};

export const Tones: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tds-space-4)' }}>
      {(['brand', 'neutral', 'success', 'warning', 'danger'] as const).map((t) => (
        <Slider key={t} {...args} tone={t} defaultValue={60} />
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tds-space-4)' }}>
      {(['sm', 'md', 'lg'] as const).map((s) => (
        <Slider key={s} {...args} size={s} defaultValue={50} />
      ))}
    </div>
  ),
};

export const Controlled: Story = {
  render: (args) => {
    const [v, setV] = useState(25);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tds-space-2)' }}>
        <Slider {...args} value={v} onValueChange={setV} />
        <p style={{ fontSize: 13, color: 'var(--tds-color-fg-muted)' }}>현재 값: {v}</p>
      </div>
    );
  },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 30 },
};
