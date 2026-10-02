# RECOVERY CP668 — RESTAURANT PHOTO FAST-PATH REPAIR

Date: 2026-10-01

Protected baseline: Preview 139 / CP667
- PR: #139
- Branch: cp667-next-restaurant-website-work
- Commit: b282446fc86d3865ce5ffda236fc31be0c303f33

Working branch:
- cp668-restaurant-photo-fast-path

Purpose:
- Repair restaurant photo delivery without changing restaurant search, radius, filters, swipe behavior, or UI layout.
- Keep Google Places photo APIs and Google API credentials out of the implementation.

Photo-only changes:
1. Exact OSM POI photos are now attempted before any external discovery.
2. Official restaurant-site discovery remains ahead of broader public search.
3. Public web discovery is reduced to three targeted searches and eight verified pages.
4. Exact Bing-image verification is limited to six candidates.
5. Added a regression assertion that an exact OSM photo returns before any web-discovery requests.

Protected control:
- Preview 139 remains untouched.

Latest CP668 commit:
- ab4ccb45d0ca5fa16f8378032d1000e486769837
