# The Agent-Native CLI Standard

Seven principles for CLI tools operated by AI agents.

**Read the spec:** [anc.dev](https://anc.dev)

**Check your CLI:** [agentnative-cli](https://github.com/brettdavies/agentnative-cli)

## Principles

| # | Principle | Summary |
| --- | --- | --- |
| P1 | Non-Interactive by Default | Never block on TTY input during normal operation |
| P2 | Structured, Parseable Output | Offer machine-readable formats alongside human text |
| P3 | Progressive Help Discovery | Layer help from one-liner to full reference |
| P4 | Fail Fast with Actionable Errors | Distinct exit codes, structured error output, fix suggestions |
| P5 | Safe Retries and Explicit Mutation Boundaries | Idempotent reads, explicit mutation, dry-run support |
| P6 | Composable and Predictable Command Structure | Consistent grammar, composable subcommands |
| P7 | Bounded, High-Signal Responses | Predictable output size, pagination, filtering |

## Versioning

The spec uses semver-adjacent versioning:

- **MINOR** — new or changed MUSTs
- **PATCH** — SHOULD/MAY changes, prose edits

Each principle carries an independent `last-revised` date in frontmatter. The date updates when any MUST/SHOULD/MAY in
that principle changes tier, is added, or is removed. Prose-only edits do not update the date.

Current version: see [VERSION](VERSION).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Where to file issues (routing across spec, tool, and site repos)
- AI disclosure requirements
- Human co-sign policy for spec changes
- Coupled release protocol

## License

Spec text is available under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

The `anc` checker tool is separately licensed under MIT and Apache-2.0.

Scripts under `scripts/` (the principle-frontmatter validator, its regression fixtures, and the pre-push hook) are not
spec text; they are dual-licensed under either MIT or Apache-2.0 at your option, matching the `anc` checker. Each script
carries an `SPDX-License-Identifier: MIT OR Apache-2.0` header. See [`LICENSE`](LICENSE) for the carve-out,
[`LICENSE-MIT`](LICENSE-MIT), and [`LICENSE-APACHE`](LICENSE-APACHE).

## Related

- [anc.dev](https://anc.dev) — the rendered spec site
- [agentnative-cli](https://github.com/brettdavies/agentnative-cli) — the CLI linter that checks compliance
- [agentnative-site](https://github.com/brettdavies/agentnative-site) — the website source

## Decision records

- [P1 — behavioral MUST wording](docs/decisions/p1-behavioral-must.md) — why the MUST describes observable behavior
  instead of enumerating prompt and TUI APIs, and what the automated-check verification boundary is.
- [Naming — `agentnative`, `anc`, `anc.dev`](docs/decisions/naming-rationale.md) — the rationale behind the project
  name, the `anc` binary alias, and the `anc.dev` domain, plus the candidates that were rejected.
