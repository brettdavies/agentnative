---
title: "feat: Badge surface for agent-native-standard conformance"
type: feat
status: on-hold
date: 2026-04-23
parents:
  - docs/plans/2026-04-22-002-post-frontmatter-roadmap.md
roadmap-item: 2
---

# feat: Badge surface for agent-native-standard conformance

> **Status: on-hold (2026-04-23).** Filed as a durable plan record per the roadmap-002 directive to ship individual
> plans for each outstanding item. Execution is explicitly blocked on two external triggers (leaderboard maturity + CLI
> author demand); see Revisit triggers below. Unblock → flip `status: active` and start U1.

## Overview

A shields.io-compatible badge that CLI authors can embed in their own READMEs to declare agent-native-standard
conformance. The badge links to the live `anc.dev/score/<tool>` scorecard, so any reader can follow a claim to current
evidence rather than trusting a self-declaration.

This plan captures the **spec-side** of the work: what it means to claim a badge, the conformance floor required, and
the citation rules. Badge **rendering** (the shields endpoint on `anc.dev`) is a separate plan owned by
`agentnative-site` and is explicitly out of scope here.

## Problem Frame

The SoT contract (`sot_contract.md` in session memory) commits to a "trust-and-verify" posture: conformance claims must
be checkable against live verification, not just a static marker. Today a CLI author who wants to advertise
agent-native-standard adherence has no canonical way to do so — a shields badge linked to `anc.dev/score/<tool>` closes
that gap, but only if:

1. The spec defines what "claiming the badge" means (conformance floor, version pinning, honest grading expectations)
2. The site renders a badge endpoint consistent with that meaning
3. The leaderboard has enough baseline tools that a badge sits in a credible context

Item 1 is this plan. Items 2 and 3 sit downstream.

## Requirements Trace

- R1. Define the minimum conformance posture a CLI must meet to claim the badge (score threshold, required principles,
  handling of exceptions).
- R2. Define the version-pinning convention — does the badge cite the spec version it was scored against, the tool
  version scored, or both?
- R3. Define the honesty expectation — self-grading is acceptable, but the badge URL must resolve to a live scorecard
  that anyone can re-run.
- R4. Define the removal / change policy — when a tool regresses below the threshold, what happens to the badge claim?

## Scope Boundaries

- Badge image rendering (shields endpoint, SVG generation) — owned by `agentnative-site`, separate plan when picked up.
- Leaderboard UX — separate concern on the site.
- Any changes to the `anc` CLI scoring itself — out of scope; spec defines what the badge means, the CLI already scores.

### Deferred to Follow-Up Work

- Site-side badge rendering endpoint at `anc.dev/badge/<tool>.svg`: separate plan in `agentnative-site`, filed only when
  the revisit trigger fires here.

---

## Context & Research

### Relevant Code and Patterns

- `CONTRIBUTING.md` — contains the coupled-release protocol and AI disclosure policy; badge convention may extend this
  doc or live in a new `docs/badge.md`. Decision deferred to U1.
- `principles/AGENTS.md` — governance for principle edits; the badge convention inherits the MINOR-on-contract-change
  versioning rule.

### Institutional Learnings

- `sot_contract.md` (session memory) — hybrid propagation (IDs are SoT, versions are decoupled). Badge URL structure
  must honor this: badge cites the spec version, the tool version, and the scorecard JSON SHA, not the running tool's
  opinion of itself.

### External References

- [shields.io custom endpoint docs](https://shields.io/endpoint) — JSON schema the site's badge endpoint must return.
  Referenced only; no implementation until site-side plan.

---

## Key Technical Decisions

- **Convention lives in spec repo, rendering lives in site repo.** Splitting avoids entangling doctrine with visual
  chrome. Doctrine evolves slowly (MINOR bumps); rendering can iterate freely.
- **Badge claim is a doc edit, not a registry addition.** No new machine-readable artifact here — just prose that
  authors cite when embedding the badge. The registry (`agentnative-site/registry.yaml`) is already the machine-readable
  record of scored tools.
- **Defer doc location (CONTRIBUTING.md section vs. new docs/badge.md) to U1.** Both work; the right call depends on how
  much prose the convention actually needs, which is easier to judge when drafting.

## Open Questions

### Resolved During Planning

- Does the badge require a minimum score? — **Yes.** Deferred-to-U1 to define the exact threshold, but the presence of a
  threshold is non-negotiable (a badge with no floor is a sticker, not a claim).
- Does the spec own the render? — **No.** Spec owns the contract; site owns the shields endpoint.

### Deferred to Implementation

- Threshold value (what score / what required principles) — draft in U1, pressure-test before publishing.
- Should the badge carry a date, a version, or both? — decide during U1 based on what shields' URL structure supports
  cleanly.
- Whether to require a minimum `anc` CLI version scored against — likely yes, but exact floor is a U1 call.

---

## Implementation Units

- [ ] U1. **Draft badge-claim convention**

**Goal:** Produce the prose that defines what claiming the badge means.

**Requirements:** R1, R2, R3, R4

**Dependencies:** None (plan-time); on-hold trigger must fire before execution (see Risks).

**Files:**

- Create (if prose is >~40 lines): `docs/badge.md`
- Modify (if prose is short): `CONTRIBUTING.md` (add `## Badge claim` section)
- Modify: `README.md` (add a pointer under "Related" or "## Contributing")

**Approach:**

- Write out the conformance floor, version-pinning rule, honesty expectation, and regression policy as prose.
- Choose between `docs/badge.md` vs `CONTRIBUTING.md` based on length — if the convention fits in under ~40 lines, keep
  it in `CONTRIBUTING.md` under a new `## Badge claim` section; if longer, split to `docs/badge.md`.
- Cite `sot_contract.md` framing ("trust-and-verify, badge links to live evidence").
- Reference shields.io's JSON endpoint contract so site-side rendering has a known shape to hit.

**Patterns to follow:**

- `CONTRIBUTING.md` voice — direct, tables where choices branch, examples inline.
- Frontmatter date rule from `principles/AGENTS.md` — badge-convention doc gets `last-revised: YYYY-MM-DD`.

**Test scenarios:**

- Happy path: a CLI author reading the convention can answer "what score do I need, what version do I cite, what URL do
  I embed" without asking a maintainer. Verification is a readability pass, not an automated test.
- Edge case: the convention addresses what happens when the tool regresses below threshold (badge URL should
  auto-reflect the drop via live scorecard — no separate action required).
- Test expectation: no automated tests. This unit is prose-only. Verification is human review + the follow-up site-side
  plan being able to implement against the contract without needing clarification.

**Verification:**

- A human reader (ideally a CLI author candidate) can explain, in their own words, what the badge guarantees and what
  obligations it places on them.
- The follow-up site-side rendering plan can be filed referencing this doc without needing to invent convention details.

---

- [ ] U2. **Wire references into top-level docs**

**Goal:** Make the convention discoverable from the entry points.

**Requirements:** R1 (discoverability complements definition)

**Dependencies:** U1

**Files:**

- Modify: `README.md` (add pointer under "Related" or a new "Badge" subsection)
- Modify: `CONTRIBUTING.md` (cross-link if U1 placed the convention in `docs/badge.md`)

**Approach:**

- One-line pointer in README pointing at the convention doc.
- If the convention lives in `docs/badge.md`, `CONTRIBUTING.md` gets a cross-link under a relevant section.
- Do not yet reference a live shields endpoint URL — that ships in the site-side plan.

**Patterns to follow:**

- Existing "## Related" section in `README.md` (links to `anc.dev`, `agentnative-cli`, `agentnative-site`).

**Test scenarios:**

- Happy path: reader of README finds the convention within one click.
- Test expectation: link-check pre-push hook (`scripts/check-links.mjs`) catches a broken link if U1's filename changes
  between drafting and landing.

**Verification:**

- `scripts/hooks/pre-push` passes (link check + markdownlint + validate-principles — badge convention doesn't touch
  principles but the hook runs anyway).

---

## System-Wide Impact

- **Interaction graph:** None. This plan is prose-only.
- **API surface parity:** The site-side badge endpoint becomes a new consumer of the conformance contract defined here.
  When U1 writes the contract, keep the site-side renderer in mind — the prose should be specific enough that the
  renderer's JSON payload (shields endpoint shape) can be constructed directly from the convention without
  re-interpretation.
- **Unchanged invariants:** Principle files, requirement IDs, publish workflow, CHANGELOG convention — none touched.

---

## Risks & Dependencies

| Risk                                                                          | Mitigation                                                                                             |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| On-hold trigger never fires (leaderboard stalls, no author demand)            | Plan stays filed as `status: on-hold`; no cost accrues. Revisit annually or when triggers fire.        |
| Convention written here doesn't match what site-side rendering actually needs | U1 explicitly references shields.io endpoint contract so the prose is renderer-aware from the start.   |
| Convention over-constrains; locks out valid edge cases                        | Keep U1 minimal — conformance floor + versioning + honesty + regression. Anything more is future-work. |

**External dependencies (on-hold triggers):**

- Leaderboard on `agentnative-site` has a credible tool count (~100 per `doctrine_decisions.md`).
- At least one external CLI author has expressed interest in embedding a badge.

Both must be true before flipping this plan from `on-hold` to `active`.

---

## Documentation / Operational Notes

- When this plan unblocks, update `CHANGELOG.md` under the release PR that lands U1+U2 (spec-side convention is a
  doc-only change; no VERSION bump unless the convention touches a requirement's MUST/SHOULD/MAY).
- File the follow-up site-side rendering plan in `agentnative-site/docs/plans/` at the same time U1 lands here, so the
  two can be coordinated under the coupled-release protocol (`CONTRIBUTING.md`).

## Sources & References

- **Parent roadmap:**
  [`docs/plans/2026-04-22-002-post-frontmatter-roadmap.md`](2026-04-22-002-post-frontmatter-roadmap.md), item 2
- Related session memory: `sot_contract.md` (trust-and-verify posture), `doctrine_decisions.md` (leaderboard baseline)
- External: [shields.io endpoint contract](https://shields.io/endpoint)
- Related repos: `brettdavies/agentnative-site` (downstream rendering)
