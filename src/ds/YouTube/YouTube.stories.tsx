import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { YouTube } from './YouTube'

const meta = {
  title: '3. 컴포넌트/Media/YouTube',
  component: YouTube,
  tags: ['autodocs'],
  args: {
    id: 'dQw4w9WgXcQ',
    title: 'YouTube video',
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof YouTube>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
