# Recovery Checkpoint — CP398 — Search Taxonomy Collision Fix Certified in Code — 2026-09-30

Implemented after CP397:
- Shared alias map now preserves first/high-priority ownership for overlapping aliases.
- "pizzeria" now resolves to Pizza.
- API result fastFood is normalized from shared classifier tags after provider merging.
- API fastFoodCount is based on the same shared classification.
- Regression coverage added for the pizzeria collision and Thirsty Goat provider contradiction.

Pending:
- Full CI validation of CP398.
- Final release/cache checkpoint after validation.
