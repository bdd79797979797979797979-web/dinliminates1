

## CP454 — Nearby same-name dedupe correction
Starting point: CP453 / Build 158.
Recovery before CP454: `recovery-cp453-before-nearby-duplicate-fix-2026-09-30`

Change:
- Same-name restaurants with different normalized addresses are no longer merged merely because they are physically close.
- The API and browser-side restaurant dedupe policies now agree on this behavior.
- Added a regression covering two nearby Subway locations at distinct addresses.
- Build 159 / CP454.
