import { useId, useState } from 'react'
import styles from './TextField.module.css'

export type TextFieldProps = {
  label: string
  placeholder?: string
  error?: boolean
  success?: boolean
  disabled?: boolean
  readOnly?: boolean
  description?: string
  showDescription?: boolean
  helperText?: string
  maxLength?: number
  showCounter?: boolean
}

export function TextField({
  label,
  placeholder,
  error = false,
  success = false,
  disabled = false,
  readOnly = false,
  description,
  showDescription = false,
  helperText,
  maxLength,
  showCounter = false,
}: TextFieldProps) {
  const id = useId()
  const [count, setCount] = useState(0)
  // §8: 초과 입력은 막지 않고 카운터·보더를 error색으로 표시
  const over = maxLength != null && count > maxLength
  const invalid = error || over
  const className = [
    styles.field,
    invalid ? styles.error : '',
    !invalid && success ? styles.success : '',
  ]
    .filter(Boolean)
    .join(' ')
  const hasMeta = (showDescription && description != null) || helperText || showCounter

  return (
    <div className={className}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={styles.input}
        type="text"
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={invalid || undefined}
        onChange={(e) => setCount(e.target.value.length)}
      />
      {hasMeta && (
        <div className={styles.meta}>
          <span className={styles.messages}>
            {showDescription && description != null && (
              <span className={styles.description}>{description}</span>
            )}
            {helperText && <span className={styles.helperText}>{helperText}</span>}
          </span>
          {showCounter && (
            <span className={[styles.counter, over ? styles.counterOver : ''].filter(Boolean).join(' ')}>
              {maxLength != null ? `${count}/${maxLength}자` : `${count}자`}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
