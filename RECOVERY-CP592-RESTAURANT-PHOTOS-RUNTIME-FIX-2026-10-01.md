# Recovery Checkpoint — CP592 — Restaurant Photos Runtime Fix — 2026-10-01

Parent: CP591

Completed:
- Photo lookup was made fast enough for serverless execution by limiting discovery queries and verifying candidate pages in parallel rather than serially.
- Verified restaurant galleries are now accepted even when the individual image caption does not literally contain “exterior/front/building,” provided the page is an exact verified restaurant/location page and the candidate is not food-only imagery.
- Restaurant card photo hydration keys are aligned to id || canonicalId for both current and next cards.
- Generic/cuisine restaurant images are no longer preloaded as the restaurant card’s photo. The card starts with the neutral restaurant fallback until the real venue-photo resolver succeeds.
- Existing non-Google exact-venue rules remain in place.
- Build/release metadata: 592 / CP592.
- Client cache versions: app/styles v592; service worker v434.

Test findings:
- Real Clarksville sources confirm exact venue photography exists for local examples such as McDonald’s at 724 Sango Rd and The Thirsty Goat at 4044 US-41 ALT South. Tripadvisor identifies front/drive-thru/entrance photos for the McDonald’s listing, while the Thirsty Goat has an exact-location exterior image source. 
- CP589’s stricter “explicit venue word in image context” rule was too brittle; CP592 addresses that.
- The known Netlify production deployment for dinliminate112 and the known Vercel production deployment for dinliminates1 had previously been observed at CP584, so deployment identity still needs to be checked against the user’s actual 592 runtime.

Latest code commits:
- app.js runtime/photo renderer fix: a94dcb7b71b17200caad6ed6795d5b7644d527ad
- restaurant-photo runtime fix: 88179fc77532e65991a93915327c3e2cd35c9e20
