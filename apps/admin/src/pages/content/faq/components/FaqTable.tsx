// FAQ 목록 표 (A41 소유)
//
// 행을 누르면 상세로 간다. 행 액션은 삭제(수정은 상세에서) — RowActions 공통 모듈.
//
// [정렬 순서 재정렬 — 오너 피드백 ③] 필터/검색이 없는 자연 순서 화면(reorderable)에서만 켠다.
//   - 마우스: 행을 드래그해 순서를 바꾼다(HTML5 draggable — 라이브러리 없이 직접). 드래그 중
//     시각 피드백(끄는 행은 흐리게, 놓을 자리 행 위에 강조선)을 토큰으로 준다.
//   - 키보드/보조: 드래그는 마우스 전용이므로 각 행에 위/아래 이동 버튼(↑↓)을 함께 제공한다.
//   순서 변경은 새 id 순서로 onReorder 를 부른다 — 저장/낙관적 업데이트·롤백은 호출부(FaqPage)가 한다.
import { useState } from 'react';
import type { CSSProperties, DragEvent } from 'react';
import { Link } from 'react-router-dom';

import { formatNumber } from '../../../../shared/format';
import {
  buttonStyle,
  numericCellStyle,
  RowActions,
  StatusBadge,
  tableStyle,
  tdStyle,
  thStyle,
  visuallyHiddenStyle,
} from '../../../../shared/ui';
import { useRowNavigation } from '../../../../shared/useRowNavigation';
import { moveArrayItem, PAGE_SIZE, visibilityLabel, visibilityTone } from '../types';
import type { FaqSummary } from '../types';

const COLUMNS = ['질문', '카테고리', '노출', '정렬 순서'] as const;

/* ── 재정렬 전용 아이콘 (FAQ 목록 1곳만 쓴다 — 승격하지 않는다) ─────────────── */

const ICON_BASE = {
  width: '1.25em',
  height: '1.25em',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const;

/** 드래그 손잡이 — 세로 점 6개 */
function GripVerticalIcon() {
  return (
    <svg {...ICON_BASE}>
      <circle cx="9" cy="6" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="9" cy="18" r="1" />
      <circle cx="15" cy="6" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="15" cy="18" r="1" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg {...ICON_BASE}>
      <path d="M12 19V5" />
      <path d="m6 11 6-6 6 6" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg {...ICON_BASE}>
      <path d="M12 5v14" />
      <path d="m6 13 6 6 6-6" />
    </svg>
  );
}

/* ── 스타일 ──────────────────────────────────────────────────────────────── */

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
  width: 'calc(var(--tds-space-6) * 3)',
  textAlign: 'right',
};

const gripCellStyle: CSSProperties = {
  ...tdStyle,
  width: 'var(--tds-space-6)',
  color: 'var(--tds-color-text-muted)',
  cursor: 'grab',
  textAlign: 'center',
};

const rowActionsWrapStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--tds-space-1)',
  justifyContent: 'flex-end',
};

const emptyCellStyle: CSSProperties = {
  ...tdStyle,
  paddingTop: 'var(--tds-space-6)',
  paddingBottom: 'var(--tds-space-6)',
  color: 'var(--tds-color-text-muted)',
  textAlign: 'center',
};

function SkeletonRows({ columns }: { readonly columns: number }) {
  return (
    <>
      {Array.from({ length: PAGE_SIZE }, (_, index) => (
        <tr key={`skeleton-${String(index)}`}>
          {Array.from({ length: columns }, (_, cell) => (
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
  /** 정렬 재정렬을 켤지 — 필터/검색이 없는 자연 순서 화면에서만 true */
  readonly reorderable: boolean;
  /** 새 id 순서로 재정렬 요청 — 저장/낙관적 업데이트는 호출부가 한다 */
  readonly onReorder: (orderedIds: readonly string[]) => void;
  /** 재정렬 저장 진행 중 — 이동 버튼/드래그를 잠근다 */
  readonly reordering: boolean;
}

export function FaqTable({
  faqs,
  loading,
  onDelete,
  deletingId,
  reorderable,
  onReorder,
  reordering,
}: FaqTableProps) {
  const { rowNavProps } = useRowNavigation();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const ids = faqs.map((faq) => faq.id);
  const leadingCols = reorderable ? 1 : 0;
  const totalCols = COLUMNS.length + 1 + leadingCols;
  const locked = reordering;

  const reorderTo = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const from = ids.indexOf(fromId);
    const to = ids.indexOf(toId);
    if (from < 0 || to < 0) return;
    onReorder(moveArrayItem(ids, from, to));
  };

  const moveBy = (index: number, delta: number) => {
    onReorder(moveArrayItem(ids, index, index + delta));
  };

  const onDragStart = (id: string) => (event: DragEvent<HTMLTableRowElement>) => {
    if (locked) return;
    setDraggingId(id);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (id: string) => (event: DragEvent<HTMLTableRowElement>) => {
    if (draggingId === null) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (overId !== id) setOverId(id);
  };

  const onDrop = (id: string) => (event: DragEvent<HTMLTableRowElement>) => {
    event.preventDefault();
    if (draggingId !== null) reorderTo(draggingId, id);
    setDraggingId(null);
    setOverId(null);
  };

  const clearDrag = () => {
    setDraggingId(null);
    setOverId(null);
  };

  const rowStyleFor = (id: string, base: CSSProperties): CSSProperties => {
    const style: CSSProperties = { ...base };
    if (draggingId === id) style.opacity = 0.5;
    // 놓을 자리 위에 강조선 — 어디에 떨어질지 보여준다
    if (overId === id && draggingId !== null && draggingId !== id) {
      style.boxShadow = 'inset 0 var(--tds-border-width-medium) 0 0 var(--tds-color-border-focus)';
    }
    return style;
  };

  return (
    <table style={tableStyle} aria-busy={loading}>
      <caption style={visuallyHiddenStyle}>
        FAQ 목록 — 행을 누르면 상세로 이동합니다. 질문 링크와 삭제 버튼은 각자의 동작을 수행합니다.
        {reorderable && ' 각 행의 위/아래 버튼 또는 드래그로 정렬 순서를 바꿉니다.'}
      </caption>

      <thead>
        <tr>
          {reorderable && (
            <th scope="col" style={thStyle}>
              <span style={visuallyHiddenStyle}>정렬 손잡이</span>
            </th>
          )}
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
          <SkeletonRows columns={totalCols} />
        ) : faqs.length === 0 ? (
          <tr>
            <td colSpan={totalCols} style={emptyCellStyle}>
              조회된 FAQ 가 없습니다.
            </td>
          </tr>
        ) : (
          faqs.map((faq, index) => {
            const detailPath = `/content/faq/${faq.id}`;
            const nav = rowNavProps(detailPath);
            return (
              <tr
                key={faq.id}
                className="tds-ui-row"
                onClick={nav.onClick}
                style={rowStyleFor(faq.id, nav.style)}
                draggable={reorderable && !locked}
                onDragStart={reorderable ? onDragStart(faq.id) : undefined}
                onDragOver={reorderable ? onDragOver(faq.id) : undefined}
                onDrop={reorderable ? onDrop(faq.id) : undefined}
                onDragEnd={reorderable ? clearDrag : undefined}
              >
                {reorderable && (
                  <td style={gripCellStyle} aria-hidden="true">
                    <GripVerticalIcon />
                  </td>
                )}
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
                  <span style={rowActionsWrapStyle}>
                    {reorderable && (
                      <>
                        <button
                          type="button"
                          className="tds-ui-btn-ghost tds-ui-focusable"
                          style={buttonStyle('ghost', locked || index === 0)}
                          aria-label={`${faq.question} 위로 이동`}
                          disabled={locked || index === 0}
                          onClick={() => moveBy(index, -1)}
                        >
                          <ArrowUpIcon />
                        </button>
                        <button
                          type="button"
                          className="tds-ui-btn-ghost tds-ui-focusable"
                          style={buttonStyle('ghost', locked || index === faqs.length - 1)}
                          aria-label={`${faq.question} 아래로 이동`}
                          disabled={locked || index === faqs.length - 1}
                          onClick={() => moveBy(index, 1)}
                        >
                          <ArrowDownIcon />
                        </button>
                      </>
                    )}
                    <RowActions
                      label={faq.question}
                      disabled={deletingId === faq.id}
                      onDelete={() => onDelete(faq)}
                    />
                  </span>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}
