import { useEffect } from 'react'
import type { ReactNode } from 'react'
import styles from './Drawer.module.css'

export type DrawerProps = {
  open: boolean
  onClose?: () => void
  title?: string
  children: ReactNode
  side?: 'left' | 'right'
  width?: number
  /** 문서/데모용 정적 렌더 — 백드롭·고정 위치 없이 흐름 안에 렌더 */
  inline?: boolean
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  side = 'right',
  width = 320,
  inline = false,
}: DrawerProps) {
  // Escape 닫기 — 오버레이 모드에서만
  useEffect(() => {
    if (!open || inline) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, inline, onClose])

  if (!open) return null

  const panel = (
    <div
      role="dialog"
      aria-modal={inline ? undefined : true}
      aria-label={title}
      className={[styles.panel, styles[side], inline ? styles.inline : '']
        .filter(Boolean)
        .join(' ')}
      style={{ width }}
    >
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <button type="button" className={styles.close} aria-label="닫기" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  )

  if (inline) return panel

  return (
    <div className={styles.root}>
      <div className={styles.backdrop} onClick={onClose} />
      {panel}
    </div>
  )
}
