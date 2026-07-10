import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { KrAuthMethodSelect, type KrAuthMethodSelectProps } from './KrAuthMethodSelect'

// 컨트롤드 데모 — 선택값을 스토리에서 보관
function MethodSelectDemo(props: KrAuthMethodSelectProps) {
  const [value, setValue] = useState(props.value)
  return <KrAuthMethodSelect {...props} value={value} onChange={setValue} />
}

const meta = {
  title: '6. KR 컴포넌트/본인인증 수단 선택',
  component: KrAuthMethodSelect,
  tags: ['autodocs'],
  args: {
    value: 'pass',
    disabled: false,
  },
  argTypes: {
    onChange: { control: false },
    methods: { control: false },
  },
} satisfies Meta<typeof KrAuthMethodSelect>

export default meta
type Story = StoryObj<typeof meta>

// 카드를 클릭하거나 방향키(↑/↓)로 인증 수단을 고를 수 있습니다
export const Default: Story = {
  render: (args) => <MethodSelectDemo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontFamily: 'var(--ds-font-family)', fontSize: 13, color: 'var(--ds-color-secondary)' }}>
          카카오 인증 선택됨
        </span>
        <MethodSelectDemo value="kakao" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontFamily: 'var(--ds-font-family)', fontSize: 13, color: 'var(--ds-color-secondary)' }}>
          비활성(disabled)
        </span>
        <KrAuthMethodSelect value="pass" disabled />
      </div>
    </div>
  ),
}
