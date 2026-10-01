# Recovery Checkpoint — CP635 — Restaurant Photo Architecture Plan — 2026-10-01

Status:
- Audit only. No restaurant-photo implementation changes made in CP635.
- CP634 remains the latest diagnostic checkpoint.

Deep-dive diagnosis:
1. Current restaurant search is assembled from OpenStreetMap/Overpass, Photon, ArcGIS, and optionally Google Places.
2. Those providers often identify the venue with provider-specific IDs, but the current photo resolver receives only name/address/website and then performs web/image search.
3. Current api/restaurant-photo.js uses Bing web search and Bing image search, then parses arbitrary page images. This creates an identity gap: a page can belong to the correct restaurant while an individual image on the page is unrelated.
4. The code also has a second failure mode: when verification is too strict, the card intentionally falls back to fallback-restaurant.svg. This changed the visible behavior from unrelated photos to no photos.
5. The current renderer no longer trusts row.photo, which is correct for avoiding unrelated provider imagery, but it means a reliable verified source is now mandatory for a real photo.
6. Production deployment is separate from source correctness and has repeatedly lagged behind main. Production must be treated as a separate release gate.

Recommended architecture:
A. Canonical venue identity first:
   - Build one internal venueKey from normalized name + exact street number/address + latitude/longitude.
   - Preserve provider IDs when present: googlePlaceId, fsq_place_id, OSM id.
   - Merge duplicate provider rows before photo lookup.
B. Primary photo source: a place database/API, not search scraping.
   - Google Places API (New) when a Google Places key is provisioned: resolve the exact place ID, request photos, and obtain the photo through Place Photos.
   - Foursquare Places as the independent photo fallback: resolve fsq_place_id, then request photos with classifications that prioritize outdoor/exterior/storefront/grounds.
C. Secondary trusted source:
   - Official restaurant website/photo gallery when the website is clearly the exact venue.
   - OSM image tag only when attached to the exact OSM POI.
D. Search engines are discovery-only fallback:
   - Never accept a raw image because Bing says it matches.
   - Require an exact provider/place identity or exact verified venue page before accepting the image.
E. Photo selection:
   - First prefer outdoor_building_exterior / outdoor_or_storefront / outdoor_building_and_grounds when available.
   - Then indoor/ambience.
   - Reject logos, menus, food/product-only images.
   - Keep a neutral placeholder when no trustworthy photo exists; do not substitute a generic restaurant/chain image.
F. Card pipeline:
   - Render neutral placeholder immediately.
   - Fetch photo for current card and next card only.
   - Replace placeholder only after verified image loads successfully.
   - Do not preload row.photo into the card.
G. Caching:
   - Cache venue identity/provider mapping separately from image pixels.
   - Do not persist Google photo resource names long-term; Google documents that photo names can expire and should be retrieved from current Place Details/Nearby/Text Search responses.
H. Testing:
   - Build a fixture set of exact Clarksville venues: McDonald's 724 Sango Rd, The Thirsty Goat 4044 US-41 ALT South, Ruby Tuesday 2239 Madison St, Chipotle, Heads BBQ, Chris Pizza, etc.
   - For every fixture verify: exact venue identity, exact location, photo returned, photo loads in card, no generic chain photo, no food-only image.
   - Then test 20-50 random restaurants from each radius bucket.
   - Production release only after the hosted build passes the fixture matrix.

Recommended implementation order:
1. Add Foursquare fields/lookup support to restaurant search.
2. Add a single canonical venue photo endpoint that accepts provider IDs, not just name/address.
3. Implement Google/Foursquare provider adapters.
4. Implement official-site/OSM fallback.
5. Remove the current Bing-first photo ranking and all hard-coded restaurant-specific photo exceptions.
6. Add automated photo provenance and rejection reasons to the internal test mode.
7. Deploy and verify production separately.

Important source findings from current live research:
- Google Places API (New) returns place IDs and can return photos from Place Details, Nearby Search, or Text Search; Place Photos then serves the selected place photo. Google also requires any supplied author attributions and warns that photo resource names can expire. 
- Foursquare Place Search returns a stable fsq_place_id, and its Place Details can return photos. Foursquare's photo endpoint supports classifications such as outdoor_building_exterior, outdoor_or_storefront, outdoor_grounds, indoor_or_ambience, food_or_drink, logos, and menu, which is much better suited to choosing a restaurant-location image.
- Current Google global pricing lists a 1,000-event free cap for Places Photo and $7/1,000 for the next tier; Place Details Essentials is $5/1,000 after its 10,000 free cap. Pricing should be rechecked at implementation time.

Current decision:
- Do not keep tuning the current Bing scraper.
- Rebuild the photo path around canonical venue IDs + dedicated place-photo APIs.
- The goal is not “every restaurant gets some picture”; the goal is “every picture shown is tied to the exact restaurant/location.”
