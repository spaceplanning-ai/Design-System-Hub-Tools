import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Badge } from './Badge'

const meta = {
  title: '3. 컴포넌트/Action/Badge',
  component: Badge,
  tags: ['autodocs'],
  args: {
    variant: 'primary',
    appearance: 'soft',
    label: 'Badge',
    size: 'md',
  },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'error', 'success', 'warning'] },
    appearance: { control: 'inline-radio', options: ['solid', 'soft', 'outline'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {(['primary', 'secondary', 'error', 'success', 'warning'] as const).map((variant) => (
        <div key={variant} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Badge variant={variant} size="sm" label="Badge" />
          <Badge variant={variant} size="md" label="Badge" />
        </div>
      ))}
    </div>
  ),
}

export const Appearances: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {(['solid', 'soft', 'outline'] as const).map((appearance) => (
        <div key={appearance} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {(['primary', 'secondary', 'error', 'success', 'warning'] as const).map((variant) => (
            <Badge key={variant} variant={variant} appearance={appearance} size="md" label="Badge" />
          ))}
        </div>
      ))}
    </div>
  ),
}
