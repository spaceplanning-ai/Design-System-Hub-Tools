// ReturnsListPage — 교환/반품 요청 목록 (라우트: /products/returns)
//
// 요청은 감사 성격이라 삭제·일괄작업이 없다(고객이 만들고 관리자는 처리만 한다). 그래서 삭제-CRUD 용
// CrudListShell 이 아니라 **읽기 전용 껍데기 CrudReadListShell** 을 쓴다 — 선택 체크박스도 액션 열도
// 없고, 행을 누르면 상세(상태 처리)로 간다. 표 골격·스켈레톤·빈 행·행 활성화 가드는 그 껍데기가
// 공유하는 DS Table 이 소유한다(예전에는 이 파일이 <table> 을 손으로 그렸다).
//
// 조회 상태(유형·상태·검색어)의 단일 원천은 URL 이다(IA-13) — 필터를 건 목록 링크를 공유할 수 있고,
// 상세에서 Back 하면 그 조건이 그대로 복원된다. 검색 입력은 IME 조합을 존중한다(COMP-10).
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
import { returnAdapter } from './data-source';
import {
  filterByStatus,
  kindLabel,
  KIND_OPTIONS,
  kindTone,
  optionLabel,
  searchReturns,
  STATUS_FILTER_ALL,
  STATUS_FILTER_OPTIONS,
  statusMeta,
} from './types';
import type { ReturnRequest, ReturnKind, StatusFilter } from './types';
import { cssVar } from '@tds/ui';

const RESOURCE = 'returns';
const LIST_PATH = '/products/returns';
const ENTITY_LABEL = '교환/반품 요청';

const KIND_FILTER_ALL = 'all';
type KindFilter = typeof KIND_FILTER_ALL | ReturnKind;
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
const ROW_TARGET: RowTarget<ReturnRequest> = {
  kind: 'detail',
  href: (item) => `${LIST_PATH}/${item.id}`,
};

/* 열 정의 — 표 마크업이 아니라 데이터다. 순번 열은 DS Table 이 자동으로 붙이므로 여기 없다.
   접수번호는 DetailCellLink 로 감싼다 — DS Table 의 행 클릭은 마우스 전용이라(계약) 키보드
   사용자는 이 링크로 상세에 닿는다. 마우스 행 클릭과 충돌하지 않는다(가드가 <a> 를 제외한다). */
const COLUMNS: readonly CrudColumn<ReturnRequest>[] = [
  {
    header: '접수번호',
    nowrap: true,
    render: (item) => (
      <DetailCellLink to={`${LIST_PATH}/${item.id}`} ariaLabel={`${item.orderNo} 상세`}>
        {item.orderNo}
      </DetailCellLink>
    ),
  },
  { header: '상품', render: (item) => item.productName },
  { header: '옵션', render: (item) => optionLabel(item.optionValues) },
  { header: '신청자', render: (item) => item.customer },
  {
    header: '유형',
    render: (item) => <StatusBadge tone={kindTone(item.kind)} label={kindLabel(item.kind)} />,
  },
  { header: '사유', render: (item) => item.reason },
  { header: '접수일', nowrap: true, render: (item) => item.requestedAt },
  {
    header: '상태',
    render: (item) => {
      const meta = statusMeta(item.status);
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

export default function ReturnsListPage() {
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

  const { data, isFetching, error, refetch } = useCrudListQuery(RESOURCE, returnAdapter);
  // [STATE-01] skeleton 은 최초 로드에서만 — refetch 중에는 이전 행을 유지한다.
  const firstLoading = isFetching && data === undefined;

  const visible = useMemo(() => {
    const items = data ?? [];
    const byKind = kind === KIND_FILTER_ALL ? items : items.filter((item) => item.kind === kind);
    return searchReturns(filterByStatus(byKind, status), list.keyword);
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
      nameOf={(item) => item.orderNo}
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
