# P0025 Design

## Interpretation

P0025 realigns the PoC to a shared Portfolio Hedging Products canonical model. The implementation should establish the model without rewriting all product flows.

## Implementation Structure

1. Add component metadata types for category and hour basis.
2. Add canonical component helpers for aliases, category lookup, hour basis lookup and projection listener rules.
3. Update seed data to use canonical product package names and new Peaks.Modern components.
4. Update Peaks.Modern Hedge Forecast to generate:
   - `allocation.peak`
   - `base.sys`
   - `base.epad`
   - `peak.premium.sys`
   - `peak.premium.epad`
5. Add a small market projection helper that includes `base`, `peak`, `profile` categories and excludes `allocation`.
6. Update UI labels and compatibility checks to use `Peaks.Modern` while accepting legacy aliases.
7. Update focused docs and tests.

## Refactoring Decisions

- Keep deprecated aliases instead of migrating every historical reference.
- Store component category and hour basis directly on product components for this PoC.
- Do not implement full Classic/Modern projection UI or settlement redesign.
- Do not rebuild Profiles beyond reserving canonical component vocabulary and package names.

## Test Strategy

- Extend seed-data tests for product package names, component vocabulary, category metadata, price and q-factor rules.
- Extend Forecast Hedge tests for five generated monthly rows, positive/negative/flat premium formulas and allocation rows.
- Add market projection tests for category filtering and q-factor usage.
- Keep Data Viewer tests proving raw/internal rows remain visible.

## Risks and Uncertainty

- Some documentation still describes historical package names; this package updates current model docs and marks aliases where relevant.
- Current financial settlement is Baseloads-specific and remains unchanged.
