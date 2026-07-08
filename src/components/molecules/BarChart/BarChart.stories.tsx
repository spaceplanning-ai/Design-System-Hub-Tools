import type { Meta, StoryObj } from '@storybook/react';
import { BarChart } from './BarChart';
import { barChartMeta } from './BarChart.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';

const DATA = [
  { label: '월', value: 32 },
  { label: '화', value: 48 },
  { label: '수', value: 27 },
  { label: '목', value: 61 },
  { label: '금', value: 54 },
  { label: '토', value: 18 },
  { label: '일', value: 12 },
];

const meta: Meta<typeof BarChart> = {
  title: 'Charts/BarChart',
  component: BarChart,
  tags: ['autodocs'],
  parameters: metaParameters(barChartMeta),
  argTypes: argTypesFromMeta(barChartMeta),
  args: { ...argsFromMeta(barChartMeta), data: DATA },
  decorators: [(Story) => <div style={{ maxWidth: 460 }}>{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof BarChart>;

export const Vertical: Story = {};

export const Horizontal: Story = {
  args: {
    type: 'B',
    color: '2',
    data: [
      { label: '서울', value: 940 },
      { label: '경기', value: 1320 },
      { label: '부산', value: 410 },
      { label: '대구', value: 280 },
      { label: '인천', value: 360 },
    ],
    format: (v) => v.toLocaleString(),
  },
};

export const Colors: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 'var(--tds-space-5)' }}>
      {(['1', '3', '5'] as const).map((c) => (
        <BarChart key={c} {...args} color={c} height={140} />
      ))}
    </div>
  ),
};
