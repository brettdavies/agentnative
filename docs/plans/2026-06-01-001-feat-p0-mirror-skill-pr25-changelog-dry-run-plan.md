---
title: "feat: P0 — mirror skill PR #25 release-flow hardening (changelog --dry-run)"
type: feat
status: proposed
priority: P0
date: 2026-06-01
origin: "cross-repo mirror of brettdavies/agentnative-skill PR #25 (merged 2026-06-01); applies only the items relevant to this repo's scripts"
---

# feat: P0 — mirror skill PR #25 release-flow hardening (changelog --dry-run)

## Summary

`agentnative-skill` PR #25 hardened its release flow with two changes to `scripts/sync-dev-after-release.sh` and two
changes to `scripts/generate-changelog.sh`. This repo has `scripts/generate-changelog.sh` but **no
`scripts/sync-dev-after-release.sh`** (the spec repo's release artifacts are markdown principles, not a Cargo crate, so
there is no dev-backport step). Mirror only the items that apply.

Reference PRs (read the exact diffs before implementing): <https://github.com/brettdavies/agentnative-skill/pull/25>
and the follow-up <https://github.com/brettdavies/agentnative-skill/pull/26>.

## Scope

### In scope

1. **`scripts/generate-changelog.sh --dry-run` flag.** Stash `CHANGELOG.md`, run the normal generation flow in place,
   print a unified diff to stderr if the regenerated content differs from the stashed copy, restore the original via
   `trap … EXIT`, exit 0 when idempotent and exit 1 on drift. Matches the skill repo implementation verbatim where the
   surrounding code allows.

2. **`scripts/generate-changelog.sh` — PR-number extraction regex fix.** Mirror of
   [skill PR #26](https://github.com/brettdavies/agentnative-skill/pull/26). The current extraction uses
   `grep -oP '\(#\K\d+'`, which only matches the parenthesized `(#14)` form git-cliff emits on the initial prepend.
   The script's own Python expansion step rewrites those to markdown-link form `[#14](https://github.com/.../pull/14)`.
   A second run (e.g. `--dry-run` against an already-processed `CHANGELOG.md`, which is precisely the regen-idempotency
   check's mode of operation) extracts zero PR numbers; with `set -euo pipefail`, grep's exit-1-on-no-match aborts the
   script with empty output before `summarize_and_exit` can run. Change the regex to `[\(\[]#\K\d+` (accepts both
   forms) and append `|| true` so the downstream `[[ -z "$PR_NUMBERS" ]]` branch handles the empty case via
   `summarize_and_exit`. One-line change at the `PR_NUMBERS` extraction; carry it over verbatim from the skill repo's
   diff.

3. **`scripts/generate-changelog.sh --dry-run` — wrap-tolerant comparison.** Known follow-up that the skill repo did
   *not* ship in PR #26. The dry-run comparison uses byte-exact `cmp -s`. The on-disk `CHANGELOG.md` is line-wrapped
   by the repo's markdownlint / `md-wrap` hook; the script's direct writes are unwrapped. Even after item 2, the
   dry-run will false-positive "drift" on every release until the comparison is made wrap-tolerant. There is no
   `sync-dev-after-release.sh` consumer in this repo, so the false-positive is stderr-only here — but the dry-run flag
   itself is the contract item 1 commits to, so land the fix in the same pass that ports the flag. Suggested
   approach: run both files through `fmt -w 9999` (or an equivalent paragraph-flatten) before diffing, then use
   `diff --ignore-all-space --ignore-blank-lines`.

### Already shipped here

- **Duplicate-section guard** — `scripts/generate-changelog.sh` already refuses to prepend a `## [X.Y.Z]` section when
  one exists for the current tag (see existing `CHANGELOG.md already has a [${RELEASE_VER}] section` exit path). No
  action needed; cross-check during implementation that the guard semantics match the skill repo's so future
  cross-repo polish stays uniform.

### Not applicable

- `scripts/sync-dev-after-release.sh` does not exist in this repo. Both preconditions (GitHub Release published-state
  check and post-sync regen-idempotency check) have no host. Do not create the script just to host them.

## Acceptance

- `scripts/generate-changelog.sh --dry-run --tag vX.Y.Z` exits 0 on a clean repo whose `CHANGELOG.md` matches what
  regeneration would produce; exits 1 with a unified diff on stderr when PR bodies have drifted.
- `CHANGELOG.md` is restored to its pre-invocation byte-for-byte content after every `--dry-run` run, including the
  failure path (verified by the EXIT trap).
- PR-number extraction handles both `(#X)` and `[#X]` forms, and the script no longer aborts via `set -euo pipefail`
  when an already-processed `CHANGELOG.md` yields zero matches.
- `--dry-run` does not false-positive drift on a `CHANGELOG.md` whose only difference from a fresh regeneration is the
  markdownlint / `md-wrap` line-wrapping applied by the pre-commit hook.
- No regression in the non-`--dry-run` path; existing duplicate-section guard still fires.

## Notes for the implementer

- Read the exact `scripts/generate-changelog.sh` diffs in the two reference PRs before touching anything here — the
  stash/restore mechanics, exit-code contract, and regex-with-`|| true` shape are load-bearing.
- The reference PRs also document the rationale in their bodies; carry the same Conventional Commit style and
  changelog-section split when landing this work.
