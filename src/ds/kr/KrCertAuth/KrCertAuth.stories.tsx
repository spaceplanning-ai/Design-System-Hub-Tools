import type { Meta, StoryObj } from '@storybook/react'
import { KrCertAuth } from './KrCertAuth'

const meta = {
  title: '6. KR 컴포넌트/인증서 인증',
  component: KrCertAuth,
  tags: ['autodocs'],
  args: {
    kind: 'joint',
  },
  argTypes: {
    kind: { control: 'inline-radio', options: ['joint', 'finance'] },
    onComplete: { control: false },
  },
} satisfies Meta<typeof KrCertAuth>

export default meta
type Story = StoryObj<typeof meta>

// 인증서 선택 → 비밀번호 입력 → 완료. 비밀번호 'password' 로 성공합니다.
export const Default: Story = {}

// 금융인증서 종류
export const Finance: Story = {
  args: { kind: 'finance' },
}

// 에러/만료 확인용 안내
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <ul
        style={{
          margin: 0,
          paddingLeft: 18,
          fontFamily: 'var(--ds-font-family)',
          fontSize: 13,
          color: 'var(--ds-color-secondary)',
          lineHeight: 1.7,
        }}
      >
        <li>정상: 비밀번호 password 입력 시 완료 처리</li>
        <li>에러: 그 외 비밀번호 입력 시 &apos;비밀번호가 일치하지 않습니다&apos;</li>
        <li>만료: &apos;만료&apos; 표시 인증서 선택 시 &apos;만료된 인증서입니다&apos; + 진행 불가</li>
      </ul>
      <KrCertAuth kind="joint" />
    </div>
  ),
}
