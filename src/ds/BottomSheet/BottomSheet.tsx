import { useEffect } from 'react'
import type { ReactNode } from 'react'
import styles from './BottomSheet.module.css'

export type BottomSheetProps = {
  open: boolean
  onClose?: () => void
  title?: string
  children: ReactNode
  /** true면 상단 그립바 표시 */
  showHandle?: boolean
  /** 문서/데모용 인라인 렌더 — fixed 오버레이 없이 정적 배치 */
  inline?: boolean
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  showHandle = true,
  inline = false,
}: BottomSheetProps) {
  useEffect(() => {
    if (!open || inline) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, inline, onClose])

  if (!open) return null

  const sheet = (
    <div
      role="dialog"
      aria-modal={!inline}
      aria-label={title}
      className={[styles.sheet, inline ? styles.inlinePanel : ''].filter(Boolean).join(' ')}
      onClick={(event) => event.stopPropagation()}
    >
      {showHandle && <div className={styles.handle} aria-hidden="true" />}
      {title != null && (
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
        </div>
      )}
      <div className={styles.body}>{children}</div>
    </div>
  )

  if (inline) return sheet

  return (
    <div className={styles.backdrop} onClick={onClose}>
      {sheet}
    </div>
  )
}
