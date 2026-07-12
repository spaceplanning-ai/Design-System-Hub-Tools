import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Form } from './Form'

const meta = {
  title: '3. 컴포넌트/Layout/Form',
  component: Form,
  tags: ['autodocs'],
  args: {
    title: '문의하기',
    submitLabel: '보내기',
  },
  argTypes: {
    title: { control: 'text' },
    submitLabel: { control: 'text' },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Form>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
