import { useEffect, useRef } from 'react'
import styles from './Checkbox.module.css'

export type CheckboxProps = {
  checked: boolean
  onChange?: (checked: boolean) => void
  label?: string
  disabled?: boolean
  indeterminate?: boolean
}

export function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
  indeterminate = false,
}: CheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // indeterminate는 DOM 프로퍼티로만 설정 가능
  useEffect(() => {
    if (inputRef.current != null) inputRef.current.indeterminate = indeterminate
  }, [indeterminate])

  const className = [styles.checkbox, disabled ? styles.disabled : ''].filter(Boolean).join(' ')

  return (
    <label className={className}>
      <input
        ref={inputRef}
        type="checkbox"
        className={styles.input}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
      />
      <span className={styles.box} aria-hidden="true">
        <svg
          className={styles.check}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 6.5L4.8 9.2L10 3" />
        </svg>
        <svg
          className={styles.bar}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M2.5 6H9.5" />
        </svg>
      </span>
      {label != null && <span className={styles.label}>{label}</span>}
    </label>
  )
}
