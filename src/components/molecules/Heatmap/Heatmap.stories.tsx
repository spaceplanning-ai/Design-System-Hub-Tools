import type { Meta, StoryObj } from '@storybook/react';
import { Heatmap } from './Heatmap';
import { heatmapMeta } from './Heatmap.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';

const ROWS = ['월', '화', '수', '목', '금'];
const COLS = ['09시', '12시', '15시', '18시', '21시'];
const DATA = [
  [12, 34, 22, 45, 30],
  [18, 41, 28, 52, 38],
  [9, 27, 19, 33, 24],
  [22, 48, 35, 61, 44],
  [15, 30, 25, 40, 33],
];

const meta: Meta<typeof Heatmap> = {
  title: 'Charts/Heatmap',
  component: Heatmap,
  tags: ['autodocs'],
  parameters: metaParameters(heatmapMeta),
  argTypes: argTypesFromMeta(heatmapMeta),
  args: { ...argsFromMeta(heatmapMeta), data: DATA, rows: ROWS, cols: COLS },
  decorators: [(Story) => <div style={{ maxWidth: 460 }}>{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof Heatmap>;

export const Cells: Story = {};

export const WithValues: Story = {
  args: { type: 'B' },
};

export const Correlation: Story = {
  args: {
    type: 'B',
    rows: ['A', 'B', 'C', 'D'],
    cols: ['A', 'B', 'C', 'D'],
    data: [
      [1, 0.62, 0.18, 0.44],
      [0.62, 1, 0.31, 0.27],
      [0.18, 0.31, 1, 0.55],
      [0.44, 0.27, 0.55, 1],
    ],
    format: (v) => v.toFixed(2),
  },
};
