---
last-revised: 2026-04-20
---

# P6: Composable and Predictable Command Structure

## Definition

CLI tools MUST integrate cleanly with pipes, scripts, and other tools. That means handling SIGPIPE, detecting TTY for
color and formatting decisions, supporting stdin for piped input, and maintaining a consistent, predictable subcommand
structure.

## Why Agents Need It

Agents compose CLI tools into pipelines:

```bash
tool list --output json | jaq '.[] | .id' | xargs tool get
```

Every link in that chain has to behave predictably. A tool that panics on SIGPIPE when piped to `head` breaks the
pipeline. A tool that emits ANSI color codes into a pipe pollutes downstream JSON parsing. A tool with inconsistent
subcommand naming forces the agent to memorize exceptions rather than apply patterns. Composability is what makes a CLI
tool a building block rather than a dead end.

## Requirements

**MUST:**

- A SIGPIPE fix is the first executable statement in `main()`. Without it, piping output to `head`, `tail`, or any tool
  that closes the pipe early causes a panic:

  ```rust
  unsafe { libc::signal(libc::SIGPIPE, libc::SIG_DFL); }
  ```

- TTY detection, plus support for `NO_COLOR` and `TERM=dumb`. When stdout or stderr is not a terminal, color codes are
  suppressed automatically.
- Shell completions available via a `completions` subcommand (clap_complete in Rust; equivalents elsewhere). This is a
  Tier 1 meta-command — it works without config, auth, or network.
- Network CLIs ship a `--timeout` flag with a sensible default (30 seconds). Agents operating under their own time
  budgets need to fail fast rather than block on a slow upstream.
- If the CLI uses a pager (`less`, `more`, `$PAGER`), it supports `--no-pager` or respects `PAGER=""`. Pagers block
  headless execution indefinitely.
- When the CLI uses subcommands, agentic flags (`--output`, `--quiet`, `--no-interactive`, `--timeout`) are `global =
  true` so they propagate to every subcommand automatically.

**SHOULD:**

- Commands that accept input read from stdin when no file argument is provided. Pipeline composition depends on it.
- Subcommand naming follows a consistent `noun verb` or `verb noun` convention throughout the tool. Mixing patterns
  (e.g., `list-users` alongside `user show`) forces agents to learn exceptions.
- A three-tier dependency gating pattern: Tier 1 (meta-commands like `completions`, `version`) needs nothing; Tier 2
  (local commands) needs config; Tier 3 (network commands) needs config + auth. `completions` and `version` always work,
  even in broken environments.
- Operations are modeled as subcommands, not flags. `tool search "query"` is correct; `tool --search "query"` is wrong.
  Flags modify behavior (`--quiet`, `--output json`); subcommands select operations.

**MAY:**

- A `--color auto|always|never` flag for explicit color control beyond TTY auto-detection.

## Evidence

- `libc::signal(libc::SIGPIPE, libc::SIG_DFL)` (or the equivalent in the target language) as the first statement of
  `main()`.
- `IsTerminal` trait usage (`std::io::IsTerminal` or the `is-terminal` crate).
- `NO_COLOR` and `TERM=dumb` checks.
- `clap_complete` in `Cargo.toml`.
- A `completions` subcommand in the CLI enum.
- Tiered match arms in `main()` separating meta-commands from config-dependent commands.

## Anti-Patterns

- Missing SIGPIPE handler — `cargo run -- list | head` panics with "broken pipe".
- Hard-coded ANSI escape codes without TTY detection.
- Color output in JSON mode — ANSI codes inside JSON string values break downstream parsing.
- A `completions` command that requires auth or config to run.
- No stdin support on commands where piped input is a natural use case.

Measured by check IDs `p6-sigpipe`, `p6-no-color`, `p6-completions`, `p6-timeout`, `p6-agents-md`. Run
`agentnative check --principle 6 .` against your CLI to see each.
