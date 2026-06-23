# P0036 Review

## Consistency result

PASS.

## Evidence

- P0035 already moved perspective selection inside Forecast and Hedge Forecast.
- Existing forecast storage uses `mwh` and `peak_pct`, which can represent Classic `Offpeak MWh` and `Peak MWh` without creating a persisted `classic.*` model.
- Existing hedge acceptance already writes canonical rows for `allocation.peak.*`, `base.*` and `peak.*`.
- Peaks.Classic and Peaks.Modern currently share the canonical component set, so Classic acceptance can write the same canonical row set with Classic conversion formulas.

## Assumptions

- Classic Forecast persists through the existing forecast row shape: `mwh = offpeak_mwh + peak_mwh`, `peak_pct = peak_mwh / mwh`.
- Classic Hedge Forecast acceptance should create calloffs against the Peaks.Classic product configuration while still allowing the fixed demo portfolio to use the flow.
- If `mwh = 0`, stored `peak_pct` remains `0` because the current schema expects a number.
