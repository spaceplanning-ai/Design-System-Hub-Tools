import styles from './YouTube.module.css'

export type YouTubeProps = {
  id?: string
  title?: string
}

export function YouTube({ id = 'dQw4w9WgXcQ', title = 'YouTube video' }: YouTubeProps) {
  return (
    <div className={styles.wrapper}>
      <iframe
        className={styles.frame}
        src={`https://www.youtube-nocookie.com/embed/${id}`}
        title={title}
        allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}
