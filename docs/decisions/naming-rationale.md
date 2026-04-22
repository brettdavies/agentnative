---
id: naming-rationale
title: "Naming — `agentnative`, binary alias `anc`, domain `anc.dev`"
date: 2026-03-27
status: accepted
affects: [readme, agents-md, repo-layout]
---

# Naming — `agentnative`, binary alias `anc`, domain `anc.dev`

## Context

The project needed a single brand covering three surfaces: the **standard** (seven principles), the **checker** (Rust
CLI tool), and the **site** (public docs). Early working names followed the `agent{verb}` pattern (`agentlint`,
`agentcheck`, `agentaudit`, `agentprobe`). Every one of those names already had a package, a domain, or a GitHub project
in the AI agent tooling space — the `agent` prefix is a 2026 namespace graveyard. A collision on any registry meant a
lifelong `-cli` / `-tool` / `-rs` suffix and weaker SEO.

The decision here picks a brand for the whole stack in one shot — standard, CLI, and domain — and records the losing
candidates so future contributors do not re-litigate ground the research already covered.

## Options considered

Each candidate was checked against npm, PyPI, crates.io, and GitHub for namespace density. Results from March 2026:

| Name | npm | PyPI | crates.io | GitHub noise | Notes |
| --- | --- | --- | --- | --- | --- |
| `agentlint` | TAKEN (v0.3.0 security scanner) | TAKEN (v0.9.5, active) | available | 4+ projects | "lint" also technically wrong — 2/3 of checks are behavioral or project-file, not static source analysis |
| `agentcheck` | available | TAKEN (ghost v0.1.0) | available | 20 repos (largest 42 stars) | `agentcheck.io` exists; SEO collision |
| `agentaudit` | TAKEN (v3.14.0 active) | available | available | 26 repos | Direct collision in AI agent tooling |
| `agentprobe` | TAKEN | TAKEN | available | 22 repos (incl. 24-star near-identical-purpose repo) | Worst-case collision |
| `clint` | TAKEN (closure interrupt handlers, 6k dl) | TAKEN | TAKEN | — | Great name but dead end for a Rust binary |
| `litmus` | TAKEN (BDD harness, 9k dl) | TAKEN | TAKEN | — | Strong metaphor, zero namespace |
| `clivet` | available | available | available | — | Available but no "agent" in the name → discoverability loss |
| **`agentnative`** | **available** | **available** | **available** | **2 empty repos, 0 stars** | Cleanest namespace of every name evaluated |

## Decision

- **Crate / package / standard name:** `agentnative`
- **Binary alias:** `anc` (installed alongside `agentnative`, like `ripgrep` installs `rg`)
- **GitHub org / repos:** `brettdavies/agentnative-spec` (this repo, SoT), `brettdavies/agentnative-cli`,
  `brettdavies/agentnative-site`
- **Domain:** `anc.dev`

## Why `agentnative`

The checker verifies whether a CLI conforms to the "agent-native" standard. The term was already appearing in 2026 blog
posts and articles — and it followed an `agent{adjective}` pattern that nobody had claimed, rather than the crowded
`agent{verb}` pattern. The name *is* the concept: standard and tool share the same word. This is the WCAG model — the
standard and the tool named after it travel together.

## Why the `anc` alias

- 3 characters: `anc check .` or `anc .`
- Mnemonic: **A**gent-**N**ative **C**heck
- Available on crates.io at the time of decision
- Not a common shell command or alias on any major platform
- Follows the `ripgrep` → `rg`, `fd-find` → `fd`, `bat` precedent

`agentnative` handles discoverability (`cargo install agentnative`); `anc` handles daily ergonomics (`anc .`).

## Why `anc.dev`

- 7 characters, directly maps to the binary alias
- Registered 2026-04-17
- Reinforces the "standard and tool share a brand" model — readers land on `anc.dev` whether they came looking for the
  spec or the checker

## Consequences

**Discoverability:**

- Clean namespace on every major registry; no `-cli` / `-tool` / `-rs` suffix needed
- GitHub search for "agentnative" returns the project, not 20 unrelated repos

**Brand cohesion:**

- Spec, checker, site, and `anc` all reach for the same word. PR bodies, docs, and tool output cite the brand
  consistently.
- If a future principle restructuring or repo rename happens, the brand survives at the org and domain level.

**Accepted tradeoff:**

- `agentnative` is 11 characters — slightly long for package names by the `ripgrep`/`ruff`/`bat` convention. The `anc`
  alias absorbs the typing cost; the long name absorbs the descriptive role. This is the `ripgrep`/`rg` split applied to
  naming.

## References

The naming research drew on the "Poetics of CLI Command Names" (Smallstep), `clig.dev` guidelines, star-count patterns
of 16 successful CLI tools (`ripgrep`, `ruff`, `shellcheck`, `trivy`, `eslint`, `biome`, …), GitHub search-API data on
repo namespace density, and competitive analysis across npm, PyPI, crates.io, Homebrew, and GitHub for every `agent{X}`
candidate. Top CLI tools by stars (ripgrep 61k, prettier 51k, ruff 46k, shellcheck 39k) share a pattern — 4-10
characters, pronounceable, either fully descriptive or fully unique — that `agentnative` + `anc` approximates via the
two-name split.
