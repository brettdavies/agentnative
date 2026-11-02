<!-- Canonical version: 2026.10.22 (generic) -->
## Summary

<!-- Provide a brief overview of the changes in this PR. What feature/fix/improvement does this introduce?

     SCOPE: Describe the net diff only, meaning what the merged result looks
     like compared to the base branch. NOT commit history, intermediate
     state, or how the cherry-picks were assembled.

     EXCLUDE all verification artifacts:
- Triple-diff output / stats (A, B, C blocks)
- Leak-check output ("no guarded paths leaked", "guard-main-docs runs clean")
- Patch-id cherry-check counts
- Pre-push gate results, CI status, prose-scrub findings
- Any "I ran X and it returned Y" narration

     Anomalies get fixed before push, not audit-trailed in the body.
-->

## Changelog

<!-- CRITICAL: This section is the source of truth for CHANGELOG.md.
     generate-changelog.py extracts these categorized bullets verbatim
     into the release changelog. Write carefully; this IS the changelog.

     AUDIENCE: Spec consumers (tool authors, auditors, contributors). Write from
     their perspective: what changed in the standard, not how you edited it.

     INCLUDE: new or changed MUST/SHOULD/MAY tiers; new/removed principles;
     applicability-gate changes; governance changes that affect contributors;
     breaking changes to requirement IDs or frontmatter shape.

     EXCLUDE: prose-only clarifications, typo fixes, example additions that
     don't change requirement semantics, internal reorganization, CI changes.
     Document those elsewhere in the PR body, NOT here.

     RULES:
- 1-5 bullets per PR. Fewer is better. One-line fixes get one bullet.
- Delete empty ### sections entirely; don't leave blank categories.
- Keep the sections in this order, the one generate-changelog.py emits: Breaking changes, Added, Changed, Deprecated,
  Removed, Fixed, Documentation.
- Each bullet starts with a verb: Add, Fix, Change, Remove, Deprecate.
- Don't duplicate the PR title; expand on it or provide context.
- If the PR has NO user-facing changes (pure refactor, test-only, CI), leave this section empty or omit it. The PR still
  appears in git history; it just won't clutter the changelog. -->

### Breaking changes

-

### Added

-

### Changed

-

### Deprecated

-

### Removed

-

### Fixed

-

### Documentation

-

## Type of Change

<!-- Check the type that applies to this PR -->

- [ ] `feat`: New feature (non-breaking change which adds functionality)
- [ ] `fix`: Bug fix (non-breaking change which fixes an issue)
- [ ] `refactor`: Code refactoring (no functional changes)
- [ ] `perf`: Performance improvement
- [ ] `docs`: Documentation update
- [ ] `test`: Adding or updating tests
- [ ] `chore`: Maintenance tasks (dependencies, config, etc.)
- [ ] `ci`: CI/CD configuration changes
- [ ] `style`: Code style/formatting changes
- [ ] `build`: Build system changes
- [ ] `BREAKING CHANGE`: Breaking API change (requires major version bump)

## Related Issues/Stories

<!-- Link to related issues, stories, or documentation -->

- Story:
- Issue:
- Architecture:
- Related PRs:

## Testing

<!-- Describe the testing approach and results -->

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed
- [ ] All tests passing

**Test Summary:**

- Unit tests: X passing
- Integration tests: Y passing
- Coverage: Z%

## Files Modified

<!-- List the main files modified in this PR -->

**Modified:**

**Created:**

**Renamed:**

**Deleted:**

## Linked audit review

<!-- REQUIRED for principle edits (any MUST/SHOULD/MAY tier add/remove/move).
     Paste ONE of:
- A PR URL from brettdavies/agentnative-cli (e.g., https://github.com/brettdavies/agentnative-cli/pull/42)
- "no audit changes needed" with brief justification
-->

## Human reviewer

<!-- REQUIRED for AI-assisted PRs and all principle edits. GitHub handle of the human who reviewed this submission. -->

**Reviewer:** @

## AI disclosure

<!-- REQUIRED. One sentence: what was AI-written, what was human-written? -->
