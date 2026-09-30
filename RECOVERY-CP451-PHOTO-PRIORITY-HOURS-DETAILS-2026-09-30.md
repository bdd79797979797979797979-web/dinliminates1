# Recovery Checkpoint CP451 — Restaurant Photo Priority + Hours Details
Date: 2026-09-30

Starting point:
- CP450 / Build 155: `cp450-search-freshness-qa-sync-2026-09-30`
- Recovery branch: `recovery-cp450-before-photo-hours-2026-09-30`

Completed:
1. Restaurant photo selection now gives a verified Google Place photo priority when a Google Place ID exists.
2. A provider-supplied photo is retained as the fallback if Google photo hydration fails.
3. Restaurant Details now displays normalized current hours state: Open now / Closed now / Hours unknown.
4. When provider hours text exists, Details retains the schedule in a dedicated Hours section.
5. Updated release metadata to Build 156 / CP451 and QA coverage.

Verification:
- Re-read edited source after modification.
- Confirmed Google photo selection occurs before provider-photo fallback.
- Confirmed normalized hours state and schedule are emitted by Restaurant Details.

Recovery:
- Return to `recovery-cp450-before-photo-hours-2026-09-30` to discard CP451.
