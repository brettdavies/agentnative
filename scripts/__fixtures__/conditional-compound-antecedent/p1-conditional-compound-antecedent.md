---
id: p1
title: Fixture — compound antecedent shape rejected in v1
last-revised: 2026-05-21
status: draft
requirements:
  - id: p1-must-compound-antecedent
    level: must
    applicability:
      kind: conditional
      antecedent:
        check_id: p1-feature-a
        op: all_of
        checks:
          - check_id: p1-feature-b
    summary: 'v2 compound-antecedent sketch is rejected by the v1 validator (extra keys on antecedent).'
---

# Fixture P1 (conditional-compound-antecedent)

## Requirements

**MUST:**

- The only MUST bullet. The frontmatter entry shapes its antecedent like Decision 2b's v2 sketch (`op`, `checks`); the
  v1 validator must reject the extra keys.
