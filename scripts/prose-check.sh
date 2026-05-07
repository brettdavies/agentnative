#!/usr/bin/env bash
# SPDX-License-Identifier: MIT OR Apache-2.0
#
# Pre-push prose-check orchestrator.
#
# Walks the in-scope *.md set, runs Vale (custom Brand+Spec packs +
# write-good + proselint baseline) at MinAlertLevel=warning with JSON
# output, splits severity orchestrator-side, then probes LanguageTool
# over Tailscale and runs grammar checks if reachable. Vale errors and
# category-whitelisted LT matches block the push; warnings annotate but
# do not block. When LT is unreachable, the LT stage skips with a
# notice and the push proceeds on Vale's verdict alone (R9 graceful
# skip).
#
# Usage:
#   scripts/prose-check.sh                 full scope, errors only (pre-push default)
#   scripts/prose-check.sh --changed-only  only files changed vs $PROSE_CHECK_BASE (default origin/dev)
#   scripts/prose-check.sh --warnings      surface warning-tier findings too
#   scripts/prose-check.sh --vale-only     skip LT entirely (offline iteration)
#   scripts/prose-check.sh --lt-only       skip Vale entirely (LT debugging)
#
# Env:
#   LANGUAGETOOL_URL    LT base URL (default: http://pool.tail42ba87.ts.net:8081)
#                       FQDN avoids macOS+Tailscale short-name DNS timeouts.
#   PROSE_CHECK_BASE    git ref to diff against in --changed-only (default: origin/dev)

set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

LT_URL_DEFAULT="http://pool.tail42ba87.ts.net:8081"
LT_URL="${LANGUAGETOOL_URL:-$LT_URL_DEFAULT}"
PROSE_CHECK_BASE="${PROSE_CHECK_BASE:-origin/dev}"
# LT blocking whitelist — narrowed from the plan's 7-category default
# (TYPOS|GRAMMAR|PUNCTUATION|TYPOGRAPHY|CASING|COMPOUNDING|CONFUSED_WORDS)
# to the three categories that are reliably high-signal on markdown corpora.
# PUNCTUATION/TYPOGRAPHY/CASING/COMPOUNDING fired ~95% noise on the spec
# corpus from LT misreading markdown syntax (table whitespace, `->` arrows,
# code-fence quotes); they remain on the warning tier (visible via
# --warnings). Re-promote to blocking when LT gains markdown awareness or
# a per-rule allowlist lands.
LT_BLOCKING_CATEGORIES='^(TYPOS|GRAMMAR|CONFUSED_WORDS)$'

CHANGED_ONLY=0
SHOW_WARNINGS=0
RUN_VALE=1
RUN_LT=1

while (( $# )); do
  case "$1" in
    --changed-only) CHANGED_ONLY=1 ;;
    --warnings) SHOW_WARNINGS=1 ;;
    --vale-only) RUN_LT=0 ;;
    --lt-only) RUN_VALE=0 ;;
    -h|--help) sed -n '3,28p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "prose-check: unknown flag '$1'" >&2; exit 2 ;;
  esac
  shift
done

# --- File enumeration ---
if (( CHANGED_ONLY )); then
  mapfile -t MD_FILES < <(
    git diff --name-only --diff-filter=ACM "$PROSE_CHECK_BASE"...HEAD -- '*.md' \
      | grep -v -E '^(docs/(brainstorms|plans|research)/|AGENTS\.md$|CHANGELOG\.md$|docs/solutions/|styles/(proselint|write-good|\.vale-config)/|scripts/__fixtures__/)' \
      | sort -u
  )
else
  mapfile -t MD_FILES < <(
    find . -type f -name '*.md' \
      -not -path './node_modules/*' \
      -not -path './.git/*' \
      -not -path './.context/*' \
      -not -path './scripts/__fixtures__/*' \
      -not -path './docs/brainstorms/*' \
      -not -path './docs/plans/*' \
      -not -path './docs/research/*' \
      -not -path './docs/solutions/*' \
      -not -path './styles/proselint/*' \
      -not -path './styles/write-good/*' \
      -not -path './styles/.vale-config/*' \
      -not -name 'AGENTS.md' \
      -not -name 'CHANGELOG.md' \
      | sed 's|^\./||' \
      | sort
  )
fi

if (( ${#MD_FILES[@]} == 0 )); then
  echo "prose-check: 0 markdown files in scope; nothing to check"
  exit 0
fi

BLOCKING=0
WARNING=0
OUT_FILE="$(mktemp)"
trap 'rm -f "$OUT_FILE"' EXIT

# --- Vale stage ---
if (( RUN_VALE )); then
  VALE_JSON="$(vale --no-global --output=JSON --minAlertLevel=warning "${MD_FILES[@]}" 2>/dev/null || true)"
  if [[ -n "$VALE_JSON" && "$VALE_JSON" != "{}" ]]; then
    while IFS=$'\t' read -r file line col sev rule msg; do
      [[ -z "$file" ]] && continue
      if [[ "$sev" == "error" ]]; then
        BLOCKING=$((BLOCKING + 1))
        printf '%s:%s:%s:%s: %s\n' "$file" "$line" "$col" "$rule" "$msg" >> "$OUT_FILE"
      else
        WARNING=$((WARNING + 1))
        if (( SHOW_WARNINGS )); then
          printf '[warn] %s:%s:%s:%s: %s\n' "$file" "$line" "$col" "$rule" "$msg" >> "$OUT_FILE"
        fi
      fi
    done < <(jaq -r 'to_entries[] | .key as $f | .value[] | [$f, .Line, .Span[0], .Severity, .Check, .Message] | @tsv' <<<"$VALE_JSON")
  fi
fi

# --- LanguageTool stage ---
if (( RUN_LT )); then
  if curl --max-time 2 -fsS "$LT_URL/v2/languages" >/dev/null 2>&1; then
    LT_TMP="$(mktemp -d)"
    trap 'rm -rf "$LT_TMP" "$OUT_FILE"' EXIT

    printf '%s\0' "${MD_FILES[@]}" | xargs -0 -P4 -I{} bash -c '
      file="$1"; tmp="$2"; url="$3"
      out="$tmp/$(echo "$file" | tr "/" "_").json"
      curl -sS --max-time 30 -X POST "$url/v2/check" \
        --data-urlencode "language=en-US" \
        --data-urlencode "text@$file" > "$out" 2>/dev/null || true
    ' _ {} "$LT_TMP" "$LT_URL"

    for f in "${MD_FILES[@]}"; do
      json="$LT_TMP/$(echo "$f" | tr '/' '_').json"
      [[ -s "$json" ]] || continue
      while IFS=$'\t' read -r offset rule_id category message; do
        [[ -z "$offset" ]] && continue
        # Approximate line from byte offset (no exact column conversion at v1).
        line=$(awk -v off="$offset" 'BEGIN{cur=0} {cur+=length($0)+1; if (cur>off) {print NR; exit}}' "$f" 2>/dev/null)
        line="${line:-?}"
        if [[ "$category" =~ $LT_BLOCKING_CATEGORIES ]]; then
          BLOCKING=$((BLOCKING + 1))
          printf '%s:%s:LT.%s (%s): %s\n' "$f" "$line" "$rule_id" "$category" "$message" >> "$OUT_FILE"
        else
          WARNING=$((WARNING + 1))
          if (( SHOW_WARNINGS )); then
            printf '[warn] %s:%s:LT.%s (%s): %s\n' "$f" "$line" "$rule_id" "$category" "$message" >> "$OUT_FILE"
          fi
        fi
      done < <(jaq -r '.matches[]? | [.offset, .rule.id, .rule.category.id, .message] | @tsv' "$json" 2>/dev/null || true)
    done
  else
    rc=$?
    case "$rc" in
      6)  reason="couldn't resolve host (Tailscale likely off, or FQDN drift)" ;;
      7)  reason="couldn't connect (host up, LT service down)" ;;
      28) reason="timed out (>2s; service slow or network impaired)" ;;
      *)  reason="curl exit $rc" ;;
    esac
    echo "prose-check: LanguageTool unreachable at $LT_URL — $reason; skipping grammar check" >&2
  fi
fi

# Print findings sorted by file then line
if [[ -s "$OUT_FILE" ]]; then
  sort -t: -k1,1 -k2,2n "$OUT_FILE"
fi

echo "prose-check: $BLOCKING blocking, $WARNING warning"
(( BLOCKING > 0 )) && exit 1
exit 0
