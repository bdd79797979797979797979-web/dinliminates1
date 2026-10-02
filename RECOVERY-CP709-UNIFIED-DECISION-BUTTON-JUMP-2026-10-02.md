# Recovery — CP709 Unified Decision Button Jump

Date: 2026-10-02
Build: 709
Checkpoint: CP709
Branch: `cp709-unified-decision-button-jump`
Parent: `cp708-hero-photos-unified-button-press`
Clean baseline: `clean-cp704-2026-10-02`

## Changes
- Meal Back / Cut / Maybe now use the same `bindCardButton` activation path as Restaurant.
- `bindCardButton` adds a shared `decision-button-jump` animation to round-action buttons.
- The jump uses a short upward/downward tap motion and respects `prefers-reduced-motion`.
- CP708 Home photos remain:
  - Dine In: Pexels 37140465
  - Dine Out: Pexels 36850066
- Restaurant Search and Open/All remain hidden.

## Verification
- Source confirms the common animation class and shared activation helper.
- Source confirms the Meal and Restaurant Back / Cut / Maybe controls use `bindCardButton`.
- This checkpoint has not been certified on a physical iPhone.
