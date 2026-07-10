import styles from './Toast.module.css'

export type ToastProps = {
  tone: 'success' | 'info' | 'warning' | 'error'
  message: string
  onClose?: () => void
  showIcon?: boolean
}

function ToneIcon({ tone }: { tone: ToastProps['tone'] }) {
  if (tone === 'success') {
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M2.5 6.5l2.4 2.4 4.6-5" />
      </svg>
    )
  }
  if (tone === 'info') {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
        <circle cx="6" cy="3" r="1" />
        <rect x="5.2" y="5" width="1.6" height="4.5" rx="0.8" />
      </svg>
    )
  }
  if (tone === 'warning') {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
        <rect x="5.2" y="2.5" width="1.6" height="4.5" rx="0.8" />
        <circle cx="6" cy="9" r="1" />
      </svg>
    )
  }
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M3.5 3.5l5 5M8.5 3.5l-5 5" />
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

export function Toast({ tone, message, onClose, showIcon = true }: ToastProps) {
  return (
    <div
      className={[styles.toast, styles[tone]].join(' ')}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {showIcon && (
        <span className={styles.iconCircle}>
          <ToneIcon tone={tone} />
        </span>
      )}
      <span className={styles.message}>{message}</span>
      <button type="button" className={styles.close} aria-label="닫기" onClick={onClose}>
        <CloseIcon />
      </button>
    </div>
  )
}
