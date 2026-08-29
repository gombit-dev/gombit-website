import { useEffect, useState } from "react";

import { useApiClient } from "../api/client";
import { unwrap } from "../api/generated/client";
import type { paths } from "../api/generated/schema";

type ReleasesResponse =
  paths["/api/v1/releases"]["get"]["responses"][200]["content"]["application/json"];
type ReleaseRow = NonNullable<ReleasesResponse["data"]>[number];

const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
);

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// Split an AI TL;DR ("- one\n- two") into clean bullet strings.
function toBullets(tldr: string): string[] {
  return tldr
    .split("\n")
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

export function ReleasesSection() {
  const client = useApiClient();
  const [releases, setReleases] = useState<ReleaseRow[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const listed = await unwrap(await client.GET("/api/v1/releases"));
        if (cancelled) {
          return;
        }
        const rows = (Array.isArray(listed.data) ? listed.data : []).slice().sort((a, b) =>
          String(b.published_at ?? "").localeCompare(String(a.published_at ?? "")),
        );
        setReleases(rows);
        setState("ready");
      } catch {
        if (!cancelled) {
          setState("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client]);

  const [featured, ...rest] = releases;

  return (
    <section className="wrap releases" id="releases">
      <div className="rel-head">
        <h2>What&apos;s new</h2>
        <p>Every GitHub release, summarized automatically. Here&apos;s the gist:</p>
      </div>

      {state === "loading" && <p className="rel-note">Loading releases…</p>}
      {state === "error" && (
        <p className="rel-note">
          Couldn&apos;t load releases right now — see them on{" "}
          <a href="https://github.com/gombit-dev/gombit/releases">GitHub</a>.
        </p>
      )}
      {state === "ready" && releases.length === 0 && (
        <p className="rel-note">No releases published yet.</p>
      )}

      {featured && <FeaturedRelease release={featured} />}

      {rest.length > 0 && (
        <div className="rel-list">
          {rest.map((r) => (
            <a className="rel-row" key={r.tag} href={r.url || "#"}>
              <span className="tag-pill">{r.tag}</span>
              <span className="rr-title">{r.name}</span>
              <span className="rr-meta">
                <span className="rr-date">{formatDate(String(r.published_at ?? ""))}</span>
                <span className="rr-arrow"><Arrow /></span>
              </span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

function FeaturedRelease({ release }: { release: ReleaseRow }) {
  const bullets = release.tldr_status === "ready" ? toBullets(String(release.tldr ?? "")) : [];
  const hasSummary = bullets.length > 0;

  return (
    <article className="release-card">
      <div className="release-top">
        <span className="tag-pill">{release.tag}</span>
        <span className="rel-date">{formatDate(String(release.published_at ?? ""))}</span>
        {hasSummary && (
          <span className="ai-badge">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l1.6 4.9L18.5 8l-4.9 1.6L12 14.5l-1.6-4.9L5.5 8l4.9-1.1L12 2Zm6.5 9l.8 2.4 2.4.8-2.4.8-.8 2.4-.8-2.4-2.4-.8 2.4-.8.8-2.4ZM5 14l.9 2.6L8.5 17.5l-2.6.9L5 21l-.9-2.6L1.5 17.5l2.6-.9L5 14Z" /></svg>
            TL;DR by AI
          </span>
        )}
      </div>
      <h3>{release.name || release.tag}</h3>

      {hasSummary ? (
        <ul className="tldr">
          {bullets.map((b, i) => (
            <li key={i}>
              <svg className="ck" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m20 6-11 11L4 12" /></svg>
              {b}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rel-note">Summary pending — read the full notes below.</p>
      )}

      <div className="release-foot">
        <a href={release.url || "#"}>
          Read the full release notes
          <Arrow />
        </a>
        <a className="all" href="https://github.com/gombit-dev/gombit/releases">All releases</a>
      </div>
    </article>
  );
}
