import type { Meta, StoryObj } from '@storybook/react';
import { Gauge } from './Gauge';
import { gaugeMeta } from './Gauge.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';

const meta: Meta<typeof Gauge> = {
  title: 'Charts/Gauge',
  component: Gauge,
  tags: ['autodocs'],
  parameters: metaParameters(gaugeMeta),
  argTypes: argTypesFromMeta(gaugeMeta),
  args: {
    ...argsFromMeta(gaugeMeta),
    value: 72,
    label: '완료율',
    format: (v) => `${v}%`,
  },
  decorators: [(Story) => <div style={{ maxWidth: 240 }}>{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof Gauge>;

export const Semicircle: Story = {};

export const Arc270: Story = {
  args: { type: 'B', value: 46, color: '2' },
};

export const CustomRange: Story = {
  args: {
    min: 0,
    max: 8,
    value: 5.6,
    label: 'CPU 부하',
    color: '6',
    format: (v) => v.toFixed(1),
  },
};
