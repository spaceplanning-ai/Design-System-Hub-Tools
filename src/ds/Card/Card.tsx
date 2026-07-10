import type { ReactNode } from 'react'
import { Button } from '../Button/Button'
import styles from './Card.module.css'

export type CardProps = {
  title: string
  showFooter?: boolean
  children: ReactNode
}

export function Card({ title, showFooter = false, children }: CardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
      </div>
      <div className={styles.body}>{children}</div>
      {showFooter && (
        <div className={styles.footer}>
          <Button variant="primary" size="sm" label="Button" />
        </div>
      )}
    </div>
  )
}
