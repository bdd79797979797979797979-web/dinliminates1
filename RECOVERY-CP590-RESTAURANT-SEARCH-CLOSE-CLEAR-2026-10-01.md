# Recovery Checkpoint — CP590 — Restaurant Search Close/Clear — 2026-10-01

Parent: CP589

Completed:
- Closing Restaurant Search now explicitly ends the search session.
- Clears the pending restaurant-search debounce timer.
- Increments the restaurant search sequence so an in-flight result cannot re-apply after the search is closed.
- Aborts the active restaurant search request.
- Closes the search field and clears the typed restaurant query.
- Resets the restaurant card index and redraws the normal unfiltered restaurant view.
- Does not launch a replacement search when the search window is closed.
- Build/release metadata bumped to 590 / CP590.

Target behavior:
- Open search: search field appears and can search.
- Close search: X closes it, typed search text disappears, any pending/active search is cancelled, and the restaurant view returns to the current normal pool.
- Reopening search starts clean instead of carrying a stale closed search state.

Important:
- GitHub main is current source of truth at CP590.
- Netlify dinliminate112 has previously been observed serving CP584 and must be republished before live verification.
- CP589 actual-venue photo enforcement remains in place.

Latest close-search code commit:
96c2538a1e05fc677693d7294267349e3571cc79
