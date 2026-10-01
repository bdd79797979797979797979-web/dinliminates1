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

## CP657 final implementation
- broadened deterministic domain candidates to include common local-name variants and location/state suffix patterns;
- reduced negative website cache duration from 24 hours to 10 minutes so transient misses recover quickly;
- added a one-time forced client retry after a 900ms delay when the resolver returns neither a website nor an official social page;
- added a `refresh=1` API option that bypasses a cached miss for the retry;
- retained multi-source public discovery and exact verification;
- bumped client/service-worker cache markers to CP657.

## Verification references
Public web search confirms the exact current sites:
- Camacho's Famous: https://www.camachosfamous.com/
- The Thirsty Goat: https://www.thirstygoatsango.com/
- Chris' Pizza Village - Sango: https://chrispizzavillagetn.com/

No restaurant-specific runtime mapping was added.

## Hosted validation target
Expected preview:
https://deploy-preview-129--dinliminate112.netlify.app

Hosted runtime API access is not available from this execution environment, so live website-return results are not claimed until the deployment status and external runtime test are available.
