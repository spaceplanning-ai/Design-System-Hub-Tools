import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Video } from './Video'

const meta = {
  title: '3. 컴포넌트/Media/Video',
  component: Video,
  tags: ['autodocs'],
  args: {
    title: 'Sample video',
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Video>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Product overview',
  },
}

export const WithControls: Story = {
  args: {
    src: 'https://www.w3schools.com/html/mov_bbb.mp4',
    title: 'Playable video',
  },
}
