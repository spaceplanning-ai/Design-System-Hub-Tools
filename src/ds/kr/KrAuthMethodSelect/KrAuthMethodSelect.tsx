import { useRef } from 'react'
import type { KeyboardEvent } from 'react'
import './brand.css'
import styles from './KrAuthMethodSelect.module.css'

// 본인인증 수단 선택 (§9) — 카드형 선택 리스트. 라디오그룹 시맨틱 + 방향키 이동.

export type AuthMethodId = 'pass' | 'kakao' | 'naver' | 'joint' | 'finance'

export type AuthMethod = {
  id: string
  label: string
  description: string
}

export const AUTH_METHODS: AuthMethod[] = [
  { id: 'pass', label: '휴대폰(PASS)', description: '가장 빠르게 인증' },
  { id: 'kakao', label: '카카오 인증', description: '카카오톡으로 인증' },
  { id: 'naver', label: '네이버 인증', description: '네이버 앱으로 인증' },
  { id: 'joint', label: '공동인증서', description: '기존 공인인증서로 인증' },
  { id: 'finance', label: '금융인증서', description: '금융결제원 인증서로 인증' },
]

export type KrAuthMethodSelectProps = {
  value: string
  onChange?: (value: string) => void
  disabled?: boolean
  methods?: AuthMethod[]
}

// 제공사 마크 — 카카오/네이버는 브랜드 규정색, 나머지는 뉴트럴 배지
function Mark({ id }: { id: string }) {
  if (id === 'kakao') {
    return (
      <span className={[styles.mark, styles.markKakao].join(' ')} aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4C7 4 3 7.13 3 11c0 2.47 1.66 4.64 4.16 5.88-.18.63-.66 2.3-.76 2.66-.12.45.16.44.35.32.15-.1 2.4-1.63 3.37-2.29.62.09 1.25.13 1.88.13 5 0 9-3.13 9-7s-4-7-9-7z" />
        </svg>
      </span>
    )
  }
  if (id === 'naver') {
    return (
      <span className={[styles.mark, styles.markNaver].join(' ')} aria-hidden="true">
        N
      </span>
    )
  }
  return (
    <span className={[styles.mark, styles.markNeutral].join(' ')} aria-hidden="true">
      {id === 'pass' ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="7" y="2" width="10" height="20" rx="2" />
          <path d="M11 18h2" />
        </svg>
      ) : id === 'finance' ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18M4 10h16M5 10l7-6 7 6M6 10v11M18 10v11M10 10v11M14 10v11" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 8h8M8 12h8M8 16h4" />
        </svg>
      )}
    </span>
  )
}

export function KrAuthMethodSelect({
  value,
  onChange,
  disabled = false,
  methods = AUTH_METHODS,
}: KrAuthMethodSelectProps) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})

  const selectedIndex = methods.findIndex((m) => m.id === value)
  const rovingIndex = selectedIndex >= 0 ? selectedIndex : 0

  // 방향키로 선택 이동 (라디오 그룹 관례)
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return
    const forward = event.key === 'ArrowDown' || event.key === 'ArrowRight'
    const backward = event.key === 'ArrowUp' || event.key === 'ArrowLeft'
    if (!forward && !backward) return
    const n = methods.length
    const from = selectedIndex >= 0 ? selectedIndex : 0
    const next = methods[(from + (forward ? 1 : -1) + n) % n]
    onChange?.(next.id)
    refs.current[next.id]?.focus()
    event.preventDefault()
  }

  return (
    <div
      role="radiogroup"
      aria-label="본인인증 수단 선택"
      className={styles.group}
      onKeyDown={handleKeyDown}
    >
      {methods.map((method, index) => {
        const selected = method.id === value
        return (
          <button
            key={method.id}
            ref={(el) => {
              refs.current[method.id] = el
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={index === rovingIndex ? 0 : -1}
            disabled={disabled}
            className={[styles.row, selected ? styles.selected : ''].filter(Boolean).join(' ')}
            onClick={() => onChange?.(method.id)}
          >
            <Mark id={method.id} />
            <span className={styles.body}>
              <span className={styles.label}>{method.label}</span>
              <span className={styles.desc}>{method.description}</span>
            </span>
            <svg
              className={styles.check}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </button>
        )
      })}
    </div>
  )
}
