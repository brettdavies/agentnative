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
  user-facing release notes — changelog generators (e.g., `git-cliff`) extract these bullets verbatim.

## Releasing dev to main

Engineering docs (`docs/plans/`, `docs/solutions/`, `docs/brainstorms/`,
`docs/reviews/`) live on `dev` only. `guard-main-docs.yml` blocks them from reaching `main`, and
`guard-release-branch.yml` rejects any PR to main whose head isn't `release/*`. Use the release-branch cherry-pick
pattern:

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

# 4. Verify no guarded paths leaked through:
git diff origin/main --stat
# If anything under docs/plans/, docs/solutions/, or docs/brainstorms/
# shows up, you cherry-picked a docs commit by mistake — reset and redo.

# 5. (Language-specific: bump version, regenerate changelog, etc.)

# 6. Push and open the PR:
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

Changelog generators (e.g., `git-cliff` with `cliff.toml`) read the squash-
merged commit bodies for these sections and assemble `CHANGELOG.md` entries directly. A PR that lands with an empty or
missing `## Changelog` section silently drops its user-facing notes from the next release changelog.

## Release gating

A release tag is cut only when `principles/p*-*.md` changes on a merge to `main`. Non-principles merges (workflow fixes,
README polish, tooling improvements, `principles/AGENTS.md` edits, decision records) land on `main` without producing a
tag, a GitHub Release, or a downstream `repository_dispatch`.

**Path-based, not VERSION-based.** `.github/workflows/publish.yml` triggers on `paths: principles/p*-*.md`. The trigger
is a diff property, not an author-discipline check. The narrow glob excludes `principles/AGENTS.md` (maintainer
authoring conventions, not RFC content) and matches `p1-*.md` through any future `p8+` additions.

**VERSION-consistency check.** When the path filter fires, `publish.yml` reads `VERSION`, computes `v$VERSION`, and
fails the workflow if that tag already exists. This forces the author to bump `VERSION` when spec content changes — the
workflow refuses to re-tag an existing version.

**CHANGELOG is generated locally.** The release author runs `git-cliff --config cliff.toml --tag v$VERSION <base>..HEAD`
on the release branch, hand-polishes the output, and commits the updated `CHANGELOG.md` as part of the release PR.
`publish.yml` extracts the `## v$VERSION` section from the committed file for the GitHub Release body. CI reads
CHANGELOG; it does not generate it. See `cliff.toml` for the config.

**Tag scheme is pure semver.** `v0.2.0`, `v0.2.1`, etc. No separate spec-vs-repo tag namespace — if you want a non-spec
change visible on `main`, just merge it without a tag. The history shows the merge; downstream consumers pin to spec
content, which hasn't changed.

**First release without a tag.** The first substantive merge to `main` from `dev` (the release-infra release) does not
touch `principles/`, so the workflow does not fire and no tag is produced. `main` will have content but zero tags until
the first spec-content release lands.

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

Committing the JSON alongside code means ruleset changes land via the same
review process as workflow changes — a `chore(ci): tighten protect-main` release goes through dev → release/* → main
like anything else.

### Status-check context pitfall

The `required_status_checks[].context` strings in `protect-main.json` must match exactly what GitHub publishes for each
check:

- **Inline job** (with `name:` field): published as just `<job-name>` (no workflow-name prefix).
- **Reusable-workflow caller** (`uses: .../foo.yml@ref`): published as `<caller-job-id> / <reusable-job-id-or-name>`.

Mixing these produces a stuck-but-green PR: all actual checks report green,
but the ruleset waits forever on a context that will never appear. Confirm the real contexts after a first CI run with:

```bash
gh api repos/<owner>/<repo>/commits/<sha>/check-runs --jq '.check_runs[].name'
```

## Related docs

- [`.github/pull_request_template.md`](.github/pull_request_template.md) — PR body structure with changelog sections
- Project-specific release details (versioning, publishing, deploy targets) — typically in `README.md` or a `DEPLOY.md`
  next to this file
