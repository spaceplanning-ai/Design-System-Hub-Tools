import type { Meta, StoryObj } from '@storybook/react';
import { DonutChart } from './DonutChart';
import { donutChartMeta } from './DonutChart.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';

const DATA = [
  { label: '검색', value: 4200 },
  { label: '직접', value: 2600 },
  { label: 'SNS', value: 1800 },
  { label: '추천', value: 900 },
  { label: '기타', value: 500 },
];

const meta: Meta<typeof DonutChart> = {
  title: 'Charts/DonutChart',
  component: DonutChart,
  tags: ['autodocs'],
  parameters: metaParameters(donutChartMeta),
  argTypes: argTypesFromMeta(donutChartMeta),
  args: { ...argsFromMeta(donutChartMeta), data: DATA, format: (v) => v.toLocaleString() },
  decorators: [(Story) => <div style={{ maxWidth: 420 }}>{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof DonutChart>;

export const Donut: Story = {};

export const Pie: Story = {
  args: { type: 'B' },
};

export const WithTotalLabel: Story = {
  args: { total: '10,000' },
};

/** Chart ↔ table toggle: a keyboard/screen-reader friendly data table fallback. */
export const TableToggle: Story = {
  args: { withTableToggle: true },
};
