// FAQ 목록 표 (A41 소유)
//
// 행을 누르면 상세로 간다. 행 액션은 삭제(수정은 상세에서) — RowActions 공통 모듈.
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';

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
import { useRowNavigation } from '../../../../shared/useRowNavigation';
import { PAGE_SIZE, visibilityLabel, visibilityTone } from '../types';
import type { FaqSummary } from '../types';

const COLUMNS = ['질문', '카테고리', '노출', '정렬 순서'] as const;

const questionCellStyle: CSSProperties = {
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

interface FaqTableProps {
  readonly faqs: readonly FaqSummary[];
  readonly loading: boolean;
  readonly onDelete: (faq: FaqSummary) => void;
  readonly deletingId: string | null;
}

export function FaqTable({ faqs, loading, onDelete, deletingId }: FaqTableProps) {
  const { rowNavProps } = useRowNavigation();

  return (
    <table style={tableStyle} aria-busy={loading}>
      <caption style={visuallyHiddenStyle}>
        FAQ 목록 — 행을 누르면 상세로 이동합니다. 질문 링크와 삭제 버튼은 각자의 동작을 수행합니다.
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
        ) : faqs.length === 0 ? (
          <tr>
            <td colSpan={COLUMNS.length + 1} style={emptyCellStyle}>
              조회된 FAQ 가 없습니다.
            </td>
          </tr>
        ) : (
          faqs.map((faq) => {
            const detailPath = `/content/faq/${faq.id}`;
            return (
              <tr key={faq.id} className="tds-ui-row" {...rowNavProps(detailPath)}>
                <td style={questionCellStyle}>
                  <Link to={detailPath} className="tds-ui-link tds-ui-focusable">
                    {faq.question}
                  </Link>
                </td>
                <td style={nowrapCellStyle}>{faq.categoryLabel}</td>
                <td style={nowrapCellStyle}>
                  <StatusBadge
                    tone={visibilityTone(faq.visible)}
                    label={visibilityLabel(faq.visible)}
                  />
                </td>
                <td style={numericCellStyle}>{formatNumber(faq.order)}</td>
                <td style={actionCellStyle}>
                  <RowActions
                    label={faq.question}
                    disabled={deletingId === faq.id}
                    onDelete={() => onDelete(faq)}
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
