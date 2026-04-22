---
title: "feat: Requirement-ID frontmatter migration + principles governance"
type: feat
status: shipped
date: 2026-04-22
shipped: 2026-04-22
branch: feat/requirement-contract
base: dev
pr: "https://github.com/brettdavies/agentnative/pull/3"
merge-commit: 2b01eee64d1e63b01ac6ef0771ac38a72bfacfed
---

# feat: Requirement-ID frontmatter migration + principles governance

> **Close-out (2026-04-22).** Squash-merged to `dev` as
> [PR #3](https://github.com/brettdavies/agentnative/pull/3) at commit `2b01eee`. Summary of outcomes vs the plan
> below:
>
> - **Implementation Units 1–7: landed as described.** Handoff commit, frontmatter migration for all 7 principles,
>   `status: draft` on each, `principles/AGENTS.md`, both decision records, and the citation edits all shipped.
> - **Unit 8 landed as a local pre-push hook, not a GitHub Actions workflow.** See the "Amendments during
>   implementation" block below. Same verification surface (schema, ID uniqueness, bullet-count parity, plus regression
>   fixtures), activated via `git config core.hooksPath scripts/hooks`.
> - **Unit 9 (companion `agentnative-cli` PR) was deliberately deferred** and is now tracked as item 5 of
>   [`2026-04-22-002-post-frontmatter-roadmap.md`](2026-04-22-002-post-frontmatter-roadmap.md). The CLI needs a stable
>   `main` SHA to vendor from; filing the companion PR before `dev → main` cut would pin against a short-lived ref.
> - **Scope Boundaries: publish workflow, badge, vault archival, site `sync-spec.sh`** remain out of scope here and
>   are tracked as items 1–4 of the roadmap above.
> - **Open Questions resolved or migrated** — see the Open Questions section below for per-question resolution notes.
>
> **Amendments during implementation (2026-04-22):**
>
> - **`last-revised:` dates DID bump to 2026-04-22** on all seven principles. The original plan said "do NOT update"
>   because no MUST/SHOULD/MAY tier moved; implementation chose Option B for internal consistency with the MINOR
>   `VERSION` bump. If the frontmatter contract is big enough for MINOR, it is big enough for each principle's
>   canonical record to carry today's date. `CONTRIBUTING.md` is amended in the same PR to codify this rule
>   ("MINOR also applies when the requirement frontmatter shape or ID contract changes").
> - **Validation runs locally as a pre-push hook, not remote CI.** `scripts/hooks/pre-push` runs
>   `scripts/validate-principles.mjs` against real principles and `scripts/test-validate-principles.mjs` against three
>   regression fixtures in `scripts/__fixtures__/`, plus a relative-link check (`scripts/check-links.mjs`), the
>   `md-wrap.py --check` formatter gate, and `markdownlint-cli2` with the local config. Activation is a one-time
>   `git config core.hooksPath scripts/hooks`. The original plan called for a GitHub Actions workflow; this repo's
>   maintainer-driven scale is better served by the same pre-push pattern used in the Rust repos. Remote CI can be
>   added later without rework.
> - **`scripts/` is dual-licensed `MIT OR Apache-2.0`** (unplanned but substantive): `LICENSE-MIT`, `LICENSE-APACHE`,
>   SPDX headers on each script, carve-out noted in `LICENSE` and `README.md`. Matches `agentnative-cli`.
> - **Pre-existing MD060 table-alignment errors in `RELEASES.md` fixed** as a byproduct of landing the new markdownlint
>   pre-push stage. Upstream template in the `github-repo-setup` skill was corrected in a separate commit on the
>   `agent-skills` repo.
> - **Branch renamed** from `feat/requirement-id-frontmatter` to `feat/requirement-contract` before push — scope grew
>   beyond the ID migration and the new name better reflects the SoT-contract framing.
> - **Out-of-scope items are tracked.** Publish workflow, badge surface, vault archival, site `sync-spec.sh`, and
>   the companion `agentnative-cli` PR remain out of scope for this branch (see "Scope Boundaries" below). They are
>   named here and carried in project memory;
>   [`2026-04-22-002-post-frontmatter-roadmap.md`](2026-04-22-002-post-frontmatter-roadmap.md) tracks them with
>   revisit triggers.

## Overview

Establish this repo as source-of-truth for the 46 requirement IDs (`p1-must-env-var` … `p7-may-auto-verbosity`), migrate
principle-authoring conventions from the obsidian vault, and record two load-bearing design decisions (P1 Option ε
doctrine, `agentnative` naming rationale) that currently live outside any public repo.

After this PR, the CLI's `src/principles/registry.rs` can be rewritten (in a companion PR) to read the spec's
frontmatter rather than hardcode it — that turns the IDs into a one-way contract: spec publishes, CLI verifies drift,
checker output cites the spec version it was built against.

## Problem Frame

Three coupled gaps keep this repo from behaving as SoT even though the structural work (principle prose, VERSION,
CONTRIBUTING.md, rulesets) already landed:

1. **Requirement IDs live only in `agentnative-cli`** (`src/principles/registry.rs`, 46 entries). A principle edit here
   can't stably reference an ID without asking the CLI author what the ID is. Per the 2026-04-22 SoT decision, IDs move
   into this repo and the CLI becomes a drift check.
2. **Principle-authoring conventions live in the obsidian vault** (`~/obsidian-vault/Projects/
   brettdavies-agentnative/principles/AGENTS.md`). The vault's AGENTS.md still claims that folder is "upstream source of
   truth" — stale as of this repo's creation. The 5-section shape (Definition / Why Agents Need It / Requirements /
   Evidence / Anti-Patterns) and the pressure- test protocol (draft → under-review → locked) are useful conventions;
   they need to migrate here before the vault is archived.
3. **Two design decisions shape the current principles but aren't cited from anywhere public.** P1 reflects the
   2026-04-20 Option ε doctrine (behavioral MUST + honest scope note) and the `agentnative` / `anc` / `anc.dev` naming
   embodies the namespace-graveyard research. Without decision records in this repo, pressure-testers will re-litigate
   both.

## Requirements Trace

| # | Requirement |
| --- | --- |
| R1 | Each principle file's frontmatter carries a structured `requirements:` list with `id`, `level`, `applicability`, `summary` for every MUST/SHOULD/MAY bullet in the prose. |
| R2 | Each principle file's frontmatter carries a `status:` field (`draft` \| `under-review` \| `locked`). All seven start as `draft`. |
| R3 | `principles/AGENTS.md` exists and documents the per-file 5-section shape + pressure-test protocol (adapted from the vault, scoped to this repo). |
| R4 | `docs/decisions/p1-behavioral-must.md` records the 2026-04-20 Option ε doctrine; P1 prose cites it. |
| R5 | `docs/decisions/naming-rationale.md` records the `agentnative` / `anc` / `anc.dev` naming research; README and CONTRIBUTING.md cite it. |
| R6 | A CI workflow validates frontmatter shape on every PR: required fields present, ID uniqueness across the 7 files, `requirements[]` count matches MUST/SHOULD/MAY bullet count per level. |
| R7 | A companion PR on `brettdavies/agentnative-cli` replaces the hardcoded `registry.rs` with a drift check against this repo's principle frontmatter (per coupled-release protocol). |

## Scope Boundaries

**In scope:**

- Frontmatter migration for all 7 principle files.
- `principles/AGENTS.md` with authoring conventions.
- Two decision records under `docs/decisions/`.
- Frontmatter-validation CI workflow.
- Coordinating the companion CLI PR (link it in the Linked-check-review field).

**Out of scope (separate feature branches):**

- **Publish workflow** (tag + advisory `repository_dispatch` on `VERSION` bump). Belongs with the SoT propagation story;
  separate branch.
- **Badge surface.** Explicitly on hold per 2026-04-22 user direction.
- **Vault archival.** After this lands, vault `principles/` and `research/` can be archived with a redirect note. Small
  separate branch.
- **Site-side `scripts/sync-spec.sh`.** Site-repo work; opened as a separate PR there once this merges.

**Deferred:**

- CLI-side rewrite of `registry.rs` to consume spec frontmatter. Implementation detail of the companion PR; design
  question is *where the CLI vendors the spec* (see Open Questions).

## Context & Research

### Prior decisions (2026-04-22 session)

All four decisions are durable and captured in local memory at
`~/.claude/projects/-home-brett-dev-agentnative-spec/memory/sot_contract.md`:

1. **Propagation:** hybrid — git tag is authoritative, `repository_dispatch` is advisory.
2. **Per-requirement IDs:** SoT in this repo; CLI becomes drift check.
3. **Versioning:** decoupled; CLI pins `SPEC_VERSION` at its own cadence.
4. **Conformance:** trust-and-verify — spec offers GitHub badge; scorecards link to the live binary checker.

### Load-bearing references

- `~/dev/agentnative/docs/coverage-matrix.md` — the 46-row authoritative list of requirement IDs, levels, applicability,
  summaries, and which checks verify each. **This is the migration source** for R1; do NOT re-derive from principle
  prose (prose may have drifted from the CLI's canonical list).
- `~/obsidian-vault/Projects/brettdavies-agentnative/principles/AGENTS.md` — the 5-section shape and pressure-test
  protocol. Adapt for this repo's scope (drop the CLI/site/skill propagation section; replace with a pointer to
  CONTRIBUTING.md's coupled-release protocol).
- `~/.gstack/projects/brettdavies-agentnative/ceo-plans/2026-04-20-p1-doctrine-spec-coverage.md` §Doctrine Decision —
  source material for `docs/decisions/p1-behavioral-must.md`.
- `~/.gstack/projects/brettdavies-agentnative/brett-main-naming-rationale-20260327.md` — source material for
  `docs/decisions/naming-rationale.md`.
- `~/.claude/projects/-home-brett-dev-agentnative-spec/memory/` — `ecosystem_layout.md`, `sot_contract.md`,
  `doctrine_decisions.md`, `naming_and_domain.md`. Read before starting.

### Approved frontmatter shape

Per the 2026-04-22 proposal (accepted by user):

```yaml
---
id: p1
title: Non-Interactive by Default
last-revised: 2026-04-20
status: draft              # draft | under-review | locked
requirements:
  - id: p1-must-env-var
    level: must            # must | should | may
    applicability: universal
    summary: Every flag settable via environment variable (falsey-value parser for booleans).
  - id: p1-must-no-browser
    level: must
    applicability:
      if: CLI authenticates against a remote service
    summary: Headless authentication path (--no-browser / OAuth Device Authorization Grant).
# ...
---
```

Notes:

- `summary` is duplicated between frontmatter (machine-readable) and prose bullet (human-readable expansion). Accept the
  mild redundancy; reordering robustness outweighs the cost.
- `applicability` is `universal` (string) or `{if: <reason>}` (object). Maps to CLI's `Applicability::Universal |
  Conditional(reason)` enum.
- IDs stay lowercase-kebab, matching CLI's serde `rename_all = "snake_case"`.
- No inline `{#anchor}` markers in prose; the site renderer synthesizes anchors from frontmatter.

## Key Technical Decisions

- **Migration source is `coverage-matrix.md`, not principle prose.** The coverage matrix is generated from the CLI's
  `registry.rs` + `covers()` declarations; it's the canonical list. Principle prose may have drifted from IDs over time.
- **`status:` adopted from vault convention.** All seven principles start as `draft`. Moving to `locked` is gated on a
  pressure-test cycle — not this PR's scope.
- **Decision records as named files, not numbered ADRs.** `docs/decisions/p1-behavioral-must.md` and
  `docs/decisions/naming-rationale.md`. Low ceremony; principle prose cites by filename.
- **CI validation in node.** Minimal dep footprint; matches site-repo `build.mjs` pattern. Alternatives (Rust binary,
  Python) add toolchain to a prose-only repo.
- **Companion CLI PR is required per coupled-release protocol.** This PR's `Linked check review` field must link to the
  `agentnative-cli` PR URL — not "no check changes needed," because R1 changes the ID carrier that `registry.rs` reads.

## High-Level Technical Design

```text
spec (this repo)                          CLI (agentnative-cli)
─────────────────────────                 ─────────────────────
principles/p<n>-*.md                      src/principles/registry.rs
├─ frontmatter: id, title,                ├─ at build time:
│  last-revised, status,                  │  1. vendor spec/principles/*.md
│  requirements[]                         │     (commit-a-copy pattern)
└─ prose: Def / Why / Reqs / Ev /         │  2. parse frontmatter
   Anti-Patterns                          │  3. build REQUIREMENTS slice
                                          │  4. drift test: my-ids ⊇ vendored-ids
docs/decisions/*.md ─── cited from ───►   └─ compile-time error on drift
principle prose                                   │
                                                  ▼
.github/workflows/validate-principles.yml         scorecard JSON
├─ YAML schema check                              ├─ spec_version: <pinned>
├─ ID uniqueness                                  └─ results[] carry IDs
└─ bullet-count-per-level == requirement-count-per-level
```

## Implementation Units

1. **Commit this handoff.** First commit on the branch — establishes scope before any edits.
2. **Migrate requirement IDs into principle frontmatter (7 files).** Copy-paste from `coverage-matrix.md`; verify each
   bullet has a frontmatter entry and vice versa.
3. **Add `status: draft` to all 7 principles.** Single field addition.
4. **Write `principles/AGENTS.md`** — per-file structure, pressure-test protocol, propagation pointer to
   CONTRIBUTING.md's coupled-release protocol.
5. **Create `docs/decisions/p1-behavioral-must.md`** — extract §Doctrine Decision from the 2026-04-20 CEO plan; rewrite
   as a standalone decision record (Context / Options / Decision / Consequences).
6. **Create `docs/decisions/naming-rationale.md`** — condense the gstack naming doc to a decision record. Keep the
   namespace-graveyard table; drop session-specific provenance.
7. **Cite decisions from principle prose.** Add a one-line "Decision record:" link in P1's scope note pointing to
   `docs/decisions/p1-behavioral-must.md`. Add a similar pointer from `README.md` and `AGENTS.md` to
   `docs/decisions/naming-rationale.md`.
8. **Add `.github/workflows/validate-principles.yml`.** Node script walks `principles/`, validates each frontmatter
   against a JSON schema, checks ID uniqueness across files, and checks bullet-count parity per level.
9. **Open the companion `agentnative-cli` PR.** Rewrites `registry.rs` to vendor + parse spec frontmatter. Link in this
   PR's Linked-check-review field.

Units 2–7 have no hard dependencies on each other after 1 lands; they can be parallel commits if
preferred. Unit 8 depends on Unit 2 (schema needs real frontmatter to validate). Unit 9 depends on Unit 2 (spec
frontmatter must exist for the CLI to vendor).

## Test Scenarios

- **Happy path:** every principle file parses as YAML+markdown; `requirements[]` length equals the count of
  MUST+SHOULD+MAY bullets in prose.
- **ID uniqueness:** a deliberately-duplicated ID across two principle files fails validation with an actionable message
  naming both files.
- **Level parity:** a file with 3 MUST bullets but only 2 MUST entries in `requirements[]` fails validation.
- **Schema shape:** a malformed `applicability:` field (e.g., `applicability: conditional` without the `if:` wrapper)
  fails validation.
- **Integration:** a companion `agentnative-cli` PR that vendors this repo at the merged SHA and derives its
  `REQUIREMENTS` slice at build time compiles without the drift test firing.

## Verification

- Every principle file has `requirements[]` matching `coverage-matrix.md` exactly (46 total).
- `principles/AGENTS.md` exists and all its cross-references resolve.
- Both decision records exist and are linked from the principle prose / repo docs that depend on them.
- `validate-principles.yml` runs green on this PR and fails on the deliberately-broken scenarios above (verified locally
  before CI).
- Companion `agentnative-cli` PR URL is in this PR's Linked-check-review field.

## Risks & Dependencies

| Risk | Mitigation |
| --- | --- |
| Frontmatter migration drifts from `coverage-matrix.md` at copy time | Use coverage-matrix.md as the sole source; add a manual diff pass as the last step before commit. The validation workflow catches further drift going forward. |
| Companion CLI PR blocks this PR indefinitely if CLI work stalls | The coupled-release protocol is a documented norm, not a CI gate. User can choose to land spec-side first with a placeholder URL and a follow-up note, accepting brief ID-contract drift. Flag in PR body if you go that route. |
| The `applicability: {if: <reason>}` object confuses downstream parsers expecting a flat string | Schema validation in Unit 8 catches shape drift before merge; CLI companion PR exercises the real parse path. |

## Documentation / Operational Notes

- **This is a MINOR version bump on the spec.** `VERSION` goes from `0.1.1` to `0.2.0` — the requirement-ID contract is
  new (per CONTRIBUTING.md rule: MINOR for MUST changes, and this effectively adds an ID-level MUST to the SoT surface).
  Update `VERSION` in the same commit as the last frontmatter file so the bump is atomic with the contract change.
- **`CHANGELOG.md` entry:** under `### Added`, note the frontmatter requirement contract and the `status:` field. Under
  `### Changed`, note that IDs are now SoT here (previously CLI-owned).
- **Principle `last-revised:` dates do NOT update** in this PR. Frontmatter shape changes but no MUST/SHOULD/MAY tiers
  move. Dates stay at `2026-04-20`.

## Pick-up Notes for a Fresh Session

1. **Read this file in full**, then the four project memories in
   `~/.claude/projects/-home-brett-dev-agentnative-spec/memory/`.
2. **Confirm branch:** `git branch --show-current` should print `feat/requirement-id-frontmatter`.
3. **Start with Unit 2** — frontmatter migration. Copy from `coverage-matrix.md`; do one file at a time; verify
   bullet-count parity as you go.
4. **Don't over-scope.** Publish workflow, badge, vault archival, and site sync are OUT of scope per the decisions
   above. If new work surfaces, file a follow-up plan under `docs/plans/`.
5. **Companion CLI PR:** work on it in parallel after Unit 2 lands locally. The CLI needs real frontmatter to parse
   against; land this PR's Unit 2 as a commit (don't push yet) and start the CLI PR from that SHA.

## Open Questions

1. **Where does the CLI vendor the spec?** Options:

- (a) CLI repo includes `spec/` synced via a `scripts/sync-spec.sh` matching the site's pattern (commit-a-copy).
- (b) CLI fetches the spec at build time from the latest tag.
- (a) matches the site-side pattern and the 2026-04-22 SoT decision; recommend (a) unless the CLI author prefers
  tarball-fetch. Decision lands in the companion PR.

   **Resolution (2026-04-22):** Migrated to the companion CLI PR (roadmap item 5 in
   [`2026-04-22-002-post-frontmatter-roadmap.md`](2026-04-22-002-post-frontmatter-roadmap.md)). Recommendation stands
   at (a) commit-a-copy; final decision belongs to the CLI-side branch when filed.

1. **Does `status: draft` surface anywhere today?** The site and CLI don't currently read it. Recommendation: land the
   field now so downstream consumers can opt in later (additive, non-breaking). Alternative: omit until a consumer
   exists. User call.

   **Resolution (2026-04-22):** Landed the field on all seven principles. Additive, non-breaking; downstream consumers
   can opt in at their own cadence.

2. **Should the CI validation workflow run on the `principles/` path only or on every PR?** Running on every PR catches
   accidental deletion of principle files. Running path-scoped (`paths: [principles/**]`) is faster but misses deletion
   events. Recommend every PR given the tiny file count.

   **Resolution (2026-04-22):** Moot. Validation runs locally via `scripts/hooks/pre-push`, not remote CI (see
   Amendment block above). The hook runs the full pipeline on every push regardless of which paths changed.

## Sources & References

- **SoT contract memory:** `~/.claude/projects/-home-brett-dev-agentnative-spec/memory/sot_contract.md`
- **Ecosystem layout memory:** same dir, `ecosystem_layout.md`
- **Doctrine decisions memory:** same dir, `doctrine_decisions.md`
- **Naming memory:** same dir, `naming_and_domain.md`
- **Coverage matrix (migration source):** `~/dev/agentnative/docs/coverage-matrix.md`
- **Vault principles conventions (migration source for Unit 4):**
  `~/obsidian-vault/Projects/brettdavies-agentnative/principles/AGENTS.md`
- **P1 doctrine CEO plan (migration source for Unit 5):**
  `~/.gstack/projects/brettdavies-agentnative/ceo-plans/2026-04-20-p1-doctrine-spec-coverage.md`
- **Naming rationale (migration source for Unit 6):**
  `~/.gstack/projects/brettdavies-agentnative/brett-main-naming-rationale-20260327.md`
- **This repo's governance:** `CONTRIBUTING.md`, `RELEASES.md`, `AGENTS.md`
