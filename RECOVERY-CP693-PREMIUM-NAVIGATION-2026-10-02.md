# RECOVERY — CP693 PREMIUM NAVIGATION
Date: 2026-10-02

## Branch
`cp693-premium-navigation`

## Parent
CP692 restaurant + meal details recovery point:
`000b81f87f268d86c18407ebd10caf9c39ba9f76`

## Scope
CP693 refines Dinliminate's utility navigation without changing the meal or restaurant decision mechanics.

### Navigation
- Removed Restaurants from the top-level hamburger menu.
- Kept Manage Meals as the food-management destination, including Hidden Foods / Restore.
- Combined the former About content into Settings.
- Kept History as a top-level menu destination.
- Redesigned the hamburger drawer and Back to Start action as one premium navigation system.

### Shared utility style
- Menu, History, Settings, and supporting utility surfaces use the same dark satin treatment, restrained blue accents, thin dividers, circular iconography, and generous spacing.
- Settings now contains Hidden Restaurants, App Diagnosis, System Restore, Reset App Data, Export PDF, Privacy & Data, and About/build information.
- History now opens with a lightweight “Your Decisions” introduction while retaining the calendar and photo history behavior.

### Scope guard
- Restaurant search, location, radius, filtering, Quick Cuts, restaurant photos, and swipe mechanics were not changed in CP693.
- Meal/Restaurant Details and local Notes behavior from CP692 were not changed in CP693.

## Cache/build
- `index.html`: app assets bumped to v663.
- `sw.js`: shell cache bumped to v666.
- `app-release.json`: build 693 / CP693.
- `release-manifest.json`: build 693 / CP693; requested Netlify target recorded as `dinliminate22 preview`.

## Verification gate
1. Open hamburger menu from Home, Meal, and Restaurant screens.
2. Confirm Restaurants and About are absent from the top-level menu.
3. Open Manage Meals, History, and Settings.
4. Confirm Back to Start returns to Home.
5. Confirm Settings shows About/build information and Privacy & Data without a separate About menu item.
6. Confirm History calendar and saved-decision rows still open Details.
7. Verify no console errors and no broken navigation interactions on the hosted preview.
