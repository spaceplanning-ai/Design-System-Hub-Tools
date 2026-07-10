import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../shared/FrameworkScope'
import { FIGMA_FILE } from '../shared/figma'
import css from 'bootstrap-icons/font/bootstrap-icons.css?inline'

const ICONS = [
  'alarm',
  'bell',
  'book',
  'calendar',
  'camera',
  'cart',
  'chat',
  'cloud',
  'gear',
  'heart',
  'house',
  'star',
]

const meta = {
  title: 'Icons/Bootstrap Icons',
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <FrameworkScope styles={[css]}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          textAlign: 'center',
        }}
      >
        {ICONS.map((name) => (
          <div key={name}>
            <i className={`bi bi-${name}`} style={{ fontSize: '24px' }} />
            <div>{name}</div>
          </div>
        ))}
      </div>
    </FrameworkScope>
  ),
}
