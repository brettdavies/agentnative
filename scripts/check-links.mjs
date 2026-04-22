#!/usr/bin/env node
// SPDX-License-Identifier: MIT OR Apache-2.0
//
// Relative-link target check for committed markdown.
//
// Walks every `*.md` under the repo (excluding node_modules and .git),
// extracts every `[text](target)` link outside fenced and inline code,
// skips absolute URLs / mailto / pure anchors, and confirms the
// remaining relative target resolves on disk. Prints every broken link
// with source file and line number. Exit 1 if any are broken.
//
// Anchor portions after `#` are stripped — this checks that the file
// exists, not that the anchor does.

import { readFile, readdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IGNORE_DIRS = new Set(["node_modules", ".git", "target", "vendor"]);
const LINK_RE = /\[[^\]]*\]\(([^)]+)\)/g;
const URL_LIKE = /^(https?:|mailto:|ftp:|data:|#)/i;
const FENCE_RE = /^(```|~~~)/;

async function walkMd(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walkMd(full)));
    else if (entry.isFile() && entry.name.endsWith(".md")) out.push(full);
  }
  return out;
}

async function checkFile(file, errors) {
  const src = await readFile(file, "utf8");
  const lines = src.split("\n");
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (FENCE_RE.test(line)) { inFence = !inFence; continue; }
    if (inFence) continue;
    const scrubbed = line.replace(/`[^`]*`/g, "");
    for (const m of scrubbed.matchAll(LINK_RE)) {
      const rawTarget = m[1].trim().split(/\s+/)[0];
      if (!rawTarget) continue;
      if (URL_LIKE.test(rawTarget)) continue;
      const target = decodeURI(rawTarget.split("#")[0]);
      if (!target) continue;
      const resolved = path.resolve(path.dirname(file), target);
      try {
        await stat(resolved);
      } catch {
        errors.push(`${path.relative(REPO_ROOT, file)}:${i + 1} → ${rawTarget}`);
      }
    }
  }
}

async function main() {
  const files = await walkMd(REPO_ROOT);
  const errors = [];
  for (const f of files) await checkFile(f, errors);
  if (errors.length > 0) {
    console.error(`check-links: ${errors.length} broken link(s)\n`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`check-links: OK (${files.length} files scanned)`);
}

main().catch((err) => {
  console.error(`check-links: ${err.stack ?? err.message ?? err}`);
  process.exit(1);
});
