import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Image } from './Image'

const meta = {
  title: '3. 컴포넌트/Media/Image',
  component: Image,
  tags: ['autodocs'],
  args: {
    ratio: '16x9',
    rounded: false,
  },
  argTypes: {
    ratio: { control: 'inline-radio', options: ['1x1', '4x3', '16x9'] },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Image>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Ratios: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <div style={{ width: 200 }}>
        <Image ratio="1x1" />
      </div>
      <div style={{ width: 200 }}>
        <Image ratio="4x3" />
      </div>
      <div style={{ width: 200 }}>
        <Image ratio="16x9" />
      </div>
    </div>
  ),
}
