---
date: 2026-05-06
topic: prose-check-stack
---

# Prose-check stack for spec and site repos

## Summary

A pre-push prose-check stack for `agentnative-spec` and `agentnative-site` using Vale (custom Brand and channel rule
packs plus selected built-in rules) and LanguageTool (grammar via `pool`). Once the rule packs land, they become
source-of-truth for enforceable voice rules; BRAND.md is restructured so its enforceable sections read as derivative
human-readable expansion of the packs. Architecture supports all four channels; spec and site enforce in v1.

---

## Problem Frame

Both repos publish prose at release time: the spec's principle text, the site's principle copy, README, RELEASES,
CHANGELOG, content. No automated prose check fires before release today; enforcement relies on attentive reading and
adjacent skill review (`/impeccable`).

BRAND.md and per-channel `.impeccable.md` files encode many explicit voice rules: banned phrases, RFC 2119 register,
channel-specific anti-patterns, required casing, banned typography references. Those rules exist only as human-readable
prose. A reader has to spot a violation; a tired reader misses one. When drift slips through, it lands in the canonical
artifact (the spec, the site) where it sets the bar for subsequent contributions and erodes the standard's authority:
the asymmetric cost that motivates the work.

Adjacent skills (`/impeccable`, the in-flight `unslop`) cover the semantic-judgment layer. They do not run automatically
before push, and they should not be the floor for catchable patterns that a deterministic linter can enforce in
milliseconds.

---

## Key Flows

- F1. Pre-push prose check
- **Trigger:** `git push` against any branch
- **Actors:** developer, pre-push hook, Vale, LanguageTool (via `pool`)
- **Steps:** hook fires; runs Vale across in-scope `*.md`; probes `pool` reachability; runs LanguageTool against the
  same files when reachable; aggregates findings; exits non-zero on any error-tier finding.
- **Outcome:** push proceeds when no errors; otherwise blocked with file/line/rule output.
- **Covered by:** R1, R2, R3, R7, R10

- F2. Manual prose check
- **Trigger:** developer invokes the prose-check script directly during authoring or review.
- **Actors:** developer, Vale, LanguageTool, `pool`
- **Steps:** script runs the same checks as the hook with the same output; supports a flag to scope to changed files
  only and a flag to surface warnings.
- **Outcome:** developer sees current prose health for the working tree.
- **Covered by:** R1, R3, R8

- F3. Rule-pack edit and sync
- **Trigger:** an enforceable voice rule needs to change.
- **Actors:** maintainer, spec repo, consuming repos, sync script.
- **Steps:** maintainer edits the rule pack in the spec repo; updates the derived BRAND.md sections; runs the sync
  script; commits to spec; consuming repos pick up the pack on their next sync.
- **Outcome:** spec, BRAND.md, and downstream copies remain coherent; rule pack remains source-of-truth for enforceable
  rules.
- **Covered by:** R5, R6, R9, R11

---

## Requirements

**Linting engine and scope**

- R1. Vale and LanguageTool run as the two-tier deterministic prose check; Vale handles rule-based enforcement,
  LanguageTool handles grammar and spelling.
- R2. The check runs only via two invocations: a pre-push git hook and a developer-invoked script. No CI workflow exists
  or fires on PR or release events.
- R3. The check covers all `*.md` in each repo except meta-docs: `docs/brainstorms/`, `docs/plans/`, `docs/research/`,
  `AGENTS.md`, and any path resolved through the `docs/solutions/` symlink.
- R4. v1 enforces in `agentnative-spec` and `agentnative-site` only. The rule architecture and sync mechanism support
  all four channels (`agentnative-spec`, `agentnative-site`, `agentnative-cli`, `agentnative-skill`); the cli and
  skill-bundle channels do not enforce until they earn channel `.impeccable.md` files.

**Rule packs and source-of-truth**

- R5. Once the rule packs land, they are source-of-truth for enforceable voice rules. BRAND.md is restructured so the
  sections that mirror enforceable rules become derivative human-readable expansion of the packs.
- R6. Non-enforceable identity content in BRAND.md (voice anchors, audience descriptions, channel definitions, rationale
  for anti-patterns) remains source-of-truth in BRAND.md. The split between derivative and source-of-truth sections is
  documented in the spec repo.
- R7. Vale uses three layers of rules: the custom Brand rule pack (universal, derived from BRAND.md), the per-channel
  rule pack (derived from each channel's `.impeccable.md`), and selected built-in rules from established style packs.

**Hosting and reachability**

- R8. LanguageTool runs on the `pool` host as a docker container, reachable over Tailscale from developer machines. The
  `bigdaddy` host is an acceptable mirror but not the primary. The check never runs against a LanguageTool instance on
  this developer's Mac.
- R9. The pre-push hook handles unreachable LanguageTool gracefully: it probes `pool` with a short timeout and skips
  LanguageTool with a notice rather than failing the push when the host is unreachable. Vale failures continue to block.

**Sync and contributor workflow**

- R10. The pre-push hook blocks the push on any Vale error-tier finding and on LanguageTool findings of equivalent
  confidence; warning-tier findings annotate but do not block. The standard git escape hatch remains available but is
  not endorsed.
- R11. The Brand rule pack is committed in the spec repo and synced into consuming repos via the existing
  `scripts/sync-spec.sh` mechanism, alongside the established `principles/*.md` / `VERSION` / `CHANGELOG.md` flow.
  Commit-a-copy, not submodule.

**Style-pack baseline**

- R12. The v1 deterministic baseline enables the `write-good` and `proselint` built-in Vale packs in full. Wholesale
  Microsoft, Google, and alex packs are not enabled.
- R13. Specific rules from Microsoft and Google packs may be cherry-picked into the configuration over time as new prose
  patterns surface. The coverage map across packs is not pre-built; rule additions are iterative and triggered by
  observed drift.

---

## Acceptance Examples

- AE1. **Covers R1, R3, R10.** Given a maintainer-edited principle file containing the phrase "we believe agents need…",
  when the maintainer pushes the branch, the pre-push hook fails with Vale flagging the banned phrase per the Brand rule
  pack and printing the file path, line, and rule name; the push is blocked.
- AE2. **Covers R8, R9.** Given the developer is offline (Tailscale unreachable), when they push a branch with valid
  prose, the pre-push hook runs Vale, probes `pool`, prints a notice that LanguageTool was skipped because the host is
  unreachable, and the push proceeds.
- AE3. **Covers R2.** Given a release branch is merged into `main`, when the merge completes, no prose check runs in CI.
  The pre-push hook is the only enforcement surface.
- AE4. **Covers R3.** Given a contributor edits a `docs/brainstorms/` file with prose that would otherwise fail Vale
  rules, when they push, the prose check ignores the file and the push proceeds.
- AE5. **Covers R11.** Given the maintainer edits the Brand rule pack in the spec repo and runs the sync script, when
  the script completes, the consuming repo's working tree contains the updated pack at the canonical path with no other
  manual edits needed.
- AE6. **Covers R5, R6.** Given a maintainer changes an enforceable voice rule, when they edit the Brand rule pack and
  update the derived BRAND.md sections, the BRAND.md identity sections (voice anchors, audiences, channel definitions)
  remain unchanged because they are not derivative.

---

## Success Criteria

- A maintainer can push a branch with no prose findings against the configured rules and the hook completes within a few
  seconds for typical change sets, with LanguageTool reachable.
- A regression in enforceable voice (banned phrase, RFC 2119 keyword casing, first-person plural, banned typography
  reference) is caught at push time before it lands on `dev`.
- BRAND.md and the rule pack stay coherent: a contributor reading either understands which is source-of-truth for which
  content, and the split is documented in the spec repo.
- A new contributor can run the prose check locally without standing up new infrastructure beyond `brew install vale`
  and Tailscale access to `pool`.

---

## Scope Boundaries

- `unslop` skill: being designed in a parallel session as a separate global Claude Code skill that operates at the
  LLM-judgment layer.
- `/impeccable` skill: already exists, runs at a different layer and is not coupled to the prose-check stack.
- LLM-as-judge enforcement of voice anchors that cannot be expressed as deterministic rules ("concrete before abstract",
  "show then tell", originality, "no verbatim quotation from any single synthesizer"): left to the adjacent skills
  above.
- CI integration of any flavor: pre-push and the manual script are the only invocations.
- Enforcement on `agentnative-cli` and `agentnative-skill` repos in v1: design supports them, enforcement is deferred
  until they earn channel `.impeccable.md` files.
- Auto-fix beyond what Vale offers natively.
- Wholesale enablement of Microsoft, Google, or alex style packs.
- Channel `.impeccable.md` for `agentnative-cli` and `agentnative-skill`: they earn one when channel-specific decisions
  accumulate enough.
- A pre-built coverage map across Vale style packs: deliberately deferred to iterative rule additions.

---

## Key Decisions

- **Two-tier deterministic stack with LLM judgment offloaded.** Vale and LanguageTool cover catchable patterns; voice
  anchors that need semantic judgment route to existing and parallel skills. Rationale: most BRAND.md and
  `.impeccable.md` rules are deterministic; an LLM tier in the prose-check stack would duplicate work happening in
  adjacent skills and add latency to the push path.
- **Pre-push only, no CI.** The hook runs on push regardless of branch; CI does not run a prose check. Rationale:
  catches drift before it leaves the dev machine; avoids tailnet authentication in CI; matches the existing
  `scripts/hooks/pre-push` convention already used in this repo and the user's other Rust repos.
- **`pool` as LanguageTool host.** Persistent docker container reachable over Tailscale. Rationale: existing
  infrastructure already manages container lifecycles on `pool`; Tailscale provides authenticated reachability without
  exposing the service publicly.
- **Source-of-truth inversion at rule-pack landing.** Once rule packs ship, they own enforceable voice rules; BRAND.md
  becomes derivative for those sections. Rationale: rule packs are the executable artifact; if BRAND.md and the packs
  disagree, the packs are what fires. Inverting the SoT removes ambiguity at edit time.
- **`write-good` + `proselint` baseline; cherry-pick from Microsoft and Google later.** Rationale: avoids importing
  wholesale opinions from style packs that may compete with BRAND.md voice; allows iterative addition triggered by
  observed drift rather than upfront mapping work.
- **Rule packs are committed even though BRAND.md push is pending.** Rationale: enforcement requires the pack to exist
  on contributor machines via clone; the pack is the executable contract.

---

## Dependencies / Assumptions

- `pool` is reachable from developer machines over Tailscale; this is existing infrastructure.
- The Vale binary is available via `brew install vale` on macOS development machines.
- The LanguageTool docker image used by the deployment can be pinned to a digest for supply-chain hygiene per the user's
  existing pin policy.
- `scripts/sync-spec.sh` exists in the spec repo and follows a commit-a-copy pattern; extending it is additive.
- `scripts/hooks/pre-push` already exists in the spec repo and is the established pre-push extension surface.
- BRAND.md is committed in the spec repo (remote push pending; does not block this work).

---

## Outstanding Questions

### Resolve Before Planning

- \[Affects R5, R6\]\[User decision\] Which specific BRAND.md sections become derivative after rule-pack landing, and
  which remain source-of-truth? The synthesis names the categorical split (enforceable rules vs identity content);
  planning needs the line-by-line mapping before the BRAND.md restructure can happen.

### Deferred to Planning

- \[Affects R7, R12, R13\]\[Technical\] Initial set of cherry-picked rules from Microsoft and Google packs at v1, beyond
  the `write-good` + `proselint` baseline. Likely zero at v1, with additions triggered by observed drift after first
  runs.
- \[Affects R9\]\[Technical\] Pool-reachability probe shape: TCP connect, HTTP `/v2/check` warmup, or `tailscale status`
  check. Ergonomic choice; planning picks.
- \[Affects R10\]\[Technical\] Confidence threshold for LanguageTool findings to graduate from warning to blocking
  error. LanguageTool scores findings; planning picks the threshold.
- \[Affects R11\]\[Needs research\] Whether the Brand rule pack landing in `agentnative-cli` and `agentnative-skill` via
  `sync-spec.sh` requires consumer-side wiring beyond placement on disk, given those repos do not run the prose check at
  v1.
- \[Affects R3\]\[Technical\] Exact glob syntax for the meta-doc exclusions; confirm that the chosen glob layer covers
  symlinked paths correctly.
