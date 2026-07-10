import type { Meta, StoryObj } from '@storybook/react'
import {
  BellIcon,
  BookOpenIcon,
  CalendarIcon,
  CameraIcon,
  ChatBubbleLeftIcon,
  CloudIcon,
  Cog6ToothIcon,
  HeartIcon,
  HomeIcon,
  ShoppingCartIcon,
  StarIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import { FIGMA_FILE } from '../shared/figma'

const ICONS = [
  ['BellIcon', BellIcon],
  ['BookOpenIcon', BookOpenIcon],
  ['CalendarIcon', CalendarIcon],
  ['CameraIcon', CameraIcon],
  ['ChatBubbleLeftIcon', ChatBubbleLeftIcon],
  ['CloudIcon', CloudIcon],
  ['Cog6ToothIcon', Cog6ToothIcon],
  ['HeartIcon', HeartIcon],
  ['HomeIcon', HomeIcon],
  ['ShoppingCartIcon', ShoppingCartIcon],
  ['StarIcon', StarIcon],
  ['UserIcon', UserIcon],
] as const

const meta = {
  title: 'Icons/Heroicons (Tailwind SVG)',
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        textAlign: 'center',
      }}
    >
      {ICONS.map(([name, Icon]) => (
        <div key={name}>
          <Icon className="w-6 h-6" style={{ width: 24, height: 24, margin: '0 auto' }} />
          <div>{name}</div>
        </div>
      ))}
    </div>
  ),
}
