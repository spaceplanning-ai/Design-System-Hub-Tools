import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { ListPage } from './ListPage'

const meta = {
  title: 'Templates/ListPage',
  component: ListPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof ListPage>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
