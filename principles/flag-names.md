---
title: "Flag names: how requirement text applies to a tool's help"
last-revised: 2026-11-03
---

# Flag names: how requirement text applies to a tool's help

This document defines how a flag name in requirement text maps onto the flags a tool's `--help` declares. It applies to
every principle file, and the [`anc`](https://github.com/brettdavies/agentnative-cli) CLI reads a help by the same rule.

## Double-dash names

Requirement text names a flag by its double-dash spelling (`--force`, `--quiet`, `--output`). A tool whose help declares
no double-dash name follows the Go `flag` convention, where one dash and two name the same flag, and meets the
requirement with the single-dash spelling: `-force` on `terraform force-unlock` satisfies a requirement that names
`--force`. In a help that declares any double-dash name, a single-dash word is a name of its own and does not stand in
for the double-dash spelling.

## Single letters

A single letter meets a requirement when its help definition states that requirement's meaning, through a long name the
requirement accepts on the same line or a description that names the meaning. A letter's definition is the help line
whose leading names declare it: the flag names the line starts with, before any description. A letter printed after
another flag's description, as unzip prints `-q` beside `-n`, has no definition.

The same test applies to a letter the requirement names, because one letter can carry two meanings: the spec names `-v`
for both verbose (`p7-should-verbose`) and version (`p3-should-version-short`), and only its definition tells them
apart. It is also the test `p5-must-force-yes` applies to a flag under another name, which the command's `--help`
documents as the flag that confirms the operation without a prompt.

| Help line                                                                     | Requirement               | Verdict | Why                                                            |
| ----------------------------------------------------------------------------- | ------------------------- | ------- | -------------------------------------------------------------- |
| `-q  Quiet mode.`                                                             | `p7-must-quiet`           | meets   | The description names the meaning.                             |
| `-y  Skip confirmation prompts.`                                              | `p5-must-force-yes`       | meets   | The description names the meaning.                             |
| `-v  Increase verbosity`                                                      | `p7-should-verbose`       | meets   | The description names the meaning.                             |
| `-v  Increase verbosity`                                                      | `p3-should-version-short` | not met | The definition means something else.                           |
| `-v, --version  Print version`                                                | `p3-should-version-short` | meets   | An accepted long name sits on the same line.                   |
| `-v, --version  Print version`                                                | `p7-should-verbose`       | not met | The definition means something else.                           |
| `--version (-V)  Print the version`                                           | `p3-should-version-short` | meets   | `-V` is among the leading names, beside an accepted long name. |
| `-v` with no description                                                      | `p7-should-verbose`       | not met | The line states no meaning.                                    |
| `-f, --format <F>  Output format.`                                            | `p5-must-force-yes`       | not met | The definition means something else.                           |
| `-n  never overwrite existing files         -q  quiet mode` (unzip, for `-q`) | `p7-must-quiet`           | not met | `-q` follows `-n`'s description, so it has no definition.      |
