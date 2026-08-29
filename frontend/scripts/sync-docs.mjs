// Sync curated docs from the gombit framework repo into the website.
//
// gombit/docs/*.md is the single source of truth; this copies a curated set
// into src/content/docs/<slug>.md (committed, so the deploy is self-contained)
// and rewrites links: in-set doc links -> /guide/<slug>, everything else
// (source files, ADRs, repo-root files) -> github.com/gombit-dev/gombit blobs.
//
// Re-run after the framework docs change: `node scripts/sync-docs.mjs`
// (or `GOMBIT_DOCS_DIR=/path/to/gombit/docs node scripts/sync-docs.mjs`).
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const docsSrc = process.env.GOMBIT_DOCS_DIR ?? resolve(root, "../../gombit/docs");
const outDir = resolve(root, "src/content/docs");
const REPO = "https://github.com/gombit-dev/gombit";

// Canonical docs IA (DESIGN.md §5). source = filename in gombit/docs (no .md).
const GROUPS = [
  {
    title: "Getting started",
    pages: [
      { slug: "installation", source: "installation", title: "Installation" },
      { slug: "tutorial", source: "tutorial", title: "Tutorial" },
      { slug: "cli", source: "cli", title: "CLI" },
    ],
  },
  {
    title: "Runtime",
    pages: [
      { slug: "configuration", source: "config", title: "Configuration" },
      { slug: "lifecycle", source: "lifecycle", title: "Lifecycle" },
      { slug: "routing", source: "router", title: "Routing" },
      { slug: "logging", source: "logging", title: "Logging" },
      { slug: "caching", source: "cache", title: "Caching" },
    ],
  },
  {
    title: "Data",
    pages: [
      { slug: "database", source: "database", title: "Database" },
      { slug: "migrations", source: "migrations", title: "Migrations" },
    ],
  },
  {
    title: "Contract",
    pages: [
      { slug: "contract", source: "contract", title: "Contract & validation" },
      { slug: "openapi", source: "openapi", title: "OpenAPI" },
      { slug: "typescript-client", source: "client", title: "TypeScript client" },
    ],
  },
  {
    title: "Frontend",
    pages: [
      { slug: "frontend", source: "frontend", title: "React frontend" },
      { slug: "frontend-mui", source: "frontend-mui", title: "MUI preset" },
      { slug: "deployment", source: "build", title: "Deployment" },
    ],
  },
  {
    title: "Auth & admin",
    pages: [
      { slug: "authentication", source: "auth", title: "Authentication (JWT)" },
      { slug: "authentication-cookie", source: "auth-cookie", title: "Cookie auth & CSRF" },
      { slug: "admin", source: "admin", title: "Admin" },
    ],
  },
];

const pages = GROUPS.flatMap((g) => g.pages);
const sourceToSlug = new Map(pages.map((p) => [`${p.source}.md`, p.slug]));

// Resolve a link target (relative to gombit/docs/) to a repo-root path.
function repoPath(target) {
  const parts = `docs/${target}`.split("/");
  const stack = [];
  for (const part of parts) {
    if (part === "" || part === ".") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  return stack.join("/");
}

function rewriteLink(target) {
  if (/^(https?:|mailto:|#)/.test(target)) return target;
  const [path, anchor = ""] = target.split("#");
  const suffix = anchor ? `#${anchor}` : "";
  const bare = path.replace(/^\.\//, "").replace(/^docs\//, "");
  if (sourceToSlug.has(bare)) return `/guide/${sourceToSlug.get(bare)}${suffix}`;
  const rp = repoPath(path);
  const kind = /\.[a-z0-9]+$/i.test(rp) ? "blob" : "tree";
  return `${REPO}/${kind}/main/${rp}${suffix}`;
}

function sync() {
  if (!existsSync(docsSrc)) {
    throw new Error(
      `sync-docs: gombit docs not found at ${docsSrc}. ` +
        `Set GOMBIT_DOCS_DIR to the gombit repo's docs/ directory.`,
    );
  }
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  for (const page of pages) {
    const raw = readFileSync(resolve(docsSrc, `${page.source}.md`), "utf-8");
    const rewritten = raw.replace(/\]\(([^)]+)\)/g, (_m, target) => `](${rewriteLink(target)})`);
    writeFileSync(resolve(outDir, `${page.slug}.md`), rewritten);
  }

  const manifest = GROUPS.map((g) => ({
    title: g.title,
    pages: g.pages.map((p) => ({ slug: p.slug, title: p.title })),
  }));
  writeFileSync(resolve(root, "src/content/docs-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

  console.log(`sync-docs: wrote ${pages.length} docs + manifest from ${docsSrc}`);
}

// README links are relative to the repo root (not docs/).
function rewriteReadmeLink(target) {
  if (/^(https?:|mailto:|#)/.test(target)) return target;
  const [path, anchor = ""] = target.split("#");
  const suffix = anchor ? `#${anchor}` : "";
  const clean = path.replace(/^\.\//, "");
  const kind = /\.[a-z0-9]+$/i.test(clean) ? "blob" : "tree";
  return `${REPO}/${kind}/main/${clean}${suffix}`;
}

// Extract the generated benchmark block from the framework README (between the
// benchmark-results markers) into a page. The numbers stay traceable to the
// drift-checked generator; we don't hand-edit them.
function syncBenchmarks() {
  const readmePath = resolve(docsSrc, "..", "README.md");
  if (!existsSync(readmePath)) {
    console.warn(`sync-docs: ${readmePath} not found; skipping benchmarks`);
    return;
  }
  const readme = readFileSync(readmePath, "utf-8");
  const startMark = "<!-- benchmark-results:start -->";
  const endMark = "<!-- benchmark-results:end -->";
  const start = readme.indexOf(startMark);
  const end = readme.indexOf(endMark);
  if (start === -1 || end === -1) {
    console.warn("sync-docs: benchmark markers not found in README; skipping benchmarks");
    return;
  }
  const block = readme
    .slice(start + startMark.length, end)
    .trim()
    .replace(/\]\(([^)]+)\)/g, (_m, target) => `](${rewriteReadmeLink(target)})`);
  writeFileSync(resolve(root, "src/content/benchmarks.md"), block + "\n");
  console.log("sync-docs: wrote benchmarks.md from README");
}

sync();
syncBenchmarks();
