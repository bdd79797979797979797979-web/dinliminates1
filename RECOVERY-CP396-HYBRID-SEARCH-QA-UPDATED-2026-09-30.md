# Recovery Checkpoint — CP396 — Hybrid Search QA Updated — 2026-09-30

After CP395, the actual restaurant provider/classification tests reached hybrid search.
- Static QA, route adapters, classification smoke, and dedupe all passed.
- Hybrid smoke stopped on one stale assertion expecting the old Google text query literal.
- Updated hybrid smoke to assert the new shared-taxonomy termVariant query.
- No production code changed for this checkpoint.

Next:
- Re-run the complete restaurant search/browser certification.
- Fix only genuine behavior mismatches after QA contracts are current.
