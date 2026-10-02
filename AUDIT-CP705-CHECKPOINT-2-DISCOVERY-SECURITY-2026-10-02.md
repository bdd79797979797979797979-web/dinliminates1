# Full App Audit — Audit Checkpoint 2

Date: 2026-10-02
Audit branch: `cp705-full-audit-baseline`
Protected clean baseline: `clean-cp704-2026-10-02`
No product code changes made by the audit.

## Discovery / taxonomy findings
- Restaurant API is r25 with a 100-mile cap.
- Primary discovery stack: OpenStreetMap Overpass, Photon, ArcGIS; Google Places is optional only when credentials exist.
- Search keys vary by origin, radius, and normalized search term.
- Search retries transient failures and uses bounded budgets.
- Wide searches use overlapping <=50-mile coverage circles.
- Restaurant deduplication compares normalized addresses, identity profiles, name similarity, and other signals.
- Taxonomy contains Fast Food, Burgers, Pizza, Mexican, American, Italian, Asian, BBQ, Seafood, Breakfast.
- McDonald's, Wendy's, Chipotle, Thirsty Goat, Heads BBQ/Robert Heads BBQ and other known identities have explicit handling.
- Burger queries intentionally match Burgers and Fast Food tags.
- Provider current `openNow` is preserved and takes precedence in hour-state calculation.
- No literal Pork Quick Cut exists.

## Catalog findings
- 116 built-in meal records.
- No duplicate names or IDs.
- No required detail fields are missing.
- Requested catalog examples are present, but the exact label `Pot Pie` is absent; the record is displayed as `Chicken Pot Pie` while retaining id `pot-pie`.
- Stuffed Peppers uses a Stouffer-hosted image URL but the meal name itself is not branded Stouffer's; this should be distinguished from any actual unwanted branded meal entry.

## Photo/source governance
- `api/image.js` uses an explicit allowlist of image hosts, reducing generic image-proxy SSRF exposure.
- Restaurant photos use venue verification and source tiers rather than generic Google image results.
- The restaurant-photo resolver does not require a Google credential for its non-Google sources.
- Food and restaurant image inventory still contains multiple third-party hosts outside the two centrally approved Pexels/Unsplash food-CDN hosts, so final rights/source review remains a launch gate.

## Security hardening finding
### P2 — Server-side external fetch redirect validation
The restaurant website/photo services fetch externally supplied or provider-derived HTTPS URLs and allow redirects. Initial URL validation blocks obvious localhost/private IPv4 literals, but the final redirected destination is not consistently revalidated against the same network/host policy before fetching content.

This is a defense-in-depth SSRF risk. It is not the same as the client image proxy, which has a fixed host allowlist.

Recommended later fix: revalidate every redirect/final URL, and preferably restrict server-side website/image fetches to an explicit public-host policy after DNS/IP resolution checks.

## Current external-runtime status
- The requested Netlify target `dinliminate22.netlify.app` was not reachable from the available web inspection tool.
- Connected Netlify accounts currently expose only the older `dinliminate112` project, so that project was not used.
- Vercel project `dinliminates1` has recent READY deployments only through CP696; CP704 is not deployed there.
- The CP704-area commit has no GitHub Actions workflow runs because the primary workflows still target obsolete branches.
- GitHub commit status reports Vercel build-rate-limit failures.

## Priority interpretation
The discovery/search architecture is substantially mature, but its live certification is blocked by deployment/QA plumbing.
The highest concrete product gap remains Open/All UI.
The highest test-system gap is stale QA/CI.
The clearest security hardening gap is server-side redirect validation.
