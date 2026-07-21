// ProgramListPage — 펀딩 진행 현황 목록 (라우트: /programs)
//
// [무엇을 보는 화면인가] 후원형 펀딩(텀블벅류)의 **현황판**이다. 운영자가 여기서 확인하는 것은
// '무엇이 지금 얼마나 모였고, 언제 끝나는가' 다 — 그래서 목록의 중심 열은 이름이 아니라
// **모금액/달성률**과 **남은 일수**다. 편집은 곁가지라 행 클릭은 수정 폼이 아니라 **상세**로 간다
// (rowTarget kind: 'detail' — 캡션 문장도 거기서 파생된다).
//
// [좌측 필터 — 상품 목록이 정본] 상태를 툴바의 <select> 에 숨기면 '지금 무엇으로 걸러져 있는지'와
// '각 상태에 몇 건이 있는지'를 볼 수 없다. 상품/회원 화면과 같은 좌측 aside(건수 배지 + aria-pressed)
// 를 쓴다. 건수는 **필터 이전** 전체 집합에서 센다 — 필터가 자기 배지를 흔들면 비교가 불가능해진다.
//
// [조회 상태의 소유자] status·keyword 는 이 화면의 useState 가 아니라 shared/crud 의 useListState 가
// **URL 쿼리스트링**으로 소유한다 (IA-13) — '진행 중' 만 골라 한 건을 열고 Back 하면 그 조건이
// 그대로 살아 있고, 그 URL 을 그대로 공유할 수 있다. 검색은 IME 안전이다 (COMP-10).
import { useEffect, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { cssVar } from '@tds/ui';

import { formatNumber } from '../../shared/format';
import {
  Button,
  FilterPanel,
  FilterRail,
  Icon,
  SearchField,
  StatusBadge,
  hintStyle,
} from '../../shared/ui';
import {
  CrudListShell,
  DetailCellLink,
  parseFilter,
  useCrudList,
  useListState,
} from '../../shared/crud';
import type { CrudColumn } from '../../shared/crud';
import { useRouteWritePermissions } from '../../shared/permissions/RequirePermission';
import { PROGRAM_RESOURCE, programAdapter } from './data-source';
import { daysLeft } from './_shared/store';
import type { Program, ProgramInput } from './_shared/store';
import {
  countProgramsByStatus,
  filterProgramsByStatus,
  fundingSummary,
  fundingTone,
  PROGRAM_STATUS_ALL,
  PROGRAM_STATUS_FILTERS,
  PROGRAM_STATUS_FILTER_VALUES,
  programStatusLabel,
  programStatusTone,
  searchPrograms,
} from './types';
import type { ProgramStatusFilter } from './types';

const ENTITY_LABEL = '프로그램';
const LIST_PATH = '/programs';

/**
 * 남은 일수의 기준일.
 *
 * daysLeft 는 `today` 를 인자로 받는다 — 시계를 밖에서 주입해야 테스트·스토리·스냅샷이 고정되기
 * 때문이다(store.ts 머리말). 화면이 `new Date()` 를 읽으면 픽스처의 '남은 일수'가 실행하는 날마다
 * 달라져 스토리북 회귀 비교가 매일 깨진다. 그래서 여기서도 **고정 기준일**을 쓴다.
 * 백엔드가 붙으면 이 상수는 서버가 내려주는 기준 시각으로 바뀐다.
 */
const TODAY = '2026-07-21';

/** URL 파라미터의 기본값 — 이 값과 같으면 URL 에서 지운다(공유 링크를 짧게) */
const FILTER_DEFAULTS = { status: PROGRAM_STATUS_ALL } as const;

/** 좌: 고정 폭 필터 / 우: 남는 폭 전부 (minmax(0,…) 이라야 표가 그리드를 밀지 않는다 — 상품 화면과 같다) */
const layoutStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: `calc(${cssVar('space.6')} * 9) minmax(0, 1fr)`,
  gap: cssVar('space.6'),
  alignItems: 'start',
};

const toolbarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: cssVar('space.3'),
  flexWrap: 'wrap',
};

const searchWrapStyle: CSSProperties = {
  flexGrow: 1,
  minWidth: 0,
  maxWidth: `calc(${cssVar('space.6')} * 14)`,
};

const titleCellStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: cssVar('space.1'),
};

/** 한 줄 소개는 보조 정보다 — 제목보다 약하게, 그리고 한 줄을 넘기지 않는다 */
const summaryTextStyle: CSSProperties = {
  display: 'block',
  maxWidth: `calc(${cssVar('space.6')} * 12)`,
  color: cssVar('color.text.muted'),
  fontSize: cssVar('typography.caption.md.font-size'),
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const numericTextStyle: CSSProperties = {
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
};

const periodStyle: CSSProperties = {
  color: cssVar('color.text.muted'),
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
};

const nameOf = (item: Program) => item.title;

/**
 * 남은 일수 문구.
 *
 * 끝난 펀딩에 '0일' 을 띄우면 '오늘 마감' 과 구별되지 않는다 — 상태가 이미 결론을 말하고 있으므로
 * 종료된 건은 숫자 대신 '종료' 를, 아직 열지 않은 초안은 셀 대상이 없다는 뜻의 '—' 를 쓴다.
 */
function daysLeftText(program: Program): string {
  if (program.status === 'succeeded' || program.status === 'failed') return '종료';
  if (program.status === 'draft') return '—';
  const left = daysLeft(program.endDate, TODAY);
  return left === 0 ? '오늘 마감' : `${formatNumber(left)}일`;
}

export default function ProgramListPage() {
  const navigate = useNavigate();
  const { canCreate } = useRouteWritePermissions();

  // status·keyword 의 단일 원천 = URL (IA-13). 검색은 IME 안전 (COMP-10).
  const list = useListState({ filterDefaults: FILTER_DEFAULTS });
  // 손으로 고친 ?status=거짓말 이 조회를 깨지 않게 한다 — 모르는 값은 '전체'로 되돌린다
  const status: ProgramStatusFilter = parseFilter(
    list.filters['status'] ?? PROGRAM_STATUS_ALL,
    PROGRAM_STATUS_FILTER_VALUES,
    PROGRAM_STATUS_ALL,
  );
  const { keyword } = list;

  const controller = useCrudList<Program, ProgramInput>({
    resource: PROGRAM_RESOURCE,
    adapter: programAdapter,
    entityLabel: ENTITY_LABEL,
    nameOf,
  });
  const { clear } = controller;

  // 보고 있는 행 집합이 바뀌면 선택은 무의미해진다 — 화면에 없는 행이 선택된 채
  // '선택 3건 삭제' 가 되지 않게 한다 (STATE-04-b)
  useEffect(() => {
    clear();
  }, [status, keyword, clear]);

  // 건수 배지는 **필터 이전** 전체 집합에서 센다. 아직 못 셌으면 null 이다 —
  // 0 과 '모름' 은 다른 사실이라 FilterPanel 이 '—' 를 띄운다.
  const loaded = !controller.firstLoading && controller.error === null;
  const statusCounts = useMemo(
    () => (loaded ? countProgramsByStatus(controller.items) : null),
    [controller.items, loaded],
  );

  const visible = useMemo(
    () => searchPrograms(filterProgramsByStatus(controller.items, status), keyword),
    [controller.items, status, keyword],
  );

  const columns: readonly CrudColumn<Program>[] = [
    {
      header: '프로그램명',
      render: (item) => (
        <span style={titleCellStyle}>
          {/* 행 클릭(마우스)의 **키보드 짝** — 이 링크가 없으면 Tab 으로 상세에 닿을 길이 사라진다
              (DetailCellLink 머리말의 실측 사고). 경로는 rowTarget 과 같은 값을 쓴다. */}
          <DetailCellLink to={`${LIST_PATH}/${item.id}`}>{item.title}</DetailCellLink>
          {item.summary.trim() !== '' && <span style={summaryTextStyle}>{item.summary}</span>}
        </span>
      ),
    },
    { header: '창작자', nowrap: true, render: (item) => item.creator },
    { header: '카테고리', nowrap: true, render: (item) => item.categoryLabel },
    {
      header: '목표금액',
      numeric: true,
      render: (item) => `${formatNumber(item.goalAmount)}원`,
    },
    {
      header: '모금액 · 달성률',
      nowrap: true,
      // 색만으로 달성 여부를 말하지 않는다 — 배지 안에 달성률과 금액이 문구로 함께 실린다
      render: (item) => <StatusBadge tone={fundingTone(item)} label={fundingSummary(item)} />,
    },
    {
      header: '후원자수',
      numeric: true,
      render: (item) => `${formatNumber(item.backerCount)}명`,
    },
    {
      header: '기간',
      nowrap: true,
      render: (item) => <span style={periodStyle}>{`${item.startDate} ~ ${item.endDate}`}</span>,
    },
    {
      header: '남은 일수',
      numeric: true,
      render: (item) => <span style={numericTextStyle}>{daysLeftText(item)}</span>,
    },
    {
      header: '상태',
      nowrap: true,
      render: (item) => (
        <StatusBadge
          tone={programStatusTone(item.status)}
          label={programStatusLabel(item.status)}
        />
      ),
    },
  ];

  // 등록 버튼은 create 권한이 있을 때만 존재한다 — 누를 수 없는 것을 보여 주지 않는다 (EXC-03)
  const createButton = canCreate ? (
    <Button variant="primary" size="md" onClick={() => navigate(`${LIST_PATH}/new`)}>
      <Icon name="plus-circle" />
      프로그램 등록
    </Button>
  ) : null;

  const toolbar = (
    <div style={toolbarStyle}>
      <span style={searchWrapStyle}>
        <SearchField
          value={list.searchInput}
          onChange={list.setSearchInput}
          label="프로그램명·창작자 검색"
          placeholder="프로그램명 · 창작자 검색"
          // 조합 중 커밋 금지 + Enter 차단 — '헤드폰' 을 치는 도중 자모마다 조회가 나가지 않는다 (COMP-10)
          {...list.searchInputProps}
        />
      </span>
      {createButton}
    </div>
  );

  return (
    <div style={layoutStyle}>
      <FilterRail
        notice={
          <p style={hintStyle}>
            성공·실패는 기간이 끝난 뒤 목표 달성 여부로 갈립니다. 진행 중에는 아직 정해지지
            않습니다.
          </p>
        }
      >
        <FilterPanel
          navLabel="프로그램 상태 필터"
          heading="진행 상태"
          options={PROGRAM_STATUS_FILTERS}
          value={status}
          counts={statusCounts}
          onChange={(next) => list.setFilter('status', next)}
        />
      </FilterRail>

      <CrudListShell
        entityLabel={ENTITY_LABEL}
        controller={controller}
        visibleItems={visible}
        columns={columns}
        nameOf={nameOf}
        // 왜 비었는지에 따라 복구 수단이 다르다 — 검색 지우기 / 필터 초기화 / 등록 (STATE-05)
        empty={{
          hasQuery: list.hasQuery,
          hasActiveFilters: list.hasActiveFilters,
          onClearSearch: list.clearSearch,
          onResetFilters: list.resetFilters,
          ...(createButton !== null && { createAction: createButton }),
        }}
        selectAllLabelId="program-select-all"
        toolbar={toolbar}
        onEdit={(item) => navigate(`${LIST_PATH}/${item.id}/edit`)}
        /* 이 화면의 행 클릭은 **현황 상세**로 간다 — 수정 폼은 연필 액션의 몫이다.
           목적지를 이름으로 밝히면 표의 캡션도 '상세 화면으로 이동합니다' 로 따라온다. */
        rowTarget={{ kind: 'detail', href: (item) => `${LIST_PATH}/${item.id}` }}
      />
    </div>
  );
}
