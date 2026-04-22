#!/usr/bin/env node
// SPDX-License-Identifier: MIT OR Apache-2.0
//
// Regression tests for validate-principles.mjs.
//
// Runs the validator against each fixture directory under
// scripts/__fixtures__/ and asserts:
//   1. exit code is 1 (validation failed as expected)
//   2. stderr contains a known substring identifying the specific failure
//
// Fails loudly if any fixture unexpectedly passes — that means the
// validator stopped catching a regression it used to catch.

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const VALIDATOR = path.join(HERE, "validate-principles.mjs");

const CASES = [
  {
    name: "duplicate-id",
    dir: path.join(HERE, "__fixtures__/duplicate-id"),
    expect: /duplicate requirement id 'p1-must-shared'/,
  },
  {
    name: "level-mismatch",
    dir: path.join(HERE, "__fixtures__/level-mismatch"),
    expect: /MUST count mismatch — frontmatter has 1, prose has 2/,
  },
  {
    name: "bad-applicability",
    dir: path.join(HERE, "__fixtures__/bad-applicability"),
    expect: /unknown applicability string 'conditional'/,
  },
];

let failed = 0;
for (const c of CASES) {
  const res = spawnSync("node", [VALIDATOR, c.dir], { encoding: "utf8" });
  const stderr = res.stderr ?? "";
  const stdout = res.stdout ?? "";
  const combined = stderr + stdout;
  const ok = res.status === 1 && c.expect.test(combined);
  if (ok) {
    console.log(`  pass  ${c.name}`);
  } else {
    failed += 1;
    console.error(`  FAIL  ${c.name}`);
    console.error(`        exit=${res.status}, expected substring ${c.expect}`);
    console.error(`        output:\n${combined.split("\n").map((l) => `          ${l}`).join("\n")}`);
  }
}

if (failed > 0) {
  console.error(`\ntest-validate-principles: ${failed}/${CASES.length} case(s) failed`);
  process.exit(1);
}
console.log(`\ntest-validate-principles: ${CASES.length}/${CASES.length} OK`);
