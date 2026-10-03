# CP816 Family Mode Recovery — Recovery Checkpoint
Date: 2026-10-03

Baseline
- CP806: 35e4ecd30123d42e44b240987573ac16ed609da7

CP816 completed
- Active rounds automatically end when their hard expiration is reached.
- A host who has been inactive for 90 seconds can be replaced by the oldest active Family member on the next state refresh.
- A member can leave Family Mode through a real server-side leave operation.
- Leaving an active round removes that member from the current round without deleting their Family membership history.
- A departing host is replaced by another active Family member.
- An empty Family room remains persisted but its join code expires after 30 days of inactivity.
- Client leave and back navigation warn appropriately around active decisions while preserving the server-saved progress.
- Cache and asset versions are bumped to CP816.

Next
- CP817: full Family Mode audit across source contracts, state isolation, timing, finalists, tiebreaks, winner persistence, and recovery behavior.
