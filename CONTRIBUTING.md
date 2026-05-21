# Contributing to the Agent-Native CLI Standard

This document is the canonical routing guide for all contributions across the four-repo ecosystem. For visitor-facing
cross-repo navigation, see [`anc.dev/contribute`](https://anc.dev/contribute).

## Contribution tiers

The spec accepts three shapes of contribution. All three are welcome; none is required. Most spec-repo work is Tier 1 or
Tier 2 because the principle text itself changes through the documented revision mechanism, not through visitor-authored
PRs.

| Tier            | Shape                                                                                                                                                                                                                                                                                                                            | Intake                                                                                                                                                                                                    | Effort   |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **1. Signal**   | A finding against a principle's wording, a missing citation, a contradiction between two principles, a request for clarification                                                                                                                                                                                                 | [`pressure-test`](https://github.com/brettdavies/agentnative/issues/new?template=pressure-test.yml) / [`spec-question`](https://github.com/brettdavies/agentnative/issues/new?template=spec-question.yml) | ~5 min   |
| **2. Proposal** | A new principle the spec is missing, a MUST/SHOULD tier change with rationale, a counter-example that breaks an applicability clause                                                                                                                                                                                             | [`pressure-test`](https://github.com/brettdavies/agentnative/issues/new?template=pressure-test.yml) with the full case in the body                                                                        | ~1-2 hrs |
| **3. Code**     | Governance docs, CHANGELOG corrections, validator-script work, workflow improvements, badge / cross-repo automation. **Principle text changes do not happen via visitor-authored PRs.** They happen via Tier 2 pressure-tests that move the principle to `status: under-review`, then maintainer-authored PRs land the revision. | PR against `dev` per the branch-discipline rules                                                                                                                                                          | Variable |

The principle text is the canonical artifact and changes through the documented revision mechanism. See
[`principles/AGENTS.md` § Pressure-test protocol](principles/AGENTS.md) for the full lifecycle: `draft → under-review →
active → locked`.

**Response expectations:** Tier 1 and Tier 2 are welcome and get a substantive reply when time allows. A pressure-test
that names a specific failure mode and an implementer's reasoning is the contribution shape that lands fastest. Tier 3
PRs are reviewed when scope and time permit. Real PRs land; the queue is what the maintainer can actually read. The
standard takes positions because positions are useful; positions held without willingness to revise them are dogma.

## Where to file

| I want to...                               | File on                                                                                                   |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Propose a principle edit (pressure-test)   | [agentnative](https://github.com/brettdavies/agentnative/issues/new?template=pressure-test.yml)           |
| Submit a grading finding                   | [agentnative](https://github.com/brettdavies/agentnative/issues/new?template=grading-finding.yml)         |
| Ask a question about the spec              | [agentnative](https://github.com/brettdavies/agentnative/issues/new?template=spec-question.yml)           |
| Report a false positive/negative in `anc`  | [agentnative-cli](https://github.com/brettdavies/agentnative-cli/issues/new?template=false-positive.yml)  |
| Request a checker feature                  | [agentnative-cli](https://github.com/brettdavies/agentnative-cli/issues/new?template=feature-request.yml) |
| Report a scoring/CLI bug                   | [agentnative-cli](https://github.com/brettdavies/agentnative-cli/issues/new?template=scoring-bug.yml)     |
| Report a site bug (rendering, performance) | [agentnative-site](https://github.com/brettdavies/agentnative-site/issues/new?template=site-bug.yml)      |

## AI disclosure policy

All contributions require a one-sentence AI disclosure stating what was AI-written and what was human-written. This
applies to:

- Issue submissions (required field in all templates)
- Pull requests (required field in PR template)
- Follow-up comments on issues and PRs (if AI-assisted, add disclosure at the end)

**Examples:**

- "Entirely human-written."
- "Evidence gathered by hand; proposed wording drafted with Claude and edited."
- "Bug reproduction is human-observed; analysis section was AI-assisted."

## Human co-sign policy (graduated gate)

| Contribution type                | AI disclosure | Human co-sign |
| -------------------------------- | ------------- | ------------- |
| Bug reports                      | Required      | Not required  |
| Grading findings                 | Required      | Not required  |
| Spec questions                   | Required      | Not required  |
| Principle edits (pressure-tests) | Required      | **Required**  |
| Pull requests                    | Required      | **Required**  |

"Human co-sign" means a human reviewed and approved the submission before it was filed. The pressure-test and PR
templates include a required field for the GitHub handle of the human reviewer.

## Coupled release protocol

A principle revision is only complete when the corresponding checker has been reviewed. When submitting a PR that
changes a principle's MUST/SHOULD/MAY requirements:

1. Open the PR against this repo (agentnative)
2. In the PR body, include **one** of:

- A link to the companion PR in `brettdavies/agentnative-cli` (e.g.,
  `https://github.com/brettdavies/agentnative-cli/pull/42`)
- The text "no check changes needed" with a brief justification

This ensures the spec and checker stay in sync. The spec version bumps when a principle's revision date changes.

## Badge claim

CLI tools whose scorecards meet the agent-native floor can embed a live-score badge in their READMEs. The full claim
convention (eligibility, embed URL pattern, version pinning, honesty expectation, and regression behavior) lives in
[`docs/badge.md`](docs/badge.md). The badge SVG is rendered on `anc.dev` from the tool's current scorecard.

## Misrouted issues

If an issue lands in the wrong repo, it will be transferred to the correct one (all repos are under the same org). A
`misrouted` label is applied before transfer so routing guidance can be improved.

## Search before creating

Before filing an issue, search for existing ones:

```bash
gh search issues --repo brettdavies/agentnative "<keywords>"
gh search issues --repo brettdavies/agentnative-cli "<keywords>"
```

Duplicate issues fragment discussion and slow resolution.

## Versioning policy

- Each principle carries a `last-revised: YYYY-MM-DD` date in frontmatter.
- The date updates when any MUST/SHOULD/MAY changes tier, is added, or is removed, AND when the requirement frontmatter
  shape or ID contract changes (adding `requirements[]`, renaming an `id`, changing the `applicability` shape, etc.).
  Downstream consumers pin against the frontmatter, so a shape change is a consumer-visible change.
- Prose-only edits (clarity, examples, typos) do NOT update the date.
- The spec version (in `VERSION`) bumps:
- **MINOR**: MUST changes, OR changes to the requirement frontmatter shape / ID contract.
- **PATCH**: SHOULD/MAY changes, prose edits to an existing requirement.

See [`RELEASES.md` § Release gating](RELEASES.md#release-gating) for when a VERSION bump produces a tagged release vs.
when changes land on `main` without a tag.

## Contributor setup

The repo ships a pre-push hook that runs eight stages before each push: markdown wrap, markdownlint, link check,
principle-frontmatter validation, validator regression fixtures, release-version semver check, pack-README drift check,
and the prose-check stack (Vale rule packs + LanguageTool). Activate the hook once after clone:

```bash
brew install vale jaq bun
git config core.hooksPath scripts/hooks
mkdir -p styles && vale sync
```

First push installs `js-yaml@4.1.0` into a gitignored `node_modules/`; `vale sync` pulls the gitignored baseline packs
(`write-good`, `proselint`) from the URLs pinned in `.vale.ini`. Subsequent runs are fast. No remote CI replaces this; a
failing hook is the gate.

### Voice enforcement

The pre-push prose-check stage covers Vale (custom Brand + Spec rule packs, plus `write-good` and `proselint`) and
LanguageTool grammar checks. LanguageTool is an optional install; recommended if installed. When unreachable, the
orchestrator skips it with a notice and the push proceeds on Vale's verdict alone.

Manual invocation during authoring:

```bash
scripts/prose-check.sh --changed-only       # fast iteration
scripts/prose-check.sh --warnings           # surface advisory findings
scripts/prose-check.sh --vale-only          # offline (skip LT)
```

Authoritative narrative: [`BRAND.md`](BRAND.md) (universal voice) and [`PRODUCT.md`](PRODUCT.md) (spec channel
register). The Vale rule pack at `styles/brand/` is the executable contract for universal anti-patterns; `styles/spec/`
covers the spec channel.

Channel design context: canonical filename is `PRODUCT.md`. Legacy `.impeccable.md` is migrated by `/impeccable`'s
`load-context.mjs` on first invocation; commit the rename atomically rather than letting drift accumulate. No backward
compatibility: migrate when convenient, but commit fully.
