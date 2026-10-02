# Recovery Checkpoint — CP679 Tourism & Local Publication Photo Discovery
Date: 2026-10-01
Base: CP678 / cp678-restaurant-photo-audit-batch

## Scope
Improve restaurant-photo discovery by prioritizing reputable Clarksville tourism and local publication pages.

## Changed
- api/restaurant-photo.js now adds prioritized Bing discovery queries for:
  - Visit Clarksville: site:visitclarksvilletn.com
  - ClarksvilleNow: site:clarksvillenow.com
- These sources are tried before broader restaurant directories.
- Existing exact name/address verification is still required before a page can supply a photo.
- No new hardcoded restaurant photo URLs were added.
- Existing CP677/CP678 known-photo entries remain unchanged.
- No Google API credentials added.

## Rights handling
Visit Clarksville's current image-gallery page states its images are editorial-only and not for commercial/for-profit use. Therefore this checkpoint uses Visit Clarksville primarily as a restaurant/page discovery source; it does not blindly ingest its gallery as a photo catalog.

## QA
Static regression checks confirm both local discovery domains are present in the restaurant-photo search path.
