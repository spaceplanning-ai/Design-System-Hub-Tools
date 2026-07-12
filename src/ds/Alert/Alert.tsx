import styles from './Alert.module.css'

export type AlertProps = {
  variant: 'info' | 'success' | 'warning' | 'error'
  label: string
  showIcon?: boolean
}

// 톤별 24그리드 아이콘(원형: info/success/error, 삼각형: warning). evenodd로 기호를 구멍 처리.
const ICON_PATH: Record<AlertProps['variant'], string> = {
  info: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 5h-2v2h2V7zm0 4h-2v6h2v-6z',
  success: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1.2 14.6l-4.2-4.2 1.4-1.4 2.8 2.8 5.8-5.8 1.4 1.4-7.2 7.2z',
  warning: 'M12 2 1 21h22L12 2zm-1 6h2v6h-2V8zm0 8h2v2h-2v-2z',
  error: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1 5h2v6h-2V7zm0 8h2v2h-2v-2z',
}

function AlertIcon({ variant }: { variant: AlertProps['variant'] }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" aria-hidden="true">
      <path d={ICON_PATH[variant] ?? ICON_PATH.info} />
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
