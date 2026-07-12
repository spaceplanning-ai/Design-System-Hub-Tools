import { useState } from 'react'
import styles from './ImageSlide.module.css'

export type ImageSlideProps = {
  images?: string[]
}

const PLACEHOLDER_COUNT = 3

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg
      className={styles.chevron}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {dir === 'left' ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
    </svg>
  )
}

export function ImageSlide({ images }: ImageSlideProps) {
  const [index, setIndex] = useState(0)

  const list = images ?? []
  const usePlaceholders = list.length === 0
  const count = usePlaceholders ? PLACEHOLDER_COUNT : list.length

  const go = (next: number) => {
    setIndex((next + count) % count)
  }

  return (
    <div className={styles.root}>
      <div className={styles.viewport}>
        {usePlaceholders ? (
          <div
            className={styles.placeholder}
            data-hue={index % PLACEHOLDER_COUNT}
            role="img"
            aria-label={`Slide ${index + 1}`}
          >
            <span className={styles.placeholderLabel}>{index + 1}</span>
          </div>
        ) : (
          <img className={styles.image} src={list[index]} alt={`Slide ${index + 1}`} />
        )}

        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowLeft}`}
          onClick={() => go(index - 1)}
          aria-label="Previous slide"
        >
          <Chevron dir="left" />
        </button>
        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowRight}`}
          onClick={() => go(index + 1)}
          aria-label="Next slide"
        >
          <Chevron dir="right" />
        </button>
      </div>

      <div className={styles.dots}>
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            type="button"
            className={`${styles.dot} ${i === index ? styles.dotActive : ''}`}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index}
          />
        ))}
      </div>
    </div>
  )
}
