import type { ReactNode } from 'react'
import styles from './Chip.module.css'

export type ChipProps = {
  label: string
  selected?: boolean
  onSelect?: () => void
  /** 전달하면 우측에 × 제거 버튼이 생긴다 */
  onRemove?: () => void
  disabled?: boolean
  size?: 'sm' | 'md'
  leading?: ReactNode
}

export function Chip({
  label,
  selected = false,
  onSelect,
  onRemove,
  disabled = false,
  size = 'md',
  leading,
}: ChipProps) {
  const className = [
    styles.chip,
    styles[size],
    selected ? styles.selected : '',
    disabled ? styles.disabled : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={className}>
      <button
        type="button"
        className={styles.action}
        onClick={onSelect}
        disabled={disabled}
        aria-pressed={selected}
      >
        {leading != null && (
          <span className={styles.leading} aria-hidden="true">
            {leading}
          </span>
        )}
        <span className={styles.label}>{label}</span>
      </button>
      {onRemove != null && (
        <button
          type="button"
          className={styles.remove}
          onClick={onRemove}
          disabled={disabled}
          aria-label={`${label} 제거`}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          >
            <path d="M2 2L8 8M8 2L2 8" />
          </svg>
        </button>
      )}
    </div>
  )
}
