# Recovery Checkpoint — CP418 — Restaurant Photo Architecture Wired — 2026-09-30

Parent: CP411

Completed:
- Added secure on-demand Google restaurant photo endpoint at api/restaurant-photo.js.
- Added Google photos to Places field masks and retained only cache-safe Google Place IDs in restaurant search rows.
- Added unified server-side restaurantPhotoMeta resolver with provider, known-entity, cuisine-fallback, Google, and generic fallback tiers.
- Added photoSource, photoIsGeneric, photoConfidence, and photoFallback metadata.
- Added client-side Google photo hydration for the visible Tinder card, next card, and Restaurant Details hero.
- Added subtle author-attribution overlay support for Google photos.
- Removed the old split Chipotle/Ruby Tuesday/Thirsty Goat browser fallback logic in favor of resolver-provided photoFallback.
- Added next-card fallback metadata support.
- No Google photo resource names are returned in the restaurant search cache payload.

Remaining before final photo checkpoint:
- Add/finish automated photo QA contracts and browser certification cases.
- Verify syntax and deployment status.