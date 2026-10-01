# CP649 — History Calendar Photo Polish
Date: 2026-10-01
Branch: cp649-history-calendar-polish
Base: CP648 photo quality gate

## What changed
- Kept the existing monthly History calendar structure.
- Kept chosen meal/restaurant photos on their saved dates.
- Improved date cells so saved photos read more clearly without turning History into a separate journal/list redesign.
- A single saved decision now gets a cleaner photo treatment plus a small Food/Restaurant label.
- When two decisions share the same date, the date shows two side-by-side photos and each photo is tappable to open its own details.
- When more than two decisions share a date, the first two remain visible and a small +N indicator shows additional entries.
- Today's date gets a subtle premium outline even when it has no history.
- Kept the existing X-out, month navigation, Clear all, and history list behavior.
- Added accessible labels to month controls and calendar history targets.

## Files
- app.js
- styles.css
- app-release.json

## Safety
- No restaurant photo resolver changes.
- No Google API credentials or Google photo API dependency added.
- No existing history data format migration was introduced.

## Testing status
Code changes are committed on the branch. Hosted visual verification is the remaining gate; no claim of live deployment is made until a preview is available and tested.
