import styles from './Breadcrumb.module.css'

export type BreadcrumbItem = {
  label: string
  href?: string
}

type DisplayItem = BreadcrumbItem | { ellipsis: true }

export type BreadcrumbProps = {
  items: BreadcrumbItem[]
  separator?: string
  /** 초과 시 가운데 '…' 축약 — 첫 항목 + … + 마지막 2개 */
  maxItems?: number
}

export function Breadcrumb({ items, separator = '/', maxItems }: BreadcrumbProps) {
  const collapsed = maxItems != null && items.length > maxItems
  const display: DisplayItem[] = collapsed
    ? [items[0], { ellipsis: true }, ...items.slice(-2)]
    : items

  return (
    <nav className={styles.breadcrumb} aria-label="경로">
      <ol className={styles.list}>
        {display.map((item, index) => {
          const last = index === display.length - 1
          return (
            <li key={index} className={styles.entry}>
              {'ellipsis' in item ? (
                <span className={styles.ellipsis} aria-hidden="true">
                  …
                </span>
              ) : last ? (
                <span className={styles.current} aria-current="page">
                  {item.label}
                </span>
              ) : item.href != null ? (
                <a className={styles.link} href={item.href}>
                  {item.label}
                </a>
              ) : (
                <span className={styles.link}>{item.label}</span>
              )}
              {!last && (
                <span className={styles.separator} aria-hidden="true">
                  {separator}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
