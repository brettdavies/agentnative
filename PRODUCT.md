# PRODUCT.md: spec channel design context

Channel-specific design context for the **spec channel** of agentnative. Inherits the shared identity, voice anchor,
audiences, and universal anti-patterns from [`BRAND.md`](BRAND.md). Read that first.

## Channel: spec

The spec is pure prose in RFC 2119 register. It has no visual system: no palette, no typography stack, no code-block
treatment, no OG image. Those decisions belong to the site channel.

The spec's job is to define what "agent-native" means in machine-readable contracts (`requirements[]` frontmatter) plus
human-readable expansion (prose). Both are load-bearing; the design context is about the prose.

## Audience (narrowed)

- **Humans** implementing or evaluating CLIs against the standard. They are technically deep, skeptical, and arrived
  here because the README claim is testable. They want to know what the contract is, what the failure mode is when a CLI
  does not meet it, and how to verify. They read at desk speed.
- **AI agents** parsing `requirements[]` from frontmatter, consuming prose via `Accept: text/markdown`, and pinning
  against requirement IDs across versions. Their UX is "do anchors stay stable, do `requirements[]` IDs survive
  reorganizations, does the prose render cleanly to markdown."

## Register

The narrative below describes the spec channel's voice rules; the executable contract for the literal phrases lives in
[`styles/spec/README.md`](styles/spec/README.md), generated from the Vale rule pack at `styles/spec/*.yml`.

- **RFC 2119 throughout.** MUST / SHOULD / MAY are typographically distinct in render and load-bearing in prose.
  Lowercase forms are flagged by the rule pack.
- **Third-person standards register.** Contracts are stated about the CLI, not as imperatives directed at the reader.
- **Present tense.** "An agent calling a CLI cannot type." Not the conditional or hypothetical alternative.
- **No first-person plural.** The standard does not have beliefs; it has contracts.
- **No second-person imperative.** The spec describes the contract; the skill bundle addresses the reader.
- **No hedges in requirement bullets.** A clean MUST plus a clean conditional is enough.

## Spec-specific anti-patterns

These extend the universal bans in [`BRAND.md`](BRAND.md):

- **No verbatim quotation from any single synthesizer.** Where multiple sources converge on a contract, the spec's
  wording sounds like triangulation, not citation. Single-source phrasing is a backlog state to clear, not a desired
  property. The v0.3.1 de-verbatim pass cleared this for P1–P7's existing bullets; P8 (added in v0.4.0) is written in
  spec voice from the start, so no de-verbatim cleanup is owed against it.
- **No implementation leakage in MUSTs.** Clap APIs (`try_parse`, `global = true`), Rust idioms, framework names; these
  belong in `Evidence` sections or per-language appendices, never in the behavioral MUST. The MUST is the contract; the
  language-specific realization is downstream.
- **No false canonicalization.** When a bullet names a citable, single-shape pattern (RFC 8628's Device Authorization
  Grant in P1; JSON Schema 2020-12 in P2), surrounding prose uses definite articles ("the X protocol") and cites the
  source. When a bullet names an outcome the implementer can satisfy any way (a non-leaky secret-input path, a
  graceful-shutdown window, an update-check pattern), prose uses indefinite articles and avoids language that
  canonicalizes one shape. The MUST/SHOULD/MAY tier does not decide which case applies — open contracts exist at every
  tier; what decides is whether the spec is naming a thing the implementer adopts or a category the implementer fills.
  Reference implementations are "a reference for an X pattern," never "the X pattern" — they exemplify one shape, not
  canonicalize it.
- **No autobiographical framing in pressure-test notes.** Notes get recorded as findings, not autobiography. Use
  past-tense neutral voice ("Resolved: bullet rewritten to…"), not personal-narrative framing.
- **No marketing voice in `Why Agents Need It` sections.** The "why" is mechanical: what fails, why it fails, what an
  agent observes when it fails. Not "agents need this to be successful."

## Voice anchor application

The pattern in [`BRAND.md`](BRAND.md), specialized for the spec channel:

- Each principle's `Definition` opens with a contract claim.
- Each `Why Agents Need It` opens with a concrete failure mode an agent observes.
- Each requirement bullet states the contract first; the realization or example second.
- Each `Anti-Patterns` bullet names a specific failure shape, not a category.

## Status

This file is the spec channel's `PRODUCT.md`. The site channel's equivalent at `~/dev/agentnative-site/PRODUCT.md`
covers visual-system decisions; cross-channel content is in [`BRAND.md`](BRAND.md). Future skill-bundle and linter
channels add their own files when channel-specific decisions accumulate enough to earn one.
