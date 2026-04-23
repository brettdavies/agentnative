#!/usr/bin/env bash
# SPDX-License-Identifier: MIT OR Apache-2.0
#
# Pre-push semver verification, scoped to `release/*` branches.
# Runs as a stage of scripts/hooks/pre-push. No-ops on any other branch.
#
# Rejects the push when any of the following is true:
#   1. VERSION file missing or not X.Y.Z (three non-negative integers).
#   2. Principle files (principles/p*-*.md) changed vs origin/main but
#      VERSION is unchanged vs origin/main.
#   3. VERSION changed but the new value is not strictly greater than the
#      value on origin/main (no downgrades, no re-uses).
#   4. Tag `v<new-VERSION>` already exists on origin.
#
# Does NOT auto-increment VERSION. The author bumps manually; this script
# only verifies that the bump is coherent before the push leaves the machine.
#
# See RELEASES.md § Release gating for the full policy.

set -euo pipefail

branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '')"
case "$branch" in
  release/*) ;;
  *) exit 0 ;;  # not a release branch — nothing to verify here
esac

cd "$(git rev-parse --show-toplevel)"

# Fetch origin/main so the comparison base is current. If the fetch fails
# (offline, transient network), warn but don't block — the server-side
# publish workflow is the authoritative gate.
if ! git fetch --quiet origin main 2>/dev/null; then
  echo "check-release-version: WARN — could not fetch origin/main; skipping" >&2
  exit 0
fi

if [ ! -f VERSION ]; then
  echo "check-release-version: ERROR — VERSION file missing at repo root" >&2
  exit 1
fi

new_version="$(tr -d '[:space:]' < VERSION)"
if ! [[ "$new_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "check-release-version: ERROR — VERSION '$new_version' is not X.Y.Z (three non-negative integers)" >&2
  exit 1
fi

# origin/main's VERSION may be absent on the very first release; treat
# "file missing" as empty and skip comparisons that need a prior value.
old_version="$(git show origin/main:VERSION 2>/dev/null | tr -d '[:space:]' || true)"

principles_changed=0
if git diff --name-only origin/main...HEAD -- 'principles/p*-*.md' 2>/dev/null | grep -q .; then
  principles_changed=1
fi

if [ "$principles_changed" -eq 1 ] && [ "$new_version" = "$old_version" ]; then
  echo "check-release-version: ERROR — principle files changed vs origin/main but VERSION is unchanged ($new_version)" >&2
  echo "                       Bump VERSION before pushing; the publish workflow will reject this on main." >&2
  exit 1
fi

# Strict-monotonic check only when both sides have a version.
if [ -n "$old_version" ] && [ "$new_version" != "$old_version" ]; then
  IFS='.' read -r nmaj nmin npatch <<<"$new_version"
  IFS='.' read -r omaj omin opatch <<<"$old_version"
  if   [ "$nmaj" -gt "$omaj" ]; then :
  elif [ "$nmaj" -eq "$omaj" ] && [ "$nmin" -gt "$omin" ]; then :
  elif [ "$nmaj" -eq "$omaj" ] && [ "$nmin" -eq "$omin" ] && [ "$npatch" -gt "$opatch" ]; then :
  else
    echo "check-release-version: ERROR — VERSION on release branch ($new_version) must be strictly greater than origin/main ($old_version)" >&2
    exit 1
  fi
fi

# Tag-already-exists guard — only if we actually bumped.
if [ "$new_version" != "$old_version" ]; then
  if git ls-remote --tags --exit-code origin "refs/tags/v${new_version}" >/dev/null 2>&1; then
    echo "check-release-version: ERROR — tag v${new_version} already exists on origin" >&2
    echo "                       Pick a higher VERSION or delete the stale tag before pushing." >&2
    exit 1
  fi
fi

echo "check-release-version: OK (${old_version:-<none>} -> $new_version on $branch)"
