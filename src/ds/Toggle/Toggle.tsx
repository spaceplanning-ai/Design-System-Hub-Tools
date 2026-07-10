import styles from './Toggle.module.css'

export type ToggleProps = {
  checked: boolean
  onChange?: (checked: boolean) => void
  size?: 'sm' | 'md'
  disabled?: boolean
  label?: string
}

export function Toggle({ checked, onChange, size = 'md', disabled = false, label }: ToggleProps) {
  const className = [styles.toggle, styles[size], disabled ? styles.disabled : '']
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={className}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
    >
      <span className={styles.track}>
        <span className={styles.knob} />
      </span>
      {label != null && <span className={styles.label}>{label}</span>}
    </button>
  )
}
