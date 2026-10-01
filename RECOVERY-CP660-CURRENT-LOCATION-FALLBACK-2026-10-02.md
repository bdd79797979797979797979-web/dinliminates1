# Recovery Checkpoint — CP660 — Current Location Fallback — 2026-10-02

Parent: CP659 app entry fix.

## Problem addressed

The Restaurant screen's Use My Location flow relied entirely on `navigator.geolocation`. When the browser/site denied, blocked, or could not resolve that request, the app stopped with a permission/timeout message and did not continue into Restaurant search.

## CP660 changes

1. Keep device/browser geolocation as the first choice.
2. When browser geolocation is unavailable, denied, or times out, call a server-side `ip-location` fallback using the visitor connection IP.
3. Use the fallback coordinates to run the normal Restaurant search automatically.
4. Clearly label the fallback as `Approximate network location` so it is not presented as precise GPS.
5. Add a five-to-seven-second bounded request timeout and preserve the existing search flow.
6. Bump release/assets/service-worker markers to CP660.

The IP geolocation service documentation states that its latitude/longitude are approximate and may correspond near the population center rather than a precise household location. citeturn870530search0turn870530search1

## Recovery

Branch: `cp660-current-location-fallback`
