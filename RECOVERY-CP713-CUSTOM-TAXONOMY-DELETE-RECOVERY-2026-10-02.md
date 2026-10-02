# Recovery Checkpoint CP713 — Custom Taxonomy, Meal Delete & Reset/Restore
Date: 2026-10-02

## Branch
- `cp713-custom-taxonomy-delete-recovery`
- Starting point: CP712 final functional checkpoint `062406928f44b45be5c567ebf8399f3b04492697`

## Scope completed
1. Reusable Custom Cuisine / Quick Cut creation inside Add/Edit Meal.
   - `＋ Custom` tile remains available after each new category is created.
   - Each custom category has an inline rename field, device photo upload, and X delete control.
   - Custom categories are reusable across meals.
   - Renaming migrates existing meal assignments and the active Quick Cut toggle.
   - Deleting removes the category from meals and its stored device photo.
2. Custom Quick Cut photos persist through IndexedDB using `quickcut:<id>` keys and appear immediately after upload.
3. Every active meal in Manage Meals now has Hide, Edit, and Delete.
4. Deleted meals use a recoverable local state.
   - Built-ins are tombstoned without altering the source catalog.
   - Custom meals are archived with their data for recovery.
   - Manage Meals includes a Deleted Meals recovery section.
5. Settings now exposes one user-facing Reset & Restore action.
   - Restore Defaults: restores original built-in meals and clears built-in edits/deletions while preserving Custom Meals, Custom Quick Cuts, History, and notes.
   - Full Reset: clears local app data, Custom Meals, Custom Quick Cuts, history, notes, saved state, and device-stored meal/Quick Cut photos.
   - These remain two internal operations under one cleaner Settings entry.
6. CP712 photo-editor repair.
   - Existing device-uploaded meal photos are preserved when editing without a replacement.
   - New uploaded photos display immediately instead of falling back until reload.
   - The editor no longer places base64 image data into the Photo URL text field.
7. Release/cache metadata bumped to build 713 / CP713.
8. Focused QA script added at `qa/cp713-custom-taxonomy-delete-recovery.cjs`.

## Verification completed
- `app.js` parses successfully with the JavaScript parser.
- Built-in catalog contains exactly 116 meal records with 116 unique IDs.
- Built-in override merge behavior tested: an edited built-in remains one meal with its original ID; custom-only meals remain appended; deleted IDs are excluded from active meals.
- Custom Quick Cut creation, rename, photo storage, delete, persistence, and assignment migration source contracts verified.
- Universal meal Delete and Deleted Meals recovery source contracts verified.
- Reset & Restore single Settings entry and its two actions verified.
- Round reset verified not to clear the permanent deleted-meal set.
- Uploaded-photo immediate rendering and hydrated-photo preservation verified at source level.
- The focused QA script is committed for repeatable repository-side checks.

## Deployment
No new CP713 Vercel preview is recorded in this checkpoint. The recent project history has encountered Vercel build-rate limiting, so this checkpoint does not claim a deployed preview that has not been independently verified.

## Recovery
Continue from this branch and checkpoint commit if disconnected:
`cp713-custom-taxonomy-delete-recovery`
