#!/usr/bin/env node
// SPDX-License-Identifier: MIT OR Apache-2.0
//
// Regression tests for check-last-revised.mjs. Each case builds a throwaway
// git repo under a tmp dir, seeds a base commit on `base`, mutates the file
// on `head`, then runs the checker with BASE_REF=base and asserts the
// expected pass/fail outcome.
//
// Fails loudly if any case unexpectedly passes or fails — that means the
// checker stopped enforcing what it used to enforce.

import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CHECKER = path.join(HERE, "check-last-revised.mjs");
const REPO_ROOT = path.resolve(HERE, "..");

const BASE_FM = `---
id: p1
title: Test Principle
last-revised: 2026-04-22
status: active
requirements:
  - id: p1-must-foo
    level: must
    applicability: universal
    summary: Original summary.
---

# P1: Test

## Requirements

**MUST:**

- A MUST bullet.
`;

const TODAY = "2026-05-27";

const CASES = [
  {
    name: "no-change",
    headContent: BASE_FM,
    expectPass: true,
  },
  {
    name: "fm-changed-date-is-today",
    headContent: BASE_FM
      .replace("Original summary.", "Rewritten summary.")
      .replace("last-revised: 2026-04-22", `last-revised: ${TODAY}`),
    expectPass: true,
  },
  {
    name: "fm-changed-date-stale-vs-base",
    headContent: BASE_FM.replace("Original summary.", "Rewritten summary."),
    expectPass: false,
    expectMatch: /not today/,
  },
  {
    name: "fm-changed-date-bumped-but-not-today",
    headContent: BASE_FM
      .replace("Original summary.", "Rewritten summary.")
      .replace("last-revised: 2026-04-22", "last-revised: 2026-05-21"),
    expectPass: false,
    expectMatch: /not today/,
  },
  {
    name: "body-only-edit",
    headContent: BASE_FM.replace("# P1: Test\n", "# P1: Test\n\nAdded body prose.\n"),
    expectPass: true,
  },
  {
    name: "tier-change-date-stale",
    headContent: BASE_FM.replace("level: must", "level: should"),
    expectPass: false,
    expectMatch: /not today/,
  },
  {
    name: "applicability-shape-change-date-stale",
    headContent: BASE_FM.replace(
      "applicability: universal",
      "applicability:\n      kind: conditional\n      antecedent:\n        audit_id: p1-some-check",
    ),
    expectPass: false,
    expectMatch: /not today/,
  },
  {
    name: "fix-rewrites-date-on-violation",
    headContent: BASE_FM.replace("Original summary.", "Rewritten summary."),
    args: ["--fix", "base"],
    expectPass: true,
    expectFileMatch: new RegExp(`^last-revised: ${TODAY}$`, "m"),
    expectFileNotMatch: /^last-revised: 2026-04-22$/m,
  },
  {
    name: "fix-no-op-when-clean",
    headContent: BASE_FM,
    args: ["--fix", "base"],
    expectPass: true,
    expectFileMatch: /^last-revised: 2026-04-22$/m,
  },
];

function git(cwd, ...args) {
  execFileSync("git", args, { cwd, stdio: "pipe" });
}

function runCase(c) {
  const dir = mkdtempSync(path.join(tmpdir(), "check-lr-"));
  try {
    git(dir, "init", "-q", "-b", "base");
    git(dir, "config", "user.email", "test@example.com");
    git(dir, "config", "user.name", "Test");
    mkdirSync(path.join(dir, "principles"));
    const principlePath = "principles/p1-test.md";
    writeFileSync(path.join(dir, principlePath), BASE_FM);
    git(dir, "add", "-A");
    git(dir, "commit", "-q", "-m", "base");

    git(dir, "checkout", "-q", "-b", "head");
    writeFileSync(path.join(dir, principlePath), c.headContent);
    git(dir, "add", "-A");
    git(dir, "commit", "--allow-empty", "-q", "-m", "head");

    const cliArgs = c.args ?? ["base"];
    const res = spawnSync(process.execPath, [CHECKER, ...cliArgs], {
      cwd: dir,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_PATH: path.join(REPO_ROOT, "node_modules"),
        CHECK_LR_TODAY: TODAY,
      },
    });
    const passed = res.status === 0;
    if (passed !== c.expectPass) {
      const wanted = c.expectPass ? "pass" : "fail";
      const got = passed ? "pass" : "fail";
      console.error(`FAIL ${c.name}: expected ${wanted}, got ${got}`);
      console.error(`  stdout: ${res.stdout}`);
      console.error(`  stderr: ${res.stderr}`);
      return false;
    }
    if (!c.expectPass && c.expectMatch && !c.expectMatch.test(res.stderr)) {
      console.error(`FAIL ${c.name}: expected stderr to match ${c.expectMatch}, got:`);
      console.error(`  ${res.stderr}`);
      return false;
    }
    if (c.expectFileMatch || c.expectFileNotMatch) {
      const onDisk = readFileSync(path.join(dir, principlePath), "utf8");
      if (c.expectFileMatch && !c.expectFileMatch.test(onDisk)) {
        console.error(`FAIL ${c.name}: file content does not match ${c.expectFileMatch}`);
        console.error(`  on-disk:\n${onDisk}`);
        return false;
      }
      if (c.expectFileNotMatch && c.expectFileNotMatch.test(onDisk)) {
        console.error(`FAIL ${c.name}: file content unexpectedly still matches ${c.expectFileNotMatch}`);
        console.error(`  on-disk:\n${onDisk}`);
        return false;
      }
    }
    console.log(`ok ${c.name}`);
    return true;
  } finally {
    execFileSync("rm", ["-rf", dir]);
  }
}

let failed = 0;
for (const c of CASES) {
  if (!runCase(c)) failed += 1;
}
if (failed > 0) {
  console.error(`\ntest-check-last-revised: ${failed}/${CASES.length} case(s) failed`);
  process.exit(1);
}
console.log(`\ntest-check-last-revised: OK (${CASES.length} cases)`);
