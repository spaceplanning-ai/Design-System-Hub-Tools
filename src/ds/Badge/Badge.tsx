import styles from './Badge.module.css'

export type BadgeProps = {
  variant: 'primary' | 'secondary' | 'error' | 'success' | 'warning'
  label: string
  size: 'sm' | 'md'
}

export function Badge({ variant, label, size }: BadgeProps) {
  return <span className={[styles.badge, styles[variant], styles[size]].join(' ')}>{label}</span>
}
