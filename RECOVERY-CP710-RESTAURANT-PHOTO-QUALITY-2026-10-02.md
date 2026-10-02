# Recovery CP710 — Restaurant Photo Quality

Date: 2026-10-02

Base: `cp709-unified-decision-button-jump`
Pre-audit photo reference: `cp705-full-audit-baseline`

## Changes
- Require stricter restaurant/address identity verification before accepting verified photo pages.
- Require the official-site fast path to pass the stricter exact-location check.
- Verify curated known restaurant photos against their source page before returning them.
- Add image-dimension and usable-aspect-ratio screening to reject tiny/poor photo assets.
- Support JPEG, PNG, GIF, WebP and AVIF image validation paths.
- Rotate persistent restaurant photo cache from v1 to v2 and shorten persistence to 14 days.
- Add resolver version 710 to restaurant-photo requests so improved selection is not hidden by old HTTP caching.
- Bump frontend app.js asset version and service-worker shell cache.

## Protected recovery
`cp709-unified-decision-button-jump` remains unchanged.
`cp705-full-audit-baseline` remains the pre-audit quality reference.

## Next verification
Test real restaurant results in Clarksville and confirm the displayed images remain venue-specific, high quality, and fast.
