# RECOVERY-CP636-RESTAURANT-PHOTO-NO-CREDENTIALS-2026-10-01

Branch: cp636-restaurant-photo-rebuild

Purpose:
- Replace the credential-dependent / scraper-first restaurant photo architecture with a credential-free exact-venue photo pipeline.
- No Google API credentials are added, requested, required, or committed.
- Keep the existing premium restaurant card UI and direct image handoff.

Implementation target:
1. Exact official restaurant website/page first.
2. Exact public venue pages discovered by search (Tripadvisor, USARestaurants, Restaurantji, etc.).
3. Exact OpenStreetMap image tags when provenance identifies an OSM POI.
4. Search engines are discovery only; never accept an arbitrary search-result image as proof.
5. Reject logos, placeholders, food/menu/product images, stock hosts, and generic chain/category imagery.
6. Return 404 when there is no sufficiently verified venue photo rather than showing a wrong photo.
7. Client displays neutral fallback until the exact photo endpoint succeeds.
8. Remove hardcoded restaurant-specific photo exceptions.

This checkpoint is created before implementation changes on CP636.
