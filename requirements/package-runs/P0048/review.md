# P0048 consistency review

P0048 should build on the P0047 leg model without changing market-basis behavior:

- `CUSTOMER` event details use Modern customer basis with `modern.base` and optional `modern.peak`.
- Existing `MARKET` event details remain compatibility mirrors of the current component transaction model.
- `modern.base.sys`, `modern.base.epad`, `modern.peak.sys` and `modern.peak.epad` remain projected read-model names, not persisted source rows.
- Classic input can create customer leg rows only after conversion to Modern; it must not persist `classic.*` source rows.
- Baseloads input creates a `modern.base` customer detail and omits `modern.peak` when the peak quantity is zero.
- P0048 must not implement market bases, Baseloads-from-market projection, rebalance product migration or Q/profile market-only adjustments.
