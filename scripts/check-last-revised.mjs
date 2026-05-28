#!/usr/bin/env node
// SPDX-License-Identifier: MIT OR Apache-2.0
//
// Enforces the `last-revised` discipline declared in `principles/AGENTS.md`:
// any change to a principle file's frontmatter (other than `last-revised`
// itself) must leave `last-revised` set to today's date.
//
// Detection uses a base git ref (default `origin/dev`, overridable via
// `BASE_REF` env or first positional CLI arg). For each
// `principles/p<n>-*.md` file that exists in both refs:
//
//   1. Loads frontmatter on both sides.
//   2. Strips the `last-revised` key from both.
//   3. If the remaining frontmatter differs, asserts that `last-revised`
//      equals today's local date.
//
// New files (added in HEAD) and deletions are skipped — the discipline
// applies only to in-place edits.
//
// Flags:
//   --fix    Rewrite `last-revised` to today's local date on every
//            violating file in the working tree, then exit 0. Without
//            --fix, the script is read-only and exits 1 on any violation.
//
// Env overrides:
//   CHECK_LR_TODAY=YYYY-MM-DD  Override "today" (deterministic tests).
//
// Exits 0 on pass (or after a successful --fix), 1 on any unfixed
// violation. Errors list every file with a problem — the script does
// not short-circuit.

import { execFileSync, spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";

const REPO_ROOT = process.cwd();
const PRINCIPLE_RE = /^principles\/p[1-9][0-9]*-.*\.md$/;

const args = process.argv.slice(2);
const FIX = args.includes("--fix");
const positional = args.filter((a) => !a.startsWith("--"));
const BASE_REF = positional[0] ?? process.env.BASE_REF ?? "origin/dev";

function splitFrontmatter(content) {
  if (!content.startsWith("---\n")) return null;
  const end = content.indexOf("\n---\n", 4);
  if (end === -1) return null;
  return content.slice(4, end);
}

function loadFrontmatter(content) {
  const raw = splitFrontmatter(content);
  if (raw === null) return null;
  return yaml.load(raw);
}

function frontmatterSansDate(fm) {
  if (fm === null || typeof fm !== "object") return fm;
  const { "last-revised": _omit, ...rest } = fm;
  return rest;
}

function canonical(obj) {
  return yaml.dump(obj, { sortKeys: true, lineWidth: -1, noRefs: true });
}

function stringifyDate(value) {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

function todayLocal() {
  if (process.env.CHECK_LR_TODAY) return process.env.CHECK_LR_TODAY;
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function rewriteLastRevised(content, newDate) {
  const lines = content.split("\n");
  let inFm = false;
  let replaced = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === "---") {
      if (!inFm) { inFm = true; continue; }
      break;
    }
    if (inFm && /^last-revised:\s*/.test(lines[i])) {
      lines[i] = `last-revised: ${newDate}`;
      replaced = true;
      break;
    }
  }
  return replaced ? lines.join("\n") : null;
}

function gitShow(ref, file) {
  const res = spawnSync("git", ["show", `${ref}:${file}`], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  if (res.status !== 0) return null;
  return res.stdout;
}

function changedPrincipleFiles(baseRef) {
  const res = execFileSync(
    "git",
    ["diff", "--name-status", `${baseRef}...HEAD`, "--", "principles/"],
    { cwd: REPO_ROOT, encoding: "utf8" },
  );
  const out = [];
  for (const line of res.split("\n")) {
    if (!line.trim()) continue;
    const [statusRaw, ...pathParts] = line.split("\t");
    const status = statusRaw[0];
    const filePath = pathParts.at(-1);
    if (!PRINCIPLE_RE.test(filePath)) continue;
    out.push({ status, path: filePath });
  }
  return out;
}

async function main() {
  let baseExists = true;
  try {
    execFileSync("git", ["rev-parse", "--verify", BASE_REF], {
      cwd: REPO_ROOT,
      stdio: "pipe",
    });
  } catch {
    baseExists = false;
  }
  if (!baseExists) {
    console.error(`check-last-revised: base ref '${BASE_REF}' not found locally.`);
    console.error(`  Fetch it first: git fetch origin ${BASE_REF.replace(/^origin\//, "")}`);
    process.exit(1);
  }

  const changed = changedPrincipleFiles(BASE_REF);
  if (changed.length === 0) {
    console.log(`check-last-revised: OK (no principle files changed vs ${BASE_REF})`);
    return;
  }

  const errors = [];
  const fixes = [];
  let inPlace = 0;
  const today = todayLocal();

  for (const { status, path: filePath } of changed) {
    if (status === "A" || status === "D") continue;
    inPlace += 1;

    const baseContent = gitShow(BASE_REF, filePath);
    if (baseContent === null) {
      errors.push(`${filePath}: could not read base content from ${BASE_REF}`);
      continue;
    }
    const headContent = await readFile(path.join(REPO_ROOT, filePath), "utf8");

    const baseFm = loadFrontmatter(baseContent);
    const headFm = loadFrontmatter(headContent);
    if (baseFm === null || headFm === null) {
      errors.push(`${filePath}: missing or malformed frontmatter`);
      continue;
    }

    const baseSans = canonical(frontmatterSansDate(baseFm));
    const headSans = canonical(frontmatterSansDate(headFm));
    const headDate = stringifyDate(headFm["last-revised"]);

    if (baseSans !== headSans && headDate !== today) {
      if (FIX) {
        const rewritten = rewriteLastRevised(headContent, today);
        if (rewritten === null) {
          errors.push(`${filePath}: --fix could not locate 'last-revised:' line to rewrite`);
          continue;
        }
        await writeFile(path.join(REPO_ROOT, filePath), rewritten, "utf8");
        fixes.push(`${filePath}: ${headDate ?? "MISSING"} -> ${today}`);
      } else {
        errors.push(
          `${filePath}: frontmatter changed (other than 'last-revised') but 'last-revised' is ` +
            `${headDate ?? "MISSING"}, not today (${today}). Per principles/AGENTS.md, any frontmatter ` +
            `mutation must stamp 'last-revised' to today's date. Re-run with --fix to set it automatically.`,
        );
      }
    }
  }

  if (errors.length > 0) {
    console.error(`check-last-revised: ${errors.length} issue(s)\n`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  if (fixes.length > 0) {
    console.log(`check-last-revised: rewrote ${fixes.length} file(s) to ${today}`);
    for (const f of fixes) console.log(`  - ${f}`);
    return;
  }
  console.log(
    `check-last-revised: OK (${inPlace} in-place principle edit(s) checked vs ${BASE_REF})`,
  );
}

main().catch((err) => {
  console.error(`check-last-revised: ${err.stack ?? err.message ?? err}`);
  process.exit(1);
});
