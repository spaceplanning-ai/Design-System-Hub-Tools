import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import styles from './Table.module.css'

export type TableColumn<T> = {
  key: string
  header: string
  width?: number | string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  render?: (row: T) => ReactNode
}

export type TableProps<T> = {
  columns: TableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  striped?: boolean
  bordered?: boolean
  compact?: boolean
  emptyText?: string
  onRowClick?: (row: T) => void
}

type SortDir = 'asc' | 'desc'
type SortState = { key: string; dir: SortDir } | null

function SortIcon({ dir }: { dir: SortDir | null }) {
  if (dir === 'asc') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 15l6-6 6 6" />
      </svg>
    )
  }
  if (dir === 'desc') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 9l6 6 6-6" />
      </svg>
    )
  }
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 9l5-5 5 5" />
      <path d="M7 15l5 5 5-5" />
    </svg>
  )
}

/** 문자열은 localeCompare, 숫자는 수치 비교 */
function compareValues(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a ?? '').localeCompare(String(b ?? ''), 'ko')
}

export function Table<T>({
  columns,
  rows,
  rowKey,
  striped = false,
  bordered = false,
  compact = false,
  emptyText = '데이터가 없습니다.',
  onRowClick,
}: TableProps<T>) {
  const [sort, setSort] = useState<SortState>(null)

  // asc → desc → none 순환
  const cycleSort = (key: string) => {
    setSort((prev) => {
      if (prev == null || prev.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      return null
    })
  }

  const sorted =
    sort == null
      ? rows
      : [...rows].sort((a, b) => {
          const result = compareValues(
            (a as Record<string, unknown>)[sort.key],
            (b as Record<string, unknown>)[sort.key],
          )
          return sort.dir === 'asc' ? result : -result
        })

  const cellValue = (row: T, col: TableColumn<T>): ReactNode =>
    col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')

  const cellStyle = (col: TableColumn<T>): CSSProperties => ({
    width: col.width,
    textAlign: col.align,
  })

  const tableClass = [
    styles.table,
    striped ? styles.striped : '',
    bordered ? styles.bordered : '',
    compact ? styles.compact : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <table className={tableClass}>
      <thead>
        <tr>
          {columns.map((col) => {
            const dir = sort != null && sort.key === col.key ? sort.dir : null
            return (
              <th
                key={col.key}
                scope="col"
                className={styles.th}
                style={cellStyle(col)}
                aria-sort={dir == null ? undefined : dir === 'asc' ? 'ascending' : 'descending'}
              >
                {col.sortable ? (
                  <button type="button" className={styles.sortButton} onClick={() => cycleSort(col.key)}>
                    {col.header}
                    <span className={dir == null ? styles.sortIcon : styles.sortIconActive}>
                      <SortIcon dir={dir} />
                    </span>
                  </button>
                ) : (
                  col.header
                )}
              </th>
            )
          })}
        </tr>
      </thead>
      <tbody>
        {sorted.length === 0 ? (
          <tr>
            <td className={[styles.td, styles.empty].join(' ')} colSpan={columns.length}>
              {emptyText}
            </td>
          </tr>
        ) : (
          sorted.map((row) => (
            <tr
              key={rowKey(row)}
              className={[styles.row, onRowClick ? styles.clickable : ''].filter(Boolean).join(' ')}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <td key={col.key} className={styles.td} style={cellStyle(col)}>
                  {cellValue(row, col)}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  )
}
