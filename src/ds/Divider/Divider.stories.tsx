import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Divider } from './Divider'

const meta = {
  title: '3. 컴포넌트/Layout/Divider',
  component: Divider,
  tags: ['autodocs'],
  args: { label: '또는' },
  argTypes: { label: { control: 'text' } },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Divider>

export default meta
type Story = StoryObj<typeof meta>

export const WithLabel: Story = {}
export const Plain: Story = { args: { label: undefined } }
