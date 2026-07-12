import styles from './Progress.module.css'

export type ProgressProps = {
  /** 0–100 */
  value: number
  label?: string
}

export function Progress({ value, label }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className={styles.wrap}>
      {label && (
        <div className={styles.meta}>
          <span className={styles.label}>{label}</span>
          <span className={styles.value}>{pct}%</span>
        </div>
      )}
      <div className={styles.track} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
