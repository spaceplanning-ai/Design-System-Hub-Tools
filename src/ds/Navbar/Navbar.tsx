import type { ReactNode } from 'react'
import styles from './Navbar.module.css'

export type NavbarItem = {
  label: string
  value: string
}

export type NavbarProps = {
  brand: string
  items: NavbarItem[]
  value: string
  onChange?: (value: string) => void
  actions?: ReactNode
  sticky?: boolean
}

export function Navbar({ brand, items, value, onChange, actions, sticky = false }: NavbarProps) {
  const className = [styles.navbar, sticky ? styles.sticky : ''].filter(Boolean).join(' ')

  return (
    <nav className={className}>
      <span className={styles.brand}>{brand}</span>
      <div className={styles.menu}>
        {items.map((item) => {
          const active = item.value === value
          return (
            <button
              key={item.value}
              type="button"
              aria-current={active ? 'page' : undefined}
              className={[styles.item, active ? styles.active : ''].filter(Boolean).join(' ')}
              onClick={() => onChange?.(item.value)}
            >
              {item.label}
            </button>
          )
        })}
      </div>
      {actions != null && <div className={styles.actions}>{actions}</div>}
    </nav>
  )
}
