# P0033 Function Design

## New Functions

### `deriveModernFromForecast`

Inputs: total MWh, peak percent, calendar total/peak hours.

Outputs: modern base MWh, modern peak MWh, peak level MWh and warnings.

Reason: Forecast rows are stored internally as total MWh and peak share, but the Peaks.Modern UI displays modern projection values.

### `convertModernForecastToStored`

Inputs: modern base MWh, modern peak MWh, calendar total/peak hours.

Outputs: stored total MWh and peak percent.

Reason: Forecast save should accept modern inputs while preserving existing forecast storage.

### `convertModernHedgeToCanonical`

Inputs: modern base MWh, modern peak MWh, calendar total/peak hours.

Outputs: canonical base MW, allocation peak MW, canonical peak MW and derived totals.

Reason: Hedge Forecast accept must write canonical transactions only.

## Changed Functions

### `getForecastRowsForYear`

Add calendar-aware modern display values.

### `validateForecastUpdate`

Validate `modern_base_mwh` and `modern_peak_mwh`, then convert to stored values.

### `buildForecastHedgeProfile`

Generate proposal rows by scaling forecast modern values.

### `updateForecastHedgeProfileRow`

Recalculate hedge profile from editable modern base/peak MWh.

### `transactionMwForComponent`

Use canonical base/allocation/peak MW values derived from modern inputs.

### `renderForecastTable`

Show `Modern Base MWh` and `Modern Peak MWh` editable columns.

### `renderForecastHedgeProfile`

Show/edit modern base/peak MWh and display derived helper values.

## Removed Behavior

- Customer-facing Peaks.Modern Forecast no longer uses editable total `MWh` and `Peak %` fields as the primary model.
- Customer-facing Hedge Forecast no longer edits a single `hedge_mwh` field.
