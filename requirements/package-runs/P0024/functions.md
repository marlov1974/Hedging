# P0024 function design

## Changed functions

### `updateForecastHedgeProfileRow`

Purpose: Recalculate a profile row using corrected PeaksModern premium/shape semantics.
Inputs: month, forecast MWh, forecast peak percentage, calendar total hours, calendar peak hours, Hedge/Base MWh.
Outputs: base MWh, base MW, modern peak MWh, modern peak MW and Hedge % values.
Side effects: none.
Reason: PeakModern `peak.modern` transactions must not use full peak consumption.
Tests: numeric example, negative premium case, flat profile case, editable recalculation.

### `createForecastHedgeTransactions`

Purpose: Insert base and peak.modern transactions for each profile row.
Inputs: database, calloff and profile rows.
Outputs: four transactions per month.
Side effects: inserts transactions.
Reason: PeakModern accept still creates all four components, but peak.modern MW now uses corrected premium/shape MW.
Tests: one-month count, three-month count, component MW and q-factor assertions.

## New helper functions

### `calculateModernPeakMwh`

Purpose: Calculate `base_mwh * (peak_pct - peak_h / total_h)`.
Inputs: base MWh, forecast peak percentage, total hours, peak hours.
Outputs: modern peak MWh, possibly negative.
Side effects: none.
Tests: covered through profile row formula tests.

### `flatPeakShare`

Purpose: Calculate `peak_h / total_h`.
Inputs: total hours and peak hours.
Outputs: flat peak share.
Side effects: none.
Tests: covered through profile row formula tests.
