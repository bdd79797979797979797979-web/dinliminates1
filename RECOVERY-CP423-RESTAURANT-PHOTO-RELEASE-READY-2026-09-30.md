# Recovery Checkpoint — CP423 — Restaurant Photo Release Ready — 2026-09-30

Parent: CP422

Restaurant photo work complete:
- Secure on-demand Google Places photo endpoint created at api/restaurant-photo.js.
- Google photo resource names are requested on demand and are not persisted in search-cache rows.
- Google Place IDs are carried through provider dedupe so venue photos remain available after OSM/Photon/Google merging.
- Unified server-side restaurantPhotoMeta resolver selects provider venue photo first, then Google venue photo, then known-entity/cuisine fallback, then generic fallback.
- Photo provenance metadata is returned: photoSource, photoIsGeneric, photoConfidence, photoFallback.
- Tinder restaurant card, next-card, and Restaurant Details hero can hydrate Google venue photos without exposing the Places API key.
- Required Google photo author attributions are rendered as subtle premium overlays.
- Added photo resolver, attribution, and Google-photo browser certification coverage.
- Configured Vercel runtime for api/restaurant-photo.js.

Release wiring pending:
- Bump stylesheet query string because CP417 added photo attribution CSS.
- Bump service worker cache after the final CSS/app release.
- Update release.json/release-manifest.json build/checkpoint metadata.