# CP810 Family Mode Host Setup — Recovery Checkpoint
Date: 2026-10-03

Official baseline
- CP806: 35e4ecd30123d42e44b240987573ac16ed609da7

CP810 completed
- Host can choose Meals or Restaurants for the Family decision.
- Host can set one Dinner by time.
- Dinliminate sends the target time to the Family round and leaves stage timing automatic.
- Host can cut individual choices before the Family starts.
- The host exclusion list is stored in the Family round snapshot, not the personal meal/restaurant state.
- Meals use the existing catalog visible to the host without importing personal cuts into Family Mode.
- Restaurants use the existing active restaurant result pool rather than re-querying a different restaurant source.
- Restaurant snapshot carries location, radius, search term, Open/All state, and restaurant Quick Cuts metadata.
- The round snapshot is frozen when the host locks choices.
- CP810 does not start Family swiping yet; that is CP811.

Important
- Database provisioning is still not verified in this session, so live cross-device round creation remains pending environment configuration.
- Existing Clean QA contains an older CP786 release contract and should not be used as the sole CP806-family verification gate.
