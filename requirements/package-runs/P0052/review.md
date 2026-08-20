# P0052 consistency review

P0052 should add market-only factor adjustments without changing customer commercial truth:

- Add a stored `reason` field on event details so adjustment rows can carry `Q_FACTOR_UPDATE` or `PROFILE_FACTOR_UPDATE`.
- Reuse existing Modern customer leg rows as the customer source; do not create new customer details for factor-only updates.
- Calculate the target market basis from the existing customer quantity and the new factor.
- Compare the target market basis with active open market basis from purchase, rebalance and adjustment events.
- Write an `ADJUSTMENT` event only when there is a non-zero market delta.
- Store the factor used on the adjustment market detail.
- Include active adjustment market details in Baseloads downgrade/projection and settlement read models by default.
- Keep waiver handling and broad projection cleanup out of scope for P0052.

All examples remain synthetic and generic.
