# CP652 — Restaurant Non-Dining Filter
Date: 2026-10-01
Branch: cp652-restaurant-nondining-filter
Base: CP651

## Issue
A result named "Larson's Enterprise Inc" appeared in the Restaurant pool even though its provider metadata identifies it as a food-supplier/business rather than a dining venue.

## Fix
Added a shared server-side non-dining filter that runs:
- at provider ingestion where practical
- after provider merging before final result normalization
- before contact enrichment

The filter removes clear supplier/distributor/wholesaler/warehouse/manufacturer and other non-dining business signals, while ignoring a generic provider category value of "Restaurant" when the actual type metadata identifies the business as non-dining.

Examples covered by regression tests:
- Larson's Enterprise Inc / Food Supplier
- Regional Food Distribution / Food Distributor
- Clarksville Food Warehouse / Warehouse

A normal restaurant fixture remains eligible.

## Testing
- Added regression coverage to `qa/restaurant-classification-smoke.cjs`.
- Added a dedicated CP652 GitHub Actions workflow to run that regression.
- Source inspection confirms the final merged-result pipeline applies `filterNonDiningRows`.
- No restaurant photo, location, radius, or Google Places photo logic was changed.
- No API credentials were added.

## Hosted
Netlify PR preview will be verified before the checkpoint is considered visually certified.
