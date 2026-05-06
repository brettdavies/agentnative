# BRAND.md — agentnative voice and identity

Source of truth for the voice and identity of the agentnative standard. Shared across the spec, the website, the linter,
the skill bundle, and any future channel. Each channel inherits from this document and adds channel-specific register
and artifacts in its own `.impeccable.md`.

## Brand identity

**Three words: opinionated, precise, inviting.**

- **Opinionated.** The standard has a point of view. It does not enumerate tradeoffs and shrug; it states "MUST do X,
  here is the failure mode if you don't, here is the canonical fix." The point of view is what makes the standard worth
  citing.
- **Precise.** RFC 2119 language. Anchors stable and citable. Numbers measured, not asserted. Where a contract has a
  canonical realization (a flag spelling, an exit code, a path), it is named explicitly.
- **Inviting.** The reader (or agent handler) should want to keep reading. That comes from details: typography that
  rewards a slow read, prose that rewards a fast scan, code blocks that read like reference material a reader can trust.
  Inviting is not "friendly" and it is not "marketing." It rewards engagement.

## Voice anchor

Concrete before abstract. Show then tell. No filler adjectives. The standard speaks as a standard, not a person —
first-person singular is out — but every channel inherits the same sequence: state the contract, show the failure mode,
name the canonical fix.

## Audiences

Two first-class consumers across all channels:

- **Humans** evaluating, adopting, implementing, or extending the standard. Spec-channel readers are technically deep
  and arrive with skepticism; site-channel readers are time-pressured and may decide in 60 seconds whether to take the
  standard seriously; linter users invoke at the terminal. Each channel narrows further in its own `.impeccable.md`.
- **AI agents** consuming the standard programmatically — markdown via `Accept: text/markdown`, requirement IDs via
  frontmatter parsing, skill bundles via `SKILL.md`/`AGENTS.md` discovery, linter findings via JSON. Their UX is "do
  anchors stay stable, do IDs survive reorganizations, does the channel render cleanly across versions." This is not a
  nice-to-have — the agent audience is first-class. Decisions that improve a channel for humans at the cost of agent
  legibility are regressions.

## Universal anti-patterns

These bans apply across every channel:

- **No marketing register.** "We believe…", "We recommend…", "It's really important to…" — out. The standard speaks in
  the third person about contracts, not in the first person about beliefs.
- **No hedge words.** "Typically", "usually", "in most cases", "it is generally agreed" — out. MUST is the contract.
  SHOULD is the contract. Hedges undercut both.
- **No filler adjectives.** "Best-in-class", "robust", "leveraging", "synergy", "next-generation" — out. Concrete before
  abstract; the noun does the work.
- **No verbatim quotation from any single source.** Where multiple sources converge on a claim, the standard's wording
  sounds like triangulation, not citation. Lineage belongs in the README's `Acknowledgements` section, not in the
  contract.
- **No AI-slop fingerprints (visual channels).** Cyan/purple gradients, gradient text, glassmorphism, hero washes,
  dashboard card grids, side-stripe borders on callouts.
- **No second-favorite fonts (visual channels).** Inter, Plex, Fraunces, Lora, DM Sans, Space Grotesk, Instrument Serif,
  Outfit, Plus Jakarta Sans. The right answer for any new channel is further out than the catalog's first scroll.

## Voice anchors — concrete examples

| ✓                                                                                                                         | ✗                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| "CLI tools MUST run without human input."                                                                                 | "We believe CLI tools should be non-interactive because agents can't handle prompts."       |
| "Authentication failed: token expired (`expires_at: 2026-03-25T00:00:00Z`). Run `tool auth refresh` or set `TOOL_TOKEN`." | "Sorry, looks like authentication didn't work. Please try again."                           |
| "Numeric output is locale-independent: `.` decimal, no thousands grouping, regardless of `LC_NUMERIC`."                   | "We typically recommend C locale for JSON output to avoid potential issues across locales." |
| One distinctive typeface family with character.                                                                           | The reflex-default catalog.                                                                 |

## Channels

The shared identity above applies to every channel. Each channel adds register and artifacts in its own
`.impeccable.md`:

- **Spec** (`agentnative-spec/.impeccable.md`) — RFC 2119 register, third-person standards voice, present tense, no
  first-person plural, no implementation leakage in MUSTs.
- **Site** (`agentnative-site/.impeccable.md`) — visual system (palette, typography, code-block treatment, OG image),
  tech-stack decisions (SSG, Worker, content negotiation), JS budget, dark-mode design.
- **Skill bundle** — instructional voice, second-person imperative is allowed, agent-loadable.
- **Linter (`anc`)** — terse error messages, ≤80-column help text, four-part error rubric (offending value, constraint,
  valid example, remediation).

Skill-bundle and linter channels add their own `.impeccable.md` only when channel-specific decisions accumulate enough
to earn one. Today, the spec and site channels do.

## Sync

This document is the source of truth. The site syncs it via `scripts/sync-spec.sh` alongside `principles/*.md`,
`VERSION`, and `CHANGELOG.md`. The skill bundle and linter sync similarly when they grow brand-aware artifacts. A PR
that changes `BRAND.md` flags whether channel sync is needed; channel repos pick up the change in a follow-on PR.
