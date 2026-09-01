import { ReleasesSection } from "../components/ReleasesSection";
import mascotUrl from "../assets/mascot.png";
import "../styles/landing.css";

const REPO = "https://github.com/gombit-dev/gombit";

const Check = () => (
  <svg className="ck-yes" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-label="included"><path d="m20 6-11 11L4 12" /></svg>
);

// [feature, what you'd do with a bare router] — Gombit includes them all.
const compareRows: Array<[string, string]> = [
  ["Routing", "yes"],
  ["ORM", "choose one"],
  ["Migrations", "choose one"],
  ["OpenAPI 3.1", "choose one"],
  ["TypeScript client", "choose one"],
  ["Auth & sessions", "choose one"],
  ["Django-style admin", "build it"],
  ["React integration", "build it"],
];

export function LandingPage() {
  return (
    <div className="landing">
      <header className="site-header">
        <div className="wrap nav">
          <a className="brand" href="/" aria-label="Gombit home">
            Gombit
          </a>
          <nav className="nav-links">
            <a href="/guide">Docs</a>
            <a href="/guide/tutorial">Tutorial</a>
            <a href="/benchmarks">Benchmarks</a>
            <a href="#releases">Releases</a>
            <a href={REPO}>GitHub</a>
          </nav>
          <a className="btn btn-primary nav-cta" href="/guide/installation">Get Started</a>
          <details className="nav-menu">
            <summary className="nav-toggle" aria-label="Open menu">
              <svg className="nav-icon-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></svg>
              <svg className="nav-icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6 18 18" /><path d="M18 6 6 18" /></svg>
            </summary>
            <nav className="nav-drawer">
              <a href="/guide">Docs</a>
              <a href="/guide/tutorial">Tutorial</a>
              <a href="/benchmarks">Benchmarks</a>
              <a href="#releases">Releases</a>
              <a href={REPO}>GitHub</a>
            </nav>
          </details>
        </div>
      </header>

      <main>
        <section className="wrap hero">
          <div className="hero-copy">
            <h1>The batteries-included web framework for <span className="go">Go.</span></h1>
            <p className="tagline">Django&apos;s productivity. Go&apos;s runtime.</p>
            <p className="lede">Build full-stack applications with typed APIs, migrations, authentication, React, and an admin — without assembling the stack yourself.</p>
            <div className="cta-row">
              <a className="btn btn-primary" href="/guide/installation">Get Started</a>
              <a className="btn btn-ghost" href={REPO}>
                <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38v-1.32c-2.23.49-2.7-1.08-2.7-1.08-.36-.92-.89-1.17-.89-1.17-.73-.5.05-.49.05-.49.81.06 1.23.83 1.23.83.72 1.23 1.88.87 2.34.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z" /></svg>
                View on GitHub
              </a>
            </div>
            <div className="terminal" role="img" aria-label="Terminal: go install github.com/gombit-dev/gombit/cmd/gombit@latest; gombit new tasks; gombit dev">
              <div className="term-bar"><span className="dot r"></span><span className="dot y"></span><span className="dot g"></span></div>
              <div className="term-body">
                <div className="l"><span className="p">$</span> go install github.com/gombit-dev/gombit/cmd/gombit@latest</div>
                <div className="l"><span className="p">$</span> gombit new tasks</div>
                <div className="l"><span className="p">$</span> gombit dev</div>
              </div>
            </div>
          </div>

          <div className="hero-art">
            <div className="hero-glow" aria-hidden="true"></div>
            <img src={mascotUrl} alt="Gombit mascot: a Go gopher running with a wrench and a tool belt" />
          </div>
        </section>

        <section className="wrap chain">
          <h2>One source of truth.</h2>
          <p className="chain-lede">Declare your model once. It drives the schema and the API; the API drives the client. Nothing hand-synchronized.</p>
          <div className="chain-diagram">
            <div className="node node-source">Your GORM model</div>
            <div className="chain-tracks">
              <div className="track">
                <span className="track-label">Schema</span>
                <span className="node">Atlas diff</span>
                <span className="arrow" aria-hidden="true">→</span>
                <span className="node">Versioned SQL</span>
              </div>
              <div className="track">
                <span className="track-label">API</span>
                <span className="node">Huma handler</span>
                <span className="arrow" aria-hidden="true">→</span>
                <span className="node">OpenAPI 3.1</span>
                <span className="arrow" aria-hidden="true">→</span>
                <span className="node">TypeScript client</span>
                <span className="arrow" aria-hidden="true">→</span>
                <span className="node">React</span>
              </div>
              <div className="track">
                <span className="track-label">Admin</span>
                <span className="node">admin registry</span>
                <span className="arrow" aria-hidden="true">→</span>
                <span className="node">/admin/</span>
              </div>
            </div>
          </div>
          <p className="chain-note">Both arrows out of your model are the point — and a drift check fails CI if the API and its generated client ever disagree.</p>
        </section>

        <section className="wrap features">
          <h2>Everything you need.</h2>
          <div className="cards">
            <article className="card">
              <div className="icon-tile">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m8 8-4 4 4 4" /><path d="m16 8 4 4-4 4" /></svg>
              </div>
              <h3>Typed end-to-end</h3>
              <p>Go handlers become OpenAPI and a generated TypeScript client.</p>
            </article>
            <article className="card">
              <div className="icon-tile">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5" /><path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" /></svg>
              </div>
              <h3>Migrations you can trust</h3>
              <p>Models produce reviewable, versioned SQL migrations.</p>
            </article>
            <article className="card">
              <div className="icon-tile">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18" /><circle cx="8.5" cy="14" r="1.6" /><path d="M12.5 16.2c0-1.4 1.1-2.2 2.2-2.2s2.2.8 2.2 2.2" /></svg>
              </div>
              <h3>A real admin</h3>
              <p>Register a model and get a runtime Django-style admin.</p>
            </article>
          </div>
        </section>

        <ReleasesSection />

        <div className="admin-peek" aria-label="Preview of the Gombit admin">
          <div className="admin-bar">
            <div className="admin-title">Gombit <span>Admin</span></div>
            <div className="admin-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>
              Search…
            </div>
            <div className="admin-right">
              <span className="link">View site
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 4h6v6" /><path d="M20 4 11 13" /><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" /></svg>
              </span>
              <span className="who">admin
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
              </span>
            </div>
          </div>
        </div>
        <section className="wrap compare">
          <h2>Gombit, or assemble it yourself.</h2>
          <p className="compare-lede">Every row below is a decision you don&apos;t have to make — and then wire together.</p>
          <div className="compare-table-wrap">
            <table className="compare-table">
              <thead>
                <tr>
                  <th scope="col"><span className="visually-hidden">Feature</span></th>
                  <th scope="col" className="col-gombit">Gombit</th>
                  <th scope="col">Gin / Echo / Fiber</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map(([label, other]) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    <td className="col-gombit"><Check /></td>
                    <td>{other === "yes" ? <Check /> : <span className="cell-muted">{other}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="compare-note">
            Gombit <em>is</em> Gin underneath, and hands it back on request — <code>app.Router()</code>.
            Want a bare router? Use one. Want the batteries wired together and agreeing with each other? Use Gombit.
          </p>
        </section>
      </main>

      <footer className="site-footer">
        <div className="wrap footer-inner">
          <span>© 2026 Gombit · MIT licensed</span>
          <nav>
            <a href={REPO}>GitHub</a>
            <a href="/guide">Docs</a>
            <a href={`${REPO}/blob/main/LICENSE`}>License</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
