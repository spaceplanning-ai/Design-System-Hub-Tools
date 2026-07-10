import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { DsChart } from './DsChart'

const meta = {
  title: '4. 차트/DsChart',
  component: DsChart,
  tags: ['autodocs'],
  args: {
    type: 'line',
    dataset: 'revenue',
    showLegend: true,
    title: 'Revenue',
  },
  argTypes: {
    type: { control: 'inline-radio', options: ['line', 'bar', 'doughnut'] },
    dataset: { control: 'select', options: ['revenue', 'traffic', 'share'] },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof DsChart>

export default meta
type Story = StoryObj<typeof meta>

// 프리셋 전환(globals.theme) 시 차트가 리렌더되도록 preset을 key로 전달 (스펙 §9)
export const Default: Story = {
  render: (args, { globals }) => <DsChart key={String(globals.theme)} {...args} />,
}

export const Line: Story = {
  args: { type: 'line', dataset: 'revenue', title: 'Revenue' },
  render: (args, { globals }) => <DsChart key={String(globals.theme)} {...args} />,
}

export const Bar: Story = {
  args: { type: 'bar', dataset: 'traffic', title: 'Traffic' },
  render: (args, { globals }) => <DsChart key={String(globals.theme)} {...args} />,
}

export const Doughnut: Story = {
  args: { type: 'doughnut', dataset: 'share', title: 'Share' },
  render: (args, { globals }) => <DsChart key={String(globals.theme)} {...args} />,
}
