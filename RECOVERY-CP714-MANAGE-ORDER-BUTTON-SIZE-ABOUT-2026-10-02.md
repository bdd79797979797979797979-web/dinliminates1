# Recovery Checkpoint CP714 — Manage Meals Order, Decision Button Size & About Cleanup
Date: 2026-10-02

## Branch
- `cp714-manage-order-button-size-about-cleanup`
- Based on CP713 final checkpoint

## Changes
- Manage Meals action order is now **Edit → Hide/Restore → Delete** for active or hidden meals.
- Deleted meals show **Restore** in the recovery section.
- Enlarged **only Cut and Maybe**:
  - 68px on wider screens
  - 64px on narrow screens
- Back and auxiliary decision controls were not enlarged.
- Removed the white **Dinliminate** heading from the Settings > About section; the existing About copy/meta/credit remain.
- Build/cache metadata bumped to **714 / CP714**.

## Verification
- app.js JavaScript parse: PASS
- Manage Meals order contract: PASS
- Deleted-row Restore behavior: PASS
- About heading removal: PASS
- Cut/Maybe selective sizing: PASS
- Back unchanged: PASS
- Release metadata: PASS
- App asset cache-bust: PASS
- Service worker cache: PASS
- CP714 QA script syntax: PASS

## Deployment
No live CP714 preview is recorded. Vercel deployment listing returned no new deployment, so this checkpoint does not claim a live preview.

## Recovery
Continue from:
`cp714-manage-order-button-size-about-cleanup`
