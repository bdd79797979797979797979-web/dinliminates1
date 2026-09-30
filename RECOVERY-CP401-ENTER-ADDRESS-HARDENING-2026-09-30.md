# Recovery Checkpoint — CP401 — Enter Address Hardening Applied — 2026-09-30

Branch: cp348-search-six-point-certification-2026-09-30
Parent recovery point: CP400

Changes:
- Added address completeness detection so complete-looking full addresses can still resolve directly.
- Added top-suggestion selection when Enter is pressed on a partial/ambiguous-looking address with visible suggestions.
- Preserved explicit Arrow Up/Down selection behavior.
- Added suggestion invalidation that clears the debounce timer and aborts in-flight autocomplete requests before direct search or selection.
- Added ARIA active-descendant tracking for keyboard-highlighted suggestions.
- Bumped app.js cache version from v346 to v347.
- Expanded six-point restaurant certification for partial-vs-complete Enter behavior.

Expected behavior:
- Partial address + visible suggestions + Enter -> first visible suggestion is selected.
- Explicit keyboard-highlighted suggestion + Enter -> highlighted suggestion is selected.
- Complete-looking street address + Enter -> direct resolve/search.
- Search/selection invalidates stale autocomplete requests.
