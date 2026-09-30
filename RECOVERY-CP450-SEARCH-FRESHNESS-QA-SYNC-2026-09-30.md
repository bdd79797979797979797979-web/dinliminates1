# Recovery Checkpoint CP450 — Search Freshness + QA Synchronization
Date: 2026-09-30

Starting point:
- CP449 / Build 154: `cp449-compact-radius-search-row-2026-09-30`
- Recovery branch: `recovery-cp449-before-restaurant-deep-hardening-2026-09-30`

Completed:
- Added a persisted `restaurantSearchKey` containing location/radius/query context.
- Previous restaurant rows are now reused only when the new search has the same normalized query and same location; changing the query starts from the new provider result set.
- Kept same-query radius expansion behavior so a wider radius can reuse previously discovered local venues.
- Updated Build 155 / CP450 release metadata.
- Updated Restaurant QA contracts from API r19 to the actual API r20.
- Updated QA cache/build expectations from CP448 to the current CP449/CP450 line.

Verification:
- Source contracts were re-read after edits.
- The search code now explicitly gates previous-row reuse on the stored query-aware search key.
- No unrelated browser-smoke assertion remains.

Recovery:
- Return to `recovery-cp449-before-restaurant-deep-hardening-2026-09-30` to discard CP450.
