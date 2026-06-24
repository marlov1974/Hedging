# P0044 implementation design

## Interpretation

P0044 starts the source model migration from forecast/calloff/transaction-specific vocabulary to generic `event` and `event_detail` vocabulary. Existing UI and report behavior remains compatible.

## Intended changes

- Extend the in-memory schema with `events` and `eventDetails`.
- Add types and repository functions for `HedgingEvent` and `EventDetail`.
- Add explicit area component codes:
  - `base.sto`, `base.mal`, `base.lul`, `base.sun`
  - `peak.sto`, `peak.mal`, `peak.lul`, `peak.sun`
- Add a small forecast event model helper that:
  - creates canonical `FORECAST` events and area event details,
  - stores forecast power quantities as `MW`,
  - derives the existing `CustomerForecast` MWh/peak percentage shape from forecast event details and calendar hours,
  - syncs edits back into event details.
- Seed data keeps legacy `CustomerForecast` rows for compatibility and also creates matching forecast events.
- Forecast and Hedge Forecast reads go through the canonical forecast helper.
- Hedge accept keeps creating existing calloff/transaction rows and also creates a `PURCHASE` event with event details.
- Data Viewer gains canonical forecast event details and projected Classic/Modern forecast views.
- Documentation records the new event detail model and EPAD compatibility boundary.

## Deliberate non-refactors

- Do not rename all existing calloff/transaction types or UI labels in this package.
- Do not remove existing EPAD transaction components while P0037-P0043 reports still depend on them.
- Do not introduce persistent storage or migrations; the PoC remains in-memory.

## Test strategy

- Unit tests for event/event_detail inserts and validation.
- Seed tests for forecast events, MW storage with derived MWh, price_area, and no generic EPAD forecast event details.
- Forecast feature tests that Classic/Modern views derive from canonical forecast events.
- Hedge Forecast tests that purchase events/details are created, SYS details carry price_area, area component details exist, and currency remains intact.
- Data Viewer tests for forecast event detail and projected forecast tables.

## Risks

- The package spans source model, seed data, feature reads, purchase writes and Data Viewer. The implementation keeps the first migration thin to reduce churn.
- Generic EPAD purchase compatibility remains visible in raw transactions until later packages migrate purchase rows to explicit area components.
