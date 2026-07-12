import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { ImageSlide } from './ImageSlide'

const meta = {
  title: '3. 컴포넌트/Media/ImageSlide',
  component: ImageSlide,
  tags: ['autodocs'],
  args: {},
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof ImageSlide>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
