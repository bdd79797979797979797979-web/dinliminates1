# Recovery Checkpoint CP464 — Wendy Street Dedupe + Dinner Simplified
Date: 2026-09-30

Starting point:
- CP463 / Build 168
- Recovery: `recovery-cp463-before-wendys-street-title-food-review-2026-09-30`

Changes:
1. Restaurant dedupe now recognizes a same-name venue on the same street when one provider supplies a full street address and another supplies a partial street address, provided the venue coordinates are close or the displayed/search distances are effectively the same.
2. Two separately numbered same-name locations on the same street remain distinct.
3. Changed the Home headline from “Dinner Decisions Simplified” to “Dinner Simplified”.
4. Added regression coverage and bumped Build 169 / CP464.

Choose-a-meal review notes:
- The 116-food catalog is broad and structurally consistent.
- All built-in foods currently have image URLs.
- Quick Cuts are clear and map to cuisine/meal groupings.
- The card interaction is coherent: Cut removes, Maybe recycles, Back restores.
- The strongest remaining food-side opportunities are better default handling for custom meals (now addressed in CP463), keeping the photo quality consistent across the 116-item catalog, and making the distinction between cuisine Quick Cuts and individual food choices as clear as possible.
