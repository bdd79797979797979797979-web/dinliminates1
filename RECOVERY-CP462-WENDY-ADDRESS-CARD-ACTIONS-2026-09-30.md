# Recovery Checkpoint CP462 — Wendy Address Canonicalization + Restaurant Card Actions
Date: 2026-09-30

Starting point:
- CP460 / Build 164
- Earlier safety point: `recovery-cp461-before-final-address-card-fix-2026-09-30`
- Final pre-frontend normalization safety point: `recovery-cp461-before-frontend-address-finalize-2026-09-30`

Changes:
1. Restaurant address normalization now equates full state names and abbreviations, common road/directional variants, punctuation differences, and trailing USA/United States country text.
2. The exact Wendy's case now collapses provider variants such as:
   - 2330 Madison St, Clarksville, TN 37043
   - 2330 Madison Street, Clarksville, Tennessee, 37043
   - 2330 Madison St., Clarksville, TN 37043, USA
   - 2330 Madison Street, Clarksville, Tennessee, 37043 United States
   into one venue.
3. Restaurant cards no longer render the phone icon action; phone remains available inside Restaurant Details.
4. Card utility order is explicitly Details first, Website second.
5. Details and Website now have subtly differentiated premium treatments while remaining compact.
6. Build 167 / CP462; app cache-busting v462.

Verification:
- API syntax PASS.
- App syntax PASS.
- Restaurant dedupe QA syntax PASS.
- Clean static QA syntax PASS.
- API normalization produced one canonical Wendy address for all four variants.
- Browser-side normalization produced one canonical Wendy address for all four variants.
- API dedupe returned one Wendy result.
- Browser-side dedupe returned one Wendy result.
- Distinct addresses remain protected from false merging.
- Phone card action absent.
- Details-first/Website-second markup and styling present.
- release.json and release-manifest.json both report Build 167 / CP462.
