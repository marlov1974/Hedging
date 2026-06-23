# P0036 Design

## Interpretation

P0036 fills the Classic perspective inside the existing Forecast and Hedge Forecast features. Users should edit Offpeak/Peak MWh, while the canonical model remains the only persisted source of truth.

## Implementation structure

- Add a Classic conversion helper module for:
  - Classic forecast display from stored forecast values.
  - Classic UI values to stored forecast values.
  - Classic UI values to canonical hedge MW values.
  - Canonical hedge MW values back to Classic display values.
- Extend Forecast rows with Classic Offpeak/Peak values.
- Render a Classic Forecast table when `perspective_id=classic`.
- Extend forecast save handling to parse Classic Offpeak/Peak inputs for Classic perspective.
- Extend Hedge Forecast profile generation and acceptance with Classic Offpeak/Peak values.
- Use Peaks.Classic product configuration for Classic hedge acceptance.
- Keep Modern behavior unchanged.

## Test strategy

- Add conversion unit coverage for the worked example and negative canonical peak example.
- Add Forecast UI/save tests for Classic Offpeak/Peak fields.
- Add Hedge Forecast Classic proposal, scaling and accept tests.
- Keep P0029/P0030 Classic calloff projection tests passing from the canonical rows written by Classic accept.

## Risks and limits

- Classic Forecast stores back into the existing forecast table rather than a new canonical forecast transaction table. This matches the current prototype storage model.
- Classic and Modern Hedge Forecast share much of the same acceptance path, so product selection must be explicit to avoid accidentally writing Classic calloffs as Peaks.Modern.
