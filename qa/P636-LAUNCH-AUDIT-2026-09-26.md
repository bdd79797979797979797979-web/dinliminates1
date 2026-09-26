# Dinliminate P636 — Launch Audit

## Current candidate
P636 launch candidate, based on the uploaded P636 source.

## Automated/static gates completed
- `index.html` is the complete uploaded application entry (~588 KB), not a partial rewrite.
- No duplicate HTML IDs in the raw source.
- Restaurant search radius UI includes 100 miles.
- Restaurant API is capped at 100 miles.
- Exact-address resolution uses ArcGIS and U.S. Census fallback paths, with Photon/Nominatim fallback.
- Address autocomplete has an address-specific ArcGIS candidate path when the input looks like a street address.
- Restaurants and fast food remain one combined search pool.
- Stable OSM identifiers are generated from OSM type/id with deterministic fallbacks.
- Obsolete “/ Order” labels are removed from the shipped entry.
- Open-now filter control is not present in the raw shipped DOM; the hardening layer also removes legacy open-now chips.
- Apple touch icon points to PNG and the manifest contains 180px and 512px PNG icons.
- Service-worker cache key is bumped to the P636 launch cache.
- P633/P634 saved-round states remain readable by the launch hardening layer.
- `api/restaurant-search.js` passes Node syntax validation.
- `launch-hardening.js` passes Node syntax validation.
- `dinliminate.webmanifest` passes JSON validation.

## Interactive behavior already verified in the live Floot preview before the final local hardening pass
- Full P636 interface rendered rather than a small 520px app box.
- Home screen rendered correctly.
- Food Cut decremented the deck and Back restored it.
- Food Maybe decremented the active deck.
- Add Food modal opened.
- Settings opened and System Restore control was present.
- History opened with the calendar UI.
- Restaurant search endpoint returned real restaurant data and fast-food data.
- Typed/location restaurant search controller successfully loaded a restaurant deck.

## Important final deployment gate
The remaining production-domain checks must be run after the launch candidate is deployed from the actual production URL, because the current environment does not allow another Floot build action today. Those checks are the real network/provider path, physical iPhone geolocation permission, Safari Add to Home Screen, and a fresh-install/service-worker reset.
