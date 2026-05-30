#!/usr/bin/env node
// SPDX-License-Identifier: MIT OR Apache-2.0
//
// Validates principles/p<n>-*.md frontmatter and prose.
//
// Checks:
//   1. Each file has frontmatter with the required keys:
//      id, title, last-revised, status, requirements[]
//   2. requirements[] entries have id (unique across all files),
//      level (must|should|may), applicability (one of: string "universal",
//      {if: "<reason>"} for prose-only conditionals, or
//      {kind: "conditional", antecedent: {audit_id: "<kebab>"}} for
//      machine-auditable conditionals), summary (non-empty string).
//   3. id matches the filename prefix (p<n>).
//   4. The number of MUST/SHOULD/MAY bullets in prose equals the number of
//      requirements[] entries with that level.
//
// Exits 0 on success, 1 on any validation failure. Errors list every issue
// found — the script does not short-circuit on the first problem.

import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import yaml from "js-yaml";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PRINCIPLES_DIR = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(REPO_ROOT, "principles");
const REQUIRED_KEYS = ["id", "title", "last-revised", "status", "requirements"];
const VALID_LEVELS = new Set(["must", "should", "may"]);
const VALID_STATUSES = new Set(["draft", "under-review", "active", "locked"]);
const FILENAME_RE = /^(p[1-9][0-9]*)-.*\.md$/;

function splitFrontmatter(content, file) {
  if (!content.startsWith("---\n")) {
    throw new Error(`${file}: missing frontmatter opening fence`);
  }
  const end = content.indexOf("\n---\n", 4);
  if (end === -1) {
    throw new Error(`${file}: missing frontmatter closing fence`);
  }
  return {
    frontmatter: content.slice(4, end),
    body: content.slice(end + 5),
  };
}

function countBulletsPerLevel(body) {
  // Walk the "## Requirements" section. Count "- " bullets under each of
  // "**MUST:**", "**SHOULD:**", "**MAY:**" sub-headers. A bullet is a line
  // starting with "- " at column 0 (continuation lines are indented).
  const counts = { must: 0, should: 0, may: 0 };
  const lines = body.split("\n");
  let inReqs = false;
  let currentLevel = null;
  for (const line of lines) {
    if (line.startsWith("## ")) {
      inReqs = line === "## Requirements";
      currentLevel = null;
      continue;
    }
    if (!inReqs) continue;
    if (line === "**MUST:**") { currentLevel = "must"; continue; }
    if (line === "**SHOULD:**") { currentLevel = "should"; continue; }
    if (line === "**MAY:**") { currentLevel = "may"; continue; }
    if (currentLevel && line.startsWith("- ")) {
      counts[currentLevel] += 1;
    }
  }
  return counts;
}

const AUDIT_ID_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

function validateApplicabilityObject(app, id, file, errors) {
  const keys = Object.keys(app);
  if (keys.includes("kind")) {
    if (app.kind !== "conditional") {
      errors.push(`${file}: requirement '${id ?? "?"}' has unknown applicability kind '${app.kind}' (only "conditional" is currently supported)`);
      return;
    }
    const extras = keys.filter((k) => k !== "kind" && k !== "antecedent");
    if (extras.length > 0) {
      errors.push(`${file}: requirement '${id ?? "?"}' has unexpected applicability keys: ${extras.join(", ")}`);
    }
    if (!("antecedent" in app)) {
      errors.push(`${file}: requirement '${id ?? "?"}' is {kind: "conditional"} but missing 'antecedent' (expected {antecedent: {audit_id: "<kebab>"}})`);
      return;
    }
    const ant = app.antecedent;
    if (typeof ant !== "object" || ant === null || Array.isArray(ant)) {
      errors.push(`${file}: requirement '${id ?? "?"}' antecedent must be an object {audit_id: "<kebab>"}`);
      return;
    }
    const antKeys = Object.keys(ant);
    const antExtras = antKeys.filter((k) => k !== "audit_id");
    if (antExtras.length > 0) {
      errors.push(`${file}: requirement '${id ?? "?"}' antecedent has unexpected keys: ${antExtras.join(", ")} (v1 supports only 'audit_id'; compound antecedents deferred to v2)`);
    }
    if (typeof ant.audit_id !== "string" || !ant.audit_id.trim()) {
      errors.push(`${file}: requirement '${id ?? "?"}' antecedent.audit_id must be a non-empty string`);
      return;
    }
    if (!AUDIT_ID_RE.test(ant.audit_id)) {
      errors.push(`${file}: requirement '${id ?? "?"}' antecedent.audit_id '${ant.audit_id}' is not lowercase kebab-case`);
    }
    return;
  }
  if (keys.length !== 1 || keys[0] !== "if" || typeof app.if !== "string" || !app.if.trim()) {
    errors.push(`${file}: requirement '${id ?? "?"}' has malformed applicability object (expected {if: "<reason>"} or {kind: "conditional", antecedent: {audit_id: "<kebab>"}})`);
  }
}

function validateRequirement(entry, file, seenIds, errors) {
  if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
    errors.push(`${file}: requirements[] entry is not an object`);
    return;
  }
  const { id, level, applicability, summary } = entry;
  if (typeof id !== "string" || !id.trim()) {
    errors.push(`${file}: requirement is missing a string 'id'`);
  } else {
    if (seenIds.has(id)) {
      errors.push(`${file}: duplicate requirement id '${id}' (first seen in ${seenIds.get(id)})`);
    } else {
      seenIds.set(id, file);
    }
    if (!id.startsWith(`${entry.__expectedPrefix}-`)) {
      errors.push(`${file}: requirement id '${id}' does not match principle prefix '${entry.__expectedPrefix}'`);
    }
  }
  if (typeof level !== "string" || !VALID_LEVELS.has(level)) {
    errors.push(`${file}: requirement '${id ?? "?"}' has invalid level '${level}' (must be must|should|may)`);
  }
  if (typeof applicability === "string") {
    if (applicability !== "universal") {
      errors.push(`${file}: requirement '${id ?? "?"}' has unknown applicability string '${applicability}' (expected "universal", {if: "<reason>"}, or {kind: "conditional", antecedent: {audit_id: "<kebab>"}})`);
    }
  } else if (typeof applicability === "object" && applicability !== null && !Array.isArray(applicability)) {
    validateApplicabilityObject(applicability, id, file, errors);
  } else {
    errors.push(`${file}: requirement '${id ?? "?"}' has missing or invalid applicability`);
  }
  if (typeof summary !== "string" || !summary.trim()) {
    errors.push(`${file}: requirement '${id ?? "?"}' has missing or empty summary`);
  }
}

function validateFile(file, content, seenIds, errors) {
  const base = path.basename(file);
  const match = FILENAME_RE.exec(base);
  if (!match) {
    errors.push(`${base}: filename does not match 'p<n>-*.md'`);
    return;
  }
  const expectedId = match[1];

  let fm, body;
  try {
    const parts = splitFrontmatter(content, base);
    fm = yaml.load(parts.frontmatter);
    body = parts.body;
  } catch (err) {
    errors.push(`${base}: ${err.message}`);
    return;
  }

  if (typeof fm !== "object" || fm === null || Array.isArray(fm)) {
    errors.push(`${base}: frontmatter is not a mapping`);
    return;
  }

  for (const key of REQUIRED_KEYS) {
    if (!(key in fm)) {
      errors.push(`${base}: frontmatter missing required key '${key}'`);
    }
  }
  if (fm.id !== expectedId) {
    errors.push(`${base}: frontmatter id '${fm.id}' does not match filename prefix '${expectedId}'`);
  }
  if (fm.status && !VALID_STATUSES.has(fm.status)) {
    errors.push(`${base}: invalid status '${fm.status}' (must be draft|under-review|active|locked)`);
  }
  if (!Array.isArray(fm.requirements)) {
    errors.push(`${base}: 'requirements' must be an array`);
    return;
  }

  const fmCounts = { must: 0, should: 0, may: 0 };
  for (const entry of fm.requirements) {
    if (entry && typeof entry === "object") entry.__expectedPrefix = expectedId;
    validateRequirement(entry, base, seenIds, errors);
    if (entry && VALID_LEVELS.has(entry.level)) fmCounts[entry.level] += 1;
  }

  const proseCounts = countBulletsPerLevel(body);
  for (const lvl of VALID_LEVELS) {
    if (fmCounts[lvl] !== proseCounts[lvl]) {
      errors.push(
        `${base}: ${lvl.toUpperCase()} count mismatch — frontmatter has ${fmCounts[lvl]}, prose has ${proseCounts[lvl]}`
      );
    }
  }
}

async function main() {
  const entries = await readdir(PRINCIPLES_DIR);
  const files = entries.filter((e) => FILENAME_RE.test(e)).sort();
  if (files.length === 0) {
    console.error(`No principle files matched in ${PRINCIPLES_DIR}`);
    process.exit(1);
  }

  const errors = [];
  const seenIds = new Map();
  for (const file of files) {
    const full = path.join(PRINCIPLES_DIR, file);
    const content = await readFile(full, "utf8");
    validateFile(full, content, seenIds, errors);
  }

  if (errors.length > 0) {
    console.error(`validate-principles: ${errors.length} issue(s)\n`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`validate-principles: OK (${files.length} files, ${seenIds.size} requirement IDs)`);
}

main().catch((err) => {
  console.error(`validate-principles: ${err.stack ?? err.message ?? err}`);
  process.exit(1);
});
