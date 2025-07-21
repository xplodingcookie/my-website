import styles from '../LinearProgramming.module.css'
import { useCallback } from 'react';

type Props = {
  onRandomise: () => void;
  onSolve: () => void;
  onReset: () => void;
  speed: number;
  setSpeed: (val: number) => void;
  running: boolean;
};

const ControlPanel = ({ onRandomise, onSolve, onReset, speed, setSpeed, running }: Props) => {
  const handleSpeedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newSpeed = +e.target.value;
    if (newSpeed >= 1 && newSpeed <= 10) {
      setSpeed(newSpeed);
    }
  }, [setSpeed]);
  return (
    <div className={styles.controls}>
      <button 
        className={`${styles.button} ${styles.buttonSecondary}`}
        onClick={onRandomise}
        disabled={running}
      >
        Randomise
      </button>
      
      <button 
        className={`${styles.button} ${styles.buttonPrimary}`}
        onClick={onSolve}
        disabled={running}
      >
        {running ? 'Solving...' : 'Solve'}
      </button>
      
      <button 
        className={`${styles.button} ${styles.buttonSecondary}`}
        onClick={onReset}
      >
        Reset
      </button>
      
      <div className={styles.speedControl}>
        <span>Speed</span>
        <input
          type="range"
          min={1}
          max={10}
          value={speed}
          onChange={handleSpeedChange}
          disabled={running}
          className={styles.slider}
        />
        <span className={styles.speedValue}>
          {speed}
        </span>
      </div>
    </div>
  )
}

export default ControlPanel