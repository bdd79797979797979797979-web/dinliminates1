# Dinliminate P900 — Complete Launch Audit
Date: 2026-09-29
Release candidate: p900-launch-complete-2026-09-29
Final main app commit checked: 4c2f4081e2355da81550cd96a66ddeb64fc93060
Packaging commit: 5392c0cd4c153d455087c17f6ce1e6ea275555b0

## Recommendation status

1. One authoritative restaurant search flow — ✅ COMPLETED IN CODE. V3 owns location/search; the hardening layer owns decision-state synchronization.
2. Restaurant round persistence mismatch — ✅ COMPLETED. Round data now uses schema validation instead of build-name whitelisting.
3. Food round persistence mismatch — ✅ COMPLETED. Food round hydration now uses schema validation and accepts current saves.
4. Single release/version source — ✅ COMPLETED for active release surfaces: P900 version is propagated across app, launch layer, API and clean entry.
5. Production API unauthenticated verification — 🟡 EXTERNAL CERTIFICATION REQUIRED. This must be verified against a fresh, unauthenticated production browser.
6. Combined restaurant + fast-food pool — ✅ COMPLETED IN CODE. API contract explicitly identifies a combined pool; fast-food detection and fallbacks remain.
7. Place-specific restaurant photos — 🟡 EXTERNAL PROVIDER/ASSET CERTIFICATION REQUIRED.
8. Food/Restaurant swipe parity — ✅ COMPLETED IN CODE and covered by the existing regression suites.
9. Food Quick Cut primary-category protection — ✅ COMPLETED.
10. Food Quick Cut restore — ✅ COMPLETED.
11. Restaurant Quick Cut restore — ✅ COMPLETED.
12. Search + Quick Cut composition — ✅ COMPLETED. Activating a Quick Cut no longer clears restaurant/food search text.
13. Maybe review behavior — ✅ COMPLETED. Held choices can return when the active deck is exhausted.
14. Restaurant card self-contained data — ✅ COMPLETED IN CODE.
15. Conservative common-menu-item sourcing — ✅ COMPLETED.
16. Open/Unknown Hours parsing — ✅ COMPLETED IN CODE.
17. Address autocomplete — ✅ COMPLETED IN CODE; production certification still required.
18. No duplicate geocode after selecting a coordinate-bearing suggestion — ✅ COMPLETED IN CODE.
19. Location failure recovery — ✅ COMPLETED IN CODE.
20. Home iPhone layout — 🟡 REAL DEVICE CERTIFICATION REQUIRED.
21. Dark winner surface — ✅ COMPLETED.
22. About byline — ✅ COMPLETED.
23. Production image governance — 🟡 ASSET MIGRATION/RIGHTS REVIEW REQUIRED.
24. Image inventory — 🟡 ASSET GOVERNANCE REMAINS.
25. Explicit round-data schemas — ✅ COMPLETED.
26. Export/import validation — ✅ COMPLETED. Current P900 backups carry schema 3 and import their own release version.
27. Report-a-problem flow — ✅ COMPLETED IN CODE. Removed the blank mailto path; copy/share diagnostics are used instead.
28. Permanent regression coverage — ✅ COMPLETED. Existing P730/P781 suites remain and P900 contract coverage was added.
29. Production smoke workflow — ✅ COMPLETED IN WORKFLOW. P900 production checks wait for the matching Vercel commit.
30. 100-mile restaurant cap — ✅ COMPLETED.
31. Adaptive provider startup — ✅ COMPLETED. Google/Photon run concurrently before bounded Overpass expansion.
32. Service worker — ✅ COMPLETED. Replaced self-unregister recovery worker with a versioned network-first worker.
33. Netlify-compatible routing — ✅ COMPLETED.
34. Netlify deployment workflow — ✅ COMPLETED AS A MANUAL WORKFLOW. No Netlify account/site credentials are connected in this session, so no live Netlify URL can be honestly claimed yet.
35. Legacy restaurant "Order" semantics — ✅ COMPLETED. Active markup, handlers and styles use Website terminology.
36. Restaurant touch targets — ✅ COMPLETED IN CODE. Compact utility and card controls retain explicit manipulation/touch styling.
37. Pass Around visual hierarchy — ✅ COMPLETED IN CODE.
38. Food secondary-action hierarchy — ✅ COMPLETED. Add Food and Pass Around are kept ahead of the secondary Random Cut One action.
39. Restaurant utility layout — ✅ COMPLETED IN CODE. Address/radius/Locate/Find are the compact primary location controls.
40. Home menu / front page — ✅ COMPLETED IN CODE. Menu is unboxed and Random Cut One is not on the home screen.
41. Discreet iPhone-help control — ✅ COMPLETED.
42. Restaurant empty-state messaging — ✅ COMPLETED.
43. Restaurant count/empty behavior — ✅ COMPLETED IN CODE. No "restaurants remaining" card is used for the main Hungry end state.
44. Stale restaurant-state protection — ✅ COMPLETED IN CODE through live-pool synchronization and refresh state preservation.
45. Radius monotonicity — ✅ COMPLETED IN CODE and covered by the existing radius regression test.
46. Stale request cancellation — ✅ COMPLETED IN CODE through sequence guards and abortable requests.
47. Historical clean-entry rewrites — ✅ COMPLETED. Clean entry now only rewrites the active P900 assets/version.
48. Large HTML refactor — 🟡 DEFERRED AS A SEPARATE SAFE REFACTOR. The current P900 candidate retains the known working single-file architecture to avoid destabilizing launch behavior.
49. Full CSS refactor / legacy wrapper removal — 🟡 DEFERRED AS A SEPARATE SAFE REFACTOR. The current release removes obsolete active terminology but does not risk a broad CSS/DOM rewrite before external certification.
50. Recovery checkpoints — ✅ COMPLETED. Both a pre-work recovery branch and a current release-candidate branch are preserved.

## Automated evidence

Successful P730 local QA runs exist on the working branch history. A dedicated P900 Launch QA workflow is configured to run the P730/P900 suites locally, then run the P900 production contract on main only after /api/release reports the matching commit.

## External gates

The remaining yellow items require either a real production browser/device, provider configuration, or owner-side asset-rights decisions. They are deliberately not marked green without that evidence.


## Final checkpoint
- Stable release branch: `release-p900-2026-09-29`
- Production recovery branch: `recovery-p900-production-2026-09-29`
- Pre-work recovery branch: `recovery-pre-launch-audit-2026-09-29`
- Latest main/package commit: `5392c0cd4c153d455087c17f6ce1e6ea275555b0`
- Downloadable release ZIP artifact: GitHub Actions run `36526475175`, artifact `11014529869`, 605,086 bytes outer artifact; release ZIP inside is 612,225 bytes.
- Local P730/P900 contract testing has produced green suites; production Vercel is still on an older commit and requires the matching deployment before the production contract can pass.
