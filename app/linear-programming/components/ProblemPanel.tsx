import { useState, useEffect } from 'react';
import styles from '../LinearProgramming.module.css';

type Props = {
  objective: number[];
  setObjective: (newObj: [number, number]) => void;
};

const ObjectiveEditor = ({ objective, setObjective }: Props) => {
  // Local string states for each input, initialized from objective numbers
  const [inputVals, setInputVals] = useState<string[]>([
    objective[0].toString(),
    objective[1].toString(),
  ]);

  useEffect(() => {
    setInputVals([objective[0].toString(), objective[1].toString()]);
  }, [objective]);

  // Update local input value on every keystroke
  const handleInputChange = (index: 0 | 1, val: string) => {
    if (val.length <= 5) {
      setInputVals((old) => {
        const copy = [...old];
        copy[index] = val;
        return copy;
      });
    }
  };

  // On blur, parse and validate input; update numeric objective state only if valid
  const handleInputBlur = (index: 0 | 1) => {
    const val = inputVals[index].trim();
    if (val === '') {
      setInputVals((old) => {
        const copy = [...old];
        copy[index] = objective[index].toString();
        return copy;
      });
      return;
    }

    const parsed = parseFloat(val);

    // If valid number, update objective state and normalize input string
    if (!isNaN(parsed)) {
      const updated = [...objective] as [number, number];
      updated[index] = parsed;
      setObjective(updated);
      setInputVals((old) => {
        const copy = [...old];
        copy[index] = parsed.toString();
        return copy;
      });
    } else {
      // If invalid, revert input to last valid objective value
      setInputVals((old) => {
        const copy = [...old];
        copy[index] = objective[index].toString();
        return copy;
      });
    }
  };

  return (
    <div className={styles.infoCard}>
      <h2 className={styles.cardHeader}>Current Problem</h2>
      <div className={styles.problemContent}>
        <div className={styles.objectiveBox}>
          <div className={styles.objectiveLabel}>Maximize:</div>
          <div className={styles.objectiveFormula}>
            <input
              type="text"
              value={inputVals[0]}
              onChange={(e) => handleInputChange(0, e.target.value)}
              onBlur={() => handleInputBlur(0)}
              size={Math.max(inputVals[0].length || 1, 3)}
              className={styles.inputInline}
              aria-label="Coefficient for x₁"
            />
            <span>x₁&nbsp;+&nbsp;</span>
            <input
              type="text"
              value={inputVals[1]}
              onChange={(e) => handleInputChange(1, e.target.value)}
              onBlur={() => handleInputBlur(1)}
              size={Math.max(inputVals[1].length || 1, 3)}
              className={styles.inputInline}
              aria-label="Coefficient for x₂"
            />
            <span>x₂</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ObjectiveEditor;