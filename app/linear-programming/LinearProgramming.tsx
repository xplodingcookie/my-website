"use client";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import styles from "./LinearProgramming.module.css";
import useReducedMotion from "../components/useReducedMotion";
import { SimplexSolver, type Step } from "./solver";
import {
  ORIGINAL,
  EXAMPLES,
  toDraft,
  validateDraft,
  numberError,
  format,
  isFeasible,
  objectiveAt,
  type Problem,
} from "./problem";
import { calculateGeometry } from "./geometry";
import { randomProblem } from "./random";
import { usePlayback, DEFAULT_DELAY } from "./usePlayback";
import { travelPlan, PLOT_SPAN, type TravelPlan } from "./travel";
import FeasibleGraph from "../components/FeasibleGraph";
import ProblemEditor from "./components/ProblemEditor";
import RollingNumber from "./components/RollingNumber";

type Roll = {
  plan: TravelPlan;
  x: number[];
  y: number[];
  z: number[];
};

// Typeset ax₁ + bx₂ the way a person would write it: no zero terms, no unit
// coefficients, a real minus sign.
const minus = (n: string) => n.replace("-", "−");
function linear(a: number, b: number): string {
  const parts: string[] = [];
  if (Math.abs(a) > 1e-9)
    parts.push(`${a === 1 ? "" : a === -1 ? "−" : minus(format(a))}x₁`);
  if (Math.abs(b) > 1e-9)
    parts.push(
      `${b < 0 ? "− " : parts.length ? "+ " : ""}${Math.abs(b) === 1 ? "" : format(Math.abs(b))}x₂`,
    );
  return parts.length ? parts.join(" ") : "0";
}
// The same expression with the current point substituted in: 3(4) + 2(2).
function substituted(a: number, b: number, sol: number[]): string {
  const parts: string[] = [];
  if (Math.abs(a) > 1e-9)
    parts.push(`${minus(format(a))}(${format(sol[0])})`);
  if (Math.abs(b) > 1e-9)
    parts.push(
      `${b < 0 ? "− " : parts.length ? "+ " : ""}${format(Math.abs(b))}(${format(sol[1])})`,
    );
  return parts.length ? parts.join(" ") : "0";
}

const ORIGINAL_INDEX = EXAMPLES.findIndex(
  (item) => item.problem === ORIGINAL,
);

export default function LinearProgramming() {
  // The page opens on the original polygon; the guided preview example stays
  // one click away in the gallery for anyone following the home-page teaser.
  const [problem, setProblem] = useState(ORIGINAL);
  const [draft, setDraft] = useState(() => toDraft(ORIGINAL));
  const [revision, setRevision] = useState(0);
  const [example, setExample] = useState(ORIGINAL_INDEX);
  const validation = useMemo(() => validateDraft(draft), [draft]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(toDraft(problem));
  const disabled = dirty || !validation.problem;
  const geometry = useMemo(() => calculateGeometry(problem), [problem]);
  const trace = useMemo(() => {
    const result = new SimplexSolver(
      problem.objective,
      problem.constraints.map((r) => r.slice(0, 2)),
      problem.constraints.map((r) => r[2]),
    ).solve();
    // Keep phase boundaries; omit duplicate terminal records at the same basis.
    const steps = result.steps.filter(
      (step, i, all) =>
        i === 0 ||
        step.phase !== all[i - 1].phase ||
        step.sol.some((n, j) => Math.abs(n - all[i - 1].sol[j]) > 1e-8),
    );
    // A feasible origin needs no Phase-I walkthrough.
    const visible = isFeasible(problem, [0, 0])
      ? steps.filter((step) => step.phase === "optimisation")
      : steps;
    const finite = visible.every((step) => step.sol.every(Number.isFinite));
    return {
      status: finite ? result.status : "numerical",
      steps: visible.length
        ? visible
        : [
            {
              sol: [0, 0],
              obj: 0,
              optimal: false,
              phase: "feasibility",
            } as Step,
          ],
    };
  }, [problem]);
  const playback = usePlayback(trace.steps.length - 1, !!disabled, revision);
  const { index, playing } = playback;
  // One control paces everything: the Speed slider sets the pause between
  // vertices, and the same setting stretches the marker and readout sweep, so
  // Solve's run to the answer speeds up and slows down with it too.
  const pace = playback.delay / DEFAULT_DELAY;
  const step = trace.steps[index];
  const next = trace.steps[index + 1];
  const feasible = isFeasible(problem, step.sol);
  const z = objectiveAt(problem, step.sol);
  const reducedMotion = useReducedMotion();
  // Roll the readout numbers through the intermediate vertices on the same
  // clock as the plot marker. Computed once per step (keyed on problem and
  // index), so unrelated re-renders never restart a roll.
  const rollRef = useRef<{ problem: Problem; index: number; roll: Roll | null }>(
    { problem, index, roll: null },
  );
  if (rollRef.current.problem !== problem || rollRef.current.index !== index) {
    const prev = rollRef.current;
    let roll: Roll | null = null;
    if (!reducedMotion && prev.problem === problem && index > prev.index) {
      const sols = trace.steps
        .slice(prev.index, index + 1)
        .map((item) => item.sol);
      const plan = travelPlan(sols, PLOT_SPAN / geometry.extent, pace);
      if (plan)
        roll = {
          plan,
          x: sols.map((sol) => sol[0]),
          y: sols.map((sol) => sol[1]),
          z: sols.map((sol) => objectiveAt(problem, sol)),
        };
    }
    rollRef.current = { problem, index, roll };
  }
  const roll = rollRef.current.roll;
  const nextZ = next ? objectiveAt(problem, next.sol) : null;
  const finished = index === trace.steps.length - 1;
  // Solve doubles as the way back: once the run has landed on the last vertex
  // the same button starts the walk over, so the animation is one click away.
  const solved = finished && trace.steps.length > 1;
  const path = useMemo(
    () => trace.steps.slice(0, index + 1).map((s) => s.sol),
    [trace.steps, index],
  );
  const pointText = `(${step.sol.map(format).join(", ")})`;
  // The boundaries that hold with equality here — the algebra of "a vertex is
  // where boundaries meet". A Phase I basis can sit off every boundary.
  const tight: string[] = [];
  if (Math.abs(step.sol[0]) < 1e-7) tight.push("x₁ = 0");
  if (Math.abs(step.sol[1]) < 1e-7) tight.push("x₂ = 0");
  for (const [a, b, c] of problem.constraints)
    if (
      Math.abs(a * step.sol[0] + b * step.sol[1] - c) <
      1e-6 * Math.max(1, Math.abs(c))
    )
      tight.push(`${linear(a, b)} = ${minus(format(c))}`);
  const explanation = !finished
    ? !feasible
      ? "This point violates at least one original constraint. Phase I reduces artificial variables to find a feasible basis; it is not maximising the original objective yet."
      : step.phase === "feasibility"
        ? "A feasible point has been found. Phase II now switches to the original objective."
        : nextZ !== null && nextZ - z > 1e-8
          ? `The next pivot moves to (${next.sol.map(format).join(", ")}). The objective rises from ${format(z)} to ${format(nextZ)}: a gain of ${format(nextZ - z)}.`
          : "The next basis has the same objective value. A degenerate pivot can change the basis without improving the objective."
    : {
        optimal:
          "Optimal: no feasible improving edge remains. For a linear objective on this convex region, that gives a global maximum.",
        infeasible:
          "Infeasible: Phase I cannot remove all artificial variables. No point satisfies all the constraints.",
        unbounded:
          "Unbounded: an improving direction has no limiting constraint. The objective can increase without a finite maximum.",
        searching:
          "The iteration limit was reached. This is not a confirmed optimum.",
        numerical:
          "The calculation exceeded numerical limits. Try smaller coefficients or a less extreme problem.",
      }[trace.status];
  const status = finished
    ? trace.status === "optimal"
      ? "Optimal solution"
      : trace.status === "infeasible"
        ? "No feasible solution"
        : trace.status === "unbounded"
          ? "Unbounded objective"
          : "Calculation stopped"
    : step.phase === "feasibility"
      ? "Phase I · find feasibility"
      : index === 0
        ? "Start at a feasible vertex"
        : "Phase II · improve the objective";
  function apply(nextProblem: Problem, exampleIndex = -1) {
    playback.reset();
    setProblem(nextProblem);
    setDraft(toDraft(nextProblem));
    setRevision((r) => r + 1);
    setExample(exampleIndex);
  }
  // The objective is editable in place, like the original playground. Valid
  // input applies immediately; a partial number pauses playback and shows the
  // error without touching the solved problem. Kept as raw strings so typing
  // "-" or "3." is never rewritten mid-keystroke. Resynced during render when
  // the problem changes elsewhere, so a stale value is never committed.
  const [objDraft, setObjDraft] = useState(() => problem.objective.map(String));
  const [objProblem, setObjProblem] = useState(problem);
  if (objProblem !== problem) {
    setObjProblem(problem);
    if (
      !objDraft.every(
        (raw, i) => !numberError(raw) && Number(raw) === problem.objective[i],
      )
    )
      setObjDraft(problem.objective.map(String));
  }
  const objErrors = objDraft.map(numberError);
  const objectiveDescription = [
    objErrors.some(Boolean) ? "objective-error" : "",
    dirty ? "objective-draft-hint" : "",
  ].filter(Boolean).join(" ") || undefined;
  function changeObjective(slot: number, raw: string) {
    // Applying a heading edit replaces the draft; preserve pending Experiment work.
    if (dirty) return;
    const nextDraft = objDraft.map((s, i) => (i === slot ? raw : s));
    setObjDraft(nextDraft);
    if (nextDraft.every((s) => !numberError(s)))
      apply(
        {
          objective: [Number(nextDraft[0]), Number(nextDraft[1])],
          constraints: problem.constraints,
        },
        -1,
      );
    else playback.reset();
  }
  const blocker = !validation.problem
    ? "Solve is unavailable: correct the invalid fields in Experiment below."
    : dirty
      ? "Apply your changes in Experiment before playing or solving."
      : "";
  const formula = `${format(problem.objective[0])}x₁ ${problem.objective[1] < 0 ? "−" : "+"} ${format(Math.abs(problem.objective[1]))}x₂`;
  return (
    <div className={styles.container}>
      <Link href="/#projects" className={styles.backLink}>
        ← Back to projects
      </Link>
      <header className={styles.header}>
        <p className="eyebrow">Observe → Understand → Experiment</p>
        <h1 className={styles.title}>
          The Simplex method<span className="accent-text">.</span>
        </h1>
        <p className={styles.intro}>
          A linear objective improves along an edge until a constraint stops it.
          Watch the two-phase method work the original twenty-five-constraint
          region, or pick the guided preview example from the gallery below to
          follow one vertex at a time.
        </p>
      </header>
      <section
        aria-labelledby="walkthrough-title"
        className={styles.walkthrough}
      >
        <div className={styles.problemHeading}>
          <div>
            <p className="eyebrow">
              {example >= 0
                ? EXAMPLES[example].name
                : example === -2
                  ? "A random polygon"
                  : "Your problem"}
            </p>
            <h2 id="walkthrough-title" className="sr-only">
              Maximise {formula}
            </h2>
            <div className={`${styles.objectiveRow} needs-js`}>
              <span>Maximise</span>
              <input
                className={styles.objectiveInput}
                value={objDraft[0]}
                readOnly={dirty}
                onChange={(e) => changeObjective(0, e.target.value)}
                aria-label="Objective coefficient of x₁"
                aria-invalid={objErrors[0] ? true : undefined}
                aria-describedby={objectiveDescription}
                inputMode="decimal"
              />
              <span aria-hidden="true">x₁ +</span>
              <input
                className={styles.objectiveInput}
                value={objDraft[1]}
                readOnly={dirty}
                onChange={(e) => changeObjective(1, e.target.value)}
                aria-label="Objective coefficient of x₂"
                aria-invalid={objErrors[1] ? true : undefined}
                aria-describedby={objectiveDescription}
                inputMode="decimal"
              />
              <span aria-hidden="true">x₂</span>
            </div>
            {dirty && (
              <p id="objective-draft-hint" className={styles.editorHelp}>
                Apply your Experiment changes before editing the objective here.
              </p>
            )}
            {(objErrors[0] || objErrors[1]) && (
              <p id="objective-error" className={styles.fieldError} role="status">
                {objErrors[0] ?? objErrors[1]}
              </p>
            )}
            <noscript>
              <p className={styles.staticFormula}>Maximise {formula}</p>
            </noscript>
          </div>
          <a href="#experiment" className={styles.textLink}>
            Experiment ↓
          </a>
        </div>
        <div className={styles.mainContent}>
          <div className={styles.graphPanel}>
            <FeasibleGraph
              geometry={geometry}
              point={step.sol}
              candidate={playing || index > 0 ? next?.sol : undefined}
              path={path}
              feasible={feasible}
              pace={pace}
              description={`Shaded area: feasible points within the plotted window. Filled dot: current point ${pointText}, objective ${format(z)}. ${explanation}`}
            />
            <div className={styles.legend}>
              <span>
                <i className={styles.currentDot} />
                Current vertex
              </span>
              <span>
                <i className={styles.candidateDot} />
                Next vertex
              </span>
              <span>
                <i className={styles.regionSwatch} />
                Feasible region
              </span>
            </div>
            <div
              className={`${styles.controls} needs-js`}
              aria-label="Simplex playback"
            >
              <button
                className={`${styles.button} ${styles.primary} ${solved ? styles.primaryDone : ""}`}
                disabled={!!disabled}
                aria-describedby={blocker ? "solve-blocker" : undefined}
                onClick={
                  solved
                    ? playback.reset
                    : () => playback.move(trace.steps.length - 1)
                }
              >
                {solved ? "Start over" : "Solve"}
              </button>
              <button
                className={styles.button}
                disabled={!!disabled || trace.steps.length < 2}
                onClick={playback.toggle}
              >
                {playing ? "Pause" : "Play"}
              </button>
              <button
                className={styles.button}
                disabled={!!disabled || index === 0}
                onClick={() => playback.move(index - 1)}
              >
                Previous step
              </button>
              <button
                className={styles.button}
                disabled={!!disabled || finished}
                onClick={() => playback.move(index + 1)}
              >
                Next step
              </button>
              <button className={styles.button} onClick={playback.reset}>
                Reset
              </button>
              <button
                className={styles.button}
                onClick={() => apply(randomProblem(), -2)}
              >
                Randomise
              </button>
              <div className={styles.speed}>
                <label htmlFor={`${styles.speed}-slider`}>Speed</label>
                <input
                  id={`${styles.speed}-slider`}
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={(5500 - playback.delay) / 500}
                  aria-valuetext={`${playback.delay / 1000} seconds per step`}
                  onChange={(e) =>
                    playback.setDelay(5500 - 500 * Number(e.target.value))
                  }
                />
                <output aria-hidden="true" className={styles.speedValue}>
                  {(5500 - playback.delay) / 500}
                </output>
              </div>
            </div>
            {blocker && (
              <p id="solve-blocker" className={styles.blocker} role="status">
                {blocker}
              </p>
            )}
            <p className={`${styles.controlHint} needs-js`}>
              Speed paces the whole walk: higher speed shortens Play&rsquo;s pause
              at each vertex and quickens Solve&rsquo;s sweep to the answer. Next
              step advances once; Solve runs to the result, then starts over;
              Randomise generates a new polygon.
            </p>
            {trace.status === "unbounded" && (
              <p className={styles.graphNote}>
                The region extends beyond this viewing window.
              </p>
            )}
          </div>
          <div className={styles.lesson}>
            <div
              className={styles.liveState}
              aria-live="polite"
              aria-atomic="true"
            >
              <p className="eyebrow">
                Step {index + 1} of {trace.steps.length}
              </p>
              <h3>{status}</h3>
              <dl className={styles.readout}>
                <div>
                  <dt>Current point</dt>
                  <dd>
                    <span aria-hidden="true">
                      (
                      <RollingNumber
                        value={step.sol[0]}
                        frames={roll?.x ?? null}
                        plan={roll?.plan ?? null}
                      />
                      ,{" "}
                      <RollingNumber
                        value={step.sol[1]}
                        frames={roll?.y ?? null}
                        plan={roll?.plan ?? null}
                      />
                      )
                    </span>
                    <span className="sr-only">{pointText}</span>
                  </dd>
                </div>
                <div>
                  <dt>Objective z</dt>
                  <dd>
                    <span aria-hidden="true">
                      <RollingNumber
                        value={z}
                        frames={roll?.z ?? null}
                        plan={roll?.plan ?? null}
                      />
                    </span>
                    <span className="sr-only">{format(z)}</span>
                  </dd>
                </div>
              </dl>
              <p className={styles.explanation}>{explanation}</p>
            </div>
            <dl className={styles.mathBlock}>
              <div>
                <dt>The objective, evaluated</dt>
                <dd>
                  z = {linear(problem.objective[0], problem.objective[1])} ={" "}
                  {substituted(
                    problem.objective[0],
                    problem.objective[1],
                    step.sol,
                  )}{" "}
                  = <strong>{format(z)}</strong>
                </dd>
              </div>
              <div>
                <dt>Boundaries meeting this point</dt>
                <dd>
                  {tight.length
                    ? tight.slice(0, 3).join("  ·  ") +
                      (tight.length > 3 ? `  ·  +${tight.length - 3} more` : "")
                    : "None — an artificial Phase I basis, off every boundary."}
                </dd>
              </div>
            </dl>
            <p className={styles.mathNote}>
              A vertex is where boundaries meet. Each pivot walks one edge,
              releasing one boundary and tightening another.
            </p>
            <details
              className={styles.feasibility}
              open={example === 0 ? true : undefined}
            >
              <summary>
                {feasible
                  ? "Why is this point feasible?"
                  : "Check the constraints"}
              </summary>
              <ul>
                {problem.constraints.map(([a, b, c], i) => (
                  <li key={i}>
                    <span>
                      {format(a)}x₁ {b < 0 ? "−" : "+"} {format(Math.abs(b))}x₂
                      ≤ {format(c)}
                    </span>
                    <strong>
                      {format(a * step.sol[0] + b * step.sol[1])} ≤ {format(c)}{" "}
                      {a * step.sol[0] + b * step.sol[1] <= c + 1e-7
                        ? "✓"
                        : "✕"}
                    </strong>
                  </li>
                ))}
                <li>
                  <span>x₁, x₂ ≥ 0</span>
                  <strong>
                    {step.sol.every((n) => n >= -1e-7) ? "✓" : "✕"}
                  </strong>
                </li>
              </ul>
            </details>
          </div>
        </div>
        <noscript>
          <p>
            The diagram above shows the original twenty-five-constraint region
            at its starting state. The guided preview example proceeds (0, 0) →
            (4, 0) → (4, 2), with objective values 0 → 12 → 16. Enable
            JavaScript to step through this region, or to edit and solve other
            problems.
          </p>
        </noscript>
      </section>
      <section
        id="experiment"
        className={`${styles.experiment} needs-js`}
        aria-labelledby="experiment-title"
      >
        <p className="eyebrow">Make it your own</p>
        <h2 id="experiment-title">What changes the optimum?</h2>
        <p className={styles.intro}>
          Try increasing the coefficient of x₂. Or move a boundary and watch the
          feasible region change. Apply your problem, then return to the
          diagram.
        </p>
        <details className={styles.examples} open>
          <summary>Explore other examples</summary>
          <div className={styles.exampleGrid}>
            {EXAMPLES.map((item, i) => (
              <button
                key={item.name}
                aria-pressed={example === i}
                onClick={() => apply(item.problem, i)}
              >
                <strong>{item.name}</strong>
                <span>{item.note}</span>
              </button>
            ))}
          </div>
        </details>
        <ProblemEditor
          draft={draft}
          errors={validation.errors}
          dirty={dirty}
          onChange={(nextDraft) => {
            playback.reset();
            setDraft(nextDraft);
          }}
          onApply={() => {
            if (validation.problem) apply(validation.problem);
          }}
        />
        <a className={styles.textLink} href="#walkthrough-title">
          Back to the diagram ↑
        </a>
      </section>
    </div>
  );
}
