# CP653 — Official Website Mapping
Date: 2026-10-01
Branch: cp653-camacho-official-website
Base: CP652

## Issue
Camacho's Famous in Clarksville had an official website but the Restaurant card displayed the Google website-search fallback because the provider record did not supply a website and Camacho's was not in the app's known-website map.

## Fix
Added Camacho's Famous → https://www.camachosfamous.com to the known restaurant website map in:
- app.js
- api/restaurants.js

The existing website decision flow now opens the official site directly instead of Google search when the restaurant name matches.

## Verification
The official site was independently verified and identifies Camacho's Famous in Clarksville at 1021 Highway 76, Suite 106. 
Regression coverage was added to qa/restaurant-classification-smoke.cjs and the API exposes the mapping for that test.

## Safety
- No Google Places photo API or photo credentials added.
- No restaurant-search behavior changed except website enrichment/fallback.
