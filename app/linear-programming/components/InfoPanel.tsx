import styles from '../LinearProgramming.module.css';

type Props = {
  point: number[];
  objective: number[];
  iter: number;
};

const InfoPanel = ({ point, objective, iter }: Props) => {
  const objectiveVal = (objective[0] * point[0] + objective[1] * point[1]).toFixed(2);

  return (
    <div className={styles.infoCard}>
      <h2 className={styles.cardHeader}>
        <div className={styles.statusDot}></div>
        Current State
      </h2>
      <div className={styles.infoItems}>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Point:</span>
          <span className={`${styles.infoValue} ${styles.infoValueBlue}`}>
            ({point[0].toFixed(2)}, {point[1].toFixed(2)})
          </span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Objective:</span>
          <span className={`${styles.infoValue} ${styles.infoValuePurple}`}>
            {objectiveVal}
          </span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Iteration:</span>
          <span className={`${styles.infoValue} ${styles.infoValueAmber}`}>{iter}</span>
        </div>
      </div>
    </div>
  )
}

export default InfoPanel