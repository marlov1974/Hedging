# P0033 Review

## Classification

PASS

## Evidence

- `requirements/packages/P0033-peaks-modern-forecast-and-hedge-flow-use-modern-projection.md` is present after sync.
- Current `Forecast` feature exposes `mwh` and `peak_pct` directly in the customer UI.
- Current `Hedge Forecast` already writes canonical component transactions, but its user profile is driven by total hedge MWh and forecast peak percent.
- P0032 modern projected Data Viewer functions can verify canonical writes project back to `modern.*` rows.

## Scope

P0033 is implementable without schema changes. Existing `CustomerForecast.mwh` and `peak_pct` remain internal/source fields. Customer-facing Forecast and Hedge Forecast inputs move to `modern_base_mwh` and `modern_peak_mwh`, with conversion at feature boundaries.

## Assumptions

- Negative `modern_peak_mwh` is valid when the resulting total forecast/hedge MWh and actual peak level remain non-negative.
- Forecast rows still store total monthly MWh and peak share internally because that is the existing source model.
