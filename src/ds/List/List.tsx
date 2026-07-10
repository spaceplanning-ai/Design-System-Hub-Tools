import type { ReactNode } from 'react'
import styles from './List.module.css'

export type ListItem = {
  id: string
  title: string
  description?: string
  leading?: ReactNode
  trailing?: ReactNode
  disabled?: boolean
}

export type ListProps = {
  items: ListItem[]
  onItemClick?: (item: ListItem) => void
  divider?: boolean
  selectable?: boolean
  selectedId?: string | null
  onSelect?: (id: string) => void
}

export function List({
  items,
  onItemClick,
  divider = true,
  selectable = false,
  selectedId = null,
  onSelect,
}: ListProps) {
  const handleClick = (item: ListItem) => {
    onItemClick?.(item)
    if (selectable) onSelect?.(item.id)
  }

  return (
    <ul className={[styles.list, divider ? styles.divider : ''].filter(Boolean).join(' ')}>
      {items.map((item) => {
        const selected = selectable && item.id === selectedId
        const itemClass = [styles.item, selected ? styles.selected : ''].filter(Boolean).join(' ')
        return (
          <li key={item.id}>
            <button
              type="button"
              className={itemClass}
              disabled={item.disabled}
              aria-current={selected || undefined}
              onClick={() => handleClick(item)}
            >
              {item.leading != null && <span className={styles.leading}>{item.leading}</span>}
              <span className={styles.body}>
                <span className={styles.title}>{item.title}</span>
                {item.description != null && (
                  <span className={styles.description}>{item.description}</span>
                )}
              </span>
              {item.trailing != null && <span className={styles.trailing}>{item.trailing}</span>}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
