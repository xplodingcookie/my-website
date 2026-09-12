"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import FeasibleGraph from "./FeasibleGraph";
import { SIMPLE } from "../linear-programming/problem";
import { calculateGeometry } from "../linear-programming/geometry";

const vertices = [
  [0, 0],
  [4, 0],
  [4, 2],
];
const labels = [
  "Start at a feasible vertex",
  "A gain of 12 along the first edge",
  "Optimal: z = 16",
];
const explanations = [
  "At (0, 0), all three constraints hold. Increasing x₁ improves the objective until x₁ = 4 stops us.",
  "Now increase x₂. At (4, 2), x₁ + x₂ = 6 stops the move. The objective rises from 12 to 16.",
  "No feasible edge improves the objective. The playground has this example, a twenty-five-constraint region, and problems of your own.",
];
export default function FeaturedProject() {
  const [step, setStep] = useState(0);
  const geometry = useMemo(() => calculateGeometry(SIMPLE), []);
  const path = useMemo(() => vertices.slice(0, step + 1), [step]);
  const [x, y] = vertices[step];
  return (
    <article className="featured-project">
      <div className="featured-copy">
        <div className="project-eyebrow">
          <span>Simplex visualiser</span>
          <span className="live-label">
            <i />
            Interactive
          </span>
        </div>
        <h3>
          <Link href="/linear-programming">
            Interactive <br />
            Linear Programming<span className="accent-text">.</span>
          </Link>
        </h3>
        <p className="project-standfirst">
          An algorithm you can reason through.
        </p>
        <p className="project-description">
          I built a two-phase Simplex solver and a visual way to follow it. Step
          through improving vertices, inspect the constraints, then try a
          problem of your own.
        </p>
        <div className="preview-problem">
          <strong>Maximise 3x₁ + 2x₂</strong>
          <p>
            x₁ ≤ 4 · x₂ ≤ 4 · x₁ + x₂ ≤ 6<br />
            x₁, x₂ ≥ 0
          </p>
        </div>
        <ul className="skills-list">
          <li>TypeScript</li>
          <li>SVG</li>
          <li>Optimisation</li>
        </ul>
        <Link href="/linear-programming" className="project-cta">
          Continue in the playground{" "}
          <ArrowUpRight size={19} aria-hidden="true" />
        </Link>
      </div>
      <div className="math-preview">
        <div className="math-topline">
          <span>The Simplex method</span>
          <span>Step {step + 1} / 3</span>
        </div>
        <FeasibleGraph
          geometry={geometry}
          point={vertices[step]}
          candidate={vertices[step + 1]}
          path={path}
          feasible
          description={`Maximise 3x₁ + 2x₂. Current point (${x}, ${y}); objective ${3 * x + 2 * y}. ${explanations[step]}`}
        />
        <div className="preview-legend">
          <span>● Current</span>
          <span>○ Next</span>
          <span>Shaded: feasible</span>
        </div>
        <div className="math-controls">
          <div className="math-readout" aria-live="polite" aria-atomic="true">
            <span>{labels[step]}</span>
            <strong>
              ({x}, {y}) · z = <b>{3 * x + 2 * y}</b>
            </strong>
          </div>
          <button
            onClick={() => setStep((step + 1) % 3)}
            className="step-button needs-js"
            aria-label={
              step === 2 ? "Reset the simplex preview" : "Next simplex step"
            }
          >
            {step === 2 ? "Reset" : "Next step"}
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
        <p className="preview-explanation">{explanations[step]}</p>
      </div>
    </article>
  );
}
