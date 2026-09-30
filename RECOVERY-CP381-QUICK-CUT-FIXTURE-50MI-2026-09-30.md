# Recovery Checkpoint — CP381 — Quick Cut Fixture Within 50-Mile Radius — 2026-09-30

Baseline:
- Production Fast Food Quick Cut is independently tagged (CP380).
- Hours model smoke is green.
- Browser certification reached Quick Cuts.
- Failure was QA-only: BBQ fixture was 75 miles away and Seafood fixture 99 miles away.
- The current certified maximum radius is 50 miles, so those fixture rows are excluded before Quick Cuts are tested.

Correction:
- Move BBQ and Seafood fixture distances inside the 50-mile test radius.
- Preserve all other fixture identities and hours behavior.
