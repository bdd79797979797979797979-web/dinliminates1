# CP651 — Restaurant Photo Cache + Food-Related Fallbacks
Date: 2026-10-01
Branch: cp651-restaurant-photo-cache-fallback
Base: CP650

## What changed
- Kept the working exact-venue restaurant photo resolver unchanged.
- Added a persistent browser Cache Storage layer for verified restaurant photos.
- The cache survives page reloads/browser sessions where Cache Storage is available.
- Cached verified photos are reused before a new `/api/restaurant-photo` request.
- Cache entries expire after 30 days and are removed when stale.
- The existing in-memory cache remains for fastest same-session reuse.
- The current and next restaurant cards continue to pre-hydrate photos, so swiping forward can use the cached image.
- Replaced the generic storefront illustration as the normal restaurant no-photo fallback with food-related imagery based on restaurant category:
  - Pizza → pizza
  - Burgers/Fast Food/American → burger
  - Mexican → tacos/Mexican food
  - Asian → fried rice/Asian food
  - Italian → pizza/Italian food
  - BBQ/Southern → Southern food
  - Seafood → seafood
  - Breakfast → breakfast
  - Healthy → salad/healthy food
- The same category fallback now carries through Restaurant cards, winner view, restaurant details, and History.
- The generic restaurant illustration remains only as a final last-resort image fallback.
- Bumped `styles.css` and `app.js` cache markers to 651 to ensure clients load the new code.

## Safety
- No Google Places photo API or Google API credentials added.
- No generic random-photo service added.
- Exact venue photos remain preferred over any fallback.
- Fallback images are presentation-only; the restaurant photo resolver still returns no fabricated venue photo metadata.

## Testing completed
- Source checks confirmed persistent Cache Storage functions are present and checked before network fetch.
- Source checks confirmed same-session memory caching remains in place.
- Source checks confirmed cache expiry is enforced at 30 days.
- Source checks confirmed category fallback mapping is wired for Restaurant card, next card, winner, restaurant details, and History.
- Source checks confirmed the client asset version markers are 651.
- Netlify deploy preview 123 reached READY on the CP651 commit and deployed the restaurant-photo, restaurant-search, image, and release functions without deploy errors.
- Netlify secret validation reported no secret-scan matches.
- Hosted visual/browser automation is not available in this environment, so no claim is made that the live preview was manually clicked through.
