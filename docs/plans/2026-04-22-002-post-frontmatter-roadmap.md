---
title: "roadmap: Post-frontmatter deferred work"
type: roadmap
status: active
date: 2026-04-22
parent: docs/plans/2026-04-22-001-feat-requirement-id-frontmatter-plan.md
---

# roadmap: Post-frontmatter deferred work

## Overview

Durable tracking for the five items explicitly out of scope in
[`2026-04-22-001-feat-requirement-id-frontmatter-plan.md`](2026-04-22-001-feat-requirement-id-frontmatter-plan.md)'s
Scope Boundaries. Each survives the close-out of that plan and gets its own feature branch when picked up. This doc is a
roadmap, not an implementation plan — when an item becomes next, file `docs/plans/YYYY-MM-DD-NNN-feat-*-plan.md` and
supersede the entry here.

Audience: Brett (sole maintainer) and future Claude sessions that land in this repo without prior context. Memory files
at `~/.claude/projects/-home-brett-dev-agentnative-spec/memory/` carry the same facts, but memory is session-local; this
file is the public-repo record.

## Items

### 1. Publish workflow — tag + advisory repository_dispatch

- **What:** On every `VERSION` bump that lands on `main`, cut a git tag and fire `repository_dispatch` to downstream
  repos (`agentnative-cli`, `agentnative-site`) as an advisory signal. The tag is authoritative; the dispatch is a
  notification, per `sot_contract.md` (hybrid propagation).
- **Why:** SoT without propagation is a filing cabinet. Tagged releases give downstream consumers a stable pin; the
  dispatch lets them react without polling.
- **Owner repo:** `brettdavies/agentnative-spec` (this repo — `.github/workflows/publish.yml`).
- **Dependencies:** `2026-04-22-001` merged to `main` (the ID contract that downstream consumers will pin against must
  exist first).
- **Revisit trigger:** Next `VERSION` bump that downstream consumers actually need to hear about — realistically
  immediately after `0.2.0` lands, so the first post-0.2.0 change has infrastructure to propagate through.

### 2. Badge surface

- **What:** A shields.io-compatible badge that CLI authors can embed in their own READMEs declaring
  agent-native-standard conformance. Badge links to the live `anc` scorecard at `anc.dev/score/<tool>`.
- **Why:** Trust-and-verify posture (`sot_contract.md`) rests on readers being able to follow a badge to live
  verification rather than trusting a self-declaration.
- **Owner repo:** Split — badge rendering belongs to `agentnative-site`; badge-claim conventions (what it means when a
  CLI embeds one) documented in `agentnative-spec` (`CONTRIBUTING.md` or a new `docs/badge.md`).
- **Dependencies:** Publish workflow (item 1) for stable version numbers in badge URLs; leaderboard baseline on
  `agentnative-site` (~100 tools per `doctrine_decisions.md`) for badge to have adjacent context.
- **Revisit trigger:** Explicitly on hold per 2026-04-22 user direction. Revisit when the leaderboard has a credible
  number of tools AND at least one CLI author asks for a badge they can embed.

### 3. Obsidian vault archival

- **What:** Archive `~/obsidian-vault/Projects/brettdavies-agentnative/principles/` and `../research/`. The vault's
  `principles/AGENTS.md` still claims the folder is "upstream source of truth" — stale as of this repo's creation.
  Replace both folders with a short redirect note pointing to this repo.
- **Why:** Two SoTs is zero SoTs. Pressure-testers reading the vault today would miss the live frontmatter contract
  entirely.
- **Owner repo:** The vault (private). Not a git repo with PRs; a manual edit session.
- **Dependencies:** `2026-04-22-001` merged to `main` (vault redirect note should point to a stable public URL, not a
  feature branch).
- **Revisit trigger:** Immediately after `2026-04-22-001` merges to `main`, or the next time the vault is touched for
  any reason — whichever comes first. Cheap and quick; no reason to defer long.

### 4. Site-side `scripts/sync-spec.sh`

- **What:** Commit-a-copy script in `brettdavies/agentnative-site` that pulls `principles/*.md`, `VERSION`, and
  `CHANGELOG.md` from this repo into `content/` at a pinned SHA. Matches the existing
  `cross-repo-artifact-sync-commit-over-fetch` pattern (`docs/solutions/`).
- **Why:** The site is a downstream consumer. Build-time fetches couple release timing across repos; commit-a-copy keeps
  release cadences independent and makes drift auditable in `git diff`.
- **Owner repo:** `brettdavies/agentnative-site`. Separate PR, not tracked as a branch here.
- **Dependencies:** Publish workflow (item 1) — the sync script pins against tags, so tags must exist. Can be
  bootstrapped against a specific commit SHA before item 1 lands if needed.
- **Revisit trigger:** Next site deploy that needs to reflect the `0.2.0` frontmatter contract (or earlier if site work
  is scheduled first). Coordinate with item 1 so the first synced version is a real release, not a pre-release SHA.

### 5. Companion `agentnative-cli` PR

- **What:** Rewrite `src/principles/registry.rs` to vendor this repo's `principles/*.md` (commit-a-copy via
  `scripts/sync-spec.sh`-equivalent), parse the frontmatter at build time, and build the `REQUIREMENTS` slice from the
  spec. Include a drift-check test that fails compilation if vendored IDs diverge from the CLI's expected set.
- **Why:** Completes the IDs-as-SoT contract from `sot_contract.md`. Spec publishes IDs; CLI verifies it's reading the
  expected set; scorecard output cites the spec version the CLI was built against.
- **Owner repo:** `brettdavies/agentnative-cli`. Follows the coupled-release protocol in
  [`CONTRIBUTING.md`](../../CONTRIBUTING.md) — this roadmap entry is the spec-side tracking of the expected companion
  PR.
- **Dependencies:** `2026-04-22-001` merged to `main` (CLI vendors a SHA; that SHA must be on `main`). Open Question (a)
  in 001 flagged the vendoring pattern choice (commit-a-copy vs build-time fetch) as a CLI-side design decision;
  commit-a-copy is recommended.
- **Revisit trigger:** Next CLI release cycle. Alternatively, ship this before the next CLI release if the CLI is
  blocked on a contract change (e.g., a new requirement ID added to the spec after 0.2.0).

## Coordination notes

- Items 1 and 4 want to land in a coordinated way — sync script (4) is the first real consumer of tags (1). If 4 is
  scheduled first, land it pinned to a SHA and swap to tags once 1 is ready.
- Items 3 and 5 both depend on 001 merging to `main`. When that happens, 3 is cheap-and-immediate; 5 is larger and gets
  its own cycle.
- Badge (2) stays on hold indefinitely. Do not file a plan for it without a concrete external trigger.
- When an item is picked up: file `docs/plans/YYYY-MM-DD-NNN-feat-<short>-plan.md`, link to this roadmap entry in the
  plan's Overview or Context section, and check the item off in this file's Items list.

## Close-out protocol

This roadmap closes when all five items have either (a) been implemented, (b) been explicitly abandoned with a note
here, or (c) been migrated to GitHub issues once the repo has issues enabled. Items can be struck through or moved to a
`## Closed` section as they resolve.
