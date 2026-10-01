# CP656 — Website Discovery Reliability
Date: 2026-10-01
Branch: cp656-website-discovery-reliability
Base: CP655 (e8da315021b98cbdb1437cf0625240a6af12a90a)

## User-observed issue
The CP655 architecture was deployed, but the expected local restaurant websites were not appearing in the Restaurant card flow. This checkpoint exists before the next reliability changes.

## Planned fix
Strengthen discovery so it does not depend on one Bing HTML shape:
- direct domain candidate probing generated from restaurant name/brand/city/state;
- more tolerant Bing result extraction;
- DuckDuckGo HTML discovery as a second public no-credential search source;
- retain Facebook/Instagram as discovery and official-page sources;
- retain directory pages only as bridges to actual restaurant websites;
- verify every external website candidate with restaurant identity/address/phone evidence before presenting it as Website;
- keep Google search as the final fallback only.

## Safety
No Google Places API credentials.
No restaurant-specific hardcoded website mapping.
No directory/social destination is mislabeled as the restaurant website.

## Recovery
CP655 remains the immediate rollback point.

## CP656 implemented
The reliability pass is now on the branch:
- deterministic domain candidate probing precedes search engines;
- search-result parsing is no longer tied only to Bing's `b_algo` markup;
- Bing, DuckDuckGo, and Google web search are available as public discovery sources with no API credentials;
- Facebook/Instagram remain discovery/official-page sources;
- directory pages remain bridge-only;
- verified website candidates still require restaurant identity plus location/phone evidence;
- service-worker shell cache marker was bumped to CP656 so the new resolver code is not held behind the old shell cache.

## Known public QA targets
Public web search currently confirms:
- Camacho's Famous — camachosfamous.com
- The Thirsty Goat — thirstygoatsango.com
- Chris' Pizza Village - Sango — chrispizzavillagetn.com

These domains are QA expectations, not restaurant-specific runtime mappings.

## Hosted validation
Netlify reported the CP656 preview deployment status as SUCCESS at:
https://deploy-preview-128--dinliminate112.netlify.app

The direct live API response could not be fetched from this execution environment, and GitHub Actions is returning no workflow-run records for the branch, so no false live resolver PASS is recorded here.

## Recovery
The previous CP655 head remains the rollback point before CP656.
