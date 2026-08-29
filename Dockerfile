# syntax=docker/dockerfile:1

# gombit.dev — single-binary embedded build.
#
# Stage 1 builds the Vite frontend and embeds it into the Go server with
# `gombit build --embed` (SQLite is cgo, so CGO_ENABLED=1 + a C toolchain).
# Stage 2 is a slim runtime carrying the server binary, the gombit CLI, and
# the Atlas CLI — `gombit db migrate` shells out to `atlas migrate apply`, so
# Atlas must be on PATH. Migrations run at container start (entrypoint),
# because the SQLite file lives on the Fly volume mounted on this machine.

# ---- Stage 1: build ---------------------------------------------------------
FROM golang:1.25-bookworm AS build

# Pin these to a released tag once gombit cuts one; @latest is fine pre-1.0.
ARG GOMBIT_VERSION=latest

# Node 22 (Vite build, pnpm via corepack) + a C toolchain for cgo SQLite.
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl gcc g++ pkg-config \
 && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
 && apt-get install -y --no-install-recommends nodejs \
 && corepack enable \
 && rm -rf /var/lib/apt/lists/*

ENV CGO_ENABLED=1

# Install the gombit CLI into $GOPATH/bin (/go/bin).
RUN go install github.com/gombit-dev/gombit/cmd/gombit@${GOMBIT_VERSION}

WORKDIR /src

# Warm the Go module cache first for faster rebuilds.
COPY go.mod go.sum ./
RUN go mod download

# Warm the pnpm store against the lockfile (the scaffold uses pnpm; esbuild's
# build script is allowed via frontend/pnpm-workspace.yaml).
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml ./frontend/
RUN corepack pnpm --dir frontend install --frozen-lockfile

COPY . .

# Produce the embedded single binary: pnpm build -> collectstatic -> go build.
RUN gombit build --embed --out /out/server

# ---- Stage 2: runtime -------------------------------------------------------
FROM debian:bookworm-slim AS runtime

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl \
 && curl -sSf https://atlasgo.sh | sh -s -- --community \
 && apt-get purge -y curl && apt-get autoremove -y \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Server binary + the gombit CLI used by the entrypoint's migrate step.
COPY --from=build /out/server        /app/server
COPY --from=build /go/bin/gombit     /usr/local/bin/gombit

# Migration SQL + seeds are read at runtime by `gombit db migrate`.
COPY --from=build /src/database      /app/database
COPY deploy/docker-entrypoint.sh     /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Run as a non-root user; /data is the Fly volume mount (see fly.toml).
RUN useradd -u 10001 -m app && mkdir -p /data && chown app:app /data
USER app

EXPOSE 8080
ENTRYPOINT ["/app/docker-entrypoint.sh"]
