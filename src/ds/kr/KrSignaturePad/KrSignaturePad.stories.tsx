import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '../../Button/Button'
import { KrSignaturePad } from './KrSignaturePad'

// 전자서명 데모 — 서명이 끝날 때마다 dataURL을 받아 '저장'(빈 상태이면 비활성) 클릭 시
// 미리보기를 표시한다. 지우기/되돌리기는 컴포넌트 내부 DS Button으로 제공된다.
function SignatureDemo() {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
      <KrSignaturePad
        onChange={(v) => {
          setDataUrl(v)
          setSaved(null)
        }}
      />
      {/* 저장은 서명이 비어 있으면(isEmpty) 비활성 */}
      <Button
        variant="primary"
        size="md"
        label="저장"
        disabled={dataUrl == null}
        onClick={() => setSaved(dataUrl)}
      />
      {saved && (
        <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <figcaption style={{ fontSize: 13, color: 'var(--ds-color-secondary)' }}>
            저장된 서명 미리보기
          </figcaption>
          <img
            src={saved}
            alt="저장된 서명"
            style={{
              width: 160,
              border: '1px solid var(--ds-color-border)',
              borderRadius: 8,
              background: 'var(--ds-color-bg)',
            }}
          />
        </figure>
      )}
    </div>
  )
}

const meta = {
  title: '6. KR 컴포넌트/전자서명',
  component: KrSignaturePad,
  tags: ['autodocs'],
  args: {
    width: 320,
    height: 160,
    disabled: false,
    onChange: () => {},
  },
  argTypes: {
    onChange: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          '포인터 이벤트 기반 전자서명 패드. 마우스·터치·펜을 지원하고 devicePixelRatio로 선을 선명하게 렌더한다. 지우기/되돌리기를 제공하며, 스트로크가 끝날 때마다 PNG dataURL을 onChange로 전달한다. 접근성: 캔버스에 role="img"/aria-label을 부여하지만, 프로덕션에서는 서명이 어려운 사용자를 위해 서명자 성명 텍스트 입력 등 대체 수단을 반드시 함께 제공해야 한다.',
      },
    },
  },
} satisfies Meta<typeof KrSignaturePad>

export default meta
type Story = StoryObj<typeof meta>

// 인터랙티브 — 지우기/되돌리기 + 빈 상태에서 비활성화되는 저장 버튼과 미리보기
export const Default: Story = {
  render: () => <SignatureDemo />,
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}
