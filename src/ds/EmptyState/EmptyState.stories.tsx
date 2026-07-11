import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { EmptyState, type EmptyStateProps } from './EmptyState'

function SearchOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  )
}

// 액션 콜백 확인용 데모
function EmptyStateDemo(props: EmptyStateProps) {
  const [clicks, setClicks] = useState(0)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <EmptyState {...props} onAction={() => setClicks((count) => count + 1)} />
      {clicks > 0 && (
        <span style={{ fontFamily: 'var(--ds-font-family)', fontSize: 'var(--ds-font-size-xs)', color: 'var(--ds-color-secondary)' }}>
          액션 클릭: {clicks}회
        </span>
      )}
    </div>
  )
}

const meta = {
  title: 'Admin/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  args: {
    title: '데이터가 없습니다',
    description: '검색 조건을 변경하거나 새 항목을 추가해 보세요.',
    actionLabel: '항목 추가',
    compact: false,
  },
  argTypes: {
    icon: { control: false },
    onAction: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <EmptyStateDemo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <EmptyState
        title="데이터가 없습니다"
        description="검색 조건을 변경하거나 새 항목을 추가해 보세요."
        actionLabel="항목 추가"
      />
      <EmptyState title="등록된 회원이 없습니다" />
      <EmptyState
        title="검색 결과가 없습니다"
        description="다른 키워드로 다시 검색해 보세요."
        icon={<SearchOffIcon />}
      />
      <EmptyState
        title="알림이 없습니다"
        description="새 알림이 도착하면 여기에 표시됩니다."
        actionLabel="새로고침"
        compact
      />
    </div>
  ),
}
