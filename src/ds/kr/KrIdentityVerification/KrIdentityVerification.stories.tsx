import type { Meta, StoryObj } from '@storybook/react'
import { Card } from '../../Card/Card'
import { KrIdentityVerification } from './KrIdentityVerification'

const meta = {
  title: '6. KR 컴포넌트/본인인증',
  component: KrIdentityVerification,
  tags: ['autodocs'],
} satisfies Meta<typeof KrIdentityVerification>

export default meta
type Story = StoryObj<typeof meta>

// 전체 플로우 — 수단 선택 → 인증(휴대폰/인증서/소셜) → 완료. 카드 안에서 동작합니다.
export const Default: Story = {
  render: () => (
    <Card title="본인인증">
      <KrIdentityVerification />
    </Card>
  ),
}

// 카드 없이 단독 배치
export const Standalone: Story = {
  render: () => <KrIdentityVerification />,
}
