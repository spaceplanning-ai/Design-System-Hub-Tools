/**
 * Design System/Templates/Company/Certificates — 인증서/특허 목록 화면 (조립 전용 · 게이트 G5).
 *
 * 카테고리는 영문 메뉴명이다: `/company/certificates` → 메뉴 en = "Company"(기업 관리),
 * 화면 en = "Certificates" (packages/ui/pages/_data/pages.ts 의 인벤토리 — Company 그룹의
 * `['/company/certificates', '인증서/특허', 'Certificates']`).
 *
 * 대응 실화면: apps/admin/src/pages/company/certificates/CertificatesListPage.tsx
 * (라우트 /company/certificates). 인증서/특허는 **이미지를 가진 삭제 가능 CRUD 목록**이라
 * 목록 첫 열에 증빙 이미지 썸네일이 서고, 구분(인증서/특허) 필터 하나만 갖는다 — 검색이 없다.
 * 등록/수정은 모달이 아니라 별도 라우트(/new · /:id/edit)이며, 실화면은 shared/crud 의
 * CrudListShell → CrudTable → DS Table 로 조립된다.
 *
 * [조립 원칙] `../../src` public DS 컴포넌트만 조합한다 — 이 폴더에서 신규 DS 컴포넌트를 만들지 않고
 * apps/admin 을 import 하지 않는다(레이어 경계). 앱 전용 조각은 DS 표면으로 갈음한다:
 *   CrudListShell/CrudTable → DS Table(+ SelectAllHeaderCell·RowSelectCell·SeqHeaderCell·SeqCell·RowActions)
 *
 * 실화면 ↔ DS 컴포넌트 매핑:
 *   구분(인증서/특허) 필터      → SelectField (실화면 parseFilter + CERT_KIND_OPTIONS)
 *   등록 CTA                   → Button(primary) + Icon(plus-circle)
 *   전체선택 헤더 / 행 선택칸    → SelectAllHeaderCell · RowSelectCell (+ tableSelectionState)
 *   순번 열                    → SeqHeaderCell · SeqCell
 *   증빙 이미지 썸네일          → ImageThumb
 *   구분 배지                  → StatusBadge (certKindTone 미러 — 인증서=info · 특허=success)
 *   행 액션(수정·삭제)          → RowActions (연필 → 수정 라우트, 휴지통 → 삭제 확인)
 *   선택 일괄 삭제 바           → SelectionBar + Button(danger)
 *   삭제 확인                  → ConfirmDialog(intent=delete)
 *   목록 표                    → Table (leadingHead=선택+순번 / trailingHead=행 액션)
 *   빈 결과                    → Empty (필터 초기화 복구)
 *
 * [페이지네이션 없음] 실화면 CrudListShell 은 Pagination 을 그리지 않는다 — 필터를 적용한
 * visibleItems 를 한 번에 보여 준다. 충실히 미러하여 여기에도 페이지네이션을 두지 않는다.
 *
 * 하드코딩 색상(hex)/px 리터럴 0건 — 시각 값은 토큰 CSS 변수(cssVar/typography)와 rem·calc 만 참조한다.
 * 썸네일은 인라인 SVG data: URI 로만 채운다(외부 자산 의존 0).
 */
import type { Meta, StoryObj } from '@storybook/react';
import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';

import {
  Button,
  ConfirmDialog,
  Empty as EmptyState,
  Icon,
  ImageThumb,
  RowActions,
  RowSelectCell,
  SelectAllHeaderCell,
  SelectField,
  SelectionBar,
  SeqCell,
  SeqHeaderCell,
  StatusBadge,
  Table,
  cssVar,
  tableSelectionState,
  typography,
} from '../../src';
import type { StatusBadgeTone, TableProps } from '../../src';

const meta: Meta = {
  title: 'Design System/Templates/Company/Certificates',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

/* ── 데모 데이터(실화면 certificates/types.ts 의 CertItem 미러) ────────────────────────────────── */

type CertKind = 'certificate' | 'patent';

interface DemoCert {
  readonly id: string;
  readonly name: string;
  /** 발급기관 */
  readonly issuer: string;
  /** 발급일 'YYYY-MM-DD' */
  readonly issuedOn: string;
  readonly kind: CertKind;
  readonly imageUrl: string;
}

/** 인라인 SVG 썸네일 — 외부 자산 없이 data: URI 로만 이미지를 흉내낸다 */
const svgDataUri = (label: string, hue: string): string =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120" viewBox="0 0 160 120"><rect width="160" height="120" fill="${hue}"/><text x="80" y="66" font-family="sans-serif" font-size="16" fill="white" text-anchor="middle">${label}</text></svg>`,
  )}`;

const CERT_IMAGE = svgDataUri('인증서', 'steelblue');
const PATENT_IMAGE = svgDataUri('특허', 'seagreen');

/** 구분 라벨·톤 — 실화면 certKindLabel · certKindTone 미러(키 접근 안전) */
const KIND_META: Record<CertKind, { readonly label: string; readonly tone: StatusBadgeTone }> = {
  certificate: { label: '인증서', tone: 'info' },
  patent: { label: '특허', tone: 'success' },
};

const KIND_OPTIONS: readonly CertKind[] = ['certificate', 'patent'];

const FILTER_ALL = 'all';
type CertFilter = typeof FILTER_ALL | CertKind;

/** 발급일 내림차순(최근이 위) — 실화면 sortCertificates 가 이미 정렬해 내려준 순서 */
const DEMO_CERTS: readonly DemoCert[] = [
  {
    id: 'cert-1',
    name: 'ISO 9001 품질경영시스템 인증',
    issuer: '예시인증원',
    issuedOn: '2023-04-12',
    kind: 'certificate',
    imageUrl: CERT_IMAGE,
  },
  {
    id: 'cert-2',
    name: '공간 배치 최적화 방법 특허',
    issuer: '특허청(예시)',
    issuedOn: '2022-09-01',
    kind: 'patent',
    imageUrl: PATENT_IMAGE,
  },
  {
    id: 'cert-3',
    name: '기업부설연구소 인정서',
    issuer: '예시산업진흥원',
    issuedOn: '2021-06-20',
    kind: 'certificate',
    imageUrl: CERT_IMAGE,
  },
  {
    id: 'cert-4',
    name: '모듈형 파티션 결합 구조 특허',
    issuer: '특허청(예시)',
    issuedOn: '2021-02-08',
    kind: 'patent',
    imageUrl: PATENT_IMAGE,
  },
  {
    id: 'cert-5',
    name: '가족친화 인증',
    issuer: '예시가족진흥원',
    issuedOn: '2020-11-30',
    kind: 'certificate',
    imageUrl: CERT_IMAGE,
  },
];

const ENTITY_LABEL = '인증서/특허';
const SELECT_ALL_LABEL_ID = 'cert-select-all';

/** ko-KR 자릿수 구분 — 실화면 shared/format.formatNumber 규약(@tds/ui 경계로 직접 구현) */
const fmt = (value: number): string => value.toLocaleString('ko-KR');

/* ── 표 열 정의(데이터 열 5개 — 선택·순번은 leading, 액션은 trailing 으로 별도) ────────────────── */

const COLUMNS: TableProps['columns'] = [
  { id: 'image', header: '이미지', nowrap: true },
  { id: 'name', header: '명칭' },
  { id: 'issuer', header: '발급기관', nowrap: true },
  { id: 'issuedOn', header: '발급일', nowrap: true },
  { id: 'kind', header: '구분', nowrap: true },
];

/* ── 스타일(토큰·rem·calc 만) ─────────────────────────────────────────────────────────────── */

const pageStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: cssVar('space.5'),
  padding: cssVar('space.6'),
  minBlockSize: '100vh',
  background: cssVar('color.surface.default'),
  color: cssVar('color.text.default'),
};

const headingStyle: CSSProperties = {
  ...typography('typography.title.lg'),
  margin: 0,
};

const toolbarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: cssVar('space.3'),
  flexWrap: 'wrap',
};

const filterStyle: CSSProperties = {
  width: `calc(${cssVar('space.6')} * 6)`,
};

const summaryStyle: CSSProperties = {
  ...typography('typography.label.sm'),
  color: cssVar('color.text.muted'),
  margin: 0,
};

const nameCellStyle: CSSProperties = {
  fontWeight: cssVar('primitive.typography.font-weight.medium'),
};

/** 시각적으로만 숨김(접근성 트리에는 남긴다) — px 없이 rem·무단위 0 만 사용 */
const visuallyHidden: CSSProperties = {
  position: 'absolute',
  width: '0.0625rem',
  height: '0.0625rem',
  padding: 0,
  margin: '-0.0625rem',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

/* ── 제어형 화면(rules-of-hooks: Decorator 화살표가 아니라 Capitalized 컴포넌트에서 useState) ── */

interface CertificatesScreenProps {
  /** 최초 로드 스켈레톤 — Table loading(STATE-01) */
  readonly loading?: boolean;
  /** 구분 필터 초기값 — 항목 0건인 구분으로 Empty(필터 결과 없음)를 만든다 */
  readonly initialFilter?: CertFilter;
  /** 선택 초기값 — Selection 상태에서 몇 행을 미리 고른다 */
  readonly initialSelectedIds?: readonly string[];
  /** 시드 — Empty(진짜 비어있음) 상태에서 빈 배열을 넣는다 */
  readonly items?: readonly DemoCert[];
}

function CertificatesScreen({
  loading = false,
  initialFilter = FILTER_ALL,
  initialSelectedIds = [],
  items = DEMO_CERTS,
}: CertificatesScreenProps) {
  const [certs, setCerts] = useState<readonly DemoCert[]>(items);
  const [filter, setFilter] = useState<CertFilter>(initialFilter);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    () => new Set(initialSelectedIds),
  );
  const [confirming, setConfirming] = useState<DemoCert | null>(null);

  const visible = useMemo(
    () => (filter === FILTER_ALL ? certs : certs.filter((cert) => cert.kind === filter)),
    [certs, filter],
  );

  const selection = tableSelectionState(visible, selectedIds);
  const selectedCount = selectedIds.size;

  const toggleOne = (id: string, checked: boolean): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleAll = (checked: boolean): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const cert of visible) {
        if (checked) next.add(cert.id);
        else next.delete(cert.id);
      }
      return next;
    });
  };

  // 필터가 바뀌면 보이지 않는 행의 선택이 남지 않게 비운다(실화면 useEffect(clear) 미러)
  const changeFilter = (value: CertFilter): void => {
    setFilter(value);
    setSelectedIds(new Set());
  };

  const removeCert = (id: string): void => {
    setCerts((prev) => prev.filter((cert) => cert.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const rows: TableProps['rows'] = visible.map((cert, index) => ({
    id: cert.id,
    // 선택 열이 있는 표라 selected 를 항상 실어 보낸다(실화면 CrudTable 미러)
    selected: selectedIds.has(cert.id),
    onActivate: () => {
      /* 실화면: 행 클릭 → 수정 화면(/company/certificates/:id/edit) */
    },
    leading: [
      <RowSelectCell
        key="select"
        id={cert.id}
        label={`${cert.name} 선택`}
        checked={selectedIds.has(cert.id)}
        onToggle={(checked) => toggleOne(cert.id, checked)}
      />,
      <SeqCell key="seq" seq={index + 1} />,
    ],
    /* 셀은 DS Table 이 각자 keyed <td> 로 감싸지만, 배열 리터럴 안의 JSX 는 react/jsx-key 가
       키를 요구한다 — 열 id 로 키를 준다(위치 고정이라 안정적이다). */
    cells: [
      <ImageThumb key="image" src={cert.imageUrl} alt={`${cert.name} 이미지`} />,
      <span key="name" style={nameCellStyle}>
        {cert.name}
      </span>,
      cert.issuer,
      cert.issuedOn,
      <StatusBadge
        key="kind"
        tone={KIND_META[cert.kind].tone}
        label={KIND_META[cert.kind].label}
      />,
    ],
    trailing: [
      <td key="actions" className="tds-table__cell tds-table__cell--end">
        <RowActions
          label={cert.name}
          onEdit={() => {
            /* 실화면: 연필 → 수정 화면으로 이동 */
          }}
          onDelete={() => setConfirming(cert)}
        />
      </td>,
    ],
  }));

  return (
    <div style={pageStyle}>
      <h1 style={headingStyle}>인증서/특허</h1>

      {/* 툴바 — 구분 필터(좌) + 등록 CTA(우). 이 화면에는 검색이 없다 */}
      <div style={toolbarStyle}>
        <span style={filterStyle}>
          <SelectField
            value={filter}
            aria-label="구분 필터"
            onChange={(event) => {
              const raw = event.target.value;
              changeFilter(
                KIND_OPTIONS.find((kind) => kind === raw) === undefined
                  ? FILTER_ALL
                  : (raw as CertKind),
              );
            }}
          >
            <option value={FILTER_ALL}>전체</option>
            {KIND_OPTIONS.map((kind) => (
              <option key={kind} value={kind}>
                {KIND_META[kind].label}
              </option>
            ))}
          </SelectField>
        </span>
        <Button variant="primary" size="md" iconLeft={<Icon name="plus-circle" />}>
          인증서/특허 등록
        </Button>
      </div>

      <p style={summaryStyle}>
        {loading ? '불러오는 중…' : `전체 ${fmt(visible.length)}건`}
        {selectedCount > 0 ? ` · ${fmt(selectedCount)}건 선택됨` : ''}
      </p>

      {/* 선택 일괄 삭제 — 1건 이상 선택 시에만(count 0 이면 SelectionBar 가 스스로 렌더 안 함) */}
      <SelectionBar count={selectedCount} onClear={() => setSelectedIds(new Set())}>
        <Button
          variant="danger"
          onClick={() => {
            for (const id of selectedIds) removeCert(id);
          }}
        >
          {`선택 ${fmt(selectedCount)}건 삭제`}
        </Button>
      </SelectionBar>

      <Table
        caption="인증서/특허 목록 — 행을 누르면 수정 화면으로 이동합니다. 체크박스·수정·삭제 버튼은 각자의 동작을 수행합니다."
        columns={COLUMNS}
        rows={rows}
        leadingHead={[
          <SelectAllHeaderCell
            key="select-all"
            label="이 페이지의 인증서/특허 전체 선택"
            labelId={SELECT_ALL_LABEL_ID}
            selection={selection}
            onToggleAll={toggleAll}
          />,
          <SeqHeaderCell key="seq" />,
        ]}
        trailingHead={[
          <th key="actions-head" scope="col" className="tds-table__head tds-table__head--end">
            <span style={visuallyHidden}>행 액션</span>
          </th>,
        ]}
        loading={loading}
        skeletonRows={5}
        empty={
          <EmptyState
            label={ENTITY_LABEL}
            hasActiveFilters={filter !== FILTER_ALL}
            onResetFilters={() => changeFilter(FILTER_ALL)}
          />
        }
      />

      {confirming !== null && (
        <ConfirmDialog
          intent="delete"
          title="인증서/특허 삭제"
          message={`'${confirming.name}'을(를) 삭제합니다. 이 작업은 되돌릴 수 없습니다.`}
          confirmLabel="삭제"
          onConfirm={() => {
            removeCert(confirming.id);
            setConfirming(null);
          }}
          onCancel={() => setConfirming(null)}
        />
      )}
    </div>
  );
}

/** 정상: 인증서·특허가 섞여 채워진 기본 상태(선택 없음) */
export const Default: Story = {
  render: () => <CertificatesScreen />,
};

/** 최초 로드: 표 스켈레톤(Table loading) — 재조회가 아니라 첫 로드에서만 켠다(STATE-01) */
export const Loading: Story = {
  render: () => <CertificatesScreen loading />,
};

/** 빈 결과: 아직 한 건도 등록하지 않은 상태 — Empty(등록 안내, 필터·검색 없음) */
export const Empty: Story = {
  render: () => <CertificatesScreen items={[]} />,
};

/** 걸러짐: 구분을 '특허'로 좁힌 상태 — 배지 톤이 success 로 통일된다 */
export const Filtered: Story = {
  render: () => <CertificatesScreen initialFilter="patent" />,
};

/** 선택됨: 여러 행 선택 → SelectionBar(일괄 삭제) 노출 + 선택 행 강조 */
export const Selection: Story = {
  render: () => <CertificatesScreen initialSelectedIds={['cert-2', 'cert-3']} />,
};
