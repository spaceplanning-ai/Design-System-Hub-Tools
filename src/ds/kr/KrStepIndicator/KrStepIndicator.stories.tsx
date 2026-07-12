import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../../shared/figma'
import { KrStepIndicator } from './KrStepIndicator'

const meta = {
  title: '6. KR 컴포넌트/진행 단계',
  component: KrStepIndicator,
  tags: ['autodocs'],
  args: {
    steps: ['수단 선택', '인증', '완료'],
    current: 1,
  },
  argTypes: {
    current: { control: { type: 'inline-radio', options: [0, 1, 2] } },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof KrStepIndicator>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const AllStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <KrStepIndicator steps={['수단 선택', '인증', '완료']} current={0} />
      <KrStepIndicator steps={['수단 선택', '인증', '완료']} current={1} />
      <KrStepIndicator steps={['수단 선택', '인증', '완료']} current={2} />
    </div>
  ),
}
