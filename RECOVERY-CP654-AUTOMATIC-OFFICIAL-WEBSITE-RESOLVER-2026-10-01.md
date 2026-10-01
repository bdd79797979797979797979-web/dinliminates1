# CP654 — Automatic Official Website Resolver
Date: 2026-10-01
Branch: cp654-automatic-official-website-resolver
Base: CP653

## Goal
Improve the Restaurant card so a legitimate official website is used instead of a generic Google website search when the restaurant provider does not supply a website.

## Design
Website priority:
1. Provider-supplied HTTPS website.
2. Existing known brand domain for established chains.
3. On-demand exact business website discovery using public Bing web search.
4. Verify the candidate destination page against restaurant name/brand and exact address/location signals before accepting it.
5. Cache verified website results server-side for 7 days and client-side for 14 days.
6. Only fall back to Google website search when no verified official site can be established.

## Important
- Removed the CP653 Camacho's-specific hardcoded website mapping.
- Camacho's now exercises the same generic discovery path as other restaurants.
- HoneyBaked of Clarksville is included as a live QA example for a store-specific official page.
- Blocked directory/delivery/search/social domains are not accepted as official websites.
- Bing is used only as a discovery/search source, never as the accepted website.

## Client behavior
- Restaurant cards and restaurant details add an on-demand `mode=website` request only when no website is already known.
- The current card updates from "Website Search" to "Website" when a verified URL is returned.
- Verified URLs are saved in local browser storage for reuse on later sessions.
- Existing restaurant search speed is not burdened with one web search per restaurant.

## API
- Added `mode=website` to `api/restaurants.js`.
- API version bumped to r23.
- Added bounded Bing search, official-page verification, blocked-host filtering, and server memory caching.

## Tests
- Added deterministic regression coverage in `qa/restaurant-website-resolver-smoke.cjs`.
- Added live PR QA in `.github/workflows/cp654-website-qa.yml` for:
  - Camacho's Famous
  - HoneyBaked of Clarksville
- Client asset markers bumped to 654.

## Current hosted status
Preview deployment and live QA are the final validation gates.
