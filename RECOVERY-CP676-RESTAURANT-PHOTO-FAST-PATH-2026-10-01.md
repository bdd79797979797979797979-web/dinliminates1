# CP676 — Restaurant Photo Fast Path

Date: 2026-10-01
Base: CP675 / 487912c7ca1805adb8098415be5fff6b1bfee5e7
Purpose: speed up real restaurant photo loading, especially when a known official/public source can be checked directly.

Changes:
- Separated the reusable restaurant-photo loader from DOM hydration so background prefetch actually fetches photos for upcoming cards.
- Prefetches the next two restaurants during browser idle time.
- Added official-site hints for The Thirsty Goat and Sweet P's Southern Style, both currently documented in Clarksville sources.
- Added a verified fast public photo-page hint for Excell Bar-B-Q using the Visit Clarksville listing at the exact restaurant address.
- Added a server fast official-homepage photo path before slower broad web discovery.
- Added a short negative-photo cache so a temporary miss does not repeatedly trigger the expensive discovery pipeline during the same session.

No Google API credentials added.

Recovery checkpoint: branch cp676-restaurant-photo-fast-path
