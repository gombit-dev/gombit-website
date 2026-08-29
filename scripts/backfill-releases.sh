#!/usr/bin/env bash
# Backfill past GitHub releases through the live webhook.
#
# Sends each existing release of the gombit repo to the deployed webhook as a
# signed `release` event — the same shape GitHub sends — so the site ingests
# them (and generates a TL;DR) through the real path, instead of starting with
# an empty releases page. Run it once after the site is deployed and the
# webhook secret is set.
#
# Requires: gh (authenticated), jq, openssl, curl.
#
# Usage:
#   WEBHOOK_URL=https://gombit.dev/api/v1/webhooks/github \
#   GOMBIT_GITHUB_WEBHOOK_SECRET=<same secret as the GitHub webhook> \
#     scripts/backfill-releases.sh
set -euo pipefail

REPO="${REPO:-gombit-dev/gombit}"
WEBHOOK_URL="${WEBHOOK_URL:?set WEBHOOK_URL, e.g. https://gombit.dev/api/v1/webhooks/github}"
SECRET="${GOMBIT_GITHUB_WEBHOOK_SECRET:?set GOMBIT_GITHUB_WEBHOOK_SECRET (the same value as the GitHub webhook)}"

for cmd in gh jq openssl curl; do
  command -v "$cmd" >/dev/null || { echo "missing required command: $cmd" >&2; exit 1; }
done

echo "Backfilling releases from $REPO -> $WEBHOOK_URL"

# Oldest first (reverse), so the newest release ends up most-recent in the DB.
gh api "repos/$REPO/releases" --paginate \
  | jq -c 'reverse[] | select(.draft | not) | {action:"published", release:{tag_name, name, body, html_url, published_at}}' \
  | while IFS= read -r payload; do
      tag=$(printf '%s' "$payload" | jq -r '.release.tag_name')
      sig=$(printf '%s' "$payload" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')
      code=$(curl -sS -o /dev/null -w '%{http_code}' -X POST "$WEBHOOK_URL" \
        -H 'Content-Type: application/json' \
        -H 'X-GitHub-Event: release' \
        -H "X-Hub-Signature-256: sha256=$sig" \
        --data-raw "$payload")
      printf '  %-14s -> %s\n' "$tag" "$code"
      sleep 0.5
    done

echo "Done. TL;DRs generate asynchronously; give them a few seconds to appear."
