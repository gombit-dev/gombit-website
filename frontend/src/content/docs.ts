import manifest from "./docs-manifest.json";

export type DocPage = { slug: string; title: string };
export type DocGroup = { title: string; pages: DocPage[] };

export const docGroups: DocGroup[] = manifest as DocGroup[];
export const flatDocs: DocPage[] = docGroups.flatMap((g) => g.pages);

// Markdown bodies are synced from the gombit repo (scripts/sync-docs.mjs) and
// bundled at build time.
const files = import.meta.glob("./docs/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const bySlug = new Map<string, string>();
for (const [path, content] of Object.entries(files)) {
  const slug = path.split("/").pop()!.replace(/\.md$/, "");
  bySlug.set(slug, content);
}

export function getDocSource(slug: string): string | undefined {
  return bySlug.get(slug);
}

export function docTitle(slug: string): string | undefined {
  return flatDocs.find((p) => p.slug === slug)?.title;
}

export function docNav(slug: string): { prev?: DocPage; next?: DocPage } {
  const i = flatDocs.findIndex((p) => p.slug === slug);
  if (i === -1) return {};
  return { prev: flatDocs[i - 1], next: flatDocs[i + 1] };
}
