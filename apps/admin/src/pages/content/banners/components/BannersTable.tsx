// 배너 목록 표 (A41 소유)
//
// 수정 연필은 별도 폼 페이지(/content/banners/:id/edit)로 이동한다(RowActions onEdit → 라우팅).
import type { CSSProperties } from 'react';

import { formatNumber } from '../../../../shared/format';
import {
  numericCellStyle,
  RowActions,
  RowSelectCell,
  SelectAllHeaderCell,
  StatusBadge,
  tableSelectionState,
  tableStyle,
  tdStyle,
  thStyle,
  visuallyHiddenStyle,
} from '../../../../shared/ui';
import { enabledLabel, enabledTone, PAGE_SIZE, PLACEMENT_LABEL } from '../types';
import type { Banner } from '../types';

const COLUMNS = ['제목', '위치', '노출 기간', '상태', '정렬 순서'] as const;

/** 체크박스 + 순번 = 앞의 2열, 뒤에 행 액션 1열 */
const LEADING_COLS = 2;
const TOTAL_COLS = COLUMNS.length + LEADING_COLS + 1;
const SELECT_ALL_LABEL_ID = 'banners-select-all-label';

const titleCellStyle: CSSProperties = {
  ...tdStyle,
  fontWeight: 'var(--tds-primitive-typography-font-weight-medium)',
};

const nowrapCellStyle: CSSProperties = {
  ...tdStyle,
  whiteSpace: 'nowrap',
};

const actionCellStyle: CSSProperties = {
  ...tdStyle,
  width: 'calc(var(--tds-space-6) * 2)',
  textAlign: 'right',
};

const emptyCellStyle: CSSProperties = {
  ...tdStyle,
  paddingTop: 'var(--tds-space-6)',
  paddingBottom: 'var(--tds-space-6)',
  color: 'var(--tds-color-text-muted)',
  textAlign: 'center',
};

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: PAGE_SIZE }, (_, index) => (
        <tr key={`skeleton-${String(index)}`}>
          {Array.from({ length: TOTAL_COLS }, (_, cell) => (
            <td key={`cell-${String(cell)}`} style={tdStyle}>
              <span className="tds-ui-skeleton" aria-hidden="true" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

interface BannersTableProps {
  readonly banners: readonly Banner[];
  readonly loading: boolean;
  readonly onEdit: (banner: Banner) => void;
  readonly onDelete: (banner: Banner) => void;
  readonly deletingId: string | null;
  readonly selectedIds: ReadonlySet<string>;
  readonly onToggleOne: (id: string, checked: boolean) => void;
  readonly onToggleAll: (checked: boolean) => void;
  readonly startIndex: number;
}

export function BannersTable({
  banners,
  loading,
  onEdit,
  onDelete,
  deletingId,
  selectedIds,
  onToggleOne,
  onToggleAll,
  startIndex,
}: BannersTableProps) {
  const selection = tableSelectionState(banners, selectedIds);

  return (
    <table style={tableStyle} aria-busy={loading}>
      <caption style={visuallyHiddenStyle}>
        배너 목록 — 체크박스로 선택하고 수정/삭제 버튼으로 각 배너를 관리합니다.
      </caption>

      <thead>
        <tr>
          <SelectAllHeaderCell
            label="이 페이지의 배너 전체 선택"
            labelId={SELECT_ALL_LABEL_ID}
            selection={selection}
            onToggleAll={onToggleAll}
          />
          <th scope="col" style={thStyle}>
            순번
          </th>
          {COLUMNS.map((column) => (
            <th key={column} scope="col" style={thStyle}>
              {column}
            </th>
          ))}
          <th scope="col" style={thStyle}>
            <span style={visuallyHiddenStyle}>행 액션</span>
          </th>
        </tr>
      </thead>

      <tbody>
        {loading ? (
          <SkeletonRows />
        ) : banners.length === 0 ? (
          <tr>
            <td colSpan={TOTAL_COLS} style={emptyCellStyle}>
              등록된 배너가 없습니다.
            </td>
          </tr>
        ) : (
          banners.map((banner, index) => (
            <tr key={banner.id}>
              <RowSelectCell
                id={banner.id}
                label={`${banner.title} 선택`}
                checked={selectedIds.has(banner.id)}
                onToggle={(checked) => onToggleOne(banner.id, checked)}
              />
              <td style={numericCellStyle}>{formatNumber(startIndex + index + 1)}</td>
              <td style={titleCellStyle}>{banner.title}</td>
              <td style={nowrapCellStyle}>{PLACEMENT_LABEL[banner.placement]}</td>
              <td style={nowrapCellStyle}>{`${banner.startAt} ~ ${banner.endAt}`}</td>
              <td style={nowrapCellStyle}>
                <StatusBadge
                  tone={enabledTone(banner.enabled)}
                  label={enabledLabel(banner.enabled)}
                />
              </td>
              <td style={numericCellStyle}>{formatNumber(banner.order)}</td>
              <td style={actionCellStyle}>
                <RowActions
                  label={banner.title}
                  disabled={deletingId === banner.id}
                  onEdit={() => onEdit(banner)}
                  onDelete={() => onDelete(banner)}
                />
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
