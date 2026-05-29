---
title: "feat: P2 + P4 output-envelope SHOULDs — uniform success/error JSON on stdout, --output applies to every subcommand, typed reason field"
type: feat
status: shipped
date: 2026-04-29
shipped: 2026-05-07
shipped-via: v0.4.0 PR #25 (squash 14f4814) — P2/P4 envelope SHOULDs landed alongside P8 addition
branch: feat/p2-p4-output-envelope-shoulds
base: dev
---

# feat: P2 + P4 output-envelope SHOULDs

## Overview

Reconcile the agent-native CLI output convention so the spec matches the on-the-ground best practice that has emerged
across the three-repo ecosystem (agentnative-cli, agentnative-skill, agentnative-site) and is now documented as the "anc
CLI output envelope pattern" in `docs/solutions/architecture-patterns/anc-cli-output-envelope-pattern-2026-04-29.md`.
Three changes:

1. **Correct `p2-must-json-errors`** — current spec says JSON errors go to **stderr**; the implementation reality (`anc
   audit --output json` emits structured `error` status entries on stdout, and the project-wide envelope pattern doc
   puts the success/error envelope on stdout) is **stdout**. The MUST as written is behind the implementation. Fix the
   MUST to require stdout.
2. **Add `p2-should-output-applies-to-every-subcommand`** — make explicit that `--output` is per-subcommand, not just a
   top-level switch. A multi-verb CLI silently ignoring `--output json` on a subset of verbs violates P2 in spirit but
   not in current letter.
3. **Add `p4-should-typed-error-reason`** — error envelopes carry a typed kebab-case `reason` field, not English in
   display strings. Cross-references the agentnative-cli solutions doc
   `cli-structure-for-machines-typed-json-fields-over-display-strings-2026-04-20.md`.

The plan is **Modest** depth — one MUST correction, two SHOULD additions, prose updates, plus the coupled-release ripple
to the three downstream repos.

---

## Problem Frame

The output convention has drifted between three artifacts:

| Artifact                                                                                                    | What it says                                                                                                                                    | Conflict with the others                              |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `principles/p2-structured-parseable-output.md` (`p2-must-json-errors`)                                      | "errors are emitted as JSON (to stderr)"                                                                                                        | Disagrees with implementation and pattern doc         |
| `agentnative-cli` source (`anc audit --output json`)                                                        | Emits a single structured scorecard on **stdout** that includes `error` status entries inline                                                   | Disagrees with the spec MUST                          |
| `docs/solutions/architecture-patterns/anc-cli-output-envelope-pattern-2026-04-29.md` (umbrella pattern doc) | "Stdout always carries a structured envelope when `--output json` is set. The `status` field switches the payload" — for both success and error | Aligns with implementation, contradicts the spec MUST |

The implementation and the new umbrella pattern doc agree. The spec is the outlier. This plan brings the spec into
alignment.

A second drift surfaced during the `anc skill install` eng review (2026-04-29): the original plan scoped `--output
{text,json}` to the dry-run path only, with silent-ignore on the live exec path. An independent reviewer flagged that as
a P2 violation. The agreed shape now applies `--output {text,json}` on every output-producing path, but the spec does
not currently require this — it requires `--output` at the CLI top level (per `p2-must-output-flag`) without specifying
that every subcommand must honor it consistently. A multi-verb CLI today can technically pass the spec while only
honoring `--output json` on some of its verbs.

A third drift: error envelopes are well-served by typed identifiers (e.g., `reason: "destination-not-empty"`) rather
than English in `message` fields. P4 currently requires `error`, `kind`, and `message` fields but does not require the
machine-typed identifier as a separate field. The implementation already does this in places, and the
`cli-structure-for-machines` solutions doc captures the broader pattern; the spec should follow.

---

## Requirements Trace

- **R1.** Modify `p2-must-json-errors` summary and prose: change "to stderr" → "to stdout, as a structured envelope
  matching the success-path envelope shape". The MUST keeps the required fields (`error`, `kind`, `message`) but adds
  that they are wrapped in the same envelope as success responses, with a `status: "error"` discriminator. Stderr may
  still carry a human-readable text echo of the error; that is in addition to, not in place of, the stdout JSON.
- **R2.** Add `p2-should-output-applies-to-every-subcommand`. Summary: "Every output-producing subcommand of a
  multi-verb CLI honors `--output text|json|jsonl`; silent-ignore on a subset of subcommands is a P2 violation." Prose:
  explain the rationale (agents shouldn't have to maintain a per-subcommand parsing branch), exempt verbs whose output
  is non-text-by-design (shell completions, raw passthrough), and reference the umbrella doc.
- **R3.** Strengthen `p2-should-consistent-envelope` prose to spell out the success/error parity contract: the same
  envelope shape on both paths, a `status` discriminator, and context fields (whatever the verb's success path would
  emit) preserved on the error path when knowable. Cross-reference the agentnative-cli
  `consistent-json-schema-across-success-and-error-paths-2026-04-20.md` solutions doc as the implementation pattern.
  This is a wording refinement of the existing SHOULD; not a new requirement, so no SHOULD-id allocation.
- **R4.** Add `p4-should-typed-error-reason`. Summary: "Error envelopes include a typed kebab-case `reason` identifier
  (e.g., `destination-not-empty`, `auth-token-expired`) in addition to the human-readable `message`. Agents
  pattern-match on `reason`; humans read `message`." Prose: example envelope showing `reason` and `message` together;
  rationale that embedding information in display strings turns the message into an unintentional API contract.
- **R5.** Update `last-revised:` on both `p2-*.md` and `p4-*.md` to the date the plan ships.
- **R6.** Bump `VERSION` per the repo's policy. R1 is a MUST modification (stderr → stdout) — that is a MINOR bump per
  `CONTRIBUTING.md` ("MINOR bumps on MUST changes"). The SHOULD additions (R2, R4) are PATCH-tier changes; the MINOR
  subsumes them.
- **R7.** Update `CHANGELOG.md` grouped by principle (P2, P4) with the three changes.
- **R8.** **Coupled-release ripple** — three downstream repos vendor `principles/*.md`, `VERSION`, and `CHANGELOG.md`.
  After this spec ships:
- `agentnative-cli` runs `scripts/sync-spec.sh`, regenerates `REQUIREMENTS` via `build.rs`, adds entries to
  `src/principles/registry.rs` for the new SHOULD ids (`p2-should-output-applies-to-every-subcommand`,
  `p4-should-typed-error-reason`), and adds source audits that enforce them. The MUST correction (R1) ripples through
  the existing JSON error path in `src/scorecard/mod.rs` and any verb that emits errors via stderr in JSON mode.
- `agentnative-skill` runs `scripts/sync-spec.sh` to refresh the bundled spec content.
- `agentnative-site` runs `scripts/sync-spec.sh` to refresh `content/` for the website.
- Each downstream repo's coupled PR is filed after the spec PR merges (per the existing coupled-release norm).

---

## Scope Boundaries

- No new MUSTs beyond R1 (the existing MUST is being corrected, not multiplied).
- No new MAYs in this plan. R2 and R4 are SHOULDs because they are recommendations agents benefit from but tools can
  pass P2/P4 today without strict adherence (an exemption table in the prose acknowledges legitimate cases).
- No changes to P1, P3, P5, P6, P7. The output-envelope discussion is bounded to P2 and P4.
- No build-tooling changes in this repo (the `scripts/validate-principles.mjs` schema already accepts new SHOULDs as
  long as they fit the existing requirement frontmatter shape; the regression fixtures in `scripts/__fixtures__/` may
  need a new positive case for the new SHOULDs but no negative case).
- No alteration of the exit-code table (the 0/1/2/77/78 set is unchanged).

### Deferred to Follow-Up Work

- **`p4-should-error-context-fields`** — formalize the "context fields preserved on the error path" rule (currently
  surfaced via the `consistent-json-schema-across-success-and-error-paths` solutions doc) into its own SHOULD. This plan
  absorbs that into R3's prose strengthening, but a future plan could promote it to a top-level SHOULD if the pattern
  hardens.
- **JSONL streaming envelope shape** — `p2-must-output-flag` already mentions `jsonl`, but the streaming envelope
  contract (per-line shape, when to emit a final summary line) is not specified. Out of scope here; tracked as a
  separate plan once a streaming verb is shipped in `agentnative-cli`.
- **Cross-spec audit that flag-set is consistent across verbs** — beyond R2's SHOULD, a stronger MUST that all verbs in
  a multi-verb CLI use the same `--output`/`--quiet`/`--dry-run` flag set is interesting but premature. Wait for
  evidence that the SHOULD is insufficient.

---

## Context & Research

### Relevant authoritative content

- `principles/p2-structured-parseable-output.md` — current frontmatter and prose for P2.
- `principles/p4-fail-fast-actionable-errors.md` — current frontmatter and prose for P4.
- `principles/AGENTS.md` — per-file structure and pressure-test protocol.
- `CONTRIBUTING.md` — coupled-release norm and MUST/SHOULD/MAY versioning policy.
- `VERSION` — current `0.3.0`, target `0.4.0` after this plan ships (MINOR bump).
- `scripts/validate-principles.mjs` — frontmatter schema validator; should pass unchanged for the new SHOULD entries.

### Cross-repo evidence the spec is behind reality

- **`agentnative-cli` umbrella pattern doc** —
  [`docs/solutions/architecture-patterns/anc-cli-output-envelope-pattern-2026-04-29.md`](https://github.com/brettdavies/solutions-docs/blob/main/architecture-patterns/anc-cli-output-envelope-pattern-2026-04-29.md)
  (commit `d6a8922` in `brettdavies/solutions-docs`). Captures the four rules: every write verb has `--dry-run`; every
  output-producing verb has `--output`; `--output json` applies to both dry-run and live paths; envelope is uniform
  across success and error.
- **`agentnative-cli` cluster of 2026-04-20 best-practices docs** — consistent-json-schema-on-both-paths,
  agent-native-semantic-json-fields, cli-structure-for-machines, rust-clap-try-parse, cli-env-vars-must-appear-in-help.
  The umbrella doc is the new project-wide enforced convention; the cluster is the underlying patterns.
- **`agentnative-cli` eng-review of `anc skill install`** —
  `agentnative-cli/docs/plans/2026-04-29-002-feat-skill-subcommand-plan.md` `## GSTACK REVIEW REPORT` and `## Plan
  Rewrite Brief` sections. Decision lineage: D2, C1, OV1.
- **Implementation verification** — `anc audit . --output json` in `agentnative-cli`: error status entries appear on
  stdout in the scorecard's `groups[].audits[].status: "error"`, not on stderr.

### Versioning policy

Per `CONTRIBUTING.md`:

> MINOR bumps on MUST changes; PATCH on SHOULD/MAY changes.

R1 changes a MUST's wording (stderr → stdout). MINOR bump: `0.3.0` → `0.4.0`. R2/R4 (new SHOULDs) and R3 (SHOULD prose
clarification) are subsumed into the same release.

---

## Key Technical Decisions

- **MUST correction over additive SHOULD.** Two paths considered for reconciling stderr-vs-stdout: (a) modify the MUST
  to say stdout, (b) keep the MUST as-is and add a SHOULD that recommends stdout. Path (a) wins because the existing
  MUST is *factually inconsistent with how every consumer of the spec actually behaves*. Keeping a MUST that nobody
  follows is worse than a MINOR version bump. The `last-revised` plus CHANGELOG entry document the intent for anyone
  surprised by the change.
- **No new MUSTs in this plan.** R2 and R4 land as SHOULDs because reasonable exemptions exist (non-text-output verbs
  for R2; very small CLIs that ship one error reason for R4). MUSTs raise the bar for "does this CLI pass" — better to
  let SHOULDs prove out across multiple consumers before promoting any of them.
- **Wording refinement vs new SHOULD for envelope parity.** R3 strengthens existing `p2-should-consistent-envelope`
  rather than adding a new SHOULD-id. The existing SHOULD already says "consistent envelope across every command"; the
  refinement spells out what "consistent" requires (success/error shape parity, status discriminator, context-field
  preservation). Adding a new SHOULD-id for "envelope parity" would fragment the requirement; refining the existing one
  keeps the contract stable.
- **Coupled-release timing.** This plan ships in spec first, then the three downstream repos vendor in coupled PRs. The
  coupled-PR norm is established (`CONTRIBUTING.md` references it; the requirement-id frontmatter migration plan
  followed it). No exception here.

---

## Open Questions

### Resolved during planning

- **Stderr-vs-stdout for JSON errors** → resolved: stdout. Implementation, umbrella doc, and best-practice cluster
  agree.
- **MUST correction or additive SHOULD** → resolved: MUST correction (R1).
- **VERSION bump tier** → resolved: MINOR (`0.3.0` → `0.4.0`) per `CONTRIBUTING.md`.

### Deferred to implementation

- **Exact wording of the MUST prose** for R1: keep "to stdout, as a JSON envelope" minimal vs. inline the success/error
  parity contract. Implementer's call; recommend the minimal MUST + cross-reference to the strengthened SHOULD (R3) for
  the parity details.
- **Whether to add a positive regression fixture** to `scripts/__fixtures__/` for the new SHOULDs. Existing fixtures
  validate the schema mechanics; adding entries for the new SHOULD ids costs nothing and exercises the validator
  end-to-end. Recommend yes.
- **Whether to mention the umbrella pattern doc in the spec prose itself.** The umbrella doc lives in
  `agentnative-cli/docs/solutions/`; the spec is canonical and should not depend on a sibling repo's doc. Recommend
  citing the doc in `CHANGELOG.md` (release notes) but not in the spec prose itself. Spec prose stays self-contained.

---

## Implementation Units

- **U1. Modify `p2-must-json-errors` (R1)**
- **Files:** `principles/p2-structured-parseable-output.md`
- **Approach:** Update the requirement's `summary:` field and the corresponding MUST bullet in the prose. Keep the
  required fields (`error`, `kind`, `message`) but specify that they live inside the success/error envelope on stdout,
  with `status: "error"` as the discriminator. Add a sentence noting stderr may carry a human-readable text echo
  additionally, but the JSON envelope on stdout is the contract.
- **Verification:** `node scripts/validate-principles.mjs` passes; `last-revised:` bumped to today; manual diff review
  for prose clarity.

- **U2. Add `p2-should-output-applies-to-every-subcommand` (R2)**
- **Files:** `principles/p2-structured-parseable-output.md`
- **Approach:** Append a new entry to the `requirements:` list with `id: p2-should-output-applies-to-every-subcommand`,
  `level: should`, `applicability: universal`, summary as in R2. Add a corresponding SHOULD bullet in the prose with
  rationale and an exemption note for verbs whose output is non-text-by-design.
- **Verification:** `validate-principles.mjs` passes; the new id appears in the schema's recognized set; pressure-test
  the exemption note with the `Completions` clap arm in `agentnative-cli` as the example case.

- **U3. Strengthen `p2-should-consistent-envelope` prose (R3)**
- **Files:** `principles/p2-structured-parseable-output.md`
- **Approach:** Existing SHOULD wording stays; the prose under "SHOULD" is expanded to spell out (a) success/error shape
  parity, (b) `status` discriminator, (c) context-field preservation on the error path. No frontmatter id change.
- **Verification:** `validate-principles.mjs` passes; manual diff review.

- **U4. Add `p4-should-typed-error-reason` (R4)**
- **Files:** `principles/p4-fail-fast-actionable-errors.md`
- **Approach:** Append a new entry to the `requirements:` list with `id: p4-should-typed-error-reason`, `level: should`,
  `applicability: universal`, summary as in R4. Add a SHOULD bullet in the prose with a success-vs-error envelope
  example showing `reason` and `message` side by side.
- **Verification:** `validate-principles.mjs` passes; pressure-test the wording with the `cli-structure-for-machines`
  solutions doc's typed-fields rule.

- **U5. Bump `VERSION`, update `CHANGELOG.md` (R6, R7)**
- **Files:** `VERSION`, `CHANGELOG.md`
- **Approach:** `VERSION` → `0.4.0`. `CHANGELOG.md` gains a new section under `[Unreleased]` (or a new MINOR section if
  the release process inserts one), grouped by principle:
- **P2:**
- Corrected `p2-must-json-errors` to require JSON errors on stdout (was stderr); brings the spec in line with existing
  implementations and the cross-repo umbrella pattern doc.
- Added `p2-should-output-applies-to-every-subcommand`: every output-producing subcommand of a multi-verb CLI honors
  `--output text|json|jsonl`.
- Strengthened `p2-should-consistent-envelope` prose to specify success/error shape parity, the `status` discriminator,
  and context-field preservation on the error path.
- **P4:**
- Added `p4-should-typed-error-reason`: error envelopes include a typed kebab-case `reason` identifier alongside the
  human-readable `message`.
- **Verification:** `CHANGELOG.md` parses with the existing release tooling; version-derivation script (if any) reads
  `0.4.0` correctly.

- **U6. Coupled-release tracking (R8)**
- **Files:** None in this repo. Filed as separate planning work in each downstream repo after the spec PR merges.
- **Approach:** Open three issues (or one tracking issue with three checkboxes) in this repo's tracker covering:
- `agentnative-cli` companion PR: `scripts/sync-spec.sh`, registry entries, source audits for the new SHOULDs,
  reconciliation of any stderr-emitting JSON error path with the new MUST.
- `agentnative-skill` companion PR: `scripts/sync-spec.sh` only (no semantic changes; bundled spec refresh).
- `agentnative-site` companion PR: `scripts/sync-spec.sh` only (content refresh for the website).
- **Verification:** Each downstream PR cites the spec version and links back to the spec PR; the spec repo's tracker
  shows all three resolved before the spec is considered fully landed.

---

## System-Wide Impact

- **Authoritative content shifts:** Two principle files change; one `requirements:` entry is modified, two are added,
  one prose section is strengthened. `VERSION` bumps MINOR. `CHANGELOG.md` gains a release section.
- **Schema impact:** `validate-principles.mjs` should pass unchanged (the schema already accepts SHOULD-tier entries
  with the standard fields). New regression fixtures in `scripts/__fixtures__/` are recommended but optional.
- **Downstream impact:** Three coupled PRs (cli, skill, site). The `agentnative-cli` PR is the substantial one — it adds
  registry entries and source audits for two new SHOULDs and reconciles any existing stderr-emitting JSON error path
  with the corrected MUST. The `agentnative-skill` and `agentnative-site` PRs are sync-only.
- **Backward compatibility:** Tools that already follow the umbrella pattern (`anc` and any sibling that learned from
  the same review cycle) are now spec-compliant retroactively. Tools that strictly followed the previous
  `p2-must-json-errors` MUST (errors on stderr) become spec-non-compliant on the MUST tier — the MINOR bump signals
  this.
- **Site impact:** The `/p2` and `/p4` pages on `anc.dev` re-render to reflect the new requirements. No URL changes.

---

## Risks & Dependencies

| Risk                                                                                                                                     | Mitigation                                                                                                                                                                                                                                                                                                                           |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A consumer relies on the previous stderr-only error contract and the MINOR bump silently breaks them.                                    | The MINOR bump is the contract; consumers pin a `SPEC_VERSION` and re-vendor deliberately. CHANGELOG.md spells out the breaking-on-MUST nature of the change. The umbrella pattern doc + agentnative-cli implementation are the de-facto reference; consumers in the same orbit are already aligned.                                 |
| Pressure-test surface for the new SHOULDs is thin.                                                                                       | The umbrella pattern doc cites multiple implementations of the rules across this orbit. Open `pressure-test` issues against the new SHOULDs after merge to gather more grounding.                                                                                                                                                    |
| Coupled-release lag — spec ships before downstream consumers vendor.                                                                     | Existing pattern: file the spec PR first, downstream PRs cite it. Tracker issue keeps the three coupled PRs visible until all merge.                                                                                                                                                                                                 |
| Wording of "stdout envelope on error" conflicts with established stderr norms in adjacent ecosystems (POSIX `sysexits.h`, classic Unix). | The spec already diverges from strict POSIX (the 77/78 codes are documented as "blend the bash 0/1/2 convention with BSD `sysexits.h`"); a stdout-envelope rule for the structured-output mode specifically is consistent with that posture. Stderr remains the channel for human-readable error text alongside the stdout envelope. |
| Adding a typed `reason` field is duplicative with the existing `kind` field on JSON errors.                                              | Address in U4's prose: `kind` is the broad category (auth, config, network); `reason` is the specific variant within that category (auth-token-expired, auth-mfa-required). Both fields together let agents pattern-match at two levels of granularity.                                                                              |

---

## Documentation / Operational Notes

- **CHANGELOG.md voice:** Per `agentnative-spec/CONTRIBUTING.md`, the changelog speaks as the standard. Lead with what
  changed, then why; keep grouping by principle.
- **`last-revised:` discipline:** Both `p2-*.md` and `p4-*.md` get bumped. `CONTRIBUTING.md` already codifies that MINOR
  bumps include `last-revised:` updates on touched principles.
- **No publish-workflow surface:** The repo doesn't build artifacts; the spec is a markdown publish. Downstream repos
  re-vendor.

---

## Sources & References

- This repo's authoritative content: `principles/p2-*.md`, `principles/p4-*.md`, `principles/AGENTS.md`,
  `CONTRIBUTING.md`, `VERSION`.
- Implementation evidence: `agentnative-cli/src/scorecard/`, `agentnative-cli/src/cli.rs`,
  `agentnative-cli/src/main.rs`'s existing `--output json` paths.
- Umbrella pattern doc: `docs/solutions/architecture-patterns/anc-cli-output-envelope-pattern-2026-04-29.md` (in
  `brettdavies/solutions-docs`, commit `d6a8922`).
- Cross-repo cluster:
  `agentnative-cli/docs/solutions/best-practices/consistent-json-schema-across-success-and-error-paths-2026-04-20.md`,
  `agent-native-semantic-json-fields-over-stderr-warnings-2026-04-20.md`,
  `cli-structure-for-machines-typed-json-fields-over-display-strings-2026-04-20.md`,
  `rust-clap-try-parse-for-custom-error-handling-2026-04-20.md`, `cli-env-vars-must-appear-in-help-2026-04-20.md`.
- Sibling agentnative-cli plan whose eng review surfaced the divergence:
  `agentnative-cli/docs/plans/2026-04-29-002-feat-skill-subcommand-plan.md` (`## GSTACK REVIEW REPORT` and `## Plan
  Rewrite Brief` sections).
- Decision lineage IDs for the umbrella pattern: D2 (--dry-run not --print), C1 (always JSON envelope), OV1 (--output
  applies to live exec too).
