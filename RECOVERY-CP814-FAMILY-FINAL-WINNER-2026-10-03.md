# CP814 Family Mode Final Decision + Winner — Recovery Checkpoint
Date: 2026-10-03

Official baseline
- CP806: 35e4ecd30123d42e44b240987573ac16ed609da7

CP814 completed
- Finalist voting is evaluated with Choose weighted stronger than Maybe.
- When the final-stage leader is unique, the round completes with that winner.
- A tie creates an automatic One Last Decision stage using only the tied finalists.
- The tiebreak has a short deadline and no host override.
- If the tiebreak is still mathematically tied when time expires, the server resolves the tie automatically.
- Completed winners are retained by Family state after the active-round pointer is cleared.
- Family Mode has its own winner presentation with dinner title, winner photo, details/share hooks, fireworks, and Decide Again.
- Normal History/Stats are intentionally not modified yet; CP815 handles exactly-once winner recording.

Next
- CP815: save Family winners into each participating device’s normal History and normal Stats exactly once.
