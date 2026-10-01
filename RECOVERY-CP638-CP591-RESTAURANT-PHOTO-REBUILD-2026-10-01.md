# RECOVERY-CP638-CP591-RESTAURANT-PHOTO-REBUILD-2026-10-01

Base: CP591 (a8bd9299dfea19ee997d8866fcc0b58dd2b7b3e7)
Branch: cp638-cp591-photo-rebuild

Goal:
Return the restaurant photo system to the cleaner CP591 baseline, then make only the necessary restaurant-photo fixes.

Current changes:
- Removed generic chain/cuisine stock-photo fallbacks from api/restaurants.js.
- Restaurant cards/details/history now use a neutral placeholder until the verified photo endpoint succeeds.
- Fixed the browser handoff to use the API image URL directly instead of converting the response into a blob URL.
- Exact OpenStreetMap POI image tags may be passed to the verifier.
- Tightened photo scoring so surrounding page text does not count as image evidence.
- No Google API credentials are used.
- No restaurant-specific hardcoded photo registry is present.

Next verification:
- Live resolver smoke test for Clarksville fixtures.
- Confirm actual image/jpeg responses.
- Confirm no generic Unsplash fallback.
- Confirm browser card uses direct endpoint URL.
