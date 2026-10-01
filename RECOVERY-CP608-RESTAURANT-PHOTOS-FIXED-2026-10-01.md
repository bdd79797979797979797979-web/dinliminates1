# Recovery Checkpoint — CP608 — Restaurant Photos Fixed End-to-End — 2026-10-01

Verified fix:
- Restaurant photo API returns real venue JPEGs.
- McDonald's exact Sango Rd location: HTTP 200 image/jpeg, source verified-venue-image.
- The Thirsty Goat exact location: HTTP 200 image/jpeg, source verified-venue-page.
- Restaurant card browser test passes on public Netlify Deploy Preview 100.
- Browser result for McDonald's:
  - src = same-origin /api/restaurant-photo?...
  - naturalWidth = 474
  - naturalHeight = 316
  - loaded = true
  - no fallback-restaurant.svg
- Root cause fixed: the client was converting a valid binary photo response into a blob URL, and the browser then hit the image error handler and replaced it with fallback-restaurant.svg.
- New card behavior: load the verified restaurant-photo API URL directly as the card image source.
- Deterministic exact venue-page discovery was added for local restaurant photo sources.
- Build marker synchronized to build 608 / CP608.
- Temporary credential-dependent deployment workflows and temporary test trigger files were removed from main.

Hosted proof:
- Public preview used for browser verification: https://deploy-preview-100--dinliminate.netlify.app
- The preview contains the fixed code and is ready.

Production status:
- The connected Netlify production deployment currently remains on an older CP592 deployment.
- The Vercel production project is also still on its older deployment and has no deploy token available to the repository.
- Do not call production fixed until the live production deployment reports a commit containing CP608.
