# Recovery Checkpoint — CP596 — Restaurant Photo Preview Deployed — 2026-10-01

Parent: CP592/CP595

Deployment:
- Netlify site: dinliminate112
- Deploy preview: deploy-preview-95--dinliminate112.netlify.app
- Deploy ID: 6abe5eb2fcb3e60008aa7ff8
- Commit: 296117e7e0b7e515495ff758503142df80bcbc4c
- Branch: cp595-restaurant-photo-live
- State: ready
- Review: PR #95
- Netlify reports 4 functions deployed, including restaurant-photo.
- Deployed restaurant-photo function digest differs from the old CP584 function, confirming the updated function was included in this preview.

Verification:
- An automated direct HTTP request to the preview received HTTP 401 before reaching the function because the Netlify project is protected by team SSO/access controls.
- Therefore the live preview function response cannot be externally byte-tested from an unauthenticated runner.
- This is an access-control limitation, not evidence that the new restaurant-photo function failed to deploy.
- The source-side fixes remain in main at CP592.

Current source fixes:
- Runtime-safe venue photo discovery.
- Exact restaurant/location verification.
- Real verified venue gallery selection.
- No generic food/logo placeholder preload.
- id/canonicalId-aligned photo hydration.

Next live check:
- Open the deploy-preview-95 URL in the authenticated Netlify context and test McDonald's 724 Sango Rd and The Thirsty Goat 4044 US-41 ALT South.
