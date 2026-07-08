import type { Meta, StoryObj } from '@storybook/react';
import { ScatterChart } from './ScatterChart';
import { scatterChartMeta } from './ScatterChart.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';

const GROUP_A = [
  { x: 12, y: 22 },
  { x: 18, y: 30 },
  { x: 24, y: 28 },
  { x: 30, y: 44 },
  { x: 36, y: 41 },
  { x: 42, y: 58 },
  { x: 48, y: 62 },
];

const GROUP_B = [
  { x: 10, y: 44 },
  { x: 20, y: 38 },
  { x: 26, y: 52 },
  { x: 34, y: 47 },
  { x: 40, y: 66 },
  { x: 46, y: 60 },
];

const meta: Meta<typeof ScatterChart> = {
  title: 'Charts/ScatterChart',
  component: ScatterChart,
  tags: ['autodocs'],
  parameters: metaParameters(scatterChartMeta),
  argTypes: argTypesFromMeta(scatterChartMeta),
  args: {
    ...argsFromMeta(scatterChartMeta),
    xLabel: '노출',
    yLabel: '전환',
    series: [{ name: '캠페인 A', points: GROUP_A }],
    format: (v) => v.toLocaleString(),
  },
  decorators: [(Story) => <div style={{ maxWidth: 460 }}>{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof ScatterChart>;

export const Points: Story = {};

export const WithTrend: Story = {
  args: { type: 'B' },
};

export const MultiSeries: Story = {
  args: {
    type: 'B',
    series: [
      { name: '캠페인 A', points: GROUP_A },
      { name: '캠페인 B', points: GROUP_B },
    ],
  },
};
