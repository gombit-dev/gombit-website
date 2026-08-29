import { Suspense, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router";

import { docGroups } from "../content/docs";
import { searchDocs } from "../content/search";
import "../styles/docs.css";

function DocsSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const results = useMemo(() => (open ? searchDocs(query) : []), [query, open]);

  function go(slug: string) {
    navigate(`/guide/${slug}`);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="docs-search">
      <svg className="docs-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>
      <input
        type="search"
        value={query}
        placeholder="Search docs…"
        aria-label="Search documentation"
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "Escape") { setOpen(false); (e.target as HTMLInputElement).blur(); }
          if (e.key === "Enter" && results[0]) go(results[0].slug);
        }}
      />
      {open && query.trim().length >= 2 && (
        <div className="docs-search-results" role="listbox">
          {results.length === 0 ? (
            <p className="docs-search-empty">No matches for “{query}”.</p>
          ) : (
            results.map((r) => (
              <button type="button" key={r.slug} className="docs-search-hit" onMouseDown={() => go(r.slug)}>
                <span className="hit-title">{r.title}</span>
                <span className="hit-snippet">{r.snippet}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function DocsLayout() {
  return (
    <div className="docs">
      <header className="docs-header">
        <div className="docs-header-inner">
          <Link to="/" className="docs-brand">Gombit</Link>
          <DocsSearch />
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
