---
title: "feat: Vault archival — retire pre-repo principles + research folders"
type: feat
status: active
date: 2026-04-23
parents:
  - docs/plans/2026-04-22-002-post-frontmatter-roadmap.md
roadmap-item: 3
---

# feat: Vault archival — retire pre-repo principles + research folders

## Overview

Retire the pre-repo upstream source-of-truth in the private Obsidian vault at
`~/obsidian-vault/Projects/brettdavies-agentnative/{principles,research}/`. Both folders predate this spec repo; their
`AGENTS.md` files still claim to be the canonical upstream, which is now false as of the v0.2.0 cut. Replace each
folder's contents with a short redirect note pointing to this repo, so any future session landing in the vault gets
routed to the live SoT instead of reading stale text.

Scope is deliberately minimal — manual edits in a private, non-git directory. No CI, no tests, no automation. The plan
exists because roadmap 002 item 3 requires a durable record, and because a latent product question inside "archive
research/" needs an explicit answer before the edits run.

## Problem Frame

Two SoTs is zero SoTs. The vault's `principles/AGENTS.md` explicitly labels that folder "the **upstream source of
truth**" with four downstream surfaces (spec site, CLI checks, skill, and itself). That was correct in April 2026 before
the spec repo existed; it became stale the moment
[`2026-04-22-001-feat-requirement-id-frontmatter-plan.md`](2026-04-22-001-feat-requirement-id-frontmatter-plan.md)
merged to `main` via v0.2.0 (commit `83bf0fd`, tag `v0.2.0`).

A pressure-tester or future Claude session opening the vault today would miss:

- the frontmatter contract (requirement IDs live in `principles/*.md` frontmatter in the repo, not in vault prose)
- the governance in `principles/AGENTS.md` of this repo (status, review protocol, MINOR-bump rules)
- `CONTRIBUTING.md`'s coupled-release protocol and AI disclosure policy

The redirect-note pattern is the lightweight, reversible fix.

The `research/` folder is a harder call. Its `AGENTS.md` says it's "the shared research surface" for both the CLI repo
and the site repo. The 2026-04-14 Cloudflare extract is real working input that may still be cited by either repo. Blind
archival would drop live context. U2 below makes this decision explicit before editing.

## Requirements Trace

- R1. The vault's `principles/` folder no longer claims upstream-SoT status; readers are redirected to this repo.
- R2. The vault's `research/` folder is handled deliberately — either migrated into a canonical home (this repo or
  elsewhere), retired with content preserved, or kept with governance updated — not silently dropped.
- R3. The redirect notes point to stable URLs (repo `main` branch, not a floating branch or local file path), so they
  remain valid regardless of which machine a reader opens the vault on.
- R4. Any inbound links from the CLI repo, site repo, or skill that currently reference
  `~/obsidian-vault/Projects/brettdavies-agentnative/{principles,research}/` are identified so they can be updated in
  their home repos (out of scope to fix here; in scope to identify).

## Scope Boundaries

- No changes to the spec repo itself (this repo) — the redirect target already exists.
- No changes to CLI or site repos — any link rewrites land as separate PRs in those repos.
- No build-time automation — the vault is not a git repo; there's no hook surface to install.
- No migration of `principles/` content into this repo — the canonical text is already here at
  `principles/p*-<slug>.md`; the vault copy is a historical snapshot with no unique content to preserve.

### Deferred to Follow-Up Work

- Link rewrites in consuming repos (CLI, site) that currently point at vault paths — tracked per-repo, filed as separate
  plans/PRs when those repos next touch their relevant docs.
- Optional retention of vault `principles/` as a git-untracked historical snapshot elsewhere on disk — not needed; git
  history in this repo already captures the pre-migration state via commit `2b01eee` (PR #3).

---

## Context & Research

### Relevant Code and Patterns

- `principles/AGENTS.md` (this repo) — the new canonical governance doc; redirect notes cite this as the live
  replacement.
- `README.md` (this repo) — contains "## Related" section linking to `anc.dev`, `agentnative-cli`, `agentnative-site`.
  Redirect notes can mirror the same top-level pointers.
- Vault's existing `raw/` symlink pattern (research folder) — proves the user already uses symlinks between vault and
  `~/obsidian-vault/clips/`, so a symlink-based alternative to archival is technically available if U2 chooses it.

### Institutional Learnings

- `ecosystem_layout.md` (session memory) — three-repo split (spec / CLI / site); the vault was the pre-split workspace
  and loses its purpose once the split lands.
- `sot_contract.md` (session memory) — hybrid propagation rules make the spec repo unambiguously authoritative for
  principle text and requirement IDs post-v0.2.0.

### External References

- None. Vault editing is a manual workflow; no external docs needed.

---

## Key Technical Decisions

- **Replace, don't symlink.** The redirect note replaces folder contents. A symlink from the vault folder to the repo
  clone would break on any machine where the repo isn't cloned at the same path — and the vault is synced across
  machines (Obsidian Sync), unlike the repo clone. Prose redirect is portable; symlink isn't.
- **Keep folder names, drop contents.** `principles/` and `research/` folders stay present (so any existing vault
  bookmarks don't 404 in Obsidian). Their contents get replaced by a single `README.md` redirect per folder. Any
  existing files beyond the redirect are moved to a sibling `_archive-2026-04-23/` subfolder within the same folder
  (preserves content locally; signals clearly it's superseded).
- **Research folder decision is U2's job, not U1's.** `principles/` is clean-cut (canonical text is in the repo).
  `research/` has unique content that may still be referenced. Defer the decision to U2 after checking for inbound
  references from the CLI + site repos.

## Open Questions

### Resolved During Planning

- Is Obsidian Sync's history enough to recover if a redirect note is wrong? — **Yes.** Obsidian Sync keeps per-file
  history. Restoration is one click if needed.
- Should the redirect cite a specific spec version (`v0.2.0`) or track `main`? — **Track `main`.** The redirect is a "go
  look here" sign, not a pinned reference. Readers who need a specific version follow the linked README's pointer to the
  releases tag.

### Deferred to Implementation

- **Research folder fate.** Three candidate dispositions, decide in U2 after inbound-link audit:
- (a) **Retire fully** — redirect note + `_archive-2026-04-23/` subfolder. Accept that old extracts are now vault
  history only; CLI/site repos that cited them get updated links in their next respective PRs.
- (b) **Migrate to spec repo** — create `docs/research/` in this repo, move the 2026-04-14 Cloudflare extract +
  `principle-map.md` + `AGENTS.md` governance. Vault becomes a redirect only.
- (c) **Keep in vault, update governance** — rewrite `research/AGENTS.md` to reflect that research is cross-repo feeder
  material, not an SoT. `principles/` still archives; `research/` stays live. Scope of this plan expands.

---

## Implementation Units

- [ ] U1. **Archive vault `principles/` folder**

**Goal:** Replace `~/obsidian-vault/Projects/brettdavies-agentnative/principles/` contents with a single redirect note.
All existing files move to a sibling `_archive-2026-04-23/` subfolder so they're preserved but clearly superseded.

**Requirements:** R1, R3

**Dependencies:** None (plan-time); assumes Obsidian client is closed or paused while editing to avoid sync-in-flight
conflicts.

**Files:**

- Create: `~/obsidian-vault/Projects/brettdavies-agentnative/principles/README.md` (the redirect note)
- Move: all existing `*.md` files in that folder → `_archive-2026-04-23/` subfolder (preserves `AGENTS.md`, `index.md`,
  `p1-*.md` … `p7-*.md`)

**Approach:**

- Redirect note content: 5-10 lines. Title: "This folder is archived"; body: link to
  `https://github.com/brettdavies/agentnative-spec` and specifically to `principles/AGENTS.md` in that repo as the new
  governance entry point. Cite the archival date and the tag (`v0.2.0`) that made this folder obsolete.
- Move (not delete) existing files into `_archive-2026-04-23/`. Recovery via git blame is possible but slow; keeping the
  snapshot in-place is faster for anyone who wants to see what the vault looked like pre-repo.

**Patterns to follow:**

- `README.md` "## Related" section voice — direct, three bullet points max.

**Test scenarios:**

- Happy path: a reader opening `~/obsidian-vault/Projects/brettdavies-agentnative/principles/` in Obsidian sees only
  `README.md` + `_archive-2026-04-23/`. The note's link resolves to the spec repo on GitHub.
- Edge case: Obsidian sync replicates the move across all vault clients without conflicts.
- Test expectation: none (manual verification; vault is not a git repo). Visual check after edit.

**Verification:**

- `ls ~/obsidian-vault/Projects/brettdavies-agentnative/principles/` shows `README.md` and `_archive-2026-04-23/` only.
- Opening the redirect note in Obsidian and clicking the GitHub link lands on
  `https://github.com/brettdavies/agentnative-spec`.

---

- [ ] U2. **Decide and apply disposition for vault `research/` folder**

**Goal:** Resolve the research-folder question (retire / migrate / keep-with-governance-update) and apply the decision.

**Requirements:** R2, R3, R4

**Dependencies:** U1 (learn from principles archival whether the move-to-_archive pattern behaves well in Obsidian
Sync before applying it a second time)

**Files:** Depends on disposition:

- **(a) Retire fully:** `~/obsidian-vault/Projects/brettdavies-agentnative/research/README.md` (redirect); everything
  else → `_archive-2026-04-23/` subfolder
- **(b) Migrate to spec repo:** create `docs/research/` in this repo, move `extracts/*.md`, `principle-map.md`,
  `AGENTS.md` (rewritten to reflect new home); vault folder gets same redirect pattern as (a)
- **(c) Keep + update governance:** only `~/obsidian-vault/Projects/brettdavies-agentnative/research/AGENTS.md` changes
  (rewritten to drop the SoT claim and re-frame as "cross-repo feeder material"); everything else stays

**Approach:**

- **Inbound-link audit (precedes disposition choice):** grep the CLI and site repos for any reference to
  `obsidian-vault/Projects/brettdavies-agentnative/research` or `research/extracts/`. The count + nature of hits informs
  the choice:
- Zero hits → (a) retire fully is safe
- Hits in site copy or CLI docs pointing at a specific extract → (b) migrate to spec repo, so the links can be rewritten
  to a stable public URL
- Hits in private notes only → (c) keep + update governance, so the notes still resolve in the vault
- **Apply the chosen disposition.** Mirror U1's archival pattern if (a) or (b); rewrite a single `AGENTS.md` if (c).

**Patterns to follow:**

- U1's redirect-note shape (if (a) or (b))
- `principles/AGENTS.md` in this repo (if (b) and `AGENTS.md` needs rewriting)

**Test scenarios:**

- Happy path: chosen disposition is applied; inbound-link audit surfaces any downstream repos that need follow-up link
  rewrites.
- Edge case: if (b) is chosen, the spec-repo PR that adds `docs/research/` correctly preserves Obsidian-flavored
  markdown (wikilinks if any) or rewrites to plain relative links. Check by reading a migrated extract after the move.
- Test expectation: `scripts/hooks/pre-push` runs if (b) is chosen (the move touches the spec repo); must pass
  markdownlint, link-check, and the validate-principles hook (which only scans `principles/`, so unaffected). If (a) or
  (c) are chosen, no automated tests apply — manual verification only.

**Verification:**

- (a) Vault `research/` contains only `README.md` + `_archive-2026-04-23/`
- (b) `docs/research/` exists in this repo with migrated files; pre-push hook passes; commit message cites item 3
- (c) Vault `research/AGENTS.md` no longer claims SoT status; reads as feeder-material governance instead

---

## System-Wide Impact

- **Interaction graph:** None in-repo. External: CLI and site repos may have inbound links that become stale; those are
  tracked and fixed separately in each repo's own next PR.
- **Unchanged invariants:**
- Spec repo's `principles/` folder and `principles/AGENTS.md` — this plan doesn't touch them.
- Frontmatter contract, requirement IDs, publish workflow, CHANGELOG convention — all unaffected.
- Obsidian Sync configuration — no vault settings change.

---

## Risks & Dependencies

| Risk                                                                          | Mitigation                                                                                                               |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Obsidian Sync mid-edit conflict creates duplicate files                       | Pause Obsidian Sync on the active device before editing; let it settle before resuming.                                  |
| `_archive-2026-04-23/` subfolder shows up as unexpected noise in vault search | Acceptable — the folder name is self-describing, and Obsidian's search can be excluded per-folder in settings if needed. |
| A follow-up reader deletes `_archive-2026-04-23/` thinking it's cruft         | Git history in this repo has the pre-migration state (PR #3, commit `2b01eee`). Loss is recoverable.                     |
| Inbound-link audit in U2 misses a private reference                           | Accept — the vault is a private space; worst case is a dead link the owner fixes when they next land on it.              |

---

## Documentation / Operational Notes

- Strike item 3 from roadmap 002 once U1 + U2 land (status: shipped with date + disposition-choice noted).
- If (b) migrate is chosen in U2: the follow-up link-rewrite work in CLI + site repos is filed as issues in those repos,
  referencing this plan.

## Sources & References

- **Parent roadmap:**
  [`docs/plans/2026-04-22-002-post-frontmatter-roadmap.md`](2026-04-22-002-post-frontmatter-roadmap.md), item 3
- Related session memory: `ecosystem_layout.md`, `sot_contract.md`
- Archival source folders: `~/obsidian-vault/Projects/brettdavies-agentnative/principles/`,
  `~/obsidian-vault/Projects/brettdavies-agentnative/research/`
- Related repos: `brettdavies/agentnative-cli`, `brettdavies/agentnative-site` (for U2's inbound-link audit)
