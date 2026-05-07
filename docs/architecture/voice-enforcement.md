---
title: "Voice enforcement: rule packs, generator, pre-push integration"
type: architecture
status: active
date: 2026-05-07
related:
  - docs/plans/2026-05-06-001-feat-prose-check-stack-plan.md
  - docs/plans/2026-05-06-002-feat-languagetool-pool-deployment-plan.md
  - docs/architecture/languagetool-deployment.md
  - BRAND.md
  - .impeccable.md
---

# Voice enforcement: rule packs, generator, pre-push integration

Operational reference for the agentnative spec repo's deterministic prose-check stack — how rule packs, the per-pack
README generator, the orchestrator, the pre-push hook, and the LanguageTool service compose to enforce the voice
contracts that BRAND.md and `.impeccable.md` describe in narrative form.

## Layered source of truth

```text
LAYER 1 — Identity (narrative SoT, human-authored)
  BRAND.md                     universal voice anchors, channels, anti-pattern categories with rationale
  .impeccable.md               spec channel register, anti-pattern categories with rationale

LAYER 2 — Reference companion (derivative, generated)
  styles/Brand/README.md       auto-generated from styles/Brand/*.yml; lists enforced literals + rationale
  styles/Spec/README.md        auto-generated from styles/Spec/*.yml

LAYER 3 — Enforcement (executable SoT for literals)
  styles/Brand/*.yml           Vale rule pack — universal anti-patterns
  styles/Spec/*.yml            Vale rule pack — spec-channel register
  styles/proselint/*           Vale-synced from a pinned release zip
  styles/write-good/*          Vale-synced from a pinned release zip
```

The split inverts the usual "doc describes the rule" convention: the YAML pack IS the rule, the README is its
human-readable companion, and BRAND.md plus `.impeccable.md` describe categories and rationale without literal lists. A
contributor reads BRAND.md to understand the rationale for a category, then references the pack README to see exactly
which strings fire.

## Rule packs

Custom packs, committed and owned:

| Pack | Rules | Narrative source |
| - | - | - |
| `styles/Brand/` | `MarketingRegister`, `HedgeWords`, `FillerAdjectives` | BRAND.md § Universal anti-patterns |
| `styles/Spec/` | `RFCKeywords`, `FirstPersonPlural`, `SecondPersonImperative` | `.impeccable.md` § Register |

Each rule sets `level: warning` in its YAML; `.vale.ini` promotes Brand and Spec rules to `error` for the spec channel.
Channel-specific opt-up or opt-down lives in the per-channel `.vale.ini`, not in the pack itself, so the pack stays
shareable across channels.

`Spec.RFCKeywords` runs case-sensitive (`ignorecase: false`) so it flags lowercase `must` / `should` / `may` / `shall`
while leaving the legitimate uppercase RFC keywords alone.

## Per-pack README generator

`scripts/generate-pack-readme.mjs` (bun) reads each pack's `*.yml` and emits `styles/<Pack>/README.md`. The generated
file lists the literal phrases or regex enforced by each rule, the source narrative, and a link to BRAND.md or
`.impeccable.md` for rationale.

```bash
bun scripts/generate-pack-readme.mjs            # writes both Brand and Spec READMEs
bun scripts/generate-pack-readme.mjs --check    # drift check; exits 1 if a YAML changed without regen
bun scripts/generate-pack-readme.mjs Brand      # target a specific pack
```

The trailing HTML comment on each generated README names the script and flags the file as do-not-edit. Pre-push runs
`--check`; contributors regenerate before pushing when a token changes.

## Vale config

`.vale.ini` composes:

- Custom packs: `Brand`, `Spec` (committed in this repo).
- Baseline packs: `write-good@v0.4.1`, `proselint@v0.3.4` (gitignored, materialized locally by `vale sync` from URLs
  pinned in the `Packages` directive).
- Vocabulary: `Vocab = Brand` activates `styles/config/vocabularies/Brand/{accept,reject}.txt`.
- Severity overrides: Brand and Spec rules at `error`; `write-good.Passive` and `write-good.TooWordy` at `warning`;
  `write-good.E-Prime`, `proselint.But`, `proselint.Annotations`, and `Vale.Terms` disabled.

Excluded paths (via empty `BasedOnStyles =`): `docs/{brainstorms,plans,research}/`, `AGENTS.md`, `CHANGELOG.md` — these
are meta-docs or generated artifacts that do not carry the voice contract.

The vale-synced packs are gitignored intentionally. The contract propagates via the `Packages` URL; each contributor
runs `vale sync` once after clone to materialize them locally. Same model as `package.json` plus `node_modules/`.

## Orchestrator

`scripts/prose-check.sh` (bash, `set -euo pipefail`) is invoked by both the pre-push hook and contributors directly. The
orchestrator:

1. Enumerates in-scope `*.md` via `find` (or `git diff` with `--changed-only`).
2. Runs Vale once with `--output=JSON --minAlertLevel=warning`. Severity split happens orchestrator-side via `jaq`:
   error-tier findings block, warning-tier findings annotate when `--warnings` is set.
3. Probes LanguageTool at `LT_URL/v2/languages` with `curl --max-time 2`. When reachable, sends one POST `/v2/check` per
   file at concurrency 4 via `xargs -P4`. When unreachable, prints a skip notice annotated with the curl exit code (6 /
   7 / 28, each diagnosable) and proceeds on Vale's verdict alone (R9 graceful skip).
4. Filters LT matches by `rule.category.id` whitelist. v1 blocks on `TYPOS | GRAMMAR | CONFUSED_WORDS` only; the other
   four categories from the original plan surface as warnings. See "Deferred follow-ups — Markdown preprocessor for
   LanguageTool" for the re-promotion path.
5. Sorts findings by `file:line`, prints a `prose-check: <N> blocking, <M> warning` summary, and exits 1 on any blocking
   finding.

Flags:

| Flag | Effect |
| - | - |
| (none) | full scope, errors only — pre-push default |
| `--changed-only` | scope to files changed against `$PROSE_CHECK_BASE` (default `origin/dev`) |
| `--warnings` | surface warning-tier findings |
| `--vale-only` | skip LT entirely (offline iteration) |
| `--lt-only` | skip Vale entirely (LT debugging) |

Environment:

- `LANGUAGETOOL_URL` — LT base URL (default `http://pool.tail42ba87.ts.net:8081`). The FQDN avoids the macOS+Tailscale
  short-name DNS timeout failure mode; see `docs/architecture/languagetool-deployment.md` § Hostname guidance.
- `PROSE_CHECK_BASE` — git ref to diff against in `--changed-only` (default `origin/dev`).

## Pre-push integration

`scripts/hooks/pre-push` runs eight stages in order:

1. `md-wrap --check`
2. `markdownlint-cli2`
3. `check-links.mjs`
4. `validate-principles.mjs`
5. `test-validate-principles.mjs`
6. `check-release-version.sh`
7. **`generate-pack-readme.mjs --check`** (drift)
8. **`prose-check.sh`** (Vale + LT)

Stages 7 and 8 redirect child stdin to `/dev/null`. The branch-deletion short-circuit at the top of the hook reads the
git push protocol from stdin (`while read -r local_ref local_sha …`); a child invocation that also reads stdin would
swallow protocol bytes or fight for them.

Activation, one-time per contributor:

```bash
brew install vale jaq bun
cd ~/dev/agentnative-spec
git config core.hooksPath scripts/hooks
mkdir -p styles && vale sync
```

`vale sync` materializes the gitignored baseline packs from the `Packages` URLs in `.vale.ini`. The custom Brand and
Spec packs are already committed and need no sync.

## Manual invocation

```bash
# default — full scope, errors only
scripts/prose-check.sh

# fast iteration during authoring
scripts/prose-check.sh --changed-only

# offline (LT skip)
scripts/prose-check.sh --vale-only

# surface warning-tier findings
scripts/prose-check.sh --warnings
```

`scripts/test-prose-check.mjs` runs each fixture under `scripts/__fixtures__/prose-check/<case>/case.md` against Vale
and asserts the expected rule fires. Contributor-invoked, not wired into pre-push (the orchestrator already runs once
per push; running fixtures via the orchestrator would double the work).

## LanguageTool integration

LT runs as a docker container on `pool` over Tailscale. The orchestrator's contract with the service:

- Probe endpoint: `GET /v2/languages` — returns 200 with the supported language list once dictionary load completes.
- Check endpoint: `POST /v2/check` with form-encoded `language=en-US` and `text=<body>`.
- Trust boundary: Tailnet membership. The container does not expose to the public internet.

The deployment side (image digest pin, healthcheck contract, recovery procedure, n-grams enablement path) lives in
`docs/architecture/languagetool-deployment.md`. The two documents cover the two halves of the contract.

When LT is unreachable, the orchestrator prints a notice annotated with curl's exit code:

| curl exit | Cause | Recovery |
| - | - | - |
| 6 | DNS resolve failed | Tailscale likely off, or FQDN drift |
| 7 | Connection refused | Host up, LT service down — check `docker ps` on `pool` |
| 28 | Timed out | Network impaired, or service slow — check `docker inspect languagetool` |

Push proceeds on Vale's verdict alone; the LT-unreachable path does not block the push (R9 graceful skip). LT covers
grammar and spelling drift; it does not own the voice contract.

## Vocabularies

`styles/config/vocabularies/Brand/accept.txt` lists technical terms and proper names that Vale's built-in spell-checker
does not recognize. The list grew from the first-pass `Vale.Spelling` survey against the spec corpus. Add an entry when
a legitimate term fires `Vale.Spelling`; do not write a per-rule exception for spelling.

`reject.txt` is empty at v1 — placeholder for a future deny-list use.

The `Vocab = Brand` directive in `.vale.ini` activates the accept-list. `Vale.Terms` is disabled because it used the
Vocab as a case-canonicalization rule and fought the spec voice's pattern of using "CLI" (acronym in prose) and "cli"
(identifier in code) interchangeably.

## Deferred follow-ups

Tracked here so future work has explicit anchor points.

### Consumer sync via scripts/sync-spec.sh extension

Each consumer repo (`agentnative-site`, `agentnative-cli`, `agentnative-skill`, `agent-skills/agentnative`) extends its
`scripts/sync-spec.sh` to also pull `styles/Brand/` from the spec at vendoring time. v1 consumers do a one-time manual
copy. Extension is one PR per consumer; AE5 is re-verified at the automated-sync level once it lands.

### Channel `.impeccable.md` for cli and skill repos

`agentnative-cli` and `agentnative-skill` enforce the Brand pack universally but carry no channel-specific rules yet. A
repo earns its `.impeccable.md` when channel-specific decisions accumulate — terse error message rubric for the linter
channel, skill-bundle imperative voice for the skill channel. Each repo then runs work equivalent to U9 and U10 of
`docs/plans/2026-05-06-001-feat-prose-check-stack-plan.md`.

### Markdown preprocessor for LanguageTool

The v1 LT blocking whitelist is narrowed to `TYPOS | GRAMMAR | CONFUSED_WORDS`. The other categories (`PUNCTUATION |
TYPOGRAPHY | CASING | COMPOUNDING`) stay on the warning tier because LT misreads markdown syntax — table cell whitespace
fires `WHITESPACE_RULE`, `->` arrows fire `ARROWS`, code-fence remnants fire `UPPERCASE_SENTENCE_START`. The LT
maintainer's canonical position is that clients pre-filter markdown outside the LT request (issue
languagetool-org/languagetool#9626, closed 2023). Three v2 paths:

1. Roll a markdown preprocessor that strips code fences, tables, link syntax, and inline code spans before sending to
   LT, preserving source line numbers via blank-line replacement.
2. Wrap [LTeX+](https://github.com/ltex-plus/ltex-ls-plus) — the mature LSP-based markdown-aware LT client.
3. Use LT's `data` parameter with markup annotation: send `{annotation: [{text: "..."}, {markup: "..."}]}` so LT skips
   marked sections. Preserves offsets but requires a markdown→annotation converter.

Re-promote the demoted categories to blocking once one of these paths ships.

### LanguageTool n-grams

n-grams are off in the v1 deployment (rules-only ruleset). Enabling adds confusion-class detection beyond LT's hardcoded
patterns. Procedure documented at `docs/architecture/languagetool-deployment.md` § Enabling n-grams later. Decision
threshold: 30 days of real use; enable when `CONFUSED_WORDS` matches are noticeably noisy.

### Per-rule LT allowlist

If specific LT rules in non-blocking categories prove valuable, build a per-rule allowlist in the orchestrator alongside
the category whitelist: `LT_BLOCKING_RULES='^(THEIR_IS|YOUR_YOU_RE|…)$'`. Promotes specific high-signal rules without
re-introducing whole categories' noise.

### `docs/solutions/` capture

Post-v1, capture three patterns to `docs/solutions/` via `/ce-compound`:

- The Vale-vs-LT tradeoff and category-whitelist tuning loop.
- The Tailscale-LT FQDN reachability probe shape (deployment doc plus client probe).
- The per-pack README progressive-disclosure decision (BRAND.md narrative + auto-generated companion + executable YAML).

Captured after the stack runs against several real PRs, not before — the lessons need a contact-with-reality phase
first.
