---
title: "LanguageTool service deployment on pool"
type: architecture
status: active
date: 2026-05-06
related:
  - docs/plans/2026-05-06-002-feat-languagetool-pool-deployment-plan.md
  - docs/plans/2026-05-06-001-feat-prose-check-stack-plan.md
  - docs/brainstorms/2026-05-06-prose-check-stack-requirements.md
---

# LanguageTool service deployment on pool

Operational reference for the self-hosted LanguageTool HTTP API running on `pool`. The service backs the prose-check
stack: a developer's pre-push hook calls `http://pool:8081/v2/check` over Tailscale to grade prose changes against
LanguageTool's rules-only ruleset.

## Trust boundary

Tailnet membership is the trust boundary. The container binds to `0.0.0.0:8081` on the docker bridge; the host's WAN
does not forward 8081, and `tailscale serve` / `tailscale funnel` are not configured. Reachability is therefore:

- Devices on the home LAN (`192.168.1.5:8081`) — yes.
- Devices on the tailnet (`pool.tail42ba87.ts.net:8081` or `100.75.41.53:8081`) — yes.
- Public internet — no.

**Hostname guidance for clients:** prefer the FQDN `pool.tail42ba87.ts.net` over the bare short name `pool`. On
macOS+Tailscale, short-name resolution intermittently times out at 5s before falling through to MagicDNS, while the FQDN
resolves in ~1.5ms and is stable across DNS cache states. Tailnet IP `100.75.41.53` works too but is brittle if `pool`
is ever re-keyed.

There is no TLS on the service itself. WireGuard already encrypts in-transit; layering TLS adds cert management for no
security gain. If a future client requires HTTPS, terminate via `tailscale serve --bg --https=443 http://localhost:8081`
on `pool` rather than embedding TLS in the container.

## As-deployed configuration

Snapshot from 2026-05-06; for current state, read pool directly:
`/boot/config/plugins/compose.manager/projects/languagetool/docker-compose.yml`.

| Field | Value | Rationale |
| - | - | - |
| Image | `meyay/languagetool@sha256:f7f6f4ed05fe3c42ddc7c5f398572832765f40f846ed91869cf05026b0fdca5f` | LT 6.7-7, resolved 2026-05-06; digest pin per supply-chain policy |
| Compose project | `/boot/config/plugins/compose.manager/projects/languagetool/` on pool | Unraid Compose Manager convention |
| Network | `bridge` | Default, no need for host networking |
| Port | `8081:8081` | Image exposes 8081/tcp natively; no remap |
| User mapping | `MAP_UID=99`, `MAP_GID=100` (`nobody:users`) | meyay entrypoint drops privileges via `gosu`; do not use compose `user:` — bypasses entrypoint and breaks startup |
| Heap | `JAVA_XMS=512m`, `JAVA_XMX=2g` | English-only, no n-grams; XMX is a ceiling, not consumption |
| Healthcheck | `wget --spider -q http://localhost:8081/v2/languages` every 30s, 60s start_period | Real HTTP probe verifies dictionary load completed, not just process binding |
| Restart | `unless-stopped` | Honors manual `docker compose down` |
| Logging | json-file, 10MB × 3 rotation | Bound so a runaway log can't fill the cache |
| n-grams | disabled | Deferred — see "Enabling n-grams" below |

UI labels (in `docker-compose.override.yml`, written by the Compose Manager UI's UI Labels tab):

| Label | Value |
| - | - |
| `net.unraid.docker.managed` | `composeman` |
| `net.unraid.docker.icon` | `https://languagetool.org/favicon.ico` |
| `net.unraid.docker.webui` | `http://[IP]:[PORT:8081]/v2/languages` |
| `net.unraid.docker.shell` | (empty) |

## Healthcheck contract

`/v2/languages` returns the list of supported language codes once the JVM has finished dictionary load. Cold-start takes
30-60s on the ZFS pool; `start_period: 60s` swallows that. Steady-state warm probe is sub-second.

A successful warm probe looks like:

```bash
$ curl -sS -w "%{http_code}\n" -o /dev/null http://pool:8081/v2/languages
200
```

The container's own healthcheck status is visible via:

```bash
docker inspect languagetool --format '{{.State.Health.Status}}'
# expected: healthy
```

## Diagnostic chain

When the prose-check orchestrator reports the service unreachable, walk this chain on the dev Mac:

1. `tailscale status | grep pool` — confirm pool is reachable on the tailnet.
2. `curl -sS http://pool:8081/v2/languages` — confirm HTTP layer.
3. If the curl times out: SSH to pool, `docker ps | grep languagetool`, `docker inspect languagetool --format
   '{{.State.Health.Status}}'`.
4. If unhealthy: `docker logs --tail 50 languagetool` and grep for `OutOfMemoryError` (bump `JAVA_XMX`), dictionary
   parse errors (image pull corrupted), or port bind conflicts (something else grabbed 8081).
5. If healthy but unreachable from the Mac: check `tailscale netcheck` on both ends; verify the dev Mac's tailnet hasn't
   ACL-blocked port 8081.

## Recovery procedure

Service restart (no config change):

```bash
# on pool
cd /boot/config/plugins/compose.manager/projects/languagetool
docker compose restart
```

Full container recreate (after compose edit or image pull):

```bash
docker compose up -d --force-recreate
```

Image upgrade — resolve the new digest first, never bump the tag alone:

```bash
docker buildx imagetools inspect meyay/languagetool:<new-tag>
# update image: line in docker-compose.yml with new sha256 + tag comment
docker compose pull && docker compose up -d
```

Rollback to a known-good digest:

```bash
# revert the image: line to the prior sha256, then
docker compose pull && docker compose up -d
```

The container holds no state. Recreating it does not lose data; n-gram enablement is the only path that introduces a
host volume (and that volume is just a corpus cache, regenerable by re-download).

## Enabling n-grams later

Off at v1. The rules-only ruleset already catches common confusables (their/there, affect/effect) where they match a
hardcoded pattern. n-grams add statistical context for confusion errors that rules don't cover, at a cost of ~9GB disk
and ~4GB of heap.

To enable, on pool:

1. `mkdir -p /mnt/pool/appdata/languagetool/ngrams`
2. Download the English n-gram corpus (~9GB) from <https://languagetool.org/download/ngram-data/> and extract into that
   directory.
3. Edit `docker-compose.yml` to add the bind mount (`volumes: ["/mnt/pool/appdata/languagetool/ngrams:/ngrams:ro"]`),
   set `langtool_languageModel: /ngrams` in the `environment:` block, and bump `JAVA_XMX` from `2g` to `4g`.
4. `docker compose up -d --force-recreate`
5. Warm probe and verify a confusion-class match: `curl -sS -X POST http://pool:8081/v2/check --data-urlencode
   "language=en-US" --data-urlencode "text=Their is no problem with there work."` — expect a CONFUSION_RULE_* match.

The compose file already carries this checklist as inline comments — that's the durable copy; this section is the
narrative version.

## Risk notes

- **Docker Hub rate limits**: anonymous pulls cap at 100/6h per IP. One image, infrequent pulls — unlikely to bite.
  Mitigate by `docker login` on pool with the brettdavies Docker Hub account if it ever does.
- **Cold-start exceeds 60s** on a heavily-loaded pool. Bump `start_period` or warm manually after deploy: `docker exec
  languagetool wget -q -O- http://localhost:8081/v2/languages > /dev/null`.
- **Tailscale ACL changes**: if a future ACL edit blocks port 8081 from dev Macs, the diagnostic chain step 5 catches
  it. Re-allow in the Tailscale admin console.

## Verification log

| Date | Test | Result |
| - | - | - |
| 2026-05-06 | Warm probe via FQDN (3 attempts) | 200 in 12-23ms each; namelookup ~1.5ms |
| 2026-05-06 | Warm probe via bare short name `pool` | DNS resolution times out at 5s — short name unreliable on macOS+Tailscale; clients should use FQDN |
| 2026-05-06 | Cold-start probe (post `docker restart`, time-to-first-200) | 2.6s (5 polls @ 0.5s) — well under the 60s `start_period` |
| 2026-05-06 | `POST /v2/check` with seeded prose | 200, 3 rules-only matches (HE_VERB_AGR, THIS_NNS, PLURAL_VERB_AFTER_THIS) |
| 2026-05-06 | TS-off probe (TS disabled on dev Mac, FQDN unresolvable) | curl exit 6 in 0.06s — failure path correct |
| 2026-05-06 | `docker inspect languagetool --format {{.State.Health.Status}}` | `healthy` |
| 2026-05-06 | `tailscale serve status` / `tailscale funnel status` on pool | empty — no public exposure |
