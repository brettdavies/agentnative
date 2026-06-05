# Releasing `the agent-native CLI standard`

Operational runbook. Rationale lives in [`RELEASES-RATIONALE.md`](./RELEASES-RATIONALE.md).

```text
feature branch → PR to dev (squash merge)
              → cherry-pick to release/* branch
              → PR to main (squash merge)
              → deploy / publish pipeline fires
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
  `docs/reviews/`, `docs/solutions/`.
- Prose-check stack: `styles/`, `.vale.ini`, `scripts/prose-check.sh`.

The standard feature → PR → squash-merge flow remains required for everything else, including consumer-facing markdown
(README, AGENTS, CONTRIBUTING, CHANGELOG, principles).

## PR body

Every PR (feature, fix, docs, release) uses `.github/pull_request_template.md` verbatim. Five sections, no inventions:
`## Summary`, `## Changelog`, `## Linked audit review`, `## Human reviewer`, `## AI disclosure`.

- **No explainer prose anywhere in the body.** User-facing substance only.
- **Summary describes the net diff only** — what merged `main` looks like vs the base branch. Not commit history,
  intermediate state, or cherry-pick mechanics.
- **Zero verification artifacts in the body.** No triple-diff stats, leak-check output ("`guard-main-docs` runs clean"),
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

Engineering docs (`docs/plans/`, `docs/solutions/`, `docs/brainstorms/`, `docs/reviews/`) live on `dev` only.
`guard-main-docs.yml` blocks them from reaching `main`, and `guard-release-branch.yml` rejects any PR to main whose head
isn't `release/*`.

**Branch naming**: `release/<date>-<slug>` or `release/v<version>-<slug>` or just `release/<slug>`. Keep the slug short
and descriptive.

```bash
# 1. Branch from main, NOT dev.
git fetch origin
git checkout -b release/<slug> origin/main

# 2. List the dev commits not yet on main.
git log --oneline dev --not origin/main

# 3. Cherry-pick the ones to ship. Docs commits stay on dev.
git cherry-pick <sha1> <sha2> ...

# 4. Triple-diff verification.
git diff origin/main..HEAD --stat                                              # A: ship surface
git diff HEAD..origin/dev --name-only | grep -v '^docs/' || echo "(none)"      # B: no missed picks
git diff origin/dev..origin/main --stat | tail -5                              # C: phantom-commits sanity

# Re-confirm no guarded paths leaked.
git diff origin/main..HEAD --name-only \
  | grep -E '^(docs/plans|docs/brainstorms|docs/ideation|docs/reviews|docs/solutions|\.context)' \
  && echo "LEAKED — reset and redo" || echo "(clean)"

# Patch-id cherry check (noisy in squash-merge workflow; triage per-line).
git cherry HEAD origin/dev | grep '^+' || echo "(none)"

# 5. (Language-specific: bump VERSION, regenerate CHANGELOG.md, etc. See § Release gating.)

# 6. Push and open PR. Scrub body in /tmp/ first.
git push -u origin release/<slug>
gh pr create --base main --head release/<slug> --title "release: <summary>" --body-file /tmp/body.md
```

When the PR merges, the deploy / publish workflow picks up the push to `main`. Auto-delete removes `release/<slug>` from
the remote on merge. `dev` is untouched.

→ Rationale + triple-diff false-positive triage:
[`RELEASES-RATIONALE.md` § Triple-diff verification](./RELEASES-RATIONALE.md#triple-diff-verification).

## Release gating

A release tag is cut only when a merge to `main` changes `principles/p*-*.md` **or** `VERSION`. Merges that touch
neither (workflow fixes, README polish, `principles/AGENTS.md` edits, decision records, tooling) land on `main` without
producing a tag, a GitHub Release, or a downstream `repository_dispatch`.

`.github/workflows/publish.yml` triggers on `paths: [principles/p*-*.md, VERSION]`. When the trigger fires, the workflow
reads `VERSION` and looks for a matching `## [$VERSION] - YYYY-MM-DD` section in `CHANGELOG.md`. If that section is
missing, the workflow logs `::notice::No '## [$VERSION]' section … skipping release cut` and exits cleanly.

**Generate the CHANGELOG entry on the release branch:**

```bash
scripts/generate-changelog.py
```

The script extracts the version from the branch name, runs `git-cliff` to produce a skeleton, then re-fetches each PR
body from the GitHub API and rewrites the bullets with the richer PR-body content. PR bodies remain editable post-merge;
typos can be fixed by editing the PR on GitHub and re-running the script.

After generation, scrub `CHANGELOG.md` through Vale + LanguageTool + unslop (see [§ Prose scrubbing](#prose-scrubbing));
fix findings on the upstream PR body and re-run, never by hand-editing `CHANGELOG.md`.

**Manual re-run.** `publish.yml` accepts `workflow_dispatch` with a `version` input if a tag needs to be re-created
without a content change (e.g., the prior run failed partway through). The input MUST match the `VERSION` file on
`main`.

→ Rationale: [`RELEASES-RATIONALE.md` § Release gating](./RELEASES-RATIONALE.md#release-gating) and
[§ CHANGELOG generation](./RELEASES-RATIONALE.md#changelog-generation).

## Prose scrubbing

Pre-push covers `*.md` files in the repo via Vale + LanguageTool. Three release-flow artifacts live outside that net and
need a manual scrub:

- PR bodies (`gh pr create` / `gh pr edit` send body text directly to GitHub).
- `CHANGELOG.md` (excluded from pre-push by `.vale.ini`; built from upstream PR bodies).
- Release-PR bodies (composed after cherry-picks land).

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
# scripts/generate-changelog.py                                        # CHANGELOG.md (re-fetches PR bodies)
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

# Subsequent updates (replace by ID — find via `gh api repos/.../rulesets`):
gh api -X PUT repos/<owner>/<repo>/rulesets/<id> --input .github/rulesets/protect-main.json
```

→ Status-check context strings (inline vs reusable):
[`RELEASES-RATIONALE.md` § Status-check context strings](./RELEASES-RATIONALE.md#status-check-context-strings).

## Related docs

- [`RELEASES-RATIONALE.md`](./RELEASES-RATIONALE.md) (release flow rationale, CHANGELOG pipeline, branch-protection
  pitfalls)
- `docs/architecture/voice-enforcement.md` (prose-check stack, dev-only)
- [`.github/pull_request_template.md`](.github/pull_request_template.md) (PR body structure with changelog sections)
- Project-specific publishing details: commonly in `README.md` or a `DEPLOY.md` next to this file
