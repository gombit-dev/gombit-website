import { useMemo } from "react";
import { Link } from "react-router";
import { marked } from "marked";

import benchmarksMd from "../content/benchmarks.md?raw";
import "../styles/docs.css";

marked.setOptions({ gfm: true });

const REPO = "https://github.com/gombit-dev/gombit";

export function BenchmarksPage() {
  const html = useMemo(() => marked.parse(benchmarksMd) as string, []);

  return (
    <div className="docs">
      <header className="docs-header">
        <div className="docs-header-inner">
          <Link to="/" className="docs-brand">Gombit</Link>
          <nav className="docs-topnav">
            <Link to="/guide">Docs</Link>
            <a href={REPO}>GitHub</a>
          </nav>
        </div>
      </header>

      <div className="benchmarks-page">
        <article className="doc">
          <h1>Performance</h1>
          <p className="doc-lede">
            We benchmark Gombit because framework overhead should be measurable — not to
            win a cross-language leaderboard. The figures below are a same-host, closed-loop
            snapshot under fixed resource limits, generated from the framework repo and
            drift-checked in CI. Read the methodology before citing any of them.
          </p>
          {/* Trusted, generated benchmark tables synced from the gombit README. */}
          <div className="doc-body" dangerouslySetInnerHTML={{ __html: html }} />
          <p className="benchmarks-more">
            <a href={`${REPO}/blob/main/benchmarks/docs/methodology.md`}>
              Read the full benchmark methodology →
            </a>
          </p>
        </article>
      </div>
    </div>
  );
}
