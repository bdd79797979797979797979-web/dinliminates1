# Recovery Checkpoint — CP429 — Restaurant Photo & History Continuity — 2026-09-30

Parent: CP428

Completed:
- Google Text Search rows now carry googlePlaceId.
- Restaurant Winner uses photoFallback when the live Google venue photo is still loading.
- Restaurant Winner hydrates Google venue photos on the winner screen.
- Restaurant Winner now uses the same celebration/fireworks treatment as Food.
- History now stores restaurant photo metadata, Google Place ID, phone, hours state, cuisine, menu items, coordinates, and distance.
- History calendar/list can rehydrate Google venue photos on demand.
- History-backed Restaurant Details now retain enough metadata for the premium Details sheet.

Next stage:
- Simplify the restaurant Tinder card while retaining compact Phone, Website, and Details controls.
- Add small-iPhone visual/overflow QA.

Known follow-up:
- History fallback styling should distinguish food vs restaurant final placeholders.