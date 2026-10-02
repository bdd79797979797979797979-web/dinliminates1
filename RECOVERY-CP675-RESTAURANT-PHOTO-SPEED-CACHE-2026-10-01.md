# CP675 — Restaurant Photo Speed & Persistent Cache

Date: 2026-10-01
Base: CP674 / 9fc386b5f9fd1fce6f7b2c2f15fe59146466fd6c
Purpose: make restaurant photography feel faster while preserving downloaded photos across app updates and offline use.

Changes:
- Service worker shell cache is versioned separately from image cache.
- Service worker activation no longer deletes the persistent restaurant photo cache `dinliminate.restaurant.photos.v1`.
- `/api/image` responses and image requests use a dedicated persistent image cache instead of the app-shell cache.
- Restaurant photo fetches use normal browser HTTP caching (`force-cache`) instead of forcing `no-store`.
- Restaurant photo API responses advertise a 7-day browser/CDN freshness window with 30-day stale-while-revalidate support.
- After a restaurant card is drawn, the next two restaurant photos are prefetched during browser idle time so swiping ahead is more likely to show the real photo immediately.
- The existing immediate category fallback remains in place while a real venue photo is loading.

No Google API credentials added.

Recovery checkpoint: branch cp675-restaurant-photo-speed-cache
