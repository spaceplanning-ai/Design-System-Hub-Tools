import styles from './Timeline.module.css'

export type TimelineItem = {
  id: string
  title: string
  description?: string
  time?: string
  status?: 'done' | 'active' | 'pending'
}

export type TimelineProps = {
  items: TimelineItem[]
}

export function Timeline({ items }: TimelineProps) {
  return (
    <ol className={styles.timeline}>
      {items.map((item) => {
        const status = item.status ?? 'pending'
        return (
          <li key={item.id} className={[styles.item, styles[status]].join(' ')}>
            <span className={styles.dot} aria-hidden="true">
              {status === 'done' && (
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2.5 6.5L5 9L9.5 3.5" />
                </svg>
              )}
            </span>
            <div className={styles.content}>
              <div className={styles.head}>
                <span className={styles.title}>{item.title}</span>
                {item.time != null && <span className={styles.time}>{item.time}</span>}
              </div>
              {item.description != null && <p className={styles.description}>{item.description}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
