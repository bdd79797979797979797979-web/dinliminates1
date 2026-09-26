# Dinliminate P636 — Full Launch Audit
Date: September 26, 2026
Build baseline: `p636-clean-final`
Latest audit commit: `b00b2b6e0126b6fd69a71d1f5ebac4288580ccb1`

## Overall launch status

The P636 application is structurally coherent and the main food/restaurant decision flows are implemented. The latest production deployment is READY, the root app responds with HTTP 200, and Vercel's runtime-error scan for the checked period reports no runtime errors.

The remaining launch gates are environment-dependent rather than missing core application features: non-authenticated production API verification, a real iPhone/Safari install and GPS test, fresh service-worker install/update testing, and owner-side image-rights verification.

## Fixes made during this audit

1. Fixed the Winner-screen Details action. The winner buttons use `data-winner-details`; the previous listener looked for a nonexistent `winnerDetailsBtn` ID. Details is now bound directly to the rendered winner action.
2. Fixed Restaurant Pass Around pool construction so it includes the complete current restaurant decision pool, including restaurants previously moved to Maybe/holding, instead of silently excluding held choices.
3. Removed a duplicate Southern Vegetable Beef Soup photo-map key.
4. Corrected the duplicated punctuation in the visible photo-credit copy.
5. Updated the legacy QA API test to expect the current `restaurant-v636-final` API version.

## Functional audit

### Home
- Dinliminate branding and dinner-decision purpose are present.
- Food and Restaurant modes are separate.
- Home copy uses “What sounds good tonight?”
- iPhone help is available.
- Home menu opens from the top control.

### Food mode
- Food deck is present with the requested curated items.
- Cut, Maybe, Hide, Back, Random Cut One, Add Food, and Pass Around are wired.
- Quick Cuts are photo-based and reversible.
- Hidden choices persist until changed in Settings.
- Custom foods support photo, category/tags, notes, optional recipe, edit, and permanent delete.
- Winner includes Details/Save/Share behavior.
- Hungry/no-choice state exists.
- System Restore restores original built-in food data and clears app state.

### Restaurant mode
- Address / city / ZIP input with autocomplete infrastructure.
- Locate and Find controls.
- 1–100 mile radius UI.
- Restaurants and fast food are one combined search pool.
- Restaurant Quick Cuts include Fast Food, American, Potato, Pasta, Healthy, Soup / Stew, and other cuisines/categories.
- Quick Cuts are reversible.
- Search is inline on the restaurant page.
- Restaurant card has photo/fallback, cuisine/category, address, hours state, distance, Details, and Website/Search.
- Cut, Maybe, Hide, Back, and Pass Around are wired.
- No visible Open-Now filter, rating UI, price UI, or Order wording.
- Restaurant winner includes Directions, Website/Search, Save, Details, and Share.

### History / Saved / Settings
- History calendar renderer includes month navigation, Today, photo events, Details, and per-entry X removal.
- Saved and History are separate.
- Clear actions require confirmation.
- Settings is scrollable on small screens.
- System Restore is explicit and destructive.
- Export/import controls exist.

## Technical audit

### JavaScript / DOM
- No duplicate literal HTML IDs.
- All six inline script blocks parse successfully under the existing audit method.
- launch-hardening.js and api/restaurant-search.js pass JavaScript syntax validation.
- The app intentionally retains compatibility wrappers and historical CSS layers to preserve the uploaded P636 behavior. Refactors #6, #45, #46, #48, #49 remain deferred.

### Restaurant API
- Production cap: 100 miles.
- Google path is bounded to the provider's 50 km nearby-search limit.
- OSM Postpass is the primary non-Google source.
- Large-radius OSM searches fan out across a 3×3 grid.
- One Overpass fallback is retained.
- Result rows are deduplicated and distance-filtered.
- Fast-food detection includes explicit fast-food OSM amenity data plus brand matching.
- Search, resolve, suggest, and reverse endpoints have rate limits.
- API responses use bounded public caching.
- Google restaurant photos are proxied through the same-origin API when a Google Places photo name is available.
- Coordinates are validated before restaurant search.

### PWA / iPhone
- Viewport metadata uses device width.
- Safe-area handling is present.
- Manifest uses standalone display and PNG icons.
- Service worker uses a P636-specific cache key and network-first navigation.
- The current root deployment responds with HTTP 200.
- Vercel production deployment is READY.

## Findings that remain before an honest launch certification

### P0 — Verify the production API is public to an unauthenticated user
The connected Vercel fetcher can retrieve the production root page, but direct calls to the protected deployment's API path returned a Vercel SSO redirect through the connector. Your own recent browser testing successfully loaded restaurant results, so the feature is working in your current session, but this tool path cannot certify how a fresh iPhone user without Vercel authentication will reach the API.
Recommended test: open the friendly production URL in a private/incognito browser or a device that is not signed into Vercel, then use address search and Locate.

### P0 — Real iPhone/Safari gate
Still requires an actual iPhone:
- open production site in Safari
- grant/deny location and retry
- verify address autocomplete
- verify swipe left/right
- verify Cut/Maybe/Back
- verify Quick Cut hide/show
- verify Settings and History scroll
- verify Add to Home Screen
- reopen from the Home Screen and confirm the app shell updates

### P1 — Photo rights / reliability
The food photo library still contains multiple third-party/hotlinked URLs. Broken-image placeholders exist, but individual commercial-use rights and long-term hotlink reliability are not certified by application code. Before a public commercial launch, keep a source/rights record or migrate the final food assets to controlled first-party storage.

### P1 — Fresh-install service-worker test
The service worker is versioned and the old-cache cleanup exists, but fresh install/update behavior should be confirmed on a real device after a deployment.

### P2 — Performance debt
The uploaded P636 structure remains a roughly 595 KB single HTML file with substantial historical CSS and compatibility layers. It works, but it is not the preferred long-term architecture. This is deliberately deferred under #45/#46/#48/#49 to avoid destabilizing the known-good build.

### P2 — Compact utility hit targets
The restaurant utility controls and some secondary controls are intentionally smaller than a full 44 px touch target to preserve the compact iPhone layout. This matches the current design goal but should be checked on the smallest target handset for accidental taps.

### P2 — Address suggestion optimization
Some provider suggestion records do not contain coordinates and therefore require a resolve request after selection. The fast path avoids the extra resolve when coordinates are already present. This is functionally acceptable but can add latency for some suggestion rows.

## Release recommendation

Do not perform a broad rewrite before launch. The core app is in a stable state, and the recent fixes were targeted. The remaining work should be treated as certification and asset-governance work, not another rebuild.
