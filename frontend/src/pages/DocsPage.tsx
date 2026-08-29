import { useMemo, type MouseEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { marked } from "marked";

import { docNav, getDocSource } from "../content/docs";

marked.setOptions({ gfm: true });

export function DocsPage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const source = getDocSource(slug);
  const html = useMemo(() => (source ? (marked.parse(source) as string) : ""), [source]);

  if (!source) {
    return <Navigate to="/guide" replace />;
  }

  const { prev, next } = docNav(slug);

  // Keep in-app doc links (rewritten to /docs/... by sync-docs) as SPA
  // navigations instead of full reloads; leave anchors and external links alone.
  function onClick(event: MouseEvent<HTMLDivElement>) {
    const anchor = (event.target as HTMLElement).closest("a");
    const href = anchor?.getAttribute("href");
    if (!href || !href.startsWith("/guide/") || event.metaKey || event.ctrlKey) {
      return;
    }
    event.preventDefault();
    navigate(href);
  }

  return (
    <article className="doc">
      {/* Content is our own trusted framework docs, synced from the gombit repo. */}
      <div className="doc-body" onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />
      <nav className="doc-pager">
        {prev ? <Link to={`/guide/${prev.slug}`}>← {prev.title}</Link> : <span />}
        {next ? <Link to={`/guide/${next.slug}`}>{next.title} →</Link> : <span />}
      </nav>
    </article>
  );
}
