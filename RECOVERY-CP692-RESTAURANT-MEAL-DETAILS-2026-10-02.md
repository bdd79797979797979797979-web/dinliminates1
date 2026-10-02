# RECOVERY — CP692 RESTAURANT + MEAL DETAILS
Date: 2026-10-02

## Branch
`cp692-restaurant-meal-details`

## Parent
CP691 swipe-stability recovery point:
`02f41eecf6930f90f27f9e0c00cd11ec11647822`

## Scope
CP692 is a presentation and local-data pass for Details and Add Meal. It intentionally does not alter restaurant or meal swipe mechanics.

### Details
- Meal and Restaurant Details use the same visual hierarchy and spacing.
- Meal Details: About (when available), Details, Typical nutrition, Notes, Hide Meal.
- Restaurant Details: About (when available), Details, Hours, Contact, Notes, Website / Call / Directions, Hide Restaurant.
- Heavy restaurant-specific card nesting was removed from the new Details markup in favor of calmer section separators.

### Notes
- Notes are keyed to the individual meal or restaurant and saved locally in `localStorage` under `dinliminate.item.notes.v1`.
- Maximum note length is 1,200 characters.
- Notes survive normal round reset and System Restore.
- Reset App Data removes Notes.
- Renaming a custom meal carries its existing note to the new meal id.
- Deleting a custom meal removes its note.

### Add/Edit Meal
- Added optional **About this meal**.
- Renamed **Recipe / notes** to **Recipe / preparation** to keep Notes as its own feature.

## Cache refresh
- `index.html`: app.js query bumped to v662.
- `sw.js`: shell cache bumped to v665.
- `app-release.json` and `release-manifest.json`: build 692 / CP692.

## Preview target
User-requested preview target: `dinliminate112`.

## Verification gate
Before promotion, verify on the hosted preview:
1. Open Meal Details.
2. Open Restaurant Details.
3. Add, edit, save, cancel, and clear a Note on both types.
4. Start a new round and confirm Notes remain.
5. Use System Restore and confirm Notes remain.
6. Use Reset App Data and confirm Notes are removed.
7. Add a custom meal with About/Ingredients/Recipe and confirm all three appear cleanly in Details.
8. Confirm Restaurant Website / Call / Directions still work.
9. Confirm Hide remains available and secondary.
10. Confirm CP691 swipe behavior is unchanged.

