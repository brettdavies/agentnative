# Releases rationale

Companion to [`RELEASES.md`](./RELEASES.md). RELEASES.md is the runbook (commands, paths, decision tables). This file
holds the WHY behind those rules: branching model, PR conventions, release gating, CHANGELOG generation, prose-check
pipeline, branch-protection pitfalls.

The deep technical reference for the prose-check stack (Vale + LanguageTool rule packs, generator, pre-push integration)
lives in `docs/architecture/voice-enforcement.md`. That file is dev-only (blocked from `main` by `guard-main-docs.yml`).
This file is the high-level decision record that ships to `main`.

Read this when:

- A rule in RELEASES.md doesn't make sense and you're tempted to change it.
- A new contributor asks "why is X done this way".
- You're adding a new release-flow rule and need to know where it fits the existing model.

## Branching model

### Forever `dev`, ephemeral release branches

`dev` is never deleted, even after a release. The next release cycle reuses the same `dev`. The repo's
`deleteBranchOnMerge: true` setting doesn't touch `dev` as long as `dev` is never the head of a PR. Using a short-lived
`release/*` head is what keeps the setting compatible with a forever integration branch.

Engineering docs (`docs/plans/`, `docs/solutions/`, `docs/brainstorms/`, `docs/reviews/`) live on `dev` only. They never
reach `main`. `guard-main-docs.yml` blocks them from PRs targeting `main`, and `guard-release-branch.yml` rejects any PR
to main whose head isn't `release/*`.

### Why cherry-pick from `main`, not branch from `dev`

Branching from `dev` and then `gio trash`-ing the guarded paths seems simpler but produces `add/add` merge conflicts
whenever `dev` and `main` have diverged (which they always do after the first squash merge). The file appears as "added"
on both sides with different content. Always branch from `origin/main` and cherry-pick the dev commits onto it.

## PR body conventions

### No explainer prose in the body

Every section of a PR body is user-facing substance only: what is changing for the consumer that was not already there —
the **net diff**, not the commit history or intermediate state that produced it. Workflow mechanics (cherry-pick,
regenerate, pre-push gate, CI behavior) is documented in RELEASES.md and `.github/`, NOT in the PR body. Triple-diff
output ("A: 12 files, B: none, C: clean"), leak-check narration ("`guard-main-docs` runs clean", "no guarded paths
leaked"), patch-id cherry-check counts, pre-push gate results, CI check status, exclusion rationale, and other
verification artifacts stay local; anomalies get fixed before push, not audit-trailed in the body.

The PR body is read by humans reviewing what shipped. Workflow mechanics and tool-fix provenance are noise from that
perspective; they belong in this file, the script outputs, and the commit history respectively.

### Why no hard line wraps

Author each paragraph and each bullet as one logical line, however long. GitHub soft-wraps for display. Hard wraps
within prose produce visible mid-sentence breaks in some renderers and interfere with the prose-check pipeline: Vale's
line-anchored output reports findings against split lines, LanguageTool's input handling can choke on certain
control-char interactions. The auto-format hook skips `/tmp/` paths so the body keeps its authored shape, don't undo
that with manual wrapping during composition. Same rule applies to commit messages composed via heredoc and to any
markdown that ships verbatim to GitHub.

### Why release-PR bodies repeat changelog entries from upstream PRs

The release PR carries the same `### Added` / `### Changed` / `### Fixed` / `### Removed` / `### Security` bullets as
the feature PRs it cherry-picks. The repetition is intentional and harmless: `cliff.toml`'s `^release` skip prevents the
release-PR squash commit from being double-counted in any future regeneration.

### Why internal-tooling commits don't appear in `## Changelog`

`chore(cliff): ...`, `chore(prose-check): ...`, and similar internal tooling commits don't appear in the PR body's `##
Changelog`. They are not user-facing. `cliff.toml` skips `^chore` (and `^style` / `^test` / `^ci` / `^build`) regardless
of body content; the post-processor never sees their PR numbers. They belong in commit history and in the Summary /
Files Modified sections of the PR body, not in the source-of-truth release notes.

## Triple-diff verification

The release-PR procedure runs three diffs (A: main→release, B: release→dev for non-doc paths, C: dev→main) plus a
patch-id cherry check. This is belt-and-suspenders because missed cherry-picks have shipped to `main` on this and
sibling repos before, and the file-level diff in B alone doesn't catch the patch-id false-negative class.

### Why patch-id cherry-check output is noisy

In a squash-merge workflow, `git cherry HEAD origin/dev` produces many `+` lines that need human triage. They do NOT
auto-block the release. Expected sources of false positives:

1. **Historical commits squash-merged in prior releases.** The squash commit on main has a different patch-id than the
   dev commits it consolidates, so old commits show as `+` forever. Anything older than the previous release tag is
   almost always this.
2. **Cherry-picks where conflict resolution stripped guarded paths** (`docs/plans/`, `docs/brainstorms/`, etc.) or
   otherwise altered the tree. Same source-code intent, different patch-id.
3. **Intentionally skipped commits** (docs-only commits, release-prep backports, revert-and-redo prep steps).

A real miss looks like: a recent feat/fix/chore commit on dev whose *file content* is not yet on main. To triage a `+`
line:

```bash
git show <sha> --stat                       # what did it touch?
git diff origin/main..HEAD -- <those-files> # already on release?
```

If every touched file is guarded (`docs/plans/`, `docs/brainstorms/`, etc.) OR the content is already on main via a
prior squash, it's a false positive (no action). Otherwise cherry-pick the commit and re-run the triple-diff.

## Release gating

### Dual-condition trigger (OR)

A release tag is cut only when a merge to `main` changes `principles/p*-*.md` **or** `VERSION`. Merges that touch
neither (workflow fixes, README polish, `principles/AGENTS.md` edits, decision records, tooling) land on `main` without
producing a tag, a GitHub Release, or a downstream `repository_dispatch`.

`.github/workflows/publish.yml` triggers on `paths: [principles/p*-*.md, VERSION]`. Either is sufficient. The narrow
principles glob excludes `principles/AGENTS.md` (maintainer authoring conventions, not RFC content) and matches
`p1-*.md` through any future `p8+` additions. Adding `VERSION` to the filter lets governance/tooling pushes that bump
VERSION cut a release without needing a principle edit.

### CHANGELOG.md is the release signal

When the trigger fires, `publish.yml` reads `VERSION` and looks for a matching `## [$VERSION] - YYYY-MM-DD` section in
`CHANGELOG.md` (Keep-a-Changelog shape, produced by `cliff.toml` + `scripts/generate-changelog.sh`). If that section is
missing, the workflow logs `::notice::No '## [$VERSION]' section … skipping release cut` and exits cleanly. No tag, no
Release, no dispatch. A principle push without a CHANGELOG bump is treated as a no-op, not an error. The release author
opts in by committing the CHANGELOG entry on the release branch.

### Tag scheme is pure semver

`v0.2.0`, `v0.2.1`, etc. No separate spec-vs-repo tag namespace. If you want a non-spec change visible on `main`, just
merge it without a tag. The history shows the merge; downstream consumers pin to spec content.

### Tag-exists guard

Once a CHANGELOG entry is present, `publish.yml` refuses to run if `v$VERSION` already exists on origin. VERSION MUST be
bumped to cut a new release. The workflow will never re-tag a published version.

### Pre-push semver check

`scripts/check-release-version.sh` runs as a stage of the pre-push hook and no-ops on any non-release branch. On a
`release/*` push it enforces:

- `VERSION` is `X.Y.Z` (three non-negative integers).
- If `principles/p*-*.md` changed relative to `origin/main`, `VERSION` MUST differ from `origin/main`'s `VERSION`.
- If `VERSION` changed, the new value is **strictly greater than** `origin/main`'s `VERSION` (no downgrades, no
  re-uses). Numeric major.minor.patch comparison.
- Tag `v$VERSION` MUST NOT already exist on origin.

The author bumps `VERSION` manually; the hook only verifies the bump is coherent. No auto-increment.

## CHANGELOG generation

### PR body is the source of truth

The release author runs `scripts/generate-changelog.sh` on the release branch. Stage 1 runs `git-cliff --tag v$VERSION
--unreleased --prepend CHANGELOG.md` to produce a skeleton section keyed off commit subjects, with `(#N)` references
auto-linked via `cliff.toml`'s `[remote.github]` block. Stage 2 is a Python post-processor that, for every PR number in
the skeleton, fetches the PR body via `gh api repos/.../pulls/N`, extracts its `## Changelog → ### Added / Changed /
Fixed / Removed / Security` subsections, and rewrites the skeleton bullets with the richer PR-body content plus `by
@user in [#N]` attribution and a `**Full Changelog**: v<prev>...v<this>` compare link.

If a bullet is wrong (typo, missed detail, wrong category), edit the PR body on GitHub (PR bodies remain editable after
merge) and re-run `scripts/generate-changelog.sh`. It re-fetches from the API every run. Never hand-write `CHANGELOG.md`
(CI reads CHANGELOG, the script writes it, the PR body governs it).

### Why `cliff.toml` skips chore/style/test/ci/build

These commit types do not produce user-facing content. If a cherry-picked PR has user-facing `## Changelog` content but
its commit subject starts with one of those types, the post-processor never sees its PR number and the bullets get
silently dropped. Prefer `feat` / `fix` when the change has any user-observable effect. See "Prefer `feat`/`fix` over
`chore`" in global CLAUDE.md for prevention.

## Prose scrubbing scope

Pre-push covers `*.md` files in the repo via Vale + LanguageTool. Three release-flow artifacts live outside that net and
need a manual scrub before they ship:

- **PR bodies.** `gh pr create` and `gh pr edit` send body text directly to GitHub; pre-push has no reach there.
- **`CHANGELOG.md`.** Excluded from pre-push by `.vale.ini` because it is a generated artifact built from upstream PR
  bodies. Findings inherit whatever prose those PR bodies carry.
- **Release-PR bodies.** The `release/*` PR to `main` carries contributor-authored wrap-up text composed after
  `CHANGELOG.md` has been generated, and the same out-of-repo gap applies.

Scrub-before-submit (author in `/tmp/`, scrub there, submit via `--body-file`) avoids the round-trip of "submit, scrub,
edit, scrub again". Every fix lands locally and the public PR sees only clean text. The auto-format hook skips `/tmp/`
paths so the body keeps its authored shape and no soft-wrapping is injected.

For a `CHANGELOG.md` finding, fix the upstream PR body (which `generate-changelog.sh` re-fetches every run) and
regenerate. Hand-editing the generated artifact directly produces drift the next regeneration overwrites.

The deep technical reference for the prose-check stack (rule packs, generator, pre-push integration) lives in
`docs/architecture/voice-enforcement.md`. That doc is dev-only and never reaches `main`; this section is the high-level
rationale that ships.

## Branch protection

### Status-check context strings

The `required_status_checks[].context` strings in `protect-main.json` MUST match exactly what GitHub publishes for each
check:

- **Inline job** (with `name:` field): published as just `<job-name>` (no workflow-name prefix).
- **Reusable-workflow caller** (`uses: .../foo.yml@ref`): published as `<caller-job-id> / <reusable-job-id-or-name>`.

Mixing these produces a stuck-but-green PR: all actual checks report green, but the ruleset waits forever on a context
that will never appear. Confirm the real contexts after a first CI run with:

```bash
gh api repos/<owner>/<repo>/commits/<sha>/check-runs --jq '.check_runs[].name'
```

### Why rulesets live in-repo

Committing the JSON alongside code means ruleset changes land via the same review process as workflow changes. A
`chore(ci): tighten protect-main` release goes through dev → release/* → main like anything else.

## Related docs

- [`RELEASES.md`](./RELEASES.md) (operational runbook: commands, paths, decision tables)
- `docs/architecture/voice-enforcement.md` (deep technical reference for the prose-check stack, dev-only)
- [`.github/pull_request_template.md`](.github/pull_request_template.md) (PR body structure with changelog sections)
