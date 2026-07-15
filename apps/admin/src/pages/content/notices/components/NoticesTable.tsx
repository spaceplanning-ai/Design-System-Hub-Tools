// 공지 목록 표 (A41 소유)
//
// [a11y] 시각적으로 숨긴 <caption> · 모든 th 에 scope. 행을 누르면 상세로 간다(useRowNavigation).
// [행 액션] 삭제만 행에 둔다(수정은 상세에서) — RowActions 공통 모듈. 삭제는 확인 다이얼로그를 거친다.
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';

import { formatDateTime, formatNumber } from '../../../../shared/format';
import {
  numericCellStyle,
  RowActions,
  StatusBadge,
  tableStyle,
  tdStyle,
  thStyle,
  visuallyHiddenStyle,
} from '../../../../shared/ui';
import { useRowNavigation } from '../../../../shared/useRowNavigation';
import { CATEGORY_LABEL, PAGE_SIZE, STATUS_LABEL, STATUS_TONE } from '../types';
import type { NoticeSummary } from '../types';

const COLUMNS = ['제목', '분류', '상태', '작성자', '게시일', '조회수'] as const;

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
  width: 'var(--tds-space-6)',
  textAlign: 'right',
};

const emptyCellStyle: CSSProperties = {
  ...tdStyle,
  paddingTop: 'var(--tds-space-6)',
  paddingBottom: 'var(--tds-space-6)',
  color: 'var(--tds-color-text-muted)',
  textAlign: 'center',
};

const titleGroupStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--tds-space-2)',
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

interface NoticesTableProps {
  readonly notices: readonly NoticeSummary[];
  readonly loading: boolean;
  readonly onDelete: (notice: NoticeSummary) => void;
  /** 삭제 요청 중인 공지 — 해당 행의 액션이 잠긴다 */
  readonly deletingId: string | null;
}

export function NoticesTable({ notices, loading, onDelete, deletingId }: NoticesTableProps) {
  const { rowNavProps } = useRowNavigation();

  return (
    <table style={tableStyle} aria-busy={loading}>
      <caption style={visuallyHiddenStyle}>
        공지사항 목록 — 행을 누르면 상세로 이동합니다. 제목 링크와 삭제 버튼은 각자의 동작을
        수행합니다.
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
        ) : notices.length === 0 ? (
          <tr>
            <td colSpan={COLUMNS.length + 1} style={emptyCellStyle}>
              조회된 공지사항이 없습니다.
            </td>
          </tr>
        ) : (
          notices.map((notice) => {
            const detailPath = `/content/notices/${notice.id}`;
            return (
              <tr key={notice.id} className="tds-ui-row" {...rowNavProps(detailPath)}>
                <td style={titleCellStyle}>
                  <span style={titleGroupStyle}>
                    {notice.pinned && <StatusBadge tone="warning" label="고정" />}
                    <Link to={detailPath} className="tds-ui-link tds-ui-focusable">
                      {notice.title}
                    </Link>
                  </span>
                </td>
                <td style={nowrapCellStyle}>{CATEGORY_LABEL[notice.category]}</td>
                <td style={nowrapCellStyle}>
                  <StatusBadge
                    tone={STATUS_TONE[notice.status]}
                    label={STATUS_LABEL[notice.status]}
                  />
                </td>
                <td style={nowrapCellStyle}>{notice.author}</td>
                <td style={nowrapCellStyle}>{formatDateTime(notice.publishedAtIso)}</td>
                <td style={numericCellStyle}>{formatNumber(notice.views)}</td>
                <td style={actionCellStyle}>
                  <RowActions
                    label={notice.title}
                    disabled={deletingId === notice.id}
                    onDelete={() => onDelete(notice)}
                  />
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}
