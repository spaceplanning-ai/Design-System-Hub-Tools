import { useState } from 'react'
import type { ReactNode } from 'react'
import styles from './Accordion.module.css'

export type AccordionItem = {
  id: string
  title: string
  content: ReactNode
  disabled?: boolean
}

export type AccordionProps = {
  items: AccordionItem[]
  multiple?: boolean
  defaultOpenIds?: string[]
}

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

export function Accordion({ items, multiple = false, defaultOpenIds = [] }: AccordionProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(defaultOpenIds))

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        if (!multiple) next.clear()
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className={styles.accordion}>
      {items.map((item) => {
        const open = openIds.has(item.id)
        return (
          <div key={item.id} className={styles.item}>
            <button
              type="button"
              className={styles.header}
              disabled={item.disabled}
              aria-expanded={open}
              onClick={() => toggle(item.id)}
            >
              <span className={styles.title}>{item.title}</span>
              <span className={[styles.chevron, open ? styles.chevronOpen : ''].filter(Boolean).join(' ')}>
                <Chevron />
              </span>
            </button>
            {open && <div className={styles.content}>{item.content}</div>}
          </div>
        )
      })}
    </div>
  )
}
