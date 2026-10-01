# Recovery Checkpoint — CP633 — Exact Restaurant Photo Matching — 2026-10-01

Verified current-main photo behavior:
- Restaurant cards no longer render provider row.photo images before verification.
- Unverified or generic provider photos cannot appear on restaurant cards.
- Restaurant photo resolver uses image-level evidence rather than surrounding page HTML.
- Chain restaurant photos require location evidence.
- Sango McDonald's at 724 Sango Rd, Clarksville, TN 37043 is pinned to an exact Tripadvisor location photo:
  https://www.tripadvisor.co.uk/LocationPhotoDirectLink-g54955-d4875292-i279346939-McDonald_s-Clarksville_Tennessee.html
- The Thirsty Goat at 4044 US-41 ALT South, Clarksville, TN 37043 resolves from its exact venue page:
  https://joe.coffee/locations/tn/clarksville/the-thirsty-goat-clarksville/

Live external verification:
- Public Netlify preview 111 returned McDonald's HTTP 200 image/jpeg from source tripadvisor-exact-location-photo, source URL above, 40,563 bytes.
- Public Netlify preview 111 returned The Thirsty Goat HTTP 200 image/jpeg from source verified-venue-page, source URL above, 228,319 bytes.
- The exact McDonald's source image itself was independently fetched successfully from its Tripadvisor media URL.
- Earlier browser card testing proved the restaurant card loads the restaurant-photo API JPEG as actual image pixels.

Production status:
- The connected Netlify production site dinliminate.netlify.app is still serving an older CP592 deployment.
- Production should not be considered updated until its current deploy commit contains CP633.
- The Netlify connector's deploy-site operation returned a CLI command rather than executing the production deploy in this environment.

Current source marker:
- Build 633 / checkpoint CP633.
