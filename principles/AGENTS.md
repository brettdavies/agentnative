# Principles folder — agent instructions

This folder holds the canonical specification of the 7 agent-native CLI principles. It is the **source of truth** for
every downstream consumer — the `anc` CLI linter (which reads the frontmatter to build its requirement registry), the
`anc.dev` site (which commits a copy of these files via `scripts/sync-spec.sh`), and any third party that cites the
standard.

Everything about this folder is optimized for one property: a principle's requirements can be mechanically extracted
from the file without parsing prose. Frontmatter carries the machine-readable contract; prose carries the human-readable
expansion.

## What belongs here

- One file per principle: `p<n>-<slug>.md`, seven in total.
- This file (`AGENTS.md`), documenting the per-file shape and pressure-test protocol.

**Does not belong here:** website copy, CLI check implementations, research extracts, per-tool scorecards, or any
document that is downstream of a principle rather than being one.

## Per-file structure

Every principle file has two parts: **frontmatter** (structured, machine-readable) and **prose** (sections in fixed
order). Both must be present; both are load-bearing.

### Frontmatter

```yaml
---
id: p1
title: Non-Interactive by Default
last-revised: 2026-04-22
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
    summary: Headless authentication path (`--no-browser` / OAuth Device Authorization Grant).
---
```

Fields:

- `id` — lowercase principle code (`p1` through `p7`). Matches the filename prefix.
- `title` — human-readable principle title; mirrors the H1.
- `last-revised: YYYY-MM-DD` — updates **only** when a MUST/SHOULD/MAY changes tier, is added, or is removed. Prose-only
  edits do not bump the date.
- `status` — `draft` when first extracted, `under-review` during pressure-testing, `locked` when edits are stable for a
  review cycle.
- `requirements[]` — one entry per MUST/SHOULD/MAY bullet in the prose. Required fields per entry:
- `id` — `p<n>-<level>-<slug>`, lowercase-kebab, unique across all seven files.
- `level` — `must`, `should`, or `may` (lowercase). RFC 2119 semantics.
- `applicability` — either the string `universal` or an object `{if: "<reason>"}`. `universal` applies to every CLI;
  conditional applies only when the named surface exists.
- `summary` — one sentence. Duplicated between frontmatter and prose; the prose bullet can expand with examples, but the
  first-sentence meaning must match.

The summary duplication is intentional. Machine consumers parse the frontmatter; humans read the prose. Keeping them in
sync is a review responsibility (enforced by the CI validator — see below).

### Prose sections (fixed order)

1. **Definition** — one or two sentences. What the principle demands.
2. **Why Agents Need It** — the cost of violating it, expressed in agent-operational terms.
3. **Requirements** — MUST / SHOULD / MAY bullets using RFC 2119 language. Bullet count per level must equal the
   `requirements[]` count per level in frontmatter.
4. **Evidence** — what to look for when verifying compliance.
5. **Anti-Patterns** — what to reject.

Preserve section names and MUST/SHOULD/MAY structure on edits. Downstream tools (the site renderer, the CLI's vendored
copy, the coverage-matrix generator) scan for these boundaries.

## Validation

Every PR touching `principles/**` runs `.github/workflows/validate-principles.yml`, which checks:

- Required frontmatter fields are present on every file.
- `requirements[].id` values are unique across all seven files.
- The number of MUST / SHOULD / MAY entries in `requirements[]` equals the number of MUST / SHOULD / MAY bullets in the
  prose.
- `applicability` is either the string `universal` or an object with an `if:` key — no other shapes.

Drift in any of these fails the check with an actionable message naming the file and the specific mismatch.

## Pressure-test protocol

Principles start as `status: draft`. Moving to `locked` is gated on a pressure-test cycle:

1. Change status to `under-review`.
2. Run at least one of the tests below. Log findings at the bottom of the file in a `## Pressure test notes` section.
3. Resolve each finding: edit the principle, demote a MUST to SHOULD, merge with another principle, split into two, or
   reject the critique with a note explaining why.
4. When findings are exhausted and edits are stable for a review cycle, change status to `locked`. Keep unresolved
   findings with a `[wontfix]` or `[later]` tag.

**Tests (choose at least one; more is better):**

- **Adversarial review** — ask a separate reviewer (`/codex review`, a subagent, or a human) to find the weakest claim
  in the principle. Capture the critique verbatim in the notes section.
- **Real-CLI dogfood** — grade 5+ real CLIs against the principle (`gh`, `jq`, `ripgrep`, `wrangler`, plus one
  intentionally bad CLI as a negative control). Record which CLIs pass/fail and on which specific requirement.
- **Requirement-level challenge** — for each MUST, ask: "Would a well-designed agent-facing CLI ever legitimately
  violate this?" If yes, the MUST may be wrong.

## Editing a principle

When a principle changes, the order of operations is:

1. Edit prose and frontmatter together — a new MUST bullet in prose needs a new `requirements[]` entry with matching
   `id`, `level`, `summary`, and `applicability`. Removing a bullet removes the corresponding entry.
2. If a requirement's tier changed (MUST ↔ SHOULD ↔ MAY) or a requirement was added/removed, bump `last-revised:` to
   today's date and bump `VERSION` (MINOR for MUST changes, PATCH for SHOULD/MAY changes — see `CONTRIBUTING.md`).
3. If a requirement `id` changed or was removed, note this in the PR body — downstream `anc` consumers pin against IDs,
   and renaming an ID is a breaking change for their registry drift check.
4. Include a `## Changelog` section in the PR body naming the affected principle and the change.

## Coupled-release protocol

Any PR that changes a principle's `requirements[]` (add, remove, rename, or change `level`) triggers the coupled-release
norm documented in [`CONTRIBUTING.md`](../CONTRIBUTING.md#coupled-release-protocol). The PR body MUST include either:

- A link to a companion PR on `brettdavies/agentnative-cli` (the CLI's frontmatter-derived registry must accept the
  change, or a drift test fires), or
- The text "no check changes needed" with a brief justification.

This is a documented norm, not a CI gate. The PR template enforces the field; reviewers enforce the substance.

## Cross-references

- [`CONTRIBUTING.md`](../CONTRIBUTING.md) — AI disclosure, human co-sign, coupled-release protocol, versioning policy.
- [`AGENTS.md`](../AGENTS.md) — repo-level overview for any agent opening this repo fresh.
- [`docs/decisions/`](../docs/decisions/) — decision records cited from principle prose. The behavioral-MUST reasoning
  that shapes P1's current wording lives here.
- [`../VERSION`](../VERSION) — spec version; bumped alongside principle tier changes.
- [`../CHANGELOG.md`](../CHANGELOG.md) — grouped by principle; generated from PR `## Changelog` sections.
