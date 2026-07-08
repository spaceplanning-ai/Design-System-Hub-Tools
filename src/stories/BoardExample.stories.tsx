import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Table } from '../components/organisms';
import type { TableColumn } from '../components/organisms/Table';
import { Tabs, Pagination, SearchInput, DonutChart } from '../components/molecules';
import { Badge, Sparkline } from '../components/atoms';

const meta: Meta = {
  title: 'Examples/게시판 Board',
  parameters: { layout: 'padded' },
};
export default meta;

type Post = {
  id: number;
  category: '공지' | '자유' | '질문';
  title: string;
  author: string;
  date: string;
  views: number;
};

const POSTS: Post[] = [
  {
    id: 42,
    category: '공지',
    title: '7월 정기 점검 안내',
    author: '운영자',
    date: '2026-07-01',
    views: 1284,
  },
  {
    id: 41,
    category: '질문',
    title: 'DatePicker 범위 설정은 어떻게 하나요?',
    author: '김하늘',
    date: '2026-07-03',
    views: 342,
  },
  {
    id: 40,
    category: '자유',
    title: '디자인 시스템 도입 후기 공유합니다',
    author: '이바다',
    date: '2026-07-03',
    views: 918,
  },
  {
    id: 39,
    category: '자유',
    title: '다크 모드 색 대비 팁',
    author: '박서준',
    date: '2026-07-04',
    views: 501,
  },
  {
    id: 38,
    category: '질문',
    title: 'Combobox 비동기 필터 예제 있을까요',
    author: '최유나',
    date: '2026-07-04',
    views: 277,
  },
  {
    id: 37,
    category: '공지',
    title: '커뮤니티 가이드라인 업데이트',
    author: '운영자',
    date: '2026-07-05',
    views: 640,
  },
  {
    id: 36,
    category: '자유',
    title: '차트 컴포넌트 색상 팔레트가 좋네요',
    author: '정민호',
    date: '2026-07-05',
    views: 455,
  },
  {
    id: 35,
    category: '질문',
    title: 'Table 정렬 상태를 서버로 보낼 수 있나요?',
    author: '한소희',
    date: '2026-07-06',
    views: 189,
  },
];

const toneFor = (c: Post['category']) =>
  c === '공지' ? 'danger' : c === '질문' ? 'info' : 'neutral';

const CATS = (['공지', '자유', '질문'] as const).map((name) => ({
  name,
  count: POSTS.filter((p) => p.category === name).length,
}));

const CAT_DATA = CATS.map((c) => ({ label: c.name, value: c.count }));

const columns: TableColumn<Post>[] = [
  { key: 'id', header: '번호', width: 56, align: 'center' },
  {
    key: 'title',
    header: '제목',
    render: (r) => (
      <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
        <Badge size="sm" tone={toneFor(r.category)}>
          {r.category}
        </Badge>
        {r.title}
      </span>
    ),
  },
  { key: 'author', header: '작성자', width: 100, align: 'center' },
  { key: 'date', header: '작성일', width: 108, align: 'center' },
  { key: 'views', header: '조회', width: 80, align: 'end', sortable: true },
];

/** A community board: category tabs + search, a sortable table, and pagination. */
export const Board: StoryObj = {
  render: () => {
    const [tab, setTab] = useState('전체');
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);

    const rows = POSTS.filter(
      (p) => (tab === '전체' || p.category === tab) && p.title.includes(query.trim()),
    );

    return (
      <div
        style={{
          maxWidth: 780,
          border: '1px solid var(--tds-color-border-default)',
          borderRadius: 'var(--tds-radius-lg)',
          overflow: 'hidden',
          background: 'var(--tds-color-bg-surface)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--tds-space-3)',
            padding: 'var(--tds-space-3) var(--tds-space-4)',
            borderBottom: '1px solid var(--tds-color-border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {POSTS.length}건
              </div>
              <div style={{ fontSize: 12, color: 'var(--tds-color-fg-muted)' }}>전체 게시물</div>
            </div>
            <Sparkline
              data={[2, 4, 3, 5, 3, 6, 4]}
              width={112}
              height={34}
              color="1"
              ariaLabel="주간 작성 추이"
            />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATS.map((c) => (
              <Badge
                key={c.name}
                tone={toneFor(c.name)}
                variant={tab === c.name ? 'solid' : 'soft'}
                style={{ cursor: 'pointer' }}
                onClick={() => setTab(c.name)}
              >
                {c.name} {c.count}
              </Badge>
            ))}
          </div>
        </div>

        <div
          style={{
            padding: 'var(--tds-space-4)',
            borderBottom: '1px solid var(--tds-color-border-subtle)',
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--tds-color-fg-muted)',
              marginBottom: 'var(--tds-space-2)',
            }}
          >
            분류별 게시물
          </div>
          <DonutChart
            data={CAT_DATA}
            total={`${POSTS.length}`}
            withTableToggle
            format={(v) => `${v}건`}
            ariaLabel={`분류별 게시물 비율: ${CAT_DATA.map((d) => `${d.label} ${d.value}건`).join(', ')}`}
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 'var(--tds-space-4)',
            padding: 'var(--tds-space-2) var(--tds-space-4)',
            borderBottom: '1px solid var(--tds-color-border-subtle)',
            flexWrap: 'wrap',
          }}
        >
          <Tabs value={tab} onValueChange={setTab} variant="line" size="sm">
            <Tabs.List aria-label="게시판 분류">
              {['전체', '공지', '자유', '질문'].map((c) => (
                <Tabs.Tab key={c} value={c}>
                  {c}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs>
          <div style={{ width: 220 }}>
            <SearchInput value={query} onValueChange={setQuery} placeholder="제목 검색" size="sm" />
          </div>
        </div>

        <Table<Post>
          columns={columns}
          data={rows}
          size="md"
          getRowId={(r) => String(r.id)}
          defaultSortState={{ columnKey: 'views', direction: 'desc' }}
          onRowClick={() => {}}
          emptyState="검색 결과가 없습니다."
        />

        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--tds-space-4)' }}>
          <Pagination page={page} count={5} onPageChange={setPage} size="sm" />
        </div>
      </div>
    );
  },
};
