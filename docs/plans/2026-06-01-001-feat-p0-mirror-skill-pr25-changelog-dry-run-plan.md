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

Reference PR (read the exact diff before implementing): <https://github.com/brettdavies/agentnative-skill/pull/25>.

## Scope

### In scope

1. **`scripts/generate-changelog.sh --dry-run` flag.** Stash `CHANGELOG.md`, run the normal generation flow in place,
   print a unified diff to stderr if the regenerated content differs from the stashed copy, restore the original via
   `trap … EXIT`, exit 0 when idempotent and exit 1 on drift. Matches the skill repo implementation verbatim where the
   surrounding code allows.

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
- No regression in the non-`--dry-run` path; existing duplicate-section guard still fires.

## Notes for the implementer

- Read the exact `scripts/generate-changelog.sh` diff in the reference PR before touching anything here — the
  stash/restore mechanics and exit-code contract are load-bearing.
- The reference PR also documents the rationale in its body; carry the same Conventional Commit style and
  changelog-section split when landing this work.
