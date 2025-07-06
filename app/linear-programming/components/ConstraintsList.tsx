import { useState } from 'react';
import styles from '../LinearProgramming.module.css';

type Props = {
  constraints: number[][];
  setConstraints?: (cons: number[][]) => void; // optional, only needed for editable tab
};

const fixedConstraints = [
  [-1, 0, 0],
  [0, -1, 0],
];

const ConstraintsList = ({ constraints, setConstraints }: Props) => {
  const [tab, setTab] = useState<'view' | 'edit'>('view');

  // Filter out fixed constraints from editable list (we fix these)
  const editableConstraints = constraints.filter(
    ([a, b]) => !(a === -1 && b === 0) && !(a === 0 && b === -1)
  );

  // Add fixed constraints back to editable list when saving
  const saveConstraints = (newCons: number[][]) => {
    if (!setConstraints) return;
    setConstraints([...newCons, ...fixedConstraints]);
  };

  const updateConstraint = (
    index: number,
    field: 0 | 1 | 2,
    value: string,
    finalize = false
  ) => {
    if (!setConstraints) return;
    const newCons = [...editableConstraints];

    const row = [...newCons[index]];

    const trimmed = value.trim();
    const valNum = parseFloat(trimmed);

    if (trimmed === '') {
      if (finalize) {
        row[field] = 1;
      } else {
        row[field] = NaN;
      }
    } else if (!isNaN(valNum)) {
      row[field] = valNum;
    }

    newCons[index] = row;
    saveConstraints(newCons);
  };

  const addConstraint = () => {
    if (!setConstraints) return;
    saveConstraints([...editableConstraints, [1, 1, 10]]);
  };

  const removeConstraint = (index: number) => {
    if (!setConstraints) return;
    const newCons = editableConstraints.filter((_, i) => i !== index);
    saveConstraints(newCons);
  };

  const clearAllConstraints = () => {
    if (!setConstraints) return;
    saveConstraints([]); // Clear all editable constraints, keep fixed ones
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
            {editableConstraints.length === 0 && (
              <div style={{ fontStyle: 'italic', color: '#64748b', marginBottom: '0.5rem' }}>
                No custom constraints yet.
              </div>
            )}
            {editableConstraints.map(([a, b, rhs], i) => (
              <div key={i} className={styles.constraintRow}>
                <input
                  className={styles.constraintInput}
                  type="number"
                  value={a}
                  step="any"
                  onChange={(e) => updateConstraint(i, 0, e.target.value)}
                  onBlur={(e) => updateConstraint(i, 0, e.target.value, true)}
                  aria-label={`Coefficient a of constraint ${i + 1}`}
                />
                <span>x₁ +</span>
                <input
                  className={styles.constraintInput}
                  type="number"
                  value={b}
                  step="any"
                  onChange={(e) => updateConstraint(i, 1, e.target.value)}
                  onBlur={(e) => updateConstraint(i, 1, e.target.value, true)}
                  aria-label={`Coefficient b of constraint ${i + 1}`}
                />
                <span>x₂ ≤</span>
                <input
                  className={styles.constraintInput}
                  type="number"
                  value={rhs}
                  step="any"
                  onChange={(e) => updateConstraint(i, 2, e.target.value)}
                  onBlur={(e) => updateConstraint(i, 2, e.target.value, true)}
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
