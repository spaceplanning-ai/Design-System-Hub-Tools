import styles from './Statistics.module.css'

export type StatItem = {
  label: string
  value: string
  /** 증감 % — 양수 success ▲, 음수 error ▼ */
  delta?: number
  hint?: string
}

export type StatisticsProps = {
  items: StatItem[]
  columns?: 2 | 3 | 4
}

function formatDelta(delta: number): string {
  return `${delta > 0 ? '+' : ''}${delta}%`
}

function deltaClass(delta: number): string {
  if (delta > 0) return styles.up
  if (delta < 0) return styles.down
  return styles.flat
}

export function Statistics({ items, columns = 3 }: StatisticsProps) {
  return (
    <div className={[styles.statistics, styles[`cols${columns}`]].join(' ')}>
      {items.map((item) => (
        <div key={item.label} className={styles.card}>
          <span className={styles.label}>{item.label}</span>
          <strong className={styles.value}>{item.value}</strong>
          {(item.delta != null || item.hint != null) && (
            <div className={styles.meta}>
              {item.delta != null && (
                <span className={[styles.delta, deltaClass(item.delta)].join(' ')}>
                  {item.delta !== 0 && (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" aria-hidden="true">
                      {item.delta > 0 ? <path d="M4 1L7.5 7H0.5Z" /> : <path d="M4 7L0.5 1H7.5Z" />}
                    </svg>
                  )}
                  {formatDelta(item.delta)}
                </span>
              )}
              {item.hint != null && <span className={styles.hint}>{item.hint}</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
