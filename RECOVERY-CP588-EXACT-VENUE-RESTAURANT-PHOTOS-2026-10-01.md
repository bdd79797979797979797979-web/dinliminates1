# Recovery Checkpoint — CP588 — Exact Venue Restaurant Photos — 2026-10-01

Parent: CP587

Completed:
- Replaced the prior loose restaurant-photo selection with a non-Google venue-photo pipeline.
- Searches for exact restaurant/location pages and verifies the page contains the restaurant identity plus address/location evidence before accepting a photo.
- Extracts restaurant-page images from verified page metadata/JSON-LD.
- Uses Bing only as a discovery mechanism; Google photo APIs and Google photo URLs are not used by api/restaurant-photo.js.
- Explicitly rejects common generic/stock image hosts and placeholder/logo/icon filenames.
- Restaurant card, next card, details, winner, and recent history restaurant images use the same photo hydration path.
- Removed the old Google-photo-specific preference from api/restaurants.js.
- Release/cache identities bumped to build 588 / CP588.

Important:
- Netlify site dinliminate112 is still serving CP584 and has not picked up the GitHub main-branch changes through the connected Netlify deployment.
- The GitHub repo main branch is the current source of truth.
- Vercel status remains blocked by the existing build-rate-limit failure.

Target behavior:
- Prefer actual photos tied to the exact restaurant/location page.
- Do not display generic restaurant interiors, generic food images, or unrelated chain imagery as the restaurant's photo.
- Keep the existing final fallback only when no verified venue image can be found.
