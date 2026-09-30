# Recovery Checkpoint — CP410 — Restaurant Photo Deep Dive Findings — 2026-09-30

Parent: CP409

Findings:
1. Photo rendering/fallback infrastructure is robust: restaurant cards and details use a proxied image when the URL is from an allowlisted image host, then a restaurant-specific fallback, then the final fallback SVG.
2. API photo sourcing is uneven by provider. OpenStreetMap/Photon can supply photo/image fields; ArcGIS rows currently have photo:''; Google Places rows also currently have photo:'' because photo fields are not requested in the Google FieldMask.
3. The API has a useful namedImage() fallback map for recognizable national chains and cuisine/name patterns, but it is a static stock-image mapping rather than a location-specific restaurant photo system.
4. The app has an additional client-side restaurantFallback() map. This duplicates some API fallback logic and is mostly generic: Chipotle gets a Mexican photo, while Ruby Tuesday/Thirsty Goat and most unknown restaurants fall back to a generic dining-room image.
5. Dedupe provider priority is OSM first, Photon second, other providers later. During a merge, the first non-empty photo wins because photo is only filled when the existing row has no photo. That is deterministic, but it can retain an inferior/stale OSM or Photon photo even when another source could eventually provide a better image.
6. Google contact enrichment currently does not request or carry restaurant photos either, so enabling the Google key would improve phone/website/hours coverage without materially improving photos.
7. The image proxy is secure and bounded: it allowlists hosts, enforces HTTPS, rejects non-image content, limits payload size to 8 MB, and caches successful responses. However, any new provider image host requires an explicit allowlist addition.
8. Existing automated certification verifies that restaurant image fields exist in fixtures and that fallback rendering is wired, but it does not score photo quality, test a broken photo URL followed by fallback, compare provider photos, or verify that live local venues receive venue-specific photography.
9. There is no persistent photo-quality metadata such as photo source, confidence, fetched-at timestamp, or whether the image is venue-specific vs generic fallback.
10. The current premium Tinder presentation is visually compatible with the image pipeline, but a generic dining-room fallback undermines the premium/local feel when many local restaurants lack tagged photos.

Recommended architecture:
- Add a single server-side restaurantPhoto() resolver that tracks source and quality instead of relying on two separate fallback maps.
- Request Google Places photo references/URIs when Google is configured and use them as high-value venue-specific candidates.
- Prefer venue-specific provider images, then stable chain-specific imagery, then cuisine-specific imagery, and finally the generic restaurant fallback.
- Preserve photoSource/photoIsGeneric/photoConfidence fields in the normalized restaurant row for diagnosis and QA.
- Add broken-image and fallback telemetry to automated QA without requiring external vision scoring.
- Consider a small curated local-photo correction map only for stable high-priority local venues; avoid growing ad-hoc name exceptions.

No production photo changes were made at CP410.