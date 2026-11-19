# CLAUDE.md

Read [`AGENTS.md`](AGENTS.md). It is the canonical guide for working in this
repository (what the site is, layout, invariants, toolchain, commands, the
Gombit upgrade recipe, deploy), and it applies to Claude Code without
exception. This file exists only so the guidance is discoverable under the name
Claude Code looks for; it is intentionally not a second copy.

The design rationale, docs IA and deploy runbook are in [`DESIGN.md`](DESIGN.md).

Claude Code specifics:

- The things most easily broken here: hand-editing generated files (synced
  docs, `*.gen.go`, `openapi.json`, the TS client), letting the three gombit
  version pins drift apart, syncing docs from an unreleased gombit `main`, and
  a landing page that no longer prerenders. AGENTS.md § *Invariants* covers each.
- To check a visual change, run `gombit build --embed`, start `./bin/server`
  and look at the page, rather than trusting `pnpm build` alone.
- End commit messages with the `Co-Authored-By: Claude …` trailer and PR
  descriptions with the Claude Code generation line.
