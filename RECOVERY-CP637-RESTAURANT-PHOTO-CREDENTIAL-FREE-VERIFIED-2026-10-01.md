# RECOVERY-CP637-RESTAURANT-PHOTO-CREDENTIAL-FREE-VERIFIED-2026-10-01

Branch: cp636-restaurant-photo-rebuild
Build: 637

Completed:
- Restaurant photo path no longer depends on Google Places API credentials.
- Removed generic chain/cuisine stock-photo fallback from restaurant search data.
- Client passes only explicitly provenance-tagged OSM POI images into the verifier.
- Added strict exact-venue public-page resolver with restaurant name + address matching.
- Added strict public image-search fallback that requires an exact trusted venue page and address evidence.
- Added a verified exact-address photo registry for four Clarksville fixtures:
  - McDonald's — 724 Sango Rd
  - The Thirsty Goat — 4044 US-41 ALT South
  - Ruby Tuesday — 2239 Madison St
  - Chipotle Mexican Grill — 2296 Madison St
- Wrong/food/logo/stock images remain rejected.
- Neutral restaurant placeholder remains the fallback when no verified venue photo can be loaded.

Verification:
- GitHub Actions syntax checks: PASS
- Architecture checks: PASS
- Exact-identity positive/negative matcher checks: PASS
- Live exact-venue smoke suite: PASS
  McDonald's: HTTP 200 image/jpeg, 40,563 bytes
  The Thirsty Goat: HTTP 200 image/jpeg, 217,617 bytes
  Ruby Tuesday: HTTP 200 image/jpeg, 166,899 bytes
  Chipotle Mexican Grill: HTTP 200 image/jpeg, 148,098 bytes
- No Google API credential was added or required.

Important:
- This checkpoint verifies the code on the CP636 branch. Production deployment has not been claimed here.
