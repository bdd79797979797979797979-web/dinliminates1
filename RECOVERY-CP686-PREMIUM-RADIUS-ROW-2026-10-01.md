# CP686 — Premium Radius Row Recovery

Date: 2026-10-01

## Change
The Restaurant location controls now stay on one row:
Current Location → Address → Refresh/Search → Miles.

The radius selector is no longer a native-looking white box below the row. It is wrapped as a dark premium pill with satin-gold border/text, a custom chevron, and responsive widths.

## QA
- Four controls verified in the DOM in the requested order.
- Radius is inside .location-main.
- No Radius text label remains.
- 1/3/5/10/25/50/100 mi options present.
- 10 mi is the default.
- Radius change handler still invokes searchRestaurants().
- Legacy location-sub row remains hidden.
- JavaScript syntax parse passed.
- Service-worker cache bumped to v659.
- Build metadata is CP686.
- No Google API credentials added.

## Baseline
Built directly from CP685 so the unified location row and search behavior remain the recovery base.