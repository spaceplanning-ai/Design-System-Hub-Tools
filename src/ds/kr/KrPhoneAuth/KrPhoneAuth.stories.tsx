import type { Meta, StoryObj } from '@storybook/react'
import { KrPhoneAuth } from './KrPhoneAuth'

const meta = {
  title: '6. KR 컴포넌트/휴대폰 본인인증',
  component: KrPhoneAuth,
  tags: ['autodocs'],
  argTypes: {
    onComplete: { control: false },
  },
} satisfies Meta<typeof KrPhoneAuth>

export default meta
type Story = StoryObj<typeof meta>

// 정보 입력 → 인증번호 확인 → 완료. 모든 상태는 컴포넌트 내부에서 관리됩니다.
export const Default: Story = {
  render: () => <KrPhoneAuth onComplete={(r) => console.log('완료', r)} />,
}

// 에러/만료 확인용 안내 — 플로우 상태는 내부에 있으므로 아래 값으로 각 상태를 재현합니다
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
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
        <li>정상: 인증번호 123456 입력 시 완료 처리</li>
        <li>에러: 그 외 번호 입력 시 &apos;인증번호가 일치하지 않습니다&apos;</li>
        <li>만료: 03:00 카운트다운이 끝나면 &apos;인증 시간이 만료되었습니다&apos; + 재전송 유도</li>
      </ul>
      <KrPhoneAuth />
    </div>
  ),
}
