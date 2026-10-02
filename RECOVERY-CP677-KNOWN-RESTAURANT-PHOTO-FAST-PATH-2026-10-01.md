# Recovery Checkpoint — CP677 Known Restaurant Photo Fast Path
Date: 2026-10-01
Base: CP676 / cp676-restaurant-photo-fast-path
Branch: cp677-known-restaurant-photo-fast-path

## Scope
This checkpoint addresses exact restaurant photo failures reported for Sweet P's Southern Style, Gray Smoke Barbecue/Gray's Smoke, and CAP's Neighborhood Bar & Grill in Clarksville, TN.

## Changes
- Added direct exact-name known photo fast paths for the three reported Clarksville venues.
- Added the same real venue photos as immediate frontend card fallbacks so a photo can render without waiting for search-engine discovery.
- Added known official-site hints for Gray Smoke and CAP's in the frontend.
- Kept the broader CP676 official-site/search logic intact.
- No Google API credentials added.

## Photo sources
- Sweet P's: Wheree storefront photo, source page https://sweet-ps-southern-style.wheree.com/
- Gray Smoke Barbecue: official restaurant website photo, https://graysmokebarbecue.com/
- CAP's Neighborhood Bar & Grill: ClarksvilleNow venue photo, source page https://clarksvillenow.com/local/caps-neighborhood-bar-grill-opens-family-friendly-spot-in-clarksville/

## Expected behavior
For Clarksville rows matching the exact/alias names above, a real venue photo is available immediately as the card fallback and the API can return the same photo on its fastest path. The existing persistent photo cache remains active.

## Safety
No Google Photos/Places API or credentials introduced.
