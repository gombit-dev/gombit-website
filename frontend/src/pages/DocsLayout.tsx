import { Suspense } from "react";
import { Link, NavLink, Outlet } from "react-router";

import { docGroups } from "../content/docs";
import "../styles/docs.css";

export function DocsLayout() {
  return (
    <div className="docs">
      <header className="docs-header">
        <div className="docs-header-inner">
          <Link to="/" className="docs-brand">Gombit</Link>
          <nav className="docs-topnav">
            <NavLink to="/guide" end className={({ isActive }) => (isActive ? "active" : "")}>Docs</NavLink>
            <a href="https://github.com/gombit-dev/gombit">GitHub</a>
          </nav>
        </div>
      </header>

      <div className="docs-shell">
        <aside className="docs-sidebar" aria-label="Documentation">
          <nav>
            {docGroups.map((group) => (
              <div className="docs-group" key={group.title}>
                <p className="docs-group-title">{group.title}</p>
                <ul>
                  {group.pages.map((page) => (
                    <li key={page.slug}>
                      <NavLink
                        to={`/guide/${page.slug}`}
                        className={({ isActive }) => (isActive ? "active" : "")}
                      >
                        {page.title}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <main className="docs-content">
          <Suspense fallback={<p className="doc-loading">Loading…</p>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
