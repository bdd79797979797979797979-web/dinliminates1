# Full App Audit — Audit Checkpoint 3

Date: 2026-10-02
Audit branch: `cp706-full-audit-ui-integration`
Protected clean baseline: `clean-cp704-2026-10-02`
Audit source baseline: `cp705-full-audit-baseline`
No product code fixes made.

## UI / integration findings

### P1 — Restaurant Search control is disconnected
`app.js` contains `renderRestaurantSearchControl()` and `bindRestaurantTools()` which expect `#restaurantSearch`, but `index.html` has no element with that id.
The Restaurant search input `#restaurantQuery` and hidden `#restaurantSearchBox` therefore have no visible opener in the current shell.

Impact: users cannot reliably open restaurant search from the current UI.

### P1 — Restaurant Open / All controls are missing
`index.html` has no Open/All filter controls and no `#hoursToggle`.
`restaurantPoolBase()` does not apply an hour-state filter.
The app can calculate open/closed/unknown state, but there is no current UI control that lets the user choose Open-only versus All.

Impact: the requested Open/All behavior is not available.

### P2 — App Diagnosis still hardcodes CP701
Diagnosis release checks and copy still contain CP701/Build 701/branch `cp701-app-diagnosis-refresh`.
Current release metadata is Build 704 / CP704.

Impact: Diagnosis can report a false release mismatch on the current build.

### P2 — Offline build fallback is one build behind
`app.js` fallback is `APP_BUILD='703'` while `app-release.json` is Build 704.
A successful metadata fetch corrects it, but an offline/failing metadata request can display the wrong build.

### P2 — Visual regression coverage is narrow
The stored visual regression covers only Restaurant start at 393x852.
It does not baseline Home, Dine In/Dine Out hero photography, Meal swipe, Restaurant swipe, Winner, Details, Notes, Settings, History, or share/install UI.

### P2 — Mobile utility buttons are smaller than conventional 44px touch targets
Restaurant card utility buttons are progressively overridden down to roughly 32–36px on narrower layouts.
This includes Choose / Details / Website controls.
The major Cut/Maybe/Back decision controls remain appropriately large.

### P2 — Home tagline mismatch
Current Home subline remains `Swipe. Dinliminate. Enjoy.`, while the product direction previously selected for the current experience was `Beautifully swipe until it’s revealed.`.

### P3 — CSS debt / stale selectors
The stylesheet still contains obsolete selectors such as `#iphoneHelp` after the HTML migrated to icon-only Home actions, plus multiple historical overrides for the same controls.
This increases maintenance and regression risk.

### P3 — History calendar X behavior
When a calendar day contains multiple history entries, the visible X is attached to only the first entry id. Additional entries remain accessible through the calendar/list but are not individually deletable from the calendar cell.

### P3 — Custom meal delete contains duplicate note deletion
The custom meal delete path calls `delete S.notes['food:'+id]; saveItemNotes();` twice.

## Positive findings
- Meal/Restaurant Details Notes are correctly shared and now have inline Edit + × controls.
- Meal and Restaurant winner flows are wired.
- Add-to-phone and Share Home actions are delegated and preserve existing IDs.
- Swipe motion code uses a single pointer path, requestAnimationFrame, pointer capture, and duplicate activation suppression.
- History, custom meal management, Reset App Data, System Restore, and PDF export are wired in source.
