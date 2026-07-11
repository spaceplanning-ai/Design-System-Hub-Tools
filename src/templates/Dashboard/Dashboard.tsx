import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Badge } from '../../ds/Badge/Badge'
import { Button } from '../../ds/Button/Button'
import { DsChart } from '../../ds/Chart/DsChart'
import { Header } from '../../ds/Header/Header'
import { Navbar } from '../../ds/Navbar/Navbar'
import { Pagination } from '../../ds/Pagination/Pagination'
import { Sidebar } from '../../ds/Sidebar/Sidebar'
import { Statistics } from '../../ds/Statistics/Statistics'
import { Table, type TableColumn } from '../../ds/Table/Table'

type RecentUser = {
  id: string
  name: string
  email: string
  status: '활성' | '대기' | '정지'
  joinedAt: string
}

// 제네릭 고정 — 스토리·페이지에서 타입 추론용
const UserTable = Table<RecentUser>

const NAV_ITEMS = [
  { label: '대시보드', value: 'dashboard' },
  { label: '사용자', value: 'users' },
  { label: '설정', value: 'settings' },
]

const SIDEBAR_SECTIONS = [
  {
    title: '개요',
    items: [
      { label: '대시보드', value: 'dashboard' },
      { label: '사용자', value: 'users' },
      { label: '콘텐츠', value: 'content' },
    ],
  },
  {
    title: '관리',
    items: [
      { label: '권한', value: 'roles' },
      { label: '로그', value: 'logs' },
    ],
  },
]

const STATS = [
  { label: '월 매출', value: '₩ 4,280만', delta: 8.2, hint: '지난달 대비' },
  { label: '신규 가입', value: '1,284명', delta: 12.5, hint: '지난달 대비' },
  { label: '이탈률', value: '2.4%', delta: -0.6, hint: '지난달 대비' },
]

const RECENT_USERS: RecentUser[] = [
  { id: 'u1', name: '김서연', email: 'seoyeon.kim@example.com', status: '활성', joinedAt: '2026-07-08' },
  { id: 'u2', name: '이준호', email: 'junho.lee@example.com', status: '활성', joinedAt: '2026-07-07' },
  { id: 'u3', name: '박지민', email: 'jimin.park@example.com', status: '대기', joinedAt: '2026-07-05' },
  { id: 'u4', name: '최수아', email: 'sua.choi@example.com', status: '활성', joinedAt: '2026-07-03' },
  { id: 'u5', name: '정도윤', email: 'doyun.jung@example.com', status: '정지', joinedAt: '2026-07-01' },
]

const STATUS_VARIANT = { 활성: 'success', 대기: 'secondary', 정지: 'error' } as const

const COLUMNS: TableColumn<RecentUser>[] = [
  { key: 'name', header: '이름' },
  { key: 'email', header: '이메일' },
  {
    key: 'status',
    header: '상태',
    align: 'center',
    width: 96,
    render: (row) => <Badge variant={STATUS_VARIANT[row.status]} label={row.status} size="sm" />,
  },
  { key: 'joinedAt', header: '가입일', align: 'right' },
]

const cardStyle: CSSProperties = {
  background: 'var(--ds-color-bg)',
  border: '1px solid var(--ds-color-border)',
  borderRadius: 'var(--ds-radius-lg)',
  padding: 'var(--ds-spacing-5)',
  overflowX: 'auto',
}

/** Templates/Dashboard — Navbar·Sidebar·Statistics·Chart·Table을 조합한 어드민 대시보드 */
export function DashboardPage() {
  const [nav, setNav] = useState('dashboard')
  const [menu, setMenu] = useState('dashboard')
  const [page, setPage] = useState(1)

  return (
    <div
      style={{
        fontFamily: 'var(--ds-font-family)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--ds-color-bg)',
      }}
    >
      <Navbar brand="DS Admin" items={NAV_ITEMS} value={nav} onChange={setNav} />

      <div style={{ display: 'flex', flex: 1, alignItems: 'stretch' }}>
        <Sidebar sections={SIDEBAR_SECTIONS} value={menu} onChange={setMenu} />

        <main
          style={{
            flex: 1,
            minWidth: 0,
            background: 'var(--ds-color-bgSubtle)',
            padding: 'var(--ds-spacing-6)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--ds-spacing-5)',
          }}
        >
          <Header
            title="대시보드"
            description="서비스 핵심 지표를 한눈에 확인하세요."
            actions={<Button variant="secondary" size="md" label="보고서 다운로드" />}
          />

          <Statistics items={STATS} columns={3} />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 'var(--ds-spacing-5)',
            }}
          >
            <div style={cardStyle}>
              <DsChart type="line" dataset="revenue" title="Revenue" />
            </div>
            <div style={cardStyle}>
              <DsChart type="doughnut" dataset="share" title="Share" />
            </div>
          </div>

          <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 'var(--ds-spacing-4)' }}>
            <h2
              style={{
                margin: 0,
                fontSize: 'var(--ds-font-size-md)',
                fontWeight: 'var(--ds-font-weight-bold)' as CSSProperties['fontWeight'],
                color: 'var(--ds-color-text)',
              }}
            >
              최근 가입 사용자
            </h2>
            <UserTable columns={COLUMNS} rows={RECENT_USERS} rowKey={(row) => row.id} />
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Pagination page={page} totalPages={5} onChange={setPage} />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
