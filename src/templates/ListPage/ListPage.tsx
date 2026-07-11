import { Fragment, useState } from 'react'
import type { CSSProperties } from 'react'
import { Badge } from '../../ds/Badge/Badge'
import { Button } from '../../ds/Button/Button'
import { Drawer } from '../../ds/Drawer/Drawer'
import { Header } from '../../ds/Header/Header'
import { Pagination } from '../../ds/Pagination/Pagination'
import { SearchField } from '../../ds/SearchField/SearchField'
import { Select } from '../../ds/Select/Select'
import { Table, type TableColumn } from '../../ds/Table/Table'

type User = {
  id: string
  name: string
  email: string
  role: string
  status: '활성' | '휴면'
  joinedAt: string
}

// 제네릭 고정 — 타입 추론용
const UserTable = Table<User>

const USERS: User[] = [
  { id: 'u1', name: '김서연', email: 'seoyeon.kim@example.com', role: '디자이너', status: '활성', joinedAt: '2024-03-15' },
  { id: 'u2', name: '이준호', email: 'junho.lee@example.com', role: '개발자', status: '활성', joinedAt: '2023-11-02' },
  { id: 'u3', name: '박지민', email: 'jimin.park@example.com', role: '개발자', status: '휴면', joinedAt: '2024-07-20' },
  { id: 'u4', name: '최수아', email: 'sua.choi@example.com', role: '기획자', status: '활성', joinedAt: '2025-01-10' },
  { id: 'u5', name: '정도윤', email: 'doyun.jung@example.com', role: 'QA', status: '휴면', joinedAt: '2023-05-28' },
  { id: 'u6', name: '한예린', email: 'yerin.han@example.com', role: '디자이너', status: '활성', joinedAt: '2025-04-02' },
  { id: 'u7', name: '오민재', email: 'minjae.oh@example.com', role: '기획자', status: '활성', joinedAt: '2024-10-19' },
  { id: 'u8', name: '서지우', email: 'jiwoo.seo@example.com', role: '개발자', status: '활성', joinedAt: '2026-02-06' },
]

const STATUS_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: '활성', label: '활성' },
  { value: '휴면', label: '휴면' },
]

const ROLE_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: '디자이너', label: '디자이너' },
  { value: '개발자', label: '개발자' },
  { value: '기획자', label: '기획자' },
  { value: 'QA', label: 'QA' },
]

const COLUMNS: TableColumn<User>[] = [
  { key: 'name', header: '이름', sortable: true },
  { key: 'email', header: '이메일' },
  { key: 'role', header: '직군' },
  {
    key: 'status',
    header: '상태',
    align: 'center',
    width: 96,
    render: (row) => (
      <Badge variant={row.status === '활성' ? 'success' : 'secondary'} label={row.status} size="sm" />
    ),
  },
  { key: 'joinedAt', header: '가입일', sortable: true, align: 'right' },
]

const dtStyle: CSSProperties = {
  margin: 0,
  fontSize: 'var(--ds-font-size-sm)',
  color: 'var(--ds-color-secondary)',
}

const ddStyle: CSSProperties = {
  margin: 0,
  fontSize: 'var(--ds-font-size-sm)',
  color: 'var(--ds-color-text)',
}

/** Templates/ListPage — 검색·필터·테이블·상세 Drawer를 조합한 목록 페이지 */
export function ListPage() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<string | null>('all')
  const [role, setRole] = useState<string | null>('all')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<User | null>(null)

  const filtered = USERS.filter(
    (user) =>
      user.name.includes(query.trim()) &&
      (status === 'all' || status == null || user.status === status) &&
      (role === 'all' || role == null || user.role === role),
  )

  const detailRows: [string, string][] = selected
    ? [
        ['이름', selected.name],
        ['이메일', selected.email],
        ['직군', selected.role],
        ['상태', selected.status],
        ['가입일', selected.joinedAt],
      ]
    : []

  return (
    <div
      style={{
        fontFamily: 'var(--ds-font-family)',
        minHeight: '100vh',
        background: 'var(--ds-color-bg)',
        padding: 'var(--ds-spacing-6)',
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--ds-spacing-5)',
        }}
      >
        <Header
          title="사용자 관리"
          description="구성원을 검색하고 상세 정보를 확인하세요."
          actions={<Button variant="primary" size="md" label="사용자 추가" />}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr)',
            gap: 'var(--ds-spacing-3)',
            alignItems: 'start',
          }}
        >
          <SearchField value={query} onChange={setQuery} placeholder="이름으로 검색" />
          <Select value={status} onChange={setStatus} options={STATUS_OPTIONS} placeholder="상태" />
          <Select value={role} onChange={setRole} options={ROLE_OPTIONS} placeholder="직군" />
        </div>

        <UserTable
          columns={COLUMNS}
          rows={filtered}
          rowKey={(row) => row.id}
          emptyText="검색 결과가 없습니다."
          onRowClick={setSelected}
        />

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Pagination page={page} totalPages={3} onChange={setPage} />
        </div>
      </div>

      <Drawer
        open={selected != null}
        onClose={() => setSelected(null)}
        title="사용자 상세"
        side="right"
      >
        {selected != null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ds-spacing-5)' }}>
            <dl
              style={{
                margin: 0,
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                columnGap: 'var(--ds-spacing-4)',
                rowGap: 'var(--ds-spacing-3)',
              }}
            >
              {detailRows.map(([term, detail]) => (
                <Fragment key={term}>
                  <dt style={dtStyle}>{term}</dt>
                  <dd style={ddStyle}>{detail}</dd>
                </Fragment>
              ))}
            </dl>
            <Button variant="secondary" size="md" label="닫기" onClick={() => setSelected(null)} />
          </div>
        )}
      </Drawer>
    </div>
  )
}
