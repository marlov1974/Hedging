# P0050 consistency review

P0050 should move Baseloads projection/read models onto P0049 market-basis event details:

- Baseloads projected rows read `MARKET` event details with `market.base.<area>` component codes.
- Projection aggregates signed market base quantity and signed value by calloff/month.
- Price is derived last as `value / volume`.
- A calloff is `MARKET_NEAR_BASELOADS` when all projected month volumes are equal within tolerance.
- A calloff is `PROFILED_BASELOADS` when projected month volumes differ.
- Existing transaction-based Baseloads builders remain as compatibility helpers and fallbacks.
- Do not implement product migration, downgrade policy, rebalance migration or Q/profile market-only adjustments in this package.
