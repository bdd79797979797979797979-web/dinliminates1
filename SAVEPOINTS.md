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

## CP9 — merged fast-food coverage
Commit: `3a26cc96f35897039c18fd4f5b762e34181f72ce`
Search merges Overpass and Photon instead of stopping after the first populated provider.

## CP10 — radius + service syntax fix
Commits: `fc4dfb78a627fd185c60d43a81273a2f038a205f`, `f2fe707ebb45374e1b9ba55822cf2ae6a7f8782b`
Photon uses the requested radius up to 100 miles and the URL formatter was corrected and syntax-checked.

## CP11 — restaurant Hide persistence
Commit: `520345da6fbb5fbc5c41f4a3ec376cf2e515dc56`
Restaurant Hide persists in the saved search and can be restored from Settings.

## CP12 — overlay lifecycle
Commit: `288b64647fcf085fdb4b713cefa29d751ab2c5da`
Settings and Details overlays rebuild cleanly each time they open.

## CP13 — modular source structure
Commits: `750ee68`, `c2328d2`, `2a4e536`, `7e5606c`
Clean app split into root HTML, stylesheet, application script, and food data.

## CP14 — Food controls
Commits: `618a3f59249277ef8ec0153797c3303ee3642da1`, `6ff2362c137219c4e346285a26acab90b278a26a`
Food Add button is wired and Random Cut One is available without adding first-page clutter.

## CP15 — clean Pass Around
Commits: `e07e0b3579330307ee1a783f0f6a3b5161fa1fec`, `a47c6a78cffb955644ba09540a411850d318c070`
Added a self-contained social voting flow for Food and Restaurant with participant setup, keep/cut voting, handoff state, Back undo, survivor continuation, and winner handling.

## CP16 — Pass Around styling + saved Restaurant Continue
Commits: `83812fb`, `bd4554ac`
Pass Around has compact styling and saved restaurant rounds can surface Continue correctly.

## CP17 — static QA harness
Commit: `2200275855045b570c90f6f56d9c19909a1012b6`
Added `qa/clean-static-qa.js` to check critical HTML/app/API/data contracts and syntax on each clean checkpoint.

## CP18 — iPhone install help + About
Commits: `987c3df`, `7f32b21`
Added discreet Home install guidance and About text.

## CP19 — Manage Foods restore/delete controls
Commit: `ee3cfa9b11ba36c370c2607f283dc5e41682c1a9`
Hidden foods remain visible in Manage Foods for Restore; custom foods can be hidden or deleted.

## CP20 — History calendar actions
Commit: `e07798f90daf3c18ba7b829508eb60568be3bbc5`
History supports month navigation, date details, individual decision details, and small date-level X removal.

## CP21 — persistent restaurant hide registry
Commit: `9242864efa6873c833fc8769d5b1b6034a382a2c`
Hidden restaurants are retained in a registry and can be restored even after later searches.

## CP22 — compact Restaurant tools
Commits: `4402dd9`, `a5f502f`, `60ec794`
Restaurant Search, Open/Unknown Hours, and Pass Around sit together; restaurant text filtering uses the current result pool.

## CP23 — single-source application implementation
Commit: `7b470a225835c7e2f4a3d4d210242dbfae8bf86f`
Replaced accumulated JS override layers with one coherent application implementation.

## CP24 — final logic cleanup
Commits: `9d184efe0deaca6068b36984c00e602d345cfa1a`, `f7cc04f5f0ee3461b2cfbc3589f390ed4a303e09`
Winner Details type, modal cleanup, local History dates, and History menu entry fixed.

## CP25 — logic/style separation
Commits: `a76d66e`, `07f3c60`
Removed embedded CSS builders from JavaScript and centralized UI styles.

## CP26 — restaurant POI/photo cleanup
Commit: `343afe33faa8489c1feefa4cc9c305ba1859fc6d`
Photon is restricted to restaurant/fast-food POIs and named fast-food photo fallbacks are expanded.

## CP27 — winner resume + Potato data semantics
Commits: `070852e`, `4076e30`
Winner states no longer advertise Continue, and Potato is represented by its own primary food data classification.

## CP28 — stronger clean static QA
Commit: `ec6455c8aa33ab614f408d08ae0e50305072688d`
QA now enforces no JS stylesheet builder, explicit winner type persistence, the clean API version, and key food coverage.

## CP29 — opening-hours filter
Commit: `d699e981bb1ed0f66521bcbfa629561474fecc19`
Common opening-hours strings now inform the Open/Unknown versus Closed filter.

## CP30 — expanded Food catalog
Commit: `21fdfbe5c18038a5f2d2136d4d804cc207ee058c`
Added missing decision choices, including Burger & Fries, Goulash, Southern Vegetable Plate, Southern Vegetable Beef Soup, Buttermilk & Cornbread, and Fish & Chips.

## CP31 — Pass Around undo correctness
Commit: `2b1af9f99502eca7b23992f74e95ecee08527343`
Pass Around Back now restores the exact choice that was cut.

## CP32 — custom Food recipe/photo support
Commit: `b9811eb405292570416de492f75fb9df1edb62dc`
Add Food accepts optional photo and recipe/notes fields; Details displays saved recipe content.

## CP33 — QA protection for custom Food support
Commit: `d730ef7b70870003f8b5e3079673e94b38b907ae`
Static QA now enforces the custom recipe/photo contracts.

## CP34 — Photon-primary restaurant search
Commit: `f1cabd38963b51ddb88022a99e0319a1b82523cd`
Photon is the primary restaurant provider; bounded Overpass fallback is used only when Photon returns no results.

## CP35 — QA state hook
Commit: `3a8d646430ae4fe1df0336025ff749a7d9b443f0`
Added QA-only state inspection behind `?qa=1`.

## CP36 — expanded QA state
Commit: `19471862f73565ef7da63a9979a5c0e65fb2b4e3`
QA state exposes custom foods and full restaurant IDs without affecting normal builds.

## CP37 — Chromium smoke suite
Commits: `56d7c32`, `9ad5d01`
Added a browser smoke suite and CI workflow covering the core Food/Restaurant interactions.

## CP38 — search race + dedupe + hours normalization
Commits: `8a04318`, `e5cc883`, `8124a85`
Autocomplete ignores stale responses, restaurant duplicates merge more reliably, and opening-hours day matching is case-normalized.

## CP39 — static QA sync
Commit: `5bb79ad2df62739b05df851a6ee7ecf2510bbfd8`
Static QA now expects the current `clean-r6` service.

## CP40 — release QA gate
Commit: `f795a04a5e6b63b446f67db384df3e108b909928`
Added a non-runtime release gate marker and kept Vercel/Netlify preview verification separate from production.

## CP41 — restore complete app after QA catch
Commit: `98d25db3e19a39559d062175f2d45c6f189ad116`
Restored the full clean application after a bad matcher patch truncated `app.js`, then safely reapplied the case-normalized hours matcher. Syntax checks pass.

## CP42 — align static QA with clean app architecture
Commit: `464451389ed053d5c9d064737e25c74216e988cc`
Static QA now checks the actual single-source app function names rather than retired prototype names.

## CP43 — correct API-mode QA contracts
Commit: `cc08322098de5cbec321a33199e06d4d602f9da4`
Static QA now matches the clean API's actual JavaScript mode comparisons.

## CP44 — black winner QA
Commits: `a09781f`, `8488ea1`
Winner window is explicitly black and browser QA asserts the black presentation.

## CP45 — live provider smoke test
Commits: `aac5c60`, `17f6886`
CI now runs the real clean restaurant handler against live geocoding and restaurant providers before browser smoke.

## CP46 — fix Food data browser global
Commit: `e412efa5821072aa6f14a04da70f9e34d8dded1d`
Food data now explicitly publishes `window.DINLIMINATE_FOODS`, fixing the empty Food runtime found by Chromium QA.

## CP47 — guard Food data loading in QA
Commit: `5f5bf9f5b14f77f10db88c7683ac10fb971b02cc`
Static QA now enforces the browser data-global contract.

## CP48 — iPhone browser geometry QA
Commit: `eeafe2ccecaf6be9e65153b6dd931119cb18ebd8`
Chromium smoke now checks for horizontal overflow and captures Food card/control geometry at 393×852.

## CP50 — remove Food startup timing dependency
Commit: `273805f2ee3f6088c938be862a64cf178a4601dc`
Food reads the default catalog when building a round instead of capturing it once at script startup.

## CP51 — Food catalog runtime diagnostic
Commits: `516fafcc`, `ba879e9`
QA state now exposes catalog count and the browser suite verifies the Food catalog is loaded before the round begins.

## CP52 — browser error capture
Commit: `bc79aa9268d1f09d854808799cc079e6573064c5`
Chromium QA now fails on uncaught page errors or console errors.

## CP53 — Restaurant Search derived-category matching
Commit: `942649220d327b07e70496f71bb5025cbb926262`
Restaurant text search now includes the app-derived category, so searches such as Pasta match Italian restaurants classified as Pasta.

## CP54 — deterministic data script loading
Commit: `f1602b7188657c85d4463f60d8075363e7dd7c25`
Removed `defer` from the small Food-data and app scripts at the bottom of the page so the catalog is guaranteed to exist before app initialization.

## CP55 — script-order regression guard
Commit: `4e653ac58c5504f0dc632047b4d6e2845fa91ade`
Static QA now enforces synchronous `data/foods.js` then `app.js` loading at the bottom of the HTML.

## CP56 — Food data browser diagnostic
Commit: `55a8193a79bd87a5f48d622dad6bcef9bb5d8c95`
Browser QA now records the Food-data response status, request failures, runtime catalog count, page errors, and console errors before the first interaction.

## CP57 — fix malformed Food data separator
Commit: `ab9fbd19ac700591abc5f9392978229b1c466af7`
Fixed the missing comma between Fruit Bowl and Burger & Fries; sandbox execution now constructs exactly 31 Food objects.

## CP58 — browser Home selector fix
Commit: `8915dc6307f344aec9a452895dfda6dd1738e23f`
Chromium QA now scopes the Food-to-Home navigation control instead of using an ambiguous duplicate selector.

## Recovery
Branch: `clean-rebuild` (deployable app at repository root)
Legacy production app remains on `main`.
Never force-push this branch. New work should land as another checkpoint commit.
