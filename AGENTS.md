# Agent Instructions

The agentnative spec repo — canonical principle text, governance docs, and versioning metadata for the agent-native CLI
standard. This file is for any agent (Claude Code or otherwise) opening this repo fresh.

## Project

Source of truth for the 7 principles that define agent-native CLIs. Downstream consumers:

- [`brettdavies/agentnative-cli`](https://github.com/brettdavies/agentnative-cli) (`~/dev/agentnative`) — the Rust `anc`
  linter. Pins a `SPEC_VERSION` const at compile time; coupled-release norm requires a companion PR when principle
  MUST/SHOULD/MAY tiers change.
- [`brettdavies/agentnative-site`](https://github.com/brettdavies/agentnative-site) (`~/dev/agentnative-site`) — the
  anc.dev site. Syncs `principles/*.md`, `VERSION`, and `CHANGELOG.md` into `content/` via `scripts/sync-spec.sh`
  (commit-a-copy, not submodule).

This repo does **not** build anything. It publishes canonical markdown. `VERSION` + per-principle `last-revised:`
frontmatter are the machine-readable contract with downstream repos.

## Authoritative content

- `principles/p1-*.md` through `p7-*.md` — each principle, with YAML frontmatter (`last-revised: YYYY-MM-DD`) and
  MUST/SHOULD/MAY requirements in RFC 2119 language.
- `VERSION` — single-line semver-adjacent version. MINOR bumps on MUST changes; PATCH on SHOULD/MAY changes.
- `CHANGELOG.md` — spec evolution, grouped by principle.
- `CONTRIBUTING.md` — canonical routing doc across the three-repo ecosystem; graduated AI-disclosure gate; coupled
  release protocol.
- `LICENSE` — CC BY 4.0 for spec text. The `anc` checker tool is separately licensed (MIT / Apache-2.0) in its own repo.
- `.github/ISSUE_TEMPLATE/` — pressure-test, grade-a-cli, spec-question. All require AI disclosure; pressure-tests and
  PRs require human co-sign.
- `.github/rulesets/protect-main.json`, `protect-dev.json` — branch protection, applied via `gh api` (see
  `RELEASES.md`).

## Voice

The spec speaks as a **standard**, not a person. Think RFC, not blog post.

- Good: "CLI tools that block on interactive prompts are invisible to agents. The agent hangs, the user sees nothing,
  and the operation times out silently."
- Bad: "We believe that CLI tools should be non-interactive because agents can't handle prompts."
- Good: "MUST support `--output json` for machine-readable output."
- Bad: "It's really important to have JSON output for your CLI."

Use RFC 2119 language (MUST, SHOULD, MAY) for requirements. Concrete examples, not abstractions. Show the failure
mode, then show the fix.

## Editing principles

- Update `last-revised: YYYY-MM-DD` only when a MUST/SHOULD/MAY changes tier, is added, or is removed. Prose-only edits
  (clarity, examples, typos) do **not** bump the date.
- Bump `VERSION` alongside the principle edit: MINOR for MUST changes, PATCH for SHOULD/MAY changes.
- Every PR that touches a principle's requirement tiers MUST include either a link to a companion PR on
  `agentnative-cli` OR the text "no check changes needed" with brief justification. Enforced by the PR template, not by
  CI.
- Do not introduce a formal RFC process, stage gating, or GitHub Discussions. The governance model is single-author spec
  authority with AI-native contribution — proportionate to current scale. See `CONTRIBUTING.md`.

## Branching and release

See `RELEASES.md`. Summary:

- `main` — production. Only release commits arrive here, via squash-merge of a `release/*` PR.
- `dev` — forever integration branch. All feature work squash-merges to `dev`.
- `feat/*`, `fix/*`, `chore/*`, `docs/*` — feature branches, one PR's worth, auto-deleted on merge.
- `release/<slug>` — branched from `origin/main`, cherry-picks commits from `dev`, PR'd to `main`. Short-lived,
  auto-deleted.
- Docs trees (`docs/plans/`, `docs/brainstorms/`, `docs/solutions/`, `docs/reviews/`) live on `dev` only;
  `guard-main-docs.yml` blocks them from `main`. `guard-release-branch.yml` rejects any PR to `main` whose head isn't
  `release/*`.

## Documented Solutions

`docs/solutions/` is a symlink to `~/dev/solutions-docs/` — a shared private repo of past solutions and best practices
across all Brett's projects, organized by category with YAML frontmatter (`module`, `tags`, `problem_type`). Search with
`qmd query "<topic>" --collection solutions`. Relevant when researching cross-repo patterns (artifact sync, calver,
norm-vs-mechanism, frontmatter parsing, etc.) before building from scratch.

Directly load-bearing solutions for this repo's governance model:

- `cross-repo-artifact-sync-commit-over-fetch` — why the site commits a copy of principle files via
  `scripts/sync-spec.sh` instead of using a submodule or build-time fetch.
- `norm-vs-mechanism-blind-spot` — why coupled-release is a documented norm + PR-template field rather than a hard CI
  gate at single-maintainer scale.
- `calver-pin-for-per-repo-config-drift-detection` — calver-pinned headers on committed copies for quick drift
  detection.
- `calver-changelog-as-committed-artifact` — CHANGELOG.md is the source of truth for spec evolution; generated from
  PR-body `## Changelog` sections.

**After writing to `docs/solutions/`** (e.g., via `/compound`), commit and push in the shared repo:

```bash
cd ~/dev/solutions-docs && git add -A && git commit -m "docs: <description>" && git push
```

The consuming repo's `git status` shows nothing for `docs/solutions/` because the symlink target is gitignored. If the
symlink is missing, recreate it: `ln -s ~/dev/solutions-docs docs/solutions`.

## Cross-repo context

| Location | What lives there | Why it matters here |
| --- | --- | --- |
| `~/dev/agentnative` (`brettdavies/agentnative-cli`) | Rust `anc` linter, 46-entry principle registry, scorecard emitter | Consumes this repo's `VERSION` + principle IDs. Coupled-release norm links spec PRs to checker PRs. |
| `~/dev/agentnative-site` (`brettdavies/agentnative-site`) | anc.dev website, markdown-first SSG, `/scorecards` leaderboard | Syncs `principles/*.md`, `VERSION`, `CHANGELOG.md` into `content/` via commit-a-copy script. Site copy is written manually from this repo, not build-time imported. |
| `~/dev/solutions-docs` (`brettdavies/solutions-docs`) | Shared cross-repo solutions archive | Reachable via `docs/solutions/` symlink. Search before researching from scratch. |
| `~/.claude/skills/agent-native-cli/` | Rust/clap + Python/Go/Node implementation patterns | Code examples that embody the principles; useful when authoring or critiquing principle prose. |

## Repo conventions

- **Conventional Commits** for all commits.
- **Squash merge**, with PR body becoming the commit body.
- **PR template** at `.github/pull_request_template.md` is the source of truth for PR structure; `## Changelog` sections
  are the input to `CHANGELOG.md` generation (via `git-cliff` or equivalent).
- **No AI attribution** in commit messages or PR bodies (no `Co-Authored-By: Claude …`, no "Generated with Claude Code"
  trailer).
- **Never edit `CHANGELOG.md` by hand** — it's a generated artifact. Fix inputs (commit messages, PR `## Changelog`
  sections, `cliff.toml`), not outputs.

## First action for a fresh agent session

1. Read `CONTRIBUTING.md` for the graduated AI-disclosure gate and coupled-release protocol — these are governance
   constraints, not optional conventions.
2. Read `RELEASES.md` for the `dev` → `release/*` → `main` cherry-pick flow and the guard workflows.
3. Skim the 7 `principles/p<n>-*.md` files to understand what's in-scope for this repo (vs. the CLI or site).
4. Before proposing changes that affect cross-repo surfaces, `qmd query "<topic>" --collection solutions` to check for
   prior art and documented decisions.
