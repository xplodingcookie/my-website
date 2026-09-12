import { ArrowUpRight } from "lucide-react";
import Project from "./Project";

export default function ProjectEvidence() {
  return (
    <>
      <article className="project-row taxi-evidence">
        <div className="project-copy">
          <p className="project-eyebrow">NYC taxi analysis · 2024</p>
          <h3>
            Taxi Revenue
            <br />
            Optimisation<span className="accent-text">.</span>
          </h3>
          <p className="project-standfirst">
            From 20 million trip records <br />
            to a daily fare prediction.
          </p>
          <p className="project-description">
            I combined taxi and weather data to predict the average daily fare
            by pickup zone, then compared linear regression with a feed-forward
            neural network.
          </p>
          <dl className="project-decisions">
            <div>
              <dt>Prevent leakage</dt>
              <dd>
                Removed trip time, distance, and direct fare proxies from the
                model inputs.
              </dd>
            </div>
            <div>
              <dt>Respect the data</dt>
              <dd>
                Kept sparse traffic counts in the exploratory analysis, rather
                than imputing them into daily predictions.
              </dd>
            </div>
            <div>
              <dt>Test forward in time</dt>
              <dd>
                Trained on October 2022–March 2023; evaluated on the following
                April–June.
              </dd>
            </div>
          </dl>
          <a
            href="/Optimising_Daily_Revenue_Dong_Li.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="project-cta"
          >
            Read the analysis <span className="project-link-meta">PDF</span>
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        </div>
        <figure className="taxi-results">
          <div className="results-heading">
            <span className="eyebrow">Reported model results</span>
            <span>R² · higher is better</span>
          </div>
          <h4>Predicting average daily fare</h4>
          <div className="result-bar">
            <div>
              <span>Linear regression</span>
              <strong>0.822</strong>
            </div>
            <div className="bar-track">
              <span style={{ width: "82.2124%" }} />
            </div>
          </div>
          <div className="result-bar">
            <div>
              <span>Neural network</span>
              <strong>0.840</strong>
            </div>
            <div className="bar-track">
              <span style={{ width: "83.9894%" }} />
            </div>
          </div>
          <div className="result-axis" aria-hidden="true">
            <span>0</span>
            <span>0.5</span>
            <span>1.0</span>
          </div>
          <p className="results-takeaway">
            A small gain in fit, with a tradeoff in interpretability.
          </p>
          <dl className="data-pipeline">
            <div>
              <dt>Raw trips</dt>
              <dd>20.12m</dd>
            </div>
            <span aria-hidden="true">→</span>
            <div>
              <dt>After cleaning</dt>
              <dd>17.93m</dd>
            </div>
          </dl>
          <figcaption>
            Replotted from my report, pp. 2 & 7–8. These are model evaluation
            results, not measured changes in driver income.{" "}
            <a
              href="/Optimising_Daily_Revenue_Dong_Li.pdf#page=7"
              target="_blank"
              rel="noopener noreferrer"
            >
              See results ↗
            </a>
          </figcaption>
        </figure>
      </article>
      <Project
        index="This portfolio"
        name="Github, Website Source Code & More"
        description="My github with uni projects, personal projects and unfinished dreams :P"
        link="https://github.com/xplodingcookie/my-website"
        image="/website_banner.svg"
        reverse
      />
    </>
  );
}
