import type { ReactNode } from 'react'
import styles from './Header.module.css'

export type HeaderProps = {
  title: string
  description?: string
  breadcrumb?: ReactNode
  actions?: ReactNode
  /** 하단 보더 표시 (기본 true) */
  divider?: boolean
}

export function Header({ title, description, breadcrumb, actions, divider = true }: HeaderProps) {
  const className = [styles.header, divider ? styles.divider : ''].filter(Boolean).join(' ')

  return (
    <header className={className}>
      {breadcrumb != null && <div className={styles.breadcrumb}>{breadcrumb}</div>}
      <div className={styles.row}>
        <h1 className={styles.title}>{title}</h1>
        {actions != null && <div className={styles.actions}>{actions}</div>}
      </div>
      {description != null && <p className={styles.description}>{description}</p>}
    </header>
  )
}
