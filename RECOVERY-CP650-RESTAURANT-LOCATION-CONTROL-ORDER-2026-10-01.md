# CP650 — Restaurant Location Control Order
Date: 2026-10-01
Branch: cp650-restaurant-location-control-order
Base: CP649

## Change
Reordered the Restaurant location controls to make the hierarchy visually and functionally clearer:

**Use My Location → location/address window → Refresh**

- Use My Location now sits immediately to the left of the location/address field.
- Refresh remains on the right as the separate search action.
- Existing behavior and IDs are unchanged: `locate`, `address`, `find`.
- Responsive sizing is preserved for small iPhone widths.
- No restaurant search logic, location logic, or photo resolver logic was changed.

## Testing
- Verified the rendered HTML order contains `locate` before `address-wrap` before `find`.
- Verified CSS explicitly places the controls in columns 1 / 2 / 3 in the intended order, including <=390px and <=340px breakpoints.
- Release metadata marked CP650.
- Hosted preview verification is required before claiming visual certification.
