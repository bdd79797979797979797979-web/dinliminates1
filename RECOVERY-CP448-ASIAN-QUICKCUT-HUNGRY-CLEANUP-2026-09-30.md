# Recovery Checkpoint CP448 — Asian Quick Cut + Hungry Cleanup
Date: 2026-09-30

## Starting recovery point
- CP447 branch: `cp447-final-remove-hours-control-2026-09-30`
- Recovery branch: `recovery-cp447-before-asian-hungry-fix-2026-09-30`

## Changes in CP448
1. Replaced the Restaurant Asian Quick Cut image source with the verified Pexels Asian fried-rice photo (photo 32845321) so the Asian Quick Cut has a concrete photo source.
2. Hungry state no longer presents the Winner Details action.
3. Added a defensive guard so `detailsSheet()` ignores Hungry items even if called programmatically.
4. Updated the app cache-busting query to `app.js?v=448`.
5. Bumped release metadata to Build 153 / CP448.
6. Updated static/browser QA contracts to expect the Hungry Details action to be hidden and the current build metadata.

## Verification performed
- `app.js` parses successfully with the JavaScript parser.
- `qa/clean-static-qa.js` parses successfully.
- Confirmed current HTML has no Restaurant `hoursToggle`.
- Confirmed current app includes the Asian Pexels photo source.
- Confirmed current app hides the Winner Details action during Hungry.
- Confirmed current app blocks Hungry in `detailsSheet()`.
- Updated browser smoke expectations so it no longer opens Hungry Details.

## Deployment
A new PR will be opened from this branch so Netlify generates a new Deploy Preview URL.
