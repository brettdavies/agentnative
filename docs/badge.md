---
title: "Agent-Native Badge — claim convention"
last-revised: 2026-05-04
---

# Agent-Native Badge — claim convention

A self-hosted SVG badge that CLI authors embed in their READMEs to declare agent-native-standard conformance. This
document defines what claiming the badge means: who is eligible, what URL to embed, what the badge guarantees, and what
happens when a tool's score changes.

The badge SVG is rendered at site build time by [`agentnative-site`](https://github.com/brettdavies/agentnative-site)
using [`badge-maker`](https://www.npmjs.com/package/badge-maker) — the same library shields.io uses internally. This
document is the spec-side contract that the renderer honors.

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
- The tool's `score_pct` meets or exceeds the **eligibility floor**. The score reflects shipped-binary behavior and is
  computed per [`principles/scoring.md`](../principles/scoring.md) — that document is the single source of truth for the
  formula.

**Eligibility floor: ≥70%.** The floor is deliberately low so the badge can spread the standard: a tool that clears a
reasonable bar can display it and point readers at its scorecard. Exclusivity comes from the cohort bands below and the
score shown on the badge, not from a high gate. See
[`principles/scoring.md`](../principles/scoring.md#eligibility-floor) for the rationale.

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

The badge label is `agent-native vMAJOR.MINOR`, where `MAJOR.MINOR` is the spec version against which the tool was
scored. The message text is the live score read from the tool's most recent scorecard.

**Score-text format:** `XX%` (rounded percent — e.g., `91%`). Matches the leaderboard's score column and reads cleanest
at badge size. `91/100` and `6/7 principles met` were the alternatives considered.

**Color bands.** The badge color reflects the tool's cohort band, defined in
[`principles/scoring.md`](../principles/scoring.md#cohort-bands). The recommended ramp ascends warm to cool, anchored on
the standard's own accent hues, with the brand navy crowning the top band; exact hex is a rendering detail the site owns
and refines under its design system:

| Band        | Score   | Recommended color   |
| ----------- | ------- | ------------------- |
| Exemplary   | `≥ 85`  | navy (brand accent) |
| Strong      | `80–84` | teal                |
| Solid       | `75–79` | green               |
| Qualified   | `70–74` | ochre               |
| below floor | `< 70`  | orange (red `< 50`) |

The color and the score reflect the same underlying data; the badge MUST NOT paint a tool higher up the color ramp than
its scorecard page does. Below-floor scorecards still get a rendered SVG so a tool watching its own regression sees the
visual color drop.

## Version pinning

The badge URL is `/badge/<tool>.svg` — always-latest. The badge tracks the tool's current score against the spec version
the scorecard was last graded under, and that spec version surfaces in the badge label text (`agent-native
vMAJOR.MINOR`), not in the URL path. Trust-and-verify means the URL MUST reflect current state, not a snapshot; pinning
the spec version into the path would invert that posture.

The scorecard page (`anc.dev/scorecards/<tool>`) also names the spec version explicitly in the page header for any
reader who wants to confirm what the badge is asserting.

## Honesty expectation

Self-grading is acceptable. The badge URL is the trust mechanism: any reader can click through to the live scorecard,
see the per-requirement pass/warn/fail breakdown, and re-run the linter locally with `anc check .` against the cited
spec version.

A maintainer who embeds the badge MUST NOT modify the scorecard JSON to inflate the score. The scorecard contents are
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
