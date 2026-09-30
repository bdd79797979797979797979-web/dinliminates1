# Recovery Checkpoint CP464 — Wendy Street Dedupe + Dinner Simplified + Choose-a-Meal Review
Date: 2026-09-30

Starting point:
- CP463 / Build 168
- Recovery: `recovery-cp463-before-wendys-street-title-food-review-2026-09-30`

Implemented:
- Same-name Restaurant providers on the same canonical street can now collapse when one address is partial (e.g. house number omitted) and the venue distance is effectively the same. Separately numbered same-name addresses stay distinct.
- Home headline changed to `Dinner Simplified`.
- Browser smoke and static QA updated for the new title/build.

Choose a Meal deep review:
- Built-in catalog: 116 meals.
- All 116 currently have image URLs, recipes, nutrition objects, and ingredient lists.
- No duplicate IDs or duplicate exact names found.
- Main Quick Cuts are consistently photo-backed and map to cuisine/meal groupings; many foods intentionally belong to multiple Quick Cuts, so their counts overlap.
- The interaction model is coherent: Cut removes, Maybe keeps the item for a later recycle pass, Back reverses the previous decision, Details exposes nutrition/ingredients, Hide removes an item, and Add Meal opens the editor.
- One data-cleanliness item worth addressing later: one built-in item uses category `Soup` while the primary taxonomy uses `Soup/Stew`. It does not break the current Quick Cut model but is an inconsistent category label.
- Another polish opportunity is making the distinction between the Home action `Choose a meal` and the Food-screen Quick Cuts even clearer through microcopy, without adding more controls.
- The food side is already structurally mature; the higher-value remaining work is consistency and visual/content refinement rather than adding features.
