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

Example output:

<!-- TODO: replace with actual `anc check` output before PR to main -->

```text
agentnative v0.3.0 — checking ./

P1 Non-Interactive by Default          PASS
P2 Structured, Parseable Output        PASS
P3 Progressive Help Discovery          FAIL  p3-must-subcommand-examples
P4 Fail Fast with Actionable Errors    PASS
P5 Safe Retries / Mutation Boundaries  PASS
P6 Composable Command Structure        PASS
P7 Bounded High-Signal Responses       WARN  p7-should-limit (recommended)

Score: 78/100
Run `anc check . --output json` for machine-readable output, or
`anc explain p3-must-subcommand-examples` for a remediation note.
```

## Live leaderboard

<!-- TODO: replace with actual anc100 scores before PR to main; preserve format -->

| Rank | CLI       | Score  |
| ---: | --------- | ------ |
|    1 | `gh`      | 89/100 |
|    2 | `git`     | 82/100 |
|    3 | `ripgrep` | 78/100 |
|    4 | `jq`      | 71/100 |
|    5 | `kubectl` | 67/100 |
|    6 | `aws`     | 54/100 |

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
