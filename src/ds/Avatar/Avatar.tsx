import styles from './Avatar.module.css'

export type AvatarProps = {
  name: string
  src?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  shape?: 'circle' | 'rounded'
  status?: 'online' | 'offline' | 'busy'
}

// 한글이면 첫 글자, 영문이면 단어별 첫 글자 2개
function getInitials(name: string): string {
  const trimmed = name.trim()
  if (trimmed.length === 0) return '?'
  const first = trimmed.charAt(0)
  if (/[가-힣]/.test(first)) return first
  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
}

type Tone = 'primary' | 'secondary' | 'success' | 'warning'

// 이름 해시 기반 배경 톤 결정
function getTone(name: string): Tone {
  let hash = 0
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) % 9973
  switch (hash % 4) {
    case 0:
      return 'primary'
    case 1:
      return 'secondary'
    case 2:
      return 'success'
    default:
      return 'warning'
  }
}

export function Avatar({ name, src, size = 'md', shape = 'circle', status }: AvatarProps) {
  const className = [
    styles.avatar,
    styles[size],
    styles[shape],
    src == null ? styles[getTone(name)] : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={className} role="img" aria-label={name}>
      {src != null ? (
        <img className={styles.image} src={src} alt="" />
      ) : (
        <span className={styles.initials} aria-hidden="true">
          {getInitials(name)}
        </span>
      )}
      {status != null && (
        <span className={[styles.status, styles[status]].join(' ')} aria-hidden="true" />
      )}
    </span>
  )
}
