import type { ReactNode } from 'react'
import styles from './EmptyState.module.css'
import { Button } from '../Button/Button'

export type EmptyStateProps = {
  title: string
  description?: string
  /** 기본: 인라인 inbox 아이콘 */
  icon?: ReactNode
  actionLabel?: string
  onAction?: () => void
  /** 패딩/아이콘 축소 */
  compact?: boolean
}

function InboxIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  )
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  compact = false,
}: EmptyStateProps) {
  const className = [styles.emptyState, compact ? styles.compact : ''].filter(Boolean).join(' ')

  return (
    <div className={className}>
      <span className={styles.icon} aria-hidden="true">
        {icon ?? <InboxIcon />}
      </span>
      <span className={styles.title}>{title}</span>
      {description != null && <span className={styles.description}>{description}</span>}
      {actionLabel != null && (
        <span className={styles.action}>
          <Button variant="primary" size="sm" label={actionLabel} onClick={onAction} />
        </span>
      )}
    </div>
  )
}
