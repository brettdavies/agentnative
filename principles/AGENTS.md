# Principles folder: agent instructions

This folder holds the canonical specification of the 8 agent-native CLI principles. It is the **source of truth** for
every downstream consumer: the `anc` CLI linter (which reads the frontmatter to build its requirement registry), the
`anc.dev` site (which commits a copy of these files via `scripts/sync-spec.sh`), and any third party that cites the
standard.

Everything about this folder is optimized for one property: a principle's requirements can be mechanically extracted
from the file without parsing prose. Frontmatter carries the machine-readable contract; prose carries the human-readable
expansion.

Principle prose is enforced by the Vale rule packs at `styles/brand/` (universal anti-patterns) and `styles/spec/`
(spec-channel register). The pre-push hook runs the orchestrator at `scripts/prose-check.sh` against these files.
`BRAND.md` and `PRODUCT.md` carry the narrative identity the rule packs encode.

## What belongs here

- One file per principle: `p<n>-<slug>.md`, eight in total.
- This file (`AGENTS.md`), documenting the per-file shape and pressure-test protocol.

**Does not belong here:** website copy, CLI audit implementations, research extracts, per-tool scorecards, or any
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
status: active             # draft | under-review | active | locked
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

- `id`: lowercase principle code (`p1` through `p8`). Matches the filename prefix.
- `title`: human-readable principle title; mirrors the H1.
- `last-revised: YYYY-MM-DD`. Stamps **today's date** whenever any frontmatter field changes — `summary` rewrites,
  `applicability` shape migrations, tier changes, requirement add/remove, `status` flips, even reordering. Prose-only
  edits to the body below the closing `---` fence do not bump the date. Enforced by `scripts/check-last-revised.mjs` at
  pre-push and in PR CI; rerun with `--fix` to auto-stamp today's date on every violating file.
- `status`: lifecycle marker. `draft` when first extracted; `under-review` during a pressure-test cycle; `active` once
  the principle is published as part of the standard and accepting pressure-tests as normal-course feedback (default
  state for shipped principles); `locked` when edits are intentionally frozen for a defined review window. Routine
  pressure-tests against an `active` principle do **not** require flipping back to `under-review`. That flip is reserved
  for cycles producing substantive critique that may change MUST/SHOULD/MAY tiers.
- `requirements[]`: one entry per MUST/SHOULD/MAY bullet in the prose. Required fields per entry:
- `id`: `p<n>-<level>-<slug>`, lowercase-kebab, unique across all eight files.
- `level`: `must`, `should`, or `may` (lowercase). RFC 2119 semantics.
- `applicability`: one of three shapes. `universal` (bare string) applies to every CLI. `{if: "<reason>"}` is the
  prose-only conditional: the verifier interprets the reason via heuristics. `{kind: conditional, antecedent: {audit_id:
  "<id>"}}` is the machine-auditable conditional: the named `audit_id` resolves to a verifier whose status drives
  whether the consequent applies. See [Conditional applicability](#conditional-applicability) below for the propagation
  table and worked examples.
- `summary`: one sentence. Duplicated between frontmatter and prose; the prose bullet can expand with examples, but the
  first-sentence meaning must match.

The summary duplication is intentional. Machine consumers parse the frontmatter; humans read the prose. Keeping them in
sync is a review responsibility (enforced by the CI validator, see below).

### Conditional applicability

A requirement is conditional when it binds only if some prerequisite feature is present. The frontmatter carries two
shapes for this: `{if: "<reason>"}` for cases where no verifier yet probes the prerequisite, and `{kind: conditional,
antecedent: {audit_id: "<id>"}}` for cases where a verifier does. Both shapes coexist; an author chooses the
machine-auditable form whenever an `audit_id` for the prerequisite already exists in the CLI's verifier catalog. The
`{if: "<reason>"}` form remains valid for prerequisites the CLI does not yet probe — verifier authors interpret the
reason string via heuristics until a dedicated audit lands.

The `audit_id` value is a verifier identifier, not a requirement `id`. A single verifier may underwrite several
requirements (e.g., a probe that detects `--output json` underwrites both a tier-MUST output requirement and a tier-MUST
schema-print requirement). The CLI's verifier catalog is the namespace of legal `audit_id` values; the spec's validator
checks shape only (lowercase kebab) and leaves existence checking to the matrix builder.

#### Worked example: conditional MUST

```yaml
# Reads: "if a CLI ships --output json, it MUST also expose its JSON Schema."
- id: p2-must-schema-print
  level: must
  applicability:
    kind: conditional
    antecedent:
      audit_id: p2-json-output
  summary: "CLIs that emit structured output expose the output schema via a `schema` subcommand or `--schema` flag."
```

#### Worked example: conditional SHOULD

```yaml
# Reads: "if a CLI emits structured output, it SHOULD also export the schema to a stable file path."
- id: p2-should-schema-file
  level: should
  applicability:
    kind: conditional
    antecedent:
      audit_id: p2-json-output
  summary: "Output schemas are also exported to a stable file path so consumers pin without invoking the tool."
```

The two examples differ only in `level`. The antecedent-handling machinery is identical: the antecedent decides
*whether* the consequent applies; the tier decides the penalty severity *when* it does.

#### Antecedent-status propagation

The verifier observes the antecedent's status and emits the consequent according to this table:

| Antecedent status | Antecedent interpretation                | Consequent emits   |
| ----------------- | ---------------------------------------- | ------------------ |
| `pass`            | Feature present and working              | Evaluated normally |
| `warn`            | Feature present, partially OK            | Evaluated normally |
| `fail`            | Feature present, broken                  | Evaluated normally |
| `opt_out`         | Feature deliberately absent              | `n_a`              |
| `n_a`             | Feature itself was conditional and unmet | `n_a`              |
| `skip`            | Probe could not measure                  | `skip` (inherits)  |
| `error`           | Probe raised an exception                | `error` (inherits) |

The propagation table assumes the 7-status taxonomy (`pass`, `warn`, `fail`, `opt_out`, `n_a`, `skip`, `error`) that the
verifier emits per requirement row. Under the 5-status taxonomy that predates this work, `opt_out` and `n_a` map to
`skip` for consumers that have not upgraded; the propagation logic is forward-compatible.

The conditional asks "is the prerequisite feature present at all?" — not "is it fully compliant?" A tool with broken
JSON output still has JSON output, so the schema requirement still applies (and may also fail). Indeterminate antecedent
statuses (`skip`, `error`) propagate to the consequent because a dependent audit cannot be meaningfully evaluated when
its prerequisite is unmeasured.

Rows that need stricter propagation than the default (for example, requiring the prerequisite to be fully working before
the consequent applies) may opt in via an explicit `requires_status` field on the antecedent in a future schema
revision. The v1 schema omits the field so the common case stays minimal; adding it later is backward compatible.

#### Compound antecedents (deferred to v2)

The v1 schema supports single-antecedent conditionals only. If a requirement reads "if X AND Y, then MUST Z," current
modeling options are: split into two rows that depend on different single antecedents, or introduce a synthetic
intermediate verifier that the CLI composes internally and reference the synthetic from the row.

When real cases surface that cannot be modeled either way, v2 of the schema will gain an `antecedent` array with an `op:
all_of | any_of` discriminator. The v1 validator rejects any extra keys on `antecedent` so v2 drift is caught loudly
rather than silently coerced.

#### One result per requirement row

The verifier emits one result entry per requirement row (frontmatter `id`), not one per `audit_id`. A single probe whose
`audit_id` is shared across multiple requirements produces a separate result for each row, carrying that row's `id` and
`level` (as `tier`) in the result entry. The scorecard is self-contained: third-party consumers compute scores from the
scorecard alone without joining against the coverage matrix.

### Prose sections (fixed order)

1. **Definition.** One or two sentences. What the principle demands.
2. **Why Agents Need It.** The cost of violating it, expressed in agent-operational terms.
3. **Requirements.** MUST / SHOULD / MAY bullets using RFC 2119 language. Bullet count per level must equal the
   `requirements[]` count per level in frontmatter.
4. **Evidence.** What to look for when verifying compliance.
5. **Anti-Patterns.** What to reject.

Preserve section names and MUST/SHOULD/MAY structure on edits. Downstream tools (the site renderer, the CLI's vendored
copy, the coverage-matrix generator) scan for these boundaries.

## Validation

The pre-push hook runs `scripts/validate-principles.mjs` against every principle file (see
[`CONTRIBUTING.md` § Contributor setup](../CONTRIBUTING.md#contributor-setup)), which checks:

- Required frontmatter fields are present on every file.
- `requirements[].id` values are unique across all eight files.
- The number of MUST / SHOULD / MAY entries in `requirements[]` equals the number of MUST / SHOULD / MAY bullets in the
  prose.
- `applicability` is one of: the string `universal`, an object `{if: "<reason>"}`, or an object `{kind: conditional,
  antecedent: {audit_id: "<kebab>"}}`. Compound antecedents (`op`/`audits`) are rejected — they are deferred to v2.

Drift in any of these fails the push with an actionable message naming the file and the specific mismatch.

## Pressure-test protocol

Principles start as `status: draft`, ship as `status: active`, and only flip to `under-review` or `locked` for specific
reasons:

- `draft` → `active`: when the principle is published as part of a release. The default shipped state. Pressure-tests
  against an `active` principle are welcomed and tracked as ordinary issues via the `pressure-test.yml` template. No
  status flip required for normal-course feedback.
- `active` → `under-review`: only when a pressure-test cycle produces critique substantive enough that MUST/SHOULD/MAY
  tiers may change. Stays `under-review` until the cycle resolves.
- `under-review` → `active`: when findings are resolved (edited, demoted, merged, split, or `[wontfix]`-tagged) and the
  principle is stable again.
- `active` (or `under-review`) → `locked`: when edits are intentionally frozen for a defined review window. Use
  sparingly, because `locked` is a hard gate, not a quality marker.

The cycle for substantive critique:

1. Change status to `under-review`.
2. Run at least one of the tests below. Log findings at the bottom of the file in a `## Pressure test notes` section.
3. Resolve each finding: edit the principle, demote a MUST to SHOULD, merge with another principle, split into two, or
   reject the critique with a note explaining why.
4. When findings are exhausted and edits are stable for a review cycle, change status back to `active` (or `locked` if
   the principle is being explicitly frozen). Keep unresolved findings with a `[wontfix]` or `[later]` tag.

**Tests (choose at least one; more is better):**

- **Adversarial review.** Ask a separate reviewer (`/codex review`, a subagent, or a human) to find the weakest claim in
  the principle. Capture the critique verbatim in the notes section.
- **Real-CLI dogfood.** Grade 5+ real CLIs against the principle (`gh`, `jq`, `ripgrep`, `wrangler`, plus one
  intentionally bad CLI as a negative control). Record which CLIs pass/fail and on which specific requirement.
- **Requirement-level challenge.** For each MUST, ask: "Would a well-designed agent-facing CLI ever legitimately violate
  this?" If yes, the MUST may be wrong.

## Editing a principle

When a principle changes, the order of operations is:

1. Edit prose and frontmatter together: a new MUST bullet in prose needs a new `requirements[]` entry with matching
   `id`, `level`, `summary`, and `applicability`. Removing a bullet removes the corresponding entry.
2. If a requirement's tier changed (MUST ↔ SHOULD ↔ MAY) or a requirement was added/removed, bump `last-revised:` to
   today's date and bump `VERSION` (MINOR for MUST changes, PATCH for SHOULD/MAY changes; see `CONTRIBUTING.md`).
3. If a requirement `id` changed or was removed, note this in the PR body, because downstream `anc` consumers pin
   against IDs, and renaming an ID is a breaking change for their registry drift check.
4. Include a `## Changelog` section in the PR body naming the affected principle and the change.

## Coupled-release protocol

Any PR that changes a principle's `requirements[]` (add, remove, rename, or change `level`) triggers the coupled-release
norm documented in [`CONTRIBUTING.md`](../CONTRIBUTING.md#coupled-release-protocol). The PR body MUST include either:

- A link to a companion PR on `brettdavies/agentnative-cli` (the CLI's frontmatter-derived registry must accept the
  change, or a drift test fires), or
- The text "no audit changes needed" with a brief justification.

This is a documented norm, not a CI gate. The PR template enforces the field; reviewers enforce the substance.

## Cross-references

- [`CONTRIBUTING.md`](../CONTRIBUTING.md): AI disclosure, human co-sign, coupled-release protocol, versioning policy.
- [`AGENTS.md`](../AGENTS.md): repo-level overview for any agent opening this repo fresh.
- [`docs/decisions/`](../docs/decisions/): decision records cited from principle prose. The behavioral-MUST reasoning
  that shapes P1's current wording lives here.
- [`../VERSION`](../VERSION): spec version; bumped alongside principle tier changes.
- [`../CHANGELOG.md`](../CHANGELOG.md): grouped by principle; generated from PR `## Changelog` sections.
