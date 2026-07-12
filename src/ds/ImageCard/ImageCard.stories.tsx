import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { ImageCard } from './ImageCard'

const meta = {
  title: '3. 컴포넌트/Media/ImageCard',
  component: ImageCard,
  tags: ['autodocs'],
  args: {
    title: '이미지 카드',
    description: '설명 텍스트가 여기에 표시됩니다.',
    ratio: '16x9',
  },
  argTypes: {
    ratio: { control: 'inline-radio', options: ['4x3', '16x9'] },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof ImageCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithoutDescription: Story = {
  args: {
    description: undefined,
    ratio: '4x3',
  },
}
