import styles from './ProfileCard.module.css'

export function ProfileCard() {
  return (
    <div className={styles.card}>
      <div className={styles.avatar} />
      <p className={styles.name}>Jane Doe</p>
      <p className={styles.role}>Designer</p>
      <button type="button" className={styles.button}>
        Follow
      </button>
    </div>
  )
}
