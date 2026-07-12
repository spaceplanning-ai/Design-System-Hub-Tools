import styles from './Video.module.css'

export type VideoProps = {
  src?: string
  poster?: string
  title?: string
}

export function Video({ src, poster, title }: VideoProps) {
  return (
    <figure className={styles.video}>
      <div className={styles.frame}>
        {src ? (
          <video className={styles.player} controls poster={poster}>
            <source src={src} />
          </video>
        ) : (
          <div className={styles.placeholder} role="img" aria-label={title ?? 'Video preview'}>
            <button type="button" className={styles.playButton} aria-label="Play video">
              <svg
                className={styles.playIcon}
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        )}
      </div>
      {title && <figcaption className={styles.caption}>{title}</figcaption>}
    </figure>
  )
}
