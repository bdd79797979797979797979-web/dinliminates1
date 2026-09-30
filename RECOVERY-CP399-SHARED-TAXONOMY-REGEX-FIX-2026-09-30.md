# Recovery Checkpoint — CP399 — Shared Taxonomy Regex Fix — 2026-09-30

Actual behavior defect found during CP398 validation:
- Shared data/restaurant-taxonomy.js regexes contained double-escaped word/whitespace boundaries.
- Result: provider category/cuisine/name regex matching could fail, including cuisine='burger' not producing Burgers.
- Fixed the shared taxonomy regex escaping.
- No weakening of the behavioral test.

Expected:
- American Grill with cuisine=burger -> American + Burgers.
- Pizzeria alias -> Pizza.
- Thirsty Goat identity exclusion -> Pizza and not Fast Food.
