---
title: "feat: P0 — mirror skill PR #25 release-flow hardening (changelog --dry-run)"
type: feat
status: active
prs: ["#48", "#51"]
priority: P0
date: 2026-06-01
origin: "cross-repo mirror of brettdavies/agentnative-skill PR #25 (merged 2026-06-01); applies only the items relevant to this repo's scripts"
---

# feat: P0 — mirror skill PR #25 release-flow hardening (changelog --dry-run)

## Summary

`agentnative-skill` PR #25 hardened its release flow with two changes to `scripts/sync-dev-after-release.sh` and two
changes to `scripts/generate-changelog.py`. Mirror only the items that apply.

Reference PRs (read the exact diffs before implementing): <https://github.com/brettdavies/agentnative-skill/pull/25> and
the follow-up <https://github.com/brettdavies/agentnative-skill/pull/26>.

## Scope

### In scope

1. **`scripts/generate-changelog.py --dry-run` flag.** Read `CHANGELOG.md` into memory, run the normal generation flow
   in place, print a unified diff to stderr if the regenerated content differs from the saved copy, write the original
   back in a `finally` block, exit 0 when idempotent and exit 1 on drift. The script is vendored from the
   `rust-tool-release` skill in `brettdavies/agent-skills`.

   - [x] Built in #48.

2. **`scripts/generate-changelog.py` — PR-number extraction regex fix.** Mirror of
   [skill PR #26](https://github.com/brettdavies/agentnative-skill/pull/26). `pr_numbers_from_section()` collects PR
   numbers with `\(#(\d+)\)|\[#(\d+)\]`, which accepts both the parenthesized `(#14)` form git-cliff emits on the
   initial prepend and the markdown-link form `[#14](https://github.com/.../pull/14)` the script's own expansion step
   writes. A second run (e.g. `--dry-run` against an already-processed `CHANGELOG.md`, which is precisely the
   regen-idempotency check's mode of operation) still finds the PR numbers instead of silently finding none and skipping
   the refresh.

   - [x] Built in #51.

3. **`scripts/generate-changelog.py --dry-run` — wrap-tolerant comparison.** Known follow-up that the skill repo did
   *not* ship in PR #26. The dry-run comparison is byte-exact. When the on-disk `CHANGELOG.md` is line-wrapped by a
   markdownlint / `md-wrap` hook and the script's direct writes are unwrapped, the dry-run false-positives "drift" on
   every release, even after item 2, until the comparison is made wrap-tolerant. The dry-run flag itself is the contract
   item 1 commits to, so land the fix in the same pass that ports the flag. Suggested approach: run both files through
   `fmt -w 9999` (or an equivalent paragraph-flatten) before diffing, then use
   `diff --ignore-all-space --ignore-blank-lines`.

### Already shipped here

- **Duplicate-section guard** — `scripts/generate-changelog.py` already refuses to prepend a `## [X.Y.Z]` section when
  one exists for the current tag (see existing `CHANGELOG.md already has a [{version}] section` exit path). No action
  needed; cross-check during implementation that the guard semantics match the skill repo's so future cross-repo polish
  stays uniform.

### Not applicable

- The two `scripts/sync-dev-after-release.sh` changes (GitHub Release published-state check and post-sync
  regen-idempotency check) are out of scope for this plan.

## Acceptance

- `scripts/generate-changelog.py --dry-run --tag vX.Y.Z` exits 0 on a clean repo whose `CHANGELOG.md` matches what
  regeneration would produce; exits 1 with a unified diff on stderr when PR bodies have drifted.
- `CHANGELOG.md` is restored to its pre-invocation byte-for-byte content after every `--dry-run` run, including the
  failure path (verified by the `finally` block).
- PR-number extraction handles both `(#X)` and `[#X]` forms, so a run against an already-processed `CHANGELOG.md`
  still finds its PR numbers.
- `--dry-run` does not false-positive drift on a `CHANGELOG.md` whose only difference from a fresh regeneration is the
  markdownlint / `md-wrap` line-wrapping applied by the pre-commit hook.
- No regression in the non-`--dry-run` path; existing duplicate-section guard still fires.

## Notes for the implementer

- Read the exact `scripts/generate-changelog.py` diffs in the two reference PRs before touching anything here — the
  stash/restore mechanics, exit-code contract, and both-form regex are load-bearing.
- The reference PRs also document the rationale in their bodies; carry the same Conventional Commit style and
  changelog-section split when landing this work.
