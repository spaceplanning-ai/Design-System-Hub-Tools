import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Alert } from './Alert'

const meta = {
  title: '3. 컴포넌트/Feedback/Alert',
  component: Alert,
  tags: ['autodocs'],
  args: {
    variant: 'error',
    label: 'This is a warning message.',
    showIcon: true,
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['info', 'success', 'warning', 'error'] },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480 }}>
      <Alert variant="info" label="새로운 업데이트가 있어요." showIcon />
      <Alert variant="success" label="저장이 완료되었습니다." showIcon />
      <Alert variant="warning" label="저장 공간이 부족해요." showIcon />
      <Alert variant="error" label="문제가 발생했습니다." showIcon />
      <Alert variant="warning" label="아이콘 없는 경고 메시지." />
    </div>
  ),
}
