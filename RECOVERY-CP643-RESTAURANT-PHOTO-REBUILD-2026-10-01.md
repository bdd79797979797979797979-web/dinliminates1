# Recovery Checkpoint — CP643 — Restaurant Photo Rebuild — 2026-10-01

Parent recovery baseline: CP591 commit `c4f6b89c4bd9c160b8760b7d214e5f59f86986cc`

Protected branches:
- `cp643-pre-photo-rebuild-main-backup` — prior main state before this rebuild
- `cp643-cp591-recovery` — exact CP591 recovery point
- `cp643-restaurant-photo-rebuild` — isolated working branch for this rebuild

## Restaurant photo source contract

1. Restaurant's own website/gallery, verified to match the exact restaurant/location.
2. Exact-location public restaurant page, verified to match the exact restaurant/location.
3. Exact OSM POI image already attached to the matching OSM restaurant record.
4. No photo. The app uses the neutral restaurant fallback artwork and does not manufacture a food, cuisine, chain, stock, logo, or placeholder photo.

Google Places photo APIs and Google API credentials are not used by the restaurant-photo resolver.

## CP643 implementation

- `api/restaurant-photo.js` now has a dedicated official-site first pass and only accepts venue/exterior evidence after exact restaurant/address verification.
- Public-page discovery remains credential-free and uses Bing only to find pages; the selected image must still come from a verified exact-location public restaurant page.
- Exact OSM POI images are accepted only when the frontend identifies the row as an OpenStreetMap record and supplies its image directly.
- `api/restaurants.js` no longer fabricates chain/cuisine/generic restaurant photos.
- `app.js` passes the known official chain website when the OSM row lacks an official website and passes an exact OSM image for the final permitted tier.
- Restaurant photo function max duration is 30 seconds to allow exact-page verification without restoring loose fallback behavior.
- Release metadata/cache identities are marked Build 643 / CP643.

## Automated verification

CP643 isolated photo QA passed:
- Syntax checks for `api/restaurant-photo.js`, `api/restaurants.js`, `app.js`, and photo smoke test.
- 8 restaurant-photo smoke cases passed.
- Verified official-location discovery.
- Verified venue-image scoring and menu-image rejection signal.
- Verified no generic photo metadata is generated.
- Verified exact OSM POI photo tier.
- Verified the resolver has no Google API credential requirement.

Deployment status:
- This checkpoint has not been promoted to production.
- No preview URL is recorded here until a deployed build is READY and runtime-verified.


## Final hosted verification

- Netlify preview: https://deploy-preview-117--dinliminate112.netlify.app
- Netlify deployment for commit `efd290d55c21b64d231ff7f8858b0586831c1964`: READY.
- Live HTTP certification: PASS.
- Hosted home: HTTP 200 and expected Dinner Decisions / restaurant entry points present.
- Hosted release metadata: Build 643 / CP643.
- Restaurant health: HTTP 200, max radius 100 miles.
- Exact Wendy's Clarksville venue test: photo returned HTTP 200 from `official-venue-page`.
- Exact venue test response size: 6,249 bytes.
- Unknown restaurant test: HTTP 404; no generic photo returned.
- Netlify preview SSO requirement was disabled for non-production/deploy-preview access; production access was not changed.
- Vercel remains un-deployed for CP643 because the account is currently rate-limited for 24 hours.


## CP644 follow-up — photo gate correction (2026-10-01)
- Parent: e05f76f845a70c0cdcf77b0f68a7752bd5b5f962
- Commit: e05f76f845a70c0cdcf77b0f68a7752bd5b5f962
- Cause found: the image gate in `api/restaurant-photo.js` was rejecting legitimate restaurant-page hero/venue images because it required venue words to appear in the image tag's nearby HTML and rejected ordinary pages containing multiple food/menu references.
- Fix: verified exact-location pages may accept page-level `og:image` / JSON-LD images after the page itself passes exact restaurant/location verification; raw image candidates now require venue evidence with a proportional food-signal check.
- No Google photo API added. Generic restaurant/cuisine fallbacks remain disabled.
- CP643 Restaurant Photo QA run 19 passed on this commit.
- CP643 Live Netlify HTTP Certification run 5 passed on this commit; Wendy's exact Clarksville venue still returns an official-venue-page image.
- This checkpoint supersedes the earlier photo-gate behavior while retaining the CP591-based rebuild and protected recovery branches.


## CP645 — exact venue discovery hardening (2026-10-01)
- Commits: `0e7c902e4a04b4fa5f57b41dc5db279f0011692a` then syntax correction `b6868ad8267733c0cff43da8285b8c942f2ee0bf`.
- The client already had a per-row photo cache and in-flight request de-duplication in `app.js`; no duplicate cache layer was added.
- The API still returns verified image bytes (not JSON), so no client-side `res.json()` contract was introduced.
- Added structured-data venue verification for Schema.org Restaurant/FoodEstablishment/LocalBusiness records, matching restaurant name plus exact address evidence.
- Re-added an official-host-specific Bing search query so JavaScript-heavy restaurant sites can expose exact location pages even when raw homepage links omit them.
- The generic/random Picsum fallback and AllOrigins proxy were not added.
- Commit `b6868ad...` passes direct JS syntax compilation and CP643 Restaurant Photo QA run 23 passed.
- CP643 Live Netlify HTTP Certification run 9 failed only because the existing Netlify preview had not advanced to the new commit; it did not certify the new code.
- Vercel created a READY deployment for the pre-syntax-fix commit `0e7c902...`; that URL is not being presented as the certified build.
