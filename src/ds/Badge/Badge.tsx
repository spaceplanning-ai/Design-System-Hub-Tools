import styles from './Badge.module.css'

export type BadgeProps = {
  variant: 'primary' | 'secondary' | 'error' | 'success' | 'warning'
  appearance?: 'solid' | 'soft' | 'outline'
  label: string
  size: 'sm' | 'md'
}

export function Badge({ variant, appearance = 'soft', label, size }: BadgeProps) {
  return <span className={[styles.badge, styles[variant], styles[appearance], styles[size]].join(' ')}>{label}</span>
}
