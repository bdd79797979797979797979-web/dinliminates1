# RECOVERY — CP695 LOCATION + MENU
Date: 2026-10-02

## Branch
`cp695-location-menu`

## Parent
CP694 note controls recovery point:
`cp694-note-controls`

## What changed
### Use My Location
- Uses a fresh high-accuracy browser position first with two fallback attempts.
- Avoids accepting stale cached coordinates as the primary “current location” result.
- Checks secure context and browser geolocation permission state.
- Gives visible location state and status feedback.
- Searches restaurants after a valid device position is established.
- Preserves meaningful restaurant-search errors rather than replacing them with a success message.

### Menu
- Kept only Manage Meals, History, and Settings as top-level utility destinations.
- Kept Hidden Foods under Manage Meals.
- Finished the drawer interaction layer with animated open/close behavior.
- Refined icons, row hierarchy, divider treatment, and Back to Start.
- Applied the same premium utility surface treatment to Manage Meals, History, and Settings.

## Scope guard
- Meal and restaurant swipe mechanics unchanged.
- Restaurant provider/search aggregation logic unchanged.
- Radius tiers and Quick Cuts unchanged.
- CP694 note Edit/Delete behavior unchanged.

## Build
- Build 695 / CP695.
- `index.html` assets bumped to v664.
- `sw.js` shell cache bumped to v668.
- Requested preview target recorded as `dinliminate22`.

## Verification gate
1. Press Use My Location on the Restaurant screen.
2. Confirm the browser permission prompt/state is handled and the location status becomes visible.
3. Confirm a valid location triggers restaurant search.
4. Confirm search failures remain visible as failures.
5. Open/close the hamburger repeatedly and confirm the motion completes without trapping the drawer.
6. Open Manage Meals, History, and Settings and confirm the utility surfaces share the premium visual language.
7. Confirm Back to Start returns to Home.
8. Confirm Restaurants and About are absent from the top-level menu.
9. Confirm JavaScript source parses.
