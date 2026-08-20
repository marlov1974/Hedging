# P0049 consistency review

P0049 should make market-basis event details the canonical market leg without removing compatibility transaction behavior:

- Add `market.base.<area>` as persistable market canonical component codes.
- Create `MARKET` event details from the P0048 Modern customer leg using the stored decision factor.
- Preserve value with `market_quantity = customer_quantity * factor` and `market_price = customer_price / factor`.
- Store market-basis quantity as `MWh`, matching the customer leg unit and the Baseloads projection direction.
- Keep existing transaction-derived market mirror rows as compatibility details until later cleanup.
- Let settlement prefer `market.base.<area>` event details when present and fall back to the old Baseloads transactions otherwise.
- Do not complete Baseloads reporting, product migration, rebalance migration, or Q/profile market-only adjustments in this package.
