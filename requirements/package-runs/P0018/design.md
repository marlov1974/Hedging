# P0018 implementation design

## Package interpretation

P0018 refines the P0017 hedging tool into a more compact work surface and adds a monthly position report.

## Implementation structure

- `src/hedging/portfolioDetails.ts`: portfolio detail lookup for the new feature.
- `src/hedging/positionReport.ts`: year options and monthly component aggregation.
- `src/hedging/HedgingToolView.ts`: compact layout, feature rendering, calloff list columns.
- `src/hedging/features.ts`: add `Portfolio Details` and `Position Report`.
- `tests/hedging/portfolioDetails.test.ts`: portfolio detail behavior.
- `tests/hedging/positionReport.test.ts`: position report aggregation and empty state.
- Existing hedging tests are updated for minimal layout and new feature menu.

## UI changes

- Remove the visible large `Hedging Tool` heading.
- Remove the visible subtitle below it.
- Keep a compact portfolio selector and selected portfolio name.
- Move customer/price/product/calendar details into `Portfolio Details`.
- Remove the visible `Component` column from the Baseloads calloff list.

## Position report rules

Rows are grouped by:

```text
month
component
```

For each row:

```text
Volym = sum(transaction.mw * calendar.total_h)
Pris = sum(mwh_i * price_i) / sum(mwh_i)
```

## Risks and uncertainties

- Transaction-level prices are not available yet, so `PriceComponent` remains the deterministic price source.
- Total monthly hours are used for this PoC; later component-specific hour rules can replace the shared helper.
