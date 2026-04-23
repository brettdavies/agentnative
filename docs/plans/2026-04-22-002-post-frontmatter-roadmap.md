---
title: "roadmap: Post-frontmatter deferred work"
type: roadmap
status: closed
date: 2026-04-22
closed: 2026-04-23
parent: docs/plans/2026-04-22-001-feat-requirement-id-frontmatter-plan.md
children:
  - docs/plans/2026-04-22-003-release-infra-and-v0.2.0-cut-plan.md
  - docs/plans/2026-04-23-001-feat-badge-surface-plan.md
  - docs/plans/2026-04-23-002-feat-vault-archival-plan.md
children-external:
  - https://github.com/brettdavies/agentnative-site/blob/dev/docs/plans/2026-04-23-001-feat-sync-spec-plan.md
  - https://github.com/brettdavies/agentnative-cli/blob/dev/docs/plans/2026-04-23-001-feat-spec-vendor-plan.md
---

# roadmap: Post-frontmatter deferred work

> **Closed 2026-04-23.** All five items have graduated to per-item plans. Item 1 shipped via plan 003 (this repo).
> Items 2 and 3 live in this repo's `docs/plans/` (see `children:` frontmatter); items 4 and 5 live in
> `agentnative-site` and `agentnative-cli` respectively (see `children-external:` frontmatter). Each plan carries
> its own status, revisit triggers, and acceptance criteria — this roadmap's tracking role is superseded. Kept as
> a historical grouping record; do not add new items here. If post-0.2.0 follow-up work emerges that doesn't fit
> an existing plan, file a new plan directly in the appropriate repo under `docs/plans/YYYY-MM-DD-NNN-*-plan.md`.

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

### 1. Publish workflow — tag + advisory repository_dispatch ✅ SHIPPED 2026-04-23

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
- **Shipped 2026-04-23:** via PRs #4 (workflow + cliff.toml + RELEASES.md gating), #6 (graceful-skip on missing
  CHANGELOG), #9 (PR-body-driven CHANGELOG generation ported from anc), #7 (dual-condition trigger on
  `principles/p*-*.md` or `VERSION` + release-branch pre-push semver check). First tag `v0.2.0` cut on Release B merge
  commit `83bf0fd`; GitHub Release + dispatch to `agentnative-cli` and `agentnative-site` fired successfully. See plan
  [`2026-04-22-003-release-infra-and-v0.2.0-cut-plan.md`](2026-04-22-003-release-infra-and-v0.2.0-cut-plan.md) for the
  two-release execution record.

### 2. Badge surface — PLAN FILED (on hold)

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
- **Plan:** [`2026-04-23-001-feat-badge-surface-plan.md`](2026-04-23-001-feat-badge-surface-plan.md) filed 2026-04-23
  with `status: on-hold`. Plan captures the spec-side conformance convention (U1 + U2) and explicitly defers site-side
  rendering to a separate follow-up plan in `agentnative-site`.

### 3. Obsidian vault archival — UNBLOCKED (v0.2.0 shipped) — PLAN FILED

- **What:** Archive `~/obsidian-vault/Projects/brettdavies-agentnative/principles/` and `../research/`. The vault's
  `principles/AGENTS.md` still claims the folder is "upstream source of truth" — stale as of this repo's creation.
  Replace both folders with a short redirect note pointing to this repo.
- **Why:** Two SoTs is zero SoTs. Pressure-testers reading the vault today would miss the live frontmatter contract
  entirely.
- **Owner repo:** The vault (private). Not a git repo with PRs; a manual edit session.
- **Dependencies:** ✅ `2026-04-22-001` merged to `main` via v0.2.0 (commit `83bf0fd`, tag `v0.2.0`). Redirect note can
  now point to a stable public URL.
- **Revisit trigger:** Ready to pick up — next time the vault is touched for any reason, or immediately if Brett wants
  the redirect posted before downstream consumers start linking.
- **Plan:** [`2026-04-23-002-feat-vault-archival-plan.md`](2026-04-23-002-feat-vault-archival-plan.md) filed 2026-04-23.
  U1 archives `principles/` cleanly; U2 resolves an open question about the `research/` folder (retire fully vs migrate
  to spec repo vs keep + update governance) via an inbound-link audit before applying the chosen disposition.

### 4. Site-side `scripts/sync-spec.sh` — PLAN FILED

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
- **Plan:**
  [`agentnative-site/docs/plans/2026-04-23-001-feat-sync-spec-plan.md`](https://github.com/brettdavies/agentnative-site/blob/dev/docs/plans/2026-04-23-001-feat-sync-spec-plan.md)
  filed 2026-04-23 in the site repo. Destination is `src/data/spec/` (parallel to existing
  `src/data/coverage-matrix.json`), **not** `content/principles/` — the site's `content/principles/` copy is
  human-written per site `AGENTS.md` and stays that way. Three implementation units: author the script, initial v0.2.0
  commit, document the workflow.

### 5. Companion `agentnative-cli` PR — UNBLOCKED (v0.2.0 shipped) — PLAN FILED

- **What:** Rewrite `src/principles/registry.rs` to vendor this repo's `principles/*.md` (commit-a-copy via
  `scripts/sync-spec.sh`-equivalent), parse the frontmatter at build time, and build the `REQUIREMENTS` slice from the
  spec. Include a drift-check test that fails compilation if vendored IDs diverge from the CLI's expected set.
- **Why:** Completes the IDs-as-SoT contract from `sot_contract.md`. Spec publishes IDs; CLI verifies it's reading the
  expected set; scorecard output cites the spec version the CLI was built against.
- **Owner repo:** `brettdavies/agentnative-cli`. Follows the coupled-release protocol in
  [`CONTRIBUTING.md`](../../CONTRIBUTING.md) — this roadmap entry is the spec-side tracking of the expected companion
  PR.
- **Dependencies:** ✅ `2026-04-22-001` merged to `main` via v0.2.0 (commit `83bf0fd`, tag `v0.2.0`). CLI can now vendor
  against that stable SHA. Open Question (a) in 001 flagged the vendoring pattern choice (commit-a-copy vs build-time
  fetch) as a CLI-side design decision; commit-a-copy is recommended.
- **Revisit trigger:** Next CLI release cycle. Alternatively, ship this before the next CLI release if the CLI is
  blocked on a contract change (e.g., a new requirement ID added to the spec after 0.2.0).
- **Plan:**
  [`agentnative-cli/docs/plans/2026-04-23-001-feat-spec-vendor-plan.md`](https://github.com/brettdavies/agentnative-cli/blob/dev/docs/plans/2026-04-23-001-feat-spec-vendor-plan.md)
  filed 2026-04-23 in the CLI repo. Standard-depth plan: 6 implementation units covering `scripts/sync-spec.sh`, initial
  v0.2.0 vendor, `build.rs` frontmatter parser with test-first diagnostics, `REQUIREMENTS` switchover, drift-check
  tests, and an additive `spec_version` field (scorecard `schema_version` 1.1 → 1.2). Resolves Open Question (a) from
  plan 001 (commit-a-copy chosen).

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

### Close-out record (2026-04-23)

Closed per a plan-file-migration interpretation of option (c): every item has graduated to a per-item plan document that
carries its own status, acceptance criteria, and revisit triggers. Item-by-item disposition at close:

| #   | Item                | Status                                               | Plan                                                                                                                               |
| --- | ------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Publish workflow    | shipped 2026-04-23 (tag `v0.2.0`)                    | [`2026-04-22-003`](2026-04-22-003-release-infra-and-v0.2.0-cut-plan.md)                                                            |
| 2   | Badge surface       | plan filed, `status: on-hold`                        | [`2026-04-23-001`](2026-04-23-001-feat-badge-surface-plan.md)                                                                      |
| 3   | Vault archival      | plan filed, `status: active`                         | [`2026-04-23-002`](2026-04-23-002-feat-vault-archival-plan.md)                                                                     |
| 4   | Site `sync-spec.sh` | plan filed, `status: active` (in `agentnative-site`) | [`site/2026-04-23-001`](https://github.com/brettdavies/agentnative-site/blob/dev/docs/plans/2026-04-23-001-feat-sync-spec-plan.md) |
| 5   | CLI companion PR    | plan filed, `status: active` (in `agentnative-cli`)  | [`cli/2026-04-23-001`](https://github.com/brettdavies/agentnative-cli/blob/dev/docs/plans/2026-04-23-001-feat-spec-vendor-plan.md) |

None of the filed plans have had implementation work yet — acceptance criteria remain unticked and statuses reflect
pre-execution reality. The badge-surface plan (item 2) is `on-hold` by design (awaiting leaderboard maturity +
CLI-author demand per its own Risks table); it is NOT abandoned and flips to `active` when external triggers fire.
Progress on each item now lives in its own plan document — in this repo for items 2 and 3, in `agentnative-site` for
item 4, in `agentnative-cli` for item 5. Do not reopen this roadmap to track it.
