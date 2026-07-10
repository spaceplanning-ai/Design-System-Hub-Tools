import { Fragment, useRef, useState } from 'react'
import styles from './Dropdown.module.css'
import { Chevron, useDismiss } from '../Select/Select'

export type DropdownItem = {
  label: string
  onSelect?: () => void
  danger?: boolean
  disabled?: boolean
  /** 해당 항목 위 구분선 */
  divider?: boolean
}

export type DropdownProps = {
  /** 트리거 버튼 텍스트 */
  label: string
  items: DropdownItem[]
  disabled?: boolean
  align?: 'start' | 'end'
}

export function Dropdown({ label, items, disabled = false, align = 'start' }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  useDismiss(rootRef, () => setOpen(false))

  return (
    <div ref={rootRef} className={[styles.root, open ? styles.open : ''].filter(Boolean).join(' ')}>
      <button
        type="button"
        className={styles.trigger}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {label}
        <span className={styles.chevron}>
          <Chevron />
        </span>
      </button>
      {open && (
        <div className={[styles.menu, styles[align]].join(' ')} role="menu">
          {items.map((item, index) => (
            <Fragment key={index}>
              {item.divider && <div className={styles.divider} role="separator" />}
              <button
                type="button"
                role="menuitem"
                className={[styles.item, item.danger ? styles.danger : '']
                  .filter(Boolean)
                  .join(' ')}
                disabled={item.disabled}
                onClick={() => {
                  item.onSelect?.()
                  setOpen(false)
                }}
              >
                {item.label}
              </button>
            </Fragment>
          ))}
        </div>
      )}
    </div>
  )
}
