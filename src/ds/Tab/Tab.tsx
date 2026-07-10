import { useRef } from 'react'
import type { KeyboardEvent } from 'react'
import styles from './Tab.module.css'

export type TabItem = {
  value: string
  label: string
  disabled?: boolean
}

export type TabProps = {
  items: TabItem[]
  value: string
  onChange?: (value: string) => void
  variant?: 'segmented' | 'underline'
  size?: 'sm' | 'md'
}

export function Tab({ items, value, onChange, variant = 'segmented', size = 'md' }: TabProps) {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  // 방향키로 활성 탭 이동
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    const enabled = items.filter((item) => !item.disabled)
    const index = enabled.findIndex((item) => item.value === value)
    if (index < 0) return
    const delta = event.key === 'ArrowRight' ? 1 : -1
    const next = enabled[(index + delta + enabled.length) % enabled.length]
    onChange?.(next.value)
    tabRefs.current[next.value]?.focus()
    event.preventDefault()
  }

  return (
    <div
      role="tablist"
      className={[styles.tablist, styles[variant], styles[size]].join(' ')}
      onKeyDown={handleKeyDown}
    >
      {items.map((item) => {
        const selected = item.value === value
        return (
          <button
            key={item.value}
            ref={(el) => {
              tabRefs.current[item.value] = el
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            disabled={item.disabled}
            className={[styles.tab, selected ? styles.active : ''].filter(Boolean).join(' ')}
            onClick={() => onChange?.(item.value)}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
