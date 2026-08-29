#!/bin/sh
# Apply pending migrations against the SQLite file on the mounted volume, then
# hand off to the server. `gombit db migrate` wraps `atlas migrate apply`, so
# Atlas must be on PATH (it is — installed in the runtime image). Keep this app
# to a SINGLE machine: SQLite is single-writer and migrations run on boot.
set -e

echo "==> gombit db migrate"
gombit db migrate --dir database/migrations

echo "==> starting server"
exec /app/server
