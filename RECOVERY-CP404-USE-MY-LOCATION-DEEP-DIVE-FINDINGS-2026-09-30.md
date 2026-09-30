# Recovery Checkpoint — CP404 — Use My Location Deep Dive Findings — 2026-09-30

Parent checkpoint: CP403

Audit findings:
1. Geolocation acquisition:
   - Uses browser navigator.geolocation.
   - Initial request: enableHighAccuracy=false, timeout=6000ms, maximumAge=60000ms.
   - On timeout/unavailable condition, retries once with enableHighAccuracy=true, timeout=10000ms, maximumAge=30000ms.
   - Permission denied exits cleanly with an address fallback message.
2. Reverse geocoding:
   - Successful coordinates are reverse-geocoded through /api/restaurant-search?mode=reverse.
   - Reverse failure is intentionally non-blocking: the raw coordinates are still accepted as the location and restaurant search proceeds.
   - Current reverse fetch has no explicit browser-side timeout/AbortController.
3. State/persistence:
   - setLocation stores coordinates, label, and locationSource='device', then save().
   - load() restores S.location and S.locationSource from localStorage.
   - Consequently, a previously saved device location can be presented as "Using your location" after reopening the app even though it may be stale.
4. Concurrency:
   - useLocation() has no in-flight request sequence/lock and the locate button is not disabled while acquiring location.
   - Multiple taps can start multiple geolocation operations; older callbacks could theoretically overwrite newer results.
5. Freshness:
   - maximumAge allows cached device coordinates for up to 60 seconds on the first request.
   - A successful cached/low-accuracy result does not trigger a later high-accuracy refresh, so "Use My Location" can return a recently cached location rather than the freshest available position.
6. Restaurant refresh:
   - After successful coordinate acquisition, searchRestaurants() runs automatically using the selected radius and current restaurant query/filter state.
   - searchRestaurants() itself has a bounded 14.5s client deadline and sequence protection.
7. UI/state messaging:
   - locationSource labels clearly distinguish device/address/typed/none.
   - Find becomes Refresh after any location is stored.
   - There is no specific "location acquisition busy" state on the Use My Location button today.
8. Existing QA coverage:
   - Browser certification uses mocked geolocation coordinates.
   - It verifies device-source selection, correct coordinates, reverse-geocode failure fallback, and subsequent restaurant search behavior.
   - It does not currently certify double-tap race handling, persisted-device-location freshness, or a hung reverse-geocode request.

Recommended next implementation:
- Add a dedicated location request sequence/AbortController guard and disable/busy-state the Locate button while active.
- Add a bounded reverse-geocode timeout; fall back to raw coordinates on timeout.
- Treat restored device coordinates as "last used location" rather than a freshly confirmed live location until Use My Location is pressed again.
- Prefer a two-stage location policy: use a recent cached fix for fast UI response, then request a fresh/high-accuracy fix when available and update the search only if the fresh coordinates materially differ.
- Add dedicated QA for all of the above before calling Use My Location launch-ready.
