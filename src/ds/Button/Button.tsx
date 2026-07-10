import type { ReactNode } from 'react'
import styles from './Button.module.css'

export type ButtonProps = {
  variant: 'primary' | 'secondary' | 'error' | 'success'
  size: 'sm' | 'md' | 'lg'
  disabled?: boolean
  label: string
  showIcon?: boolean
  icon?: ReactNode
}

export function Button({
  variant,
  size,
  disabled = false,
  label,
  showIcon = false,
  icon,
}: ButtonProps) {
  const className = [styles.button, styles[variant], styles[size], disabled ? styles.disabled : '']
    .filter(Boolean)
    .join(' ')

  return (
    <button type="button" className={className} disabled={disabled}>
      {showIcon && icon != null && <span className={styles.icon}>{icon}</span>}
      {label}
    </button>
  )
}
