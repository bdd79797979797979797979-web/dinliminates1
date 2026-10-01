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
