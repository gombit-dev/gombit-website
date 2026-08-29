import { Link } from "react-router";

import { docGroups } from "../content/docs";

export function DocsIndex() {
  return (
    <article className="doc">
      <h1>Documentation</h1>
      <p className="doc-lede">
        Everything to build a full-stack app with Gombit — from install to deploy.
        New here? Start with <Link to="/guide/installation">Installation</Link>, then the{" "}
        <Link to="/guide/tutorial">Tutorial</Link>.
      </p>
      <div className="docs-index-grid">
        {docGroups.map((group) => (
          <section className="docs-index-group" key={group.title}>
            <h2>{group.title}</h2>
            <ul>
              {group.pages.map((page) => (
                <li key={page.slug}>
                  <Link to={`/guide/${page.slug}`}>{page.title}</Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </article>
  );
}
