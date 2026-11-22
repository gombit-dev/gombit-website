# AGENTS.md — gombit.dev

Working guide for any agent (or human) contributing to this repository. It is
the operational summary. [`DESIGN.md`](DESIGN.md) holds the rationale, the docs
information architecture (§5), the landing-page anatomy (§6) and the deploy
runbook (§9.1). Parts of DESIGN.md are an early draft that the build did not
follow (for example MDX/Shiki docs, the MUI scaffold). When DESIGN.md and the
code disagree, check the code, and fix whichever one is wrong.

## What this is

The source for **[gombit.dev](https://gombit.dev)**: the marketing site and
documentation for [Gombit](https://github.com/gombit-dev/gombit), the
batteries-included web framework for Go. The site is itself a Gombit app
(**dogfood**): every claim the landing page makes about Gombit should be true of
the code serving it.

- **`/`**: landing page, prerendered to static HTML at build time, then hydrated.
- **`/guide`**: framework docs **synced** from the `gombit` repo (not authored here).
- **`/benchmarks`**: the framework README's generated benchmark block.
- **Releases section**: a GitHub `release` webhook ingests each gombit release
  into SQLite and generates a TL;DR with xAI Grok; the landing page reads it
  through the generated TypeScript client. Releases are managed in `/admin/`.
- **`/app`**: the scaffold's example CRUD (products), behind cookie auth.

## Layout

| Path | What |
| --- | --- |
| `cmd/server/` | Composition root: config, DB, framework options, routes, admin registration |
| `cmd/gombit/` | The app's own `gombit` CLI entry (framework commands + app commands) |
| `internal/release/` | Release model, public read API, GitHub webhook (HMAC), xAI TL;DR summarizer |
| `internal/release/*.gen.go` | **Generated** by `gombit generate` from `release.go`; `hooks.go` is seed-once and app-owned |
| `internal/product/` | Scaffold example resource (hand-written handler) |
| `internal/platform/` | DB open + `AutoMigrate` model list (also the migration model registry) |
| `internal/web/` | Embed target for `gombit build --embed` (`static/` is build output) |
| `database/migrations/` | Reviewed Atlas SQL, `atlas.sum`, `models.json` registry |
| `openapi.json` | **Generated** committed OpenAPI 3.1 document |
| `frontend/src/api/generated/` | **Generated** TypeScript client |
| `frontend/src/content/docs/`, `docs-manifest.json`, `benchmarks.md` | **Generated** by `frontend/scripts/sync-docs.mjs` |
| `frontend/src/pages/LandingPage.tsx`, `styles/landing.css` | The landing page (hand-written) |
| `frontend/src/pages/Docs*.tsx`, `content/docs.ts`, `content/search.ts` | Docs renderer, sidebar, client-side search |
| `frontend/src/entry-server.tsx`, `scripts/prerender.mjs` | Build-time prerender of `/` |
| `deploy/docker-entrypoint.sh`, `Dockerfile`, `fly.toml` | Production image and Fly.io config |
| `scripts/backfill-releases.sh` | Replays past gombit releases through the live webhook |
| `mocks/` | Static design mock; not served |

## Invariants

- **Never hand-edit generated files.** Change the source and regenerate:
  - Synced docs: fix the page upstream in `gombit/docs/`, then re-sync. To add or
    retitle a page, edit `GROUPS` in `frontend/scripts/sync-docs.mjs` (and keep
    DESIGN.md §5 in step).
  - `internal/release/*.gen.go`: edit the model, run `gombit generate`.
  - `openapi.json` + `frontend/src/api/generated/`: regenerate from the running
    app (`gombit client check --url …/openapi.json --write`).
  CI fails on drift for each of these.
- **Sync docs from the release the site runs**, not from gombit `main` when
  `main` carries unreleased docs: the site must not document features users
  can't install yet. Export the tag and point the script at it (see *Commands*).
- **One gombit version, three pins.** `go.mod`, `GOMBIT_VERSION` in
  `.github/workflows/ci.yml` and `ARG GOMBIT_VERSION` in `Dockerfile` move
  together: the CLI regenerates the contract and runs the boot-time migrate, so
  it must match the linked framework. A dependabot bump of gombit in `go.mod`
  alone breaks this. Pin the other two in the same PR, or upgrade with the
  recipe below instead.
- **The frontend calls first-party JSON endpoints through the generated
  client only.** No hand-written `fetch` to `/api/**`. `unwrap` returns
  `T | undefined`: narrow before reading fields.
- **The landing page must stay prerenderable.** `LandingPage` and everything it
  imports render in Node at build time: no `window`/`document` at module scope
  or during render (effects are fine), and the server markup must match the
  client's first render at `/`. Keep the docs subsystem lazy-loaded; never
  import docs content into the landing bundle.
- **Landing claims follow the shipped release.** Only advertise what the pinned
  gombit release ships, and update the cards / compare table / meta
  description when a release adds a headline feature.
- **Schema changes are reviewed Atlas SQL.** Generate with
  `gombit db makemigrations`, never edit an applied migration, and commit
  `atlas.sum` + `models.json` with it. Migrations run at container boot, so the
  app stays on **one** Fly machine (SQLite is single-writer).
- **`go.mod` stays tidy** (CI runs `go mod tidy -diff`). The `gombit db`
  commands that load the models (`plan`, `makemigrations`, `check`) re-add
  `ariga.io/atlas-provider-gorm` as a direct require. Run `go mod tidy` after
  them, before committing.
- **Secrets stay server-side.** `GOMBIT_JWT_SECRET`,
  `GOMBIT_GITHUB_WEBHOOK_SECRET`, `XAI_API_KEY` are Fly secrets; nothing secret
  goes in `VITE_*` (it is inlined into the public bundle). The webhook relies on
  `framework.WithRawBodyPaths` for its unmodified, CSRF-exempt body. Never add a
  broader CSRF bypass.
- **SQLite is cgo** (`mattn/go-sqlite3`): builds need `CGO_ENABLED=1` and a C
  toolchain.

## Toolchain

Go as pinned by `go.mod`'s `go` directive, Node 22+, pnpm (`frontend/` uses
`pnpm-lock.yaml`), a C toolchain, [Atlas](https://atlasgo.io/), and the
`gombit` CLI at the version pinned in `go.mod`:

```bash
go install github.com/gombit-dev/gombit/cmd/gombit@v0.10.0   # match go.mod
```

## Commands

```bash
cp .env.example .env            # local config; .env is gitignored
gombit dev                      # API + Vite HMR + live TS-client regeneration

# Backend checks (what CI's lint + integration jobs run)
gofmt -l $(git ls-files '*.go')
go mod tidy -diff
gombit generate --check
go build ./... && go vet ./... && go test ./...
golangci-lint run               # CI pins v2.11.3

# Contract drift (needs the server running)
gombit client check --url http://127.0.0.1:8080/openapi.json

# Frontend checks
cd frontend && pnpm install --frozen-lockfile && pnpm typecheck && pnpm build

# Single-binary production build
gombit build --embed && ./bin/server

# Database
gombit db plan                  # preview what the models change
gombit db makemigrations <name> # reviewed SQL into database/migrations
gombit db migrate
gombit db check                 # contract, registry, migrations, schema all consistent
```

### Re-syncing the docs

```bash
# From the gombit release go.mod pins (here v0.10.0):
git -C ../gombit fetch --tags
mkdir -p /tmp/gombit-docs && git -C ../gombit archive v0.10.0 docs README.md | tar -x -C /tmp/gombit-docs
GOMBIT_DOCS_DIR=/tmp/gombit-docs/docs node frontend/scripts/sync-docs.mjs
```

Without `GOMBIT_DOCS_DIR`, the script reads a gombit checkout next to this repo
(`../gombit/docs`). Afterwards check that every `/guide/…` link resolves and
that `pnpm build` passes.

## Upgrading Gombit

Use the framework's own tooling. It is part of the dogfood.

1. `go install github.com/gombit-dev/gombit/cmd/gombit@vX.Y.Z`, then
   `gombit upgrade --dry-run --to vX.Y.Z` and read the plan.
2. `gombit upgrade --to vX.Y.Z`; pin `GOMBIT_VERSION` (CI) and `ARG
   GOMBIT_VERSION` (Dockerfile) to match.
3. `gombit generate`, `gombit upgrade check`, `gombit upgrade fix`,
   `gombit upgrade config`. Handle each manual action the plan lists.
4. Framework schema changes: add new framework models to `AutoMigrate`, then
   `gombit db plan` / `gombit db makemigrations` with the `--model` flags the
   plan prints.
5. Run the server, then `gombit upgrade contract --url …/openapi.json --write`;
   fix the frontend for any client change (`pnpm typecheck`).
6. `go mod tidy`, re-sync the docs from the new tag, refresh the landing claims,
   and run every check above.

`gombit.dev/guide/upgrade-notes` lists what each release asks of an app.

## Deploy

A push to `main` runs `.github/workflows/deploy.yml`: a vet/test gate, then the
Docker image is built and deployed to Fly.io. The entrypoint runs
`gombit db migrate` before starting the server; a failed migration fails the
release. Cloudflare caches the prerendered HTML, so a content change may need a
cache purge to show (DESIGN.md §9.1).

## Workflow

- Branch off `main`, one concern per PR, CI green before review; the
  maintainer merges. Dependabot opens grouped weekly Go / npm / Actions PRs.
- Describe what changed for site visitors (new pages, landing changes) and what
  the deploy does (migrations) in the PR body.
- Attribution: end commit messages with the `Co-Authored-By:` trailer for the
  model that did the work, and PR descriptions with the tool's generation line.
