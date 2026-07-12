import styles from './Divider.module.css'

export type DividerProps = {
  /** 가운데 라벨(예: '또는'). 없으면 단순 선. */
  label?: string
}

export function Divider({ label }: DividerProps) {
  if (!label) return <hr className={styles.line} />
  return (
    <div className={styles.wrap} role="separator" aria-label={label}>
      <span className={styles.rule} />
      <span className={styles.label}>{label}</span>
      <span className={styles.rule} />
    </div>
  )
}
