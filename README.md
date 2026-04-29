# The Agent-Native CLI Standard

Seven principles for CLI tools operated by AI agents.

AI agents operate CLIs differently than humans do — they can't answer interactive prompts, can't parse vague output, and
can't recover from errors that don't say what to do next. The principles below define what *agent-native* means in RFC
2119 language, with machine-readable `requirements[]` so a checker (and graders) can pin against the standard.

## The trifecta

- **Spec** — this repo. Seven RFC 2119 principles plus machine-readable `requirements[]` in YAML frontmatter. Currently
  v0.3.0; all principles ship as `status: active`.
- **Linter** — [`anc`](https://github.com/brettdavies/agentnative-cli). Scores any CLI repo against the spec. Pins
  against requirement IDs, not prose.
- **Leaderboard** — [anc.dev/scorecards](https://anc.dev/scorecards). Top CLIs graded live; submit a PR to add yours.

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

## Status

All seven principles are `status: active` — published as part of the standard, not drafts. This is a working spec
accepting pressure-tests, not a manifesto. File substantive critique via the
[pressure-test issue template](https://github.com/brettdavies/agentnative/issues/new?template=pressure-test.yml); a
principle moves to `under-review` when a finding may change MUST/SHOULD/MAY tiers, then back to `active` once resolved.
See [`principles/AGENTS.md`](principles/AGENTS.md) for the full status lifecycle and pressure-test protocol.

## Versioning

The spec uses semver-adjacent versioning:

- **MINOR** — new or changed MUSTs
- **PATCH** — SHOULD/MAY changes, prose edits

Each principle carries an independent `last-revised` date in frontmatter. The date updates when any MUST/SHOULD/MAY in
that principle changes tier, is added, or is removed. Prose-only edits do not update the date.

Current version: see [VERSION](VERSION).

## Decision records

- [P1 — behavioral MUST wording](docs/decisions/p1-behavioral-must.md) — why the MUST describes observable behavior
  instead of enumerating prompt and TUI APIs, and what the automated-check verification boundary is.

## Related

- [anc.dev](https://anc.dev) — the rendered spec site and live leaderboard
- [agentnative-cli](https://github.com/brettdavies/agentnative-cli) — the `anc` linter
- [agentnative-site](https://github.com/brettdavies/agentnative-site) — the website source

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for issue routing across spec/tool/site repos, AI disclosure requirements, the
human co-sign policy for spec changes, and the coupled release protocol.

## License

- **Spec text:** [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- **`anc` checker tool:** MIT or Apache-2.0
- **Scripts under `scripts/`:** MIT or Apache-2.0

See [LICENSE](LICENSE) for the full carve-out; per-file SPDX headers name the exact license per file.
