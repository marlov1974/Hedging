# P0024 implementation design

## Package interpretation

Correct PeaksModern `Hedge Forecast` so base components carry the total forecast hedge and peak.modern components carry only premium/shape volume above the flat base level.

## Implementation structure

- Update `src/hedging/forecastHedge.ts` profile row derivation.
- Keep one editable `hedge_mwh` field as the base monthly MWh.
- Rename exposed derived peak fields to modern peak semantics in code where practical.
- Keep transaction count unchanged at four rows per month.
- Update `src/hedging/HedgingToolView.ts` to show Peak %, Base MWh/Base MW and Modern Peak MWh/MW.
- Update `tests/hedging/forecastHedge.test.ts` with numeric examples, negative premium behavior, flat profile behavior, transaction MW assertions and q-factor coverage.
- Update docs under `docs/hedging/`.
- Add `docs/hedging/peaks_modern_volume_semantics.md`.
- Update `REPOSITORY_FILES.md` because tracked files are added by this package and by the pulled P0024 requirement file.

## Formula

For each profile row:

```text
base_mwh = forecast_mwh * hedge_pct
base_mw = base_mwh / total_h
modern_peak_mwh = base_mwh * (forecast_peak_pct - peak_h / total_h)
modern_peak_mw = modern_peak_mwh / peak_h
```

`modern_peak_mwh` and `modern_peak_mw` may be negative. `base_mwh` may not be negative.

## Refactoring decisions

Keep the P0022 function boundaries. Add small package-local helper functions for flat base share and modern peak premium calculation rather than introducing shared abstractions.

## Test strategy

Tests cover the P0024 numeric example, negative modern peak behavior, flat profile zero premium behavior, one-month and three-month transaction counts, component-specific transaction MW values and q-factor lookup for all four components.

## Risks and uncertainties

Existing UI labels still use Hedge MWh as the edited input; this package clarifies that it is Base MWh in the displayed table while preserving server form field names for a narrow change.
