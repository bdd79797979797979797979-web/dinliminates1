# Recovery Checkpoint CP447 — Remove Restaurant Hours Control — 2026-09-30

Parent: CP446 / Build 151
Recovery before this change: recovery-cp445-before-hide-hours-control-2026-09-30
Working branch: cp447-final-remove-hours-control-2026-09-30

The Restaurant Open/Unknown-All control has been removed completely from the UI. The Restaurant screen continues to use the default Open/Unknown presentation, excluding explicitly closed venues. Persisted state is normalized to Open/Unknown so an older saved All mode cannot silently re-enable closed venues.

The 50-mile maximum from CP445 remains unchanged.
Quick Cut image stability from CP445 remains unchanged.

Release:
- Build 152
- Checkpoint CP447

Do not return to CP442, CP443, CP444, or the closed PR #73 as the current app line.
