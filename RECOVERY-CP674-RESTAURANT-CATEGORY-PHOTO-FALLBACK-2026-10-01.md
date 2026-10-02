# CP674 — Restaurant Category Photo Fallback

Date: 2026-10-01
Base: CP673 / non-dining food business filtering
Purpose: Restaurant cards without a real venue photo should fall back to restaurant-specific category photography.

Changes:
- Restaurant fallback photos now use REST_QUICK_IMAGES instead of meal QUICK_IMAGES.
- BBQ restaurants fall back to the restaurant BBQ photo; Pizza, Mexican, American, Italian, Asian, Seafood, Breakfast, Burgers, and Fast Food use their restaurant-category photos as well.
- Fallback photos continue through /api/image, which the active service worker caches for repeat/offline use.
- Actual restaurant photos continue using Cache Storage dinliminate.restaurant.photos.v1 for up to 30 days before another online lookup is allowed.
- Exposed restaurantFallbackImage through the QA hook for browser diagnosis/testing.

No Google API credentials added.

Recovery checkpoint: branch cp674-restaurant-category-photo-fallback
