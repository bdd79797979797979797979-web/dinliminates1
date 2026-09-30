# Recovery Checkpoint — CP374 — Hours Data Model Deep Dive — 2026-09-30

Created before the Open/Unknown vs All hours repair.

Baseline:
- Branch: cp348-search-six-point-certification-2026-09-30
- Baseline commit: 865cff62336b2df6fe1e86880af66dbba53ffe63
- Restaurant hours UI toggle exists and changes S.hoursMode.
- Main weakness identified: real provider rows often have missing hours, so All and Open/Unknown can legitimately produce identical pools.
- Secondary defect: openRestaurant() resets hoursMode to Open/Unknown whenever the Restaurant screen opens.
- QA currently verifies the filter using an overly clean synthetic fixture and does not sufficiently test mixed provider hours data.

Planned repair:
1. Make normalized hoursState a first-class restaurant result field.
2. Preserve the strongest current-hours evidence during provider dedupe.
3. Use normalized hoursState consistently in the client filter and status counts.
4. Stop forcibly resetting the selected hours mode when reopening Restaurant.
5. Expand QA with explicit open, closed, unknown, static-hours, provider-mismatch, and missing-hours cases.
6. Update release identity after the repair and preserve this checkpoint for rollback.
