# Full App Audit — Audit Checkpoint 1

Date: 2026-10-02
Audit branch: `cp705-full-audit-baseline`
Clean recovery baseline: `clean-cp704-2026-10-02`
Baseline Build: 704
Baseline Checkpoint: CP704
Code changes during audit: none

## Audit scope started
- Home / navigation / primary flows
- Meal catalog and Quick Cuts
- Restaurant discovery / taxonomy / search / radius / dedupe
- Restaurant photography / website / contact enrichment
- PWA / service worker / cache
- Persistence / history / notes / settings
- QA / CI / release plumbing
- Security and source-level reliability

## Findings confirmed so far

### A — App Diagnosis release identity is stale
`app.js` still contains CP701-specific release assertions:
- hardcoded branch `cp701-app-diagnosis-refresh`
- Build/CP701 wording in the diagnosis
- release endpoint expectation for Build 701 / CP701

The actual current release metadata is Build 704 / CP704. The diagnosis should verify the current release metadata dynamically rather than hardcoding CP701.

### B — Restaurant Open / All controls are absent
The current Restaurant shell does not expose the requested Open / All controls.
The source diagnosis already acknowledges this as a warning.
The restaurant pool filtering currently applies Quick Cuts, cut/hidden state, hidden restaurants, and text search, but does not apply an Open-only / All UI filter.

This is a product functionality gap, not merely a stale QA contract.

### C — Core QA is substantially stale
Examples found:
- `qa/clean-static-qa.js` reads nonexistent `release.json` and asserts old Build 197 / CP487 / app.js v532 contracts.
- `qa/browser-smoke.mjs` reads nonexistent `release.json` and contains old release/home assumptions.
- `qa/hosted-smoke.mjs` expects Build 197 and old Home labels.
- `qa/restaurant-six-point-certification.mjs` reads nonexistent `release.json`.
- `qa/iphone-optimization-smoke.mjs` expects obsolete `#iphoneHelp` and `#hoursToggle` controls.
- `qa/netlify-preview-smoke.mjs` contains old preview/build assumptions.

These tests cannot currently be treated as authoritative CP704 launch certification.

### D — CI workflows are stale
The principal QA workflows still trigger obsolete CP487 branches and/or hardcoded old Netlify previews.
Examples include:
- `clean-qa.yml`
- `fast-browser-qa.yml`
- `hosted-netlify-smoke.yml`

Historical CP643/CP648/etc. workflows also remain in the repository and can create confusion about which pipeline is authoritative.

### E — Service-worker shell cache is stale
`sw.js` still uses:
`dinliminate-shell-v668`

The current application has progressed well past that cache generation and now uses versioned script queries through CP704. The update/install behavior should be audited to ensure an installed PWA cannot retain an old shell indefinitely.

### F — Catalog naming mismatch
The built-in catalog contains `Chicken Pot Pie` with id `pot-pie`, but there is no exact display name `Pot Pie`.
All 116 built-in meal records currently parse with no duplicate IDs/names and no missing required detail fields.

### G — Optional Google provider exists, but is not the image dependency
`api/restaurants.js` supports optional Google Places credentials. The primary no-credential discovery stack remains OpenStreetMap Overpass + ArcGIS + Photon.
`api/image.js` has no Google provider dependency. The restaurant photo pipeline is separate.

## Baseline integrity
No production code was changed during this audit section.
Continue from this audit branch for audit documentation/fixes.
Use `clean-cp704-2026-10-02` as the protected rollback baseline.
