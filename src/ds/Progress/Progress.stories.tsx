import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Progress } from './Progress'

const meta = {
  title: '3. 컴포넌트/Data/Progress',
  component: Progress,
  tags: ['autodocs'],
  args: { value: 50, label: '진행률' },
  argTypes: { value: { control: { type: 'range', min: 0, max: 100, step: 5 } }, label: { control: 'text' } },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Progress>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Steps: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: 320 }}>
      <Progress value={25} label="진행률" />
      <Progress value={50} label="진행률" />
      <Progress value={75} label="진행률" />
      <Progress value={100} label="진행률" />
    </div>
  ),
}
