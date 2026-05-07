---
title: "feat: Add Vale + LanguageTool pre-push prose-check stack (spec-side)"
type: feat
status: completed
date: 2026-05-06
origin: docs/brainstorms/2026-05-06-prose-check-stack-requirements.md
related:
  - docs/plans/2026-05-06-002-feat-languagetool-pool-deployment-plan.md
  - ../../../agentnative-site/docs/plans/2026-05-07-001-feat-prose-check-site-plan.md
  - docs/architecture/voice-enforcement.md
---

# feat: Add Vale + LanguageTool pre-push prose-check stack

> **Sibling plan:** The operational counterpart that provisions the LanguageTool docker container on `pool` is
> [`2026-05-06-002-feat-languagetool-pool-deployment-plan.md`](2026-05-06-002-feat-languagetool-pool-deployment-plan.md).
> The two plans land in parallel — neither blocks the other. This plan handles unreachable LanguageTool gracefully
> (skip with notice), so it ships even if the deployment plan is mid-flight; the LanguageTool service runs
> independently of any client. They converge once both are live and a developer's pre-push reaches `pool` over
> Tailscale.

## Summary

Add a pre-push deterministic prose-check stack to `agentnative-spec`: Vale runs custom rule packs (universal `Brand`,
spec-channel `Spec`) plus `write-good` + `proselint` baseline; LanguageTool runs grammar over the same files when `pool`
is reachable over Tailscale, gracefully skipped when not. Rule packs are committed in spec, owned as source-of-truth for
enforceable voice; BRAND.md and `.impeccable.md` shed their literal phrase lists in favor of an auto-generated per-pack
`README.md` companion that progressively discloses what each pack enforces.

> **Site-side scope split:** Site enforcement (the parallel work originally scoped here as U9 + U10) lives in the
> companion plan
> [`agentnative-site/docs/plans/2026-05-07-001-feat-prose-check-site-plan.md`](../../../agentnative-site/docs/plans/2026-05-07-001-feat-prose-check-site-plan.md).
> Splitting let the spec stack ship independently on `docs/v0.3.1`; the site plan picks up after.

---

## Problem Frame

Both repos publish prose at release time and rely on attentive reading plus adjacent skill review (`/impeccable`,
in-flight `/unslop`) to catch banned phrases, hedge words, RFC 2119 register drift, and first-person plural that
BRAND.md and `.impeccable.md` already prohibit explicitly. A tired reader misses one; the miss lands in the canonical
artifact (the spec, the site) where it sets the bar for subsequent contributions and erodes the standard's authority.
Catchable patterns belong on a deterministic linter that fires in milliseconds, before the prose leaves the dev machine.
See origin: `docs/brainstorms/2026-05-06-prose-check-stack-requirements.md`.

---

## Requirements

- R1. Vale + LanguageTool form the two-tier deterministic check.
- R2. Invocation surfaces are the pre-push git hook and a developer-invoked script — no CI workflow.
- R3. Scope: all `*.md` except `docs/brainstorms/`, `docs/plans/`, `docs/research/`, `AGENTS.md`, `CHANGELOG.md`
  (generated artifact, never hand-edited per the existing release flow), and `docs/solutions/` symlink-target.
- R4. v1 spec-side enforcement lands in `agentnative-spec`. Site-side enforcement lives in the companion plan at
  `agentnative-site/docs/plans/2026-05-07-001-feat-prose-check-site-plan.md`. Architecture supports `agentnative-cli`
  and `agentnative-skill` but they do not enforce until they earn channel `.impeccable.md` files.
- R5. Rule packs are SoT for enforceable voice; BRAND.md sections that mirror enforceable rules become derivative.
- R6. Non-enforceable identity content in BRAND.md (voice anchors, audience descriptions, channel definitions, rationale
  for anti-patterns) remains SoT in BRAND.md.
- R7. Vale uses three layers: custom Brand pack (universal), per-channel pack (Spec, Site), and selected built-in packs
  (`write-good`, `proselint` at v1).
- R8. LanguageTool runs on `pool` as a docker container over Tailscale; never a local Mac install.
- R9. Pre-push handles unreachable `pool` gracefully: short-timeout probe, skip with notice, Vale failures still block.
- R10. Vale error-tier and equivalent-confidence LanguageTool findings block; warning-tier annotates but does not block.
- R11. Brand rule pack syncs into consuming repos via each consumer's existing `scripts/sync-spec.sh`; commit-a-copy,
  not submodule. Consumer `sync-spec.sh` extension itself is deferred to follow-up — v1 site copy is manual.
- R12. v1 baseline enables `write-good` and `proselint` packs in full. Microsoft / Google / alex packs are not enabled.
- R13. Specific rules from Microsoft / Google may be cherry-picked over time; coverage map is iterative.

**Origin actors:** A1 developer (push-time enforcement, manual invocation), A2 maintainer (rule-pack edits, BRAND.md
restructure), A3 pre-push hook (orchestrator), A4 Vale, A5 LanguageTool (via `pool`). **Origin flows:** F1 pre-push
prose-check, F2 manual prose-check, F3 rule-pack edit and sync. **Origin acceptance examples:** AE1 (covers R1, R3,
R10), AE2 (covers R8, R9), AE3 (covers R2 — verified by absence of CI workflow, not a positive test), AE4 (covers R3),
AE5 (covers R11 — **deferred to follow-up** per consumer-wiring decision below; v1 verifies manual copy works), AE6
(covers R5, R6).

---

## Scope Boundaries

### Deferred for later

[Carried from origin — product/version sequencing.]

- LLM-as-judge enforcement of voice anchors not expressible deterministically ("concrete before abstract", "show then
  tell", "no verbatim quotation from any single synthesizer") — adjacent skills (`/impeccable`, `/unslop`).
- Cherry-picked rules from Microsoft / Google packs at v1; additions are observation-driven, not pre-mapped.
- Channel `.impeccable.md` for `agentnative-cli` and `agentnative-skill` — earned when channel-specific decisions
  accumulate.
- Auto-fix beyond what Vale offers natively.
- Wholesale enablement of Microsoft / Google / alex packs.
- A pre-built coverage map across Vale style packs.

### Outside this product's identity

[Carried from origin — positioning rejection.]

- CI workflow firing on PR or release events for prose-check.
- LanguageTool running locally on this developer's Mac.
- Submoduling rule packs into consumers (commit-a-copy is the contract).

### Deferred to Follow-Up Work

[Plan-local — implementation work intentionally split across other PRs/issues.]

- Consumer `sync-spec.sh` extension to auto-pull rule packs from the spec repo: separate PRs in `agentnative-site`,
  `agentnative-cli`, `agentnative-skill`, `agent-skills/agentnative` after v1 lands. v1 site enforcement uses a manual
  one-time copy; AE5 is verified at the manual-copy level for v1 and re-verified once sync-spec.sh extension lands.
- `agentnative-cli` and `agentnative-skill` enforcement: gated on those repos earning channel `.impeccable.md` files.
- A `docs/solutions/` capture (`/ce-compound`) of the Vale-vs-LanguageTool tradeoffs, the Tailscale-LT reachability
  probe pattern, and the per-pack-README progressive-disclosure decision: written after v1 ships and runs against
  several real PRs.

---

## Context & Research

### Relevant Code and Patterns

- `scripts/hooks/pre-push` (current) — bash, `set -euo pipefail`, runs md-wrap → markdownlint-cli2 → check-links.mjs →
  validate-principles.mjs → test-validate-principles.mjs → check-release-version.sh. New prose-check slots in as an
  additional stage following the same shape (header comment block, on-demand dep install, error accumulation). Activated
  via `git config core.hooksPath scripts/hooks` per the established convention.
- `scripts/check-links.mjs` — closest analog for the new orchestrator's shape: walks markdown, accumulates findings into
  an `errors[]` array, prints a `<script-name>: <N> issue(s)` summary header with file:line refs, exits 1 on any error.
- `scripts/validate-principles.mjs` — header-comment style and fixture-test pattern to mirror.
- `scripts/test-validate-principles.mjs` + `scripts/__fixtures__/<case>/` — fixture/regression-test pattern for the new
  validator. The existing pre-push already excludes `scripts/__fixtures__/*` from its markdown enumeration; the new
  prose-check must do the same.
- Existing `find` exclusion in pre-push (lines 41-48): default `find` does NOT follow symlinks, so `docs/solutions/` (a
  symlink to `~/dev/solutions-docs`) is excluded by default. New scope adds explicit `-not -path` clauses for
  `docs/brainstorms/`, `docs/plans/`, `docs/research/`, plus `-not -name AGENTS.md`.
- `agentnative-site/scripts/hooks/pre-push` — site's parallel hook (already exists, runs `bun run lint`, build, test,
  wrangler dry-run). Site has `bold()` helper and branch-deletion short-circuit (skips on `0000…` SHAs); spec hook
  doesn't but should adopt the short-circuit when it grows the prose stage.
- `agentnative-site/scripts/sync-spec.sh` — consumer-side sync via `git ls-remote --tags` + `git show <tag>:<path>`,
  remote-first with local `$SPEC_ROOT` fallback. Currently pulls `VERSION`, `CHANGELOG.md`, and `principles/p*-*.md`.
  Extension to also pull `styles/Brand/` is the deferred follow-up; v1 site copies the pack manually one time.

### Institutional Learnings

- `docs/solutions/best-practices/prose-spec-repo-pre-push-pipeline-20260422.md` — the existing five-stage pipeline this
  plan extends. Constraint: install on-run via `npm install --no-save --silent <pkg>@<ver>` cached in gitignored
  `node_modules/`; new prose stages inherit this. **This plan diverges to bun** (per global runtime preference) for the
  one new generator script — flagged as Key Technical Decision.
- `docs/solutions/best-practices/tracked-git-hooks-core-hookspath-20260401.md` — `core.hooksPath = scripts/hooks` is the
  one mechanism that survives clone. Spec already on it; site already on it. New work just plugs into the existing hook
  files.
- `docs/solutions/best-practices/sot-contract-for-spec-repos-with-downstream-consumers-2026-04-22.md` — the IDs-as-SoT,
  hybrid-propagation, decoupled-versions, badge-and-verify contract. The rule-pack progressive-disclosure structure
  (BRAND.md narrative → `styles/<Pack>/README.md` companion → `styles/<Pack>/*.yml` enforcement) maps onto the same
  pattern: BRAND.md is the identity SoT, the per-pack README is the derivative reference, the YAML is the executable
  artifact.
- `docs/solutions/best-practices/agentnative-version-model-2026-05-01.md` — site has THREE distinct spec-version
  concepts (vendored / reconciled / per-scorecard). Rule-pack vendoring is a **vendoring event**, tagged against
  `SPEC_VERSION` (the snapshot marker), not `SITE_SPEC_VERSION` (the prose-reconciliation marker). When the deferred
  consumer-wiring follow-up lands, the rule pack syncs alongside `principles/` under the SPEC_VERSION snapshot.
- `docs/solutions/architecture-patterns/cross-repo-artifact-sync-commit-over-fetch-20260420.md` — commit-a-copy with a
  producer-side `--check` drift detector. The per-pack `README.md` generator gets a `--check` mode used by spec's
  pre-push to refuse a stale generated README; the deferred consumer sync inherits the same `--check` discipline.
- `docs/solutions/best-practices/byte-equivalence-regression-tests-for-copied-design-artifacts-2026-04-14.md` — when the
  deferred consumer wiring lands, vendored rule-pack copies will need `sha256` byte-equivalence tests against the spec
  copy. Out of v1 scope; flagged for the follow-up plan.
- `docs/solutions/logic-errors/cli-linter-fork-bomb-recursive-self-invocation-20260401.md` — cautionary tale relevant
  because the prose stack runs in the same hook as `anc` could one day. New scripts must never bare-invoke unknown
  binaries; only `--help` / `--version` style suffixes. Affects U6 (reachability probe shape).
- `docs/solutions/workflow-issues/precommit-hook-auto-staging-silent-inclusion-2026-04-15.md` — hooks must never call
  `git add`. The prose-check is read-only; not a direct concern, but the per-pack README generator's `--check` mode must
  `exit 1` on drift, NOT auto-fix-and-stage.

### External References

- [Vale styles + check schema](https://vale.sh/docs/styles), [`existence`](https://vale.sh/docs/checks/existence),
  [`substitution`](https://vale.sh/docs/checks/substitution), [`occurrence`](https://vale.sh/docs/checks/occurrence) —
  workhorse extensions for banned phrases, RFC 2119 keyword casing, first-person plural detection.
- [Vale `Packages` key](https://vale.sh/docs/keys/packages), [`BasedOnStyles`](https://vale.sh/docs/keys/basedonstyles),
  [`Vocab`](https://vale.sh/docs/keys/vocab), [`MinAlertLevel`](https://vale.sh/docs/keys/minalertlevel) — `.vale.ini`
  composition.
- [Vale sync](https://vale.sh/manual/sync/) — pin `Packages` by URL with explicit version tag (immutable), not bare hub
  names (float). Pre-create `mkdir -p styles` before first `vale sync` (cache-fallback gotcha to OS user data dir).
- [LanguageTool public HTTP API](https://dev.languagetool.org/public-http-api.html) — `POST /v2/check` form-encoded;
  `rule.category.id` is the cleanest severity axis (`TYPOS` / `GRAMMAR` / `PUNCTUATION` / `TYPOGRAPHY` / `CASING` /
  `COMPOUNDING` / `CONFUSED_WORDS` are blocking-grade; `STYLE` / `REDUNDANCY` / `COLLOQUIALISMS` are advisory).
- [meyay/languagetool docker](https://hub.docker.com/r/meyay/languagetool) — preferred over `erikvl87` for new
  deployments in 2026 (built directly from upstream tags after LT stopped publishing release zips post-v6.6). Default
  port 8081 (override with `LISTEN_PORT=8010` for parity if needed).
- [`/v2/languages`](https://languagetool.org/http-api/swagger-ui/) — cheapest reachability probe; `curl --max-time 2`
  doubles as warmup.
- [errata-ai/proselint](https://github.com/errata-ai/proselint),
  [errata-ai/write-good](https://github.com/errata-ai/write-good) — v1 baseline packs. Expected friction: `write-good`'s
  `E-Prime` always disabled (flags every `is`/`are`); `Passive` set to `warning` not `error` (brand-voice prose uses
  passive deliberately); `proselint.But` disabled (brand voice uses initial conjunctions).

---

## Key Technical Decisions

- **Per-pack `README.md` for progressive disclosure, auto-generated from pack YAML.** BRAND.md and `.impeccable.md`
  carry narrative identity and ban *categories* with rationale only — no literal phrase lists. Each Vale pack ships a
  `README.md` co-located at `styles/<Pack>/README.md` listing the literal phrases / regex / casing rules it enforces,
  generated by `scripts/generate-pack-readme.mjs` from the YAML. Pre-push runs the generator in `--check` mode and
  refuses to push when a README is stale relative to its pack. **Rationale:** keeps BRAND.md readable (the user's
  explicit redirect), removes manual-duplication drift risk (generation is mechanical), preserves the "the pack is the
  executable contract" SoT inversion (R5).
- **Maximalist enforcement coverage where deterministic.** Brand pack: marketing register, hedge words, filler
  adjectives. Spec pack: RFC 2119 keyword casing, no first-person plural, no second-person imperative in scope (spec
  channel only — skill bundle channel allows imperative; the rule is per-channel, not universal). Voice anchors that
  need semantic judgment ("concrete before abstract", "no verbatim quotation from any single synthesizer", "no marketing
  voice in 'Why Agents Need It' sections") stay narrative-only in BRAND.md / `.impeccable.md` and route to `/impeccable`
  / `/unslop`.
- **`bun` for the new generator script; existing `node` scripts unchanged.** The new `scripts/generate-pack-readme.mjs`
  runs as `bun scripts/generate-pack-readme.mjs` per global CLAUDE.md runtime preference. No `package.json` is added;
  bun runs `.mjs` directly. Existing `node` scripts are not migrated in this plan — separate refactor opportunity.
  **Rationale:** new code follows global standard; existing code follows established repo convention; mixing is
  acceptable when both runtimes execute the same files.
- **`pool` reachability probe via `curl --max-time 2 -fsS http://pool:<port>/v2/languages`.** The `/v2/languages`
  endpoint is the cheapest verified-alive probe (~150ms warm, ≤2s cold) and doubles as LT warmup — first request after
  cold container takes 5-10s, so probing first prevents the actual `/v2/check` call from absorbing that cost.
  **Rationale:** verifies the service is alive (not just the host is up), uses tools already available on macOS and
  Linux (`curl`), no Tailscale CLI dependency.
- **LanguageTool blocking threshold by `rule.category.id` whitelist.** Block on `TYPOS`, `GRAMMAR`, `PUNCTUATION`,
  `TYPOGRAPHY`, `CASING`, `COMPOUNDING`, `CONFUSED_WORDS`. Warn on everything else. This is implemented in the
  prose-check orchestrator that parses the JSON response, not by sending `disabledCategories` to the server (so warnings
  are still reported but don't fail the push). **Rationale:** R10 requires "equivalent confidence" to Vale's error tier
  — these categories are objectively-verifiable matches (typos, grammar agreement, casing, compounding) where a human
  acknowledges the match as wrong. Stylistic categories (`STYLE`, `REDUNDANCY`, `COLLOQUIALISMS`) fight brand voice and
  belong on the warning tier.
- **`vale sync` packs not committed; `styles/Brand/`, `styles/Spec/` committed.** `.gitignore` excludes
  `styles/proselint/`, `styles/write-good/`, `styles/.vale-config/`. Custom packs (`Brand`, `Spec`) are committed; their
  `README.md` is committed (generated artifact, drift-checked). **Rationale:** Vale v3 convention; downloaded packs are
  reproducible from the pinned URL and version tag in `.vale.ini`.
- **`Packages` pinned by URL with explicit release tag** in `.vale.ini`, not bare hub names. e.g. `Packages =
  https://github.com/errata-ai/write-good/releases/download/v0.4.0/write-good.zip,
  https://github.com/errata-ai/proselint/releases/download/v0.3.1/proselint.zip` (resolve actual current versions at
  implementation time). **Rationale:** mirrors the user's existing GitHub Actions SHA-pin policy at the prose-check
  layer — bare hub names float, tagged release zips are immutable.
- **LanguageTool docker image pinned by digest.** `image: meyay/languagetool@sha256:<digest>` in the deployment compose
  on `pool`. Image and digest captured in plan but the actual `pool`-side compose change is operational, not part of
  this PR. **Rationale:** matches the user's image-pin policy; deployment is out-of-band but the pin posture is recorded
  as part of the contract.
- **Site copies the rule pack manually at v1; sync-spec.sh extension is the deferred follow-up.** v1 site enforcement
  needs the pack present in `agentnative-site/styles/Brand/`; we accomplish this with a one-time `git checkout` from
  spec, committed to the site repo. AE5 is verified at the manual-copy level for v1; re-verified after the consumer
  sync-spec.sh extension lands. **Rationale:** keeps v1 scope tight on prose-check authoring; consumer-wiring refactor
  is independent enough to live in its own PR per repo.

---

## Open Questions

### Resolved During Planning

- **BRAND.md / `.impeccable.md` SoT split (Affects R5, R6).** Resolved as: rule packs are SoT for enforceable literal
  rules; BRAND.md and `.impeccable.md` are SoT for narrative identity, voice anchors, channel definitions, and
  rationale. Phrase lists move OUT of BRAND.md / `.impeccable.md` entirely and INTO the auto-generated per-pack
  `README.md`. (User-resolved during planning Q1, refined during Q3.)
- **Consumer wiring (Affects R11).** Resolved as: each consumer's `sync-spec.sh` extension is deferred to a follow-up PR
  in that consumer repo. v1 site enforcement uses a manual one-time copy from spec to site. (User-resolved during
  planning Q2.)
- **Initial Microsoft / Google cherry-picks (Affects R7, R12, R13).** Resolved as zero at v1; additions are
  observation-driven after first runs. (Origin position preserved.)
- **Pool reachability probe shape (Affects R9).** Resolved as `curl --max-time 2 -fsS http://pool:<port>/v2/languages`
  per external research (cheapest verified-alive probe; doubles as LT warmup).
- **LanguageTool confidence threshold (Affects R10).** Resolved as category-whitelist blocking: `TYPOS`, `GRAMMAR`,
  `PUNCTUATION`, `TYPOGRAPHY`, `CASING`, `COMPOUNDING`, `CONFUSED_WORDS` block; everything else warns.
- **Glob exclusion shape (Affects R3).** Resolved as `find`-based `-not -path` clauses in the orchestrator (matches
  existing pre-push convention) plus `.vale.ini` per-glob `BasedOnStyles =` empties for the same paths (Vale-side
  scoping). Belt-and-suspenders: orchestrator filters before invoking Vale, Vale config also empties rules for those
  paths so a direct `vale .` invocation outside the orchestrator behaves consistently. `docs/solutions/` is excluded by
  default since `find` does not follow symlinks; explicit exclusion is belt-and-suspenders.

### Deferred to Implementation

- **Exact LT image port on `pool`.** Plan recommends `meyay/languagetool` at port 8081 default; the actual `pool`-side
  compose may differ. Implementer confirms by reading `pool`'s compose at U6 time and updates the prose-check default
  URL accordingly. Pre-push reads `LANGUAGETOOL_URL` env override before falling back to default.
- **Per-rule severity overrides for `write-good` and `proselint` baseline.** The plan calls out the obvious ones to
  demote (`E-Prime` off, `Passive` warning, `proselint.But` off) but the full demotion list is finalized after the first
  dry-run against current spec/site prose, captured in `.vale.ini` comments at U4 time.
- **`SPDX-License-Identifier` posture for the new files.** Existing scripts carry `# SPDX-License-Identifier: MIT OR
  Apache-2.0`. New scripts and YAML files match. Vale rule YAMLs follow the same; verify Vale doesn't choke on the
  comment line at the top of a YAML rule (Vale parses `extends:`/`message:`/etc. — leading comments should be
  acceptable; verify at U1).

---

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The
> implementing agent should treat it as context, not code to reproduce.*

### Layered architecture

```text
LAYER 1 — Identity (narrative SoT, human-authored)
  BRAND.md                     (universal — voice anchors, channels, anti-pattern categories with rationale)
  .impeccable.md               (spec channel — register narrative, anti-pattern categories with rationale)
                               (other consumer repos: their own .impeccable.md when channel-specific decisions accrue)

LAYER 2 — Reference companion (derivative, generated)
  styles/Brand/README.md       (auto-generated from styles/Brand/*.yml; lists enforced literals + per-rule rationale)
  styles/Spec/README.md        (auto-generated from styles/Spec/*.yml)
  styles/Site/README.md        (auto-generated from styles/Site/*.yml — site repo only)

LAYER 3 — Enforcement (executable SoT for literals)
  styles/Brand/MarketingRegister.yml      "we believe", "we recommend", "it's really important to"
  styles/Brand/HedgeWords.yml             "typically", "usually", "in most cases", "generally agreed"
  styles/Brand/FillerAdjectives.yml       "best-in-class", "robust", "leveraging", "synergy", "next-generation"
  styles/Spec/RFCKeywords.yml             enforce upper-case MUST/SHOULD/MAY when used as RFC keywords
  styles/Spec/FirstPersonPlural.yml       "we", "our", "us", "ours" (error in spec channel)
  styles/Spec/SecondPersonImperative.yml  scope-bounded "you should", "you must", "your CLI" (error in spec channel)
  styles/Site/*.yml                       site-channel-only rules (visual-system terms, OG copy etc.) — TBD at U9
  styles/proselint/*                      gitignored; pulled by `vale sync`; pinned URL in .vale.ini
  styles/write-good/*                     gitignored; pulled by `vale sync`; pinned URL in .vale.ini
```

### Pre-push pipeline (spec repo)

```text
existing stages   ↳  md-wrap --check
                  ↳  markdownlint-cli2
                  ↳  check-links.mjs
                  ↳  validate-principles.mjs
                  ↳  test-validate-principles.mjs
                  ↳  check-release-version.sh

NEW prose-check stage:
  scripts/prose-check.sh
    ├─ enumerate in-scope *.md (find with the unified exclude list)
    ├─ vale --output=JSON --minAlertLevel=error <files>
    │    └─ block on any error-tier finding
    ├─ probe pool:  curl --max-time 2 -fsS http://pool:8081/v2/languages
    │    ├─ unreachable: print notice, skip LT, continue
    │    └─ reachable:  POST /v2/check per file, parse matches
    │                   ├─ filter rule.category.id ∈ {TYPOS, GRAMMAR, PUNCTUATION, TYPOGRAPHY,
    │                   │                              CASING, COMPOUNDING, CONFUSED_WORDS}
    │                   └─ block on any kept match; warn on the rest
    └─ aggregate findings, print file:line:rule output, exit non-zero on any blocking finding

NEW pack-README drift check (cheap, runs before vale):
  bun scripts/generate-pack-readme.mjs --check
    └─ regenerates each styles/<Pack>/README.md and diffs against committed copy; fails on drift
```

### Manual prose-check script

```text
scripts/prose-check.sh [--changed-only] [--warnings] [--lt-only|--vale-only]
  --changed-only    scope to git diff --name-only against base (default: all in-scope *.md)
  --warnings        surface warning-tier findings (default: errors only)
  --lt-only         skip Vale (debugging)
  --vale-only       skip LanguageTool reachability + invocation (offline iteration)
```

The pre-push hook invokes the same script with no flags (full scope, errors only). Manual invocation passes
`--changed-only` for fast iteration during authoring.

---

## Output Structure

The plan creates new files in `agentnative-spec` (and parallel files in `agentnative-site` per U9 / U10). Spec-side
expected layout post-implementation:

```text
agentnative-spec/
├── .vale.ini                                    (NEW — Vale config: Packages, BasedOnStyles, severity, glob excludes)
├── .gitignore                                   (MODIFIED — add styles/proselint/, styles/write-good/, styles/.vale-config/)
├── BRAND.md                                     (MODIFIED — strip phrase lists; keep narrative; link to per-pack README)
├── .impeccable.md                               (MODIFIED — strip phrase lists; link to styles/Spec/README.md)
├── styles/
│   ├── Brand/
│   │   ├── README.md                            (NEW — auto-generated)
│   │   ├── MarketingRegister.yml                (NEW)
│   │   ├── HedgeWords.yml                       (NEW)
│   │   └── FillerAdjectives.yml                 (NEW)
│   └── Spec/
│       ├── README.md                            (NEW — auto-generated)
│       ├── RFCKeywords.yml                      (NEW)
│       ├── FirstPersonPlural.yml                (NEW)
│       └── SecondPersonImperative.yml           (NEW)
└── scripts/
    ├── prose-check.sh                           (NEW — orchestrator)
    ├── generate-pack-readme.mjs                 (NEW — bun; reads pack YAML, writes per-pack README, --check mode)
    ├── test-prose-check.mjs                     (NEW — fixture regression tests)
    ├── test-generate-pack-readme.mjs            (NEW — fixture regression tests)
    ├── __fixtures__/
    │   └── prose-check/
    │       ├── marketing-register/              (NEW — intentional "we believe" failure)
    │       ├── hedge-words/                     (NEW — intentional "typically" failure)
    │       ├── filler-adjectives/               (NEW — intentional "robust" failure)
    │       ├── rfc-keywords/                    (NEW — intentional lowercase "must" failure)
    │       ├── first-person-plural/             (NEW — intentional "we " failure)
    │       └── meta-doc-exclusion/              (NEW — file under docs/brainstorms/ that would otherwise fail)
    └── hooks/
        └── pre-push                             (MODIFIED — append generate-pack-readme.mjs --check + prose-check.sh)
```

The implementer may adjust this structure if implementation reveals a better layout (e.g., additional rules per pack as
the dry-run reveals real prose drift). Per-unit `**Files:**` sections remain authoritative.

---

## Implementation Units

- U1. **Author Vale rule packs (Brand + Spec) with rule YAMLs**

**Goal:** Land the executable enforcement layer for universal banned-phrase categories (Brand pack) and spec-channel
register rules (Spec pack).

**Requirements:** R1, R5, R7

**Dependencies:** None (foundational unit)

**Files:**

- Create: `styles/Brand/MarketingRegister.yml`
- Create: `styles/Brand/HedgeWords.yml`
- Create: `styles/Brand/FillerAdjectives.yml`
- Create: `styles/Spec/RFCKeywords.yml`
- Create: `styles/Spec/FirstPersonPlural.yml`
- Create: `styles/Spec/SecondPersonImperative.yml`
- Test: `scripts/__fixtures__/prose-check/marketing-register/case.md`,
  `scripts/__fixtures__/prose-check/hedge-words/case.md`, `scripts/__fixtures__/prose-check/filler-adjectives/case.md`,
  `scripts/__fixtures__/prose-check/rfc-keywords/case.md`,
  `scripts/__fixtures__/prose-check/first-person-plural/case.md`

**Approach:**

- Each rule is a single `.yml` file. Use `existence` for banned phrases (`MarketingRegister`, `HedgeWords`,
  `FillerAdjectives`, `FirstPersonPlural`). Use `existence` with `raw:` regex for `RFCKeywords` (lowercase form must not
  appear in body text). Use `existence` with scope-bounded `tokens:` for `SecondPersonImperative` (spec-channel only —
  site channel allows it).
- Each rule sets `level: error` for the spec channel via `.vale.ini`; pack itself sets `level: warning` so consumer
  channels can opt up or down without forking the pack.
- `message:` field is human-readable and contains `%s` for matched text. `link:` field points at the relevant BRAND.md
  or `.impeccable.md` section anchor (e.g., `link:
  https://github.com/brettdavies/agentnative/blob/main/BRAND.md#universal-anti-patterns`) so contributors get the
  rationale, not just the rule name.
- Each YAML carries a top-line comment: `# Source: BRAND.md § Universal anti-patterns — No marketing register.`
- Bind regex with word boundaries via `tokens:` (auto-bounded) where possible; fall back to `raw:` only for
  case-sensitive RFC keyword detection.

**Patterns to follow:**

- [Vale `existence` check schema](https://vale.sh/docs/checks/existence)
- [errata-ai/Microsoft `Microsoft.We.yml`](https://github.com/errata-ai/Microsoft) (community reference for first-person
  plural as `existence`)
- [errata-ai/write-good `Weasel.yml`](https://github.com/errata-ai/write-good) (template for filler-adjective shape)

**Test scenarios:**

- Happy path: file containing none of the banned phrases passes Vale at error level. *Covers R1.*
- Edge case: banned phrase inside a code fence is NOT flagged (Vale's markdown scoping skips code blocks by default).
- Edge case: banned phrase inside an inline code span is NOT flagged.
- Edge case: `Spec.RFCKeywords` rule does not flag uppercase `MUST` (the legitimate keyword); flags lowercase `must`
  inside requirement-bullet body.
- Error path: file containing "we believe" triggers `Brand.MarketingRegister` at error level. **Covers AE1.**
- Error path: file containing "typically" triggers `Brand.HedgeWords` at error level.
- Error path: file containing "robust" triggers `Brand.FillerAdjectives` at error level.
- Error path: file containing lowercase `must` (where the spec voice would use `MUST`) triggers `Spec.RFCKeywords`.
- Error path: file containing "we " or "our " in narrative triggers `Spec.FirstPersonPlural`.
- Integration: each fixture file under `scripts/__fixtures__/prose-check/<case>/` triggers exactly the expected rule and
  no others (asserted by the U7 test runner).

**Verification:**

- `vale --no-global --config=.vale.ini scripts/__fixtures__/prose-check/marketing-register/case.md` exits non-zero with
  exactly one error-tier finding citing `Brand.MarketingRegister`.
- All other fixtures behave analogously for their target rules.

---

- U2. **Author per-pack `README.md` generator (`scripts/generate-pack-readme.mjs`)**

**Goal:** Build the small `bun` script that reads each pack's YAML rules and emits a co-located `README.md` companion
listing the literal phrases / regex / casing rules each pack enforces.

**Requirements:** R5, R6

**Dependencies:** U1 (needs YAML rule files to read)

**Files:**

- Create: `scripts/generate-pack-readme.mjs`
- Create: `scripts/test-generate-pack-readme.mjs`
- Test: `scripts/__fixtures__/generate-pack-readme/<case>/expected-README.md` (one fixture per pack)

**Approach:**

- Single argument: pack directory (default: `styles/Brand` then `styles/Spec` — iterate over both).
- For each `*.yml` in the pack: parse with `js-yaml`, extract `extends`, `message`, `tokens`/`raw`, `link`, top-line
  source comment. Render to a markdown section: rule name H3, source comment as italics, table of literal phrases (or
  the regex), the `message` template with `%s` placeholder shown verbatim.
- Output: `styles/<Pack>/README.md` with a top-level `# <Pack> Vale rule pack` H1, one H2 per rule category, and a
  trailer that names the generator: `<!-- generated by scripts/generate-pack-readme.mjs from styles/<Pack>/*.yml — do
  not edit by hand -->`.
- `--check` mode: regenerate to a buffer, diff against the on-disk file, exit 0 if identical, exit 1 with a unified diff
  if drifted. Used by the pre-push hook (U7).
- Run via `bun scripts/generate-pack-readme.mjs` — no `package.json` needed since `js-yaml` is the only dep and the
  pre-push already installs it on demand. The generator imports `js-yaml` via `node_modules/js-yaml` (already installed
  by the existing pre-push install-on-run pattern).

**Execution note:** Test-first. Author the generator's expected fixture output first (per pack), then implement the
generator until each fixture matches exactly.

**Patterns to follow:**

- `scripts/check-links.mjs` (header-comment block, error reporting, `process.exit` posture)
- `scripts/validate-principles.mjs` (`js-yaml` usage, `process.argv[2]` arg-handling style)
- `docs/solutions/architecture-patterns/cross-repo-artifact-sync-commit-over-fetch-20260420.md` (`--check` mode shape)

**Technical design:** *(directional only)*

```text
generate-pack-readme.mjs
  parseArgs() → { mode: 'write' | 'check', packs: ['Brand', 'Spec'] }
  for each pack:
    rules = readdirSync(`styles/${pack}`).filter(f => f.endsWith('.yml')).map(parseYaml)
    rendered = renderReadme(pack, rules)
    if mode === 'write': writeFileSync(`styles/${pack}/README.md`, rendered)
    if mode === 'check': diff(rendered, readFileSync(`styles/${pack}/README.md`))
                          → exit 1 with diff if mismatch
  exit 0
```

**Test scenarios:**

- Happy path: write mode produces `styles/Brand/README.md` byte-identical to the fixture.
- Happy path: check mode against an in-sync committed README exits 0.
- Error path: check mode against a stale README exits 1 and prints a unified diff.
- Edge case: pack directory with no YAML files writes an empty-pack README that still names the pack (no crash on empty
  input).
- Edge case: rule file with `extends: existence` and `tokens:` renders the tokens as a sorted markdown bullet list.
- Edge case: rule file with `extends: existence` and `raw:` renders the regex inside a single-line code span.
- Integration: U7's pre-push `--check` invocation correctly fails when a YAML token is added but the README isn't
  regenerated.

**Verification:**

- `bun scripts/generate-pack-readme.mjs` writes `styles/Brand/README.md` and `styles/Spec/README.md`. Running again
  produces no diff.
- `bun scripts/generate-pack-readme.mjs --check` exits 0 on the freshly-generated state, exits 1 after a token is added
  to a YAML without rerunning the writer.

---

- U3. **Restructure BRAND.md and `.impeccable.md` to remove literal phrase lists**

**Goal:** Strip enforceable literal phrase lists from BRAND.md and `.impeccable.md`, replace them with category prose +
rationale + link to the per-pack `README.md`. Identity content (voice anchors, audiences, channel definitions) stays
untouched.

**Requirements:** R5, R6

**Dependencies:** U1, U2 (need pack YAML and generated README to point at)

**Files:**

- Modify: `BRAND.md` (Universal anti-patterns section: keep the four category bullets with rationale; remove the literal
  phrase list inside each bullet; replace the Voice anchors examples table's banned-side cells with the same
  category-only treatment; add a one-line "see `styles/Brand/README.md` for the enforced literal list" at the section
  end — the link resolves once U2 generates the file)
- Modify: `.impeccable.md` (Register section: keep the rule prose; remove the literal phrase enumerations inside RFC
  2119, first-person plural, second-person imperative bullets; add link to `styles/Spec/README.md`. Spec-specific
  anti-patterns: keep verbatim — those four bullets are non-enforceable.)
- Modify (new sentinel-note in BRAND.md): a "Sources" subsection naming `styles/Brand/README.md` and
  `styles/Spec/README.md` as the SoT for enforceable literals; BRAND.md as SoT for narrative identity.

**Approach:**

- **Branch ordering (load-bearing):** BRAND.md and `.impeccable.md` exist on `feat/v0.4.0` and `docs/v0.3.1`, NOT on
  `dev`. This unit cannot run from a branch cut off `dev` — the files don't exist there. Two options: (a) cut the
  prose-check branch off `feat/v0.4.0` (recommended — work proceeds on top of v0.4.0 content); (b) wait for v0.4.0 to
  merge to `dev`, then cut from `dev`. Choose (a) unless v0.4.0 is on the cusp of merging. Document the choice in the PR
  description so reviewers understand the branch lineage.
- Conservative: keep every section header. Only the literal phrase enumerations move out.
- Add a one-line note at the top of Universal anti-patterns: "The literal phrase lists enforced by these categories live
  in `styles/Brand/README.md`. The narrative below explains *why* each category is banned; the pack is source-of-truth
  for *what* is banned." (Use a real markdown link to `styles/Brand/README.md` once U2 has generated it; quoted as
  inline-code here in the plan because the file does not yet exist.)
- Same treatment for `.impeccable.md` Register section pointing at `styles/Spec/README.md`.
- Voice anchors examples table (BRAND.md): keep the table; replace the ✗ cells with category-level descriptions
  ("marketing register", "hedge phrasing"), not literal phrases. The whole point of the table is the contrast pattern;
  the contrast still reads.
- Channel description in BRAND.md ("Spec — RFC 2119 register, third-person standards voice, present tense, no
  first-person plural, no implementation leakage in MUSTs") — keep as-is; this is rule *category* description, not
  literal enforcement.

**Test scenarios:**

- *No automated tests; this is a content edit.* Verification is manual: run U1 + U2 + U4 + U5 against the modified
  BRAND.md and `.impeccable.md`; confirm zero new findings (BRAND.md and `.impeccable.md` themselves are in-scope `*.md`
  files).
- Edge case: ensure no surviving literal banned phrase ("we believe", "typically", "robust", "leveraging") on BRAND.md
  or `.impeccable.md` causes a self-flag — if it does, the wording was wrong and the file needs a rewrite, not a Vale
  exception. **Covers AE6** indirectly: a maintainer changing an enforceable rule (the pack) and updating the derived
  BRAND.md sections leaves the identity sections (voice anchors, audiences, channel definitions) unchanged because the
  identity sections never carried the literals.
- Test expectation: this unit's correctness is verified by U5/U7's pre-push pass on the modified files.

**Verification:**

- BRAND.md and `.impeccable.md` no longer contain the verbatim phrase lists.
- Each former list location has a one-line link to its pack README.
- `bun scripts/generate-pack-readme.mjs --check` still passes (this unit doesn't modify pack YAML).
- Running Vale against BRAND.md and `.impeccable.md` produces no error-tier findings.

---

- U4. **Author `.vale.ini` config in spec repo**

**Goal:** Compose the Brand pack, Spec pack, and `write-good` + `proselint` baseline; set per-rule severity overrides;
scope rules off for meta-docs.

**Requirements:** R3, R7, R12, R13

**Dependencies:** U1 (Brand + Spec packs must exist for `BasedOnStyles` references)

**Files:**

- Create: `.vale.ini`
- Modify: `.gitignore` (add `styles/proselint/`, `styles/write-good/`, `styles/.vale-config/`)

**Approach:**

- Top of file:

  ```ini
  StylesPath = styles
  MinAlertLevel = error
  Vocab = Brand
  Packages = https://github.com/errata-ai/write-good/releases/download/<v>/write-good.zip,
             https://github.com/errata-ai/proselint/releases/download/<v>/proselint.zip
  ```

  Resolve actual current versions (probably v0.4.0 and v0.3.1 — confirm at implementation time).
- One global glob section for in-scope `*.md`:

  ```ini
  [*.md]
  BasedOnStyles = Vale, Brand, Spec, write-good, proselint
  Brand.MarketingRegister = error
  Brand.HedgeWords = error
  Brand.FillerAdjectives = error
  Spec.RFCKeywords = error
  Spec.FirstPersonPlural = error
  Spec.SecondPersonImperative = error
  write-good.E-Prime = NO
  write-good.Passive = warning
  write-good.TooWordy = warning
  proselint.But = NO
  proselint.Annotations = NO
  ```

- One exclusion section for meta-docs:

  ```ini
  [{docs/brainstorms,docs/plans,docs/research}/**]
  BasedOnStyles =

  [AGENTS.md]
  BasedOnStyles =
  ```

- `Vocab = Brand` references `styles/config/vocabularies/Brand/{accept,reject}.txt`. Empty at v1; placeholder for future
  technical-term whitelisting (e.g., "Pretext", "OKLCH" in site context).

**Patterns to follow:**

- [Vale `.vale.ini` reference](https://vale.sh/docs/vale-ini)
- [Red Hat documentation team `.vale.ini`](https://github.com/redhat-documentation/vale-at-red-hat/blob/main/.vale.ini)
  (community reference for multi-pack composition).

**Test scenarios:**

- Happy path: a clean `principles/p1-non-interactive-by-default.md` produces zero error-tier findings under the full
  config.
- Edge case: a clean `docs/brainstorms/<file>.md` is not even visited by Vale (the empty `BasedOnStyles =` zeroes the
  rule list for that path). **Covers AE4.**
- Edge case: a file under `docs/solutions/` (the symlink target) is not visited because `find` does not follow symlinks.
  (Belt-and-suspenders verified by the orchestrator's exclude list, not by Vale's glob — Vale runs on the filtered file
  list it receives.)
- Error path: dropping `we believe` into `principles/p1-*.md` produces exactly one error from `Brand.MarketingRegister`.
  **Covers AE1 partially.**
- Integration: `vale --no-global --config=.vale.ini .` walks the in-scope `*.md` set without crashing on the muted
  rules.

**Verification:**

- `vale ls-config` shows the expected `BasedOnStyles` cascade with the per-rule severity table reflected.
- `vale sync` succeeds and populates `styles/proselint/` and `styles/write-good/` (gitignored).
- `vale --no-global --config=.vale.ini BRAND.md` produces no error-tier findings.

---

- U5. **Author `scripts/prose-check.sh` orchestrator**

**Goal:** Build the orchestrator script invoked by both the pre-push hook and developers manually. Scopes file
enumeration, runs Vale, probes pool, conditionally runs LanguageTool, aggregates findings, sets exit code.

**Requirements:** R1, R2, R3, R10

**Dependencies:** U1, U4 (rules + config must exist for Vale to run)

**Files:**

- Create: `scripts/prose-check.sh`
- Test: integration via U7 fixture tests

**Approach:**

- Bash, `set -euo pipefail`, `cd "$(git rev-parse --show-toplevel)"`. Mirrors `scripts/hooks/pre-push` shape.
- Header comment block matches the existing `pre-push`/`check-release-version.sh` style: pipeline summary, env behavior,
  exception list, exit semantics.
- Argument parsing: minimal positional flags via case statement (`--changed-only`, `--warnings`, `--lt-only`,
  `--vale-only`). No `getopt`. Defaults: full scope, errors-only, both checks.
- File enumeration:

  ```bash
  if [[ $changed_only ]]; then
    base=${PROSE_CHECK_BASE:-origin/dev}
    mapfile -t MD_FILES < <(git diff --name-only --diff-filter=ACM "$base"...HEAD -- '*.md' \
      | grep -v -E '^(docs/(brainstorms|plans|research)/|AGENTS.md$|docs/solutions/)' \
      | sort -u)
  else
    mapfile -t MD_FILES < <(find . -type f -name '*.md' \
      -not -path './node_modules/*' -not -path './.git/*' -not -path './scripts/__fixtures__/*' \
      -not -path './docs/brainstorms/*' -not -path './docs/plans/*' -not -path './docs/research/*' \
      -not -path './docs/solutions/*' -not -name 'AGENTS.md' -not -name 'CHANGELOG.md' | sort)
  fi
  ```

  (`docs/solutions/*` excluded explicitly — belt-and-suspenders since `find` already doesn't follow the symlink.)
- Vale run: single invocation `vale --no-global --config=.vale.ini --output=JSON --minAlertLevel=warning
  "${MD_FILES[@]}"`. Parse the JSON via `jaq` and split severity in the orchestrator: `error`-tier findings block;
  `warning`-tier findings are surfaced only when `--warnings` is set. Single invocation avoids double-printing errors
  (which `--minAlertLevel=warning` already includes) and keeps exit-code accounting unambiguous. The orchestrator owns
  the exit code; Vale's own exit code is captured but not authoritative.
- Pool reachability: `curl --max-time 2 -fsS "${LANGUAGETOOL_URL:-http://pool:8081}/v2/languages" >/dev/null 2>&1`.
  Capture curl's exit code (`6` = couldn't resolve host — Tailscale likely off; `7` = couldn't connect — host up but
  service down; `28` = timeout). On non-zero exit: print `LanguageTool unreachable at $url (curl exit $code); skipping
  grammar check` to stderr (the exit-code annotation makes "is Tailscale running?" diagnosable), set `LT_AVAILABLE=0`,
  continue. **Covers AE2.**
- LanguageTool run: when reachable, parallelize from the start via `printf '%s\0' "${MD_FILES[@]}" | xargs -0 -P4 -I{}
  curl --data-urlencode "text@{}" ...` — one HTTP round-trip per file at concurrency 4. Pre-push throughput target: <5s
  for a typical change set; sequential throughput on a 30-file refactor would push past target (cold-start 5-10s + 30 ×
  150ms warm = 9.5-15s), so concurrency is the default rather than a future opt-in. Parse JSON via `jaq` (already in
  homebrew CLI list).
- LT severity filter (orchestrator-side): keep matches where `.matches[].rule.category.id == "TYPOS"` OR `"GRAMMAR"` OR
  `"PUNCTUATION"` OR `"TYPOGRAPHY"` OR `"CASING"` OR `"COMPOUNDING"` OR `"CONFUSED_WORDS"`. These are the blocking-tier
  categories.
- Final exit code: 0 if no blocking findings (Vale errors + LT blocking-tier matches), 1 otherwise.
- Output format: `<file>:<line>:<rule>: <message>` for both Vale and LT, deterministic ordering (sorted by file then
  line). Summary trailer: `prose-check: <N> blocking, <M> warnings`.

**Patterns to follow:**

- `scripts/hooks/pre-push` (bash header, `set -euo pipefail`, `find` enumeration shape)
- `scripts/check-links.mjs` (error-accumulation + summary-trailer pattern)

**Test scenarios:**

- Happy path: in a clean working tree, `bash scripts/prose-check.sh` exits 0 with `prose-check: 0 blocking` summary.
- Edge case: `--changed-only` with no in-scope `*.md` changes exits 0 immediately without invoking Vale or LT.
- Edge case: `LANGUAGETOOL_URL=http://nonexistent.invalid:8081 bash scripts/prose-check.sh --vale-only` skips the
  reachability probe path entirely.
- Edge case: when `LANGUAGETOOL_URL` is unset and `pool` is unreachable, the script prints the skip notice and exits on
  Vale's verdict alone. **Covers AE2.**
- Error path: introducing "we believe" into `BRAND.md` causes Vale to flag an error; orchestrator exits 1 with the
  finding. **Covers AE1.**
- Error path: introducing "teh" (LT-flagged TYPOS category) when `pool` is reachable causes LT to flag; orchestrator
  exits 1.
- Edge case: introducing a `STYLE`-category LT match (e.g., a wordiness suggestion) does NOT cause exit 1; it appears
  only when `--warnings` is set.
- Edge case: file at `docs/brainstorms/<topic>.md` with banned phrase "we believe" is excluded by the file enumeration
  and does not flag. **Covers AE4.**
- Integration: pre-push (U7) invokes the orchestrator end-to-end and the exit code propagates correctly.

**Verification:**

- Manual run against current spec working tree completes in <5s with LT reachable, <2s LT-skipped.
- Each test scenario above is covered by a fixture under `scripts/__fixtures__/prose-check/<case>/` and asserted by the
  U7 test runner.

---

- U6. **Pool reachability probe (client-side wiring)**

**Goal:** Lock the reachability probe shape (`curl /v2/languages`, 2s timeout) on the client side. The `pool`-side
docker container provisioning, image pin, healthcheck, and recovery procedure are owned by the **sibling plan**:
[`2026-05-06-002-feat-languagetool-pool-deployment-plan.md`](2026-05-06-002-feat-languagetool-pool-deployment-plan.md).
This unit is the client half of the contract; the sibling plan is the service half.

**Requirements:** R8 (client-side expectation that LT runs on `pool`), R9 (graceful skip when unreachable)

**Dependencies:** U5 (the probe is wired into the orchestrator). NOT dependent on the sibling plan landing first — the
graceful-skip path means this plan ships even when LT is offline.

**Files:**

- (No new files in this unit — the probe is implemented as part of `scripts/prose-check.sh` in U5.)
- The deployment-side reference (`docs/architecture/languagetool-deployment.md`) is created by the **sibling plan U4**,
  not by this unit. This plan's contributor docs (U8) link to it.

**Approach:**

- Probe in `prose-check.sh`: `curl --max-time 2 -fsS "${LANGUAGETOOL_URL:-http://pool:8081}/v2/languages" >/dev/null
  2>&1` — flags chosen for: silent on success, fail on HTTP error, no progress meter. `LANGUAGETOOL_URL` env override
  exists so a contributor on a non-Tailnet machine can point at a local LT or skip via an unreachable URL.
- The probe shape is contractually locked with the sibling plan: same endpoint (`/v2/languages`), same expected response
  shape (200 + JSON language list), same timing budget (≤2s warm, ≤2s probe timeout). If the sibling plan moves to a
  different image or port in the future, both plans bump together.
- Per `docs/solutions/logic-errors/cli-linter-fork-bomb-recursive-self-invocation-20260401.md`: the probe never invokes
  `pool`-side binaries; only the LT HTTP API. No remote command execution surface to worry about.

**Patterns to follow:**

- The sibling plan's U3 verification — that's the integration test for the probe-meets-service contract.
- `docs/solutions/` deployment-notes pattern (post-implementation `/ce-compound`).

**Test scenarios:**

- Edge case: probe URL behind a host that resolves but refuses connection (e.g., `pool:9999`) — `curl --max-time 2`
  fails within ≤2s, orchestrator continues. **Covers AE2.**
- Edge case: probe URL returns 5xx — `--fsS` causes curl to exit non-zero, orchestrator skips with notice.
- Edge case: probe URL returns 2xx but slow (>2s) — `--max-time` cancels, orchestrator skips with notice (better safe
  than slow on every push).
- Happy path: probe URL returns 2xx fast — orchestrator proceeds to `/v2/check` invocation.

**Verification:**

- `bash scripts/prose-check.sh --vale-only` skips LT entirely (orthogonal to probe).
- `LANGUAGETOOL_URL=http://127.0.0.1:1 bash scripts/prose-check.sh` (port 1 always refuses) prints the skip notice
  within ~2s and exits on Vale's verdict alone.
- End-to-end probe-meets-service verification is the sibling plan's U3, not this unit's responsibility. Once both plans
  land, the sibling plan's verification proves the contract holds.

---

- U7. **Wire prose-check into spec's pre-push hook + author fixture regression tests**

**Goal:** Slot the prose-check stage and the per-pack-README drift check into `scripts/hooks/pre-push`. Add the test
runner that asserts each fixture triggers exactly the expected rule.

**Requirements:** R1, R2, R10

**Dependencies:** U2, U5 (orchestrator + generator must exist)

**Files:**

- Modify: `scripts/hooks/pre-push` (append two new stages after `check-release-version.sh`)
- Create: `scripts/test-prose-check.mjs`
- Create: `scripts/__fixtures__/prose-check/<case>/case.md` for each U1 + U5 fixture case

**Approach:**

- Append to `scripts/hooks/pre-push`. The new stages MUST redirect stdin to `/dev/null` because the branch-deletion
  short-circuit added by this unit consumes the git push protocol from stdin (`while read -r local_ref local_sha …`),
  and any child invocation that reads stdin would either swallow protocol bytes or fight for them. Pattern:

  ```bash
  echo "==> Checking pack-README drift (would any pack README regenerate differently?)"
  bun scripts/generate-pack-readme.mjs --check </dev/null

  echo "==> Running prose-check (Vale + LanguageTool)"
  scripts/prose-check.sh </dev/null
  ```

- The pack-README check runs first because it's cheap (parses YAML, diffs strings) and fails fast on stale READMEs.
- `scripts/test-prose-check.mjs`: spawn the orchestrator against each fixture, parse stdout, assert the expected rule
  fired and no others. Mirrors `scripts/test-validate-principles.mjs` pattern (`spawnSync`, exit-code + stdout-regex
  assertion). The pre-push hook does NOT run `test-prose-check.mjs` itself because it would run the orchestrator twice
  per fixture per push (slow); instead, it runs once via `scripts/prose-check.sh` and the test runner is invoked
  on-demand by developers (and could be wired into the existing `test-validate-principles.mjs` umbrella later).
- Update `scripts/hooks/pre-push`'s `find` exclude list (existing block at lines 41-48): no change — the orchestrator
  has its own scope, and the hook's existing `find` for md-wrap / markdownlint stays unchanged. The new stages don't
  interact with the existing file enumeration.

**Patterns to follow:**

- Existing pre-push pipeline structure (sequential stages, each with `echo "==> ..."` header)
- `scripts/test-validate-principles.mjs` (fixture test runner shape)

**Test scenarios:**

- Happy path: clean working tree, `bash scripts/hooks/pre-push` exits 0 with all stages reporting success.
- Edge case: branch deletion on push (`local_sha` is `0000000000000000000000000000000000000000`) — adopt the site's
  short-circuit pattern (`[[ "$local_sha" == "0000"* ]] && exit 0`). The current spec hook lacks this; add it as part of
  this unit. (Cross-referenced with `agentnative-site/scripts/hooks/pre-push` for the exact shape.)
- Error path: introducing "we believe" into `principles/p1-*.md` causes pre-push to exit 1 at the prose-check stage.
- Error path: adding a `tokens:` entry to `styles/Brand/MarketingRegister.yml` without rerunning `bun
  scripts/generate-pack-readme.mjs` causes pre-push to exit 1 at the drift-check stage.
- Edge case: when `pool` is unreachable AND the working tree is clean except for prose, pre-push prints the skip notice
  and exits 0 (Vale-only verdict). **Covers AE2.**
- Integration: each U1 fixture case is verified by `bun scripts/test-prose-check.mjs` against the orchestrator. Fixture
  files live under `scripts/__fixtures__/prose-check/<case>/case.md` and are explicitly excluded from the pre-push scope
  (existing `-not -path './scripts/__fixtures__/*'` covers this).

**Verification:**

- `bash scripts/hooks/pre-push` on a clean working tree exits 0 with all eight stages reporting success.
- `bun scripts/test-prose-check.mjs` runs all fixtures and reports `OK (<N> cases)`.

---

- U8. **Document the SoT split + sync model + contributor flow**

**Goal:** Capture the BRAND.md/`.impeccable.md`/pack-README architecture, the consumer-sync model (manual at v1,
sync-spec.sh extension deferred), and the one-time `git config core.hooksPath scripts/hooks` activation step in
contributor-facing docs.

**Requirements:** R5, R6, R7, R11

**Dependencies:** U3 (BRAND.md / `.impeccable.md` are restructured first; doc references their final shape)

**Files:**

- Create: `docs/architecture/voice-enforcement.md` (new doc — top-level architecture: layered SoT, generator script,
  pre-push integration, contributor flow, deferred follow-ups)
- Modify: `principles/AGENTS.md` (one-paragraph addition: "Voice enforcement: the Brand and Spec rule packs at
  `styles/<Pack>/` are SoT for enforceable voice rules; BRAND.md and `.impeccable.md` carry narrative identity. See
  `docs/architecture/voice-enforcement.md`.")
- Modify: `CONTRIBUTING.md` (add a "Voice enforcement" subsection: pre-push hook activation, manual prose-check
  invocation, `pool` reachability assumption, what to do when LT is unreachable.)
- Modify: `AGENTS.md` (top-level — reference the new prose-check stage in the pre-push pipeline summary; do NOT
  duplicate the architecture there.)

**Approach:**

- `docs/architecture/voice-enforcement.md` follows the established `docs/architecture/` pattern (if one exists; if not,
  create the directory). Sections: Layered SoT, Per-pack README generation, Pre-push integration, Manual invocation,
  Pool reachability + skip behavior, Deferred follow-ups (consumer sync-spec.sh extension, cli/skill enforcement).
- Cross-link from BRAND.md → `docs/architecture/voice-enforcement.md` for the architectural context; from
  `.impeccable.md` → `docs/architecture/voice-enforcement.md` likewise.
- `CONTRIBUTING.md` addition: one-time activation `git config core.hooksPath scripts/hooks` (already documented for
  existing pre-push stages — augment to mention prose-check needs `vale` + `jaq` on `$PATH`).

**Test scenarios:**

- *Test expectation: none — this is a documentation unit.*
- Verification is by U7's pre-push pass: the new doc files are in-scope `*.md` and must conform to BRAND.md voice. If
  any new file fails Vale, rewrite — not exception.

**Verification:**

- `bash scripts/prose-check.sh` against the working tree (with the new docs) exits 0.
- A fresh clone + `git config core.hooksPath scripts/hooks` + `brew install vale jaq` makes the new pre-push runnable
  end-to-end.

---

### Site-side units (split out)

The site-side parallel work (originally numbered U9 + U10) lives in the companion plan at
[`agentnative-site/docs/plans/2026-05-07-001-feat-prose-check-site-plan.md`](../../../agentnative-site/docs/plans/2026-05-07-001-feat-prose-check-site-plan.md).
That plan covers the brand-pack copy from spec, the fresh Site channel pack authored from
`agentnative-site/.impeccable.md`, the orchestrator copy, and the pre-push wiring on the site repo's existing hook.

The site plan reuses the orchestrator and rule-pack design decisions captured here without re-litigating them; the spec
voice-enforcement architecture doc ([`docs/architecture/voice-enforcement.md`](../architecture/voice-enforcement.md)) is
the canonical reference both plans cite.

<details>
<summary>Original U9 / U10 / AE3 cross-repo footnote (preserved for traceability)</summary>

- U9. **Site repo: copy Brand pack manually + author Site channel pack + `.vale.ini`** *(target repo:
  `agentnative-site`)*

**Goal:** Stand up Vale enforcement in `agentnative-site` for v1 by copying the Brand pack from spec one time and
authoring a Site channel pack from the existing site `.impeccable.md`. R4 site-enforcement requirement.

**Requirements:** R4, R7, R11

**Dependencies:** U1 (Brand pack must exist in spec to copy from), U2 (the README generator runs in site too)

**Files (target repo: `agentnative-site`):**

- Create: `agentnative-site/.vale.ini` (parallel to spec's, with `BasedOnStyles = Vale, Brand, Site, write-good,
  proselint`; note `Site` in place of `Spec`)
- Create: `agentnative-site/styles/Brand/*.yml` (six rule files copied verbatim from spec — equivalent of `git checkout
  brettdavies/agentnative:styles/Brand/* -- styles/Brand/`)
- Create: `agentnative-site/styles/Brand/README.md` (regenerated locally by running the generator script copied from
  spec)
- Create: `agentnative-site/styles/Site/*.yml` (channel-specific rules derived from `agentnative-site/.impeccable.md` —
  visual-system terminology, palette references, font-name list, etc. The exact rules are decided at implementation time
  by reading the site's `.impeccable.md` against the rule-extension catalog.)
- Create: `agentnative-site/styles/Site/README.md` (regenerated by running the generator)
- Create: `agentnative-site/scripts/prose-check.sh` (parallel to spec's; bun-friendly since site IS a bun project)
- Create: `agentnative-site/scripts/generate-pack-readme.mjs` (copy from spec)
- Modify: `agentnative-site/.gitignore` (add `styles/proselint/`, `styles/write-good/`, `styles/.vale-config/`)
- Modify: `agentnative-site/.impeccable.md` (strip the visual-system literals where they exist as enforceable lists;
  refactor narrative to be parallel with spec's `.impeccable.md` shape — pointer to `styles/Site/README.md`. The
  existing TODO at the top of site's `.impeccable.md` ("trim to inherit shared identity from agentnative-spec/BRAND.md")
  gets resolved here.)

**Approach:**

- Manual copy at v1 means: from inside the site checkout, copy each rule file from a sibling spec checkout via `git -C`
- `git show`, which works without modifying either repo's working tree:

  ```bash
  cd ~/dev/agentnative-site
  mkdir -p styles/Brand
  for f in MarketingRegister.yml HedgeWords.yml FillerAdjectives.yml; do
    git -C ../agentnative-spec show HEAD:styles/Brand/$f > styles/Brand/$f
  done
  # also copy the generator script and re-run it locally to produce site-side READMEs:
  git -C ../agentnative-spec show HEAD:scripts/generate-pack-readme.mjs > scripts/generate-pack-readme.mjs
  bun scripts/generate-pack-readme.mjs
  ```

  `git checkout <other-repo-path>:<file>` is NOT valid syntax — `git checkout` only resolves refs in the current repo's
  object database. Use `git -C <path> show HEAD:<file>` (or add the spec as a temporary remote and `git fetch`) to read
  out of a sibling checkout. Commit the copies. Document the one-shot procedure in `agentnative-site/CONTRIBUTING.md` so
  a future contributor knows how the v1 manual sync was done.

- Site channel pack is authored fresh from `agentnative-site/.impeccable.md`; rule shape is decided by reading the
  current site `.impeccable.md` and translating each enforceable bullet into a YAML rule. Likely candidates: banned font
  names ("Inter", "Plex", "Fraunces", "Lora", "DM Sans", "Space Grotesk", "Instrument Serif", "Outfit", "Plus Jakarta
  Sans" — per the existing "second-favorite font reflex" ban), banned aesthetic terms ("hero section", "glassmorphism",
  "card grid", "sparkline" — context-bounded), and required terms ("OKLCH" preferred over hex when discussing palette).
  The full list is decided at U9 implementation time.

**Patterns to follow:**

- Spec's `.vale.ini`, `styles/Brand/*.yml`, `scripts/prose-check.sh` (this unit copies/parallels them).

**Test scenarios:**

- Happy path: a clean `agentnative-site/content/principles/<file>.md` produces no Vale findings under `Brand + Site +
  write-good + proselint`.
- Edge case: a file under `agentnative-site/docs/research/` is excluded by the orchestrator's file enumeration (parallel
  to spec's exclusion list).
- Error path: introducing "we believe" into `agentnative-site/README.md` causes Vale to flag with
  `Brand.MarketingRegister`. **Covers AE1 site-side.**
- Error path: introducing "Inter" as a font reference into `agentnative-site/.impeccable.md` causes Vale to flag with
  `Site.BannedFontNames` (or whatever the rule is named).
- Edge case: site `coverage/matrix.json` and `bun.lock` are not `*.md` and not visited.
- Integration: `cd agentnative-site && bash scripts/prose-check.sh` exits 0 against a clean tree, exits 1 when a banned
  phrase is introduced.

**Verification:**

- `bash agentnative-site/scripts/prose-check.sh` exits 0 against current site working tree (will likely require some
  cleanup of pre-existing prose drift — flag that in the PR).
- `bun agentnative-site/scripts/generate-pack-readme.mjs --check` exits 0 against the freshly-copied Brand pack and
  freshly-authored Site pack.

---

- U10. **Site repo: wire prose-check into existing pre-push hook** *(target repo: `agentnative-site`)*

**Goal:** Slot prose-check into `agentnative-site/scripts/hooks/pre-push` as a new stage in the existing pipeline (lint,
build, test, wrangler dry-run).

**Requirements:** R2, R4

**Dependencies:** U9 (Vale config + packs + orchestrator must exist site-side)

**Files (target repo: `agentnative-site`):**

- Modify: `agentnative-site/scripts/hooks/pre-push` (append a `bun scripts/generate-pack-readme.mjs --check` stage and a
  `scripts/prose-check.sh` stage)

**Approach:**

- Append two new stages after the existing pipeline. Since site's existing hook uses `bun run lint` etc., the prose
  stage fits naturally as another `bun`-prefixed step. Format:

  ```bash
  echo "==> Pack-README drift check"
  bun scripts/generate-pack-readme.mjs --check

  echo "==> prose-check"
  bash scripts/prose-check.sh
  ```

- Site's hook already has the branch-deletion short-circuit (skips on `0000…` SHAs) and the `bold()` helper — reuse,
  don't duplicate.

**Patterns to follow:**

- `agentnative-site/scripts/hooks/pre-push` (existing stages and helper functions)
- Spec's `scripts/hooks/pre-push` (the parallel stages added in U7)

**Test scenarios:**

- Happy path: clean site working tree, `bash scripts/hooks/pre-push` exits 0 with all stages success.
- Error path: introducing "we believe" into `agentnative-site/README.md` causes pre-push exit 1 at the prose-check
  stage. **Covers AE1 site-side.**
- Edge case: branch-deletion push short-circuits before prose-check stage. (Verifies the existing short-circuit still
  works after the new stages are appended.)
- Edge case: `pool` unreachable from site machine causes prose-check to skip LT and exit on Vale verdict alone. **Covers
  AE2 site-side.**

**Verification:**

- `bash agentnative-site/scripts/hooks/pre-push` exits 0 against current site working tree.

---

**AE3 cross-repo verification (no separate unit — runs as a PR-description checkbox alongside U7 and U10).** Origin AE3
asserts no CI workflow fires on PR or release events for prose-check; the pre-push hook is the only enforcement surface.
The implementer runs `rg -i 'vale|prose-check|languagetool' .github/workflows/` in both repos and includes the empty
output in the PR descriptions for U7 (spec) and U10 (site). U7's verification list includes "AE3: spec-side `rg` returns
zero matches"; U10's verification list includes "AE3: site-side `rg` returns zero matches". No separate unit because the
work is a single grep with no behavioral artifact. **Covers AE3.**

</details>

**AE3 (spec-side, retained):** the implementer runs `rg -i 'vale|prose-check|languagetool' .github/workflows/` in this
repo as part of U7's verification and includes the empty output in the PR description. Site-side AE3 is the same check
re-run in the site plan's pre-push wiring unit.

---

## System-Wide Impact

- **Interaction graph:** The prose-check is read-only — it never edits markdown, never re-stages files, never invokes
  `git add`. The pack-README generator writes only to `styles/<Pack>/README.md` and only when invoked without `--check`.
  The pre-push hook is the only place `--check` runs by default.
- **Error propagation:** Vale exit 1 (any error-tier finding) → orchestrator exit 1 → pre-push exit 1 → push refused.
  LanguageTool blocking matches → orchestrator exit 1 → pre-push exit 1. Pool unreachable → orchestrator continues on
  Vale verdict alone (per R9 graceful skip). Any unexpected `set -e` trip in the orchestrator surfaces as exit ≥1 (push
  refused with the offending command's output) — the standard git escape hatch (`--no-verify`) remains available but is
  not endorsed (per R10).
- **State lifecycle risks:** None — prose-check is purely read-only over the working tree and does not touch git state,
  the index, or remote refs.
- **API surface parity:** Spec and site both ship `scripts/prose-check.sh` with the same flag surface (`--changed-only`,
  `--warnings`, `--lt-only`, `--vale-only`). Future cli/skill repos inherit the same surface when they earn enforcement.
  This parity is the architectural cost of the multi-repo split — keep it explicit.
- **Integration coverage:** AE1 (banned phrase blocks push) is verified end-to-end by U7's fixture test runner. AE2
  (offline graceful skip) is verified by toggling `LANGUAGETOOL_URL` to a refused port. AE4 (meta-doc exclusion) is
  verified by a fixture under `scripts/__fixtures__/prose-check/meta-doc-exclusion/`. AE6 (BRAND.md identity sections
  unchanged when only enforceable rules change) is verified by a code-review checklist item, not by automation —
  identity-vs-enforceable is a structural, not behavioral, distinction.
- **Unchanged invariants:** The principles `requirements[]` IDs in frontmatter (existing machine contract), the
  `last-revised` bump-only-for-tier-changes rule, the `cliff.toml` changelog-extraction parser shape, and the existing
  pre-push pipeline stages (md-wrap → markdownlint → check-links → validate-principles → release-version) are all
  unchanged. The new prose-check appends; it does not modify or replace any existing stage.

---

## Risks & Dependencies

| Risk                                                                                                     | Likelihood | Impact | Mitigation                                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `vale sync` fails on first push (network down on dev machine, GitHub release zip URL changed)            | Med        | Med    | `vale sync` runs as part of one-time setup, not pre-push. Document in CONTRIBUTING.md the manual `vale sync` step. Pin `Packages` URLs to immutable release zips; bump explicitly when upstream releases.                                                                                  |
| `pool` is unreachable on most pushes (Tailscale offline, container down, OS maintenance)                 | Med        | Low    | R9 graceful skip — push proceeds on Vale verdict alone, with notice. The trade-off is conscious: LT is grammar/spelling, not voice; missing it temporarily does not erode the standard.                                                                                                    |
| `meyay/languagetool` digest drift between document and `pool`-side compose                               | Low        | Low    | The digest is captured in `docs/architecture/languagetool-deployment.md`; updates are PRs, not silent edits. The reachability probe verifies SOMETHING is alive, not that the version matches.                                                                                             |
| Vale flags pre-existing prose drift in BRAND.md / `.impeccable.md` / README / RELEASES on first run      | High       | Low    | Expected. The first-run pass IS the cleanup — any flagged item is a real drift that either gets rewritten or has its rule demoted to `warning` in `.vale.ini` with a comment explaining why. Resist exception-by-rule-disable; rewriting is the loop.                                      |
| `proselint`/`write-good` fight brand voice with high-noise rules (`Passive`, `E-Prime`, `proselint.But`) | High       | Low    | Mitigated in U4 by pre-emptively demoting/disabling the known offenders. Iterate via `.vale.ini` comments after first-run dry runs.                                                                                                                                                        |
| Site copy of Brand pack drifts from spec because manual copy at v1 has no integrity check                | Med        | Med    | Acknowledged; the deferred follow-up is the structural fix (consumer sync-spec.sh extension + sha256 byte-equivalence test). v1 mitigation: short delta-window (hours, not weeks) between spec U1 commit and site U9 commit; both land in the same PR sequence.                            |
| New rule fires on a legitimate technical term (e.g., "robust" in the literal `robust statistics` sense)  | Med        | Low    | Vale's `Vocab` provides per-style accept-list. Add the term to `styles/config/vocabularies/Brand/accept.txt` or scope the rule with `scope:` boundaries. Document the procedure in `docs/architecture/voice-enforcement.md`.                                                               |
| Pre-push throughput regresses for large change sets (e.g., a 30-file refactor)                           | Low        | Med    | Default to full scope; rely on `--changed-only` flag for manual fast-iteration. If pre-push throughput becomes a real complaint, add `xargs -P4` parallelization in U5 or short-circuit changed-only by default in pre-push.                                                               |
| Bun is not installed on a contributor's machine                                                          | Med        | Med    | `bun` is in the user's homebrew list; document `brew install bun` in CONTRIBUTING.md alongside `vale` and `jaq`. If a contributor strictly cannot install bun, the generator can be re-run by anyone else; the `--check` invocation in pre-push will fail until the README is regenerated. |
| Image-pin digest for `meyay/languagetool` rotates and `pool` falls behind                                | Low        | Low    | The reachability probe doesn't care about version. Out-of-band image bumps (re-pull, re-pin digest in compose) are operational; the prose-check stack is decoupled.                                                                                                                        |

### Dependencies / Prerequisites

- `vale` v3.x available via `brew install vale` on macOS development machines.
- `jaq` available via `brew install jaq` (already in user's brew list).
- `bun` available via `brew install bun` (already in user's brew list).
- `js-yaml@4.1.0` available via the existing pre-push install-on-run pattern (`npm install --no-save --silent`).
- `pool` host runs `meyay/languagetool` docker container reachable over Tailscale on port 8081 (or override via
  `LANGUAGETOOL_URL`).
- BRAND.md and `.impeccable.md` exist in the spec repo (currently on `feat/v0.4.0` and `docs/v0.3.1`; v1 enforcement
  requires them landing on `dev` first — same merge order as the v0.4.0 release).

---

## Phased Delivery

### Phase 1 — Spec-side enforcement (U1 → U8)

Land `styles/brand/`, `styles/spec/`, `.vale.ini`, the orchestrator, the README generator, the BRAND.md/`.impeccable.md`
restructure, the pre-push wiring, and the documentation. Spec repo enforces immediately at push time. AE1, AE2, AE3,
AE4, AE6 verified spec-side.

### Phase 2 — Site-side enforcement (companion plan)

Tracked in
[`agentnative-site/docs/plans/2026-05-07-001-feat-prose-check-site-plan.md`](../../../agentnative-site/docs/plans/2026-05-07-001-feat-prose-check-site-plan.md).
AE1, AE2, AE3, AE4 verified site-side once that plan ships; AE5 verified at the manual-copy level for v1.

### Deferred — Consumer sync-spec.sh extension (separate PRs per consumer)

Each of `agentnative-site/scripts/sync-spec.sh`, `agentnative-cli/scripts/sync-spec.sh`,
`agentnative-skill/scripts/sync-spec.sh`, `agent-skills/agentnative/scripts/sync-spec.sh` extends to also pull
`styles/Brand/` from the spec at tag time. AE5 re-verified at the automated-sync level once these land. Each consumer
also adds an `sha256` byte-equivalence regression test against the spec copy at sync time.

### Deferred — `agentnative-cli` / `agentnative-skill` enforcement

Gated on each repo earning a channel `.impeccable.md`. When the channel decisions accumulate, that repo runs work
equivalent to U9 and U10 locally.

---

## Documentation Plan

- `docs/architecture/voice-enforcement.md` (NEW) — architecture and contributor flow.
- `BRAND.md` — restructured per U3.
- `.impeccable.md` — restructured per U3.
- `principles/AGENTS.md` — one-paragraph addition per U8.
- `CONTRIBUTING.md` — voice-enforcement subsection per U8.
- `AGENTS.md` (top-level) — pipeline-summary update per U8.
- `RELEASES.md` — does NOT need a change for v1; the prose-check stack is internal contributor tooling, not a user-
  facing artifact (per the "user-facing changes only" changelog convention). The stack's existence may surface in a
  future `feat:` commit message but no `## Changelog` body line is required.

---

## Operational / Rollout Notes

- **One-time setup per contributor:**

  ```bash
  brew install vale jaq bun
  cd ~/dev/agentnative-spec
  git config core.hooksPath scripts/hooks
  vale sync
  ```

- **Roll-out cadence:** Spec U1-U8 ships on `agentnative-spec/docs/v0.3.1`. Site-side enforcement is queued in the
  companion plan
  [`agentnative-site/docs/plans/2026-05-07-001-feat-prose-check-site-plan.md`](../../../agentnative-site/docs/plans/2026-05-07-001-feat-prose-check-site-plan.md);
  it lands as a separate PR in the site repo after v0.3.1 cuts over to dev. AE3 verification is a one-paragraph
  PR-description checkbox, not a separate PR.
- **Rollback posture:** If prose-check creates more friction than value (e.g., LT false-positive rate is unsustainable),
  the path back is a single `.vale.ini` `MinAlertLevel = warning` change to demote everything to advisory, OR removing
  the prose-check stage from the pre-push hook. The rule packs themselves stay (they are still SoT for enforceable
  voice; only the enforcement tier changes).
- **Monitoring:** None — this is local-only tooling. Drift signals come from contributor friction reports and from `git
  log --grep="prose-check skip"` to count how often LT was unreachable on push. The decision threshold for adding
  n-grams to the LT deployment is "if `CONFUSED_WORDS` matches are noticeably noisy after 30 days of real use."
- **Related telemetry:** A future `/ce-compound` capture documents the Vale-vs-LT tradeoffs, the reachability probe
  pattern, and the per-pack-README progressive-disclosure decision. Captured after v1 ships and runs against several
  real PRs.

---

## Sources & References

- **Sibling plan (operational counterpart):**
  [`2026-05-06-002-feat-languagetool-pool-deployment-plan.md`](2026-05-06-002-feat-languagetool-pool-deployment-plan.md)
  — provisions the LanguageTool docker container on `pool`. Lands in parallel; neither plan blocks the other.
- **Companion plan (site-side enforcement):**
  [`agentnative-site/docs/plans/2026-05-07-001-feat-prose-check-site-plan.md`](../../../agentnative-site/docs/plans/2026-05-07-001-feat-prose-check-site-plan.md)
  — site-repo parallel to this stack (originally U9 + U10 here). Inherits all design decisions captured in this plan
  plus the voice-enforcement architecture doc.
- **Architecture (shipped):** [`docs/architecture/voice-enforcement.md`](../architecture/voice-enforcement.md) — layered
  SoT, orchestrator, pre-push integration, deferred follow-ups.
- **Origin document:**
  [docs/brainstorms/2026-05-06-prose-check-stack-requirements.md](../brainstorms/2026-05-06-prose-check-stack-requirements.md)
- **Existing pre-push hook (spec):** `scripts/hooks/pre-push`
- **Existing pre-push hook (site):** `agentnative-site/scripts/hooks/pre-push`
- **Existing sync pattern (site):** `agentnative-site/scripts/sync-spec.sh`
- **Brand identity SoT (current, on `feat/v0.4.0`):** `BRAND.md`, `.impeccable.md`
- **Cross-repo learnings:**
- `docs/solutions/best-practices/prose-spec-repo-pre-push-pipeline-20260422.md`
- `docs/solutions/best-practices/tracked-git-hooks-core-hookspath-20260401.md`
- `docs/solutions/best-practices/sot-contract-for-spec-repos-with-downstream-consumers-2026-04-22.md`
- `docs/solutions/best-practices/agentnative-version-model-2026-05-01.md`
- `docs/solutions/architecture-patterns/cross-repo-artifact-sync-commit-over-fetch-20260420.md`
- `docs/solutions/best-practices/byte-equivalence-regression-tests-for-copied-design-artifacts-2026-04-14.md`
- **External docs:**
- <https://vale.sh/docs/styles>, <https://vale.sh/docs/checks/existence>, <https://vale.sh/docs/keys/packages>,
  <https://vale.sh/manual/sync/>
- <https://dev.languagetool.org/public-http-api.html>, <https://languagetool.org/http-api/swagger-ui/>
- <https://hub.docker.com/r/meyay/languagetool>, <https://github.com/meyayl/docker-languagetool>
- <https://github.com/errata-ai/proselint>, <https://github.com/errata-ai/write-good>
