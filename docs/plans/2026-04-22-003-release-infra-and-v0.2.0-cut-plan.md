---
title: "feat: release infrastructure + v0.2.0 cut to main"
type: feat
status: shipped
date: 2026-04-22
shipped: 2026-04-23
branch: feat/release-infra
base: dev
parents:
  - docs/plans/2026-04-22-001-feat-requirement-id-frontmatter-plan.md
  - docs/plans/2026-04-22-002-post-frontmatter-roadmap.md
prs:
  - "https://github.com/brettdavies/agentnative/pull/4"
  - "https://github.com/brettdavies/agentnative/pull/5"
  - "https://github.com/brettdavies/agentnative/pull/6"
  - "https://github.com/brettdavies/agentnative/pull/7"
  - "https://github.com/brettdavies/agentnative/pull/8"
  - "https://github.com/brettdavies/agentnative/pull/9"
  - "https://github.com/brettdavies/agentnative/pull/10"
  - "https://github.com/brettdavies/agentnative/pull/11"
tags:
  - v0.1.1
  - v0.2.0
---

# feat: release infrastructure + v0.2.0 cut to main

> **Close-out (2026-04-23).** Shipped across two tagged releases + tooling hardening. Summary vs. the original plan:
>
> - **Release A — infrastructure baseline** landed as [PR #5](https://github.com/brettdavies/agentnative/pull/5)
>   merge commit `3c87857` (bundled PR #1 governance + PR #2 infra + [PR #4](https://github.com/brettdavies/agentnative/pull/4)
>   publish workflow + cliff.toml + RELEASES.md gating). The plan called this "non-tagging", but `publish.yml`
>   legitimately tagged **`v0.1.1`** because main after Release A had `VERSION=0.1.1` and `CHANGELOG.md` had a matching
>   `## v0.1.1` hand-written section — the workflow did exactly what the rule set tells it to do. Accepted as-is;
>   downstream dispatches fired (harmlessly, no handlers yet).
> - **Release B — v0.2.0 spec content** landed as [PR #8](https://github.com/brettdavies/agentnative/pull/8) merge
>   commit `83bf0fd`. Tag `v0.2.0`, GitHub Release, dispatches to `agentnative-cli` and `agentnative-site` all fired
>   successfully.
> - **Mid-execution upstream fixes** that the plan didn't anticipate but closed real gaps:
>   - [PR #6](https://github.com/brettdavies/agentnative/pull/6): `publish.yml` no-ops gracefully when `CHANGELOG.md`
>     lacks a matching `## v$VERSION` section, instead of failing.
>   - [PR #9](https://github.com/brettdavies/agentnative/pull/9): `cliff.toml` and `scripts/generate-changelog.sh`
>     ported from `agentnative-cli` — PR-body-driven changelog generation via the GitHub API, replacing the fragile
>     commit-body preprocessor approach (commit-body headers were getting silently stripped during cherry-picks;
>     root cause still undiagnosed but now irrelevant).
>   - [PR #7](https://github.com/brettdavies/agentnative/pull/7) + [PR #11](https://github.com/brettdavies/agentnative/pull/11):
>     dual-condition publish trigger (`principles/p*-*.md` **or** `VERSION`) plus release-branch pre-push semver check
>     (`scripts/check-release-version.sh` — strict-monotonic bump, tag-not-already-used, VERSION-must-bump when
>     principles changed). Shipped as a follow-up release that lands tag-free by design.
>   - [PR #10](https://github.com/brettdavies/agentnative/pull/10): dev sync of the `publish.yml` awk format alignment
>     and `CHANGELOG.md` exclusion from md-wrap/markdownlint checks that landed on main via PR #8's release branch.
> - **CHANGELOG.md format changed** from legacy `## vX.Y.Z — DATE` to Keep-a-Changelog `## [X.Y.Z] - DATE`, driven by
>   the new `cliff.toml`. The v0.1.1 entry was retroactively restructured (plan's Open Question 1 resolved the
>   opposite way from the original recommendation — converting to new format was necessary for cliff's `--prepend` to
>   work cleanly going forward).
> - **Roadmap 002 updates:** item 1 (publish workflow) marked SHIPPED; items 3 (vault archival) and 5 (companion CLI
>   PR) marked UNBLOCKED by the stable `v0.2.0` SHA.
> - **Learning captured:**
>   [`docs/solutions/best-practices/pr-body-driven-changelog-generation-20260423.md`](../solutions/best-practices/pr-body-driven-changelog-generation-20260423.md).
> - **Upstream follow-up filed:** portable `generate-changelog.sh` template under the `github-repo-setup` skill —
>   tracked at `~/dev/agent-skills/.context/compound-engineering/todos/014-pending-p2-portable-generate-changelog-template.md`.

## Overview

Two sequential releases to `main`, planned together because one blocks the other:

- **Release A — release infrastructure.** Adds `cliff.toml`, `.github/workflows/publish.yml`, and the "Release gating"
  rule in `RELEASES.md`. Bundles everything currently on `dev` that isn't the principles work (PRs #1 and #2) so `main`
  arrives at a coherent pre-spec baseline. Produces **no tag** — principles are not touched.
- **Release B — v0.2.0 spec content.** Cherry-picks PR #3 content onto a fresh release branch from the new `main`,
  regenerates the CHANGELOG locally via `git-cliff`, PRs to main. Publish workflow fires on the `principles/p*-*.md`
  path filter and tags `v0.2.0`.

Ordering lock: Release A must land on `main` before Release B, so the workflow exists when B's diff triggers it.

## Problem Frame

`main` is currently at the scaffold commit. `dev` has four commits ahead:

- `2a4a1db` feat: spec governance structure (#1) — issue templates, PR template, rulesets
- `d1fb947` chore(ops): bootstrap release infra — workflows, rulesets, onboarding (#2)
- `2b01eee` feat: requirement-ID frontmatter contract + governance infra (#3)
- `3ef235c` docs(plans): mark plan 001 shipped and record close-out (direct commit; docs/plans only)

No release has ever reached main. The first release is this plan's Release A (infra-only, no tag). The second release
is Release B (v0.2.0, first tag). After B lands, roadmap items 3 (vault archival) and 5 (companion CLI PR) from
[`2026-04-22-002-post-frontmatter-roadmap.md`](2026-04-22-002-post-frontmatter-roadmap.md) unblock.

## Key Decisions (already locked)

These were decided during the handoff session; do not re-litigate in the new session.

1. **Release gating is path-based**, not VERSION-based. The publish workflow triggers only on changes to
   `principles/p*-*.md`. Other merges to `main` (workflows, docs, tooling, `principles/AGENTS.md`) land without
   producing a tag, GitHub Release, or `repository_dispatch`. Rationale: objective (diff-driven), matches the existing
   `guard-main-docs.yml` pattern, can't accidentally release.

2. **Narrow glob.** The trigger is `principles/p*-*.md`, not `principles/**`. This excludes `principles/AGENTS.md`
   (maintainer authoring conventions, not RFC content). It matches `p1-*.md` through `p7-*.md` and any future `p8+`
   additions.

3. **VERSION-consistency check inside the workflow.** When the path filter fires, the workflow reads `VERSION`, computes
   `v$VERSION`, and errors if that tag already exists. Prevents "principles changed but VERSION unbumped" from silently
   re-tagging a previous version.

4. **CHANGELOG is generated locally, not in CI.** `git-cliff` runs on the release author's machine; the generated entry
   is committed to the release branch as a normal diff. CI reads the file but does not write it. This matches the
   "committed artifact, not generated-at-fetch-time" pattern from `solutions/calver-changelog-as-committed-artifact`.

5. **Tag scheme is pure semver.** `v0.2.0`, `v0.2.1`, etc. No separate spec-vs-repo tag namespace — if you want a
   non-spec change visible on `main`, just merge it without a tag. The history shows it; no tag is needed because
   downstream consumers pin to spec content, which hasn't changed.

6. **First release (A) produces no tag.** That is intended, not a bug. `main` will have content but zero tags until
   Release B lands.

## Scope Boundaries

**In scope:**

- `cliff.toml` committed to repo (root).
- `.github/workflows/publish.yml` — path-filtered release workflow.
- `RELEASES.md` — new "Release gating" section codifying decisions 1-3.
- `CONTRIBUTING.md` — one-line pointer to the new `RELEASES.md` section.
- Release A cut to main (non-tagging).
- Release B cut to main (tagging `v0.2.0`).

**Out of scope (per roadmap 002):**

- Badge surface (on hold).
- Vault archival (trigger hits after Release B lands).
- Site `sync-spec.sh` (separate repo, after first tag).
- Companion `agentnative-cli` PR (separate repo, after first tag).

**Deferred:**

- Retroactive restructuring of v0.1.1 CHANGELOG entry — see Open Questions.

## Context & Research

### Load-bearing references

- `RELEASES.md` (current text) — documents the `dev → release/* → main` cherry-pick flow, guard workflows, and
  status-check context pitfall. Release procedure below extends it with the new gating rule.
- `CONTRIBUTING.md` "Versioning policy" — already amended in PR #3 to name frontmatter-shape changes as MINOR.
-

[`docs/plans/2026-04-22-001-feat-requirement-id-frontmatter-plan.md`](2026-04-22-001-feat-requirement-id-frontmatter-plan.md)
— the shipped spec content. Its Close-out block and amendments are current.

- [`docs/plans/2026-04-22-002-post-frontmatter-roadmap.md`](2026-04-22-002-post-frontmatter-roadmap.md) — deferred
  items; item 1 (publish workflow) is what this plan delivers.
- `~/.claude/projects/-home-brett-dev-agentnative-spec/memory/sot_contract.md` — hybrid propagation decision (tag
  authoritative, `repository_dispatch` advisory).
- `docs/solutions/calver-changelog-as-committed-artifact.md` — CHANGELOG-as-committed-artifact pattern (accessible via
  the `~/dev/solutions-docs` symlink; may require `qmd query "changelog committed artifact" --collection solutions` to
  confirm current location).

### Cherry-pick procedure reference

Per `RELEASES.md`:

```bash
git fetch origin
git checkout -b release/<slug> origin/main
git log --oneline dev --not origin/main    # list candidates
git cherry-pick <sha1> <sha2> ...
git diff origin/main --stat               # verify no guarded paths leaked
```

**The twist this plan introduces:** `docs/plans/` files are bundled INSIDE the squash commits (not as separate
commits), so plain cherry-pick brings them along. After the cherry-pick, strip them:

```bash
git rm -r --cached docs/plans/
rm -rf docs/plans/
git commit --amend --no-edit   # or a new cleanup commit, depending on which squash was last picked
```

Verify with `git diff origin/main --stat | grep docs/plans` — expect empty output.

## Implementation Units

### Release A — release infrastructure

**A1. `cliff.toml` at repo root.**

- Emits Keep-a-Changelog categories (`### Added`, `### Changed`, `### Fixed`, `### Removed`, `### Security`) matching
  the repo's PR template `## Changelog` section.
- Reads commit bodies on the release branch; filters `## Changelog` subsections out of each body; groups across all
  commits in the range.
- Tag prefix: `v` (so `v0.2.0`, `v0.2.1`).
- Unreleased section header: `## Unreleased` until tagged, then rewritten as `## v<version> — YYYY-MM-DD` by the author
  before committing.
- Reference config: the standard `cliff.toml` from `git-cliff` docs, tuned to parse `## Changelog` blocks from commit
  bodies rather than commit messages alone (since the repo uses squash merges and PR bodies carry the categorized
  bullets).

**A2. `.github/workflows/publish.yml`.**

Shape:

```yaml
name: Publish release
on:
  push:
    branches: [main]
    paths:
      - 'principles/p*-*.md'
permissions:
  contents: write     # tag + release
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<pinned-SHA>
        with:
          fetch-depth: 0
      - name: Read VERSION
        id: version
        run: echo "version=$(cat VERSION)" >> "$GITHUB_OUTPUT"
      - name: Fail if tag exists
        run: |
          tag="v${{ steps.version.outputs.version }}"
          if git rev-parse "$tag" >/dev/null 2>&1; then
            echo "Tag $tag already exists. VERSION must be bumped when principles change." >&2
            exit 1
          fi
      - name: Extract CHANGELOG entry for this version
        id: notes
        # Read the v$VERSION section from CHANGELOG.md for release notes
      - name: Create tag
      - name: Create GitHub Release
        # softprops/action-gh-release@<pinned-SHA>
      - name: Fire repository_dispatch to downstream
        # agentnative-cli and agentnative-site receive advisory dispatch
```

Pin all action SHAs per the global rule. Use the pinned-actions table at
`~/.claude/skills/github-repo-setup/scripts/pin-actions.sh` for canonical SHAs.

**A3. `RELEASES.md` — "Release gating" section + status-check-context amendment.**

Add a new top-level section (placement: after "PRs and changelog generation", before "Branch protection"):

```markdown
## Release gating

A release tag is cut only when `principles/p*-*.md` changes on a merge to `main`. Non-principles merges (workflow
fixes, README polish, tooling improvements, `principles/AGENTS.md` edits, decision records) land on `main` without
producing a tag, a GitHub Release, or a downstream `repository_dispatch`.

**Path-based, not VERSION-based.** The publish workflow triggers on `paths: principles/p*-*.md`. The trigger is a
diff property, not an author-discipline check.

**VERSION-consistency check.** When the path filter fires, `publish.yml` reads `VERSION`, computes `v$VERSION`, and
fails the workflow if that tag already exists. This forces the author to bump `VERSION` when spec content changes —
the workflow refuses to re-tag an existing version.

**CHANGELOG is generated locally.** The release author runs `git-cliff` on the release branch to produce the
`v$VERSION` entry, commits the updated `CHANGELOG.md` as part of the release PR, and `publish.yml` extracts that
entry for the GitHub Release notes. CI reads CHANGELOG; it does not generate it.

**First release without a tag.** The first substantive merge to `main` from `dev` (the release-infra release) does
not touch `principles/`, so the workflow does not fire and no tag is produced. `main` will have content but zero
tags until the first spec-content release lands.
```

Also add a one-line reference under `CONTRIBUTING.md`'s "Versioning policy":

```markdown
See `RELEASES.md` § Release gating for when a VERSION bump produces a tagged release vs. when changes land on `main`
without a tag.
```

**A4. PR `feat/release-infra` to `dev`.**

Normal flow. Squash-merge. Title: `feat: release infrastructure (publish workflow, changelog generation, gating rule)`.

**A5. Cut `release/2026-04-22-infra` from `origin/main`.**

```bash
git checkout -b release/2026-04-22-infra origin/main
git cherry-pick 2a4a1db d1fb947 <feat/release-infra squash SHA on dev>
# Strip docs/plans leakage from any squash that bundled them
git rm -r --cached docs/plans/ 2>/dev/null || true
rm -rf docs/plans/
# Verify
git diff origin/main --stat | grep -E 'docs/(plans|brainstorms|solutions)/' && echo "LEAK — fix before push" || echo "clean"
# Commit cleanup if needed, then push
git commit -am "chore: strip engineering docs from release branch" || true
git push -u origin release/2026-04-22-infra
gh pr create --base main --head release/2026-04-22-infra --title "release: infrastructure baseline" --body ...
```

PR body: explain this is a non-spec release (no tag produced), references this plan. After merge, verify no tag was cut
(expected) and no workflow self-triggered (expected — `.github/workflows/*` is not `principles/p*-*.md`).

### Release B — v0.2.0 spec content

**B1. Cut `release/v0.2.0-frontmatter-contract` from `origin/main`.**

At this point `main` has the infra release. Now cherry-pick PR #3's squash commit:

```bash
git fetch origin
git checkout -b release/v0.2.0-frontmatter-contract origin/main
git cherry-pick 2b01eee
git rm -r --cached docs/plans/
rm -rf docs/plans/
git diff origin/main --stat | grep 'docs/plans/' && echo "LEAK" || echo "clean"
```

**B2. Regenerate `CHANGELOG.md` via `git-cliff`.**

```bash
git-cliff --config cliff.toml --tag v0.2.0 --unreleased > /tmp/cliff-output.md
# Review the output; hand-edit any rough edges; merge into CHANGELOG.md preserving the v0.1.1 entry below it
git add CHANGELOG.md
git commit -m "docs(changelog): v0.2.0 entry"
```

The v0.2.0 entry should contain the Added/Changed/Fixed/Removed/Security categories extracted from PR #3's body's `##
Changelog` section. Review for voice and spec-consumer framing before committing.

**B3. PR `release/v0.2.0-frontmatter-contract` to `main`.**

```bash
git push -u origin release/v0.2.0-frontmatter-contract
gh pr create --base main --head release/v0.2.0-frontmatter-contract --title "release: v0.2.0 — requirement-ID frontmatter contract" --body ...
```

PR body: reference this plan, the shipped 001 plan, and the roadmap. Note that this is the first tagged release.
Linked-check-review field: still "no companion PR yet; tracked in roadmap item 5" — the CLI PR now unblocks because
`main` has a stable SHA.

**B4. After merge: watch the publish workflow.**

Expected outcome:

- Workflow fires on `principles/p*-*.md` changes (all seven files touched).
- Reads VERSION → `0.2.0`.
- `v0.2.0` tag does not yet exist → check passes.
- Tags `v0.2.0` at the merge SHA.
- Creates GitHub Release `v0.2.0` with CHANGELOG entry as body.
- Fires `repository_dispatch` to `agentnative-cli` and `agentnative-site` (payload: version, tag SHA, timestamp).

Verify with `gh run list --branch main --workflow publish.yml` and `gh release view v0.2.0`.

## Test Scenarios / Verification

### Release A

- `main` receives 20-30 files from PRs #1 + #2 + infra PR, depending on what was bundled.
- `docs/plans/` is empty in the release branch diff.
- No tag is produced.
- `publish.yml` does not self-trigger when merged (it's a workflow file, not `principles/p*-*.md`).
- `guard-main-docs` passes.
- `guard-main-provenance` passes (all commits carry PR numbers from dev).
- `guard-release-branch` passes (head is `release/*`).

### Release B

- `main` receives principle files, decision records, validator, dual-license, etc. from PR #3.
- `docs/plans/` is empty in the release branch diff.
- `CHANGELOG.md` has a new `v0.2.0 — 2026-04-22` entry.
- Publish workflow fires on merge, tags `v0.2.0`, creates GitHub Release, fires dispatch.
- `gh release view v0.2.0` shows the CHANGELOG entry as release body.

### Deliberate-failure check (before merge)

- Locally verify the workflow's VERSION-tag-exists check by simulating: create a fake tag `v0.2.0` locally (do NOT
  push), try the workflow locally with `act` or by reading the script logic. The check should refuse.
- Remove the local fake tag before proceeding.

## Risks & Dependencies

| Risk                                                                      | Mitigation                                                                                                                                                                         |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cherry-pick brings `docs/plans/` files through the guard                  | Documented strip procedure in Implementation Units; `guard-main-docs` would block the PR as a backstop.                                                                            |
| `git-cliff` output voice drifts from the v0.1.1 hand-written entry        | Open Question below; one option is to hand-edit post-generation; another is to accept Keep-a-Changelog categories going forward.                                                   |
| Workflow self-triggers when merged                                        | Mitigated by the narrow path filter: `principles/p*-*.md` excludes `.github/workflows/publish.yml`. Verify by reading the filter rule.                                             |
| First release dispatches to downstream consumers that can't handle it yet | Dispatch is advisory, not blocking. The CLI and site don't have dispatch handlers wired up yet; payloads arrive and are ignored. Consumers opt in when roadmap items 4 and 5 land. |
| VERSION tag exists already from a manual tag experiment                   | Release B's VERSION-consistency check would fail loudly. Remediate by deleting the stray tag (`git push --delete origin vX.Y.Z`) and re-running.                                   |

## Documentation / Operational Notes

- **Release A does NOT bump VERSION.** It stays at the value from dev (`0.2.0` currently, because PR #3 already bumped
  it on dev). Main's VERSION before Release A is `0.1.1`; after Release A it's `0.2.0`. That's fine — VERSION bumped
  along with the infra release, but no principles content exists on main yet, so the tag from the VERSION- aware
  workflow doesn't fire.
- **The `v0.2.0` tag in Release B points to main's merge commit for Release B**, not to any dev SHA. Downstream
  vendoring should use the tag SHA (or `v0.2.0` ref) — not `2b01eee` directly.
- **After Release B**, immediately file a follow-up issue or small PR to note in
  `docs/plans/2026-04-22-002-…-roadmap.md` that item 3 (vault archival) and item 5 (companion CLI PR) are now unblocked.
  Minor housekeeping.

## Pick-up Notes for a Fresh Session

1. **Read this plan in full**, then [`2026-04-22-001-…-plan.md`](2026-04-22-001-feat-requirement-id-frontmatter-plan.md)
   (shipped) and [`2026-04-22-002-…-roadmap.md`](2026-04-22-002-post-frontmatter-roadmap.md) (active).
2. **Confirm state:**

- `git branch --show-current` → `dev`
- `git log --oneline origin/main..origin/dev` → should show `3ef235c`, `2b01eee`, `d1fb947`, `2a4a1db` (or further
  commits if session intervened)
- `cat VERSION` on dev → `0.2.0`
- `git status` on dev → clean

1. **Start Release A.** Create `feat/release-infra` from dev. Execute A1-A5 in order. Each step is independently
   verifiable.
2. **Watch for the guard workflows** after opening the Release A PR to main. They run on PR-to-main only, not PR-to-dev,
   so the first time you'll see them is at A5 PR open.
3. **Proceed to Release B only after A merges** and `main` has the publish workflow. B depends on A for the workflow to
   exist.
4. **On Release B merge, watch the publish workflow run** via `gh run watch` — that's the validation that the whole
   gating rule works end-to-end.

## Open Questions

1. **Should v0.1.1's hand-written CHANGELOG entry be retroactively restructured to match Keep-a-Changelog categories?**
   Pro: internal consistency from v0.2.0 forward. Con: rewriting a shipped entry is low-value history churn.
   Recommendation: leave v0.1.1 as-is (historical), use generated categories for v0.2.0+. Decide at session start;
   single-line call.

2. **Which `softprops/action-gh-release` release-notes shape?** Two options:

- (a) Body = CHANGELOG's `v$VERSION` section extracted verbatim.
- (b) Body = a short summary + link to the CHANGELOG file on main.
- (a) is self-contained; (b) is leaner. Recommendation: (a) — the CHANGELOG entry IS the release note; duplicating to a
  link adds no value. Decide during A2.

1. **Dispatch payload shape.** What fields does `repository_dispatch` need to carry for downstream consumers? Minimum:
   `event_type`, `client_payload.version`, `client_payload.tag`, `client_payload.sha`. Lock the shape when writing A2;
   downstream consumers (roadmap items 4 and 5) will consume it.

2. **Should `publish.yml` also fire on a manual `workflow_dispatch` for re-runs?** Useful if a tag needs to be recreated
   without a content change. Recommendation: yes, add `workflow_dispatch:` with a `version` input, gated by a
   manual-only branch that the path filter wouldn't catch. Low-priority addition.

## Sources & References

- **Shipped handoff plan:**
  [`docs/plans/2026-04-22-001-feat-requirement-id-frontmatter-plan.md`](2026-04-22-001-feat-requirement-id-frontmatter-plan.md)
- **Active roadmap:**
  [`docs/plans/2026-04-22-002-post-frontmatter-roadmap.md`](2026-04-22-002-post-frontmatter-roadmap.md)
- **Repo governance:** [`RELEASES.md`](../../RELEASES.md), [`CONTRIBUTING.md`](../../CONTRIBUTING.md),
  [`AGENTS.md`](../../AGENTS.md)
- **SoT contract memory:** `~/.claude/projects/-home-brett-dev-agentnative-spec/memory/sot_contract.md`
- **Pinned GitHub Actions table:** `~/.claude/skills/github-repo-setup/scripts/pin-actions.sh`
- **PR #3 (shipped):** <https://github.com/brettdavies/agentnative/pull/3>
