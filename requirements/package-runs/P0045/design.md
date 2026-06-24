# P0045 implementation design

## Intended changes

- Add a Baseloads position report projection that compresses monthly rows into one effective Baseloads row:
  - reportable volume is signed `base.sys` volume,
  - hedge value is signed base plus signed peak value,
  - effective price is calculated as value divided by reportable base volume.
- Preserve the existing raw monthly component helper for internal calculations.
- Add a Baseloads rebalance helper that:
  - validates portfolio, period, price area and target percentage,
  - reads selected-area canonical base forecast from P0044 forecast event details,
  - reads current net Baseloads base position,
  - creates signed `base.sys` and `base.epad` compatibility transactions when delta is non-zero,
  - returns derivative names assigned at calloff time.
- Keep UI integration small by exposing the rebalance function and making generated rows visible through existing Baseloads calloff and position report paths.

## Deliberate non-refactors

- Do not change P0044 event/detail structures.
- Do not add a derivative-name column to `CustomerTransaction`; derivative naming remains a presentation/output concern.
- Do not count peak volume as reportable Baseloads volume.
- Do not use peak forecast for Baseloads rebalance targets.

## Test strategy

- Unit tests for the effective Baseloads position report price calculation.
- Unit tests for positive and negative Baseloads rebalance deltas.
- Validation tests for required target percentage and price area.
- Regression tests for existing Position Report, Forecast Hedge and Baseloads calloff behavior.
