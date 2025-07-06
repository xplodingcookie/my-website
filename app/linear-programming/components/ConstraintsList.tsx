import { useState, useEffect, useMemo } from 'react';
import styles from '../LinearProgramming.module.css';

type Props = {
  constraints: number[][];
  setConstraints?: (cons: number[][]) => void;
};

const fixedConstraints = [
  [-1, 0, 0],
  [0, -1, 0],
];

const ConstraintsList = ({ constraints, setConstraints }: Props) => {
  const [tab, setTab] = useState<'view' | 'edit'>('view');

  const editableConstraints = useMemo(() =>
    constraints.filter(
      ([a, b]) => !(a === -1 && b === 0) && !(a === 0 && b === -1)
    ),
    [constraints]
  );

  const [inputVals, setInputVals] = useState<string[][]>(
    editableConstraints.map(([a, b, rhs]) => [a, b, rhs].map(String))
  );

  useEffect(() => {
    setInputVals(editableConstraints.map(([a, b, rhs]) => [a, b, rhs].map(String)));
  }, [editableConstraints]);

  const saveConstraints = (newCons: number[][]) => {
    if (!setConstraints) return;
    setConstraints([...newCons, ...fixedConstraints]);
  };

  const handleInputChange = (
    row: number,
    col: 0 | 1 | 2,
    val: string
  ) => {
    if (val.length > 6) return;
    setInputVals((prev) => {
      const copy = prev.map((rowVals) => [...rowVals]);
      copy[row][col] = val;
      return copy;
    });
  };

  const handleInputBlur = (row: number, col: 0 | 1 | 2) => {
    const str = inputVals[row][col].trim();
    let parsed = parseFloat(str);

    if (str === '') {
      parsed = 1; // fallback default
    } else if (isNaN(parsed)) {
      parsed = editableConstraints[row][col]; // revert
    }

    const updatedConstraints = [...editableConstraints];
    updatedConstraints[row] = [...updatedConstraints[row]];
    updatedConstraints[row][col] = parsed;

    saveConstraints(updatedConstraints);
  };

  const addConstraint = () => {
    if (!setConstraints) return;
    const newConstraint = [1, 1, 10];
    setInputVals([...inputVals, newConstraint.map(String)]);
    saveConstraints([...editableConstraints, newConstraint]);
  };

  const removeConstraint = (index: number) => {
    if (!setConstraints) return;
    const newCons = editableConstraints.filter((_, i) => i !== index);
    saveConstraints(newCons);
  };

  const clearAllConstraints = () => {
    if (!setConstraints) return;
    saveConstraints([]);
  };

  return (
    <div className={styles.infoCard}>
      <h2 className={styles.cardHeader}>Constraints</h2>
      
      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <button
          onClick={() => setTab('view')}
          className={`${styles.button} ${tab === 'view' ? styles.buttonPrimary : styles.buttonSecondary}`}
          style={{ flex: 1 }}
        >
          View
        </button>
        <button
          onClick={() => setTab('edit')}
          className={`${styles.button} ${tab === 'edit' ? styles.buttonPrimary : styles.buttonSecondary}`}
          style={{ flex: 1 }}
        >
          Customise Constraints
        </button>
      </div>

      {tab === 'view' && (
        <div className={styles.constraintsSection}>
          <div className={styles.constraintsLabel}>Subject to:</div>
          {constraints.map(([a, b, rhs], i) => (
            <div key={i} className={styles.constraint}>
              {a}x₁ + {b}x₂ ≤ {rhs}
            </div>
          ))}
        </div>
      )}

      {tab === 'edit' && (
        <>
          <div className={styles.constraintsSection}>
            <div className={styles.constraintsLabel}>Edit constraints (excluding x₁ ≥ 0, x₂ ≥ 0):</div>
            {inputVals.length === 0 && (
              <div style={{ fontStyle: 'italic', color: '#64748b', marginBottom: '0.5rem' }}>
                No custom constraints yet.
              </div>
            )}
            {inputVals.map(([a, b, rhs], i) => (
              <div key={i} className={styles.constraintRow}>
                <input
                  className={styles.constraintInput}
                  type="text"
                  value={a}
                  onChange={(e) => handleInputChange(i, 0, e.target.value)}
                  onBlur={() => handleInputBlur(i, 0)}
                  size={Math.max(a.length, 2)}
                  aria-label={`Coefficient a of constraint ${i + 1}`}
                />
                <span>x₁ +</span>
                <input
                  className={styles.constraintInput}
                  type="text"
                  value={b}
                  onChange={(e) => handleInputChange(i, 1, e.target.value)}
                  onBlur={() => handleInputBlur(i, 1)}
                  size={Math.max(b.length, 2)}
                  aria-label={`Coefficient b of constraint ${i + 1}`}
                />
                <span>x₂ ≤</span>
                <input
                  className={styles.constraintInput}
                  type="text"
                  value={rhs}
                  onChange={(e) => handleInputChange(i, 2, e.target.value)}
                  onBlur={() => handleInputBlur(i, 2)}
                  size={Math.max(rhs.length, 2)}
                  aria-label={`Right-hand side of constraint ${i + 1}`}
                />
                <button
                  onClick={() => removeConstraint(i)}
                  className={styles.removeConstraintBtn}
                  aria-label={`Remove constraint ${i + 1}`}
                  title="Remove constraint"
                >
                  x
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', marginBottom: '1rem' }}>
            <button
              onClick={addConstraint}
              className={`${styles.button} ${styles.buttonPrimary}`}
              style={{ flex: 1 }}
            >
              + Add Constraint
            </button>
            <button
              onClick={clearAllConstraints}
              className={`${styles.button} ${styles.buttonDanger}`}
              style={{ flex: 1 }}
            >
              Clear All
            </button>
          </div>

          <div className={styles.nonNegativity} style={{ marginTop: '1rem', fontStyle: 'italic', color: '#64748b' }}>
            * Note: x₁ ≥ 0 and x₂ ≥ 0 constraints are fixed and always applied.
          </div>
        </>
      )}
    </div>
  );
};

export default ConstraintsList;
