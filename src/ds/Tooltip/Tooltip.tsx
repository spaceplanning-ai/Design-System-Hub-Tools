import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import styles from './Tooltip.module.css'

export type TooltipProps = {
  content: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  /** 트리거 — 키보드 접근을 위해 포커스 가능한 요소(버튼 등)를 권장 */
  children: ReactNode
  /** 마우스 진입 후 표시까지의 지연(ms) */
  delay?: number
  /** 문서용: 호버 없이 항상 표시 */
  alwaysVisible?: boolean
}

export function Tooltip({
  content,
  placement = 'top',
  children,
  delay = 150,
  alwaysVisible = false,
}: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<number | null>(null)

  const clearTimer = () => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  // 언마운트 시 대기 중인 타이머 정리
  useEffect(() => clearTimer, [])

  const showAfterDelay = () => {
    clearTimer()
    timerRef.current = window.setTimeout(() => setVisible(true), delay)
  }

  const showNow = () => {
    clearTimer()
    setVisible(true)
  }

  const hide = () => {
    clearTimer()
    setVisible(false)
  }

  return (
    <span
      className={styles.wrapper}
      onMouseEnter={showAfterDelay}
      onMouseLeave={hide}
      onFocus={showNow}
      onBlur={hide}
    >
      {children}
      {(visible || alwaysVisible) && (
        <span role="tooltip" className={[styles.bubble, styles[placement]].join(' ')}>
          {content}
          <span className={styles.arrow} aria-hidden="true" />
        </span>
      )}
    </span>
  )
}
