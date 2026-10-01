# RECOVERY-CP639-CP591-RESTAURANT-PHOTO-FIX-2026-10-01

Base restored to CP591: a8bd9299dfea19ee997d8866fcc0b58dd2b7b3e7

Final CP639 changes:
- Removed generic chain/cuisine stock restaurant images from restaurant data.
- Kept exact OpenStreetMap POI images as the only direct provider-photo fallback.
- Restaurant cards/details/history start with a neutral restaurant placeholder and upgrade only from the restaurant-photo endpoint.
- Removed the blob URL handoff that caused verified images to fail in browser cards.
- Added exact-address verified public photo data for four Clarksville fixtures:
  McDonald's 724 Sango Rd
  The Thirsty Goat 4044 US-41 ALT South
  Ruby Tuesday 2239 Madison St
  Chipotle Mexican Grill 2296 Madison St
- Kept the public-page resolver for restaurants outside the fixture data.
- No Google API credentials.

Verification:
- Syntax checks PASS.
- Architecture checks PASS.
- Pure checks PASS.
- Live resolver smoke test PASS for all four fixtures:
  McDonald's — image/jpeg, 40,563 bytes
  The Thirsty Goat — image/jpeg, 228,319 bytes
  Ruby Tuesday — image/avif, 109,852 bytes
  Chipotle Mexican Grill — image/jpeg, 98,111 bytes
- Every returned fixture photo included a source URL/provenance header.

Status:
- This branch is ready to merge into main.
- Production deployment is not being claimed until the new main deployment is verified.
