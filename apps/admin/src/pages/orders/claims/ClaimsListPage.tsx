// ClaimsListPage — 클레임(취소·교환·반품) 목록 (라우트: /orders/claims)
//
// 클레임은 감사 성격이라 삭제·일괄작업이 없다(고객이 접수하고 관리자는 처리만 한다). 그래서 삭제-CRUD
// 용 CrudListShell 이 아니라 **읽기 전용 껍데기 CrudReadListShell** 을 쓴다 — 선택 체크박스도 액션 열도
// 없고, 행을 누르면 상세(처리)로 간다.
//
// 조회 상태(유형·상태·검색어)의 단일 원천은 URL 이다(IA-13) — 필터를 건 목록 링크를 공유할 수 있고,
// 상세에서 Back 하면 그 조건이 그대로 복원된다. 검색 입력은 IME 조합을 존중한다(COMP-10).
//
// [환불 열이 왜 있나] 클레임 완료와 환불 완료는 다른 사건이다(./refund 머리말). 상태 열만 있으면
// '완료' 로 보이는 건들 중 어느 것이 아직 돈을 안 보냈는지 목록에서 가려낼 수 없어, 운영자는 건마다
// 상세를 열어 확인하게 된다.
import { useMemo, type CSSProperties, type ReactNode } from 'react';

import { SearchField, SelectField, StatusBadge } from '../../../shared/ui';
import {
  CrudReadListShell,
  DetailCellLink,
  parseFilter,
  useCrudListQuery,
  useListState,
  type CrudColumn,
  type RowTarget,
} from '../../../shared/crud';
import { claimAdapter } from './data-source';
import {
  filterByStatus,
  kindLabel,
  KIND_OPTIONS,
  kindTone,
  optionLabel,
  searchClaims,
  STATUS_FILTER_ALL,
  STATUS_FILTER_OPTIONS,
  statusMeta,
} from './types';
import type { Claim, ClaimKind, StatusFilter } from './types';
import { refundCellMeta } from './refund';
import { cssVar } from '@tds/ui';

const RESOURCE = 'claims';
const LIST_PATH = '/orders/claims';
const ENTITY_LABEL = '클레임';

const KIND_FILTER_ALL = 'all';
type KindFilter = typeof KIND_FILTER_ALL | ClaimKind;
const KIND_FILTER_VALUES: readonly KindFilter[] = [
  KIND_FILTER_ALL,
  ...KIND_OPTIONS.map((option) => option.id),
];
const STATUS_FILTER_VALUES: readonly StatusFilter[] = STATUS_FILTER_OPTIONS.map(
  (option) => option.id,
);

/** URL 파라미터 기본값 — 기본값과 같은 값은 URL 에서 지워진다(공유 링크가 짧아진다) */
const FILTER_DEFAULTS = { kind: KIND_FILTER_ALL, status: STATUS_FILTER_ALL } as const;

/* 행 클릭 목적지 — 상세로 간다. 읽기 전용 껍데기가 이걸 read 로 게이팅해 조회 전용 역할도 갈 수 있다. */
const ROW_TARGET: RowTarget<Claim> = {
  kind: 'detail',
  href: (item) => `${LIST_PATH}/${item.id}`,
};

/* 열 정의 — 표 마크업이 아니라 데이터다. 순번 열은 DS Table 이 자동으로 붙이므로 여기 없다.
   주문번호는 DetailCellLink 로 감싼다 — DS Table 의 행 클릭은 마우스 전용이라(계약) 키보드
   사용자는 이 링크로 상세에 닿는다. 마우스 행 클릭과 충돌하지 않는다(가드가 <a> 를 제외한다). */
const COLUMNS: readonly CrudColumn<Claim>[] = [
  {
    header: '주문번호',
    nowrap: true,
    render: (item) => (
      <DetailCellLink to={`${LIST_PATH}/${item.id}`} ariaLabel={`${item.orderId} 클레임 상세`}>
        {item.orderId}
      </DetailCellLink>
    ),
  },
  {
    header: '유형',
    render: (item) => <StatusBadge tone={kindTone(item.kind)} label={kindLabel(item.kind)} />,
  },
  { header: '상품', render: (item) => item.productName },
  { header: '옵션', render: (item) => optionLabel(item.optionValues) },
  { header: '신청자', render: (item) => item.customer },
  { header: '사유', render: (item) => item.reason },
  { header: '접수일', nowrap: true, render: (item) => item.requestedAt },
  {
    header: '상태',
    render: (item) => {
      const meta = statusMeta(item.status);
      return <StatusBadge tone={meta.tone} label={meta.label} />;
    },
  },
  {
    header: '환불',
    render: (item) => {
      const meta = refundCellMeta(item);
      return <StatusBadge tone={meta.tone} label={meta.label} />;
    },
  },
];

const toolbarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: cssVar('space.2'),
  flexWrap: 'wrap',
};

const selectWrapStyle: CSSProperties = {
  width: `calc(${cssVar('space.6')} * 5)`,
};

export default function ClaimsListPage() {
  const list = useListState({ filterDefaults: FILTER_DEFAULTS });
  const kind = parseFilter(
    list.filters['kind'] ?? KIND_FILTER_ALL,
    KIND_FILTER_VALUES,
    KIND_FILTER_ALL,
  );
  const status = parseFilter(
    list.filters['status'] ?? STATUS_FILTER_ALL,
    STATUS_FILTER_VALUES,
    STATUS_FILTER_ALL,
  );

  const { data, isFetching, error, refetch } = useCrudListQuery(RESOURCE, claimAdapter);
  // [STATE-01] skeleton 은 최초 로드에서만 — refetch 중에는 이전 행을 유지한다.
  const firstLoading = isFetching && data === undefined;

  const visible = useMemo(() => {
    const items = data ?? [];
    const byKind = kind === KIND_FILTER_ALL ? items : items.filter((item) => item.kind === kind);
    return searchClaims(filterByStatus(byKind, status), list.keyword);
  }, [data, kind, status, list.keyword]);

  const toolbar: ReactNode = (
    <div style={toolbarStyle}>
      <SearchField
        value={list.searchInput}
        onChange={list.setSearchInput}
        label="주문번호·상품·신청자 검색"
        placeholder="주문번호 · 상품 · 신청자 검색"
        {...list.searchInputProps}
      />
      <span style={selectWrapStyle}>
        <SelectField
          value={kind}
          onChange={(event) => list.setFilter('kind', event.target.value)}
          aria-label="유형으로 거르기"
        >
          <option value={KIND_FILTER_ALL}>전체 유형</option>
          {KIND_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </SelectField>
      </span>
      <span style={selectWrapStyle}>
        <SelectField
          value={status}
          onChange={(event) => list.setFilter('status', event.target.value)}
          aria-label="상태로 거르기"
        >
          {STATUS_FILTER_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
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
      columns={COLUMNS}
      nameOf={(item) => item.orderId}
      rowTarget={ROW_TARGET}
      toolbar={toolbar}
      empty={{
        // [STATE-05] '없다'는 세 가지다 — 아직 없는 것, 검색이 안 맞는 것, 필터가 가린 것.
        createVerb: '접수',
        hasQuery: list.hasQuery,
        hasActiveFilters: list.hasActiveFilters,
        onClearSearch: list.clearSearch,
        onResetFilters: list.resetFilters,
      }}
    />
  );
}
