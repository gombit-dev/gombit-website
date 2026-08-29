// Lightweight client-side docs search over the markdown already bundled in the
// docs chunk (import.meta.glob in ./docs). No index files, no network — the
// content is in memory, so search is instant. Ranking weights title and heading
// hits above body hits; results carry a snippet around the first match.
import { flatDocs, getDocSource } from "./docs";

type IndexedDoc = {
  slug: string;
  title: string;
  headings: string;
  text: string;
  textLower: string;
};

function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ") // fenced code
    .replace(/`[^`]*`/g, " ") // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links -> text
    .replace(/^#{1,6}\s+/gm, "") // heading markers
    .replace(/[*_>#|]+/g, " ") // md punctuation
    .replace(/\s+/g, " ")
    .trim();
}

function headingsOf(md: string): string {
  const out: string[] = [];
  for (const line of md.split("\n")) {
    const m = /^#{1,6}\s+(.*)$/.exec(line);
    if (m) out.push(m[1].replace(/[`*_]/g, "").trim());
  }
  return out.join(" ");
}

const index: IndexedDoc[] = flatDocs.map((page) => {
  const md = getDocSource(page.slug) ?? "";
  const text = stripMarkdown(md);
  return {
    slug: page.slug,
    title: page.title,
    headings: headingsOf(md).toLowerCase(),
    text,
    textLower: text.toLowerCase(),
  };
});

export type SearchResult = { slug: string; title: string; snippet: string };

export function searchDocs(query: string, limit = 8): SearchResult[] {
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length >= 2);
  if (terms.length === 0) {
    return [];
  }

  const scored = index
    .map((doc) => {
      const titleLower = doc.title.toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (titleLower.includes(term)) score += 10;
        if (doc.headings.includes(term)) score += 4;
        let at = doc.textLower.indexOf(term);
        for (let hits = 0; at !== -1 && hits < 6; hits += 1) {
          score += 1;
          at = doc.textLower.indexOf(term, at + term.length);
        }
      }
      return { doc, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ doc }) => ({ slug: doc.slug, title: doc.title, snippet: snippet(doc, terms) }));
}

function snippet(doc: IndexedDoc, terms: string[]): string {
  const positions = terms.map((t) => doc.textLower.indexOf(t)).filter((i) => i >= 0);
  const first = positions.length ? Math.min(...positions) : 0;
  const start = Math.max(0, first - 48);
  let text = doc.text.slice(start, start + 150).trim();
  if (start > 0) text = "…" + text;
  if (start + 150 < doc.text.length) text += "…";
  return text;
}
