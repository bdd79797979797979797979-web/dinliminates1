# CP809 Family Mode Lobby — Recovery Checkpoint
Date: 2026-10-03

Baseline
- CP806: 35e4ecd30123d42e44b240987573ac16ed609da7

CP809 completed
- Family lobby refreshes its server state automatically while open.
- Member list shows current Family members and identifies the host.
- Host can regenerate the visible Family join code; the old code is invalidated by the backend.
- Anyone can copy the current Family join code.
- The lobby clearly distinguishes an active decision from a waiting lobby.
- Family Mode session state stays in its own storage key and does not use the normal dinner-decision state.
- Frontend asset versions and service-worker cache are bumped so CP809 UI is not masked by CP806 browser cache.

Next
- CP810: Host Setup, Dinner by target time, host exclusions, and frozen Meal/Restaurant snapshot.
