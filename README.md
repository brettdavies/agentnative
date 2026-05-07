# The Agent-Native CLI Standard

Eight principles for CLI tools operated by AI agents.

AI agents operate CLIs differently than humans do. They can't answer interactive prompts, can't parse vague output, and
can't recover from errors that don't say what to do next. The principles below define what *agent-native* means in RFC
2119 language, with machine-readable `requirements[]` so a checker (and graders) can pin against the standard.

**Early-stage spec.** Ideas, debate, and contributions are welcome: pressure-tests against any principle, real-CLI
grading submissions, counter-examples that argue a tier sits wrong, or new principles that the genre is missing. The
spec is published as `status: active` because the contracts are stable enough to cite, not because anything here is
locked. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for how to file each type.

## The four artifacts

- **Spec**: this repo. Eight RFC 2119 principles plus machine-readable `requirements[]` in YAML frontmatter. Currently
  v0.3.1; all principles ship as `status: active`.
- **Linter**: [`anc`](https://github.com/brettdavies/agentnative-cli). Scores any CLI repo against the spec. Pins
  against requirement IDs, not prose.
- **Skill bundle**: [`agentnative-skill`](https://github.com/brettdavies/agentnative-skill). Agent-facing guide that
  teaches agents how to invoke `anc` and remediate findings against the spec; vendors the principles for offline use.
- **Leaderboard**: [anc.dev/scorecards](https://anc.dev/scorecards). Top CLIs graded live; submit a PR to add yours.

## Quick start

```bash
brew install brettdavies/tap/agentnative
anc check .
```

Also installable via `cargo install agentnative` or platform-specific archives on
[GitHub Releases](https://github.com/brettdavies/agentnative-cli/releases).

Example output (from running `anc` against its own source):

```text
$ anc check .
P1 — Non-Interactive by Default
  [PASS] Non-interactive by default (p1-non-interactive)
  [PASS] Flags advertise env-var bindings in --help (p1-env-hints)

P2 — Structured Output
  [WARN] Structured output support (p2-json-output)
         --output/--format flag detected but could not validate JSON via safe probes
  [PASS] Centralized output module exists (p2-output-module)

P3 — Progressive Help
  [PASS] Help flag produces useful output (p3-help)
  [PASS] Version flag works (p3-version)

P4 — Actionable Errors
  [PASS] Structured error types (p4-error-types)
  [PASS] Exit codes use named constants (p4-exit-codes)

P5 — Safe Retries
  [PASS] Dry-run flag for write operations (p5-dry-run)

P6 — Composable Structure
  [PASS] Handles SIGPIPE gracefully (p6-sigpipe)
  [PASS] Respects NO_COLOR (p6-no-color)
  [PASS] Timeout flag for network ops (p6-timeout)

P7 — Bounded Responses
  [PASS] Quiet mode available (p7-quiet)
  [WARN] No naked println!/print! outside output modules (p7-naked-println)

Code Quality
  [FAIL] No .unwrap() in source (code-unwrap)

33 checks: 26 pass, 2 warn, 1 fail, 4 skip, 0 error
```

Run `anc check . --output json` for machine-readable output. Per-principle filtering via `anc check . --principle
<1-7>`.

## Live leaderboard

| Rank | CLI         | Score  |
| ---: | ----------- | ------ |
|    1 | `navi`      | 82/100 |
|    2 | `anc`       | 73/100 |
|    2 | `fzf`       | 73/100 |
|    3 | `fd`        | 64/100 |
|    3 | `jq`        | 64/100 |
|    4 | `gh`        | 55/100 |
|    4 | `git`       | 55/100 |
|    5 | `lazygit`   | 45/100 |
|    5 | `aws-cli`   | 45/100 |
|    6 | `shell-gpt` | 36/100 |

Full board (anc100) at [anc.dev/scorecards](https://anc.dev/scorecards). Submit a PR to grade an additional tool;
scoring is reproducible from the linter source.

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

## Badge

CLI tools whose scorecards meet the agent-native floor can embed a live-score badge in their READMEs:

```markdown
[![agent-native](https://anc.dev/badge/<tool>.svg)](https://anc.dev/scorecards/<tool>)
```

The badge text reflects the tool's current score from the live scorecard; clicking through shows the per-requirement
breakdown. See [`docs/badge.md`](docs/badge.md) for the claim convention: eligibility, embed URL, version pinning,
honesty expectation, regression behavior.

## Decision records

- [P1: behavioral MUST wording](docs/decisions/p1-behavioral-must.md): why the MUST describes observable behavior
  instead of enumerating prompt and TUI APIs, and what the automated-check verification boundary is.

## Related

- [anc.dev](https://anc.dev): the rendered spec site and live leaderboard
- [agentnative-cli](https://github.com/brettdavies/agentnative-cli): the `anc` linter
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
  tooling makes conformance verifiable so a CLI can claim agent-native and a reader can check.

Voice and identity decisions for the spec live in [`BRAND.md`](BRAND.md) and the spec-channel
[`.impeccable.md`](.impeccable.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for issue routing across spec/tool/site repos, AI disclosure requirements, the
human co-sign policy for spec changes, and the coupled release protocol.

## License

- **Spec text:** [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- **`anc` checker tool:** MIT or Apache-2.0
- **Scripts under `scripts/`:** MIT or Apache-2.0

See [LICENSE](LICENSE) for the full carve-out; per-file SPDX headers name the exact license per file.
