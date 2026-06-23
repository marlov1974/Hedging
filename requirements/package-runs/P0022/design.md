# P0022 implementation design

## Package interpretation

Add a PeaksModern-only `Hedge Forecast` feature. The user selects a start month, end month and percentage. The system builds a monthly profile from forecast MWh. The user edits Hedge MWh and accepts the profile to create one calloff plus four transactions per month for `base.sys`, `base.epad`, `peak.modern.sys` and `peak.modern.epad`.

## Implementation structure

- Add `src/hedging/forecastHedge.ts` for package business logic.
- Add `tests/hedging/forecastHedge.test.ts` for package behavior.
- Update `src/hedging/applicationConfig.ts` to expose the feature only for PeaksModern.
- Update `src/hedging/server.ts` to handle generate and accept POSTs.
- Update `src/hedging/HedgingToolView.ts` to render the feature and profile form.
- Add `docs/hedging/peaks_modern_forecast_hedge.md`.
- Update `REPOSITORY_FILES.md` because tracked files are added.

## Editable model

The profile stores forecast MWh, hedge MWh, calendar total hours and derived values. Hedge MWh is the only editable field in the UI. On each form submit, Hedge MW is recalculated as:

```text
hedge_mw = hedge_mwh / calendar.total_h
```

Hedge % is recalculated as:

```text
hedge_percentage = hedge_mwh / forecast_mwh
```

The profile also stores forecast peak percentage and calendar peak hours for transaction creation:

```text
peak_hedge_mwh = hedge_mwh * forecast_peak_pct
peak_hedge_mw = peak_hedge_mwh / calendar.peak_h
```

## Transaction model

Accept creates exactly one calloff for the PeaksModern product configuration and selected portfolio. For each profile month it creates transactions for all four PeaksModern components.

Base component transactions use:

```text
mw = hedge_mwh / calendar.total_h
```

Peak component transactions use:

```text
mw = hedge_mwh * forecast_peak_pct / calendar.peak_h
```

Each transaction reads q_factor from the linked portfolio product component Q-factor value for that month, so base and peak components use their separate q-factor sets.

## Refactoring decisions

P0022 does not refactor Baseloads purchase. A small amount of equivalent lookup logic is kept package-local in `forecastHedge.ts` so this package does not broaden shared purchase abstractions prematurely.

## Test strategy

Unit tests cover feature availability, form rendering, profile generation, base and peak formulas, editable recalculation, accept behavior, transaction count, q_factor lookup and validation failures.

## Risks and uncertainty

The prototype has no persistent session storage. The accept form posts the generated/editable profile rows back as hidden/input fields, so it can create transactions without storing draft state server-side.
