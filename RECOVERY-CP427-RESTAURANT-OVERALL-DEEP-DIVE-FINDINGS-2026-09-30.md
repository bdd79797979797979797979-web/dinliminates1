# Recovery Checkpoint — CP427 — Restaurant Overall Deep Dive Findings — 2026-09-30

Parent: CP426

Overall assessment:
Restaurant is structurally mature and much closer to a launch-quality flow than the older iterations. The search/location/provider layer is now deliberate, Quick Cuts are centralized, and the Tinder interaction is consistent. The remaining issues are mostly information density, action hierarchy, state consistency, and a few product-contract mismatches.

1. Entry and top structure
- Restaurant opens with the same premium decision-bar treatment used by Food.
- Back and Menu are correctly localized instead of using the removed global back control.
- The location strip is compact and efficient, but it contains address, geolocation, Find/Refresh, radius, status, and location-source messaging in a very small vertical area.
- Good direction: keep this compact; avoid moving controls into large panels.

2. Location/search
- Address selection, My Location, refresh, radius auto-refresh, search debounce, cancellation, and degraded-search handling are all represented.
- Search can act as both local filtering and provider-backed refresh, which is useful.
- Clear contract mismatch: the current UI/API expose 1/3/5/10/25/50 miles, while the earlier requested certification set included 100 miles. The implementation is intentionally capped at 50 today, so that requirement is not currently met.
- Search errors preserve previous results, which is preferable to blanking a usable list.

3. Hours/Open-All model
- Open/Unknown vs All is clear and backed by normalized open/closed/unknown state.
- Counts explain hidden closed results instead of silently changing the meaning of the pool.
- This is one of the strongest parts of the current restaurant flow.

4. Quick Cuts
- Exactly ten restaurant categories are driven by the shared taxonomy and rendered with photos.
- Quick Cuts operate against the active restaurant pool rather than a stale base deck.
- Classification evidence is centralized, making future corrections safer.
- The main UX opportunity is not correctness but discoverability: once many chips are visible, the active-cut state must stay unmistakable and the row should remain scrollable on the smallest iPhones.

5. Restaurant Tinder card
- The card has strong visual hierarchy: photo first, name prominent, category/distance secondary.
- Current card content is dense: address, cuisine, Details icon, up to two menu items, phone, hours, and a website action all live inside the swipe card.
- That is useful information, but it is more information-dense than the Food card and can make the card feel like a directory result instead of a premium decision card.
- Recommended information hierarchy: keep Name + Category/Distance + one compact location line on-card; keep full address, phone, menu, hours, website, and directions in Details. Preserve a very small phone/website affordance on-card only if needed.
- The Details icon placement beside cuisine is appropriate and preserves the swipe-first structure.
- The phone link and website link are protected from the swipe surface through interactive-control handling, which is important.
- Hide is valuable, but four circular decision controls plus multiple inline links create a high interaction count. The swipe card should remain visually dominant over the controls.

6. Swipe decisions
- Left/Cut decreases the active restaurant pool.
- Right/Maybe recycles into the second narrowing pass.
- Back restores the prior decision state.
- Hide is persistent and separate from Cut, which matches the intended semantics.
- Final-choice logic is present for both Cut and Maybe paths.
- The restaurant Winner screen does not currently trigger the fireworks/celebration layer because winner() intentionally suppresses celebration when winnerType==='restaurant'. If the desired restaurant experience is the same winner/share moment as Food, this is an inconsistency.

7. Restaurant Details
- The Details sheet is materially improved and matches the luxury Food Details language.
- It includes photo hero, category/cuisine/distance/hours, phone, address, Website, Directions, and menu information.
- Website correctly falls back to Google search when a direct safe external URL is unavailable.
- Phone correctly falls back to a Google lookup.
- The details actions are premium icon buttons rather than generic white circles.
- This is the right place for the fuller information set currently overloading the card.

8. Photos
- The new venue-photo architecture is a major improvement: provider photos first, Google venue photos on demand, then stable fallbacks.
- The current card/next-card/Details hydration path is coherent.
- Important persistence gap: recordHistory() saves item.image or item.photo, but a Google-backed restaurant can have an empty photo field while its actual venue image is hydrated client-side. That means the History entry can fail to retain the restaurant photo unless the hydrated result is copied into the saved record.

9. History/hidden restaurant continuity
- Hidden restaurants preserve useful identity/contact/location metadata.
- History is structurally correct as a calendar and supports details/delete.
- Google photo persistence should be fixed so a restaurant decision does not degrade to the generic/Hungry image in History.

10. Failure states
- No-results states are clear and offer Retry/Clear where appropriate.
- Degraded-provider state is surfaced.
- Previous successful results are retained on refresh failure.
- The remaining premium opportunity is to make degraded status less technical while preserving useful feedback.

11. Accessibility/interaction
- Controls use labels and ARIA attributes.
- Details is a real button; phone/website are real links; swipe code ignores interactive controls.
- Search input supports keyboard selection/Enter behavior.
- Small-screen layout is aggressively compact, which is necessary, but card information density should be tested at 375px and 320px widths before adding anything else.

12. Recommended next pass
- Fix Google restaurant photo persistence into History.
- Decide whether Restaurant Winner should receive the same celebration/fireworks as Food.
- Rebalance card information so the swipe card reads primarily as a decision surface, not a directory card.
- Preserve phone/website access on-card in a much more compact treatment if those are mandatory card-level features.
- Resolve the radius contract: either formally cap the product at 50 miles or implement the requested 100-mile tier with adequate provider coverage.
- Add browser QA specifically for card-height overflow, clickable-link swipe interference, History photo retention, restaurant Winner state, and 320/375/390px phone layouts.

Production changes made at CP427: none. This checkpoint records findings only.