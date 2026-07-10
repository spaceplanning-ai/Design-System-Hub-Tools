import { useId } from 'react'
import styles from './TextField.module.css'

export type TextFieldProps = {
  label: string
  placeholder?: string
  error?: boolean
  disabled?: boolean
  description?: string
  showDescription?: boolean
}

export function TextField({
  label,
  placeholder,
  disabled = false,
  error = false,
  description,
  showDescription = false,
}: TextFieldProps) {
  const id = useId()
  const className = [styles.field, error ? styles.error : ''].filter(Boolean).join(' ')

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
      />
      {showDescription && description != null && (
        <span className={styles.description}>{description}</span>
      )}
    </div>
  )
}
