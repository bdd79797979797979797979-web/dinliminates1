# CP813 Family Mode Finalists — Recovery Checkpoint
Date: 2026-10-03

Baseline
- CP806: 35e4ecd30123d42e44b240987573ac16ed609da7

CP813 completed
- Initial support is calculated server-side as Maybe + Choose.
- At least half of included participants normally qualifies an item.
- Choose is used as the stronger tie-break when ordering qualified finalists.
- Finalists are capped at 8.
- When too few choices qualify, the strongest supported choices fill the list so the Family cannot dead-end.
- Finalists are stored on the round snapshot and become the exact second-stage pool.
- More than one finalist starts the second swipe stage.
- Exactly one finalist skips the second swipe and becomes the round winner.
- No individual vote totals or percentages are exposed to participants.

Next
- CP814: final decision aggregation, automatic tie-break, winner output, and Family winner screen.
