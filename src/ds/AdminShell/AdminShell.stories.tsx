import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { AdminShell, type AdminShellProps } from './AdminShell'
import { Button } from '../Button/Button'

const NAV_ITEMS = [
  { label: '대시보드', value: 'dashboard' },
  { label: '운영', value: 'ops' },
  { label: '설정', value: 'settings' },
]

const SIDEBAR_SECTIONS = [
  {
    title: '관리',
    items: [
      { label: '회원 관리', value: 'users', badge: '12' },
      { label: '주문 관리', value: 'orders' },
      { label: '상품 관리', value: 'products' },
    ],
  },
  {
    title: '시스템',
    items: [
      { label: '권한 설정', value: 'permissions' },
      { label: '감사 로그', value: 'audit', disabled: true },
    ],
  },
]

function PlaceholderCard({ title, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        background: 'var(--ds-color-bg)',
        border: '1px solid var(--ds-color-border)',
        borderRadius: 'var(--ds-radius-md)',
        padding: 'var(--ds-spacing-5)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ds-spacing-2)',
      }}
    >
      <span style={{ fontSize: 'var(--ds-font-size-md)', fontWeight: 'var(--ds-font-weight-medium)', color: 'var(--ds-color-text)' }}>
        {title}
      </span>
      <span style={{ fontSize: 'var(--ds-font-size-sm)', color: 'var(--ds-color-secondary)' }}>{body}</span>
    </div>
  )
}

// 컨트롤드 컴포넌트용 데모
function AdminShellDemo(props: AdminShellProps) {
  const [navValue, setNavValue] = useState(props.navValue)
  const [sidebarValue, setSidebarValue] = useState(props.sidebarValue)
  return (
    <AdminShell
      {...props}
      navValue={navValue}
      onNavChange={setNavValue}
      sidebarValue={sidebarValue}
      onSidebarChange={setSidebarValue}
    />
  )
}

const meta = {
  title: 'Admin/AdminShell',
  component: AdminShell,
  tags: ['autodocs'],
  args: {
    brand: 'DS Admin',
    navItems: NAV_ITEMS,
    navValue: 'dashboard',
    sidebarSections: SIDEBAR_SECTIONS,
    sidebarValue: 'users',
    contentPadding: true,
    actions: <Button variant="primary" size="sm" label="로그아웃" />,
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ds-spacing-4)' }}>
        <PlaceholderCard title="오늘 가입한 회원" body="신규 가입 24명 — 어제보다 8% 증가했습니다." />
        <PlaceholderCard title="처리 대기 주문" body="미처리 주문 7건이 있습니다. 오늘 안에 확인해 주세요." />
      </div>
    ),
  },
  argTypes: {
    onNavChange: { control: false },
    onSidebarChange: { control: false },
    actions: { control: false },
    children: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof AdminShell>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <AdminShellDemo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <AdminShell
        brand="DS Admin"
        navItems={NAV_ITEMS}
        navValue="dashboard"
        sidebarSections={SIDEBAR_SECTIONS}
        sidebarValue="users"
        actions={<Button variant="primary" size="sm" label="로그아웃" />}
      >
        <PlaceholderCard title="기본 셸" body="패딩이 적용된 본문 영역입니다." />
      </AdminShell>
      <AdminShell
        brand="DS Admin"
        navItems={NAV_ITEMS}
        navValue="ops"
        sidebarSections={SIDEBAR_SECTIONS}
        sidebarValue="orders"
        contentPadding={false}
      >
        <div style={{ padding: 'var(--ds-spacing-4)', fontSize: 'var(--ds-font-size-sm)', color: 'var(--ds-color-secondary)' }}>
          contentPadding=false — 표/전체 폭 콘텐츠가 직접 여백을 관리합니다.
        </div>
      </AdminShell>
    </div>
  ),
}
