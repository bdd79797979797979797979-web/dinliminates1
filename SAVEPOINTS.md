# Dinliminate Clean Rebuild — Save Points

## CP1 — Foundation
Commit: `cafaa294c6abaff689e625021e8926634644c0e7`
Home + Food engine + persistent saved rounds + reversible Quick Cuts + Add Food + dark winner.

## CP2A — Restaurant service
Commit: `4d4fa505e12c376f5879a7030b843c47eb2beed9`
Clean restaurant API with address resolve/suggestions, reverse geocoding, Overpass restaurant + fast_food search, dedupe, radius filtering, and photo fallback.

## CP2B — Restaurant wiring
Commit: `cb197b14a32e6cbaa572fdaf98fab8b4fed068bb`
Live address suggestions, selected coordinates, Find, Use My Location, live search result handling, and restaurant elimination controls wired into the clean UI.

## CP2C — UI cleanup
Commit: `673410682703bbf13376063aa88b8d9a6b289359`
One shared Quick Cut renderer and phone-sized autocomplete styling.

## CP3 — Visual/restaurant card pass
Commit: `6f587b3cce01a3bdd73f42c2ead01ff789b027a4`
Photo-based Quick Cuts, richer restaurant cards, details/website actions, and consistent restaurant presentation.

## CP5 — unified decision history
Commit: `49a3ddde1effffc71a316389bc810e61c6116d04`
Food and Restaurant Cut/Maybe/Back share reversible action history; restaurant winner flow added.

## CP6 — restaurant hours + Details
Commit: `8640b6828cad3526e5a8962dedada01c55e5b14c`
Open/Unknown versus explicit Closed filter and a real restaurant Details sheet.

## CP7 — winner detail cleanup
Commit: `7bdf52b22cbfe552bf67f13be69df5cdad758873`
Winner Details uses the selected result; restaurant card rendering is normalized.

## CP8 — deployable clean branch
Root promotion commits: `86e4592`, `74375cc`, `f8b1a46`, `7cfac19`; docs/consolidation follow.
The clean app, API, manifest and icon are at repository root on this branch.

## Recovery
Branch: `clean-rebuild` (deployable app at repository root)
Legacy production app remains on `main`.
Never force-push this branch. New work should land as another checkpoint commit.
