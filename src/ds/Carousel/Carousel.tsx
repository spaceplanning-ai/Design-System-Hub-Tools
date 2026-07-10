import { useState, type ReactNode } from 'react'
import styles from './Carousel.module.css'

export type CarouselProps = {
  slides: ReactNode[]
  /** 컨트롤드로 쓸 때만 전달 */
  index?: number
  onIndexChange?: (i: number) => void
  showDots?: boolean
  showArrows?: boolean
  loop?: boolean
  aspectRatio?: string
}

export function Carousel({
  slides,
  index,
  onIndexChange,
  showDots = true,
  showArrows = true,
  loop = true,
  aspectRatio = '16 / 9',
}: CarouselProps) {
  const [internalIndex, setInternalIndex] = useState(0)
  const count = slides.length
  const rawIndex = index ?? internalIndex
  const current = count > 0 ? Math.min(Math.max(rawIndex, 0), count - 1) : 0

  const goTo = (next: number) => {
    if (count === 0) return
    const target = loop ? (next + count) % count : Math.min(Math.max(next, 0), count - 1)
    if (index == null) setInternalIndex(target)
    onIndexChange?.(target)
  }

  const prevDisabled = !loop && current === 0
  const nextDisabled = !loop && current === count - 1

  return (
    <div className={styles.carousel} role="region" aria-roledescription="carousel" aria-label="캐러셀">
      <div className={styles.viewport} style={{ aspectRatio }}>
        <div className={styles.track} style={{ transform: `translateX(${current * -100}%)` }}>
          {slides.map((slide, i) => (
            <div key={i} className={styles.slide} aria-hidden={i !== current}>
              {slide}
            </div>
          ))}
        </div>
        {showArrows && count > 1 && (
          <>
            <button
              type="button"
              className={[styles.arrow, styles.prev].join(' ')}
              onClick={() => goTo(current - 1)}
              disabled={prevDisabled}
              aria-label="이전 슬라이드"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 3L5 8L10 13" />
              </svg>
            </button>
            <button
              type="button"
              className={[styles.arrow, styles.next].join(' ')}
              onClick={() => goTo(current + 1)}
              disabled={nextDisabled}
              aria-label="다음 슬라이드"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 3L11 8L6 13" />
              </svg>
            </button>
          </>
        )}
      </div>
      {showDots && count > 1 && (
        <div className={styles.dots}>
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              className={[styles.dot, i === current ? styles.dotActive : ''].filter(Boolean).join(' ')}
              onClick={() => goTo(i)}
              aria-label={`${i + 1}번째 슬라이드로 이동`}
              aria-current={i === current}
            />
          ))}
        </div>
      )}
    </div>
  )
}
