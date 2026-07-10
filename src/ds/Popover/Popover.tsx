import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import styles from './Popover.module.css'

export type PopoverProps = {
  open: boolean
  onOpenChange?: (open: boolean) => void
  trigger: ReactNode
  title?: string
  children: ReactNode
  placement?: 'bottom-start' | 'bottom-end'
  showArrow?: boolean
}

export function Popover({
  open,
  onOpenChange,
  trigger,
  title,
  children,
  placement = 'bottom-start',
  showArrow = false,
}: PopoverProps) {
  const rootRef = useRef<HTMLSpanElement>(null)

  // 외부 클릭 / Escape 닫기
  useEffect(() => {
    if (!open) return

    const handleMouseDown = (event: MouseEvent) => {
      const root = rootRef.current
      if (root != null && event.target instanceof Node && !root.contains(event.target)) {
        onOpenChange?.(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange?.(false)
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onOpenChange])

  const panelClassName = [
    styles.panel,
    placement === 'bottom-end' ? styles.bottomEnd : styles.bottomStart,
  ].join(' ')

  return (
    <span ref={rootRef} className={styles.wrapper}>
      <span className={styles.trigger} onClick={() => onOpenChange?.(!open)}>
        {trigger}
      </span>
      {open && (
        <div role="dialog" className={panelClassName}>
          {showArrow && <span className={styles.arrow} aria-hidden="true" />}
          {title != null && <div className={styles.title}>{title}</div>}
          <div className={styles.body}>{children}</div>
        </div>
      )}
    </span>
  )
}
