# Dinliminate P632 — UX control pass

## Requested changes
- Prominent Tinder-style Cut / Maybe actions in Food and Restaurants.
- Smaller Hide / Back actions in both modes.
- Restaurant Distance utility button removed; miles selector remains.
- Restaurant Quick Cuts restored with dedicated photo-backed buttons.
- Pass Around made secondary in both modes.
- Restaurant Details / Website actions kept visible inside cards.
- Restaurant card imagery refreshed with restaurant-specific data when available plus a controlled fallback.
- Food and Restaurant rounds automatically resume where the user left off.
- “Back to start” explicitly clears the saved round and returns home.

## Static QA
- launch-hardening.js syntax: PASS
- restaurant-search.js syntax: PASS
- all inline application scripts: PASS
- P632 version markers consistent: PASS
- service-worker registration absent: PASS
- Restaurant Distance button refs: 0
- Restaurant Quick Cut photo mapping present: PASS
- Food / Restaurant round persistence hooks present: PASS

## Phone-width UI QA
Viewport: 390x844
- Food Cut width: 130px in isolated control harness
- Food Maybe width: 130px in isolated control harness
- Food Hide width: 42px
- Food Back width: 42px
- Food Quick Cuts: 15, with photo-backed first item
- Restaurant utility buttons: 2 (Open now, Search)
- Restaurant Quick Cuts: 17, with photo-backed first item
- Restaurant card Details: visible
- Restaurant card Website: visible
- Pass Around: outside primary action row in both modes
- Menu / Back-to-start action: present
- Page errors during deterministic browser harness: none

## Deployment QA
- Production deployment: READY
- Build errors: none
- Runtime error clusters in final check window: none
- Production deployment ID: dpl_87tc99mzBJ5rEwHffBZaWpRoNoNV
