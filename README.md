# Dinliminate P634 — Professional Button & Control Pass

This release is the P634 UI control pass for the Dinliminate food and restaurant decision surfaces.

## Changes
- Standardized Food and Restaurant decision controls into four equal-width primary actions.
- Moved Pass Around to a dedicated full-width secondary row so it never becomes an orphaned narrow button.
- Standardized Restaurant utility controls (Open/unknown hours, Search, Pass Around).
- Standardized restaurant card Details / Website controls.
- Increased Menu button visibility and changed the visual icon from three dots to a clear menu glyph.
- Increased visibility of close buttons on light Menu/History sheets.
- Restyled History Calendar month navigation and day labels for dark-on-light contrast.
- Ensured the active Saved/History tab uses readable contrast.
- Kept button sizing/touch targets consistent on small phones.
- Kept P634 version markers synchronized between the app, launch layer, and restaurant API.

## Validation
- `node --check launch-hardening.js`: PASS
- `node --check api/restaurant-search.js`: PASS
- All inline application scripts: PASS syntax check
- 390px Food control geometry: 4 equal actions + full-width Pass Around
- 390px Restaurant control geometry: 4 equal actions + full-width Pass Around
- Menu button visibility: PASS
- History calendar navigation contrast: PASS
- Production Vercel deployment: READY
- Production runtime error scan: no runtime errors in final 10-minute check

Real-device iPhone/Android certification remains a separate physical-device test gate.
\n\nLaunch QA marker: p677-live-preview-trigger-2026-09-27