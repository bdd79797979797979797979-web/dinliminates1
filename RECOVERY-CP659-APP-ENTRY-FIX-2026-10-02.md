# Recovery Checkpoint — CP659 — App Entry Fix — 2026-10-02

Parent: CP658 Jina website fetch fallback (`b08795c8220d5bee66d1ecc99854acd358327ebb`)

## Root cause found

The Restaurant website cache loader was executed before `normKey` was initialized. The loader calls `restaurantWebsiteRowKey()`, which reads the `const normKey` binding. This raises a temporal-dead-zone `ReferenceError` during app startup and stops `app.js` from finishing initialization. That prevents the Home screen buttons and app controls from being wired.

A second defect in the same CP658 website hydration function left the async resolver result unapplied and referenced undefined `cache/request/blob/headers` variables.

## CP659 fixes

1. Move `loadRestaurantWebsiteStore()` until after `normKey` is initialized.
2. Repair website hydration so the resolver result is actually applied to the visible card/details website link.
3. Remove the stray undefined-variable website-cache statement.
4. Bump frontend asset query markers from 658 to 659.
5. Bump the service-worker shell cache to `dinliminate-shell-v659`.
6. Synchronize release metadata to CP659.

## Expected result

The app should initialize normally from the Home screen, and restaurant Website buttons should update from the resolver result instead of remaining on the fallback search URL.

## Deployment

Source branch: `cp659-app-entry-fix`
