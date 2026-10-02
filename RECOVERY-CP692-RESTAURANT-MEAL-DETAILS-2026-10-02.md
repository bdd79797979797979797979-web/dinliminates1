# RECOVERY — CP692 RESTAURANT + MEAL DETAILS
Date: 2026-10-02

## Branch
`cp693-premium-navigation`

## Parent
CP692 restaurant + meal details recovery point:
`000b81f87f268d86c18407ebd10caf9c39ba9f76`

## Scope
CP693 is a premium navigation and utility-surface pass built on CP692. It intentionally does not alter restaurant or meal swipe mechanics.

### Navigation
- Removed Restaurants from the top-level hamburger menu.
- Combined Settings and About into one Settings surface.
- Kept Hidden Foods under Manage Meals.
- Redesigned the hamburger drawer, History, Settings, and Back to Start treatment with one shared premium visual language.

### Details and Notes
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
User-requested preview target: `dinliminate22`.

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

