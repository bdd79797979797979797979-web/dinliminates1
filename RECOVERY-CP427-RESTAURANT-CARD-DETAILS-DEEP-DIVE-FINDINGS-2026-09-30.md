# Recovery Checkpoint — CP427 — Restaurant Card Details Deep Dive Findings — 2026-09-30

Parent: CP426

Findings:
1. Tinder hierarchy is correct at the structural level: large photo-first card, restaurant name, small category/distance line, swipe surface, and circular decision controls.
2. The current card is information-dense: name + address + cuisine + Details + up to two menu items + phone + hours + Website action all compete inside the lower photo copy.
3. The Details icon is correctly integrated beside cuisine and uses the compact premium icon treatment rather than a large white Details pill.
4. Phone is visible on the card, which matches the product requirement, but it is rendered as a plain text link rather than a premium contact treatment.
5. Website is visible on the card, but its current text button ('Website ↗' / 'Google ↗') is less premium and less consistent with the icon-first Details/Website treatment requested elsewhere.
6. Directions are correctly kept out of the card and inside Restaurant Details, which avoids adding another competing card action.
7. Common menu-item text is useful when trustworthy but is a weak fit for the fast Tinder decision surface and can make the lower card area feel crowded.
8. Address is important for local verification, but long addresses can consume a full extra line. Current CSS truncates detail lines, so information may be clipped rather than elegantly prioritized.
9. Hours is appropriately compact as an Open/Closed/Open-Unknown badge, but it currently sits below phone instead of participating in a tighter status row.
10. Swipe implementation is strong: pointer capture, 90px commit threshold, image drag suppression, and interactive-control exclusion prevent most accidental swipes while using phone/website/Details links.
11. The largest newly introduced photo issue is attribution placement: the Google photo attribution overlay sits at the lower-left of the card while the card copy also occupies the lower-left. On Google-photo cards, attribution can overlap the restaurant text.
12. The visible-card/next-card architecture is good for Tinder depth, but the next card currently hydrates Google photos only after rendering; this is acceptable but should remain lightweight.
13. The card's 3/4.45 mobile aspect ratio with a 57svh ceiling is reasonable for iPhone-first use, but the restaurant screen has substantially more chrome above the card than Food, making small-height phones the first place to watch for compression.
14. Restaurant Details is much stronger as the place for full information: large hero, title, category/cuisine, stats, contact card, website/directions icons, and common menu items. That makes it a good destination for anything removed from the Tinder card.
15. The card and Details should share the same information hierarchy rather than duplicating all content in both surfaces.

Recommended design direction:
- Keep the card photo-first and decision-first.
- Keep restaurant name, category/distance, cuisine, address, phone, hours, and Details available.
- Replace the card's text Website link with the premium compact Website icon treatment, matching Details.
- Keep phone visible but give it an understated phone icon/affordance rather than another large action.
- Move common menu-item text entirely to Details unless a provider supplies exceptionally strong evidence and a very short label.
- Put hours beside cuisine/status in a compact metadata row where possible.
- Prevent Google photo attribution from occupying the same lower-left zone as the restaurant name; place it higher on the image or reserve a dedicated non-overlapping strip.
- Do not add Directions, Save, Heart, Pass Around, or other competing controls to the card.
- Preserve the existing four bottom decision controls and swipe behavior.

Assessment:
The current implementation is functionally strong and visually on the right track. The next polish pass should simplify, not add: make the Tinder card feel like a decisive restaurant poster with just enough local verification, while Restaurant Details becomes the complete business-information surface.