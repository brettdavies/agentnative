# Contributing to the Agent-Native CLI Standard

This document is the canonical routing guide for all contributions across the three-repo ecosystem.

## Where to file

| I want to... | File on |
| --- | --- |
| Propose a principle edit (pressure-test) | [agentnative](https://github.com/brettdavies/agentnative/issues/new?template=pressure-test.yml) |
| Grade a real CLI against the standard | [agentnative](https://github.com/brettdavies/agentnative/issues/new?template=grade-a-cli.yml) |
| Ask a question about the spec | [agentnative](https://github.com/brettdavies/agentnative/issues/new?template=spec-question.yml) |
| Report a false positive/negative in `anc` | [agentnative-cli](https://github.com/brettdavies/agentnative-cli/issues/new?template=false-positive.yml) |
| Request a checker feature | [agentnative-cli](https://github.com/brettdavies/agentnative-cli/issues/new?template=feature-request.yml) |
| Report a scoring/CLI bug | [agentnative-cli](https://github.com/brettdavies/agentnative-cli/issues/new?template=scoring-bug.yml) |
| Report a site bug (rendering, performance) | [agentnative-site](https://github.com/brettdavies/agentnative-site/issues/new?template=site-bug.yml) |

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

| Contribution type | AI disclosure | Human co-sign |
| --- | --- | --- |
| Bug reports | Required | Not required |
| CLI grading submissions | Required | Not required |
| Spec questions | Required | Not required |
| Principle edits (pressure-tests) | Required | **Required** |
| Pull requests | Required | **Required** |

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

## Misrouted issues

If an issue lands in the wrong repo, it will be transferred to the correct one (all repos are under the same org).
A `misrouted` label is applied before transfer so routing guidance can be improved.

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
- **MINOR** — MUST changes, OR changes to the requirement frontmatter shape / ID contract.
- **PATCH** — SHOULD/MAY changes, prose edits to an existing requirement.

## Contributor setup

The repo ships a pre-push hook that validates principle frontmatter before each push (schema check, ID uniqueness,
bullet-count parity, plus regression fixtures for the validator itself). Activate it once after clone:

```bash
git config core.hooksPath scripts/hooks
```

First run installs `js-yaml@4.1.0` into a gitignored `node_modules/`; subsequent runs are fast. No remote CI replaces
this — a failing hook is the gate.
