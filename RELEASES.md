# Releasing `the agent-native CLI standard`

Every change reaches production via this pipeline. Direct commits to `dev` or `main` are not permitted — every change
has a PR number in its squash commit message, which keeps the history scannable, attributable, and changelog-ready.

```text
feature branch → PR to dev (squash merge)
              → cherry-pick to release/* branch
              → PR to main (squash merge)
              → deploy / publish pipeline fires
```

## Branches

| Branch                                 | Role                                    | Lifetime                                    | Protection                           |
| -------------------------------------- | --------------------------------------- | ------------------------------------------- | ------------------------------------ |
| `main`                                 | Production. Only release commits.       | Forever.                                    | `.github/rulesets/protect-main.json` |
| `dev`                                  | Integration. All feature PRs land here. | Forever. Never delete.                      | `.github/rulesets/protect-dev.json`  |
| `feat/*`, `fix/*`, `chore/*`, `docs/*` | Feature work.                           | One PR's worth. Auto-deleted on merge.      | None — squash into dev freely.       |
| `release/*`                            | Head of a dev → main PR.                | One release's worth. Auto-deleted on merge. | None.                                |

`dev` is a **forever branch**. Never delete it locally or remotely, even after a `release/* → main` merge. The next
release cycle reuses the same `dev`. The repo's `deleteBranchOnMerge: true` setting doesn't touch `dev` as long as `dev`
is never the head of a PR — using a short-lived `release/*` head is what keeps the setting compatible with a forever
integration branch.

## Daily development (feature → dev)

```bash
git checkout dev && git pull
git checkout -b feat/short-description
# ... work ...
git push -u origin feat/short-description
gh pr create --base dev --title "feat(scope): what changed"
# CI passes → squash-merge (PR_BODY becomes the dev commit message)
```

- **Commit style**: [Conventional Commits](https://www.conventionalcommits.org/).
- **PR body**: follow `.github/pull_request_template.md`. The `## Changelog` section is the source of truth for
  user-facing release notes — `scripts/generate-changelog.sh` fetches each PR body from the GitHub API at release time
  and expands the `### Added / Changed / Fixed / Removed / Security` bullets verbatim. PR bodies remain editable
  post-merge, so typos can be fixed by editing the PR on GitHub and re-running the script.

## Releasing dev to main

Engineering docs (`docs/plans/`, `docs/solutions/`, `docs/brainstorms/`, `docs/reviews/`) live on `dev` only.
`guard-main-docs.yml` blocks them from reaching `main`, and `guard-release-branch.yml` rejects any PR to main whose head
isn't `release/*`. Use the release-branch cherry-pick pattern:

**Branch naming**: `release/<date>-<slug>` or `release/v<version>-<slug>` or just `release/<slug>`. Keep the slug short
and descriptive.

```bash
# 1. Branch from main, NOT dev. Branching from dev causes add/add conflicts
#    when dev and main have divergent histories (the post-squash-merge norm).
git fetch origin
git checkout -b release/<slug> origin/main

# 2. List the dev commits not yet on main:
git log --oneline dev --not origin/main

# 3. Cherry-pick the ones you want to ship. Docs commits stay on dev.
git cherry-pick <sha1> <sha2> ...

# 4. Triple-diff verification — belt-and-suspenders sweep that catches both
#    directions of drift before the release tag goes out:
#
#    A. main → release  (what users will see; the intended ship surface)
#    B. release → dev   (should be empty for non-doc paths until the
#                        bump/CHANGELOG commits land, and even then should
#                        only list those release-prep files — anything else
#                        is a missed cherry-pick)
#    C. dev → main      (sanity: phantom commits dev "appears ahead" on
#                        because cherry-pick rewrites SHAs post-squash)
git diff origin/main..HEAD --stat                                                # A
git diff HEAD..origin/dev --name-only | grep -v '^docs/' || echo "(none)"        # B
git diff origin/dev..origin/main --stat | tail -5                                # C
#
# Re-confirm no guarded paths leaked (this caught the original miss class):
git diff origin/main..HEAD --name-only \
  | grep -E '^(docs/plans|docs/brainstorms|docs/ideation|docs/reviews|docs/solutions|\.context)' \
  && echo "LEAKED — reset and redo" || echo "(clean — no guarded paths)"
#
# Patch-id cherry check — catches commits on dev that have NO patch-id
# equivalent on release. The file-level diff in B misses this class when
# the same content happens to land via a different commit.
#
# IMPORTANT: in a squash-merge workflow this output is noisy. Every '+'
# line needs human triage — it does NOT auto-block the release. Expected
# sources of '+' lines that are NOT real misses:
#
#   1. Historical commits squash-merged in prior releases. The squash
#      commit on main has a different patch-id than the dev commits it
#      consolidates, so old commits show as '+' forever. Anything older
#      than the previous release tag is almost always this.
#   2. Cherry-picks where conflict resolution stripped guarded paths
#      (docs/plans, docs/brainstorms, etc.) or otherwise altered the
#      tree. Same source-code intent, different patch-id.
#   3. Intentionally skipped commits — docs-only commits, release-prep
#      backports, revert-and-redo prep steps.
#
# A real miss looks like: a recent feat/fix/chore commit on dev whose
# *file content* is not yet on main. To triage a '+' line:
#
#   git show <sha> --stat                       # what did it touch?
#   git diff origin/main..HEAD -- <those-files> # already on release?
#
# If every touched file is guarded (docs/plans/, docs/brainstorms/, etc.)
# OR the content is already on main via a prior squash, it's a false
# positive — no action. Otherwise cherry-pick the commit and re-run the
# triple-diff.
git cherry HEAD origin/dev | grep '^+' || echo "(none — release is patch-equivalent through dev)"
#
# If B lists any non-docs path you didn't expect, fetch dev, identify the
# commit (`git log dev --not origin/main`), cherry-pick it, re-run the
# triple-diff. Missed cherry-picks have shipped to main on this and sibling
# repos before — this step is the cheap way to catch them.

# 5. (Language-specific: bump version, regenerate changelog, etc.)

# 6. Review CHANGELOG.md. See "PRs and changelog generation" below for the
#    cliff.toml chore-skip footgun and how to recover.

# 7. Push and open the PR:
git push -u origin release/<slug>
gh pr create --base main --head release/<slug> --title "release: <summary>"
```

When the PR merges, the deploy / publish workflow picks up the push to `main`. Auto-delete removes `release/<slug>` from
the remote on merge. `dev` is untouched.

### Why branch from main, not dev

Branching from `dev` and then `gio trash`-ing the guarded paths seems simpler but produces `add/add` merge conflicts
whenever `dev` and `main` have diverged (which they always do after the first squash merge). The file appears as "added"
on both sides with different content. Always branch from `origin/main` and cherry-pick onto it.

## PRs and changelog generation

Every PR **must** follow `.github/pull_request_template.md`. The template has a `## Changelog` section with these
subsections:

- `### Added` — new user-visible features or capabilities
- `### Changed` — changes to existing behavior
- `### Fixed` — bug fixes
- `### Removed` — removed features or APIs
- `### Security` — security-relevant changes

`scripts/generate-changelog.sh` (which wraps `git-cliff` per `cliff.toml`, then fetches PR bodies via the GitHub API to
expand entries) pulls these subsections verbatim into `CHANGELOG.md` at release time. A PR that lands with an empty or
missing `## Changelog` section silently drops its user-facing notes from the next release changelog — fix it by editing
the PR body on GitHub and re-running the script.

## Release gating

A release tag is cut only when a merge to `main` changes `principles/p*-*.md` **or** `VERSION`. Merges that touch
neither (workflow fixes, README polish, `principles/AGENTS.md` edits, decision records, tooling) land on `main` without
producing a tag, a GitHub Release, or a downstream `repository_dispatch`.

**Dual-condition trigger (OR).** `.github/workflows/publish.yml` triggers on `paths: [principles/p*-*.md, VERSION]`.
Either is sufficient. The narrow principles glob excludes `principles/AGENTS.md` (maintainer authoring conventions, not
RFC content) and matches `p1-*.md` through any future `p8+` additions. Adding `VERSION` to the filter lets
governance/tooling pushes that bump VERSION cut a release without needing a principle edit.

**CHANGELOG.md is the release signal.** When the trigger fires, `publish.yml` reads `VERSION` and looks for a matching
`## [$VERSION] - YYYY-MM-DD` section in `CHANGELOG.md` (Keep-a-Changelog shape, produced by `cliff.toml` +
`scripts/generate-changelog.sh`). If that section is missing, the workflow logs `::notice::No '## [$VERSION]' section …
skipping release cut` and exits cleanly — no tag, no Release, no dispatch. A principle push without a CHANGELOG bump is
treated as a no-op, not an error. The release author opts in by committing the CHANGELOG entry on the release branch.

**CHANGELOG is generated locally, PR-body-driven.** The release author runs `scripts/generate-changelog.sh` on the
release branch. Stage 1 runs `git-cliff --tag v$VERSION --unreleased --prepend CHANGELOG.md` to produce a skeleton
section keyed off commit subjects, with `(#N)` references auto-linked via `cliff.toml`'s `[remote.github]` block. Stage
2 is a Python post-processor that, for every PR number in the skeleton, fetches the PR body via `gh api
repos/.../pulls/N`, extracts its `## Changelog` → `### Added / Changed / Fixed / Removed / Security` subsections, and
rewrites the skeleton bullets with the richer PR-body content plus `by @user in [#N]` attribution and a `**Full
Changelog**: v<prev>...v<this>` compare link.

**PR body is the source of truth.** If a bullet is wrong — typo, missed detail, wrong category — edit the PR body on
GitHub (PR bodies remain editable after merge) and re-run `scripts/generate-changelog.sh`. It re-fetches from the API
every run. Never hand-write `CHANGELOG.md`; `CI reads CHANGELOG, the script writes it, the PR body governs it.`

**`cliff.toml` skips `chore`/`style`/`test`/`ci`/`build` commits regardless of PR-body content.** If a cherry-picked PR
has user-facing `## Changelog` content but its commit subject starts with one of those types, the post-processor never
sees its PR number and the bullets get silently dropped. After running the script, cross-check the generated section
against `gh pr view <num> --json body` for each cherry-picked PR; correct mistyped PR titles (e.g. `chore` → `feat`) and
re-amend the cherry-pick subject before re-running. See "Prefer `feat`/`fix` over `chore`" in global CLAUDE.md for
prevention.

**Tag-exists guard.** Once a CHANGELOG entry is present, `publish.yml` refuses to run if `v$VERSION` already exists on
origin. VERSION must be bumped to cut a new release — the workflow will never re-tag a published version.

**Pre-push semver check on `release/*` branches.** `scripts/check-release-version.sh` runs as a stage of the pre-push
hook and no-ops on any non-release branch. On a `release/*` push it enforces:

- `VERSION` is `X.Y.Z` (three non-negative integers).
- If `principles/p*-*.md` changed relative to `origin/main`, `VERSION` must differ from `origin/main`'s `VERSION`.
- If `VERSION` changed, the new value is **strictly greater than** `origin/main`'s `VERSION` (no downgrades, no re-
  uses). Numeric major.minor.patch comparison.
- Tag `v$VERSION` must not already exist on origin.

The author bumps `VERSION` manually; the hook only verifies the bump is coherent. No auto-increment.

**Tag scheme is pure semver.** `v0.2.0`, `v0.2.1`, etc. No separate spec-vs-repo tag namespace — if you want a non-spec
change visible on `main`, just merge it without a tag. The history shows the merge; downstream consumers pin to spec
content.

**Manual re-run.** `publish.yml` also accepts `workflow_dispatch` with a `version` input if a tag needs to be re-created
without a content change (e.g., the prior run failed partway through). The input must match the `VERSION` file on
`main`.

## Branch protection

Two rulesets are committed under `.github/rulesets/` and applied to the repo via the GitHub API:

- `protect-main.json` — required signatures, linear history, squash-only merges via PR, required status checks
  (typically: `ci`, `guard-docs`, `guard-release`), creation/deletion blocked, non-fast-forward blocked.
- `protect-dev.json` — required signatures, deletion blocked, non-fast-forward blocked. No PR-requirement at the ruleset
  level; the PR-only norm is enforced by convention + `guard-release-branch` on the main side.

### Applying changes

Edit the JSON locally, then sync to the remote:

```bash
# First apply (creating a ruleset):
gh api -X POST repos/<owner>/<repo>/rulesets --input .github/rulesets/protect-dev.json

# Subsequent updates (replace by ID — find via `gh api repos/.../rulesets`):
gh api -X PUT repos/<owner>/<repo>/rulesets/<id> --input .github/rulesets/protect-main.json
```

Committing the JSON alongside code means ruleset changes land via the same review process as workflow changes — a
`chore(ci): tighten protect-main` release goes through dev → release/* → main like anything else.

### Status-check context pitfall

The `required_status_checks[].context` strings in `protect-main.json` must match exactly what GitHub publishes for each
check:

- **Inline job** (with `name:` field): published as just `<job-name>` (no workflow-name prefix).
- **Reusable-workflow caller** (`uses: .../foo.yml@ref`): published as `<caller-job-id> / <reusable-job-id-or-name>`.

Mixing these produces a stuck-but-green PR: all actual checks report green, but the ruleset waits forever on a context
that will never appear. Confirm the real contexts after a first CI run with:

```bash
gh api repos/<owner>/<repo>/commits/<sha>/check-runs --jq '.check_runs[].name'
```

## Related docs

- [`.github/pull_request_template.md`](.github/pull_request_template.md) — PR body structure with changelog sections
- Project-specific release details (versioning, publishing, deploy targets) — typically in `README.md` or a `DEPLOY.md`
  next to this file
