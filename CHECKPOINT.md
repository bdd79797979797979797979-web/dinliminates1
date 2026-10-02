# CURRENT CHECKPOINT - BUILD 738 / CP738

Date: 2026-10-02

Working branch: cp728-hungry-reveal-home-polish
Current checkpoint: CP738

CP738 changes:
- Deep-audited restaurant radius searching through the client request, API radius propagation, primary provider limits, Overpass wide-area discovery, geographic batching, deduplication, final distance filtering, caching, and QA coverage.
- Fixed the 100-mile provider-cap problem by anchoring Photon/ArcGIS/Google primary searches to the same 50-mile provider envelope used for the 50-mile tier, while retaining the requested 100-mile final distance filter.
- Strengthened 100-mile Overpass discovery so each geographic batch uses two independent Overpass mirrors instead of a single mirror.
- Expanded wide-search timeboxes to 10 seconds so the 100-mile discovery layer is less likely to be cut off mid-search.
- Added diagnostics for providerSearchRadiusMiles and updated radius regression coverage to protect the new behavior.
- Service worker cache bumped to v738.

Root cause confirmed:
- Radius forwarding itself was correct and client/server caching keys already included the radius.
- At 100 miles, Photon and ArcGIS were searching a much larger area while still capped per request, so their capped result sets could look like the 50-mile result set.
- Google Places is limited to about 31 miles per request by its 50,000-meter cap.
- Wide Overpass batches were each dependent on one mirror, so a single provider failure could erase a geographic slice of the 100-mile search.
- The existing 13-center 50-mile-circle geometry is spatially overlapping; the bigger reliability problem was provider limits and batch redundancy, not final distance filtering.

Verification:
- Source-level API patch validated by anchor checks.
- Radius QA updated for API r26, 50-mile provider anchoring, 10-second wide-search timeboxes, and redundant Overpass mirrors.
- Live preview deployment is still stale relative to CP738; do not treat the current Vercel preview as CP738 until a new deployment is available.
