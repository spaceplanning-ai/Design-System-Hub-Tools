import styles from './KrStepIndicator.module.css'

// 진행 단계 표시 — §9 본인인증 플로우 공용 헤더.
// 완료 단계는 체크, 현재 단계는 강조, 이후 단계는 뮤트. (프리미티브 아님, KR 내부 공용)

export type KrStepIndicatorProps = {
  steps: string[]
  /** 0-based 현재 단계 인덱스 */
  current: number
}

export function KrStepIndicator({ steps, current }: KrStepIndicatorProps) {
  return (
    <ol className={styles.list} aria-label="진행 단계">
      {steps.map((label, index) => {
        const done = index < current
        const active = index === current
        const state = done ? styles.done : active ? styles.active : styles.upcoming
        return (
          <li
            key={label}
            className={[styles.step, state].filter(Boolean).join(' ')}
            aria-current={active ? 'step' : undefined}
          >
            <span className={styles.marker} aria-hidden="true">
              {done ? (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2.5 6.5l2.4 2.4 4.6-5" />
                </svg>
              ) : (
                index + 1
              )}
            </span>
            <span className={styles.stepLabel}>{label}</span>
          </li>
        )
      })}
    </ol>
  )
}
