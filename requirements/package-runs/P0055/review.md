# P0055 Review - Commercial components and Baseloads upgrade conversion

## Consistency review

P0055 extends the P0047-P0054 target model by treating commercial add-ons as customer event details, not as hedge price adjustments or market legs.

The implementation keeps the existing event/event_detail model as the source of truth:

- Baseloads hedge exposure is market-near and stored as `MARKET` `market.base.<area>`.
- Baseloads customer-side commercial fee is stored as `CUSTOMER` `fee.calloff`.
- Peaks/Modern customer hedge details remain `modern.base` and `modern.peak`.
- Q-term and P-agent are stored as separate `CUSTOMER` add-on details following signed `modern.peak`.
- Upgrade conversion uses two calloffs so the market rebalance and customer conversion can be audited separately.

Compatibility transaction rows remain in place for older views and helpers. Target read models continue to prefer event details where available.

## Implementation notes

- Added commercial component codes:
  - `fee.calloff`
  - `premium.q_term`
  - `premium.p_agent`
- Added per-MWh price types for add-ons:
  - `EUR_PER_MWH`
  - `SEK_PER_MWH`
  - `LOCAL_CCY_PER_MWH`
- Generated add-on event details store `price_component_id` and `price_source` so historical details keep the calloff-time configured price reference.
- Baseloads purchase now creates market basis details plus fee, but no `modern.base` customer hedge detail by default.
- Modern purchase paths create Modern customer hedge details, market basis details and add-on customer details.
- `upgradeBaseloadsToPeaksModern` creates:
  - `<id>-MARKET_REBALANCE`
  - `<id>-CUSTOMER_CONVERSION`

## Verification

Run after implementation:

```bash
npm test
git diff --check
git status --short
```

## Restore handoff

For Mac replacement and continuation, `docs/restore_from_github.md` records the
GitHub remote, continuation branch, local verification command, prototype run
command, Basic Auth runtime-password handling, and temporary tunnel recreation.

No runtime password, local tunnel URL, or machine-specific secret is stored in
the repository.
