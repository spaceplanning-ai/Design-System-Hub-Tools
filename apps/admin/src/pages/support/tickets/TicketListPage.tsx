// TicketListPage — 1:1 문의 목록 (라우트: /support/tickets)
//
// 문의는 고객 채널이 만들고 관리자는 처리·답변만 한다 → 읽기 전용 트리아지 표(삭제·일괄 없음).
// 그래서 읽기 전용 껍데기 CrudReadListShell 을 쓴다: 상태·우선순위·채널·유형 필터 + 검색, 행 → 상세.
// SLA 임박/초과 배지로 마감시계를 시각화한다. 표 골격은 그 껍데기가 공유하는 DS Table 이 소유한다
// (예전에는 이 파일이 <table> 을 손으로 그렸다).
//
// [조회 상태의 소유자] 상태·우선순위·채널·유형·검색어는 useListState 가 **URL 쿼리스트링**으로 소유한다
// (IA-13). 이 화면이 그 손실이 가장 큰 곳이다 — 트리아지는 '미답변 + 긴급' 처럼 축 네 개를 조합해
// 세팅한 뒤 문의를 하나씩 열고 닫는 반복 작업이라, 그 큐가 URL 로 남아야 Back·F5 를 견디고 공유된다.
// 검색은 IME 안전이다 (COMP-10).
import { useMemo, type CSSProperties, type ReactNode } from 'react';

import { formatDateTime } from '../../../shared/format';
import { SearchField, SelectField, StatusBadge } from '../../../shared/ui';
import {
  CrudReadListShell,
  parseFilter,
  useCrudListQuery,
  useListState,
  type CrudColumn,
  type RowTarget,
} from '../../../shared/crud';
import { ticketAdapter, TICKET_RESOURCE } from './data-source';
import { listActiveCategories } from '../_shared/store';
import {
  filterTickets,
  searchTickets,
  slaStateLabel,
  slaTone,
  TICKET_CHANNEL_OPTIONS,
  TICKET_FILTER_ALL,
  TICKET_PRIORITY_OPTIONS,
  TICKET_STATUS_OPTIONS,
  ticketChannelLabel,
  ticketPriorityLabel,
  ticketPriorityTone,
  ticketSlaState,
  ticketStatusLabel,
  ticketStatusTone,
} from '../_shared/domain';
import type {
  Ticket,
  TicketChannelFilter,
  TicketPriorityFilter,
  TicketStatusFilter,
} from '../_shared/domain';
import { cssVar } from '@tds/ui';

const LIST_PATH = '/support/tickets';
const ENTITY_LABEL = '1:1 문의';

/** 손으로 고친 ?status=거짓말 이 조회를 깨지 않게 한다 — 각 select 가 그리는 옵션 전체가 허용 목록이다 */
const TICKET_STATUS_FILTER_VALUES: readonly TicketStatusFilter[] = [
  TICKET_FILTER_ALL,
  ...TICKET_STATUS_OPTIONS.map((option) => option.id),
];
const TICKET_PRIORITY_FILTER_VALUES: readonly TicketPriorityFilter[] = [
  TICKET_FILTER_ALL,
  ...TICKET_PRIORITY_OPTIONS.map((option) => option.id),
];
const TICKET_CHANNEL_FILTER_VALUES: readonly TicketChannelFilter[] = [
  TICKET_FILTER_ALL,
  ...TICKET_CHANNEL_OPTIONS.map((option) => option.id),
];

/** URL 파라미터 기본값 — 기본값과 같은 값은 URL 에서 지운다(공유 링크를 짧게 · IA-13) */
const FILTER_DEFAULTS = {
  status: TICKET_FILTER_ALL,
  priority: TICKET_FILTER_ALL,
  channel: TICKET_FILTER_ALL,
  category: TICKET_FILTER_ALL,
} as const;

/* 행 클릭 목적지 — 상세로 간다. read 로 게이팅되므로 조회 전용 역할도 갈 수 있다. */
const ROW_TARGET: RowTarget<Ticket> = {
  kind: 'detail',
  href: (item) => `${LIST_PATH}/${item.id}`,
};

const toolbarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: cssVar('space.2'),
  flexWrap: 'wrap',
};

const selectWrapStyle: CSSProperties = { width: `calc(${cssVar('space.6')} * 3.5)` };

export default function TicketListPage() {
  // 상태·우선순위·채널·유형·검색어의 단일 원천 = URL (IA-13). 검색은 IME 안전 (COMP-10).
  const list = useListState({ filterDefaults: FILTER_DEFAULTS });
  const status: TicketStatusFilter = parseFilter(
    list.filters['status'] ?? TICKET_FILTER_ALL,
    TICKET_STATUS_FILTER_VALUES,
    TICKET_FILTER_ALL,
  );
  const priority: TicketPriorityFilter = parseFilter(
    list.filters['priority'] ?? TICKET_FILTER_ALL,
    TICKET_PRIORITY_FILTER_VALUES,
    TICKET_FILTER_ALL,
  );
  const channel: TicketChannelFilter = parseFilter(
    list.filters['channel'] ?? TICKET_FILTER_ALL,
    TICKET_CHANNEL_FILTER_VALUES,
    TICKET_FILTER_ALL,
  );
  // 유형은 운영자가 만드는 카테고리라 닫힌 유니온이 없다 — 모르는 id 는 filterTickets 가
  // '일치하는 문의 없음' 으로 흘려보낸다(빈 목록일 뿐, 조회가 깨지지 않는다).
  const categoryId = list.filters['category'] ?? TICKET_FILTER_ALL;
  const { keyword } = list;

  const categories = useMemo(() => listActiveCategories(), []);

  const { data, isFetching, error, refetch } = useCrudListQuery(TICKET_RESOURCE, ticketAdapter);
  // [STATE-01] skeleton 은 최초 로드에서만 — refetch 중에는 이전 행을 유지한다.
  const firstLoading = isFetching && data === undefined;

  const visible = useMemo(
    () => searchTickets(filterTickets(data ?? [], status, channel, priority, categoryId), keyword),
    [data, status, channel, priority, categoryId, keyword],
  );

  // SLA 는 현재 시각 기준 파생값 — 마운트 시 한 번 고정해 행마다 일관되게 쓴다.
  // 열 정의가 이 now 를 닫으므로 COLUMNS 도 컴포넌트 안에서 만든다(모듈 상수로 뺄 수 없다).
  const now = useMemo(() => new Date(), []);
  const columns = useMemo<readonly CrudColumn<Ticket>[]>(
    () => [
      {
        header: '상태',
        render: (t) => (
          <StatusBadge tone={ticketStatusTone(t.status)} label={ticketStatusLabel(t.status)} />
        ),
      },
      {
        header: '우선순위',
        render: (t) => (
          <StatusBadge
            tone={ticketPriorityTone(t.priority)}
            label={ticketPriorityLabel(t.priority)}
          />
        ),
      },
      { header: '유형', render: (t) => t.categoryLabel },
      { header: '채널', render: (t) => ticketChannelLabel(t.channel) },
      { header: '제목', render: (t) => t.title },
      { header: '고객', render: (t) => t.customerName },
      { header: '담당', render: (t) => (t.assignee === '' ? '미배정' : t.assignee) },
      {
        header: 'SLA',
        render: (t) => {
          const sla = ticketSlaState(t, now);
          return <StatusBadge tone={slaTone(sla)} label={slaStateLabel(sla)} />;
        },
      },
      { header: '접수일시', nowrap: true, render: (t) => formatDateTime(t.receivedAt) },
    ],
    [now],
  );

  const toolbar: ReactNode = (
    <div style={toolbarStyle}>
      <SearchField
        value={list.searchInput}
        onChange={list.setSearchInput}
        label="제목·문의번호·고객 검색"
        placeholder="제목 · 문의번호 · 고객 검색"
        {...list.searchInputProps}
      />
      <span style={selectWrapStyle}>
        <SelectField
          value={status}
          onChange={(event) => list.setFilter('status', event.target.value)}
          aria-label="상태로 거르기"
        >
          <option value={TICKET_FILTER_ALL}>전체 상태</option>
          {TICKET_STATUS_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </SelectField>
      </span>
      <span style={selectWrapStyle}>
        <SelectField
          value={priority}
          onChange={(event) => list.setFilter('priority', event.target.value)}
          aria-label="우선순위로 거르기"
        >
          <option value={TICKET_FILTER_ALL}>전체 우선순위</option>
          {TICKET_PRIORITY_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </SelectField>
      </span>
      <span style={selectWrapStyle}>
        <SelectField
          value={channel}
          onChange={(event) => list.setFilter('channel', event.target.value)}
          aria-label="채널로 거르기"
        >
          <option value={TICKET_FILTER_ALL}>전체 채널</option>
          {TICKET_CHANNEL_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </SelectField>
      </span>
      <span style={selectWrapStyle}>
        <SelectField
          value={categoryId}
          onChange={(event) => list.setFilter('category', event.target.value)}
          aria-label="유형으로 거르기"
        >
          <option value={TICKET_FILTER_ALL}>전체 유형</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </SelectField>
      </span>
    </div>
  );

  return (
    <CrudReadListShell
      entityLabel={ENTITY_LABEL}
      state={{
        firstLoading,
        refreshing: isFetching && !firstLoading,
        error,
        refetch: () => void refetch(),
      }}
      visibleItems={visible}
      columns={columns}
      nameOf={(item) => item.title}
      rowTarget={ROW_TARGET}
      toolbar={toolbar}
      empty={{
        createVerb: '접수',
        hasQuery: list.hasQuery,
        hasActiveFilters: list.hasActiveFilters,
        onClearSearch: list.clearSearch,
        onResetFilters: list.resetFilters,
      }}
    />
  );
}
