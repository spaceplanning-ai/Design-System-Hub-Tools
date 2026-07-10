import styles from './Radio.module.css'

export type RadioOption = {
  value: string
  label: string
  disabled?: boolean
}

export type RadioProps = {
  options: RadioOption[]
  value: string
  onChange?: (value: string) => void
  name: string
  direction?: 'row' | 'column'
}

export function Radio({ options, value, onChange, name, direction = 'row' }: RadioProps) {
  const groupClassName = [styles.group, styles[direction]].join(' ')

  return (
    <div className={groupClassName} role="radiogroup">
      {options.map((option) => {
        const itemClassName = [styles.item, option.disabled ? styles.disabled : '']
          .filter(Boolean)
          .join(' ')

        return (
          <label key={option.value} className={itemClassName}>
            <input
              type="radio"
              className={styles.input}
              name={name}
              value={option.value}
              checked={value === option.value}
              disabled={option.disabled}
              onChange={() => onChange?.(option.value)}
            />
            <span className={styles.circle} aria-hidden="true" />
            <span className={styles.label}>{option.label}</span>
          </label>
        )
      })}
    </div>
  )
}
