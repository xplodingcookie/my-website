import styles from './MeBlock.module.css'
import Image from 'next/image'

export default function MeBlock() {
  return (
    <div className={styles.meBlock}>
      <div className={styles.bgShapes}>
        {[...Array(10)].map((_, i) => (
          <div key={i} className={`${styles.shape} ${styles[`shape${i + 1}`]}`}></div>
        ))}
      </div>
      <h2 className={styles.meTitle}>me</h2>
      <div className={styles.meCharacter}>
        <Image 
          src="/pfp.png" 
          alt="Character" 
          width={200}
          height={200}
          className={styles.characterImage}
        />
      </div>
    </div>
  )
}