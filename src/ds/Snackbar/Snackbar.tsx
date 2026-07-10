import { useEffect } from 'react'
import styles from './Snackbar.module.css'

export type SnackbarProps = {
  open: boolean
  message: string
  variant?: 'default' | 'success' | 'error'
  actionLabel?: string
  onAction?: () => void
  onClose?: () => void
  /** 자동 닫힘까지의 시간(ms). open이 true가 되면 타이머 종료 후 onClose가 호출된다. */
  duration?: number
  showClose?: boolean
  /** 문서/데모용 인라인 렌더 — fixed 대신 정적 배치 */
  inline?: boolean
}

function SuccessIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 7.5l2.8 2.8 5.2-6" />
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <rect x="6.1" y="2.5" width="1.8" height="5.5" rx="0.9" />
      <circle cx="7" cy="10.5" r="1.1" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" />
    </svg>
  )
}

export function Snackbar({
  open,
  message,
  variant = 'default',
  actionLabel,
  onAction,
  onClose,
  duration = 3000,
  showClose = false,
  inline = false,
}: SnackbarProps) {
  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => onClose?.(), duration)
    return () => window.clearTimeout(timer)
  }, [open, duration, onClose])

  if (!open) return null

  const className = [
    styles.snackbar,
    variant === 'success' ? styles.success : '',
    variant === 'error' ? styles.error : '',
    inline ? styles.inline : styles.fixed,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={className} role={variant === 'error' ? 'alert' : 'status'}>
      {variant !== 'default' && (
        <span className={styles.icon}>
          {variant === 'success' ? <SuccessIcon /> : <ErrorIcon />}
        </span>
      )}
      <span className={styles.message}>{message}</span>
      {actionLabel != null && (
        <button type="button" className={styles.action} onClick={onAction}>
          {actionLabel}
        </button>
      )}
      {showClose && (
        <button type="button" className={styles.close} aria-label="닫기" onClick={onClose}>
          <CloseIcon />
        </button>
      )}
    </div>
  )
}
