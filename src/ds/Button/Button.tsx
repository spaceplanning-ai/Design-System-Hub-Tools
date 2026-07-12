import type { ReactNode } from 'react'
import styles from './Button.module.css'

export type ButtonProps = {
  variant: 'primary' | 'secondary' | 'error' | 'success' | 'warning'
  appearance?: 'solid' | 'outline' | 'ghost'
  size: 'sm' | 'md' | 'lg'
  disabled?: boolean
  label: string
  showIcon?: boolean
  icon?: ReactNode
  // 함수 타입은 §3 매핑 파서(scripts/lib/ds-props.mjs)가 무시하므로 Figma 매니페스트
  // 왕복 동일성에 영향이 없다. 반면 문자열 유니온 prop(예: type: 'button'|'submit')을
  // 추가하면 variant 축으로 잡혀 매니페스트가 깨진다 — 추가 금지.
  onClick?: () => void
}

export function Button({
  variant,
  appearance = 'solid',
  size,
  disabled = false,
  label,
  showIcon = false,
  icon,
  onClick,
}: ButtonProps) {
  const className = [styles.button, styles[variant], styles[appearance], styles[size], disabled ? styles.disabled : '']
    .filter(Boolean)
    .join(' ')

  return (
    <button type="button" className={className} disabled={disabled} onClick={onClick}>
      {showIcon && icon != null && <span className={styles.icon}>{icon}</span>}
      {label}
    </button>
  )
}
