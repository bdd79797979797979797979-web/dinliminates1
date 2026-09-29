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

## CP59 — browser async assertion fix
Commit: `b1ad42c3d76a869eda25816bac62871a8f48e7b1`
Fixed the browser QA address assertion to await Playwright inputValue().

## CP60 — Central-time browser QA
Commit: `767287a0e5e682b3c6d9393f53445a10e291ffdc`
Chromium QA now uses `America/Chicago` so restaurant opening-hour tests match the intended user timezone.

## CP61 — explicit Restaurant Hide QA
Commit: `b99758e99d123020dc7556abdd513fe67af7e468`
Browser QA explicitly accepts the Hide confirmation dialog and logs the resulting hidden-restaurant registry.

## CP62 — browser dialog handler cleanup
Commit: `5fc97a970effec969356a82fb68037ae08752656`
Removed the duplicate global Playwright dialog handler so the Restaurant Hide confirmation is handled exactly once.

## CP63 — resume checkpoint
Current recovery point after CP62. Browser QA is in progress; no production merge or Vercel promotion has been performed.

## CP64 — Restaurant Hide blocker diagnostic
Commit: `329a38fc76a16f7e6bd90964900c1d28f25490a6`
Browser QA now inspects modal backdrops and the element under the Hide button before tapping it.

## CP65 — Settings restore QA
Commit: `04abe7303fd901901ffe464e70b5530df8a52a1d`
Browser QA now verifies the Settings modal structure and confirms Restaurant Restore clears the hidden registry.

## CP66 — Settings modal diagnostic
Commit: `18ffbf0259e595ee0c3d7253cc55164809d47547`
Browser QA now logs whether the Settings modal is created, whether the drawer closes, its computed visibility, and its DOM rectangle.

## CP67 — browser QA Settings navigation
Commit: `3a998d088f53082a6b50e3d8ba8726406b1e2b40`
Restored the browser smoke test after an accidental empty-file write, then fixed the post-Settings-Restore navigation to close the Settings modal and use the visible Restaurant Home control. The app itself was not changed by this checkpoint.

## CP68 — live fast-food provider fallback
Commit: `c52e1c5429589f2fc457ec2ea18b57763ca4b249`
Restaurant search now falls back to a fast-food-only Overpass query when Photon returns restaurants but no fast-food POIs, preventing the combined result pool from silently omitting chains such as McDonald’s. Health version bumped to `clean-r7`.

## CP69 — custom Food add closes cleanly
Commit: `b46740beaff282b81882a7eb1f1878a759ca4dac`
Successful custom Food creation now closes the Manage Foods modal instead of immediately reopening its backdrop over the active Food round. The active Food screen refreshes after the add.

## CP70 — QA checkout pin + API version alignment
Commits: `487dca7bf06f2ed38941b294d307347077063211`, `2c4494f6933b2d63214916291ac6d098eac2d092`
GitHub Actions now checks out `${{ github.sha }}` explicitly so each run tests the exact triggering commit. The Restaurant API search response version now also reports `clean-r7`, matching health and the fast-food fallback release.

## CP71 — static QA aligned to clean-r7
Commit: `02ac1b40a6f8c65210f13ba4d143fa09397e31cf`
Updated the clean static API contract check from the retired `clean-r6` response version to `clean-r7` after the fast-food fallback release.

## CP72 — live fast-food fallback + regression gate
Commits: `d5f153fd27494f1002591e4a64b7087ef2f82c5e`, `ae74c4ed73c5226befc94a6dd401a057a754879e`
Broadened the fast-food Overpass fallback to search `amenity=fast_food` plus major chain names and brands. Live API smoke now requires at least one fast-food result instead of allowing a zero-fast-food search to pass.

## CP73 — Photon named-chain fast-food fallback
Commit: `a3ad1f647579116edaae5f6526048eed1c3d0df1`
Added a live Photon fallback that searches major named chains when the generic restaurant/fast-food queries return no fast-food rows. Expanded the chain detector to match common punctuation variants such as McDonald’s and Wendy’s.

## CP74 — swipe parity QA
Commits: `471072a6460d99840f0582fde26c3122a2340838`, `17e9c4be780279ca9b4def6fe1580b662ff4e2a7`, `0dfe37747e487dce23d53aae16fe8667d42cffa4`
Food now has the same pointer-swipe behavior as Restaurant: left swipe = Cut, right swipe = Maybe. Browser QA covers Food left/right swipe and Restaurant right-swipe Maybe + Back restoration.

## CP75 — deterministic Restaurant swipe QA
Commit: `769cad0ea91de1b75bffca54593bdf0bdc4c03d`
Kept the Restaurant swipe implementation unchanged and made its browser assertion deterministic by dispatching the actual pointerdown/pointerup events directly on the live Restaurant card. This avoids coordinate flakiness on a dynamically rebuilt card while still exercising the production swipe handler.

## CP76 — swipe parity fully green
Commit: `937feefc03f520775db48c7114e8bef3957c34ba`
The release candidate passed the full QA gate after adding Food swipe support and deterministic Restaurant pointer-event coverage. Live provider smoke returned 50 restaurants including 44 fast-food results; browser smoke and static QA also passed.

## CP77 — stable resume manifest
Commit: `76b0d82d502c1847347ceaf96739a7393f42c3b0`
Updated `CHECKPOINT.md` with the exact CP76 green release-candidate commit, current QA coverage, recent fixes, and deployment status so an interrupted session can resume from one documented state.

## Recovery
Branch: `clean-rebuild` (deployable app at repository root)
Legacy production app remains on `main`.
Never force-push this branch. New work should land as another checkpoint commit.

## CP77 — Food feature-complete checkpoint
Source commits:
- app.js: 4d8fa05a6bcea1bedee37fdd2163b34b17aeef91
- index.html: 012c8bc540dc550bbfe349459a34fb36bc94d4ba
- styles.css: 795f275eb83a2110da1dbb517888c1f8f8eda105

Added:
- Food All Cut → hungry/no-choice result.
- Food Pass Around moved beside Add Food in the header.
- Device/iPhone photo upload for custom foods with client-side image resizing.
- Edit custom foods.
- Hide/restore and delete handling for foods, including deleted built-ins with restore.
- Settings now exposes deleted-food restore.
- Existing swipe/Quick Cut behavior preserved.

Verification status:
- Code committed as protected recovery point.
- Full CI/browser regression is the next gate before continuing the restaurant layer.

## CP78 — Restaurant data/detail checkpoint
Source commits:
- api/restaurants.js: df318c455053a9f722eea0b253c27ca861c7aed7
- index.html: 2dc1fcf46dbfbbf1911e82afe748fc1508c8f219
- app.js: 6c976374b43ccaa0d08369debf919f2406b581ed
- QA alignment: 783c4588be95b0ea8864de33a156a9a7792c43ca, a882be5aab24f8c06bdff81ac91d53ed2cdfa47e

Added:
- Chain-specific restaurant image fallbacks with non-overlapping mappings.
- Provider-supplied common menu/dish metadata retained and surfaced on restaurant cards/Details.
- "My Location" compact label.
- Static/browser QA coverage for restaurant menu data.

Recovery:
Restore branch to the commit immediately before CP78 if this checkpoint introduces a regression.

## CP79 — Premium Tinder-style swipe checkpoint
Source commits:
- app.js: 0ac977de700da1119ca482718afa0e5397386706
- styles.css: b8d4b4f345bfd2ca0578292214ea4dcf5bc46202
- browser QA: dafb93ef0ea0ee7f5b5c57f9974a0311c6f6bce4

Added:
- Live horizontal drag + tilt for Food and Restaurant cards.
- CUT/MAYBE visual stamp while dragging.
- Swipe-out transition before the decision is committed.
- Matching behavior remains left=Cut, right=Maybe.
- Browser QA now verifies the visual swipe state.

Recovery point: CP79.

## CP80 — Feature-complete release checkpoint
Source commits:
- data/foods.js: 16a3442da098048e222bdafbb160e70aede576b6
- app.js: 82b4406b4a967ef1aba95e9d1a03ef6d991a13e1
- index.html: ae1cc34c72fdb4df0d6b1733b6db1a1248253dc4
- QA: 3f4047c0d848838b29c7c6d4bf3eeb2d8026f3f2

Feature completion:
- Food All Cut and hungry/no-choice ending.
- Food Pass Around beside Add Food.
- Device photo upload with image resizing.
- Custom food edit, hide/restore, and permanent delete.
- Built-in food delete with restore and System Restore recovery.
- Built-in food recipe/detail notes.
- Hidden-food Settings Delete beside Restore.
- Restaurant chain-specific safe photo fallbacks.
- Provider menu/dish metadata surfaced on restaurant cards and Details.
- Compact "My Location" control.
- Tinder-style drag/tilt/stamp swipe for Food and Restaurant.

## CP81 — pre-hardening recovery point
Branch head before the next feature-hardening pass: `4827c8c08979574afc6d13f009f454f523617b33`.
CP80 contains the requested feature set through premium Tinder-style swipe behavior. Any subsequent edits should be reversible to this point.

## CP88 — Feature-complete hardening recovery point
Source head: `00c376a41365456ee3fb33640fe6eacaac01e3ba`
Includes:
- CP80 feature-complete Food/Restaurant feature set.
- CP83 modal cleanup hardening.
- CP84 address suggestion auto-search + regression coverage.
- CP85 deterministic device-photo upload QA.
- CP86 shared Settings/food-overlay cleanup.
- CP87 deterministic Settings drawer browser navigation QA.
Current verification:
- Static QA and live restaurant-provider smoke have passed on the current release sequence.
- Netlify deploy-preview-22 status is green.
- Latest Chromium release QA is queued/running against the synchronized PR revision; do not mark this checkpoint release-green until that browser gate completes.
- Vercel preview builds are currently blocked by the account build-rate-limit status.

## CP96 — Original-scope cleanup
Commit sequence ends at `10ce3ef30499fd8048afdf3c18a55611834d363e`.
- Removed non-original All Cut UI, logic, and QA coverage.
- Kept hungry/no-choice state and the premium Tinder-style Food + Restaurant swipe experience.
- CP95 remains the pre-change recovery point: `40a43b147e198f9243a18688a6fbc2504beb737f`.
- Savepoint branch: `savepoint-cp96-no-all-cut-2026-09-28`.
- QA-only PR: #23.
- Netlify deploy-preview-23 is green; Vercel build status is account-rate-limited.

## CP96 final — All Cut removed completely
Commit: `aa8e3f256e732e12e6e0fe721ba55da77b5c9303`
- Removed All Cut from app logic, HTML, static QA, and browser QA.
- Preserved hungry/no-choice ending and Tinder-style Food + Restaurant swiping.
- Final recovery branch: `savepoint-cp96-original-scope-final2-2026-09-28`.


## CP97 — core decision engine
Commit: `a605ef0f017f9314047cd6b2e8a81d7ae2ceca87`
- Normal Food Cut is item-specific instead of removing every choice sharing the same primary.
- Restaurant search state resets between searches.
- Permanent recovery branch: `savepoint-cp97-core-engine-2026-09-28`.

## CP98 — restaurant search rebuild
Commit: `780b056462bbb92d293e2487843afdd70c1b8e26`
- Anchored address autocomplete, stronger search race protection, parallel restaurant/fast-food provider fallback, clearer provider failure handling, and name-first fallback photos.
- Restaurant Quick Cuts expanded with Soup/Stew and Potato plus menu-aware matching.
- Permanent recovery branch: `savepoint-cp98-restaurant-search-2026-09-28`.

## CP99 — Quick Cut state hardening
Commit: `9030e509928074bcfd5f0ce9a69361f709336525`
- Hungry/no-choice endings no longer create History entries.
- Start Over/System Restore clears item-specific Food Cut state.
- Permanent recovery branch: `savepoint-cp99-quickcuts-2026-09-28`.

## CP100 — winner/history/back recovery
Commit: `0ec78f92bcc259e71b71b3e5df332cee3b89046b`
- Food and Restaurant Back restore the exact prior choice by stable ID, with index fallback.
- Permanent recovery branch: `savepoint-cp100-winner-history-back-2026-09-28`.

## CP101 — History/Settings iPhone polish
Commit: `9d7ac7d914749937d3b33ade6a6ae76ce6384e7f`
- Settings/History modals have bounded scrolling.
- Calendar X controls stay clear of the decision photo.
- Permanent recovery branch: `savepoint-cp101-settings-history-2026-09-28`.

## CP102 — premium Tinder swipe presentation
Commit: `a67fee420963f057e98f1e8f6ef1e50c1861c58d`
- Food and Restaurant both show the next card behind the active card.
- Shared drag animation promotes the next card while the current card moves.
- Added direct Restaurant API smoke coverage and browser stack assertions.
- Permanent recovery branch: `savepoint-cp102-premium-swipe-ui-2026-09-28`.


## CP103 — launch candidate
Commit: `8e15ffdb67f98e73eb35e392bc41bd82f6e77314`
- Migrates legacy primary-wide Food Cut state to exact choice IDs for saved rounds.
- Adds final static regression guards for removed All Cut and legacy bottom navigation.
- Cumulative preview: PR #28 Netlify deploy-preview-28.
- Permanent recovery branch: `savepoint-cp103-launch-candidate-2026-09-28`.


## CP104 — Tinder-inspired structure
Commit: `8accf12ee64d1aa172dac80ef9321cd8526af63a8`
- Decision screens now use a card-first structure inspired by the provided Tinder reference.
- Circular Back / Maybe / Cut / Hide controls replace the former rectangular action row.
- Food and Restaurant retain the shared next-card stack.
- Centered Dinliminate branding and upper-right menu preserve the clean top hierarchy.
- Permanent recovery branch: `savepoint-cp104-tinder-structure-2026-09-28`.
