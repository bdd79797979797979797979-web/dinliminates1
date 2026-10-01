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

## CP658 implemented
- Added a bounded public webpage-reader fallback using Jina Reader for cases where the restaurant site blocks or defeats direct server-side fetches. Jina documents `r.jina.ai/<URL>` as a server-side URL reader. citeturn677020search0turn677020search3
- The reader fallback is limited to six attempts per resolver call and is still followed by the same restaurant identity/location/phone verification.
- No social or directory URL can become the Website destination merely because it was discovered.
- Client/server retry and cache fixes from CP657 remain intact.
- Client and service-worker cache markers are now CP658.

## Public website verification references
- Camacho's Famous: https://www.camachosfamous.com/ (exact Clarksville address shown on the public site). 
- The Thirsty Goat: https://www.thirstygoatsango.com/ (exact Clarksville address shown on the public site).
- Chris' Pizza Village - Sango: https://chrispizzavillagetn.com/ (exact Sango/Clarksville address shown on the public site).

## Hosted validation
A new preview will be created for the CP658 branch. No live resolver PASS is recorded until the runtime endpoint itself can be reached from the test environment.
