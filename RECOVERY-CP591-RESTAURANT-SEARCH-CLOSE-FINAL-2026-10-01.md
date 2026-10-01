# Recovery Checkpoint — CP591 — Restaurant Search Close Final — 2026-10-01

Parent: CP590

Tested behavior:
- Open Restaurant Search shows the search field and focuses it.
- Typing a query is supported by the existing input/debounce path.
- Closing Search calls closeRestaurantSearch() rather than merely hiding the field.
- closeRestaurantSearch cancels the debounce timer.
- It invalidates restaurantSearchSeq so a late search response cannot reapply the closed query.
- It aborts the active restaurantSearchController.
- It immediately resets the Find button busy state so the spinner/disabled state cannot remain stuck after cancellation.
- It clears the search field and S.restaurantQuery.
- It resets restaurantIndex and redraws the normal restaurant pool.
- Closing does not launch a replacement search.
- Reopening Search starts with a clean empty query.
- Static source test: all 10 targeted close-search assertions passed.

Latest fix commit:
e3acc13c109e27fcc61883b8f0ff6c3085e67a61

Release:
- build 591
- checkpoint CP591
- client asset versions v591
- service worker cache v433

Deployment note:
- GitHub main is the current source of truth.
- Netlify dinliminate112 has previously been observed serving CP584, so live browser verification requires publishing CP591 first.
