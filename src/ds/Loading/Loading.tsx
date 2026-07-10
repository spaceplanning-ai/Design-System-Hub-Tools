import styles from './Loading.module.css'

export type LoadingProps = {
  variant?: 'spinner' | 'dots'
  size?: 'sm' | 'md' | 'lg'
  /** 인디케이터 아래에 표시할 텍스트 */
  label?: string
  /** true면 부모를 덮는 반투명 오버레이로 중앙 배치 — 부모에 position: relative가 필요하다 */
  overlay?: boolean
}

export function Loading({ variant = 'spinner', size = 'md', label, overlay = false }: LoadingProps) {
  const className = [styles.loading, styles[size], overlay ? styles.overlay : '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={className} role="status" aria-label={label ?? '로딩 중'}>
      {variant === 'spinner' ? (
        <svg className={styles.spinner} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="47.1"
            strokeDashoffset="14"
          />
        </svg>
      ) : (
        <span className={styles.dots} aria-hidden="true">
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </span>
      )}
      {label != null && label !== '' && <span className={styles.label}>{label}</span>}
    </div>
  )
}
