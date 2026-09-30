# Recovery Checkpoint — CP428 — Restaurant Overall Fixes Baseline — 2026-09-30

Parent: CP427

Implementation pass:
- Carry Google Place IDs through Google Text Search / restaurant-search paths.
- Persist Google restaurant-photo identity into History and rehydrate the venue photo when History is opened.
- Simplify the restaurant Tinder card while keeping compact on-card Phone, Website, and Details affordances.
- Bring Restaurant Winner to the same celebration behavior as Food and preserve its photo fallback/hydration.
- Add small-screen card QA contracts for 320px, 375px, and 390px.
- Resolve the radius contract in favor of the previously requested 100-mile tier, using the existing multi-center provider discovery model and explicit coverage/degraded messaging.

No production changes in this baseline checkpoint.