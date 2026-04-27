---
title: "refactor: align local CLI dir, heal spec-repo name drift across docs, and manufacture GitHub redirect alias"
type: refactor
status: active
date: 2026-04-27
---

# refactor: align local CLI dir, heal spec-repo name drift across docs, and manufacture GitHub redirect alias

## Overview

Three coordinated changes to the agentnative repo family that together close a long-standing naming inconsistency and
unblock the in-flight `gstack/` cross-repo cleanup audit:

1. **Local CLI dir rename.** `~/dev/agentnative/` → `~/dev/agentnative-cli/`, so the local path matches the
   `brettdavies/agentnative-cli` GitHub remote it has been lagging since the GitHub repo rename earlier in April. This
   also heals a stale `~/.gstack/slug-cache/` entry that has been making the spec and CLI repos collide on a single
   gstack project workspace (`brettdavies-agentnative`), preventing clean per-repo attribution of gstack content.
2. **Spec-name doc drift.** `rg 'brettdavies/agentnative-spec'` finds 31 occurrences across 7 files in spec / CLI / site
   / solutions-docs / spec-memory. None of those URLs resolve today — `brettdavies/agentnative-spec` is not, and per
   user decision will not be, a real GitHub repo. The canonical name stays bare `brettdavies/agentnative` (the umbrella
   brand). Every drifted citation must be rewritten. This includes the canonical decision record `naming-rationale.md`
   itself, which today documents the wrong GitHub name and is the upstream source of the drift.
3. **Manufactured GitHub redirect alias for `brettdavies/agentnative-spec`.** Two `gh repo rename` calls (rename away,
   rename back) leave `agentnative-spec` as a passive redirect to `agentnative` so external links we can't grep — cached
   SERPs, third-party citations, anyone who copy-pasted the wrong URL — heal silently. Belt-and-suspenders under the doc
   fixes, not a substitute for them.

## Problem Frame

Three asymmetries currently coexist:

- **Local-vs-remote name asymmetry for the CLI:** local dir `~/dev/agentnative/` lags GitHub
  `brettdavies/agentnative-cli`.
- **Local-vs-remote name asymmetry for the spec:** local dir `~/dev/agentnative-spec/` (the `-spec` suffix is
  intentional human disambiguation) vs GitHub bare `brettdavies/agentnative` (intentional umbrella-brand). This
  asymmetry is *load-bearing* — the user's decision is to keep both as-is — so it must be codified, not eliminated.
- **Drift in our own docs:** 31 `brettdavies/agentnative-spec` citations across 7 files claim a GitHub repo that does
  not exist. Every URL 404s today. The canonical decision record at `docs/decisions/naming-rationale.md:41` literally
  states the wrong name, which means downstream docs and any LLM reading that file as context inherit the bug.

The slug collision is a downstream symptom of the local-CLI asymmetry: gstack derives slugs from git remote and caches
them by absolute path. The CLI dir's cached slug (`brettdavies-agentnative`) was written before the GitHub remote got
renamed to `agentnative-cli`, so the spec and CLI now share a gstack project workspace. Renaming the CLI dir orphans the
stale cache key; gstack auto-derives `brettdavies-agentnative-cli` from the corrected path on next run, cleanly
separating the workspaces.

## Requirements Trace

- R1. Local CLI dir matches its GitHub remote name: `~/dev/agentnative-cli/` ↔ `brettdavies/agentnative-cli`.
- R2. Local spec dir keeps `-spec` suffix; GitHub spec stays bare `brettdavies/agentnative`. The asymmetry is a
  documented convention, not an oversight.
- R3. Zero in-tree references to the non-existent `brettdavies/agentnative-spec` GitHub repo across spec, CLI, site, and
  solutions-docs working trees.
- R4. The canonical naming decision record (`docs/decisions/naming-rationale.md`) documents the actual canonical name
  (`brettdavies/agentnative`) and explicitly codifies the local-`-spec` / remote-bare convention so future writers don't
  reintroduce the drift.
- R5. External links of shape `https://github.com/brettdavies/agentnative-spec/...` resolve via redirect after the
  manufactured-alias trick.
- R6. Spec-memory `ecosystem_layout.md` topology table updated to drop the `(pre-rename dir name)` annotation and carry
  the convention so future sessions onboard cleanly.
- R7. The dotfiles tmuxinator session targeting the CLI repo points at the new path.

## Scope Boundaries

- **Not in scope:** the gstack project-content cleanup itself (Phase 2/3/4 of the original audit). That resumes after
  this refactor lands. This plan only does the prerequisite naming alignment.
- **Not in scope:** rebuilding any `~/.gstack/projects/<slug>/` workspaces. The collision project
  (`brettdavies-agentnative/`) becomes spec-only after the rename; CLI gets a fresh empty `brettdavies-agentnative-cli/`
  workspace on next gstack run from the renamed dir. File moves between workspaces happen in the gstack audit's Phase 4,
  not here.
- **Not in scope:** rewriting the forensic deployment-issues doc (`headless-server-post-reboot-...-20260402.md`). Its
  `~/dev/agentnative` references are an incident-time recipe; rewriting them erases the forensic record.
  Annotate-and-leave.
- **Not in scope:** the historical Claude Code project-memory dir `~/.claude/projects/-home-brett-dev-agentnative/`. New
  sessions in the renamed dir get a fresh project dir (`-home-brett-dev-agentnative-cli/`); the old dir stays as
  read-only conversation history.
- **Explicitly rejected:** renaming the GitHub spec repo to `agentnative-spec` permanently (i.e., changing the canonical
  name). The bare brand on GitHub is the user's locked decision.

### Deferred to Follow-Up Work

- gstack audit Phase 2/3/4 (synthesize, propose, execute) — resumes after this plan ships.

## Context & Research

### Relevant Code and Patterns

- `~/.claude/skills/gstack/bin/gstack-slug` — derives slug from git remote URL, caches by absolute path. The cache key
  is what goes stale when a path is renamed.
- `~/dotfiles/stow/tmuxinator/dot-config/tmuxinator/agentnative.yml` — tmuxinator config file targeting the CLI repo.
  Stow-managed.
- `~/dev/solutions-docs/best-practices/cross-repo-artifact-consumption-static-sites-2026-04-21.md` — establishes the
  `ANC_ROOT="${ANC_ROOT:-$HOME/dev/agentnative}"` env-var convention. Default value needs updating; the env-var name
  stays.
- `~/dev/solutions-docs/best-practices/pr-body-driven-changelog-generation-20260423.md` — references
  `~/dev/agentnative/scripts/generate-changelog.sh` as the reference implementation. Path needs updating.

### Institutional Learnings

- `solutions-docs/best-practices/github-repo-rename-release-pipeline-resilience-2026-04-20.md` — prior repo-rename
  postmortem. Key insight: GitHub auto-redirects `git remote` URLs and HTTP URLs after a rename, so we don't need to
  manually `git remote set-url` on local clones during U8 — but `git fetch` may emit a "this repo moved" warning during
  the brief window the spec's canonical name is `agentnative-spec`.
- `solutions-docs/best-practices/prose-spec-repo-pre-push-pipeline-20260422.md` — describes the spec repo's
  `scripts/hooks/pre-push` which mirrors CI on every push. Each commit to spec repo will trigger ~30-60s of pre-push
  validation. Sequence accordingly.

### External References

- GitHub Docs: "Renaming a repository" — confirms rename creates a redirect, redirects persist as long as the old name
  slot is not claimed, redirects work for both `git` and HTTP URLs, second rename overwrites the prior redirect if the
  slot is reused.

## Key Technical Decisions

- **Local CLI rename direction**: rename local dir to match GitHub (`agentnative-cli`), not the reverse. Matches the
  intent declared in the prior topology table's `(pre-rename dir name)` annotation.
- **Local spec stays at `agentnative-spec`**: codified, not eliminated. The `-spec` suffix is human disambiguation
  against the `agentnative` umbrella term, which is also the brand name and the GitHub repo name.
- **GitHub spec stays bare `agentnative`**: locked decision. The umbrella brand IS the canonical repo name.
- **Manufactured `agentnative-spec` redirect (the trick)**: rename `agentnative` → `agentnative-spec`, then rename
  `agentnative-spec` → `agentnative`. End state: `agentnative` is real (overwrites the first redirect),
  `agentnative-spec` is a fresh redirect to `agentnative`. Belt-and-suspenders for external links we can't grep.
- **Drift fixes are mandatory; the redirect is a safety net**: doc prose stating `brettdavies/agentnative-spec` is
  *factually wrong*, not just clickably-broken. Redirects don't make wrong prose right. The naming-rationale doc fix is
  the most load-bearing change in this whole plan.
- **Annotate-and-leave for the forensic doc**: the headless-server postmortem is an incident-time recipe; its
  `~/dev/agentnative` references are operationally meaningful at that point in time. Rewrite would obscure history.
- **No PRs, no feature branches**: every change here is docs-only or scaffolding. Per `~/.claude/CLAUDE.md` branch
  discipline carve-out, plan/decisions/memory commits land directly on each repo's default development branch.
- **Commit per repo, not per file**: each repo gets one cohesive commit covering all its drift fixes plus any related
  changes. SRP at the commit level = one repo's worth of "naming alignment" per commit.

## Open Questions

### Resolved During Planning

- *Should the GitHub spec repo be renamed to `agentnative-spec` permanently?* No — bare brand stays canonical (user
  decision).
- *Should the CLI's untracked `2026-04-23-001-feat-spec-vendor-plan.md` get committed as part of this work?* No — the
  file's commit decision is the user's call. We edit in place; user commits when ready.
- *Do dotfiles uncommitted changes block U6?* No — surgical commit (`git add` only the tmuxinator paths) leaves the
  user's other dirty changes alone.
- *Tmuxinator yml filename: keep `agentnative.yml` or rename to `agentnative-cli.yml`?* Rename for symmetry with the CLI
  dir name. Session name and root path both updated.

### Deferred to Implementation

- *Will the spec repo's pre-push hook block U1's commit?* Unknown until it runs. If it fails, fix the underlying issue
  rather than `--no-verify` (per CLAUDE.md hard rule).
- *Does GitHub emit a "this repo moved" warning on `git fetch` during the brief window in U8?* Likely, per the
  cross-repo-artifact learning. Acceptable; we're not running concurrent fetches.

## Implementation Units

- [ ] U1. **Spec repo drift fixes**

**Goal:** Heal 4 occurrences of `brettdavies/agentnative-spec` in the spec repo, including the canonical decision
record.

**Requirements:** R3, R4

**Dependencies:** None

**Files:**

- Modify: `docs/decisions/naming-rationale.md` (1 hit at line 41)
- Modify: `docs/plans/2026-04-22-002-post-frontmatter-roadmap.md` (1 hit, "this repo" self-citation)
- Modify: `docs/plans/2026-04-23-002-feat-vault-archival-plan.md` (2 hits)

**Approach:**

- In `naming-rationale.md`: rewrite the `**GitHub org / repos:**` line to name the spec correctly as
  `brettdavies/agentnative` (this repo, SoT — bare brand on GitHub) and add a short paragraph after the existing
  decision section codifying the convention: *"GitHub uses the bare umbrella brand for the spec; CLI and site siblings
  carry suffixes. Locally, the spec dir adds `-spec` (`~/dev/agentnative-spec/`) for disambiguation against the umbrella
  term, since unsuffixed `agentnative` would shadow the brand name in shell context. CLI and site local paths match
  their GitHub names directly."*
- In the two plan files: bulk find-replace `brettdavies/agentnative-spec` → `brettdavies/agentnative`. Verify no false
  positives (e.g., bare `agentnative-spec` referring to the local dir name — leave those).

**Verification:**

- `rg 'brettdavies/agentnative-spec' /home/brett/dev/agentnative-spec` returns zero hits.
- The naming-rationale section now teaches the convention rather than misnaming the repo.

**Commit:** `docs: correct GitHub repo name in cross-repo citations and codify naming convention` on branch `dev`.

---

- [ ] U2. **Local CLI rename and slug-cache hygiene**

**Goal:** Align the local CLI dir name with its GitHub remote and clear the stale cache that's been driving the gstack
slug collision.

**Requirements:** R1

**Dependencies:** U1 (do spec drift fixes first; they're commit-bearing on a separate working tree, no ordering hazard,
but completes-before keeps the audit-trail tidy)

**Files:**

- Filesystem: `mv ~/dev/agentnative ~/dev/agentnative-cli`
- Filesystem: `trash ~/.gstack/slug-cache/_home_brett_dev_agentnative` (orphan after rename)

**Approach:**

- Single `mv` of the entire working tree. Symlinks `docs/solutions/` → `~/dev/solutions-docs/` survive (target is
  outside the renamed tree).
- Trash (not `rm`) the orphaned slug-cache key per CLAUDE.md tool preferences.

**Verification:**

- `git -C ~/dev/agentnative-cli remote -v` shows `git@github.com:brettdavies/agentnative-cli.git`.
- `~/.claude/skills/gstack/bin/gstack-slug` from the new path prints `SLUG=brettdavies-agentnative-cli`.
- `~/dev/agentnative` no longer exists.

**No commit:** filesystem-level change.

---

- [ ] U3. **CLI repo drift fix (in-place, no commit)**

**Goal:** Heal 16 `brettdavies/agentnative-spec` occurrences in the CLI repo's heaviest plan file.

**Requirements:** R3

**Dependencies:** U2 (file lives at the renamed path)

**Files:**

- Modify: `~/dev/agentnative-cli/docs/plans/2026-04-23-001-feat-spec-vendor-plan.md` (16 hits)

**Approach:**

- The file is uncommitted on `main` (user's plan-in-flight). Edit in place; do not commit on the user's behalf. Bulk
  find-replace `brettdavies/agentnative-spec` → `brettdavies/agentnative`.
- Skim a sampling of the rewrites to verify each is GitHub-URL-shaped (the right replacement target). Bare
  `agentnative-spec` references (e.g., `agentnative-spec:CONTRIBUTING.md` shorthand) are bug citations of the same kind
  — also rewrite to `brettdavies/agentnative:CONTRIBUTING.md` if context is GitHub-shaped, leave if context is purely
  local-dir-shaped.

**Verification:**

- `rg 'brettdavies/agentnative-spec' ~/dev/agentnative-cli` returns zero hits.

**No commit:** the file was already uncommitted; user owns the commit decision.

---

- [ ] U4. **Site repo drift fix**

**Goal:** Heal 9 drift hits in the site's sync-spec plan.

**Requirements:** R3

**Dependencies:** None (site working tree is independent of CLI rename)

**Files:**

- Modify: `~/dev/agentnative-site/docs/plans/2026-04-23-001-feat-sync-spec-plan.md` (9 hits)

**Approach:**

- Bulk find-replace `brettdavies/agentnative-spec` → `brettdavies/agentnative`. Same per-occurrence sanity check as U3.
- One untracked file in `docs/plans/` (`2026-04-24-001-feat-skill-distribution-endpoint-plan.md`) is unrelated to this
  refactor — leave it alone.

**Verification:**

- `rg 'brettdavies/agentnative-spec' ~/dev/agentnative-site` returns zero hits.

**Commit:** `docs(plans): correct upstream spec repo name in sync-spec plan` on branch `dev`.

---

- [ ] U5. **Solutions-docs fixes (drift + CLI path refs)**

**Goal:** Heal 1 drift hit + update 4 CLI-path references after the rename + annotate the forensic doc without rewriting
it.

**Requirements:** R3, R7

**Dependencies:** U2 (CLI path references must point at the new dir)

**Files:**

- Modify: `best-practices/prose-spec-repo-pre-push-pipeline-20260422.md` (1 drift hit at line 123)
- Modify: `best-practices/cross-repo-artifact-consumption-static-sites-2026-04-21.md` (`ANC_ROOT` default
  `$HOME/dev/agentnative` → `$HOME/dev/agentnative-cli`)
- Modify: `best-practices/pr-body-driven-changelog-generation-20260423.md` (3 paths `~/dev/agentnative/scripts/...` →
  `~/dev/agentnative-cli/scripts/...`)
- Modify: `deployment-issues/headless-server-post-reboot-triage-brew-hang-fork-bomb-renice-20260402.md` (annotate inline
  once: forensic record kept verbatim with one bracketed note explaining the dir was later renamed)

**Approach:**

- Drift fix: rewrite `brettdavies/agentnative-spec` → `brettdavies/agentnative`.
- CLI path refs: `~/dev/agentnative/...` → `~/dev/agentnative-cli/...` only where the reference is to the local CLI
  working dir. Leave references to other repos alone.
- Forensic doc: add a single inline parenthetical in the section header or first line: *"(Path references below reflect
  the dir's name at incident time, 2026-04-02. The dir was later renamed to `~/dev/agentnative-cli/` to match its GitHub
  remote — see `docs/plans/2026-04-27-001-...`.)"* Do not modify the recipe lines.

**Verification:**

- `rg 'brettdavies/agentnative-spec' ~/dev/solutions-docs` returns zero hits.
- `rg '\$HOME/dev/agentnative\b|~/dev/agentnative\b|/home/brett/dev/agentnative\b' ~/dev/solutions-docs` returns hits
  only in the forensic doc.

**Commit:** `docs: correct upstream spec name + update local CLI path refs after rename` on branch `main`. Push (per
solutions-docs convention from the global CLAUDE.md).

---

- [ ] U6. **Dotfiles tmuxinator update**

**Goal:** Realign tmuxinator session config to match the renamed CLI dir.

**Requirements:** R7

**Dependencies:** U2 (root: path must point at the new dir)

**Files:**

- Rename: `stow/tmuxinator/dot-config/tmuxinator/agentnative.yml` → `agentnative-cli.yml`
- Modify (in renamed file): `name: agentnative` → `name: agentnative-cli`; `root: ~/dev/agentnative` → `root:
  ~/dev/agentnative-cli`

**Approach:**

- Use `git mv` so the rename shows as a rename in `git status`.
- Edit `name:` and `root:` fields surgically; preserve everything else.
- Commit with `git add stow/tmuxinator/...` only — do not stage the user's other dirty files in the working tree
  (`.claude/settings.local.json`, `stow/claude/...`).
- After commit, the user can re-stow at their leisure: `cd ~/dotfiles && stow -R --target ~ tmuxinator`. The active
  symlink-source change is a stow restow, but tmuxinator only reads the file when invoked, so timing is non-critical.

**Verification:**

- `git -C ~/dotfiles status -s stow/tmuxinator/` shows the rename + edit committed cleanly.
- The user's other dirty files in the dotfiles working tree are still dirty (not accidentally committed).

**Commit:** `feat(tmuxinator): rename agentnative session to agentnative-cli matching renamed dir` on the dotfiles
default branch.

---

- [ ] U7. **Spec memory codification**

**Goal:** Update the spec's local memory so future sessions onboard with correct topology and the codified naming
convention.

**Requirements:** R6, also reinforces R4

**Dependencies:** None (memory is independent of the working trees)

**Files:**

- Modify: `~/.claude/projects/-home-brett-dev-agentnative-spec/memory/ecosystem_layout.md` (update topology table: CLI
  local path becomes `~/dev/agentnative-cli/`, drop the `(pre-rename dir name)` annotation, add a one-line convention
  statement)
- Modify: `~/.claude/projects/-home-brett-dev-agentnative-spec/memory/pending_upstream_work.md` (1 drift hit)

**Approach:**

- `ecosystem_layout.md` topology table: CLI row's local path field becomes `~/dev/agentnative-cli/` (no annotation).
- Append a one-line convention statement under the table: *"Naming convention: GitHub uses bare brand for the spec
  (`brettdavies/agentnative`); CLI and site siblings match GitHub names on both surfaces. Locally the spec adds `-spec`
  for disambiguation."*
- `pending_upstream_work.md`: rewrite the `brettdavies/agentnative-spec` citation to `brettdavies/agentnative`.

**Verification:**

- `rg 'pre-rename dir name' ~/.claude/projects/-home-brett-dev-agentnative-spec/memory/` returns zero hits.
- `rg 'brettdavies/agentnative-spec' ~/.claude/projects/-home-brett-dev-agentnative-spec/memory/` returns zero hits.

**No commit:** local-only memory.

---

- [ ] U8. **GitHub redirect trick — manufacture the alias**

**Goal:** Establish `brettdavies/agentnative-spec` as a passive redirect to `brettdavies/agentnative` so external links
of that shape resolve cleanly.

**Requirements:** R5

**Dependencies:** U1, U2, U3, U4, U5, U6, U7 (do all internal-state corrections first; the redirect is a safety net, not
a substitute for them — order matters per the plan's design rationale)

**Files:**

- None modified locally. Two GitHub API operations.

**Approach:**

```text
T0:  agentnative           = real
     agentnative-spec      = does not exist (404)

T1:  gh repo rename agentnative-spec --repo brettdavies/agentnative --yes
     agentnative           = redirect → agentnative-spec
     agentnative-spec      = real

T2:  gh repo rename agentnative --repo brettdavies/agentnative-spec --yes
     agentnative           = real (overwrites the T1 redirect)
     agentnative-spec      = redirect → agentnative
```

> *This illustrates the intended state transitions and is directional guidance for review, not a copy-paste recipe.
> The `gh repo rename` flag form may need adjustment based on the local `gh` version.*

- Run T1, immediately verify intermediate state via `gh api`, then run T2. Total elapsed time: a few seconds.
- Local `git remote -v` for the spec repo never needs updating: the URL still says `brettdavies/agentnative.git` and
  GitHub's redirect machinery honors it transparently.
- During the brief window between T1 and T2, the spec repo's canonical name is `agentnative-spec`. Any concurrent `git
  fetch` from another session would receive a "moved" warning. Avoid concurrent fetches; this session won't be fetching
  during that window anyway.

**Verification:**

- `gh api repos/brettdavies/agentnative --jq .name` → `agentnative` (real).
- `gh api repos/brettdavies/agentnative-spec --jq .name` → `agentnative` (redirect resolves; the API returns the
  canonical name of the target repo).
- `curl -sI -L https://github.com/brettdavies/agentnative-spec | head -1` → 200 (after redirect).
- `git -C ~/dev/agentnative-spec fetch origin` succeeds without error (warnings about move are acceptable; an actual
  failure is not).

**No commit:** GitHub-side state only.

---

- [ ] U9. **Final verification**

**Goal:** Confirm the full end state and surface any leftovers.

**Requirements:** All

**Dependencies:** U1–U8

**Files:**

- None modified.

**Approach:**

Run the full verification battery in one batch:

| Check                                                                                                                                                                                              | Expected                                               |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `rg 'brettdavies/agentnative-spec' ~/dev/agentnative-spec ~/dev/agentnative-cli ~/dev/agentnative-site ~/dev/solutions-docs ~/.claude/projects/-home-brett-dev-agentnative-spec/memory ~/dotfiles` | zero hits                                              |
| `~/.claude/skills/gstack/bin/gstack-slug` from `~/dev/agentnative-spec`                                                                                                                            | `SLUG=brettdavies-agentnative`                         |
| `~/.claude/skills/gstack/bin/gstack-slug` from `~/dev/agentnative-cli`                                                                                                                             | `SLUG=brettdavies-agentnative-cli`                     |
| `gh api repos/brettdavies/agentnative --jq .name`                                                                                                                                                  | `agentnative`                                          |
| `gh api repos/brettdavies/agentnative-spec --jq .name`                                                                                                                                             | `agentnative` (redirect)                               |
| `git -C ~/dev/agentnative-spec log --oneline -1`                                                                                                                                                   | shows the new "correct GitHub repo name" commit        |
| `git -C ~/dev/agentnative-site log --oneline -1`                                                                                                                                                   | shows the new "correct upstream spec repo name" commit |
| `git -C ~/dev/solutions-docs log --oneline -1`                                                                                                                                                     | shows the new "correct upstream spec name" commit      |
| `git -C ~/dotfiles log --oneline -1 -- stow/tmuxinator/`                                                                                                                                           | shows the tmuxinator rename commit                     |

**Test scenarios:**

- *Happy path: drift count.* `rg 'brettdavies/agentnative-spec' <all working trees> → 0` proves R3.
- *Happy path: slug derivation.* `gstack-slug` from each renamed dir prints the expected slug, proving R1 + the
  collision is gone.
- *Happy path: redirect resolution.* `gh api` returns canonical name when queried via the alias slot, proving R5.
- *Edge case: site untracked plan file untouched.* `git -C ~/dev/agentnative-site status -s docs/plans/2026-04-24-001*`
  still shows the file as untracked (we did not accidentally stage it).
- *Edge case: dotfiles other dirty files untouched.* `git -C ~/dotfiles status -s` still shows the user's pre-existing
  dirty paths in `.claude/` etc. — only the tmuxinator change should be committed.
- *Error path: pre-push hook in spec repo.* If U1's commit triggers pre-push CI mirror failure, fix root cause and
  re-stage; do not `--no-verify`.
- *Integration: gstack readiness for Phase 2.* After U2, `~/.gstack/projects/brettdavies-agentnative-cli/` does not yet
  exist (gets created on next gstack run from the renamed dir); `~/.gstack/projects/brettdavies-agentnative/` is
  unchanged and now unambiguously spec-attribution.

**Verification:**

- All checks above pass.
- A short summary report of commits landed, slugs derived, and any deferred items is produced for the user.

**No commit:** verification only.

## System-Wide Impact

- **Interaction graph:** the rename touches the gstack slug-cache (path-keyed) which in turn affects which
  `~/.gstack/projects/<slug>/` workspace receives content from each working tree. Side effect: the historical
  `brettdavies-agentnative/` workspace becomes unambiguously spec-attribution.
- **Error propagation:** the redirect trick fails closed in the pathological case (e.g., GitHub API hiccup between T1
  and T2). If T2 fails, the canonical name is temporarily `agentnative-spec`, and we manually re-run T2 from inside the
  same dir. Worst case: brief external visibility of `agentnative-spec` as canonical until we recover.
- **State lifecycle risks:** the manufactured redirect persists only as long as the `brettdavies/agentnative` repo is
  not renamed or deleted. Future maintenance of the spec repo must treat the `agentnative-spec` slot as a protected
  redirect — never claim it via a new repo, never let the redirect lapse by renaming `agentnative`. This is documented
  in U7's memory codification.
- **API surface parity:** local convention now matches across the three repos (CLI/site match GitHub directly; spec has
  documented `-spec` local suffix). Future agents reading either the canonical decision record or memory get the same
  story.
- **Integration coverage:** there is no CI/build that this refactor would silently break — the spec repo's pre-push hook
  only validates content, not paths, and the CLI repo's planned `vendor-spec.sh` isn't yet implemented (it's the topic
  of the in-flight plan we're fixing the URLs in).
- **Unchanged invariants:** the spec repo's GitHub canonical name. The local spec dir name. All downstream-pinning
  contracts (badge URLs, cross-repo `SPEC_ROOT` defaults set to `~/dev/agentnative-spec/`).

## Risks & Dependencies

| Risk                                                                                                    | Mitigation                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pre-push hook on spec repo blocks U1                                                                    | Fix root cause; do not bypass with `--no-verify`. Hook runs validation, not transformations, so failures will be informative.                                                                           |
| `gh repo rename` syntax mismatch with installed gh version                                              | First T1 call doubles as a syntax test. If it fails, adjust flags before continuing. The `gh` operation is reversible.                                                                                  |
| Rename window leaves canonical name as `agentnative-spec` (T1 → T2 gap)                                 | Run T1 and T2 back-to-back; ~seconds of exposure. No concurrent fetches in this session. Acceptable.                                                                                                    |
| Bare `agentnative-spec` references in docs (without `brettdavies/` prefix) get false-positive rewritten | Per-occurrence sanity check during U3, U4, U5. Most bare refs are local-dir-shaped and stay; GitHub-shorthand refs (`agentnative-spec:CONTRIBUTING.md`) get rewritten to `brettdavies/agentnative:...`. |
| Dotfiles uncommitted user changes get accidentally committed in U6                                      | Surgical `git add stow/tmuxinator/...` only. Verify `git status` after staging; abort and reset if anything else got staged.                                                                            |
| Future maintainer renames or deletes `brettdavies/agentnative`, killing the redirect                    | Codified in spec memory `ecosystem_layout.md` (U7) as a permanent constraint. The decision record `naming-rationale.md` (U1) also documents the convention.                                             |

## Documentation / Operational Notes

- After this plan ships, the gstack cross-repo audit (paused at end of Phase 1) resumes against three cleanly-attributed
  slugs: `brettdavies-agentnative` (historical / spec-only), `brettdavies-agentnative-cli` (fresh, CLI-only), and
  `brettdavies-agentnative-site` (unchanged, site-only).
- The forensic deployment-issues doc retains its incident-time recipe verbatim with a single inline annotation pointing
  at this plan.

## Sources & References

- Audit handoff (precedent for cross-repo cleanup methodology):
  `/home/brett/dev/agentnative-site/.context/handoffs/2026-04-25-gstack-cross-repo-audit.md`
- Canonical naming decision (the doc this plan corrects most directly): `docs/decisions/naming-rationale.md`
- SoT contract (background on three-repo family):
  `docs/solutions/best-practices/sot-contract-for-spec-repos-with-downstream-consumers-2026-04-22.md`
- Prior repo-rename postmortem (informs U8 expectations):
  `docs/solutions/best-practices/github-repo-rename-release-pipeline-resilience-2026-04-20.md`
- Spec pre-push pipeline (informs U1 timing):
  `docs/solutions/best-practices/prose-spec-repo-pre-push-pipeline-20260422.md`
