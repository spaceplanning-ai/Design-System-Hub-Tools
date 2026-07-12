import styles from './ImageCard.module.css'

export type ImageCardProps = {
  image?: string
  title: string
  description?: string
  ratio?: '4x3' | '16x9'
}

export function ImageCard({
  image,
  title = '이미지 카드',
  description,
  ratio = '16x9',
}: ImageCardProps) {
  const mediaClassName = `${styles.media} ${
    ratio === '4x3' ? styles.ratio4x3 : styles.ratio16x9
  }`

  return (
    <div className={styles.card}>
      <div className={mediaClassName}>
        {image ? (
          <img className={styles.image} src={image} alt={title} />
        ) : (
          <div className={styles.placeholder} aria-hidden="true" />
        )}
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>{title}</h3>
        {description && <p className={styles.description}>{description}</p>}
      </div>
    </div>
  )
}
