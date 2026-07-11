import styles from './FilterBar.module.css'
import { SearchField } from '../SearchField/SearchField'
import { Select, type SelectOption } from '../Select/Select'
import { Chip } from '../Chip/Chip'
import { Button } from '../Button/Button'

export type FilterBarFilter = {
  key: string
  label: string
  options: SelectOption[]
}

export type FilterBarChip = {
  key: string
  label: string
}

export type FilterBarProps = {
  searchValue: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  filters?: FilterBarFilter[]
  filterValues?: Record<string, string | null>
  onFilterChange?: (key: string, value: string | null) => void
  /** 적용된 필터 칩 — onRemoveChip으로 제거 */
  activeChips?: FilterBarChip[]
  onRemoveChip?: (key: string) => void
  /** 있으면 우측에 '초기화' 버튼 표시 */
  onReset?: () => void
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = '검색어를 입력하세요',
  filters = [],
  filterValues = {},
  onFilterChange,
  activeChips = [],
  onRemoveChip,
  onReset,
}: FilterBarProps) {
  return (
    <div className={styles.filterBar}>
      <div className={styles.row}>
        <div className={styles.search}>
          <SearchField value={searchValue} onChange={onSearchChange} placeholder={searchPlaceholder} />
        </div>
        {filters.map((filter) => (
          <div key={filter.key} className={styles.filter}>
            <Select
              value={filterValues[filter.key] ?? null}
              onChange={(value) => onFilterChange?.(filter.key, value)}
              options={filter.options}
              placeholder={filter.label}
            />
          </div>
        ))}
        {onReset != null && (
          <div className={styles.reset}>
            <Button variant="secondary" size="sm" label="초기화" onClick={onReset} />
          </div>
        )}
      </div>
      {activeChips.length > 0 && (
        <div className={styles.chips}>
          {activeChips.map((chip) => (
            <Chip key={chip.key} label={chip.label} size="sm" onRemove={() => onRemoveChip?.(chip.key)} />
          ))}
        </div>
      )}
    </div>
  )
}
