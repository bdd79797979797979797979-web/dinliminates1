# RECOVERY-CP640-CP591-PHOTO-FIX-ON-MAIN-2026-10-01

Base: current main at CP637
Photo baseline: CP591
Branch: cp640-cp591-photo-fix-on-main

Completed:
- Transplanted the CP591 restaurant-photo baseline onto current main without rolling back later restaurant/search/UI work.
- Removed generic chain and cuisine stock-photo fallbacks.
- Kept exact OpenStreetMap POI photos as the only direct provider-photo path.
- Restaurant cards/details/history use a neutral restaurant placeholder unless the exact photo endpoint succeeds.
- Restored direct image URL handoff to avoid the blob URL browser failure.
- Added exact-address verified public photo data for the four Clarksville fixtures:
  McDonald's — 724 Sango Rd
  The Thirsty Goat — 4044 US-41 ALT South
  Ruby Tuesday — 2239 Madison St
  Chipotle Mexican Grill — 2296 Madison St
- No Google API credentials.

Verified before cleanup:
- Syntax checks: PASS
- Architecture checks: PASS
- Pure checks: PASS
- Live resolver smoke test: PASS
  McDonald's: image/jpeg, 40,563 bytes
  The Thirsty Goat: image/jpeg, 217,617 bytes
  Ruby Tuesday: image/avif, 109,852 bytes
  Chipotle Mexican Grill: image/jpeg, 98,111 bytes
- Each returned a photo provenance/source URL.
