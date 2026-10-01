# CP655 — Official Web Presence Resolver
Date: 2026-10-01
Branch: cp655-official-web-presence-resolver
Base: CP654

## Goal
Make restaurant website/contact discovery substantially smarter without Google API credentials or restaurant-by-restaurant hardcoded exceptions.

## Resolver priority
1. Provider-supplied website.
2. Existing known brand domain.
3. Multi-query public Bing web discovery using restaurant name, address/city, and phone.
4. Verify direct website candidates against restaurant identity and location.
5. Use Facebook/Instagram only as discovery/verification sources; never mislabel them as the restaurant website.
6. Use directories as bridge sources only when they expose an external restaurant website link.
7. Use a verified official Facebook/Instagram page as an "Official Page" fallback when no actual website is verified.
8. Fall back to Google search only when no verified website or official social page is established.

## Verification
Candidate verification uses:
- restaurant name/brand token matching;
- address number and city/location tokens;
- phone-number matching;
- hostname/brand alignment;
- site-content signals such as contact, locations, menu, hours, order.

Blocked destination hosts include Google/Bing, Yelp, TripAdvisor, Facebook, Instagram, delivery services, and common restaurant directories. They can be queried for discovery but cannot become the Website destination.

## Client behavior
Restaurant cards and details now distinguish:
- Website
- Official Page
- Search Website

Verified website/social results are cached locally for 14 days. Server-side positive results are cached for 7 days; negative results for 24 hours.

## Tests
Deterministic regression coverage includes:
- no Camacho-specific mapping;
- Facebook/social vs actual website separation;
- directory-to-website bridging;
- blocked directory rejection;
- exact name/address/phone verification;
- search-result fallback verification;
- provider website priority.

Live PR QA covers:
- Camacho's Famous → camachosfamous.com
- HoneyBaked of Clarksville → honeybaked.com
- The Thirsty Goat → thirstygoatsango.com
- Chris' Pizza Village - Sango → chrispizzavillagetn.com

The expected sites were independently checked in public web search before being added to live QA.

## Hosting
Netlify Preview will be the current validation target because Vercel build checks have recently been rate-limited. Browser automation is not available in this environment, so visual click-through is not claimed until performed externally.

## Recovery
CP655 is based on the protected CP654 branch. The preceding CP654 recovery commit remains available as the clean rollback point.
