# Releasing `the agent-native CLI standard`

Operational runbook. Rationale lives in [`RELEASES-RATIONALE.md`](./RELEASES-RATIONALE.md).

```text
feature branch → PR to dev (squash merge)
              → release/* branch cut from main, with dev's tree overlaid
              → PR to main (squash merge)
              → publish workflow tags and releases when VERSION and CHANGELOG.md agree
```

Direct commits to `dev` or `main` are not permitted: every change has a PR number in its squash commit message.

## Branches

| Branch                                 | Role                                    | Lifetime                                    | Protection                           |
| -------------------------------------- | --------------------------------------- | ------------------------------------------- | ------------------------------------ |
| `main`                                 | Production. Only release commits.       | Forever.                                    | `.github/rulesets/protect-main.json` |
| `dev`                                  | Integration. All feature PRs land here. | Forever. Never delete.                      | `.github/rulesets/protect-dev.json`  |
| `feat/*`, `fix/*`, `chore/*`, `docs/*` | Feature work.                           | One PR's worth. Auto-deleted on merge.      | None. Squash into dev freely.        |
| `release/*`                            | Head of a dev → main PR.                | One release's worth. Auto-deleted on merge. | None.                                |

→ Rationale: [`RELEASES-RATIONALE.md` § Branching model](./RELEASES-RATIONALE.md#branching-model).

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
- **PR body**: follow `.github/pull_request_template.md`. See [§ PR body](#pr-body).
- **PR body prose scrub**: see [§ Prose scrubbing](#prose-scrubbing).

### Dev-direct exception

Paths that live only on `dev` and never ship to `main` can be committed directly to `dev` without a feature branch or
PR. The `guard-main-docs` workflow blocks them from `main` PRs regardless. The exception applies to:

- Engineering docs: `docs/architecture/`, `docs/brainstorms/`, `docs/ideation/`, `docs/plans/`, `docs/research/`,
  `docs/reviews/`, `docs/solutions/`, and anything under `.context/`.
- Prose-check stack: `styles/`, `.vale.ini`, `scripts/prose-check.sh`.

The full set is what `scripts/release/guarded-paths.sh` prints: the reusable workflow's base list plus this repo's
`extra_paths` in `.github/workflows/guard-main-docs.yml`. Registering a path there is the only edit a new guarded path
needs.

The standard feature → PR → squash-merge flow remains required for everything else, including consumer-facing markdown
(README, AGENTS, CONTRIBUTING, CHANGELOG, principles).

## PR body

Every PR (feature, fix, docs, release) uses `.github/pull_request_template.md` verbatim. Five sections, no inventions:
`## Summary`, `## Changelog`, `## Linked audit review`, `## Human reviewer`, `## AI disclosure`.

- **No explainer prose anywhere in the body.** User-facing substance only.
- **Summary describes the net diff only**: what merged `main` looks like vs the base branch. Not commit history,
  intermediate state, or release-branch mechanics.
- **Zero verification artifacts in the body.** No diff stats, leak-check output ("`guard-main-docs` runs clean"),
  patch-id cherry-check counts, pre-push gate results, CI status, or prose-scrub findings. Anomalies get fixed before
  push, not audit-trailed.
- **Changelog** subsections (`### Added` / `### Changed` / `### Fixed` / `### Removed` / `### Security`): 1-5 bullets
  each, delete empty subsections, each bullet starts with a verb.
- **Linked audit review** carries the companion-PR URL on `agentnative-cli` (or "no audit changes needed" with
  justification) per the coupled-release norm in `principles/AGENTS.md`. Required for any PR that adds, removes, or
  re-tiers a `requirements[]` entry.
- **No AI attribution** in commits or PR bodies.
- **No hard line wraps**: one logical line per paragraph or bullet.

→ Rationale: [`RELEASES-RATIONALE.md` § PR body conventions](./RELEASES-RATIONALE.md#pr-body-conventions).

## Releasing dev to main

Engineering docs and the prose-check stack live on `dev` only. `guard-main-docs.yml` blocks them from reaching `main`,
and `guard-release-branch.yml` rejects any PR to main whose head isn't `release/*`.

**Branch naming**: `release/v<version>` or `release/v<version>-<slug>` for a tagging release;
`scripts/generate-changelog.py` reads the version off the branch name, so the `v<version>` prefix is required (or pass
`--tag v<version>`). A release that bumps neither `principles/p*-*.md` nor `VERSION` (see
[§ Release gating](#release-gating)) skips the changelog and can use `release/<slug>`.

`main` and `dev` share only an ancient merge-base: every release squash-merges into `main`, so the two branches diverge
in history even as their content converges. Reconciling that with a merge, or a branch cut from `dev`, produces a pile
of rename/delete conflicts that are artifacts of the lineage, not of the content shipping. The release branch is
therefore built as a **clean descendant of `main`** with `dev`'s tree overlaid on top, asserting the desired end-state
directly.

### Pre-cut checklist

Each box is a go/no-go. Any unchecked item holds the cut.

- [ ] **Branch drift.** `scripts/release/drift.sh` exits 0. Security PRs, hotfixes, and config edits land on `main`
  first; the overlay takes `dev`'s content for every file, so anything `main` holds that `dev` never received is
  reverted by the release. Gate 1 lists the commits whose changes `dev` lacks (`differs` or `missing`); backport them by
  PR into `dev`, merge, and rerun. Gate 2 requires `.github/` to match on both branches. Gate 3 has no lockfile to
  compare in this repo.
- [ ] **Previous backport merged.** `git show origin/dev:VERSION` equals the last tag minus its `v`. When it does not,
  `scripts/sync-dev-after-release.sh v<prev>` never merged: the overlay would carry `dev`'s stale `CHANGELOG.md` and
  this cut would drop the previous release's section from `main`.
- [ ] **Guarded set resolves.** `scripts/release/guarded-paths.sh` prints the base list plus this repo's `extra_paths`.
  Never restate the set inline.
- [ ] **Surface established.** `git log origin/main..origin/dev --oneline` is what ships. No tag is an ancestor of `dev`
  on a squash-only lineage, so `$LAST_TAG..dev` is empty here; compare against `origin/main`.
- [ ] **Breaking markers reviewed.** `git log origin/main..origin/dev --grep '^[a-z]\+\(([^)]*)\)\?!:' --oneline` lists
  every Conventional-Commits `!:` subject, scoped or not. Each one drives the version decision and gets a `### Breaking
  changes` row in the release changelog.
- [ ] **Every PR merged since the last tag carries a `## Changelog` section**, or is a `chore` / `ci` / `build` /
  `style` / `test` PR that has nothing to say. Spot-check via `gh pr list --base dev --state merged --search
  "merged:>=$(git log -1 --format=%cI v<prev>)"` then `gh pr view <num> --json body`.

### Recipe

```bash
# 0. Nothing on main that dev never received (security PRs, hotfixes, config). Exits 1 while drift exists.
scripts/release/drift.sh

# 1. Branch from main, NOT dev.
git fetch origin
git checkout -B release/v<version> origin/main

# 2. Overlay dev's entire tracked tree onto the main base. `checkout -- .` writes dev's
#    paths but does not delete files that exist on main and are absent on dev, so remove
#    those next (the 'D' rows are main-only files dev deleted).
git checkout origin/dev -- .
git diff --name-status origin/main origin/dev | grep '^D'
trash <each main-only file listed above>

# 3. Strip the paths guard-main-docs forbids on main. The set resolves from the workflow;
#    never restate it inline, because every hand-kept copy drifted from what CI enforces.
GUARDED="$(scripts/release/guarded-paths.sh)"
git ls-files | grep -E "$GUARDED" | xargs -r trash
git add -A                                                      # stages adds, mods, AND deletions

# 4. Bump VERSION (see § Release gating for when a bump is required), then build the
#    changelog from the PRs merged into dev since the previous release. The overlay commit
#    carries no per-PR history, so the section is built from dev's PRs, not from this
#    branch's commits. A non-tagging release skips this step.
printf '%s\n' '<version>' > VERSION
scripts/generate-changelog.py --from-dev-prs
git add -A

# 5. Verify before committing.
#    A: staged tree equals dev's minus the version files and the stripped guarded paths.
#       Anything else printed here is a mistake.
git diff --cached --name-only origin/dev | grep -Ev "$GUARDED" \
  | grep -Ev '^(VERSION|CHANGELOG\.md)$' \
  && echo "unexpected delta above; investigate" || echo "(clean: only intended deltas)"
#    B: no guarded path in the release tree.
git diff --cached --name-only origin/main | grep -E "$GUARDED" \
  && echo "LEAKED a guarded path: reset and redo" || echo "(no guarded paths)"
#    D: what this release ADDS to main. The leak check screens against the registered
#       set, so it is blind to a category nobody registered yet. Every docs/ entry and
#       every added markdown file needs a reason to ship, or it needs registering in the
#       workflow's extra_paths and removing from the branch.
git diff --cached --diff-filter=A --name-only origin/main | grep -E '(^docs/|\.md$)' | grep -Ev "$GUARDED" || echo "(none unguarded)"

# 6. Commit the overlay as one commit sitting directly on top of main. The pre-push hook
#    runs scripts/check-release-version.sh against it on push (see § Release gating).
git commit

# 7. Push and open the PR. Scrub body in /tmp/ first.
git push -u origin release/v<version>
gh pr create --base main --head release/v<version> --title "release: v<version>" --body-file /tmp/body.md
```

The result is a single commit whose diff against `main` is the release, with `main` as an ancestor, so the PR merges
with zero conflicts. When it merges, `publish.yml` evaluates the push to `main` (see
[§ Release gating](#release-gating)). Auto-delete removes `release/v<version>` from the remote on merge. `dev` is
untouched.

→ Rationale (why overlay, not merge; why cut from `main`):
[`RELEASES-RATIONALE.md` § Branching model](./RELEASES-RATIONALE.md#branching-model). CHANGELOG mechanics:
[`RELEASES-RATIONALE.md` § CHANGELOG generation](./RELEASES-RATIONALE.md#changelog-generation).

### Exception: cherry-pick

The overlay is the release construction for this repo. Cherry-picking the dev squash-commits onto the `origin/main` base
is the exception, kept for a repo that has a stated reason it cannot overlay (record it under
[Project specifics](#project-specifics)); the per-PR changelog is not such a reason, since `--from-dev-prs` builds it
from `dev` either way. When cherry-picking, run the triple-diff verification:

```bash
# 2. List the dev commits not yet on main.
git log --oneline dev --not origin/main

# 3. Cherry-pick the ones to ship. Docs commits stay on dev.
git cherry-pick <sha1> <sha2> ...

# 4. Triple-diff verification.
GUARDED="$(scripts/release/guarded-paths.sh)"

git diff origin/main..HEAD --stat                                              # A: ship surface
git diff HEAD..origin/dev --name-only | grep -Ev "$GUARDED" || echo "(none)"   # B: no missed picks
git diff origin/dev..origin/main --stat | tail -5                              # C: phantom-commits sanity

# Re-confirm no guarded paths leaked.
git diff origin/main..HEAD --name-only \
  | grep -E "$GUARDED" \
  && echo "LEAKED: reset and redo" || echo "(clean)"

# D: what this release ADDS to main (see step 5 above for why).
git diff origin/main..HEAD --diff-filter=A --name-only | grep -E '(^docs/|\.md$)' | grep -Ev "$GUARDED" || echo "(none unguarded)"

# Patch-id cherry check (noisy in squash-merge workflow; triage per-line).
git cherry HEAD origin/dev | grep '^+' || echo "(none)"
```

Cherry-picks of PRs that touched guarded paths hit modify/delete or rename/delete conflicts, since those paths live on
`dev` but are blocked from `main`; resolve them per the next section. Steps 4 to 7 of the overlay recipe then apply
unchanged.

→ Triple-diff false-positive triage:
[`RELEASES-RATIONALE.md` § Triple-diff verification](./RELEASES-RATIONALE.md#triple-diff-verification).

### Cherry-pick conflicts on guarded paths

Cherry-picks of feature PRs that touched guarded paths will hit modify/delete conflicts on the release branch. Those
paths exist on `dev` but are blocked from `main` by `guard-main-docs.yml`, so the cherry-pick sees them as "deleted in
HEAD, modified in `<commit>`". A PR that renames such a file also produces rename/delete conflicts on the same paths.

Resolution (the standard `git rm` is denied by repo policy; use the plumbing form):

```bash
# 1. Mark every unmerged guarded path as deleted in the index.
git update-index --remove $(git diff --name-only --diff-filter=U)

# 2. Trash the orphan worktree files left by the rename target side.
trash docs/plans/<leftover-paths>.md

# 3. Continue the cherry-pick.
git cherry-pick --continue --no-edit
```

Repeat per conflicting commit. After all picks land, run `git ls-files | grep -E "$(scripts/release/guarded-paths.sh)"`.
If anything remains, drop it with the same two-step pattern and commit as `chore(release): drop stray guarded paths from
cherry-pick rename detection` before the leak check.

## Release gating

A release tag is cut only when a merge to `main` changes `principles/p*-*.md` **or** `VERSION`. Merges that touch
neither (workflow fixes, README polish, `principles/AGENTS.md` edits, decision records, tooling) land on `main` without
producing a tag, a GitHub Release, or a downstream `repository_dispatch`. The PRs such a release carries are picked up
by the next tagging release, whose changelog window starts at the previous tag.

`.github/workflows/publish.yml` triggers on `paths: [principles/p*-*.md, VERSION]`. When the trigger fires, the workflow
reads `VERSION` and looks for a matching `## [$VERSION] - YYYY-MM-DD` section in `CHANGELOG.md`. If that section is
missing, the workflow logs `::notice::No '## [$VERSION]' section … skipping release cut` and exits cleanly.

**Generate the CHANGELOG entry on the release branch:**

```bash
scripts/generate-changelog.py --from-dev-prs
```

The script reads the version from the `release/v<version>` branch name (or `--tag`), lists the PRs merged into `dev`
since the previous tag, fetches each PR body from the GitHub API, and writes the version section from their `##
Changelog` subsections with author and PR-link attribution. PR bodies remain editable post-merge; typos can be fixed by
editing the PR on GitHub and re-running the script. Without `--from-dev-prs` the script runs `git-cliff` over the
branch's own commits first, which only fits a cherry-picked branch.

After generation, scrub `CHANGELOG.md` through Vale + LanguageTool + unslop (see [§ Prose scrubbing](#prose-scrubbing));
fix findings on the upstream PR body and re-run, never by hand-editing `CHANGELOG.md`.

**Pre-push semver check.** `scripts/check-release-version.sh` runs from the pre-push hook on every `release/*` push:
`VERSION` is `X.Y.Z`, it is strictly greater than `origin/main`'s when it changed, it changed if any
`principles/p*-*.md` did, and tag `v$VERSION` does not exist on origin yet.

**Manual re-run.** `publish.yml` accepts `workflow_dispatch` with a `version` input if a tag needs to be re-created
without a content change (e.g., the prior run failed partway through). The input MUST match the `VERSION` file on
`main`.

→ Rationale: [`RELEASES-RATIONALE.md` § Release gating](./RELEASES-RATIONALE.md#release-gating) and
[§ CHANGELOG generation](./RELEASES-RATIONALE.md#changelog-generation).

### Post-release checklist

Run after the `release/* → main` PR merges.

- [ ] **`publish.yml` green.** `gh run list --workflow publish.yml --limit 1`, then `gh run view <id> --json conclusion
  --jq .conclusion` is `success`. A run that logged the `skipping release cut` notice is a non-tagging release, not a
  failure.
- [ ] **Tag and Release exist.** `gh release view v<version>` is neither draft nor prerelease, and `gh api
  repos/brettdavies/agentnative/releases/latest --jq .tag_name` returns `v<version>`.
- [ ] **Downstream dispatch delivered.** `spec-release` reached `agentnative-cli` and `agentnative-site` (the workflow
  log lists each target; a missing `CI_RELEASE_TOKEN` skips the step with a warning). See `docs/syncs.md`.
- [ ] **Last-good identifier recorded.** The previous tag (`gh release list --limit 2`) is what a rollback re-points to;
  note it before merging.
- [ ] **Rollback path confirmed.** See [§ Rollback](#rollback).
- [ ] **Backport merged.** The PR from `scripts/sync-dev-after-release.sh v<version>` is merged into `dev` (next
  section).

### After publish: sync `dev` with the release

Once `publish.yml` has created the GitHub Release, bring the release bookkeeping (`VERSION`, `CHANGELOG.md`) back to
`dev` so the integration branch starts from the released baseline:

```bash
scripts/sync-dev-after-release.sh v<version>
```

The script opens a PR against `dev`; merge it once CI is green. Never merge `main` into `dev` or push to `dev` directly:
the squash-merged histories share no recent ancestry, so the merge conflicts on every file both sides touched, and a
direct push bypasses `dev`'s required checks. A non-tagging release has nothing to backport. `drift.sh` anchors on the
last tag, so a missed backport of the release commit itself is not drift it reports; the pre-cut checklist's `VERSION`
item is what catches it.

→ Rationale:
[`RELEASES-RATIONALE.md` § Why backport main to dev after publish](./RELEASES-RATIONALE.md#why-backport-main-to-dev-after-publish).

## Rollback

A bad release is rolled back at the surface consumers resolve, then repaired in git. Rollback re-points what consumers
get; it does not revert history. The release surface here is the annotated tag, the GitHub Release built from it, and
the `spec-release` dispatch. Tags are never re-pointed and `publish.yml` refuses to re-tag a version, so the fix ships
forward as a higher `VERSION` through the normal `dev` to `release/*` to `main` flow.

```bash
# Last-good identifier: the previous release tag. Record it before merging the release PR.
gh release list --limit 2

# Take the bad release out of /releases/latest. The tag and the Release page stay for the record.
gh release edit v<bad> --prerelease --latest=false
gh api repos/brettdavies/agentnative/releases/latest --jq .tag_name     # expect the last-good tag
```

Downstream consumers vendor the principle text by tag through their own `sync-spec.sh`; point them at the last-good tag
until the fix release lands (`docs/syncs.md`).

→ Rationale: [`RELEASES-RATIONALE.md` § Rollback](./RELEASES-RATIONALE.md#rollback).

## Prose scrubbing

Pre-push covers `*.md` files in the repo via Vale + LanguageTool. Three release-flow artifacts live outside that net and
need a manual scrub:

- PR bodies (`gh pr create` / `gh pr edit` send body text directly to GitHub).
- `CHANGELOG.md` (excluded from pre-push by `.vale.ini`; built from upstream PR bodies).
- Release-PR bodies (composed after the overlay lands).

```bash
# 1. Author or fetch in /tmp/.
$EDITOR /tmp/body.md                                           # author from scratch
gh pr view <num> --json body --jq .body > /tmp/body.md         # fetch existing
cp CHANGELOG.md /tmp/body.md                                   # changelog scrub

# 2. Vale (local rule packs at error tier).
vale --no-global --output=line --minAlertLevel=error /tmp/body.md

# 3. LanguageTool grammar check via lt_check (~/dotfiles/config/shell/languagetool.sh).
#    Skips cleanly if LT is unreachable. Inspect: `lt_rules`, `lt_info`. See § Voice
#    enforcement in CONTRIBUTING.md for the install-vs-required nuance.
lt_check /tmp/body.md

# 4. unslop (em-dash density + AI-unique structural patterns).
~/.claude/skills/unslop/scripts/score.py /tmp/body.md

# 5. Apply fixes in /tmp/. Re-run 2-4 until 0 blocking + unslop score 0.

# 6. Submit once.
gh pr create --base <base> --title "..." --body-file /tmp/body.md      # new PR
gh pr edit <num> --body-file /tmp/body.md                              # existing PR
# scripts/generate-changelog.py --from-dev-prs                         # CHANGELOG.md (re-fetches PR bodies)
```

For a `CHANGELOG.md` finding, fix the upstream PR body and regenerate. Hand-editing `CHANGELOG.md` directly produces
drift the next regeneration overwrites.

→ Rationale + which artifacts need this:
[`RELEASES-RATIONALE.md` § Prose scrubbing scope](./RELEASES-RATIONALE.md#prose-scrubbing-scope). Deep technical
reference for the rule packs and generator: `docs/architecture/voice-enforcement.md` (dev-only).

## Branch protection

Rulesets committed under `.github/rulesets/`, applied to the repo via the GitHub API:

- `protect-main.json`: required signatures, linear history, squash-only merges via PR, required status checks
  (`guard-docs`, `guard-release`, `guard-provenance`), creation/deletion blocked, non-fast-forward blocked.
- `protect-dev.json`: required signatures, deletion blocked, non-fast-forward blocked. PR-only norm is convention +
  `guard-release-branch` on the main side.

### Applying changes

```bash
# First apply (creating a ruleset):
gh api -X POST repos/<owner>/<repo>/rulesets --input .github/rulesets/protect-dev.json

# Subsequent updates (replace by ID; find it via `gh api repos/<owner>/<repo>/rulesets`):
gh api -X PUT repos/<owner>/<repo>/rulesets/<id> --input .github/rulesets/protect-main.json
```

→ Status-check context strings (inline vs reusable):
[`RELEASES-RATIONALE.md` § Status-check context strings](./RELEASES-RATIONALE.md#status-check-context-strings).

## Project specifics

- **Version carrier**: `VERSION` (plain `X.Y.Z`, no leading `v`). Bumped by hand on the release branch;
  `scripts/check-release-version.sh` verifies the bump.
- **Tag scheme**: `v<version>`, annotated, created by `publish.yml`. `cliff.toml` treats only anchored `vX.Y.Z` tags as
  release boundaries.
- **Required secrets**: `CI_RELEASE_TOKEN`, a fine-grained PAT with cross-repo dispatch permission, used by
  `publish.yml` for the `spec-release` dispatch. When absent, the dispatch step warns and skips.
- **Distribution channels**: git tag + GitHub Release (body is the `CHANGELOG.md` section); `spec-release`
  `repository_dispatch` to `brettdavies/agentnative-cli` and `brettdavies/agentnative-site`; `agentnative-skill`
  re-syncs manually.
- **Rollback**: `gh release edit v<bad> --prerelease --latest=false`, then a fix release with a higher `VERSION`. See
  [§ Rollback](#rollback).
- **Cherry-pick reason**: none. The overlay is the construction for every release.

## Related docs

- [`RELEASES-RATIONALE.md`](./RELEASES-RATIONALE.md) (release flow rationale, CHANGELOG pipeline, branch-protection
  pitfalls)
- `docs/architecture/voice-enforcement.md` (prose-check stack, dev-only)
- [`docs/syncs.md`](./docs/syncs.md) (downstream consumers and the `spec-release` dispatch chain)
- [`.github/pull_request_template.md`](.github/pull_request_template.md) (PR body structure with changelog sections)
