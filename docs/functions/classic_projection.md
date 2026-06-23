# Classic Projection Functions

## `deriveClassicFromForecast(input)`

Derives customer-facing Classic forecast values from stored forecast shape.

- Inputs: `total_mwh`, `peak_pct`, `total_h`, `peak_h`
- Outputs: Classic Offpeak/Peak MWh, Classic Offpeak/Peak MW, canonical MW equivalents and warnings
- Side effects: none
- Validation: rejects negative forecast values and invalid calendar hours

## `convertClassicForecastToStored(input)`

Converts Classic forecast form values to the stored forecast fields used by the PoC.

- Inputs: `classic_offpeak_mwh`, `classic_peak_mwh`, `total_h`, `peak_h`
- Outputs: `total_mwh` and `peak_pct` plus derived Classic/canonical values
- Side effects: none
- Validation: rejects negative customer-facing MWh values and invalid calendar hours

## `convertClassicHedgeToCanonical(input)`

Converts Classic hedge form values to canonical transaction MW values.

- Inputs: `classic_offpeak_mwh`, `classic_peak_mwh`, `total_h`, `peak_h`
- Outputs: `allocation_peak_mw`, `canonical_base_mw`, `canonical_peak_mw`, Classic display values and `total_mwh`
- Side effects: none
- Validation: rejects negative customer-facing MWh values and invalid calendar hours

## `deriveClassicFromCanonical(input)`

Projects canonical component MW values back to customer-facing Classic rows.

- Inputs: `canonical_base_mw`, `allocation_peak_mw`, `canonical_peak_mw`, `total_h`, `peak_h`, optional `tolerance`
- Outputs: Classic Offpeak/Peak MWh, Classic Offpeak/Peak MW and warnings
- Side effects: none
- Validation: rejects invalid calendar hours
