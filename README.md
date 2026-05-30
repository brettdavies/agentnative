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

Example output — behavioral audits only (the layer that drives the public score), `anc` run against its own source:

```text
$ anc audit . --binary

P1 — Non-Interactive by Default
  [PASS] Non-interactive by default (p1-must-no-interactive) (must)
  [SKIP] Non-interactive gate flag advertised in --help (p1-must-no-interactive) (must)
         target satisfies P1 via alternative gate (help-on-bare or stdin-primary)
  [PASS] Flags advertise env-var bindings in --help (p1-must-env-var) (must)
  [PASS] Secret-bearing flags expose stdin or *-file companion (p1-must-secret-non-leaky-path) (must)
  [PASS] `--help` advertises default values for flags (p1-should-defaults-in-help) (should)
  [PASS] Rich-TUI affordance for TTY contexts (p1-may-rich-tui) (may)

P2 — Structured Output
  [PASS] Structured output support (p2-must-output-flag) (must)
  [PASS] Structured-output CLI exposes its schema at runtime (p2-must-schema-print) (must)
  [PASS] --json / --jsonl short aliases for --output (p2-should-json-aliases) (should)
  [PASS] `--raw` flag for pipe-safe unformatted output (p2-may-raw-flag) (may)
  [SKIP] `--output` advertises additional formats beyond text/json (p2-may-more-formats) (may)
         no `--output` or `--format` flag advertised; vacuous skip for MAY-tier extra formats.
  [PASS] Bad invocation exits with structured usage-error code (2) (p2-must-exit-codes) (must)
  [PASS] Errors emit JSON envelope with `error`/`kind`/`message` under `--output json` (p2-must-json-errors) (must)
  [PASS] JSON success and error envelopes share their non-payload key set (p2-should-consistent-envelope) (should)

P3 — Progressive Help
  [PASS] Help flag produces useful output (p3-must-top-level-examples) (must)
  [PASS] Version flag works (`--version` plus short alias) (p3-must-version) (must)
  [PASS] Version flag works (`--version` plus short alias) (p3-should-version-short) (should)
  [PASS] `examples` subcommand or `--examples` flag for curated usage patterns (p3-may-examples-subcommand) (may)
  [PASS] Short `-h` summary differs from `--help` long form (p3-should-about-long-about) (should)
  [PASS] Each subcommand's `--help` ships at least one invocation example (p3-must-subcommand-examples) (must)
  [PASS] Help text pairs human and `--output json` example invocations (p3-should-paired-examples) (should)

P4 — Actionable Errors
  [PASS] Rejects invalid arguments (p4-must-exit-code-mapping) (must)
  [PASS] Error messages include a hint or remediation phrase (p4-must-actionable-errors) (must)
  [PASS] `--output json` produces JSON-formatted errors (p4-should-json-error-output) (should)

P5 — Safe Retries
  [SKIP] Destructive subcommands require `--force` or `--yes` (p5-must-force-yes) (must)
         no destructive subcommands detected; MUST applies conditionally to CLIs with destructive operations.
  [SKIP] Read and write surfaces are both visible in subcommand list (p5-must-read-write-distinction) (must)
         no recognizable read or write subcommand verbs; the read/write distinction is unobservable from the help surface alone.

P6 — Composable Structure
  [PASS] Handles SIGPIPE gracefully (p6-must-sigpipe) (must)
  [SKIP] Pager-using CLI ships --no-pager escape hatch (p6-must-no-pager) (must)
         no pager signal (less/more/$PAGER/--pager) in --help
  [PASS] Respects NO_COLOR (p6-must-no-color) (must)
  [PASS] Subcommand verbs follow community-standard names (p6-may-standard-names) (may)
  [PASS] `--color` flag for explicit color control (p6-may-color-flag) (may)
  [PASS] Input-accepting commands read from stdin when no file is given (p6-should-stdin-input) (should)
  [WARN] Subcommand naming follows a consistent verb/noun convention (p6-should-consistent-naming) (should)
         subcommand naming mixes verb-first (1) and noun-first (2) patterns. SHOULD-tier — pick `verb noun` or `noun verb` and apply it consistently so agents can predict names. Inspect `--help` to confirm; the verb list is a heuristic.
  [PASS] Operations are subcommands, not verb-shaped flags (p6-should-subcommand-operations) (should)

P7 — Bounded Responses
  [PASS] Quiet mode available (p7-must-quiet) (must)
  [PASS] `--verbose` flag for diagnostic escalation (p7-should-verbose) (should)
  [SKIP] `--limit` / `--max-results` flag for list operations (p7-should-limit) (should)
         no list-style subcommand detected (list/ls/search/query/find/show/get); vacuous skip for the list-only SHOULD.
  [SKIP] Cursor-based pagination flags for list traversal (p7-may-cursor-pagination) (may)
         no list-style subcommand detected; vacuous skip for the list-only MAY.
  [SKIP] `--timeout` flag for long-running operations (p7-should-timeout) (should)
         no long-running subcommand detected (serve/daemon/watch/tail/monitor/follow/run/start/stream); vacuous skip for the conditional SHOULD.
  [PASS] Help text advertises TTY-aware verbosity behavior (p7-may-auto-verbosity) (may)

P8 — Discoverable Skill Bundles
  [PASS] Skill bundle has install path (`tool skill install [<host>]`) (p8-must-bundle-install) (must)
  [PASS] `skill install --all` for multi-runtime install (p8-may-install-all) (may)
  [PASS] `skill update` / `skill upgrade` for bundle refresh (p8-may-bundle-update) (may)

43 audits: 34 pass, 1 warn, 8 skip

🏆 Score: 99% — your tool qualifies for the agent-native badge.
```

Run `anc audit . --output json` for machine-readable scorecards. Per-principle filtering via `anc audit . --principle
<1-8>`. `anc emit schema` prints the scorecard JSON Schema (draft 2020-12) for downstream consumers.

## Principles

| #   | Principle                                     | Summary                                                       |
| --- | --------------------------------------------- | ------------------------------------------------------------- |
| P1  | Non-Interactive by Default                    | Never block on TTY input during normal operation              |
| P2  | Structured, Parseable Output                  | Offer machine-readable formats alongside human text           |
| P3  | Progressive Help Discovery                    | Layer help from one-liner to full reference                   |
| P4  | Fail Fast with Actionable Errors              | Distinct exit codes, structured error output, fix suggestions |
| P5  | Safe Retries and Explicit Mutation Boundaries | Idempotent reads, explicit mutation, dry-run support          |
| P6  | Composable and Predictable Command Structure  | Consistent grammar, composable subcommands                    |
| P7  | Bounded, High-Signal Responses                | Predictable output size, pagination, filtering                |
| P8  | Discoverable Through Agent Skill Bundles      | Ship a skill bundle and an install path so agents find it     |

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

Conformance is measured against the requirement IDs in `requirements[]`, not against prose. The public score reflects
**shipped-binary behavior only**: behavioral-layer requirement rows observed by running the tool. Source- and
project-layer audits do not contribute to the leaderboard score.

Each behavioral row resolves to one of seven statuses:

| Status    | In denominator | Credit | Meaning                                          |
| --------- | -------------- | ------ | ------------------------------------------------ |
| `pass`    | yes            | 1.0    | Behavior present and correct.                    |
| `warn`    | yes            | 0.5    | Behavior present, partially correct.             |
| `fail`    | yes            | 0.0    | Behavior expected, absent or broken.             |
| `opt_out` | yes            | 0.0    | Behavior deliberately declined (counts against). |
| `n_a`     | no             | —      | Inapplicable: a conditional antecedent is unmet. |
| `skip`    | no             | —      | Unmeasurable: the probe could not determine.     |
| `error`   | no             | —      | The probe raised an exception.                   |

Under the current flat tier weights, the score is a credit-weighted ratio over the denominator set (`pass`, `warn`,
`fail`, `opt_out`); `n_a`, `skip`, and `error` drop out of both sides:

`score_pct = round(100 × (n_pass + 0.5 · n_warn) / (n_pass + n_warn + n_fail + n_opt_out))`

[`principles/scoring.md`](principles/scoring.md) is the authoritative contract: the full weighted formula, tunable tier
weights, the 70% badge-eligibility floor, and the cohort bands (Exemplary ≥ 85, Strong 80–84, Solid 75–79, Qualified
70–74). See [`docs/badge.md`](docs/badge.md) for the badge claim convention and the
[`anc` linter README](https://github.com/brettdavies/agentnative-cli#scoring) for implementation detail (audit profiles,
audit-layer isolation, coverage-summary fields).

## Badge

CLI tools whose scorecards meet the 70% floor (see [Scoring](#scoring)) can embed a live-score badge in their READMEs:

```markdown
[![agent-native](https://anc.dev/badge/<tool>.svg)](https://anc.dev/scorecards/<tool>)
```

The badge text reflects the tool's current score from the live scorecard; clicking through shows the per-requirement
breakdown. See [`docs/badge.md`](docs/badge.md) for the claim convention: eligibility, embed URL, version pinning,
honesty expectation, regression behavior.

## Decision records

- [P1: behavioral MUST wording](docs/decisions/p1-behavioral-must.md): why the MUST describes observable behavior
  instead of enumerating prompt and TUI APIs, and what the automated-audit verification boundary is.

## Related

- [anc.dev](https://anc.dev): the rendered spec site and live leaderboard
- [agentnative-cli](https://github.com/brettdavies/agentnative-cli): the `anc` linter
- [agentnative-skill](https://github.com/brettdavies/agentnative-skill): the agent-facing skill bundle that vendors the
  principles and teaches agents to invoke `anc` and remediate findings
- [agentnative-site](https://github.com/brettdavies/agentnative-site): the website source

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
