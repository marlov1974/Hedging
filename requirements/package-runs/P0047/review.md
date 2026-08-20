# P0047 consistency review

P0047 is consistent with the existing P0044 event/detail migration when implemented as a narrow model extension:

- Keep `event` as the shared occurrence that links customer and market legs.
- Add `leg_type` to event details so one event can contain `CUSTOMER` and `MARKET` rows.
- Preserve existing forecast and purchase flows by defaulting legacy detail inserts to `MARKET`.
- Do not remodel Modern, Classic, Baseloads, market bases, rebalance, settlement or profile/Q adjustments in this package.
- Keep signed quantities valid; validation should reject unknown leg types but not force positive quantities.
- Use `linked_detail_id` as an optional explicit link between legs without requiring it for all legacy rows.

Compatibility boundary: current calloff/transaction rows remain the write path for existing flows. P0047 only makes their mirrored event details leg-aware.
