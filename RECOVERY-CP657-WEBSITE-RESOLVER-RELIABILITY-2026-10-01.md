# CP657 — Website Resolver Reliability Checkpoint
Date: 2026-10-01
Branch: cp657-website-resolver-finalization
Parent: CP656 final head 547c403e81f1e4b6278d4c8704bd3056b15cf49f

## Status before next change
The resolver has been broadened with deterministic domain candidates plus Bing/DuckDuckGo/Google public search discovery and social/directory bridge support.

## User-observed issue
The app is still not visibly surfacing the verified local restaurant websites consistently.

## Next reliability change
The next pass will specifically address transient resolver failures and stale negative caching, while preserving the generic discovery architecture and continuing to create recovery checkpoints.

## Verified public websites used as QA references
Camacho's Famous: https://www.camachosfamous.com/
The Thirsty Goat: https://www.thirstygoatsango.com/
Chris' Pizza Village - Sango: https://chrispizzavillagetn.com/

No restaurant-specific runtime mapping is intended.
