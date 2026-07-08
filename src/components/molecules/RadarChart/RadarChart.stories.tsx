import type { Meta, StoryObj } from '@storybook/react';
import { RadarChart } from './RadarChart';
import { radarChartMeta } from './RadarChart.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';

const AXES = ['속도', '체력', '기술', '수비', '패스', '슈팅'];

const SERIES = [
  { name: '선수 A', values: [80, 65, 90, 55, 70, 85] },
  { name: '선수 B', values: [60, 85, 70, 80, 75, 60] },
];

const meta: Meta<typeof RadarChart> = {
  title: 'Charts/RadarChart',
  component: RadarChart,
  tags: ['autodocs'],
  parameters: metaParameters(radarChartMeta),
  argTypes: argTypesFromMeta(radarChartMeta),
  args: { ...argsFromMeta(radarChartMeta), axes: AXES, series: SERIES, max: 100 },
  decorators: [(Story) => <div style={{ maxWidth: 360 }}>{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof RadarChart>;

export const Filled: Story = {};

export const Single: Story = {
  args: {
    series: [{ name: '역량', values: [70, 90, 60, 80, 50] }],
    axes: ['기획', '디자인', '개발', '분석', '운영'],
    max: 100,
  },
};

export const LineOnly: Story = {
  args: { type: 'B' },
};
