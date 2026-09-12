"use client";
import { type Draft } from "../problem";
import styles from "../LinearProgramming.module.css";

type Props = {
  draft: Draft;
  errors: Record<string, string>;
  onChange: (draft: Draft) => void;
  onApply: () => void;
  dirty: boolean;
};
export default function ProblemEditor({
  draft,
  errors,
  onChange,
  onApply,
  dirty,
}: Props) {
  const field = (
    id: string,
    value: string,
    label: string,
    change: (value: string) => void,
  ) => (
    <div key={id} className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => change(e.target.value)}
        aria-invalid={!!errors[id]}
        aria-describedby={errors[id] ? `${id}-error` : undefined}
      />
      {errors[id] && (
        <p id={`${id}-error`} className={styles.fieldError}>
          {errors[id]}
        </p>
      )}
    </div>
  );
  return (
    <div className={styles.editor}>
      <p className={styles.editorHelp}>
        Maximise c₁x₁ + c₂x₂. Every row means ax₁ + bx₂ ≤ limit. Both variables
        stay nonnegative. Negative coefficients and limits are allowed. This
        floating-point tool accepts magnitudes from 0.000001 to 1,000,000, plus
        zero.
      </p>
      <fieldset>
        <legend>Objective coefficients</legend>
        <div className={styles.objectiveFields}>
          {draft.objective.map((value, i) =>
            field(`objective-${i}`, value, i === 0 ? "c₁" : "c₂", (value) =>
              onChange({
                ...draft,
                objective: draft.objective.map((v, j) => (j === i ? value : v)),
              }),
            ),
          )}
        </div>
      </fieldset>
      <fieldset>
        <legend>Constraints</legend>
        <div className={styles.constraintRows}>
          {draft.constraints.map((row, i) => (
            <div key={i} className={styles.constraintRow} role="group" aria-label={`Constraint ${i + 1}`}>
              <span className={styles.rowNumber}>Row {i + 1}</span>
              <div className={styles.coefficients}>
                {row.map((value, j) =>
                  field(
                    `constraint-${i}-${j}`,
                    value,
                    ["a · x₁", "b · x₂", "≤ limit"][j],
                    (value) =>
                      onChange({
                        ...draft,
                        constraints: draft.constraints.map((r, k) =>
                          k === i ? r.map((v, l) => (l === j ? value : v)) : r,
                        ),
                      }),
                  ),
                )}
              </div>
              <button
                className={styles.removeButton}
                aria-label={`Remove constraint ${i + 1}`}
                onClick={() =>
                  onChange({
                    ...draft,
                    constraints: draft.constraints.filter((_, j) => i !== j),
                  })
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <p className={styles.editorHelp}>x₁ ≥ 0, x₂ ≥ 0 are always included.</p>
      </fieldset>
      <div className={styles.editorActions}>
        <button
          className={styles.button}
          disabled={draft.constraints.length >= 40}
          onClick={() =>
            onChange({
              ...draft,
              constraints: [...draft.constraints, ["", "", ""]],
            })
          }
        >
          Add constraint
        </button>
        <button
          className={styles.button}
          disabled={draft.constraints.length === 0}
          onClick={() => onChange({ ...draft, constraints: [] })}
        >
          Clear all constraints
        </button>
        <button
          className={`${styles.button} ${styles.primary}`}
          disabled={Object.keys(errors).length > 0 || !dirty}
          onClick={onApply}
        >
          Apply problem
        </button>
      </div>
      <p
        className={
          Object.keys(errors).length ? styles.fieldError : styles.editorHelp
        }
        role="status"
      >
        {Object.keys(errors).length
          ? "Correct the marked fields before applying or solving. Your input has been kept exactly as typed."
          : dirty
            ? "Changes are not applied yet. The graph still shows the last applied problem."
            : "The graph and controls use this applied problem."}
      </p>
    </div>
  );
}
