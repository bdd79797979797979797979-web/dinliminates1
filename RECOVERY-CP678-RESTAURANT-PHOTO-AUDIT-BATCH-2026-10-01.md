# Recovery Checkpoint — CP678 Restaurant Photo Audit Batch
Date: 2026-10-01
Base: CP677 / cp677-known-restaurant-photo-fast-path
Branch: cp678-restaurant-photo-audit-batch

## Scope
Proactive restaurant-photo reliability pass for the next Clarksville-area restaurant group. Search, radius, filtering, swiping, and location logic are not changed.

## Exact known-photo fast paths added
1. Reggie's BBQ — official restaurant site image.
2. Legends Smokehouse & Grill — restaurant's official site image.
3. Johnny's Big Burger — restaurant site storefront image.
4. Blackhorse Pub & Brewery — verified Clarksville exterior photo.
5. Pbody's — verified restaurant exterior photo.
6. The Catfish House — restaurant site image.
7. Liberty Park Grill — verified Clarksville exterior/patio photo.
8. Cafe 931 — verified Clarksville cafe interior photo.
9. Yada on Franklin — verified restaurant interior photo.
10. The Mailroom — official restaurant interior photo.
11. Silke's Old World Breads — official restaurant/bakery exterior photo.
12. Casa D'Italia — verified restaurant dining-room photo.

## Behavior
- Known Clarksville rows get an immediate real-photo frontend fallback while the existing photo API/caching path can resolve the same venue photo.
- Existing CP676/CP677 photo discovery remains intact for restaurants not in this table.
- No Google Photos/Places API or credentials added.

## Recovery
Use CP677 to revert this batch without affecting the earlier three-venue fix.
