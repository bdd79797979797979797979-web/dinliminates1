# Recovery Checkpoint — CP589 — Actual Venue Photo Enforcement — 2026-10-01

Parent: CP588

Completed:
- Reworked api/restaurant-photo.js to enforce venue-photo evidence instead of accepting the first image from a verified restaurant page.
- Added venue/exterior signals including exterior, front, entrance, building, storefront, sign, location, drive-thru, parking, patio, and related terms.
- Added food-image penalties for common menu/food/dish/meal imagery.
- Added extraction from normal <img> tags, lazy-loaded image attributes, srcset, CSS background images, JSON-LD image/photo data, and metadata.
- Verified restaurant identity plus address/location evidence is still required before a source page is accepted.
- Bing remains discovery-only; image candidates must still point to a verified exact restaurant page and meet the venue-photo threshold.
- Removed the previous Wikimedia/generic-photo fallback so an unrelated image is no longer returned just to fill the card.
- Bumped app/release metadata to build 589 / CP589 and refreshed the browser/service-worker cache identities.

Important:
- GitHub main is the current source of truth at CP589.
- Netlify site dinliminate112 is still on the older CP584 deployment; a GitHub main push has not automatically published this CP589 build.
- Vercel has previously been blocked by build-rate-limit failures.
- The live-site deployment state still needs verification after publishing CP589.

Target behavior:
- Restaurant card photo must be an actual image of the exact restaurant/location whenever a non-Google venue image can be found.
- Generic food images, generic restaurant interiors, chain-wide imagery, logos, icons, and placeholders must not be accepted as the restaurant photo.
- If no verified venue image exists, the app should keep the neutral restaurant fallback rather than display an unrelated food photo.

Latest code commit for photo resolver:
79625fbdfd9612b459ecf4b00d59977a84fd6ba0
