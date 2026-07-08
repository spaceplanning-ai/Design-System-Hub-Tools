import type { HTMLAttributes } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { Icon } from '../../atoms/Icon';
import { paginationMeta } from './Pagination.meta';
import './Pagination.css';

export type PaginationVariant = 'outline' | 'ghost';
export type PaginationSize = 'sm' | 'md' | 'lg';
export type PaginationShape = 'rounded' | 'pill';

export interface PaginationProps extends Omit<HTMLAttributes<HTMLElement>, 'onChange'> {
  page: number;
  count: number;
  onPageChange?: (page: number) => void;
  siblingCount?: number;
  variant?: PaginationVariant;
  size?: PaginationSize;
  shape?: PaginationShape;
  /** Show first/last page jump buttons. */
  showEdges?: boolean;
}

type PageEntry = number | 'ellipsis-start' | 'ellipsis-end';

function range(page: number, count: number, siblings: number): PageEntry[] {
  const total = siblings * 2 + 5; // first, last, current, 2 ellipses
  if (count <= total) return Array.from({ length: count }, (_, i) => i + 1);

  const left = Math.max(page - siblings, 1);
  const right = Math.min(page + siblings, count);
  const showLeftEllipsis = left > 2;
  const showRightEllipsis = right < count - 1;

  const entries: PageEntry[] = [1];
  if (showLeftEllipsis) entries.push('ellipsis-start');
  else for (let i = 2; i < left; i++) entries.push(i);
  for (let i = left; i <= right; i++) if (i !== 1 && i !== count) entries.push(i);
  if (showRightEllipsis) entries.push('ellipsis-end');
  else for (let i = right + 1; i < count; i++) entries.push(i);
  entries.push(count);
  return entries;
}

export function Pagination({ page, count, onPageChange, siblingCount = 1, variant = 'ghost', size = 'md', shape = 'rounded', showEdges = false, className, ...rest }: PaginationProps) {
  const entries = range(page, count, siblingCount);
  const go = (p: number) => onPageChange?.(Math.max(1, Math.min(count, p)));

  return (
    <nav aria-label="Pagination" className={cx('tds-pagination', className)} {...toDataAttrs(paginationMeta, { variant, size, shape })} {...rest}>
      {showEdges && (
        <button type="button" className="tds-pagination__item tds-pagination__nav" aria-label="First page" disabled={page <= 1} onClick={() => go(1)}>
          <Icon name="chevrons-left" size="sm" />
        </button>
      )}
      <button type="button" className="tds-pagination__item tds-pagination__nav" aria-label="Previous page" disabled={page <= 1} onClick={() => go(page - 1)}>
        <Icon name="chevron-left" size="sm" />
      </button>
      {entries.map((entry) =>
        typeof entry === 'number' ? (
          <button
            key={entry}
            type="button"
            className="tds-pagination__item"
            aria-label={`Page ${entry}`}
            aria-current={entry === page ? 'page' : undefined}
            data-selected={entry === page || undefined}
            onClick={() => go(entry)}
          >
            {entry}
          </button>
        ) : (
          <span key={entry} className="tds-pagination__ellipsis" aria-hidden="true">
            <Icon name="more-horizontal" size="sm" />
          </span>
        ),
      )}
      <button type="button" className="tds-pagination__item tds-pagination__nav" aria-label="Next page" disabled={page >= count} onClick={() => go(page + 1)}>
        <Icon name="chevron-right" size="sm" />
      </button>
      {showEdges && (
        <button type="button" className="tds-pagination__item tds-pagination__nav" aria-label="Last page" disabled={page >= count} onClick={() => go(count)}>
          <Icon name="chevrons-right" size="sm" />
        </button>
      )}
    </nav>
  );
}
