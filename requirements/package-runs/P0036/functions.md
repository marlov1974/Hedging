# P0036 Function Design

## New functions

- `deriveClassicFromForecast`
  - Purpose: converts stored forecast `mwh` and `peak_pct` into Classic Offpeak/Peak display values.
  - Inputs: total MWh, peak percent, total hours, peak hours.
  - Outputs: Classic MWh/MW values and canonical-equivalent MW values.
  - Side effects: none.
  - Tests: Forecast and Classic conversion tests.

- `convertClassicForecastToStored`
  - Purpose: converts edited Classic Offpeak/Peak MWh into stored forecast values.
  - Inputs: Offpeak MWh, Peak MWh, total hours, peak hours.
  - Outputs: stored `mwh`, `peak_pct`, and canonical-equivalent MW values.
  - Side effects: none.
  - Tests: Forecast save tests and worked example tests.

- `convertClassicHedgeToCanonical`
  - Purpose: converts Classic hedge Offpeak/Peak MWh into canonical transaction MW values.
  - Inputs: Offpeak MWh, Peak MWh, total hours, peak hours.
  - Outputs: allocation peak MW, canonical base MW, canonical peak MW.
  - Side effects: none.
  - Tests: Hedge Forecast accept tests.

- `deriveClassicFromCanonical`
  - Purpose: reads canonical base/allocation/peak MW back into Classic Offpeak/Peak MWh.
  - Inputs: canonical base MW, allocation peak MW, canonical peak MW, total hours, peak hours.
  - Outputs: Classic values and warnings.
  - Side effects: none.
  - Tests: roundtrip and warning tests.

## Changed functions

- `getForecastRowsForYear`
  - Adds Classic display fields to forecast rows.

- `validateForecastUpdate`
  - Accepts Classic Offpeak/Peak fields when `perspective_id=classic`.

- `buildForecastHedgeProfile`
  - Builds Classic proposal rows when `perspective_id=classic`.

- `updateForecastHedgeProfileRow`
  - Accepts Classic Offpeak/Peak row inputs for Classic perspective.

- `acceptForecastHedgeProfile`
  - Accepts Classic row inputs and writes canonical rows using Peaks.Classic product configuration.

- `renderForecastFeature`
  - Renders Classic Forecast table for Classic perspective.

- `renderForecastHedgeFeature`
  - Renders Classic Hedge Forecast proposal table for Classic perspective.

## Removed functions

None.
