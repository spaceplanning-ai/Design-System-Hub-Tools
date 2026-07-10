import { useEffect, useState } from 'react'
import styles from './Dialog.module.css'
import { Button } from '../Button/Button'

export type DialogProps = {
  open: boolean
  variant: 'alert' | 'confirm' | 'prompt'
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: (value?: string) => void
  onCancel?: () => void
  /** true면 확인 버튼을 error 색상으로 */
  danger?: boolean
  /** prompt 입력창 플레이스홀더 */
  placeholder?: string
  /** 문서/데모용 인라인 렌더 — fixed 오버레이 없이 정적 배치 */
  inline?: boolean
}

export function Dialog({
  open,
  variant,
  title,
  description,
  confirmLabel = '확인',
  cancelLabel = '취소',
  onConfirm,
  onCancel,
  danger = false,
  placeholder,
  inline = false,
}: DialogProps) {
  const [inputValue, setInputValue] = useState('')

  // 다시 열릴 때 prompt 입력값 초기화
  useEffect(() => {
    if (open) setInputValue('')
  }, [open])

  useEffect(() => {
    if (!open || inline) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel?.()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, inline, onCancel])

  if (!open) return null

  const handleConfirm = () => {
    onConfirm?.(variant === 'prompt' ? inputValue : undefined)
  }

  const panel = (
    <div
      role="dialog"
      aria-modal={!inline}
      aria-label={title}
      className={[styles.panel, inline ? styles.inlinePanel : ''].filter(Boolean).join(' ')}
      onClick={(event) => event.stopPropagation()}
    >
      <h2 className={styles.title}>{title}</h2>
      {description != null && <p className={styles.description}>{description}</p>}
      {variant === 'prompt' && (
        <input
          type="text"
          className={styles.input}
          value={inputValue}
          placeholder={placeholder}
          onChange={(event) => setInputValue(event.target.value)}
        />
      )}
      <div className={styles.actions}>
        {variant !== 'alert' && (
          <Button variant="secondary" size="md" label={cancelLabel} onClick={onCancel} />
        )}
        <Button
          variant={danger ? 'error' : 'primary'}
          size="md"
          label={confirmLabel}
          onClick={handleConfirm}
        />
      </div>
    </div>
  )

  if (inline) return panel

  return (
    <div className={styles.backdrop} onClick={onCancel}>
      {panel}
    </div>
  )
}
