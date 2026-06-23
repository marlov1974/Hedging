# P0033 Design

## Interpretation

Peaks.Modern customer flows should speak Modern Projection terms. Persistence remains canonical:

- Forecast stores existing `CustomerForecast.mwh` and `peak_pct`.
- Hedge Forecast accept writes six canonical transactions per month.
- No `modern.*` component is persisted.

## Implementation Structure

Add a shared conversion module under `src/hedging/modernProjection.ts`:

- Convert forecast internal values (`total_mwh`, `peak_pct`, calendar) to modern display values.
- Convert modern MWh inputs back to internal forecast/canonical hedge values.
- Convert modern hedge MWh inputs to canonical transaction MW values.

Update `forecastFeature.ts`:

- Display rows expose `modern_base_mwh`, `modern_peak_mwh`, and derived helper values.
- Update input accepts `modern_base_mwh` and `modern_peak_mwh`.
- Save converts modern values to internal `mwh` and `peak_pct`.

Update `forecastHedge.ts`:

- Generated profile scales forecast modern base/peak MWh by hedge percentage.
- Editable profile rows use `modern_base_mwh` and `modern_peak_mwh`.
- Accept converts edited modern rows to canonical allocation/base/peak MW.

Update `HedgingToolView.ts` and `server.ts`:

- Rename visible inputs and table columns to modern base/peak MWh.
- Post/read form fields by modern input names.
- Keep debug/internal terms out of primary customer tables.

## Tests

Update and add Forecast/Hedge tests for:

- Modern Forecast labels and editable field names.
- Modern input to internal forecast conversion.
- Internal forecast to modern roundtrip.
- Hedge percentage scaling of both modern base and peak.
- Accept writes only canonical rows.
- Worked example conversion.
- Negative modern peak allowed, negative modern base rejected.
- Zero calendar denominators rejected.
- P0032 projected transactions still show `modern.*` rows after canonical accept.

## Risks

- Existing tests assume `mwh` and `peak_pct` are user-facing fields. They must be updated to the new P0033 behavior.
- Rounding must be consistent enough for roundtrip tests while preserving canonical transaction semantics.
