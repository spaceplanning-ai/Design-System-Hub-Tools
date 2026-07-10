import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { TextField } from './TextField'

const meta = {
  title: '3. 컴포넌트/TextField',
  component: TextField,
  tags: ['autodocs'],
  args: {
    label: 'Email',
    placeholder: 'name@example.com',
    disabled: false,
    error: false,
    description: '업무용 이메일을 입력하세요.',
    showDescription: true,
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof TextField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <TextField label="Email" placeholder="name@example.com" />
      <TextField
        label="Email"
        placeholder="name@example.com"
        description="업무용 이메일을 입력하세요."
        showDescription
      />
      <TextField
        label="Email"
        placeholder="name@example.com"
        error
        description="올바른 이메일 형식이 아닙니다."
        showDescription
      />
      <TextField label="Email" placeholder="name@example.com" disabled />
    </div>
  ),
}
