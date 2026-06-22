# P0020 implementation design

## Interpretation

P0020 makes the hedging UI quieter and adds a monthly Financial Settlement feature for Baseloads hedges. The feature combines `base.sys` and `base.epad` into one hedge result and uses P0019 monthly average spot actuals.

## Implementation structure

- Add `src/hedging/financialSettlement.ts` for settlement months, monthly calculation, combined hedge price and spot lookup.
- Add `financial-settlement` to `HedgingFeatureId` and feature navigation.
- Update `HedgingToolView.ts` to render the new feature, remove duplicated selected-portfolio text and remove the extra visual Open button from the selector.
- Update `src/hedging/server.ts` to read `selected_month`.
- Add tests in `tests/hedging/financialSettlement.test.ts` and update shell tests.

## Settlement logic

- Filter Baseloads transactions for the selected portfolio and month.
- Group by calloff id.
- For each calloff, collect `base.sys` and `base.epad` rows.
- Calculate each component MWh as `mw * calendar.total_h`.
- Use a representative physical hedge volume so paired sys/epad rows do not double-count MWh.
- Calculate combined hedge price as `(sys_mwh * sys_price + epad_mwh * epad_price) / representative_mwh`.
- Use static spot actual `monthly_average_price`.
- Calculate `financial_settlement = hedge_volume_mwh * (monthly_spot_price - hedge_price)`.

## UI approach

- Keep compact portfolio selector and feature navigation.
- Remove duplicated selected portfolio text outside the selector.
- Remove the selector submit/status object if the browser can submit on change.
- Render a compact month dropdown and settlement result table.

## Test strategy

- Verify the UI no longer renders duplicated portfolio/status objects.
- Verify Financial Settlement appears in feature navigation and renders a month dropdown.
- Verify spot actual monthly average is used.
- Verify sys and epad combine into one hedge price without double-counting hedge volume.
- Verify missing spot actual and missing transactions produce clear empty/error states.

## Risks and uncertainties

- The `STO` spot actual bridge for seeded `SE3` portfolios remains a PoC convention from P0019.
- Financial settlement currently supports Baseloads only.
