---
title: "feat: Show HN launch readiness — spec"
type: feat
status: active
date: 2026-04-28
parent: ~/.gstack/projects/brettdavies-agentnative/brett-dev-design-show-hn-launch-inversion-20260427-144756.md
---

# feat: Show HN launch readiness — spec

> **Parent:** `~/.gstack/projects/brettdavies-agentnative/brett-dev-design-show-hn-launch-inversion-20260427-144756.md`
> — central launch tracker. This plan inherits gate definitions, scope, and approach (Inversion) from the parent.
> Updates to gate scope or status land on the parent first; this plan tracks spec-side execution detail.

## Overview

Spec-side coordination plan for the Show HN launch this week (target post window: Tue–Thu morning PT, 2026-04-28 →
2026-05-02). This repo owns parent-tracker gates **G1, G2, G3, G4, G5 (partial), G9, G11**. None of the gates require
new principle text, new spec language, or new governance — every spec-owned gate is either polish (G2, G3),
reconciliation (G4, G5), an existing in-flight plan (G5), a sanity check (G9), or a red-team review pass (G11). The plan
does not subsume the existing in-flight plan
[`2026-04-27-001-refactor-three-repo-naming-alignment-plan.md`](2026-04-27-001-refactor-three-repo-naming-alignment-plan.md);
it coordinates with it. Implementation of this plan is the deliverable for launch week, not for this session — this
session's deliverable is the plan file itself.

---

## Problem Frame

The central tracker locks the launch approach as **Inversion** — write the Show HN post first, let it discover
dependencies. Each repo files one launch-readiness plan that catalogs exactly what it owes the launch, distinguishes
already-done work (`on-dev-pending`) from real to-do (`not-started`) so future sessions don't re-plan completed work,
and surfaces only the open questions that affect this repo. This plan is that catalog for the spec repo.

The spec repo's launch-day visibility is ~10% click-through (academic backing surface, not the primary target). Gate 6
in the parent tracker is owned by the private vault, not this repo. Gate 7 (CLI release) is CLI-owned. Gates 8 and 12
are site-owned. Gate 10 (the post itself) is not repo-owned. This plan addresses only the seven gates this repo owns and
leaves cross-repo coordination to the parent tracker.

---

## Requirements Trace

Each requirement maps to a parent-tracker gate; the parent's "Notes" become acceptance criteria.

- R1. Gate 1 — `CHANGELOG.md` v0.2.0 entry visible to a Show HN visitor on the GitHub default branch.
- R2. Gate 2 — All seven principles flipped from `status: draft` to `status: active`, with a README "active stance"
  paragraph explaining the posture.
- R3. Gate 3 — README hook (1–2 sentences) above the principles table, optimized for the HN scroll-reader.
- R4. Gate 4 — Plan checkboxes across `docs/plans/*.md` reflect actual shipped state. No stale `[ ]` for work that has
  already merged.
- R5. Gate 5 — Naming-alignment plan units U2, U3, U4, U5, U8, U9 complete (U6 dotfiles + U7 memory deferred post-launch
  per parent tracker).
- R9. Gate 9 — All cross-repo issue-template links in `CONTRIBUTING.md`, `README.md`, and `.github/ISSUE_TEMPLATE/`
  resolve (no 404s) on launch day.
- R11. Gate 11 — Adversarial review of the seven principle texts complete; "but X exists" objections caught in private
  before the HN thread runs.

---

## Scope Boundaries

- **Not in scope (deferred per parent tracker):** Gate 6 (vault archival — owned by private vault, ships post-launch
  pending the inbound-link audit in parent Q2); naming-alignment U6 (dotfiles) and U7 (spec-memory codification) —
  invisible to Show HN readers.
- **Not in scope (other repos):** Gates 7 (CLI), 8 (site leaderboard), 12 (cold-device + HTTPS). Tracked in the CLI and
  site companion plans.
- **Not in scope (no repo):** Gate 10 (Show HN post) lives at
  `~/.gstack/projects/brettdavies-agentnative/show-hn-post-draft.md` per the parent tracker.
- **Not in scope:** Launch-adjacent stretch track (skill distribution). Authoritative plan is in the site repo at
  `docs/plans/2026-04-24-001-feat-skill-distribution-endpoint-plan.md`. This plan does not coordinate with it; the
  parent tracker does.
- **Explicitly rejected:** New principle text, new MUSTs, or any spec-content edits. The launch ships v0.2.0 as-is. G2
  changes the `status` field only; G3 is README copy. Both pre-pressure-test edits are out of scope and would break the
  intended launch posture ("active with pressure-tests welcome").

### Deferred to Follow-Up Work

- **Naming-alignment U6 + U7:** owned by the existing in-flight plan; deferred post-launch per parent.
- **Vault archival (Gate 6):** owned by `2026-04-23-002-feat-vault-archival-plan.md` in this repo, gated on parent Q2.

---

## Context & Cross-References

### In-flight plans this plan coordinates with (not subsumed)

-

[`2026-04-27-001-refactor-three-repo-naming-alignment-plan.md`](2026-04-27-001-refactor-three-repo-naming-alignment-plan.md)
— `status: active`. U1 shipped (commit `07d89a4`). U2–U9 still open. **G5 below references this plan's units rather than
restating them.**

- [`2026-04-23-001-feat-badge-surface-plan.md`](2026-04-23-001-feat-badge-surface-plan.md) — `status: on-hold`. Not
  launch-blocking; revisit triggers are post-launch (leaderboard maturity + CLI-author demand).
- [`2026-04-23-002-feat-vault-archival-plan.md`](2026-04-23-002-feat-vault-archival-plan.md) — `status: active`. Gate 6
  in the parent tracker. Outside this plan's spec-owned scope; will be advanced or deferred separately based on parent
  Q2.
- [`2026-04-22-002-post-frontmatter-roadmap.md`](2026-04-22-002-post-frontmatter-roadmap.md) — `status: closed`. All
  five items already graduated to per-item plans; no further coordination required.

### Cross-repo companion plans (filed by their respective sessions)

- CLI: `agentnative-cli/docs/plans/2026-04-28-001-feat-show-hn-launch-readiness-plan.md` (G7).
- Site: `agentnative-site/docs/plans/2026-04-28-001-feat-show-hn-launch-readiness-plan.md` (G8, G11 site-side, G12).

### Relevant code and patterns

- `principles/p1-non-interactive-by-default.md` … `p7-bounded-high-signal-responses.md` — seven principle files. All
  currently `status: draft`. Bulk-edit target for U2.
- `principles/AGENTS.md` — defines the `status` field semantics (`draft | under-review | locked`). The parent tracker
  prescribes flipping to `active`, which is **not currently a documented status value** in `principles/AGENTS.md`. See
  Open Question Q1-spec below.
- `README.md` — root README. Hook insertion target for U3; "active stance" paragraph target for U2.
- `CONTRIBUTING.md` § "Where to file" — three in-repo issue-template links + four cross-repo issue-template links. G9
  verification target.
- `.github/ISSUE_TEMPLATE/{config,grade-a-cli,pressure-test,spec-question}.yml` — three local templates + one config
  with two cross-repo contact-link redirects.
- `CHANGELOG.md` — v0.2.0 entry on `main` (commit `83bf0fd`, tag `v0.2.0`); on `dev` the file is intentionally the
  shorter pre-v0.2.0 format. See G1 below for the implication.

### Institutional learnings

- `docs/solutions/calver-changelog-as-committed-artifact` — CHANGELOG.md is the source of truth for spec evolution.
  Relevant to G1's "is the dev/main divergence a real problem?" question.
- `docs/solutions/norm-vs-mechanism-blind-spot` — informs why a red-team pass is a documented norm before launch rather
  than something a CI workflow could cover.

---

## Implementation Units

> **Status legend:** `on-dev-pending` (work done, awaiting cherry-pick to `release/launch`) · `not-started` ·
> `partial` (some sub-units done; remainder listed inline) · `done` · `blocked`. Unchecked `- [ ]` means the unit's
> own work is not closed for launch; checking happens when the gate's acceptance criteria are met, regardless of
> on-dev-pending vs not-started underneath.

---

- [ ] U1. **G1 — CHANGELOG.md v0.2.0 entry visible to launch-day visitors**

**Goal:** A visitor landing on `github.com/brettdavies/agentnative/blob/main/CHANGELOG.md` (or via README link) sees the
v0.2.0 entry on launch day.

**Status:** `done` for visitor visibility — verify-and-confirm only.

**Why:** Tag `v0.2.0` is on `main` at commit `83bf0fd`. `git show origin/main:CHANGELOG.md` confirms the entry exists in
the new categorized format with full PR-linked release notes. GitHub's default branch is `main`, so the launch-visible
CHANGELOG is correct as-shipped. The handoff's status `on-dev-pending` reflects an earlier reading; the actual shipped
state is `done` for HN-visibility purposes.

**Sub-finding (non-blocking for launch):** `dev`'s `CHANGELOG.md` is the pre-v0.2.0 short format — the post-release
back-merge of v0.2.0 content from `main` to `dev` did not happen, or got reverted. Future PRs that touch the CHANGELOG
on `dev` will collide with `main`'s newer state at the next release cut. This is a release-pipeline hygiene issue, not a
launch-day-visibility issue. Tracked separately; do not include in the launch release PR unless the back-merge is also
done by then.

**Files (for verify):**

- Read-only: `CHANGELOG.md` on `main` and `dev`

**Verification:**

- `git show origin/main:CHANGELOG.md | head -25` shows the `## [0.2.0] - 2026-04-23` heading and `### Added`, `###
  Changed` sub-sections with PR links.
- The `Full Changelog` compare link `v0.1.1...v0.2.0` resolves on github.com.
- Decide whether to surface the dev/main back-merge gap in the night-before release PR (likely defer post-launch — this
  is sub-finding hygiene, not a launch gate).

---

- [ ] U2. **G2 — Flip 7 principles to `status: active` + README "active stance" paragraph**

**Goal:** Every principle file's frontmatter `status:` field is `active`; README has a 1-paragraph block explaining the
active-with-pressure-tests-welcome posture.

**Status:** `not-started`. ~30 min execution; ~5 min review.

**Files:**

- Modify: `principles/p1-non-interactive-by-default.md` (frontmatter `status` field)
- Modify: `principles/p2-structured-parseable-output.md`
- Modify: `principles/p3-progressive-help-discovery.md`
- Modify: `principles/p4-fail-fast-actionable-errors.md`
- Modify: `principles/p5-safe-retries-mutation-boundaries.md`
- Modify: `principles/p6-composable-predictable-command-structure.md`
- Modify: `principles/p7-bounded-high-signal-responses.md`
- Modify: `principles/AGENTS.md` — extend the documented `status` enumeration to include `active` (currently lists only
  `draft | under-review | locked`). The parent tracker introduces `active` as a new value; the per-file shape doc must
  reflect this or downstream consumers (the validator at `.github/workflows/validate-principles.yml`, the site renderer)
  will treat it as invalid.
- Modify: `README.md` — insert "active stance" paragraph (location: just above the Principles table, or just below the
  spec link — pick the smoother flow).

**Approach:**

- Single commit: bulk-edit the seven files + AGENTS.md status enumeration + README paragraph.
- Do NOT bump `last-revised:` on any principle file. The status flip is not a MUST/SHOULD/MAY tier change. Per
  `principles/AGENTS.md` (`last-revised` updates only on tier changes), `last-revised` stays.
- VERSION bump policy: see Open Question Q1-spec below. Decide at commit time.
- README paragraph guidance: 2–4 sentences. Substance: "These principles are `active`, not `draft` — they reflect
  current best-thinking about agent-native CLIs. Pressure-tests are welcome and tracked via the pressure-test issue
  template; status will move to `under-review` if a principle attracts substantive critique, and back to `active` once
  the critique is resolved." (Exact wording to be drafted at commit time.)

**Patterns to follow:**

- `principles/AGENTS.md` § "Per-file structure" — the existing `status` field documentation shape.
- `2026-04-22-001-feat-requirement-id-frontmatter-plan.md` U-style — plain frontmatter edits, no logic change.

**Verification:**

- `for f in principles/p*.md; do grep "^status:" $f; done` shows `status: active` on all seven.
- `principles/AGENTS.md` lists `active` in the enumerated `status` values with a one-line description.
- `.github/workflows/validate-principles.yml` passes locally (run via pre-push hook on commit).
- `README.md` renders with the paragraph in place; mobile-rendering preview not required at this depth.

**Test scenarios:**

- Happy path: `validate-principles.yml` passes after the bulk frontmatter edit. The validator must accept `active` as a
  valid status.
- Edge case: the validator currently allows `draft | under-review | locked`. If it has a hard-coded enum check, the
  validator script itself needs updating in this same commit. Check `.github/workflows/validate-principles.yml` for any
  value enumeration before flipping.
- Edge case: the `anc` CLI vendors `principles/*.md` and parses frontmatter. Does it tolerate an unknown `status` value?
  If yes, the change is downstream-safe. If no, the CLI vendor of the spec needs to land first or the launch becomes a
  coupled-release-protocol exercise. (Likely safe — `status` is metadata, not a requirement-tier signal — but verify
  before commit. See `agentnative-cli` `src/principles/registry.rs` or the spec-vendor parser if present.)

---

- [ ] U3. **G3 — README hook above principles table**

**Goal:** A 1–2-sentence hook above the Principles table that gives an HN scroll-reader the "why" before they decide
whether to keep reading.

**Status:** `not-started`. ~15 min copy block.

**Files:**

- Modify: `README.md` (insert hook above the `## Principles` table; or fold into U2's edit if both ship in one commit)

**Approach:**

- Tone: RFC-stance, per `AGENTS.md` § "Voice" — "speaks as a standard, not a person." Show the failure mode then show
  the fix; concrete over abstract.
- Likely shape: "AI agents operate CLIs differently than humans do. They don't tolerate interactive prompts, parse
  unstructured output, or recover gracefully from vague errors. These seven principles define what 'agent-native' means,
  in RFC 2119 language."
- Final wording is a copy-block decision, not an architecture decision. Workshop at commit time.

**Patterns to follow:**

- `AGENTS.md` § "Voice" examples (good/bad pairs).

**Verification:**

- README renders; the hook sits above the principles table and reads cold to a Show HN visitor.
- No formatting regression in the table or surrounding sections.

---

- [x] U4. **G4 — Sweep plan checkboxes for accurate state**

**Goal:** Every plan in `docs/plans/` shows checkboxes (`- [ ]` / `- [x]`) and `status:` frontmatter that match actual
shipped state. No `[ ]` next to a unit that already merged.

**Status:** `done` (2026-04-27). The audit triggered by this gate discovered the naming-alignment plan
(`2026-04-27-001`) was severely stale — all 9 boxes `[ ]` while every unit had actually shipped across four working
trees. Closed out in the same audit pass.

**Per-plan audit results:**

- `2026-04-22-001-feat-requirement-id-frontmatter-plan.md` — `status: shipped` ✅. Close-out narrative covers U1–U9
  outcomes; merge `2b01eee` (PR #3) verified.
- `2026-04-22-002-post-frontmatter-roadmap.md` — `status: closed` ✅. All 5 items graduated to per-item plans (verified
  items 4 + 5 exist in cross-repo working trees).
- `2026-04-22-003-release-infra-and-v0.2.0-cut-plan.md` — `status: shipped` ✅. Tags `v0.1.1` (`3c87857`) and `v0.2.0`
  (`83bf0fd`) exist; PRs #4–#11 chain matches close-out narrative.
- `2026-04-23-001-feat-badge-surface-plan.md` — `status: on-hold` ✅. U1+U2 correctly `[ ]`; revisit triggers
  (leaderboard maturity + CLI-author demand) genuinely unmet.
- `2026-04-23-002-feat-vault-archival-plan.md` — `status: active` ✅. Vault `principles/` and `research/` folders
  unchanged; U1+U2 correctly `[ ]`.
- `2026-04-27-001-refactor-three-repo-naming-alignment-plan.md` — **was `active` with all 9 boxes `[ ]`; flipped to
  `status: shipped` with all 9 boxes `[x]` and a full close-out block** citing spec `07d89a4`, site `6d76ae9`,
  solutions-docs `cb1386d`, dotfiles `17c43d7`, plus four non-commit units (filesystem rename, in-place CLI edit, memory
  updates, `gh repo rename` ops).

**Verification:**

- `rg '^- \[ \] U' docs/plans/` returns only units that are genuinely not-yet-shipped (U1+U2 of vault-archival, U1+U2 of
  badge-surface, U1–U7 of this launch-readiness plan).
- All `status:` frontmatter values match the actual close-out / on-hold / active state.

**Lesson captured:** the audit surfaced a meta-pattern — when a refactor lands across N working trees in N separate
commits, the orchestrating plan's checkboxes drift unless they're flipped in the same session. Recorded in the
naming-alignment plan's close-out block ("Lesson for future cross-repo refactors").

---

- [x] U5. **G5 — Naming-alignment (delegated, fully shipped)**

**Goal:** All naming-alignment units in
[`2026-04-27-001-refactor-three-repo-naming-alignment-plan.md`](2026-04-27-001-refactor-three-repo-naming-alignment-plan.md)
landed before the post goes up.

**Status:** `done` (2026-04-27). All 9 units shipped — including U6 (dotfiles) and U7 (memory) which the parent tracker
had marked as deferred post-launch. Discovered during the U4 audit: the orchestrating plan was stale, but the underlying
work had landed across four working trees on the same day.

**Shipped via:**

- U1 — spec `07d89a4` ("docs: correct GitHub repo name in cross-repo citations + codify naming convention")
- U2 — filesystem rename + slug-cache hygiene (no commit)
- U3 — CLI repo in-place drift fix (no commit; host file later committed under spec-vendor work)
- U4 — site `6d76ae9` ("docs(plans): correct upstream spec repo name in sync-spec plan")
- U5 — solutions-docs `cb1386d` ("docs: correct upstream spec name + update local CLI path refs after rename")
- U6 — dotfiles `17c43d7` ("feat(tmuxinator): rename agentnative session to agentnative-cli matching renamed dir")
- U7 — local memory updates (no commit)
- U8 — `gh repo rename` round-trip → `brettdavies/agentnative-spec` redirects to `brettdavies/agentnative`
- U9 — verification battery passes per audit-time spot-checks

**Verification:**

- Naming-alignment plan shows `status: shipped` with all 9 boxes `[x]` and a full close-out block.
- `rg 'brettdavies/agentnative-spec' docs/ principles/ CONTRIBUTING.md README.md` returns matches only in
  `docs/plans/2026-04-27-001-*` and `docs/plans/2026-04-28-001-*` (this file) — both intentionally documenting the
  rewrite history.
- `gh api repos/brettdavies/agentnative-spec --jq '.html_url'` resolves to `https://github.com/brettdavies/agentnative`
  (redirect alive).

**Implication for parent tracker:** Gate 5 in the central launch tracker flips from `partial` to `done`. Surface this in
the next gate-status update commit on the parent tracker.

---

- [ ] U6. **G9 — Issue routing sanity check (all 7 templates resolve)**

**Goal:** Every issue-template link in `CONTRIBUTING.md`, `README.md`, `.github/ISSUE_TEMPLATE/config.yml`, and the PR
template resolves to a working "new issue" page on the correct repo.

**Status:** `not-started`. ~10 min.

**Files (verify-only; modify only if a link is broken):**

- `CONTRIBUTING.md` § "Where to file" — three in-repo links + four cross-repo links.
- `README.md` — cross-repo CLI link in the hook section.
- `.github/ISSUE_TEMPLATE/config.yml` — two cross-repo `contact_links`.
- `.github/ISSUE_TEMPLATE/{grade-a-cli,pressure-test,spec-question}.yml` — exist locally; verify GitHub renders them.

**Approach:**

- Open every link in incognito (no auth) and verify the destination renders the expected template.
- Cross-repo links to be checked:
- `agentnative-cli`: `false-positive.yml`, `feature-request.yml`, `scoring-bug.yml`, `issues/new/choose`.
- `agentnative-site`: `site-bug.yml`, `issues/new/choose`.
- If any cross-repo template doesn't exist yet (CLI or site never created it), file an issue on the target repo or
  remove the broken link from this repo. Coordinate via parent tracker.
- This unit is the cheapest one in the launch and catches embarrassing 404s — do it Tuesday morning.

**Verification:**

- All 7+ links open the expected new-issue form in incognito.
- No 404 anywhere.
- Document the test in the commit body if any link was fixed.

**Test scenarios:**

- Happy path: every link renders the expected template form, with required AI-disclosure field present.
- Edge case: `agentnative-cli` may not have `false-positive.yml`, `feature-request.yml`, `scoring-bug.yml` yet — they
  are referenced by `CONTRIBUTING.md` but not necessarily filed in the CLI repo. Verify; coordinate cross-repo if
  missing.
- Error path: a link 404s. Decision: fix the link in this repo, or escalate to the target repo to add the missing
  template.

---

- [ ] U7. **G11 — Red-team pass on principle text (spec-side)**

**Goal:** Adversarial review of the seven principle texts complete. "But X exists" objections caught, internal
inconsistencies caught, before the HN thread runs.

**Status:** `not-started`. Schedule Wednesday per parent tracker.

**Files (read; modify only on findings):**

- `principles/p1-non-interactive-by-default.md` … `p7-bounded-high-signal-responses.md` — full prose pass.
- `principles/AGENTS.md` — pressure-test protocol (the doc the red-team pass operates inside of).
- `docs/decisions/p1-behavioral-must.md` and `docs/decisions/naming-rationale.md` — adjacent decision records that may
  be cited in HN comments.

**Approach:**

- Run `compound-engineering:ce-doc-review` against each principle file.
- Targets the red-team pass should look for:
- **Internal inconsistency** — e.g., a MUST in P5 that contradicts a MAY in P3.
- **"But X exists" prior-art** — does the spec name-drop or implicitly contradict an existing standard
  (POSIX-utility-conventions, GNU coding standards, JSON Schema, CLI11 conventions, RFC 9457, etc.) that an HN commenter
  would raise?
- **MUST that's actually a SHOULD** — a requirement that breaks for a legitimate edge case the prose doesn't
  acknowledge.
- **Vague "agent-native"** — does the language ever fall back to "good for agents" without specifying *why*?
- For each finding: edit the principle (rare, given the launch posture) OR document with a `[wontfix]` / `[later]` tag
  in a `## Pressure test notes` section per `principles/AGENTS.md` § "Pressure-test protocol".
- Site copy red-team is a separate unit in the site companion plan — coordinate via parent tracker.

**Patterns to follow:**

- `principles/AGENTS.md` § "Pressure-test protocol" — log findings at the bottom of the affected file in a `## Pressure
  test notes` section. Don't silently edit text without a record.

**Verification:**

- A `## Pressure test notes` section exists at the bottom of each principle file (or, if zero findings, a one-line note
  recording that the pass ran clean).
- No outstanding "actionable, must-fix-before-launch" finding remains.
- Any deferred finding has a `[later]` or `[wontfix]` tag with reasoning.

**Test scenarios:**

- Happy path: red-team pass finds 0–3 findings; each is either fixed in-place or `[later]`-tagged.
- Edge case: red-team pass finds an internal inconsistency that requires demoting a MUST to a SHOULD. This is a
  MINOR-bump trigger per `CONTRIBUTING.md` versioning policy. Decide whether to ship pre-launch (cuts a v0.2.1) or defer
  post-launch with a `[later]` tag.
- Edge case: red-team pass finds the spec contradicts a widely-cited prior-art document. Decide: cite the prior art in
  the principle prose (preferred), edit the wording to align (if alignment costs nothing), or keep as-is and prepare a
  first-reply for the inevitable HN comment (acceptable for the active-with-pressure-tests-welcome posture).

---

## Open Questions

### Resolved during planning (this session)

- **What is the actual status of Gate 1 (CHANGELOG v0.2.0)?** Resolved: `done`, not `on-dev-pending`. Tag `v0.2.0` is on
  `main` at `83bf0fd` with the full categorized release-note. The dev-side CHANGELOG.md being on the older pre-v0.2.0
  short format is a post-release back-merge gap, not a launch-visibility issue. See U1 sub-finding.
- **Does the launch include any new principle text?** Resolved: no. G2 is `status` field only; G3 is README copy. v0.2.0
  ships as-is.

### Forwarded from parent tracker (affect this repo)

- **Parent Q1: Does flipping `draft` → `active` trigger MINOR or PATCH?** Per `CONTRIBUTING.md` versioning policy,
  `status` is in the requirement frontmatter shape — conservative read: MINOR. Decide at commit time. Pre-launch
  consequence: a v0.2.1 (PATCH) or v0.3.0 (MINOR) release before launch. Either ships fine. Default to MINOR unless
  there's a specific reason not to (cuts cleanly from `dev` → `release/launch` → `main`).

### Spec-only Open Questions (raised by this plan)

- **Q1-spec: Does `principles/AGENTS.md` need to enumerate `active` as a documented `status` value before U2 ships?**
  Provisional answer: yes. The current enumeration is `draft | under-review | locked`. Adding `active` belongs in the
  same commit as the bulk principle flip. Confirms in `principles/AGENTS.md` § "Frontmatter" + § "Pressure-test
  protocol".
- **Q2-spec: Does the `validate-principles.yml` workflow have a hard-coded enum check for `status`?** Read the workflow
  before U2 commit; if yes, update the enum in the same commit.
- **Q3-spec: Does the CLI's spec-vendor parser tolerate an unknown `status` value?** Likely yes (status is metadata, not
  a requirement-tier signal). Verify against `agentnative-cli` `src/principles/registry.rs` or the spec-vendor parser
  before U2 commit. If no, the CLI needs a vendor refresh first (coupled-release territory).
- **Q4-spec: Should the "active stance" paragraph in README mention the `under-review` and `locked` statuses, or only
  `active`?** Decide at copy time. Probably mention all three briefly so a reader can interpret a future status change
  without context-switching to `principles/AGENTS.md`.
- **Q5-spec: Does the dev/main CHANGELOG.md back-merge gap need to be fixed pre-launch?** Recommend: no. HN-visibility
  is via main's default-branch render; the gap is a future-PR-collision risk only. Defer post-launch to a
  `chore(release): back-merge v0.2.0 CHANGELOG to dev` PR. Reconfirm at the night-before release PR cut.

---

## Pre-launch Release PR Checklist

Per the parent tracker's standing pattern: night-before release PR cut from `dev` → `release/launch` → `main`. This
section enumerates which dev-side commits go in.

**Eligible commits already on `dev` and not on `main` (as of plan filing date):**

| Commit  | Subject                                             | Include in `release/launch`? |
| ------- | --------------------------------------------------- | ---------------------------- |
| 76d253d | docs: rewrap to 120 cols (pre-push hook compliance) | No — docs-only on dev        |
| 07d89a4 | docs: correct GitHub repo name (naming-align U1)    | No — docs-only on dev        |
| 05e5c62 | docs(plans): file badge + vault-archival plans      | No — docs-only on dev        |
| fa7ace2 | docs(plans): mark plan 003 shipped                  | No — docs-only on dev        |
| 3d6dd11 | docs(plans): mark roadmap items unblocked           | No — docs-only on dev        |
| 4fab614 | fix(release): sync publish.yml awk + CHANGELOG      | **Yes** — release infra fix  |

> **Rule:** `docs/plans/**`, `docs/brainstorms/**`, `docs/solutions/**`, `docs/reviews/**` are blocked from `main`
> by `guard-main-docs.yml`. Only release-infra fixes, principle edits, governance docs (README, CONTRIBUTING,
> AGENTS, RELEASES, CHANGELOG, VERSION), and CI workflows go to `main`.

**Commits this plan creates that go to `release/launch`:**

- U2 (`feat`/`docs`?): seven principle status flips + AGENTS.md status enumeration + README "active stance" paragraph +
  (probably) VERSION bump. **Yes — ships to main.**
- U3 (`docs`): README hook. **Yes — ships to main.**
- U4 (`docs(plans)`): plan checkbox sweep. **No — docs-only on dev.**
- U5: handled by the naming-alignment plan; spec-side CLI/site/solutions-docs work coordinates separately.
- U6 (`fix`/`docs`): only if a link was broken and got fixed. Decide at commit time.
- U7 (`docs`): pressure-test notes per principle file. **Yes if any non-trivial finding shipped; otherwise no commit at
  all** — a clean red-team pass needs no artifact in the launch release.

**Pre-cut sanity:**

- Tag `v0.2.0` is current; tag `v0.2.1` or `v0.3.0` will be cut by the release PR if U2 changes VERSION.
- `guard-release-branch.yml` rejects PRs to `main` whose head isn't `release/*` — confirms the night-before workflow is
  the only entry path.
- `validate-principles.yml` runs on the release PR — verify it passes BEFORE pushing the release branch.

---

## System-Wide Impact

- **Interaction graph:** `principles/AGENTS.md` defines status values; `validate-principles.yml` enforces the schema;
  the `anc` CLI vendors and parses the files; the site renders them. Adding `active` as a status value is a 4-surface
  change but only the spec authors edit anything. Downstream surfaces tolerate or reject the new value silently; verify
  before U2 ships (Q3-spec).
- **API surface parity:** The `requirements[]` machine-readable contract is untouched by any U-N here. The launch
  intentionally does not change the requirement IDs, levels, or applicability shapes — those are the consumer-visible
  API.
- **Unchanged invariants:** v0.2.0 spec content (the seven principle MUST/SHOULD/MAY texts, all 46 requirement IDs, the
  coupled-release protocol, the AI-disclosure policy) does not change. A reader who pinned `v0.2.0` last week sees the
  same requirement contract on launch day.

---

## Risks & Dependencies

| Risk                                                                      | Mitigation                                                                                        |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `validate-principles.yml` rejects `active` as an invalid `status` value   | Q2-spec: read the workflow before U2 commit; update enum in the same commit if needed             |
| `agentnative-cli` spec-vendor parser rejects `active`                     | Q3-spec: verify before U2 commit; coupled-release the CLI if needed                               |
| Red-team pass uncovers a "must demote MUST → SHOULD" finding              | Decide whether to ship pre-launch (cuts v0.2.1) or `[later]`-tag and defer per AGENTS.md protocol |
| Cross-repo issue-template link 404s on launch day                         | U6 done Tuesday morning; cross-repo coordination via parent tracker                               |
| Stretch-track skill repo flips public prematurely without `/install` page | Owned by site-repo plan, not this one. Parent tracker tracks the Wed EOD ship-or-skip cutoff (Q5) |
| Naming-alignment U2–U5, U8, U9 slip                                       | Most are low-risk single-PR units. U2 (local rename) is FS-only. Coordinate via parent tracker    |

---

## Sources & References

- **Parent / central tracker:**
  `~/.gstack/projects/brettdavies-agentnative/brett-dev-design-show-hn-launch-inversion-20260427-144756.md`
- **Handoff doc that triggered this plan:** `.context/handoffs/2026-04-27-001-show-hn-launch-readiness-handoff.md`
  (local-only; never commit)
- **Coordinated in-flight plan:**
  [`2026-04-27-001-refactor-three-repo-naming-alignment-plan.md`](2026-04-27-001-refactor-three-repo-naming-alignment-plan.md)
- **Adjacent in-flight plans (no coordination required this launch):**
  [`2026-04-23-001-feat-badge-surface-plan.md`](2026-04-23-001-feat-badge-surface-plan.md),
  [`2026-04-23-002-feat-vault-archival-plan.md`](2026-04-23-002-feat-vault-archival-plan.md)
- **Cross-repo companion plans (filed in their own sessions):**
- `agentnative-cli/docs/plans/2026-04-28-001-feat-show-hn-launch-readiness-plan.md`
- `agentnative-site/docs/plans/2026-04-28-001-feat-show-hn-launch-readiness-plan.md`
- **Stretch track (site-owned, not in this plan):**
  `agentnative-site/docs/plans/2026-04-24-001-feat-skill-distribution-endpoint-plan.md`
- **Governance documents this plan cites:**
- `principles/AGENTS.md` — `status` enumeration, pressure-test protocol
- `CONTRIBUTING.md` — versioning policy, AI disclosure, coupled-release protocol
- `AGENTS.md` (root) — repo voice, branching/release model
- `RELEASES.md` — release pipeline + branch protection
