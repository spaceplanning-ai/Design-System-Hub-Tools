import { useEffect } from 'react'
import type { ReactNode } from 'react'
import styles from './Modal.module.css'

export type ModalProps = {
  open: boolean
  onClose?: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  showClose?: boolean
  /** 문서/데모용 인라인 렌더 — fixed 오버레이 없이 정적 배치 */
  inline?: boolean
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

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  showClose = true,
  inline = false,
}: ModalProps) {
  useEffect(() => {
    if (!open || inline) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, inline, onClose])

  if (!open) return null

  const panel = (
    <div
      role="dialog"
      aria-modal={!inline}
      aria-label={title}
      className={[styles.panel, styles[size], inline ? styles.inlinePanel : '']
        .filter(Boolean)
        .join(' ')}
      onClick={(event) => event.stopPropagation()}
    >
      {(title != null || showClose) && (
        <div className={styles.header}>
          {title != null && <h2 className={styles.title}>{title}</h2>}
          {showClose && (
            <button type="button" className={styles.close} aria-label="닫기" onClick={onClose}>
              <CloseIcon />
            </button>
          )}
        </div>
      )}
      <div className={styles.body}>{children}</div>
      {footer != null && <div className={styles.footer}>{footer}</div>}
    </div>
  )

  if (inline) return panel

  return (
    <div className={styles.backdrop} onClick={onClose}>
      {panel}
    </div>
  )
}
