# gombit-website

The source for **[gombit.dev](https://gombit.dev)** — the marketing site and
documentation for [Gombit](https://github.com/gombit-dev/gombit), the
batteries-included web framework for Go.

It is also **dogfood**: the site is itself a Gombit app. The landing page's
claims — a typed Go API, a generated TypeScript client, a runtime admin, a
single-binary deploy — are all *running the site you're reading it on*.

## What's interesting here

- **Built with Gombit** — scaffolded by `gombit new`, served by a Gombit/Huma
  API, shipped as one `gombit build --embed` binary.
- **Releases, auto-summarized** — a GitHub `release` webhook
  (`POST /api/v1/webhooks/github`, HMAC-verified) ingests each release into
  SQLite and generates a "what's new" TL;DR with [xAI Grok]. The `/` releases
  section renders from the **generated TypeScript client** — the
  model → OpenAPI → TS client → React chain, live, on the site's own data.
  [`scripts/backfill-releases.sh`](scripts/backfill-releases.sh) replays past
  releases through the same webhook.
- **Runtime admin** — releases are managed through Gombit's Django-style admin
  at `/admin/`.
- **Docs** — `/guide` renders framework docs synced from the `gombit` repo
  (`frontend/scripts/sync-docs.mjs`), with a hand-built sidebar, markdown
  pipeline and client-side search, code-split so it never weighs down the
  landing bundle. `/benchmarks` renders the framework README's generated
  benchmark results.
- **Upgraded with its own tooling** — framework bumps go through
  `gombit upgrade` (plan, codemods, config, schema, contract).
- **Prerendered landing** — a small Vite SSR pass renders the landing route to
  static HTML for SEO and first paint; the client hydrates it.

[xAI Grok]: https://x.ai

## Develop

Prerequisites: Go (the version in [`go.mod`](go.mod)), Node 22+ with pnpm, a C
toolchain (SQLite is cgo), [Atlas](https://atlasgo.io/) for migrations, and the
`gombit` CLI at the framework version `go.mod` pins:

```sh
go install github.com/gombit-dev/gombit/cmd/gombit@v0.10.0
cp .env.example .env
gombit dev
```

Runs the API, Vite HMR, and live TypeScript-client regeneration together, and
prints a service table (Backend, Frontend, OpenAPI, Admin). The public site is
the landing page (`/`), docs (`/guide`) and benchmarks (`/benchmarks`); the
example CRUD lives behind auth at `/app`.

The synced docs are generated: fix a page upstream in `gombit/docs/`, then
re-sync. Sync from the gombit release this site runs, not from `main`:

```sh
mkdir -p /tmp/gombit-docs
git -C ../gombit archive v0.10.0 docs README.md | tar -x -C /tmp/gombit-docs
GOMBIT_DOCS_DIR=/tmp/gombit-docs/docs node frontend/scripts/sync-docs.mjs
```

Without `GOMBIT_DOCS_DIR` the script reads a `gombit` checkout next to this
repo (`../gombit/docs`).

[`AGENTS.md`](AGENTS.md) lists the checks CI runs, the generated files you must
not hand-edit, and the step-by-step recipe for upgrading to a new gombit release.

## Build & deploy

A single binary containing the API, prerendered SPA, and admin:

```sh
gombit build --embed
./bin/server
```

The production image ([`Dockerfile`](Dockerfile)) runs this on
[Fly.io](https://fly.io) behind Cloudflare, with a SQLite volume. The full
architecture, deploy runbook (Fly + Cloudflare + secrets), and the GitHub-webhook
setup are in [`DESIGN.md`](DESIGN.md).

Pushes to `main` deploy automatically (`.github/workflows/deploy.yml`);
migrations run at container start, before the server.

Runtime secrets (never committed): `GOMBIT_JWT_SECRET`,
`GOMBIT_GITHUB_WEBHOOK_SECRET` (shared with the GitHub webhook), and `XAI_API_KEY`
(release TL;DRs; `XAI_MODEL` and `XAI_BASE_URL` optional).

## License

Source code is [MIT licensed](LICENSE).

The Gombit mascot ([`brand/mascot.png`](brand/mascot.png)) is a derivative of
the Go gopher by Renée French and is licensed **CC BY 4.0**, separately from the
code — see [`brand/NOTICE`](brand/NOTICE). Keep the attribution if you reuse it.
