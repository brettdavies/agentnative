---
title: "Agent-Native Badge — claim convention"
last-revised: 2026-04-29
---

# Agent-Native Badge — claim convention

A self-hosted SVG badge that CLI authors embed in their READMEs to declare agent-native-standard conformance. This
document defines what claiming the badge means: who is eligible, what URL to embed, what the badge guarantees, and what
happens when a tool's score changes.

The badge SVG is rendered at site build time by [`agentnative-site`](https://github.com/brettdavies/agentnative-site)
using [`badge-maker`](https://www.npmjs.com/package/badge-maker) — the same library shields.io uses internally. This
document is the spec-side contract that the renderer honors.

> **Draft status (2026-04-29):** four product decisions are still TBD pending the launch-eve site/spec coordination.
> They appear inline below as `[**TBD: …**]` markers and are tracked in the cross-repo coordinator plan at
> [`agentnative-site` `docs/plans/2026-04-23-002-feat-badge-surface-plan.md`](https://github.com/brettdavies/agentnative-site/blob/dev/docs/plans/2026-04-23-002-feat-badge-surface-plan.md)
> § "Deferred to Implementation". This convention does not publish (and the badge cannot be embedded with the floor's
> public guarantee in force) until those values land.

## What the badge claims

The badge is a public assertion that:

1. The tool was scored against a published version of this standard via the `anc` linter.
2. The score met or exceeded the eligibility floor (see "Eligibility" below).
3. The badge URL resolves to a live scorecard that any reader can re-run for verification.

The badge is **not** a certification. There is no central authority granting or revoking it. The trust model is *trust
and verify* (per the SoT contract, hybrid propagation): claims are checkable against live evidence, not gatekept by a
third party.

## Eligibility

A tool can embed the badge when all of these hold:

- A scorecard for the tool exists on `agentnative-site` (`scorecards/<tool>-v<version>.json` under
  [`brettdavies/agentnative-site`](https://github.com/brettdavies/agentnative-site/tree/dev/scorecards)).
- The tool's score (`pass / (pass + warn + fail)`) meets or exceeds the **eligibility floor**.
- [**TBD: optionally, a list of universal-MUST principles that must all pass regardless of overall score**] — to be
  decided alongside the floor value, since the two together define what the badge actually attests.

**Eligibility floor:** [**TBD — calibrated against the launch-day leaderboard distribution so a typical scored tool
clears it without effort but a tool with multiple universal-MUST failures does not**]. Final value lands during
launch-eve coordination and is published verbatim in this section.

A tool whose score drops below the floor does not need to remove the badge — the badge URL renders below-floor colors
automatically (see "Regression behavior" below).

## Embed shape

The canonical embed (markdown):

```markdown
[![agent-native](https://anc.dev/badge/<tool>.svg)](https://anc.dev/scorecards/<tool>)
```

HTML form:

```html
<a href="https://anc.dev/scorecards/<tool>"><img src="https://anc.dev/badge/<tool>.svg" alt="agent-native"></a>
```

reStructuredText form (for Python projects):

```rst
.. image:: https://anc.dev/badge/<tool>.svg
   :target: https://anc.dev/scorecards/<tool>
   :alt: agent-native
```

Replace `<tool>` with the tool's registry slug — the same slug used in the scorecard filename
(`<tool>-v<version>.json`). The slug is also visible in the tool's scorecard page URL on `anc.dev`.

## Badge text and color

The badge label is fixed: `agent-native`. The message text is the live score read from the tool's most recent scorecard.

**Score-text format:** [**TBD: `91%` vs `91/100` vs `6/7 principles met` vs a hybrid — decided during launch-eve
coordination based on what reads cleanest at badge size and aligns with the leaderboard's own score presentation**].

**Color thresholds:** [**TBD — green / yellow / red cutoffs to match the scorecard-page styling on `anc.dev` so a reader
sees consistent signal across surfaces**]. The color and the score reflect the same underlying data; the badge should
not paint a tool greener than its scorecard page does.

## Version pinning

[**TBD: URL pattern. Two candidates:**

- `/badge/<tool>.svg` — always-latest. The badge tracks the tool's current score against the spec version the scorecard
  was last graded under. Simplest to embed, but the spec version implicit in the badge moves over time.
- `/badge/<tool>/<spec-version>.svg` — pinned. The embedder picks a spec version explicitly. More precise; more brittle
  if the embedder forgets to bump.

Decision lands during launch-eve coordination.**]

Either way, the spec version against which the tool was scored is visible somewhere a reader can find it — the scorecard
page (`anc.dev/scorecards/<tool>`) always names it explicitly in the page header.

## Honesty expectation

Self-grading is acceptable. The badge URL is the trust mechanism: any reader can click through to the live scorecard,
see the per-requirement pass/warn/fail breakdown, and re-run the linter locally with `anc check .` against the cited
spec version.

A maintainer who embeds the badge must not modify the scorecard JSON to inflate the score. The scorecard contents are
reproducible from the linter source — anyone who suspects tampering can verify in seconds, and the badge claim collapses
on first inspection.

## Regression behavior

When a tool's score drops below the eligibility floor:

- The badge URL continues to resolve. No 404, no removed embed.
- The badge color and text reflect the new score automatically — no maintainer action required.
- The tool's scorecard page on `anc.dev/scorecards/<tool>` shifts from showing the embed snippet to showing
  threshold-gated hints: "your score is X — here's what to address" with a top-issue list. The embedded badge in the
  tool's README continues to render the live (lower) score.

This soft-fail behavior is deliberate. The site is opinionated about helping tool authors improve, not about public
shaming.

## Why this design

- **Convention lives here, render lives on the site.** Doctrine (this file) evolves slowly via spec MINOR bumps;
  rendering can iterate freely on the site. The site reads this convention's parameter values (floor, format, colors,
  URL pattern) and feeds them into `badge-maker` at build time.
- **Per-tool live-score, not per-tool static or universal sticker.** A static "conformant" badge is a sticker; a
  live-score badge is a claim that updates with reality. The cost of maintaining live scores is borne by the scorecard
  pipeline that already exists.
- **Self-host the SVG, no third-party renderer.** Every embed resolves through `anc.dev` — Cloudflare-edge caching, no
  upstream dependency on shields.io. Visual style is identical (same `badge-maker` library), but the trust path stays
  within the standard's own infrastructure.

## Sources

- Cross-repo coordinator plan:
  [`brettdavies/agentnative-site` `docs/plans/2026-04-23-002-feat-badge-surface-plan.md`](https://github.com/brettdavies/agentnative-site/blob/dev/docs/plans/2026-04-23-002-feat-badge-surface-plan.md).
- Renderer: [`badge-maker` (npm)](https://www.npmjs.com/package/badge-maker).
- Scorecard registry:
  [`brettdavies/agentnative-site` `scorecards/`](https://github.com/brettdavies/agentnative-site/tree/dev/scorecards).
- Trust posture: hybrid propagation (IDs are SoT, versions are decoupled, badge cites live evidence) — see
  [`CONTRIBUTING.md` § Coupled release protocol](../CONTRIBUTING.md#coupled-release-protocol).
