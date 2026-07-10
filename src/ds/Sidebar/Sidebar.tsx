import styles from './Sidebar.module.css'
import { Badge } from '../Badge/Badge'

export type SidebarItem = {
  label: string
  value: string
  badge?: string
  disabled?: boolean
}

export type SidebarSection = {
  title?: string
  items: SidebarItem[]
}

export type SidebarProps = {
  sections: SidebarSection[]
  value: string
  onChange?: (value: string) => void
  width?: number
}

export function Sidebar({ sections, value, onChange, width = 240 }: SidebarProps) {
  return (
    <nav className={styles.sidebar} style={{ width }}>
      {sections.map((section, index) => (
        <div key={section.title ?? index} className={styles.section}>
          {section.title != null && <div className={styles.sectionTitle}>{section.title}</div>}
          {section.items.map((item) => {
            const active = item.value === value
            return (
              <button
                key={item.value}
                type="button"
                aria-current={active ? 'page' : undefined}
                disabled={item.disabled}
                className={[styles.item, active ? styles.active : ''].filter(Boolean).join(' ')}
                onClick={() => onChange?.(item.value)}
              >
                <span className={styles.label}>{item.label}</span>
                {item.badge != null && <Badge variant="primary" size="sm" label={item.badge} />}
              </button>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
