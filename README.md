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
- **Runtime admin** — releases are managed through Gombit's Django-style admin
  at `/admin/`.
- **Docs** — `/guide` renders framework docs synced from the `gombit` repo
  (`frontend/scripts/sync-docs.mjs`), with a hand-built sidebar + markdown
  pipeline, code-split so it never weighs down the landing bundle.
- **Prerendered landing** — a small Vite SSR pass renders the landing route to
  static HTML for SEO and first paint; the client hydrates it.

[xAI Grok]: https://x.ai

## Develop

Prerequisites: Go 1.25+, Node 22+, a C toolchain (SQLite is cgo), and
[Atlas](https://atlasgo.io/) for migrations.

```sh
gombit dev
```

Runs the API, Vite HMR, and live TypeScript-client regeneration together, and
prints a service table (Backend, Frontend, OpenAPI, Admin). The public site is
the landing page (`/`) and docs (`/guide`); the example CRUD lives behind auth
at `/app`.

Refresh the synced framework docs after they change upstream:

```sh
node frontend/scripts/sync-docs.mjs   # needs the gombit repo at ../../gombit
```

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

Runtime secrets (never committed): `GOMBIT_JWT_SECRET`,
`GOMBIT_GITHUB_WEBHOOK_SECRET` (shared with the GitHub webhook), and `XAI_API_KEY`
(release TL;DRs; `XAI_MODEL` optional).

## License

Source code is [MIT licensed](LICENSE).

The Gombit mascot ([`brand/mascot.png`](brand/mascot.png)) is a derivative of
the Go gopher by Renée French and is licensed **CC BY 4.0**, separately from the
code — see [`brand/NOTICE`](brand/NOTICE). Keep the attribution if you reuse it.
