# RECOVERY — CP694 NOTE CONTROLS
Date: 2026-10-02

## Branch
`cp694-note-controls`

## Parent
CP693 premium navigation recovery point:
`e1933f14b5732d01ae0c322c5b667febdfe92ee9`

## Scope
CP694 adds polished note controls to Meal and Restaurant Details.

### Notes
- Existing notes show a restrained **Edit note** action and a small circular **×** delete control.
- Edit opens the existing local note in the same editor with its current text.
- Delete immediately removes the note from device-local storage and returns the Notes section to its empty state.
- Empty Notes continue to show **Add a note**.
- Notes remain device-local under `dinliminate.item.notes.v1` and retain the CP692 behavior.

### Scope guard
- No meal or restaurant swipe mechanics changed.
- No restaurant search, location, radius, filtering, Quick Cuts, or photo system changed.
- CP693 premium navigation remains intact.

## Cache/build
- `index.html`: app/styles/icon asset query versions bumped to v664.
- `sw.js`: shell cache bumped to v667.
- `app-release.json`: build 694 / CP694.
- `release-manifest.json`: build 694 / CP694; requested Netlify target remains `dinliminate22 preview`.

## Verification gate
1. Open Meal Details with a saved note.
2. Confirm Edit opens the editor with the saved text.
3. Save a changed note and confirm the preview updates.
4. Tap × and confirm the note disappears without leaving Details.
5. Repeat the same Edit/Delete flow for Restaurant Details.
6. Confirm Add a note returns after deletion.
7. Confirm the JavaScript source parses and the note controls are present.
