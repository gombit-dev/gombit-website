# gombit.dev — Website Design Doc

**Status:** Draft v1 · **Repo:** `gombit-dev/gombit-website` · **Date:** 2026-08-28

This document defines what we build for `gombit.dev`, why, and in what order. It
is deliberately opinionated and scoped small. The framework is the interesting
software; the website must not become a second engineering project.

---

## 1. The one job

> Someone hears **"Django for Go,"** clicks a link, and within **60 seconds**
> thinks: *oh — this is actually real.*

Every decision below serves that sentence. The landing page's purpose is not to
explain everything Gombit does; it's to establish, fast, that Gombit is a *real
framework* and not a weekend repo. The moment that flips a skeptical Go developer
is seeing the **runtime admin** and the **one-source-of-truth generation chain**.

### Why now

- The framework has crossed the line where **presentation is part of the
  product**: coherent pitch, quickstart, admin, migrations, generated client,
  single-binary deploy, and a careful benchmark methodology all exist today.
- **People we don't control are starting to encounter Gombit.** README-only
  onboarding will start costing us users. The site converts *"some guy made an
  enormous Go framework"* into *"Gombit is an actual framework."*

---

## 2. Goals / non-goals

**Goals**
- **Built with Gombit.** The site is dogfood: a live, public proof that the
  framework builds real software. Every claim the landing page makes — the
  generation chain, the admin, single-binary deploy — is *running the site you
  are reading it on.* This is now a first-class goal, not just an
  implementation detail (see §4).
- A single, fast site that is **both** the marketing landing page **and** the
  documentation home.
- Onboarding path: land → understand the thesis → `go install` → first app.
- Look **Go-native, technical, restrained, slightly playful** (mascot), never
  VC-SaaS-gradient.
- Content routes are **prerendered to crawlable HTML** (§4.4) so the site ranks
  and loads fast despite being a React SPA underneath.

**Non-goals (explicitly out for v1)**
- No visitor accounts. Auth exists only to gate the maintainer admin.
- **No third-party CMS.** Content that changes (changelog, benchmark numbers,
  showcase) is managed through **Gombit's own admin** — that's the point.
- No heavy animation, no 3D, no marketing microsites.
- No subdomain sprawl (`docs.`, `benchmarks.`, `blog.`). Keep the ecosystem
  compact while it's young — one domain, path-based.
- No feature scope creep into M6 batteries (jobs, mail, i18n, …) just because we
  now run a real backend. The site uses only what v0.1 ships.

---

## 3. Audience

| Visitor | Arrives from | What flips them | Where they go |
| --- | --- | --- | --- |
| Skeptical Go dev | HN / Reddit / X, "Django for Go" | admin screenshot + generation chain | GitHub, then `/docs` |
| Django/Rails dev eyeing Go | search, word of mouth | "the batteries are here, and typed" | Get Started |
| Evaluator / lead | comparison searches | comparison table + honest benchmarks | `/benchmarks/`, `/docs/deployment` |
| Contributor | GitHub | roadmap, ADRs, methodology | GitHub, `/docs` |

Primary target is row 1. When a decision trades off, optimize for the skeptical
Go developer scrolling the landing page for the first time.

---

## 4. Tech stack — Gombit, dogfooded

**The site is a Gombit app.** It is scaffolded with `gombit new`, its frontend is
Gombit's React+TypeScript+Vite app, its content is served by a Gombit/Huma API,
its editable content lives behind Gombit's admin, and it ships as a single
`gombit build --embed` binary. We eat our own cooking in public.

### 4.1 Why this is worth the cost

The marketing value is high and specific: a skeptical Go dev reads *"typed API →
OpenAPI → generated TS client → React, plus a real admin, in one binary,"* and the
site itself **is** that sentence, live. `gombit.dev` running as one Gombit binary
is a stronger credibility signal than any benchmark table. It also gives us a
permanent, real-world regression app for the framework.

### 4.2 The honest cost (read this before committing)

Gombit is built for **typed CRUD apps**, not static documentation sites. A
docs/marketing site is mostly static content that must rank on Google and paint
fast for a first-time visitor from HN. Gombit's frontend is a **client-rendered
SPA** — the weakest starting point for SEO and first paint. Adopting Gombit means
**we hand-build two things Astro/Starlight would have given us for free:**

1. a **docs rendering + search pipeline** in React (Markdown → pages, sidebar nav,
   code highlighting, full-text search), and
2. a **prerender step** (§4.4) so content routes are crawlable HTML.

These are the two "second engineering project" risks the site must consciously
bound. They are solvable and scoped below — but they are the reason this choice is
a deliberate trade, not a free win.

### 4.3 What the backend actually does (so it isn't theater)

The API earns its place by managing the content that genuinely changes, through the
real admin:

- **Models (GORM):** `Release` (auto-ingested from GitHub with an AI TL;DR —
  see §6a), `ChangelogEntry`, `BenchmarkRun` (a stored snapshot of the generated
  benchmark numbers + metadata/caveats), and `ShowcaseApp` (apps built with
  Gombit).
- **Inbound webhook:** a Huma handler at `POST /api/v1/webhooks/github` verifies
  the GitHub HMAC signature and, on a `release` event, writes a `Release` row —
  the marquee reason the DB is not decorative (§6a).
- **Admin:** the maintainer edits changelog/showcase/benchmark rows at `/admin/` —
  cookie auth, superuser. This is the exact admin the landing page brags about,
  demonstrated on the site's own data.
- **API + generated client:** typed Huma handlers expose this content; the
  `/benchmarks/` and `/changelog/` pages consume the **generated TypeScript
  client**. So the site *is* the model→OpenAPI→TS-client→React chain, end to end.
- **Static content (docs, landing copy):** stays in the repo as Markdown/MDX,
  built into the frontend — it does not need the database. Only genuinely-mutable
  content goes through the API/admin; we don't shove docs into a DB to make a
  point.

### 4.4 Docs, search, and SEO (the hand-built parts)

- **Docs pipeline:** author docs as Markdown/MDX in the repo; a Vite plugin
  compiles them to React routes at build. Sidebar nav from a hand-maintained
  manifest mirroring §5. Code highlighting via Shiki (build-time). Mermaid
  rendered at build time (the README architecture diagram is the hero visual).
- **Search (DECIDED — client-side index, not Pagefind):** docs are client-
  rendered SPA routes, so their content is already bundled in the docs chunk;
  Pagefind (which crawls per-route static HTML we don't emit) has nothing to
  index and its content-offloading benefit is moot. Instead a small in-memory
  index (`src/content/search.ts`) searches the already-loaded markdown —
  instant, no binary, no index files, no service. Title/heading hits rank above
  body hits; results show a snippet. If docs ever move to per-route prerender,
  Pagefind (or its Node indexing API) becomes viable again.
- **Prerender / SEO:** add a build-time prerender of all content routes (landing +
  every docs page) to static HTML that hydrates into the SPA (e.g. a
  `vite-plugin-ssr`/SSG-style pass, or a headless-Chromium prerender of the route
  list). The Go binary serves those prerendered HTML files for content URLs, the
  SPA shell as fallback, and the API under `/api/**`. This preserves the
  single-binary embed story **and** gives crawlers real HTML.
  > **Open question (§13):** if the prerender step proves heavy, the fallback is to
  > keep docs as prerendered static and only the app-shell dynamic. Decide the
  > rendering strategy before Phase 2.

### 4.5 Scaffold

```bash
gombit new gombit-website --database sqlite --auth cookie --ui mui
```

SQLite is enough (content is small, low-write); the single embedded binary then
carries its own DB file, or point `--database postgres` at a managed PG in prod —
decide in §13. `--auth cookie` because the admin requires it. `--ui mui` is
optional; the marketing/docs frontend is bespoke, so we may scaffold without a UI
preset and build the design system by hand (§7) — decide in §13.

---

## 5. Information architecture

One domain, path-based. Marketing and docs share a repo, a design system, and a
deploy.

```text
gombit.dev/
  /                     landing (marketing)
  /guide/               documentation (at /guide, not /docs — §13 #2)
    installation
    tutorial
    cli
    configuration             # config.md
    lifecycle                 # framework.App, OnStart/OnStop
    routing                   # router.md + escape hatch
    logging
    caching                   # cache.md
    database
    migrations
    contract                  # contract.md + envelope
    openapi
    typescript-client         # client.md + drift check
    frontend                  # frontend.md
    frontend-mui
    deployment                # build.md, --embed single binary
    authentication            # auth.md (bearer)
    authentication-cookie     # auth-cookie.md + CSRF
    admin
  /benchmarks/          methodology-first performance page
  /releases/            GitHub releases + AI TL;DR (§6a); seeded from CHANGELOG.md
                        (subsumes /changelog/)
```

Docs IA mirrors the framework's own `docs/README.md` groupings (Getting started ·
Runtime · Data · Contract · Frontend · Auth & admin) so there is one mental model
across README, in-repo docs, and site.

**Top nav:** Docs · Benchmarks · Changelog · GitHub (icon) · theme toggle.
**Footer:** GitHub, issues, license (MIT), security policy, pkg.go.dev, code of
conduct.

---

## 6. Landing page anatomy

Sections top to bottom. Each is a self-contained band; the whole page is one
scroll with no routing.

### 6.1 Hero
- Mascot (the wrench-wielding gopher, tool belt with `>_` buckle) at left or as a
  restrained hero accent — **not** a giant centered splash.
- Headline: **The batteries-included web framework for Go.**
- Sub: *Build a typed Go API, React frontend, migrations, authentication, and
  admin from one project.*
- Tagline: **Django's productivity. Go's runtime.**
- CTAs: `[Get Started]` (→ `/docs/installation`) · `[GitHub]`.
- Small status line: *pre-1.0 · M0–M5 + admin shipped · MIT.*

### 6.2 Install / first run (the 60-second proof)
Copy-buttoned block, verbatim from the README so it never drifts:

```bash
go install github.com/gombit-dev/gombit/cmd/gombit@latest
gombit new tasks --database sqlite --auth cookie --ui mui
cd tasks
gombit dev
```

Immediately below, the three local URLs as a compact table (React app · `/docs` ·
`/admin/`) so the reader sees what they get.

### 6.3 The conceptual killer feature — one source of truth
Visual, front and center. Reuse the README's Mermaid graph, rendered at build:

```text
GORM model ──▶ Atlas diff ──▶ versioned SQL
     │
     └──▶ Huma handlers ──▶ Gin router
                    │
                    └──▶ OpenAPI 3.1 ──▶ TypeScript client ──▶ React
GORM model ──▶ admin registry ──▶ /admin/ SPA
```

Caption: *Both arrows out of your model are the point — one declaration drives the
schema and the API; one API drives the client.* This is the diagram that makes the
"typed, wired-together" claim legible in three seconds.

### 6.4 Batteries included
Eight-item icon grid, straight from the README:

🗃 GORM + SQLite/Postgres/MySQL · 🔄 Atlas migrations · 🔐 Sessions/JWT/CSRF ·
📜 OpenAPI 3.1 · ⚛️ React + TypeScript client generation · 🛠 Django-style runtime
admin · 📦 Single-binary deployment · 🧰 `gombit` CLI

### 6.5 The admin — the scroll-stopper
The single most important visual on the page. **A screenshot or short GIF** of a
real `/admin/` list+detail. Copy: *"Wait — that's a real admin?" Yes.* One line
underneath: *No other Go framework — Gin, Echo, Fiber, Encore — ships one.*

> **Asset needed.** This is the highest-leverage asset on the site. See §10.

### 6.6 See what Gombit generates (before/after)
```bash
gombit make resource Task title:string:required done:bool
```
→ model · → Huma handler · → routes · → React pages · → OpenAPI · → typed client.
Note it edits `main.go` via `go/ast` (never regex), idempotent and additive.

### 6.7 Performance — credibility, not chest-beating
Framing first: *We benchmark Gombit because framework overhead should be
measurable.* Show **2–3** honest numbers (e.g. cold start 11 ms, ~20 MB loaded,
Postgres CRUD read in the same band as Gin+GORM/Django), each with the "same-host,
closed-loop snapshot" caveat, then: **`Read the benchmark methodology →`**
(`/benchmarks/`). The careful methodology is the asset — not a "GO FAST, RAILS BAD"
leaderboard. Never strip the caveats.

### 6.8 Gombit vs assembling it yourself
The README's comparison, reframed around **assembly**, not raw RPS:

| | Gombit | Gin |
| --- | --- | --- |
| Routing | ✅ | ✅ |
| ORM | ✅ | choose one |
| Migrations | ✅ | choose one |
| OpenAPI | ✅ | choose one |
| TS client | ✅ | choose one |
| Auth | ✅ | choose one |
| Admin | ✅ | build it |
| React integration | ✅ | build it |

Honesty line, from the README: *Gombit is younger than all of them. If you want a
minimal router, use Gin directly — Gombit* is *Gin underneath, and hands it back
on request (`app.Router()`).*

### 6.9 Final CTA
**Build your first Gombit app.** `Get Started →` (→ `/docs/tutorial`).

---

## 6a. Releases, auto-summarized (the dogfood feature)

The `/releases/` page (and a "What's new" strip on the landing page) is populated
**automatically from GitHub releases**, each with an AI-written TL;DR. This is the
feature that makes the SQLite backend earn its keep — it's write-driven, event-
driven, and impossible to do with a static site generator.

**Flow:**

```text
GitHub release published
        │  webhook (release event, HMAC-signed)
        ▼
POST /api/v1/webhooks/github   (Huma handler, verifies GOMBIT_GITHUB_WEBHOOK_SECRET)
        │  store tag, name, body (release notes), URL, published_at
        ▼
Release row (GORM / SQLite)  ── status: pending_summary
        │  summarize the release notes with the xAI (Grok) API
        ▼
Release.tldr = "3–5 bullet 'what's new' summary"   ── status: ready
        │  purge Cloudflare cache for / and /releases
        ▼
/releases/ page renders via the generated TypeScript client
```

**Design notes**
- **Verification first.** The handler rejects any payload whose HMAC doesn't match
  `GOMBIT_GITHUB_WEBHOOK_SECRET`. It only acts on `action: "published"` release
  events; everything else is a 204 no-op. Ingestion is idempotent on the release
  tag (re-delivered webhooks don't duplicate rows).
- **Summarization.** Send the release notes to the **xAI (Grok) API** — an
  OpenAI-compatible `POST /v1/chat/completions` call (no SDK, just `net/http`) —
  and store a short, neutral "what's new" TL;DR (3–5 bullets, no marketing spin —
  match the project's restrained voice). Default model `grok-4.6` (small/fast,
  cheap for this low-volume use), overridable via `XAI_MODEL`. `XAI_API_KEY` is a
  Fly secret (runbook §9.1); it is a **server-side** call — the key never touches
  frontend source (`VITE_*` is public by rule).
- **Resilience.** Summarize out of the webhook's request path (the webhook just
  persists + enqueues), so a slow or failing AI call never makes GitHub's delivery
  time out. Because v0.1 has no job queue (an M6 battery we won't pull in), the
  simplest in-scope version is: store the row as `pending_summary`, generate the
  TL;DR in a short-lived goroutine after responding 200, and fall back to showing
  the raw GitHub notes if the summary isn't ready or the API errors. The TL;DR is
  a nicety layered over authoritative release notes, never a blocker.
- **Editable.** Every `Release` (and its TL;DR) is editable in the admin — the
  maintainer can fix a summary the model got wrong. That, again, demonstrates the
  admin on the site's own live data.
- **Trust boundary.** Release-notes text is untrusted input to the model and
  untrusted HTML on the page — render the TL;DR as plain text/escaped Markdown,
  and treat the model output as data, not instructions.

This subsumes the old "static changelog" plan: `/changelog/` and `/releases/`
converge on the same GitHub-sourced, admin-editable data, seeded once from
`gombit/CHANGELOG.md` and kept current by the webhook.

## 7. Visual & brand direction

**Personality:** Go-like, technical, restrained, *slightly* playful via the
mascot. No gradients-as-personality, no glassmorphism, no stock 3D.

- **Palette:** anchor on **Go cyan `#00ADD8`** (already in the README badge) as
  the single accent, over a near-neutral gray/near-black base. One accent, used
  sparingly. Light and dark themes both first-class (Starlight gives us the
  toggle; the landing page must honor `prefers-color-scheme`).
- **Type:** a clean technical sans for prose (e.g. Inter) + a real monospace for
  all code and CLI (e.g. JetBrains Mono). Code is a first-class visual element —
  the site is mostly terminal blocks and tables, and they should look
  deliberate.
- **Mascot** (`brand/mascot.png`): the running gopher with wrench + `>_` tool
  belt. Use as hero accent, favicon, 404, and loading/empty states. Keep it a
  garnish, not the whole meal. Commission an SVG version for crisp scaling and a
  simplified favicon/monochrome mark.
- **Density:** generous whitespace, but tables and code stay tight and readable.
  The vibe target is the Go blog / pkg.go.dev / Astro docs — not a Series-A
  landing page.
- **Motion:** minimal. Copy-button feedback and maybe one subtle reveal on the
  generation diagram. Respect `prefers-reduced-motion`.

---

## 8. Content strategy — the README is the raw material

The README is already the site's script. To prevent drift:

- **Landing copy** is authored in the website repo (it's presentation), but every
  **command block, comparison row, and benchmark number is lifted verbatim** from
  the framework README/benchmarks. Numbers especially must match the generated
  benchmark table — the README's block is machine-generated and drift-checked in
  CI; the site must not hand-edit past it.
- **Docs pages**: the framework already ships authoritative Markdown in
  `gombit/docs/`. Two viable models — **decide before building docs (§13, open
  question):**
  1. **Sync/import** the canonical `.md` from the `gombit` repo into the frontend
     build (submodule or a CI fetch step); the Markdown→React pipeline (§4.4)
     renders it. Single source of truth; site is a renderer. *Recommended.*
  2. **Author docs natively** in this repo. More nav/MDX control, but forks the
     docs and risks drift.
  Recommendation: **sync** the eng-authoritative docs (installation, tutorial,
  cli, migrations, admin, auth, etc.), and reserve native MDX only for
  site-specific landing/overview pages. Keep "one source of truth" true of the
  docs, the same way it's true of the code.
- **Mutable content (changelog, benchmarks, showcase)** does *not* live in
  Markdown — it lives in the DB behind the admin (§4.3). The changelog seed comes
  from `gombit/CHANGELOG.md`; benchmark rows mirror the generated snapshot so the
  numbers still trace back to the drift-checked source.

---

## 9. Build, hosting, deploy

- **Build:** `gombit build --embed` → **one binary** carrying the API, the
  prerendered content + SPA, and the admin. This *is* the deploy story we're
  selling; the deploy pipeline is a live demo of §6.7's "single binary" claim.
- **Host (DECIDED): Fly.io behind Cloudflare.** The Gombit binary runs on a small
  Fly.io VM with a persistent volume; **Cloudflare** (the domain is already ours)
  sits in front for DNS, TLS, edge CDN caching of the prerendered HTML/assets, and
  analytics. Cloudflare's own compute (Workers/Pages) can't run a native Go +
  cgo-SQLite binary, and Cloudflare Containers offers no durable local disk — so
  Fly is the origin, Cloudflare is the edge. `gombit.dev` (and `www` → apex) is
  proxied (orange-cloud) to the Fly app; cache prerendered content, bypass cache
  for `/api/**` and `/admin/**`.
- **Data (DECIDED): SQLite on a Fly volume.** Enough for v1 — writes are
  maintainer-only. Nightly volume/DB backup (e.g. `litestream` to R2/S3, or a
  scheduled volume snapshot). Managed Postgres stays the escape hatch if write
  volume ever grows.
- **CI/CD:** GitHub Actions — on PR: build the binary, run `gombit`'s own gates
  (contract drift check, TS client up-to-date), Lighthouse + link-check on the
  prerendered output, deploy a preview. On merge to `main`: `gombit db migrate`
  then roll the binary. If docs are synced from `gombit` (§8, model 1), a push to
  `gombit`'s docs triggers a website rebuild + redeploy.
- **Secrets:** `GOMBIT_JWT_SECRET` and DB creds via the host's secret store —
  never in frontend source (`VITE_*` is public by rule). Admin is superuser-only.
- **Domain:** **grab `gombit.dev` now** if not already held. `www` → apex
  redirect. HTTPS enforced.
- **Analytics:** privacy-respecting and lightweight only (Plausible/Cloudflare
  Web Analytics) or none. No third-party trackers — it undercuts the audience's
  trust and adds JS we don't want.

### 9.1 Deploy runbook

Files in this repo: [`Dockerfile`](Dockerfile) (embedded single-binary build),
[`fly.toml`](fly.toml), [`deploy/docker-entrypoint.sh`](deploy/docker-entrypoint.sh)
(runs `gombit db migrate` on boot, then the server).

**One-time Fly setup**

```bash
fly launch --no-deploy --copy-config --name gombit-website   # reuses fly.toml
fly volumes create gombit_data --size 1 --region iad         # SQLite lives here
fly secrets set \
  GOMBIT_JWT_SECRET="$(openssl rand -hex 32)" \
  GOMBIT_GITHUB_WEBHOOK_SECRET="$(openssl rand -hex 32)" \
  XAI_API_KEY="xai-…"                                         # release TL;DR via xAI Grok (§6a)
fly deploy
fly ssh console -C "gombit createsuperuser --email you@example.com"  # admin login
```

Keep it to **one machine** (`min_machines_running = 1`, `auto_stop = off`):
SQLite is single-writer and migrations run at boot.

**Cloudflare DNS** (zone `gombit.dev`, already registered) — point the apex and
`www` at the Fly app, proxied so Cloudflare's CDN/WAF/analytics are in path:

| Type | Name | Target | Proxy |
| --- | --- | --- | --- |
| `CNAME` | `@` (apex) | `gombit-website.fly.dev` | **Proxied** (orange) |
| `CNAME` | `www` | `gombit.dev` | **Proxied** (orange) |

(Cloudflare flattens the apex CNAME automatically.) Add a **Redirect Rule**
`www.gombit.dev/*` → `https://gombit.dev/$1` (301).

**Cloudflare SSL/TLS:** mode **Full (strict)** — Fly presents a valid cert for
`*.fly.dev`, so the edge→origin hop is verified. Enable **Always Use HTTPS** and
**Automatic HTTPS Rewrites**.

**Cloudflare cache rules** — cache the prerendered content, never cache the API
or the authenticated admin:

| Rule (match) | Action |
| --- | --- |
| `http.request.uri.path starts_with "/api/"` | **Bypass cache** |
| `http.request.uri.path starts_with "/admin/"` | **Bypass cache** |
| `http.request.uri.path eq "/login"` or cookie present | **Bypass cache** |
| `http.request.uri.path starts_with "/assets/"` | **Cache**, Edge TTL 1y (hashed filenames — immutable) |
| default (prerendered HTML: `/`, `/docs/*`, …) | **Cache**, Edge TTL ~1h, honor origin, respect `Vary` |

After a deploy, **purge the HTML cache** (or purge everything) so new content
shows immediately: `Caching → Configuration → Purge`. The GitHub-release webhook
handler (§6a) should also trigger a targeted purge of `/` and `/changelog` after
it writes a new release.

**Ongoing deploys:** `fly deploy` (CI does this on merge to `main`). The
entrypoint migrates before serving; a failed migration fails the release.

**Backups:** `litestream` replicating `/data/gombit.db` to Cloudflare R2 (or a
nightly `fly volumes snapshot`). Low stakes — content is reproducible from the
`gombit` repo and GitHub releases — but cheap insurance.

---

## 10. Assets needed (blockers flagged)

| Asset | For | Priority | Notes |
| --- | --- | --- | --- |
| **Admin screenshot / GIF** | §6.5 | **P0 — highest leverage** | Real `/admin/` list + detail; the single most persuasive frame on the site |
| Generation-chain diagram | §6.3 | P0 | Build-rendered Mermaid; port from README |
| Mascot SVG + favicon/mono mark | §7 | P1 | Vectorize `brand/mascot.png`; derive favicon |
| `gombit dev` terminal cast | §6.2 (optional) | P2 | asciinema/GIF of `new` → `dev` |
| OG/social image | §11 | P1 | Mascot + headline; the HN/X preview card |

---

## 11. SEO & social

- Title/description tuned to **"Django for Go" / "batteries-included Go web
  framework."** That phrase is the search and word-of-mouth hook — own it.
- Per-page `<title>`/meta; Open Graph + Twitter cards with the OG image (§10);
  `sitemap.xml` (Astro built-in) and `robots.txt`.
- Semantic HTML, real headings, alt text (accessibility + SEO). Docs get
  structured, canonical URLs (`/docs/<slug>`), stable across releases.
- Pagefind static search index for docs — no external search service.

---

## 12. Milestones

**Phase 0 — Foundations (Gombit app + rendering spine)**
- `gombit new gombit-website …` (§4.5). Prove out the two hand-built risks *first*,
  before content: the **Markdown→React docs pipeline** and the **prerender/SEO
  step** (§4.4) on a throwaway page. Base theme (palette, type, dark mode),
  nav/footer, favicon/mascot. Domain + host + CI preview deploys of the embedded
  binary. Nothing here is worth building content on until prerender + search work.

**Phase 1 — Landing page (the 60-second pitch)**
- Ship §6.1–6.9 with real copy from the README, prerendered to crawlable HTML.
  Blocked only by the P0 assets (§10): admin screenshot + generation diagram. This
  is the piece that has to be great; everything else can trail it.

**Phase 2 — Docs**
- Stand up `/docs` from the decided sourcing model (§8) through the Phase-0
  pipeline. Port installation, tutorial, cli, migrations, admin, auth first (the
  onboarding spine), then the rest. Pagefind search + edit-on-GitHub.

**Phase 3 — The dogfood backend: releases, benchmarks, admin**
- Add the `Release` / `BenchmarkRun` / `ShowcaseApp` models + migrations + Huma
  handlers; regenerate the TS client. Ship the **GitHub-release webhook + AI
  TL;DR** pipeline (§6a) — signature verification, ingest, summarize with the
  xAI Grok API, Cloudflare purge — this is the flagship dogfood feature. `/releases/`
  and `/benchmarks/` (methodology-first, numbers from the snapshot, caveats intact)
  consume the generated client. Stand up `/admin/` and seed from `CHANGELOG.md`.
  *This phase is what makes the site a real Gombit app rather than a static site in
  disguise.*

**Phase 4 — Polish**
- OG images, 404 with mascot, link-check + contract-drift gates, Lighthouse pass
  (perf/a11y/SEO) on prerendered output, reduced-motion audit, DB backup job.

---

## 13. Open questions (decide before the phase they gate)

1. ~~Rendering strategy~~ **DECIDED: build-time prerender + client hydration.**
   A Vite SSR pass (`src/entry-server.tsx` + `scripts/prerender.mjs`, run from the
   frontend `build`) renders each content route to static HTML injected into
   `dist/index.html`; the client `hydrateRoot`s it (falls back to `createRoot` in
   `gombit dev`, where `#root` is empty). Implemented for the landing route — the
   embedded binary now serves the full hero/features/copy in the initial
   response, and the release list hydrates client-side. Docs routes follow the
   same mechanism when built (Phase 2). Kept deliberately small: one SSR entry,
   one prerender script, no SSR framework, no server runtime beyond the existing
   single binary.
2. ~~Docs sourcing~~ **DECIDED: sync from `gombit`, committed.**
   `frontend/scripts/sync-docs.mjs` copies a curated set of `gombit/docs/*.md`
   into `frontend/src/content/docs/`, rewriting links (in-set → `/guide/<slug>`,
   everything else → GitHub blobs) and emitting a nav manifest. The synced files
   are committed so the single binary is self-contained; re-run the script when
   the framework docs change (CI can run it against a pinned checkout later).
   **The docs live at `/guide`, not `/docs`:** the framework reserves `/docs`
   for its Huma Swagger UI and does not release the path even when
   `GOMBIT_DOCS_ENABLED=false` (it 404s), so `/docs` can't fall through to the
   SPA — a dogfooding finding worth a framework issue (make the Swagger path
   configurable, or free it when disabled). `/guide` follows the Vue/Vite
   convention; the nav label stays "Docs". Docs pages are client-rendered and
   code-split; per-route prerender is a follow-up (needs per-route serving,
   which the single-index embed doesn't do — see §4.4).
3. ~~Host + data~~ **DECIDED (§9):** Fly.io + SQLite volume, Cloudflare in front
   for DNS/TLS/CDN. Domain `gombit.dev` already registered.
4. **Scaffold UI preset (gates Phase 0):** `--ui mui` for the admin/CRUD ergonomics
   vs. no preset + bespoke design system for the marketing frontend. (Likely:
   no preset for the public site; the admin is Gombit's own regardless.)
5. ~~Is `gombit.dev` registered?~~ **DONE** — registered; DNS to be managed in
   Cloudflare (§9).
6. **Admin demo medium (gates Phase 1):** static screenshot (simplest, P0) vs.
   short GIF vs. linking the *actual live admin* — which, dogfooded, we now have
   for free (read-only or behind login).
7. **Analytics:** Plausible / Cloudflare Web Analytics / none?
8. **Versioned docs?** Not needed pre-1.0 (recommend deferring), but decide before
   the first tagged release so URLs stay stable.

---

## Appendix A — Source mapping (site ← framework repo)

| Site surface | Source of truth |
| --- | --- |
| Hero, taglines, batteries grid | `gombit/README.md` (Why / What's in the box) |
| Install & first-run blocks | `README.md` Quick start (verbatim) |
| Generation diagram | `README.md` Architecture Mermaid |
| Comparison table | `README.md` "Compared with" |
| Benchmark numbers + caveats | `README.md` perf block + `benchmarks/docs/methodology.md` (generated; seeds `BenchmarkRun` rows, edited via admin, served over API) |
| `/docs/*` | `gombit/docs/*.md` (static Markdown; see §8 sourcing decision) |
| `/releases/` | GitHub `release` webhook → `Release` rows + AI TL;DR (§6a); seeded from `gombit/CHANGELOG.md`; served over the generated TS client |
| `/showcase/` (post-v1) | `ShowcaseApp` rows, admin-managed |
| Response-envelope example | `README.md` / `docs/contract.md` |

Split rule: **static docs/landing copy → Markdown in the repo; genuinely-mutable
content (changelog, benchmarks, showcase) → DB + admin + typed API.** The second
column is what makes the site a real Gombit app.
