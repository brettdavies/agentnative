---
title: "feat: Deploy LanguageTool docker container on pool for prose-check stack"
type: feat
status: active
date: 2026-05-06
related:
  - docs/plans/2026-05-06-001-feat-prose-check-stack-plan.md
---

# feat: Deploy LanguageTool docker container on pool for prose-check stack

> **Sibling plan:** This plan is the operational counterpart to
> [`2026-05-06-001-feat-prose-check-stack-plan.md`](2026-05-06-001-feat-prose-check-stack-plan.md). The prose-check plan
> provisions client-side scripts (Vale + LanguageTool orchestrator); this plan provisions the LanguageTool service on
> `pool`. The two land in parallel — neither blocks the other. The prose-check stack handles unreachable LanguageTool
> gracefully (skip with notice), so it ships even if this plan is mid-flight; the LanguageTool service runs
> independently of any client. They converge once both are live and a developer's pre-push reaches `pool` over
> Tailscale.

---

## Summary

Stand up a self-hosted LanguageTool HTTP API on the `pool` host as a docker container, reachable over Tailscale at
`http://pool:8081/v2/check`. Pin the image by digest (`meyay/languagetool@sha256:<digest>`), set a heap baseline that
covers English-only without n-grams, wire a healthcheck against `/v2/languages`, and verify the service responds within
the prose-check stack's 2-second reachability probe budget.

---

## Problem Frame

The prose-check stack ([sibling plan]) probes `pool:8081/v2/languages` before each developer push. Today, no such
container is running on `pool`. Without this deployment, every developer push routes through the prose-check stack's
unreachable-skip path — Vale runs but LanguageTool never does, leaving grammar/spelling/typography findings unflagged on
every push. The unreachable-skip path is correct fallback behavior; it is not the desired steady state.

Running LanguageTool as a docker container on `pool` is the chosen architecture (origin requirement R8 in the
prose-check brainstorm). The user has existing infrastructure managing container lifecycles on `pool`; Tailscale
provides authenticated reachability without exposing the service publicly. The work in this plan is provisioning the
container, pinning the image, wiring the healthcheck, and confirming end-to-end reachability from a developer Mac.

[sibling plan]: 2026-05-06-001-feat-prose-check-stack-plan.md

---

## Requirements

- R1. LanguageTool runs as a docker container on `pool`, reachable over Tailscale from developer machines.
- R2. The service responds to `GET /v2/languages` within ~2 seconds when warm (the prose-check stack's reachability
  probe budget).
- R3. The image is pinned by `@sha256:<digest>`, not by floating tag (per the user's image-pin policy).
- R4. The container survives `pool` reboots (auto-restart policy, `restart: unless-stopped` or equivalent).
- R5. A healthcheck endpoint validates the container is actually serving, not just running.
- R6. Heap is sized for English-only operation without n-grams at v1 (`JAVA_XMS=512m`, `JAVA_XMX=2g` baseline). n-grams
  are deferred until `CONFUSED_WORDS` precision becomes a real complaint.
- R7. The service does not expose itself publicly. Reachability is Tailnet-only — no port-forwarding, no public DNS, no
  HTTP/S termination on `pool` or above.
- R8. The compose file (or its equivalent on `pool`) is committed somewhere persistent and recoverable, not stored only
  in `pool`'s ephemeral state.
- R9. Recovery from `pool` going offline is one command from the host operator: `docker compose up -d` (or equivalent),
  with no out-of-band steps.

---

## Scope Boundaries

- **n-grams corpus** — deferred. v1 ships English-only without `/ngrams` mounted. Add later if the prose-check stack
  reports noisy `CONFUSED_WORDS` matches in real use.
- **Premium / API key authentication** — out. The service is internal-only, Tailnet-reachable, and trusts every caller.
- **TLS termination** — out. The service speaks HTTP. Tailscale provides the wire-level authentication.
- **Migration from a different LT instance** — none expected. The user's brainstorm explicitly says "the check never
  runs against a LanguageTool instance on this developer's Mac" — we are starting from no prior LT instance.
- **Multi-language support** — out at v1. English-only. Add other languages when a real consumer materializes.
- **`bigdaddy` mirror** — origin says it is "an acceptable mirror but not the primary." This plan provisions `pool`
  only; mirroring to `bigdaddy` is deferred follow-up.

### Deferred to Follow-Up Work

- n-grams corpus mount (~9GB English unpacked) once `CONFUSED_WORDS` precision becomes a real concern.
- `bigdaddy` mirror deployment, if it earns its place.
- Capture the Tailscale-reachable LT pattern in `docs/solutions/` via `/ce-compound` after both this plan and the
  sibling prose-check plan ship and run against several real PRs. The "pre-push reaches a Tailnet-only docker service
  with graceful skip when unreachable" pattern is unprecedented in the user's solutions corpus per Phase 1 research on
  the sibling plan.

---

## Context & Research

### Image choice

Two community-maintained images dominate. Both are referenced in the sibling plan's external research:

- **`meyay/languagetool`** — preferred for new 2026 deployments. Built directly from upstream tags after LT stopped
  publishing release zips post-v6.6. Default port **8081** (override with `LISTEN_PORT=8010` for parity if needed). Uses
  uppercase `JAVA_XMS` / `JAVA_XMX` / `JAVA_GC`. Supports `MAP_UID`/`MAP_GID`. Auto-downloads n-grams via
  `download_ngrams_for_langs=en` if enabled. Source: <https://hub.docker.com/r/meyay/languagetool>,
  <https://github.com/meyayl/docker-languagetool>.
- **`erikvl87/languagetool`** — historically canonical, simpler, default port **8010**. Env vars `Java_Xms` / `Java_Xmx`
  (lowercase + capitalized hybrid). For drop-in compatibility with older compose files. Source:
  <https://hub.docker.com/r/erikvl87/languagetool>.

**Choice for v1: `meyay/languagetool` at port 8081.** Rationale: maintained against current upstream, the sibling plan
already targets port 8081, env-var convention matches modern Java docker images.

### Healthcheck and warmup

LanguageTool's first request loads dictionaries (~5–10s cold), subsequent requests are fast. The cheapest reachability
probe is `GET /v2/languages` (returns the language list, 150ms warm). The same endpoint serves as a warmup. Source:
<https://languagetool.org/http-api/swagger-ui/>.

There is no built-in `HEALTHCHECK` on the image — add one in compose:

```yaml
healthcheck:
  test: ["CMD", "curl", "-fsS", "http://localhost:8081/v2/languages"]
  interval: 30s
  timeout: 5s
  start_period: 30s
  retries: 3
```

`start_period: 30s` covers the cold-start dictionary load.

### Tailscale reachability

`pool` is Tailnet-resident with `MagicDNS` resolution. Developer Macs already have Tailscale running (the user's
existing infrastructure). The service binds to `0.0.0.0:8081` inside the container, exposed on `pool:8081` over the
Tailnet. No public-side change needed.

If the prose-check probe fails when Tailscale is online and the container is up, the diagnostic chain is:

1. From the dev Mac: `tailscale status` shows `pool` online.
2. From the dev Mac: `curl --max-time 2 http://pool:8081/v2/languages` returns the language list.
3. On `pool`: `docker compose ps languagetool` shows `healthy`.
4. On `pool`: `docker logs languagetool --tail 50` shows recent activity.

### Image-pin posture

Resolve the current `meyay/languagetool` digest at U1 implementation time:

```bash
docker buildx imagetools inspect meyay/languagetool:6.6 \
  | grep -E '^\s*Manifest|^\s*Digest' \
  | head -2
```

Pin in compose as `image: meyay/languagetool@sha256:<resolved>`, with a trailing comment naming the human tag for
maintainability:

```yaml
image: meyay/languagetool@sha256:abc123…  # v6.6
```

Bumps are PRs, not silent edits, mirroring the GitHub Actions SHA-pin policy.

---

## Key Technical Decisions

- **`meyay/languagetool` over `erikvl87`.** Maintained against current upstream; default port 8081 matches the sibling
  plan's expectation; env-var convention matches modern Java docker images. Rationale above.
- **English-only at v1, no n-grams.** Defers ~9GB disk requirement and ≥4GB heap requirement until the precision gain is
  justified by real prose-check usage. The sibling plan accepts this — `CONFUSED_WORDS` matches without n-grams are
  still flagged when they exist; the n-gram model improves precision (fewer false positives), not recall.
- **Compose file lives in a committed repo, not pool's ephemeral state.** Where exactly is U2's open question (depends
  on what convention the user has for pool's other containers). Candidate locations: `~/dotfiles/`, a `pool`-specific
  ops repo, the spec repo's `docs/architecture/languagetool-deployment.md` accompanied by an inline compose snippet.
  Implementer chooses at U2 based on the host's existing pattern.
- **Healthcheck is `/v2/languages`, not a no-op `nc` probe.** Verifies the service is actually responding to HTTP, not
  just that the process is bound to the port. The 30s `start_period` covers cold-start dictionary load.
- **No public exposure, no TLS, no auth.** The Tailnet IS the trust boundary. Adding TLS or auth here would duplicate
  the work Tailscale already does and add a moving part for no security gain.

---

## Open Questions

### Resolved During Planning

- **Image choice:** `meyay/languagetool` over `erikvl87`. (See Key Technical Decisions.)
- **Default port:** 8081 (matches sibling plan; matches `meyay` default).
- **Heap baseline:** `JAVA_XMS=512m`, `JAVA_XMX=2g`. (Sufficient for English-only without n-grams per sibling plan
  research.)
- **Healthcheck endpoint:** `/v2/languages`. (Cheapest verified-alive probe; doubles as warmup.)
- **n-grams at v1:** No.

### Deferred to Implementation

- **Compose file location.** Where on disk does `pool` keep its other docker-compose stacks today? U2 implementer reads
  `pool`'s existing layout and slots the new compose file into the established convention.
- **Exact `meyay/languagetool` digest at PR time.** Resolves at U1 implementation via `docker buildx imagetools
  inspect`.
- **`MAP_UID` / `MAP_GID` values for the `pool` container user.** Defaults usually work; confirm against `pool`'s
  conventions at U2.
- **Whether `pool` already has `curl` available inside running containers (for the healthcheck CMD).** If not, fall back
  to `["CMD-SHELL", "wget --spider -q http://localhost:8081/v2/languages || exit 1"]` or install `curl` in a custom
  image layer (avoid the latter — image churn for a healthcheck is overkill).

---

## Implementation Units

- U1. **Resolve current `meyay/languagetool` digest and capture in deployment doc**

**Goal:** Lock the image pin for v1 deployment.

**Requirements:** R3

**Dependencies:** None

**Files:**

- Modify: `docs/architecture/languagetool-deployment.md` (created in this plan; see U5)

**Approach:**

- Run `docker buildx imagetools inspect meyay/languagetool:6.6` (or the current latest tag — confirm at run time) and
  capture the multi-arch manifest digest. Pin posture: `image: meyay/languagetool@sha256:<digest> # v6.6`.
- Record the resolved digest, the human tag, and the resolution date in `docs/architecture/languagetool-deployment.md`
  so a future bump has a clear lineage.

**Test scenarios:**

- *Test expectation: none — this is a pinning decision recorded in docs.* Verification is the digest's persistence in
  the next U2 compose file edit.

**Verification:**

- The deployment doc names a specific `@sha256:<40-char>` digest with a trailing tag comment.

---

- U2. **Create docker-compose stack on `pool`**

**Goal:** Deploy the LanguageTool container with the resolved image pin, healthcheck, restart policy, and Tailnet-only
exposure.

**Requirements:** R1, R2, R4, R5, R6, R7, R8, R9

**Dependencies:** U1

**Files (target host: `pool`, exact path TBD by implementer):**

- Create: a `docker-compose.yml` (or fragment) at whatever location matches `pool`'s existing convention. Likely
  candidates: `~/docker/languagetool/docker-compose.yml` on `pool`, or a dotfiles-tracked path that stows onto `pool`.

**Approach:**

```yaml
services:
  languagetool:
    image: meyay/languagetool@sha256:<digest>  # v6.6 — resolved by U1
    container_name: languagetool
    restart: unless-stopped
    ports:
      - "8081:8081"
    environment:
      JAVA_XMS: "512m"
      JAVA_XMX: "2g"
      LISTEN_PORT: "8081"
    healthcheck:
      test: ["CMD-SHELL", "curl -fsS http://localhost:8081/v2/languages || exit 1"]
      interval: 30s
      timeout: 5s
      start_period: 30s
      retries: 3
```

- Bind to `0.0.0.0:8081` so the Tailnet sees it; no firewall change needed (Tailscale handles ACL).
- `restart: unless-stopped` covers `pool` reboots without auto-restarting after manual `docker compose down` (R4 + R9).
- If the existing `pool` compose convention is a single multi-service `docker-compose.yml`, append this service to that
  file. Otherwise, ship as its own stack.

**Patterns to follow:**

- Whatever the user has on `pool` for other long-running containers. Implementer reads `pool` first to identify the
  convention.
- The user's image-pin policy (`@sha256:<digest>` + trailing tag-comment).

**Test scenarios:**

- Happy path: from `pool`, `docker compose up -d languagetool` brings the service to `healthy` within ~30s.
- Edge case: `pool` reboot brings the container back via `restart: unless-stopped`; first request after reboot may take
  5-10s (cold dictionary load), the healthcheck's `start_period: 30s` accommodates this.
- Edge case: `docker compose down languagetool` does not cause auto-restart loop (the `unless-stopped` policy honors
  manual stops).
- Error path: a malformed env var (e.g., `JAVA_XMX: "two_g"`) causes the container to fail healthcheck; compose reports
  `unhealthy` and an operator runs `docker logs languagetool` to diagnose.
- Integration: after U2 completes, **the sibling plan's reachability probe** (`curl --max-time 2 -fsS
  http://pool:8081/v2/languages`) succeeds from any developer Mac with Tailscale active.

**Verification:**

- On `pool`: `docker compose ps languagetool` shows `Status: Up (healthy)`.
- From a dev Mac: `curl --max-time 2 http://pool:8081/v2/languages | jaq '.languages | length'` returns a positive
  integer (the language count).
- The container survives a `pool` reboot.

---

- U3. **Confirm Tailnet reachability from a dev Mac**

**Goal:** Verify the sibling plan's reachability probe behavior end-to-end before the prose-check stack lands.

**Requirements:** R1, R2

**Dependencies:** U2

**Files:** None — this is a verification step.

**Approach:**

- From the user's dev Mac with Tailscale active: `curl --max-time 2 -fsS http://pool:8081/v2/languages`. Expected: 200
  OK with the JSON language list, in <500ms warm, ≤2s cold.
- From the same Mac with Tailscale off: `curl --max-time 2 -fsS http://pool:8081/v2/languages`. Expected: curl exits
  non-zero within 2s (DNS won't resolve `pool` without Tailscale; `--max-time` cancels promptly).
- Round-trip an actual `/v2/check` POST: `curl --data-urlencode "text=He do not work." --data "language=en-US"
  http://pool:8081/v2/check | jaq '.matches[0].rule.id'`. Expected: a valid grammar rule ID (e.g., `HE_VERB_AGR`).

**Patterns to follow:**

- The sibling plan U6's reachability probe shape.
- The sibling plan U5's `/v2/check` invocation shape.

**Test scenarios:**

- Happy path: warm probe returns under 500ms.
- Edge case: cold container probe returns under 2s (within `--max-time` budget).
- Edge case: Tailscale off causes probe to fail within 2s with curl exit code `6` (couldn't resolve host).
- Integration: `/v2/check` POST returns a non-empty `matches` array for a known-grammatical-failure input string.

**Verification:**

- All four scenarios pass. Capture the timing measurements in the deployment doc (U5) for future regression context.

---

- U4. **Document the deployment** *(unit consolidates U1's digest pin, U2's compose layout, U3's verified reachability)*

**Goal:** Land `docs/architecture/languagetool-deployment.md` in the spec repo as the authoritative reference for the
`pool`-side LT deployment, the digest pin, the healthcheck contract, the Tailnet expectation, and the recovery
procedure.

**Requirements:** R3, R5, R7, R8, R9

**Dependencies:** U1, U2, U3

**Files (target repo: `agentnative-spec`):**

- Create: `docs/architecture/languagetool-deployment.md`

**Approach:**

The doc lives in spec because the prose-check stack depends on it; the deployment is operational, but the *contract* is
shared. Sections:

- **Image pin posture** — current digest, human tag, resolution date, bump procedure (PR-only).
- **Default port + env vars** — 8081, `JAVA_XMS=512m`, `JAVA_XMX=2g`.
- **Healthcheck contract** — `/v2/languages` returns the language list within `--max-time 2`.
- **Tailnet reachability** — `pool:8081` resolvable via `MagicDNS` from any Tailscale-active dev machine. No public
  exposure.
- **Recovery procedure** — `docker compose up -d languagetool` from the compose-file location on `pool`. If `pool` is
  fully offline, the prose-check stack handles graceful skip and no replay is needed.
- **Diagnostic chain** — the four-step diagnostic from "Context & Research" above.
- **n-grams decision** — deferred at v1; conditions under which to revisit.
- **Cross-link** — pointer to the sibling prose-check plan and (post-implementation) to `docs/solutions/` once the
  pattern is captured via `/ce-compound`.

The doc itself is in-scope for the sibling plan's prose-check enforcement; once both plans land, the doc must conform to
BRAND.md voice. Implementer writes accordingly.

**Patterns to follow:**

- `docs/architecture/voice-enforcement.md` (created by sibling plan U8) — same docs-architecture pattern.
- The user's image-pin policy.

**Test scenarios:**

- *Test expectation: none — this is a documentation unit.*
- Verification: once the sibling plan lands, the doc passes `bash scripts/prose-check.sh` invocation on the spec repo.

**Verification:**

- The doc names the resolved digest, port, env vars, healthcheck contract, recovery procedure, and the cross-link to the
  sibling plan.
- A new contributor reading the doc can re-deploy the container from cold without out-of-band knowledge.

---

## System-Wide Impact

- **Interaction graph:** This plan provisions a Tailnet-only HTTP service. The only consumer at v1 is the prose-check
  stack on developer Macs. Future consumers (e.g., a future `agentnative-cli` lint subcommand) inherit the same
  reachability assumption (`pool:8081` over Tailscale).
- **Error propagation:** When the container is unhealthy or unreachable, the prose-check stack's reachability probe
  fails within 2s and the push proceeds on Vale alone. There is no other consumer; service downtime is contained.
- **State lifecycle risks:** None at the application layer (LT is stateless beyond loaded dictionaries). The container
  layer follows the user's existing `pool` conventions for restart policy and persistence.
- **API surface parity:** Adopting the `meyay` image fixes the API at LT's public `/v2/check` shape. Future migration to
  the `erikvl87` image or to LT premium would change env var capitalization (`Java_Xmx` vs `JAVA_XMX`) but not the HTTP
  contract — no client-side breakage.
- **Integration coverage:** End-to-end coverage is verified by U3 against an actual dev Mac. This is the integration
  point the sibling plan U6 cannot prove on its own (the sibling plan's verification is "probe responds within 2s,"
  which is half the contract; the full contract is "and `/v2/check` returns useful grammar matches").
- **Unchanged invariants:** `pool`'s other containers, the Tailscale ACL, the `pool` host's restart policy, and the
  user's image-pin convention are unchanged. This plan adds one service; it does not modify shared infrastructure.

---

## Risks & Dependencies

| Risk                                                                                             | Likelihood | Impact | Mitigation                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------ | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pool`'s docker compose convention differs from the assumed single-file shape                    | Med        | Low    | U2 implementer reads `pool`'s existing layout first; adapts the new service to whatever pattern is there.                                                                               |
| `meyay/languagetool` digest is not resolvable for the chosen tag (image yanked, registry hiccup) | Low        | Low    | Fall back to `erikvl87/languagetool` at port 8010 with the LISTEN_PORT override on the meyay side, or pin to a known-good earlier tag. Document the fallback in U4 doc.                 |
| Cold-start dictionary load exceeds the healthcheck's `start_period: 30s` on a slow disk          | Low        | Med    | Bump `start_period` to 60s, or add a manual `docker exec languagetool curl localhost:8081/v2/languages` warmup as part of U2 deployment procedure.                                      |
| `pool`'s curl is not available inside the container for the healthcheck CMD                      | Low        | Low    | Switch healthcheck to `["CMD-SHELL", "wget --spider -q ..."]` or to a tcp-based `["CMD", "nc", "-z", "localhost", "8081"]` probe (less rigorous but functional).                        |
| Disk pressure on `pool` from container logs over months                                          | Low        | Low    | Adopt `pool`'s existing log rotation (likely via `daemon.json` `log-opts`), or set `logging.driver: json-file, max-size: 10m, max-file: 3` in compose.                                  |
| Tailnet ACL accidentally blocks port 8081 for dev Macs                                           | Low        | Med    | U3's verification catches this — if the dev Mac probe fails when `pool` reports healthy, the next thing to check is Tailscale ACL (`tailscale serve status` / Tailscale admin console). |
| Future LT upstream removes `/v2/languages` (unlikely but possible)                               | Low        | Low    | The healthcheck and probe both use this endpoint — break propagates everywhere at once. Mitigation is the next image bump's review step.                                                |

### Dependencies / Prerequisites

- `pool` host running, with docker engine ≥ v20.10 (for compose v2 compatibility).
- Docker Hub reachable from `pool` for the initial image pull.
- Tailscale running on `pool` and on dev Macs.
- The user has admin / sudo access on `pool`.
- The compose-file location convention on `pool` is known (or U2 implementer establishes it).

---

## Documentation Plan

- `docs/architecture/languagetool-deployment.md` (NEW, U4) — the spec-repo-side reference for the deployment contract.
- The sibling plan's U6 references this doc instead of duplicating its content (cross-link added below).
- A future `docs/solutions/` capture via `/ce-compound` records the Tailnet-LT pattern after both plans land.

---

## Operational / Rollout Notes

- **One-time setup:**

  ```bash
  ssh pool
  cd <compose-location>
  docker compose pull languagetool
  docker compose up -d languagetool
  docker compose ps languagetool          # wait for "healthy"
  curl -fsS http://localhost:8081/v2/languages | jaq '.languages | length'  # smoke test
  ```

- **Roll-out cadence:** This plan can land independently of the sibling plan. Order does not matter; the sibling plan
  handles unreachable LT gracefully, and the LT service runs without a prose-check client. They converge naturally once
  both ship.
- **Rollback posture:** `docker compose down languagetool` removes the container; the sibling plan's pre-push hook
  prints the skip notice and the developer keeps shipping. Rollback is risk-free.
- **Monitoring:** None at v1. The healthcheck is the only signal. If `pool` skips the container after a reboot,
  diagnostic chain is in U4's doc. If failures become frequent, add a Slack/email alert via `pool`'s existing host
  monitoring.
- **Image bump cadence:** Quarterly review of `meyay/languagetool` releases, or earlier if a CVE drops. PR with the new
  digest in the deployment doc + the compose file; smoke-test U3 against the new container; merge.

---

## Sources & References

- **Sibling plan:** [`2026-05-06-001-feat-prose-check-stack-plan.md`](2026-05-06-001-feat-prose-check-stack-plan.md) —
  the client-side prose-check stack that consumes this deployment. The sibling plan's U6 ("Pool reachability probe +
  LanguageTool docker pin documentation") delegated the operational provisioning to this plan.
- **Origin requirements:**
  [`docs/brainstorms/2026-05-06-prose-check-stack-requirements.md`](../brainstorms/2026-05-06-prose-check-stack-requirements.md)
  — R8 (LanguageTool runs on `pool` as docker over Tailscale), R9 (graceful skip when unreachable).
- **Image source:** <https://hub.docker.com/r/meyay/languagetool>, <https://github.com/meyayl/docker-languagetool>
- **API reference:** <https://languagetool.org/http-api/swagger-ui/>,
  <https://dev.languagetool.org/public-http-api.html>
- **Categories enum (informs the sibling plan's blocking-tier whitelist):**
  <https://github.com/languagetool-org/languagetool/blob/master/languagetool-core/src/main/java/org/languagetool/rules/Categories.java>
- **Image-pin policy:** the user's global CLAUDE.md "Supply-Chain Pinning" section.
