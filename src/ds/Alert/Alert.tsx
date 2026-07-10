import styles from './Alert.module.css'

export type AlertProps = {
  variant: 'error' | 'success'
  label: string
  showIcon?: boolean
}

function AlertIcon({ variant }: { variant: AlertProps['variant'] }) {
  if (variant === 'success') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1.2 14.6l-4.2-4.2 1.4-1.4 2.8 2.8 5.8-5.8 1.4 1.4-7.2 7.2z" />
      </svg>
    )
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1 5h2v6h-2V7zm0 8h2v2h-2v-2z" />
    </svg>
  )
}

export function Alert({ variant, label, showIcon = false }: AlertProps) {
  return (
    <div className={[styles.alert, styles[variant]].join(' ')} role="alert">
      {showIcon && (
        <span className={styles.icon}>
          <AlertIcon variant={variant} />
        </span>
      )}
      <span className={styles.label}>{label}</span>
    </div>
  )
}
