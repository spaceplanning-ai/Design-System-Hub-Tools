// 팝업 목록 표 (A41 소유)
//
// 목록+등록 화면이라 행을 눌러 상세로 가지 않는다 — 수정은 인라인 폼으로 연다(RowActions onEdit).
import type { CSSProperties } from 'react';

import { formatNumber } from '../../../../shared/format';
import {
  numericCellStyle,
  RowActions,
  StatusBadge,
  tableStyle,
  tdStyle,
  thStyle,
  visuallyHiddenStyle,
} from '../../../../shared/ui';
import { enabledLabel, enabledTone, PAGE_SIZE, POSITION_LABEL } from '../types';
import type { Popup } from '../types';

const COLUMNS = ['제목', '위치', '노출 기간', '상태', '우선순위'] as const;

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
          {Array.from({ length: COLUMNS.length + 1 }, (_, cell) => (
            <td key={`cell-${String(cell)}`} style={tdStyle}>
              <span className="tds-ui-skeleton" aria-hidden="true" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

interface PopupsTableProps {
  readonly popups: readonly Popup[];
  readonly loading: boolean;
  readonly onEdit: (popup: Popup) => void;
  readonly onDelete: (popup: Popup) => void;
  readonly deletingId: string | null;
}

export function PopupsTable({ popups, loading, onEdit, onDelete, deletingId }: PopupsTableProps) {
  return (
    <table style={tableStyle} aria-busy={loading}>
      <caption style={visuallyHiddenStyle}>
        팝업 목록 — 수정/삭제 버튼으로 각 팝업을 관리합니다.
      </caption>

      <thead>
        <tr>
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
        ) : popups.length === 0 ? (
          <tr>
            <td colSpan={COLUMNS.length + 1} style={emptyCellStyle}>
              등록된 팝업이 없습니다.
            </td>
          </tr>
        ) : (
          popups.map((popup) => (
            <tr key={popup.id}>
              <td style={titleCellStyle}>{popup.title}</td>
              <td style={nowrapCellStyle}>{POSITION_LABEL[popup.position]}</td>
              <td style={nowrapCellStyle}>{`${popup.startAt} ~ ${popup.endAt}`}</td>
              <td style={nowrapCellStyle}>
                <StatusBadge
                  tone={enabledTone(popup.enabled)}
                  label={enabledLabel(popup.enabled)}
                />
              </td>
              <td style={numericCellStyle}>{formatNumber(popup.priority)}</td>
              <td style={actionCellStyle}>
                <RowActions
                  label={popup.title}
                  disabled={deletingId === popup.id}
                  onEdit={() => onEdit(popup)}
                  onDelete={() => onDelete(popup)}
                />
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
