import styles from '../LinearProgramming.module.css'

type Props = {
  onRandomise: () => void;
  onSolve: () => void;
  onReset: () => void;
  speed: number;
  setSpeed: (val: number) => void;
  running: boolean;
};

const ControlPanel = ({ onRandomise, onSolve, onReset, speed, setSpeed, running }: Props) => {
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
          onChange={(e) => setSpeed(+e.target.value)}
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