import type { Meta, StoryObj } from '@storybook/react';
import { LineChart } from './LineChart';
import { lineChartMeta } from './LineChart.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';

const LABELS = ['1월', '2월', '3월', '4월', '5월', '6월'];

const meta: Meta<typeof LineChart> = {
  title: 'Charts/LineChart',
  component: LineChart,
  tags: ['autodocs'],
  parameters: metaParameters(lineChartMeta),
  argTypes: argTypesFromMeta(lineChartMeta),
  args: {
    ...argsFromMeta(lineChartMeta),
    labels: LABELS,
    series: [{ name: '방문자', points: [120, 145, 132, 178, 210, 264] }],
    format: (v) => v.toLocaleString(),
  },
  decorators: [(Story) => <div style={{ maxWidth: 460 }}>{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof LineChart>;

export const Line: Story = {};

export const Area: Story = {
  args: { type: 'B', showDots: true },
};

export const MultiSeries: Story = {
  args: {
    series: [
      { name: '방문자', points: [120, 145, 132, 178, 210, 264] },
      { name: '가입자', points: [40, 62, 55, 90, 120, 150] },
      { name: '결제', points: [12, 20, 18, 34, 48, 72] },
    ],
  },
};

/** Chart ↔ table toggle: rows are x-axis labels, columns are series. */
export const TableToggle: Story = {
  args: {
    withTableToggle: true,
    series: [
      { name: '방문자', points: [120, 145, 132, 178, 210, 264] },
      { name: '가입자', points: [40, 62, 55, 90, 120, 150] },
    ],
  },
};
