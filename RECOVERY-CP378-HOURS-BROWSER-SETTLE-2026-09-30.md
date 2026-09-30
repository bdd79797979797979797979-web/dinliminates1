# Recovery Checkpoint — CP378 — Hours Browser Certification Timing — 2026-09-30

Current state:
- Production hours model repair is implemented.
- Server hours-model smoke is green (10/10 cases).
- Latest browser certification reached the hours section.
- Failure was that the closed fixture was not yet restored after clearing the restaurant-query filter when the All toggle was clicked.
- Cause is asynchronous blank-query refresh settling in the test harness, not the production hours filter.

Planned QA correction:
- Explicitly wait for the restaurant search to finish after clearing the query before testing All/Open-Unknown.
- Do not modify the production hours behavior for this test timing issue.
