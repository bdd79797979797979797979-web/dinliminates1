# RECOVERY-CP642-CP591-FAST-RESTAURANT-PHOTOS-2026-10-01

Base: CP591-based CP640
Branch: cp642-591-fast-photo-fix
Build: 642

Fix:
- Restores the CP591-based restaurant photo path.
- Removes the slow server-side remote image download from the request path.
- Verified venue photos now return through a fast image-proxy redirect.
- Exact verified photo registry remains address-matched.
- OSM photos are accepted only when explicitly provenance-tagged by the restaurant data provider.
- Official restaurant websites are checked first when a usable exact-venue image is available.
- Public venue/photo search is secondary and must carry exact restaurant/address evidence.
- Generic chain/category/stock photos are not used.
- No Google API credentials are required.

Verification:
- GitHub Actions syntax: PASS
- Architecture checks: PASS
- Exact fixture response checks: PASS
  McDonald's — 724 Sango Rd
  The Thirsty Goat — 4044 US-41 ALT South
  Ruby Tuesday — 2239 Madison St
  Chipotle Mexican Grill — 2296 Madison St
- Four fixtures returned HTTP 302 verified photo redirects through wsrv.nl.
- No production deployment is claimed by this checkpoint.
