import type { ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { useControllableState } from '@/hooks';
import { toDataAttrs } from '@core/defineComponent';
import { Icon } from '../../atoms/Icon';
import { Checkbox } from '../../atoms/Checkbox';
import { tableMeta } from './Table.meta';
import './Table.css';

export type TableVariant = 'default' | 'striped' | 'bordered';
export type TableSize = 'sm' | 'md' | 'lg';
/** Layout preset — A: comfortable (default) · B: compact density. */
export type TableType = 'A' | 'B';
export type TableAlign = 'start' | 'center' | 'end';
export type SortDirection = 'asc' | 'desc';
export interface SortState {
  columnKey: string;
  direction: SortDirection;
}

export interface TableColumn<T> {
  key: string;
  header: ReactNode;
  render?: (row: T, index: number) => ReactNode;
  align?: TableAlign;
  width?: string | number;
  /** Enables a clickable sort header for this column. */
  sortable?: boolean;
  /** Value used when sorting; defaults to `row[key]`. */
  sortAccessor?: (row: T) => string | number;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  /** Layout preset — 'A' comfortable (default) or 'B' compact. */
  type?: TableType;
  variant?: TableVariant;
  size?: TableSize;
  stickyHeader?: boolean;
  caption?: ReactNode;
  getRowId?: (row: T, index: number) => string;
  onRowClick?: (row: T, index: number) => void;
  className?: string;
  emptyState?: ReactNode;
  /** Show a loading row instead of data. */
  loading?: boolean;
  /** Controlled sort state (client-side sort is applied automatically). */
  sortState?: SortState | null;
  defaultSortState?: SortState | null;
  onSortChange?: (next: SortState | null) => void;
  /** Render a leading selection column with per-row + select-all checkboxes. */
  selectable?: boolean;
  selectedRowIds?: string[];
  defaultSelectedRowIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

function compare(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  type = 'A',
  variant = 'default',
  size = 'md',
  stickyHeader = false,
  caption,
  getRowId,
  onRowClick,
  className,
  emptyState,
  loading = false,
  sortState,
  defaultSortState = null,
  onSortChange,
  selectable = false,
  selectedRowIds,
  defaultSelectedRowIds = [],
  onSelectionChange,
}: TableProps<T>) {
  const [sort, setSort] = useControllableState<SortState | null>({
    value: sortState,
    defaultValue: defaultSortState,
    onChange: onSortChange,
  });
  const [selected, setSelected] = useControllableState<string[]>({
    value: selectedRowIds,
    defaultValue: defaultSelectedRowIds,
    onChange: onSelectionChange,
  });

  const rowId = (row: T, i: number) => (getRowId ? getRowId(row, i) : String(i));

  // Client-side sort based on the active sort state.
  const sortedData = (() => {
    if (!sort) return data;
    const col = columns.find((c) => c.key === sort.columnKey);
    if (!col) return data;
    const accessor = col.sortAccessor ?? ((row: T) => row[col.key] as string | number);
    const dir = sort.direction === 'asc' ? 1 : -1;
    return [...data].sort((a, b) => compare(accessor(a), accessor(b)) * dir);
  })();

  const cycleSort = (key: string) => {
    if (sort?.columnKey !== key) setSort({ columnKey: key, direction: 'asc' });
    else if (sort.direction === 'asc') setSort({ columnKey: key, direction: 'desc' });
    else setSort(null);
  };

  const allIds = sortedData.map((row, i) => rowId(row, i));
  const selectedSet = new Set(selected);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedSet.has(id));
  const someSelected = allIds.some((id) => selectedSet.has(id));

  const toggleAll = () => setSelected(allSelected ? [] : allIds);
  const toggleRow = (id: string) =>
    setSelected(selectedSet.has(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  const totalCols = columns.length + (selectable ? 1 : 0);

  return (
    <div
      className={cx('tds-table-wrap', className)}
      {...toDataAttrs(tableMeta, { type, variant, size })}
      data-sticky={stickyHeader || undefined}
    >
      <table className="tds-table">
        {caption && <caption className="tds-table__caption">{caption}</caption>}
        <thead className="tds-table__head">
          <tr>
            {selectable && (
              <th scope="col" className="tds-table__th tds-table__th--select">
                <Checkbox
                  aria-label="Select all rows"
                  checked={allSelected}
                  indeterminate={someSelected && !allSelected}
                  onChange={toggleAll}
                />
              </th>
            )}
            {columns.map((col) => {
              const isSorted = sort?.columnKey === col.key;
              const ariaSort = !col.sortable
                ? undefined
                : isSorted
                  ? sort!.direction === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none';
              return (
                <th
                  key={col.key}
                  scope="col"
                  className="tds-table__th"
                  data-align={col.align}
                  data-sortable={col.sortable || undefined}
                  aria-sort={ariaSort}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      className="tds-table__sort"
                      onClick={() => cycleSort(col.key)}
                    >
                      <span>{col.header}</span>
                      <Icon
                        className="tds-table__sort-icon"
                        name={
                          isSorted
                            ? sort!.direction === 'asc'
                              ? 'chevron-up'
                              : 'chevron-down'
                            : 'chevrons-up-down'
                        }
                        size={14}
                        data-active={isSorted || undefined}
                        aria-hidden
                      />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td className="tds-table__empty" colSpan={totalCols}>
                <span className="tds-table__loading">
                  <Icon name="loader" size="sm" spin aria-hidden />
                  Loading…
                </span>
              </td>
            </tr>
          ) : sortedData.length === 0 ? (
            <tr>
              <td className="tds-table__empty" colSpan={totalCols}>
                {emptyState ?? 'No data'}
              </td>
            </tr>
          ) : (
            sortedData.map((row, i) => {
              const id = rowId(row, i);
              const isSelected = selectedSet.has(id);
              return (
                <tr
                  key={id}
                  className="tds-table__row"
                  data-clickable={onRowClick ? true : undefined}
                  data-selected={isSelected || undefined}
                  aria-selected={selectable ? isSelected : undefined}
                  onClick={onRowClick ? () => onRowClick(row, i) : undefined}
                >
                  {selectable && (
                    <td
                      className="tds-table__td tds-table__td--select"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        aria-label={`Select row ${i + 1}`}
                        checked={isSelected}
                        onChange={() => toggleRow(id)}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="tds-table__td" data-align={col.align}>
                      {col.render ? col.render(row, i) : (row[col.key] as ReactNode)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
