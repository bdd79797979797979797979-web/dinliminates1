# CP685 — Unified Restaurant Location Row Recovery

Date: 2026-10-01

## What changed
- Restaurant location controls are now one row:
  Current Location → Address → Refresh/Search → Miles.
- Removed the separate Radius label; the selector shows values such as 10 mi.
- Removed the separate restaurant-name Search button from the location strip.
- Kept address autocomplete and address-resolution/search behavior wired to the same Find/Refresh action.
- Current Location continues to populate the address field and immediately search.
- Changing radius continues to automatically search using the current location/address.
- The Refresh/Search control now shows the refresh state when the user has typed an address even before address resolution completes.
- Legacy restaurant query binding is guarded so removing the button does not create a null-element startup error.
- Service-worker shell cache was bumped and build metadata updated to CP685.

## Control contract
1. #locate → useLocation()
2. #address → autocomplete / address input
3. #find → searchRestaurants()
4. #radius → automatic search on change

## QA completed
- JavaScript syntax parse passed.
- Four-control DOM order passed.
- No Radius text label remains in the new row.
- No visible #restaurantSearch button remains in the location strip.
- 1/3/5/10/25/50/100 mile values are present, including 10 mi default.
- Current Location and Refresh use matching circular 36px base footprints.
- Legacy location sub-row is hidden.
- Typed address and selected location both produce Refresh state.
- Busy state produces spinner and disables Refresh while searching.
- Existing address autocomplete wiring remains present.
- Existing radius auto-search wiring remains present.

No Google API credentials were added.