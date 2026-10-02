# CP727 Recovery — Simplified History Stats — 2026-10-02

Simplified **Your Stats** to basic choice-frequency information.

The History Stats panel now shows:
- Top 7 meals chosen, sorted by times chosen.
- Top 7 restaurants chosen, sorted by times chosen.
- Each entry shows the number of times it was chosen.
- Meal/restaurant names are normalized for counting so capitalization and punctuation do not split the same choice.
- Empty sections show a simple no-choices message.

Removed from Stats:
- Current streak
- Total decisions
- Decorative dashboard metrics

QA:
- app.js parses successfully.
- Meal frequency calculation verified.
- Restaurant frequency calculation verified.
- Frequency sorting verified.
- Top-7 limits verified.
- Name normalization verified.
- Old streak and total-decision metrics removed.
- Stats styling present.
- Build 727 / checkpoint CP727 verified.
- Service worker v727 and asset cache-bust v727 verified.

Branch: `cp715-restaurant-maybe-home-winner`
