# P0045 consistency review

Status: WARN

P0045 is consistent with the P0044 event/detail direction when interpreted as a projection and calloff-layer package:

- Baseloads position report rows are projected rows and must not mutate canonical events or event details.
- Peaks value may contribute to an effective Baseloads hedge price, but Peaks volume must not contribute to reportable Baseloads volume.
- Baseloads rebalance uses the selected price area's base forecast only and creates signed Baseloads base details toward the target position.
- Negative rebalance details are valid because the flow is target-driven, not buy-only.

Implementation assumptions:

- The current Baseloads product keeps compatibility transaction rows for `base.sys` and `base.epad`.
- Rebalance calloffs belong to the existing synthetic Baseloads portfolio flow and use the selected `price_area` on generated transactions.
- Derivative names are carried on rebalance output rows at calloff time through explicit rebalance naming, without adding a database field in this package.
- P0044 purchase events remain unchanged; P0045 does not redesign event/detail storage.

No real customer names, company names, internal product names, real forecasts, real prices or confidential terms are introduced.
