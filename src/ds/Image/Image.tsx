import styles from './Image.module.css'

export type ImageProps = {
  src?: string
  alt?: string
  ratio?: '1x1' | '4x3' | '16x9'
  rounded?: boolean
}

const ratioClass: Record<NonNullable<ImageProps['ratio']>, string> = {
  '1x1': styles.ratio1x1,
  '4x3': styles.ratio4x3,
  '16x9': styles.ratio16x9,
}

export function Image({ src, alt = '', ratio = '16x9', rounded = false }: ImageProps) {
  const className = [styles.frame, ratioClass[ratio], rounded ? styles.rounded : '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={className}>
      {src ? (
        <img className={styles.img} src={src} alt={alt} />
      ) : (
        <div className={styles.placeholder} role="img" aria-label={alt || 'Image placeholder'}>
          <svg
            className={styles.icon}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="8.5" cy="9.5" r="1.75" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M4 17l4.5-4.5a1.5 1.5 0 012 0l3 3 2-2a1.5 1.5 0 012 0L20 16.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  )
}
