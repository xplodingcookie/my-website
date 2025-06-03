import styles from '../LinearProgramming.module.css';

type Props = {
  constraints: number[][];
};

const ConstraintsList = ({ constraints }: Props) => {
  return (
    <div className={styles.infoCard}>
      <h2 className={styles.cardHeader}>Constraints</h2>
      <div className={styles.constraintsSection}>
        <div className={styles.constraintsLabel}>Subject to:</div>
        {constraints.map(([a, b, rhs], i) => (
          <div key={i} className={styles.constraint}>
            {a}x₁ + {b}x₂ ≤ {rhs}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ConstraintsList