# Pre-cutover prose scan — logic check (v2)

Date: 2026-05-06 Author: Claude Code (Opus 4.7 1M-context), under Brett's review Status: Decision-pending — Brett to
pick a path

## Premise (corrected from v1 of this doc)

**Vale tooling and prose fixes must land on the version branches themselves.** External scan-then-report (path A from
v1) is out — the version branches need to carry the rules so their own pre-push hook gates cutover, and prose fixes get
committed to the branch that's about to ship.

The branches:

- `docs/v0.3.1` — back-port maintenance from the v0.3.x line. Includes BRAND.md, .impeccable.md, the de-verbatim pass
  for P1-P7, and recent docs polish. Smaller scope.
- `feat/v0.4.0` — v0.4.0 minor release. Includes everything in v0.3.1's BRAND/IMPECCABLE introduction PLUS principle
  additions (P8, P6 SIGTERM, P4 enumerate-valid-set, P2 schema-export, P8 added). Larger scope.

Both branches are sequenced, not content-frozen. Brett's working assumption: v0.3.1 cuts over first, v0.4.0 second.

### Useful divergence facts (verified just now)

- `BRAND.md` is **byte-identical** on both branches. U3's restructure ports cleanly with zero conflict.
- `.impeccable.md` differs by **one line** — a forward-reference ("v0.3.1 de-verbatim pass" vs "v0.4.0 de-verbatim
  pass"). Trivial to resolve when porting.
- All of v0.3.1's principle/BRAND/IMPECCABLE commits are also present on v0.4.0 (v0.4.0 forward-ported them). v0.4.0
  adds principle work on top.

This means tooling commits port between branches with near-zero conflict friction.

## Brett's three permitted approaches

### Option 1 — Tmp branch + cherry-pick tooling into each version branch

Build the prose-check stack on a separate `feat/prose-check-stack` branch (current plan's design). Cherry-pick the
**tooling commits only** (rule packs, `.vale.ini`, `scripts/`, pre-push wiring, BRAND.md / .impeccable.md restructure)
onto each version branch. Each version branch's pre-push then catches violations natively; prose fixes accumulate on the
version branch.

**Mechanics:**

1. Cut `feat/prose-check-stack` from `feat/v0.4.0` (per existing plan).
2. Implement U1-U8 there. Validate end-to-end.
3. Cherry-pick tooling commits onto `docs/v0.3.1`. Run pre-push. Fix violations on v0.3.1.
4. Cherry-pick tooling commits onto `feat/v0.4.0`. Run pre-push. Fix violations on v0.4.0.
5. Eventually merge `feat/prose-check-stack` to `dev` after both versions cut over (or let it die if the tooling lands
   on dev via v0.4.0's release).

**Pros:**

- Tooling is built and validated in isolation before propagating. Reviewable as its own PR.
- Both version branches receive identical tooling commits (cherry-picked from one source).
- If prose-check needs a hotfix during release prep, fix once on the tmp branch, re-cherry-pick.

**Cons:**

- Three branches diverge with the same tooling (tmp, v0.3.1, v0.4.0). Drift risk if tmp evolves after cherry-picks.
- Tmp branch's eventual fate is unclear. Does it merge to dev? When? If not, it's a perpetual side-branch.
- Coordination overhead: every tooling change becomes 1 commit + 2 cherry-picks.

### Option 2 — PR to dev first, propagate to version branches via rebase/cherry-pick

Build prose-check, PR to dev, merge. Version branches inherit via rebase or cherry-pick.

**Mechanics — and why this option is partly broken:**

Prose-check's U3 needs `BRAND.md` to exist as input. `dev` does NOT yet have `BRAND.md` — it arrives only when v0.3.1 or
v0.4.0 cuts over. So prose-check can't merge to dev *before* one of them cuts over.

This forces the order:

1. v0.3.1 (or v0.4.0) cuts over first → dev gains BRAND.md.
2. Prose-check (built off feat/v0.4.0) rebases onto new dev → PRs → merges.
3. The OTHER version branch rebases against new dev (which now has prose-check).

**The fatal problem:** whichever version branch goes first in step 1 ships **without** prose-check. That contradicts the
goal ("scan all MD files before cutting over"). Unless step 1 also includes the prose-check tooling — at which point
Option 2 has collapsed into Option 3 (the first version branch implements prose-check directly).

So Option 2 only works as Option 2 + Option 3 hybrid: implement prose-check on the first-to-cut-over branch (v0.3.1),
ship together, then second branch rebases against new dev. That's just Option 3 with extra naming.

**Conclusion:** Option 2 reduces to Option 3 in practice. Skipping.

### Option 3 — Implement directly on v0.3.1

Skip the separate `feat/prose-check-stack` branch. Build the prose-check stack directly on `docs/v0.3.1`. v0.3.1 cuts
over with prose-check tooling INSIDE the release. After v0.3.1 lands on dev, `feat/v0.4.0` rebases against new dev (or
cherry-picks tooling commits) and inherits prose-check.

**Mechanics:**

1. Switch to `docs/v0.3.1`. Implement U1-U8 there directly. Each unit's commit lands on v0.3.1.
2. v0.3.1's pre-push runs Vale on v0.3.1's content during U7. Fix violations as they surface.
3. Re-run pre-push until clean. Cut over v0.3.1 (PR to dev → merge).
4. dev now has BRAND.md (restructured), `.impeccable.md` (restructured), Vale tooling, pre-push wiring.
5. Rebase `feat/v0.4.0` against new dev. The 1-line `.impeccable.md` divergence resolves trivially. v0.4.0 absorbs
   prose-check via inherited commits.
6. Run v0.4.0's pre-push. Fix any v0.4.0-specific prose violations (mostly in the principle additions: P8, P6, P4, P2
   work). Cut over v0.4.0.

**Pros:**

- **Single implementation site.** No tmp branch, no cherry-pick maintenance. Tooling lives where it ships.
- **v0.3.1 release narrative absorbs prose-check naturally.** v0.3.1 was already a "voice + de-verbatim pass" patch (per
  its commits: `de-verbatim pass on principle bullets across P1–P7`, `move visual-only bans to site channel`). Adding
  "the enforcement infrastructure for the voice" is thematically consistent with v0.3.1's existing scope.
- **v0.4.0 inherits cleanly.** BRAND.md is byte-identical between branches; rebase resolves with one trivial
  `.impeccable.md` conflict.
- **Sequenced release works as Brett described.** v0.3.1 ships first WITH prose-check; v0.4.0 ships second with
  prose-check inherited.

**Cons:**

- v0.3.1's release scope expands meaningfully. Originally scoped as a small back-port patch; now also ships the Vale
  rule packs, the BRAND.md restructure, the orchestrator, and the per-pack README generator. Release notes need to
  reflect this.
- v0.3.1's CHANGELOG.md gets fuller. Brett's `## Changelog` section per PR rule means each U-unit PR's changelog block
  rolls into v0.3.1's release notes verbatim.
- If prose-check implementation surfaces blockers, v0.3.1's ship date slips with it. (Same risk applies to Option 1 when
  it eventually propagates, just deferred.)

## Comparison table

| Dimension                    | Option 1 (tmp branch + cherry-pick)              | Option 3 (implement on v0.3.1)                   |
| ---------------------------- | ------------------------------------------------ | ------------------------------------------------ |
| Implementation sites         | 1 (tmp), then 2 cherry-pick targets              | 1 (v0.3.1)                                       |
| Tmp/orphan branches          | Yes (`feat/prose-check-stack`)                   | None                                             |
| Drift risk                   | Real if tmp evolves after cherry-picks           | None                                             |
| v0.3.1 release scope         | Tight (just back-port + tooling cherry-picks)    | Expanded (back-port + voice contracts + tooling) |
| v0.4.0 inheritance mechanism | Cherry-pick from tmp                             | Rebase against new dev (auto-absorbs)            |
| Coordination overhead        | 1 commit → 1 push → 2 cherry-picks per change    | 1 commit → 1 push                                |
| PR ceremony                  | Three PRs: tmp→reviewable, then 2 version-branch | One PR: prose-check on v0.3.1; v0.4.0 inherits   |
| If implementation slips      | Slips on tmp; doesn't block version branches     | Slips on v0.3.1 directly                         |

## Recommendation: Option 3

Implement prose-check directly on `docs/v0.3.1`. The release-scope expansion is a real cost, but every other dimension
favors Option 3:

- One implementation, one place to run pre-push, one place to fix violations.
- No drift between three copies of the tooling.
- v0.3.1's existing scope already includes voice work (de-verbatim pass on P1-P7, BRAND visual-bans-to-site move).
  Prose-check is the natural completion of that arc — the rules become enforceable instead of aspirational.
- v0.4.0 inheritance is the cleanest case here: rebase resolves with one trivial conflict because BRAND.md is
  byte-identical between branches.
- Cuts the implementation plan from "1 tmp branch + 2 propagation passes" to "1 implementation, 1 inheritance pass".

The one cost — v0.3.1 release scope grows — is acceptable because v0.3.1 is *defining the voice contracts anyway*
(BRAND.md, .impeccable.md, the de-verbatim pass were all v0.3.1 work). Shipping the enforcement at the same time gives
v0.3.1 a coherent release narrative: "v0.3.1 establishes the voice and ships the rules that enforce it."

## What this means for the existing plan

`docs/plans/2026-05-06-001-feat-prose-check-stack-plan.md` was written assuming a separate `feat/prose-check-stack`
branch. If Brett picks Option 3:

- The plan's branch-policy section (lines roughly 39-62 of the handoff) needs updating: implementation branch is
  `docs/v0.3.1`, not `feat/prose-check-stack`. No tmp branch.
- U3's "Approach" note about cutting from `feat/v0.4.0` is moot — implementation already lives on v0.3.1, which has
  BRAND.md.
- U7 (pre-push wiring) and the U-list generally don't change. The work is the same; the branch it lands on is different.
- A new "post-implementation step" replaces the propagation work: rebase `feat/v0.4.0` against `dev` after v0.3.1's
  release, run pre-push on v0.4.0's principle-addition prose, fix and ship.
- The current `docs/prose-check-stack-brainstorm` branch becomes scratch — its planning commits move to `docs/v0.3.1`
  (or get cherry-picked there, since the plans are referenced material), and the branch can be deleted.

If Brett picks Option 1 instead, the existing plan stands as written.

## Logic-check questions for Brett

1. **v0.3.1 release scope:** comfortable expanding v0.3.1 to include the prose-check stack? Release notes will list it
   as a v0.3.1 feature.
2. **Sequencing confirmation:** v0.3.1 cuts over first, v0.4.0 second? (Option 3's mechanics rely on this order.)
3. **v0.3.1 CHANGELOG block:** the per-PR `## Changelog` rule means each U-unit PR's changelog rolls into v0.3.1's
   release notes. Is that the right place for prose-check to be documented, or should it be a single combined changelog
   entry written at the end?
4. **Branch hygiene:** OK to delete `docs/prose-check-stack-brainstorm` after moving its plan/brainstorm commits to
   `docs/v0.3.1`?
