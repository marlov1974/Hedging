# P0051 consistency review

P0051 should build on the two-legged event model without rewriting earlier purchase history:

- Add `REBALANCE` as an event type so product-change/rebalance actions are distinct from original purchases.
- Calculate Baseloads rebalance rows from current open market basis first, using existing `market.base.<area>` event details as source of truth.
- Keep the old transaction-based current-position calculation only as compatibility fallback when market basis rows are absent.
- Create a new rebalance event for the delta; do not mutate original purchase events or event details.
- Preserve compatibility calloff/transaction rows and generated derivative names at rebalance creation time.
- Keep P0052 out of scope: no Q/profile market-only adjustment reason handling in this package.

All examples remain synthetic and generic.
