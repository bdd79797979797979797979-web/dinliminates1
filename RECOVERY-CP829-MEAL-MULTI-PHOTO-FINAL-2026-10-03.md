# CP829 — Meal Multi-Photo Final Recovery
Date: 2026-10-03

Baseline
- CP823: Meal Decisions Simplified rename.
- CP822: Home background cleanup with the ornate door as the only full-page Home image.

Feature
- Each meal supports up to 5 photos.
- One ordered Cover photo.
- User can add multiple images, set Cover, reorder, adjust framing, and remove photos.
- Built-in meals retain their curated original image as a recoverable curated photo.
- Existing single-photo and legacy IDB references remain backward-compatible.
- Uploaded photos use the existing IndexedDB photo store.
- Duplicate uploads are rejected.
- Uploaded photos are compressed through the existing image pipeline.
- Photo framing stores lightweight crop metadata (horizontal, vertical, zoom).

Swipe cards
- Normal card swipe remains Cut / Maybe.
- Tapping a multi-photo meal image enters photo-browse mode.
- Horizontal swipes inside the image move between meal photos.
- Decision swipe is disabled while browsing.
- Dots, photo count, and Done control appear only during photo browsing.
- Displayed photo remains fixed during the active card session.
- Repeated encounters can use controlled alternate-photo rotation.
- Current meal photo selection persists through app refresh.

Details / Winner / History
- Meal Details supports horizontal photo gallery browsing.
- The exact displayed photo is captured when a meal is chosen.
- Winner uses the captured photo and framing.
- History stores personal snapshots in IndexedDB rather than localStorage.
- History hydrates stored personal snapshots.
- Removing History entries or clearing History deletes their stored snapshot.
- Winner serialization omits the entire photo collection to keep localStorage compact.

Family Mode
- Family snapshot sends shareable HTTPS cover images.
- Device-local uploaded photos are not sent as raw data to the Family backend.
- Built-in meals with a private custom Cover fall back to their curated image for Family.
- Family winner History saving is async and protected against duplicate concurrent saves.

Recovery / Reset
- Full Reset clears the photo IndexedDB store.
- Restore Defaults removes built-in meal photo overrides.
- Removed custom meal photos remain recoverable with the meal until deleted/reset.

Release
- Build/checkpoint: CP829.
- Frontend cache version: v829.
- Correct Vercel target: dinliminates1.
- Production remains unverified until the correct project deployment is confirmed.

Focused final audit
- 33/33 source checks passed.
- app.js syntax passed.
