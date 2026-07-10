import { useEffect } from 'react'
import styles from './ActionSheet.module.css'

export type ActionSheetAction = {
  label: string
  onSelect?: () => void
  danger?: boolean
  disabled?: boolean
}

export type ActionSheetProps = {
  open: boolean
  onClose?: () => void
  title?: string
  actions: ActionSheetAction[]
  cancelLabel?: string
  /** 문서/데모용 인라인 렌더 — fixed 오버레이 없이 정적 배치 */
  inline?: boolean
}

export function ActionSheet({
  open,
  onClose,
  title,
  actions,
  cancelLabel = '취소',
  inline = false,
}: ActionSheetProps) {
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
      aria-label={title ?? cancelLabel}
      className={[styles.sheet, inline ? styles.inlinePanel : ''].filter(Boolean).join(' ')}
      onClick={(event) => event.stopPropagation()}
    >
      <div className={styles.group}>
        {title != null && <div className={styles.groupTitle}>{title}</div>}
        {actions.map((action, index) => (
          <button
            key={`${index}-${action.label}`}
            type="button"
            className={[styles.action, action.danger ? styles.danger : '']
              .filter(Boolean)
              .join(' ')}
            disabled={action.disabled}
            onClick={() => {
              action.onSelect?.()
              onClose?.()
            }}
          >
            {action.label}
          </button>
        ))}
      </div>
      <button type="button" className={styles.cancel} onClick={onClose}>
        {cancelLabel}
      </button>
    </div>
  )

  if (inline) return sheet

  return (
    <div className={styles.backdrop} onClick={onClose}>
      {sheet}
    </div>
  )
}
