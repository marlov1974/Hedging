# P0021 implementation design

## Interpretation

P0021 makes portfolio selection resolve an application variant. The variant controls available features, visible context and active-feature fallback. Baseloads keeps the existing feature set. PeaksModern gets a different application appearance and exposes only `Portfolio Details` and `Forecast`.

## Implementation structure

- Add `src/hedging/applicationConfig.ts` for application variant and feature resolution.
- Add `src/hedging/forecastFeature.ts` for forecast year/row lookup and forecast update validation.
- Update `src/hedging/features.ts` to delegate feature resolution to application config while preserving existing exports.
- Update `src/hedging/HedgingToolView.ts` to resolve the active feature, apply variant classes/copy, render Forecast and keep the active feature valid after portfolio changes.
- Update `src/hedging/server.ts` with a forecast save POST route.
- Add tests for app config and forecast editing.

## UI and application appearance

- Baseloads appearance keeps the existing neutral blue accent and Baseloads-specific feature set.
- PeaksModern appearance uses a different accent and context copy to show that the app variant changed.
- Shared features remain active when valid; unavailable active features fall back to the first valid feature for the selected variant.

## Forecast edit strategy

Use a single form for the selected forecast year. On save, validate and update all 12 rows for the selected portfolio/year.

Displayed `Peak %` uses percent values. Stored `peak_pct` remains decimal in the existing `0..1` convention.

## Risks and uncertainties

- Forecast editing is in-memory only because the current tool server uses an in-memory PoC database.
- PeaksModern appearance is intentionally minimal; this package avoids a broad visual redesign.
