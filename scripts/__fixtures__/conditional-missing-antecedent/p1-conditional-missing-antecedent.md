---
id: p1
title: Fixture — conditional applicability missing antecedent
last-revised: 2026-05-21
status: draft
requirements:
  - id: p1-must-missing-antecedent
    level: must
    applicability:
      kind: conditional
    summary: '{kind: conditional} without an antecedent field is malformed.'
---

# Fixture P1 (conditional-missing-antecedent)

## Requirements

**MUST:**

- The only MUST bullet. The frontmatter entry declares `kind: conditional` but omits the required `antecedent` object.
