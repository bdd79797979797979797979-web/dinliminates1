# CP658 — Website Fetch Fallback Checkpoint
Date: 2026-10-01
Branch: cp658-jina-website-fetch-fallback
Base: CP657 aba396c8c03ae049a43a7d45abecc81c83889760

## Why this checkpoint exists
The exact public restaurant sites are confirmed, but the app still is not surfacing them consistently. CP657 addressed stale negative caching and retry behavior.

## Next change
Add a bounded public webpage-reader fallback for cases where direct server-side website fetching is blocked or incomplete. This will not bypass verification: the returned page content must still match restaurant identity/location/phone before the app presents Website.

## Public reference websites
Camacho's Famous: https://www.camachosfamous.com/
The Thirsty Goat: https://www.thirstygoatsango.com/
Chris' Pizza Village - Sango: https://chrispizzavillagetn.com/

No restaurant-specific runtime mapping will be added.
