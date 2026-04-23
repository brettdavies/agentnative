---
id: p1-behavioral-must
title: "P1 Non-Interactive — behavioral MUST wording"
date: 2026-04-20
status: accepted
affects: [p1-non-interactive-by-default]
---

# P1 Non-Interactive — behavioral MUST wording

## Context

P1 (Non-Interactive by Default) has one MUST about gating interactive surfaces. The open question was whether that MUST
should treat TTY-driving agents — tmux panes, `ssh -t` sandbox shells, `expect` automation, computer-use desktop agents
— as a first-class audience, or whether the canonical agent shape is "subprocess with piped stdin" only.

Three framings were on the table:

- **Framing A (original)**: enumerate the blocking APIs. "MUST NOT call `dialoguer::Confirm::new().interact()`,
  `inquire::...`, `readline()`, …". Broad MUST; tool authors can comply by grepping for known prompt-library calls.
- **Framing B**: split the principle. One MUST for subprocess-piped agents (prompt libraries), a sibling MUST for
  TTY-driving agents (TUI frameworks like `ratatui`, `bubbletea`). Two MUSTs, clear audience mapping.
- **Framing C**: scope P1 to subprocess-piped agents only. TTY-driving agents are out of scope for this principle;
  explicitly stated.

An adversarial reviewer flagged Framing A as a **category error**: prompt libraries are blocking single-call APIs; TUI
frameworks are event loops. Enumerating APIs across both conflates two kinds of thing. Framing B solves that but
fragments a single spec property into two principles for a distinction most readers don't care about. Framing C is
honest but narrows the spec's claim in a way that feels defensive.

## Options considered

- **A — Enumerate blocking APIs.** Rejected: category error between prompt libraries and TUI event loops.
- **B — Split into two principles (subprocess-piped MUST + TTY-driving MUST).** Rejected: fragments the spec for a
  distinction most readers don't care about, and creates a maintenance burden of keeping two principle pages aligned.
- **C — Scope P1 to subprocess-piped agents only.** Rejected: defensively narrow; agents *are* affected by the behavior
  this MUST describes regardless of whether `anc` can currently verify it.
- **D — Overclaim coverage.** Rejected: reader trust in the scorecard depends on the spec not claiming verification it
  does not have.
- **E — Behavioral MUST wording + honest scope note.** Accepted. The MUST describes the observable behavior ("does not
  enter any blocking-interactive surface") without enumerating APIs. A scope note in the principle explains that `anc`'s
  automated checks verify this under non-TTY stdin only; TTY-driving-agent pass verdicts are probable-but-not-verified.

## Decision

P1's MUST is worded in terms of observable behavior, not enumerated APIs:

> When `--no-interactive` is set, or when stdin is not a TTY, the tool does not enter any blocking-interactive
> surface — it uses defaults, reads from stdin, or exits with an actionable error. "Blocking-interactive surface"
> includes prompt library calls AND TUI session initialization.

The principle text carries a scope note that is explicit about the verification boundary: `agent` = a process invoking
the CLI as a subprocess; `anc`'s automated checks verify behavior under non-TTY stdin; TTY-driving-agent scenarios are
affected by the same MUST but are not PTY-probed at the current scale.

Applicability gates are named in the principle text. Universal MUSTs apply to every CLI; conditional MUSTs apply only
when the named surface exists (for example, headless auth is conditional on "CLI authenticates against a remote
service").

## Consequences

**Trust-positive:**

- The spec does not claim verification it does not have. Readers can see the verification boundary up front.
- The MUST survives new prompt libraries and new TUI frameworks without edits — it describes behavior, not APIs.
- Principle pressure-testers do not have to re-litigate the category error every time a new framework appears.

**Trust-negative (accepted):**

- A tool that passes `anc` verification but fails under a TTY-driving-agent workload would be formally MUST-compliant
  and still break for that audience. The scope note makes this gap visible rather than hiding it.

**Operational:**

- A PTY-probe verifier for TTY-driving-agent scenarios is on the deferred list (revisit trigger: telemetry shows
  TTY-driving-agent traffic is material). Adding it later does not change the MUST wording — it closes the verification
  gap the scope note already names.
- No sibling principle is created; P1 stays single. If a future principle restructuring consolidates "Headless-First
  Execution" MUSTs (`--no-interactive`, `--no-browser`, `--no-pager`, `--timeout`) across P1 and P6, this MUST moves
  unchanged.

## Provenance

This record is the public-repo successor to a pre-repo CEO plan's Doctrine Decision section. The category-error finding
against Framing A came from adversarial review and was integrated before the decision was finalized; the eng-review pass
reconciled applicability gates and the requirement-registry scope that later became this repo's frontmatter contract.
