# The Agent-Native CLI Standard

Eight principles for CLI tools operated by AI agents.

AI agents operate CLIs differently than humans do. They can't answer interactive prompts, can't parse vague output, and
can't recover from errors that don't say what to do next. The principles below define what *agent-native* means in RFC
2119 language, with machine-readable `requirements[]` so an auditor (and graders) can pin against the standard.

**Early-stage spec.** Ideas, debate, and contributions are welcome: pressure-tests against any principle, real-CLI
grading submissions, counter-examples that argue a tier sits wrong, or new principles that the genre is missing. The
spec is published as `status: active` because the contracts are stable enough to cite, not because anything here is
locked. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for how to file each type.

## The four artifacts

- **Spec**: this repo. Eight RFC 2119 principles plus machine-readable `requirements[]` in YAML frontmatter. Currently
  v0.4.0; all principles ship as `status: active`.
- **Linter**: [`anc`](https://github.com/brettdavies/agentnative-cli). Scores any CLI repo against the spec. Pins
  against requirement IDs, not prose.
- **Skill bundle**: [`agentnative-skill`](https://github.com/brettdavies/agentnative-skill). Agent-facing guide that
  teaches agents how to invoke `anc` and remediate findings against the spec; vendors the principles for offline use.
- **Leaderboard**: [anc.dev/scorecards](https://anc.dev/scorecards). Top CLIs graded live; submit a PR to add yours.

## Quick start

```bash
brew install brettdavies/tap/agentnative
anc audit .
```

Also installable via `cargo install agentnative` or platform-specific archives on
[GitHub Releases](https://github.com/brettdavies/agentnative-cli/releases).

Run `anc audit . --output json` for machine-readable scorecards. Per-principle filtering via `anc audit . --principle
<1-8>`. `anc emit schema` prints the scorecard JSON Schema (draft 2020-12) for downstream consumers. For a sample
scorecard, see the [`anc` README](https://github.com/brettdavies/agentnative-cli#example-output) or a live one at
[anc.dev/scorecards](https://anc.dev/scorecards).

## Principles

Each principle is a single file under [`principles/`](principles/). Click through for the full contract: definition, why
agents need it, the tiered requirements, evidence to look for, and anti-patterns.

| #                                                               | Principle                                     | Summary                                                       |
| --------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------- |
| [P1](principles/p1-non-interactive-by-default.md)               | Non-Interactive by Default                    | Never block on TTY input during normal operation              |
| [P2](principles/p2-structured-parseable-output.md)              | Structured, Parseable Output                  | Offer machine-readable formats alongside human text           |
| [P3](principles/p3-progressive-help-discovery.md)               | Progressive Help Discovery                    | Layer help from one-liner to full reference                   |
| [P4](principles/p4-fail-fast-actionable-errors.md)              | Fail Fast with Actionable Errors              | Distinct exit codes, structured error output, fix suggestions |
| [P5](principles/p5-safe-retries-mutation-boundaries.md)         | Safe Retries and Explicit Mutation Boundaries | Idempotent reads, explicit mutation, dry-run support          |
| [P6](principles/p6-composable-predictable-command-structure.md) | Composable and Predictable Command Structure  | Consistent grammar, composable subcommands                    |
| [P7](principles/p7-bounded-high-signal-responses.md)            | Bounded, High-Signal Responses                | Predictable output size, pagination, filtering                |
| [P8](principles/p8-discoverable-skill-bundle.md)                | Discoverable Through Agent Skill Bundles      | Ship a skill bundle and an install path so agents find it     |

## Reading the spec

Every principle file pairs a machine-readable frontmatter block with prose in a fixed order: Definition, Why Agents Need
It, Requirements (MUST / SHOULD / MAY), Evidence, Anti-Patterns, and Pressure-test notes. Both halves are load-bearing:
machines parse the frontmatter, humans read the prose, and a CI validator keeps the two in sync.

The frontmatter carries a `requirements[]` array (one entry per MUST/SHOULD/MAY bullet) that auditors and graders pin
against instead of prose. Each entry has:

- **`id`**: a stable `p<n>-<level>-<slug>` identifier, unique across all eight files. Tooling references these, so they
  survive prose edits.
- **`level`**: `must`, `should`, or `may`, with [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) /
  [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174) semantics.
- **`applicability`**: `universal`, or conditional: gated on a prose `{if: "<reason>"}` clause, or on a
  machine-checkable `{kind: conditional, antecedent: {audit_id: "<id>"}}` whose named verifier decides whether the
  requirement binds.
- **`summary`**: one sentence, mirrored by the prose bullet.

[`principles/AGENTS.md`](principles/AGENTS.md) is the full authoring and governance contract: frontmatter fields,
requirement-ID conventions, the conditional-applicability propagation table, the `last-revised` discipline, the status
lifecycle, and the coupled-release protocol with the linter.

## Status

All eight principles are `status: active`. Published as part of the standard, not drafts. This is a working spec
accepting pressure-tests, not a manifesto. File substantive critique via the
[pressure-test issue template](https://github.com/brettdavies/agentnative/issues/new?template=pressure-test.yml); a
principle moves to `under-review` when a finding might change MUST/SHOULD/MAY tiers, then back to `active` once
resolved. See [`principles/AGENTS.md`](principles/AGENTS.md) for the full status lifecycle and pressure-test protocol.

## Versioning

The spec uses semver-adjacent versioning:

- **MINOR**: new or changed MUSTs
- **PATCH**: SHOULD/MAY changes, prose edits

Each principle carries an independent `last-revised` date in frontmatter. The date updates when any MUST/SHOULD/MAY in
that principle changes tier, is added, or is removed. Prose-only edits do not update the date.

Current version: see [VERSION](VERSION).

## Scoring

Conformance is scored against the requirement IDs in `requirements[]`, not against prose, and from **shipped-binary
behavior only**: behavioral-layer rows observed by running the tool, not its source or project layout. The status
taxonomy, the credit-weighted formula, the tunable tier weights, the 70% badge-eligibility floor, and the cohort bands
are all defined in [`principles/scoring.md`](principles/scoring.md). See [`docs/badge.md`](docs/badge.md) for the badge
claim convention.

## Badge

CLI tools whose scorecards meet the 70% floor (see [Scoring](#scoring)) can embed a live-score badge in their READMEs:

```markdown
[![agent-native](https://anc.dev/badge/<tool>.svg)](https://anc.dev/scorecards/<tool>)
```

For example, `anc` is scored against the spec and embeds its own live badge:

[![agent-native](https://anc.dev/badge/anc.svg)](https://anc.dev/scorecards/anc)

The badge text reflects the tool's current score from the live scorecard; clicking through shows the per-requirement
breakdown. See [`docs/badge.md`](docs/badge.md) for the claim convention: eligibility, embed URL, version pinning,
honesty expectation, regression behavior.

## Decision records

- [P1: behavioral MUST wording](docs/decisions/p1-behavioral-must.md): why the MUST describes observable behavior
  instead of enumerating prompt and TUI APIs, and what the automated-audit verification boundary is.

## Related

**Sibling repos.** This spec is the source of truth at the top of the chain; [`docs/syncs.md`](docs/syncs.md) maps how
its content propagates downstream.

- [agentnative-cli](https://github.com/brettdavies/agentnative-cli): the `anc` linter that scores any CLI against these
  principles.
- [agentnative-skill](https://github.com/brettdavies/agentnative-skill): the agent-facing skill bundle that vendors the
  principles and teaches agents to invoke `anc` and remediate findings.
- [agentnative-site](https://github.com/brettdavies/agentnative-site): the website source behind
  [anc.dev](https://anc.dev) and the live leaderboard.

**In this repo.**

- [`principles/`](principles/): the eight principle files (the standard itself).
- [`principles/AGENTS.md`](principles/AGENTS.md): authoring and governance contract: frontmatter shape, requirement IDs,
  conditional applicability, status lifecycle, coupled-release protocol.
- [`principles/scoring.md`](principles/scoring.md): leaderboard scoring formula, status taxonomy, eligibility floor,
  cohort bands.
- [`docs/badge.md`](docs/badge.md): badge claim convention: eligibility, embed shapes, version pinning, regression
  behavior.
- [`docs/decisions/`](docs/decisions/): decision records for non-obvious spec choices.
- [`CONTRIBUTING.md`](CONTRIBUTING.md): contribution shapes, tier breakdown, AI disclosure, human co-sign, release
  protocol. [`CHANGELOG.md`](CHANGELOG.md) is the version history; [`RELEASES.md`](RELEASES.md) documents how a release
  is cut.

## Acknowledgements

The principles in this spec descend from multiple streams of agent-CLI thinking that converged in late 2025 and 2026,
not from a single source.

- **Foundational CLI doctrine**: Adam Wiggins' [12-factor methodology](https://12factor.net/) (the env-var contract in
  P1 inherits Factor III; the stdout-as-event-stream framing in P2 inherits Factor XI), the
  [POSIX Utility Conventions](https://pubs.opengroup.org/onlinepubs/9699919799/) (argument grammar, env-var naming), the
  [Command Line Interface Guidelines](https://clig.dev/) (load-bearing for P3, P5, and P6), Eric S. Raymond's
  [The Art of Unix Programming](http://www.catb.org/esr/writings/taoup/html/), the [NO_COLOR](https://no-color.org/)
  standard, and the [XDG Base Directory Specification](https://specifications.freedesktop.org/basedir-spec/).
- **Agent-CLI synthesis (parallel work, 2025–2026)**: Anthropic's
  [Writing tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents), Sriram Madapusi
  Vasudevan's [InfoQ pieces on AI-agent CLIs](https://www.infoq.com/articles/ai-agent-cli/) (2025-08), Cloudflare's
  [The CLI for all of Cloudflare](https://blog.cloudflare.com/cf-cli-local-explorer/) (2026-04), Andrej Karpathy on
  terminal-as-legacy-tech, the Speakeasy and AppleBOY/Wu three-layer (API/CLI/skills) architecture, Michael Yuan's
  compound-failure framing, and other contemporaneous voices on dev.to and Medium.
- **Trevin's [7 Principles for Agent-Friendly CLIs](https://x.com/trevin/status/2037250000821059933) (2026-03-26) and
  follow-up [10 Principles for Agent-Native CLIs](https://x.com/trevin/status/2051316002730991795) (2026-05-04)** named
  the genre and gave it momentum. Trevin's seven-axis decomposition is the proximate ancestor of this spec's initial
  draft.
- **What this project adds is mechanism**: the [`anc`](https://github.com/brettdavies/agentnative-cli) linter (with
  auto-fix runway), the [`agentnative-skill`](https://github.com/brettdavies/agentnative-skill) bundle that teaches
  agents how to invoke `anc` and remediate findings, the [live leaderboard](https://anc.dev/scorecards), the
  [score badge](docs/badge.md), and the cross-repo coupled-release norm. The principles above name the contract; this
  tooling makes conformance verifiable so a CLI can claim agent-native and a reader can audit.

Voice and identity decisions for the spec live in [`BRAND.md`](BRAND.md) and the spec-channel
[`PRODUCT.md`](PRODUCT.md).

## Contributing

Three shapes of contribution, in order of cost:

1. **Signal** (pressure-test against a principle, grading-finding for the leaderboard, or a spec question): file an
   issue with the matching template at
   [github.com/brettdavies/agentnative/issues/new/choose](https://github.com/brettdavies/agentnative/issues/new/choose).
2. **Proposal** (new principle, MUST/SHOULD/MAY tier change, applicability-clause change): open a design issue first;
   the maintainer signs off before spec text lands.
3. **Code**: PR against `dev` (per branch discipline). Spec edits, governance docs, release infrastructure, validator
   tooling.

Local setup:

```bash
git clone https://github.com/brettdavies/agentnative
cd agentnative
git config core.hooksPath scripts/hooks  # mirror CI locally on every push
bun scripts/validate-principles.mjs
```

The full tier breakdown, AI disclosure requirements, the human co-sign policy for spec changes, and the coupled release
protocol live in [`CONTRIBUTING.md`](./CONTRIBUTING.md). Cross-repo routing: linter bugs (false positives, scoring bugs)
go to [brettdavies/agentnative-cli](https://github.com/brettdavies/agentnative-cli/issues/new/choose); site bugs
(rendering, performance) to
[brettdavies/agentnative-site](https://github.com/brettdavies/agentnative-site/issues/new/choose).

## License

- **Spec text:** [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- **`anc` auditor tool:** MIT or Apache-2.0
- **Scripts under `scripts/`:** MIT or Apache-2.0

See [LICENSE](LICENSE) for the full carve-out; per-file SPDX headers name the exact license per file.
